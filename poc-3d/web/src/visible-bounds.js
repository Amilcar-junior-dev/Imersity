import {Box3} from 'three';
// Experimental hair variants are retained for comparison but must not enlarge
// the camera's framing when hidden, including children of hidden groups.
export function visibleMeshBounds(root){
 const box=new Box3();root.updateWorldMatrix(true,true);
 root.traverseVisible(node=>{if(!node.isMesh||!node.geometry)return;node.geometry.computeBoundingBox();box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));});
 return box;
}
