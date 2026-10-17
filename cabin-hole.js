import {CABIN,CABIN_ROUTE,CABIN_ENTRY,CABIN_PIN_BRIDGE,CABIN_LENGTH,cabinNearest,cabinPoint,cabinMasks,cabinLandRadius,cabinGreenRadius,cabinDeckHeight} from './cabin-layout.js';
import {COURSES} from './courses.js';
import {ground,slope,surface} from './physics.js';
import {groundTree,sceneryFootprint} from './forest.js';
import {buildGolfAssets} from './golf-assets.js';
import {fitCrossingEnds,crossingWalkHeight,courseSign,crossingMeshData,crossingPierData} from './crossing-mesh.js';
import {cabinTurf} from './cabin-turf.js';
import {buildTimberCabin} from './timber-cabin.js';
import {buildRangePickup} from './rangefinder.js';

export function buildCabinHole(renderer,place,mesh,colliders){
 const {B,scene}=renderer,course=COURSES[4],cup=course.cup,before=new Set(renderer.shadows.getShadowMap().renderList),roots=[];
 const turf=cabinTurf(renderer),data={p:[],i:[],uv:[],n:[],m:[]},cache=new Map();
 function vertex(x,z){const key=x+','+z;if(cache.has(key))return cache.get(key);const n=data.p.length/3,s=slope(x,z),len=Math.hypot(s.x,1,s.z);data.p.push(x,ground(x,z),z);data.n.push(-s.x/len,1/len,-s.z/len);data.uv.push(x*.25,z*.25);data.m.push(...cabinMasks(x,z));cache.set(key,n);return n;}
 const tri=(a,b,c)=>data.i.push(vertex(...a),vertex(...b),vertex(...c));
 for(let z=-1514;z<-1206;z++)for(let x=1137;x<1356;x++){if(cabinLandRadius(x+.5,z+.5)>1.13)continue;if(x>=cup.x-1&&x<cup.x+1&&z>=cup.z-1&&z<cup.z+1)continue;tri([x,z],[x,z+1],[x+1,z+1]);tri([x,z],[x+1,z+1],[x+1,z]);}
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2,pt=(a,r)=>[cup.x+Math.cos(a)*r,cup.z+Math.sin(a)*r],out=a=>pt(a,1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a))));tri(pt(a,.275),out(a),out(b));tri(pt(a,.275),out(b),pt(b,.275));}
 const terrain=mesh('cabin-par-four-terrain',data.p,data.i,turf,null,data.uv);terrain.setVerticesData('normal',data.n);terrain.setVerticesData('courseMasks',data.m,false,4);terrain.freezeWorldMatrix();renderer.removeShadowCaster(terrain);
 const metal=renderer.material('cabin-cup-brass',[.64,.46,.20],null,.4),dark=renderer.material('cabin-cup-dark',[.01,.014,.011],null,1),cy=ground(cup.x,cup.z);metal.metallic=.6;
 const wall=B.MeshBuilder.CreateCylinder('cabin-cup-wall',{height:.52,diameter:.55,tessellation:40,sideOrientation:B.Mesh.BACKSIDE,cap:B.Mesh.NO_CAP},scene);wall.position.set(cup.x,cy-.26,cup.z);wall.material=dark;wall.isPickable=false;
 const bottom=B.MeshBuilder.CreateDisc('cabin-cup-bottom',{radius:.275,tessellation:40,sideOrientation:B.Mesh.DOUBLESIDE},scene);bottom.rotation.x=Math.PI/2;bottom.position.set(cup.x,cy-.52,cup.z);bottom.material=dark;bottom.isPickable=false;
 const flag=B.MeshBuilder.CreateCylinder('cabin-flagpole',{height:4.3,diameter:.064,tessellation:12},scene);flag.position.set(cup.x,cy+2.15,cup.z);flag.material=metal;flag.isPickable=false;renderer.shadowCaster(flag);
 const wood=renderer.material('cabin-crossing-wood',[.70,.65,.53],'dark_wooden_planks-Diffuse.jpg',.93);wood.bumpTexture=renderer.texture('dark_wooden_planks-nor_gl.jpg');wood.bumpTexture.level=.4;
 // Continuous contact surfaces; rail/support pieces use the approved scanned pier.
 const bridges=[];
 function bridge(name,points,useScanned){
  const frames=[],distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const total=distances.at(-1),start=ground(...points[0])+.045,end=ground(...points.at(-1))+.045;
  // Piecewise heights include the actual bank heights to avoid floating approaches.
  const hs=points.map((p,i)=>Math.max(ground(...p)+.045,start+(end-start)*distances[i]/total));
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len);for(let j=0;j<n;j++){const t=j/n;frames.push({x:a[0]+dx*t,z:a[1]+dz*t,y:hs[i]+(hs[i+1]-hs[i])*t,nx:-dz/len,nz:dx/len});}}frames.push({...frames.at(-1),x:points.at(-1)[0],z:points.at(-1)[1],y:hs.at(-1)});
  for(const p of frames)p.y=Math.max(p.y,ground(p.x,p.z)+.045,ground(p.x+p.nx*1.35,p.z+p.nz*1.35)+.025,ground(p.x-p.nx*1.35,p.z-p.nz*1.35)+.025);const path=frames.map(f=>[f.x,f.z]);for(let i=0;i<frames.length;i++){const p=frames[i];if(i<5||i>frames.length-6)p.ground=Math.min(ground(p.x,p.z),ground(p.x+p.nx*1.5,p.z+p.nz*1.5),ground(p.x-p.nx*1.5,p.z-p.nz*1.5));}
  for(let i=0;i<frames.length;i++){const a=frames[Math.max(0,i-1)],b=frames[Math.min(frames.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z);frames[i].nx=-(b.z-a.z)/len;frames[i].nz=(b.x-a.x)/len;}
  // Check the entire deck width at shore transitions, not only its centerline.
  for(let i=1;i<frames.length;i++){const a=frames[i-1],b=frames[i];let lift=0;for(const t of [0,.25,.5,.75,1])for(const side of [-1.325,0,1.325]){const x=a.x+(b.x-a.x)*t+(a.nx+(b.nx-a.nx)*t)*side,z=a.z+(b.z-a.z)*t+(a.nz+(b.nz-a.nz)*t)*side;lift=Math.max(lift,ground(x,z)+.08-(a.y+(b.y-a.y)*t));}a.y+=lift;b.y+=lift;}
  fitCrossingEnds(frames,ground,2.65);
  const d=crossingMeshData(frames,0,2.65,-.20,0);mesh(name+'-deck',d.p,d.i,wood,null,d.uv);
  for(let i=1;i<frames.length-1;i+=1){const p=frames[i];for(const side of [-1,1])colliders.push({id:'cabin-bridge-rail',x:p.x+p.nx*side*1.4,z:p.z+p.nz*side*1.4,r:.12,height:1.1});}
  if(useScanned){
   const count=Math.ceil(total/3.44),spacing=total/count;
   for(let j=0;j<count;j++){const target=(j+.5)*spacing;let i=1,along=0;while(i<frames.length-1){const len=Math.hypot(frames[i].x-frames[i-1].x,frames[i].z-frames[i-1].z);if(along+len>=target)break;along+=len;i++;}const a=frames[i-1],b=frames[i],len=Math.hypot(b.x-a.x,b.z-a.z),t=(target-along)/len,cx=a.x+(b.x-a.x)*t,cz=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t,angle=Math.atan2(b.x-a.x,b.z-a.z),h=4.95;
    const r=place('modular_wooden_pier',cx,y-h*.7526-.05,cz,h,angle,true);r.scaling.z*=spacing/(3.5174*h/4.266);roots.push(r);
    // Scanned wood remains rigid; the continuous deck carries the exact walk height.
    if(j%2===0){const f=frames[Math.min(frames.length-1,i)],pd=crossingPierData(frames,Math.min(frames.length-2,i),1.9,.32,.22);mesh(name+'-timber-support',pd.p,pd.i,wood,null,pd.uv);}
   }
  }else{
   for(const side of [-1,1]){const d=crossingMeshData(frames,side*1.38,.11,.72,.86);mesh(name+'-handrail',d.p,d.i,wood,null,d.uv);}
   for(let i=2;i<frames.length-2;i+=5){const p=frames[i];for(const side of [-1,1]){const pole=B.MeshBuilder.CreateCylinder(name+'-post',{height:p.y+7.85,diameter:.23,tessellation:10},scene);pole.position.set(p.x+p.nx*side*1.38,(p.y-5.75)/2,p.z+p.nz*side*1.38);pole.material=wood;pole.isPickable=false;renderer.shadowCaster(pole);}}
  }
  const height=(x,z)=>{const p=cabinNearest(x,z,path);return p.distance<1.29?crossingWalkHeight(frames[p.segment],frames[p.segment+1],p.t,x,z):null;};bridges.push({height,path});return frames;
 }
 bridge('timberglass-entry',CABIN_ENTRY,false);bridge('timberglass-pin-bridge',CABIN_PIN_BRIDGE,true);
 function prop(id,x,z,h,angle=0,y=null){const tree=/tree|sapling/.test(id),rock=/rock/.test(id),root=place(id,x,y??ground(x,z)-(tree?.1:rock?h*.25:.025),z,h,angle,true);if(tree)groundTree(root,B);if(rock){root.computeWorldMatrix(true);const bounds=root.getHierarchyBoundingVectors(true),gaps=[];for(const m of root.getChildMeshes()){const ps=m.getVerticesData('position');if(!ps)continue;const w=m.computeWorldMatrix(true);for(let j=0;j<ps.length;j+=9){const q=B.Vector3.TransformCoordinates(new B.Vector3(ps[j],ps[j+1],ps[j+2]),w);if(q.y<bounds.min.y+h*.3)gaps.push(q.y-ground(q.x,q.z));}}gaps.sort((a,b)=>a-b);root.position.y-=Math.max(0,(gaps[Math.floor(gaps.length*.93)]||0)+.18);root.computeWorldMatrix(true);}roots.push(root);if(!/fern|moss|grass/.test(id))colliders.push(sceneryFootprint(root,id,B));return root;}
 const cabin=buildTimberCabin(renderer,place,colliders),pickup=buildRangePickup(renderer,cabin.rangePickup);const {x:cx,z:cz,floor}=CABIN;
 // Distinct practical groupings, with a clear doorway and walking strip.
 prop('painted_wooden_bench',cx+3.1,cz+5.25,1.0,0,floor+.01);
 prop('wooden_stool_02',cx-3.8,cz+.2,.55,.4,floor+.01);
 prop('wooden_bucket_02',cx+4.6,cz+5.4,.45,.9,floor+.01);
 prop('wooden_barrels_01',cx+7,cz+2.6,1.55,.6);
 prop('wooden_ladder_02',cx+7.25,cz-2.0,2.4,Math.PI/2);
 prop('wooden_picnic_table',cx-2,cz+12,.83,.30);
 const choppingStump=prop('tree_stump_02',cx-7.1,cz+4.3,.78,.8);
 const axe=prop('wooden_axe_02',cx-7.05,cz+4.35,.62,.8,ground(cx-7.05,cz+4.35)+.44);axe.rotation.z=2.15;axe.computeWorldMatrix(true);const bladeBounds=axe.getHierarchyBoundingVectors(true),stumpBounds=choppingStump.getHierarchyBoundingVectors(true);axe.position.y+=stumpBounds.max.y-.055-bladeBounds.min.y;
 const saw=prop('handsaw_wood',cx-3.2,cz-1.85,.165,.3,floor+.87);saw.rotation.z=Math.PI/2;saw.computeWorldMatrix(true);const sawBounds=saw.getHierarchyBoundingVectors(true);saw.position.y+=floor+.86-sawBounds.min.y;
 prop('wooden_lantern_01',1188,-1253,.60,.4);
 let seed=29029;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<58;i++){const p=cabinPoint(8+rand()*(CABIN_LENGTH-80)),side=i%2?1:-1,off=25+rand()*8,x=p.x+p.nx*side*off,z=p.z+p.nz*side*off;if(ground(x,z)<.5||surface(x,z)!=='rough'||cabinGreenRadius(x,z)<1.45||Math.hypot(x-cx,z-cz)<15||bridges.some(b=>cabinNearest(x,z,b.path).distance<5)||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+3))continue;prop(i%5===0?'tree_small_02':i%4===0?'fir_sapling':'pine_tree_01',x,z,i%5===0?10:i%4===0?8:45+rand()*16,rand()*6.28);}
 for(let i=0;i<120;i++){const p=cabinPoint(rand()*(CABIN_LENGTH-64)),side=i%2?1:-1,x=p.x+p.nx*side*(20+rand()*15),z=p.z+p.nz*side*(20+rand()*15);if(surface(x,z)!=='rough'||ground(x,z)<.2||cabinGreenRadius(x,z)<1.35||Math.hypot(x-cx,z-cz)<10||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.75))continue;prop(i%4?'fern_02':'grass_bermuda_01',x,z,i%4?.6+rand()*.4:.3+rand()*.2,rand()*6.28);}
 for(let i=0;i<15;i++){const p=cabinPoint(i/14*(CABIN_LENGTH-64)),side=i%2?1:-1,x=p.x+p.nx*side*39,z=p.z+p.nz*side*39;if(bridges.some(b=>cabinNearest(x,z,b.path).distance<9)||Math.hypot(x-cx,z-cz)<12)continue;prop(i%3?'rock_moss_set_02':'coast_land_rocks_02',x,z,2.4+rand()*2,rand()*6.28);}
 for(const [x,z,h]of [[1285,-1476,2.8],[1323,-1488,3],[1310,-1502,2.1],[1290,-1497,2.4]])prop('rock_moss_set_02',x,z,h,rand()*6.28);
 for(const [dx,dz,h,id] of [[-8.6,-3.1,.65,'fern_02'],[-9.1,-2.3,.38,'grass_bermuda_01'],[-8.2,-4.0,.48,'fern_02'],[-8.8,7.6,.6,'fern_02'],[-9.4,8.1,.32,'grass_bermuda_01'],[9.8,-6.5,.6,'fern_02'],[10.4,-5.9,.43,'fern_02'],[9.3,-7.1,.3,'grass_bermuda_01'],[-4.2,-7.4,.62,'fern_02'],[-3.5,-8.1,.36,'grass_bermuda_01']])prop(id,cx+dx,cz+dz,h,rand()*6.28);
 courseSign(renderer,'timberglass-wayfinding',1164,ground(1164,-1164),-1164,.1,'TIMBERGLASS COVE','HOLE 5  /  PAR 4  >');colliders.push({id:'cabin-sign',x:1164,z:-1164,r:.85,height:2.5});
 const guides=buildGolfAssets(renderer,{x:1305,z:-1484,stretch:1,cup:course.cup,greenBounds:[-17,17,-15,15]});let shadowCell='';
 renderer.shadows.getShadowMap().renderList=[...before];
 return{terrain,cabin,pickup,guides,bridges,crossingHeight(x,z){for(const b of bridges){const y=b.height(x,z);if(y!==null)return y;}return cabin.footHeight(x,z);},update(eye,active,time){pickup.update(time);cabin.update(eye);if(!active){shadowCell='';return;}const x=Math.round(eye.x/65)*65,z=Math.round(eye.z/65)*65,key=x+','+z;if(key!==shadowCell){shadowCell=key;scene.getLightByName('afternoon-sun').position.set(x+50,90,z+75);renderer.shadows.getShadowMap().renderList=renderer.localShadowCasters(eye);renderer.bakeShadow();}},report:{name:course.name,par:4,yards:Math.round(CABIN_LENGTH/.9144),tee:course.tee,cup:course.cup,trees:roots.filter(r=>/tree|sapling/.test(r.name)).length,cabin:cabin.report,rangefinder:cabin.rangePickup}};
}
