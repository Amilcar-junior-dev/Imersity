"""Verify preservation and supplemental root bindings, not photorealism."""
from pathlib import Path
import argparse,hashlib,json
import numpy as np
from prepare_generated_hair import read_glb,accessor
from refine_reference_roots import surface_data,root_region,FrontSurface

def verify(source,output):
    d,b=read_glb(output);sd,sb=read_glb(source)
    assert b[:len(sb)]==sb and d['accessors'][:len(sd['accessors'])]==sd['accessors']
    group=next(n for n in d['nodes'] if n.get('name')=='reference_fit')
    oldgroup=next(n for n in sd['nodes'] if n.get('name')=='reference_fit')
    assert d['nodes'][group['children'][0]]['mesh']==sd['nodes'][oldgroup['children'][0]]['mesh']
    rootnode=next(n for n in d['nodes'] if n.get('name')=='SintelShortRootTransition')
    prim=d['meshes'][rootnode['mesh']]['primitives'][0]
    centres=accessor(d,b,prim['attributes']['_CENTER']).reshape(-1,16,2,3)[:,:,0]
    assert np.isfinite(centres).all()
    owner=next(n for n in d['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'))
    info=owner['extras']['imersity']['headPreparation']['referenceGroomTrial']['rootRefinement']
    binds=info['rootBindings'];assert len(binds)==len(centres)==info['supplementalFibres']
    errors=[];surfaces={};regions=[]
    for i,bind in enumerate(binds):
        node=bind['node']
        if node not in surfaces:surfaces[node]=surface_data(d,b,node)
        p,n,f=surfaces[node];weights=np.array(bind['barycentric']);assert abs(weights.sum()-1)<1e-8 and (weights>=0).all()
        q=weights@p[f[bind['triangle']]];np.testing.assert_allclose(q,bind['root'],atol=1e-8)
        errors.append(abs(np.linalg.norm(centres[i,0]-q)-bind['lift']));regions.append(root_region(q))
    assert max(errors)<1e-7 and all(regions)
    envelope=FrontSurface(d,b);clearances=[]
    for p in centres[centres[:,0,2]>=.015,1:].reshape(-1,3):
        z=envelope.height(p)
        if z is not None:clearances.append(p[2]-z)
    # Float32 XY rounding slightly changes barycentric Z on steep triangles.
    assert min(clearances)>.000498
    back=centres[centres[:,0,2]<.015,1:].reshape(-1,3)
    back=back[back[:,1]>1.065]
    ellipsoid_radius=np.linalg.norm((back-np.array([.035,.90,-.025]))/np.array([.16,.225,.18]),axis=1)
    assert ellipsoid_radius.min()>1.00298
    report={'sourceFileSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceBinaryAndAccessorsPreserved':True,'importedBodyMeshReused':True,'supplementalRootsVerified':len(binds),'maxRootLiftErrorNative':float(max(errors)),'rootRegionRespected':True,'bodySamplesWithFrontClearanceVerified':len(clearances),'minFrontSampleClearanceNative':float(min(clearances)),'backCrownSamplesOutsideEstimatedEllipsoid':len(back),'minimumBackEllipsoidRadius':float(ellipsoid_radius.min()),'verifiesPhotorealism':False,'guaranteesAllSegmentCollisions':False}
    output.with_name(output.stem+'_verificacao.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();verify(v.source,v.output)
