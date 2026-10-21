import * as THREE from 'three';
import { NormalizedLandmark } from './faceAnalysis';

interface Triangle {
  a: number;
  b: number;
  c: number;
}

/**
 * Executa Triangulação de Delaunay (algoritmo Bowyer-Watson) sobre os 478 pontos 2D (u,v)
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

  // Remove triângulos ligados ao super-triângulo e filtra apenas triângulos muito espúrios fora do contorno
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
 * Constrói uma BufferGeometry 3D real do rosto da cliente a partir dos 478 landmarks do MediaPipe,
 * mapeando exatamente as coordenadas UV da foto real da cliente e normalizando escala e centro.
 */
export const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

/**
 * Constrói uma BufferGeometry 3D anatômica completa e fechada (estilo Crisalix / 3DMM),
 * integrando a máscara facial do MediaPipe (468 vértices) diretamente aos anéis laterais
 * do crânio, têmporas, orelhas e pescoço, com atributos UV frontais e de 45° (Multi-View).
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
  // Usamos os 468 pontos principais da máscara facial
  const facePts = landmarks.slice(0, 468);

  // Centro anatômico de referência (ponte nasal / centro do rosto)
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

  // Normaliza para que a largura bizigomática do rosto no mundo 3D seja sempre ~0.34 metros (escala humana real)
  const targetFaceWidth = 0.34;
  const scaleFactor = targetFaceWidth / rawWidth;

  // 468 pontos faciais + 3 anéis anatômicos de 36 vértices + 2 polos (occipital e base do pescoço)
  const totalVerts = 468 + 36 * 3 + 2;
  const positions = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const uvsLeft = new Float32Array(totalVerts * 2);
  const uvsRight = new Float32Array(totalVerts * 2);

  // 1. Povoa os 468 vértices faciais a partir dos landmarks do MediaPipe
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

    // Projeções angulares de 45°
    const rad45 = Math.PI / 4;
    const xLeft = x * Math.cos(rad45) - (z - 0.16) * Math.sin(rad45);
    const xRight = x * Math.cos(-rad45) - (z - 0.16) * Math.sin(-rad45);
    uvsLeft[i * 2] = Math.min(1.0, Math.max(0.0, 0.5 + xLeft / (targetFaceWidth * 1.15)));
    uvsLeft[i * 2 + 1] = pt.y;
    uvsRight[i * 2] = Math.min(1.0, Math.max(0.0, 0.5 + xRight / (targetFaceWidth * 1.15)));
    uvsRight[i * 2 + 1] = pt.y;
  }

  // 2. Constrói os anéis anatômicos de extensão para fechar o crânio e as laterais
  // Anel 1: Transição têmporas, base da orelha e mandíbula (indices 468 a 503)
  // Anel 2: Orelhas, processo mastóide e contorno cranial (indices 504 a 539)
  // Anel 3: Pescoço cervical e calota parietal (indices 540 a 575)
  for (let r = 1; r <= 3; r++) {
    const ringStart = 468 + (r - 1) * 36;
    for (let k = 0; k < 36; k++) {
      const parentIdx = r === 1 ? FACE_OVAL_INDICES[k] : ringStart - 36 + k;
      const px = positions[parentIdx * 3];
      const py = positions[parentIdx * 3 + 1];
      const pz = positions[parentIdx * 3 + 2];

      const curIdx = ringStart + k;
      let expandX = r === 1 ? 1.12 : r === 2 ? 1.02 : 0.88;
      // Expande um pouco mais onde ficam as orelhas (região lateral média)
      const isEarRegion = Math.abs(px) > targetFaceWidth * 0.35 && py > -0.05 && py < 0.12;
      if (isEarRegion && r <= 2) {
        expandX *= 1.14;
      }

      const newX = px * expandX;
      const newY = py - (py < -0.02 ? 0.045 * r : 0.008 * r);
      const newZ = pz - (r === 1 ? 0.07 : r === 2 ? 0.10 : 0.09);

      positions[curIdx * 3] = newX;
      positions[curIdx * 3 + 1] = newY;
      positions[curIdx * 3 + 2] = newZ;

      // UVs para os anéis anatômicos estendidos
      uvs[curIdx * 2] = Math.min(1.0, Math.max(0.0, 0.5 + (newX / targetFaceWidth) * 0.5));
      uvs[curIdx * 2 + 1] = Math.min(1.0, Math.max(0.0, 0.5 - (newY / targetFaceWidth) * 0.5));

      const rad45 = Math.PI / 4;
      const xLeft = newX * Math.cos(rad45) - (newZ - 0.16) * Math.sin(rad45);
      const xRight = newX * Math.cos(-rad45) - (newZ - 0.16) * Math.sin(-rad45);
      uvsLeft[curIdx * 2] = Math.min(1.0, Math.max(0.0, 0.5 + xLeft / (targetFaceWidth * 1.15)));
      uvsLeft[curIdx * 2 + 1] = uvs[curIdx * 2 + 1];
      uvsRight[curIdx * 2] = Math.min(1.0, Math.max(0.0, 0.5 + xRight / (targetFaceWidth * 1.15)));
      uvsRight[curIdx * 2 + 1] = uvs[curIdx * 2 + 1];
    }
  }

  // 3. Polos de fechamento: Occipital (trás da cabeça) e Base do Pescoço
  const occIdx = 468 + 36 * 3;
  const neckIdx = occIdx + 1;

  positions[occIdx * 3] = 0;
  positions[occIdx * 3 + 1] = 0.12;
  positions[occIdx * 3 + 2] = -0.22;
  uvs[occIdx * 2] = 0.5;
  uvs[occIdx * 2 + 1] = 0.5;

  positions[neckIdx * 3] = 0;
  positions[neckIdx * 3 + 1] = -0.32;
  positions[neckIdx * 3 + 2] = -0.06;
  uvs[neckIdx * 2] = 0.5;
  uvs[neckIdx * 2 + 1] = 0.1;

  // 4. Índices de Triangulação (Delaunay da face interna + Ponte entre os Anéis)
  const indices = triangulateLandmarks2D(facePts);

  // Costura do contorno facial aos anéis estendidos
  for (let r = 0; r < 3; r++) {
    const rA =
      r === 0
        ? FACE_OVAL_INDICES
        : Array.from({ length: 36 }, (_, i) => 468 + (r - 1) * 36 + i);
    const rB = Array.from({ length: 36 }, (_, i) => 468 + r * 36 + i);

    for (let k = 0; k < 36; k++) {
      const a0 = rA[k];
      const a1 = rA[(k + 1) % 36];
      const b0 = rB[k];
      const b1 = rB[(k + 1) % 36];

      // Duas faces para formar o quadrilátero com normais para fora
      indices.push(a0, b0, b1);
      indices.push(a0, b1, a1);
    }
  }

  // Tampas para fechar o occipital (topo/nuca) e a base do pescoço
  for (let k = 0; k < 36; k++) {
    const cur = 468 + 2 * 36 + k;
    const nxt = 468 + 2 * 36 + ((k + 1) % 36);
    if (positions[cur * 3 + 1] >= -0.06) {
      indices.push(cur, occIdx, nxt);
    } else {
      indices.push(cur, nxt, neckIdx);
    }
  }

  // Posição anatômica exata dos centros dos olhos
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

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('uvLeft', new THREE.BufferAttribute(uvsLeft, 2));
  geometry.setAttribute('uvRight', new THREE.BufferAttribute(uvsRight, 2));
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
 * Gera 468 landmarks 3D anatômicos realistas quando o usuário ainda não subiu uma foto
 * ou caso a foto não tenha sido processada pelo WASM, garantindo que a malha 3D sempre funcione.
 */
export function createDefaultAnatomicalLandmarks(): NormalizedLandmark[] {
  const pts: NormalizedLandmark[] = [];
  // Grade elíptica densa de 468 pontos com topologia 3D real de nariz, olhos, maçãs do rosto e queixo
  const rings = 22;
  const perRing = 21;

  // Ponto central (ponta do nariz)
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

      // Calcula relevo Z anatômico (elipsoide facial + projeção do nariz, maçãs e lábios)
      const distSq = Math.pow((x - 0.5) / 0.25, 2) + Math.pow((y - 0.5) / 0.32, 2);
      let z = -0.08 * Math.max(0, Math.sqrt(Math.max(0, 1 - distSq * 0.85)));

      // Relevo da ponte e ponta do nariz
      const noseDist = Math.hypot((x - 0.5) * 2.5, (y - 0.51) * 1.4);
      if (noseDist < 0.16) {
        z -= (0.16 - noseDist) * 0.28;
      }

      // Relevo dos lábios
      const lipDist = Math.hypot((x - 0.5) * 1.6, (y - 0.64) * 2.8);
      if (lipDist < 0.12) {
        z -= (0.12 - lipDist) * 0.14;
      }

      // Cavidade ocular leve
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
