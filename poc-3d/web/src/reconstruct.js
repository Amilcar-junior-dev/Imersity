import {FilesetResolver,FaceLandmarker} from '@mediapipe/tasks-vision';
import {faceGeometryData} from './core.js';
let modelPromise;
export async function detectFace(image,ipdMM) {
  modelPromise??=(async()=>{const files=await FilesetResolver.forVisionTasks('/wasm');return FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/models/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6});})();
  let model;try{model=await modelPromise;}catch(error){modelPromise=null;throw new Error(`Não foi possível carregar o modelo facial. ${error.message}`);}
  await new Promise(r=>setTimeout(r,30));
  const result=model.detect(image);
  if(!result.faceLandmarks.length)throw new Error('Nenhum rosto encontrado. Use uma foto frontal, sem filtros, com boa iluminação.');
  if(result.faceLandmarks.length>1)throw new Error('A foto contém mais de um rosto. Escolha uma imagem de uma única pessoa.');
  return {...faceGeometryData(result.faceLandmarks[0],image.width,image.height,ipdMM),landmarks:result.faceLandmarks[0]};
}
