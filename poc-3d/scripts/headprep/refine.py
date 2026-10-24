"""Texture-reviewed annotations for this scan only; not semantic hair segmentation.

The per-side guides were traced on the source's textured profiles. We replace
marked residual triangles with an estimated, faired surface using their existing
connectivity. Observed skin and protected ear triangles remain fixed.
"""
import numpy as np
from .geometry import vertex_normals

GUIDE_Z=[-.22,-.16,-.12,-.10,-.08,-.06,-.04,-.02,0,.02,.04,.06,.08,.10,.12,.14,.16,.20]
GUIDE_PLUS=[.745,.75,.77,.78,.81,.85,.87,.88,.88,.87,.85,.82,.86,.91,.94,.95,.98,1.04]
GUIDE_MINUS=[.745,.75,.77,.79,.82,.85,.895,.875,.855,.84,.825,.83,.865,.90,.93,.94,.97,1.04]
EAR_PLUS=[(-.065,.825),(-.062,.875),(-.042,.91),(-.018,.925),(.002,.925),(.023,.91),(.040,.884),(.037,.859),(.022,.842),(.030,.83),(.013,.805),(-.006,.792),(-.03,.795),(-.05,.808)]
EAR_MINUS=[(-.113,.83),(-.11,.872),(-.09,.895),(-.068,.911),(-.045,.91),(-.022,.89),(-.01,.866),(-.02,.845),(-.03,.832),(-.022,.822),(-.044,.795),(-.068,.784),(-.09,.79),(-.106,.807)]

def protected_vertices(points):
    # Scan coordinates are offset from x=0. This excludes lateral hair from the
    # old broad box while retaining the central eyes/nose/mouth region.
    return (np.abs(points[...,0]-.035)<=.105)&(points[...,2]>=.12)&(points[...,1]<=.94)&(points[...,1]>=.62)

def inside_polygon(coords,polygon):
    x,y=np.asarray(coords).T;result=np.zeros(len(coords),dtype=bool)
    for a,b in zip(polygon,polygon[1:]+polygon[:1]):
        if a[1]==b[1]:continue
        result^=((a[1]>y)!=(b[1]>y))&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])
    return result

def residual_annotation(retained,image):
    c=retained[:,:,:3].mean(axis=1);x,y,z=c.T
    uv=retained[:,:,6:8].reshape(-1,2)
    px=np.clip(uv[:,0]*image.shape[1],0,image.shape[1]-1).astype(int)
    py=np.clip((1-uv[:,1])*image.shape[0],0,image.shape[0]-1).astype(int)
    rgb=image[py,px].reshape(-1,3,3).mean(axis=1)/255
    warm=(rgb[:,0]-rgb[:,1])/np.maximum(rgb[:,0]+rgb[:,1],.01)
    skin=(warm>.11)&(rgb.mean(axis=1)>.28)
    # Color is consulted only within hand-reviewed ear polygons. It never
    # decides whether an arbitrary dark area of the face is hair.
    ear=(inside_polygon(c[:,[2,1]],EAR_PLUS)&(x>.19))|(inside_polygon(c[:,[2,1]],EAR_MINUS)&(x<-.115))
    ear &= (y<.875)|skin
    line=np.where(x>.035,np.interp(z,GUIDE_Z,GUIDE_PLUS),np.interp(z,GUIDE_Z,GUIDE_MINUS))
    marked=((x>.14)|(x<-.075))&(y>line)&(z<.18)&(y>.73)&~ear
    protected=protected_vertices(retained[:,:,:3]).any(axis=1)
    marked &= ~protected
    return marked,ear

