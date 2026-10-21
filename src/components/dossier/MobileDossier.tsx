import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  ShoppingBag,
  Sparkles,
  Check,
  Scissors,
  Palette,
  Glasses,
  Award,
} from 'lucide-react';
import { useVisagismStore } from '../../store/useVisagismStore';

export const MobileDossier: React.FC = () => {
  const {
    clientName,
    imageGoal,
    biometrics,
    report,
    capturedPhotoDataUrl,
    simulated2DPhotoUrl,
    selectedHairPreset,
    hairColors,
    selectedGlasses,
  } = useVisagismStore();

  const [reservedItems, setReservedItems] = useState<Record<string, boolean>>({});
  const dossierShareUrl = window.location.href;

  const toggleReserve = (id: string) => {
    setReservedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Preview do Smartphone da Cliente (Mobile-First Dossier) */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Cabeçalho do Dossiê */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Dossiê Oficial de Visagismo & Imagem
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{clientName}</h2>
            <p className="text-xs text-zinc-400">Objetivo: {imageGoal}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Rosto {biometrics?.faceShape}
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              Simetria: {biometrics?.symmetryScore}%
            </p>
          </div>
        </div>

        {/* Comparativo Antes / Depois + Prescrição de Corte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <span className="text-[11px] text-zinc-400 block mb-2">
              Mapeamento Geométrico (478 Pontos)
            </span>
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900">
              {capturedPhotoDataUrl && (
                <img
                  src={capturedPhotoDataUrl}
                  alt="Mapeamento"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-3">
            <span className="text-[11px] text-amber-400 font-semibold block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Proposta Visual Aprovada
            </span>
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900">
              {simulated2DPhotoUrl || capturedPhotoDataUrl ? (
                <img
                  src={simulated2DPhotoUrl || capturedPhotoDataUrl || ''}
                  alt="Simulação"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Ficha Técnica para Execução no Lavatório / Cadeira */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Scissors className="w-4 h-4" />
            Protocolo Técnico Selecionado
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block">Corte 3D Escolhido:</span>
              <strong className="text-white text-sm">{selectedHairPreset.name}</strong>
              <p className="text-[11px] text-zinc-400 mt-1">
                {selectedHairPreset.techniqueDescription}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block">Fórmula Cromática (Raiz → Pontas):</span>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: hairColors.rootHex }}
                />
                <span className="text-zinc-500">→</span>
                <span
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: hairColors.midHex }}
                />
                <span className="text-zinc-500">→</span>
                <span
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: hairColors.tipHex }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Armação 3D: <strong className="text-sky-300">{selectedGlasses.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Cartela Sazonal & Paleta de Roupas/Maquiagem */}
        {report && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                Paleta Sazonal & Harmonização ({biometrics?.season})
              </h3>
              <span className="text-[11px] text-zinc-400">{biometrics?.undertone}</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{report.summaryDiagnosis}</p>
            <div className="flex items-center gap-2.5 pt-1">
              {report.recommendedPaletteHex.map((hex) => (
                <div key={hex} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/15 shadow"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[10px] font-mono text-zinc-400">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vitrine Home Care do Próprio Salão (Aumento Imediato de Ticket Médio) */}
        {report && (
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                Prescrição Home Care do Salão (Manutenção Pós-Química)
              </h3>
              <span className="text-[11px] text-emerald-300 font-medium">
                Disponível na Recepção
              </span>
            </div>

            <div className="space-y-2.5">
              {report.homeCarePrescription.map((prod) => {
                const reserved = !!reservedItems[prod.id];
                return (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-medium">
                        {prod.category}
                      </span>
                      <p className="text-xs font-bold text-white mt-1">{prod.name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{prod.whyForClient}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-sm font-bold text-amber-400">
                        R$ {prod.priceBRL.toFixed(2)}
                      </span>
                      <button
                        onClick={() => toggleReserve(prod.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          reserved
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                        }`}
                      >
                        {reserved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Separado na Recepção
                          </>
                        ) : (
                          'Incluir no Fechamento'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Coluna Direita: QR Code Instantâneo para o Celular da Cliente (Sem precisar de Smart TV cara!) */}
      <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5 sticky top-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Zero Custo de Hardware Extra (BYOD)
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            Entrega Instantânea na Tela do Celular da Cliente
          </h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Em vez de gastar R$ 5.000+ numa TV gigante, a cliente aponta a câmera do próprio iPhone
            ou Android para este QR Code e acompanha o Dossiê + Modelo 3D na palma da mão.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white flex flex-col items-center justify-center mx-auto max-w-[240px] shadow-xl">
          <QRCodeSVG value={dossierShareUrl} size={185} level="M" />
          <span className="text-[11px] font-semibold text-zinc-800 mt-3">
            Escaneie com a câmera do celular
          </span>
        </div>

        <div className="space-y-2.5 pt-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Olá ${clientName}! Aqui está o seu Dossiê Digital de Visagismo & Simulação 3D: ${dossierShareUrl}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition"
          >
            <Share2 className="w-4 h-4" />
            Enviar Dossiê Direto no WhatsApp da Cliente
          </a>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p className="text-zinc-200 font-semibold flex items-center gap-1.5">
              <Glasses className="w-3.5 h-3.5 text-amber-400" />
              Como abrir no Meta Quest 3 na mesma rede Wi-Fi:
            </p>
            <p>
              Abra o navegador do Quest 3 no endereço HTTPS exibido no terminal do Vite e clique em{' '}
              <strong className="text-amber-300">Entrar em Passthrough AR</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
