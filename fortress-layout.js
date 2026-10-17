// Original three-shot par five. Coordinates are metres; the routed length is ~593 yd.
export const KEEP_ROUTE=[[240,-315],[370,-465],[525,-480],[650,-620]];
export const KEEP_CROSSING=[[178,-244],[194,-263],[211,-279],[230,-299]];
export const KEEP_BUNKERS=[[390,-450,8,6],[468,-465,8,5],[545,-510,10,7],[635,-609,6,8],[664,-635,5,7]];
export const inKeep=(x,z)=>x>195&&z<-270;
const keepSmooth=(a,b,n)=>{const t=Math.max(0,Math.min(1,(n-a)/(b-a)));return t*t*(3-2*t);};
export function nearestKeepPath(x,z,points=KEEP_ROUTE){let best=null,along=0;for(let i=0;i<points.length-1;i++){const [ax,az]=points[i],[bx,bz]=points[i+1],dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(length*length))),px=ax+t*dx,pz=az+t*dz,distance=Math.hypot(x-px,z-pz);if(!best||distance<best.distance)best={x:px,z:pz,distance,segment:i,t,along:along+t*length,nx:-dz/length,nz:dx/length};along+=length;}return best;}
export const KEEP_LENGTH=KEEP_ROUTE.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-KEEP_ROUTE[i][0],p[1]-KEEP_ROUTE[i][1]),0);
export function keepPointAlong(distance){let left=Math.max(0,Math.min(KEEP_LENGTH,distance));for(let i=0;i<KEEP_ROUTE.length-1;i++){const [x,z]=KEEP_ROUTE[i],[bx,bz]=KEEP_ROUTE[i+1],length=Math.hypot(bx-x,bz-z);if(left<=length||i===KEEP_ROUTE.length-2)return{x:x+(bx-x)*left/length,z:z+(bz-z)*left/length,nx:-(bz-z)/length,nz:(bx-x)/length};left-=length;}}
export function keepGreenRadius(x,z){return Math.hypot((x-650)/15,(z+620)/11);}
export function keepBunkerMask(x,z){return Math.max(...KEEP_BUNKERS.map(([bx,bz,rx,rz])=>1-keepSmooth(.72,1.06,Math.hypot((x-bx)/rx,(z-bz)/rz))));}
export function keepLandRadius(x,z){const p=nearestKeepPath(x,z);return p.distance/(49+4*Math.sin(p.along*.023)+2*Math.sin(Math.atan2(z-p.z,x-p.x)*3));}
export function keepGround(x,z){const p=nearestKeepPath(x,z),r=keepLandRadius(x,z),g=keepGreenRadius(x,z),base=1.5+p.along/KEEP_LENGTH*2.8+.5*Math.sin(x*.035)*Math.cos(z*.027),green=4.65+.60*(1-keepSmooth(-3,4,z+620))+.012*(x-650)+.006*(z+620)+.025*Math.sin((x-650)*.24),mix=keepSmooth(1.0,1.65,g),land=green*(1-mix)+base*mix-.65*keepBunkerMask(x,z),coast=keepSmooth(.74,1.07,r);return land*(1-coast)-6.6*coast;}
export function keepFairwayWidth(x,z){const p=nearestKeepPath(x,z);return 17+3*Math.sin(p.along*.014)+2*Math.exp(-(((p.along-200)/55)**2));}
export function keepSurface(x,z){if(keepBunkerMask(x,z)>.45||keepGround(x,z)<-1)return 'sand';const g=keepGreenRadius(x,z);if(g<1)return 'green';if(g<1.2)return 'fringe';return nearestKeepPath(x,z).distance<keepFairwayWidth(x,z)?'fairway':'rough';}
export function keepAimPoint(ball,cup){const p=nearestKeepPath(ball.x,ball.z);let i=p.segment+1;if(Math.hypot(ball.x-KEEP_ROUTE[i][0],ball.z-KEEP_ROUTE[i][1])<35)i++;return i>=KEEP_ROUTE.length-1?cup:{x:KEEP_ROUTE[i][0],z:KEEP_ROUTE[i][1]};}
