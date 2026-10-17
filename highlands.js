import {crossingMeshData,crossingPierData,courseSign,stoneJoints} from './crossing-mesh.js';
import {COURSES} from './courses.js';
import {HIGH_ROUTE,HIGH_CROSSING,HIGH_LENGTH,HIGH_BUNKERS,highNearest,highPoint,highMasks,highLandRadius,highSurface,highGreenRadius} from './highland-layout.js';
import {ground,slope} from './physics.js';
import {groundTree,sceneryFootprint} from './forest.js';
import {buildGolfAssets} from './golf-assets.js';
function highlandTurf(renderer){
 const {B}=renderer,m=renderer.material('highland-living-turf',[1,1,1],null,1);

 class KeepSurface extends B.MaterialPluginBase{getClassName(){return "VerdantHighlandSurface";}
  constructor(){super(m,'KeepSurface',200,{});this._enable(true);}
  getSamplers(s){s.push('keepGrass','keepSand','keepForest','keepNormal','keepCover','keepMoss','keepCoverN','keepMossN');}
  getActiveTextures(a){for(const f of ['cove-grass.jpg','cove-sand.jpg','forest_ground_06-Diffuse.jpg','cove-grass-normal.jpg','coastal-atlas-Diffuse.jpg','aerial_grass_rock-Diffuse.jpg','coastal-atlas-nor_gl.jpg','aerial_grass_rock-nor_gl.jpg'])a.push(renderer.texture(f));}
  isReadyForSubMesh(){const textures=[];this.getActiveTextures(textures);return textures.every(t=>t.isReady());}
  bindForSubMesh(u){for(const [n,f]of [['keepGrass','cove-grass.jpg'],['keepSand','cove-sand.jpg'],['keepForest','forest_ground_06-Diffuse.jpg'],['keepNormal','cove-grass-normal.jpg'],['keepCover','coastal-atlas-Diffuse.jpg'],['keepMoss','aerial_grass_rock-Diffuse.jpg'],['keepCoverN','coastal-atlas-nor_gl.jpg'],['keepMossN','aerial_grass_rock-nor_gl.jpg']])u.setTexture(n,renderer.texture(f));}
  getAttributes(a){a.push('courseMasks');}
  getCustomCode(type){if(type==='vertex')return{CUSTOM_VERTEX_DEFINITIONS:'attribute vec4 courseMasks; varying vec4 vHighMasks;',CUSTOM_VERTEX_MAIN_END:'vHighMasks=courseMasks;'};if(type!=='fragment')return null;return{
   CUSTOM_FRAGMENT_DEFINITIONS:`varying vec4 vHighMasks;uniform sampler2D keepGrass;uniform sampler2D keepSand;uniform sampler2D keepForest;uniform sampler2D keepNormal;uniform sampler2D keepCover;uniform sampler2D keepMoss;uniform sampler2D keepCoverN;uniform sampler2D keepMossN; vec2 keepCoverUV(vec2 p,float tile){return ((1.-abs(mod(p,2.)-1.))*.90+.05+vec2(mod(tile,3.),floor(tile/3.)))/vec2(3.,2.);}
`,
   CUSTOM_FRAGMENT_UPDATE_ALBEDO:`vec2 kp=vec2(1280.-vPositionW.x,-1490.-vPositionW.z);float grain=dot(texture2D(keepGrass,kp*.23).rgb,vec3(.299,.587,.114));float fair=vHighMasks.x,green=vHighMasks.y,fringe=vHighMasks.z,sand=max(vHighMasks.w,1.-smoothstep(-3.8,-2.0,vPositionW.y));vec3 forest=texture2D(keepForest,kp*.35).rgb;float leaf=dot(forest,vec3(.299,.587,.114));vec3 forestSample=texture2D(keepCover,keepCoverUV(kp*.40,0.)).rgb,mossSample=texture2D(keepMoss,kp*.12).rgb;float cover=smoothstep(.24,.62,texture2D(keepGrass,kp*.035).r),mossLuma=dot(mossSample,vec3(.299,.587,.114));vec3 livingLeaf=mix(forestSample*vec3(.66,.91,.46),vec3(.075,.145,.030),.14),livingMoss=mix(vec3(.033,.068,.014),vec3(.12,.24,.038),clamp(mossLuma*1.7,0.,1.));vec3 rough=mix(livingLeaf,livingMoss,cover*.18)*(.91+grain*.20);float woods=(1.-fair),mottling=smoothstep(.35,.60,texture2D(keepGrass,kp*.08).r);rough=mix(rough,texture2D(keepCover,keepCoverUV(kp*.32,3.)).rgb*vec3(.67,.86,.47),woods*mottling*.27);float stripe=smoothstep(-.13,.13,sin((kp.y+kp.x*.32)*.70));vec3 fairway=mix(vec3(.075,.235,.032),vec3(.115,.30,.047),stripe)*(.78+grain*.48);surfaceAlbedo=mix(rough,fairway,fair);surfaceAlbedo=mix(surfaceAlbedo,vec3(.10,.25,.026),fringe);surfaceAlbedo=mix(surfaceAlbedo,vec3(.18,.38,.064)*(.91+grain*.18)*(1.+.035*sin((vPositionW.x*.7+vPositionW.z)*1.35)),green);vec3 sandColor=mix(vec3(.55,.40,.22),vec3(.78,.65,.43),dot(texture2D(keepSand,kp*.17).rgb,vec3(.299,.587,.114)));float cliff=(1.-smoothstep(.70,.93,abs(normalize(vNormalW).y)))*(1.-fair)*(1.-green);vec3 cr=texture2D(keepMoss,vec2(kp.x*.12,vPositionW.y*.16)).rgb;surfaceAlbedo=mix(surfaceAlbedo,cr*vec3(.70,.76,.62),cliff*.94);surfaceAlbedo=mix(surfaceAlbedo,sandColor,sand);`,
   CUSTOM_FRAGMENT_BEFORE_LIGHTS:`vec2 np=vPositionW.xz;float coverN=smoothstep(.24,.62,texture2D(keepGrass,np*.035).r);vec3 kn=mix(texture2D(keepCoverN,keepCoverUV(np*.40,0.)).xyz,texture2D(keepMossN,np*.12).xyz,coverN*.65)*2.-1.;float kg=length((vPositionW.xz-vec2(1160.,-1140.))/vec2(15.,11.));normalW=normalize(normalW+vec3(kn.x,0.,kn.y)*smoothstep(1.1,1.5,kg)*(1.-vHighMasks.x)*(1.-vHighMasks.w)*smoothstep(-.5,.5,vPositionW.y)*.48);`
  };}
 }
 new KeepSurface();return m;
}

