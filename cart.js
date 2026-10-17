import {ground} from './physics.js';
export const CART_PICKUP={x:251,z:-322};
// A movement ability, not a vehicle simulation. Four times base walking speed;
// the earlier walking blessing does not stack with the cart.
export function createCart(){return{
 unlocked:false,mounted:false,remaining:0,speed:0,heading:0,steer:0,
 get busy(){return this.remaining>0;},
 unlock(){this.unlocked=true;},
 toggle(yaw){if(!this.unlocked||this.busy)return false;this.remaining=2;this.speed=0;this.steer=0;this.heading=yaw;return true;},
 step(dt,throttle,steering){
  if(this.busy){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining<1e-8){this.remaining=0;this.mounted=!this.mounted;}return{x:0,z:0};}
  if(!this.mounted)return{x:0,z:0};
  const target=Math.max(-1,Math.min(1,throttle))*(throttle<0?10:28),rate=throttle?12:20;
  this.speed+=Math.sign(target-this.speed)*Math.min(Math.abs(target-this.speed),rate*dt);
  this.steer+=(Math.max(-1,Math.min(1,steering))-this.steer)*(1-Math.exp(-7*dt));
  this.heading+=this.steer*1.1*Math.min(1,Math.abs(this.speed)/4)*Math.sign(this.speed)*dt;
  return{x:Math.sin(this.heading)*this.speed*dt,z:-Math.cos(this.heading)*this.speed*dt};
 },
 stop(){this.speed=0;this.steer=0;},
 reset(){this.unlocked=false;this.mounted=false;this.remaining=0;this.speed=0;this.heading=0;this.steer=0;}
};}
export function buildCartPickup(renderer){
 const {B,scene}=renderer,root=new B.TransformNode('secret-cart-medallion',scene);let collected=false;
 const brass=renderer.material('cart-brass',[.78,.53,.20],null,.3);brass.metallic=.85;
 const teal=renderer.material('cart-enamel',[.045,.24,.25],null,.3);teal.metallic=.4;teal.emissiveColor=new B.Color3(.025,.075,.065);
 const body=B.MeshBuilder.CreateCylinder('cart-medal',{diameter:.75,height:.07,tessellation:40},scene);body.rotation.x=Math.PI/2;body.parent=root;body.material=teal;
 const rim=B.MeshBuilder.CreateTorus('cart-rim',{diameter:.72,thickness:.035,tessellation:40},scene);rim.rotation.x=Math.PI/2;rim.parent=root;rim.material=brass;
 // Small embossed wheel-and-canopy emblem on both faces.
 for(const side of [-1,1]){
  for(const x of [-.16,.16]){const wheel=B.MeshBuilder.CreateTorus('cart-emblem-wheel',{diameter:.13,thickness:.024,tessellation:16},scene);wheel.rotation.x=Math.PI/2;wheel.parent=root;wheel.position.set(x,-.14,side*.055);wheel.material=brass;}
  for(const [x,y,w,h]of [[0,-.065,.43,.045],[0,.16,.46,.035],[-.16,.04,.025,.24],[.16,.04,.025,.24]]){const m=B.MeshBuilder.CreateBox('cart-emblem',{width:w,height:h,depth:.018},scene);m.parent=root;m.position.set(x,y,side*.055);m.material=brass;}
 }
 for(const m of root.getChildMeshes()){m.isPickable=false;m.computeWorldMatrix(true);}const merged=B.Mesh.MergeMeshes(root.getChildMeshes(),true,true,undefined,false,true);merged.parent=root;
 return{location:CART_PICKUP,get collected(){return collected;},collect(player,feet){if(collected||Math.hypot(player.x-CART_PICKUP.x,player.z-CART_PICKUP.z)>1.2||Math.abs(feet-ground(CART_PICKUP.x,CART_PICKUP.z))>.6)return false;collected=true;root.setEnabled(false);return true;},reset(){collected=false;root.setEnabled(true);},update(t){if(collected)return;root.position.set(CART_PICKUP.x,ground(CART_PICKUP.x,CART_PICKUP.z)+1.15+Math.sin(t*1.6)*.12,CART_PICKUP.z);root.rotation.y=t*.6;}};
}
