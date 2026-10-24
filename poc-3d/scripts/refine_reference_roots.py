"""Local v2 root coverage, guided by the existing imported Sintel curves.

The captured head and the 11,400 imported centre lines are not edited. New
short fibres are an estimated cosmetic addition, not recovered measured hair.
"""
from pathlib import Path
import argparse,copy,hashlib,json
import numpy as np
from prepare_generated_hair import read_glb,accessor
from prepare_reference_groom import ribbons,CENTER
from headprep.hairline import unit
from headprep.gltf import GLB

SOURCE_SHA='47e6c1168e4dc2f88a5c829ab9fdb36b3b0b33a869c8bb6e9b0efc9290a83f8c'

def surface_data(doc,binary,node):
    prim=doc['meshes'][doc['nodes'][node]['mesh']]['primitives'][0]
    p=accessor(doc,binary,prim['attributes']['POSITION']).astype(float)
    n=accessor(doc,binary,prim['attributes']['NORMAL']).astype(float)
    f=accessor(doc,binary,prim['indices']).reshape(-1,3).astype(int) if 'indices' in prim else np.arange(len(p)).reshape(-1,3)
    return p,n,f

def root_region(q):
    angle=np.arctan2(q[...,0]-.035,q[...,2]+.025)
    line=.999-.043*(np.minimum(abs(angle),1.35)/1.35)**1.5+.0018*np.sin(angle*23)
    front=(q[...,1]>line)&(q[...,1]<1.125)&(q[...,2]>.015)&(abs(angle)<1.35)
    crown=(q[...,1]>1.07)&(q[...,1]<1.125)&(q[...,2]>-.14)&(abs(q[...,0]-.035)<.13)
    region=front|crown
    # Keep a narrow skin parting, rather than filling the crown with a solid cap.
    part_x=.060+.08*(q[...,1]-1.045)
    part=(q[...,1]>1.037)&(abs(q[...,0]-part_x)<.002)
    return region&~part

class CurveField:
    def __init__(self,curves,cell=.016):
        self.curves=curves;self.cell=cell
        self.points=curves[:,:10].reshape(-1,3);self.buckets={}
        for i,key in enumerate(np.floor(self.points/cell).astype(int)):
            self.buckets.setdefault(tuple(key),[]).append(i)
        self.arcs=np.concatenate([np.zeros((len(curves),1)),np.cumsum(np.linalg.norm(np.diff(curves,axis=1),axis=2),axis=1)],1)
    def segment(self,point,length):
        key=np.floor(point/self.cell).astype(int);ids=[]
        for x in range(-2,3):
            for y in range(-2,3):
                for z in range(-2,3):ids.extend(self.buckets.get(tuple(key+[x,y,z]),()))
        if not ids:return None
        ids=np.array(ids);dist=((self.points[ids]-point)**2).sum(1);i=ids[np.argmin(dist)]
        if dist.min()>.045**2:return None
        guide,step=divmod(int(i),10);arc=self.arcs[guide];available=arc[-1]-arc[step]
        if available<.018:return None
        samples=arc[step]+np.linspace(0,min(length,available),16)
        return np.stack([np.interp(samples,arc,self.curves[guide,:,k]) for k in range(3)],1),guide,step

class FrontSurface:
    """Exact XY barycentric front envelope in this bounded forehead/crown region.

    This is a local collision correction for front-facing surfaces, not a
    general 3D collision solver or a complete scalp reconstruction.
    """
    def __init__(self,doc,binary,cell=.012):
        self.cell=cell;tri=[]
        for i,n in enumerate(doc['nodes']):
            if n.get('name') not in ['ObservedFaceEarsNeck','EstimatedScalp','EstimatedTempleTransition']:continue
            p,_,f=surface_data(doc,binary,i);t=p[f];mid=t.mean(1)
            tri.extend(t[(mid[:,1]>.93)&(mid[:,2]>.005)])
        self.tri=np.array(tri);self.buckets={}
        for i,t in enumerate(self.tri):
            lo=np.floor(t[:,:2].min(0)/cell).astype(int);hi=np.floor(t[:,:2].max(0)/cell).astype(int)
            for x in range(lo[0],hi[0]+1):
                for y in range(lo[1],hi[1]+1):self.buckets.setdefault((x,y),[]).append(i)
    def height(self,p):
        ids=self.buckets.get(tuple(np.floor(p[:2]/self.cell).astype(int)))
        if not ids:return None
        t=self.tri[ids];a=t[:,0,:2];ab=t[:,1,:2]-a;ac=t[:,2,:2]-a;ap=p[:2]-a
        det=ab[:,0]*ac[:,1]-ab[:,1]*ac[:,0];safe=np.where(abs(det)>1e-14,det,1.)
        v=(ap[:,0]*ac[:,1]-ap[:,1]*ac[:,0])/safe;w=(ab[:,0]*ap[:,1]-ab[:,1]*ap[:,0])/safe;u=1-v-w
        valid=(abs(det)>1e-14)&(u>=-1e-7)&(v>=-1e-7)&(w>=-1e-7)
        if not valid.any():return None
        z=u*t[:,0,2]+v*t[:,1,2]+w*t[:,2,2]
        return float(z[valid].max())

