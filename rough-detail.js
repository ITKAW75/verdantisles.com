import {cabinPoint,CABIN_LENGTH} from './cabin-layout.js';
import {ground,surface,greenRadius} from './physics.js';
import {sanctuaryWorld} from './courses.js';
import {keepPointAlong,KEEP_LENGTH} from './fortress-layout.js';
import {highPoint,HIGH_LENGTH} from './highland-layout.js';
// Reuse scanned groundcover, merge nearby tufts by cell, and keep local culling.
export function buildRoughDetail(renderer,place,items,colliders){
 const {B,scene}=renderer,cells=new Map(),added=new Set(),report={tufts:0,cells:0};let seed=27027;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let hole=1;hole<=4;hole++)for(let n=0;n<(hole===1?75:110);n++){
  let center;if(hole===1)center=sanctuaryWorld((random()>.5?1:-1)*(17+random()*10),42-random()*104);
  else{const p=hole===2?keepPointAlong(random()*KEEP_LENGTH):hole===3?highPoint(random()*HIGH_LENGTH):cabinPoint(random()*(CABIN_LENGTH-64)),off=(random()>.5?1:-1)*(23+random()*10);center={x:p.x+p.nx*off,z:p.z+p.nz*off};}
  for(let j=0;j<5;j++){
   const x=center.x+(random()-.5)*7,z=center.z+(random()-.5)*7;
   if(surface(x,z)!=='rough'||ground(x,z)<.2||greenRadius(x,z)<1.4||colliders.some(c=>!c.walkThrough&&Math.hypot(c.x-x,c.z-z)<c.r+.65))continue;
   if([[.6,0],[-.6,0],[0,.6],[0,-.6]].some(([dx,dz])=>surface(x+dx,z+dz)!=='rough'))continue;
   const id=j===0?'grass_bermuda_01':'grass_medium_01',root=place(id,x,ground(x,z)-.035,z,id==='grass_medium_01'?.38+random()*.2:.23+random()*.13,random()*6.28,false);
   added.add(root);const key=hole+':'+Math.floor(x/14)+':'+Math.floor(z/14);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(root);report.tufts++;
  }
 }
 for(let i=items.length-1;i>=0;i--)if(added.has(items[i].root))items.splice(i,1);
 for(const [key,roots]of cells){const parts=roots.flatMap(r=>r.getChildMeshes()).filter(m=>m.getTotalVertices());for(const m of parts)m.computeWorldMatrix(true);const merged=B.Mesh.MergeMeshes(parts,true,true,undefined,false,true);if(!merged)continue;
  const root=new B.TransformNode('rough-grass-cell-'+key,scene);merged.parent=root;merged.isPickable=false;merged.receiveShadows=true;
  const x=roots.reduce((s,r)=>s+r.position.x,0)/roots.length,z=roots.reduce((s,r)=>s+r.position.z,0)/roots.length;
  for(const r of roots)r.dispose();items.push({id:'rough_grass_cell',x,z,root});report.cells++;
 }
 return report;
}