def fair_estimated_surface(points,faces,estimated,fixed_vertices=None,iterations=50,max_displacement=.012):
    """Regularized local fairing, pinning every vertex adjacent to observed skin.

    Keeping the original connectivity avoids cracks around the ears. This does
    not infer real hidden anatomy, recover detail, or remesh observed triangles.
    """
    points=np.asarray(points,dtype=float);faces=np.asarray(faces,dtype=int);estimated=np.asarray(estimated,dtype=bool)
    total=np.bincount(faces.ravel(),minlength=len(points))
    inferred=np.bincount(faces[estimated].ravel(),minlength=len(points))
    free=(total>0)&(total==inferred)
    if fixed_vertices is not None:free &= ~fixed_vertices
    edges=np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]);edges=np.unique(np.sort(edges,axis=1),axis=0)
    a,b=edges.T;degree=np.bincount(edges.ravel(),minlength=len(points));out=points.copy()
    for _ in range(iterations):
        sums=np.zeros_like(points)
        for axis in range(3):
            sums[:,axis]=np.bincount(a,weights=out[b,axis],minlength=len(points))+np.bincount(b,weights=out[a,axis],minlength=len(points))
        average=sums/np.maximum(degree[:,None],1)
        candidate=out+.45*(average-out)+.08*(points-out)
        delta=candidate-points;length=np.linalg.norm(delta,axis=1)
        candidate=points+delta*np.minimum(1,max_displacement/np.maximum(length,1e-12))[:,None]
        out[free]=candidate[free]
    return out,free

def refine_surface(retained,cap,cap_faces,image,protect_ears=False):
    marked,ears=residual_annotation(retained,image)
    if protect_ears:
        from .ears import ear_faces
        ears=ear_faces(retained[:,:,:3])
        marked &= ~ears
    # Weld only coordinate matches at the original scalp seam. Mesh attributes
    # are kept per corner, so observed texture seams are never collapsed.
    corners=np.concatenate([retained[:,:,:3].reshape(-1,3),cap])
    _,first,inverse=np.unique(np.rint(corners/1e-7).astype(np.int64),axis=0,return_index=True,return_inverse=True)
    points=corners[first];scan_faces=inverse[:len(retained)*3].reshape(-1,3);cap_ids=inverse[len(retained)*3:]
    faces=np.concatenate([scan_faces,cap_ids[cap_faces]])
    estimated=np.r_[marked,np.ones(len(cap_faces),dtype=bool)]
    # Remove isolated diagnostic specks inside an ear: replacements must touch
    # the scalp estimate through marked surface vertices.
    reachable=np.zeros(len(points),dtype=bool);reachable[np.unique(cap_ids)]=True
    for _ in range(100):
        connected=marked&reachable[scan_faces].any(axis=1)
        previous=int(reachable.sum());reachable[np.unique(scan_faces[connected])]=True
        if int(reachable.sum())==previous:break
    marked &= reachable[scan_faces].any(axis=1);estimated[:len(retained)]=marked
    fixed=protected_vertices(points)
    fixed[np.unique(scan_faces[ears])]=True
    out,free=fair_estimated_surface(points,faces,estimated,fixed)
    if protect_ears:
        # Move inferred vertices only: the posterior rim stays on the native
        # observed ear, while the scalp retreats to its medial/root side.
        weight=np.clip((.975-out[:,1])/.045,0,1)*np.clip((out[:,1]-.755)/.035,0,1)*np.clip((.075-out[:,2])/.04,0,1)
        target=np.clip(out[:,0],-.108,.178)
        out[free,0]+=(target[free]-out[free,0])*weight[free]
    result=retained.copy();result[marked,:,:3]=out[scan_faces[marked]]
    normals=vertex_normals(out,faces)
    result[marked,:,3:6]=normals[scan_faces[marked]]
    # Every observed triangle must remain exactly unchanged, including normals/UV.
    assert np.array_equal(result[~marked],retained[~marked])
    assert not np.any(marked&protected_vertices(retained[:,:,:3]).any(axis=1))
    assert np.array_equal(result[ears],retained[ears])
    delta=np.linalg.norm(out-points,axis=1)
    stats={'revision':'texture-guided-temples-v2','textureGuidedAssistedContours':True,'automaticHairSegmentation':False,'replacementUsesOriginalConnectivity':True,'residualTrianglesReplaced':int(marked.sum()),'protectedEarTriangles':int(ears.sum()),'movedEstimatedVertices':int((delta>1e-10).sum()),'maxNativeDisplacement':float(delta.max()),'observedAttributesUnchanged':True,'protectedEarAttributesUnchanged':True,'perSideGuideZ':GUIDE_Z,'perSideGuideYPlus':GUIDE_PLUS,'perSideGuideYMinus':GUIDE_MINUS}
    return result,marked,out[cap_ids],normals[cap_ids],stats
