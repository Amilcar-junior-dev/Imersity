/**
 * Utilitários para extração e amostragem de cor de pele para o modelo 3D.
 * (Funções de geração sintética de canvas foram removidas para evitar caricaturas).
 */

/**
 * Amostra o tom médio da pele nas maçãs do rosto / testa da foto da cliente
 * para colorir a escultura 3D, pescoço e busto sem emendas visíveis.
 */
export function sampleSkinColorHexFromCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#dca88c';

  const w = canvas.width;
  const h = canvas.height;
  // Amostra região central/maçãs do rosto
  const samplePoints = [
    { x: Math.floor(w * 0.42), y: Math.floor(h * 0.52) },
    { x: Math.floor(w * 0.58), y: Math.floor(h * 0.52) },
    { x: Math.floor(w * 0.5), y: Math.floor(h * 0.35) },
  ];

  let rSum = 0,
    gSum = 0,
    bSum = 0;

  for (const pt of samplePoints) {
    const pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
    rSum += pixel[0];
    gSum += pixel[1];
    bSum += pixel[2];
  }

  const r = Math.round(rSum / samplePoints.length);
  const g = Math.round(gSum / samplePoints.length);
  const b = Math.round(bSum / samplePoints.length);

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
