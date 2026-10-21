import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Splat, useGLTF, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useVisagismStore } from '../../store/useVisagismStore';
import { buildFaceBufferGeometry } from '../../services/faceMeshBuilder';

const CustomGLBModel: React.FC<{ url: string; scale?: number }> = ({ url, scale = 1.0 }) => {
  const { scene } = useGLTF(url);

  // Normaliza e centraliza qualquer modelo .GLB externo automaticamente
  const normalizedScene = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Ajusta para que a cabeça tenha altura padrão de ~0.45m
    const maxDim = Math.max(size.x, size.y, size.z);
    const autoScale = maxDim > 0 ? (0.48 / maxDim) * scale : scale;

    cloned.scale.setScalar(autoScale);
    // Centraliza o pivô do modelo na altura do busto
    cloned.position.x = -center.x * autoScale;
    cloned.position.y = -center.y * autoScale + 0.08;
    cloned.position.z = -center.z * autoScale;

    return cloned;
  }, [scene, scale]);

  return <primitive object={normalizedScene} />;
};

/**
 * Arquitetura Modular de 3 Camadas Independentes no Three.js:
 * - CAMADA 1 (Fixa): Rosto 3D Real da Cliente (Malha Triangulada 468 Vértices MediaPipe + Textura Fotográfica UV + Crânio c/ Cabelo Preso)
 * - CAMADA 2 (Substituível em 0.01s): "Peruca 3D" Modular (Hair Cards Anisotrópicos ou .GLB/.Splat de Cabelo Isolado)
 * - CAMADA 3 (Substituível): Óculos 3D / Acessórios acoplados na ponte nasal
 */
