import {fitCrossingEnds,crossingWalkHeight,crossingMeshData,crossingPierData,courseSign,seatGateFeet,stoneJoints} from './crossing-mesh.js';
import {COURSES} from './courses.js';
import {KEEP_ROUTE,KEEP_CROSSING,KEEP_BUNKERS,KEEP_LENGTH,nearestKeepPath,keepPointAlong,keepLandRadius,keepSurface,keepGreenRadius} from './fortress-layout.js';
import {ground,slope} from './physics.js';
import {groundTree,sceneryFootprint} from './forest.js';
import {buildGateIvy} from './sanctuary-details.js';
import {buildGolfAssets} from './golf-assets.js';

function fortressTurf(renderer){
 const {B}=renderer,m=renderer.material('keep-living-turf',[1,1,1],null,1);
 const segmentGLSL=KEEP_ROUTE.slice(1).map((p,i)=>`vec4(${KEEP_ROUTE[i][0]}.,${KEEP_ROUTE[i][1]}.,${p[0]}.,${p[1]}.)`);
 class KeepSurface extends B.MaterialPluginBase{getClassName(){return "VerdantKeepSurface";}
  constructor(){super(m,'KeepSurface',200,{});this._enable(true);}
  getSamplers(s){s.push('keepGrass','keepSand','keepForest','keepNormal','keepCover','keepMoss','keepCoverN','keepMossN');}
  getActiveTextures(a){for(const f of ['cove-grass.jpg','cove-sand.jpg','forest_ground_06-Diffuse.jpg','cove-grass-normal.jpg','coastal-atlas-Diffuse.jpg','aerial_grass_rock-Diffuse.jpg','coastal-atlas-nor_gl.jpg','aerial_grass_rock-nor_gl.jpg'])a.push(renderer.texture(f));}
  isReadyForSubMesh(){const textures=[];this.getActiveTextures(textures);return textures.every(t=>t.isReady());}
  bindForSubMesh(u){for(const [n,f]of [['keepGrass','cove-grass.jpg'],['keepSand','cove-sand.jpg'],['keepForest','forest_ground_06-Diffuse.jpg'],['keepNormal','cove-grass-normal.jpg'],['keepCover','coastal-atlas-Diffuse.jpg'],['keepMoss','aerial_grass_rock-Diffuse.jpg'],['keepCoverN','coastal-atlas-nor_gl.jpg'],['keepMossN','aerial_grass_rock-nor_gl.jpg']])u.setTexture(n,renderer.texture(f));}
  getCustomCode(type){if(type!=='fragment')return null;return{
   CUSTOM_FRAGMENT_DEFINITIONS:`uniform sampler2D keepGrass;uniform sampler2D keepSand;uniform sampler2D keepForest;uniform sampler2D keepNormal;uniform sampler2D keepCover;uniform sampler2D keepMoss;uniform sampler2D keepCoverN;uniform sampler2D keepMossN; vec2 keepCoverUV(vec2 p,float tile){return ((1.-abs(mod(p,2.)-1.))*.90+.05+vec2(mod(tile,3.),floor(tile/3.)))/vec2(3.,2.);}
    vec2 keepSegment(vec2 p,vec4 s){vec2 d=s.zw-s.xy;float t=clamp(dot(p-s.xy,d)/dot(d,d),0.,1.);return vec2(length(p-s.xy-d*t),t*length(d));}
    vec2 keepRoute(vec2 p){vec2 a=keepSegment(p,${segmentGLSL[0]}),b=keepSegment(p,${segmentGLSL[1]}),c=keepSegment(p,${segmentGLSL[2]});b.y+=${Math.hypot(130,150).toFixed(6)};c.y+=${(Math.hypot(130,150)+Math.hypot(155,15)).toFixed(6)};return a.x<b.x?(a.x<c.x?a:c):(b.x<c.x?b:c);}
    float keepSandMask(vec2 p){float b=0.;${KEEP_BUNKERS.map(([x,z,rx,rz])=>`b=max(b,1.-smoothstep(.72,1.06,length((p-vec2(${x}.,${z}.))/vec2(${rx}.,${rz}.))));`).join('')}return b;}`,
   CUSTOM_FRAGMENT_UPDATE_ALBEDO:`vec2 kp=vPositionW.xz,route=keepRoute(kp);float grain=dot(texture2D(keepGrass,kp*.23).rgb,vec3(.299,.587,.114));float width=17.+3.*sin(route.y*.014)+2.*exp(-pow((route.y-200.)/55.,2.));float edgeWave=1.3*sin(route.y*.031)+.55*sin(route.y*.077);float fair=1.-smoothstep(width-1.8,width+1.8,route.x+edgeWave);float gr=length((kp-vec2(650.,-620.))/vec2(15.,11.));float green=1.-smoothstep(.98,1.025,gr),fringe=1.-smoothstep(1.12,1.25,gr);float sand=max(keepSandMask(kp),1.-smoothstep(-1.5,.1,vPositionW.y));vec3 forest=texture2D(keepForest,kp*.35).rgb;float leaf=dot(forest,vec3(.299,.587,.114));vec3 forestSample=texture2D(keepCover,keepCoverUV(kp*.40,0.)).rgb,mossSample=texture2D(keepMoss,kp*.12).rgb;float cover=smoothstep(.24,.62,texture2D(keepGrass,kp*.035).r),mossLuma=dot(mossSample,vec3(.299,.587,.114));vec3 livingLeaf=mix(forestSample*vec3(.66,.91,.46),vec3(.075,.145,.030),.14),livingMoss=mix(vec3(.033,.068,.014),vec3(.12,.24,.038),clamp(mossLuma*1.7,0.,1.));vec3 rough=mix(livingLeaf,livingMoss,cover*.18)*(.91+grain*.20);float woods=smoothstep(23.,34.,route.x),mottling=smoothstep(.35,.60,texture2D(keepGrass,kp*.08).r);rough=mix(rough,texture2D(keepCover,keepCoverUV(kp*.32,3.)).rgb*vec3(.67,.86,.47),woods*mottling*.27);float stripe=smoothstep(-.13,.13,sin((kp.y+kp.x*.32)*.70));vec3 fairway=mix(vec3(.075,.235,.032),vec3(.115,.30,.047),stripe)*(.78+grain*.48);surfaceAlbedo=mix(rough,fairway,fair);surfaceAlbedo=mix(surfaceAlbedo,vec3(.10,.25,.026),fringe);surfaceAlbedo=mix(surfaceAlbedo,vec3(.18,.38,.064)*(.91+grain*.18)*(1.+.035*sin((vPositionW.x*.7+vPositionW.z)*1.35)),green);vec3 sandColor=mix(vec3(.55,.40,.22),vec3(.78,.65,.43),dot(texture2D(keepSand,kp*.17).rgb,vec3(.299,.587,.114)));surfaceAlbedo=mix(surfaceAlbedo,sandColor,sand);`,
   CUSTOM_FRAGMENT_BEFORE_LIGHTS:`vec2 np=vPositionW.xz;float coverN=smoothstep(.24,.62,texture2D(keepGrass,np*.035).r);vec3 kn=mix(texture2D(keepCoverN,keepCoverUV(np*.40,0.)).xyz,texture2D(keepMossN,np*.12).xyz,coverN*.65)*2.-1.;float kg=length((vPositionW.xz-vec2(650.,-620.))/vec2(15.,11.));normalW=normalize(normalW+vec3(kn.x,0.,kn.y)*smoothstep(1.1,1.5,kg)*(1.-(1.-smoothstep(16.,21.,keepRoute(np).x)))*(1.-keepSandMask(np))*smoothstep(-.5,.5,vPositionW.y)*.48);`
  };}
 }
 new KeepSurface();return m;
}

