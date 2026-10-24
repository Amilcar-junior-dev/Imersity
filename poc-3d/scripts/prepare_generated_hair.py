"""Extract this specific fal/Meshy hair candidate and fit it to Junior's head.
Local operation only. This is an assisted experiment, not general segmentation.
"""
from pathlib import Path
import argparse,copy,hashlib,io,json,struct
import numpy as np
from PIL import Image
from headprep.geometry import clip_mesh
from headprep.gltf import GLB
from headprep.extraction import hair_scores,crown_components,fit_hair,mold_hair
from headprep.ears import polygon_distance,EAR_PLUS_V3,EAR_MINUS_V3

SOURCE_SHA='8ea3590316b1cb0328559756e2761d1d814fcc86175b1e126f5d87b7a83022bd'
HEAD_SHA='a337e9175ef2d3257a144dbb10ae066c74603121c114564d504643b072bf8f03'

def read_glb(path):
    data=path.read_bytes();magic,version,total=struct.unpack_from('<III',data)
    if magic!=0x46546c67 or version!=2 or total!=len(data):raise ValueError('GLB inválido.')
    length,kind=struct.unpack_from('<II',data,12)
    if kind!=0x4e4f534a:raise ValueError('JSON GLB ausente.')
    doc=json.loads(data[20:20+length]);offset=20+length;length,kind=struct.unpack_from('<II',data,offset)
    if kind!=0x004e4942:raise ValueError('Buffer binário ausente.')
    return doc,data[offset+8:offset+8+length]

