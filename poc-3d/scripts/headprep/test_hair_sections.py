import unittest
import numpy as np
from headprep.hair_sections import body_ribbon,lock_curve

class HairSectionTests(unittest.TestCase):
    def fixture(self):
        centers=np.array([[-.1,1+i*.004,.13] for i in range(9)])
        p=np.array([c+np.array([side*.0015,0,0]) for c in centers for side in [-1,1]])
        uv=np.array([[(2+k*124)/1024,(509-t*506)/1024] for t in np.linspace(0,1,9) for k in range(2)])
        return p,uv
    def test_common_guide_is_cut_by_arc_length(self):
        p,_=self.fixture();short=lock_curve(p,.06,13);long=lock_curve(p,.30,61)
        np.testing.assert_allclose(short,long[:13],atol=1e-12)
    def test_join_positions_uvs_and_finite_ribbon(self):
        p,uv=self.fixture();q,n,u,f=body_ribbon(p,uv,.17)
        np.testing.assert_allclose(q[:2],p[-2:],atol=1e-12)
        np.testing.assert_allclose(u[:2,1],(509-.35*506)/1024,atol=1e-12)
        self.assertTrue(np.isfinite(q).all());np.testing.assert_allclose(np.linalg.norm(n,axis=1),1,atol=1e-10)
        t=q[f];self.assertTrue((np.linalg.norm(np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]),axis=1)>0).all())
