"""Local, profile-guided cleanup with a separate, explicitly estimated rear support.

Usage: python scripts/clean_capture.py --source head.usdz --profile private.json
       --output-dir private-artifacts/
Requires NumPy, Pillow and Apple's usdcat. Does not upload or publish anything.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from prepare_head_base import read_source
from headprep.cleanup import select_faces, posterior_support
from headprep.gltf import GLB, linear_hex


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(source, profile_path, output_dir):
    profile = json.loads(profile_path.read_text())
    source_hash = digest(source)
    if source_hash != profile['sourceSHA256']:
        raise ValueError('Profile belongs to a different capture; review the annotations.')
    points, faces, uvs, normals, texture, image = read_source(source)
    keep, protected, bright = select_faces(points, faces, uvs, image, profile)
    # No resampling, smoothing, decimation or displacement of observed geometry.
    observed_points = points[faces[keep]].reshape(-1, 3)
    observed_normals = normals[faces[keep]].reshape(-1, 3)
    observed_uvs = uvs[keep].reshape(-1, 2).copy()
    observed_uvs[:, 1] = 1-observed_uvs[:, 1]
    support = posterior_support(**profile['posteriorSupport'])
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {
        'schema': 'imersity.capture-cleanup.v1',
        'sourceSHA256': source_hash,
        'subjectSpecific': True,
        'automaticHairSegmentation': False,
        'observedInputTriangles': len(faces),
        'observedRetainedTriangles': int(keep.sum()),
        'removedTriangles': int((~keep).sum()),
        'protectedTriangles': int(protected.sum()),
        'protectedTrianglesRetained': bool(keep[protected].all()),
        'observedGeometryNormalsAndUVPreserved': True,
        'textureSHA256': hashlib.sha256(texture).hexdigest(),
        'estimatedSupportTriangles': len(support[1]),
        'metricValidated': False,
        'watertight': False,
        'limitations': [
            'Profile reviewed for this capture only; not automatic segmentation.',
            'Rear support is an estimated half ellipsoid, not reconstructed anatomy or hair.',
            'Support is separate, not welded to the scan; gaps and intersections need visual review.',
            'No ear/scalp anatomy can be recovered where the original capture has no surface.',
        ],
        'artifacts': [],
    }
    for estimated, name in [(False, 'cabeca_recortada.glb'), (True, 'cabeca_apoio_estimado.glb')]:
        glb = GLB()
        glb.document['nodes'].append({'name':'CaptureCleanup', 'children':[], 'extras':{'imersity':{
            'method':'assisted-capture-cleanup', 'metricValidated':False,
            'estimatedPosteriorSupport':estimated, 'requiresReview':True, 'sourceSHA256':source_hash,
        }}})
        view = glb.blob(texture)
        glb.document['images'] = [{'bufferView':view, 'mimeType':'image/png'}]
        glb.document['textures'] = [{'source':0}]
        glb.document['materials'] = [
            {'name':'CapturedColorUnlit', 'doubleSided':True,
             'pbrMetallicRoughness':{'baseColorTexture':{'index':0}, 'metallicFactor':0, 'roughnessFactor':.95},
             'extensions':{'KHR_materials_unlit':{}}},
            {'name':'ESTIMADO_ApoioPosterior_Diagnostico', 'doubleSided':True,
             'pbrMetallicRoughness':{'baseColorFactor':linear_hex('e99839'), 'metallicFactor':0, 'roughnessFactor':1},
             'extensions':{'KHR_materials_unlit':{}}},
        ]
        children = glb.document['nodes'][0]['children']
        children.append(glb.mesh('CapturaOriginal_Recortada', observed_points, observed_normals, 0,
                                 uvs=observed_uvs, metadata={'role':'observed-capture', 'estimated':False}))
        if estimated:
            children.append(glb.mesh('ESTIMADO_ApoioPosterior_NaoReconstruido', support[0], support[2], 1,
                                     faces=support[1], metadata={'role':'estimated-posterior-support', 'estimated':True, 'stitched':False}))
        output = output_dir/name
        glb.write(output)
        report['artifacts'].append({'file':name, 'estimatedSupport':estimated, 'bytes':output.stat().st_size, 'sha256':digest(output)})
    if digest(source) != source_hash:
        raise ValueError('Original file changed during preparation.')
    report['sourceUnchanged'] = True
    (output_dir/'verificacao.json').write_text(json.dumps(report, indent=2, ensure_ascii=False))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--profile', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.source, args.profile, args.output_dir), ensure_ascii=False, indent=2))
