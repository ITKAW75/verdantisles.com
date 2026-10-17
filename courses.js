export const COURSES=[
 {number:1,name:"Smuggler's Green",par:3,tee:{x:0,z:29},cup:{x:5,z:-53}},
 {number:2,name:'The Elder Sanctuary',par:3,tee:{x:161,z:-130},cup:{x:160,z:-235.95}},
 {number:3,name:'The Sunken Keep',par:5,tee:{x:240,z:-315},cup:{x:654,z:-627}},
 {number:4,name:'The Highland Return',par:5,tee:{x:760,z:-730},cup:{x:1163,z:-1147}},
 {number:5,name:'Timberglass Cove',par:4,tee:{x:1185,z:-1255},cup:{x:1307,z:-1487}}
];
export const SANCTUARY={x:155,z:-175,stretch:1.15};
export const sanctuaryLocal=(x,z)=>({x:x-SANCTUARY.x,z:(z-SANCTUARY.z)/SANCTUARY.stretch});
export const sanctuaryWorld=(x,z)=>({x:x+SANCTUARY.x,z:z*SANCTUARY.stretch+SANCTUARY.z});
export const inSanctuary=(x,z)=>x>100&&z<-102;
export function ceremonialMounds(x,z){let y=0;for(const [cx,cz,h,rx,rz]of [[-23,-14,3.2,9,13],[24,-36,4.2,10,12],[-21,-59,2.4,8,8]])y+=h*Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));return y;}
// A stone crossing skirts the existing eastern islet instead of replacing it.
export const CROSSING_CONTROL=[[25,-58],[75,-91],[111,-95],[143,-124],[155,-142]];
// Rounded corners sampled densely; the rendered deck and walking height share these points.
export function roundedCrossing(points){const result=[points[0]];const line=p=>{const a=result.at(-1),n=Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1]));for(let j=1;j<=n;j++)result.push([a[0]+(p[0]-a[0])*j/n,a[1]+(p[1]-a[1])*j/n]);};for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(7,ab*.25,bc*.25),p=[b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab],q=[b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc];line(p);for(let j=1;j<=16;j++){const t=j/16;result.push([(1-t)**2*p[0]+2*t*(1-t)*b[0]+t*t*q[0],(1-t)**2*p[1]+2*t*(1-t)*b[1]+t*t*q[1]]);}}line(points.at(-1));return result;}
export const CROSSING=roundedCrossing(CROSSING_CONTROL);
export function crossingPoint(x,z){let best=null;for(let i=0;i<CROSSING.length-1;i++){const [ax,az]=CROSSING[i],[bx,bz]=CROSSING[i+1],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz))),px=ax+t*dx,pz=az+t*dz,d=Math.hypot(x-px,z-pz);if(!best||d<best.distance)best={distance:d,x:px,z:pz,segment:i,t};}return best;}

// Planning target, not a certification: four par threes, ten fours, four fives.
export const PAR_PLAN=[3,3,5,5,4,4,4,3,4,4,5,4,4,3,4,4,5,4];

export function courseProgress(index){
 const current=COURSES[index];if(!current)throw new RangeError('Unknown hole');const next=COURSES[index+1]||null;
 return{current,next,currentLabel:'Hole '+current.number+' — '+current.name,nextLabel:next?'Hole '+next.number+' — '+next.name:null,
 completion:next?'Next: Hole '+next.number+' — '+next.name+'. Follow the crossing beyond this green.':'Round complete. All '+COURSES.length+' holes are open to explore.',
 button:next?'Walk to hole '+next.number:'Round complete'};
}
