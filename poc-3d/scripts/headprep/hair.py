"""Procedural reference silhouettes, not realistic haircut assets."""
import numpy as np
from .geometry import scalp_patch,vertex_normals,orient_outward

def short_reference(boundary):
    p,f,n=scalp_patch(boundary[::4],rings=20)
    theta=np.arctan2(p[:,0],p[:,2]+.015)
    thickness=.007+.002*np.sin(theta*42)**2
    p=p+n*thickness[:,None]
    return p,f,vertex_normals(p,f)

def bob_reference(boundary):
    cap,f,n=short_reference(boundary)
    theta=np.linspace(np.deg2rad(48),np.deg2rad(312),180)
    rows=30;vertices=[]
    for t in np.linspace(0,1,rows):
        r=.18+.035*t+.003*np.sin(theta*36)
        y=(.99-.045*np.abs(np.sin(theta)))*(1-t)+(.59+.012*np.sin(theta*4))*t
        vertices.extend(np.column_stack([r*np.sin(theta),y,-.015+r*1.08*np.cos(theta)]))
    skirt=np.array(vertices);sf=[]
    for k in range(rows-1):
        for j in range(len(theta)-1):
            a=k*len(theta)+j;b=a+1;c=a+len(theta);d=c+1;sf.extend([[a,b,c],[b,d,c]])
    sf=np.array(sf);orient_outward(skirt,sf)
    points=np.concatenate([cap,skirt]);faces=np.concatenate([f,sf+len(cap)])
    return points,faces,vertex_normals(points,faces)
