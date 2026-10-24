import unittest
import numpy as np
from scripts.headprep.refine import fair_estimated_surface,residual_annotation

class RefinedSurfaceTests(unittest.TestCase):
    def test_fairing_preserves_observed_boundary_and_limits_displacement(self):
        x,y=np.meshgrid(np.arange(5),np.arange(5));p=np.column_stack([x.ravel(),y.ravel(),np.zeros(25)]).astype(float);p[12,2]=.7
        f=[]
        for j in range(4):
            for i in range(4):
                a=j*5+i;f.extend([[a,a+1,a+5],[a+1,a+6,a+5]])
        f=np.array(f);estimated=np.ones(len(f),dtype=bool);estimated[:2]=False;before=p.copy()
        fixed=np.isin(np.arange(25),[4,20,24]);out,free=fair_estimated_surface(p,f,estimated,fixed,iterations=20,max_displacement=.2)
        np.testing.assert_array_equal(p,before)
        np.testing.assert_array_equal(out[np.unique(f[~estimated])],p[np.unique(f[~estimated])])
        np.testing.assert_array_equal(out[fixed],p[fixed]);self.assertLess(out[12,2],p[12,2]);self.assertLessEqual(np.linalg.norm(out-p,axis=1).max(),.2+1e-12)
        self.assertTrue(np.isfinite(out).all())
    def test_dark_central_face_is_never_classified_as_hair(self):
        # Dark pixels alone must not remove a nose/mouth/eye-region triangle.
        t=np.zeros((1,3,8));t[0,:,:3]=[[.0,.88,.18],[.02,.89,.18],[.01,.87,.19]];t[:,:,3:6]=[0,0,1];t[:,:,6:8]=.5
        mask,_=residual_annotation(t,np.zeros((2,2,3),dtype=np.uint8));self.assertFalse(mask.any())
