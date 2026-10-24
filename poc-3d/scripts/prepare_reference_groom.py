"""Adapt the credited Sintel reference curves; never synthesize a new hairstyle.

Private head stays in the local output GLB. Asset licence: CC BY 3.0;
Sintel / Blender Foundation, Sintel Lite by BenDansie, TFX export by Scthe.
"""
from pathlib import Path
import argparse, copy, hashlib, io, json, struct
import numpy as np
from PIL import Image
from headprep.gltf import GLB
from headprep.hairline import SurfaceProjector, unit
from prepare_generated_hair import read_glb, accessor

TFX_SHA='66489d49e61fb740932de79954806549100c5382281829a3d16211c832ad008e'
HEAD_SHA='70542193409523711937abd9fa1961a086d8ef9c07ac2853ef78afc68d34d7e0'
BASE_SHA='accc65e2304b1fdea65dc77da0e95cd125bcb2fd532fd03278030b2ff75aaa92'
CENTER=np.array([.035,.90,-.025]); SOURCE_CENTER=np.array([0,1.548,-.008])

def read_curves(path):
    raw=path.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=TFX_SHA: raise ValueError('Arquivo de referência diferente do inspecionado.')
    version,count,steps,offset,*_=struct.unpack_from('<f7I',raw)
    if version!=4 or count!=11400 or steps!=16: raise ValueError('Cabeçalho TFX inesperado.')
    return np.frombuffer(raw,dtype='<f4',offset=offset,count=count*steps*4).reshape(count,steps,4)[...,:3].astype(float)