export const VisagismBust3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    capturedPhotoDataUrl,
    faceLandmarks,
    skinColorHex,
    faceDepthRelief,
    showFaceMeshWireframe,
    showHairLayer,
    selectedHairPreset,
    hairColors,
    anisotropyIntensity,
    hairRoughness,
    hairVolumeScale,
    hairOffsetY,
    hairOffsetZ,
    customHairGlbUrl,
    selectedGlasses,
    renderMode3D,
    activeSplatUrl,
    activeCustomGlbUrl,
    showVisagismWireframe3D,
    autoRotate3D,
    biometrics,
  } = useVisagismStore();

  const [photoTexture, setPhotoTexture] = useState<THREE.Texture | null>(null);

  // Carrega a foto real da cliente como textura WebGL SRGB de alta definição
  useEffect(() => {
    if (!capturedPhotoDataUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(capturedPhotoDataUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      setPhotoTexture(tex);
    });
  }, [capturedPhotoDataUrl]);

  // Constrói a Geometria 3D Real do Rosto a partir dos 478 Landmarks do MediaPipe
  const { geometry: faceGeometry } = useMemo(() => {
    return buildFaceBufferGeometry(faceLandmarks, faceDepthRelief);
  }, [faceLandmarks, faceDepthRelief]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate3D) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  // Gera textura de gradiente Root-to-Tip + micro-fios anisotrópicos para a Peruca 3D
  const hairGradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, hairColors.rootHex);
    grad.addColorStop(0.45, hairColors.midHex);
    grad.addColorStop(1.0, hairColors.tipHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 480; i++) {
      const x = Math.random() * 512;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 7, 512);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [hairColors.rootHex, hairColors.midHex, hairColors.tipHex]);

  // Gera as fitas da Peruca 3D Modular (Camada 2)
  const hairStrands = useMemo(() => {
    const style = selectedHairPreset.styleGeometry;
    const strands: Array<{
      curve: THREE.CatmullRomCurve3;
      width: number;
    }> = [];

    const totalStrands = style === 'pixie_cut' ? 76 : 112;

    for (let i = 0; i < totalStrands; i++) {
      const t = i / totalStrands;
      const angle = t * Math.PI * 2;
      // Na frente (sin(angle) > 0.42), só desenha se for franja cortina (aberta nas laterais)
      const isFrontFace = Math.sin(angle) > 0.42;

      if (isFrontFace && style !== 'curtain_bangs') {
        continue;
      }

      const radiusX = 0.205;
      const radiusZ = 0.225;

      const startX = Math.cos(angle) * (radiusX * 0.85);
      const startY = 0.34;
      const startZ = Math.sin(angle) * (radiusZ * 0.85) - 0.02;

      let length = 0.62;
      let waveAmp = 0.032;

      if (style === 'pixie_cut') {
        length = 0.21;
        waveAmp = 0.012;
      } else if (style === 'long_bob') {
        length = 0.45 + (Math.sin(angle) > 0 ? 0.08 : 0);
        waveAmp = 0.016;
      } else if (style === 'shaggy_waves') {
        length = 0.58 + (i % 3) * 0.06;
        waveAmp = 0.055;
      } else if (style === 'curtain_bangs') {
        length = isFrontFace ? 0.27 : 0.64;
        waveAmp = 0.038;
      }

      // Abertura lateral da Curtain Bangs para não tampar os olhos da foto real da cliente
      const sidePush = isFrontFace ? (Math.cos(angle) >= 0 ? 0.13 : -0.13) : 0;

      const p0 = new THREE.Vector3(startX * 0.38, startY + 0.03, startZ * 0.38);
      const p1 = new THREE.Vector3(
        startX * 1.06 + sidePush * 0.55,
        startY - length * 0.25,
        startZ * 1.05 + (isFrontFace ? 0.06 : 0)
      );
      const p2 = new THREE.Vector3(
        startX * 1.18 + sidePush * 1.1 + Math.sin(i * 1.7) * waveAmp,
        startY - length * 0.65,
        startZ * 1.1 + Math.cos(i * 1.3) * waveAmp
      );
      const p3 = new THREE.Vector3(
        startX * 1.12 + sidePush * 1.25,
        startY - length,
        startZ * 1.06
      );

      strands.push({
        curve: new THREE.CatmullRomCurve3([p0, p1, p2, p3]),
        width: isFrontFace ? 0.019 : 0.029,
      });
    }

    return strands;
  }, [selectedHairPreset.styleGeometry]);

  return (
    <group ref={groupRef} position={[0, 1.35, -0.65]}>
      {renderMode3D === 'gaussian_splat' && activeSplatUrl ? (
        <group scale={0.85} position={[0, 0, 0]}>
          <Splat src={activeSplatUrl} />
        </group>
      ) : renderMode3D === 'custom_glb' && activeCustomGlbUrl ? (
        <CustomGLBModel url={activeCustomGlbUrl} scale={1.1} />
      ) : (
        <group>
          {/* =====================================================================
              CAMADA 1 (FIXA): ROSTO 3D REAL DA CLIENTE + CRÂNIO COM CABELO PRESO
             ===================================================================== */}
          <group name="Layer1_ClientRealFaceAndSkull">
            {/* Malha 3D Triangulada Real dos 468 Vértices do MediaPipe com a Foto da Cliente! */}
            <mesh geometry={faceGeometry} position={[0, 0.11, 0.025]} castShadow receiveShadow>
              {photoTexture ? (
                <meshStandardMaterial
                  map={photoTexture}
                  roughness={0.52}
                  metalness={0.02}
                  wireframe={showFaceMeshWireframe}
                  side={THREE.DoubleSide}
                />
              ) : (
                <meshStandardMaterial
                  color={skinColorHex}
                  roughness={0.48}
                  wireframe={showFaceMeshWireframe}
                />
              )}
            </mesh>

            {/* Crânio Anatômico Traseiro (No tom exato da pele da cliente) */}
            <mesh position={[0, 0.13, -0.035]} scale={[0.82, 1.04, 0.92]} castShadow>
              <sphereGeometry args={[0.235, 48, 48]} />
              <meshStandardMaterial color={skinColorHex} roughness={0.55} />
            </mesh>

            {/* Base de "Cabelo Preso / Coque" no Couro Cabeludo (Para NUNCA ficar careca estranha!) */}
            <mesh position={[0, 0.165, -0.045]} scale={[0.84, 1.05, 0.95]}>
              <sphereGeometry args={[0.238, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
              <meshPhysicalMaterial
                color={hairColors.rootHex}
                roughness={0.38}
                clearcoat={0.5}
              />
            </mesh>
            {/* Coque Traseiro Discreto (Visível quando a Peruca 3D é desligada) */}
            <mesh position={[0, 0.14, -0.27]}>
              <sphereGeometry args={[0.075, 24, 24]} />
              <meshPhysicalMaterial
                color={hairColors.rootHex}
                roughness={0.35}
                clearcoat={0.6}
              />
            </mesh>

            {/* Pescoço & Busto no Tom de Pele Extraído da Foto */}
            <mesh position={[0, -0.21, -0.04]}>
              <cylinderGeometry args={[0.088, 0.108, 0.25, 32]} />
              <meshStandardMaterial color={skinColorHex} roughness={0.58} />
            </mesh>

            <mesh position={[0, -0.38, -0.04]} scale={[1.55, 0.5, 0.8]}>
              <sphereGeometry args={[0.23, 32, 24]} />
              <meshStandardMaterial color="#18181b" roughness={0.7} />
            </mesh>
          </group>

          {/* =====================================================================
              CAMADA 2 (MODULAR): "PERUCA 3D" SUBSTITUÍVEL NO OSSO DA CABEÇA
              (Troca de corte/cor em 0.01s sem nunca reconstruir o rosto da Camada 1)
             ===================================================================== */}
          {showHairLayer && (
            <group
              name="Layer2_ModularHairWig"
              position={[0, hairOffsetY, hairOffsetZ]}
              scale={[hairVolumeScale, 1, hairVolumeScale]}
            >
              {customHairGlbUrl ? (
                <CustomGLBModel url={customHairGlbUrl} scale={1.0} />
              ) : (
                hairStrands.map((strand, idx) => (
                  <mesh key={idx} castShadow>
                    <tubeGeometry args={[strand.curve, 24, strand.width, 6, false]} />
                    <meshPhysicalMaterial
                      map={hairGradientTexture}
                      roughness={hairRoughness}
                      metalness={0.08}
                      clearcoat={anisotropyIntensity}
                      clearcoatRoughness={0.18}
                      sheen={anisotropyIntensity}
                      sheenRoughness={0.25}
                      sheenColor={new THREE.Color(hairColors.tipHex)}
                    />
                  </mesh>
                ))
              )}
            </group>
          )}

          {/* =====================================================================
              CAMADA 3 (MODULAR): ÓCULOS 3D ACOPLADOS NA PONTE NASAL
             ===================================================================== */}
          {selectedGlasses.frameShape !== 'Nenhum' && (
            <group name="Layer3_ModularGlasses" position={[0, 0.145, 0.225]}>
              <mesh position={[0, 0.015, 0]}>
                <boxGeometry args={[0.045, 0.008, 0.01]} />
                <meshStandardMaterial
                  color={selectedGlasses.frameColorHex}
                  metalness={0.85}
                  roughness={0.2}
                />
              </mesh>

              {[-0.072, 0.072].map((xPos, i) => (
                <group
                  key={i}
                  position={[xPos, 0, 0]}
                  rotation={[
                    0,
                    0,
                    selectedGlasses.frameShape === 'Gatinho (Cat-Eye)'
                      ? i === 0
                        ? -0.18
                        : 0.18
                      : 0,
                  ]}
                >
                  <mesh>
                    <torusGeometry
                      args={[
                        0.05,
                        0.005,
                        16,
                        selectedGlasses.frameShape === 'Geométrico Hexagonal' ? 6 : 32,
                      ]}
                    />
                    <meshStandardMaterial
                      color={selectedGlasses.frameColorHex}
                      metalness={0.75}
                      roughness={0.22}
                    />
                  </mesh>
                  <mesh>
                    <circleGeometry
                      args={[
                        0.046,
                        selectedGlasses.frameShape === 'Geométrico Hexagonal' ? 6 : 32,
                      ]}
                    />
                    <meshPhysicalMaterial
                      color={selectedGlasses.lensTintHex}
                      transparent
                      opacity={0.25}
                      roughness={0.1}
                      transmission={0.65}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* Linhas de Visagismo 3D Opcionais */}
          {showVisagismWireframe3D && (
            <group position={[0, 0, 0.25]}>
              {[
                { y: 0.31, label: `1º Terço (${biometrics?.thirds.upper ?? 32}%)` },
                { y: 0.13, label: `2º Terço (${biometrics?.thirds.middle ?? 35}%)` },
                { y: -0.03, label: `3º Terço (${biometrics?.thirds.lower ?? 33}%)` },
              ].map((line, idx) => (
                <group key={idx} position={[0, line.y, 0]}>
                  <Line
                    points={[
                      [-0.26, 0, 0],
                      [0.26, 0, 0],
                    ]}
                    color="#D4AF37"
                    lineWidth={1.5}
                    dashed
                    dashSize={0.02}
                    gapSize={0.015}
                  />
                  <Text
                    position={[0.29, 0, 0]}
                    fontSize={0.02}
                    color="#E5C158"
                    anchorX="left"
                    anchorY="middle"
                  >
                    {line.label}
                  </Text>
                </group>
              ))}
            </group>
          )}
        </group>
      )}
    </group>
  );
};
