import { create } from 'zustand';
import {
  BiometricMetrics,
  GeneratedAsset3D,
  GlassesPreset3D,
  HairPreset3D,
  ImageGoal,
  VisagismReport,
} from '../types/visagism.types';
import { NormalizedLandmark } from '../services/faceAnalysis';
import { createDefaultAnatomicalLandmarks } from '../services/faceMeshBuilder';
import { createRealisticDefaultPortraitDataUrl } from '../services/defaultPortrait';

export const HAIR_PRESETS: HairPreset3D[] = [
  // --- PRESETS MASCULINOS ---
  {
    id: 'fade-textured-crop',
    name: 'Degradê Fade + Topo Texturizado (Castanho Escuro)',
    category: 'Masculino / Fade & Crop',
    gender: 'masculino',
    visagismEffect: 'Laterais limpas destacam os ângulos zigomáticos e a mandíbula; topo texturizado alonga a silhueta com jovialidade e atitude.',
    recommendedFor: ['Oval', 'Quadrado', 'Redondo', 'Diamante'],
    techniqueDescription: 'Fade médio nas têmporas com transição suave para barba e mechas superiores esculpidas com textura matte.',
    styleGeometry: 'male_fade_crop',
    defaultColors: {
      rootHex: '#141210',
      midHex: '#26201a',
      tipHex: '#3b3127',
    },
  },
  {
    id: 'pompadour-quiff',
    name: 'Topete Quiff Estruturado (Castanho Café)',
    category: 'Masculino / Quiff & Social',
    gender: 'masculino',
    visagismEffect: 'Linhas verticais e diagonais que impõem autoridade executiva, elegância e projeção de liderança.',
    recommendedFor: ['Redondo', 'Oval', 'Coração / Triângulo Invertido'],
    techniqueDescription: 'Laterais na tesoura alinhadas e franja com elevação de 4cm fixada com spray estruturante.',
    styleGeometry: 'male_quiff',
    defaultColors: {
      rootHex: '#12100e',
      midHex: '#241e1a',
      tipHex: '#3d332d',
    },
  },
  {
    id: 'buzz-crew-cut',
    name: 'Crew Cut Executivo / Militar (Preto Suave)',
    category: 'Masculino / Fade & Crop',
    gender: 'masculino',
    visagismEffect: 'Foco total na estrutura óssea do rosto e olhar direto; máxima praticidade e sobriedade.',
    recommendedFor: ['Quadrado', 'Oval', 'Diamante'],
    techniqueDescription: 'Graduação alta máquina 1 para 2 com topo curto de 1,5 cm e acabamento alinhado.',
    styleGeometry: 'male_crew',
    defaultColors: {
      rootHex: '#11100f',
      midHex: '#1f1d1b',
      tipHex: '#2d2926',
    },
  },
  {
    id: 'side-part-classic',
    name: 'Side Part Clássico com Divisão (Castanho Natural)',
    category: 'Masculino / Quiff & Social',
    gender: 'masculino',
    visagismEffect: 'Linha de divisão lateral que transmite autoridade clássica, precisão analítica e credibilidade.',
    recommendedFor: ['Oval', 'Retangular / Alongado', 'Quadrado'],
    techniqueDescription: 'Divisão na altura da sobrancelha, penteado para trás com cera e laterais polidas.',
    styleGeometry: 'male_side_part',
    defaultColors: {
      rootHex: '#181412',
      midHex: '#2d2521',
      tipHex: '#453933',
    },
  },

  // --- PRESETS FEMININOS ---
  {
    id: 'curtain-illuminated',
    name: 'Camadas Longas + Curtain Bangs (Moreno Iluminado)',
    category: 'Longo em Camadas',
    gender: 'feminino',
    visagismEffect: 'Suaviza ângulos mandibulares fortes e emoldura as maçãs do rosto com linhas diagonais.',
    recommendedFor: ['Quadrado', 'Oval', 'Coração / Triângulo Invertido', 'Retangular / Alongado'],
    techniqueDescription: 'Frente desfiada na altura do zigomático com raiz esfumada 5.0 e mechas mel dourado 8.3.',
    styleGeometry: 'curtain_bangs',
    defaultColors: {
      rootHex: '#2b1b12',
      midHex: '#7c4d25',
      tipHex: '#c88a4b',
    },
  },
  {
    id: 'long-bob-pearl',
    name: 'Long Bob Assimétrico (Loiro Pérola Champagne)',
    category: 'Médio / Long Bob',
    gender: 'feminino',
    visagismEffect: 'Alonga rostos arredondados através de linhas verticais frontais e base desconectada.',
    recommendedFor: ['Redondo', 'Oval', 'Coração / Triângulo Invertido'],
    techniqueDescription: 'Base reta com ponta frontal alongada em 15° e contorno iluminado (Face Frame) em tom 9.89.',
    styleGeometry: 'long_bob',
    defaultColors: {
      rootHex: '#3d2b1f',
      midHex: '#b89b72',
      tipHex: '#e8d8be',
    },
  },
  {
    id: 'shaggy-copper',
    name: 'Shaggy Layers Volumoso (Ruivo Acobreado Intenso)',
    category: 'Longo em Camadas',
    gender: 'feminino',
    visagismEffect: 'Expande a lateral superior e adiciona dinamismo, criatividade e jovialidade.',
    recommendedFor: ['Diamante', 'Retangular / Alongado', 'Oval'],
    techniqueDescription: 'Camadas altas texturizadas no topo e cor global vibrante 7.44 com pontas translúcidas.',
    styleGeometry: 'shaggy_waves',
    defaultColors: {
      rootHex: '#4a1c11',
      midHex: '#9e3818',
      tipHex: '#d95b26',
    },
  },
  {
    id: 'pixie-executive',
    name: 'Pixie Cut Escultural (Castanho Expresso)',
    category: 'Curto / Pixie',
    gender: 'feminino',
    visagismEffect: 'Destaca a linha mandibular e olhos, projetando máxima autoridade e sofisticação.',
    recommendedFor: ['Oval', 'Coração / Triângulo Invertido', 'Diamante'],
    techniqueDescription: 'Nuca batida graduada com volume direcional no topo para alongamento vertical.',
    styleGeometry: 'pixie_cut',
    defaultColors: {
      rootHex: '#181210',
      midHex: '#2a1e19',
      tipHex: '#422f26',
    },
  },
];