export function buildFortress(renderer,place,mesh,colliders,models){
 const {B,scene}=renderer,V=(x,y,z)=>new B.Vector3(x,y,z),course=COURSES[2],before=new Set(renderer.shadows.getShadowMap().renderList),roots=[],stoneParts=[];
 const turf=fortressTurf(renderer),stone=renderer.material('keep-weathered-masonry',[.69,.70,.59],'mossy_rock-Diffuse.jpg',.96);stone.bumpTexture=renderer.texture('mossy_rock-nor_gl.jpg');stone.bumpTexture.level=.28;stoneJoints(renderer,stone);
 const terrain={p:[],i:[],uv:[],n:[]},cache=new Map(),cup=course.cup;
 function vertex(x,z){const key=x+','+z;if(cache.has(key))return cache.get(key);const i=terrain.p.length/3,sl=slope(x,z),l=Math.hypot(sl.x,1,sl.z);terrain.p.push(x,ground(x,z),z);terrain.n.push(-sl.x/l,1/l,-sl.z/l);terrain.uv.push(x*.2,z*.2);cache.set(key,i);return i;}
 function tri(a,b,c){terrain.i.push(vertex(...a),vertex(...b),vertex(...c));}
 for(let z=-680;z<-270;z++)for(let x=195;x<712;x++){if(keepLandRadius(x+.5,z+.5)>1.14)continue;if(x>=cup.x-1&&x<cup.x+1&&z>=cup.z-1&&z<cup.z+1)continue;tri([x,z],[x,z+1],[x+1,z+1]);tri([x,z],[x+1,z+1],[x+1,z]);}
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2,pt=(a,r)=>[cup.x+Math.cos(a)*r,cup.z+Math.sin(a)*r],out=a=>pt(a,1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a))));tri(pt(a,.275),out(a),out(b));tri(pt(a,.275),out(b),pt(b,.275));}
 const land=mesh('keep-par-five-terrain',terrain.p,terrain.i,turf,null,terrain.uv);land.setVerticesData(B.VertexBuffer.NormalKind,terrain.n);land.isPickable=false;renderer.removeShadowCaster(land);land.freezeWorldMatrix();
 function finish(m,mat=stone,shadow=true){m.material=mat;m.receiveShadows=true;m.isPickable=false;if(shadow)renderer.shadowCaster(m);return m;}
 const dark=renderer.material('keep-cup-dark',[.01,.014,.011],null,1),gold=renderer.material('keep-brass',[.66,.46,.18],null,.4);gold.metallic=.5;
 const cy=ground(cup.x,cup.z),wall=B.MeshBuilder.CreateCylinder('keep-cup-wall',{height:.52,diameter:.55,tessellation:40,sideOrientation:B.Mesh.BACKSIDE,cap:B.Mesh.NO_CAP},scene);wall.position.set(cup.x,cy-.26,cup.z);finish(wall,dark,false);
 const bottom=B.MeshBuilder.CreateDisc('keep-cup-bottom',{radius:.275,tessellation:40,sideOrientation:B.Mesh.DOUBLESIDE},scene);bottom.rotation.x=Math.PI/2;bottom.position.set(cup.x,cy-.52,cup.z);finish(bottom,dark,false);
 const flag=B.MeshBuilder.CreateCylinder('keep-flagpole',{height:4.3,diameter:.064,tessellation:12},scene);flag.position.set(cup.x,cy+2.15,cup.z);finish(flag,gold);
 // All architectural pieces share the scanned stone surface and are merged by cluster.
 let brickIndex=0;
 function block(name,x,y,z,w,h,d,yaw=0){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y+h/2,z);m.rotation.y=yaw;m.material=stone;const p=m.getVerticesData('position'),ns=m.getVerticesData('normal'),uv=[],colors=[],world=m.computeWorldMatrix(true),tint=.88+(Math.sin(++brickIndex*7.13)+1)*.07;for(let i=0;i<p.length;i+=3){const q=B.Vector3.TransformCoordinates(V(p[i],p[i+1],p[i+2]),world),n=B.Vector3.TransformNormal(V(ns[i],ns[i+1],ns[i+2]),world);uv.push((Math.abs(n.x)>.6?q.z:q.x)*.45,(Math.abs(n.y)>.6?q.z:q.y)*.45);colors.push(tint,tint,tint,1);}m.setVerticesData('uv',uv);m.setVerticesData('color',colors);stoneParts.push(m);return m;}
 function collider(x,z,r,height,id='keep-masonry'){colliders.push({x,z,r,height,id});}
 function flush(name){if(!stoneParts.length)return;const m=B.Mesh.MergeMeshes(stoneParts.splice(0),true,true);m.name=name;finish(m);m.freezeWorldMatrix();roots.push(m);}
 function tower(x,z,r,height){const y=Math.min(ground(x-r,z),ground(x+r,z),ground(x,z-r),ground(x,z+r))-.4;
  const body=B.MeshBuilder.CreateCylinder('keep-tower',{height,diameter:2*r,tessellation:96},scene);body.position.set(x,y+height/2,z);body.material=stone;const uv=body.getVerticesData('uv');for(let i=0;i<uv.length;i+=2){uv[i]*=Math.PI*2*r*.45;uv[i+1]*=height*.45;}body.setVerticesData('uv',uv);finish(body);body.freezeWorldMatrix();roots.push(body);
  for(let j=0;j<10;j++){const a=j/10*Math.PI*2;block('keep-battlement',x+Math.cos(a)*(r-.6),y+height-.08,z+Math.sin(a)*(r-.6),1.2,.98,1.3,Math.PI/2-a);}collider(x,z,r,height+2);flush('keep-battlements');}
 function curtain(ax,az,bx,bz,height){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),n=Math.ceil(len/1.5),nx=-dz/len,nz=dx/len,base=Math.min(...Array.from({length:n+1},(_,i)=>ground(ax+dx*i/n,az+dz*i/n)))-.4,p=[],ix=[],uv=[];
  function quad(q){const k=p.length/3;for(const v of q){p.push(...v);const u=((v[0]-ax)*dx+(v[2]-az)*dz)/len;const across=(v[0]-ax)*nx+(v[2]-az)*nz,isTop=q.every(t=>Math.abs(t[1]-q[0][1])<.0001),firstU=((q[0][0]-ax)*dx+(q[0][2]-az)*dz)/len,isEnd=q.every(t=>Math.abs(((t[0]-ax)*dx+(t[2]-az)*dz)/len-firstU)<.0001);uv.push((isEnd?across:u)*.45,(isTop?across:v[1])*.45);}ix.push(k,k+1,k+2,k,k+2,k+3);}
  let prevTop=null;for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,top=base+height*(.8+.15*Math.sin(i*.7))+(i%3===0?.65:0),pt=(t,side,y)=>[ax+dx*t+nx*side*.7,y,az+dz*t+nz*side*.7];
   quad([pt(a,-1,base),pt(b,-1,base),pt(b,-1,top),pt(a,-1,top)]);quad([pt(b,1,base),pt(a,1,base),pt(a,1,top),pt(b,1,top)]);quad([pt(a,-1,top),pt(b,-1,top),pt(b,1,top),pt(a,1,top)]);
   if(i===0)quad([pt(a,1,base),pt(a,-1,base),pt(a,-1,top),pt(a,1,top)]);else if(prevTop!==top)quad([pt(a,-1,prevTop),pt(a,1,prevTop),pt(a,1,top),pt(a,-1,top)]);
   if(i===n-1)quad([pt(b,-1,base),pt(b,1,base),pt(b,1,top),pt(b,-1,top)]);prevTop=top;collider(ax+dx*(a+b)/2,az+dz*(a+b)/2,1.1,height+1);
  }const m=mesh('keep-curtain-wall',p,ix,stone,null,uv);m.freezeWorldMatrix();roots.push(m);}
 tower(648,-655,6.2,23);tower(684,-620,4.7,16);curtain(652,-653,664.7,-641.3,8.5);curtain(669.3,-636.7,682,-622,8.5);
 const keepGateAngle=Math.PI/2-Math.atan2(29,28),keepGate=place('ceremonial_gate',667,ground(667,-639)-.12,-639,13,keepGateAngle);roots.push(keepGate);seatGateFeet(renderer,keepGate,stone,mesh,ground);buildGateIvy(renderer,keepGate);
 for(const side of [-1,1])collider(667+Math.cos(keepGateAngle-Math.PI/2)*side*4.7,-639-Math.sin(keepGateAngle-Math.PI/2)*side*4.7,1.4,13,'keep-gate');
 // A broken outer bailey is discovered on the second-shot side of the fairway.
 curtain(430,-512,463,-520,4.5);curtain(463,-520,480,-509,3.2);tower(432,-515,3.1,9);
 // Continuous, broad stone crossing from the second green; no loose stepping stones.
 const frames=[],start=ground(...KEEP_CROSSING[0]),end=ground(...KEEP_CROSSING.at(-1)),total=KEEP_CROSSING.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-KEEP_CROSSING[i][0],p[1]-KEEP_CROSSING[i][1]),0);let along=0;
 for(let i=0;i<KEEP_CROSSING.length-1;i++){const a=KEEP_CROSSING[i],b=KEEP_CROSSING[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),steps=Math.ceil(length);for(let j=0;j<steps;j++){const t=j/steps,x=a[0]+dx*t,z=a[1]+dz*t,f=(along+t*length)/total,shore=Math.max(ground(x,z),ground(x-dz/length*1.8,z+dx/length*1.8),ground(x+dz/length*1.8,z-dx/length*1.8));frames.push({x,z,nx:-dz/length,nz:dx/length,y:Math.max(shore+.045,start*(1-f)+end*f-1.1*Math.sin(f*Math.PI))});}along+=length;}
 const tail=frames.at(-1),endPoint=KEEP_CROSSING.at(-1);frames.push({...tail,x:endPoint[0],z:endPoint[1],y:ground(...endPoint)+.045});
 for(let i=0;i<frames.length;i++){const f=frames[i],a=frames[Math.max(0,i-1)],b=frames[Math.min(frames.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z);f.nx=-(b.z-a.z)/len;f.nz=(b.x-a.x)/len;if(i<12||i>frames.length-13)f.ground=Math.min(ground(f.x,f.z),ground(f.x+f.nx*2,f.z+f.nz*2),ground(f.x-f.nx*2,f.z-f.nz*2));}
 fitCrossingEnds(frames,ground,3.8);
 function ribbon(name,center,width,low,high){const data=crossingMeshData(frames,center,width,low,high,{abutments:center===0}),m=mesh(name,data.p,data.i,stone,null,data.uv);roots.push(m);return m;}
 ribbon('keep-crossing-deck',0,3.8,-.45,0);ribbon('keep-crossing-left',-1.95,.26,0,.35);ribbon('keep-crossing-right',1.95,.26,0,.35);
 for(let i=0;i<frames.length-9;i++){const f=frames[i];for(const side of [-1,1])collider(f.x+f.nx*side*1.95,f.z+f.nz*side*1.95,.18,.45,'keep-crossing-rail');if(i%14===0&&i>8){const data=crossingPierData(frames,i,1.8,1.8,.45);const m=mesh('keep-crossing-support',data.p,data.i,stone,null,data.uv);roots.push(m);}}flush('keep-crossing-supports');
 const crossingPoints=frames.map(f=>[f.x,f.z]);
 const crossingHeight=(x,z)=>{const p=nearestKeepPath(x,z,crossingPoints);if(p.distance>1.78)return null;return crossingWalkHeight(frames[p.segment],frames[p.segment+1],p.t,x,z);};
 const gateP=frames.find(f=>f.x>226),gateAngle=Math.PI/2-Math.atan2(19,20),gate=place('ceremonial_gate',gateP.x,gateP.y-.12,gateP.z,10.8,gateAngle);roots.push(gate);seatGateFeet(renderer,gate,stone,mesh,ground);buildGateIvy(renderer,gate);for(const side of [-1,1])collider(gateP.x+Math.cos(gateAngle-Math.PI/2)*side*3.7,gateP.z-Math.sin(gateAngle-Math.PI/2)*side*3.7,1.15,11,'keep-gate');
 function prop(id,x,z,h,angle=0){const tree=/tree|sapling/.test(id),y=ground(x,z),root=place(id,x,y-(tree?.12:/rock|boulder/.test(id)?h*.24:.03),z,h,angle,true);if(tree)groundTree(root,B);if(id==='coast_rocks_05'&&Math.hypot(x-350.8134,z+372.6252)<1)root.position.y-=1.95;roots.push(root);if(!/fern|shrub|grass|flower|periwinkle/.test(id))colliders.push(sceneryFootprint(root,id,B));return root;}
 // Reuse the established forest, with separate compositions at each bend.
 for(let i=0;i<24;i++){for(const side of [-1,1]){if((i+side+1)%9===4)continue;const p=keepPointAlong(20+i*(KEEP_LENGTH-40)/23+Math.sin(i*5.1+side)*8),distance=31+(Math.sin(i*4.2+side)+1)*3.5,x=p.x+p.nx*side*distance,z=p.z+p.nz*side*distance;if(keepGreenRadius(x,z)<1.65||colliders.some(c=>c.id==='keep-masonry'&&Math.hypot(c.x-x,c.z-z)<c.r+5))continue;prop('pine_tree_01',x,z,48+(i%5)*4,(i*2.399+side)*1.1);if(i%4===0)prop('tree_small_02',p.x+p.nx*side*26,p.z+p.nz*side*26,10+(i%3),i*1.7);if(i%7===2)prop('fir_sapling_medium',p.x+p.nx*side*29+4,p.z+p.nz*side*29-5,22+(i%3),i*1.9);}}
 for(const [i,[x,z,h]]of [[630,-590,10],[670,-599,9],[606,-591,8],[386,-430,10]].entries())if(keepSurface(x,z)==='rough')prop('jacaranda_tree',x,z,h,i*2.1);
 for(let i=0;i<15;i++){const p=keepPointAlong(i/14*KEEP_LENGTH),side=i%2?1:-1,x=p.x+p.nx*side*46,z=p.z+p.nz*side*46;if(nearestKeepPath(x,z,KEEP_CROSSING).distance<13)continue;prop(['coast_rocks_05','namaqualand_boulder_04','coast_rocks_01'][i%3],x,z,7+i%4*2,i*1.7);}
 for(let i=0;i<74;i++){const p=keepPointAlong((i*.618033%1)*KEEP_LENGTH),side=i%2?1:-1,x=p.x+p.nx*side*(24+Math.sin(i*7.1)*4),z=p.z+p.nz*side*(24+Math.sin(i*7.1)*4);if(keepSurface(x,z)!=='rough'||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.4))continue;prop(i%4?'fern_02':'shrub_03',x,z,i%4?.7:1.15,i*2.3);}
 // Additional forest layers: clustered giants, middle-storey trees and sparse floor pockets.
 let detailSeed=24024;const detailRand=()=>((detailSeed=(Math.imul(detailSeed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<88;i++){const p=keepPointAlong(8+detailRand()*(KEEP_LENGTH-12)),side=detailRand()>.5?1:-1,d=27+detailRand()*13,x=p.x+p.nx*side*d,z=p.z+p.nz*side*d;
  if(keepSurface(x,z)!=='rough'||ground(x,z)<.4||keepGreenRadius(x,z)<1.65||nearestKeepPath(x,z,KEEP_CROSSING).distance<8||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+4))continue;
  const id=i%4===0?'tree_small_02':i%4===1?'fir_sapling_medium':'pine_tree_01';prop(id,x,z,id==='pine_tree_01'?48+detailRand()*18:id==='fir_sapling_medium'?19+detailRand()*9:9+detailRand()*5,detailRand()*6.28);
 }
 for(let cluster=0;cluster<60;cluster++){const p=keepPointAlong(detailRand()*KEEP_LENGTH),side=detailRand()>.5?1:-1,d=24+detailRand()*13,cx=p.x+p.nx*side*d,cz=p.z+p.nz*side*d;
  for(let j=0;j<5;j++){const x=cx+(detailRand()-.5)*7,z=cz+(detailRand()-.5)*7;if(keepSurface(x,z)!=='rough'||ground(x,z)<.1||keepGreenRadius(x,z)<1.4||nearestKeepPath(x,z,KEEP_CROSSING).distance<5||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.65))continue;
   const ids=['fern_02','grass_medium_01','periwinkle_plant','shrub_03','grass_bermuda_01'],id=ids[(cluster+j)%5];prop(id,x,z,id==='shrub_03'?.85+detailRand()*.5:id==='fern_02'?.65+detailRand()*.45:.28+detailRand()*.24,detailRand()*6.28);
  }
 }
 prop('wooden_lantern_01',243,-311.8,.68,-.8);
 courseSign(renderer,'keep-wayfinding',174.8,ground(174.8,-246.1),-246.1,-.7,'THE SUNKEN KEEP','HOLE 3  /  PAR 5  >');collider(174.8,-246.1,1,2.5,'keep-sign');
 const casters=renderer.shadows.getShadowMap().renderList.filter(m=>!before.has(m));renderer.shadows.getShadowMap().renderList=[...before];const guides=buildGolfAssets(renderer,{x:647,z:-569,stretch:1,cup:course.cup,greenBounds:[-14,22,-66,-36]});let shadowCell='',nextCull=0;const cullRecords=roots.filter(r=>!r.name.startsWith('keep-')).map(root=>({root,small:/fern|shrub|grass|flower|periwinkle/.test(root.name)}));
 return{guides,crossingHeight,update(eye,active,quality){if(!active){shadowCell='';return;}const x=Math.round(eye.x/65)*65,z=Math.round(eye.z/65)*65,key=x+','+z;if(key!==shadowCell){shadowCell=key;scene.getLightByName('afternoon-sun').position.set(x+50,90,z+75);renderer.shadows.getShadowMap().renderList=renderer.localShadowCasters(eye);renderer.bakeShadow();}},report:{name:course.name,par:5,tee:course.tee,cup:course.cup,yards:Math.round(KEEP_LENGTH/.9144),route:KEEP_ROUTE,crossing:frames.map(f=>[f.x,f.z]),bunkers:KEEP_BUNKERS,statues:0,towers:3,trees:roots.filter(r=>/tree|sapling/.test(r.name)).length}};
}
