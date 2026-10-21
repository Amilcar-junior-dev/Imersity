import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisagismStore } from '../../store/useVisagismStore';
import { buildFaceBufferGeometry } from '../../services/faceMeshBuilder';

/**
 * Cabelo Masculino 3D Esculpido (Fade, Taper, Topete Texturizado & Quiff):
 * Recria o corte masculino contemporâneo com degradê lateral, textura desfiada no topo
 * e curvatura orgânica que elimina a aparência de capacete liso.
 */
const SculptedMaleHair: React.FC<{
  styleGeometry: string;
  hairColors: { rootHex: string; midHex: string; tipHex: string };
  anisotropyIntensity: number;
  hairRoughness: number;
  volumeScale: number;
}> = ({ styleGeometry, hairColors, anisotropyIntensity, hairRoughness, volumeScale }) => {
  // Gera mechas 3D texturizadas no topo da cabeça
  const hairClusters = useMemo(() => {
    const clusters: Array<{
      curve: THREE.CatmullRomCurve3;
      radius: number;
    }> = [];

    const isQuiff = styleGeometry === 'male_quiff';
    const isCrew = styleGeometry === 'male_crew';
    const isSidePart = styleGeometry === 'male_side_part';

    // Quantidade de mechas no topo
    const count = isCrew ? 36 : 64;

    for (let i = 0; i < count; i++) {
      // Distribuição elíptica pelo topo da cabeça
      const u = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const rX = Math.sqrt(u) * 0.165;
      const rZ = Math.sqrt(u) * 0.185;

      const baseX = Math.cos(angle) * rX;
      const baseZ = Math.sin(angle) * rZ - 0.03;
      const baseY = 0.32;

      let topOffsetZ = 0.04;
      let topOffsetY = isQuiff ? 0.09 : isCrew ? 0.03 : 0.06;
      let topOffsetX = isSidePart ? 0.045 : (Math.random() - 0.5) * 0.03;

      // Mechas frontais projetam-se levemente para frente e cima (como na foto do usuário)
      if (baseZ > 0.02) {
        topOffsetZ += 0.035;
        topOffsetY += 0.025;
      }

      const p0 = new THREE.Vector3(baseX, baseY, baseZ);
      const p1 = new THREE.Vector3(
        baseX + topOffsetX * 0.5,
        baseY + topOffsetY * 0.6,
        baseZ + topOffsetZ * 0.5
      );
      const p2 = new THREE.Vector3(
        baseX + topOffsetX,
        baseY + topOffsetY + (Math.random() - 0.5) * 0.015,
        baseZ + topOffsetZ
      );

      clusters.push({
        curve: new THREE.CatmullRomCurve3([p0, p1, p2]),
        radius: isCrew ? 0.007 : 0.011 + Math.random() * 0.006,
      });
    }

    return clusters;
  }, [styleGeometry]);

  return (
    <group scale={[volumeScale, volumeScale, volumeScale]}>
      {/* 1. Base com Degradê / Taper (Hugging skull com fade nas têmporas e nuca) */}
      <mesh position={[0, 0.185, -0.045]} scale={[0.86, 1.06, 0.94]}>
        <sphereGeometry args={[0.237, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial
          color={hairColors.rootHex}
          roughness={hairRoughness}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* 2. Topo Texturizado em Mechas 3D Reais (Tubos Curvos com Especular Anisotrópico) */}
      <group>
        {hairClusters.map((cluster, idx) => (
          <mesh key={idx}>
            <tubeGeometry args={[cluster.curve, 8, cluster.radius, 6, false]} />
            <meshPhysicalMaterial
              color={idx % 3 === 0 ? hairColors.midHex : hairColors.rootHex}
              roughness={hairRoughness}
              clearcoat={anisotropyIntensity}
              clearcoatRoughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* 3. Camada de Volume Denso Superior */}
      <mesh position={[0, 0.28, -0.01]} scale={[0.76, 0.32, 0.78]}>
        <sphereGeometry args={[0.22, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshPhysicalMaterial
          color={hairColors.midHex}
          roughness={hairRoughness}
          clearcoat={anisotropyIntensity}
        />
      </mesh>
    </group>
  );
};

/**
 * Cabelo Feminino 3D Modular (Curtain Bangs, Long Bob, Shaggy, Pixie)
 */
const FlowingFemaleHair: React.FC<{
  styleGeometry: string;
  hairColors: { rootHex: string; midHex: string; tipHex: string };
  anisotropyIntensity: number;
  hairRoughness: number;
  volumeScale: number;
}> = ({ styleGeometry, hairColors, anisotropyIntensity, hairRoughness, volumeScale }) => {
  const strands = useMemo(() => {
    const list: Array<{ curve: THREE.CatmullRomCurve3; radius: number }> = [];
    const total = styleGeometry === 'pixie_cut' ? 42 : 72;

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const isFront = Math.sin(angle) > 0.35;

      // Abre espaço para a face se for longo
      if (isFront && styleGeometry !== 'curtain_bangs' && styleGeometry !== 'pixie_cut') {
        continue;
      }

      const startX = Math.cos(angle) * 0.195;
      const startY = 0.33;
      const startZ = Math.sin(angle) * 0.215 - 0.03;

      let length = 0.52;
      if (styleGeometry === 'pixie_cut') length = 0.18;
      else if (styleGeometry === 'long_bob') length = 0.38;

      const p0 = new THREE.Vector3(startX, startY, startZ);
      const p1 = new THREE.Vector3(
        startX * 1.15,
        startY - length * 0.5,
        startZ + (isFront ? 0.05 : -0.03)
      );
      const p2 = new THREE.Vector3(
        startX * 1.25,
        startY - length,
        startZ + (isFront ? 0.08 : -0.05)
      );

      list.push({
        curve: new THREE.CatmullRomCurve3([p0, p1, p2]),
        radius: 0.012,
      });
    }

    return list;
  }, [styleGeometry]);

  return (
    <group scale={[volumeScale, volumeScale, volumeScale]}>
      {/* Cúpula base */}
      <mesh position={[0, 0.19, -0.04]} scale={[0.88, 1.08, 0.95]}>
        <sphereGeometry args={[0.24, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshPhysicalMaterial
          color={hairColors.rootHex}
          roughness={hairRoughness}
          clearcoat={anisotropyIntensity}
        />
      </mesh>

      {/* Mechas */}
      {strands.map((s, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[s.curve, 10, s.radius, 6, false]} />
          <meshPhysicalMaterial
            color={idx % 2 === 0 ? hairColors.midHex : hairColors.tipHex}
            roughness={hairRoughness}
            clearcoat={anisotropyIntensity}
          />
        </mesh>
      ))}
    </group>
  );
};

export const CrisalixHead3D: React.FC<{
  morphNoseDepth?: number;
  morphJawWidth?: number;
  morphCheekboneLift?: number;
}> = ({
  morphNoseDepth = 1.0,
  morphJawWidth = 1.0,
  morphCheekboneLift = 1.0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    capturedPhotoDataUrl,
    leftSidePhotoUrl,
    rightSidePhotoUrl,
    faceLandmarks,
    skinColorHex,
    hairColors,
    showHairLayer,
    selectedHairPreset,
    anisotropyIntensity,
    hairRoughness,
    hairVolumeScale,
    hairOffsetY,
    hairOffsetZ,
    autoRotate3D,
  } = useVisagismStore();

  const [texFront, setTexFront] = useState<THREE.Texture | null>(null);
  const [texLeft, setTexLeft] = useState<THREE.Texture | null>(null);
  const [texRight, setTexRight] = useState<THREE.Texture | null>(null);

  // 1. Carrega Foto Frontal
  useEffect(() => {
    if (!capturedPhotoDataUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      capturedPhotoDataUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        setTexFront(tex);
      },
      undefined,
      (err) => console.warn('Erro ao carregar textura frontal:', err)
    );
  }, [capturedPhotoDataUrl]);

  // 2. Carrega Foto Lateral Esquerda (45°)
  useEffect(() => {
    if (!leftSidePhotoUrl) {
      setTexLeft(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      leftSidePhotoUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        setTexLeft(tex);
      },
      undefined,
      (err) => console.warn('Erro ao carregar textura 45° esquerda:', err)
    );
  }, [leftSidePhotoUrl]);

  // 3. Carrega Foto Lateral Direita (45°)
  useEffect(() => {
    if (!rightSidePhotoUrl) {
      setTexRight(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      rightSidePhotoUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        setTexRight(tex);
      },
      undefined,
      (err) => console.warn('Erro ao carregar textura 45° direita:', err)
    );
  }, [rightSidePhotoUrl]);

  // Constrói a geometria anatômica completa e fechada (sem furos e contínua)
  const { geometry: faceGeometry } = useMemo(() => {
    return buildFaceBufferGeometry(faceLandmarks, 1.35 * morphNoseDepth);
  }, [faceLandmarks, morphNoseDepth]);

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate3D) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  const isMasculine =
    selectedHairPreset.gender === 'masculino' ||
    selectedHairPreset.styleGeometry.startsWith('male_');

  // Shader Multi-View PBR: Combina as 3 fotos baseando-se na normal de cada polígono
  const multiViewMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.44,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    if (texFront) {
      mat.map = texFront;
    }

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTexFront = { value: texFront };
      shader.uniforms.uTexLeft = { value: texLeft || texFront };
      shader.uniforms.uTexRight = { value: texRight || texFront };
      shader.uniforms.uHasLeft = { value: texLeft ? 1.0 : 0.0 };
      shader.uniforms.uHasRight = { value: texRight ? 1.0 : 0.0 };
      shader.uniforms.uSkinColor = { value: new THREE.Color(skinColorHex) };

      shader.vertexShader = `
        attribute vec2 uvLeft;
        attribute vec2 uvRight;
        varying vec2 vUvLeft;
        varying vec2 vUvRight;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vUvLeft = uvLeft;
        vUvRight = uvRight;
        `
      );

      shader.fragmentShader = `
        uniform sampler2D uTexFront;
        uniform sampler2D uTexLeft;
        uniform sampler2D uTexRight;
        uniform float uHasLeft;
        uniform float uHasRight;
        uniform vec3 uSkinColor;
        varying vec2 vUvLeft;
        varying vec2 vUvRight;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP
          vec4 colF = texture2D(uTexFront, vMapUv);
          vec4 colL = (uHasLeft > 0.5) ? texture2D(uTexLeft, vUvLeft) : colF;
          vec4 colR = (uHasRight > 0.5) ? texture2D(uTexRight, vUvRight) : colF;

          vec3 norm = normalize(vNormal);

          // Peso frontal: faces voltadas para frente (+Z)
          float wFront = clamp(norm.z * 1.3, 0.0, 1.0);
          wFront = pow(wFront, 2.0);

          // Peso lateral esquerda: normal apontando para (-0.707, 0, 0.707)
          float wLeft = (uHasLeft > 0.5) ? clamp(dot(norm, vec3(-0.7071, 0.0, 0.7071)) * 1.4, 0.0, 1.0) : 0.0;
          wLeft = pow(wLeft, 2.0);

          // Peso lateral direita: normal apontando para (0.707, 0, 0.707)
          float wRight = (uHasRight > 0.5) ? clamp(dot(norm, vec3(0.7071, 0.0, 0.7071)) * 1.4, 0.0, 1.0) : 0.0;
          wRight = pow(wRight, 2.0);

          float totalW = max(0.0001, wFront + wLeft + wRight);
          vec3 blendedPhoto = (colF.rgb * wFront + colL.rgb * wLeft + colR.rgb * wRight) / totalW;

          // Transição gradual suave para a cor da pele nas costas da cabeça e pescoço
          float coverage = clamp((norm.z + 0.38) * 1.6, 0.0, 1.0);
          vec3 finalSkin = mix(uSkinColor, blendedPhoto, coverage);

          diffuseColor = vec4(finalSkin, 1.0);
        #else
          diffuseColor = vec4(uSkinColor, 1.0);
        #endif
        `
      );
    };

    return mat;
  }, [texFront, texLeft, texRight, skinColorHex]);

  return (
    <group ref={groupRef} position={[0, 1.35, -0.65]}>
      {/* =========================================================================
          1. CABEÇA ANATÔMICA COMPLETA E FECHADA (PADRÃO CRISALIX MULTI-VIEW)
          (Rosto frontal + laterais + mandíbula + orelhas + pescoço contínuo)
         ========================================================================= */}
      <mesh
        geometry={faceGeometry}
        material={multiViewMaterial}
        position={[0, 0.11, 0.025]}
        scale={[morphJawWidth, morphCheekboneLift, 1.0]}
        castShadow
        receiveShadow
      />

      {/* =========================================================================
          2. PEDESTAL / BASE DO BUSTO
         ========================================================================= */}
      <mesh position={[0, -0.38, -0.04]} scale={[1.55, 0.5, 0.8]}>
        <sphereGeometry args={[0.23, 32, 24]} />
        <meshStandardMaterial color="#18181b" roughness={0.68} />
      </mesh>

      {/* =========================================================================
          3. CABELO 3D MODULAR (MASCULINO OU FEMININO COM ALTA DEFINIÇÃO)
         ========================================================================= */}
      {showHairLayer && (
        <group position={[0, hairOffsetY, hairOffsetZ]}>
          {isMasculine ? (
            <SculptedMaleHair
              styleGeometry={selectedHairPreset.styleGeometry}
              hairColors={hairColors}
              anisotropyIntensity={anisotropyIntensity}
              hairRoughness={hairRoughness}
              volumeScale={hairVolumeScale * morphJawWidth}
            />
          ) : (
            <FlowingFemaleHair
              styleGeometry={selectedHairPreset.styleGeometry}
              hairColors={hairColors}
              anisotropyIntensity={anisotropyIntensity}
              hairRoughness={hairRoughness}
              volumeScale={hairVolumeScale * morphJawWidth}
            />
          )}
        </group>
      )}
    </group>
  );
};
