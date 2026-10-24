import unittest
from collections import Counter
import numpy as np
from scripts.headprep.geometry import clip_mesh,boundary_loops,scalp_patch

class HeadGeometryTests(unittest.TestCase):
    def test_clip_preserves_inputs_and_interpolates_attributes(self):
        p=np.array([[0,.98,.15],[0,1.08,.15],[0,.98,.25]])
        f=np.array([[0,1,2]]);uv=np.array([[[0,0],[1,0],[0,1]]],dtype=float);n=np.array([[1.,0,0]]*3)
        original=[a.copy() for a in (p,f,uv,n)]
        result,seam,whole=clip_mesh(p,f,uv,n)
        self.assertEqual(result.shape,(2,3,8));self.assertEqual(seam.shape,(1,2,3))
        np.testing.assert_allclose(seam[:,:,1],1.025)
        np.testing.assert_allclose(result[:,:,3:6],np.broadcast_to([1,0,0],(2,3,3)))
        for a,b in zip((p,f,uv,n),original):np.testing.assert_array_equal(a,b)
        uv_at_cut=result[np.isclose(result[:,:,1],1.025)][:,6]
        np.testing.assert_allclose(uv_at_cut,.45)
    def test_cap_closes_every_edge_except_the_unchanged_seam(self):
        theta=np.linspace(0,2*np.pi,24,endpoint=False)
        boundary=np.column_stack([.17*np.sin(theta),.9+.1*np.cos(theta),-.015+.19*np.cos(theta)])
        p,f,n=scalp_patch(boundary,rings=12)
        np.testing.assert_array_equal(p[:len(boundary)],boundary)
        edges=Counter(tuple(sorted(e)) for tri in f for e in [(tri[0],tri[1]),(tri[1],tri[2]),(tri[2],tri[0])])
        self.assertEqual(sum(v==1 for v in edges.values()),len(boundary));self.assertTrue(all(v in (1,2) for v in edges.values()))
        area=np.linalg.norm(np.cross(p[f][:,1]-p[f][:,0],p[f][:,2]-p[f][:,0]),axis=1)
        self.assertTrue(np.all(area>1e-12));self.assertTrue(np.isfinite(n).all())
    def test_open_or_branched_cut_is_rejected(self):
        with self.assertRaises(ValueError):boundary_loops(np.array([[[0,0,0],[1,0,0]],[[1,0,0],[1,1,0]]],dtype=float))

    def test_regularized_cap_retains_seam_and_has_finite_nonzero_faces(self):
        theta=np.linspace(0,2*np.pi,80,endpoint=False);theta[15:20]=theta[15:20][::-1]
        boundary=np.column_stack([.035+.16*np.sin(theta),.9+.08*np.cos(theta),-.025+.18*np.cos(theta)])
        p,f,n=scalp_patch(boundary,rings=20,center_xz=[.035,-.025],radii_xz=[.16,.18],regularize_angles=True)
        np.testing.assert_array_equal(p[:len(boundary)],boundary)
        self.assertTrue(np.isfinite(p).all() and np.isfinite(n).all())
        area=np.linalg.norm(np.cross(p[f][:,1]-p[f][:,0],p[f][:,2]-p[f][:,0]),axis=1)
        self.assertTrue(np.all(area>1e-12))
