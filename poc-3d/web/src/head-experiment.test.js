import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshStandardMaterial} from 'three';
import {configureHeadExperiment,selectReferenceStyle,colorReferenceHair,colorEstimatedScalp,fitReferenceHair} from './head-experiment.js';
function fixture(){const root=new Group();root.userData.imersity={headPreparation:{schema:'imersity.head-preparation.v1',activeStyle:'none',scalpDiagnostic:true,skinColor:'d3a282',nativeHeadHeight:.575}};
 const add=(role,style)=>{const n=new Mesh(new BoxGeometry(),new MeshStandardMaterial({color:0xffffff}));n.userData.imersity={role,style};root.add(n);return n;};
 const face=add('observed-face'),scalp=add('estimated-scalp'),short=add('reference-hair','short'),bob=add('reference-hair','bob');short.position.y=.9;bob.position.y=.9;return {root,face,scalp,short,bob};}
test('reference styles replace one another without modifying captured facial geometry or material',()=>{
 const {root,face,short,bob}=fixture(),positions=face.geometry.attributes.position.array.slice(),color=face.material.color.clone(),experiment=configureHeadExperiment(root);
 assert.equal(short.visible,false);assert.equal(bob.visible,false);
 selectReferenceStyle(experiment,'short');assert.equal(short.visible,true);assert.equal(bob.visible,false);
 selectReferenceStyle(experiment,'bob');assert.equal(short.visible,false);assert.equal(bob.visible,true);
 colorReferenceHair(experiment,'#aa3300');fitReferenceHair(experiment,105,3);colorEstimatedScalp(experiment,false);
 assert.deepEqual(face.geometry.attributes.position.array,positions);assert.equal(face.material.color.equals(color),true);assert.deepEqual(face.scale.toArray(),[1,1,1]);assert.deepEqual(face.position.toArray(),[0,0,0]);
 assert.equal(experiment.data.activeStyle,'bob');assert.equal(bob.scale.x,1.05);assert.equal(bob.position.y,.9+.575*.03);
 selectReferenceStyle(experiment,'none');assert.equal(bob.visible,false);
});
test('fit changes are absolute and invalid selections do not alter the experiment',()=>{
 const {root,short}=fixture(),experiment=configureHeadExperiment(root);fitReferenceHair(experiment,110,2);fitReferenceHair(experiment,110,2);assert.equal(short.position.y,.9+.575*.02);
 assert.throws(()=>selectReferenceStyle(experiment,'unknown'));assert.throws(()=>fitReferenceHair(experiment,200,0));assert.throws(()=>colorReferenceHair(experiment,'red'));assert.equal(experiment.data.activeStyle,'none');
 assert.equal(configureHeadExperiment(new Group()),null);
});
test('exported fit baselines prevent repeated height offsets and recoloring survives inspection materials',()=>{
 const {root,short}=fixture();short.userData.imersity.basePosition=[0,.9,0];short.position.y=.91;short.scale.setScalar(0);root.userData.imersity.headPreparation.heightPercent=2;
 const experiment=configureHeadExperiment(root),original=short.material;short.material=original.clone();colorReferenceHair(experiment,'#123456');
 assert.equal(original.color.getHex(),0x123456);assert.equal(short.position.y,.9+.575*.02);assert.equal(short.scale.x,1);
});
test('legacy zero matrices cannot leave reference hair with a non-finite rotation',()=>{
 const {root,short}=fixture();short.quaternion.set(NaN,NaN,NaN,NaN);const experiment=configureHeadExperiment(root);selectReferenceStyle(experiment,'short');assert.deepEqual(short.quaternion.toArray(),[0,0,0,1]);assert.equal(short.visible,true);
});

