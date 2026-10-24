import io,unittest
import numpy as np
from PIL import Image
from scripts.headprep.hairline import SurfaceProjector,strand_atlas


class HairlineFixtureTests(unittest.TestCase):
    def test_surface_binding_reconstructs_interior_edge_and_vertex_roots(self):
        p=np.array([[0.,0,0],[1.,0,0],[0.,1,0]])
        s=SurfaceProjector(p,np.array([[0,1,2]]),np.tile([0.,0,1],(3,1)))
        for q,expected in [([.2,.3,.4],[.2,.3,0]),([.8,.8,.2],[.5,.5,0]),([-1.,-1.,.5],[0,0,0])]:
            root,normal,face,bary=s.project(q)
            np.testing.assert_allclose(root,expected,atol=1e-10)
            self.assertTrue((bary>=0).all());self.assertAlmostEqual(float(bary.sum()),1)
            np.testing.assert_allclose(bary@p[s.faces[face]],root,atol=1e-10)
            self.assertAlmostEqual(float(np.linalg.norm(normal)),1)

    def test_atlas_is_reproducible_and_contains_separated_fibers_not_a_solid_fade(self):
        data,rgba=strand_atlas();again,_=strand_atlas()
        self.assertEqual(data,again);self.assertEqual(Image.open(io.BytesIO(data)).mode,'RGBA')
        alpha=rgba[256,:128,3];covered=alpha>=46
        starts=np.flatnonzero(covered & ~np.r_[False,covered[:-1]])
        self.assertGreater(len(starts),5)
        self.assertLess(float((rgba[:,:,3]>=46).mean()),.3)
        self.assertTrue((rgba[:,:,:3]==[73,49,35]).all())
        self.assertTrue((rgba[511,:,3]==0).all())
