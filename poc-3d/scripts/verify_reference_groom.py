"""Verify the produced asset independently of rendering, not its realism."""
from pathlib import Path
import argparse,hashlib,json
import numpy as np
from prepare_generated_hair import read_glb,accessor
from prepare_reference_groom import read_curves,SOURCE_CENTER,CENTER

def verify(base,asset_dir,output):
    d,b=read_glb(output);bd,bb=read_glb(base)
    assert b[:len(bb)]==bb and d['accessors'][:len(bd['accessors'])]==bd['accessors']
    owner=next(n for n in d['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'))
    trial=owner['extras']['imersity']['headPreparation']['referenceGroomTrial']
    curves=read_curves(asset_dir/'sintel.tfx');errors=[]
    scalp=next(n for n in d['nodes'] if n.get('name')=='EstimatedScalp');prim=d['meshes'][scalp['mesh']]['primitives'][0]
    sp=accessor(d,b,prim['attributes']['POSITION']);sf=accessor(d,b,prim['indices']).reshape(-1,3)
    found=set()
    for n in d['nodes']:
        if n.get('name') not in ['reference_original','reference_fit']:continue
        found.add(n['name']);hair=d['nodes'][n['children'][0]];p=d['meshes'][hair['mesh']]['primitives'][0]
        centres=accessor(d,b,p['attributes']['_CENTER']).reshape(11400,16,2,3)[:,:,0]
        assert np.isfinite(centres).all()
        if n['name']=='reference_original':np.testing.assert_allclose(centres,(curves-SOURCE_CENTER)*1.9+CENTER,atol=1e-7)
        else:
            assert len(trial['rootBindings'])==11400
            for k,bind in enumerate(trial['rootBindings']):
                weights=np.array(bind['barycentric']);assert abs(weights.sum()-1)<1e-8 and (weights>=-1e-8).all()
                q=weights@sp[sf[bind['triangle']]];np.testing.assert_allclose(q,bind['root'],atol=1e-8)
                errors.append(abs(np.linalg.norm(centres[k,0]-q)-trial['rootLift']))
        assert len(accessor(d,b,p['indices']))//3==342000
    assert found=={'reference_original','reference_fit'} and max(errors)<1e-7
    report={'baseBufferAndAccessorsPreserved':True,'sourceControlCurvesPreserved':True,'boundRootsVerified':11400,'maxRootLiftErrorNative':float(max(errors)),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'fileMiB':round(output.stat().st_size/1024**2,1),'verifiesRealism':False}
    output.with_name(output.stem+'_verificacao.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--base',type=Path,required=True);a.add_argument('--asset-dir',type=Path,required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();verify(v.base,v.asset_dir,v.output)
