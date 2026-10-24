import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useVisagismStore } from '../../store/useVisagismStore';
import { buildFaceBufferGeometry } from '../../services/faceMeshBuilder';
import { SculptedEar3D } from './SculptedEar3D';
import { VitreousEyes3D } from './VitreousEyes3D';
import { createMultiViewProjectedMaterial } from '../../services/multiViewProjection';

interface ErrorBoundaryProps {
  onError?: (err: any) => void;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

class GLTFErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Erro ao carregar modelo GLB:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

const CustomGLBModel: React.FC<{
  url: string;
  scale?: number;
  materialMode?: 'original_pbr' | 'projected_photos' | 'clay_unpainted';
  frontalPhoto?: string | null;
  leftPhoto?: string | null;
  rightPhoto?: string | null;
  skinColorHex?: string;
  projScale?: number;
  projOffsetX?: number;
  projOffsetY?: number;
  projBlendFeather?: number;
}> = ({
  url,
  scale = 1.0,
  materialMode = 'original_pbr',
  frontalPhoto,
  leftPhoto,
  rightPhoto,
  skinColorHex = '#dca88c',
  projScale = 1.0,
  projOffsetX = 0.0,
  projOffsetY = 0.0,
  projBlendFeather = 0.35,
}) => {
  const { scene } = useGLTF(url);
  const loader = useMemo(() => new THREE.TextureLoader(), []);

  const projectedMaterial = useMemo(() => {
    if (materialMode === 'clay_unpainted') {
      return new THREE.MeshStandardMaterial({
        color: '#e4e4e7',
        roughness: 0.48,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
    }
    if (materialMode === 'projected_photos') {
      if (!frontalPhoto && !leftPhoto && !rightPhoto) {
        // Sem fotos reais carregadas: fallback seguro e estético para Clay Puro
        return new THREE.MeshStandardMaterial({
          color: '#e4e4e7',
          roughness: 0.48,
          metalness: 0.02,
          side: THREE.DoubleSide,
        });
      }
      return createMultiViewProjectedMaterial(loader, {
        frontalPhotoUrl: frontalPhoto,
        leftPhotoUrl: leftPhoto,
        rightPhotoUrl: rightPhoto,
        skinColorHex,
        projectionOpacity: 1.0,
        projScale,
        projOffsetX,
        projOffsetY,
        projBlendFeather,
      });
    }
    return null;
  }, [
    materialMode,
    frontalPhoto,
    leftPhoto,
    rightPhoto,
    skinColorHex,
    loader,
    projScale,
    projOffsetX,
    projOffsetY,
    projBlendFeather,
  ]);

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

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (projectedMaterial) {
          mesh.material = projectedMaterial;
        } else if (mesh.material) {
          // Garante DoubleSide em todos os materiais PBR originais do GLB
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.side = THREE.DoubleSide;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    return cloned;
  }, [scene, scale, projectedMaterial]);

  return <primitive object={normalizedScene} />;
};

/**
 * Cabelo Masculino 3D Esculpido (Fade, Taper, Topete Texturizado & Quiff):
 * Esculpido em mechas anatômicas que vestem suavemente o crânio sem capacete.
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

    const count = isCrew ? 48 : 80;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const angle = Math.random() * Math.PI * 2;
      // Raio ajustado para o crânio humano (~8.5cm a 9.5cm)
      const rX = Math.sqrt(u) * 0.088;
      const rZ = Math.sqrt(u) * 0.098;

      const baseX = Math.cos(angle) * rX;
      const baseZ = Math.sin(angle) * rZ - 0.015;
      const baseY = 0.165; // Altura do couro cabeludo superior

      let topOffsetZ = 0.025;
      let topOffsetY = isQuiff ? 0.055 : isCrew ? 0.018 : 0.038;
      let topOffsetX = isSidePart ? 0.03 : (Math.random() - 0.5) * 0.02;

      if (baseZ > 0.01) {
        topOffsetZ += 0.02;
        topOffsetY += 0.015;
      }

      const p0 = new THREE.Vector3(baseX, baseY, baseZ);
      const p1 = new THREE.Vector3(
        baseX + topOffsetX * 0.5,
        baseY + topOffsetY * 0.6,
        baseZ + topOffsetZ * 0.5
      );
      const p2 = new THREE.Vector3(
        baseX + topOffsetX,
        baseY + topOffsetY + (Math.random() - 0.5) * 0.01,
        baseZ + topOffsetZ
      );

      clusters.push({
        curve: new THREE.CatmullRomCurve3([p0, p1, p2]),
        radius: isCrew ? 0.005 : 0.007 + Math.random() * 0.004,
      });
    }

    return clusters;
  }, [styleGeometry]);

  return (
    <group scale={[volumeScale, volumeScale, volumeScale]}>
      {/* 1. Base fina e ajustada do couro cabeludo (sem capacete gigante) */}
      <mesh position={[0, 0.155, -0.02]} scale={[0.88, 0.42, 0.94]}>
        <sphereGeometry args={[0.098, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshPhysicalMaterial
          color={hairColors.rootHex}
          roughness={hairRoughness}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* 2. Mechas 3D Texturizadas */}
      <group>
        {hairClusters.map((cluster, idx) => (
          <mesh key={idx}>
            <tubeGeometry args={[cluster.curve, 8, cluster.radius, 6, false]} />
            <meshPhysicalMaterial
              color={idx % 3 === 0 ? hairColors.midHex : hairColors.rootHex}
              roughness={hairRoughness}
              clearcoat={anisotropyIntensity}
              clearcoatRoughness={0.25}
            />
          </mesh>
        ))}
      </group>
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
    const total = styleGeometry === 'pixie_cut' ? 48 : 84;

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const isFront = Math.sin(angle) > 0.35;

      if (isFront && styleGeometry !== 'curtain_bangs' && styleGeometry !== 'pixie_cut') {
        continue;
      }

      const startX = Math.cos(angle) * 0.095;
      const startY = 0.165;
      const startZ = Math.sin(angle) * 0.105 - 0.02;

      let length = 0.28;
      if (styleGeometry === 'pixie_cut') length = 0.10;
      else if (styleGeometry === 'long_bob') length = 0.22;

      const p0 = new THREE.Vector3(startX, startY, startZ);
      const p1 = new THREE.Vector3(
        startX * 1.12,
        startY - length * 0.5,
        startZ + (isFront ? 0.03 : -0.02)
      );
      const p2 = new THREE.Vector3(
        startX * 1.18,
        startY - length,
        startZ + (isFront ? 0.05 : -0.03)
      );

      list.push({
        curve: new THREE.CatmullRomCurve3([p0, p1, p2]),
        radius: 0.007,
      });
    }

