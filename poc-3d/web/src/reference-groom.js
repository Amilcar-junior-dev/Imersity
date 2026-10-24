import * as THREE from 'three';
import {createHairMaterials} from './vendor/hair-shader.js';

// The imported curves stay static. Only each thin ribbon's width axis turns
// toward the camera. This avoids cards disappearing when viewed edge-on.
export function cameraFacingFibre(material,{rootFadeEnd=0}={}){
 const fade=Number.isFinite(rootFadeEnd)?THREE.MathUtils.clamp(rootFadeEnd,0,.5):0;
 const previous=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material);
 material.customProgramCacheKey=()=>cache()+'|imersity-reference-fibre-v1';
 material.onBeforeCompile=shader=>{
  previous.call(material,shader);
  shader.uniforms.uFibreRootFade={value:fade};
  shader.vertexShader='attribute vec3 _center; attribute vec3 _hairtangent; attribute float _width; attribute float _edge; varying float vFibreEdge; varying float vFibreRoot;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   vec3 fibreCentreView=(modelViewMatrix*vec4(_center,1.0)).xyz;
   vec3 fibreTangentView=normalize(mat3(modelViewMatrix)*_hairtangent);
   vec3 fibreCross=cross(fibreTangentView,normalize(-fibreCentreView));
   if(length(fibreCross)<0.0001) fibreCross=cross(fibreTangentView,vec3(0.0,1.0,0.0));
   vec3 fibreSideLocal=normalize((vec4(normalize(fibreCross),0.0)*modelViewMatrix).xyz);
   objectNormal=normalize(cross(fibreSideLocal,_hairtangent));
   vFibreEdge=_edge;
   vFibreRoot=uv.x;
  `).replace('#include <begin_vertex>','vec3 transformed=_center+fibreSideLocal*_width;');
  shader.fragmentShader='varying float vFibreEdge; varying float vFibreRoot; uniform float uFibreRootFade;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
   float fibreCoverage=1.0-smoothstep(0.55,1.0,abs(vFibreEdge));
   diffuseColor.a*=fibreCoverage;
   diffuseColor.a*=smoothstep(0.0,max(0.0001,uFibreRootFade),vFibreRoot);
   #include <alphatest_fragment>
  `);
 };
 material.userData.referenceGroomMaterial=true;
 return material;
}

export async function installReferenceGroom(root,parser,renderer){
 const meshes=[];root.traverse(n=>{if(n.isMesh&&n.userData?.imersity?.role==='reference-head')n.material.userData.referenceControlHeadMaterial=true;if(n.isMesh&&n.userData?.imersity?.referenceGroom===true)meshes.push(n);});
 if(!meshes.length)return;
 const dataTextures=new Map();
 for(const mesh of meshes){
  const index=mesh.userData.imersity.dataTexture;
  if(!Number.isInteger(index)||index<0)throw new Error('Mapa de dados do cabelo ausente.');
  for(const name of ['_center','_hairtangent','_width','_edge'])if(!mesh.geometry.getAttribute(name))throw new Error('Atributo de fio ausente: '+name);
  if(!dataTextures.has(index)){
   const atlas=(await parser.getDependency('texture',index)).clone();
   atlas.colorSpace=THREE.NoColorSpace;atlas.needsUpdate=true;dataTextures.set(index,atlas);
  }
  const source=mesh.material;
  const {outer,inner,blend}=createHairMaterials(THREE,source,{renderer,atlas:dataTextures.get(index),color:'#2b1c14',rootDarkening:.65,seedVariation:.22,roughness:.5,roughnessFloor:.45,density:1.0,blendOpacity:.15});
  // UV U follows the imported fibre. Anisotropy therefore follows U as well.
  outer.anisotropy=.65;outer.anisotropyRotation=0;
  const fadeOptions={rootFadeEnd:mesh.userData.imersity.rootFadeEnd??0};
  mesh.material=cameraFacingFibre(outer,fadeOptions);source.dispose();
  // MSAA gets one coverage pass. On non-MSAA devices the vendor shader supplies
  // a clipped core plus blended exterior. Both share the same centreline data.
  if(inner){const core=new THREE.Mesh(mesh.geometry,cameraFacingFibre(inner,fadeOptions));core.name=mesh.name+'__core';core.userData={imersity:{role:'imported-hair-core'}};mesh.parent.add(core);}
  blend?.dispose();
 }
}
