import unittest
import numpy as np
from scripts.headprep.extraction import hair_scores,crown_components,fit_hair,mold_hair

class HairExtractionTests(unittest.TestCase):
    def test_dark_beard_and_pale_face_are_not_crown_hair(self):
        points=np.array([[0,.7,.4],[0,-.5,.6],[0,.08,.6],[0,.08,.6]])
        rgb=np.array([[.1,.06,.03],[.1,.06,.03],[.9,.8,.7],[.1,.06,.03]])
        # Same-position UV seams share appearance estimates, so isolate the pale case.
        self.assertGreater(hair_scores(points[:2],rgb[:2])[0],0);self.assertLess(hair_scores(points[:2],rgb[:2])[1],0)
        self.assertLess(hair_scores(points[2:3],rgb[2:3])[0],0)
        self.assertGreater(hair_scores(points[3:],rgb[3:])[0],0)
    def test_fit_preserves_inputs_and_keeps_normal_vectors_finite(self):
        p=np.array([[0,1.,0],[.5,.1,0]]);n=np.array([[0,1.,0],[1.,0,0]]);before=p.copy()
        out,normal,report=fit_hair(p,n)
        np.testing.assert_array_equal(p,before);self.assertTrue(np.isfinite(out).all());np.testing.assert_allclose(np.linalg.norm(normal,axis=1),1)
        self.assertFalse(report['collisionFreeFitValidated'])
    def test_regional_fit_pins_crown_and_central_fringe(self):
        p=np.array([[.15,1.15,.02],[.035,.97,.18],[.17,.94,.08],[.035,.80,-.22]])
        normal=np.tile([0.,1.,0.],(len(p),1));before=p.copy()
        out,n,report=mold_hair(p,normal)
        np.testing.assert_array_equal(p,before);np.testing.assert_array_equal(out[:2],p[:2])
        self.assertLess(out[2,1],p[2,1]-.04);self.assertLess(out[3,1],p[3,1]-.05)
        np.testing.assert_allclose(np.linalg.norm(n,axis=1),1)
        self.assertGreater(report['minimumDeformationJacobian'],0)
        self.assertFalse(report['automaticFitValidated'])
    def test_nape_follows_widening_cranium_instead_of_entering_scalp(self):
        p=np.array([[.035,1.02,-.19]])
        out,_,_=mold_hair(p,np.array([[0.,0.,-1.]]))
        self.assertLess(out[0,1],p[0,1]);self.assertLess(out[0,2],p[0,2])