def clear_root_bodies(curves,doc,binary):
    envelope=FrontSurface(doc,binary);corrected=curves.copy();count=0;largest=0.;back_count=0;skin_follow=0
    for curve in corrected:
        # Root zero keeps its exact binding. Body samples stay outside visible
        # captured forehead as they join the imported flow.
        for j,p in enumerate(curve[1:],1):
            t=j/15;join=np.clip((t-.45)/.45,0,1);join=join*join*(3-2*join)
            if curve[0,2]<.015:
                # Back crown uses the existing estimated scalp's ellipsoid prior,
                # not the front Z envelope (which would move fibres across the head).
                radii=np.array([.16,.225,.18]);v=p-CENTER;r=np.linalg.norm(v/radii)
                if p[1]>1.065:
                    target=1.003+max(0,r-1.003)*join
                    p[:]=CENTER+v/max(r,1e-10)*target;back_count+=1
                continue
            z=envelope.height(p)
            if z is None:continue
            minimum=z+.0005
            if p[2]<minimum:
                largest=max(largest,minimum-p[2]);p[2]=minimum;count+=1
            else:
                # The first half lies close to skin as a fine undercoat. It only
                # joins the raised reference locks toward its end, avoiding
                # sparse brush-like hairs growing straight out of the parting.
                p[2]=minimum+(p[2]-minimum)*join;skin_follow+=1
    return corrected,{'bodySamplesLifted':count,'largestFrontClearanceCorrectionNative':largest,'backCrownSamplesFollowingEstimatedEllipsoid':back_count,'frontSamplesFollowingSkinBeforeJoiningGuide':skin_follow}

def make_roots(doc,binary,curves,seed=322):
    rng=np.random.default_rng(seed);triangles=[];normals=[];nodes=[];faceids=[];areas=[]
    for node,n in enumerate(doc['nodes']):
        if n.get('name') not in ['ObservedFaceEarsNeck','EstimatedScalp','EstimatedTempleTransition']:continue
        p,ns,f=surface_data(doc,binary,node);tri=p[f];mid=tri.mean(1)
        mask=root_region(mid);selected=np.flatnonzero(mask)
        a=np.linalg.norm(np.cross(tri[selected,1]-tri[selected,0],tri[selected,2]-tri[selected,0]),axis=1)/2
        good=a>1e-12;selected=selected[good];a=a[good]
        triangles.extend(tri[selected]);normals.extend(ns[f[selected]])
        nodes.extend([node]*len(selected));faceids.extend(selected);areas.extend(a)
    triangles=np.array(triangles);normals=np.array(normals);areas=np.array(areas)
    centres=triangles.mean(1);field=CurveField(curves);result=[];bindings=[]
    for region,count in [('hairline',4000),('crown',5000),('front-gap',3000),('back-parting',4000)]:
        mask=centres[:,1]<=1.04 if region=='hairline' else centres[:,1]>1.04 if region=='crown' else (centres[:,1]>1.07)&(centres[:,2]<.025) if region=='back-parting' else (abs(centres[:,0]-.045)<.065)&(centres[:,1]>1.005)&(centres[:,1]<1.085)&(centres[:,2]>.07)
        pool=np.flatnonzero(mask);prob=areas[pool]/areas[pool].sum()
        attempts=0;start=len(result)
        while len(result)-start<count and attempts<count*4:
            attempts+=1;i=int(rng.choice(pool,p=prob));uv=rng.random(2)
            if uv.sum()>1:uv=1-uv
            bary=np.array([1-uv.sum(),*uv]);q=bary@triangles[i]
            if not root_region(q):continue
            n=unit(bary@normals[i]);n=n if np.dot(n,q-CENTER)>0 else -n
            reference=field.segment(q+n*.006,rng.uniform(.030,.050))
            if reference is None:continue
            segment,guide,step=reference;root=q+n*.00030
            # Smoothly join the nearby imported flow, preserving its direction.
            t=np.linspace(0,1,16);curve=segment+(root-segment[0])*np.exp(-3.8*t)[:,None]
            result.append(curve);bindings.append({'node':int(nodes[i]),'triangle':int(faceids[i]),'barycentric':bary.tolist(),'root':q.tolist(),'lift':.00030,'guide':guide,'guideStep':step})
        print('Fios de raiz:',len(result),flush=True)
    return np.array(result),bindings

