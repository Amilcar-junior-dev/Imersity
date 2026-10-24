"""Start the local browser UI and Apple reconstruction service on loopback."""
import os
from pathlib import Path
import secrets
import socket
import threading
import time
import urllib.request
import webbrowser
from build_native import build

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
if not (ROOT / 'web' / 'dist' / 'index.html').exists():
    raise SystemExit('Versão pronta não encontrada. Execute npm run build dentro da pasta web.')
try:
    build()
except (OSError, RuntimeError) as error:
    raise SystemExit(f'Não foi possível preparar o Object Capture: {error}\nInstale as ferramentas do Xcode e tente novamente.')
import sys
sys.path.insert(0, str(ROOT))
import uvicorn

server_socket = None
for port in range(4180, 4190):
    candidate = socket.socket()
    try:
        candidate.bind(('127.0.0.1', port)); candidate.listen(128)
        server_socket = candidate; break
    except OSError:
        candidate.close()
if server_socket is None:
    raise SystemExit('As portas locais 4180–4189 estão ocupadas.')
os.environ.update(IMERSITY_LOCAL_MODE='1', IMERSITY_ENGINE='apple-object-capture', IMERSITY_API_TOKEN=secrets.token_urlsafe(32), IMERSITY_DATA_DIR=str(ROOT / 'data'))
url = f'http://localhost:{port}'
print(f'\nImersity Lab: {url}\nCapturas e reconstrução ficam neste Mac.\nMantenha esta janela aberta. Ctrl+C encerra o laboratório.\n', flush=True)

def open_when_ready():
    for _ in range(60):
        try:
            with urllib.request.urlopen(url, timeout=1): pass
            webbrowser.open(url)
            return
        except OSError:
            time.sleep(.5)

threading.Thread(target=open_when_ready, daemon=True).start()
try:
    uvicorn.Server(uvicorn.Config('backend.app:app', host='127.0.0.1', port=port, workers=1)).run(sockets=[server_socket])
finally:
    server_socket.close()
