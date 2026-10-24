export async function imageFromFile(file,max=2048){
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});const ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.sourceWidth=bitmap.width;canvas.sourceHeight=bitmap.height;canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
}
export const canvasBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao codificar imagem.')),'image/jpeg',.95));

// Variance of the discrete Laplacian. A relative sharpness heuristic, not a quality guarantee.
export function sharpnessScore(rgba,width,height){
 let sum=0,squared=0,n=0;
 const gray=i=>.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2];
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=(y*width+x)*4,v=4*gray(i)-gray(i-4)-gray(i+4)-gray(i-width*4)-gray(i+width*4);
  sum+=v;squared+=v*v;n++;
 }
 return n?Math.max(0,squared/n-(sum/n)**2):0;
}

export async function videoFrames(file,count,onProgress,maxDimension=2048){
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';const url=URL.createObjectURL(file);
 try{
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('Vídeo incompatível. Tente MP4/H.264.'));video.src=url;});
  if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>180)throw new Error('Use um vídeo de até 3 minutos.');
  const frames=[],canvas=document.createElement('canvas'),best=document.createElement('canvas'),thumb=document.createElement('canvas');
  const ratio=Math.min(1,maxDimension/Math.max(video.videoWidth,video.videoHeight));canvas.width=best.width=Math.round(video.videoWidth*ratio);canvas.height=best.height=Math.round(video.videoHeight*ratio);
  thumb.width=192;thumb.height=Math.max(2,Math.round(192*video.videoHeight/video.videoWidth));const ctx=canvas.getContext('2d'),bestCtx=best.getContext('2d'),small=thumb.getContext('2d',{willReadFrequently:true});
  const seek=time=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('O vídeo não respondeu. Tente MP4/H.264 ou menos quadros.')),15000);video.onseeked=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(new Error('Falha ao ler vídeo.'));};video.currentTime=time;});
  for(let i=0;i<count;i++){
   let score=-1,chosenTime=0;
   for(const offset of [-.24,0,.24]){
    const time=Math.min(video.duration-.01,Math.max(.01,(video.duration-.04)*(i+.5+offset)/count));await seek(time);
    small.drawImage(video,0,0,thumb.width,thumb.height);const value=sharpnessScore(small.getImageData(0,0,thumb.width,thumb.height).data,thumb.width,thumb.height);
    if(value>score){score=value;chosenTime=time;bestCtx.drawImage(video,0,0,best.width,best.height);}
   }
   ctx.drawImage(best,0,0);const blob=await canvasBlob(canvas);frames.push({id:crypto.randomUUID(),name:`video_${i.toString().padStart(4,'0')}.jpg`,blob,width:canvas.width,height:canvas.height,role:'train',angle:'unknown',sourceVideo:file.name,timeSeconds:chosenTime,sharpness:Math.round(score*100)/100});onProgress?.(i+1,count);
  }return frames;
 }finally{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
}