def accessor(doc,binary,key):
    a=doc['accessors'][key];v=doc['bufferViews'][a['bufferView']]
    if a.get('sparse'):raise ValueError('Atributo esparso não suportado neste experimento.')
    width={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
    size=np.dtype(dtype).itemsize;offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',width*size)
    return np.ndarray(shape=(a['count'],width),dtype=dtype,buffer=binary,offset=offset,strides=(stride,size))

def prepare(source,head,output,hair_output,regional_fit=False):
    source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    if source_hash!=SOURCE_SHA:raise ValueError('Este perfil pertence ao primeiro model.glb; não aplique ao segundo resultado sem revisar.')
    d,b=read_glb(source)
    if len(d['meshes'])!=1 or len(d['meshes'][0]['primitives'])!=1 or len(d['nodes'])!=1:raise ValueError('Estrutura de origem diferente da inspecionada.')
    if d['nodes'][0].get('matrix')!=np.eye(4).reshape(-1).tolist():raise ValueError('Transformação inesperada.')
    prim=d['meshes'][0]['primitives'][0];p=accessor(d,b,prim['attributes']['POSITION']).astype(float);n=accessor(d,b,prim['attributes']['NORMAL']).astype(float);uv=accessor(d,b,prim['attributes']['TEXCOORD_0']).astype(float);f=accessor(d,b,prim['indices']).reshape(-1,3).astype(int)
    material=copy.deepcopy(d['materials'][prim['material']]);tex=d['textures'][material['pbrMetallicRoughness']['baseColorTexture']['index']];im=d['images'][tex['source']]
    if 'bufferView' not in im:raise ValueError('Somente textura interna é aceita.')
    view=d['bufferViews'][im['bufferView']];texture=b[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
    image=np.asarray(Image.open(io.BytesIO(texture)).convert('RGB'))
    def sample(coords):
        x=np.clip(coords[...,0]*image.shape[1],0,image.shape[1]-1).astype(int);y=np.clip(coords[...,1]*image.shape[0],0,image.shape[0]-1).astype(int)
        return image[y,x]/255
    scores=hair_scores(p,sample(uv));retained,seam,whole=clip_mesh(p,f,uv[f],n,minimum_y=-2,values=-scores)
    rgb=sample(retained[:,:,6:8]).mean(axis=1);center=retained[:,:,:3].mean(axis=1)
    center_rgb=sample(retained[:,:,6:8].mean(axis=1))
    # Trim pale remnants only at the cut; crown highlights are retained.
    retained=retained[(center[:,1]>.2)|((rgb.mean(axis=1)<.38)&(center_rgb.mean(axis=1)<.43))]
    keep,components=crown_components(retained[:,:,:3]);retained=retained[keep]
    flat=retained.reshape(-1,8).astype('<f4');attributes,inverse=np.unique(flat,axis=0,return_inverse=True);faces=inverse.reshape(-1,3)
    points=attributes[:,:3].astype(float);normals=attributes[:,3:6].astype(float);uvs=attributes[:,6:8]
    normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-12)
    def append_texture(writer):
        view=writer.blob(texture);images=writer.document.setdefault('images',[]);index=len(images);images.append({'bufferView':view,'mimeType':im['mimeType']})
        textures=writer.document.setdefault('textures',[]);ti=len(textures);textures.append({'source':index})
        m=copy.deepcopy(material);m['name']='FalMeshyHairOriginalTexture';m['pbrMetallicRoughness']['baseColorTexture']['index']=ti
        mi=len(writer.document['materials']);writer.document['materials'].append(m);return mi
    report={'sourceFile':str(source),'sourceSHA256':source_hash,'sourceTriangles':len(f),'sourceMeshes':1,'sourceMaterials':1,'separateHairObjectInSource':False,'extractedTriangles':len(faces),'extractedVertices':len(points),'assistedTextureAndSpatialCrop':True,'thinOuterSurface':True,'uniformThicknessValidated':False,**components}
    hd,hb=read_glb(head);owner=next(n for n in hd['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'));meta=owner['extras']['imersity']['headPreparation']
    if meta['sourceSHA256']!=HEAD_SHA or meta.get('refinement',{}).get('revision')!='ear-preservation-v3':raise ValueError('Cabeça-base inesperada.')
    # One explicitly approximate skin color, sampled from captured forehead,
    # makes uncovered estimated temple patches easier to compare cosmetically.
    observed=next(n for n in hd['nodes'] if n.get('extras',{}).get('imersity',{}).get('role')=='observed-face')
    hp=hd['meshes'][observed['mesh']]['primitives'][0];positions=accessor(hd,hb,hp['attributes']['POSITION']);huv=accessor(hd,hb,hp['attributes']['TEXCOORD_0'])
    selection=(positions[:,1]>.935)&(positions[:,1]<.97)&(positions[:,2]>.14)&(np.abs(positions[:,0]-.035)<.07)
    hv=hd['bufferViews'][hd['images'][0]['bufferView']];hi=np.asarray(Image.open(io.BytesIO(hb[hv.get('byteOffset',0):hv.get('byteOffset',0)+hv['byteLength']])).convert('RGB'))
    hx=np.clip(huv[selection,0]*hi.shape[1],0,hi.shape[1]-1).astype(int);hy=np.clip(huv[selection,1]*hi.shape[0],0,hi.shape[0]-1).astype(int)
    skin=''.join(f'{int(v):02x}' for v in np.median(hi[hy,hx],axis=0)) if selection.sum()>10 else 'a17457'
    report['approximateScalpColorSampledFromForehead']=skin
    combined=GLB();combined.document=copy.deepcopy(hd);combined.binary=bytearray(hb);mi=append_texture(combined)
    fitted,fit_normals,fit=fit_hair(points,normals)
    if regional_fit:
        fitted,fit_normals,regional=mold_hair(fitted,fit_normals);fit['regionalDeformation']=regional
    margin=.004 if regional_fit else .015
    plus=np.maximum(polygon_distance(fitted[:,[2,1]],EAR_PLUS_V3)-margin,.165-fitted[:,0])
    minus=np.maximum(polygon_distance(fitted[:,[2,1]],EAR_MINUS_V3)-margin,fitted[:,0]+.095)
    under_plus=np.maximum.reduce([.13-fitted[:,0],-.09-fitted[:,2],fitted[:,1]-.825])
    under_minus=np.maximum.reduce([fitted[:,0]+.08,-.13-fitted[:,2],fitted[:,1]-.815])
    clearance=np.minimum.reduce([plus,minus,under_plus,under_minus])
    fit['hairTrianglesTouchingEarClearance']=int((clearance[faces]<0).any(axis=1).sum())
    trimmed,_,_=clip_mesh(fitted,faces,uvs[faces],fit_normals,minimum_y=-2,values=-clearance)
    keep,_=crown_components(trimmed[:,:,:3]);trimmed=trimmed[keep]
    fitted_attributes,fi=np.unique(trimmed.reshape(-1,8).astype('<f4'),axis=0,return_inverse=True)
    fitted=fitted_attributes[:,:3];fit_normals=fitted_attributes[:,3:6].copy();fit_normals/=np.maximum(np.linalg.norm(fit_normals,axis=1)[:,None],1e-12)
    uvs=fitted_attributes[:,6:8];faces=fi.reshape(-1,3)
    fit['fittedHairTriangles']=len(faces);fit['earClearanceAssisted']=True
    pivot=np.array([.035,.90,-.015])
    style='fal01fit2' if regional_fit else 'fal01'
    if any(n.get('extras',{}).get('imersity',{}).get('style')==style for n in combined.document['nodes']):raise ValueError('Esta revisão já está presente na cabeça fornecida.')
    for node in combined.document['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role')=='reference-hair':node['scale']=[0,0,0]
    index=combined.mesh('Fal01_MoldedHair' if regional_fit else 'Fal01_ExtractedHair',fitted-pivot,fit_normals,mi,uvs=uvs,faces=faces,metadata={'role':'reference-hair','style':style,'styleLabel':'Cabelo fal · moldado nas têmporas e nuca' if regional_fit else 'Cabelo fal · extraído do primeiro modelo','referenceOnly':False,'experimentalOnly':True,'basePosition':pivot.tolist(),'tintReferenceColor':'493123','sourceSHA256':source_hash})
    combined.document['nodes'][index]['translation']=pivot.tolist();combined.document['nodes'][index]['scale']=[1,1,1];owner=next(n for n in combined.document['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'));owner['children'].append(index)
    meta=owner['extras']['imersity']['headPreparation'];meta['activeStyle']=style;meta['fitPercent']=100;meta['heightPercent']=0;meta['hairColor']='493123';meta['hairTrial']={'id':'fal-model-001-fit2' if regional_fit else 'fal-model-001','sourceSHA256':source_hash,'label':'Cabelo fal moldado' if regional_fit else 'Cabelo fal extraído','experimentalOnly':True,**fit};meta['referenceHairOnly']=False;meta['scalpDiagnostic']=False;meta['skinColor']=skin
    standalone=GLB();standalone.document['nodes'].append({'name':'ExtractedHair','children':[]});mi=append_texture(standalone)
    index=standalone.mesh('HairOnly_Fal01',fitted,fit_normals,mi,uvs=uvs,faces=faces,metadata={'role':'extracted-hair','sourceSHA256':source_hash,'experimentalOnly':True});standalone.document['nodes'][0]['children'].append(index);standalone.write(hair_output)
    combined.write(output)
    # Appending this asset cannot change any original head data or accessor.
    assert bytes(combined.binary[:len(hb)])==hb
    assert combined.document['accessors'][:len(hd['accessors'])]==hd['accessors']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash
    report.update(fit=fit,headGeometryAndUVUnchanged=True,outputFile=str(output),hairOnlyFile=str(hair_output),sourceUnchanged=True)
    output.with_suffix('.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--head',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--hair-output',type=Path,required=True);parser.add_argument('--regional-fit',action='store_true');a=parser.parse_args();prepare(a.source,a.head,a.output,a.hair_output,a.regional_fit)
