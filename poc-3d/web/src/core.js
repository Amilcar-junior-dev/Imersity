export function faceGeometryData(points, width, height, ipdMM=63) {
  if (!Array.isArray(points) || points.length<468 || width<=0 || height<=0) throw new Error('Dados faciais inválidos.');
  if (!Number.isFinite(ipdMM) || ipdMM<40 || ipdMM>85) throw new Error('Use uma distância interpupilar entre 40 e 85 mm.');
  if (points.some(p=>![p.x,p.y,p.z].every(Number.isFinite))) throw new Error('Coordenadas inválidas.');
  const left=points[468] ?? points[33], right=points[473] ?? points[263];
  const eyePixels=Math.hypot((left.x-right.x)*width,(left.y-right.y)*height);
  if (eyePixels<10) throw new Error('O rosto está pequeno demais. Use uma foto mais próxima e nítida.');
  const scale=ipdMM/1000/eyePixels;
  const face=points.slice(0,468);
  const cx=(Math.min(...face.map(p=>p.x))+Math.max(...face.map(p=>p.x)))/2;
  const cy=(Math.min(...face.map(p=>p.y))+Math.max(...face.map(p=>p.y)))/2;
  const cz=(points[234].z+points[454].z)/2;
  const positions=new Float32Array(468*3), uvs=new Float32Array(468*2);
  face.forEach((p,i)=>{positions.set([(p.x-cx)*width*scale,(cy-p.y)*height*scale,(cz-p.z)*width*scale],i*3);uvs.set([p.x,1-p.y],i*2);});
  return {positions,uvs,scale,eyePixels,ipdMM,scaleSource:'assumed-ipd',method:'mediapipe-relative-depth',coverage:'face-only'};
}
export function safeCaptureName(index,name) {
  const extension=name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1] ?? 'jpg';
  return `images/frame_${String(index).padStart(5,'0')}.${extension}`;
}
export function assertCanImportVideo(captures) {
  if(captures.length) throw new Error('Já existem imagens neste experimento. Salve o pacote de captura e use Novo experimento antes de importar outro vídeo.');
}
export function assertSingleCaptureSource(captures) {
  const videos=new Set(captures.map(c=>c.sourceVideo).filter(Boolean));
  if(videos.size>1 || (videos.size && captures.some(c=>!c.sourceVideo))) {
    throw new Error('Há imagens de origens diferentes. Esta captura não pode ser reconstruída. Salve o pacote e inicie um Novo experimento com apenas um vídeo.');
  }
}
export function summarizeFrames(times) {
  const sorted=times.filter(v=>Number.isFinite(v)&&v>0).toSorted((a,b)=>a-b);
  if(!sorted.length) return {fps:0,p50:0,p95:0,samples:0};
  const at=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
  return {fps:1000/(sorted.reduce((a,b)=>a+b,0)/sorted.length),p50:at(.5),p95:at(.95),samples:sorted.length};
}
export function captureManifest(captures, name='Experimento sem nome') {
  return {schema:'imersity.capture.v1',name,createdAt:new Date().toISOString(),imageCount:captures.length,
    notes:'Fotos locais. A escala da captura multivista precisa de referência física. Imagens evaluation não devem entrar no treinamento.',
    images:captures.map((c,i)=>({path:safeCaptureName(i,c.name),originalName:c.name,role:c.role ?? 'train',angle:c.angle ?? 'unknown',width:c.width,height:c.height,sourceVideo:c.sourceVideo,timeSeconds:c.timeSeconds,sharpness:c.sharpness}))};
}
