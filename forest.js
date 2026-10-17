import {ground} from './physics.js';
import {convexFootprint} from './scenery.js';
export function prepareTrunks(container,B,id){
 if(id!=='pine_tree_01')return;
 for(const m of container.meshes){if(!m.material?.name.includes('trunk'))continue;const source=m.getVerticesData(B.VertexBuffer.PositionKind);if(!source)continue;const p=Float32Array.from(source),n=Float32Array.from(m.getVerticesData(B.VertexBuffer.NormalKind));let lo=Infinity,hi=-Infinity;for(let i=1;i<p.length;i+=3){lo=Math.min(lo,p[i]);hi=Math.max(hi,p[i]);}let cx=0,cz=0,count=0;for(let i=0;i<p.length;i+=3)if(p[i+1]<lo+(hi-lo)*.08){cx+=p[i];cz+=p[i+2];count++;}cx/=count;cz/=count;
  for(let i=0;i<p.length;i+=3){const t=Math.min(1,Math.max(0,(p[i+1]-lo)/(hi-lo)/.7)),scale=1+1.25*(1-t*t*(3-2*t));p[i]=cx+(p[i]-cx)*scale;p[i+2]=cz+(p[i+2]-cz)*scale;n[i]/=scale;n[i+2]/=scale;const l=Math.hypot(n[i],n[i+1],n[i+2]);n[i]/=l;n[i+1]/=l;n[i+2]/=l;}
  m.makeGeometryUnique();m.setVerticesData(B.VertexBuffer.PositionKind,p);m.setVerticesData(B.VertexBuffer.NormalKind,n);m.refreshBoundingInfo();
 }
}
export function seatOnGround(x,z,r=.7,depth=.15){let y=ground(x,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;y=Math.min(y,ground(x+Math.cos(a)*r,z+Math.sin(a)*r));}return y-depth;}
// Seat the intact trunk rim; trim scan debris without stretching branches downward.
export function groundTree(root,B,heightAt=ground){
 const wood=root.getChildMeshes().filter(m=>/trunk|branches|bark/.test(m.material?.name||'')&&!/leaves/.test(m.material?.name||'')),v=new B.Vector3(),points=[];
 for(const m of wood){const p=m.getVerticesData(B.VertexBuffer.PositionKind);if(!p)continue;const w=m.computeWorldMatrix(true);for(let i=0;i<p.length;i+=3){B.Vector3.TransformCoordinatesFromFloatsToRef(p[i],p[i+1],p[i+2],w,v);points.push({x:v.x,y:v.y,z:v.z,r:Math.hypot(v.x-root.position.x,v.z-root.position.z)});}}
 if(!points.length)return;
 const base=heightAt(root.position.x,root.position.z),small=/island_tree_02|tree_small_02/.test(root.name),band=points.filter(p=>p.y>base+(small?.8:2)&&p.y<base+(small?1.5:3.5)).map(p=>p.r).sort((a,b)=>a-b);
 const radius=Math.max(small?.2:.35,Math.min(small?.85:2.7,band[Math.floor(band.length*.5)]||(small?.35:.65))),sectors=Array(24).fill(Infinity);
 for(const p of points){if(p.r>radius*1.18||p.y>base+5)continue;const angle=Math.atan2(p.z-root.position.z,p.x-root.position.x),bin=Math.min(23,Math.floor((angle+Math.PI)/(2*Math.PI)*24));sectors[bin]=Math.min(sectors[bin],p.y-heightAt(p.x,p.z));}
 const gaps=sectors.filter(Number.isFinite).sort((a,b)=>a-b),sink=gaps.length?Math.max(0,Math.min(5,gaps[Math.floor(gaps.length*.90)]+.24)):0;
 root.position.y-=sink;root.computeWorldMatrix(true);
 if(!small)for(const m of wood){const source=m.getVerticesData(B.VertexBuffer.PositionKind),indices=m.getIndices();if(!source||!indices)continue;const w=m.computeWorldMatrix(true),world=[];
  for(let i=0;i<source.length;i+=3){B.Vector3.TransformCoordinatesFromFloatsToRef(source[i],source[i+1],source[i+2],w,v);world.push({r:Math.hypot(v.x-root.position.x,v.z-root.position.z),y:v.y});}
  const kept=[];for(let i=0;i<indices.length;i+=3){const a=world[indices[i]],b=world[indices[i+1]],c=world[indices[i+2]],low=Math.max(a.y,b.y,c.y)<base-.05,apron=Math.max(a.r,b.r,c.r)>radius*1.5;if(low&&apron)continue;kept.push(indices[i],indices[i+1],indices[i+2]);}
  m.makeGeometryUnique();m.setIndices(kept);m.refreshBoundingInfo();
 }
 root.metadata={...root.metadata,trunkRadius:radius,groundingSink:sink};
}
// Fit only the low scan apron to the land. Upper bark and foliage keep their shape.
export function fitForestBase(root,B,heightAt=ground,wholePatch=false){
 const base=heightAt(root.position.x,root.position.z),v=new B.Vector3(),local=new B.Vector3();
 for(const m of root.getChildMeshes()){
  if(!wholePatch&&!/trunk|branches|bark/.test(m.material?.name||'')&&!/stump|island_tree_02|sand_rocks_small_01/.test(root.name))continue;
  if(!wholePatch&&/leaves/.test(m.material?.name||''))continue;
  if(!m.makeGeometryUnique)continue;
  const source=m.getVerticesData(B.VertexBuffer.PositionKind);if(!source)continue;
  const p=Float32Array.from(source),matrix=m.computeWorldMatrix(true).clone(),inverse=matrix.clone().invert(),colors=new Float32Array(p.length/3*4);colors.fill(1);m.makeGeometryUnique();
  for(let i=0;i<p.length;i+=3){B.Vector3.TransformCoordinatesFromFloatsToRef(p[i],p[i+1],p[i+2],matrix,v);const above=v.y-root.position.y,t=Math.max(0,Math.min(1,(above-.18)/1.6)),weight=wholePatch?1:1-t*t*(3-2*t);if(!weight)continue;
   if(!wholePatch){const radial=Math.hypot(v.x-root.position.x,v.z-root.position.z),moss=Math.max(0,Math.min(1,(radial-.65)*2))*Math.max(0,1-above/.6);colors[i/3*4]=1-moss*.28;colors[i/3*4+1]=1+moss*.7;colors[i/3*4+2]=1-moss*.23;v.y-=moss*.06;}
   const terrainY=heightAt(v.x,v.z);
   if(!wholePatch&&/island_tree_02|tree_small_02|sand_rocks_small_01/.test(root.name)&&above<.16)v.y=Math.min(v.y,terrainY-.035);v.y+=(terrainY-base)*weight;
   // The scan includes a broad horizontal floor apron, not just roots. Bury
   // its outside edge; slope deformation alone leaves a visible floating shelf.
   if(!wholePatch){const radius=Math.hypot(v.x-root.position.x,v.z-root.position.z),edge=Math.max(0,Math.min(1,(radius-.6)/.5)),low=1-Math.max(0,Math.min(1,(above-.7)/.5));v.y+=(Math.min(v.y,terrainY-.10)-v.y)*edge*low;}
   B.Vector3.TransformCoordinatesToRef(v,inverse,local);p[i]=local.x;p[i+1]=local.y;p[i+2]=local.z;}
  if(!wholePatch)m.setVerticesData(B.VertexBuffer.ColorKind,colors);
  const normals=[];B.VertexData.ComputeNormals(p,m.getIndices(),normals,{useRightHandedSystem:true});m.setVerticesData(B.VertexBuffer.PositionKind,p);m.setVerticesData(B.VertexBuffer.NormalKind,normals);m.refreshBoundingInfo();
 }
}
export function sceneryFootprint(root,id,B){
 const tree=/tree|sapling/.test(id),soft=id==='searsia_lucida',points=[],v=new B.Vector3(),base=ground(root.position.x,root.position.z);
 for(const m of root.getChildMeshes()){
  // The enlarged ship needs its complete hull footprint, not a thin slice at
  // sand height. Sails and rigging must never create invisible walking walls.
  if(id==='ship_pinnace'&&!/ship_pinnace_(hull|aft)$/.test(m.material?.name||''))continue;
  if(tree&&!(id==='fir_sapling_medium'?/branches$/.test(m.material?.name||''):/trunk|branches|bark/.test(m.material?.name||'')))continue;
  const p=m.getVerticesData(B.VertexBuffer.PositionKind);if(!p)continue;const matrix=m.computeWorldMatrix(true),stride=Math.max(1,Math.floor(p.length/3/2500))*3;
  for(let i=0;i<p.length;i+=stride){B.Vector3.TransformCoordinatesFromFloatsToRef(p[i],p[i+1],p[i+2],matrix,v);if(id==='ship_pinnace'||v.y<=base+(tree?1.6:2.0)&&v.y>ground(v.x,v.z)+.10)points.push({x:v.x,z:v.z});}
 }
 if(points.length<3&&!tree)return{x:root.position.x,z:root.position.z,r:0,height:0,id,walkThrough:true};
 if(points.length<3)return{x:root.position.x,z:root.position.z,r:tree?.65:soft?.55:.6,height:3,id};
 if(tree&&root.metadata?.trunkRadius)return{x:root.position.x,z:root.position.z,r:root.metadata.trunkRadius,height:30,id};
 const exposed=points.filter(p=>ground(p.x,p.z)>-4.85);if(!tree&&exposed.length<3)return{x:root.position.x,z:root.position.z,r:.1,height:0,id,walkThrough:true};
 const polygon=convexFootprint(points),x=polygon.reduce((s,p)=>s+p.x,0)/polygon.length,z=polygon.reduce((s,p)=>s+p.z,0)/polygon.length,r=Math.max(...polygon.map(p=>Math.hypot(p.x-x,p.z-z)));
 return{x,z,r:Math.max(.15,r),polygon,height:tree?30:8,id};
}
