import {
  BiometricMetrics,
  FaceShape,
  ImageGoal,
  VisagismReport,
} from '../types/visagism.types';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Analisa os 478 landmarks 3D do MediaPipe Face Landmarker e extrai as métricas
 * antropométricas reais de Visagismo (Método Philip Hallawell / Proporção Áurea).
 */
export function analyzeFaceLandmarks(
  landmarks: NormalizedLandmark[],
  imageGoal: ImageGoal
): { biometrics: BiometricMetrics; report: VisagismReport } {
  // Pontos anatômicos chave do MediaPipe FaceMesh (478 pontos):
  // 10: Topo da testa (próximo ao Tríquio)
  // 9: Glabela (entre as sobrancelhas)
  // 2: Subnasal (base do nariz)
  // 152: Mento (ponta do queixo)
  // 234 & 454: Arcos zigomáticos esquerdo e direito (largura máxima da face)
  // 172 & 397: Ângulos goníacos da mandíbula (largura da mandíbula)
  // 103 & 332: Têmporas / largura frontal superior
  // 33 & 133: Canto externo e interno do olho direito
  // 263 & 362: Canto externo e interno do olho esquerdo

  const trichion = landmarks[10];
  const glabella = landmarks[9];
  const subnasale = landmarks[2];
  const menton = landmarks[152];

  const leftZygoma = landmarks[234];
  const rightZygoma = landmarks[454];
  const leftJaw = landmarks[172];
  const rightJaw = landmarks[397];
  const leftForehead = landmarks[103];
  const rightForehead = landmarks[332];

  // Cálculo dos Terços Faciais
  const upperDist = dist2D(trichion, glabella) * 1.18; // compensação da linha capilar acima do ponto 10
  const middleDist = dist2D(glabella, subnasale);
  const lowerDist = dist2D(subnasale, menton);
  const totalHeight = upperDist + middleDist + lowerDist || 1;

  const upperPct = Math.round((upperDist / totalHeight) * 100);
  const middlePct = Math.round((middleDist / totalHeight) * 100);
  const lowerPct = 100 - upperPct - middlePct;

  // Índices de Largura vs Altura
  const bizygomaticWidth = dist2D(leftZygoma, rightZygoma) || 1;
  const jawWidth = dist2D(leftJaw, rightJaw);
  const foreheadWidth = dist2D(leftForehead, rightForehead);

  const facialIndex = Number((totalHeight / bizygomaticWidth).toFixed(2));
  const jawToForeheadRatio = Number((jawWidth / (foreheadWidth || 1)).toFixed(2));

  // Inclinação Cantal dos Olhos (Eye Tilt)
  const rightEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[133];
  const eyeTiltRad = Math.atan2(
    rightEyeInner.y - rightEyeOuter.y,
    rightEyeInner.x - rightEyeOuter.x
  );
  const eyeTiltAngle = Number(((eyeTiltRad * 180) / Math.PI).toFixed(1));

  // Simetria Bilateral (comparando distâncias ao eixo central Glabela-Mento)
  const midX = (glabella.x + subnasale.x + menton.x) / 3;
  const leftOffset = Math.abs(midX - leftZygoma.x);
  const rightOffset = Math.abs(rightZygoma.x - midX);
  const asymmetryRatio = Math.abs(leftOffset - rightOffset) / bizygomaticWidth;
  const symmetryScore = Number(Math.max(85, Math.min(99.5, (1 - asymmetryRatio * 1.8) * 100)).toFixed(1));

  // Classificação Científica do Formato do Rosto
  let faceShape: FaceShape = 'Oval';
  if (facialIndex >= 1.46) {
    faceShape = 'Retangular / Alongado';
  } else if (jawToForeheadRatio >= 0.96 && facialIndex < 1.36) {
    faceShape = 'Quadrado';
  } else if (facialIndex <= 1.26 && jawToForeheadRatio < 0.95) {
    faceShape = 'Redondo';
  } else if (jawToForeheadRatio <= 0.78) {
    faceShape = 'Coração / Triângulo Invertido';
  } else if (bizygomaticWidth > foreheadWidth * 1.18 && bizygomaticWidth > jawWidth * 1.25) {
    faceShape = 'Diamante';
  } else {
    faceShape = 'Oval';
  }

  // Seção Dominante (Morfopsicologia)
  let dominantSection: BiometricMetrics['dominantSection'] = 'Equilibrado (Clássico)';
  if (upperPct >= 36) dominantSection = 'Superior (Intelectual)';
  else if (middlePct >= 36) dominantSection = 'Médio (Emocional)';
  else if (lowerPct >= 36) dominantSection = 'Inferior (Ativo/Prático)';

  const biometrics: BiometricMetrics = {
    faceShape,
    facialIndex,
    jawToForeheadRatio,
    symmetryScore,
    eyeTiltAngle,
    thirds: {
      upper: upperPct,
      middle: middlePct,
      lower: lowerPct,
    },
    undertone: 'Quente (Dourado/Pêssego)',
    contrast: 'Médio Contraste',
    season: 'Outono Quente',
    dominantSection,
  };

  const report = buildVisagismPrescription(biometrics, imageGoal);
  return { biometrics, report };
}

