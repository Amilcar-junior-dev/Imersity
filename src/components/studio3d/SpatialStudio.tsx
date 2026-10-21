import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { XR } from '@react-three/xr';
import { xrStore } from '../../store/xrStore';
import {
  Glasses,
  Palette,
  RotateCw,
  Scissors,
  Sparkles,
  Upload,
  Eye,
  Smartphone,
  Box,
} from 'lucide-react';
import {
  GLASSES_PRESETS,
  HAIR_PRESETS,
  useVisagismStore,
} from '../../store/useVisagismStore';
import { VisagismBust3D } from './VisagismBust3D';
import { SpatialHUD3D } from './SpatialHUD3D';

export const SpatialStudio: React.FC = () => {
  const {
    selectedHairPreset,
    selectHairPreset,
    hairColors,
    setHairColors,
    anisotropyIntensity,
    setAnisotropyIntensity,
    hairRoughness,
    setHairRoughness,
    hairVolumeScale,
    setHairVolumeScale,
    selectedGlasses,
    selectGlasses,
    renderMode3D,
    setRenderMode3D,
    setActiveCustomGlbUrl,
    setActiveSplatUrl,
    showVisagismWireframe3D,
    toggleVisagismWireframe3D,
    autoRotate3D,
    toggleAutoRotate3D,
    setActiveTab,
  } = useVisagismStore();

  const glbInputRef = useRef<HTMLInputElement | null>(null);
  const splatInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadCustomGLB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setActiveCustomGlbUrl(objectUrl);
    setRenderMode3D('custom_glb');
  };

  const handleUploadCustomSplat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setActiveSplatUrl(objectUrl);
    setRenderMode3D('gaussian_splat');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Viewport 3D / WebXR (Meta Quest 3 Passthrough Ready) */}
      <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        {/* Barra Superior WebXR */}
        <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/60">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              Motor Híbrido Three.js + @react-three/xr v6
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              Bancada Espacial do Visagista (360° & Meta Quest 3 Passthrough)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => xrStore.enterAR()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 shadow-lg shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              Entrar em Passthrough AR (Meta Quest 3)
            </button>

            <button
              onClick={() => xrStore.enterVR()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            >
              Modo VR Imersivo
            </button>
          </div>
        </div>

        {/* Canvas 3D */}
        <div className="relative w-full h-[540px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
          <Canvas
            shadows
            gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
            camera={{ position: [0, 1.38, 0.55], fov: 42 }}
          >
            <XR store={xrStore}>
              <ambientLight intensity={0.85} />
              <directionalLight
                position={[1.5, 2.5, 1.8]}
                intensity={1.65}
                castShadow
              />
              <directionalLight position={[-1.5, 1.8, -1.2]} intensity={0.75} color="#ffd89b" />
              <pointLight position={[0, 1.7, 0.6]} intensity={0.6} color="#fff7ed" />

              <Suspense fallback={null}>
                <VisagismBust3D />
                <SpatialHUD3D />
                <ContactShadows
                  position={[0, 0.72, -0.65]}
                  opacity={0.45}
                  scale={2.5}
                  blur={2.2}
                />
              </Suspense>

              <OrbitControls
                target={[0, 1.35, -0.65]}
                enablePan={true}
                minDistance={0.45}
                maxDistance={2.2}
              />
            </XR>
          </Canvas>

          {/* Controles Rápidos Flutuantes na Tela 2D */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl">
              <button
                onClick={toggleVisagismWireframe3D}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  showVisagismWireframe3D
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Linhas Terços 3D
              </button>

              <button
                onClick={toggleAutoRotate3D}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  autoRotate3D
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                Giro 360°
              </button>
            </div>

            {/* Upload de Arquivos .GLB ou .SPLAT para Teste Direto */}
            <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl">
              <button
                onClick={() => setRenderMode3D('anisotropic_mesh')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  renderMode3D === 'anisotropic_mesh'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Hair Cards PBR
              </button>

              <button
                onClick={() => glbInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                Abrir .GLB
              </button>
              <input
                ref={glbInputRef}
                type="file"
                accept=".glb,.gltf"
                className="hidden"
                onChange={handleUploadCustomGLB}
              />

              <button
                onClick={() => splatInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1"
              >
                <Upload className="w-3 h-3 text-sky-400" />
                Abrir .SPLAT
              </button>
              <input
                ref={splatInputRef}
                type="file"
                accept=".splat,.ply"
                className="hidden"
                onChange={handleUploadCustomSplat}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Painel Lateral do Visagista: Cortes, Colorimetria Anisotrópica e Óculos */}
      <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
        <div className="space-y-5 overflow-y-auto max-h-[600px] pr-1">
          {/* 1. Biblioteca de Cortes Visagistas */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2.5">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              1. Arquitetura de Corte 3D
            </h3>
            <div className="space-y-2">
              {HAIR_PRESETS.map((preset) => {
                const active = selectedHairPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectHairPreset(preset)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      active
                        ? 'bg-amber-500/15 border-amber-500/60 text-white'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{preset.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {preset.visagismEffect}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Colorimetria Anisotrópica Root-to-Tip */}
          <div className="pt-3 border-t border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              2. Shader de Mechas (Raiz → Meio → Pontas)
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <label className="block text-[11px] text-zinc-400 mb-1">Raiz Esfumada</label>
                <input
                  type="color"
                  value={hairColors.rootHex}
                  onChange={(e) => setHairColors({ rootHex: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer bg-transparent"
                />
                <span className="text-[10px] font-mono text-zinc-400">{hairColors.rootHex}</span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <label className="block text-[11px] text-zinc-400 mb-1">Transição / Meio</label>
                <input
                  type="color"
                  value={hairColors.midHex}
                  onChange={(e) => setHairColors({ midHex: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer bg-transparent"
                />
                <span className="text-[10px] font-mono text-zinc-400">{hairColors.midHex}</span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <label className="block text-[11px] text-zinc-400 mb-1">Pontas / Mechas</label>
                <input
                  type="color"
                  value={hairColors.tipHex}
                  onChange={(e) => setHairColors({ tipHex: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer bg-transparent"
                />
                <span className="text-[10px] font-mono text-zinc-400">{hairColors.tipHex}</span>
              </div>
            </div>

            {/* Sliders de Física do Fio */}
            <div className="space-y-2.5 mt-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                  <span>Brilho de Seda Anisotrópico (Kajiya-Kay)</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round(anisotropyIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={anisotropyIntensity}
                  onChange={(e) => setAnisotropyIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                  <span>Volume Lateral Visagista</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round(hairVolumeScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.02}
                  value={hairVolumeScale}
                  onChange={(e) => setHairVolumeScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                  <span>Porosidade / Textura do Fio</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round(hairRoughness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.75}
                  step={0.05}
                  value={hairRoughness}
                  onChange={(e) => setHairRoughness(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Óculos de Visagismo 3D */}
          <div className="pt-3 border-t border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2.5">
              <Glasses className="w-3.5 h-3.5 text-amber-400" />
              3. Prova de Armações de Óculos 3D
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {GLASSES_PRESETS.map((g) => {
                const active = selectedGlasses.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => selectGlasses(g)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-sky-500/15 border-sky-500/60 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-semibold">{g.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{g.visagismWhy}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botão para Gerar Dossiê no Celular da Cliente */}
        <button
          onClick={() => setActiveTab('dossier')}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition shadow-lg shadow-emerald-500/20"
        >
          <Smartphone className="w-4 h-4" />
          Gerar Dossiê & QR Code para Celular da Cliente
        </button>
      </div>
    </div>
  );
};
