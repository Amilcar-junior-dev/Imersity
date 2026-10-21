/**
 * Gera um retrato frontal realista em alta definição em Canvas (com pele iluminada, olhos,
 * sobrancelhas, nariz, lábios e cabelo preso) para servir de textura 3D inicial antes do upload,
 * além de extrair automaticamente o tom de pele médio quando o usuário sobe uma foto real.
 */
export function createRealisticDefaultPortraitDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Fundo neutro escuro
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Cabelo preso na base superior (para não parecer careca)
  const hairGrad = ctx.createRadialGradient(512, 260, 40, 512, 340, 320);
  hairGrad.addColorStop(0, '#2a1b12');
  hairGrad.addColorStop(1, '#120b07');
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.ellipse(512, 390, 265, 310, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pele base do rosto com iluminação realista de estúdio
  const skinGrad = ctx.createRadialGradient(512, 480, 30, 512, 512, 310);
  skinGrad.addColorStop(0, '#f3cbb2');
  skinGrad.addColorStop(0.55, '#e2b091');
  skinGrad.addColorStop(0.88, '#c58c6d');
  skinGrad.addColorStop(1, '#9e6b4f');

  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(512, 512, 245, 315, 0, 0, Math.PI * 2);
  ctx.fill();

  // Blush suave nas maçãs do rosto (zigomáticos)
  [370, 654].forEach((cx) => {
    const blush = ctx.createRadialGradient(cx, 535, 10, cx, 535, 85);
    blush.addColorStop(0, 'rgba(210, 105, 95, 0.28)');
    blush.addColorStop(1, 'rgba(210, 105, 95, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx, 535, 85, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sobrancelhas arqueadas naturais
  ctx.strokeStyle = '#3b2416';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';

  // Sobrancelha esquerda
  ctx.beginPath();
  ctx.moveTo(345, 392);
  ctx.quadraticCurveTo(405, 368, 462, 386);
  ctx.stroke();

  // Sobrancelha direita
  ctx.beginPath();
  ctx.moveTo(679, 392);
  ctx.quadraticCurveTo(619, 368, 562, 386);
  ctx.stroke();

  // Olhos (Esclera, Íris Avelã/Mel, Pupila e Reflexo de Luz)
  [
    { x: 412, y: 432 },
    { x: 612, y: 432 },
  ].forEach((eye) => {
    // Sombra da pálpebra
    ctx.fillStyle = 'rgba(110, 65, 45, 0.35)';
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y - 8, 46, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Esclera
    ctx.fillStyle = '#faf8f6';
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y, 40, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Íris
    const irisGrad = ctx.createRadialGradient(eye.x, eye.y, 4, eye.x, eye.y, 17);
    irisGrad.addColorStop(0, '#3d2314');
    irisGrad.addColorStop(0.6, '#7c4d25');
    irisGrad.addColorStop(1, '#261710');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Pupila
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight (brilho de ringlight no olho)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eye.x - 5, eye.y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Delineado superior / cílios
    ctx.strokeStyle = '#1c120c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y + 4, 41, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  });

  // Sombra lateral e iluminação da ponte do nariz
  ctx.strokeStyle = 'rgba(135, 82, 56, 0.38)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(492, 410);
  ctx.quadraticCurveTo(485, 515, 478, 552);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(532, 410);
  ctx.quadraticCurveTo(539, 515, 546, 552);
  ctx.stroke();

  // Iluminação central do nariz
  const noseHigh = ctx.createLinearGradient(512, 410, 512, 555);
  noseHigh.addColorStop(0, 'rgba(255, 245, 235, 0.45)');
  noseHigh.addColorStop(1, 'rgba(255, 245, 235, 0.65)');
  ctx.strokeStyle = noseHigh;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(512, 415);
  ctx.lineTo(512, 550);
  ctx.stroke();

  // Base das narinas
  ctx.fillStyle = 'rgba(115, 65, 45, 0.55)';
  ctx.beginPath();
  ctx.ellipse(493, 564, 10, 5, 0.2, 0, Math.PI * 2);
  ctx.ellipse(531, 564, 10, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Lábios realistas
  const lipGrad = ctx.createLinearGradient(512, 625, 512, 682);
  lipGrad.addColorStop(0, '#b85d56');
  lipGrad.addColorStop(0.5, '#9e423c');
  lipGrad.addColorStop(1, '#c96f68');

  ctx.fillStyle = lipGrad;
  // Lábio superior (arco do cupido)
  ctx.beginPath();
  ctx.moveTo(445, 652);
  ctx.quadraticCurveTo(485, 628, 512, 640);
  ctx.quadraticCurveTo(539, 628, 579, 652);
  ctx.quadraticCurveTo(512, 660, 445, 652);
  ctx.fill();

  // Lábio inferior
  ctx.beginPath();
  ctx.moveTo(445, 652);
  ctx.quadraticCurveTo(512, 696, 579, 652);
  ctx.quadraticCurveTo(512, 658, 445, 652);
  ctx.fill();

  // Brilho labial (gloss leve)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.ellipse(512, 668, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Amostra o tom médio da pele nas maçãs do rosto / testa da foto da cliente
 * para colorir perfeitamente o crânio 3D, pescoço e orelhas sem emendas visíveis.
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
