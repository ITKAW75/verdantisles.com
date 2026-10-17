// Geometric game rangefinder. Readings never alter aim, power or club physics.
export function createRangefinder(){return{unlocked:false,active:false,unlock(){this.unlocked=true;},toggle(){if(!this.unlocked)return false;this.active=!this.active;return true;},close(){this.active=false;},reset(){this.unlocked=false;this.active=false;}};}
export function measureRange(origin,direction,heightAt,colliders=[],flag=null,maxRange=500){
 const len=Math.hypot(direction.x,direction.y,direction.z);if(!len)return null;const d={x:direction.x/len,y:direction.y/len,z:direction.z/len},at=t=>({x:origin.x+d.x*t,y:origin.y+d.y*t,z:origin.z+d.z*t});let best=null;
 const record=(distance,kind,point=at(distance))=>{if(distance>=.15&&distance<=maxRange&&(!best||distance<best.distance))best={distance,horizontal:Math.hypot(point.x-origin.x,point.z-origin.z),elevation:point.y-origin.y,kind,point};};
 let previous=.15;for(let t=.5;t<=maxRange;t+=t<60?.5:2){const p=at(t),land=heightAt(p.x,p.z),floor=Math.max(-5.4,land);if(p.y<=floor){let lo=previous,hi=t;for(let j=0;j<14;j++){const mid=(lo+hi)/2,q=at(mid);if(q.y>Math.max(-5.4,heightAt(q.x,q.z)))lo=mid;else hi=mid;}record(hi,land< -5.4?'Water':'Ground');break;}previous=t;}
 // Solid object footprints occlude the pin: no reading through trunks or cabin walls.
 for(const c of colliders){if(c.walkThrough||(c.height||0)<.3)continue;const ox=origin.x-c.x,oz=origin.z-c.z,a=d.x*d.x+d.z*d.z,b=2*(ox*d.x+oz*d.z),cc=ox*ox+oz*oz-c.r*c.r,disc=b*b-4*a*cc;if(a<1e-9||disc<0)continue;let t=(-b-Math.sqrt(disc))/(2*a);if(t<.15)t=(-b+Math.sqrt(disc))/(2*a);if(t<.15||t>maxRange||(best&&t>best.distance))continue;
  if(c.polygon){let near=Infinity;for(let i=0;i<c.polygon.length;i++){const p=c.polygon[i],q=c.polygon[(i+1)%c.polygon.length],ex=q.x-p.x,ez=q.z-p.z,den=d.x*ez-d.z*ex;if(Math.abs(den)<1e-8)continue;const ax=p.x-origin.x,az=p.z-origin.z,hit=(ax*ez-az*ex)/den,u=(ax*d.z-az*d.x)/den;if(hit>.15&&u>=0&&u<=1)near=Math.min(near,hit);}t=near;}
  const p=at(t),base=heightAt(c.x,c.z);if(p.y>=base-.2&&p.y<=base+(c.height||7))record(t,'Object');
 }
 if(flag){const dx=flag.x-origin.x,dy=flag.y-origin.y,dz=flag.z-origin.z,t=dx*d.x+dy*d.y+dz*d.z,off=Math.hypot(dx-d.x*t,dy-d.y*t,dz-d.z*t),distance=Math.hypot(dx,dy,dz);if(t>0&&off<.3+t*.002&&(!best||t<best.distance+.5))record(distance,'Pin',flag);}
 return best;
}
export function buildRangePickup(renderer,location){
 const {B,scene}=renderer,root=new B.TransformNode('cabin-rangefinder-pickup',scene),metal=renderer.material('rangefinder-brass',[.66,.47,.19],null,.35),dark=renderer.material('rangefinder-leather',[.075,.095,.065],null,.82),glass=renderer.material('rangefinder-optics',[.065,.20,.18],null,.16);metal.metallic=.85;glass.metallic=.7;
 for(const side of [-1,1]){const barrel=B.MeshBuilder.CreateCylinder('rangefinder-barrel',{height:.32,diameter:.15,tessellation:20},scene);barrel.rotation.x=Math.PI/2;barrel.position.x=side*.10;barrel.parent=root;barrel.material=dark;for(const z of [-.16,.16]){const lens=B.MeshBuilder.CreateCylinder('rangefinder-lens',{height:.025,diameter:.16,tessellation:20},scene);lens.rotation.x=Math.PI/2;lens.position.set(side*.10,0,z);lens.parent=root;lens.material=z<0?glass:metal;}}
 const hinge=B.MeshBuilder.CreateBox('rangefinder-hinge',{width:.18,height:.06,depth:.16},scene);hinge.material=metal;hinge.parent=root;root.position.set(location.x,location.y,location.z);for(const m of root.getChildMeshes()){m.isPickable=false;m.receiveShadows=true;}let collected=false;
 return{location,get collected(){return collected;},collect(player,feet){if(collected||Math.hypot(player.x-location.x,player.z-location.z)>1.55||Math.abs(feet-(location.y-1.08))>.65)return false;collected=true;root.setEnabled(false);return true;},reset(){collected=false;root.setEnabled(true);},update(time){if(!collected){root.rotation.y=.3+Math.sin(time*.65)*.12;root.position.y=location.y+.025*Math.sin(time*1.2);}}};
}
