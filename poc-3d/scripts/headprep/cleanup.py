"""Assisted capture cleanup. Profiles are local annotations, not hair segmentation."""
import numpy as np


def select_faces(points, faces, uvs, image, profile):
    """Keep original triangles; protect the annotated facial region from deletion.

    Bright neutral texture alone is not a semantic background detector. The
    spatial crop and protected box must be reviewed for each capture.
    """
    points = np.asarray(points)
    faces = np.asarray(faces)
    bounds = np.asarray(profile['cropBounds'], dtype=float)
    protection = np.asarray(profile['protectedBounds'], dtype=float)
    if bounds.shape != (2, 3) or protection.shape != (2, 3):
        raise ValueError('Expected lower and upper XYZ bounds.')
    if np.any(bounds[0] >= bounds[1]) or np.any(protection[0] >= protection[1]):
        raise ValueError('Invalid crop/protection bounds.')
    spatial = ((points >= bounds[0]) & (points <= bounds[1])).all(axis=1)[faces].all(axis=1)
    protected = ((points >= protection[0]) & (points <= protection[1])).all(axis=1)[faces].any(axis=1)
    # Include triangle centres to reduce the chance of a UV seam dominating the sample.
    samples = np.concatenate([uvs, uvs.mean(axis=1, keepdims=True)], axis=1)
    px = np.clip(samples[..., 0] * image.shape[1], 0, image.shape[1]-1).astype(int)
    py = np.clip((1-samples[..., 1]) * image.shape[0], 0, image.shape[0]-1).astype(int)
    colors = image[py, px].mean(axis=1)
    bright = (colors.min(axis=1) > profile['neutralMinimum']) & (np.ptp(colors, axis=1) < profile['neutralSpread'])
    keep = (spatial & ~bright) | protected
    if not keep.any():
        raise ValueError('The cleanup profile removed every triangle.')
    return keep, protected, bright


def posterior_support(center, radii, rings=48, columns=64):
    """An open rear half ellipsoid, for explicitly estimated gap coverage only.

    This surface is separate and is NOT stitched to the scan. Its front boundary
    is the centre Z plane; no generated geometry extends toward the facial front.
    """
    center = np.asarray(center, dtype=float)
    radii = np.asarray(radii, dtype=float)
    if center.shape != (3,) or radii.shape != (3,) or np.any(radii <= 0):
        raise ValueError('Expected XYZ centre and positive radii.')
    if rings < 3 or columns < 3:
        raise ValueError('Insufficient support resolution.')
    # Poles are unique vertices; no zero-area pole triangles.
    vertices = [center + [0, radii[1], 0]]
    for latitude in np.linspace(0, np.pi, rings+1)[1:-1]:
        for angle in np.linspace(0, np.pi, columns+1):
            vertices.append(center + radii * [np.cos(angle)*np.sin(latitude), np.cos(latitude), -np.sin(angle)*np.sin(latitude)])
    vertices.append(center + [0, -radii[1], 0])
    faces = []
    width = columns+1
    for j in range(columns):
        faces.append([0, 1+j, 2+j])
    for row in range(rings-2):
        for j in range(columns):
            a = 1+row*width+j
            b = a+width
            faces.extend([[a, b, a+1], [a+1, b, b+1]])
    bottom = len(vertices)-1
    for j in range(columns):
        a = 1+(rings-2)*width+j
        faces.append([a, bottom, a+1])
    vertices = np.asarray(vertices)
    faces = np.asarray(faces)
    normals = (vertices-center)/(radii*radii)
    normals /= np.linalg.norm(normals, axis=1, keepdims=True)
    cross = np.cross(vertices[faces[:,1]]-vertices[faces[:,0]], vertices[faces[:,2]]-vertices[faces[:,0]])
    inward = (cross * (vertices[faces].mean(axis=1)-center)).sum(axis=1) < 0
    faces[inward] = faces[inward, ::-1]
    return vertices, faces, normals
