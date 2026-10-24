import unittest
import numpy as np
from scripts.headprep.ears import ear_field,recess_scalp
from scripts.headprep.geometry import hairline_value,clip_mesh

class EarPreservationTests(unittest.TestCase):
    def test_original_posterior_rim_survives_crown_cut(self):
        p=np.array([[-.15,.897,-.072],[-.149,.90,-.068],[-.146,.896,-.065]])
        f=np.array([[0,1,2]]);n=np.tile([-1.,0,0],(3,1));uv=np.zeros((1,3,2))
        self.assertTrue((hairline_value(p)>0).all());self.assertTrue((ear_field(p)<0).all())
        result,seam,whole=clip_mesh(p,f,uv,n,values=np.minimum(hairline_value(p),ear_field(p)))
        self.assertTrue(whole.all());np.testing.assert_array_equal(result[0,:,:3],p);self.assertEqual(len(seam),0)
    def test_recess_preserves_seam_and_crown(self):
        p=np.array([[.21,.86,-.08],[.21,.86,-.08],[-.15,.86,-.08],[.16,1.03,0]])
        out=recess_scalp(p,1)
        np.testing.assert_array_equal(out[0],p[0]);np.testing.assert_array_equal(out[3],p[3])
        self.assertLess(out[1,0],p[1,0]);self.assertGreater(out[2,0],p[2,0])
        np.testing.assert_array_equal(out[:,1:],p[:,1:])
