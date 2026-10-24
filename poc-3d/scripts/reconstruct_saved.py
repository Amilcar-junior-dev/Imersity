"""Run a distinct local reconstruction from a saved, single-source capture.

Does not alter input images, previous models or the running web service. Launch
from the macOS Terminal when the agent process has no Metal device access.
"""
import argparse
import hashlib
import json
from pathlib import Path
import secrets
import shutil
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend import macos
from backend.pipeline import validate_capture_source, write_status


def hashes(directory):
    return {str(p.relative_to(directory)):hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(directory.rglob('*')) if p.is_file()}


def repeat(source_id, profile):
    if len(source_id) != 32 or any(c not in '0123456789abcdef' for c in source_id):
        raise ValueError('Invalid source job identifier.')
    macos.validate_options(profile, .30)
    source = ROOT/'data'/source_id
    saved = json.loads((source/'job.json').read_text())
    if saved.get('status') in ('queued', 'processing'):
        raise ValueError('Source reconstruction is still running.')
    manifest = json.loads((source/'capture/capture.json').read_text())
    validate_capture_source(manifest.get('images', []))
    reference = hashes(source/'capture')
    destination = ROOT/'data'/secrets.token_hex(16)
    destination.mkdir()
    shutil.copytree(source/'capture', destination/'capture')
    if hashes(destination/'capture') != reference:
        raise RuntimeError('Copied capture does not match the original.')
    counts = {role:sum(i.get('role') == role for i in manifest['images']) for role in ('train','evaluation')}
    write_status(destination, id=destination.name, status='queued', stage='queued', engine='apple-object-capture',
                 detail=profile, baseCut=.30 if profile in macos.HEAD_PROFILES else None,
                 sourceJob=source_id, counts=counts, createdAt=time.time(),
                 inputBytesVerified=True, experimental=True)
    print(json.dumps({'id':destination.name,'sourceJob':source_id,'detail':profile,'counts':counts}), flush=True)
    macos.run_job(destination, profile)
    write_status(destination, sourceCaptureUnchanged=hashes(source/'capture') == reference)
    print((destination/'job.json').read_text(), flush=True)
    return json.loads((destination/'job.json').read_text())['status'] == 'completed'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-job', required=True)
    parser.add_argument('--profile', choices=macos.DETAIL_PROFILES, default='recovery')
    args = parser.parse_args()
    sys.exit(0 if repeat(args.source_job,args.profile) else 1)
