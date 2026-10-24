import {MeshBasicMaterial,MeshLambertMaterial,MeshStandardMaterial,DoubleSide} from 'three';

// Temporary display materials share textures; original scan materials stay intact.
export function inspectionMaterial(original,mode){
 if(mode==='texture')return original;
 // The face can be inspected unlit while fibres retain their dedicated shader.
 // A generic albedo material cannot interpret the linear coverage data atlas.
 if((original?.userData?.referenceGroomMaterial||original?.userData?.referenceControlHeadMaterial)&&['albedo','diffuse'].includes(mode))return original;
 const coverage={alphaMap:original?.alphaMap??null,alphaTest:original?.alphaTest??0,alphaToCoverage:original?.alphaToCoverage??false,alphaHash:original?.alphaHash??false,depthWrite:original?.depthWrite??true};
 if(mode==='diffuse')return new MeshLambertMaterial({map:original?.map??null,color:original?.color??0xffffff,side:original?.side??DoubleSide,vertexColors:original?.vertexColors??false,transparent:original?.transparent??false,opacity:original?.opacity??1,...coverage});
 if(mode==='albedo')return new MeshBasicMaterial({map:original?.map??null,color:original?.color??0xffffff,side:original?.side??DoubleSide,vertexColors:original?.vertexColors??false,transparent:original?.transparent??false,opacity:original?.opacity??1,...coverage,toneMapped:false});
 return new MeshStandardMaterial({color:mode==='wire'?0x99c3ae:0xbbc2ba,roughness:.7,metalness:0,wireframe:mode==='wire',side:DoubleSide});
}
export const LIGHTING_PRESETS={neutral:{hemisphere:.8,directional:[1.1,.25,.3]},previous:{hemisphere:2.2,directional:[3,1.3,2]}};

// USD's scale=2/bias=-1 decodes [0,1] normals to [-1,1]. Three's shader
// already performs that decode; treating scale=2 as normal strength doubles it.
export function correctUSDNormalDecoding(material){
 const texture=material?.normalMap,scale=texture?.userData?.scale,bias=texture?.userData?.bias;
 if(!Array.isArray(scale)||!Array.isArray(bias)||scale.length<3||bias.length<3||!scale.slice(0,3).every(v=>v===2)||!bias.slice(0,3).every(v=>v===-1))return false;
 if(material.normalScale?.x!==2||material.normalScale?.y!==2)return false;
 material.normalScale.set(1,1);return true;
}
export function correctScanNormals(root,source){
 let legacy=false,alreadyCorrected=false;
 root.traverse(n=>{const info=n.userData?.imersity;if(info?.normalDecodeVersion>=1)alreadyCorrected=true;if(info?.method==='usdz-import'&&Number.isFinite(info.exportScaleFactor))legacy=true;});
 if(source==='glb'&&(!legacy||alreadyCorrected))return 0;
 const seen=new Set();let corrected=0;
 root.traverse(n=>{if(!n.isMesh)return;for(const material of Array.isArray(n.material)?n.material:[n.material]){
  if(seen.has(material))continue;seen.add(material);
  if(source==='usdz'){if(correctUSDNormalDecoding(material))corrected++;}
  else if(material.normalMap&&Math.abs(material.normalScale.x)===2&&Math.abs(material.normalScale.y)===2){material.normalScale.multiplyScalar(.5);corrected++;}
 }});
 root.userData.imersity={...root.userData.imersity,normalDecodeVersion:1};return corrected;
}
