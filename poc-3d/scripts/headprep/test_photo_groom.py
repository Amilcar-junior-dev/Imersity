import unittest
import numpy as np
from PIL import Image
from scripts.headprep.photo_groom import photo_to_native,native_to_photo,normalization,hair_mask,PHOTO_EYES,NATIVE_EYES

class PhotoGuidesTests(unittest.TestCase):
    def test_eye_normalization_preserves_scale_and_round_trip(self):
        q=photo_to_native(PHOTO_EYES)
        np.testing.assert_allclose(q.mean(0),NATIVE_EYES.mean(0),atol=1e-12)
        self.assertAlmostEqual(float(np.linalg.norm(q[1]-q[0])),float(np.linalg.norm(NATIVE_EYES[1]-NATIVE_EYES[0])))
        np.testing.assert_allclose(native_to_photo(q),PHOTO_EYES,atol=1e-10)
    def test_selected_roi_largest_component_excludes_separate_eyebrows(self):
        image=np.full((3840,2160,3),240,np.uint8);image[1200:1450,800:1700]=30;image[1850:1900,1000:1250]=15
        mask,data=hair_mask(Image.fromarray(image));box=data['boundingBox']
        self.assertLess(abs(box[0]-800),4);self.assertLess(abs(box[1]-1200),4);self.assertLess(abs(box[2]-1700),5);self.assertLess(abs(box[3]-1450),5)
        self.assertTrue((np.array(data['sampledColorRGB'])==30).all())
        self.assertRaises(ValueError,hair_mask,Image.new('RGB',(2160,3840),(240,240,240)))