export const GLASSES_PRESETS: GlassesPreset3D[] = [
  {
    id: 'none',
    name: 'Sem Óculos',
    frameShape: 'Nenhum',
    visagismWhy: 'Visualização limpa das linhas faciais e franja.',
    frameColorHex: '#000000',
    lensTintHex: '#ffffff',
  },
  {
    id: 'cat-eye-gold',
    name: 'Armação Gatinho (Lifting Visual)',
    frameShape: 'Gatinho (Cat-Eye)',
    visagismWhy: 'Linhas ascendentes externas levantam o olhar e equilibram o terço inferior.',
    frameColorHex: '#d4af37',
    lensTintHex: '#f5e6d3',
  },
  {
    id: 'geometric-hex',
    name: 'Hexagonal Minimalista',
    frameShape: 'Geométrico Hexagonal',
    visagismWhy: 'Adiciona linhas retas de autoridade para rostos ovais ou arredondados.',
    frameColorHex: '#1c1917',
    lensTintHex: '#e0f2fe',
  },
  {
    id: 'round-tortoise',
    name: 'Redondo Tartaruga (Suavizador)',
    frameShape: 'Redondo Vintage',
    visagismWhy: 'Curvas orgânicas quebram a rigidez de mandíbulas quadradas ou angulosas.',
    frameColorHex: '#5c3a21',
    lensTintHex: '#fef3c7',
  },
];

interface VisagismState {
  activeTab: 'scanner' | 'studio3d' | 'lab_photo3d' | 'dossier';
  clientName: string;
  imageGoal: ImageGoal;

  // Camada 1: Rosto 3D Real da Cliente (Gerado 1x e Fixo no Espaço)
  capturedPhotoDataUrl: string | null;
  leftSidePhotoUrl: string | null;
  rightSidePhotoUrl: string | null;
  sidePhotosDataUrls: string[];
  faceLandmarks: NormalizedLandmark[];
  skinColorHex: string;
  faceDepthRelief: number;
  showFaceMeshWireframe: boolean;