export function buildHighland(renderer,place,mesh,colliders,models){
 const {B,scene}=renderer,V=(x,y,z)=>new B.Vector3(x,y,z),course=COURSES[3],before=new Set(renderer.shadows.getShadowMap().renderList),roots=[],stoneParts=[];
 const turf=highlandTurf(renderer),stone=renderer.material('highland-weathered-masonry',[.69,.70,.59],'mossy_rock-Diffuse.jpg',.96);stone.bumpTexture=renderer.texture('mossy_rock-nor_gl.jpg');stone.bumpTexture.level=.28;stoneJoints(renderer,stone);
 const terrain={p:[],i:[],uv:[],n:[],masks:[]},cache=new Map(),cup=course.cup;
 function vertex(x,z){const key=x+','+z;if(cache.has(key))return cache.get(key);const i=terrain.p.length/3,sl=slope(x,z),l=Math.hypot(sl.x,1,sl.z);terrain.p.push(x,ground(x,z),z);terrain.n.push(-sl.x/l,1/l,-sl.z/l);terrain.uv.push(x*.2,z*.2);terrain.masks.push(...highMasks(x,z));cache.set(key,i);return i;}
 function tri(a,b,c){terrain.i.push(vertex(...a),vertex(...b),vertex(...c));}
 for(let z=-1198;z<-676;z++)for(let x=703;x<1216;x++){if(highLandRadius(x+.5,z+.5)>1.14)continue;if(x>=cup.x-1&&x<cup.x+1&&z>=cup.z-1&&z<cup.z+1)continue;tri([x,z],[x,z+1],[x+1,z+1]);tri([x,z],[x+1,z+1],[x+1,z]);}
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2,pt=(a,r)=>[cup.x+Math.cos(a)*r,cup.z+Math.sin(a)*r],out=a=>pt(a,1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a))));tri(pt(a,.275),out(a),out(b));tri(pt(a,.275),out(b),pt(b,.275));}
 const land=mesh('highland-par-five-terrain',terrain.p,terrain.i,turf,null,terrain.uv);land.setVerticesData(B.VertexBuffer.NormalKind,terrain.n);land.setVerticesData('courseMasks',terrain.masks,false,4);land.isPickable=false;renderer.removeShadowCaster(land);land.freezeWorldMatrix();
 function finish(m,mat=stone,shadow=true){m.material=mat;m.receiveShadows=true;m.isPickable=false;if(shadow)renderer.shadowCaster(m);return m;}
 const dark=renderer.material('highland-cup-dark',[.01,.014,.011],null,1),gold=renderer.material('highland-brass',[.66,.46,.18],null,.4);gold.metallic=.5;
 const cy=ground(cup.x,cup.z),wall=B.MeshBuilder.CreateCylinder('highland-cup-wall',{height:.52,diameter:.55,tessellation:40,sideOrientation:B.Mesh.BACKSIDE,cap:B.Mesh.NO_CAP},scene);wall.position.set(cup.x,cy-.26,cup.z);finish(wall,dark,false);
 const bottom=B.MeshBuilder.CreateDisc('highland-cup-bottom',{radius:.275,tessellation:40,sideOrientation:B.Mesh.DOUBLESIDE},scene);bottom.rotation.x=Math.PI/2;bottom.position.set(cup.x,cy-.52,cup.z);finish(bottom,dark,false);
 const flag=B.MeshBuilder.CreateCylinder('highland-flagpole',{height:4.3,diameter:.064,tessellation:12},scene);flag.position.set(cup.x,cy+2.15,cup.z);finish(flag,gold);

 function collider(x,z,r,height,id){colliders.push({x,z,r,height,id});}
 // Continuous, broad stone crossing from the second green; no loose stepping stones.
 const frames=[],start=ground(...HIGH_CROSSING[0]),end=ground(...HIGH_CROSSING.at(-1)),total=HIGH_CROSSING.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-HIGH_CROSSING[i][0],p[1]-HIGH_CROSSING[i][1]),0);let along=0;
 for(let i=0;i<HIGH_CROSSING.length-1;i++){const a=HIGH_CROSSING[i],b=HIGH_CROSSING[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),steps=Math.ceil(length);for(let j=0;j<steps;j++){const t=j/steps,x=a[0]+dx*t,z=a[1]+dz*t,f=(along+t*length)/total,shore=Math.max(ground(x,z),ground(x-dz/length*1.8,z+dx/length*1.8),ground(x+dz/length*1.8,z-dx/length*1.8));frames.push({x,z,nx:-dz/length,nz:dx/length,y:Math.max(shore+.045,start*(1-f)+end*f-1.1*Math.sin(f*Math.PI))});}along+=length;}
 const tail=frames.at(-1),endPoint=HIGH_CROSSING.at(-1);frames.push({...tail,x:endPoint[0],z:endPoint[1],y:ground(...endPoint)+.045});
 for(let i=0;i<frames.length;i++){const f=frames[i],a=frames[Math.max(0,i-1)],b=frames[Math.min(frames.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z);f.nx=-(b.z-a.z)/len;f.nz=(b.x-a.x)/len;if(i<12||i>frames.length-13)f.ground=Math.min(ground(f.x,f.z),ground(f.x+f.nx*2,f.z+f.nz*2),ground(f.x-f.nx*2,f.z-f.nz*2));}
 function ribbon(name,center,width,low,high){const data=crossingMeshData(frames,center,width,low,high,{abutments:center===0}),m=mesh(name,data.p,data.i,stone,null,data.uv);roots.push(m);return m;}
 ribbon('highland-crossing-deck',0,3.8,-.45,0);ribbon('highland-crossing-left',-1.95,.26,0,.35);ribbon('highland-crossing-right',1.95,.26,0,.35);
 for(let i=0;i<frames.length-9;i++){const f=frames[i];for(const side of [-1,1])collider(f.x+f.nx*side*1.95,f.z+f.nz*side*1.95,.18,.45,'highland-crossing-rail');if(i%14===0&&i>8){const data=crossingPierData(frames,i,1.8,1.8,.45);const m=mesh('highland-crossing-support',data.p,data.i,stone,null,data.uv);roots.push(m);}}
 const crossingPoints=frames.map(f=>[f.x,f.z]);
 const crossingHeight=(x,z)=>{const p=highNearest(x,z,crossingPoints);if(p.distance>1.78)return null;return frames[p.segment].y+(frames[p.segment+1].y-frames[p.segment].y)*p.t;};
 function prop(id,x,z,h,angle=0){const tree=/tree|sapling/.test(id),y=ground(x,z),root=place(id,x,y-(tree?.12:/rock|boulder/.test(id)?h*.46:.03),z,h,angle,true);if(tree)groundTree(root,B);roots.push(root);if(!/fern|shrub|grass|flower|periwinkle/.test(id))colliders.push(sceneryFootprint(root,id,B));return root;}
 // Reuse the established forest, with separate compositions at each bend.
 for(let i=0;i<24;i++){for(const side of [-1,1]){if((i+side+1)%9===4)continue;const p=highPoint(20+i*(HIGH_LENGTH-40)/23+Math.sin(i*5.1+side)*8),distance=27+(Math.sin(i*4.2+side)+1)*3.5,x=p.x+p.nx*side*distance,z=p.z+p.nz*side*distance;if(highGreenRadius(x,z)<1.65||colliders.some(c=>c.id==='keep-masonry'&&Math.hypot(c.x-x,c.z-z)<c.r+5))continue;prop('pine_tree_01',x,z,48+(i%5)*4,(i*2.399+side)*1.1);if(i%4===0)prop('tree_small_02',p.x+p.nx*side*26,p.z+p.nz*side*26,10+(i%3),i*1.7);if(i%7===2)prop('fir_sapling_medium',p.x+p.nx*side*29+4,p.z+p.nz*side*29-5,22+(i%3),i*1.9);}}
 for(let i=0;i<22;i++){const p=highPoint(i/21*HIGH_LENGTH),side=i%2?1:-1,x=p.x+p.nx*side*48,z=p.z+p.nz*side*48;if(highNearest(x,z,HIGH_CROSSING).distance<13)continue;const r=place(['namaqualand_boulder_04','namaqualand_boulder_02'][i%2],x,-8.5,z,Math.max(16,ground(p.x,p.z)+10),i*1.7,true);roots.push(r);colliders.push(sceneryFootprint(r,'highland-coast-rock',B));}
 for(let i=0;i<74;i++){const p=highPoint((i*.618033%1)*HIGH_LENGTH),side=i%2?1:-1,x=p.x+p.nx*side*(24+Math.sin(i*7.1)*4),z=p.z+p.nz*side*(24+Math.sin(i*7.1)*4);if(highSurface(x,z)!=='rough'||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.4))continue;prop(i%4?'fern_02':'shrub_03',x,z,i%4?.7:1.15,i*2.3);}
 // Additional forest layers: clustered giants, middle-storey trees and sparse floor pockets.
 let detailSeed=25025;const detailRand=()=>((detailSeed=(Math.imul(detailSeed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<88;i++){const p=highPoint(8+detailRand()*(HIGH_LENGTH-12)),side=detailRand()>.5?1:-1,d=26+detailRand()*7,x=p.x+p.nx*side*d,z=p.z+p.nz*side*d;
  if(highSurface(x,z)!=='rough'||ground(x,z)<.4||highGreenRadius(x,z)<1.65||highNearest(x,z,HIGH_CROSSING).distance<8||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+4))continue;
  const id=i%4===0?'tree_small_02':i%4===1?'fir_sapling_medium':'pine_tree_01';prop(id,x,z,id==='pine_tree_01'?48+detailRand()*18:id==='fir_sapling_medium'?19+detailRand()*9:9+detailRand()*5,detailRand()*6.28);
 }
 for(let cluster=0;cluster<60;cluster++){const p=highPoint(detailRand()*HIGH_LENGTH),side=detailRand()>.5?1:-1,d=24+detailRand()*13,cx=p.x+p.nx*side*d,cz=p.z+p.nz*side*d;
  for(let j=0;j<5;j++){const x=cx+(detailRand()-.5)*7,z=cz+(detailRand()-.5)*7;if(highSurface(x,z)!=='rough'||ground(x,z)<.1||highGreenRadius(x,z)<1.4||highNearest(x,z,HIGH_CROSSING).distance<5||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.65))continue;
   const ids=['fern_02','grass_medium_01','periwinkle_plant','shrub_03','grass_bermuda_01'],id=ids[(cluster+j)%5];prop(id,x,z,id==='shrub_03'?.85+detailRand()*.5:id==='fern_02'?.65+detailRand()*.45:.28+detailRand()*.24,detailRand()*6.28);
  }
 }

 for(const [id,d,off,h]of [['tree_stump_01',160,30,1.2],['lambis_shell',18,-43,.22]]){const p=highPoint(d);prop(id,p.x+p.nx*off,p.z+p.nz*off,h,d*.02);}
 prop('wooden_lantern_01',757,-734,.68,.6+Math.PI);
 courseSign(renderer,'highland-wayfinding',654,ground(654,-644),-644,-.65,'THE HIGHLAND RETURN','HOLE 4  /  PAR 5  >');
 const casters=renderer.shadows.getShadowMap().renderList.filter(m=>!before.has(m));renderer.shadows.getShadowMap().renderList=[...before];
 const guides=buildGolfAssets(renderer,{x:1163,z:-1147,stretch:1,cup:course.cup,greenBounds:[-18,16,-14,20]});let shadowCell='',nextCull=0;
 const cullRecords=roots.filter(r=>!r.name.startsWith('highland-')).map(root=>({root,small:/fern|shrub|grass|flower|periwinkle/.test(root.name)}));
 return{guides,crossingHeight,update(eye,active,quality){if(!active){shadowCell='';return;}const x=Math.round(eye.x/65)*65,z=Math.round(eye.z/65)*65,key=x+','+z;if(key!==shadowCell){shadowCell=key;scene.getLightByName('afternoon-sun').position.set(x+50,115,z+75);renderer.shadows.getShadowMap().renderList=renderer.localShadowCasters(eye);renderer.bakeShadow();}},report:{name:course.name,par:5,tee:course.tee,cup:course.cup,yards:Math.round(HIGH_LENGTH/.9144),route:HIGH_ROUTE,crossing:frames.map(f=>[f.x,f.z]),bunkers:HIGH_BUNKERS,trees:roots.filter(r=>/tree|sapling/.test(r.name)).length}};
}
