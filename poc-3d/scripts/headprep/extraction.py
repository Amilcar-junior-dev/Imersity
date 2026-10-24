"""Assisted extraction/fit profile for the first fal/Meshy candidate only."""
import numpy as np

def hair_scores(points,rgb):
    unique,inverse=np.unique(np.round(points,5),axis=0,return_inverse=True)
    count=np.bincount(inverse,minlength=len(unique));brightness=np.bincount(inverse,weights=rgb.mean(axis=1),minlength=len(unique))/np.maximum(count,1)
    theta=np.abs(np.degrees(np.arctan2(points[:,0]-.015,points[:,2]+.06)))
    floor=np.interp(theta,[0,30,50,70,90,110,130,155,180],[.015,.005,-.045,-.16,-.30,-.55,-.68,-.70,-.70])
    return np.minimum(points[:,1]-floor,np.where(points[:,1]>.20,.5,.47-brightness[inverse]))

def crown_components(triangles):
    _,inv=np.unique(np.round(triangles.reshape(-1,3),4),axis=0,return_inverse=True)
    faces=inv.reshape(-1,3);parent=np.arange(inv.max()+1)
    def root(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for tri in faces:
        a=root(tri[0])
        for b in tri[1:]:parent[root(b)]=a
    labels=np.array([root(t[0]) for t in faces]);ids,counts=np.unique(labels,return_counts=True)
    accepted=[]
    for label,count in zip(ids,counts):
        if count>=8 and triangles[labels==label,:,1].max()>.20:accepted.append(label)
    keep=np.isin(labels,accepted)
    if not keep.any():raise ValueError('Nenhuma componente ligada ao cabelo superior foi encontrada.')
    return keep,{'componentsBeforeCleanup':len(ids),'componentsKept':len(accepted),'discardedTriangles':int((~keep).sum())}

def fit_hair(points,normals):
    scale=np.array([.30,.30,.285]);translation=np.array([.035,.92,.015])
    p=points*scale+translation;n=normals/scale
    # Conservative initial clearance against an estimated cranium. This does
    # not prove collision-free fit against the full scanned mesh or ears.
    center=np.array([.035,.90,-.025]);radii=np.array([.164,.23,.184])
    relative=(p-center)/radii;radius=np.linalg.norm(relative,axis=1);inside=radius<1.015
    before=p.copy();p[inside]=center+(p[inside]-center)*(1.015/np.maximum(radius[inside],1e-12))[:,None]
    n/=np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-12)
    return p,n,{'initialNativeScale':scale.tolist(),'initialNativeTranslation':translation.tolist(),'estimatedCraniumClearanceVertices':int(inside.sum()),'maximumClearanceAdjustment':float(np.linalg.norm(p-before,axis=1).max()),'collisionFreeFitValidated':False}

def mold_hair(points,normals):
    """Smooth, subject-specific peripheral extension; never alters the head.

    The upper crown and central fringe are pinned. UVs remain attached to the
    same vertices, so substantial stretching can still reveal texture limits.
    Ear clearance must be applied after this deformation.
    """
    def smooth(t):
        t=np.clip(t,0,1);return t*t*(3-2*t)
    def deform(p):
        angle=np.abs(np.degrees(np.arctan2(p[:,0]-.035,p[:,2]+.025)))
        # Smooth angular windows: temples, then back/nape. These are fitted to
        # this scan, not facial landmarks inferred for an arbitrary customer.
        temple=smooth((angle-30)/20)*(1-smooth((angle-78)/22))
        rear=smooth((angle-100)/30)
        peripheral=smooth((1.12-p[:,1])/.20)
        out=p.copy();out[:,1]-=(.085*temple+.065*rear)*peripheral
        # Bring the temporal roots slightly forward instead of uniformly
        # enlarging the whole wig and moving the crown away from the scalp.
        out[:,2]+=.018*temple*peripheral
        # Follow the wider lower cross-sections of the estimated cranium.
        # A vertical stretch alone can push a formerly clear surface into
        # the scalp. Preserve its radial offset as the cross-section grows.
        before=np.sqrt(np.maximum(1-((p[:,1]-.90)/.23)**2,0))
        after=np.sqrt(np.maximum(1-((out[:,1]-.90)/.23)**2,0))
        radial=p[:,[0,2]]-np.array([.035,-.025])
        radius=np.linalg.norm(radial/np.array([.164,.184]),axis=1)
        out[:,[0,2]]+=radial*(np.maximum(after-before,0)/np.maximum(radius,1e-8))[:,None]
        return out
    fitted=deform(points)
    # Transport the source normals through the non-uniform deformation. This
    # preserves authored detail instead of smoothing across the UV seams.
    step=1e-5;jac=np.empty((len(points),3,3))
    for axis in range(3):
        delta=np.zeros(3);delta[axis]=step
        jac[:,:,axis]=(deform(points+delta)-deform(points-delta))/(2*step)
    determinant=np.linalg.det(jac)
    if not np.isfinite(determinant).all() or determinant.min()<=0:raise ValueError('Deformação local com inversão de orientação.')
    fitted_normals=np.linalg.solve(jac.transpose(0,2,1),normals[...,None])[...,0]
    fitted_normals/=np.maximum(np.linalg.norm(fitted_normals,axis=1)[:,None],1e-12)
    displacement=np.linalg.norm(fitted-points,axis=1)
    return fitted,fitted_normals,{'revision':'regional-fit-v2','subjectSpecific':True,'automaticFitValidated':False,'crownPinnedAboveNativeY':1.12,'maximumRegionalDisplacementNative':float(displacement.max()),'verticesMoved':int((displacement>1e-6).sum()),'minimumDeformationJacobian':float(determinant.min()),'textureRegenerated':False,'earClearanceMarginNative':.004}