  simulated2DPhotoUrl: string | null;
  biometrics: BiometricMetrics | null;
  report: VisagismReport | null;

  // Camada 2: Peruca 3D Modular (Substituível sem reconstruir o rosto!)
  showHairLayer: boolean;
  selectedHairPreset: HairPreset3D;
  hairColors: {
    rootHex: string;
    midHex: string;
    tipHex: string;
  };
  anisotropyIntensity: number;
  hairRoughness: number;
  hairVolumeScale: number;
  hairOffsetY: number;
  hairOffsetZ: number;

  // Camada 3: Óculos / Acessórios e Modo de Renderização
  selectedGlasses: GlassesPreset3D;
  renderMode3D: 'anisotropic_mesh' | 'gaussian_splat' | 'custom_glb';
  customHairGlbUrl: string | null;
  activeSplatUrl: string | null;
  activeCustomGlbUrl: string | null;
  showVisagismWireframe3D: boolean;
  autoRotate3D: boolean;

  // Lab Foto -> 3D (Trellis / Fal.ai)
  falApiKey: string;
  isGenerating2D: boolean;
  isGenerating3D: boolean;
  generatedAssets: GeneratedAsset3D[];

  // Actions
  setActiveTab: (tab: VisagismState['activeTab']) => void;
  setClientName: (name: string) => void;
  setImageGoal: (goal: ImageGoal) => void;
  setCapturedPhoto: (dataUrl: string | null) => void;
  setLeftSidePhoto: (dataUrl: string | null) => void;
  setRightSidePhoto: (dataUrl: string | null) => void;
  addSidePhoto: (dataUrl: string) => void;
  setFaceLandmarksAndSkin: (landmarks: NormalizedLandmark[], skinHex: string) => void;
  setFaceDepthRelief: (val: number) => void;
  toggleFaceMeshWireframe: () => void;
  setSimulated2DPhoto: (url: string | null) => void;
  setBiometricsAndReport: (biometrics: BiometricMetrics, report: VisagismReport) => void;

  toggleHairLayer: () => void;
  selectHairPreset: (preset: HairPreset3D) => void;
  setHairColors: (colors: Partial<VisagismState['hairColors']>) => void;
  setAnisotropyIntensity: (val: number) => void;
  setHairRoughness: (val: number) => void;
  setHairVolumeScale: (val: number) => void;
  setHairOffsetY: (val: number) => void;
  setHairOffsetZ: (val: number) => void;
  setCustomHairGlbUrl: (url: string | null) => void;

  selectGlasses: (glasses: GlassesPreset3D) => void;
  setRenderMode3D: (mode: VisagismState['renderMode3D']) => void;
  setActiveSplatUrl: (url: string | null) => void;
  setActiveCustomGlbUrl: (url: string | null) => void;
  toggleVisagismWireframe3D: () => void;
  toggleAutoRotate3D: () => void;
  setFalApiKey: (key: string) => void;
  setIsGenerating2D: (loading: boolean) => void;
  setIsGenerating3D: (loading: boolean) => void;
  addGeneratedAsset: (asset: GeneratedAsset3D) => void;
}

