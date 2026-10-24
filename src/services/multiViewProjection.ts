import * as THREE from 'three';

/**
 * Utilitário de Projeção Fotogramétrica Multi-View (Frente 0° + 45° Esq + 45° Dir).
 * Permite projetar as fotos reais do cliente sobre os relevos 3D de qualquer cabeça
 * (seja a base anatômica limpa ou um modelo GLB retornado da Fal.ai sem pintura).
 */

export interface MultiViewProjectorOptions {
  frontalPhotoUrl?: string | null;
  leftPhotoUrl?: string | null;
  rightPhotoUrl?: string | null;
  skinColorHex: string;
  projectionOpacity?: number; // 0.0 = Modo Clay Puro, 1.0 = Projeção Fotográfica Total
  projScale?: number;
  projOffsetX?: number;
  projOffsetY?: number;
  projBlendFeather?: number;
}

/**
 * Cria ou injeta um material Three.js com shader de projeção tri-planar multi-ângulo.
 * Mantém todos os cálculos físicos de iluminação PBR (MeshStandardMaterial) e substitui
 * a cor difusa pela fusão suave das fotos frontal e laterais.
 */
export function createMultiViewProjectedMaterial(
  loader: THREE.TextureLoader,
  options: MultiViewProjectorOptions
): THREE.MeshStandardMaterial {
  const {
    frontalPhotoUrl,
    leftPhotoUrl,
    rightPhotoUrl,
    skinColorHex,
    projectionOpacity = 1.0,
    projScale = 1.0,
    projOffsetX = 0.0,
    projOffsetY = 0.0,
    projBlendFeather = 0.35,
  } = options;

  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.44,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const uniforms = {
    uFrontTex: { value: null as THREE.Texture | null },
    uLeftTex: { value: null as THREE.Texture | null },
    uRightTex: { value: null as THREE.Texture | null },
    uHasFront: { value: false },
    uHasLeft: { value: false },
    uHasRight: { value: false },
    uSkinColor: { value: new THREE.Color(skinColorHex) },
    uOpacity: { value: projectionOpacity },
    uHeadCenter: { value: new THREE.Vector3(0, 0.08, 0) },
    uHeadScale: { value: new THREE.Vector3(0.34, 0.46, 0.38) },
    uProjScale: { value: projScale },
    uProjOffset: { value: new THREE.Vector2(projOffsetX, projOffsetY) },
    uProjFeather: { value: projBlendFeather },
  };

  const loadTex = (url: string, onLoad: (tex: THREE.Texture) => void) => {
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      onLoad(tex);
    });
  };

  if (frontalPhotoUrl) {
    loadTex(frontalPhotoUrl, (tex) => {
      uniforms.uFrontTex.value = tex;
      uniforms.uHasFront.value = true;
      mat.needsUpdate = true;
    });
  }

  if (leftPhotoUrl) {
    loadTex(leftPhotoUrl, (tex) => {
      uniforms.uLeftTex.value = tex;
      uniforms.uHasLeft.value = true;
      mat.needsUpdate = true;
    });
  }

  if (rightPhotoUrl) {
    loadTex(rightPhotoUrl, (tex) => {
      uniforms.uRightTex.value = tex;
      uniforms.uHasRight.value = true;
      mat.needsUpdate = true;
    });
  }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFrontTex = uniforms.uFrontTex;
    shader.uniforms.uLeftTex = uniforms.uLeftTex;
    shader.uniforms.uRightTex = uniforms.uRightTex;
    shader.uniforms.uHasFront = uniforms.uHasFront;
    shader.uniforms.uHasLeft = uniforms.uHasLeft;
    shader.uniforms.uHasRight = uniforms.uHasRight;
    shader.uniforms.uSkinColor = uniforms.uSkinColor;
    shader.uniforms.uOpacity = uniforms.uOpacity;
    shader.uniforms.uHeadCenter = uniforms.uHeadCenter;
    shader.uniforms.uHeadScale = uniforms.uHeadScale;
    shader.uniforms.uProjScale = uniforms.uProjScale;
    shader.uniforms.uProjOffset = uniforms.uProjOffset;
    shader.uniforms.uProjFeather = uniforms.uProjFeather;

    // Injeta posição local/mundo para o fragment shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;
       varying vec3 vWorldNormal;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
       vWorldNormal = normalize(mat3(modelMatrix) * normal);
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;
       varying vec3 vWorldNormal;
       uniform sampler2D uFrontTex;
       uniform sampler2D uLeftTex;
       uniform sampler2D uRightTex;
       uniform bool uHasFront;
       uniform bool uHasLeft;
       uniform bool uHasRight;
       uniform vec3 uSkinColor;
       uniform float uOpacity;
       uniform vec3 uHeadCenter;
       uniform vec3 uHeadScale;
       uniform float uProjScale;
       uniform vec2 uProjOffset;
       uniform float uProjFeather;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      vec3 norm = normalize(vWorldNormal);

      // Centro e dimensões do rosto no espaço 3D (em metros no viewport padrão Y=1.41)
      vec3 faceCenter = vec3(uProjOffset.x, 1.41 + uProjOffset.y, -0.58);
      vec2 faceDim = vec2(0.20, 0.25) * uProjScale;

      // 1. Projeção Frontal (0°) com Máscara Oval Anatômica (elimina 100% de fundo/paredes)
      float dx = (vWorldPosition.x - faceCenter.x) / faceDim.x;
      float dy = (vWorldPosition.y - faceCenter.y) / faceDim.y;
      vec2 uvFront = vec2(dx * 0.5 + 0.5, dy * 0.5 + 0.5);

      float distOval = length(vec2(dx / 0.75, (dy + 0.05) / 0.85));
      float ovalMask = 1.0 - smoothstep(1.0 - uProjFeather, 1.05, distOval);

      float normalWeightFront = pow(max(0.0, norm.z), 1.25);
      float wFront = ovalMask * normalWeightFront * (uHasFront ? 1.0 : 0.0);
      vec3 colFront = uSkinColor;
      if (uHasFront && uvFront.x >= 0.0 && uvFront.x <= 1.0 && uvFront.y >= 0.0 && uvFront.y <= 1.0) {
        colFront = texture2D(uFrontTex, uvFront).rgb;
      }

      // 2. Projeção Lateral Esquerda (45°)
      float cosAng = 0.707;
      float sinAng = 0.707;
      float relX = vWorldPosition.x - faceCenter.x;
      float relZ = vWorldPosition.z - faceCenter.z;
      float lx = relX * cosAng + relZ * sinAng;
      float ldx = lx / faceDim.x;
      vec2 uvLeft = vec2(ldx * 0.5 + 0.5, dy * 0.5 + 0.5);
      float distOvalLeft = length(vec2(ldx / 0.75, (dy + 0.05) / 0.85));
      float ovalMaskLeft = 1.0 - smoothstep(1.0 - uProjFeather, 1.05, distOvalLeft);
      float normalWeightLeft = pow(max(0.0, -sinAng * norm.x + cosAng * norm.z), 1.25);
      float wLeft = ovalMaskLeft * normalWeightLeft * (uHasLeft ? 1.0 : 0.0);
      vec3 colLeft = uSkinColor;
      if (uHasLeft && uvLeft.x >= 0.0 && uvLeft.x <= 1.0 && uvLeft.y >= 0.0 && uvLeft.y <= 1.0) {
        colLeft = texture2D(uLeftTex, uvLeft).rgb;
      }

      // 3. Projeção Lateral Direita (45°)
      float rx = relX * cosAng - relZ * sinAng;
      float rdx = rx / faceDim.x;
      vec2 uvRight = vec2(rdx * 0.5 + 0.5, dy * 0.5 + 0.5);
      float distOvalRight = length(vec2(rdx / 0.75, (dy + 0.05) / 0.85));
      float ovalMaskRight = 1.0 - smoothstep(1.0 - uProjFeather, 1.05, distOvalRight);
      float normalWeightRight = pow(max(0.0, sinAng * norm.x + cosAng * norm.z), 1.25);
      float wRight = ovalMaskRight * normalWeightRight * (uHasRight ? 1.0 : 0.0);
      vec3 colRight = uSkinColor;
      if (uHasRight && uvRight.x >= 0.0 && uvRight.x <= 1.0 && uvRight.y >= 0.0 && uvRight.y <= 1.0) {
        colRight = texture2D(uRightTex, uvRight).rgb;
      }

      // 4. Fusão Suave Ponderada das 3 Câmeras
      float wTotal = wFront + wLeft + wRight;
      vec3 blended = uSkinColor;
      if (wTotal > 0.001) {
        blended = (colFront * wFront + colLeft * wLeft + colRight * wRight) / wTotal;
      }

      // Transição suave para o tom natural de pele da escultura
      float blendCoverage = clamp(wTotal * 1.4 * uOpacity, 0.0, 1.0);
      vec3 finalDiffuse = mix(uSkinColor, blended, blendCoverage);
      diffuseColor.rgb = finalDiffuse;
      `
    );
  };

  return mat;
}
