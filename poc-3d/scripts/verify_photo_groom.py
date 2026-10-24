"""Check saved guided-hair geometry, embedded reference and preserved source."""
from pathlib import Path
import argparse,json,hashlib,base64
import numpy as np
from prepare_generated_hair import read_glb,accessor

def verify(source,target):
    sd,sb=read_glb(source);d,b=read_glb(target)
    assert b[:len(sb)]==sb and d['accessors'][:len(sd['accessors'])]==sd['accessors']
    node=next(n for n in d['nodes'] if n.get('extras',{}).get('imersity',{}).get('style')=='photo_front');m=node['extras']['imersity'];pr=d['meshes'][node['mesh']]['primitives'][0]
    p=accessor(d,b,pr['attributes']['POSITION']);n=accessor(d,b,pr['attributes']['NORMAL']);f=accessor(d,b,pr['indices']).reshape(-1,3)
    assert np.isfinite(p).all() and int(f.max())<len(p);np.testing.assert_allclose(np.linalg.norm(n,axis=1),1,atol=1e-6)
    tri=p[f];cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);assert (np.linalg.norm(cross,axis=1)>1e-12).all() and ((cross*n[f].mean(1)).sum(1)>-1e-10).all()
    scalp=d['nodes'][m['scalpNode']];spr=d['meshes'][scalp['mesh']]['primitives'][0];sp=accessor(d,b,spr['attributes']['POSITION']);sf=accessor(d,b,spr['indices']).reshape(-1,3)
    maximum=0
    for bind in m['rootBindings']:
        assert bind['firstVertex']%50==0
        root=np.array(bind['barycentric'])@sp[sf[bind['triangle']]];np.testing.assert_allclose(root,bind['root'],atol=1e-8)
        center=p[bind['firstVertex']:bind['firstVertex']+2].mean(0);error=abs(np.linalg.norm(center-root)-.00045);maximum=max(maximum,float(error));assert error<2e-7
    owner=next(n for n in d['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'));trial=owner['extras']['imersity']['headPreparation']['photoGroomTrial']
    assert hashlib.sha256(base64.b64decode(trial['referenceDataURL'].split(',')[1])).hexdigest()==trial['sourcePhotoSHA256']
    report={'outputSHA256':hashlib.sha256(target.read_bytes()).hexdigest(),'capturedHeadBufferAndAccessorsIdentical':True,'rootBindingsVerified':len(m['rootBindings']),'rootLiftVerified':True,'maximumRootLiftFloat32ErrorNative':maximum,'embeddedOriginalPhotoSHA256Verified':True,'finiteUnitNormalsAndValidTriangles':True,'hairTriangles':len(f),'visibleTriangles':118542+len(f),'learnedModelTrained':False,'automaticImageToHairValidated':False,'globalCollisionProof':False}
    target.with_name(target.stem+'_verificacao.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--target',type=Path,required=True);v=a.parse_args();verify(v.source,v.target)
