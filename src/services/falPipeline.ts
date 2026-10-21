import { fal } from '@fal-ai/client';
import { GeneratedAsset3D } from '../types/visagism.types';

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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

  if (apiKey && apiKey.trim().length > 10) {
    fal.config({
      credentials: apiKey.trim(),
    });

    onStatusUpdate?.(
      `Enviando ${photoDataUrls.length} foto(s) Multi-View para a Fal.ai...`
    );

    // Faz upload de todas as fotos (Frente + 45° Esq + 45° Dir) em paralelo para o CDN da Fal
    const publicImageUrls = await Promise.all(
      photoDataUrls.map(async (dataUrl, idx) => {
        if (dataUrl.startsWith('data:')) {
          const blob = dataUrlToBlob(dataUrl);
          const uploaded = await fal.storage.upload(blob);
          onStatusUpdate?.(`Foto ${idx + 1}/${photoDataUrls.length} enviada para o CDN...`);
          return uploaded;
        }
        return dataUrl;
      })
    );

    if (model === 'fal-ai/hyper3d/rodin') {
      onStatusUpdate?.(
        `Processando Hyper3D Rodin Multi-View com ${publicImageUrls.length} ângulos (Geometria + Textura PBR 4K)...`
      );

      const result: any = await fal.subscribe('fal-ai/hyper3d/rodin', {
        input: {
          input_image_urls: publicImageUrls, // Envia o array com as 3 fotos juntas em 1 única requisição!
          geometry_file_format: 'glb',
          material: 'PBR',
          quality: 'medium',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            const lastLog = update.logs?.[update.logs.length - 1]?.message;
            onStatusUpdate?.(lastLog || 'Calculando profundidade e fusão dos 3 ângulos...');
          }
        },
      });

      const data = result?.data || result;
      const glbUrl = data?.model_file?.url || data?.model_mesh?.url || data?.glb?.url;

      if (glbUrl) {
        return {
          id: `asset-${Date.now()}`,
          title: `${title} (${publicImageUrls.length} Fotos Multi-View)`,
          sourcePhotoUrl: photoDataUrls[0],
          assetType,
          pipelineUsed: 'fal-ai/hyper3d/rodin',
          glbUrl,
          createdAt: new Date().toLocaleTimeString('pt-BR'),
        };
      }
      throw new Error('Hyper3D Rodin não retornou o arquivo .glb');
    }

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
  }

  // Fallback demo local quando sem chave
  await new Promise((r) => setTimeout(r, 1200));
  return {
    id: `demo-${Date.now()}`,
    title: `${title} (Demo Procedural)`,
    sourcePhotoUrl: photoDataUrls[0],
    assetType,
    pipelineUsed: 'demo-procedural',
    createdAt: new Date().toLocaleTimeString('pt-BR'),
  };
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
