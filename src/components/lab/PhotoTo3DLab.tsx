import React, { useRef, useState } from 'react';
import {
  KeyRound,
  Sparkles,
  Upload,
  Box,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { useVisagismStore } from '../../store/useVisagismStore';
import {
  convertPhotoTo3DAsset,
  generateHairSimulation2D,
} from '../../services/falPipeline';

export const PhotoTo3DLab: React.FC = () => {
  const {
    capturedPhotoDataUrl,
    simulated2DPhotoUrl,
    setSimulated2DPhoto,
    selectedHairPreset,
    hairColors,
    falApiKey,
    setFalApiKey,
    isGenerating2D,
    setIsGenerating2D,
    isGenerating3D,
    setIsGenerating3D,
    generatedAssets,
    addGeneratedAsset,
    setActiveCustomGlbUrl,
    setActiveSplatUrl,
    setRenderMode3D,
    setActiveTab,
  } = useVisagismStore();

  const [assetPhotoUrl, setAssetPhotoUrl] = useState<string>(
    capturedPhotoDataUrl || ''
  );
  const [assetTitle, setAssetTitle] = useState<string>('Corte Moreno Iluminado / Óculos');
  const [assetType, setAssetType] = useState<'hair_or_bust' | 'glasses' | 'accessory'>(
    'hair_or_bust'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadSourcePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAssetPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRun2DSimulation = async () => {
    setErrorMsg(null);
    setIsGenerating2D(true);
    try {
      const source = assetPhotoUrl || capturedPhotoDataUrl || '';
      const outUrl = await generateHairSimulation2D({
        sourcePhotoDataUrl: source,
        hairPreset: selectedHairPreset,
        rootHex: hairColors.rootHex,
        tipHex: hairColors.tipHex,
        apiKey: falApiKey,
      });
      setSimulated2DPhoto(outUrl);
      setAssetPhotoUrl(outUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao gerar simulação 2D');
    } finally {
      setIsGenerating2D(false);
    }
  };

  const handleRunPhotoTo3D = async () => {
    setErrorMsg(null);
    setIsGenerating3D(true);
    try {
      const source = simulated2DPhotoUrl || assetPhotoUrl || capturedPhotoDataUrl || '';
      const asset = await convertPhotoTo3DAsset({
        photoDataUrls: [source],
        title: assetTitle,
        assetType,
        apiKey: falApiKey,
      });
      addGeneratedAsset(asset);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Falha na chamada da API Fal.ai. Verifique sua FAL_KEY ou saldo de créditos.'
      );
    } finally {
      setIsGenerating3D(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Configuração da API Key Pay-as-you-go (Fal.ai) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <KeyRound className="w-3.5 h-3.5" />
            Motor Serverless Pay-As-You-Go (Fal.ai: Flux 2D + Trellis 3DGS/GLB)
          </span>
          <h2 className="text-base font-bold text-white">
            Laboratório de Validação: Foto Única → Simulação 2D → Cabelo/Item 3D (.GLB & .SPLAT)
          </h2>
          <p className="text-xs text-zinc-400">
            Cole sua chave da <code className="text-amber-300">fal.ai</code> abaixo para executar a
            conversão real em GPUs de nuvem (~US$ 0,04/execução) ou teste o fluxo imediatamente em
            modo local.
          </p>
        </div>

        <div className="w-full md:w-96 flex items-center gap-2">
          <input
            type="password"
            placeholder="Cole sua FAL_KEY aqui (opcional p/ demo)..."
            value={falApiKey}
            onChange={(e) => setFalApiKey(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          />
          <span
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${
              falApiKey.trim().length > 10
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {falApiKey.trim().length > 10 ? 'API Ativa' : 'Modo Demo'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Grid Principal do Laboratório */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Etapa 1: Foto de Entrada & Geração 2D Hiper-Realista */}
        <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Passo 1: Foto de Entrada & Simulação 2D (Flux)
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Subir Foto de Cabelo / Óculos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadSourcePhoto}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                <span className="text-[11px] text-zinc-400 block mb-1.5">
                  Foto Original (Cliente / Item)
                </span>
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
                  {assetPhotoUrl || capturedPhotoDataUrl ? (
                    <img
                      src={assetPhotoUrl || capturedPhotoDataUrl || ''}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">Nenhuma foto</span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                <span className="text-[11px] text-amber-400 font-medium block mb-1.5">
                  Resultado Simulação 2D Hiper-Realista
                </span>
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
                  {simulated2DPhotoUrl ? (
                    <img
                      src={simulated2DPhotoUrl}
                      alt="Simulada 2D"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500 text-center px-3">
                      Clique abaixo para simular o corte "{selectedHairPreset.name}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRun2DSimulation}
            disabled={isGenerating2D}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 transition"
          >
            {isGenerating2D ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando Simulação Fotográfica 2D...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Simulação 2D Hiper-Realista ({selectedHairPreset.name.slice(0, 26)}...)
              </>
            )}
          </button>
        </div>

        {/* Etapa 2: Conversão Foto -> 3D (.GLB + Gaussian Splat via Trellis) */}
        <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Box className="w-4 h-4" />
              Passo 2: Extração Volumétrica Foto → 3D (Trellis GLB + Gaussian Splat)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nome do Ativo 3D</label>
                <input
                  type="text"
                  value={assetTitle}
                  onChange={(e) => setAssetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tipo de Material 3D</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value="hair_or_bust">
                    Cabelo / Busto Completo (Trellis Splat + GLB)
                  </option>
                  <option value="glasses">Armação de Óculos Visagismo (Malha PBR .GLB)</option>
                  <option value="accessory">Brinco / Colar / Decote (Malha PBR .GLB)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunPhotoTo3D}
              disabled={isGenerating3D}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 transition"
            >
              {isGenerating3D ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Convertendo Foto em Malha .GLB & Gaussian Splat na Nuvem...
                </>
              ) : (
                <>
                  <Box className="w-4 h-4" />
                  Converter Foto em Modelo 3D (.GLB + .SPLAT)
                </>
              )}
            </button>

            {/* Lista de Ativos 3D Gerados na Sessão */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-300 block">
                Ativos 3D Gerados ({generatedAssets.length})
              </span>

              {generatedAssets.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                  Nenhum ativo convertido ainda. Clique no botão azul acima para validar o pipeline
                  Foto → 3D.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {generatedAssets.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.sourcePhotoUrl}
                          alt={item.title}
                          className="w-11 h-11 rounded-lg object-cover border border-zinc-700"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Pipeline: <code className="text-amber-300">{item.pipelineUsed}</code> •{' '}
                            {item.createdAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.glbUrl && (
                          <>
                            <button
                              onClick={() => {
                                setActiveCustomGlbUrl(item.glbUrl!);
                                setRenderMode3D('custom_glb');
                                setActiveTab('studio3d');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500 text-zinc-950 flex items-center gap-1"
                            >
                              Abrir .GLB no Quest
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                            <a
                              href={item.glbUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                              title="Baixar .GLB"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}

                        {item.splatUrl && (
                          <button
                            onClick={() => {
                              setActiveSplatUrl(item.splatUrl!);
                              setRenderMode3D('gaussian_splat');
                              setActiveTab('studio3d');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-sky-500 text-zinc-950 flex items-center gap-1"
                          >
                            Ver Splat
                          </button>
                        )}

                        {!item.glbUrl && !item.splatUrl && (
                          <button
                            onClick={() => {
                              setRenderMode3D('anisotropic_mesh');
                              setActiveTab('studio3d');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 flex items-center gap-1"
                          >
                            Inspecionar no Estúdio 3D
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
