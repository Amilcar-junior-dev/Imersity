import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshPhysicalMaterial,Texture} from 'three';
import {inspectionMaterial} from './inspection.js';
test('unlit inspection preserves base color and texture without changing scan materials',()=>{
 const texture=new Texture(),normal=new Texture(),roughness=new Texture();
 const source=new MeshPhysicalMaterial({map:texture,normalMap:normal,roughnessMap:roughness,color:0xa98472,roughness:.4});
 const unlit=inspectionMaterial(source,'albedo');
 assert.equal(unlit.isMeshBasicMaterial,true);assert.equal(unlit.map,texture);assert.equal(unlit.color.getHex(),source.color.getHex());assert.equal(unlit.normalMap,undefined);assert.equal(unlit.toneMapped,false);
 assert.equal(source.normalMap,normal);assert.equal(source.roughnessMap,roughness);assert.equal(source.roughness,.4);assert.equal(inspectionMaterial(source,'texture'),source);
});
test('geometry inspection excludes color and normal maps that can hide surface errors',()=>{
 const source=new MeshPhysicalMaterial({map:new Texture(),normalMap:new Texture()});const clay=inspectionMaterial(source,'clay');
 assert.equal(clay.map,null);assert.equal(clay.normalMap,null);assert.equal(clay.wireframe,false);assert.equal(inspectionMaterial(source,'wire').wireframe,true);
});

import {Group,Mesh,BoxGeometry} from 'three';
import {correctUSDNormalDecoding,correctScanNormals} from './inspection.js';
test('standard USD normal decoding is not applied twice as bump strength',()=>{
 const material=new MeshPhysicalMaterial({normalMap:new Texture()});material.normalScale.set(2,2);material.normalMap.userData={scale:[2,2,2,2],bias:[-1,-1,-1,-1]};
 assert.equal(correctUSDNormalDecoding(material),true);assert.deepEqual(material.normalScale.toArray(),[1,1]);assert.equal(correctUSDNormalDecoding(material),false);
 const foreign=material.clone();foreign.normalScale.set(2,2);foreign.normalMap=new Texture();foreign.normalMap.userData={scale:[2,2,2,2],bias:[0,0,0,0]};assert.equal(correctUSDNormalDecoding(foreign),false);
});
test('legacy correction requires our provenance and never changes vertex positions',()=>{
 const root=new Group(),material=new MeshPhysicalMaterial({normalMap:new Texture()}),geometry=new BoxGeometry();material.normalScale.set(2,-2);root.add(new Mesh(geometry,material));const positions=geometry.attributes.position.array.slice();
 assert.equal(correctScanNormals(root,'glb'),0);assert.deepEqual(material.normalScale.toArray(),[2,-2]);
 root.userData.imersity={method:'usdz-import',exportScaleFactor:1};assert.equal(correctScanNormals(root,'glb'),1);assert.deepEqual(material.normalScale.toArray(),[1,-1]);assert.deepEqual(geometry.attributes.position.array,positions);
 assert.equal(correctScanNormals(root,'glb'),0);
});
test('color plus shape retains photograph without normal, AO or specular shading',()=>{
 const original=new MeshPhysicalMaterial({map:new Texture(),normalMap:new Texture(),roughnessMap:new Texture(),aoMap:new Texture()});
 const material=inspectionMaterial(original,'diffuse');assert.equal(material.isMeshLambertMaterial,true);assert.equal(material.map,original.map);assert.equal(material.normalMap,null);assert.equal(material.aoMap,null);assert.equal(material.roughnessMap,undefined);
});

test('hair coverage survives appearance inspection and original export material stays intact',()=>{
 const map=new Texture(),source=new MeshPhysicalMaterial({map,alphaTest:.18,alphaToCoverage:true,transparent:false,depthWrite:true});
 for(const mode of ['albedo','diffuse']){const m=inspectionMaterial(source,mode);assert.equal(m.map,map);assert.equal(m.alphaTest,.18);assert.equal(m.alphaToCoverage,true);assert.equal(m.transparent,false);assert.equal(m.depthWrite,true);}
 assert.equal(inspectionMaterial(source,'texture'),source);assert.equal(source.alphaTest,.18);
 assert.equal(inspectionMaterial(source,'clay').alphaTest,0);
});
