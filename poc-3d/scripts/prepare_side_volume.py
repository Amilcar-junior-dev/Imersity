"""Prepare a partial layered side groom without changing captured head data."""
from pathlib import Path
import argparse,copy,hashlib,json,io
from PIL import Image
import numpy as np
from headprep.gltf import GLB
from headprep.hairline import strand_atlas,SurfaceProjector
from headprep.side_volume import make_side_volume
from prepare_generated_hair import read_glb,accessor
BASE_SHA='0fc5a16643fe8580c9f708249f1606f800db0d743ef2dbaaec634f662317f468'

def prepare(source,output):
    raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE_SHA
    doc,binary=read_glb(source);w=GLB();w.document=copy.deepcopy(doc);w.binary=bytearray(binary)
    scalp=next(i for i,n in enumerate(doc['nodes']) if n.get('name')=='EstimatedScalp')
    prim=doc['meshes'][doc['nodes'][scalp]['mesh']]['primitives'][0]
    p,n=[accessor(doc,binary,prim['attributes'][k]).astype(float) for k in ['POSITION','NORMAL']];f=accessor(doc,binary,prim['indices']).reshape(-1,3).astype(int)
    roots,flat,volume,bindings=make_side_volume(p,f,n)
    for bind in bindings:np.testing.assert_allclose(np.array(bind['barycentric'])@p[f[bind['triangle']]],bind['root'],atol=1e-9)
    texture,rgba=strand_atlas(seed=114,continuous=True)
    # Procedural fiber color variation, not photographic skin completion or
    # baked illumination. Empty texels carry the same local RGB for filtering.
    yy,xx=np.indices(rgba.shape[:2]);variation=np.clip(.91+.17*np.sin(xx*.69+.9*np.sin(yy*.014))+.06*np.cos(xx*.19),.68,1.15)
    rgba[:,:,:3]=np.clip(rgba[:,:,:3].astype(float)*variation[:,:,None],0,255).astype(np.uint8)
    stream=io.BytesIO();Image.fromarray(rgba).save(stream,format='PNG');texture=stream.getvalue()
    image=len(w.document['images']);w.document['images'].append({'bufferView':w.blob(texture),'mimeType':'image/png','name':'LayeredSideFiberCoverage'})
    tex=len(w.document['textures']);w.document['textures'].append({'source':image,'sampler':len(w.document['samplers'])});w.document['samplers'].append({'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071})
    mat=len(w.document['materials']);w.document['materials'].append({'name':'LayeredSide_MASK','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':tex},'roughnessFactor':.67,'metallicFactor':0},'alphaMode':'MASK','alphaCutoff':.18,'doubleSided':True})
    def mesh(name,part):
        pp,nn,uv,ff=part;ff=ff.copy();tri=pp[ff];flip=(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])*nn[ff].mean(axis=1)).sum(1)<0;ff[flip]=ff[flip][:,[0,2,1]];areas=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)/2
        assert np.isfinite(pp).all() and np.isfinite(nn).all() and (areas>1e-14).all()
        return w.mesh(name,pp,nn,mat,uvs=uv,faces=ff,metadata={'role':'hair-component','experimentalOnly':True})
    root_node=mesh('SideSharedRoots',roots)
    owner=next(node for node in w.document['nodes'] if node.get('extras',{}).get('imersity',{}).get('headPreparation'))
    for node in w.document['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role')=='reference-hair':node['scale']=[0,0,0]
    counts={}
    for style,label,part in [('side_flat','Lateral · menos volume',flat),('side_volume','Lateral · camadas com volume',volume)]:
        shared=len(w.document['nodes']);w.document['nodes'].append(copy.deepcopy(w.document['nodes'][root_node]));body=mesh(style+'_Body',part)
        group=len(w.document['nodes']);w.document['nodes'].append({'name':style,'children':[shared,body],'scale':[1,1,1] if style=='side_volume' else [0,0,0],'extras':{'imersity':{'role':'reference-hair','style':style,'styleLabel':label,'partialPatchOnly':True,'surfaceBound':True,'basePosition':[0,0,0],'tintReferenceColor':'493123','experimentalOnly':True,'binding':'triangle-barycentric','scalpNode':scalp,'rootBindings':bindings}}});owner['children'].append(group)
        counts[style]={'cards':len(bindings),'hairTriangles':len(roots[3])+len(part[3]),'sharedRootMesh':w.document['nodes'][shared]['mesh']}
    # Diagnostic sampling on cap + observed head, restricted to the tested side.
    hp=[];hn=[];hf=[];offset=0
    for node in doc['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role') not in ['observed-face','estimated-scalp']:continue
        pr=doc['meshes'][node['mesh']]['primitives'][0];pp=accessor(doc,binary,pr['attributes']['POSITION']).astype(float);nn=accessor(doc,binary,pr['attributes']['NORMAL']).astype(float)
        ff=accessor(doc,binary,pr['indices']).reshape(-1,3).astype(int) if 'indices'in pr else np.arange(len(pp)).reshape(-1,3)
        mid=pp[ff].mean(1);keep=(mid[:,0]<.04)&(mid[:,1]>.82);hp.append(pp);hn.append(nn);hf.append(ff[keep]+offset);offset+=len(pp)
    surface=SurfaceProjector(np.concatenate(hp),np.concatenate(hf),np.concatenate(hn));negative=0;minimum=1
    for q in volume[0][::20]:
        near,no,_,_=surface.project(q);d=float(np.linalg.norm(q-near));minimum=min(d,minimum)
        if d<.004 and np.dot(q-near,no)<-.0005:negative+=1
    meta=owner['extras']['imersity']['headPreparation'];meta.update(activeStyle='side_volume',fitPercent=100,heightPercent=0,scalpDiagnostic=False)
    trial={'id':'layered-side-v1','partialPatchOnly':True,'styles':counts,'rootGeometryShared':True,'layers':7,'boundRootCards':len(bindings),'capturedHeadUnchanged':True,'automaticGroomTransfer':False,'qualityValidated':False,'focusPoint':[-.04,.96,-.025],'focusRadiusNative':.23,'focusAngle':-1.3,'sourceSHA256':BASE_SHA,'sampledClearance':{'samples':len(volume[0][::20]),'nearSurfaceNegativeSamples':negative,'minimumDistanceNative':minimum,'approximateLocalNormalTest':True,'globalCollisionProof':False}}
    meta['sideVolumeTrial']=trial;w.write(output)
    assert bytes(w.binary[:len(binary)])==binary and w.document['accessors'][:len(doc['accessors'])]==doc['accessors'] and source.read_bytes()==raw
    report={**trial,'originalBufferAndAccessorsUnchanged':True,'sourceUnchanged':True,'outputFile':str(output),'outputSHA256':hashlib.sha256(output.read_bytes()).hexdigest()};output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);a=parser.parse_args();prepare(a.source,a.output)
