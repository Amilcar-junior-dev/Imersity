import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
import {visibleMeshBounds} from './visible-bounds.js';
test('camera bounds ignore invisible parent groups containing outlying hair',()=>{
 const root=new Group(),head=new Mesh(new BoxGeometry(2,4,2),new MeshBasicMaterial()),variant=new Group();
 const far=new Mesh(new BoxGeometry(10,10,10),new MeshBasicMaterial());far.position.x=100;variant.add(far);variant.visible=false;root.add(head,variant);
 const box=visibleMeshBounds(root);assert.deepEqual(box.min.toArray(),[-1,-2,-1]);assert.deepEqual(box.max.toArray(),[1,2,1]);
 variant.visible=true;assert.equal(visibleMeshBounds(root).max.x,105);
});
test('camera bounds include world transforms without changing mesh positions',()=>{
 const root=new Group(),mesh=new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial());root.position.set(3,4,5);root.scale.setScalar(2);root.add(mesh);
 const box=visibleMeshBounds(root);assert.deepEqual(box.min.toArray(),[1,2,3]);assert.deepEqual(box.max.toArray(),[5,6,7]);assert.deepEqual(mesh.position.toArray(),[0,0,0]);
});
