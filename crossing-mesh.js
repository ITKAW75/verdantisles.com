// Independent face vertices keep stone sides crisp and give vertical faces real UV area.
export function crossingMeshData(frames,center,width,bottom,top,{abutments=false}={}){
 const p=[],i=[],uv=[];let distance=0;
 const point=(f,d,h)=>[f.x+f.nx*d,f.y+h+(f.crossHeight?.(d)||0),f.z+f.nz*d];
 function quad(points,coords){const k=p.length/3;for(let j=0;j<4;j++){p.push(...points[j]);uv.push(...coords[j]);}i.push(k,k+1,k+2,k,k+2,k+3);}
 const left=center-width/2,right=center+width/2;
 for(let n=1;n<frames.length;n++){
  const a=frames[n-1],b=frames[n],next=distance+Math.hypot(b.x-a.x,b.z-a.z),lower=f=>abutments&&f.ground!==undefined?Math.min(f.y+bottom,f.ground-.25)-f.y:bottom;
  const al=point(a,left,top),ar=point(a,right,top),bl=point(b,left,top),br=point(b,right,top),ab=lower(a),bb=lower(b);
  const strips=(a.crossHeight||b.crossHeight)&&center===0?8:1;
  for(let k=0;k<strips;k++){const l=left+width*k/strips,r=left+width*(k+1)/strips;quad([point(a,l,top),point(a,r,top),point(b,r,top),point(b,l,top)],[[l-left,distance],[r-left,distance],[r-left,next],[l-left,next]]);}
  quad([point(a,left,ab),point(b,left,bb),point(b,right,bb),point(a,right,ab)],[[0,distance],[0,next],[width,next],[width,distance]]);
  quad([al,bl,point(b,left,bb),point(a,left,ab)],[[distance,a.y+top],[next,b.y+top],[next,b.y+bb],[distance,a.y+ab]]);
  quad([ar,point(a,right,ab),point(b,right,bb),br],[[distance,a.y+top],[distance,a.y+ab],[next,b.y+bb],[next,b.y+top]]);
  distance=next;
 }
 for(const f of [frames[0],frames.at(-1)]){const low=abutments&&f.ground!==undefined?Math.min(f.y+bottom,f.ground-.25)-f.y:bottom;quad([point(f,left,top),point(f,left,low),point(f,right,low),point(f,right,top)],[[0,top],[0,low],[width,low],[width,top]]);}
 return{p,i,uv:uv.map(n=>n*.45)};
}

// Fit only raised shore ends. Crossfall fades into the existing level deck over 8 m.
// The same sampled surface drives walking; neither fairways nor terrain are edited.
export function fitCrossingEnds(frames,ground,width,length=8){
 const distance=[0];for(let i=1;i<frames.length;i++)distance.push(distance.at(-1)+Math.hypot(frames[i].x-frames[i-1].x,frames[i].z-frames[i-1].z));
 const needs=f=>Math.max(...[-.5,0,.5].map(u=>Math.abs(f.y-ground(f.x+f.nx*width*u,f.z+f.nz*width*u))))>.10;
 const ends=[needs(frames[0]),needs(frames.at(-1))],total=distance.at(-1);
 for(let i=0;i<frames.length;i++){const f=frames[i],d=Math.min(ends[0]?distance[i]:Infinity,ends[1]?total-distance[i]:Infinity);if(d>=length)continue;const t=d/length,w=1-t*t*(3-2*t),g=ground(f.x,f.z);f.y=f.y*(1-w)+(g+.025)*w;
  // Piecewise linear samples match the rendered eight-strip deck exactly.
  const heights=Array.from({length:9},(_,k)=>{const u=(k/8-.5)*width;return w*(ground(f.x+f.nx*u,f.z+f.nz*u)-g);});
  f.crossHeight=u=>{const v=Math.max(0,Math.min(8,(u/width+.5)*8)),k=Math.min(7,Math.floor(v));return heights[k]+(heights[k+1]-heights[k])*(v-k);};
 }
 return ends;
}
export function crossingWalkHeight(a,b,t,x,z){const cx=a.x+(b.x-a.x)*t,cz=a.z+(b.z-a.z)*t,nx=a.nx+(b.nx-a.nx)*t,nz=a.nz+(b.nz-a.nz)*t,u=((x-cx)*nx+(z-cz)*nz)/(nx*nx+nz*nz);return a.y+(b.y-a.y)*t+(a.crossHeight?.(u)||0)*(1-t)+(b.crossHeight?.(u)||0)*t;}

export function crossingPierData(frames,index,width,depth,deckThickness){
 const f=frames[index],p=[],i=[],uv=[],corners=[];
 function underside(x,z){let best=Infinity,y=f.y;for(let j=1;j<frames.length;j++){const a=frames[j-1],b=frames[j],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),dist=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(dist<best){best=dist;y=a.y+(b.y-a.y)*t;}}return y-deckThickness+.02;}
 for(const [a,b]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=f.x+f.nx*a*width/2-f.nz*b*depth/2,z=f.z+f.nz*a*width/2+f.nx*b*depth/2;corners.push([x,underside(x,z),z]);}
 function quad(q,tex){const k=p.length/3;for(let j=0;j<4;j++){p.push(...q[j]);uv.push(...tex[j]);}i.push(k,k+1,k+2,k,k+2,k+3);}
 quad(corners,[[0,0],[width,0],[width,depth],[0,depth]]);for(let n=0;n<4;n++){const a=corners[n],b=corners[(n+1)%4],len=Math.hypot(b[0]-a[0],b[2]-a[2]);quad([a,b,[b[0],-6.8,b[2]],[a[0],-6.8,a[2]]],[[0,a[1]],[len,b[1]],[len,-6.8],[0,-6.8]]);}
 return{p,i,uv:uv.map(v=>v*.45)};
}

