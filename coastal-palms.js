import {ground} from './physics.js';
// Three lightweight feather palms. Curved solid leaflets avoid crossed alpha cards.
export function buildCoastalPalms(renderer,colliders){
 const {B,scene}=renderer,roots=[],bark=renderer.material('palm-fibrous-bark',[.62,.57,.43],'pine-bark-Diffuse.jpg',.95),leaf=renderer.material('palm-fronds',[1,1,1],null,.85);
 bark.bumpTexture=renderer.texture('pine-bark-nor_gl.jpg');bark.bumpTexture.level=.3;leaf.backFaceCulling=false;
 for(const [i,[x,z,h,turn]]of [[752,-758,10,.4],[775,-785,12,2.6],[783,-781,8,4.1]].entries()){
  const root=new B.TransformNode('coastal-palm-'+i,scene),path=[];
  for(let k=0;k<=18;k++){const t=k/18;path.push(new B.Vector3(Math.sin(turn)*t*t*1.2,t*h,Math.cos(turn)*t*t*1.2));}
  const trunk=B.MeshBuilder.CreateTube('curved-palm-trunk',{path,radiusFunction:k=>.34-.19*k/18,tessellation:10,cap:B.Mesh.CAP_ALL},scene);trunk.parent=root;trunk.material=bark;trunk.receiveShadows=true;renderer.shadowCaster(trunk);
  const p=[],indices=[],colors=[],crown=path.at(-1);
  function point(a,t,l){return new B.Vector3(crown.x+Math.sin(a)*t*l,crown.y+.8*Math.sin(t*Math.PI)-2.1*t*t,crown.z+Math.cos(a)*t*l);}
  for(let f=0;f<13;f++){const a=turn+f*2.399,l=3.2+(f%4)*.26;
   for(let k=1;k<23;k++){const t=k/23,axis=point(a,t,l),next=point(a,t+.025,l),width=.78*Math.sin(t*Math.PI)**.65;
    for(const side of [-1,1]){const tip=point(a,Math.min(1,t+.12),l);tip.x+=Math.cos(a)*width*side;tip.z-=Math.sin(a)*width*side;tip.y-=.18;const v=p.length/3;p.push(axis.x,axis.y,axis.z,tip.x,tip.y,tip.z,next.x,next.y,next.z);indices.push(v,v+1,v+2);const shade=.8+.2*Math.sin(f*2+k);for(let j=0;j<3;j++)colors.push(.075*shade,.24*shade,.035*shade,1);}
   }
  }
  const fronds=new B.Mesh('palm-feather-canopy',scene),data=new B.VertexData();data.positions=p;data.indices=indices;data.colors=colors;data.normals=[];B.VertexData.ComputeNormals(p,indices,data.normals);data.applyToMesh(fronds);fronds.parent=root;fronds.material=leaf;fronds.receiveShadows=true;renderer.shadowCaster(fronds);
  root.position.set(x,ground(x,z)-.15,z);for(const m of root.getChildMeshes()){m.isPickable=false;m.computeWorldMatrix(true);m.freezeWorldMatrix();}root.freezeWorldMatrix();roots.push(root);colliders.push({x,z,r:.38,height:h,id:'coastal-palm-trunk'});
 }
 return{count:roots.length,update(eye){for(const r of roots){const visible=Math.hypot(eye.x-r.position.x,eye.z-r.position.z)<240;if(r.isEnabled()!==visible)r.setEnabled(visible);}}};
}
