import {ground} from './physics.js';
import {plantingAllowed,beachTrail} from './scenery.js';
import {seatOnGround} from './forest.js';

export const approvedAssets=['shrub_sorrel_01','rock_moss_set_02','flower_empodium','shrub_01','sand_rocks_small_01','tree_stump_02','wooden_barrels_01','cannon_01','stone_fire_pit','wooden_bucket_02','nettle_plant','periwinkle_plant','weed_plant_02','island_tree_02','shrub_03','shrub_04','flower_gazania','flower_ursinia','flower_stinkkruid','fir_sapling','fir_tree_01','tree_small_02','crystalline_iceplant','namaqualand_rocks_01','tree_stump_01','wooden_crate_02','wicker_basket_01','ceramic_pot','wine_bottles_01','wooden_axe_02','wooden_hammer_01','wooden_table_02','wooden_handle_saber','wooden_stool_02','wooden_bowl_02','brass_pot_01','vintage_pocket_watch','magnifying_glass_01','modular_wooden_pier','brass_goblets'];
export const softPlant=id=>/grass|flower|fern|moss_01|sorrel|nettle|periwinkle|weed_plant|iceplant/.test(id);
export const smallProp=id=>/bowl|goblets|watch|magnifying|hammer|saber|axe|wine_bottles/.test(id);
export const inLandingClearing=(x,z)=>Math.hypot((x-29)/4.2,(z-15.5)/4.7)<1;

