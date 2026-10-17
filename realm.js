import {buildCloudSky} from './cloud-sky.js';
import {courseSign} from './crossing-mesh.js';
import {buildCabinHole} from './cabin-hole.js';
import {inCabin} from './cabin-layout.js';
import {buildRoughDetail} from './rough-detail.js';
import {buildCartPickup} from './cart.js';
import {buildSceneryVisibility} from './visibility.js';
import {buildHighland} from './highlands.js';
import {inHighland} from './highland-layout.js';
import {buildJumpPickup} from './jump.js';
import {buildCourseMagic,buildSandcastle} from './course-magic.js';
import {buildFortress} from './fortress.js';
import {buildSpeedCoin} from './speed-coin.js';
import {buildSanctuary} from './sanctuary.js';
import {assetURL} from './babylon-render.js';
import {shoreHeight,walkableCoast,landscapeMaterial} from './landscape.js';
import {ground,slope,inside,HOLE,greenRadius,surface} from './physics.js';
import {plantingAllowed,beachTrail} from './scenery.js';
import {prepareTrunks,seatOnGround,sceneryFootprint,fitForestBase,groundTree} from './forest.js';
import {clearRockPlantOverlaps} from './placement-audit.js';
import {buildCoveWildlife} from './cove-wildlife.js';
import {buildForestIslets} from './islets.js';
import {buildGolfAssets} from './golf-assets.js';
import {buildContinuousBark} from './bark.js';
import {approvedAssets,softPlant,smallProp,inLandingClearing,buildLanding} from './landing.js';
export async function buildGarden(renderer){
 const {B,scene}=renderer,assets=buildGolfAssets(renderer),colliders=[],animated=[],detailMeshes=[],placements=[],sceneryItems=[];
 let seed=7219;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},V=(x,y,z)=>new B.Vector3(x,y,z);
 const mat=(name,c,file,rough)=>renderer.material(name,c,file,rough);
 const turf=landscapeMaterial(renderer),gold=mat('aged-brass',[.66,.46,.18],null,.36),cup=mat('cup-interior',[.012,.016,.013],null,1),liner=mat('cup-liner',[.3,.36,.31],null,.8);gold.metallic=.5;
 function finish(m,material,shadow=true){m.material=material;m.isPickable=false;m.receiveShadows=true;if(shadow)renderer.shadowCaster(m);return m;}
 function mesh(name,pos,indices,material,colors=null,uv=null){const m=new B.Mesh(name,scene),vd=new B.VertexData();vd.positions=pos;vd.indices=indices;vd.normals=[];B.VertexData.ComputeNormals(pos,indices,vd.normals,{useRightHandedSystem:true});if(colors)vd.colors=colors;if(uv)vd.uvs=uv;vd.applyToMesh(m);return finish(m,material);}
 const terrain={p:[],i:[],c:[],uv:[]},putting={p:[],i:[],c:[],uv:[]};
 function groundColor(x,z){const gr=greenRadius(x,z),fw=Math.abs(x-6*Math.sin(z*.045)),smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);},blend=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);let c=blend([.64,.75,.5],[.8,.95,.65],1-smooth(9,11,fw));c=blend(c,[.65,.8,.5],1-smooth(1.17,1.23,gr));c=blend(c,[.95,1.08,.76],1-smooth(.97,1.015,gr));const shade=.98+.02*Math.sin(z*.7);return c.map(n=>n*shade);}
 function triangle(a,b,c){const green=greenRadius((a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3)<1.02,d=green?putting:terrain;d.map??=new Map();const indices=[];for(const p of[a,b,c]){const key=p[0]+','+p[1];let k=d.map.get(key);if(k===undefined){k=d.p.length/3;d.map.set(key,k);d.p.push(p[0],shoreHeight(p[0],p[1]),p[1]);d.c.push(...groundColor(...p),1);d.uv.push(p[0]/4,p[1]/4);}indices.push(k);}d.i.push(...indices);}
 // A uniform half-metre grid has matching edges across the green/fringe.
 // Adaptive centroid subdivision previously left nonconforming T-junctions.
 for(let z=-100;z<82;z+=.5)for(let x=-52;x<76;x+=.5){if(shoreHeight(x+.25,z+.25)<-6.45)continue;if(x>=4&&x<6&&z>=-54&&z<-52)continue;triangle([x,z],[x,z+.5],[x+.5,z+.5]);triangle([x,z],[x+.5,z+.5],[x+.5,z]);}
 // A real annular patch bridges the square mesh opening to the circular cup.
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2,point=(t,r)=>[HOLE.x+Math.cos(t)*r,HOLE.z+Math.sin(t)*r],outer=t=>point(t,1/Math.max(Math.abs(Math.cos(t)),Math.abs(Math.sin(t))));triangle(point(a,.275),outer(a),outer(b));triangle(point(a,.275),outer(b),point(b,.275));}
 const land=mesh('contoured-fairway',terrain.p,terrain.i,turf,terrain.c,terrain.uv);land.freezeWorldMatrix();renderer.removeShadowCaster(land);const puttingMat=turf,greenMesh=mesh('dedicated-putting-green',putting.p,putting.i,puttingMat,putting.c,putting.uv);renderer.removeShadowCaster(greenMesh);
 // Preserve analytical normals for the existing putting slopes.
 const normals=[];for(let i=0;i<terrain.p.length;i+=3){const s={x:(shoreHeight(terrain.p[i]+.035,terrain.p[i+2])-shoreHeight(terrain.p[i]-.035,terrain.p[i+2]))/.07,z:(shoreHeight(terrain.p[i],terrain.p[i+2]+.035)-shoreHeight(terrain.p[i],terrain.p[i+2]-.035))/.07},l=Math.hypot(s.x,1,s.z);normals.push(-s.x/l,1/l,-s.z/l);}land.setVerticesData(B.VertexBuffer.NormalKind,normals);const gn=[];for(let i=0;i<putting.p.length;i+=3){const sl=slope(putting.p[i],putting.p[i+2]),len=Math.hypot(sl.x,1,sl.z);gn.push(-sl.x/len,1/len,-sl.z/len);}greenMesh.setVerticesData(B.VertexBuffer.NormalKind,gn);
 const cy=ground(HOLE.x,HOLE.z);const cupFloor=B.MeshBuilder.CreateDisc('dark-cup-bottom',{radius:.275,tessellation:64,sideOrientation:B.Mesh.DOUBLESIDE},scene);cupFloor.rotation.x=Math.PI/2;cupFloor.position.copyFromFloats(HOLE.x,cy-.53,HOLE.z);finish(cupFloor,cup,false);
 const wallP=[],wallI=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,x=HOLE.x+Math.cos(a)*.275,z=HOLE.z+Math.sin(a)*.275;wallP.push(x,ground(x,z)+.003,z,x,cy-.53,z);if(i<64){const j=i*2;wallI.push(j,j+1,j+3,j,j+3,j+2);}}mesh('recessed-cup-wall',wallP,wallI,liner);
 const rim=B.MeshBuilder.CreateTorus('cup-rim',{diameter:.568,thickness:.018,tessellation:64},scene);rim.position.copyFromFloats(HOLE.x,cy+.003,HOLE.z);finish(rim,liner,false);
 const pole=B.MeshBuilder.CreateCylinder('flagpole',{height:4.3,diameter:.064,tessellation:16},scene);pole.position.copyFromFloats(HOLE.x,cy+2.15,HOLE.z);finish(pole,gold);

 // Actual Poly Haven models, prepared as local self-contained GLBs.
 const modelIds=['pine_tree_01','fir_sapling_medium','jacaranda_tree','searsia_lucida','rock_moss_set_01','namaqualand_boulder_02','flower_heliophila','moon_rock_01','seadogs_compass','fern_02','wooden_lantern_01','wooden_crate_01','ship_pinnace','treasure_chest','namaqualand_boulder_04','namaqualand_boulder_06','grass_medium_01','moss_01','grass_bermuda_01',...approvedAssets,'wooden_picnic_table','painted_wooden_bench','handsaw_wood','wooden_ladder_02','ceremonial_gate','bunker_shovel','lambis_shell','coast_land_rocks_02','coast_land_rocks_03','coast_rocks_01','coast_rocks_05','wine_barrel_01','dead_tree_trunk_02'];
 const models=new Map();let loaded=0;
 // Limit concurrent GLB decoding so mobile does not hold all source buffers at once.
 let nextModel=0;
 await Promise.all(Array.from({length:3},async()=>{while(nextModel<modelIds.length){const id=modelIds[nextModel++],url=assetURL('polyhaven/'+id+'.glb');const c=await B.SceneLoader.LoadAssetContainerAsync('',url,scene,undefined,'.glb');prepareTrunks(c,B,id);if(id==='pine_tree_01'||id==='fir_sapling_medium')for(const m of c.materials)if(/trunk|bark|branches/.test(m.name))buildContinuousBark(renderer,m);models.set(id,c);loaded++;document.getElementById('enter').textContent=`Preparing the cove · ${loaded}/${modelIds.length}`;}}));

 function place(id,x,y,z,height,angle=0,shadow=true){
  const c=models.get(id),entry=c.instantiateModelsToScene(n=>id+'-'+n,false,{doNotInstantiate:node=>softPlant(id)||id==='sand_rocks_small_01'||id==='island_tree_02'||id==='moss_01'||/stump/.test(id)||(/tree|sapling/.test(id)&&/trunk|branches|bark/.test(node.material?.name||''))}),root=new B.TransformNode(id+'-placement',scene);
  for(const n of entry.rootNodes)n.parent=root;
  const children=root.getChildMeshes();let low=V(Infinity,Infinity,Infinity),high=V(-Infinity,-Infinity,-Infinity);
  for(const m of children){if(!m.getTotalVertices())continue;m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;low=B.Vector3.Minimize(low,b.minimumWorld);high=B.Vector3.Maximize(high,b.maximumWorld);m.isPickable=false;m.receiveShadows=true;if(shadow)renderer.shadowCaster(m);
   if(m.material){m.material.enableSpecularAntiAliasing=true;m.material.environmentIntensity=.72;
   if(id==='pine_tree_01'||id==='fir_sapling_medium'){m.material.albedoColor=new B.Color3(1.18,1.38,1.03);m.material.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHATEST;m.material.alphaCutOff=.35;}
   if(id==='jacaranda_tree'&&m.material.name.includes('leaves')&&!m.material.roseTint){const mm=m.material;class RoseCanopy extends B.MaterialPluginBase{getClassName(){return "VerdantRoseCanopy";}constructor(){super(mm,'RoseCanopy',200,{});this._enable(true);}getCustomCode(type){return type==='fragment'?{CUSTOM_FRAGMENT_UPDATE_ALBEDO:'float petalShade=dot(surfaceAlbedo,vec3(.299,.587,.114));surfaceAlbedo=vec3(.56,.14,.29)*(.55+sqrt(max(petalShade,0.)));'}:null;}}new RoseCanopy();mm.roseTint=true;}
   for(const tex of m.material.getActiveTextures())tex.anisotropicFilteringLevel=4;}}
  const s=height/Math.max(.001,id==='moss_01'||id.startsWith('coast_')||smallProp(id)?Math.max(high.x-low.x,high.z-low.z,high.y-low.y):high.y-low.y),center=V((low.x+high.x)/2,low.y,(low.z+high.z)/2);
  // Anchor trees by the trunk base, not the center of an asymmetric crown.
  if(/tree|sapling/.test(id)){let sx=0,sz=0,count=0;const v=V(0,0,0);for(const m of children){if(!(id==='fir_sapling_medium'?/branches$/.test(m.material?.name||''):/trunk|branches|bark/.test(m.material?.name||'')))continue;const p=m.getVerticesData(B.VertexBuffer.PositionKind);if(!p)continue;const matrix=m.computeWorldMatrix(true);for(let i=0;i<p.length;i+=3){B.Vector3.TransformCoordinatesFromFloatsToRef(p[i],p[i+1],p[i+2],matrix,v);if(v.y>low.y+(high.y-low.y)*.035&&v.y<low.y+(high.y-low.y)*.055){sx+=v.x;sz+=v.z;count++;}}}if(count){center.x=sx/count;center.z=sz/count;}}
  const inner=new B.TransformNode('asset-origin',scene);inner.parent=root;for(const n of entry.rootNodes)n.parent=inner;inner.position=center.scale(-1);
  root.scaling.setAll(s);root.rotation.y=angle;root.position.copyFromFloats(x,y,z);
  if(Math.abs(x)<80&&Math.abs(z)<100&&/tree|sapling/.test(id)&&id!=='dead_tree_trunk_02')groundTree(root,B);
  // Annotated western broadleaf: bury its remaining scan pedestal only.
  if(id==='island_tree_02'&&x===-25&&z===3)root.position.y-=.34;
  if(id==='moss_01')fitForestBase(root,B,ground,true);
  if(softPlant(id)&&id!=='moss_01'){fitForestBase(root,B,ground,true);root.position.y-=id==='periwinkle_plant'||id==='flower_heliophila'?.14:.055;}
  if(id==='sand_rocks_small_01')fitForestBase(root,B,ground,true);
  if(id==='sand_rocks_small_01')root.position.y-=height*.34;
  const record={id,x,z,height};placements.push(record);let collider;
  if(Math.abs(x)<80&&Math.abs(z)<100&&!softPlant(id)&&!smallProp(id)&&!['wooden_lantern_01','seadogs_compass','modular_wooden_pier','lambis_shell','searsia_lucida'].includes(id)){collider=sceneryFootprint(root,id,B);colliders.push(collider);}
  sceneryItems.push({id,x,z,root,record,collider});
  return root;
 }
 courseSign(renderer,'ship-course-sign',30,ground(30,24),24,1.8,"SMUGGLER'S GREEN",'HOLE 1  /  PAR 3  >');colliders.push({id:'ship-course-sign',x:30,z:24,r:.85,height:2.5});
 // A maintained course nested inside a larger forest. Every planted footprint is checked.
 const pines=[[-17,31,25],[-24,26,29],[-19,14,30],[-26,6,25],[-17,-9,27],[-25,-18,31],[-22,-37,28],[-20,-53,27],[23,-49,29],[23,-36,31],[22,-22,27],[25,-13,28],[20,31,29],[19,41,25],[-13,48,28],[-24,36,28],[-27,17,30],[-26,-29,30],[20,10,28],[25,15,31],[27,27,30],[23,35,27],[18,17,26],[22,4,31],[27,-2,30],[-20,-24,26]];
 for(const [i,[x,z,h]]of pines.entries()){if(!plantingAllowed(x,z,1.5)||beachTrail(x,z)||inLandingClearing(x,z))continue;place('pine_tree_01',x,ground(x,z)-.15,z,h*2.12,rand()*6.28);}
 for(const [x,z,h]of[[-14,23,8.5],[19,-31,8],[-22,-48,8]]){if(plantingAllowed(x,z,2))place('jacaranda_tree',x,ground(x,z)-.15,z,h,rand()*6.28);}
 // Restore intermediate crowns without sacrificing the established giant pines.
 const middleTrees=[['tree_small_02',-18,42,10],['island_tree_02',-23,20,12],['fir_tree_01',-28,29,24],['tree_small_02',-22,-4,11],['fir_sapling_medium',-25,-10,19],['island_tree_02',-25,-24,10],['fir_tree_01',-27,-42,25],['tree_small_02',-19,-47,9],['fir_sapling_medium',18,-44,20],['island_tree_02',25,-42,11],['fir_tree_01',27,-26,26],['tree_small_02',23,-16,10],['fir_sapling_medium',27,7,20],['island_tree_02',22,25,12],['tree_small_02',24,39,11],['fir_tree_01',15,44,23]];
 for(const [id,x,z,h]of middleTrees){if(!plantingAllowed(x,z,1.8)||beachTrail(x,z)||inLandingClearing(x,z)||sceneryItems.some(a=>/tree|sapling/.test(a.id)&&Math.hypot(a.x-x,a.z-z)<3.1))continue;place(id,x,ground(x,z)-.12,z,h,rand()*6.28);}
 // Irregular, spaced woodland shrubs: no alternating rows or doubled clumps.
 const bushes=[];
 for(let attempt=0;attempt<180&&bushes.length<38;attempt++){
  const z=46-rand()*108,x=6*Math.sin(z*.045)+(rand()>.5?1:-1)*(16+rand()*10);
  if(!plantingAllowed(x,z,1.8)||beachTrail(x,z)||inLandingClearing(x,z)||bushes.some(a=>Math.hypot(a.x-x,a.z-z)<3.5)||sceneryItems.some(a=>/tree|sapling/.test(a.id)&&Math.hypot(a.x-x,a.z-z)<2.4))continue;
  const id=bushes.length%4===0?'shrub_03':'searsia_lucida';place(id,x,seatOnGround(x,z,.55,.12),z,1.0+rand()*.75,rand()*6.28,false);bushes.push({x,z});
 }
 for(const [x,z]of[[-18,28],[-24,13],[-21,-14],[-23,-37],[24,-42],[23,-21],[-21,-51]]){if(!plantingAllowed(x,z,1.8))continue;place('fern_02',x,seatOnGround(x,z,.3,.03),z,.85+rand()*.45,rand()*6.28,false);if(plantingAllowed(x+1.7,z,1.8))place('rock_moss_set_01',x+1.7,ground(x+1.7,z)-.45,z,1.3+rand()*.5,rand()*6.28);}
 // Photographic grass tufts only in the wild rough, with a clear walking route.
 for(let i=0;i<550;i++){const z=49-rand()*115,x=(rand()>.5?1:-1)*(13+rand()*16)+6*Math.sin(z*.045);if(!plantingAllowed(x,z,.6)||beachTrail(x,z)||inLandingClearing(x,z))continue;const root=place('grass_medium_01',x,ground(x,z)-.035,z,.40+rand()*.26,rand()*6.28,false);detailMeshes.push({root,x,z});for(const m of root.getChildMeshes()){if(!m.material)continue;m.material.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHATEST;m.material.alphaCutOff=.4;m.material.albedoColor=new B.Color3(.85,1.15,.72);}for(const n of root.getDescendants())n.freezeWorldMatrix?.();root.freezeWorldMatrix();}

 // Low scanned moss and Bermuda grass join the bushes to the soil, outside maintained turf.
 for(let i=0;i<140;i++){const z=46-rand()*108,x=6*Math.sin(z*.045)+(i%2?1:-1)*(15+rand()*10);if(!plantingAllowed(x,z,2)||beachTrail(x,z)||inLandingClearing(x,z))continue;const id=i%3===0?'moss_01':'grass_bermuda_01',root=place(id,x,ground(x,z)-.025,z,id==='moss_01'?.35+rand()*.3:.22+rand()*.13,rand()*6.28,false);detailMeshes.push({root,x,z});for(const m of root.getChildMeshes()){if(!m.material)continue;m.material.albedoColor=new B.Color3(.82,1.12,.72);m.material.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHATEST;m.material.alphaCutOff=.4;}}
 const rockTypes=['namaqualand_boulder_02','namaqualand_boulder_04','namaqualand_boulder_06'];
 for(const [i,[x,z,h]]of [[-34,27,6],[-39,12,7],[-38,-14,8],[-31,-48,7],[-17,-76,6],[12,-77,5],[30,-52,6],[37,-32,7],[46,-35,5.5],[70,34,6],[59,26,4.8],[41,32,3.8],[31,47,5],[-22,54,5]].entries()){place(rockTypes[i%3],x,Math.min(seatOnGround(x,z,h*.6,.2)-h*.32,-5.4-h*.62),z,h,rand()*6.28,true);}
 place('moon_rock_01',-30,ground(-30,-5)-1.2,-5,4.5,1.2);
 // A grounded find beside the ship, with no extra HUD or collection mechanic.
 place('treasure_chest',40,seatOnGround(40,18,.8,.025),18,1.1,-.5);
 // One lantern and a navigator's compass mark the start.
 place('wooden_crate_01',-8.4,shoreHeight(-8.4,33),33,.65,.2);
 place('wooden_lantern_01',-8.4,shoreHeight(-8.4,33)+.65,33,.55,.2,false);
 place('seadogs_compass',-8.1,shoreHeight(-8.1,33)+.65,33,.16,.1,false);
 const lamp=new B.PointLight('tee-lantern',V(-8.4,shoreHeight(-8.4,33)+1,33),scene);lamp.diffuse=new B.Color3(1,.58,.23);lamp.intensity=.7;lamp.range=3;
 // A beached hull can be approached from the continuous sandy cove.
 // Uniform 3.5x scale; keel seated below the shore, with the cargo/dock clear.
 place('ship_pinnace',75,-9.5,-5,59.5,-Math.PI/2,true);
 for(const [id,x,z,h,a]of [
 ['coast_land_rocks_02',53,28,7.0,.5],['coast_land_rocks_03',34,35,6.5,1.3],['coast_rocks_01',67,23,8.0,.7],['coast_rocks_05',58,38,9.0,2.1],
 ['wine_barrel_01',43.6,16.6,1.18,.2],['dead_tree_trunk_02',44,22,1.2,1.3],
 ['lambis_shell',48,21,.18,.6],['lambis_shell',53,18,.14,2.2],['lambis_shell',44,25,.16,1.7]
 ])place(id,x,seatOnGround(x,z,id.includes('rock')?h*.16:.3,id.includes('rock')?.3:id==='dead_tree_trunk_02'?.16:.03),z,h,a);
 const landing=buildLanding(renderer,place,sceneryItems,detailMeshes);
 const dock=landing.dock,speedCoin=buildSpeedCoin(renderer,dock);
 const onDock=(x,z)=>x>=dock.start&&x<=dock.end&&Math.abs(z-dock.z)<=dock.halfWidth;
 const walkingHeight=(x,z)=>Math.max(shoreHeight(x,z),onDock(x,z)?dock.deck:-Infinity,sanctuary.crossingHeight(x,z)??-Infinity,fortress.crossingHeight(x,z)??-Infinity,highland.crossingHeight(x,z)??-Infinity,cabinHole.crossingHeight(x,z)??-Infinity);
 const walkingCoast=(x,z)=>onDock(x,z)||sanctuary.crossingHeight(x,z)!==null||fortress.crossingHeight(x,z)!==null||highland.crossingHeight(x,z)!==null||cabinHole.crossingHeight(x,z)!==null||walkableCoast(x,z);
 const islets=buildForestIslets(renderer,place,mesh);
 const placementAudit=clearRockPlantOverlaps(B,sceneryItems,placements,colliders,detailMeshes,renderer);
 const sanctuary=buildSanctuary(renderer,place,mesh,colliders,models);
 const fortress=buildFortress(renderer,place,mesh,colliders,models);const highland=buildHighland(renderer,place,mesh,colliders,models),jumpPickup=buildJumpPickup(renderer),cartPickup=buildCartPickup(renderer);const cabinHole=buildCabinHole(renderer,place,mesh,colliders);const roughDetail=buildRoughDetail(renderer,place,sceneryItems,colliders);const visibility=buildSceneryVisibility(sceneryItems);let keepShadow=false;

 // Animated open water with broad swells, fresnel, reflected sky and a restrained sun path.
 B.Effect.ShadersStore.coveWaterVertexShader=`precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;uniform mat4 world;uniform float time;varying vec3 wp;
 void main(){vec3 p=position;float swell=sin(dot(p.xz,vec2(.17,.09))-time*.95)*.27+sin(dot(p.xz,vec2(-.08,.23))-time*.72)*.13;float shelter=smoothstep(1200.,1270.,-p.z)*smoothstep(1070.,1130.,p.x);p.y+=swell*mix(1.,.10,shelter);wp=(world*vec4(p,1.)).xyz;gl_Position=worldViewProjection*vec4(p,1.);}`;
 B.Effect.ShadersStore.coveWaterFragmentShader=`precision highp float;varying vec3 wp;uniform float time;uniform vec3 eye;uniform samplerCube seaSky;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float keepWaterSegment(vec2 p,vec4 s){vec2 d=s.zw-s.xy;return length(p-s.xy-d*clamp(dot(p-s.xy,d)/dot(d,d),0.,1.));}
 float waves(vec2 p){return sin(dot(p,vec2(.17,.09))-time*.95)*.27+sin(dot(p,vec2(-.08,.23))-time*.72)*.13+sin(p.x*.65+time*.7)*.022+sin(p.y*.83-time*.9)*.018;}
 void main(){float shelter=smoothstep(1200.,1270.,-wp.z)*smoothstep(1070.,1130.,wp.x);float dx=(waves(wp.xz+vec2(.15,0))-waves(wp.xz-vec2(.15,0)))/.3;float dz=(waves(wp.xz+vec2(0,.15))-waves(wp.xz-vec2(0,.15)))/.3;
 vec3 n=normalize(vec3(-dx*1.5*mix(1.,.16,shelter),1.,-dz*1.5*mix(1.,.16,shelter))),v=normalize(eye-wp);float f=pow(1.-max(dot(n,v),0.),3.);
 float ca=atan((wp.z+10.)/76.,wp.x/39.);float cr=length(vec2(wp.x/39.,(wp.z+10.)/76.))/(1.+.035*sin(ca*5.));float br=length((wp.xz-vec2(40.,6.))/vec2(30.,29.));float shoreDist=min((cr-1.075)*39.,(br-.94)*29.);float keepShore=min(keepWaterSegment(wp.xz,vec4(240.,-315.,370.,-465.)),min(keepWaterSegment(wp.xz,vec4(370.,-465.,525.,-480.)),keepWaterSegment(wp.xz,vec4(525.,-480.,650.,-620.))))-49.;vec2 sanctuaryP=vec2(wp.x-155.,(wp.z+175.)/1.15);float sanctuaryAngle=atan((sanctuaryP.y+10.)/76.,sanctuaryP.x/39.);float sanctuaryShore=(length(vec2(sanctuaryP.x/39.,(sanctuaryP.y+10.)/76.))/(1.+.035*sin(sanctuaryAngle*5.))-1.075)*39.;shoreDist=min(shoreDist,min(keepShore,sanctuaryShore));
 vec3 sea=mix(vec3(.055,.37,.32),vec3(.028,.20,.24),smoothstep(0.,16.,shoreDist));vec3 reflected=textureCube(seaSky,reflect(-v,n)).rgb;vec3 col=mix(sea,mix(vec3(.43,.62,.64),clamp(reflected,vec3(.03),vec3(1.3)),.65),f);
 float grain=noise(wp.xz*2.1+vec2(time*.08,0.));float broken=noise(wp.xz*.24+vec2(time*.06,0.));
 float wash=sin(shoreDist*2.3+time*1.25+broken*3.5);float shoreFoam=smoothstep(.55,.95,wash)*(1.-smoothstep(.4,5.5,abs(shoreDist-1.2)))*smoothstep(.25,.62,broken)*(.25+.75*grain);
 float crest=sin(dot(wp.xz,vec2(.17,.09))-time*.95);float whitecaps=smoothstep(.83,.98,crest)*smoothstep(.40,.68,broken)*smoothstep(10.,27.,shoreDist)*(.35+.65*grain);
 col=mix(col,vec3(.83,.89,.84),clamp((shoreFoam*.55+whitecaps*.70)*(1.-shelter),0.,.8));vec3 h=normalize(v+normalize(vec3(.55,.7,.6)));float spec=pow(max(dot(n,h),0.),140.);col+=vec3(1.,.78,.41)*spec*.52;
 float haze=1.-exp(-length(eye-wp)*.002);col=mix(col,vec3(.60,.69,.67),haze);gl_FragColor=vec4(col,1.);}`;
 // Uniform two-metre wave samples around ALL three islands; expand only beyond the coast.
 const water=new B.Mesh('cove-water',scene),oceanData=new B.VertexData(),waterP=[],waterI=[];
 function oceanAxis(lo,hi){const a=[];for(let v=lo;v<=hi;v+=2)a.push(v);let d=2;while(a[0]>-2600){d*=1.18;a.unshift(a[0]-d);}d=2;while(a.at(-1)<2600){d*=1.18;a.push(a.at(-1)+d);}return a;}
 const oceanX=oceanAxis(-140,1270),oceanZ=oceanAxis(-1260,180);for(const z of oceanZ)for(const x of oceanX)waterP.push(x,0,z);for(let j=0;j<oceanZ.length-1;j++)for(let i=0;i<oceanX.length-1;i++){const k=j*oceanX.length+i;waterI.push(k,k+oceanX.length,k+1,k+1,k+oceanX.length,k+oceanX.length+1);}oceanData.positions=waterP;oceanData.indices=waterI;oceanData.applyToMesh(water);
 water.position.y=-5.4;const wm=new B.ShaderMaterial('cove-water-material',scene,{vertex:'coveWater',fragment:'coveWater'},{attributes:['position'],uniforms:['worldViewProjection','world','time','eye'],samplers:['seaSky']});wm.setTexture('seaSky',scene.environmentTexture);wm.backFaceCulling=false;water.material=wm;water.isPickable=false;
 const cloudSky=buildCloudSky(renderer);
 const mistMat=new B.StandardMaterial('sea-mist',scene);mistMat.diffuseTexture=renderer.texture('mist.png');mistMat.diffuseTexture.hasAlpha=true;mistMat.useAlphaFromDiffuseTexture=true;mistMat.disableLighting=true;mistMat.emissiveColor=new B.Color3(.63,.75,.75);mistMat.alpha=.16;mistMat.backFaceCulling=false;
 for(let i=0;i<6;i++){const m=B.MeshBuilder.CreatePlane('distant-sea-haze',{width:90,height:15},scene);m.material=mistMat;m.position.copyFromFloats((i-2.5)*45,1,-110-(i%2)*55);m.billboardMode=B.Mesh.BILLBOARDMODE_Y;m.isPickable=false;}
 const wildlife=await buildCoveWildlife(renderer,islets),magic=buildCourseMagic(renderer);
 await scene.whenReadyAsync();renderer.bakeShadow();
 window.realmDebug={cabin:cabinHole.report,roughDetail,visibility:visibility.report,jumpPickup:jumpPickup.location,cartPickup:cartPickup.location,highland:highland.report,speedCoin:speedCoin.state.location,sanctuary:sanctuary.report,fortress:fortress.report,placements,colliders,islets,placementAudit,landing,wildlife:wildlife.counts};
 window.coveAssets={loaded:models.size,source:'Poly Haven',license:'CC0-1.0'};
 return{...assets,cabinHole,rangePickup:cabinHole.pickup,speedCoin,jumpPickup,cartPickup,magic,guides:[assets,sanctuary.guides,fortress.guides,highland.guides,cabinHole.guides],world:{static:true},grass:{static:true},water:{static:true},walkable:walkingCoast,height:walkingHeight,colliders,vertices:scene.getTotalVertices(),terrain:land,update(time,quality){cloudSky.update(time,renderer.camera.position);visibility.update(renderer.camera.position,quality);magic.update(time,quality);speedCoin.update(time);jumpPickup.update(time);cartPickup.update(time);const cabinView=inCabin(renderer.camera.position.x,renderer.camera.position.z),highView=!cabinView&&inHighland(renderer.camera.position.x,renderer.camera.position.z),keepView=!cabinView&&!highView&&renderer.camera.position.x>200&&renderer.camera.position.z<-275;cabinHole.update(renderer.camera.position,cabinView,time);fortress.update(renderer.camera.position,keepView,quality);highland.update(renderer.camera.position,highView,quality);if(!cabinView&&!keepView&&!highView)sanctuary.update(renderer.camera.position,time,keepShadow);keepShadow=cabinView||keepView||highView;wildlife.update(time,quality);wm.setFloat('time',time);wm.setVector3('eye',renderer.camera.position);for(const a of animated)if(a.kind==='boat'){a.m.position.y=a.y+Math.sin(time*.35)*.1;a.m.rotation.z=Math.sin(time*.24)*.005;}}};
}
