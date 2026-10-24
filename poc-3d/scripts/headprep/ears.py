"""Subject-specific ear contours reviewed on the original textured scan."""
import numpy as np
from .refine import inside_polygon

# (z,y), with each side traced independently. Includes the posterior helix.
EAR_PLUS_V3=[(-.082,.865),(-.075,.89),(-.058,.911),(-.038,.924),(-.022,.922),(-.007,.91),(.005,.888),(.008,.863),(.013,.835),(.006,.815),(-.008,.802),(-.035,.795),(-.058,.806),(-.075,.825)]
EAR_MINUS_V3=[(-.112,.855),(-.104,.88),(-.087,.90),(-.069,.91),(-.054,.905),(-.038,.892),(-.026,.872),(-.025,.852),(-.027,.825),(-.035,.801),(-.056,.785),(-.079,.787),(-.099,.803),(-.111,.83)]

def polygon_distance(coords,polygon):
    distance=np.full(len(coords),np.inf)
    for a,b in zip(polygon,polygon[1:]+polygon[:1]):
        a=np.array(a);b=np.array(b);v=b-a
        t=np.clip(((coords-a)*v).sum(axis=1)/(v@v),0,1)
        distance=np.minimum(distance,np.linalg.norm(coords-(a+t[:,None]*v),axis=1))
    return np.where(inside_polygon(coords,polygon),-distance,distance)

def ear_field(points,margin=.004):
    x=points[:,0];zy=points[:,[2,1]]
    # Upper helix is lateral to the scalp. A height-dependent depth limit
    # avoids preserving a tuft of head hair above the ear as if it were skin.
    plus_depth=np.interp(points[:,1],[.78,.86,.90,.925],[.172,.185,.195,.198])
    minus_depth=np.interp(points[:,1],[.78,.86,.895,.915],[-.103,-.12,-.137,-.139])
    plus=np.maximum(polygon_distance(zy,EAR_PLUS_V3)-margin,plus_depth-x)
    minus=np.maximum(polygon_distance(zy,EAR_MINUS_V3)-margin,x-minus_depth)
    return np.minimum(plus,minus)

def ear_faces(triangles):
    # A triangle touching the marked ear stays observed. UV/dark ear cavities
    # do not affect protection: the entire anatomical contour is retained.
    points=triangles.reshape(-1,3)
    return (ear_field(points,margin=.002)<=0).reshape(-1,3).any(axis=1)

def recess_scalp(cap,seam_count):
    """Keep the inferred scalp medial to the ear silhouettes, preserving seam."""
    p=cap.copy();y=p[:,1]
    # Narrow lower temporal/basal scalp; fade smoothly above the helix.
    w=np.clip((.975-y)/.045,0,1);w=w*w*(3-2*w)
    lower=np.clip((y-.745)/.035,0,1);lower=lower*lower*(3-2*lower)
    rear=np.clip((.07-p[:,2])/.055,0,1);rear=rear*rear*(3-2*rear)
    weight=w*lower*rear
    target=np.clip(p[:,0],-.103,.172)
    p[:,0]+=(target-p[:,0])*weight
    p[:seam_count]=cap[:seam_count]
    return p