// A common sign design keeps lettering, proportions and posts consistent between holes.
export function courseSign(renderer,name,x,y,z,angle,title,subtitle){
 const {B,scene}=renderer,root=new B.TransformNode(name,scene),wood=renderer.material(name+'-wood',[.19,.13,.07],null,.97);root.position.set(x,y,z);root.rotation.y=angle;
 for(const dx of [-.76,.76]){const m=B.MeshBuilder.CreateBox(name+'-post',{width:.13,height:1.75,depth:.13},scene);m.parent=root;m.position.set(dx,.825,0);m.material=wood;renderer.shadowCaster(m);}
 const board=B.MeshBuilder.CreateBox(name+'-board',{width:2.2,height:.87,depth:.15},scene);board.parent=root;board.position.y=2.02;board.material=wood;renderer.shadowCaster(board);
 const face=B.MeshBuilder.CreatePlane(name+'-face',{width:2.08,height:.75},scene),texture=new B.DynamicTexture(name+'-letters',{width:1024,height:384},scene,false),ctx=texture.getContext();ctx.fillStyle='#243a2f';ctx.fillRect(0,0,1024,384);ctx.fillStyle='#e6ddbd';ctx.textAlign='center';ctx.font='62px Georgia';ctx.fillText(title,512,155);ctx.font='40px Georgia';ctx.fillText(subtitle,512,252);texture.update();texture.uScale=-1;texture.uOffset=1;
 const mat=new B.StandardMaterial(name+'-text',scene);mat.diffuseTexture=texture;mat.emissiveTexture=texture;mat.emissiveColor=new B.Color3(.8,.8,.8);mat.disableLighting=true;face.parent=root;face.position.set(0,2.02,.081);face.rotation.y=Math.PI;face.material=mat;for(const m of root.getChildMeshes())m.isPickable=false;return root;
}

export function stoneJoints(renderer,material){
 const {B}=renderer;
 class StoneJoints extends B.MaterialPluginBase{getClassName(){return "VerdantStoneJoints";}
  constructor(){super(material,'StoneJoints',220,{});this._enable(true);}
  getCustomCode(type){return type==='fragment'?{CUSTOM_FRAGMENT_UPDATE_ALBEDO:`
   vec2 stoneUV=vAlbedoUV*2.22222;float stoneRow=floor(stoneUV.y/.72);vec2 cell=vec2(stoneUV.x/1.55+mod(stoneRow,2.)*.5,stoneUV.y/.72);vec2 edge=abs(fract(cell)-.5);vec2 aa=max(fwidth(cell),vec2(.001));float joint=max(smoothstep(.485-aa.x,.485+aa.x,edge.x),smoothstep(.478-aa.y,.478+aa.y,edge.y));float variation=.9+.12*fract(sin(dot(floor(cell),vec2(12.9898,78.233)))*43758.5453);surfaceAlbedo*=mix(variation,.52,joint*.7);
  `}:null;}
 }
 new StoneJoints();
}

// Separate fitted foundations under the two feet of a scanned gate; keep its opening clear.
export function seatGateFeet(renderer,gate,material,mesh,ground){
 const {B}=renderer,angle=gate.rotation.y-Math.PI/2,nx=Math.cos(angle),nz=-Math.sin(angle),sides=[[],[]],base=gate.position.y;
 for(const m of gate.getChildMeshes()){const p=m.getVerticesData('position')||[],world=m.computeWorldMatrix(true);for(let i=0;i<p.length;i+=3){const q=B.Vector3.TransformCoordinates(new B.Vector3(p[i],p[i+1],p[i+2]),world);if(q.y>base+.7)continue;const u=(q.x-gate.position.x)*nx+(q.z-gate.position.z)*nz;if(Math.abs(u)<1)continue;sides[u<0?0:1].push([q.x,q.z]);}}
 for(const points of sides){if(points.length<3)continue;points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of [...points].reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}const hull=lo.slice(0,-1).concat(hi.slice(0,-1)),p=[],ix=[],uv=[],top=base+.15;let along=0;
  for(let j=0;j<hull.length;j++){const a=hull[j],b=hull[(j+1)%hull.length],bottom=Math.min(ground(...a),ground(...b),base-.18)-.2,k=p.length/3,len=Math.hypot(b[0]-a[0],b[1]-a[1]);p.push(a[0],top,a[1],a[0],bottom,a[1],b[0],bottom,b[1],b[0],top,b[1]);uv.push(along*.45,top*.45,along*.45,bottom*.45,(along+len)*.45,bottom*.45,(along+len)*.45,top*.45);ix.push(k,k+1,k+2,k,k+2,k+3);along+=len;}
  const k=p.length/3;for(const [x,z]of hull){p.push(x,top,z);uv.push(x*.45,z*.45);}for(let j=1;j<hull.length-1;j++)ix.push(k,k+j,k+j+1);const m=mesh('gate-fitted-footing',p,ix,material,null,uv);m.freezeWorldMatrix();
 }
}
