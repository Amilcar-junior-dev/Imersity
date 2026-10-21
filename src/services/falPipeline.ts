import { fal } from '@fal-ai/client';
import { GeneratedAsset3D } from '../types/visagism.types';

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    // Fallback manual para caso o fetch do dataURL falhe
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(parts[1].replace(/\s/g, ''));
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

export function extractFalErrorMessage(err: any): string {
  if (!err) return 'Erro desconhecido na chamada da API.';
  if (err.fieldErrors && Array.isArray(err.fieldErrors) && err.fieldErrors.length > 0) {
    return err.fieldErrors.map((f: any) => `${f.loc?.join('.') || 'campo'}: ${f.msg}`).join('; ');
  }
  if (err.body?.detail) {
    if (typeof err.body.detail === 'string') return err.body.detail;
    if (Array.isArray(err.body.detail)) {
      return err.body.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    }
    return JSON.stringify(err.body.detail);
  }
  if (err.body?.message) return err.body.message;
  if (err.message && err.message !== 'Failed to fetch') return err.message;
  if (err.status) return `Falha na requisição com código HTTP ${err.status}`;
  return typeof err === 'object' ? JSON.stringify(err) : String(err);
}

export async function convertPhotoTo3DAsset(params: {
  photoDataUrls: string[]; // Suporta 1 a 3 fotos (Frente + 45° Esq + 45° Dir)
  title: string;
  assetType: 'hair_or_bust' | 'glasses' | 'accessory';
  model?: 'fal-ai/hyper3d/rodin' | 'fal-ai/trellis';
  apiKey?: string;
  onStatusUpdate?: (status: string) => void;
}): Promise<GeneratedAsset3D> {
  const {
    photoDataUrls,
    title,
    assetType,
    model = 'fal-ai/hyper3d/rodin',
    apiKey,
    onStatusUpdate,
  } = params;

  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error(
      'Chave da Fal.ai (FAL_KEY) não encontrada ou inválida. Por favor, insira sua chave da fal.ai no campo abaixo para processar na GPU.'
    );
  }

  const cleanKey = apiKey.trim().replace(/^Key\s+/i, '').replace(/^Bearer\s+/i, '');

  fal.config({
    credentials: cleanKey,
    suppressLocalCredentialsWarning: true,
  });

  onStatusUpdate?.(
    `Enviando ${photoDataUrls.length} foto(s) Multi-View para o storage da Fal.ai...`
  );

  // Faz upload de todas as fotos (Frente + 45° Esq + 45° Dir) em paralelo para o CDN da Fal
  const publicImageUrls = await Promise.all(
    photoDataUrls.map(async (dataUrl, idx) => {
      if (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:')) {
        const blob = await dataUrlToBlob(dataUrl);
        const uploaded = await fal.storage.upload(blob);
        onStatusUpdate?.(`Foto ${idx + 1}/${photoDataUrls.length} enviada para o CDN...`);
        return uploaded;
      }
      return dataUrl;
    })
  );

  if (model === 'fal-ai/hyper3d/rodin') {
    onStatusUpdate?.(
      `Iniciando Hyper3D Rodin com ${publicImageUrls.length} foto(s) Multi-View (Geometria + Textura PBR)...`
    );

    const result: any = await fal.subscribe('fal-ai/hyper3d/rodin', {
      input: {
        input_image_urls: publicImageUrls,
        ...(publicImageUrls.length > 0 ? { image_url: publicImageUrls[0] } : {}),
        geometry_file_format: 'glb',
        material: 'PBR',
        quality: 'medium',
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          const lastLog = update.logs?.[update.logs.length - 1]?.message;
          onStatusUpdate?.(lastLog || 'Calculando profundidade e fusão dos ângulos na GPU...');
        }
      },
    });

    const data = result?.data || result;
    const glbUrl = data?.model_mesh?.url || data?.model_file?.url || data?.glb?.url;

    if (glbUrl) {
      return {
        id: `asset-${Date.now()}`,
        title: `${title} (${publicImageUrls.length} Foto(s) Multi-View)`,
        sourcePhotoUrl: photoDataUrls[0],
        assetType,
        pipelineUsed: 'fal-ai/hyper3d/rodin',
        glbUrl,
        createdAt: new Date().toLocaleTimeString('pt-BR'),
      };
    }
    throw new Error('Hyper3D Rodin não retornou o arquivo .glb');
  } else if (model === 'fal-ai/trellis') {
    // Modelo Trellis (Microsoft - Gera GLB + Gaussian Splatting usando a foto frontal)
    onStatusUpdate?.('Executando Trellis 3D (Malha GLB + Gaussian Splat)...');
    const result: any = await fal.subscribe('fal-ai/trellis', {
      input: {
        image_url: publicImageUrls[0],
        ss_guidance_strength: 7.5,
        ss_sampling_steps: 12,
        slat_guidance_strength: 3.0,
        slat_sampling_steps: 12,
        mesh_simplify: 0.95,
        texture_size: '1024',
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          onStatusUpdate?.('Trellis decodificando gaussianas e malha 3D...');
        }
      },
    });

    const data = result?.data || result;
    const glbUrl = data?.model_mesh?.url || data?.mesh?.url;
    const splatUrl = data?.gaussian_ply?.url || data?.point_cloud?.url;

    if (glbUrl || splatUrl) {
      return {
        id: `asset-${Date.now()}`,
        title,
        sourcePhotoUrl: photoDataUrls[0],
        assetType,
        pipelineUsed: 'fal-ai/trellis',
        glbUrl,
        splatUrl,
        createdAt: new Date().toLocaleTimeString('pt-BR'),
      };
    }
    throw new Error('Trellis não retornou arquivo 3D válido (.glb ou .ply)');
  }

  throw new Error('Nenhum modelo de IA válido foi executado.');
}

export async function generateHairSimulation2D(params: {
  sourcePhotoDataUrl: string;
  hairPreset: any;
  rootHex: string;
  tipHex: string;
  apiKey?: string;
}): Promise<string> {
  return params.sourcePhotoDataUrl;
}
