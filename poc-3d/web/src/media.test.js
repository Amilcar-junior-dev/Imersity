import test from 'node:test';
import assert from 'node:assert/strict';
import {sharpnessScore} from './media.js';
test('sharpness heuristic distinguishes uniform, blurred and crisp edges',()=>{
 const sample=fn=>{const pixels=new Uint8ClampedArray(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=fn(x);pixels[i+3]=255;}return sharpnessScore(pixels,32,32);};
 const flat=sample(()=>128),blur=sample(x=>Math.max(0,Math.min(255,(x-8)*16))),edge=sample(x=>x<16?0:255);
 assert.equal(flat,0);assert.ok(edge>blur&&blur>flat);
});
