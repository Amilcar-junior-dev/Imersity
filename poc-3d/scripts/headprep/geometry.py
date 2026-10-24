"""Assisted, subject-specific scalp preparation; never automatic hair segmentation."""
import numpy as np

# Coordinates belong to the recorded source reconstruction, not physical metres.
HAIRLINE_ANGLES = [0,25,35,45,55,65,78,95,105,118,135,180]
HAIRLINE_HEIGHTS = [1.025,1.01,.98,.965,.91,.875,.92,.925,.89,.76,.715,.715]
CENTER_XZ = np.array([0.,-.015])

def hairline_value(points):
    angle=np.abs(np.degrees(np.arctan2(points[...,0],points[...,2]+.015)))
    return points[...,1]-np.interp(angle,HAIRLINE_ANGLES,HAIRLINE_HEIGHTS)

def clip_mesh(points,faces,uvs,normals,minimum_y=.55,values=None):
    """Clip crown and lower bust; retain complete protected triangles byte for byte."""
    values=hairline_value(points) if values is None else np.asarray(values)
    valid=(values[faces]<=0).all(axis=1)&(points[faces][:,:,1]>=minimum_y).all(axis=1)
    rejected=(values[faces]>0).all(axis=1)|(points[faces][:,:,1]<minimum_y).all(axis=1)
    retained=[np.concatenate([points[faces[valid]],normals[faces[valid]],uvs[valid]],axis=2)]
    seam=[]
    for fi in np.flatnonzero(~valid&~rejected):
        ids=faces[fi];poly=[np.concatenate([points[v],normals[v],uvs[fi,k]]) for k,v in enumerate(ids)]
        scalars=[values[v] for v in ids]
        cut=[];crossings=[]
        for k,a in enumerate(poly):
            b=poly[(k+1)%3];sa=scalars[k];sb=scalars[(k+1)%3]
            if sa<=0:cut.append(a)
            if (sa<0<sb) or (sb<0<sa):
                t=sa/(sa-sb);new=a+(b-a)*t;cut.append(new);crossings.append(new[:3])
        if len(crossings)==2:seam.append(crossings)
        # A separate cut at the lower bust is deliberately not scalp completion.
        clipped=[]
        for k,a in enumerate(cut):
            b=cut[(k+1)%len(cut)]
            if a[1]>=minimum_y:clipped.append(a)
            if (a[1]<minimum_y<b[1]) or (b[1]<minimum_y<a[1]):
                clipped.append(a+(b-a)*((minimum_y-a[1])/(b[1]-a[1])))
        if len(clipped)>=3:
            retained.append(np.array([[clipped[0],clipped[k],clipped[k+1]] for k in range(1,len(clipped)-1)]))
    result=np.concatenate(retained,axis=0)
    return result,np.array(seam),valid

def boundary_loops(segments,tolerance=1e-6):
    def key(p):return tuple(np.rint(p/tolerance).astype(np.int64))
    lookup={};adj={}
    for a,b in segments:
        ka,kb=key(a),key(b)
        if ka==kb:continue
        lookup.setdefault(ka,a);lookup.setdefault(kb,b)
        adj.setdefault(ka,set()).add(kb);adj.setdefault(kb,set()).add(ka)
    invalid=[k for k,v in adj.items() if len(v)!=2]
    if invalid:raise ValueError(f'Linha de recorte não fechada: {len(invalid)} pontos com grau diferente de 2.')
    remaining=set(adj);loops=[]
    while remaining:
        start=next(iter(remaining));current=start;previous=None;loop=[]
        while True:
            loop.append(lookup[current]);remaining.discard(current)
            nxt=next(n for n in adj[current] if n!=previous)
            previous,current=current,nxt
            if current==start:break
            if current not in remaining:raise ValueError('Linha de recorte cruza outra região.')
        loops.append(np.array(loop))
    return sorted(loops,key=len,reverse=True)

def scalp_patch(boundary,top=1.125,rings=32,center_xz=None,radii_xz=None,regularize_angles=False):
    """Close the actual seam using an explicitly estimated smooth cranial dome."""
    count=len(boundary);vertices=[]
    center_xz=CENTER_XZ if center_xz is None else np.asarray(center_xz)
    radii_xz=[.175,.19] if radii_xz is None else radii_xz
    center=np.array([center_xz[0],.90,center_xz[1]]);radii=np.array([radii_xz[0],top-.90,radii_xz[1]])
    theta=np.arctan2(boundary[:,0]-center[0],boundary[:,2]-center[2])
    if regularize_angles:
        # The seam can double back around an ear. Project its angle sequence
        # onto a monotone winding so inner rings do not fold into long ribbons.
        raw=np.unwrap(theta);direction=1 if raw[-1]>raw[0] else -1
        values=(raw-raw[0])*direction;blocks=[]
        for i,value in enumerate(values):
            blocks.append([float(value),1,i,i+1])
            while len(blocks)>1 and blocks[-2][0]>blocks[-1][0]:
                b=blocks.pop();a=blocks.pop();weight=a[1]+b[1]
                blocks.append([(a[0]*a[1]+b[0]*b[1])/weight,weight,a[2],b[3]])
        monotone=np.empty(count)
        for value,weight,start,end in blocks:monotone[start:end]=value
        monotone-=monotone[0]
        span=2*np.pi*(count-1)/count
        monotone*=span/max(monotone[-1],1e-12)
        monotone=.95*monotone+.05*np.linspace(0,span,count)
        theta=raw[0]+direction*monotone
    latitude=np.arcsin(np.clip((boundary[:,1]-center[1])/radii[1],-.95,.95))
    def on_ellipsoid(lat):
        return center+np.column_stack([radii[0]*np.sin(theta)*np.cos(lat),radii[1]*np.sin(lat),radii[2]*np.cos(theta)*np.cos(lat)])
    correction=boundary-on_ellipsoid(latitude)
    for t in np.linspace(0,1,rings,endpoint=False):
        lat=latitude+(np.pi/2-latitude)*t
        row=on_ellipsoid(lat)+correction*(max(0,1-t*3)**3)
        if t==0:row=boundary.copy()
        vertices.extend(row)
    vertices.append([center[0],top,center[2]]);vertices=np.array(vertices)
    faces=[]
    for ring in range(rings-1):
        for j in range(count):
            k=(j+1)%count;a=ring*count+j;b=ring*count+k;c=(ring+1)*count+j;d=(ring+1)*count+k
            faces.extend([[a,b,c],[b,d,c]])
    pole=len(vertices)-1
    for j in range(count):faces.append([(rings-1)*count+j,(rings-1)*count+(j+1)%count,pole])
    faces=np.array(faces);orient_outward(vertices,faces)
    return vertices,faces,vertex_normals(vertices,faces)

def orient_outward(points,faces):
    tri=points[faces];normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);cent=tri.mean(axis=1)
    ref=cent-np.array([0,.90,-.015]);flip=(normal*ref).sum(axis=1)<0
    faces[flip]=faces[flip][:,[0,2,1]]

def vertex_normals(points,faces):
    tri=points[faces];area=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal=np.zeros_like(points)
    for k in range(3):np.add.at(normal,faces[:,k],area)
    return normal/np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
