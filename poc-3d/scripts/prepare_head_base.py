"""Prepare Junior's recorded scan as a local, explicitly estimated head/hair experiment.
Run with Python + NumPy + Pillow. This assisted profile is NOT a general segmentation model.
"""
from pathlib import Path
import argparse,hashlib,json,re,subprocess,tempfile,zipfile,time
import numpy as np
from PIL import Image
from headprep.geometry import clip_mesh,boundary_loops,scalp_patch,HAIRLINE_ANGLES,HAIRLINE_HEIGHTS
from headprep.hair import short_reference,bob_reference
from headprep.refine import refine_surface,protected_vertices
from headprep.ears import ear_field,ear_faces,recess_scalp
from headprep.geometry import hairline_value,vertex_normals
from headprep.gltf import GLB,linear_hex

ROOT=Path(__file__).resolve().parent.parent
SOURCE_JOB='2f9ebeee988ac04a74197753e73074cc'
EXPECTED_SHA256='a337e9175ef2d3257a144dbb10ae066c74603121c114564d504643b072bf8f03'

def read_source(path):
    with tempfile.TemporaryDirectory(prefix='imersity-head-usd-') as folder:
        usd=Path(folder)/'source.usda'
        subprocess.run(['/usr/bin/usdcat',str(path),'-o',str(usd)],check=True,capture_output=True)
        text=usd.read_text()
    if re.search(r'xformOp:',text):raise ValueError('Este perfil requer o espaço de coordenadas original sem transformações adicionais.')
    def array(pattern,width,dtype=float):
        match=re.search(pattern+r' = \[([^\]]+)\]',text)
        if not match:raise ValueError('Atributo ausente: '+pattern)
        return np.fromstring(re.sub(r'[(),]',' ',match[1]),sep=' ',dtype=dtype).reshape(-1,width)
    points=array(r'point3f\[\] points',3);faces=array(r'int\[\] faceVertexIndices',3,int)
    counts=array(r'int\[\] faceVertexCounts',1,int)
    if not np.all(counts==3):raise ValueError('Este perfil aceita somente triângulos.')
    normals=array(r'normal3f\[\] normals',3);uv=array(r'texCoord2f\[\] primvars:st',2);ui=array(r'int\[\] primvars:st:indices',3,int)
    with zipfile.ZipFile(path) as z:
        name=next(n for n in z.namelist() if n.endswith('_tex0.png'));texture=z.read(name)
        with z.open(name) as stream:image=np.asarray(Image.open(stream).convert('RGB'))
    return points,faces,uv[ui],normals,texture,image