export const useVisagismStore = create<VisagismState>((set) => ({
  activeTab: 'studio3d',
  clientName: 'Cliente VIP (Teste Salão)',
  imageGoal: 'Juventude, Leveza & Suavidade',

  capturedPhotoDataUrl: createRealisticDefaultPortraitDataUrl(),
  leftSidePhotoUrl: null,
  rightSidePhotoUrl: null,
  sidePhotosDataUrls: [],
  faceLandmarks: createDefaultAnatomicalLandmarks(),
  skinColorHex: '#dca88c',
  faceDepthRelief: 1.45,
  showFaceMeshWireframe: false,

  simulated2DPhotoUrl: null,
  biometrics: {
    faceShape: 'Oval',
    facialIndex: 1.38,
    jawToForeheadRatio: 0.89,
    symmetryScore: 96.4,
    eyeTiltAngle: 4.2,
    thirds: { upper: 32, middle: 35, lower: 33 },
    undertone: 'Quente (Dourado/Pêssego)',
    contrast: 'Médio Contraste',
    season: 'Outono Quente',
    dominantSection: 'Equilibrado (Clássico)',
  },
  report: null,

  showHairLayer: true,
  selectedHairPreset: HAIR_PRESETS[0],
  hairColors: { ...HAIR_PRESETS[0].defaultColors },
  anisotropyIntensity: 0.88,
  hairRoughness: 0.26,
  hairVolumeScale: 1.0,
  hairOffsetY: 0.0,
  hairOffsetZ: 0.0,

  selectedGlasses: GLASSES_PRESETS[0],
  renderMode3D: 'anisotropic_mesh',
  customHairGlbUrl: null,
  activeSplatUrl: null,
  activeCustomGlbUrl: null,
  showVisagismWireframe3D: false,
  autoRotate3D: false,

  falApiKey: localStorage.getItem('IMERSITY_FAL_KEY') || '',
  isGenerating2D: false,
  isGenerating3D: false,
  generatedAssets: [],

  setActiveTab: (activeTab) => set({ activeTab }),
  setClientName: (clientName) => set({ clientName }),
  setImageGoal: (imageGoal) => set({ imageGoal }),
  setCapturedPhoto: (capturedPhotoDataUrl) => set({ capturedPhotoDataUrl }),
  setLeftSidePhoto: (leftSidePhotoUrl) => set({ leftSidePhotoUrl }),
  setRightSidePhoto: (rightSidePhotoUrl) => set({ rightSidePhotoUrl }),
  addSidePhoto: (dataUrl) =>
    set((s) => ({ sidePhotosDataUrls: [...s.sidePhotosDataUrls.slice(-2), dataUrl] })),
  setFaceLandmarksAndSkin: (faceLandmarks, skinColorHex) =>
    set({ faceLandmarks, skinColorHex }),
  setFaceDepthRelief: (faceDepthRelief) => set({ faceDepthRelief }),
  toggleFaceMeshWireframe: () =>
    set((s) => ({ showFaceMeshWireframe: !s.showFaceMeshWireframe })),
  setSimulated2DPhoto: (simulated2DPhotoUrl) => set({ simulated2DPhotoUrl }),
  setBiometricsAndReport: (biometrics, report) => set({ biometrics, report }),

  toggleHairLayer: () => set((s) => ({ showHairLayer: !s.showHairLayer })),
  selectHairPreset: (preset) =>
    set({
      selectedHairPreset: preset,
      hairColors: { ...preset.defaultColors },
      showHairLayer: true,
    }),
  setHairColors: (colors) =>
    set((state) => ({
      hairColors: { ...state.hairColors, ...colors },
    })),
  setAnisotropyIntensity: (anisotropyIntensity) => set({ anisotropyIntensity }),
  setHairRoughness: (hairRoughness) => set({ hairRoughness }),
  setHairVolumeScale: (hairVolumeScale) => set({ hairVolumeScale }),
  setHairOffsetY: (hairOffsetY) => set({ hairOffsetY }),
  setHairOffsetZ: (hairOffsetZ) => set({ hairOffsetZ }),
  setCustomHairGlbUrl: (customHairGlbUrl) => set({ customHairGlbUrl }),

  selectGlasses: (selectedGlasses) => set({ selectedGlasses }),
  setRenderMode3D: (renderMode3D) => set({ renderMode3D }),
  setActiveSplatUrl: (activeSplatUrl) => set({ activeSplatUrl }),
  setActiveCustomGlbUrl: (activeCustomGlbUrl) => set({ activeCustomGlbUrl }),
  toggleVisagismWireframe3D: () =>
    set((state) => ({ showVisagismWireframe3D: !state.showVisagismWireframe3D })),
  toggleAutoRotate3D: () => set((state) => ({ autoRotate3D: !state.autoRotate3D })),
  setFalApiKey: (falApiKey) => {
    localStorage.setItem('IMERSITY_FAL_KEY', falApiKey);
    set({ falApiKey });
  },
  setIsGenerating2D: (isGenerating2D) => set({ isGenerating2D }),
  setIsGenerating3D: (isGenerating3D) => set({ isGenerating3D }),
  addGeneratedAsset: (asset) =>
    set((state) => ({
      generatedAssets: [asset, ...state.generatedAssets],
    })),
}));
