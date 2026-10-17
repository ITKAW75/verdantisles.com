import {ground} from './physics.js';
import {convexFootprint} from './scenery.js';
function inHull(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
function nearHull(x,z,p,r){if(inHull(x,z,p))return true;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<r)return true;}return false;}
export function clearRockPlantOverlaps(B,items,placements,colliders,details,renderer){
 const rocks=[];for(const a of items){if(!/rock|boulder/.test(a.id)||Math.abs(a.x)>80||Math.abs(a.z)>100)continue;const points=[];for(const m of a.root.getChildMeshes()){const p=m.getVerticesData('position');if(!p)continue;const w=m.computeWorldMatrix(true);for(let i=0;i<p.length;i+=3){const v=B.Vector3.TransformCoordinatesFromFloatsToRef(p[i],p[i+1],p[i+2],w,new B.Vector3());if(v.y>ground(v.x,v.z)-.1)points.push({x:v.x,z:v.z});}}if(points.length>2)rocks.push({id:a.id,hull:convexFootprint(points)});}
 const removed=[];for(const a of items){if(!/tree|sapling|searsia|grass|flower|fern|moss_01|shrub|nettle|periwinkle|weed_plant|iceplant/.test(a.id)||Math.abs(a.x)>80||Math.abs(a.z)>100)continue;const tree=/tree|sapling/.test(a.id),radius=tree?.7:a.id==='searsia_lucida'?.75:.25,hit=rocks.find(r=>nearHull(a.x,a.z,r.hull,radius));if(!hit)continue;
  removed.push({id:a.id,x:a.x,z:a.z,rock:hit.id});for(const m of a.root.getChildMeshes())renderer.removeShadowCaster(m);for(let i=details.length-1;i>=0;i--)if(details[i].root===a.root)details.splice(i,1);if(a.collider){const k=colliders.indexOf(a.collider);if(k>=0)colliders.splice(k,1);}const k=placements.indexOf(a.record);if(k>=0)placements.splice(k,1);a.root.dispose();a.removed=true;
 }
 return {removed,rocks:rocks.length};
}
