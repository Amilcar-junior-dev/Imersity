import {mkdir, writeFile, cp, readFile} from 'node:fs/promises';
const assets = [
 ['https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', 'public/models/face_landmarker.task'],
 ['https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj', 'public/models/canonical_face_model.obj'],
];
await mkdir('public/models', {recursive:true});
for (const [url,path] of assets) {
 const response=await fetch(url); if(!response.ok) throw new Error(`${response.status}: ${url}`);
 const buffer=Buffer.from(await response.arrayBuffer()); await writeFile(path,buffer); console.log(`${path}: ${buffer.length} bytes`);
}
await cp('node_modules/@mediapipe/tasks-vision/wasm','public/wasm',{recursive:true});
const obj=await readFile('public/models/canonical_face_model.obj','utf8');
const triangles=obj.split('\n').filter(l=>l.startsWith('f ')).flatMap(l=>l.split(/\s+/).slice(1).map(p=>Number(p.split('/')[0])-1));
await writeFile('public/models/topology.json',JSON.stringify(triangles));
console.log(`Topology: ${triangles.length/3} triangles`);
