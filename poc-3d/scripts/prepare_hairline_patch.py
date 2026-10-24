"""Prepare the local A/B hairline fixture, preserving all captured head data."""
from pathlib import Path
import argparse,copy,hashlib,json
import numpy as np
from headprep.gltf import GLB
from headprep.hairline import make_patch,strand_atlas
from prepare_generated_hair import read_glb,accessor

BASE_SHA='1ddfb2c76c45f5fb4934fd5bb5b82184e73c36347a7181d0b258144ede16d862'


def prepare(source,output):
    original=source.read_bytes()
    if hashlib.sha256(original).hexdigest()!=BASE_SHA:raise ValueError('Este teste usa a cabeça e o encaixe moldado v2 já conferidos.')
    doc,binary=read_glb(source)
    owner=next(n for n in doc['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'))
    scalp_node=next(i for i,n in enumerate(doc['nodes']) if n.get('name')=='EstimatedScalp')
    primitive=doc['meshes'][doc['nodes'][scalp_node]['mesh']]['primitives'][0]
    p=accessor(doc,binary,primitive['attributes']['POSITION']).astype(float)
    n=accessor(doc,binary,primitive['attributes']['NORMAL']).astype(float)
    f=accessor(doc,binary,primitive['indices']).reshape(-1,3).astype(int)
    points,normals,uvs,faces,bindings=make_patch(p,f,n)
    for binding in bindings:
        reconstructed=np.asarray(binding['barycentric'])@p[f[binding['triangle']]]
        np.testing.assert_allclose(reconstructed,binding['root'],atol=1e-9)
    texture,rgba=strand_atlas()
    writer=GLB();writer.document=copy.deepcopy(doc);writer.binary=bytearray(binary)
    view=writer.blob(texture);image=len(writer.document['images']);writer.document['images'].append({'bufferView':view,'mimeType':'image/png','name':'ProceduralFiberCoverage16Tiles'})
    sampler=len(writer.document.setdefault('samplers',[]));writer.document['samplers'].append({'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071})
    tex=len(writer.document['textures']);writer.document['textures'].append({'source':image,'sampler':sampler})
    material={'name':'HairlineFixture_MASK','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':tex},'roughnessFactor':.65,'metallicFactor':0},'alphaMode':'MASK','alphaCutoff':.18,'doubleSided':True}
    masked=len(writer.document['materials']);writer.document['materials'].append(material)
    opaque=len(writer.document['materials']);writer.document['materials'].append({**copy.deepcopy(material),'name':'HairlineFixture_OPAQUE','alphaMode':'OPAQUE'})
    for node in writer.document['nodes']:
        if node.get('extras',{}).get('imersity',{}).get('role')=='reference-hair':node['scale']=[0,0,0]
    common={'role':'reference-hair','experimentalOnly':True,'referenceOnly':True,'partialPatchOnly':True,'surfaceBound':True,'basePosition':[0,0,0],'tintReferenceColor':'493123','scalpNode':scalp_node,'binding':'triangle-barycentric','rootBindings':bindings,'rootOffsetNative':.00018}
    index=writer.mesh('HairlinePatch_Fibers',points,normals,masked,uvs=uvs,faces=faces,metadata={**common,'style':'rootfibers','styleLabel':'Faixa de raiz · fios com transparência'})
    # Share exactly the same accessors: this A/B changes alpha interpretation,
    # not silhouette support geometry, root positions, atlas or head shape.
    mesh=len(writer.document['meshes']);old_mesh=writer.document['meshes'][writer.document['nodes'][index]['mesh']]
    solid_mesh=copy.deepcopy(old_mesh);solid_mesh['name']='HairlinePatch_Opaque';solid_mesh['primitives'][0]['material']=opaque;writer.document['meshes'].append(solid_mesh)
    solid=len(writer.document['nodes']);writer.document['nodes'].append({'name':'HairlinePatch_Opaque','mesh':mesh,'scale':[0,0,0],'extras':{'imersity':{**common,'style':'rootopaque','styleLabel':'Faixa de raiz · borda opaca (controle)'}}})
    owner=next(node for node in writer.document['nodes'] if node.get('extras',{}).get('imersity',{}).get('headPreparation'))
    owner['children'].extend([index,solid]);meta=owner['extras']['imersity']['headPreparation']
    meta.update(activeStyle='rootfibers',fitPercent=100,heightPercent=0,scalpDiagnostic=False)
    meta['hairlineTrial']={'id':'root-patch-v1','partialPatchOnly':True,'artistReferenceAsset':False,'method':'procedural-card-fixture-with-surface-bindings','cards':len(bindings),'textureFibersPerCard':13,'hairTriangles':len(faces),'capturedHeadUnchanged':True,'skinTextureCompletion':False,'automaticGroomTransfer':False,'qualityValidated':False,'focusPoint':points.mean(axis=0).tolist(),'focusRadiusNative':.095,'focusAngle':-.55,'sourceSHA256':BASE_SHA}
    writer.write(output)
    assert bytes(writer.binary[:len(binary)])==binary
    assert writer.document['accessors'][:len(doc['accessors'])]==doc['accessors']
    tri=points[faces];areas=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)/2
    assert (areas>0).all() and np.isfinite(points).all() and np.isfinite(normals).all()
    report={**meta['hairlineTrial'],'outputFile':str(output),'outputSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'originalBinaryAndAccessorsUnchanged':True,'identicalGeometryForAB':True,'boundRoots':len(bindings),'minimumTriangleAreaNative':float(areas.min()),'alphaCoverageFraction':float((rgba[:,:,3]>=46).mean()),'sourceUnchanged':source.read_bytes()==original}
    output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();prepare(args.source,args.output)
