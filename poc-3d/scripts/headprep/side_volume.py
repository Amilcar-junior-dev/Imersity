"""Assisted layered side groom on the estimated scalp, in native coordinates."""
import numpy as np
from .hairline import SurfaceProjector,unit
from .hair_sections import combine


def make_side_volume(points,faces,normals,seed=114):
    surface=SurfaceProjector(points,faces,normals)
    seam=points[:959];angles=np.degrees(np.arctan2(seam[:,0]-.035,seam[:,2]+.025))
    rng=np.random.default_rng(seed);roots=[];flat=[];volume=[];bindings=[]
    stations=25;root_stations=4
    for row,count in enumerate([42,52,62,72,82,90,96]):
        for k in range(count):
            fraction=(k+.5+rng.uniform(-.35,.35))/count
            if rng.random()>min(1,fraction*20,(1-fraction)*20):continue
            angle=-113+83*fraction
            start=np.median(seam[np.argsort(abs(angles-angle))[:7]],axis=0)
            # This experiment occupies the upper lateral region, leaving the
            # ear visible. It does not reconstruct a measured scalp/hairline.
            start[1]=max(start[1],.915)+row*.006+rng.uniform(.0003,.0045)
            root,normal,face,bary=surface.project(start)
            theta=np.arctan2(root[0]-.035,root[2]+.025)
            sweep=np.deg2rad(rng.uniform(38,73));rise=rng.uniform(.018,.043)
            lift=rng.uniform(.010,.029)*(1+.25*row/6)
            width=rng.uniform(.007,.013);root_width=rng.uniform(.0018,.0036)
            tile=int(rng.integers(0,16));twist=rng.uniform(-.23,.23)
            base=[];ns=[];ts=np.linspace(0,1,stations);fall=rng.uniform(.018,.070)
            for t in ts:
                a=theta-sweep*t
                y=min(1.111,root[1]+rise*np.sin(np.pi*t*.92)-fall*t)
                radius=np.sqrt(max(.025,1-((y-.90)/.225)**2))
                desired=np.array([.035+.16*radius*np.sin(a),y,-.025+.18*radius*np.cos(a)])
                q,qn,_,_=surface.project(desired) if t else (root,normal,None,None)
                base.append(q);ns.append(qn)
            base=np.array(base);ns=np.array(ns);tangents=unit(np.gradient(base,axis=0))
            positions={'flat':[],'volume':[]};ribbon_normals=[];uv=[];indices=[]
            for j,t in enumerate(ts):
                tangent=unit(tangents[j]-ns[j]*np.dot(ns[j],tangents[j]))
                axis=unit(np.cross(ns[j],tangent))
                # The first four stations are identical in the two versions.
                growth=np.clip((t-ts[root_stations-1])/(1-ts[root_stations-1]),0,1)
                bulge=lift*np.sin(np.pi*growth*.84)**.8
                local_width=(root_width+(width-root_width)*np.sin(np.pi*t*.8)**.7)*(1-.80*t**5)
                axis=unit(axis*np.cos(twist*t)+ns[j]*np.sin(twist*t))
                for side in [-1,1]:
                    for name,offset in [('flat',.00045),('volume',.00045+bulge)]:
                        positions[name].append(base[j]+ns[j]*offset+axis*side*local_width/2)
                    ribbon_normals.append(ns[j]);uv.append([(tile%8*128+2+(side+1)/2*124)/1024,(tile//8*512+509-t*506)/1024])
                if j:
                    a=2*(j-1);indices.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
            parts={name:(np.array(pp),np.array(ribbon_normals),np.array(uv),np.array(indices,int)) for name,pp in positions.items()}
            # Four root stations are shared, not merely visually aligned.
            roots.append(tuple(a[:root_stations*2] if i<3 else a[:(root_stations-1)*2] for i,a in enumerate(parts['flat'])))
            def body(part):
                p,n,u,f=part;offset=(root_stations-1)*2
                return p[offset:],n[offset:],u[offset:],f[(root_stations-1)*2:]-offset
            flat.append(body(parts['flat']));volume.append(body(parts['volume']))
            bindings.append({'triangle':face,'barycentric':bary.tolist(),'root':root.tolist(),'firstVertex':(len(bindings))*root_stations*2,'row':row})
    return combine(roots),combine(flat),combine(volume),bindings