export function buildLanding(renderer,place,items,details){
 const {B}=renderer,report={groups:[],approved:approvedAssets,shovel:true};
 const prop=(id,x,z,h,a=0)=>place(id,x,seatOnGround(x,z,.25,.035),z,h,a);
 function bounds(root){let lo=new B.Vector3(Infinity,Infinity,Infinity),hi=lo.scale(-1);for(const m of root.getChildMeshes()){if(!m.getTotalVertices())continue;m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;lo=B.Vector3.Minimize(lo,b.minimumWorld);hi=B.Vector3.Maximize(hi,b.maximumWorld);}return{lo,hi};}
 // Seat small equipment on the actual mesh, including inset tabletops and lids.
 function topAt(root,x,z){const ray=new B.Ray(new B.Vector3(x,bounds(root).hi.y+2,z),new B.Vector3(0,-1,0),20);let y=-Infinity;for(const m of root.getChildMeshes()){if(!m.getTotalVertices())continue;const hit=ray.intersectsMesh(m,false);if(hit?.hit)y=Math.max(y,hit.pickedPoint.y);}return Number.isFinite(y)?y:bounds(root).hi.y;}
 function onTop(id,support,x,z,h,a=0,lay=false){const root=place(id,x,topAt(support,x,z)+.006,z,h,a,false);if(lay){root.rotation[lay==='x'?'x':'z']=(lay==='x'?-1:1)*Math.PI/2;const b=bounds(root);root.position.x+=x-(b.lo.x+b.hi.x)/2;root.position.z+=z-(b.lo.z+b.hi.z)/2;root.position.y+=topAt(support,x,z)+.008-b.lo.y;}return root;}

 // Recently unloaded supplies, with a generous open approach from the beach path.
 prop('wooden_barrels_01',41.7,15.5,1.08,.2);
 prop('wooden_barrels_01',42.65,14.6,.92,-.5);
 const crate=prop('wooden_crate_02',39,15.4,.76,.12);
 prop('wooden_bucket_02',41.25,17.15,.49,-.3);
 prop('wicker_basket_01',37.75,16.4,.52,.35);
 prop('ceramic_pot',38.1,17.55,.52,-.1);
 onTop('wine_bottles_01',crate,38.82,15.4,.31,.3);
 onTop('wooden_hammer_01',crate,39.2,15.4,.33,.4,true);
 onTop('wooden_handle_saber',crate,39,15.2,.72,1.1,true);
 prop('cannon_01',45.1,10.4,1.18,Math.PI/2);
 // A single short landing stage sits beside the hull, not across the walking path.
 for(const x of [56.6,59.2,61.8,64.4,67,69.6])place('modular_wooden_pier',x,-6.46,12,3.8,Math.PI/2);
 report.dock={start:55.05,end:70.8,z:12,halfWidth:.82,deck:-3.60};
 report.groups.push({name:'Landing cargo and lookout',x:41,z:15});

 // An unlit stone ring and a compact navigation table above the beach.
 // Fire ring removed after the annotated review.
 const table=prop('wooden_table_02',29,16.5,.84,-.18);
 prop('wooden_stool_02',27.65,16.5,.48,.2);
 onTop('wooden_bowl_02',table,29.3,16.65,.24,.2);
 onTop('brass_goblets',table,28.75,16.55,.17,.3);
 onTop('vintage_pocket_watch',table,29.25,16.3,.10,.1,'x');
 onTop('magnifying_glass_01',table,28.75,16.25,.19,.7,'x');
 // Cooking pot removed after the annotated review.
 const stump=prop('tree_stump_02',28,12,.66,1.2);
 onTop('wooden_axe_02',stump,28,12,.67,.4,true);
 prop('tree_stump_01',-23,19,.7,2.4);
 // A maintenance tool on the outer grass lip, never in the playable bunker.
 const shovel=prop('bunker_shovel',18.5,-2.2,1.14,-.6);shovel.rotation.z=.13;
 const sb=bounds(shovel);shovel.position.y+=ground(18.5,-2.2)-sb.lo.y-.045;
 report.groups.push({name:'Woodland navigation clearing',x:29,z:16.5});

 // Different ages of tree grow in gaps in the established canopy.
 for(const [id,x,z,h,a]of[
  ['island_tree_02',-25,3,8.2,.6],['tree_small_02',25,-29,7.8,1.2],
  ['fir_tree_01',-20,2,54,2.2],['fir_sapling',20,-17,5.7,1.4],['fir_sapling',-19,39,4.2,2.8]
 ])if(plantingAllowed(x,z,2)&&!beachTrail(x,z))prop(id,x,z,h,a);

 // Species occur in small colonies, not a catalogue row or a random scatter.
 const colonies=[
  ['shrub_sorrel_01',-18,24,.24,7],['fern_02',-22,11,.45,3],
  ['periwinkle_plant',20,24,.34,6],['weed_plant_02',-18,-16,.32,6],
  ['flower_empodium',20,30,.31,5],['flower_gazania',24,19,.26,4],
  ['flower_ursinia',-16,40,.32,4],['flower_stinkkruid',23,-32,.36,4],
  ['fern_02',-21,35,.65,3],['shrub_03',23,-7,1.1,3],['shrub_04',-23,-30,1.12,3]
 ];
 let seed=1212;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const planted=[];
 for(const [id,cx,cz,h,count]of colonies){let n=0;for(let attempt=0;attempt<60&&n<count;attempt++){
  const x=cx+(rand()-.5)*4.2,z=cz+(rand()-.5)*4.2,r=/^shrub_0/.test(id)?.8:.32;
  if(!plantingAllowed(x,z,r)||beachTrail(x,z)||inLandingClearing(x,z))continue;
  if(items.some(a=>!a.removed&&(/tree|sapling|rock|boulder|searsia/.test(a.id))&&Math.hypot(a.x-x,a.z-z)<(r+.9)))continue;
  if(planted.some(a=>Math.hypot(a.x-x,a.z-z)<r*1.7))continue;
  const root=prop(id,x,z,h*(.85+rand()*.3),rand()*6.28);planted.push({x,z});n++;
  if(softPlant(id))details.push({root,x,z});
 }report.groups.push({name:id,count:n,x:cx,z:cz});}

 // Salt-tolerant ground cover and small stones join the wild coast to the cove.
 for(const [x,z,h]of[[34,27,.24],[35,27.8,.22],[35.5,26.8,.27],[34.5,28.6,.23]]){const root=prop('crystalline_iceplant',x,z,h,.8);details.push({root,x,z});}
 for(const [id,x,z,h,a]of[
  ['rock_moss_set_02',-23,22,1.05,.6],['rock_moss_set_02',25,-40,.85,2.2],
  ['namaqualand_rocks_01',35,29,1.45,1.4],['namaqualand_rocks_01',59,17,1.2,.6],
  ['sand_rocks_small_01',46,26,.36,.5],['sand_rocks_small_01',49,23,.29,2.1],['sand_rocks_small_01',57,18,.32,1.3]
 ])place(id,x,seatOnGround(x,z,h*.35,h*.20),z,h,a);
 return report;
}
