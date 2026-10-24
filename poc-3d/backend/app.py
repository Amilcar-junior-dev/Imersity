"""Single-user reconstruction service: local macOS or optional remote NVIDIA."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
import re
import secrets
import platform
import shutil
import time

from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from .pipeline import requirements as gpu_requirements, run_job as gpu_run_job, unpack_capture, write_status, validate_capture_source
from . import macos
from fastapi.staticfiles import StaticFiles

ENGINE = os.environ.get('IMERSITY_ENGINE', 'apple-object-capture' if platform.system() == 'Darwin' else 'colmap-splatfacto')
LOCAL = os.environ.get('IMERSITY_LOCAL_MODE') == '1'

def requirements():
    return macos.requirements() if ENGINE == 'apple-object-capture' else gpu_requirements()

ROOT = Path(os.environ.get('IMERSITY_DATA_DIR', './data')).resolve()
TOKEN = os.environ.get('IMERSITY_API_TOKEN', '')
if len(TOKEN) < 24:
    raise RuntimeError('Configure IMERSITY_API_TOKEN com pelo menos 24 caracteres antes de iniciar.')
ROOT.mkdir(parents=True, exist_ok=True)
pool = ThreadPoolExecutor(max_workers=1)
MAX_UPLOAD = 400 * 1024 * 1024

@asynccontextmanager
async def lifespan(app):
    for path in ROOT.glob('*/job.json'):
        saved = json.loads(path.read_text())
        if saved.get('status') in ('queued', 'processing'):
            write_status(path.parent, status='interrupted', error='Servidor reiniciado. Reenvie a captura para uma nova execução.')
    yield
    macos.stop_all()
    pool.shutdown(wait=False, cancel_futures=True)

app = FastAPI(title='Imersity Reconstruction POC', lifespan=lifespan, docs_url=None, redoc_url=None)

@app.middleware('http')
async def authentication(request: Request, call_next):
    if LOCAL:
        if request.url.hostname not in ('127.0.0.1', 'localhost'):
            return JSONResponse({'detail': 'Host local inválido.'}, status_code=403)
    api = request.url.path == '/health' or request.url.path == '/jobs' or request.url.path.startswith('/jobs/')
    if request.method != 'OPTIONS' and (api or not LOCAL):
        if not secrets.compare_digest(request.headers.get('authorization', ''), f'Bearer {TOKEN}'):
            return JSONResponse({'detail': 'Token de acesso inválido.'}, status_code=401)
    length = request.headers.get('content-length')
    try:
        if length and int(length) > MAX_UPLOAD + 1024 * 1024:
            return JSONResponse({'detail': 'Limite de upload: 400 MB.'}, status_code=413)
    except ValueError:
        return JSONResponse({'detail': 'Content-Length inválido.'}, status_code=400)
    return await call_next(request)

default_origins = ','.join(f'http://{host}:{port}' for host in ('127.0.0.1', 'localhost') for port in (5173, *range(4180, 4190)))
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in os.environ.get('IMERSITY_ALLOWED_ORIGINS', default_origins).split(',') if s.strip()], allow_credentials=False, allow_methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Authorization', 'Content-Type'])

@app.get('/local-session')
def local_session(request: Request):
    if not LOCAL or request.headers.get('sec-fetch-site') not in (None, 'same-origin', 'none'):
        raise HTTPException(403, 'Sessão disponível somente pela aplicação local.')
    origin = request.headers.get('origin')
    if origin and origin != str(request.base_url).rstrip('/'):
        raise HTTPException(403, 'Origem inválida.')
    return JSONResponse({'token': TOKEN}, headers={'Cache-Control': 'no-store'})

@app.get('/health')
def health():
    return requirements()

def preflight(detail, base_cut):
    try:
        macos.validate_options(detail, base_cut)
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    if ENGINE != 'apple-object-capture' and detail in ('custom', 'head-custom', 'recovery', 'person-recovery', 'person-head'):
        raise HTTPException(400, 'Teste de geometria disponível no Apple Object Capture.')
    check = requirements()
    if not check['ready']:
        raise HTTPException(503, 'Requisitos indisponíveis: ' + ', '.join(check['missing']))
    pending = sum(json.loads(p.read_text()).get('status') in ('queued', 'processing') for p in ROOT.glob('*/job.json'))
    if pending >= 3:
        raise HTTPException(429, 'A fila já contém três trabalhos. Aguarde a conclusão.')

def queue_job(directory, counts, detail, base_cut, **metadata):
    write_status(directory, id=directory.name, status='queued', stage='queued', counts=counts, engine=ENGINE, detail=detail, baseCut=base_cut if detail in macos.HEAD_PROFILES else None, createdAt=time.time(), **metadata)
    if ENGINE == 'apple-object-capture':
        pool.submit(macos.run_job, directory, detail, base_cut)
    else:
        iterations = max(1000, min(30000, int(os.environ.get('IMERSITY_ITERATIONS', '7000'))))
        pool.submit(gpu_run_job, directory, iterations)
    return {'id': directory.name, 'status': 'queued', 'counts': counts}

@app.get('/jobs')
def saved_captures():
    captures = []
    for path in ROOT.glob('*/job.json'):
        saved = json.loads(path.read_text())
        manifest_path = path.parent / 'capture' / 'capture.json'
        if not re.fullmatch(r'[0-9a-f]{32}', path.parent.name) or not manifest_path.is_file(): continue
        manifest = json.loads(manifest_path.read_text())
        images = manifest.get('images', [])
        first = next((i for i in images if i.get('role') != 'evaluation'), {})
        try:
            validate_capture_source(images)
            mixed = False
        except ValueError:
            mixed = True
        captures.append({k: saved.get(k) for k in ('id', 'status', 'detail', 'createdAt', 'counts')} | {'width': first.get('width'), 'height': first.get('height'), 'sourceName': first.get('sourceVideo') or manifest.get('name') or 'Captura salva', 'mixedSources': mixed})
    return sorted(captures, key=lambda c: c.get('createdAt') or 0, reverse=True)

@app.post('/jobs/{job_id}/repeat', status_code=202)
def repeat_job(job_id: str, detail: str = 'custom', base_cut: float = .30):
    source = job_directory(job_id)
    saved = json.loads((source / 'job.json').read_text())
    if saved.get('status') in ('queued', 'processing'):
        raise HTTPException(409, 'A captura de origem ainda está em processamento.')
    try:
        manifest = json.loads((source / 'capture' / 'capture.json').read_text())
        validate_capture_source(manifest.get('images', []))
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    preflight(detail, base_cut)
    if not (source / 'capture' / 'train').is_dir():
        raise HTTPException(404, 'Quadros da captura não estão mais disponíveis.')
    directory = ROOT / secrets.token_hex(16)
    try:
        directory.mkdir()
        # Copy original prepared images, without recompression, to preserve the comparison.
        shutil.copytree(source / 'capture', directory / 'capture')
        return queue_job(directory, saved.get('counts', {}), detail, base_cut, sourceJob=job_id)
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        raise

@app.post('/jobs', status_code=202)
async def create_job(capture: UploadFile = File(...), detail: str = 'reduced', base_cut: float = .30):
    preflight(detail, base_cut)
    job_id = secrets.token_hex(16)
    directory = ROOT / job_id
    directory.mkdir()
    archive = directory / 'capture.zip'
    total = 0
    try:
        with archive.open('wb') as output:
            while chunk := await capture.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_UPLOAD:
                    raise HTTPException(413, 'Limite de upload: 400 MB.')
                output.write(chunk)
        import asyncio
        counts = await asyncio.to_thread(unpack_capture, archive, directory / 'capture')
    except Exception as error:
        shutil.rmtree(directory)
        if isinstance(error, HTTPException):
            raise
        raise HTTPException(400, str(error)) from error
    finally:
        await capture.close()
    return queue_job(directory, counts, detail, base_cut)

def job_directory(job_id: str) -> Path:
    if not re.fullmatch(r'[0-9a-f]{32}', job_id):
        raise HTTPException(404, 'Trabalho não encontrado.')
    directory = ROOT / job_id
    if not (directory / 'job.json').is_file():
        raise HTTPException(404, 'Trabalho não encontrado.')
    return directory

@app.get('/jobs/{job_id}')
def get_job(job_id: str):
    directory = job_directory(job_id)
    result = json.loads((directory / 'job.json').read_text())
    path = directory / 'pipeline.log'
    if path.exists():
        with path.open('rb') as log:
            log.seek(max(0, path.stat().st_size - 16000))
            result['log'] = log.read().decode('utf-8', errors='replace')
    return result

@app.get('/jobs/{job_id}/result')
def job_result(job_id: str):
    directory = job_directory(job_id)
    if json.loads((directory / 'job.json').read_text()).get('status') != 'completed':
        raise HTTPException(409, 'O modelo ainda não está pronto.')
    job = json.loads((directory / 'job.json').read_text())
    name = 'head.usdz' if job.get('engine') == 'apple-object-capture' else 'splat.ply'
    return FileResponse(directory / 'result' / name, media_type='model/vnd.usdz+zip' if name.endswith('.usdz') else 'application/octet-stream', filename=name)

if LOCAL:
    app.mount('/', StaticFiles(directory=str(Path(__file__).resolve().parent.parent / 'web' / 'dist'), html=True), name='web')
