"""Assisted partial side lock: identical roots, interchangeable arc-length cuts."""
import numpy as np
from .hairline import unit

LENGTHS={'lock_short':.065,'lock_medium':.17,'lock_long':.32}

def lock_curve(root_strip, length, stations=41):
    centers=root_strip.reshape(9,2,3).mean(1)
    start=centers[-1];tangent=unit(start-centers[-2])
    # A common guide bends outward before descending beside the ear. These
    # controls are specific to Junior's native coordinates, not automatic fit.
    controls=np.array([start,start+tangent*.025,
                       [-.235,start[1]+.02,start[2]-.025],
                       [-.225,start[1]-.39,-.025]])
    t=np.linspace(0,1,1001)[:,None]
    dense=(1-t)**3*controls[0]+3*(1-t)**2*t*controls[1]+3*(1-t)*t*t*controls[2]+t**3*controls[3]
    arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(dense,axis=0),axis=1))]
    distances=np.linspace(0,length,stations)
    return np.stack([np.interp(distances,arc,dense[:,j]) for j in range(3)],axis=1)

def body_ribbon(root_strip, root_uv, length):
    centers=lock_curve(root_strip,length)
    tangent=unit(np.gradient(centers,axis=0));axis=unit(root_strip[-1]-root_strip[-2])
    initial_width=np.linalg.norm(root_strip[-1]-root_strip[-2]);p=[];n=[];uv=[];f=[]
    tile=int(np.floor(root_uv[0,0]*8))+8*int(np.floor(root_uv[0,1]*2))
    for j,(center,direction) in enumerate(zip(centers,tangent)):
        # Parallel transport avoids uncontrolled twisting along the curl.
        axis=unit(axis-direction*np.dot(axis,direction)) if j else axis
        normal=unit(np.cross(axis,direction));phase=j/(len(centers)-1)
        width=initial_width*(1-.80*phase**2)
        for k,side in enumerate([-1,1]):
            p.append(center+side*axis*width/2);n.append(normal)
            uv.append([(tile%8*128+2+k*124)/1024,(tile//8*512+509-(.35+.65*phase)*506)/1024])
        if j:
            a=2*(j-1);f.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
    return np.array(p),np.array(n),np.array(uv),np.array(f,int)

def combine(parts):
    arrays=[[],[],[],[]];offset=0
    for p,n,uv,f in parts:
        for dst,src in zip(arrays,[p,n,uv,f+offset]):dst.append(src)
        offset+=len(p)
    return tuple(np.concatenate(a) for a in arrays)