def read_head(path):
    if hashlib.sha256(path.read_bytes()).hexdigest()!=HEAD_SHA: raise ValueError('Cabeça de referência diferente.')
    p=[]; f=[]
    for line in path.read_text().splitlines():
        items=line.split()
        if not items: continue
        if items[0]=='v': p.append(list(map(float,items[1:4])))
        elif items[0]=='f':
            face=[int(s.split('/')[0])-1 for s in items[1:]]
            for i in range(1,len(face)-1):f.append([face[0],face[i],face[i+1]])
    p=np.array(p);f=np.array(f);n=np.zeros_like(p);tri=p[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    for k in range(3):np.add.at(n,f[:,k],fn)
    return p,unit(n),f

def ribbons(curves,seed=229):
    """Each input curve remains one geometric fibre, not a painted multi-fibre card.

    Fallback strips are authored here; the app rotates their width axis toward
    the camera, without changing the imported curve centreline.
    """
    count,steps,_=curves.shape;rng=np.random.default_rng(seed)
    tang=unit(np.gradient(curves,axis=1));radial=unit(curves-CENTER)
    side=unit(np.cross(radial,tang));bad=np.linalg.norm(side,axis=2)<.1
    side[bad]=unit(np.cross(np.array([0,0,1.]),tang[bad]))
    normal=unit(np.cross(side,tang));t=np.linspace(0,1,steps)
    # Native units are not calibrated metres. Radius is a rendering parameter.
    radius=rng.uniform(.00075,.00110,(count,1))*(.42+.58*np.sin(np.pi*(.15+.85*t))[None,:]**.5)
    radius[:,-1]=.000025
    signs=np.array([-1,1]);width=radius[...,None]*signs
    p=curves[:,:,None,:]+side[:,:,None,:]*width[:,:,:,None]
    normals=np.repeat(normal[:,:,None,:],2,axis=2)
    # Atlas rows encode individual per-fibre shade variation; columns root to tip.
    row=(rng.integers(0,64,count)+.5)/64
    uv=np.empty((count,steps,2,2));uv[:,:,:,0]=np.linspace(.01,.99,steps)[None,:,None]
    uv[:,:,:,1]=row[:,None,None]
    # Single fibre alpha is lateral coverage, stored as vertex scalar in shader.
    idx=np.arange(count*steps*2).reshape(count,steps,2)
    a=idx[:,:-1,0];b=idx[:,:-1,1];c=idx[:,1:,0];d=idx[:,1:,1]
    f=np.stack([np.stack([a,b,c],-1),np.stack([b,d,c],-1)],2).reshape(-1,3)
    return p.reshape(-1,3),normals.reshape(-1,3),uv.reshape(-1,2),f,{
        '_CENTER':np.repeat(curves[:,:,None,:],2,axis=2).reshape(-1,3),
        '_HAIRTANGENT':np.repeat(tang[:,:,None,:],2,axis=2).reshape(-1,3),
        '_WIDTH':width.reshape(-1),
        '_EDGE':np.broadcast_to(signs,(count,steps,2)).reshape(-1),
    }

def prepare(base,asset_dir,output):
    raw=base.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=BASE_SHA: raise ValueError('Cabeça-base diferente do perfil assistido.')
    doc,binary=read_glb(base)
    owner_index=next(i for i,n in enumerate(doc['nodes']) if n.get('extras',{}).get('imersity',{}).get('headPreparation'))
    meta=doc['nodes'][owner_index]['extras']['imersity']['headPreparation']
    if meta.get('refinement',{}).get('revision')!='ear-preservation-v3':raise ValueError('Use a cabeça com as orelhas preservadas.')
    curves=read_curves(asset_dir/'sintel.tfx');source_head,source_normals,source_faces=read_head(asset_dir/'sintel.obj')
    # Uniform transform for the source control: no hairstyle deformation.
    control=(curves-SOURCE_CENTER)*1.9+CENTER
    # Assisted anisotropic registration to this particular reconstructed head.
    initial=(curves-SOURCE_CENTER)*np.array([1.92,2.03,1.70])+CENTER
    scalp=next(n for n in doc['nodes'] if n.get('name')=='EstimatedScalp')
    prim=doc['meshes'][scalp['mesh']]['primitives'][0]
    sp=accessor(doc,binary,prim['attributes']['POSITION']).astype(float);sn=accessor(doc,binary,prim['attributes']['NORMAL']).astype(float);sf=accessor(doc,binary,prim['indices']).reshape(-1,3).astype(int)
    surface=SurfaceProjector(sp,sf,sn);bindings=[];fitted=initial.copy();lift=.00055
    t=np.linspace(0,1,curves.shape[1]);weights=np.exp(-5*t)
    for k,root in enumerate(initial[:,0]):
        q,n,face,bary=surface.project(root)
        delta=q+n*lift-root
        fitted[k]+=weights[:,None]*delta
        bindings.append({'triangle':face,'barycentric':bary.tolist(),'root':q.tolist(),'lift':lift})
        if k%3000==0:print('Raízes ajustadas:',k,flush=True)
    w=GLB();w.document=copy.deepcopy(doc);w.binary=bytearray(binary)
    owner=w.document['nodes'][owner_index]
    # Retain all original data, but remove the early geometric placeholders from the scene.
    owner['children']=[i for i in owner['children'] if w.document['nodes'][i].get('extras',{}).get('imersity',{}).get('role')!='reference-hair']
    # Compact data atlas: coverage=R, root/tip=G, strand shade=B.
    atlas=np.zeros((64,128,4),np.uint8);atlas[:,:,0]=255;atlas[:,:,1]=np.linspace(0,255,128,dtype=np.uint8)[None,:];atlas[:,:,2]=np.random.default_rng(8).integers(35,225,(64,1));atlas[:,:,3]=255
    stream=io.BytesIO();Image.fromarray(atlas).save(stream,format='PNG')
    im=len(w.document.setdefault('images',[]));w.document['images'].append({'bufferView':w.blob(stream.getvalue()),'mimeType':'image/png','name':'SintelReferenceStrandData'})
    tex=len(w.document.setdefault('textures',[]));w.document['textures'].append({'source':im})
    hairmat=len(w.document['materials']);w.document['materials'].append({'name':'SintelReferenceHair','pbrMetallicRoughness':{'baseColorFactor':[.055,.025,.013,1],'roughnessFactor':.5,'metallicFactor':0},'alphaMode':'MASK','alphaCutoff':.1,'doubleSided':True})
    graymat=len(w.document['materials']);w.document['materials'].append({'name':'SintelControlHead','pbrMetallicRoughness':{'baseColorFactor':[.45,.48,.47,1],'roughnessFactor':.8}})
    trial={'id':'sintel-reference-v1','asset':'Sintel Lite 2.57b','assetAuthor':'Sintel / Blender Foundation; BenDansie; TFX export by Marcin Matuszczyk (Scthe)','license':'CC BY 3.0','licenseURL':'https://creativecommons.org/licenses/by/3.0/','sourceURL':'https://github.com/Scthe/frostbitten-hair-webgpu','sourceAssetSHA256':TFX_SHA,'baseSHA256':hashlib.sha256(raw).hexdigest(),'sourceCurves':len(curves),'pointsPerCurve':16,'hairTrianglesPerStyle':len(curves)*30,'registration':'assisted affine plus local root projection with decaying correction','rootBindings':bindings,'rootLift':lift,'staticHair':True,'automaticCrossPersonFit':False,'photorealismValidated':False,'focusPoint':[.035,.88,-.025],'focusRadiusNative':.30,'focusAngle':.42,'runtimeShaderRequired':True,'runtimeDataTexture':tex,'sourceControlUnmodifiedApartFromUniformTransform':True}
    for style,positions,label in [('reference_original',control,'Sintel · cabeça de referência'),('reference_fit',fitted,'Sintel · no seu avatar')]:
        group=len(w.document['nodes']);w.document['nodes'].append({'name':style,'children':[],'scale':[1,1,1],'rotation':[0,0,0,1],'extras':{'imersity':{'role':'reference-hair','style':style,'styleLabel':label,'controlReference':style=='reference_original','surfaceBound':True,'basePosition':[0,0,0]}}});owner['children'].append(group)
        p,n,uv,f,attrs=ribbons(positions)
        node=w.mesh('SintelImportedFibres',p,n,hairmat,uvs=uv,faces=f,metadata={'role':'imported-hair-fibres','referenceGroom':True,'dataTexture':tex})
        mesh=w.document['meshes'][w.document['nodes'][node]['mesh']]['primitives'][0]
        for key,values in attrs.items():mesh['attributes'][key]=w.accessor(values,'CUSTOM')
        w.document['nodes'][group]['children'].append(node)
        if style=='reference_original':
            refnode=w.mesh('SintelControlHead',(source_head-SOURCE_CENTER)*1.9+CENTER,source_normals,graymat,faces=source_faces,metadata={'role':'reference-head'})
            w.document['nodes'][group]['children'].append(refnode)
    # Embedded credits remain with the derived private asset.
    meta=w.document['nodes'][owner_index]['extras']['imersity']['headPreparation'];meta.update(activeStyle='reference_fit',hairColor='2b1c14',fitPercent=100,heightPercent=0,scalpDiagnostic=False,referenceGroomTrial=trial)
    w.write(output)
    assert bytes(w.binary[:len(binary)])==binary
    assert w.document['accessors'][:len(doc['accessors'])]==doc['accessors']
    assert base.read_bytes()==raw
    report={k:v for k,v in trial.items() if k!='rootBindings'};report.update(outputSHA256=hashlib.sha256(output.read_bytes()).hexdigest(),baseBinaryAndAccessorsUnchanged=True,baseFileUnchanged=True,maxRootRegistrationDisplacement=float(np.linalg.norm(fitted[:,0]-initial[:,0],axis=1).max()),finiteGeometry=bool(np.isfinite(fitted).all()))
    output.with_suffix('.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--base',type=Path,required=True);a.add_argument('--asset-dir',type=Path,required=True);a.add_argument('--output',type=Path,required=True);args=a.parse_args();prepare(args.base,args.asset_dir,args.output)
