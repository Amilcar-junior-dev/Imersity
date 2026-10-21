import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SculptedEar3DProps {
  side: 'left' | 'right';
  skinColorHex: string;
  position?: [number, number, number];
  scale?: number;
}

/**
 * Orelha Anatômica Esculpida 3D (Hélice, Concha, Antitrago e Lóbulo):
 * Proporciona acabamento lateral realista para o crânio e busto clínico.
 */
export const SculptedEar3D: React.FC<SculptedEar3DProps> = ({
  side,
  skinColorHex,
  position = [0, 0, 0],
  scale = 1.0,
}) => {
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;

  // Curva anatômica da hélice da orelha (Helix curve)
  const helixCurve = useMemo(() => {
    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, -0.026, 0.002), // Lóbulo inferior
      new THREE.Vector3(sign * 0.006, -0.015, -0.012), // Margem posterior
      new THREE.Vector3(sign * 0.008, 0.008, -0.014), // Hélice média
      new THREE.Vector3(sign * 0.006, 0.028, -0.008), // Hélice superior
      new THREE.Vector3(sign * 0.002, 0.032, 0.004), // Vértice superior
      new THREE.Vector3(0, 0.022, 0.010), // Raiz da hélice anterior
      new THREE.Vector3(-sign * 0.002, 0.010, 0.008), // Trago anterior
    ];
    return new THREE.CatmullRomCurve3(points);
  }, [sign]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. Hélice Externa (Borda Cartilaginosa) */}
      <mesh>
        <tubeGeometry args={[helixCurve, 20, 0.0038, 8, false]} />
        <meshStandardMaterial
          color={skinColorHex}
          roughness={0.46}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Concha e Fossa Escafóide (Corpo Interno da Orelha) */}
      <mesh position={[sign * 0.002, 0.006, -0.004]} rotation={[0, sign * 0.2, 0]}>
        <sphereGeometry args={[0.018, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial
          color={skinColorHex}
          roughness={0.52}
          metalness={0.02}
        />
      </mesh>

      {/* 3. Lóbulo Inferior (Ponto Anatômico Macio) */}
      <mesh position={[0, -0.026, 0.002]} scale={[0.8, 1.2, 0.7]}>
        <sphereGeometry args={[0.0075, 16, 16]} />
        <meshStandardMaterial
          color={skinColorHex}
          roughness={0.48}
        />
      </mesh>

      {/* 4. Trago Anterior (Aba Protetora do Conduto Auditivo) */}
      <mesh position={[-sign * 0.001, 0.005, 0.008]} scale={[0.7, 1.0, 0.6]}>
        <sphereGeometry args={[0.005, 12, 12]} />
        <meshStandardMaterial
          color={skinColorHex}
          roughness={0.48}
        />
      </mesh>
    </group>
  );
};
