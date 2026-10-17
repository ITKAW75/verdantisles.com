import {ground} from './physics.js';
export function createJump(){return{unlocked:false,airborne:false,y:0,velocity:0,unlock(){this.unlocked=true;},start(floor){if(!this.unlocked||this.airborne)return false;this.y=floor;this.velocity=4.4;this.airborne=true;return true;},step(dt,floor){if(!this.airborne){this.y=floor;return;}this.velocity-=12*dt;this.y+=this.velocity*dt;if(this.y<=floor&&this.velocity<=0){this.y=floor;this.velocity=0;this.airborne=false;}},reset(){this.unlocked=false;this.airborne=false;this.velocity=0;}};}
export function buildJumpPickup(renderer){
 const {B,scene}=renderer,location={x:198,z:-171},root=new B.TransformNode('secret-jump-medallion',scene);let collected=false;
 const jade=renderer.material('jump-jade',[.13,.48,.35],null,.27);jade.metallic=.65;jade.emissiveColor=new B.Color3(.04,.12,.07);
 const gold=renderer.material('jump-gold',[.8,.53,.15],null,.3);gold.metallic=.9;
 const coin=B.MeshBuilder.CreateCylinder('jump-coin',{height:.08,diameter:.62,tessellation:48},scene);coin.rotation.x=Math.PI/2;coin.parent=root;coin.material=jade;
 const rim=B.MeshBuilder.CreateTorus('jump-rim',{diameter:.61,thickness:.03,tessellation:48},scene);rim.rotation.x=Math.PI/2;rim.parent=root;rim.material=gold;
 for(const z of [-.052,.052])for(const side of [-1,1]){const m=B.MeshBuilder.CreateBox('jump-chevron',{width:.22,height:.045,depth:.018},scene);m.parent=root;m.position.set(side*.071,.01,z);m.rotation.z=-side*Math.PI/4;m.material=gold;}
 for(const m of root.getChildMeshes())m.isPickable=false;
 return{location,get collected(){return collected;},collect(player){if(collected||Math.hypot(player.x-location.x,player.z-location.z)>1.15)return false;collected=true;root.setEnabled(false);return true;},reset(){collected=false;root.setEnabled(true);},update(t){if(collected)return;root.position.set(location.x,ground(location.x,location.z)+1.05+Math.sin(t*1.8)*.13,location.z);root.rotation.y=t*.75;}};
}
