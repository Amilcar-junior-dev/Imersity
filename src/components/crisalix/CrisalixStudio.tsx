import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { XR } from '@react-three/xr';
import {
  RotateCw,
  Sparkles,
  Sliders,
  Scissors,
  CheckCircle2,
  Camera,
  Upload,
  KeyRound,
  Loader2,
  Trash2,
  Download,
  Save,
  HardDrive,
} from 'lucide-react';
import { xrStore } from '../../store/xrStore';
import { useVisagismStore, HAIR_PRESETS } from '../../store/useVisagismStore';
import { CrisalixHead3D } from './CrisalixHead3D';
import {
  convertPhotoTo3DAsset,
  generateCanonicalBaldHead,
  extractFalErrorMessage,
} from '../../services/falPipeline';

interface CrisalixStudioProps {
  onProcessPhoto?: (dataUrl: string) => void;
}

export const CrisalixStudio: React.FC<CrisalixStudioProps> = ({ onProcessPhoto }) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);
  const glbFileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    autoRotate3D,
    toggleAutoRotate3D,
    showHairLayer,
    toggleHairLayer,
    selectedHairPreset,
    selectHairPreset,
    hairColors,
    setHairColors,
    capturedPhotoDataUrl,
    leftSidePhotoUrl,
    setLeftSidePhoto,
    rightSidePhotoUrl,
    setRightSidePhoto,
    activeCustomGlbUrl,
    setActiveCustomGlbUrl,
    modelTextureMode,
    setModelTextureMode,
    generationPreset,
    setGenerationPreset,
    hairOffsetY,
    setHairOffsetY,
    hairOffsetZ,
    setHairOffsetZ,
    hairVolumeScale,
    setHairVolumeScale,
    projScale,
    setProjScale,
    projOffsetY,
    setProjOffsetY,
    projOffsetX,
    setProjOffsetX,
    projBlendFeather,
    setProjBlendFeather,
    falApiKey,
    setFalApiKey,
    isGenerating3D,
    setIsGenerating3D,
    addGeneratedAsset,
    setRenderMode3D,
  } = useVisagismStore();

  const [comparisonMode, setComparisonMode] = useState<'antes' | 'depois'>('depois');
  const [hairGenderFilter, setHairGenderFilter] = useState<'masculino' | 'feminino'>('masculino');
  const [morphNoseDepth, setMorphNoseDepth] = useState<number>(1.0);
  const [morphJawWidth, setMorphJawWidth] = useState<number>(1.0);
  const [morphCheekboneLift, setMorphCheekboneLift] = useState<number>(1.0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveGlbLocally = async () => {
    if (!activeCustomGlbUrl) return;
    setSaveStatus('Salvando arquivo em public/models/...');
    try {
      const res = await fetch('/api/save-glb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeCustomGlbUrl,
          filename: 'master_base_head.glb',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(`✓ Salvo em public/models/master_base_head.glb (${data.sizeMb} MB)`);
        setActiveCustomGlbUrl(data.localUrl);
      } else {
        throw new Error(data.error || 'Erro ao gravar no disco');
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus(`Erro: ${err.message}`);
    }
  };

  const handleDownloadGlb = () => {
    if (!activeCustomGlbUrl) return;
    const a = document.createElement('a');
    a.href = activeCustomGlbUrl;
    a.download = 'master_base_head.glb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLoadLocalBase = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch('/models/master_base_head.glb');
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 5000 && !blob.type.includes('html')) {
          setActiveCustomGlbUrl('/models/master_base_head.glb');
          setRenderMode3D('custom_glb');
          return;
        }
      }
      throw new Error(
        'Nenhum arquivo master_base_head.glb salvo em disco ainda. Gere com a IA e clique em "Salvar no Projeto", ou clique em "Importar .GLB do PC".'
      );
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleGenerateRodinHead = async () => {
    setErrorMsg(null);
    if (!falApiKey || falApiKey.trim().length < 10) {
      setErrorMsg('Por favor, insira sua chave da Fal.ai (FAL_KEY) no campo abaixo.');
      return;
    }

    const availablePhotos = [capturedPhotoDataUrl, leftSidePhotoUrl, rightSidePhotoUrl].filter(
      Boolean
    ) as string[];

    // No caso da base canônica, não precisa de fotos prévias
    if (generationPreset !== 'rodin_bald_base' && availablePhotos.length === 0) {
      setErrorMsg('Adicione pelo menos a foto frontal para gerar o modelo 3D.');
      return;
    }

    setIsGenerating3D(true);
    setGenerationStatus('Iniciando pipeline na GPU Fal.ai...');

    try {
      let asset;

      if (generationPreset === 'rodin_bald_base') {
        asset = await generateCanonicalBaldHead({
          gender: hairGenderFilter,
          material: 'PBR',
          apiKey: falApiKey,
          onStatusUpdate: (msg) => setGenerationStatus(msg),
        });
        setModelTextureMode('original_pbr');
      } else if (generationPreset === 'rodin_clay') {
        asset = await convertPhotoTo3DAsset({
          photoDataUrls: availablePhotos,
          title: `Modelo Clay Escultura (${availablePhotos.length} fotos)`,
          assetType: 'hair_or_bust',
          model: 'fal-ai/hyper3d/rodin',
          material: 'PBR',
          prompt:
            'hyperrealistic anatomical human bald head bust, clean smooth cranium, watertight scalp, sculpted ears, neutral expression, completely bald, no hair',
          apiKey: falApiKey,
          onStatusUpdate: (msg) => setGenerationStatus(msg),
        });
        setModelTextureMode('clay_unpainted');
      } else {
        // Rodin PBR padrão
        asset = await convertPhotoTo3DAsset({
          photoDataUrls: availablePhotos,
          title: `Avatar 3D Rodin PBR (${availablePhotos.length} fotos)`,
          assetType: 'hair_or_bust',
          model: 'fal-ai/hyper3d/rodin',
          material: 'PBR',
          apiKey: falApiKey,
          onStatusUpdate: (msg) => setGenerationStatus(msg),
        });
        setModelTextureMode('original_pbr');
      }

      if (asset.glbUrl) {
        addGeneratedAsset(asset);
        setActiveCustomGlbUrl(asset.glbUrl);
        setRenderMode3D('custom_glb');
      } else {
        throw new Error('O modelo não retornou a URL do arquivo .glb');
      }
    } catch (err: any) {
      console.error('Erro na geração Rodin:', err);
      const msg = extractFalErrorMessage(err);
      setErrorMsg(`Falha na Fal.ai: ${msg}`);
    } finally {
      setIsGenerating3D(false);
      setGenerationStatus('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Viewport 3D Principal (Estilo Crisalix) */}
      <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        {/* Barra Superior estilo Crisalix (Abas Antes / Depois + AR Quest) */}
        <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reconstrução Anatômica 3DMM (Padrão Cirúrgico / Crisalix)
            </span>

            {/* Alternador Antes / Depois igualzinho ao app da Crisalix */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 ml-2">
              <button
                onClick={() => {
                  setComparisonMode('antes');
                  if (showHairLayer) toggleHairLayer();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  comparisonMode === 'antes'
                    ? 'bg-teal-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Antes (Cabelo Preso)
              </button>
              <button
                onClick={() => {
                  setComparisonMode('depois');
                  if (!showHairLayer) toggleHairLayer();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  comparisonMode === 'depois'
                    ? 'bg-amber-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Depois (Corte 3D)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => xrStore.enterAR()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ver no Quest 3
            </button>

            <button
              onClick={toggleAutoRotate3D}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 ${
                autoRotate3D
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Girar 360°
            </button>
          </div>
        </div>

        {/* Viewport 3D */}
        <div className="relative w-full h-[620px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
          <Canvas
            shadows
            gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
            camera={{ position: [0, 1.35, 0.75], fov: 38 }}
          >
            <XR store={xrStore}>
              {/* Iluminação de estúdio clínico para pegar os reflexos vítreos dos olhos 3D */}
              <ambientLight intensity={0.9} />
              <directionalLight position={[1.2, 2.0, 1.6]} intensity={1.5} castShadow />
              <directionalLight position={[-1.2, 1.6, 1.2]} intensity={0.8} color="#fef08a" />
              {/* Ringlight frontal para criar o catchlight vivo nos olhos */}
              <pointLight position={[0, 1.38, 0.7]} intensity={0.65} color="#ffffff" />

              <Suspense fallback={null}>
                <CrisalixHead3D
                  morphNoseDepth={morphNoseDepth}
                  morphJawWidth={morphJawWidth}
                  morphCheekboneLift={morphCheekboneLift}
                />
                <ContactShadows
                  position={[0, 0.72, -0.65]}
                  opacity={0.45}
                  scale={2.2}
                  blur={2.2}
                />
              </Suspense>

              <OrbitControls
                target={[0, 1.35, -0.65]}
                enablePan={true}
                minDistance={0.2}
                maxDistance={5.0}
              />
            </XR>
          </Canvas>

          {/* Dica de interação */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-950/85 backdrop-blur border border-zinc-800 text-[11px] text-zinc-400">
            <span>
              Repare como os <strong>olhos 3D têm profundidade real</strong> e não ficam estrábicos nem borrados.
            </span>
            <span className="text-teal-400 font-semibold font-mono">Topologia Anatômica 3DMM</span>
          </div>
        </div>
      </div>

      {/* Painel de Controles Clínicos & Visagismo (Direita) */}
      <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4">
        {/* Os 3 Slots Multi-View (Padrão Crisalix) */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" />
              As 3 Fotos Multi-View (Padrão Crisalix)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-teal-300">
              {[capturedPhotoDataUrl, leftSidePhotoUrl, rightSidePhotoUrl].filter(Boolean).length}/3 prontas
            </span>
          </div>

          <p className="text-[10px] text-zinc-400">
            Hoje o 3D usa só a foto frontal. As fotos de 45° ficam guardadas para a etapa de cabeça completa (em construção).
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Slot 1: Frente */}
            <div className="space-y-1">
              <div
                onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 cursor-pointer relative group flex items-center justify-center"
                title="Foto Frontal (Principal)"
              >
                {capturedPhotoDataUrl ? (
                  <img src={capturedPhotoDataUrl} alt="Frente" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-zinc-600" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition">
                  Trocar
                </div>
              </div>
              <span className="text-[10px] text-center font-bold text-zinc-300 block truncate">1. Frente (0°)</span>
            </div>

            {/* Slot 2: 45° Esquerda */}
            <div className="space-y-1">
              <div
                onClick={() => leftInputRef.current?.click()}
                className={`aspect-square rounded-xl overflow-hidden border cursor-pointer relative group flex items-center justify-center transition ${
                  leftSidePhotoUrl
                    ? 'border-teal-500/80 bg-zinc-900'
                    : 'border-dashed border-zinc-700 bg-zinc-950 hover:border-teal-500/50'
                }`}
                title="Foto 45° Esquerda (Orelha e Lateral Esquerda)"
              >
                {leftSidePhotoUrl ? (
                  <img src={leftSidePhotoUrl} alt="45° Esq" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1">
                    <Upload className="w-4 h-4 text-teal-400 mx-auto mb-0.5" />
                    <span className="text-[8px] text-zinc-400 block">+ Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition">
                  {leftSidePhotoUrl ? 'Trocar' : 'Subir'}
                </div>
              </div>
              <span className="text-[10px] text-center font-bold text-zinc-300 block truncate">2. 45° Esq</span>
            </div>

            {/* Slot 3: 45° Direita */}
            <div className="space-y-1">
              <div
                onClick={() => rightInputRef.current?.click()}
                className={`aspect-square rounded-xl overflow-hidden border cursor-pointer relative group flex items-center justify-center transition ${
                  rightSidePhotoUrl
                    ? 'border-teal-500/80 bg-zinc-900'
                    : 'border-dashed border-zinc-700 bg-zinc-950 hover:border-teal-500/50'
                }`}
                title="Foto 45° Direita (Orelha e Lateral Direita)"
              >
                {rightSidePhotoUrl ? (
                  <img src={rightSidePhotoUrl} alt="45° Dir" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1">
                    <Upload className="w-4 h-4 text-teal-400 mx-auto mb-0.5" />
                    <span className="text-[8px] text-zinc-400 block">+ Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition">
                  {rightSidePhotoUrl ? 'Trocar' : 'Subir'}
                </div>
              </div>
              <span className="text-[10px] text-center font-bold text-zinc-300 block truncate">3. 45° Dir</span>
            </div>
          </div>

          {/* BOTÃO E STATUS DE RECONSTRUÇÃO 3D REAL (FAL.AI RODIN) */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            {activeCustomGlbUrl ? (
              <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Modelo 3D Ativo no Viewport
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/80 text-teal-200">
                    .GLB
                  </span>
                </div>

                {/* Seletor de Texturização / Projeção sobre o Modelo */}
                <div className="space-y-1.5 pt-1 border-t border-teal-800/50">
                  <span className="text-[10px] text-teal-200 font-bold block">
                    Modo de Superfície / Textura:
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => setModelTextureMode('projected_photos')}
                      className={`py-1 px-1 rounded text-[10px] font-bold transition truncate ${
                        modelTextureMode === 'projected_photos'
                          ? 'bg-teal-500 text-zinc-950 shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Projeta as 3 fotos reais do cliente sobre os relevos 3D da malha"
                    >
                      📸 3 Fotos
                    </button>
                    <button
                      onClick={() => setModelTextureMode('clay_unpainted')}
                      className={`py-1 px-1 rounded text-[10px] font-bold transition truncate ${
                        modelTextureMode === 'clay_unpainted'
                          ? 'bg-amber-500 text-zinc-950 shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Exibe o modelo em gesso/clay neutro sem pintura"
                    >
                      🏛️ Clay Puro
                    </button>
                    <button
                      onClick={() => setModelTextureMode('original_pbr')}
                      className={`py-1 px-1 rounded text-[10px] font-bold transition truncate ${
                        modelTextureMode === 'original_pbr'
                          ? 'bg-indigo-500 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Usa as texturas PBR originais pintadas pela IA"
                    >
                      🎨 PBR da IA
                    </button>
                  </div>
                </div>

                {/* Calibração de Encaixe das Fotos (Apenas no Modo 📸 3 Fotos) */}
                {modelTextureMode === 'projected_photos' && (
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-teal-500/30 space-y-2">
                    <span className="text-[10px] font-bold text-teal-300 block flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-teal-400" />
                      Calibração de Encaixe das Fotos no Busto:
                    </span>

                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-300">
                          <span>Zoom / Escala Facial</span>
                          <span className="text-teal-400 font-mono">{projScale.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min={0.6}
                          max={1.8}
                          step={0.02}
                          value={projScale}
                          onChange={(e) => setProjScale(parseFloat(e.target.value))}
                          className="w-full accent-teal-500 h-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-300">
                          <span>Posição Vertical (Olhos / Boca)</span>
                          <span className="text-teal-400 font-mono">{(projOffsetY * 100).toFixed(1)}cm</span>
                        </div>
                        <input
                          type="range"
                          min={-0.2}
                          max={0.2}
                          step={0.005}
                          value={projOffsetY}
                          onChange={(e) => setProjOffsetY(parseFloat(e.target.value))}
                          className="w-full accent-teal-500 h-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-300">
                          <span>Posição Horizontal</span>
                          <span className="text-teal-400 font-mono">{(projOffsetX * 100).toFixed(1)}cm</span>
                        </div>
                        <input
                          type="range"
                          min={-0.15}
                          max={0.15}
                          step={0.005}
                          value={projOffsetX}
                          onChange={(e) => setProjOffsetX(parseFloat(e.target.value))}
                          className="w-full accent-teal-500 h-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-300">
                          <span>Suavização / Difusão das Bordas</span>
                          <span className="text-teal-400 font-mono">{projBlendFeather.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={0.5}
                          step={0.02}
                          value={projBlendFeather}
                          onChange={(e) => setProjBlendFeather(parseFloat(e.target.value))}
                          className="w-full accent-teal-500 h-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ajuste Fino do Encaixe do Cabelo sobre o Crânio do GLB */}
                <div className="space-y-1.5 pt-2 border-t border-teal-800/50">
                  <div className="flex justify-between text-[10px] text-zinc-300">
                    <span>Ajuste Vertical do Cabelo (Altura)</span>
                    <span className="text-teal-400 font-mono">{(hairOffsetY * 100).toFixed(0)}cm</span>
                  </div>
                  <input
                    type="range"
                    min={-0.10}
                    max={0.10}
                    step={0.005}
                    value={hairOffsetY}
                    onChange={(e) => setHairOffsetY(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 h-1.5"
                  />

                  <div className="flex justify-between text-[10px] text-zinc-300 pt-1">
                    <span>Escala / Volume do Cabelo</span>
                    <span className="text-teal-400 font-mono">{hairVolumeScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.02}
                    value={hairVolumeScale}
                    onChange={(e) => setHairVolumeScale(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 h-1.5"
                  />
                </div>

                {/* Botões de Ação para Salvar e Baixar o GLB sem gastar créditos */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-teal-800/50">
                  <button
                    onClick={handleSaveGlbLocally}
                    className="py-1.5 px-2 rounded-lg text-[10px] font-bold bg-teal-600 hover:bg-teal-500 text-zinc-950 flex items-center justify-center gap-1 transition shadow"
                    title="Grava o arquivo .glb diretamente no diretório public/models/ do projeto"
                  >
                    <Save className="w-3 h-3" />
                    Salvar no Projeto
                  </button>
                  <button
                    onClick={handleDownloadGlb}
                    className="py-1.5 px-2 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1 transition"
                    title="Baixa o arquivo .glb para seu computador"
                  >
                    <Download className="w-3 h-3" />
                    Baixar .GLB
                  </button>
                </div>

                {saveStatus && (
                  <div className="p-1.5 rounded-lg bg-teal-950/80 border border-teal-500/50 text-[10px] text-teal-300 text-center font-mono">
                    {saveStatus}
                  </div>
                )}

                <button
                  onClick={() => setActiveCustomGlbUrl(null)}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition"
                >
                  Voltar para Preview Rápido
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Botões de Importação e Atalho Local (0 Créditos) */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleLoadLocalBase}
                    className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-teal-400 border border-teal-500/40 flex items-center justify-center gap-1 transition"
                    title="Carrega o modelo gravado em public/models/master_base_head.glb"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                    Base Salva (0 Cred.)
                  </button>
                  <button
                    onClick={() => glbFileInputRef.current?.click()}
                    className="py-2 px-2 rounded-xl text-[10px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1 transition"
                    title="Selecione qualquer arquivo .glb do seu computador"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    Importar .GLB do PC
                  </button>
                </div>

                <input
                  ref={glbFileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const blobUrl = URL.createObjectURL(file);
                    setActiveCustomGlbUrl(blobUrl);
                    setRenderMode3D('custom_glb');
                  }}
                />

                {/* Seletor do Método de Criação com IA */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold block">
                    Modo de Geração com IA (Fal.ai Rodin):
                  </label>
                  <select
                    value={generationPreset}
                    onChange={(e) => setGenerationPreset(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="rodin_clay">
                      🏛️ Modelo 3D Sem Pintura / Clay (Relevo Puro + 3 Fotos Reais)
                    </option>
                    <option value="rodin_bald_base">
                      👤 Base Careca Anatômica (Crânio Base Text-to-3D)
                    </option>
                    <option value="rodin_pbr">
                      🎨 Busto Completo PBR Colorido da IA (Multi-View)
                    </option>
                  </select>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {generationPreset === 'rodin_clay' &&
                    'Gera a malha 3D anatômica com os relevos da foto do cliente sem pintura (como no Hyper3D inicial), permitindo esticar as 3 fotos reais sobre a geometria sem manchas de cabelo embutido.'}
                  {generationPreset === 'rodin_bald_base' &&
                    'Gera um crânio base careca estanque via IA (Text-to-3D) com orelhas anatômicas perfeitas para servir de base universal para qualquer corte.'}
                  {generationPreset === 'rodin_pbr' &&
                    'Gera o avatar 3D com texturas fotorrealistas e iluminação PBR diretamente computadas pela IA.'}
                </p>

                <button
                  disabled={
                    isGenerating3D ||
                    (generationPreset !== 'rodin_bald_base' && !capturedPhotoDataUrl)
                  }
                  onClick={handleGenerateRodinHead}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                    isGenerating3D
                      ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                      : generationPreset !== 'rodin_bald_base' && !capturedPhotoDataUrl
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-teal-400 text-zinc-950 hover:brightness-110 shadow-amber-500/20 active:scale-[0.98]'
                  }`}
                >
                  {isGenerating3D ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="truncate">{generationStatus || 'Processando na GPU Fal.ai...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {generationPreset === 'rodin_clay'
                          ? 'Gerar 3D Sem Pintura (Clay + Projeção)'
                          : generationPreset === 'rodin_bald_base'
                          ? `Gerar Base Careca Anatômica (${hairGenderFilter === 'masculino' ? 'Masculina' : 'Feminina'})`
                          : 'Gerar Avatar PBR Colorido da IA'}
                      </span>
                    </>
                  )}
                </button>

                {errorMsg && (
                  <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-[10px] text-red-300">
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* Input de chave da Fal.ai */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Chave Fal.ai (FAL_KEY):
                </span>
                <span className="font-mono text-zinc-400 text-[9px]">
                  {falApiKey ? '✓ Salva' : 'Requer chave'}
                </span>
              </div>
              <input
                type="password"
                placeholder="Insira sua FAL_KEY (ex: f4l-xyz...)"
                value={falApiKey}
                onChange={(e) => setFalApiKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Inputs invisíveis para carregar as fotos */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const url = reader.result as string;
                if (onProcessPhoto) {
                  onProcessPhoto(url);
                } else {
                  useVisagismStore.getState().setCapturedPhoto(url);
                }
              };
              reader.readAsDataURL(file);
            }}
          />

          <input
            ref={leftInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                setLeftSidePhoto(reader.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />

          <input
            ref={rightInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                setRightSidePhoto(reader.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {/* Morphing Paramétrico (Ajuste Cirúrgico das Feições da Foto) */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            Ajustes Paramétricos de Morfologia (Morphing)
          </h3>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>Projeção / Relevo do Nariz</span>
                <span className="text-teal-400 font-mono">{morphNoseDepth.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.4}
                step={0.02}
                value={morphNoseDepth}
                onChange={(e) => setMorphNoseDepth(parseFloat(e.target.value))}
                className="w-full accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>Largura Mandibular / Ângulo Goníaco</span>
                <span className="text-teal-400 font-mono">{morphJawWidth.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.25}
                step={0.02}
                value={morphJawWidth}
                onChange={(e) => setMorphJawWidth(parseFloat(e.target.value))}
                className="w-full accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>Elevação dos Zigomáticos (Maçãs)</span>
                <span className="text-teal-400 font-mono">{morphCheekboneLift.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.85}
                max={1.2}
                step={0.02}
                value={morphCheekboneLift}
                onChange={(e) => setMorphCheekboneLift(parseFloat(e.target.value))}
                className="w-full accent-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Cortes de Cabelo Visagistas para Vestir no Avatar Limpo */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              Provar Cortes Visagistas na Cabeça Limpa
            </span>
            <button
              onClick={toggleHairLayer}
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                showHairLayer ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {showHairLayer ? 'Cabelo: ON' : 'Cabelo: OFF'}
            </button>
          </div>

          {/* Filtro Masculino vs Feminino */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setHairGenderFilter('masculino')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                hairGenderFilter === 'masculino'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👨 Cortes Masculinos
            </button>
            <button
              onClick={() => setHairGenderFilter('feminino')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                hairGenderFilter === 'feminino'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👩 Cortes Femininos
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {HAIR_PRESETS.filter(
              (p) => (p.gender || (p.styleGeometry.startsWith('male_') ? 'masculino' : 'feminino')) === hairGenderFilter
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  selectHairPreset(preset);
                  setHairColors(preset.defaultColors);
                  if (!showHairLayer) toggleHairLayer();
                }}
                className={`p-2.5 rounded-xl text-left text-xs border transition ${
                  selectedHairPreset.id === preset.id && showHairLayer
                    ? 'bg-amber-500/15 border-amber-500 text-white font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-amber-400">{preset.category}</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{preset.visagismEffect}</p>
              </button>
            ))}
          </div>

          {/* Colorimetria Rápida */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Tom de Cabelo / Mechas:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={hairColors.midHex}
                onChange={(e) => setHairColors({ midHex: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent"
                title="Trocar cor das mechas"
              />
              <span className="text-[10px] font-mono text-zinc-300">{hairColors.midHex}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
