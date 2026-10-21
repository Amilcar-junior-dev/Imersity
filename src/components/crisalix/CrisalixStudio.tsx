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
} from 'lucide-react';
import { xrStore } from '../../store/xrStore';
import { useVisagismStore, HAIR_PRESETS } from '../../store/useVisagismStore';
import { CrisalixHead3D } from './CrisalixHead3D';

interface CrisalixStudioProps {
  onProcessPhoto?: (dataUrl: string) => void;
}

export const CrisalixStudio: React.FC<CrisalixStudioProps> = ({ onProcessPhoto }) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
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
  } = useVisagismStore();

  const [comparisonMode, setComparisonMode] = useState<'antes' | 'depois'>('depois');
  const [hairGenderFilter, setHairGenderFilter] = useState<'masculino' | 'feminino'>('masculino');
  const [morphNoseDepth, setMorphNoseDepth] = useState<number>(1.0);
  const [morphJawWidth, setMorphJawWidth] = useState<number>(1.0);
  const [morphCheekboneLift, setMorphCheekboneLift] = useState<number>(1.0);

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
        {/* Foto de Origem Atual com Troca Rápida */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-3">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 cursor-pointer relative group shrink-0"
              title="Clique para trocar a foto"
            >
              {capturedPhotoDataUrl ? (
                <img
                  src={capturedPhotoDataUrl}
                  alt="Foto Atual"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition">
                Trocar
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-teal-400 block">
                Foto Texturizada na Pele
              </span>
              <p className="text-xs font-semibold text-white truncate">Sua Foto no Modelo Anatômico</p>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="mt-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 flex items-center gap-1 transition"
              >
                <Upload className="w-3 h-3" />
                Carregar Outra Foto
              </button>
            </div>
          </div>

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
