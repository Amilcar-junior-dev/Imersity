"""Real COLMAP / Nerfstudio pipeline. No generated or simulated success results."""
from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import time
import zipfile

MAX_IMAGES = 200
MAX_UNPACKED = 800 * 1024 * 1024
MAX_IMAGE_BYTES = 20 * 1024 * 1024
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def requirements() -> dict:
    missing = [cmd for cmd in ('colmap', 'ffmpeg', 'ns-process-data', 'ns-train', 'ns-export') if not shutil.which(cmd)]
    device = ''
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=name', '--format=csv,noheader'], capture_output=True, text=True, timeout=10)
        if result.returncode:
            missing.append('GPU NVIDIA acessível')
        else:
            device = result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        missing.append('nvidia-smi / GPU NVIDIA')
    return {'ready': not missing, 'missing': missing, 'device': device, 'pipeline': 'colmap-splatfacto'}


def unpack_capture(archive: Path, destination: Path, minimum_training: int = 20) -> dict:
    """Only validated, manifest-listed images are copied; evaluation stays isolated."""
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = 60_000_000
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > MAX_IMAGES + 10 or sum(e.file_size for e in entries) > MAX_UNPACKED:
            raise ValueError('Pacote excede os limites de imagens ou tamanho descompactado.')
        names = [e.filename for e in entries]
        if len(names) != len(set(names)):
            raise ValueError('Pacote contém arquivos duplicados.')
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in entry.filename or (entry.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError('Caminho não permitido no pacote.')
        if 'capture.json' not in names or bundle.getinfo('capture.json').file_size > 1024 * 1024:
            raise ValueError('capture.json ausente ou inválido.')
        manifest = json.loads(bundle.read('capture.json'))
        images = manifest.get('images')
        if manifest.get('schema') != 'imersity.capture.v1' or not isinstance(images, list) or not images or len(images) > MAX_IMAGES:
            raise ValueError('Manifesto de captura incompatível.')
        listed = [item.get('path') for item in images if isinstance(item, dict)]
        if len(listed) != len(images) or len(set(listed)) != len(images):
            raise ValueError('Lista de imagens inválida ou duplicada.')
        counts = {'train': 0, 'evaluation': 0}
        for item in images:
            role, name = item.get('role'), item.get('path')
            if role not in counts or not isinstance(name, str) or PurePosixPath(name).parent != PurePosixPath('images') or Path(name).suffix.lower() not in IMAGE_EXTENSIONS:
                raise ValueError('Imagem ou função não permitida no manifesto.')
            if name not in names or bundle.getinfo(name).file_size > MAX_IMAGE_BYTES:
                raise ValueError('Imagem ausente ou maior que 20 MB.')
            counts[role] += 1
        if counts['train'] < minimum_training:
            raise ValueError(f'Envie pelo menos {minimum_training} imagens de treinamento.')
        for folder in ('train', 'evaluation'):
            (destination / folder).mkdir(parents=True, exist_ok=True)
        from io import BytesIO
        for index, item in enumerate(images):
            data = bundle.read(item['path'])
            try:
                with Image.open(BytesIO(data)) as image:
                    image.verify()
                with Image.open(BytesIO(data)) as image:
                    if image.width < 128 or image.height < 128:
                        raise ValueError('Imagem pequena demais.')
                    ImageOps.exif_transpose(image).convert('RGB').save(destination / item['role'] / f'frame_{index:05d}.jpg', quality=97)
            except Exception as error:
                raise ValueError(f'Arquivo de imagem inválido: {item["path"]}') from error
        (destination / 'capture.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
        return counts


def commands(job_dir: Path, iterations: int = 7000) -> list[list[str]]:
    data = str(job_dir / 'processed')
    return [
        ['ns-process-data', 'images', '--data', str(job_dir / 'capture' / 'train'), '--output-dir', data, '--matching-method', 'exhaustive', '--num-downscales', '2'],
        ['ns-train', 'splatfacto', '--data', data, '--output-dir', str(job_dir / 'outputs'), '--experiment-name', 'imersity', '--max-num-iterations', str(iterations), '--vis', 'tensorboard', '--viewer.quit-on-train-completion', 'True', 'nerfstudio-data', '--eval-mode', 'all'],
    ]


def write_status(directory: Path, **changes):
    path = directory / 'job.json'
    current = json.loads(path.read_text()) if path.exists() else {}
    current.update(changes, updatedAt=time.time())
    temporary = directory / 'job.tmp'
    temporary.write_text(json.dumps(current, ensure_ascii=False, indent=2))
    os.replace(temporary, path)


def execute(command: list[str], log, timeout: int):
    log.write('\n$ ' + ' '.join(command) + '\n')
    log.flush()
    result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=timeout, env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen', 'PYTHONUNBUFFERED': '1'})
    if result.returncode:
        raise RuntimeError(f'{command[0]} terminou com código {result.returncode}. Confira os logs.')


def run_job(directory: Path, iterations=7000):
    started = time.time()
    log_path = directory / 'pipeline.log'
    try:
        write_status(directory, status='processing', stage='preflight')
        check = requirements()
        if not check['ready']:
            raise RuntimeError('Requisitos indisponíveis: ' + ', '.join(check['missing']))
        with log_path.open('a', buffering=1) as log:
            log.write('Capturas de avaliação ficam isoladas e não entram no COLMAP nem no treinamento.\n')
            for stage, command in zip(('camera-reconstruction', 'gaussian-training'), commands(directory, iterations)):
                write_status(directory, stage=stage)
                execute(command, log, timeout=4 * 60 * 60)
            configs = sorted((directory / 'outputs').rglob('config.yml'), key=lambda p: p.stat().st_mtime)
            if not configs:
                raise RuntimeError('O treinamento não gerou config.yml.')
            write_status(directory, stage='export')
            execute(['ns-export', 'gaussian-splat', '--load-config', str(configs[-1]), '--output-dir', str(directory / 'result')], log, timeout=1800)
            result = directory / 'result' / 'splat.ply'
            if not result.is_file() or result.stat().st_size < 1024:
                raise RuntimeError('A exportação não produziu um arquivo splat.ply válido.')
        write_status(directory, status='completed', stage='finished', durationSeconds=time.time() - started, resultBytes=result.stat().st_size)
    except Exception as error:
        with log_path.open('a') as log:
            log.write(f'\nERRO: {error}\n')
        write_status(directory, status='failed', stage='failed', error=str(error), durationSeconds=time.time() - started)
