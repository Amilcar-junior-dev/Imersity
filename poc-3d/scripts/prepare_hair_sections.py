"""Append shared-root short, medium and long side-lock fixtures to v1."""
from pathlib import Path
import argparse,copy,hashlib,json
import numpy as np
from headprep.gltf import GLB
from headprep.hairline import strand_atlas,SurfaceProjector
from headprep.hair_sections import LENGTHS,body_ribbon,combine
from prepare_generated_hair import read_glb,accessor
BASE_SHA='94cfd3731dfd068b8568f50e4a3de45e2ff27de91c07b350b08da74524a8d446'

def prepare(source,output):
    raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE_SHA
    doc,binary=read_glb(source);w=GLB();w.document=copy.deepcopy(doc);w.binary=bytearray(binary)
    root_node=next(n for n in doc['nodes'] if n.get('extras',{}).get('imersity',{}).get('style')=='rootfibers')
    primitive=doc['meshes'][root_node['mesh']]['primitives'][0]
    p,n,uv=[accessor(doc,binary,primitive['attributes'][k]).astype(float) for k in ['POSITION','NORMAL','TEXCOORD_0']]
    bindings=root_node['extras']['imersity']['rootBindings'];chosen=[];residual=[];stems=[];body={k:[] for k in LENGTHS}
    faces=np.array([[j*2,j*2+1,j*2+2] for j in range(8)]+[[j*2+1,j*2+3,j*2+2] for j in range(8)],int)
    max_join=0
    for i,b in enumerate(bindings):
        a=i*18;rp=p[a:a+18];rn=n[a:a+18];ru=uv[a:a+18];root=np.array(b['root'])
        angle=np.degrees(np.arctan2(root[0]-.035,root[2]+.025))
        if angle> -29:
            residual.append((rp,rn,ru,faces));continue
        chosen.append({**b,'firstVertex':len(chosen)*18,'originalCardIndex':i})
        stemuv=ru.copy();tile_y=np.floor(ru[:,1]*2).astype(int)*512
        old_phase=(tile_y+509-ru[:,1]*1024)/506
        stemuv[:,1]=(tile_y+509-old_phase*.35*506)/1024
        stems.append((rp,rn,stemuv,faces))
        for style,length in LENGTHS.items():
            part=body_ribbon(rp,ru,length);body[style].append(part)
            max_join=max(max_join,float(np.max(np.abs(part[0][:2]-rp[-2:]))),float(np.max(np.abs(part[2][:2]-stemuv[-2:]))))
    assert chosen and max_join<1e-10
    texbytes,_=strand_atlas(continuous=True);view=w.blob(texbytes);image=len(w.document['images']);w.document['images'].append({'bufferView':view,'mimeType':'image/png','name':'ContinuousRootBodyFibers'})
    tex=len(w.document['textures']);w.document['textures'].append({'source':image,'sampler':doc['textures'][doc['materials'][primitive['material']]['pbrMetallicRoughness']['baseColorTexture']['index']].get('sampler',0)})
    mat=copy.deepcopy(doc['materials'][primitive['material']]);mat['name']='ContinuousSideLock_MASK';mat['pbrMetallicRoughness']['baseColorTexture']['index']=tex
    material=len(w.document['materials']);w.document['materials'].append(mat)
    def component(name,parts,material):
        pp,nn,uu,ff=combine(parts);tri=pp[ff];areas=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)/2
        assert np.isfinite(pp).all() and np.isfinite(nn).all() and (areas>1e-14).all()
        return w.mesh(name,pp,nn,material,uvs=uu,faces=ff,metadata={'role':'hair-component','experimentalOnly':True}),len(ff)
    residual_node,residual_tris=component('UnchangedPartialHairline',residual,primitive['material'])
    stem_node,stem_tris=component('SharedBoundRoots',stems,material)
    owner=next(node for node in w.document['nodes'] if node.get('extras',{}).get('imersity',{}).get('headPreparation'))
    for node in w.document['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role')=='reference-hair':node['scale']=[0,0,0]
    counts={};labels=['Curta','Média','Longa'];joins=[]
    for label,(style,length) in zip(labels,LENGTHS.items()):
        body_node,body_tris=component(style+'_BodyTips',body[style],material)
        # glTF nodes have one parent: clone nodes, reuse mesh/accessor resources.
        children=[]
        for source_index in [residual_node,stem_node]:
            children.append(len(w.document['nodes']));w.document['nodes'].append(copy.deepcopy(w.document['nodes'][source_index]))
        children.append(body_node)
        metadata={'role':'reference-hair','style':style,'styleLabel':'Mecha lateral · '+label.lower(),'partialPatchOnly':True,'surfaceBound':True,'basePosition':[0,0,0],'tintReferenceColor':'493123','experimentalOnly':True,'rootBindings':chosen,'binding':'triangle-barycentric','scalpNode':root_node['extras']['imersity']['scalpNode']}
        group=len(w.document['nodes']);w.document['nodes'].append({'name':style,'children':children,'scale':[1,1,1] if style=='lock_medium' else [0,0,0],'extras':{'imersity':metadata}});owner['children'].append(group)
        counts[style]={'additionalGuideLengthNative':length,'hairTriangles':residual_tris+stem_tris+body_tris,'bodyCards':len(chosen),'rootMesh':w.document['nodes'][children[1]]['mesh']}
    # Validate local sampled clearance against scalp + captured head. Open scan
    # normals are approximate; this is a diagnostic, not watertight collision proof.
    hp=[];hn=[];hf=[];offset=0
    for node in doc['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role') not in ['observed-face','estimated-scalp']:continue
        prim=doc['meshes'][node['mesh']]['primitives'][0];pp=accessor(doc,binary,prim['attributes']['POSITION']).astype(float);nn=accessor(doc,binary,prim['attributes']['NORMAL']).astype(float)
        ff=accessor(doc,binary,prim['indices']).reshape(-1,3).astype(int) if 'indices'in prim else np.arange(len(pp)).reshape(-1,3)
        # Exact triangle subset around the tested side, excluding distant body.
        keep=(pp[ff].mean(1)[:,0]<.01)&(pp[ff].mean(1)[:,1]>.65)
        hp.append(pp);hn.append(nn);hf.append(ff[keep]+offset);offset+=len(pp)
    surface=SurfaceProjector(np.concatenate(hp),np.concatenate(hf),np.concatenate(hn))
    for style,parts in body.items():
        samples=np.concatenate([part[0][2::8] for part in parts]);signed=[];distances=[]
        for q in samples:
            near,normal,_,_=surface.project(q);signed.append(float(np.dot(q-near,normal)));distances.append(float(np.linalg.norm(q-near)))
        counts[style]['sampledClearance']={'samples':len(samples),'minimumSignedNative':min(signed),'negativeSignedSamples':sum(v<-.0005 for v in signed),'nearSurfaceNegativeSamples':sum(v<-.0005 and d<.004 for v,d in zip(signed,distances)),'nearSurfaceDistanceThresholdNative':.004,'minimumDistanceNative':min(distances),'approximateLocalNormalTest':True,'globalCollisionProof':False}
    meta=owner['extras']['imersity']['headPreparation'];meta.update(activeStyle='lock_medium',fitPercent=100,heightPercent=0,scalpDiagnostic=False)
    trial={'id':'modular-side-lock-v1','partialPatchOnly':True,'sharedRootCards':len(chosen),'unchangedRemainingRootCards':len(bindings)-len(chosen),'styles':counts,'rootGeometryShared':True,'maximumJoinGapNativeAndUV':max_join,'focusPoint':[-.09,.94,.06],'focusRadiusNative':.21,'focusAngle':-.95,'capturedHeadUnchanged':True,'automaticGroomTransfer':False,'qualityValidated':False,'sourceSHA256':BASE_SHA}
    meta['hairSectionTrial']=trial;w.write(output)
    assert bytes(w.binary[:len(binary)])==binary and w.document['accessors'][:len(doc['accessors'])]==doc['accessors'] and source.read_bytes()==raw
    report={**trial,'outputFile':str(output),'outputSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceUnchanged':True,'originalBinaryAndAccessorsUnchanged':True}
    output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();prepare(args.source,args.output)
