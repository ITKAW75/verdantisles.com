// One discovery per round. The reward survives hole transitions, but never stacks.
export function createSpeedBoost(location){
 let collected=false;
 return{location,get collected(){return collected;},get multiplier(){return collected?1.5:1;},collect(player,floorY){if(collected||Math.hypot(player.x-location.x,player.z-location.z)>1.05||Math.abs(floorY-location.deck)>.65)return false;collected=true;return true;},reset(){collected=false;}};
}
export function buildSpeedCoin(renderer,dock){
 const {B,scene}=renderer,location={x:dock.end-.55,z:dock.z,deck:dock.deck},state=createSpeedBoost(location),root=new B.TransformNode('secret-gold-coin',scene),face=new B.TransformNode('coin-engraving',scene);
 face.parent=root;face.rotation.x=Math.PI/2;
 const gold=renderer.material('old-gold-coin',[.83,.52,.12],null,.26);gold.metallic=1;gold.emissiveColor=new B.Color3(.10,.055,.005);
 const inset=renderer.material('gold-coin-relief',[.45,.23,.035],null,.35);inset.metallic=.95;
 const body=B.MeshBuilder.CreateCylinder('gold-coin-body',{height:.075,diameter:.70,tessellation:64},scene);body.parent=face;body.material=gold;
 for(const side of [-1,1]){
  const rim=B.MeshBuilder.CreateTorus('coin-raised-rim',{diameter:.62,thickness:.025,tessellation:48},scene);rim.parent=face;rim.position.y=side*.047;rim.material=gold;
  const inner=B.MeshBuilder.CreateTorus('coin-inner-engraving',{diameter:.50,thickness:.008,tessellation:40},scene);inner.parent=face;inner.position.y=side*.041;inner.material=inset;
  // Embossed compass rose: a quiet connection to the navigator's equipment.
  for(let i=0;i<8;i++){const a=i*Math.PI/4,length=i%2?.13:.22,positions=[0,side*.051,0,Math.sin(a-.22)*.06,side*.051,Math.cos(a-.22)*.06,Math.sin(a)*length,side*.058,Math.cos(a)*length,Math.sin(a+.22)*.06,side*.051,Math.cos(a+.22)*.06],m=new B.Mesh('coin-compass-ray',scene),d=new B.VertexData();d.positions=positions;d.uvs=[.5,.5,0,0,.5,1,1,0];d.indices=[0,1,2,0,2,3];d.normals=[];B.VertexData.ComputeNormals(positions,d.indices,d.normals);d.applyToMesh(m);m.parent=face;m.material=i%2?inset:gold;}
 }
 for(let i=0;i<40;i++){const a=i*Math.PI/20,m=B.MeshBuilder.CreateBox('coin-milled-edge',{width:.008,height:.05,depth:.014},scene);m.parent=face;m.position.set(Math.sin(a)*.348,0,Math.cos(a)*.348);m.rotation.y=a;m.material=inset;}
 // Merge the coin once, preserving its two metal materials.
 const meshes=root.getChildMeshes();for(const m of meshes)m.computeWorldMatrix(true);const merged=B.Mesh.MergeMeshes(meshes,true,true,undefined,false,true);merged.parent=root;merged.isPickable=false;
 return{state,update(time){root.setEnabled(!state.collected);root.position.set(location.x,location.deck+1.12+Math.sin(time*1.5)*.12,location.z);root.rotation.y=time*.9;},collect(player,floorY){const got=state.collect(player,floorY);if(got)root.setEnabled(false);return got;},reset(){state.reset();root.setEnabled(true);}};
}
