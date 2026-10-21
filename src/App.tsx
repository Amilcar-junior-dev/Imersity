import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { XR } from '@react-three/xr';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { xrStore } from './store/xrStore';
import {
  Camera,
  Upload,
  Sparkles,
  Scissors,
  Palette,
  Layers,
  Eye,
  RotateCw,
  Box,
  CheckCircle2,
  Loader2,
  Glasses,
  Sliders,
} from 'lucide-react';
import {
  GLASSES_PRESETS,
  HAIR_PRESETS,
  useVisagismStore,
} from './store/useVisagismStore';
import { VisagismBust3D } from './components/studio3d/VisagismBust3D';
import { SpatialHUD3D } from './components/studio3d/SpatialHUD3D';
import { analyzeFaceLandmarks, NormalizedLandmark } from './services/faceAnalysis';
import { sampleSkinColorHexFromCanvas } from './services/defaultPortrait';
import { convertPhotoTo3DAsset } from './services/falPipeline';
import { CrisalixStudio } from './components/crisalix/CrisalixStudio';

export const App: React.FC = () => {
  const {
    capturedPhotoDataUrl,
    setCapturedPhoto,
    leftSidePhotoUrl,
    setLeftSidePhoto,
    rightSidePhotoUrl,
    setRightSidePhoto,
    sidePhotosDataUrls,
    addSidePhoto,
    setFaceLandmarksAndSkin,
    faceDepthRelief,
    setFaceDepthRelief,
    showFaceMeshWireframe,
    toggleFaceMeshWireframe,
    biometrics,
    setBiometricsAndReport,
    imageGoal,

    showHairLayer,
    toggleHairLayer,
    selectedHairPreset,
    selectHairPreset,
    hairColors,
    setHairColors,
    anisotropyIntensity,
    setAnisotropyIntensity,
    hairVolumeScale,
    setHairVolumeScale,
    hairOffsetY,
    setHairOffsetY,
    hairOffsetZ,
    setHairOffsetZ,
    setCustomHairGlbUrl,

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

    falApiKey,
    setFalApiKey,
    isGenerating3D,
    setIsGenerating3D,
    generatedAssets,
    addGeneratedAsset,
  } = useVisagismStore();

  const frontalInputRef = useRef<HTMLInputElement | null>(null);
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);
  const wigPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const glbWigInputRef = useRef<HTMLInputElement | null>(null);
  const splatInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [meshStatus, setMeshStatus] = useState<string>(
    'Malha 3D pronta (Suba uma foto real para reconstruir o rosto da cliente)'
  );
  const [wigReferencePhoto, setWigReferencePhoto] = useState<string | null>(null);
  const [selected3DModel, setSelected3DModel] = useState<'fal-ai/hyper3d/rodin' | 'fal-ai/trellis'>(
    'fal-ai/hyper3d/rodin'
  );
  const [activeMainTab, setActiveMainTab] = useState<'crisalix_3dmm' | 'rodin_ia'>('crisalix_3dmm');
  const [ai3dStatusMessage, setAi3dStatusMessage] = useState<string>('');

  const loadVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        // Prioriza webcam externa (se houver, que não seja a FaceTime/Built-in integrada)
        const external = videoInputs.find(
          (d) =>
            !d.label.toLowerCase().includes('facetime') &&
            !d.label.toLowerCase().includes('built-in') &&
            !d.label.toLowerCase().includes('integrada')
        );
        setSelectedDeviceId(external ? external.deviceId : videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Erro ao listar câmeras:', err);
    }
  };

  useEffect(() => {
    loadVideoDevices();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = loadVideoDevices;
    }
  }, []);

  const ensureLandmarker = async () => {
    if (landmarker) return landmarker;
    try {
      setMeshStatus('Inicializando MediaPipe 478 3D Landmarks...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      const instance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'IMAGE',
        numFaces: 1,
      });
      setLandmarker(instance);
      return instance;
    } catch (err) {
      console.warn('Fallback MediaPipe:', err);
      return null;
    }
  };

  // Processa a foto frontal da cliente: extrai os 478 vértices 3D + cor da pele e reconstrói a Camada 1!
  const processClientFrontalPhoto = async (dataUrl: string) => {
    setCapturedPhoto(dataUrl);
    setMeshStatus('Extraindo topologia 3D e textura UV do rosto...');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = Math.round((img.height / img.width) * 1024) || 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const sampledSkinHex = sampleSkinColorHexFromCanvas(canvas);
      const mp = await ensureLandmarker();

      if (mp) {
        const result = mp.detect(canvas);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const lms = result.faceLandmarks[0] as NormalizedLandmark[];
          setFaceLandmarksAndSkin(lms, sampledSkinHex);
          const { biometrics: bio, report: rep } = analyzeFaceLandmarks(lms, imageGoal);
          setBiometricsAndReport(bio, rep);
          setMeshStatus(
            `Rosto 3D reconstruído (${lms.length} vértices • Formato ${bio.faceShape})`
          );
          return;
        }
      }

      // Mesmo sem detecção WASM, atualiza a textura fotográfica e o tom de pele na malha 3D
      setFaceLandmarksAndSkin(useVisagismStore.getState().faceLandmarks, sampledSkinHex);
      setMeshStatus('Textura fotográfica 3D aplicada à malha facial!');
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    if (capturedPhotoDataUrl) {
      processClientFrontalPhoto(capturedPhotoDataUrl);
    }
  }, []);

  const handleFrontalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      processClientFrontalPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addSidePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async (overrideDeviceId?: string) => {
    try {
      const targetDeviceId = overrideDeviceId || selectedDeviceId;
      setMeshStatus('Solicitando permissão da câmera ao navegador...');
      
      // Para stream anterior se estiver ativo ao trocar
      if (videoRef.current && videoRef.current.srcObject) {
        const prevStream = videoRef.current.srcObject as MediaStream;
        prevStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          facingMode: targetDeviceId ? undefined : 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Atualiza lista de dispositivos agora que a permissão foi concedida (os nomes/labels aparecem)
      await loadVideoDevices();
      setMeshStatus('Webcam ativa! Centralize o rosto e clique em "Capturar Rosto".');
    } catch (err: any) {
      console.error('Erro ao abrir webcam:', err);
      setCameraActive(false);
      setMeshStatus(
        `Erro na câmera (${err?.name || 'Permissão negada'}). Libere a câmera no navegador ou use "Subir Foto Frontal".`
      );
    }
  };

  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (cameraActive) {
      await startWebcam(newDeviceId);
    }
  };

  const captureSlotPhoto = (slot: 'front' | 'left' | 'right') => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (slot === 'front') {
      processClientFrontalPhoto(dataUrl);
    } else if (slot === 'left') {
      setLeftSidePhoto(dataUrl);
      setMeshStatus('Foto 45° Esquerda capturada! Agora vire levemente para a direita.');
    } else if (slot === 'right') {
      setRightSidePhoto(dataUrl);
      setMeshStatus('Foto 45° Direita capturada! 3 ângulos prontos para IA.');
    }
  };

  const handleSlotUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'front' | 'left' | 'right'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (slot === 'front') {
        processClientFrontalPhoto(dataUrl);
      } else if (slot === 'left') {
        setLeftSidePhoto(dataUrl);
      } else if (slot === 'right') {
        setRightSidePhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWigPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWigReferencePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate3DWigFromPhoto = async () => {
    // Coleta as fotos disponíveis: Frente + 45° Esq + 45° Dir
    const multiViewPhotos = [
      capturedPhotoDataUrl,
      leftSidePhotoUrl,
      rightSidePhotoUrl,
    ].filter(Boolean) as string[];

    const sourcePhotos = wigReferencePhoto ? [wigReferencePhoto] : multiViewPhotos;

    if (sourcePhotos.length === 0) {
      alert('Capture pelo menos a foto frontal da cliente.');
      return;
    }
    if (!falApiKey || falApiKey.trim().length < 10) {
      alert('Cole sua chave da Fal.ai (FAL_KEY) no campo abaixo para gerar.');
      return;
    }

    setIsGenerating3D(true);
    setAi3dStatusMessage(
      `Iniciando com ${sourcePhotos.length} foto(s) Multi-View...`
    );

    try {
      const asset = await convertPhotoTo3DAsset({
        photoDataUrls: sourcePhotos,
        title:
          selected3DModel === 'fal-ai/hyper3d/rodin'
            ? `Avatar 3D Multi-View (${sourcePhotos.length} fotos)`
            : 'Ativo 3D (Trellis)',
        assetType: 'hair_or_bust',
        model: selected3DModel,
        apiKey: falApiKey,
        onStatusUpdate: (msg) => setAi3dStatusMessage(msg),
      });

      addGeneratedAsset(asset);

      if (asset.glbUrl) {
        setActiveCustomGlbUrl(asset.glbUrl);
        setRenderMode3D('custom_glb');
        setAi3dStatusMessage('Modelo 3D Multi-View carregado com sucesso!');
      } else if (asset.splatUrl) {
        setActiveSplatUrl(asset.splatUrl);
        setRenderMode3D('gaussian_splat');
        setAi3dStatusMessage('Gaussian Splatting carregado!');
      }
    } catch (err: any) {
      console.error('Erro na geração 3D:', err);
      setAi3dStatusMessage(`Erro: ${err?.message || 'Falha na API'}`);
      alert(err?.message || 'Erro ao gerar 3D na Fal.ai. Verifique seus créditos.');
    } finally {
      setIsGenerating3D(false);
    }
  };

  const handleLoadLocalHairGLB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomHairGlbUrl(url);
    setRenderMode3D('anisotropic_mesh');
  };

  const handleLoadLocalSplat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setActiveSplatUrl(url);
    setRenderMode3D('gaussian_splat');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header Enxuto de Engenharia 3D */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-30 px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm">
              3D
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Bancada de Validação: Foto da Cliente → Avatar 3D Modular & Cabelos
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Arquitetura em 3 Camadas Independentes
                </span>
              </h1>
              <p className="text-xs text-zinc-400">{meshStatus}</p>
            </div>
          </div>

          {/* Botão WebXR Meta Quest 3 direto no topo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => xrStore.enterAR()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              Abrir em Passthrough AR (Meta Quest 3)
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Abas Principais de Abordagem Tecnológica */}
      <div className="bg-zinc-900/95 border-b border-zinc-800 px-5 py-2.5 sticky top-[61px] z-20 backdrop-blur">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('crisalix_3dmm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeMainTab === 'crisalix_3dmm'
                  ? 'bg-teal-500 text-zinc-950 shadow-md shadow-teal-500/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-zinc-950" />
              <span>🔬 Modo Anatômico (Padrão Crisalix - 3DMM)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                activeMainTab === 'crisalix_3dmm' ? 'bg-teal-600/30 text-zinc-950' : 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
              }`}>
                Olhos 3D Reais • Sem Cera
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('rodin_ia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeMainTab === 'rodin_ia'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>👑 Modo Fal.ai Nuvem (Hyper3D Rodin Multi-View)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium font-mono ${
                activeMainTab === 'rodin_ia' ? 'bg-amber-600/30 text-zinc-950' : 'bg-zinc-800 text-amber-300'
              }`}>
                $10 Saldo Ativo
              </span>
            </button>
          </div>

          <div className="text-xs text-zinc-400 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {activeMainTab === 'crisalix_3dmm'
                ? 'Globos oculares com córnea vítrea independente + cabelo puxado para trás (Sem estrabismo)'
                : 'Malha neural difusa reconstruída a partir de 3 fotos na nuvem'}
            </span>
          </div>
        </div>
      </div>

      {activeMainTab === 'crisalix_3dmm' ? (
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-5">
          <CrisalixStudio onProcessPhoto={processClientFrontalPhoto} />
        </main>
      ) : (
      /* Grid Único de 3 Colunas: [1. Rosto Base 3D] | [2. Viewport 3D Central] | [3. Perucas 3D Modulares] */
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            COLUNA 1 (3 cols): CAMADA 1 — ROSTO 3D DA CLIENTE (CONSTRUÍDO 1 ÚNICA VEZ)
           ========================================================================= */}
        <section className="lg:col-span-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Camada 1 (Fixa no Espaço)
            </span>
            <h2 className="text-sm font-bold text-white mt-0.5">
              Rosto 3D da Cliente (1 a 3 Fotos)
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              O rosto é mapeado em 3D uma única vez (com cabelo preso no crânio) e nunca precisa ser
              reconstruído ao trocar o cabelo.
            </p>
          </div>

          {/* Viewport da Câmera / Preview */}
          <div className="space-y-2">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${
                  cameraActive ? 'block' : 'hidden'
                }`}
              />
              {!cameraActive && capturedPhotoDataUrl && (
                <img
                  src={capturedPhotoDataUrl}
                  alt="Foto Frontal da Cliente"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-700 text-[10px] text-amber-300 font-semibold">
                {cameraActive
                  ? '● CÂMERA AO VIVO — Capture os 3 ângulos abaixo'
                  : '1. Foto Frontal (Padrão 3D)'}
              </div>
            </div>

            {/* Seletor de Câmera */}
            {videoDevices.length > 0 && (
              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer truncate"
                  title="Selecionar dispositivo de vídeo"
                >
                  {videoDevices.map((dev, idx) => (
                    <option
                      key={dev.deviceId || idx}
                      value={dev.deviceId}
                      className="bg-zinc-900 text-white text-xs"
                    >
                      {dev.label || `Câmera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão de Ligar/Desligar Câmera */}
            {!cameraActive ? (
              <button
                onClick={() => startWebcam()}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center justify-center gap-1.5 border border-zinc-700"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                {selectedDeviceId ? 'Ligar Câmera para Capturar 3 Fotos' : 'Usar Webcam'}
              </button>
            ) : (
              <div className="space-y-1.5 p-2 rounded-xl bg-zinc-950 border border-amber-500/40">
                <span className="text-[10px] text-amber-300 font-bold block text-center uppercase tracking-wider">
                  Clique nos 3 botões em sequência:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => captureSlotPhoto('front')}
                    className="px-2 py-2 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex flex-col items-center justify-center transition"
                  >
                    <span>1. Frente</span>
                    <span className="text-[9px] font-normal">Olhar reto</span>
                  </button>
                  <button
                    onClick={() => captureSlotPhoto('left')}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center transition ${
                      leftSidePhotoUrl
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    <span>2. 45° Esq</span>
                    <span className="text-[9px] font-normal">Vire rosto</span>
                  </button>
                  <button
                    onClick={() => captureSlotPhoto('right')}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center transition ${
                      rightSidePhotoUrl
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    <span>3. 45° Dir</span>
                    <span className="text-[9px] font-normal">Vire rosto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Os 3 Slots de Fotos Multi-View (Estilo Crisalix) */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Os 3 Ângulos Multi-View
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-300 font-mono">
                {[capturedPhotoDataUrl, leftSidePhotoUrl, rightSidePhotoUrl].filter(Boolean).length}/3 prontos
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Slot 1: Frente */}
              <div className="space-y-1">
                <div
                  onClick={() => frontalInputRef.current?.click()}
                  className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer hover:border-amber-500/60 flex items-center justify-center relative group"
                >
                  {capturedPhotoDataUrl ? (
                    <img
                      src={capturedPhotoDataUrl}
                      alt="Frente"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-500 text-center px-1">Frente</span>
                  )}
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition">
                    Trocar
                  </span>
                </div>
                <span className="text-[9px] text-zinc-400 block text-center truncate">1. Frente</span>
                <input
                  ref={frontalInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSlotUpload(e, 'front')}
                />
              </div>

              {/* Slot 2: 45° Esquerda */}
              <div className="space-y-1">
                <div
                  onClick={() => leftInputRef.current?.click()}
                  className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer hover:border-amber-500/60 flex items-center justify-center relative group"
                >
                  {leftSidePhotoUrl ? (
                    <img
                      src={leftSidePhotoUrl}
                      alt="45° Esquerda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-500 text-center px-1">+ 45° Esq</span>
                  )}
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition">
                    Subir
                  </span>
                </div>
                <span className="text-[9px] text-zinc-400 block text-center truncate">2. 45° Esq</span>
                <input
                  ref={leftInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSlotUpload(e, 'left')}
                />
              </div>

              {/* Slot 3: 45° Direita */}
              <div className="space-y-1">
                <div
                  onClick={() => rightInputRef.current?.click()}
                  className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer hover:border-amber-500/60 flex items-center justify-center relative group"
                >
                  {rightSidePhotoUrl ? (
                    <img
                      src={rightSidePhotoUrl}
                      alt="45° Direita"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-500 text-center px-1">+ 45° Dir</span>
                  )}
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition">
                    Subir
                  </span>
                </div>
                <span className="text-[9px] text-zinc-400 block text-center truncate">3. 45° Dir</span>
                <input
                  ref={rightInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSlotUpload(e, 'right')}
                />
              </div>
            </div>
          </div>

          {/* Controles da Geometria 3D do Rosto */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                <span>Relevo 3D do Rosto (Nariz / Zigomático)</span>
                <span className="text-amber-400 font-mono">{faceDepthRelief.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={2.4}
                step={0.05}
                value={faceDepthRelief}
                onChange={(e) => setFaceDepthRelief(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <button
              onClick={toggleFaceMeshWireframe}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium border transition flex items-center justify-center gap-1.5 ${
                showFaceMeshWireframe
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {showFaceMeshWireframe
                ? 'Ocultar Triangulação 3D (468 pts)'
                : 'Ver Malha 3D Triangulada do Rosto'}
            </button>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/80">
              <span className="text-zinc-400">Formato Medido:</span>
              <strong className="text-amber-400">{biometrics?.faceShape}</strong>
            </div>
          </div>
        </section>

        {/* =========================================================================
            COLUNA 2 (5 cols): VIEWPORT 3D CENTRAL (ROSTO REAL + CABELO ENCAIXADO)
           ========================================================================= */}
        <section className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Barra de Controle de Camadas Visíveis */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {renderMode3D === 'custom_glb' ? (
                <button
                  onClick={() => {
                    setActiveCustomGlbUrl(null);
                    setRenderMode3D('anisotropic_mesh');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 flex items-center gap-1.5 shadow"
                >
                  ← Voltar ao Avatar Modular & Cabelos
                </button>
              ) : (
                <button
                  onClick={toggleHairLayer}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    showHairLayer
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  {showHairLayer ? 'Camada Cabelo: ON' : 'Cabelo Preso Base'}
                </button>
              )}

              <button
                onClick={toggleVisagismWireframe3D}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  showVisagismWireframe3D
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Terços 3D
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Zoom livre (Scroll / Pinça)</span>
              <button
                onClick={toggleAutoRotate3D}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition ${
                  autoRotate3D
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                Girar 360°
              </button>
            </div>
          </div>

          {/* Canvas Three.js + WebXR */}
          <div className="relative w-full h-[620px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
            <Canvas
              shadows
              gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
              camera={{ position: [0, 1.35, 0.75], fov: 38 }}
            >
              <XR store={xrStore}>
                <ambientLight intensity={0.95} />
                <directionalLight position={[1.4, 2.2, 1.8]} intensity={1.45} castShadow />
                <directionalLight position={[-1.4, 1.6, -1.0]} intensity={0.65} color="#ffd89b" />
                <pointLight position={[0, 1.5, 0.5]} intensity={0.45} color="#ffffff" />

                <Suspense fallback={null}>
                  <VisagismBust3D />
                  <SpatialHUD3D />
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
                  minDistance={0.15}
                  maxDistance={6.0}
                />
              </XR>
            </Canvas>

            {/* Instrução de Interação no Rodapé do Canvas */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-zinc-950/85 backdrop-blur border border-zinc-800 text-[11px] text-zinc-400">
              <span>
                Arraste com o mouse para girar o rosto 3D da cliente e ver o relevo lateral
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => glbWigInputRef.current?.click()}
                  className="text-amber-300 hover:underline font-medium"
                >
                  + Carregar .GLB
                </button>
                <input
                  ref={glbWigInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={handleLoadLocalHairGLB}
                />
                <span>•</span>
                <button
                  onClick={() => splatInputRef.current?.click()}
                  className="text-sky-300 hover:underline font-medium"
                >
                  + Carregar .SPLAT
                </button>
                <input
                  ref={splatInputRef}
                  type="file"
                  accept=".splat,.ply"
                  className="hidden"
                  onChange={handleLoadLocalSplat}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            COLUNA 3 (4 cols): CAMADA 2 & 3 — TROCA DE CABELO 3D E CRIAÇÃO POR FOTO
           ========================================================================= */}
        <section className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-5 max-h-[720px] overflow-y-auto">
          {/* 1. Seletor Instantâneo de "Peruca 3D" (Não reconstrói o rosto!) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                Camada 2: Trocar Cabelo 3D (Instantâneo)
              </span>
              {renderMode3D !== 'anisotropic_mesh' && (
                <button
                  onClick={() => {
                    setCustomHairGlbUrl(null);
                    setRenderMode3D('anisotropic_mesh');
                  }}
                  className="text-[11px] text-amber-300 underline"
                >
                  Voltar p/ Cabelos Modulares
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {HAIR_PRESETS.map((preset) => {
                const active = selectedHairPreset.id === preset.id && showHairLayer;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCustomHairGlbUrl(null);
                      setRenderMode3D('anisotropic_mesh');
                      selectHairPreset(preset);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ajuste Fino de Encaixe da Peruca 3D no Crânio + Cor */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Ajuste de Encaixe & Cor da Peruca 3D
            </h3>

            {/* Cores Raiz / Meio / Pontas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">Raiz</span>
                <input
                  type="color"
                  value={hairColors.rootHex}
                  onChange={(e) => setHairColors({ rootHex: e.target.value })}
                  className="w-full h-6 rounded cursor-pointer bg-transparent"
                />
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">Meio</span>
                <input
                  type="color"
                  value={hairColors.midHex}
                  onChange={(e) => setHairColors({ midHex: e.target.value })}
                  className="w-full h-6 rounded cursor-pointer bg-transparent"
                />
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">Pontas</span>
                <input
                  type="color"
                  value={hairColors.tipHex}
                  onChange={(e) => setHairColors({ tipHex: e.target.value })}
                  className="w-full h-6 rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Sliders de Encaixe no Crânio */}
            <div className="space-y-2 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Volume Lateral do Cabelo</span>
                  <span className="text-amber-300 font-mono">
                    {Math.round(hairVolumeScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.01}
                  value={hairVolumeScale}
                  onChange={(e) => setHairVolumeScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Altura Testa (Y)</span>
                    <span className="font-mono">{hairOffsetY.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={-0.08}
                    max={0.08}
                    step={0.005}
                    value={hairOffsetY}
                    onChange={(e) => setHairOffsetY(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Encaixe Nuca (Z)</span>
                    <span className="font-mono">{hairOffsetZ.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={-0.08}
                    max={0.08}
                    step={0.005}
                    value={hairOffsetZ}
                    onChange={(e) => setHairOffsetZ(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Brilho Anisotrópico (Seda)</span>
                  <span className="text-amber-300 font-mono">
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
            </div>
          </div>

          {/* 3. Camada 3: Prova Rápida de Óculos 3D */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-2">
              <Glasses className="w-3.5 h-3.5" />
              Camada 3: Acessórios / Óculos 3D
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {GLASSES_PRESETS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectGlasses(g)}
                  className={`p-2 rounded-xl border text-left text-xs transition ${
                    selectedGlasses.id === g.id
                      ? 'bg-sky-500/15 border-sky-500 text-white font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Gerar Nova "Peruca 3D" ou Busto 360° via Foto (Fal.ai Trellis) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                Extrair Novo Cabelo/Busto 3D de Foto (IA)
              </span>
              <button
                onClick={() => wigPhotoInputRef.current?.click()}
                className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Foto de Cabelo
              </button>
              <input
                ref={wigPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWigPhotoUpload}
              />
            </div>

            {wigReferencePhoto && (
              <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <img
                  src={wigReferencePhoto}
                  alt="Referência de Cabelo"
                  className="w-10 h-10 rounded object-cover"
                />
                <span className="text-[11px] text-zinc-300">
                  Foto de referência pronta p/ converter em 3D
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-medium block">
                Motor de IA 3D na Nuvem:
              </label>
              <select
                value={selected3DModel}
                onChange={(e) => setSelected3DModel(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="fal-ai/hyper3d/rodin" className="bg-zinc-950 text-white">
                  👑 Hyper3D Rodin (Busto Humano PBR Colorido 4K)
                </option>
                <option value="fal-ai/trellis" className="bg-zinc-950 text-white">
                  Trellis 3D (Malha GLB + Gaussian Splatting)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">Chave Fal.ai (FAL_KEY):</span>
                <span className={falApiKey ? 'text-emerald-400 font-mono' : 'text-zinc-500'}>
                  {falApiKey ? '● Chave configurada' : 'Não informada'}
                </span>
              </div>
              <input
                type="password"
                placeholder="Cole sua FAL_KEY aqui..."
                value={falApiKey}
                onChange={(e) => setFalApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            {ai3dStatusMessage && (
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-amber-300 flex items-center gap-2">
                <Loader2 className={`w-3.5 h-3.5 shrink-0 ${isGenerating3D ? 'animate-spin' : ''}`} />
                <span className="truncate">{ai3dStatusMessage}</span>
              </div>
            )}

            <button
              onClick={handleGenerate3DWigFromPhoto}
              disabled={isGenerating3D}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-zinc-950 flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
            >
              {isGenerating3D ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processando 3D Multi-View na Nuvem...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar Avatar 3D Multi-View (
                  {[capturedPhotoDataUrl, leftSidePhotoUrl, rightSidePhotoUrl].filter(Boolean).length} Fotos
                  {selected3DModel === 'fal-ai/hyper3d/rodin' ? ' • Rodin PBR' : ' • Trellis'})
                </>
              )}
            </button>

            {generatedAssets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {generatedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-zinc-200 truncate max-w-[160px]">{asset.title}</span>
                    <div className="flex items-center gap-1">
                      {asset.glbUrl && (
                        <button
                          onClick={() => {
                            setActiveCustomGlbUrl(asset.glbUrl!);
                            setRenderMode3D('custom_glb');
                          }}
                          className="px-2 py-1 rounded bg-amber-500 text-zinc-950 font-bold"
                        >
                          Usar .GLB
                        </button>
                      )}
                      {asset.splatUrl && (
                        <button
                          onClick={() => {
                            setActiveSplatUrl(asset.splatUrl!);
                            setRenderMode3D('gaussian_splat');
                          }}
                          className="px-2 py-1 rounded bg-sky-500 text-zinc-950 font-bold"
                        >
                          Usar .Splat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      )}
    </div>
  );
};

export default App;
