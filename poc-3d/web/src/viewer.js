import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {ARButton} from 'three/addons/webxr/ARButton.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {inspectionMaterial,LIGHTING_PRESETS,correctScanNormals} from './inspection.js';
import {summarizeFrames} from './core.js';
import {visibleMeshBounds} from './visible-bounds.js';
import {configureHeadExperiment,selectReferenceStyle,colorReferenceHair,colorEstimatedScalp,fitReferenceHair} from './head-experiment.js';
import {installReferenceGroom} from './reference-groom.js';

export class AvatarViewer {
 constructor(container,onStats){
  this.container=container;this.onStats=onStats;this.mode='texture';this.frames=[];this.model=null;this.splat=null;this.originalMaterials=new Map();this.wireMaterials=[];this.hairNodes=[];this.lights=[];
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(34,1,.001,100);this.camera.position.set(0,0,.55);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x191c1c,1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.xr.enabled=true;container.append(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.minDistance=.04;this.controls.maxDistance=20;
  this.root=new THREE.Group();this.scene.add(this.root);
  const hemisphere=new THREE.HemisphereLight(0xf4f1e7,0x4c5f5e,2.2);this.scene.add(hemisphere);this.hemisphere=hemisphere;
  for(const [x,y,z,power] of [[1,1,2,3],[-2,.3,1,1.3],[0,1,-2,2]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(x,y,z);this.scene.add(light);this.lights.push(light);}
  this.lightingPreset('neutral');
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
  this.renderer.xr.addEventListener('sessionstart',()=>{this.scene.background=null;this.renderer.setClearAlpha(0);this.root.position.set(0,1.3,-.7);this.root.rotation.set(0,0,0);});
  this.renderer.xr.addEventListener('sessionend',()=>{this.renderer.setClearAlpha(1);this.root.position.set(0,0,0);this.fit();});
  let previous=performance.now(),lastReport=0;
  this.renderer.setAnimationLoop((now)=>{const delta=now-previous;previous=now;if(!document.hidden&&container.clientHeight>0){this.frames.push(delta);if(this.frames.length>300)this.frames.shift();this.controls.update();if(this.rotating&&!this.renderer.xr.isPresenting)this.root.rotation.y+=.003;this.renderer.render(this.scene,this.camera);if(now-lastReport>700){lastReport=now;onStats?.({...summarizeFrames(this.frames),triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures});}}});
 }
 resize(){const {width,height}=this.container.getBoundingClientRect();if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);}
 clear(){
  if(this.model){const disposed=new Set();this.model.traverse(n=>{if(n.isMesh){n.geometry?.dispose();const original=this.originalMaterials.get(n)??n.material;for(const m of (Array.isArray(original)?original:[original])){if(!m||disposed.has(m))continue;for(const value of Object.values(m)){if(value?.isTexture&&!disposed.has(value)){value.dispose();disposed.add(value);}}m.dispose();disposed.add(m);}}});this.root.remove(this.model);}
  this.splat?.dispose();if(this.splat)this.root.remove(this.splat);this.splat=null;this.model=null;this.originalMaterials.clear();this.headExperiment=null;this.scene.environment=null;this.hairNodes=[];this.wireMaterials.forEach(m=>m.dispose());this.wireMaterials=[];this.root.rotation.set(0,0,0);this.root.scale.setScalar(1);this.frames=[];this.rotating=false;
 }
 async reference(){
  const obj=await fetch('/models/canonical_face_model.obj').then(r=>{if(!r.ok)throw new Error('Referência não encontrada.');return r.text();});
  const points=obj.split('\n').filter(l=>l.startsWith('v ')).map(l=>l.split(/\s+/).slice(1).map(Number));const indices=await fetch('/models/topology.json').then(r=>r.json());
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(p=>p.map(v=>v*.01)),3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.center();
  this.setMesh(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xb2bdb4,roughness:.72,side:THREE.DoubleSide})));this.mode='clay';this.materialMode('clay');return {vertices:points.length,triangles:indices.length/3};
 }
 async face(data,image){
  const indices=await fetch('/models/topology.json').then(r=>r.json());const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geo.setAttribute('uv',new THREE.BufferAttribute(data.uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false}));mesh.name='ApproximateFace';mesh.userData.imersity={method:data.method,coverage:'face-only',ipdMM:data.ipdMM,scaleSource:data.scaleSource,notMetricScan:true};this.setMesh(mesh);this.mode='texture';this.materialMode('texture');return {vertices:468,triangles:indices.length/3};
 }
 setMesh(mesh){this.clear();this.model=mesh;this.headExperiment=configureHeadExperiment(mesh);if(this.headExperiment?.data.referenceGroomTrial){if(!this.hairEnvironment){const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.hairEnvironment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();}this.scene.environment=this.hairEnvironment.texture;this.scene.environmentIntensity=.6;}const box=this.headExperiment?visibleMeshBounds(mesh):new THREE.Box3().setFromObject(mesh);if(!box.isEmpty())mesh.position.sub(box.getCenter(new THREE.Vector3()));this.root.add(mesh);mesh.traverse(n=>{if(n.isMesh){this.originalMaterials.set(n,n.material);if(/hair|cabelo|beard|barba/i.test(n.name))this.hairNodes.push(n);}});this.fit();}
 async importAsset(file){
  const bytes=await file.arrayBuffer();
  if(file.name.toLowerCase().endsWith('.usdz')){
   const {USDLoader}=await import('three/addons/loaders/USDLoader.js');
   const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw new Error('Use um USDZ com texturas incorporadas.');return url;});
   const mesh=await new Promise((resolve,reject)=>new USDLoader(manager).parse(bytes,'',resolve,reject));
   const normalCorrections=correctScanNormals(mesh,'usdz');
   const bounds=new THREE.Box3().setFromObject(mesh);if(bounds.isEmpty())throw new Error('O USDZ não contém uma malha visível.');
   const dimension=Math.max(...bounds.getSize(new THREE.Vector3()).toArray());if(!Number.isFinite(dimension)||dimension<=0)throw new Error('Dimensões inválidas no USDZ.');
   mesh.scale.multiplyScalar(.25/dimension);mesh.userData.imersity={...mesh.userData.imersity,method:'usdz-import',scaleSource:'normalized-unverified',metricValidated:false};
   this.setMesh(mesh);this.materialMode('texture');let vertices=0,triangles=0;this.model.traverse(n=>{if(n.isMesh){vertices+=n.geometry.attributes.position?.count??0;triangles+=(n.geometry.index?.count??n.geometry.attributes.position?.count??0)/3;}});
   return {kind:'mesh',source:'usdz',normalCorrections,vertices,triangles,hair:this.hairNodes.length,scaleSource:'normalized-unverified'};
  }
  if(file.name.toLowerCase().endsWith('.glb')){
   const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('data:')&&!url.startsWith('blob:'))throw new Error('Use um GLB autocontido, com texturas embutidas.');return url;});
   const gltf=await new GLTFLoader(manager).parseAsync(bytes,'');await installReferenceGroom(gltf.scene,gltf.parser,this.renderer);const normalCorrections=correctScanNormals(gltf.scene,'glb');this.setMesh(gltf.scene);this.materialMode('texture');let triangles=0,vertices=0;this.model.traverse(n=>{if(n.isMesh){vertices+=n.geometry.attributes.position?.count??0;triangles+=(n.geometry.index?.count??n.geometry.attributes.position?.count??0)/3;}});return {kind:'mesh',normalCorrections,vertices,triangles,hair:this.hairNodes.length,headExperiment:!!this.headExperiment,...(this.headExperiment?this.meshStatistics():{})};
  }
  if(file.name.toLowerCase().endsWith('.ply')&&new TextDecoder().decode(bytes.slice(0,150)).includes('format ascii'))throw new Error('Use um PLY binário de Gaussianas (como a exportação Splatfacto), SPZ ou SPLAT.');
  const {SplatMesh,SparkRenderer}=await import('@sparkjsdev/spark');
  this.spark??=new SparkRenderer({renderer:this.renderer,maxStdDev:Math.sqrt(5)});if(!this.spark.parent)this.scene.add(this.spark);
  const splat=new SplatMesh({fileBytes:bytes,fileName:file.name});try{await splat.initialized;}catch(error){splat.dispose();throw error;}
  this.clear();this.splat=splat;this.root.add(splat);const box=splat.getBoundingBox();if(box.isEmpty()){this.clear();throw new Error('O arquivo não contém Gaussianas visíveis.');}
  const size=box.getSize(new THREE.Vector3());const height=Math.max(size.x,size.y,size.z);if(!Number.isFinite(height)||height<=0){this.clear();throw new Error('Dimensões inválidas.');}
  splat.scale.setScalar(.25/height);const center=box.getCenter(new THREE.Vector3()).multiplyScalar(splat.scale.x);splat.position.sub(center);this.fit();return {kind:'splat',splats:splat.numSplats,scaleSource:'normalized-unverified'};
 }
 fit(){
  const box=this.splat?this.splat.getBoundingBox().applyMatrix4((this.splat.updateMatrixWorld(true),this.splat.matrixWorld)):(this.headExperiment?visibleMeshBounds(this.root):new THREE.Box3().setFromObject(this.root));if(box.isEmpty())return;
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());this.center=center;this.radius=Math.max(size.x,size.y,size.z,.1);this.controls.target.copy(center);this.camera.near=Math.max(this.radius/1000,.0001);this.camera.far=Math.max(this.radius*100,100);const vertical=THREE.MathUtils.degToRad(this.camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*this.camera.aspect);this.viewDistance=Math.max(size.length()/2,.01)/Math.sin(Math.min(vertical,horizontal)/2)*1.1;this.controls.minDistance=this.radius/100;this.controls.maxDistance=Math.max(this.radius*30,20);this.camera.position.copy(center).add(new THREE.Vector3(0,0,this.viewDistance));this.camera.updateProjectionMatrix();this.controls.update();
 }
 view(angle){this.root.rotation.set(0,0,0);const center=this.center??new THREE.Vector3(),distance=this.viewDistance??.56;this.camera.position.copy(center).add(new THREE.Vector3(Math.sin(angle)*distance,0,Math.cos(angle)*distance));this.controls.target.copy(center);this.controls.update();}
 focusHairline(section=false){
  const experiment=this.headExperiment,trial=section==='reference'?experiment?.data.referenceGroomTrial:section==='photo'?experiment?.data.photoGroomTrial:section==='side'?experiment?.data.sideVolumeTrial:section?experiment?.data.hairSectionTrial:experiment?.data.hairlineTrial;if(!trial)return;
  if(!Array.isArray(trial.focusPoint)||trial.focusPoint.length!==3||!trial.focusPoint.every(Number.isFinite))return;
  this.rotating=false;this.root.rotation.set(0,0,0);this.root.updateMatrixWorld(true);
  const target=experiment.owner.localToWorld(new THREE.Vector3().fromArray(trial.focusPoint));
  const scale=experiment.owner.getWorldScale(new THREE.Vector3()).length()/Math.sqrt(3);
  const vertical=THREE.MathUtils.degToRad(this.camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*this.camera.aspect);
  const radius=Number.isFinite(trial.focusRadiusNative)?THREE.MathUtils.clamp(trial.focusRadiusNative,.02,.3):.095;
  const angle=Number.isFinite(trial.focusAngle)?trial.focusAngle:-.55;
  const distance=radius*scale/Math.sin(Math.min(vertical,horizontal)/2);
  this.controls.target.copy(target);this.camera.position.copy(target).add(new THREE.Vector3(Math.sin(angle)*distance,.06*distance,Math.cos(angle)*distance));this.controls.update();
 }
 materialMode(mode){
  this.mode=mode;this.wireMaterials.forEach(m=>m.dispose());this.wireMaterials=[];
  this.model?.traverse(n=>{if(!n.isMesh)return;const original=this.originalMaterials.get(n);const convert=m=>{const result=inspectionMaterial(m,mode);if(result!==m)this.wireMaterials.push(result);return result;};n.material=Array.isArray(original)?original.map(convert):convert(original);});
 }
 lightingPreset(name,strength=this.lightStrength??1){
  const profile=LIGHTING_PRESETS[name]??LIGHTING_PRESETS.neutral;this.lightingProfile=name in LIGHTING_PRESETS?name:'neutral';this.lightStrength=strength;
  this.hemisphere.intensity=profile.hemisphere*strength;this.lights.forEach((light,i)=>light.intensity=profile.directional[i]*strength);
 }
 light(value){this.lights[0].position.set(Math.sin(value)*2,1.2,Math.cos(value)*2);}
 meshStatistics(){let vertices=0,triangles=0;this.model?.traverseVisible(n=>{if(n.isMesh){vertices+=n.geometry.attributes.position?.count??0;triangles+=(n.geometry.index?.count??n.geometry.attributes.position?.count??0)/3;}});return {vertices,triangles};}
 headSettings(){if(!this.headExperiment)return null;const d=this.headExperiment.data;return Object.fromEntries(['activeStyle','hairColor','scalpDiagnostic','fitPercent','heightPercent'].map(k=>[k,d[k]]));}
 applyHeadSettings(settings){if(!this.headExperiment)return;const e=this.headExperiment;selectReferenceStyle(e,settings.activeStyle??'none');colorReferenceHair(e,'#'+(settings.hairColor??'493123'));colorEstimatedScalp(e,settings.scalpDiagnostic!==false);fitReferenceHair(e,settings.fitPercent??100,settings.heightPercent??0);this.materialMode(this.mode);}
 toggleHair(visible){this.hairNodes.forEach(n=>n.visible=visible);}
 scaleModel(factor){this.root.scale.setScalar(factor);this.fit();}
 async exportGLB(){if(!this.model)throw new Error('Um splat deve ser exportado no formato original.');const mode=this.mode;this.materialMode('texture');try{const copy=this.model.clone(true);copy.scale.multiply(this.root.scale);copy.position.multiply(this.root.scale);copy.userData={...copy.userData,imersity:{...copy.userData.imersity,exportScaleFactor:this.root.scale.x,metricValidated:false}};if(this.headExperiment)copy.traverse(n=>{if(n.userData?.imersity?.role==='reference-hair'&&!n.visible)n.scale.setScalar(0);});return await new GLTFExporter().parseAsync(copy,{binary:true,onlyVisible:!this.headExperiment,trs:!!this.headExperiment});}finally{this.materialMode(mode);}}
 screenshot(){this.renderer.render(this.scene,this.camera);return new Promise(resolve=>this.renderer.domElement.toBlob(resolve,'image/png'));}
 async xrButton(){if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-ar'))return null;const button=ARButton.createButton(this.renderer,{requiredFeatures:['local-floor'],optionalFeatures:['hand-tracking']});button.textContent='Entrar em realidade mista';return button;}
}
