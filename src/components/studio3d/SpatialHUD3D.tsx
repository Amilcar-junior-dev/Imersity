import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { HAIR_PRESETS, GLASSES_PRESETS, useVisagismStore } from '../../store/useVisagismStore';

/**
 * Painel Espacial 3D (HUD) que flutua ao lado do Busto quando o Visagista está
 * com o Meta Quest 3 em modo Passthrough AR (interagível via Hand Tracking ou Controller).
 */
export const SpatialHUD3D: React.FC = () => {
  const {
    clientName,
    biometrics,
    selectedHairPreset,
    selectHairPreset,
    selectedGlasses,
    selectGlasses,
    setHairColors,
    toggleVisagismWireframe3D,
    showVisagismWireframe3D,
  } = useVisagismStore();

  const colorSwatches = [
    { label: 'Moreno Iluminado Mel', root: '#2b1b12', mid: '#7c4d25', tip: '#c88a4b' },
    { label: 'Loiro Pérola 9.89', root: '#3d2b1f', mid: '#b89b72', tip: '#e8d8be' },
    { label: 'Ruivo Acobreado 7.44', root: '#4a1c11', mid: '#9e3818', tip: '#d95b26' },
    { label: 'Preto Azulado Intenso', root: '#09090b', mid: '#18181b', tip: '#27272a' },
  ];

  return (
    <group position={[-0.68, 1.38, -0.58]} rotation={[0, 0.38, 0]}>
      {/* Fundo do Painel Holográfico */}
      <RoundedBox args={[0.56, 0.72, 0.015]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#09090b" transparent opacity={0.86} roughness={0.2} />
      </RoundedBox>

      {/* Cabeçalho de Telemetria do Quest 3 */}
      <Text
        position={[-0.24, 0.3, 0.012]}
        fontSize={0.024}
        color="#E5C158"
        anchorX="left"
        anchorY="middle"
      >
        ESTAÇÃO ESPACIAL VISAGISTA (QUEST 3)
      </Text>

      <Text
        position={[-0.24, 0.26, 0.012]}
        fontSize={0.02}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
      >
        {`${clientName} • Rosto ${biometrics?.faceShape || 'Oval'} (${biometrics?.symmetryScore || 96}%)`}
      </Text>

      {/* Botões 3D de Cortes Visagistas (Clicáveis no Ar no Quest 3) */}
      <Text
        position={[-0.24, 0.19, 0.012]}
        fontSize={0.018}
        color="#a1a1aa"
        anchorX="left"
        anchorY="middle"
      >
        TOQUE PARA TROCAR O CORTE 3D:
      </Text>

      {HAIR_PRESETS.map((preset, idx) => {
        const isSelected = selectedHairPreset.id === preset.id;
        const yPos = 0.13 - idx * 0.065;
        return (
          <group
            key={preset.id}
            position={[0, yPos, 0.014]}
            onClick={(e) => {
              e.stopPropagation();
              selectHairPreset(preset);
            }}
          >
            <RoundedBox args={[0.48, 0.052, 0.01]} radius={0.008}>
              <meshStandardMaterial
                color={isSelected ? '#D4AF37' : '#27272a'}
                roughness={0.3}
              />
            </RoundedBox>
            <Text
              position={[-0.21, 0, 0.008]}
              fontSize={0.017}
              color={isSelected ? '#09090b' : '#f4f4f5'}
              anchorX="left"
              anchorY="middle"
            >
              {preset.name.slice(0, 34)}
            </Text>
          </group>
        );
      })}

      {/* Seletor Rápido de Colorimetria no Ar */}
      <Text
        position={[-0.24, -0.14, 0.012]}
        fontSize={0.018}
        color="#a1a1aa"
        anchorX="left"
        anchorY="middle"
      >
        PALETA DE MECHAS (ROOT-TO-TIP):
      </Text>

      {colorSwatches.map((swatch, idx) => {
        const xPos = -0.18 + idx * 0.12;
        return (
          <group
            key={swatch.label}
            position={[xPos, -0.2, 0.015]}
            onClick={(e) => {
              e.stopPropagation();
              setHairColors({
                rootHex: swatch.root,
                midHex: swatch.mid,
                tipHex: swatch.tip,
              });
            }}
          >
            <mesh>
              <circleGeometry args={[0.035, 24]} />
              <meshStandardMaterial color={swatch.tip} />
            </mesh>
          </group>
        );
      })}

      {/* Botão para Alternar Óculos e Linhas Áureas */}
      <group
        position={[-0.12, -0.29, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          const currentIdx = GLASSES_PRESETS.findIndex((g) => g.id === selectedGlasses.id);
          const next = GLASSES_PRESETS[(currentIdx + 1) % GLASSES_PRESETS.length];
          selectGlasses(next);
        }}
      >
        <RoundedBox args={[0.22, 0.048, 0.01]} radius={0.008}>
          <meshStandardMaterial color="#1e293b" />
        </RoundedBox>
        <Text position={[0, 0, 0.008]} fontSize={0.016} color="#38bdf8">
          Trocar Óculos 3D
        </Text>
      </group>

      <group
        position={[0.13, -0.29, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisagismWireframe3D();
        }}
      >
        <RoundedBox args={[0.22, 0.048, 0.01]} radius={0.008}>
          <meshStandardMaterial color={showVisagismWireframe3D ? '#065f46' : '#27272a'} />
        </RoundedBox>
        <Text position={[0, 0, 0.008]} fontSize={0.016} color="#ffffff">
          Linhas Visagismo
        </Text>
      </group>
    </group>
  );
};
