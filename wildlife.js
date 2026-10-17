import {inside,greenRadius} from './physics.js';
export function createWildlife(covers){return[[-6,24],[10,8],[-10,-12],[14,-29],[-11,-45]].map(([x,z],i)=>({x,z,homeX:x,homeZ:z,yaw:i,tx:x,tz:z,state:'rest',timer:12+i*3,speed:0,motion:0,hop:0,phase:0,opacity:1,cover:null,seed:157+i*117,age:0,ear:0,head:0,cooldown:0,covers}));}
function wildlifeRandom(r){r.seed=(Math.imul(r.seed,1664525)+1013904223)>>>0;return r.seed/4294967296;}
function wildlifeSafe(x,z,colliders){return inside(x,z,3)&&greenRadius(x,z)>1.1&&!colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.27);}
function wildlifeState(r,state,seconds){r.state=state;r.timer=seconds;if(!['roam','flee','emerge'].includes(state)){r.speed=0;r.motion=0;r.hop=0;r.phase=0;}}
function rest(r){wildlifeState(r,'rest',10+wildlifeRandom(r)*20);}
function chooseCover(r,threat,colliders){let best=null,score=Infinity;for(const c of r.covers){if(!wildlifeSafe(c.x,c.z,colliders))continue;const d=Math.hypot(c.x-r.x,c.z-r.z),away=Math.hypot(c.x-threat.x,c.z-threat.z),cost=d+Math.max(0,7-away)*3;if(cost<score){score=cost;best=c;}}if(!best){rest(r);return;}r.cover=best;r.tx=best.x;r.tz=best.z;wildlifeState(r,'flee',9);}
function roam(r,colliders){for(let i=0;i<20;i++){const a=wildlifeRandom(r)*Math.PI*2,d=1.4+wildlifeRandom(r)*3.2,x=r.homeX+Math.cos(a)*d,z=r.homeZ+Math.sin(a)*d;if(wildlifeSafe(x,z,colliders)){r.tx=x;r.tz=z;wildlifeState(r,'roam',6);return;}}rest(r);}
export function updateWildlife(rabbits,dt,player,colliders=[],ballThreat=null){
 for(const r of rabbits){const oldX=r.x,oldZ=r.z;r.age+=dt;r.timer-=dt;r.cooldown=Math.max(0,r.cooldown-dt);const playerDistance=Math.hypot(r.x-player.x,r.z-player.z),ballDistance=ballThreat?Math.hypot(r.x-ballThreat.x,r.z-ballThreat.z):Infinity,threat=ballDistance<playerDistance?ballThreat:player,distance=Math.min(playerDistance,ballDistance);
  if(distance<3.4&&r.cooldown===0&&!['flee','hidden','alert'].includes(r.state))wildlifeState(r,'alert',1.+wildlifeRandom(r)*1.1);
  if((distance<1.25||ballDistance<2.4)&&r.state!=='flee'&&r.state!=='hidden')chooseCover(r,threat,colliders);
  if(r.state==='alert'&&r.timer<=0){if(distance<2.2||wildlifeRandom(r)<.38)chooseCover(r,threat,colliders);else{rest(r);r.cooldown=8+wildlifeRandom(r)*7;}}
  if(r.state==='hidden'){r.opacity=Math.max(0,r.opacity-dt*3);if(distance<7)r.timer=Math.max(r.timer,2);if(r.timer<=0){const a=Math.atan2(r.homeZ-r.z,r.homeX-r.x),x=r.x+Math.cos(a)*2.8,z=r.z+Math.sin(a)*2.8;if(wildlifeSafe(x,z,colliders)){r.tx=x;r.tz=z;wildlifeState(r,'emerge',6);}else rest(r);}}
  else r.opacity=Math.min(1,r.opacity+dt*2);
  if(r.state==='rest'&&r.timer<=0){if(wildlifeRandom(r)<.45)wildlifeState(r,'forage',3+wildlifeRandom(r)*3);else roam(r,colliders);}
  if(r.state==='forage'&&r.timer<=0)rest(r);
  if(['roam','flee','emerge'].includes(r.state)){
   const dx=r.tx-r.x,dz=r.tz-r.z,d=Math.hypot(dx,dz);
   if(d<.25){if(r.state==='flee')wildlifeState(r,'hidden',4.5+wildlifeRandom(r)*5);else rest(r);}
   else{
    const maxSpeed=r.state==='flee'?4.8:r.state==='emerge'?.8:1.1;r.speed+=(maxSpeed-r.speed)*Math.min(1,dt*(r.state==='flee'?9:4));const stride=Math.min(d,r.speed*dt),base=Math.atan2(dx,-dz);let moved=false;
    for(const turn of[0,.35,-.35,.7,-.7,1.2,-1.2,1.7,-1.7]){const a=base+turn,nx=r.x+Math.sin(a)*stride,nz=r.z-Math.cos(a)*stride;if(wildlifeSafe(nx,nz,colliders)){r.x=nx;r.z=nz;r.yaw+=Math.atan2(Math.sin(a-r.yaw),Math.cos(a-r.yaw))*Math.min(1,dt*12);moved=true;break;}}
    if(!moved||r.timer<0){rest(r);r.cooldown=2;}
   }
  }
  // Gait follows actual travel, never desired velocity. Blocked and resting feet remain planted.
  r.motion=dt>0?Math.hypot(r.x-oldX,r.z-oldZ)/dt:0;
  if(r.motion>.08){r.phase+=Math.hypot(r.x-oldX,r.z-oldZ)*(r.state==='flee'?5:10);r.hop=Math.max(0,Math.sin(r.phase))*(r.state==='flee'?.18:.065);}else{r.motion=0;r.phase=0;r.hop=0;r.speed=0;}
  const desiredHead=r.state==='forage'?-.58-.05*Math.sin(r.age*2):r.state==='alert'?.1:-.06;r.head+=(desiredHead-r.head)*Math.min(1,dt*5);
  const desiredEar=r.state==='flee'?-.5:r.state==='alert'?.07:Math.pow(Math.max(0,Math.sin(r.age*.47+r.seed%7)),18)*.08;r.ear+=(desiredEar-r.ear)*Math.min(1,dt*4);
 }
 return rabbits;
}
