export type FaceShape =
  | 'Oval'
  | 'Quadrado'
  | 'Redondo'
  | 'Coração / Triângulo Invertido'
  | 'Diamante'
  | 'Retangular / Alongado';

export type SkinUndertone = 'Quente (Dourado/Pêssego)' | 'Frio (Rosado/Azulado)' | 'Neutro (Oliva/Equilibrado)';

export type PersonalContrast = 'Alto Contraste' | 'Médio Contraste' | 'Baixo Contraste';

export type ColorSeason =
  | 'Outono Quente'
  | 'Outono Escuro'
  | 'Inverno Escuro'
  | 'Inverno Brilhante'
  | 'Primavera Quente'
  | 'Verão Suave';

export type ImageGoal =
  | 'Autoridade & Poder Executivo'
  | 'Juventude, Leveza & Suavidade'
  | 'Sensualidade & Glamour'
  | 'Modernidade & Criatividade';

export interface FacialThirds {
  upper: number;  // % (Testa: Tríquio -> Glabela)
  middle: number; // % (Terço Médio: Glabela -> Subnasal)
  lower: number;  // % (Terço Inferior: Subnasal -> Mento)
}

export interface BiometricMetrics {
  faceShape: FaceShape;
  facialIndex: number; // Altura / Largura bizigomática
  jawToForeheadRatio: number; // Largura mandíbula / Largura testa
  symmetryScore: number; // 0 - 100%
  eyeTiltAngle: number; // Graus de inclinação cantal
  thirds: FacialThirds;
  undertone: SkinUndertone;
  contrast: PersonalContrast;
  season: ColorSeason;
  dominantSection: 'Superior (Intelectual)' | 'Médio (Emocional)' | 'Inferior (Ativo/Prático)' | 'Equilibrado (Clássico)';
}

export interface HairPreset3D {
  id: string;
  name: string;
  category:
    | 'Curto / Pixie'
    | 'Médio / Long Bob'
    | 'Longo em Camadas'
    | 'Franja & Contorno'
    | 'Masculino / Fade & Crop'
    | 'Masculino / Quiff & Social';
  gender?: 'masculino' | 'feminino';
  visagismEffect: string;
  recommendedFor: FaceShape[];
  techniqueDescription: string;
  styleGeometry:
    | 'long_layers'
    | 'long_bob'
    | 'pixie_cut'
    | 'curtain_bangs'
    | 'shaggy_waves'
    | 'male_fade_crop'
    | 'male_quiff'
    | 'male_crew'
    | 'male_side_part';
  defaultColors: {
    rootHex: string;
    midHex: string;
    tipHex: string;
  };
  customGlbUrl?: string;
  customSplatUrl?: string;
}

export interface GlassesPreset3D {
  id: string;
  name: string;
  frameShape: 'Gatinho (Cat-Eye)' | 'Geométrico Hexagonal' | 'Aviador Clássico' | 'Redondo Vintage' | 'Retangular Executivo' | 'Nenhum';
  visagismWhy: string;
  frameColorHex: string;
  lensTintHex: string;
  customGlbUrl?: string;
}

export interface GeneratedAsset3D {
  id: string;
  title: string;
  sourcePhotoUrl: string;
  assetType: 'hair_or_bust' | 'glasses' | 'accessory';
  pipelineUsed: 'fal-ai/hyper3d/rodin' | 'fal-ai/trellis' | 'demo-procedural';
  glbUrl?: string;
  splatUrl?: string;
  previewImage2DUrl?: string;
  createdAt: string;
}

export interface HomeCareProduct {
  id: string;
  name: string;
  brand: string;
  category: 'Reconstrução Pós-Mechas' | 'Manutenção da Cor' | 'Finalizador / Protetor Térmico';
  priceBRL: number;
  whyForClient: string;
  inSalonStock: boolean;
}

export interface VisagismReport {
  summaryDiagnosis: string;
  geometryExplanation: string;
  haircutPrescription: string;
  colorimetryPrescription: string;
  glassesAndNecklineAdvice: string;
  recommendedPaletteHex: string[];
  homeCarePrescription: HomeCareProduct[];
}