    return list;
  }, [styleGeometry]);

  return (
    <group scale={[volumeScale, volumeScale, volumeScale]}>
      {/* Base anatômica ajustada */}
      <mesh position={[0, 0.158, -0.02]} scale={[0.9, 0.45, 0.95]}>
        <sphereGeometry args={[0.099, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
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
    leftSidePhotoUrl,
    rightSidePhotoUrl,
    activeCustomGlbUrl,
    modelTextureMode,
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
    projScale,
    projOffsetX,
    projOffsetY,
    projBlendFeather,
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
  const { geometry: faceGeometry, leftEyePos, rightEyePos } = useMemo(() => {
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
        <GLTFErrorBoundary
          onError={() => {
            console.warn('[GLTFErrorBoundary] Falha ao carregar modelo. Limpando cache local...');
            localStorage.removeItem('IMERSITY_SAVED_GLB_URL');
            useVisagismStore.getState().setActiveCustomGlbUrl(null);
          }}
        >
          <CustomGLBModel
            url={activeCustomGlbUrl}
            scale={1.05}
            materialMode={modelTextureMode}
            frontalPhoto={capturedPhotoDataUrl}
            leftPhoto={leftSidePhotoUrl}
            rightPhoto={rightSidePhotoUrl}
            skinColorHex={skinColorHex}
            projScale={projScale}
            projOffsetX={projOffsetX}
            projOffsetY={projOffsetY}
            projBlendFeather={projBlendFeather}
          />
        </GLTFErrorBoundary>

        {/* Cabelo Modular 3D acoplado ao topo da cabeça do modelo GLB */}
        {showHairLayer && (
          <group position={[0, 0.08 + hairOffsetY, hairOffsetZ]}>
            {isMasculine ? (
              <SculptedMaleHair
                styleGeometry={selectedHairPreset.styleGeometry}
                hairColors={hairColors}
                anisotropyIntensity={anisotropyIntensity}
                hairRoughness={hairRoughness}
                volumeScale={hairVolumeScale}
              />
            ) : (
              <FlowingFemaleHair
                styleGeometry={selectedHairPreset.styleGeometry}
                hairColors={hairColors}
                anisotropyIntensity={anisotropyIntensity}
                hairRoughness={hairRoughness}
                volumeScale={hairVolumeScale}
              />
            )}
          </group>
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 1.35, -0.65]}>
      {/* 1. MÁSCARA FACIAL FOTORREALISTA DA CLIENTE (MediaPipe Landmarks Reais) */}
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

      {/* 2. OLHOS 3D FÍSICOS DESACOPLADOS (Córnea Vítrea Refrativa IOR 1.376) */}
      <group position={[0, 0.11, 0.025]} scale={[morphJawWidth, morphCheekboneLift, 1.0]}>
        <VitreousEyes3D
          leftEyePos={leftEyePos}
          rightEyePos={rightEyePos}
          irisColorHex="#2b1b12"
        />
      </group>

      {/* 3. BASE DO CRÂNIO, ORELHAS ANATÔMICAS, PESCOÇO E BUSTO */}
      <group name="AnatomicalBase">
        {/* Crânio base limpo (Pele Contínua) */}
        <mesh position={[0, 0.13, -0.045]} scale={[0.83 * morphJawWidth, 1.04, 0.93]}>
          <sphereGeometry args={[0.235, 48, 48]} />
          <meshStandardMaterial color={skinColorHex} roughness={0.48} />
        </mesh>

        {/* Orelhas Anatômicas Esculpidas (Esquerda e Direita) */}
        <SculptedEar3D
          side="left"
          skinColorHex={skinColorHex}
          position={[-0.174 * morphJawWidth, 0.08, -0.035]}
          scale={1.0}
        />
        <SculptedEar3D
          side="right"
          skinColorHex={skinColorHex}
          position={[0.174 * morphJawWidth, 0.08, -0.035]}
          scale={1.0}
        />

        {/* Pescoço anatômico */}
        <mesh position={[0, -0.21, -0.04]}>
          <cylinderGeometry args={[0.088, 0.108, 0.25, 32]} />
          <meshStandardMaterial color={skinColorHex} roughness={0.52} />
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
