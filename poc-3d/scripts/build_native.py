"""Build the small RealityKit bridge using the installed Apple toolchain."""
from pathlib import Path
import platform
import subprocess

ROOT = Path(__file__).resolve().parent.parent

def build():
    if platform.system() != 'Darwin':
        raise RuntimeError('O modo local requer macOS em um Mac compatível com Object Capture.')
    source = ROOT / 'native' / 'ObjectCapture.swift'
    executable = ROOT / '.tools' / 'imersity-object-capture'
    if not executable.exists() or source.stat().st_mtime > executable.stat().st_mtime:
        executable.parent.mkdir(exist_ok=True)
        print('Preparando o reconstrutor nativo da Apple…', flush=True)
        subprocess.run(['xcrun', 'swiftc', '-parse-as-library', '-O', '-module-cache-path', str(ROOT / '.tools' / 'swift-cache'), str(source), '-o', str(executable)], check=True)
    return executable

if __name__ == '__main__': build()
