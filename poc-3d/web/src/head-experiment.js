const DIAGNOSTIC=0xe99839;
export function configureHeadExperiment(root){
 let owner;root.traverse(n=>{if(n.userData?.imersity?.headPreparation)owner??=n;});
 if(!owner)return null;
 const data=owner.userData.imersity.headPreparation;
 if(data.schema!=='imersity.head-preparation.v1')return null;
 const experiment={owner,data,hair:new Map(),scalp:[],observed:[]};
 root.traverse(n=>{
  const info=n.userData?.imersity;
  if(info?.role==='reference-hair'&&typeof info.style==='string'){
   if(!n.quaternion.toArray().every(Number.isFinite))n.quaternion.identity();
   const materials=[];n.traverse(child=>{if(child.isMesh&&child.userData?.imersity?.role!=='reference-head')materials.push(...(Array.isArray(child.material)?child.material:[child.material]));});
   if(info.partialPatchOnly)for(const material of materials)material.alphaToCoverage=material.alphaTest>0;
   experiment.hair.set(info.style,{node:n,materials,position:Array.isArray(info.basePosition)&&info.basePosition.length===3&&info.basePosition.every(Number.isFinite)?n.position.clone().fromArray(info.basePosition):n.position.clone()});
  }
  if(!n.isMesh)return;
  if(info?.role==='estimated-scalp')experiment.scalp.push({node:n,materials:Array.isArray(n.material)?n.material:[n.material]});
  if(info?.role==='observed-face')experiment.observed.push(n);
 });
 selectReferenceStyle(experiment,data.activeStyle??'none');
 colorReferenceHair(experiment,'#'+(data.hairColor??'493123'));
 colorEstimatedScalp(experiment,data.scalpDiagnostic!==false);
 fitReferenceHair(experiment,data.fitPercent??100,data.heightPercent??0);
 return experiment;
}
export function selectReferenceStyle(experiment,style){
 if(style!=='none'&&!experiment.hair.has(style))throw new Error('Penteado de referência indisponível.');
 for(const [key,{node}] of experiment.hair)node.visible=key===style;
 const control=experiment.hair.get(style)?.node.userData?.imersity?.controlReference===true;
 for(const node of experiment.observed)node.visible=!control;
 for(const {node} of experiment.scalp)node.visible=!control;
 experiment.data.activeStyle=style;
}
export function colorReferenceHair(experiment,hex){
 if(!/^#[0-9a-f]{6}$/i.test(hex))throw new Error('Cor inválida.');
 const changed=new Set();
 for(const {node,materials} of experiment.hair.values()){
  const baseline=node.userData?.imersity?.tintReferenceColor;
  for(const material of materials){if(changed.has(material))continue;changed.add(material);
   if(/^[0-9a-f]{6}$/i.test(baseline??'')){
    const reference=material.color.clone().set('#'+baseline),target=material.color.clone().set(hex);
    material.color.setRGB(...['r','g','b'].map(k=>Math.min(4,target[k]/Math.max(reference[k],.005))));
   }else material.color.set(hex);
  }
 }
 experiment.data.hairColor=hex.slice(1).toLowerCase();
}
export function colorEstimatedScalp(experiment,diagnostic){
 const hex=/^[0-9a-f]{6}$/i.test(experiment.data.skinColor)?experiment.data.skinColor:'d3a282';
 for(const {materials} of experiment.scalp)for(const m of materials)m.color.setHex(diagnostic?DIAGNOSTIC:parseInt(hex,16));
 experiment.data.scalpDiagnostic=!!diagnostic;
}
export function fitReferenceHair(experiment,scale,height){
 if(!Number.isFinite(scale)||scale<85||scale>115||!Number.isFinite(height)||height< -10||height>10)throw new Error('Ajuste fora dos limites do experimento.');
 for(const {node,position} of experiment.hair.values()){const bound=node.userData?.imersity?.surfaceBound===true;node.scale.setScalar(bound?1:scale/100);node.position.copy(position);if(!bound)node.position.y+=(experiment.data.nativeHeadHeight??.575)*height/100;}
 experiment.data.fitPercent=scale;experiment.data.heightPercent=height;
}
