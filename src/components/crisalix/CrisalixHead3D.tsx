import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useVisagismStore } from '../../store/useVisagismStore';
import { buildFaceBufferGeometry } from '../../services/faceMeshBuilder';

const CustomGLBModel: React.FC<{ url: string; scale?: number }> = ({ url, scale = 1.0 }) => {
  const { scene } = useGLTF(url);

  const normalizedScene = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const autoScale = maxDim > 0 ? (0.48 / maxDim) * scale : scale;

    cloned.scale.setScalar(autoScale);
    cloned.position.x = -center.x * autoScale;
    cloned.position.y = -center.y * autoScale + 0.08;
    cloned.position.z = -center.z * autoScale;

    return cloned;
  }, [scene, scale]);

  return <primitive object={normalizedScene} />;
};

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
  const hairClusters = useMemo(() => {
    const clusters: Array<{
      curve: THREE.CatmullRomCurve3;
      radius: number;
    }> = [];

    const isQuiff = styleGeometry === 'male_quiff';
    const isCrew = styleGeometry === 'male_crew';
    const isSidePart = styleGeometry === 'male_side_part';

    const count = isCrew ? 36 : 64;

    for (let i = 0; i < count; i++) {
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
      {/* 1. Base com Degradê / Taper */}
      <mesh position={[0, 0.185, -0.045]} scale={[0.86, 1.06, 0.94]}>
        <sphereGeometry args={[0.237, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial
          color={hairColors.rootHex}
          roughness={hairRoughness}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* 2. Topo Texturizado em Mechas 3D Reais */}
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

      {/* 3. Volume Superior */}
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
      <mesh position={[0, 0.19, -0.04]} scale={[0.88, 1.08, 0.95]}>
        <sphereGeometry args={[0.24, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshPhysicalMaterial
          color={hairColors.rootHex}
          roughness={hairRoughness}
          clearcoat={anisotropyIntensity}
        />
      </mesh>

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
    activeCustomGlbUrl,
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

  const [photoTexture, setPhotoTexture] = useState<THREE.Texture | null>(null);

  // Costura limpa em Canvas 2D (Texture Baking):
  // Foto frontal no centro (olhos, nariz, boca) + orelhas e laterais das fotos de 45°
  useEffect(() => {
    if (!capturedPhotoDataUrl) return;

    let isMounted = true;
    const loader = new THREE.TextureLoader();

    const applyTexture = (url: string) => {
      loader.load(
        url,
        (tex) => {
          if (!isMounted) return;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          setPhotoTexture(tex);
        },
        undefined,
        (err) => console.warn('Erro ao carregar textura costurada:', err)
      );
    };

    // Por enquanto só a foto frontal: a malha atual (468 pontos) não tem orelhas nem laterais
    // do crânio, então não existe superfície correta para receber as fotos de 45°.
    applyTexture(capturedPhotoDataUrl);

    return () => {
      isMounted = false;
    };
  }, [capturedPhotoDataUrl]);

  // Geometria facial contínua de 468 pontos sem buracos
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

  if (activeCustomGlbUrl) {
    return (
      <group ref={groupRef} position={[0, 1.35, -0.65]}>
        <CustomGLBModel url={activeCustomGlbUrl} scale={1.05} />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 1.35, -0.65]}>
      {/* 1. MÁSCARA FACIAL FOTORREALISTA */}
      <mesh
        geometry={faceGeometry}
        position={[0, 0.11, 0.025]}
        scale={[morphJawWidth, morphCheekboneLift, 1.0]}
        castShadow
        receiveShadow
      >
        {photoTexture ? (
          <meshStandardMaterial
            map={photoTexture}
            roughness={0.42}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial color={skinColorHex} roughness={0.45} />
        )}
      </mesh>

      {/* 2. BASE DO CRÂNIO / PESCOÇO / BUSTO */}
      <group name="AnatomicalBase">
        {/* Crânio base */}
        <mesh position={[0, 0.13, -0.04]} scale={[0.82 * morphJawWidth, 1.04, 0.92]}>
          <sphereGeometry args={[0.235, 48, 48]} />
          <meshStandardMaterial color={skinColorHex} roughness={0.52} />
        </mesh>

        {/* Cabelo preso / Touca apenas no modo Antes */}
        {!showHairLayer && (
          <mesh position={[0, 0.165, -0.05]} scale={[0.84 * morphJawWidth, 1.05, 0.95]}>
            <sphereGeometry args={[0.238, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
            <meshPhysicalMaterial
              color={hairColors.rootHex}
              roughness={0.36}
              clearcoat={0.65}
              clearcoatRoughness={0.2}
            />
          </mesh>
        )}

        {/* Coque na nuca somente para feminino no modo Antes */}
        {!showHairLayer && !isMasculine && (
          <mesh position={[0, 0.135, -0.275]}>
            <sphereGeometry args={[0.078, 24, 24]} />
            <meshPhysicalMaterial
              color={hairColors.rootHex}
              roughness={0.34}
              clearcoat={0.7}
            />
          </mesh>
        )}

        {/* Pescoço */}
        <mesh position={[0, -0.21, -0.04]}>
          <cylinderGeometry args={[0.088, 0.108, 0.25, 32]} />
          <meshStandardMaterial color={skinColorHex} roughness={0.55} />
        </mesh>

        {/* Pedestal do Busto */}
        <mesh position={[0, -0.38, -0.04]} scale={[1.55, 0.5, 0.8]}>
          <sphereGeometry args={[0.23, 32, 24]} />
          <meshStandardMaterial color="#18181b" roughness={0.68} />
        </mesh>
      </group>

      {/* 3. CABELO 3D MODULAR */}
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
