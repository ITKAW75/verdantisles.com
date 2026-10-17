import {inCabin,cabinNearest,cabinPoint} from './cabin-layout.js';
import {highNearest,highPoint,inHighland} from './highland-layout.js';
import {keepPointAlong,KEEP_LENGTH,nearestKeepPath} from './fortress-layout.js';
import {COURSES} from './courses.js';
import {ground,surface} from './physics.js';

// Small pooled effects; no added lights, shadows, downloads or collision obstacles.
export function buildCourseMagic(renderer){
 const {B,scene}=renderer,V=(x,y,z)=>new B.Vector3(x,y,z),systems=[];
 const texture=new B.DynamicTexture('course-firefly-light',64,scene,false),ctx=texture.getContext(),g=ctx.createRadialGradient(32,32,0,32,32,31);
 g.addColorStop(0,'rgba(255,255,241,1)');g.addColorStop(.11,'rgba(245,255,191,.95)');g.addColorStop(.3,'rgba(197,239,184,.24)');g.addColorStop(1,'rgba(144,205,183,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);texture.update();
 function system(name,capacity){const p=new B.ParticleSystem(name,capacity,scene),warm=name.includes('-flag')||name.includes('celebration'),rough=name.includes('-rough'),tint=warm?[1,.89,.59]:rough?[.85,1,.48]:[.66,.95,.88];p.particleTexture=texture;p.color1=new B.Color4(...tint,.7);p.color2=new B.Color4(.55,.92,.87,.45);p.colorDead=new B.Color4(...tint,0);p.minSize=.045;p.maxSize=.10;p.minLifeTime=3;p.maxLifeTime=6;p.direction1=V(-.07,.04,-.06);p.direction2=V(.07,.15,.06);p.minEmitPower=.35;p.maxEmitPower=.8;p.updateSpeed=.016;p.addColorGradient(0,new B.Color4(...tint,0));p.addColorGradient(.25,new B.Color4(...tint,.65));p.addColorGradient(.7,new B.Color4(...tint,.35));p.addColorGradient(1,new B.Color4(...tint,0));return p;}
 for(const [index,c]of COURSES.entries())for(const kind of ['green','flag','rough','fairway']){
  const p=system('course-'+(index+1)+'-'+kind,kind==='rough'?20:kind==='green'?14:8),rate={green:1,flag:.5,rough:1.3,fairway:.45}[kind];
  p.emitter=V(c.cup.x,ground(c.cup.x,c.cup.z),c.cup.z);let seed=2301+index*91+kind.length*31;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  p.startPositionFunction=(_matrix,out)=>{let x=c.cup.x,z=c.cup.z,y;
   if(kind==='flag'){const a=rand()*6.28,r=.5+rand()*.7;x+=Math.cos(a)*r;z+=Math.sin(a)*r;y=1.3+rand()*2.6;}
   else if(kind==='green'){const a=rand()*6.28,r=2+rand()*7;x+=Math.cos(a)*r;z+=Math.sin(a)*r;y=.65+rand()*1.2;}
   else{for(let attempt=0;attempt<20;attempt++){const localZ=25-rand()*75,center=6*Math.sin(localZ*.045);x=(index?155:0)+center+(kind==='rough'?(rand()>.5?1:-1)*(15+rand()*7):(rand()-.5)*12);z=index?localZ*1.15-175:localZ;if(index===2){const route=keepPointAlong(nearestKeepPath(renderer.camera.position.x,renderer.camera.position.z).along+(rand()-.5)*65),side=kind==='rough'?(rand()>.5?1:-1)*(27+rand()*6):(rand()-.5)*22;x=route.x+route.nx*side;z=route.z+route.nz*side;}if(index===3){const route=highPoint(highNearest(renderer.camera.position.x,renderer.camera.position.z).along+(rand()-.5)*65),side=kind==='rough'?(rand()>.5?1:-1)*(25+rand()*5):(rand()-.5)*22;x=route.x+route.nx*side;z=route.z+route.nz*side;}if(index===4){const route=cabinPoint(cabinNearest(renderer.camera.position.x,renderer.camera.position.z).along+(rand()-.5)*50),side=kind==='rough'?(rand()>.5?1:-1)*26:(rand()-.5)*18;x=route.x+route.nx*side;z=route.z+route.nz*side;}if(surface(x,z)===kind)break;}y=.7+rand()*1.3;}
   out.set(x,ground(x,z)+y,z);
  };
  if(kind==='flag'){p.maxSize=.12;p.direction1=V(-.04,.12,-.04);p.direction2=V(.04,.26,.04);}
  p.emitRate=0;p.start();systems.push({p,rate,index,kind});
 }
 const keepFairies=[];for(const [j,distance]of [24,205,390].entries()){const p=keepPointAlong(distance),x=p.x+p.nx*(j%2?-24:24),z=p.z+p.nz*(j%2?-24:24);for(let i=0;i<2;i++){const m=B.MeshBuilder.CreatePlane('keep-wandering-fairy',{size:.16+i*.045},scene),mat=new B.StandardMaterial('keep-fairy-glow',scene);mat.diffuseTexture=texture;mat.opacityTexture=texture;mat.emissiveColor=new B.Color3(.65,1,.73);mat.disableLighting=true;mat.backFaceCulling=false;m.material=mat;m.billboardMode=B.Mesh.BILLBOARDMODE_ALL;m.isPickable=false;keepFairies.push({m,x,z,phase:j*2.7+i*1.4});}}
 const burst=system('cup-fairy-celebration',40);burst.emitRate=0;burst.minLifeTime=.65;burst.maxLifeTime=1.4;burst.minSize=.055;burst.maxSize=.13;burst.minEmitBox=V(-.12,0,-.12);burst.maxEmitBox=V(.12,.07,.12);burst.direction1=V(-.8,1,-.8);burst.direction2=V(.8,2,.8);burst.minEmitPower=.65;burst.maxEmitPower=1.1;burst.gravity=V(0,-.7,0);burst.addSizeGradient(0,.025);burst.addSizeGradient(.2,.06);burst.addSizeGradient(1,0);burst.start();
 // Stratified directions avoid a bright clump even with deterministic shot RNG.
 let burstIndex=0;burst.minSize=.03;burst.maxSize=.075;
 burst.startPositionFunction=(_world,out)=>{const a=burstIndex*2.399963;out.copyFrom(burst.emitter);out.x+=Math.cos(a)*.13;out.z+=Math.sin(a)*.13;};
 burst.startDirectionFunction=(_world,out)=>{const i=burstIndex++,a=i*2.399963,r=.45+(i%5)*.16;out.set(Math.cos(a)*r,1+(i%7)*.12,Math.sin(a)*r);};
 return{celebrate(cup){burst.reset();burstIndex=0;burst.emitter=V(cup.x,ground(cup.x,cup.z)+.12,cup.z);burst.manualEmitCount=24;burst.start();},reset(){burst.reset();},update(time,quality){const eye=renderer.camera.position;for(const f of keepFairies){const near=Math.hypot(eye.x-f.x,eye.z-f.z)<65;f.m.setEnabled(near);if(near){const a=time*.22+f.phase,x=f.x+Math.cos(a)*2.1,z=f.z+Math.sin(a*.8)*1.7;f.m.position.set(x,ground(x,z)+1.1+Math.sin(time*.63+f.phase)*.35,z);f.m.material.alpha=.42+.22*Math.sin(time*.9+f.phase);}}for(const {p,rate,index,kind}of systems){const c=COURSES[index],alongKeep=index===2&&(kind==='rough'||kind==='fairway')&&renderer.camera.position.x>200&&renderer.camera.position.z<-275,near=(index===4&&inCabin(eye.x,eye.z)&&(kind==='rough'||kind==='fairway'))||(index===3&&!inCabin(eye.x,eye.z)&&inHighland(eye.x,eye.z)&&(kind==='rough'||kind==='fairway'))||alongKeep||Math.hypot(eye.x-c.cup.x,eye.z-c.cup.z)<(kind==='rough'||kind==='fairway'?105:48);p.emitRate=near?rate*(quality===2?.35:1):0;}}};
}

// An original small hand-built sandcastle, shaded with the existing scanned beach sand.
export function buildSandcastle(renderer,x,z){
 const {B,scene}=renderer,parts=[],sand=renderer.material('weathered-sandcastle',[1,1,1],'cove-sand.jpg',1);
 // Compress the sand scan's dark markings into the beach's existing warm palette.
 class CastleSand extends B.MaterialPluginBase{getClassName(){return "VerdantCastleSand";}constructor(){super(sand,'CastleSand',210,{});this._enable(true);}getCustomCode(type){return type==='fragment'?{CUSTOM_FRAGMENT_UPDATE_ALBEDO:'surfaceAlbedo=mix(vec3(.55,.40,.22),vec3(.78,.65,.43),clamp(dot(surfaceAlbedo,vec3(.299,.587,.114))*1.7,0.,1.));'}:null;}}
 new CastleSand();
 sand.bumpTexture=renderer.texture('cove-sand-normal.jpg');sand.bumpTexture.level=.32;
 const base=ground(x,z),finish=(m,dx,dy,dz)=>{m.position.set(x+dx,base+dy,z+dz);m.material=sand;m.receiveShadows=true;m.isPickable=false;parts.push(m);return m;};
 const mound=finish(B.MeshBuilder.CreateSphere('castle-sand-foot',{diameter:1,segments:16},scene),0,-.07,0);mound.scaling.set(1.6,.24,1.4);
 for(const [dx,dz,h]of [[-.39,-.32,.46],[.39,-.32,.50],[-.39,.32,.39],[.39,.32,.43],[0,0,.64]]){
  const d=dx===0?.39:.26;finish(B.MeshBuilder.CreateCylinder('castle-eroded-tower',{height:h,diameterTop:d*.8,diameterBottom:d,tessellation:20,subdivisions:4},scene),dx,h/2-.035,dz);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2,m=finish(B.MeshBuilder.CreateBox('castle-crenellation',{width:.055,height:.055,depth:.065},scene),dx+Math.cos(a)*d*.31,h-.026,dz+Math.sin(a)*d*.31);m.rotation.y=-a;}
 }
 for(const [dx,dz,w,d]of [[0,-.32,.78,.11],[0,.32,.78,.11],[-.39,0,.11,.64],[.39,0,.11,.64]])finish(B.MeshBuilder.CreateBox('castle-low-wall',{width:w,height:.24,depth:d,subdivisions:5},scene),dx,.08,dz);
 const castle=B.Mesh.MergeMeshes(parts,true,true);castle.name='sanctuary-sandcastle';castle.material=sand;
 const p=castle.getVerticesData(B.VertexBuffer.PositionKind);for(let i=0;i<p.length;i+=3){const n=Math.sin(p[i]*39+p[i+2]*57)*Math.cos(p[i+1]*43);p[i]+=.005*n;p[i+1]+=.004*n;p[i+2]+=.004*n;}const normals=[];B.VertexData.ComputeNormals(p,castle.getIndices(),normals);castle.setVerticesData(B.VertexBuffer.PositionKind,p);castle.setVerticesData(B.VertexBuffer.NormalKind,normals);castle.refreshBoundingInfo();castle.isPickable=false;castle.receiveShadows=true;renderer.shadowCaster(castle);return castle;
}