test('a custom textured hairstyle is selectable and retains original texture tint by default',()=>{
 const {root,face}=fixture();const hair=new Mesh(new BoxGeometry(),new MeshStandardMaterial({color:0xffffff}));hair.userData.imersity={role:'reference-hair',style:'fal01',tintReferenceColor:'493123',basePosition:[.035,.9,-.015]};root.add(hair);root.userData.imersity.headPreparation.activeStyle='fal01';
 const faceColor=face.material.color.clone(),e=configureHeadExperiment(root);assert.equal(hair.visible,true);assert.deepEqual(hair.material.color.toArray(),[1,1,1]);
 colorReferenceHair(e,'#885533');const tinted=hair.material.color.clone();colorReferenceHair(e,'#885533');assert.equal(hair.material.color.equals(tinted),true);assert.equal(face.material.color.equals(faceColor),true);
 selectReferenceStyle(e,'none');assert.equal(hair.visible,false);selectReferenceStyle(e,'fal01');assert.equal(hair.visible,true);
});

test('surface-bound root patches stay attached when global hair fitting changes',()=>{
 const {root,face,short}=fixture(),positions=face.geometry.attributes.position.array.slice();
 const patch=new Mesh(new BoxGeometry(),new MeshStandardMaterial({alphaTest:.18}));patch.userData.imersity={role:'reference-hair',style:'rootfibers',partialPatchOnly:true,surfaceBound:true,basePosition:[0,0,0]};patch.scale.setScalar(0);root.add(patch);
 const e=configureHeadExperiment(root);selectReferenceStyle(e,'rootfibers');fitReferenceHair(e,115,10);
 assert.equal(patch.visible,true);assert.equal(short.visible,false);assert.deepEqual(patch.scale.toArray(),[1,1,1]);assert.deepEqual(patch.position.toArray(),[0,0,0]);assert.equal(patch.material.alphaToCoverage,true);
 assert.deepEqual(face.geometry.attributes.position.array,positions);
});

test('modular styles switch complete groups, recolor components and preserve bound roots',()=>{
 const {root,face}=fixture(),original=face.geometry.attributes.position.array.slice(),groups=[];
 for(const style of ['lock_short','lock_medium','lock_long']){
  const group=new Group();group.userData.imersity={role:'reference-hair',style,partialPatchOnly:true,surfaceBound:true,basePosition:[0,0,0],tintReferenceColor:'493123'};
  for(let i=0;i<3;i++)group.add(new Mesh(new BoxGeometry(),new MeshStandardMaterial({alphaTest:.18})));
  group.scale.setScalar(0);root.add(group);groups.push(group);
 }
 root.userData.imersity.headPreparation.activeStyle='lock_medium';const e=configureHeadExperiment(root);
 assert.equal(e.hair.get('lock_medium').materials.length,3);assert.equal(groups[1].visible,true);
 selectReferenceStyle(e,'lock_long');fitReferenceHair(e,110,5);colorReferenceHair(e,'#885533');
 const visible=[];root.traverseVisible(n=>{if(n.isMesh)visible.push(n);});
 assert.equal(visible.length,5);assert.equal(groups[0].visible,false);assert.equal(groups[1].visible,false);
 for(const g of groups){assert.deepEqual(g.scale.toArray(),[1,1,1]);assert.deepEqual(g.position.toArray(),[0,0,0]);for(const m of g.children){assert.equal(m.material.alphaToCoverage,true);assert.notEqual(m.material.color.r,1);}}
 assert.deepEqual(face.geometry.attributes.position.array,original);
});

test('reference head replaces the captured head for comparison and is not recolored as hair',()=>{
 const {root,face,scalp}=fixture(),reference=new Group();reference.userData.imersity={role:'reference-hair',style:'reference_original',controlReference:true,surfaceBound:true};
 const control=new Mesh(new BoxGeometry(),new MeshStandardMaterial({color:0x889988}));control.userData.imersity={role:'reference-head'};reference.add(control);
 const fibres=new Mesh(new BoxGeometry(),new MeshStandardMaterial());reference.add(fibres);root.add(reference);
 const originalColor=control.material.color.clone(),e=configureHeadExperiment(root);
 selectReferenceStyle(e,'reference_original');assert.equal(face.visible,false);assert.equal(scalp.visible,false);assert.equal(reference.visible,true);
 colorReferenceHair(e,'#aabbcc');assert.equal(control.material.color.equals(originalColor),true);assert.equal(fibres.material.color.getHex(),0xaabbcc);
 selectReferenceStyle(e,'none');assert.equal(reference.visible,false);assert.equal(face.visible,true);assert.equal(scalp.visible,true);
});
