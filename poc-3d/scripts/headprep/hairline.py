"""Small, deterministic hair-card fixture with roots bound to scalp triangles.

This constructs a partial experimental patch, not a complete realistic groom.
Native coordinates are not calibrated physical measurements.
"""
import io
import numpy as np
from PIL import Image,ImageDraw


def unit(v):
    return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-12)


class SurfaceProjector:
    """Nearest point on a local triangle candidate set; retain exact binding.

    Centroid candidates accelerate this small-patch experiment. They are not a
    global nearest-surface guarantee for arbitrarily shaped triangles/scans.
    """
    def __init__(self,points,faces,normals,candidates=24):
        self.points=np.asarray(points,float);self.faces=np.asarray(faces,int)
        self.normals=np.asarray(normals,float);self.tri=self.points[self.faces]
        self.centers=self.tri.mean(axis=1);self.candidates=min(candidates,len(faces))
        if not len(faces):raise ValueError('Superfície de vínculo vazia.')

    def project(self,point):
        point=np.asarray(point,float)
        ids=np.argpartition(((self.centers-point)**2).sum(axis=1),self.candidates-1)[:self.candidates]
        tri=self.tri[ids];a=tri[:,0];ab=tri[:,1]-a;ac=tri[:,2]-a;ap=point-a
        aa=(ab*ab).sum(1);cc=(ac*ac).sum(1);dot=(ab*ac).sum(1)
        den=aa*cc-dot*dot;safe=np.maximum(den,1e-20)
        b1=((ap*ab).sum(1)*cc-(ap*ac).sum(1)*dot)/safe
        b2=((ap*ac).sum(1)*aa-(ap*ab).sum(1)*dot)/safe
        bary=np.stack([1-b1-b2,b1,b2],axis=1)
        valid=(bary>=0).all(1)&(den>1e-20)
        choices=[bary];distances=[np.where(valid,((np.einsum('ki,kij->kj',bary,tri)-point)**2).sum(1),np.inf)]
        for i,j in [(0,1),(1,2),(2,0)]:
            edge=tri[:,j]-tri[:,i]
            t=np.clip(((point-tri[:,i])*edge).sum(1)/np.maximum((edge*edge).sum(1),1e-20),0,1)
            w=np.zeros_like(bary);w[:,i]=1-t;w[:,j]=t
            choices.append(w);distances.append(((tri[:,i]+t[:,None]*edge-point)**2).sum(1))
        option,candidate=np.unravel_index(np.argmin(np.stack(distances)),(4,len(ids)))
        face=int(ids[candidate]);weights=choices[option][candidate]
        position=weights@self.tri[face];normal=unit(weights@self.normals[self.faces[face]])
        if np.dot(normal,position-np.array([.035,.90,-.025]))<0:normal=-normal
        return position,normal,face,weights


def strand_atlas(seed=61, continuous=False):
    """Procedural RGBA coverage data: 16 tiles, with individual tapered fibers.

    Alpha is the representation being tested; RGB is extended into empty
    texels to avoid black filtering fringes. This is not an edited photograph.
    """
    rng=np.random.default_rng(seed);size=1024;tile_w=128;tile_h=512
    rgba=np.empty((size,size,4),np.uint8);rgba[:,:,:3]=[73,49,35];rgba[:,:,3]=0
    for tile in range(16):
        mask=Image.new('L',(tile_w,tile_h));draw=ImageDraw.Draw(mask)
        for k in range(13):
            x=(k+.5)*tile_w/13+rng.uniform(-2,2);start=rng.uniform(.0,.025) if continuous else rng.uniform(.0,.17);end=rng.uniform(.94,.995) if continuous else rng.uniform(.76,.995)
            bend=rng.uniform(-9,9);wave=rng.uniform(-3,3)
            ts=np.linspace(start,end,110);local=(ts-start)/(end-start)
            xs=x+bend*local+wave*np.sin(local*np.pi)
            ys=(1-ts)*(tile_h-6)+3
            widths=.85+1.35*np.sin(np.pi*local)**.5
            # Both root and tip taper; per-strand starts avoid a straight edge.
            coverage=np.minimum(np.clip(local/.05,0,1),np.clip((1-local)/.12,0,1))
            for i in range(len(ts)-1):
                draw.line([(float(xs[i]),float(ys[i])),(float(xs[i+1]),float(ys[i+1]))],fill=int(255*coverage[i]),width=max(1,round(widths[i])))
        alpha=np.array(mask)
        x=(tile%8)*tile_w;y=(tile//8)*tile_h;rgba[y:y+tile_h,x:x+tile_w,3]=alpha
    image=Image.fromarray(rgba);buffer=io.BytesIO();image.save(buffer,format='PNG')
    return buffer.getvalue(),rgba


def make_patch(points,faces,normals,seam_count=959,seed=61):
    surface=SurfaceProjector(points,faces,normals)
    seam=points[:seam_count]
    angles=np.degrees(np.arctan2(seam[:,0]-.035,seam[:,2]+.025))
    guide_angles=np.linspace(-48,-3,70)
    guide=np.array([np.median(seam[np.argsort(abs(angles-angle))[:5]],axis=0) for angle in guide_angles])
    # Smooth scan-level boundary noise without moving any head vertex.
    guide=np.array([guide[max(0,i-2):min(len(guide),i+3)].mean(0) for i in range(len(guide))])
    rng=np.random.default_rng(seed);positions=[];ns=[];uvs=[];indices=[];bindings=[]
    for row,count in enumerate([16,23,31,39,46,52]):
        for k in range(count):
            fraction=(k+.5+rng.uniform(-.3,.3))/count
            # Sparse lateral fringe to prevent a vertical rectangular side.
            if rng.random()>min(1,fraction*12,(1-fraction)*12):continue
            location=fraction*(len(guide)-1);i=min(int(location),len(guide)-2)
            start=guide[i]*(1-(location-i))+guide[i+1]*(location-i)
            _,normal,_,_=surface.project(start)
            direction=unit(np.array([0,1.,-.15])-normal*np.dot(normal,[0,1.,-.15]))
            root,normal,face,bary=surface.project(start+direction*(row*.003+rng.uniform(.0002,.002)))
            tangent=unit(direction-normal*np.dot(normal,direction))
            width_axis=unit(np.cross(normal,tangent));length=rng.uniform(.027,.043)
            width=rng.uniform(.0032,.0052);tile=int(rng.integers(0,16));bend=rng.uniform(-.002,.002)
            base=len(positions)
            for t in np.linspace(0,1,9):
                # Reproject the support strip along the curved scalp, then
                # lift slightly; only the root carries the persistent binding.
                q=root+tangent*length*t+width_axis*bend*t*t
                q,qn,_,_=surface.project(q)
                center=q+qn*(.00018+.0018*np.sin(t*np.pi/2))
                local_width=width*(1-.35*t)
                for side in [-1,1]:
                    positions.append(center+width_axis*side*local_width/2);ns.append(qn)
                    u=(tile%8*128+2+(side+1)/2*124)/1024
                    v=(tile//8*512+509-t*506)/1024
                    uvs.append([u,v])
            for j in range(8):
                a=base+j*2;indices.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
            bindings.append({'triangle':face,'barycentric':bary.tolist(),'root':root.tolist(),'firstVertex':base})
    p=np.asarray(positions);n=np.asarray(ns);f=np.asarray(indices,int)
    # Consistent front-facing winding relative to the authored scalp normals.
    tri=p[f];flip=(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])*n[f].mean(axis=1)).sum(1)<0
    f[flip]=f[flip][:,[0,2,1]]
    return p,n,np.asarray(uvs),f,bindings