def refine(source,output):
    raw=source.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=SOURCE_SHA:raise ValueError('Use o GLB Sintel v1 original inspecionado.')
    doc,binary=read_glb(source)
    fit_index=next(i for i,n in enumerate(doc['nodes']) if n.get('name')=='reference_fit')
    original_mesh_node=doc['nodes'][fit_index]['children'][0];prim=doc['meshes'][doc['nodes'][original_mesh_node]['mesh']]['primitives'][0]
    curves=accessor(doc,binary,prim['attributes']['_CENTER']).reshape(11400,16,2,3)[:,:,0].astype(float)
    new_curves,bindings=make_roots(doc,binary,curves)
    new_curves,clearance=clear_root_bodies(new_curves,doc,binary)
    w=GLB();w.document=copy.deepcopy(doc);w.binary=bytearray(binary)
    owner=next(n for n in w.document['nodes'] if n.get('extras',{}).get('imersity',{}).get('headPreparation'))
    old=w.document['nodes'][fit_index];old['name']='reference_fit_previous';old['extras']['imersity'].update(style='reference_fit_previous',styleLabel='Encaixe anterior · comparação')
    group=len(w.document['nodes']);new=copy.deepcopy(old);new['name']='reference_fit';new['children']=[];new['extras']['imersity'].update(style='reference_fit',styleLabel='Sintel · raiz e cobertura ajustadas');w.document['nodes'].append(new);owner['children'].append(group)
    main=len(w.document['nodes']);w.document['nodes'].append(copy.deepcopy(doc['nodes'][original_mesh_node]));w.document['nodes'][main]['extras']['imersity']['rootFadeEnd']=.11;new['children'].append(main)
    p,n,uv,f,attrs=ribbons(new_curves,seed=445)
    # More delicate supplemental fibres. Their centres keep the sampled roots.
    centres=attrs['_CENTER'];p=centres+(p-centres)*.60;attrs['_WIDTH']*=.60
    rootnode=w.mesh('SintelShortRootTransition',p,n,prim['material'],uvs=uv,faces=f,metadata={'role':'root-transition-fibres','referenceGroom':True,'dataTexture':doc['nodes'][original_mesh_node]['extras']['imersity']['dataTexture'],'rootFadeEnd':.22,'estimated':True})
    rootprim=w.document['meshes'][w.document['nodes'][rootnode]['mesh']]['primitives'][0]
    for k,v in attrs.items():rootprim['attributes'][k]=w.accessor(v,'CUSTOM')
    new['children'].append(rootnode)
    meta=owner['extras']['imersity']['headPreparation'];trial=meta['referenceGroomTrial']
    refinement={'id':'sintel-root-refinement-v2','sourceSHA256':SOURCE_SHA,'supplementalFibres':len(new_curves),'supplementalTriangles':len(f),'rootBindings':bindings,'sourceCurveCentresUnchanged':True,'estimatedCosmeticRoots':True,'partingHalfWidthNative':.002,'rootFadeEnd':.22,'bodyRootFadeEnd':.11,'observedGeometryUnchanged':True,'crossPersonFitValidated':False,'localFrontClearance':clearance}
    trial.update(id='sintel-reference-v2',rootRefinement=refinement);meta['activeStyle']='reference_fit'
    w.write(output)
    assert bytes(w.binary[:len(binary)])==binary and w.document['accessors'][:len(doc['accessors'])]==doc['accessors'] and source.read_bytes()==raw
    report={k:v for k,v in refinement.items() if k!='rootBindings'};report.update(outputSHA256=hashlib.sha256(output.read_bytes()).hexdigest(),fileMiB=round(output.stat().st_size/1024**2,1),sourceUnchanged=True)
    output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();refine(v.source,v.output)