def prepare(source,output,refine=False,refine_ears=False):
    refine=refine or refine_ears
    start=time.time();source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    if source_hash!=EXPECTED_SHA256:raise ValueError('O perfil assistido pertence a outra captura; ajuste o recorte antes de usar outra cabeça.')
    points,faces,uv,normals,texture,image=read_source(source)
    cut_values=np.minimum(hairline_value(points),ear_field(points)) if refine_ears else None
    retained,seam,whole=clip_mesh(points,faces,uv,normals,values=cut_values)
    loops=boundary_loops(seam)
    if len(loops)!=1:raise ValueError('O perfil deve produzir uma única abertura craniana. Ajuste o recorte antes de continuar.')
    cap,cap_faces,cap_normals=scalp_patch(loops[0],center_xz=[.035,-.025],radii_xz=[.16,.18],regularize_angles=True) if refine else scalp_patch(loops[0])
    if refine_ears:
        cap=recess_scalp(cap,len(loops[0]));cap_normals=vertex_normals(cap,cap_faces)
    protected=protected_vertices(points) if refine else (np.abs(points[:,0])<=.13)&(points[:,2]>=.09)&(points[:,1]<=.94)&(points[:,1]>=.62)
    protected_faces=protected[faces].all(axis=1)
    if not whole[protected_faces].all():raise ValueError('O recorte atingiu a região facial protegida; resultado rejeitado.')
    # Exact equality of position, original normals, and UV in every protected triangle.
    expected=np.concatenate([points[faces[whole]],normals[faces[whole]],uv[whole]],axis=2).astype('<f4')
    if not np.array_equal(retained[:whole.sum()].astype('<f4'),expected):raise ValueError('Geometria/UV observada foi alterada.')
    # Residual texture transition near the temples is explicitly classified as estimated.
    center=retained[:,:,:3].mean(axis=1);sample_uv=retained[:,:,6:8].reshape(-1,2)
    px=np.clip(sample_uv[:,0]*image.shape[1],0,image.shape[1]-1).astype(int);py=np.clip((1-sample_uv[:,1])*image.shape[0],0,image.shape[0]-1).astype(int)
    brightness=(image[py,px].reshape(-1,3,3).mean(axis=(1,2))/255)
    ax=np.abs(center[:,0]);y=center[:,1];z=center[:,2]
    region=((ax>.145)&(y>.83)&(z<.135)&(z>-.10))|((ax>.12)&(y>.94)&(z<.17)&(z>0))
    ear=(ax>.19)&(y<.923)&(y>.775)&(z>-.05)&(z<.055)
    transition=region&~ear&(brightness<.43)
    refinement={}
    if refine:
        retained,transition,cap,cap_normals,refinement=refine_surface(retained,cap,cap_faces,image,protect_ears=refine_ears)
    # The central facial region can never be reclassified as inferred material.
    if not refine:assert not (transition & (np.abs(center[:,0])<=.13) & (center[:,2]>=.09) & (center[:,1]<=.94) & (center[:,1]>=.62)).any()
    glb=GLB();glb.document['nodes'].append({'name':'ImersityHeadExperiment','children':[]})
    texview=glb.blob(texture);glb.document['images']=[{'bufferView':texview,'mimeType':'image/png'}]
    glb.document['textures']=[{'source':0}]
    glb.document['materials']=[
        {'name':'CapturedColor','pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':.95},'extensions':{'KHR_materials_unlit':{}},'doubleSided':True},
        {'name':'EstimatedScalpDiagnostic','pbrMetallicRoughness':{'baseColorFactor':linear_hex('e99839'),'metallicFactor':0,'roughnessFactor':.95},'doubleSided':True},
        {'name':'ReferenceHair','pbrMetallicRoughness':{'baseColorFactor':linear_hex('493123'),'metallicFactor':0,'roughnessFactor':.72},'doubleSided':True}]
    def observed_mesh(data,name,material,role):
        points=data[:,:,:3].reshape(-1,3);normal=data[:,:,3:6].reshape(-1,3);uvs=data[:,:,6:8].reshape(-1,2).copy();uvs[:,1]=1-uvs[:,1]
        return glb.mesh(name,points,normal,material,uvs=uvs if material==0 else None,metadata={'role':role,'estimated':material!=0})
    children=glb.document['nodes'][0]['children']
    children.append(observed_mesh(retained[~transition],'ObservedFaceEarsNeck',0,'observed-face'))
    children.append(observed_mesh(retained[transition],'EstimatedTempleTransition',1,'estimated-scalp'))
    children.append(glb.mesh('EstimatedScalp',cap,cap_normals,1,faces=cap_faces,metadata={'role':'estimated-scalp','estimated':True}))
    for style,fn in [('short',short_reference),('bob',bob_reference)]:
        hp,hf,hn=fn(loops[0]);pivot=np.array([0.,.90,-.015]);index=glb.mesh('ReferenceHair_'+style,hp-pivot,hn,2,faces=hf,metadata={'role':'reference-hair','style':style,'referenceOnly':True,'basePosition':pivot.tolist()})
        glb.document['nodes'][index]['translation']=pivot.tolist();glb.document['nodes'][index]['scale']=[0.,0.,0.];children.append(index)
    all_points=np.concatenate([retained[:,:,:3].reshape(-1,3),cap]);minimum=all_points.min(axis=0);maximum=all_points.max(axis=0);scale=.25/float((maximum-minimum).max());center=(minimum+maximum)/2
    glb.document['nodes'][0].update(scale=[scale]*3,translation=(-center*scale).tolist())
    metadata={'schema':'imersity.head-preparation.v1','subjectSpecific':True,'sourceJob':SOURCE_JOB,'sourceSHA256':source_hash,'method':'assisted-spatial-crop-and-estimated-scalp','automaticHairSegmentation':False,'metricValidated':False,'activeStyle':'none','scalpDiagnostic':True,'skinColor':'d3a282','hairColor':'493123','fitPercent':100,'heightPercent':0,'nativeHeadHeight':.575,'referenceHairOnly':True,'protectedTriangles':int(protected_faces.sum()),'observedFaces':int((~transition).sum()),'transitionFaces':int(transition.sum()),'estimatedScalpFaces':len(cap_faces),'seamVertexCount':len(loops[0]),'hairlineAngles':HAIRLINE_ANGLES,'hairlineHeights':HAIRLINE_HEIGHTS,'limitations':['Scalp is an estimate, not a measurement.','Reference styles are procedural fit prototypes, not realistic hairstyles.','Small texture/shape residues near ears may need manual refinement.','Lower neck is open; this is not a watertight printing model.']}
    if refine:
        metadata['method']='texture-reviewed-local-replacement-and-fairing'
        metadata['refinement']=refinement
        if refine_ears:
            refinement['revision']='ear-preservation-v3'
            core=(ear_field(points,margin=0)[faces]<-.001).all(axis=1)
            assert whole[core].all(), 'Original ear core was cut'
            refinement['originalEarCoreTriangles']=int(core.sum())
            refinement['earCoreRecoveredFromV2']=int((core&~((hairline_value(points)[faces]<=0).all(axis=1))).sum())
            refinement['earRetentionBeforeClipping']=True
            refinement['estimatedScalpRecessedBehindEars']=True
        refinement['estimatedCapCenterXZ']=[.035,-.025]
        refinement['estimatedCapRadiiXZ']=[.16,.18]
        metadata['protectedRegion']='x centered at .035 +/- .105; z>=.12; .62<=y<=.94; replacements excluded at every touching triangle'
    glb.document['nodes'][0]['extras']={'imersity':{'method':'head-base-experiment','metricValidated':False,'normalDecodeVersion':1,'headPreparation':metadata}}
    glb.write(output)
    if hashlib.sha256(source.read_bytes()).hexdigest()!=source_hash:raise ValueError('O arquivo original sofreu alteração.')
    metadata.update(outputBytes=output.stat().st_size,preparationSeconds=round(time.time()-start,3),protectedGeometryAndUVExact=True,sourceUnchanged=True)
    output.with_suffix('.json').write_text(json.dumps(metadata,indent=2,ensure_ascii=False))
    print(json.dumps(metadata,ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--refine-texture',action='store_true');parser.add_argument('--refine-ears',action='store_true');args=parser.parse_args()
    prepare(ROOT/'data'/SOURCE_JOB/'result'/'head.usdz',args.output,refine=args.refine_texture,refine_ears=args.refine_ears)
