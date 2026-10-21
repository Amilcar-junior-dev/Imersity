import React, { useMemo } from 'react';
import * as THREE from 'three';

interface VitreousEyes3DProps {
  leftEyePos: THREE.Vector3;
  rightEyePos: THREE.Vector3;
  irisColorHex?: string;
  depthScale?: number;
}

/**
 * Olhos 3D Físicos Desacoplados (Vitreous Decoupled Eyeballs):
 * - Posicionados exatamente nas coordenadas 3D dos cantos oculares calculados pelo MediaPipe.
 * - Cúpula transparente de córnea com refração real (IOR 1.376) e reflexo especular de estúdio.
 * - Elimina 100% a aparência de olhos colados e opacos.
 */
export const VitreousEyes3D: React.FC<VitreousEyes3DProps> = ({
  leftEyePos,
  rightEyePos,
  irisColorHex = '#2c1c11', // Castanho escuro / avelã natural
}) => {
  const irisTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const center = size * 0.5;
    const radius = size * 0.46;

    // Fundo escleral
    ctx.fillStyle = '#f8f7f5';
    ctx.fillRect(0, 0, size, size);

    // Círculo da Íris com anel limbal externo
    const grad = ctx.createRadialGradient(
      center,
      center,
      radius * 0.35,
      center,
      center,
      radius
    );
    grad.addColorStop(0, irisColorHex);
    grad.addColorStop(0.85, irisColorHex);
    grad.addColorStop(1.0, '#0a0806');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    // Estrias de melanina
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * (radius * 0.35), center + Math.sin(angle) * (radius * 0.35));
      ctx.lineTo(center + Math.cos(angle) * (radius * 0.95), center + Math.sin(angle) * (radius * 0.95));
      ctx.stroke();
    }

    // Pupila central preta profunda
    ctx.fillStyle = '#020202';
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [irisColorHex]);

  const eyeRadius = 0.0135;

  return (
    <group name="VitreousEyeAssembly">
      {/* 1. Olho Esquerdo */}
      <group position={[leftEyePos.x, leftEyePos.y, leftEyePos.z - 0.003]}>
        {/* Globo Escleral */}
        <mesh>
          <sphereGeometry args={[eyeRadius, 24, 20]} />
          <meshStandardMaterial color="#f8f7f5" roughness={0.3} metalness={0.0} />
        </mesh>
        {/* Íris e Pupila */}
        <mesh position={[0, 0, eyeRadius * 0.9]}>
          <circleGeometry args={[eyeRadius * 0.58, 24]} />
          <meshStandardMaterial map={irisTexture || undefined} roughness={0.4} />
        </mesh>
        {/* Córnea Transparente */}
        <mesh position={[0, 0, eyeRadius * 0.3]}>
          <sphereGeometry args={[eyeRadius * 1.04, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshPhysicalMaterial
            transmission={0.88}
            ior={1.376}
            roughness={0.02}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            transparent={true}
            opacity={0.95}
          />
        </mesh>
      </group>

      {/* 2. Olho Direito */}
      <group position={[rightEyePos.x, rightEyePos.y, rightEyePos.z - 0.003]}>
        {/* Globo Escleral */}
        <mesh>
          <sphereGeometry args={[eyeRadius, 24, 20]} />
          <meshStandardMaterial color="#f8f7f5" roughness={0.3} metalness={0.0} />
        </mesh>
        {/* Íris e Pupila */}
        <mesh position={[0, 0, eyeRadius * 0.9]}>
          <circleGeometry args={[eyeRadius * 0.58, 24]} />
          <meshStandardMaterial map={irisTexture || undefined} roughness={0.4} />
        </mesh>
        {/* Córnea Transparente */}
        <mesh position={[0, 0, eyeRadius * 0.3]}>
          <sphereGeometry args={[eyeRadius * 1.04, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshPhysicalMaterial
            transmission={0.88}
            ior={1.376}
            roughness={0.02}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            transparent={true}
            opacity={0.95}
          />
        </mesh>
      </group>
    </group>
  );
};
