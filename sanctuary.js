import {fitCrossingEnds,crossingWalkHeight,crossingMeshData,crossingPierData,courseSign,seatGateFeet} from './crossing-mesh.js';
import {buildSandcastle} from './course-magic.js';
import {COURSES,SANCTUARY,sanctuaryWorld,CROSSING,crossingPoint} from './courses.js';
import {ground,slope,greenRadius,surface} from './physics.js';
import {landscapeMaterial} from './landscape.js';
import {groundTree,sceneryFootprint,seatOnGround} from './forest.js';
import {buildGolfAssets} from './golf-assets.js';
import {sanctuaryDetails} from './sanctuary-details.js';
export function buildSanctuary(renderer,place,mesh,colliders,models){
 const {B,scene}=renderer,V=(x,y,z)=>new B.Vector3(x,y,z),course=COURSES[1],roots=[],details=[],stoneMeshes=[];
 const turf=landscapeMaterial(renderer,SANCTUARY),stone=models.get('ceremonial_gate').materials.find(m=>m.albedoTexture)||renderer.material('sanctuary-stone',[.35,.38,.29],null,.97);
 const bridgeStone=renderer.material('crossing-scanned-stone',[.72,.74,.65],'mossy_rock-Diffuse.jpg',.98);bridgeStone.bumpTexture=renderer.texture('mossy_rock-nor_gl.jpg');bridgeStone.bumpTexture.level=.25;
 const firstCasters=[...renderer.shadows.getShadowMap().renderList];
 const finish=(m,material,shadow=true)=>{m.material=material;m.receiveShadows=true;m.isPickable=false;if(shadow)renderer.shadowCaster(m);return m;};
 const box=(name,x,y,z,w,h,d,angle=0)=>{const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y+h/2,z);m.rotation.y=angle;const pos=m.getVerticesData("position"),norm=m.getVerticesData("normal"),uv=[];for(let i=0;i<pos.length;i+=3)uv.push((Math.abs(norm[i])>.5?pos[i+2]:pos[i])*.45,(Math.abs(norm[i+1])>.5?pos[i+2]:pos[i+1])*.45);m.setVerticesData("uv",uv);return finish(m,bridgeStone);};
 const addCollider=(x,z,r,height=5)=>colliders.push({x,z,r,height,id:'sanctuary-stone'});
 function seatRock(root,height){
  root.computeWorldMatrix(true);const bounds=root.getHierarchyBoundingVectors(true),gaps=[];
  for(const m of root.getChildMeshes()){const p=m.getVerticesData('position');if(!p)continue;const w=m.computeWorldMatrix(true);for(let i=0;i<p.length;i+=9){const q=B.Vector3.TransformCoordinates(V(p[i],p[i+1],p[i+2]),w);if(q.y<bounds.min.y+height*.12)gaps.push(q.y-ground(q.x,q.z));}}
  gaps.sort((a,b)=>a-b);const lower=gaps[Math.floor(gaps.length*.86)]||0;root.position.y-=Math.max(.10,Math.min(height*.75,lower+.22));root.computeWorldMatrix(true);
 }
 function prop(id,x,z,height,angle=0){const p=sanctuaryWorld(x,z),tree=/tree|sapling/.test(id);if(tree&&crossingPoint(p.x,p.z).distance<5)p.x-=7;const root=place(id,p.x,seatOnGround(p.x,p.z,tree?.6:height*.12,tree?.18:.18),p.z,height,angle,true);roots.push(root);if(/rock|boulder/.test(id))seatRock(root,height);if(tree)groundTree(root,B);if(id==='island_tree_02')root.position.y-=.26;if(!/grass|fern|flower|shrub|searsia/.test(id)){const c=sceneryFootprint(root,id,B);colliders.push(c);}return root;}
 // The second fairway keeps the approved surface palette and mowing texture.
 const data={p:[],i:[],uv:[],c:[]},cx=course.cup.x,cz=course.cup.z;
 function tri(a,b,c){for(const [x,z]of[a,b,c]){data.i.push(data.p.length/3);data.p.push(x,ground(x,z),z);data.uv.push(x/4,z/4);data.c.push(.8,.95,.65,1);}}
 for(let z=cz-42;z<cz+155;z+=.75)for(let x=cx-60;x<cx+62;x+=.75){if(x+.375>195&&z+.375< -269.5)continue;if(ground(x+.375,z+.375)<-6.44)continue;if(Math.abs(x+.375-cx)<1.5&&Math.abs(z+.375-cz)<1.5)continue;tri([x,z],[x,z+.75],[x+.75,z+.75]);tri([x,z],[x+.75,z+.75],[x+.75,z]);}
 // The grid is centered on the cup: its 3m square opening meets this annulus.
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2,point=(t,r)=>[cx+Math.cos(t)*r,cz+Math.sin(t)*r],outer=t=>point(t,1.5/Math.max(Math.abs(Math.cos(t)),Math.abs(Math.sin(t))));tri(point(a,.275),outer(a),outer(b));tri(point(a,.275),outer(b),point(b,.275));}
 const terrain=mesh('sanctuary-fairway',data.p,data.i,turf,data.c,data.uv);renderer.removeShadowCaster(terrain);const normals=[];for(let i=0;i<data.p.length;i+=3){const sl=slope(data.p[i],data.p[i+2]),len=Math.hypot(sl.x,1,sl.z);normals.push(-sl.x/len,1/len,-sl.z/len);}terrain.setVerticesData(B.VertexBuffer.NormalKind,normals);terrain.freezeWorldMatrix();
 const cy=ground(cx,cz),cupMat=renderer.material('sanctuary-cup',[.012,.016,.013],null,1),metal=renderer.material('sanctuary-brass',[.66,.46,.18],null,.36);metal.metallic=.5;
 const cup=B.MeshBuilder.CreateCylinder('sanctuary-cup-wall',{height:.52,diameter:.55,tessellation:40,sideOrientation:B.Mesh.BACKSIDE,cap:B.Mesh.NO_CAP},scene);cup.position.set(cx,cy-.26,cz);finish(cup,cupMat,false);
 const bottom=B.MeshBuilder.CreateDisc('sanctuary-cup-bottom',{radius:.275,tessellation:40,sideOrientation:B.Mesh.DOUBLESIDE},scene);bottom.rotation.x=Math.PI/2;bottom.position.set(cx,cy-.53,cz);finish(bottom,cupMat,false);
 const pole=B.MeshBuilder.CreateCylinder('sanctuary-flagpole',{height:4.3,diameter:.064,tessellation:12},scene);pole.position.set(cx,cy+2.15,cz);finish(pole,metal);
 // Deliberately composed forest: giant outer trunks and medium interior crowns.
 for(const [i,[x,z,h]]of [[-22,35,53],[25,31,57],[-27,17,62],[26,11,54],[-27,-5,59],[29,-19,61],[-29,-33,57],[29,-47,56],[-23,-66,59],[18,-68,52],[-15,49,47],[15,46,50],[-32,3,45],[32,-4,49],[-31,-49,52],[30,-62,47]].entries())prop('pine_tree_01',x,z,h,i*2.399);
 for(const [i,[id,x,z,h]]of [['island_tree_02',-18,27,10],['tree_small_02',21,21,11],['fir_sapling_medium',-23,6,23],['tree_small_02',23,-3,10],['fir_sapling_medium',-23,-33,24],['jacaranda_tree',20,-52,9],['jacaranda_tree',-16,-63,8],['tree_small_02',-25,-49,10]].entries())prop(id,x,z,h,i*1.7);
 for(const [i,[x,z,h]]of [[-34,32,7],[34,28,8],[-34,4,6],[31,-13,8],[-35,-32,7],[31,-49,9],[-27,-73,9],[8,-78,7],[27,-73,8]].entries())if(i!==3)prop(['namaqualand_boulder_04','namaqualand_boulder_02','coast_rocks_05'][i%3],x,z,h,i*1.37);
 let seed=19019;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<170;i++){const x=(random()>.5?1:-1)*(17+random()*12),z=43-random()*109,p=sanctuaryWorld(x,z);if(surface(p.x,p.z)!=='rough'||greenRadius(p.x,p.z)<1.4||ground(p.x,p.z)<-.8)continue;const id=i%7===0?'shrub_03':i%3===0?'fern_02':'grass_medium_01';const root=prop(id,x,z,id==='shrub_03'?1.2:id==='fern_02'?.9:.5,random()*6.28);details.push(root);}
 // The guardian and its masonry base were removed; the original grassy mound stays.
 for(const [i,[dx,dz,h]]of [[-4.8,2.8,1.4],[4.7,2.2,1.2],[-4.4,-3.4,1.1],[4.8,-3.5,1.3]].entries())prop(i%2?'fern_02':'shrub_03',-23+dx,-14+dz,h,i*1.7);
 // One continuous ribbon: shared edges at every bend and matching walk heights.
 const lengths=CROSSING.slice(1).map((p,i)=>Math.hypot(p[0]-CROSSING[i][0],p[1]-CROSSING[i][1])),total=lengths.reduce((a,b)=>a+b,0),startY=ground(...CROSSING[0]),endY=ground(...CROSSING.at(-1)),cumulative=[0];for(const len of lengths)cumulative.push(cumulative.at(-1)+len);
 const heights=CROSSING.map((p,i)=>{const f=cumulative[i]/total,a=CROSSING[Math.max(0,i-1)],b=CROSSING[Math.min(CROSSING.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=(b[1]-a[1])/len,nz=-(b[0]-a[0])/len,shore=Math.max(ground(...p),ground(p[0]+nx*2.4,p[1]+nz*2.4),ground(p[0]-nx*2.4,p[1]-nz*2.4));return Math.max(startY+(endY-startY)*f-1.55*Math.sin(f*Math.PI)**2,shore+.035);});
 const frames=CROSSING.map(([x,z],i)=>{const a=CROSSING[Math.max(0,i-1)],b=CROSSING[Math.min(CROSSING.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1]);return{x,z,y:heights[i],ground:i<12||i>CROSSING.length-13?Math.min(ground(x,z),ground(x+2.5,z),ground(x-2.5,z)):undefined,nx:(b[1]-a[1])/len,nz:-(b[0]-a[0])/len};});
 fitCrossingEnds(frames,ground,4.8);
 function heightAt(segment,t){return frames[segment].y+(frames[segment+1].y-frames[segment].y)*t;}
 function ribbon(name,center,width,bottom,top){const data=crossingMeshData(frames,center,width,bottom,top,{abutments:center===0});const m=mesh(name,data.p,data.i,bridgeStone,null,data.uv);return m;}
 ribbon('continuous-crossing-deck',0,4.8,-.52,0);for(const side of [-1,1])ribbon('continuous-crossing-parapet',side*2.35,.34,0,.48);
 for(let i=0;i<frames.length;i++){const p=frames[i];for(const side of [-1,1])addCollider(p.x+p.nx*side*2.35,p.z+p.nz*side*2.35,.28,.5);if(i%14===0&&i>8&&i<frames.length-12){const data=crossingPierData(frames,i,2.6,1.5,.52);mesh('crossing-support',data.p,data.i,bridgeStone,null,data.uv);}}
 const crossingHeight=(x,z)=>{const p=crossingPoint(x,z);return p.distance<=2.15?crossingWalkHeight(frames[p.segment],frames[p.segment+1],p.t,x,z):null;};
 const crossing={point(f){let i=0;while(i<lengths.length-1&&cumulative[i+1]<total*f)i++;const t=(total*f-cumulative[i])/lengths[i],a=frames[i],b=frames[i+1];return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:heightAt(i,t),nx:a.nx,nz:a.nz};}};
 // Align the opening to the final straight approach, not the terrain's local axis.
 const gateX=150,gateZ=-134.5,gateY=Math.max(ground(gateX,gateZ),crossingHeight(gateX,gateZ)??-10),gateAngle=Math.PI/2-Math.atan2(12,18);
 const gate=place('ceremonial_gate',gateX,gateY-.12,gateZ,9.5,gateAngle);roots.push(gate);seatGateFeet(renderer,gate,bridgeStone,mesh,ground);const ax=Math.cos(gateAngle-Math.PI/2),az=-Math.sin(gateAngle-Math.PI/2);for(const side of [-1,1])addCollider(gateX+side*ax*3.2,gateZ+side*az*3.2,1.05,9.5);
 // Low growth roots the gate's outer corners in the rough without narrowing the opening.
 for(const [side,d]of [[-1,-1.2],[1,.7]]){const x=gateX+side*ax*4.25+Math.sin(gateAngle-Math.PI/2)*d,z=gateZ+side*az*4.25+Math.cos(gateAngle-Math.PI/2)*d;if(surface(x,z)!=='rough')continue;const root=place('fern_02',x,seatOnGround(x,z,.4,.05),z,.75,side*.9,false);roots.push(root);}
 // Matching physical wayfinding, with posts reaching into the board.
 courseSign(renderer,'sanctuary-sign',21.1,ground(21.1,-59.8),-59.8,-.65,'ELDER SANCTUARY','HOLE 2  /  PAR 3  >');addCollider(21.1,-59.8,1,2.5);
 // A quiet second tee: only the ball and a lantern resting on the turf.
 const tee=course.tee,lx=tee.x+2.4,lz=tee.z+1.495;const teeLantern=place('wooden_lantern_01',lx,ground(lx,lz)+.01,lz,.68,-.8);roots.push(teeLantern);colliders.push(sceneryFootprint(teeLantern,'wooden_lantern_01',B));
 buildSandcastle(renderer,195,-168);
 const ambience=sanctuaryDetails(renderer,gate,crossing);
 // Shared stone surfaces are one draw, not hundreds of little bridge objects.
 for(const m of stoneMeshes)renderer.removeShadowCaster(m);
 if(stoneMeshes.length){const masonry=B.Mesh.MergeMeshes(stoneMeshes,true,true,undefined,false,false);masonry.name='sanctuary-masonry';finish(masonry,stone);}
 const newCasters=renderer.shadows.getShadowMap().renderList.filter(m=>!firstCasters.includes(m));renderer.shadows.getShadowMap().renderList=firstCasters;
 let shadowZone=0;const guides=buildGolfAssets(renderer,SANCTUARY);
 return {course,terrain,guides,crossingHeight,roots,update(eye,time,force=false){ambience.update(time,eye);const next=eye.x>95?1:0;if(force||next!==shadowZone){shadowZone=next;const sun=scene.getLightByName('afternoon-sun');sun.position.set(50+next*155,90,75-next*175);renderer.shadows.getShadowMap().renderList=next?newCasters:firstCasters;renderer.bakeShadow();}},report:{name:course.name,par:course.par,tee:course.tee,cup:course.cup,crossing:CROSSING,crossingLength:total,guardianCount:0,guardianHeight:0,gateway:{x:gateX,z:gateZ,angle:gateAngle},ambience:ambience.report,newAssets:['ceremonial_gate']}};
}
