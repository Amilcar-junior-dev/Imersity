import test from 'node:test';
import assert from 'node:assert/strict';
import {faceGeometryData,safeCaptureName,summarizeFrames,captureManifest} from './core.js';
const points=()=>Array.from({length:478},(_,i)=>({x:.2+(i%20)*.03,y:.2+Math.floor(i/20)*.02,z:-.05}));
test('a escala muda proporcionalmente à IPD assumida, sem alterar UVs',()=>{const p=points();p[468]={x:.4,y:.4,z:0};p[473]={x:.6,y:.4,z:0};const a=faceGeometryData(p,1000,1000,60),b=faceGeometryData(p,1000,1000,75);assert.equal(a.positions.length,1404);assert.deepEqual(a.uvs,b.uvs);assert.ok(Math.abs(b.positions[0]/a.positions[0]-1.25)<.00001);assert.equal(a.scaleSource,'assumed-ipd');});
test('rejeita coordenadas inválidas e imagem com rosto pequeno',()=>{const p=points();p[468]={x:.4,y:.4,z:0};p[473]={x:.4001,y:.4,z:0};assert.throws(()=>faceGeometryData(p,1000,1000),/pequeno/);p[0].z=NaN;assert.throws(()=>faceGeometryData(p,1000,1000),/inválidas/);});
test('pacote conserva separação treino/avaliação e neutraliza nomes',()=>{const input=[{name:'../../rosto.jpg',role:'train'},{name:'perfil.png',role:'evaluation'}];const m=captureManifest(input);assert.equal(m.images[0].path,'images/frame_00000.jpg');assert.equal(m.images[1].role,'evaluation');assert.equal(m.imageCount,2);assert.equal(safeCaptureName(1,'malicious.sh'),'images/frame_00001.jpg');});
test('métricas ignoram amostras inválidas e informam cauda de frames',()=>{const result=summarizeFrames([0,NaN,10,10,10,50]);assert.equal(result.samples,4);assert.equal(result.fps,50);assert.equal(result.p95,50);assert.equal(summarizeFrames([]).fps,0);});
