"""Independently check the saved side-groom GLB and its preserved source."""
from pathlib import Path
import argparse,json,hashlib
import numpy as np
from prepare_generated_hair import read_glb,accessor


def verify(source,target):
    sd,sb=read_glb(source);d,b=read_glb(target)
    assert b[:len(sb)]==sb and d['accessors'][:len(sd['accessors'])]==sd['accessors']
    info=lambda n:n.get('extras',{}).get('imersity',{})
    groups=[n for n in d['nodes'] if info(n).get('style') in ['side_flat','side_volume']]
    assert len(groups)==2
    meshes=[];bindings=[];hair_counts=[]
    for group in groups:
        root,body=[d['nodes'][i] for i in group['children']];meshes.append(root['mesh']);bindings.append(info(group)['rootBindings'])
        rp=d['meshes'][root['mesh']]['primitives'][0];bp=d['meshes'][body['mesh']]['primitives'][0]
        r=accessor(d,b,rp['attributes']['POSITION']);q=accessor(d,b,bp['attributes']['POSITION']);ru=accessor(d,b,rp['attributes']['TEXCOORD_0']);qu=accessor(d,b,bp['attributes']['TEXCOORD_0'])
        for i,bind in enumerate(bindings[-1]):
            assert bind['firstVertex']==i*8
            np.testing.assert_array_equal(r[i*8+6:i*8+8],q[i*44:i*44+2]);np.testing.assert_array_equal(ru[i*8+6:i*8+8],qu[i*44:i*44+2])
        triangles=0
        for pr in [rp,bp]:
            p=accessor(d,b,pr['attributes']['POSITION']);n=accessor(d,b,pr['attributes']['NORMAL']);f=accessor(d,b,pr['indices']).reshape(-1,3);triangles+=len(f)
            assert np.isfinite(p).all() and int(f.max())<len(p)
            np.testing.assert_allclose(np.linalg.norm(n,axis=1),1,atol=1e-6)
            tri=p[f];cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
            assert (np.linalg.norm(cross,axis=1)>1e-12).all() and ((cross*n[f].mean(1)).sum(1)>=-1e-10).all()
        hair_counts.append(triangles)
    assert len(set(meshes))==1 and bindings[0]==bindings[1]
    scalp=d['nodes'][info(groups[0])['scalpNode']];pr=d['meshes'][scalp['mesh']]['primitives'][0];p=accessor(d,b,pr['attributes']['POSITION']);f=accessor(d,b,pr['indices']).reshape(-1,3)
    for bind in bindings[0]:np.testing.assert_allclose(np.array(bind['barycentric'])@p[f[bind['triangle']]],bind['root'],atol=1e-8)
    head_triangles=0
    for node in d['nodes']:
        if info(node).get('role') in ['observed-face','estimated-scalp']:
            for pr in d['meshes'][node['mesh']]['primitives']:
                head_triangles+=(d['accessors'][pr['indices']]['count'] if 'indices' in pr else d['accessors'][pr['attributes']['POSITION']]['count'])//3
    report={'outputSHA256':hashlib.sha256(target.read_bytes()).hexdigest(),'originalBufferAndAccessorsIdentical':True,'sharedRootMeshVerified':True,'boundRootCards':len(bindings[0]),'rootBodyPositionsAndUVsIdentical':True,'bindingsReconstructed':True,'finiteUnitNormalsAndValidWinding':True,'nonDegenerateTriangles':True,'headTriangles':head_triangles,'hairTrianglesPerStyle':hair_counts,'visibleTriangles':head_triangles+hair_counts[0],'globalCollisionProof':False}
    target.with_name(target.stem+'_verificacao.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--target',type=Path,required=True);a=p.parse_args();verify(a.source,a.target)
