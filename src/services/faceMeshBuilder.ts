import * as THREE from 'three';
import { NormalizedLandmark } from './faceAnalysis';

interface Triangle {
  a: number;
  b: number;
  c: number;
}

/**
 * Executa Triangulação de Delaunay (algoritmo Bowyer-Watson) sobre os 468 pontos 2D (u,v)
 * do MediaPipe para gerar uma malha triangular 3D contínua e sem buracos do rosto real da cliente.
 */
export function triangulateLandmarks2D(points: { x: number; y: number }[]): number[] {
  const n = points.length;
  if (n < 3) return [];

  // Super-triângulo que engloba todo o espaço normalizado [0, 1]
  const superPts = [
    { x: -10, y: -10 },
    { x: 10, y: -10 },
    { x: 0, y: 10 },
  ];
  const allPts = [...points, ...superPts];

  let triangles: Triangle[] = [{ a: n, b: n + 1, c: n + 2 }];

  for (let i = 0; i < n; i++) {
    const p = allPts[i];
    const badTriangles: Triangle[] = [];

    for (const tri of triangles) {
      if (isPointInCircumcircle(p, allPts[tri.a], allPts[tri.b], allPts[tri.c])) {
        badTriangles.push(tri);
      }
    }

    const polygon: [number, number][] = [];
    for (const tri of badTriangles) {
      const edges: [number, number][] = [
        [tri.a, tri.b],
        [tri.b, tri.c],
        [tri.c, tri.a],
      ];
      for (const [e1, e2] of edges) {
        let shared = false;
        for (const other of badTriangles) {
          if (other === tri) continue;
          if (hasEdge(other, e1, e2)) {
            shared = true;
            break;
          }
        }
        if (!shared) {
          polygon.push([e1, e2]);
        }
      }
    }

    triangles = triangles.filter((t) => !badTriangles.includes(t));
    for (const [e1, e2] of polygon) {
      triangles.push({ a: e1, b: e2, c: i });
    }
  }

  // Remove triângulos ligados ao super-triângulo e filtra arestas externas espúrias
  const indices: number[] = [];
  for (const t of triangles) {
    if (t.a >= n || t.b >= n || t.c >= n) continue;
    const pa = allPts[t.a];
    const pb = allPts[t.b];
    const pc = allPts[t.c];

    const maxEdge = Math.max(
      Math.hypot(pa.x - pb.x, pa.y - pb.y),
      Math.hypot(pb.x - pc.x, pb.y - pc.y),
      Math.hypot(pc.x - pa.x, pc.y - pa.y)
    );

    // Limite de 0.32 preserva toda a bochecha, nariz, contorno infraorbital e olhos sem criar buracos
    if (maxEdge < 0.32) {
      // Garante orientação counter-clockwise (normal apontando para +Z)
      const cross = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
      if (cross < 0) {
        indices.push(t.a, t.b, t.c);
      } else {
        indices.push(t.a, t.c, t.b);
      }
    }
  }

  return indices;
}

function hasEdge(tri: Triangle, u: number, v: number): boolean {
  return (
    (tri.a === u && tri.b === v) ||
    (tri.b === u && tri.c === v) ||
    (tri.c === u && tri.a === v) ||
    (tri.a === v && tri.b === u) ||
    (tri.b === v && tri.c === u) ||
    (tri.c === v && tri.a === u)
  );
}

function isPointInCircumcircle(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): boolean {
  const ax = a.x - p.x;
  const ay = a.y - p.y;
  const bx = b.x - p.x;
  const by = b.y - p.y;
  const cx = c.x - p.x;
  const cy = c.y - p.y;

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  const orient = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return orient > 0 ? det > 0 : det < 0;
}

/**
 * Constrói uma BufferGeometry 3D fotorrealista a partir dos 468 landmarks faciais do MediaPipe.
 */
