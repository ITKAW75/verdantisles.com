import {CABIN} from './cabin-layout.js';
import {ground} from './physics.js';
// Original restrained log construction, with scanned timber surfaces and open interior.
export function buildTimberCabin(renderer,place,colliders){
 const {B,scene}=renderer,{x,z,floor}=CABIN,groups=new Map(),V=(a,b,c)=>new B.Vector3(a,b,c);
 const surface=(name,id,color)=>{const m=renderer.material(name,color,id+'-Diffuse.jpg',.94);m.bumpTexture=renderer.texture(id+'-nor_gl.jpg');m.bumpTexture.level=.55;return m;};
 const logs=surface('cabin-weathered-logs','dark_wooden_planks',[1.03,.96,.82]),trim=surface('cabin-aged-trim','weathered_peeling_timber',[.67,.62,.50]),roof=surface('cabin-timber-roof','roof_planks',[.61,.55,.43]),damp=surface('cabin-damp-sill','moss_wood',[.60,.63,.46]);
 function add(m,mat){m.material=mat;m.isPickable=false;m.receiveShadows=true;if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push(m);return m;}
 function box(name,dx,dy,dz,w,h,d,mat=logs){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x+dx,floor+dy,z+dz);const p=m.getVerticesData('position'),n=m.getVerticesData('normal'),uv=[];for(let i=0;i<p.length;i+=3)uv.push((Math.abs(n[i])>.5?p[i+2]:p[i])*.6,(Math.abs(n[i+1])>.5?p[i+2]:p[i+1])*.6);m.setVerticesData('uv',uv);return add(m,mat);}
 function beam(name,a,b,r,mat=logs){const av=V(x+a[0],floor+a[1],z+a[2]),bv=V(x+b[0],floor+b[1],z+b[2]),length=B.Vector3.Distance(av,bv),m=B.MeshBuilder.CreateCylinder(name,{height:length,diameterTop:r*1.91,diameterBottom:r*2,tessellation:12,subdivisions:1},scene);m.position=av.add(bv).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(V(0,1,0),bv.subtract(av).normalize(),new B.Quaternion());const uv=m.getVerticesData('uv');for(let i=0;i<uv.length;i+=2){uv[i]*=2;uv[i+1]*=length*.10;}m.setVerticesData('uv',uv);return add(m,mat);}
 // Level floor, generous doorway and porch; no collision proxy across the entrance.
 for(let i=0;i<30;i++)box('cabin-floor-board',-5.32+i*.367,-.09,1.15,.369,.18,10.3,logs);
 box('cabin-front-sill',0,-.23,6.2,11.3,.30,.28,damp);box('cabin-rear-sill',0,-.23,-4,11.3,.30,.4,damp);
 for(const dx of [-5.35,5.35])box('cabin-side-sill',dx,-.24,1.1,.4,.35,10.6,damp);
 // Each horizontal course is separately staggered at the corners.
 for(let row=0;row<11;row++){const y=.20+row*.32,r=.18+(row%3)*.005,over=row%2?.12:0;
  beam('rear-log',[-5.65-over,y,-3.95],[5.65+over,y,-3.95],r);
  for(const side of [-1,1]){
   const sx=side*5.4;
   if(row>=4&&row<=7){beam('side-log-window-a',[sx,y,-4.18-over],[sx,y,-1.55],r);beam('side-log-window-b',[sx,y,.65],[sx,y,4.2+over],r);}
   else beam('side-log',[sx,y,-4.18-over],[sx,y,4.2+over],r);
  }
  if(row<8){beam('front-left-log',[-5.7,y,4],[ -1.25,y,4],r);beam('front-right-log',[1.25,y,4],[5.7,y,4],r);}
  else beam('front-header-log',[-5.7,y,4],[5.7,y,4],r);
 }
 for(const side of [-1,1]){beam('door-jamb',[side*1.24,0,4.03],[side*1.24,2.7,4.03],.15,trim);for(const dz of [-1.5,.6])beam('window-jamb',[side*5.42,1.25,dz],[side*5.42,2.63,dz],.11,trim);for(const y of [1.22,2.66])beam('window-sill',[side*5.42,y,-1.65],[side*5.42,y,.76],.12,trim);}
 // Clear, dark window openings provide depth; internal cross bars, no opaque fake glass.
 for(const side of [-1,1]){beam('window-mullion',[side*5.42,1.25,-.47],[side*5.42,2.63,-.47],.035,trim);beam('window-crossbar',[side*5.42,1.94,-1.55],[side*5.42,1.94,.65],.035,trim);}
 const rise=2.15,run=6.25,length=Math.hypot(run,rise),angle=Math.atan2(rise,run);
 for(const side of [-1,1]){const m=box('cabin-roof',side*run/2,4.54,1.1,length,.19,11.35,roof);m.rotation.z=-side*angle;}
 beam('ridge-beam',[0,5.65,-4.72],[0,5.65,6.93],.21,trim);
 for(const dz of [-4.57,4.1,6.77])for(const side of [-1,1])beam('gable-rafter',[0,5.64,dz],[side*6.25,3.46,dz],.16,trim);
 for(const dx of [-5.4,5.4])beam('porch-post',[dx,-.2,6.2],[dx,3.53,6.2],.20,trim);
 // Planked gables close the interior to the roof; façade beams break up repetition.
 for(const dz of [-4,4])for(let i=-14;i<=14;i++){const dx=i*.37,h=2.02-Math.abs(dx)*.344;if(h>0)box('gable-board',dx,3.47+h/2,dz,.355,h,.12,trim);}
 for(const dx of [-5.38,5.38])for(const dz of [-4.05,4.05])beam('corner-post',[dx,-.1,dz],[dx,3.55,dz],.22,trim);
 // Broad low approach stair, rooted into the terrain.
 for(let i=0;i<3;i++){const dz=6.6+i*.43,top=floor-.1-i*.09,base=Math.min(ground(x,z+dz)-.12,top-.15);const m=B.MeshBuilder.CreateBox('cabin-porch-step',{width:3.5,height:top-base,depth:.5},scene);m.position.set(x,(top+base)/2,z+dz);add(m,logs);}
 function wall(cx,cz,w,d){colliders.push({id:'cabin-wall',x:x+cx,z:z+cz,r:Math.hypot(w,d)/2,height:4,polygon:[{x:x+cx-w/2,z:z+cz-d/2},{x:x+cx+w/2,z:z+cz-d/2},{x:x+cx+w/2,z:z+cz+d/2},{x:x+cx-w/2,z:z+cz+d/2}]});}
 wall(0,-4,11.4,.5);wall(-5.4,0,.5,8);wall(5.4,0,.5,8);wall(-3.48,4,4.5,.5);wall(3.48,4,4.5,.5);
 for(const dx of [-5.4,5.4])colliders.push({id:'cabin-porch-post',x:x+dx,z:z+6.2,r:.22,height:4});
 const merged=[];for(const [mat,parts]of groups){const m=B.Mesh.MergeMeshes(parts,true,true,undefined,false,false);m.name=mat.name+'-structure';m.material=mat;m.receiveShadows=true;m.isPickable=false;renderer.shadowCaster(m);merged.push(m);}
 // A work table inside holds the collectible, with a lit lantern beside it.
 const table=place('wooden_table_02',x-2.9,floor,z-1.9,.85,.13);colliders.push({id:'cabin-worktable',x:x-2.9,z:z-1.9,r:.72,height:1.05});place('wooden_lantern_01',x-4.1,floor+.015,z+5.1,.54,.6);
 const light=new B.PointLight('cabin-porch-glow',V(x-4.1,floor+.4,z+5.1),scene);light.diffuse=new B.Color3(1,.65,.26);light.intensity=1.5;light.range=7;
 const footHeight=(px,pz)=>Math.abs(px-x)<5.6&&pz>z-4.2&&pz<z+6.35?floor:Math.abs(px-x)<1.8&&pz>=z+6.35&&pz<z+7.7?Math.max(ground(px,pz),floor-.1-Math.floor((pz-z-6.35)/.43)*.09):null;
 return{meshes:merged,footHeight,rangePickup:{x:x-2.9,y:floor+1.08,z:z-1.9},update(eye){light.setEnabled(Math.hypot(eye.x-x,eye.z-z)<70);},report:{x,z,floor,openDoorWidth:2.5,materialGroups:merged.length}};
}
