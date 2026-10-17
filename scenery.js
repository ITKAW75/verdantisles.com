import {greenRadius,bunkerMask,ground} from './physics.js';
// Mown playing surfaces and bunker lips stay free of scenery, including its footprint.
export function keptClear(x,z){
 return greenRadius(x,z)<1.33||bunkerMask(x,z)>.005||Math.abs(x-6*Math.sin(z*.045))<12.1;
}
export function plantingAllowed(x,z,r=.7){
 if(ground(x,z)<-.85||keptClear(x,z))return false;
 for(let ring=1;ring<=2;ring++)for(let i=0;i<16;i++){const a=i*Math.PI/8,px=x+Math.cos(a)*r*ring/2,pz=z+Math.sin(a)*r*ring/2;if(keptClear(px,pz)||ground(px,pz)<-1.1)return false;}
 return true;
}
export function beachTrail(x,z){return x>13&&x<43&&Math.abs(z-(22+Math.sin(x*.17)*1.6))<2.1;}
export function convexFootprint(points){
 const sorted=points.sort((a,b)=>a.x-b.x||a.z-b.z),cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 const half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h;};
 const a=half(sorted),b=half([...sorted].reverse());a.pop();b.pop();return a.concat(b);
}
export function resolveWalk(player,dx,dz,colliders,walkable,feetY=null){
 let x=player.x,z=player.z;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16)),radius=.38;
 for(let step=0;step<steps;step++){
  let nx=x+dx/steps,nz=z+dz/steps;
  for(let pass=0;pass<4;pass++)for(const c of colliders){
   if(c.walkThrough||feetY!==null&&!/rail/.test(c.id||'')&&(c.height||7)<.65&&feetY>ground(c.x,c.z)+(c.height||7)+.08)continue;
   if(Math.hypot(nx-c.x,nz-c.z)>c.r+radius)continue;
   if(!c.polygon){const vx=nx-c.x,vz=nz-c.z,d=Math.hypot(vx,vz),r=c.r+radius;if(d<r){nx=c.x+(d?vx/d:1)*(r+.002);nz=c.z+(d?vz/d:0)*(r+.002);}continue;}
   let inside=true,nearest=null,best=Infinity;
   for(let i=0;i<c.polygon.length;i++){const a=c.polygon[i],b=c.polygon[(i+1)%c.polygon.length],ex=b.x-a.x,ez=b.z-a.z,den=ex*ex+ez*ez;if(!den)continue;if(ex*(nz-a.z)-ez*(nx-a.x)<0)inside=false;const t=Math.max(0,Math.min(1,((nx-a.x)*ex+(nz-a.z)*ez)/den)),qx=a.x+ex*t,qz=a.z+ez*t,d=Math.hypot(nx-qx,nz-qz);if(d<best){best=d;nearest={x:qx,z:qz,ox:ez/Math.sqrt(den),oz:-ex/Math.sqrt(den)};}}
   if(nearest&&(inside||best<radius)){const ox=inside||best<1e-6?nearest.ox:(nx-nearest.x)/best,oz=inside||best<1e-6?nearest.oz:(nz-nearest.z)/best;nx=nearest.x+ox*(radius+.002);nz=nearest.z+oz*(radius+.002);}
  }
  if(walkable(nx,nz)){x=nx;z=nz;}else if(walkable(nx,z)){x=nx;}else if(walkable(x,nz)){z=nz;}
 }
 return{x,z};
}
