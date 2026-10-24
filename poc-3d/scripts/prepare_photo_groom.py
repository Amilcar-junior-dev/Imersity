"""An assisted frontal-photo hair experiment; no model training or external API."""
from pathlib import Path
import argparse,copy,hashlib,json,base64,io
import numpy as np
from PIL import Image
from headprep.gltf import GLB
from headprep.hairline import strand_atlas
from headprep.photo_groom import make_photo_groom,hair_mask,PHOTO_GUIDES,PHOTO_EYES,NATIVE_EYES,native_to_photo
from prepare_generated_hair import read_glb,accessor
PHOTO_SHA='c487808259c8b754e024d0a7388b21ac2c2d2c4ccd149c611c7c855c3b92aab0'
BASE_SHA='e49a3f1665b3135293b0d192ddcdfb50726b403b109e1e25b977d379d13c918e'

def prepare(source,photo,output):
    raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE_SHA
    photo_bytes=photo.read_bytes();assert hashlib.sha256(photo_bytes).hexdigest()==PHOTO_SHA, 'Este perfil usa somente o quadro frontal anotado.';image=Image.open(photo).convert('RGB');assert image.size==(2160,3840);mask,measurements=hair_mask(image)
    doc,binary=read_glb(source);w=GLB();w.document=copy.deepcopy(doc);w.binary=bytearray(binary)
    scalp=next(i for i,n in enumerate(doc['nodes']) if n.get('name')=='EstimatedScalp');prim=doc['meshes'][doc['nodes'][scalp]['mesh']]['primitives'][0]
    sp,sn=[accessor(doc,binary,prim['attributes'][k]).astype(float) for k in ['POSITION','NORMAL']];sf=accessor(doc,binary,prim['indices']).reshape(-1,3).astype(int)
    (p,n,uv,f),bindings=make_photo_groom(sp,sf,sn,top_contour=measurements['topContour'])
    for b in bindings:np.testing.assert_allclose(np.array(b['barycentric'])@sp[sf[b['triangle']]],b['root'],atol=1e-9)
    texture,rgba=strand_atlas(seed=127,continuous=True);rgb=np.array(measurements['sampledColorRGB']);yy,xx=np.indices(rgba.shape[:2]);variation=np.clip(.96+.17*np.sin(xx*.61+.7*np.sin(yy*.012)),.74,1.14);rgba[:,:,:3]=np.clip(rgb[None,None,:]*variation[:,:,None],0,255).astype(np.uint8);stream=io.BytesIO();Image.fromarray(rgba).save(stream,format='PNG')
    im=len(w.document['images']);w.document['images'].append({'bufferView':w.blob(stream.getvalue()),'mimeType':'image/png','name':'PhotoSampledFiberColor'})
    tex=len(w.document['textures']);w.document['textures'].append({'source':im,'sampler':len(w.document['samplers'])});w.document['samplers'].append({'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071})
    material=len(w.document['materials']);w.document['materials'].append({'name':'PhotoGuidedHair_MASK','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':tex},'roughnessFactor':.65,'metallicFactor':0},'alphaMode':'MASK','alphaCutoff':.18,'doubleSided':True})
    for node in w.document['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role')=='reference-hair':node['scale']=[0,0,0]
    color=''.join(f'{v:02x}' for v in rgb)
    hair=w.mesh('FrontalPhotoGuidedCrown',p,n,material,uvs=uv,faces=f,metadata={'role':'reference-hair','style':'photo_front','styleLabel':'Foto frontal · guias assistidas','partialPatchOnly':True,'surfaceBound':True,'basePosition':[0,0,0],'tintReferenceColor':color,'experimentalOnly':True,'binding':'triangle-barycentric','scalpNode':scalp,'rootBindings':bindings})
    owner=next(node for node in w.document['nodes'] if node.get('extras',{}).get('imersity',{}).get('headPreparation'));owner['children'].append(hair)
    # Keep the original local photo embedded, so comparison never requires an
    # upload, a machine-specific path or adding private media to web/public.
    trial={'id':'frontal-photo-guided-v1','sourcePhotoName':photo.name,'sourcePhotoSHA256':hashlib.sha256(photo_bytes).hexdigest(),'photoSize':list(image.size),'referenceDataURL':'data:image/jpeg;base64,'+base64.b64encode(photo_bytes).decode(),'referenceCrop':[650,1000,1250,1220],'photoMeasurements':measurements,'photoGuidesPixels':PHOTO_GUIDES.tolist(),'photoEyeAnchors':PHOTO_EYES.tolist(),'nativeEyeAnchors':NATIVE_EYES.tolist(),'registration':'approximate-eye-distance-weak-perspective','guideAnnotation':'assisted-manual','learnedModelTrained':False,'automaticHairSegmentation':False,'topContourGuidesTipHeight':True,'usesExistingMultiViewHead':True,'unobservedDepthEstimated':True,'qualityValidated':False,'cards':len(bindings),'hairTriangles':len(f),'focusPoint':[.02,.99,.02],'focusRadiusNative':.23,'focusAngle':0,'sourceSHA256':BASE_SHA}
    meta=owner['extras']['imersity']['headPreparation'];meta.update(activeStyle='photo_front',fitPercent=100,heightPercent=0,scalpDiagnostic=False,hairColor=color,photoGroomTrial=trial)
    tri=p[f];assert np.isfinite(p).all() and (np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)>1e-12).all()
    w.write(output);assert bytes(w.binary[:len(binary)])==binary and w.document['accessors'][:len(doc['accessors'])]==doc['accessors'] and source.read_bytes()==raw
    # This is a geometric envelope, not alpha-rendered similarity or validation.
    projected=native_to_photo(p)
    report={k:v for k,v in trial.items() if k!='referenceDataURL'};report.update(outputFile=str(output),outputSHA256=hashlib.sha256(output.read_bytes()).hexdigest(),originalBufferAndAccessorsUnchanged=True,sourceUnchanged=True,photoGeometryEnvelopePixels=[*projected.min(0).tolist(),*projected.max(0).tolist()],geometricEnvelopeIsNotSimilarityScore=True)
    output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['photoMeasurements','photoGuidesPixels']},ensure_ascii=False))
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--photo',type=Path,required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();prepare(v.source,v.photo,v.output)
