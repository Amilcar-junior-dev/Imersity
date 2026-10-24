"""Single-view assisted guides. No learned image-to-hair model is trained here."""
from collections import deque
import numpy as np
from .hairline import SurfaceProjector,unit
from .hair_sections import combine

# Approximate eye centers annotated in the reference and the captured mesh.
# This weak-perspective normalization is for an exploratory comparison only.
PHOTO_EYES=np.array([[1075.,2010.],[1536.,2008.]])
NATIVE_EYES=np.array([[-.055,.878],[.082,.879]])
# Cubic flow guides annotated from the frontal reference, in original pixels.
PHOTO_GUIDES=np.array([
 [[900,1830],[835,1640],[860,1460],[1020,1380]],
 [[970,1620],[945,1440],[985,1250],[1130,1210]],
 [[1100,1540],[1090,1350],[1110,1225],[1210,1185]],
 [[1300,1500],[1290,1330],[1220,1210],[1280,1180]],
 [[1490,1500],[1510,1320],[1430,1205],[1370,1200]],
 [[1650,1570],[1690,1420],[1610,1290],[1510,1260]],
 [[1740,1850],[1770,1620],[1720,1440],[1630,1350]]
],float)

def normalization():
    scale=np.linalg.norm(NATIVE_EYES[1]-NATIVE_EYES[0])/np.linalg.norm(PHOTO_EYES[1]-PHOTO_EYES[0])
    return scale,PHOTO_EYES.mean(0),NATIVE_EYES.mean(0)

def photo_to_native(points):
    scale,origin,target=normalization();q=(np.asarray(points)-origin)*scale
    return q*np.array([1,-1])+target

def native_to_photo(points):
    scale,origin,target=normalization();return (np.asarray(points)[...,:2]-target)*np.array([1,-1])/scale+origin

def hair_mask(image):
    """Dark connected region in an explicitly selected hair ROI; not general segmentation."""
    x0,y0,x1,y1=650,1020,1840,1980;step=4
    rgb=np.asarray(image)[y0:y1:step,x0:x1:step,:3].astype(float)
    lum=rgb@np.array([.2126,.7152,.0722]);mask=lum<115
    # Largest connected component separates the bulk hair from eyebrows/eyes.
    seen=np.zeros_like(mask);best=[]
    for y,x in zip(*np.nonzero(mask)):
        if seen[y,x]:continue
        queue=deque([(y,x)]);seen[y,x]=True;component=[]
        while queue:
            yy,xx=queue.popleft();component.append((yy,xx))
            for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
                a,b=yy+dy,xx+dx
                if 0<=a<mask.shape[0] and 0<=b<mask.shape[1] and mask[a,b] and not seen[a,b]:seen[a,b]=True;queue.append((a,b))
        if len(component)>len(best):best=component
    result=np.zeros_like(mask)
    if not best:raise ValueError('Sem região de cabelo no recorte de referência.')
    yy,xx=np.array(best).T;result[yy,xx]=True
    color=np.median(rgb[result],axis=0).astype(int)
    top=[]
    for x in range(result.shape[1]):
        ys=np.flatnonzero(result[:,x])
        if len(ys)>=4:top.append([x0+x*step,y0+int(ys[0])*step])
    return result,{'roi':[x0,y0,x1,y1],'step':step,'pixelCount':len(best),'thresholdLuminance':115,'boundingBox':[int(x0+xx.min()*step),int(y0+yy.min()*step),int(x0+xx.max()*step),int(y0+yy.max()*step)],'topContour':top,'sampledColorRGB':color.tolist()}

def make_photo_groom(points,faces,normals,top_contour=None,seed=127):
    surface=SurfaceProjector(points,faces,normals);seam=points[:959]
    angles=np.degrees(np.arctan2(seam[:,0]-.035,seam[:,2]+.025))
    authored=PHOTO_GUIDES.copy()
    if top_contour is not None:
        contour=np.asarray(top_contour,float)
        for curve in authored:
            nearest=np.argsort(abs(contour[:,0]-curve[-1,0]))[:9]
            target_y=float(np.median(contour[nearest,1]))
            curve[-1,1]=target_y+12
            curve[-2,1]=max(curve[-2,1],target_y+25)
    guides=photo_to_native(authored);rng=np.random.default_rng(seed)
    parts=[];bindings=[];station_count=25
    for row,count in enumerate([45,55,65,75,85,90,95,100]):
        for k in range(count):
            u=(k+.5+rng.uniform(-.3,.3))/count
            if rng.random()>min(1,u*18,(1-u)*18):continue
            angle=-69+138*u
            start=np.median(seam[np.argsort(abs(angles-angle))[:7]],axis=0)
            # Rows extend over the crown, not just one hairline strip.
            start[1]+=row*.005+rng.uniform(0,.0025)
            root,normal,face,bary=surface.project(start)
            a=min(int(u*(len(guides)-1)),len(guides)-2);f=u*(len(guides)-1)-a
            guide=guides[a]*(1-f)+guides[a+1]*f
            guide=guide.copy();guide[1:,0]+=rng.uniform(-.004,.004)
            guide[1:,1]+=rng.uniform(-.003,.003)+row*.0012
            width=rng.uniform(.0045,.010);tile=int(rng.integers(0,16));p=[];n=[];uv=[];tri=[];centers=[]
            for t in np.linspace(0,1,station_count):
                xy=(1-t)**3*guide[0]+3*(1-t)**2*t*guide[1]+3*(1-t)*t*t*guide[2]+t**3*guide[3]
                xy+=(root[:2]-guide[0])*(1-t)**2
                z=root[2]-.105*t+.025*np.sin(np.pi*t)+row*.001*np.sin(np.pi*t)
                q=np.r_[xy,z]
                # Scalp clearance prior; points outside the ellipsoid are left
                # on their photo guide. This is not a global collision solver.
                ell=((q-np.array([.035,.90,-.025]))/np.array([.16,.225,.18]))
                if t and np.dot(ell,ell)<1.015:
                    near,no,_,_=surface.project(q);q=near+no*(.0015+.005*np.sin(np.pi*t))
                if not t:q=root+normal*.00045
                centers.append(q)
            centers=np.array(centers);tangent=unit(np.gradient(centers,axis=0))
            axis=np.array([1.,0,0])
            for j,t in enumerate(np.linspace(0,1,station_count)):
                axis=unit(axis-tangent[j]*np.dot(axis,tangent[j]));nn=unit(np.cross(axis,tangent[j]))
                w=width*(.38+.62*np.sin(np.pi*t*.8))*(1-.78*t**5)
                for side in [-1,1]:
                    p.append(centers[j]+axis*side*w/2);n.append(nn);uv.append([(tile%8*128+2+(side+1)/2*124)/1024,(tile//8*512+509-t*506)/1024])
                if j:
                    b=j*2-2;tri.extend([[b,b+1,b+2],[b+1,b+3,b+2]])
            parts.append((np.array(p),np.array(n),np.array(uv),np.array(tri,int)))
            bindings.append({'triangle':face,'barycentric':bary.tolist(),'root':root.tolist(),'firstVertex':(len(bindings))*station_count*2,'row':row})
    return combine(parts),bindings
