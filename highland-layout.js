import {roundedCrossing} from './courses.js';
// Return island, left of the keep across a permanent water channel. Metres.
export const LOCAL_HIGH_CONTROL=[[520,-760],[427,-717],[335,-603],[195,-510],[120,-350]];

export const LOCAL_HIGH_CUP={x:117,z:-343};
export const LOCAL_HIGH_BUNKERS=[[390,-687,8,6],[355,-637,6,9],[233,-547,8,5],[137,-371,6,8],[106,-336,6,5]];

const highSmooth=(a,b,n)=>{const t=Math.max(0,Math.min(1,(n-a)/(b-a)));return t*t*(3-2*t);};
export const LOCAL_HIGH_ROUTE=[];
for(let i=0;i<LOCAL_HIGH_CONTROL.length-1;i++)for(let j=0;j<24;j++){const a=LOCAL_HIGH_CONTROL[Math.max(0,i-1)],b=LOCAL_HIGH_CONTROL[i],c=LOCAL_HIGH_CONTROL[i+1],d=LOCAL_HIGH_CONTROL[Math.min(LOCAL_HIGH_CONTROL.length-1,i+2)],t=j/24,t2=t*t,t3=t2*t;LOCAL_HIGH_ROUTE.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}LOCAL_HIGH_ROUTE.push(LOCAL_HIGH_CONTROL.at(-1));
export const LOCAL_HIGH_STATIONS=[0];for(let i=1;i<LOCAL_HIGH_ROUTE.length;i++)LOCAL_HIGH_STATIONS.push(LOCAL_HIGH_STATIONS.at(-1)+Math.hypot(LOCAL_HIGH_ROUTE[i][0]-LOCAL_HIGH_ROUTE[i-1][0],LOCAL_HIGH_ROUTE[i][1]-LOCAL_HIGH_ROUTE[i-1][1]));
export const LOCAL_HIGH_LENGTH=LOCAL_HIGH_STATIONS.at(-1);
const segmentCache=new WeakMap();
export function localHighNearest(x,z,points=LOCAL_HIGH_ROUTE){let segments=segmentCache.get(points);if(!segments){let along=0;segments=points.slice(1).map((b,i)=>{const a=points[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),s={ax:a[0],az:a[1],dx,dz,l,l2:l*l,along};along+=l;return s;});segmentCache.set(points,segments);}let best=Infinity,result;for(let i=0;i<segments.length;i++){const s=segments[i],t=Math.max(0,Math.min(1,((x-s.ax)*s.dx+(z-s.az)*s.dz)/s.l2)),px=s.ax+t*s.dx,pz=s.az+t*s.dz,d=(x-px)**2+(z-pz)**2;if(d<best){best=d;result={x:px,z:pz,along:s.along+t*s.l,t,segment:i,nx:-s.dz/s.l,nz:s.dx/s.l};}}result.distance=Math.sqrt(best);return result;}
export function localHighPoint(distance){distance=Math.max(0,Math.min(LOCAL_HIGH_LENGTH,distance));let i=1;while(i<LOCAL_HIGH_STATIONS.length-1&&LOCAL_HIGH_STATIONS[i]<distance)i++;const a=LOCAL_HIGH_ROUTE[i-1],b=LOCAL_HIGH_ROUTE[i],l=LOCAL_HIGH_STATIONS[i]-LOCAL_HIGH_STATIONS[i-1],t=(distance-LOCAL_HIGH_STATIONS[i-1])/l;return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,nx:-(b[1]-a[1])/l,nz:(b[0]-a[0])/l};}
export function localHighGreenRadius(x,z){return Math.hypot((x-120)/14,(z+350)/12);}
export function localHighBunkerMask(x,z){let m=0;for(const [a,b,rx,rz]of LOCAL_HIGH_BUNKERS)m=Math.max(m,1-highSmooth(.72,1.08,Math.hypot((x-a)/rx,(z-b)/rz)));return m;}
export function localHighLandRadius(x,z){const p=localHighNearest(x,z);return p.distance/(48+4*Math.sin(p.along*.018));}
export function localHighElevation(d){const t=d/LOCAL_HIGH_LENGTH;return 7+15*Math.exp(-(((t-.31)/.19)**2))+8*Math.exp(-(((t-.77)/.15)**2))+7*highSmooth(.78,1,t);}
export function localHighGround(x,z){const p=localHighNearest(x,z),r=p.distance/(48+4*Math.sin(p.along*.018)),g=localHighGreenRadius(x,z),base=localHighElevation(p.along)+1.05*Math.sin(x*.052)*Math.sin(z*.044),green=16+.75*(1-highSmooth(-6,6,z+350))+.018*(x-120)+.009*(z+350),mix=highSmooth(1,1.6,g),land=green*(1-mix)+base*mix-.68*localHighBunkerMask(x,z),coast=highSmooth(.73,1.08,r);return land*(1-coast)-6.6*coast;}
export function localHighFairwayWidth(d){return 17+2.5*Math.sin(d*.018)+1.2*Math.sin(d*.045);}
export function localHighSurface(x,z){if(localHighBunkerMask(x,z)>.45||localHighGround(x,z)<-1)return 'sand';const g=localHighGreenRadius(x,z);if(g<1)return 'green';if(g<1.2)return 'fringe';const p=localHighNearest(x,z);return p.distance<localHighFairwayWidth(p.along)?'fairway':'rough';}
export function localHighAimPoint(ball,cup){const p=localHighNearest(ball.x,ball.z);if(p.along>LOCAL_HIGH_LENGTH-175)return cup;return localHighPoint(p.along+205);}
export function localHighMasks(x,z){const p=localHighNearest(x,z),g=localHighGreenRadius(x,z),w=localHighFairwayWidth(p.along);return[1-highSmooth(w-1.4,w+1.4,p.distance),1-highSmooth(.98,1.03,g),1-highSmooth(1.12,1.25,g),localHighBunkerMask(x,z)];}

