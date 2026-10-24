"""Geometry safety checks; synthetic data, no personal captures in fixtures."""
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from headprep.cleanup import select_faces, posterior_support


class CleanupTests(unittest.TestCase):
    def test_protected_face_survives_bright_texture_and_crop(self):
        points = np.array([[0,0,1], [.2,0,1], [0,.2,1], [3,0,1], [3.2,0,1], [3,.2,1]])
        faces = np.array([[0,1,2], [3,4,5]])
        uvs = np.zeros((2,3,2))
        image = np.full((2,2,3), 255, dtype=np.uint8)
        profile = {'cropBounds':[[-.1,-.1,-.1],[.1,.1,.1]],
                   'protectedBounds':[[-.5,-.5,.5],[.5,.5,1.5]],
                   'neutralMinimum':183, 'neutralSpread':43}
        keep, protected, _ = select_faces(points, faces, uvs, image, profile)
        np.testing.assert_array_equal(keep, [True, False])
        np.testing.assert_array_equal(protected, [True, False])

    def test_posterior_surface_stays_behind_front_plane(self):
        center = np.array([.1, 1.1, -.08])
        radii = np.array([.25, .4, .3])
        p, f, n = posterior_support(center, radii)
        self.assertLessEqual(p[:,2].max(), center[2]+1e-12)
        np.testing.assert_allclose(np.sum(((p-center)/radii)**2, axis=1), 1)
        np.testing.assert_allclose(np.linalg.norm(n, axis=1), 1)
        cross = np.cross(p[f[:,1]]-p[f[:,0]], p[f[:,2]]-p[f[:,0]])
        self.assertTrue((np.linalg.norm(cross, axis=1) > 1e-10).all())
        self.assertTrue(((cross*(p[f].mean(axis=1)-center)).sum(axis=1) > 0).all())

    def test_invalid_profile_rejected(self):
        with self.assertRaises(ValueError):
            posterior_support([0,0,0], [1,0,1])


if __name__ == '__main__':
    unittest.main()
