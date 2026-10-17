// Metres. A quiet short par four beyond the fourth green, with a broad fairway and an island putting surface.
export const CABIN={x:1168,z:-1266,width:11,depth:8,floor:2.4};
export const CABIN_ROUTE=[[1185,-1255],[1212,-1302],[1266,-1360],[1305,-1423]];
export const CABIN_CUP={x:1307,z:-1487};
export const CABIN_ENTRY=[[1169,-1170],[1181,-1206],[1185,-1231]];
export const CABIN_PIN_BRIDGE=[[1305,-1437],[1305,-1473]];
export const CABIN_BUNKERS=[[1243,-1332,8,12],[1278,-1412,7,5]];
export const inCabin=(x,z)=>x>1090&&x<1420&&z< -1206&&z> -1575;
const cabinSmooth=(a,b,n)=>{const t=Math.max(0,Math.min(1,(n-a)/(b-a)));return t*t*(3-2*t);};
export function cabinNearest(x,z,points=CABIN_ROUTE){let best=null,along=0;for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(len*len))),px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz);if(!best||d<best.distance)best={x:px,z:pz,distance:d,along:along+t*len,nx:-dz/len,nz:dx/len,segment:i,t};along+=len;}return best;}
export const CABIN_LENGTH=CABIN_ROUTE.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-CABIN_ROUTE[i][0],p[1]-CABIN_ROUTE[i][1]),0)+64;
export function cabinPoint(distance){let d=Math.max(0,distance);for(let i=0;i<CABIN_ROUTE.length-1;i++){const a=CABIN_ROUTE[i],b=CABIN_ROUTE[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=len||i===CABIN_ROUTE.length-2){const t=Math.min(1,d/len);return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,nx:-(b[1]-a[1])/len,nz:(b[0]-a[0])/len};}d-=len;}}
export function cabinGreenRadius(x,z){return Math.hypot((x-1305)/14,(z+1484)/12);}
export function cabinBunkerMask(x,z){let m=0;for(const [cx,cz,rx,rz]of CABIN_BUNKERS)m=Math.max(m,1-cabinSmooth(.75,1.08,Math.hypot((x-cx)/rx,(z-cz)/rz)));return m;}
export function cabinClearing(x,z){return cabinSmooth(.9,1.2,Math.hypot((x-CABIN.x)/14,(z-CABIN.z)/17));}
export function cabinLandRadius(x,z){const p=cabinNearest(x,z),wide=41+3*Math.sin(p.along*.037);return Math.min(Math.max(p.distance/wide,(-z-1423)/28),Math.hypot((x-1305)/23,(z+1484)/21));}
export function cabinGround(x,z){
 const p=cabinNearest(x,z),r=Math.max(p.distance/(41+3*Math.sin(p.along*.037)),(-z-1423)/28),island=Math.hypot((x-1305)/23,(z+1484)/21),front=Math.hypot((x-1305)/30,(z+1423)/15);
 let base=2.1+.48*Math.sin((x-1180)*.055)*Math.sin((z+1260)*.034)+.5*Math.exp(-(((p.along-115)/42)**2));
 const frontHeight=2.08+.009*(x-1305)+.035*Math.sin((z+1423)*.24);base=frontHeight*(1-cabinSmooth(.97,1.5,front))+base*cabinSmooth(.97,1.5,front);
 const pad=1-cabinSmooth(8,14,Math.hypot(x-CABIN.x,z-CABIN.z));base=base*(1-pad)+2.25*pad;
 const coast=cabinSmooth(.76,1.08,r),main=(base-.48*cabinBunkerMask(x,z)-.82*(1-cabinSmooth(0,1.04,Math.hypot((x-1243)/8,(z+1332)/12))))*(1-coast)-6.6*coast;
 const pinHeight=2.18+.009*(x-1307)+.012*(z+1487)+.07*Math.sin((x-1307)*.20)*Math.sin((z+1487)*.18),edge=cabinSmooth(.65,1.08,island),pin=pinHeight*(1-edge)-6.6*edge;
 return Math.max(main,pin);
}
export function cabinSurface(x,z){if(cabinGround(x,z)<-1||cabinBunkerMask(x,z)>.45)return 'sand';const g=cabinGreenRadius(x,z);if(g<1)return 'green';if(g<1.2)return 'fringe';return cabinMasks(x,z)[0]>.5?'fairway':'rough';}
export function cabinMasks(x,z){const p=cabinNearest(x,z),g=cabinGreenRadius(x,z),w=15+2*Math.sin(p.along*.025);return[cabinClearing(x,z)*Math.max(1-cabinSmooth(w-1.2,w+1.2,p.distance),1-cabinSmooth(.97,1.05,Math.hypot((x-1305)/30,(z+1423)/15))),1-cabinSmooth(.97,1.025,g),1-cabinSmooth(1.12,1.25,g),Math.max(cabinBunkerMask(x,z),1-cabinSmooth(-2,-.8,cabinGround(x,z)))];}
export function cabinAimPoint(ball,cup){const p=cabinNearest(ball.x,ball.z);return p.along<130?cabinPoint(p.along+175):cup;}
export function cabinDeckHeight(x,z,points,heightAt){const p=cabinNearest(x,z,points);if(p.distance>1.28)return null;const a=points[p.segment],b=points[p.segment+1];return heightAt(...a)*(1-p.t)+heightAt(...b)*p.t;}