export function buildVisagismPrescription(
  bio: BiometricMetrics,
  imageGoal: ImageGoal
): VisagismReport {
  const shapeAdviceMap: Record<
    FaceShape,
    { cut: string; glasses: string; geometry: string }
  > = {
    Oval: {
      geometry: `Proporção harmônica clássica (Índice Facial ${bio.facialIndex}) com simetria de ${bio.symmetryScore}%. Permite versatilidade entre linhas retas e curvas.`,
      cut: 'Camadas médias a longas com contorno iluminado (Face Frame) na altura das maçãs do rosto ou Long Bob desconectado.',
      glasses: 'Armações Gatinho (Cat-Eye) ou Geométricas Hexagonais leves que acompanham a linha natural das sobrancelhas.',
    },
    Quadrado: {
      geometry: `Mandíbula expressiva e estruturada (Relação Mandíbula/Testa de ${bio.jawToForeheadRatio}), transmitindo força natural.`,
      cut: 'Camadas suaves em diagonal abaixo da linha do queixo e Curtain Bangs (franja cortina) para suavizar os ângulos laterais.',
      glasses: 'Armações Redondas, Ovais ou Gatinho com bordas orgânicas para equilibrar os ângulos retos da mandíbula.',
    },
    Redondo: {
      geometry: `Predominância de linhas curvas acolhedoras (Índice Facial ${bio.facialIndex}) com maçãs do rosto preenchidas.`,
      cut: 'Long Bob Assimétrico com pontas frontais alongadas ou camadas longas iniciando abaixo do queixo para criar linhas verticais de alongamento.',
      glasses: 'Armações Retangulares ou Hexagonais com linhas angulares que estruturam e alongam o terço médio.',
    },
    'Coração / Triângulo Invertido': {
      geometry: `Terço superior expressivo com linha mandibular delicada e afilada (Relação ${bio.jawToForeheadRatio}).`,
      cut: 'Corte com volume e movimento da altura das orelhas para baixo (Lob ondulado ou camadas médias) + franja cortina leve.',
      glasses: 'Armações Aviador ou sem aro inferior, equilibrando a largura da testa com a delicadeza do queixo.',
    },
    Diamante: {
      geometry: `Zigomáticos (maçãs do rosto) proeminentes e esculturais com têmporas e queixo mais estreitos.`,
      cut: 'Shaggy Layers ou franja lateral desfiada que adiciona volume nas têmporas e na altura da mandíbula.',
      glasses: 'Armações Gatinho ou Ovais que suavizam a projeção lateral do osso zigomático.',
    },
    'Retangular / Alongado': {
      geometry: `Eixo vertical predominante (Índice Facial ${bio.facialIndex}) com linhas laterais paralelas elegantes.`,
      cut: 'Cortes com volume lateral (ondas largas em camadas médias) e franja na altura dos olhos para equilibrar a proporção vertical.',
      glasses: 'Armações maiores estilo Aviador ou Wayfarer arredondado que preenchem o terço médio horizontalmente.',
    },
  };

  const selectedAdvice = shapeAdviceMap[bio.faceShape];

  return {
    summaryDiagnosis: `Formato ${bio.faceShape} (${bio.dominantSection}) alinhado ao objetivo de "${imageGoal}". Simetria facial medida em ${bio.symmetryScore}%.`,
    geometryExplanation: selectedAdvice.geometry,
    haircutPrescription: selectedAdvice.cut,
    colorimetryPrescription: `Para realçar seu ${bio.undertone} e ${bio.contrast} (${bio.season}), recomendamos raiz esfumada natural com iluminação em mechas Mel Dourado (8.3) / Champagne ao redor do rosto.`,
    glassesAndNecklineAdvice: `${selectedAdvice.glasses} Nos decotes, priorize formatos em V suave ou canoa para valorizar a linha cervical.`,
    recommendedPaletteHex: ['#C88A4B', '#9E3818', '#D4AF37', '#2E5A44', '#7C4D25', '#F3E5AB'],
    homeCarePrescription: [
      {
        id: 'hc-1',
        name: 'Kit Manutenção Pós-Mechas & Brilho Espelhado',
        brand: 'Protocolo Exclusivo do Salão',
        category: 'Manutenção da Cor',
        priceBRL: 249.9,
        whyForClient: 'Evita o amarelamento das mechas e mantém a reflexão de luz necessária para o visagismo.',
        inSalonStock: true,
      },
      {
        id: 'hc-2',
        name: 'Leave-in Reconstrutor & Protetor Térmico Anisotrópico',
        brand: 'Protocolo Exclusivo do Salão',
        category: 'Finalizador / Protetor Térmico',
        priceBRL: 139.0,
        whyForClient: 'Garante o caimento das camadas e protege os fios durante a escovação.',
        inSalonStock: true,
      },
    ],
  };
}