export function buildFaceBufferGeometry(
  landmarks: NormalizedLandmark[],
  depthMultiplier = 1.35
): {
  geometry: THREE.BufferGeometry;
  headCenterOffset: THREE.Vector3;
  faceWidthWorld: number;
  leftEyePos: THREE.Vector3;
  rightEyePos: THREE.Vector3;
} {
  const facePts = landmarks.slice(0, 468);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  facePts.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const rawWidth = Math.max(0.15, maxX - minX);

  const targetFaceWidth = 0.34;
  const scaleFactor = targetFaceWidth / rawWidth;

  const positions = new Float32Array(facePts.length * 3);
  const uvs = new Float32Array(facePts.length * 2);

  for (let i = 0; i < facePts.length; i++) {
    const pt = facePts[i];
    const x = (pt.x - centerX) * scaleFactor;
    const y = -(pt.y - centerY) * scaleFactor;
    const z = -pt.z * scaleFactor * depthMultiplier + 0.16;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    uvs[i * 2] = pt.x;
    uvs[i * 2 + 1] = 1.0 - pt.y;
  }

  const leftPt = landmarks[468] || landmarks[159] || { x: 0.41, y: 0.42, z: 0 };
  const rightPt = landmarks[473] || landmarks[386] || { x: 0.59, y: 0.42, z: 0 };

  const leftEyePos = new THREE.Vector3(
    (leftPt.x - centerX) * scaleFactor,
    -(leftPt.y - centerY) * scaleFactor,
    -leftPt.z * scaleFactor * depthMultiplier + 0.16
  );
  const rightEyePos = new THREE.Vector3(
    (rightPt.x - centerX) * scaleFactor,
    -(rightPt.y - centerY) * scaleFactor,
    -rightPt.z * scaleFactor * depthMultiplier + 0.16
  );

  const indices = triangulateLandmarks2D(facePts);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    headCenterOffset: new THREE.Vector3(0, 0.04, 0.02),
    faceWidthWorld: targetFaceWidth,
    leftEyePos,
    rightEyePos,
  };
}

/**
 * Gera 468 landmarks 3D anatômicos realistas padrão caso o usuário ainda não tenha subido uma foto.
 */
export function createDefaultAnatomicalLandmarks(): NormalizedLandmark[] {
  const pts: NormalizedLandmark[] = [];
  const rings = 22;
  const perRing = 21;

  pts.push({ x: 0.5, y: 0.52, z: -0.11 });

  for (let r = 1; r <= rings; r++) {
    const radiusFrac = r / rings;
    const rx = 0.24 * radiusFrac;
    const ry = 0.31 * radiusFrac;

    for (let s = 0; s < perRing; s++) {
      if (pts.length >= 468) break;
      const angle = (s / perRing) * Math.PI * 2;
      const x = 0.5 + Math.cos(angle) * rx;
      const y = 0.5 + Math.sin(angle) * ry;

      const distSq = Math.pow((x - 0.5) / 0.25, 2) + Math.pow((y - 0.5) / 0.32, 2);
      let z = -0.08 * Math.max(0, Math.sqrt(Math.max(0, 1 - distSq * 0.85)));

      const noseDist = Math.hypot((x - 0.5) * 2.5, (y - 0.51) * 1.4);
      if (noseDist < 0.16) {
        z -= (0.16 - noseDist) * 0.28;
      }

      const lipDist = Math.hypot((x - 0.5) * 1.6, (y - 0.64) * 2.8);
      if (lipDist < 0.12) {
        z -= (0.12 - lipDist) * 0.14;
      }

      const leftEyeDist = Math.hypot(x - 0.41, y - 0.42);
      const rightEyeDist = Math.hypot(x - 0.59, y - 0.42);
      if (leftEyeDist < 0.045 || rightEyeDist < 0.045) {
        z += 0.012;
      }

      pts.push({ x, y, z });
    }
  }

  while (pts.length < 468) {
    pts.push({ x: 0.5, y: 0.5, z: -0.05 });
  }

  return pts;
}
