import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHairMaterials} from './vendor/hair-shader.js';
import {cameraFacingFibre} from './reference-groom.js';
import {inspectionMaterial} from './inspection.js';

test('fibre adaptation retains vendor alpha and shading patches and applies edge coverage before alpha test',()=>{
 const {outer}=createHairMaterials(THREE,new THREE.MeshStandardMaterial(),{atlas:new THREE.Texture(),alphaToCoverage:true});
 const mat=cameraFacingFibre(outer),shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 mat.onBeforeCompile(shader);
 assert.ok(shader.fragmentShader.includes('float hairCoverage'));
 assert.ok(shader.fragmentShader.includes('float fibreCoverage'));
 assert.ok(shader.fragmentShader.indexOf('diffuseColor.a*=fibreCoverage')<shader.fragmentShader.indexOf('#include <alphatest_fragment>'));
 assert.ok(shader.vertexShader.includes('vec3 transformed=_center+fibreSideLocal*_width;'));
 assert.equal(inspectionMaterial(mat,'albedo'),mat);
 assert.equal(inspectionMaterial(mat,'diffuse'),mat);
 assert.notEqual(inspectionMaterial(mat,'wire'),mat);
});