// Rigid transform: unchanged local layout/heightfield, placed beyond the existing castle gate.
export const highWorld=(x,z)=>({x:1280-x,z:-1490-z});
export const highLocal=highWorld;
export const HIGH_CONTROL=LOCAL_HIGH_CONTROL.map(([x,z])=>{const p=highWorld(x,z);return[p.x,p.z];});
export const HIGH_ROUTE=LOCAL_HIGH_ROUTE.map(([x,z])=>{const p=highWorld(x,z);return[p.x,p.z];});
export const HIGH_CUP=highWorld(117,-343);
export const HIGH_BUNKERS=LOCAL_HIGH_BUNKERS.map(([x,z,rx,rz])=>{const p=highWorld(x,z);return[p.x,p.z,rx,rz];});
export const HIGH_LENGTH=LOCAL_HIGH_LENGTH;
export const HIGH_CROSSING=roundedCrossing([[667,-639],[685,-657],[715,-685],[742,-712]]);
export const inHighland=(x,z)=>x>708&&z< -640;
export const highNearest=(x,z,points=HIGH_ROUTE)=>localHighNearest(x,z,points);
export function highPoint(d){const p=localHighPoint(d);return{...p,...highWorld(p.x,p.z),nx:-p.nx,nz:-p.nz};}
export const highElevation=localHighElevation;
export const highFairwayWidth=localHighFairwayWidth;
export const highGreenRadius=(x,z)=>localHighGreenRadius(1280-x,-1490-z);
export const highBunkerMask=(x,z)=>localHighBunkerMask(1280-x,-1490-z);
export const highLandRadius=(x,z)=>localHighLandRadius(1280-x,-1490-z);
export const highGround=(x,z)=>localHighGround(1280-x,-1490-z);
export const highSurface=(x,z)=>localHighSurface(1280-x,-1490-z);
export const highMasks=(x,z)=>localHighMasks(1280-x,-1490-z);
export function highAimPoint(ball,cup){const p=highNearest(ball.x,ball.z);return p.along>HIGH_LENGTH-175?cup:highPoint(p.along+205);}
