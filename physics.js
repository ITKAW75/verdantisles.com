import {inCabin,cabinGround,cabinSurface,cabinGreenRadius,cabinBunkerMask,cabinLandRadius} from './cabin-layout.js';
import {inHighland,highGreenRadius,highBunkerMask,highGround,highSurface,highLandRadius} from './highland-layout.js';
import {inKeep,keepGreenRadius,keepBunkerMask,keepGround,keepSurface,keepLandRadius} from './fortress-layout.js';
import {COURSES,inSanctuary,sanctuaryLocal,ceremonialMounds} from './courses.js';
import {CLUBS,shotDistance,launchCarryFactor} from './clubs.js';
export let HOLE=COURSES[0].cup;
export function setActiveCourse(index){if(!COURSES[index])throw new RangeError("Unknown hole");HOLE=COURSES[index].cup;START=COURSES[index].tee;}
export let START=COURSES[0].tee;
export const BALL_RADIUS=.055;
export const FIXED_STEP=1/120;
const G=9.81;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
function coveGreenRadius(x,z){const u=(x-3)/13,v=(z+51)/11;const a=Math.atan2(v,u);return Math.hypot(u,v)/(1+.06*Math.sin(a*3));}
function greenHeight(x,z){const u=x-3,v=z+51;return  .64+.08*Math.sin(u*.24)*Math.cos(v*.17)+.06*Math.sin(v*.29)+.12*Math.exp(-((u+5)**2+(v-2)**2)/23)-.07*Math.exp(-((u-5)**2+(v+2)**2)/18);}
function courseHeight(x,z){const d=Math.hypot(x-HOLE.x,z-HOLE.z),r=greenRadius(x,z);const wild=.65*Math.sin(x*.09)*Math.cos(z*.045)+.35*Math.sin(z*.09);const green=greenHeight(x,z);const mix=smooth(.98,1.42,r);return green*(1-mix)+wild*mix;}
function coveBunkerMask(x,z){return Math.max(1-smooth(.75,1.08,Math.hypot((x-14)/3.5,(z+7)/8)),1-smooth(.75,1.08,Math.hypot((x+14)/4,(z+42)/6)));}
function coveGround(x,z){const a=Math.atan2((z+10)/76,x/39),r=Math.hypot(x/39,(z+10)/76)/(1+.035*Math.sin(a*5)),edge=smooth(.79,1.16,r),main=courseHeight(x,z)*(1-edge)-6.6*edge-.38*bunkerMask(x,z);const beach=Math.hypot((x-40)/30,(z-6)/29),sand=-2.9-3.8*smooth(.30,1.12,beach);return Math.max(main,sand);}
export function greenRadius(x,z){if(inCabin(x,z))return cabinGreenRadius(x,z);if(inHighland(x,z))return highGreenRadius(x,z);if(inKeep(x,z))return keepGreenRadius(x,z);const p=inSanctuary(x,z)?sanctuaryLocal(x,z):{x,z};return coveGreenRadius(p.x,p.z);}
export function bunkerMask(x,z){if(inCabin(x,z))return cabinBunkerMask(x,z);if(inHighland(x,z))return highBunkerMask(x,z);if(inKeep(x,z))return keepBunkerMask(x,z);const p=inSanctuary(x,z)?sanctuaryLocal(x,z):{x,z};return coveBunkerMask(p.x,p.z);}
export function ground(x,z){if(inCabin(x,z))return cabinGround(x,z);if(inHighland(x,z))return highGround(x,z);if(inKeep(x,z))return keepGround(x,z);if(!inSanctuary(x,z))return coveGround(x,z);const p=sanctuaryLocal(x,z),r=coveGreenRadius(p.x,p.z),m=smooth(12,18,Math.abs(p.x))*smooth(1.3,1.65,r);return coveGround(p.x,p.z)+ceremonialMounds(p.x,p.z)*m;}
export function surface(x,z){if(inCabin(x,z))return cabinSurface(x,z);if(inHighland(x,z))return highSurface(x,z);if(inKeep(x,z))return keepSurface(x,z);const p=inSanctuary(x,z)?sanctuaryLocal(x,z):{x,z};return coveSurface(p.x,p.z);}
export function inside(x,z,margin=0){if(inCabin(x,z))return cabinLandRadius(x,z)<1-margin/45;if(inHighland(x,z))return highLandRadius(x,z)<1-margin/50;if(inKeep(x,z))return keepLandRadius(x,z)<1-margin/50;const p=inSanctuary(x,z)?sanctuaryLocal(x,z):{x,z};return coveInside(p.x,p.z,margin);}
export function slope(x,z){const h=.035;return{x:(ground(x+h,z)-ground(x-h,z))/(2*h),z:(ground(x,z+h)-ground(x,z-h))/(2*h)};}
function coveSurface(x,z){if(bunkerMask(x,z)>.45||ground(x,z)<-1)return 'sand';const r=greenRadius(x,z);if(r<1)return 'green';if(r<1.2)return 'fringe';return Math.abs(x-6*Math.sin(z*.045))<10?'fairway':'rough';}
export function friction(x,z){return{green:.34,fringe:.8,fairway:1.05,rough:2.1,sand:3.4}[surface(x,z)];}
function coveInside(x,z,margin=0){const a=Math.atan2((z+10)/76,x/39),edge=1+.055*Math.sin(a*5)+.035*Math.cos(a*9);return Math.hypot(x/(39-margin),(z+10)/(76-margin))<edge;}
export function makeShot(ball,yaw,club,power,random=Math.random,groove=1,shape='straight'){
 if(!['straight','fade','draw'].includes(shape))throw Error('Invalid shot shape');
 const requestedDistance=shotDistance(club,power,groove)*launchCarryFactor(club,surface(ball.x,ball.z));
 const putt=club==='putter',spread=putt?0:(random()-.5)*.006,variation=putt?1:1+(random()-.5)*.014;
 const distance=requestedDistance*variation,carry=distance,height=carry*Math.tan(CLUBS[club].launch*Math.PI/180)/4*(CLUBS[club].group==='wood'?1.5:CLUBS[club].group==='iron'?1.18:1);
 const vy=putt?0:Math.sqrt(2*G*height),duration=2*vy/G;
 const flightSkew=putt?0:CLUBS[club].group==='wood'?.12:CLUBS[club].group==='iron'?.07:0;
 const curve=(shape==='fade'?1:shape==='draw'?-1:0)*carry*(CLUBS[club].group==='wood'?.026:CLUBS[club].group==='iron'?.018:.006);
 const speed=putt?Math.sqrt(2*.34*distance):carry/duration;
 return{start:{x:ball.x,y:ground(ball.x,ball.z)+BALL_RADIUS,z:ball.z},x:ball.x,y:ground(ball.x,ball.z)+BALL_RADIUS,z:ball.z,vx:Math.sin(yaw+spread)*speed,vy:vy*(1-flightSkew),flightSkew,flightTime:duration,curve,yaw,shape,vz:-Math.cos(yaw+spread)*speed,club,power,groove,phase:putt?'roll':'air',elapsed:0,accumulator:0,bounces:0,rollDistance:0,rotationX:0,rotationZ:0,settled:false,holed:false,outOfBounds:false,random};
}
function capture(s,px,pz){
 if(s.phase==='cup'||s.phase==='air'&&s.y>ground(s.x,s.z)+BALL_RADIUS+.1)return false;
 const dx=s.x-px,dz=s.z-pz,den=dx*dx+dz*dz,t=den?clamp(((HOLE.x-px)*dx+(HOLE.z-pz)*dz)/den,0,1):0;
 const distance=Math.hypot(px+dx*t-HOLE.x,pz+dz*t-HOLE.z),speed=Math.hypot(s.vx,s.vz);
 if(distance<.26&&speed<1.75){s.phase='cup';s.cupTime=0;s.cupStart={x:s.x,y:s.y,z:s.z};s.vx=s.vy=s.vz=0;return true;}return false;
}
function advance(s,dt,colliders){
 if(s.settled)return;s.elapsed+=dt;
 if(s.phase==='cup'){s.cupTime+=dt;const t=clamp(s.cupTime/.48,0,1),ease=1-(1-t)**2;s.x=s.cupStart.x+(HOLE.x-s.cupStart.x)*ease;s.z=s.cupStart.z+(HOLE.z-s.cupStart.z)*ease;s.y=s.cupStart.y-.55*ease;if(t===1){s.holed=true;s.settled=true;}return;}
 const px=s.x,pz=s.z;
 if(s.phase==='air'){
  const u=clamp(s.elapsed/Math.max(.01,s.flightTime),0,1),firstFlight=s.bounces===0;
  s.vy+=(-G+(firstFlight?3*G*s.flightSkew*(1-2*u):0))*dt;
  const bend=firstFlight&&s.flightTime>0?2.5*s.curve/(s.flightTime*s.flightTime)*(.4+1.2*u):0;
  s.vx+=(.09+Math.cos(s.yaw)*bend)*dt;s.vz+=Math.sin(s.yaw)*bend*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
  if(inside(s.x,s.z)&&s.y<=ground(s.x,s.z)+BALL_RADIUS&&s.vy<0){
   const sl=slope(s.x,s.z),len=Math.hypot(sl.x,1,sl.z),nx=-sl.x/len,ny=1/len,nz=-sl.z/len,normalSpeed=s.vx*nx+s.vy*ny+s.vz*nz;
   const kind=surface(s.x,s.z),first=s.bounces===0,soft=kind==='green'||kind==='fringe';
   // Wedge loft changes both flight and first-impact check; sand/rough suppress spin.
   const clubSpec=CLUBS[s.club],wedge=clubSpec.group==='wedge';
   const restitution=(kind==='sand'?.07:kind==='rough'?.15:soft?.2:.26)*(wedge?clubSpec.bounceScale:1),retention=first?(wedge?clubSpec.landingRetention*(kind==='rough'?1.35:kind==='sand'?.6:1):soft?.14:.2):.68;
   const tangentX=(s.vx-normalSpeed*nx)*retention,tangentZ=(s.vz-normalSpeed*nz)*retention;
   const angle=(s.random()-.5)*(soft?.018:.07),speedVariation=1+(s.random()-.5)*.06;
   s.vx=(tangentX*Math.cos(angle)-tangentZ*Math.sin(angle))*speedVariation-normalSpeed*restitution*nx;
   s.vz=(tangentX*Math.sin(angle)+tangentZ*Math.cos(angle))*speedVariation-normalSpeed*restitution*nz;
   s.vy=-normalSpeed*restitution*ny;s.y=ground(s.x,s.z)+BALL_RADIUS;s.bounces++;
   if(s.vy<.48||s.bounces>=4){s.phase='roll';s.vy=0;}
  }
 }else{
  const sl=slope(s.x,s.z),ax=-G*5/7*sl.x,az=-G*5/7*sl.z,drag=friction(s.x,s.z),speed=Math.hypot(s.vx,s.vz);
  if(speed<.025&&Math.hypot(ax,az)<drag*1.05){s.vx=s.vz=0;s.settled=true;s.y=ground(s.x,s.z)+BALL_RADIUS;capture(s,px,pz);if(s.phase==='cup')s.settled=false;return;}
  s.vx+=ax*dt;s.vz+=az*dt;const accelerated=Math.hypot(s.vx,s.vz),next=Math.max(0,accelerated-drag*dt),factor=accelerated?next/accelerated:0;s.vx*=factor;s.vz*=factor;
  s.x+=s.vx*dt;s.z+=s.vz*dt;s.y=ground(s.x,s.z)+BALL_RADIUS;
  if(!inside(s.x,s.z)){s.phase='air';s.vy=0;}
 }
 for(const c of colliders){const dx=s.x-c.x,dz=s.z-c.z,dist=Math.hypot(dx,dz),r=c.r+BALL_RADIUS;if(dist<r&&s.y<ground(c.x,c.z)+(c.height||7)&&dist>.001){const nx=dx/dist,nz=dz/dist,dot=s.vx*nx+s.vz*nz;s.x=c.x+nx*(r+.01);s.z=c.z+nz*(r+.01);if(dot<0){s.vx=(s.vx-2*dot*nx)*.45;s.vz=(s.vz-2*dot*nz)*.45;}}}
 const moved=Math.hypot(s.x-px,s.z-pz);s.rotationX+=(s.z-pz)/BALL_RADIUS;s.rotationZ-=(s.x-px)/BALL_RADIUS;if(s.phase==='roll')s.rollDistance+=moved;
 capture(s,px,pz);
 if(s.y< -22||!inside(s.x,s.z)&&s.elapsed>12){s.outOfBounds=true;s.settled=true;}
 if(s.elapsed>45){s.settled=true;}
}
export function stepShot(s,delta,colliders=[]){s.accumulator+=Math.max(0,Math.min(delta,.25));while(s.accumulator+1e-10>=FIXED_STEP&&!s.settled){advance(s,FIXED_STEP,colliders);s.accumulator-=FIXED_STEP;}return s;}
export function ballPosition(s){return{x:s.x,y:s.y,z:s.z,rotationX:s.rotationX,rotationZ:s.rotationZ};}
