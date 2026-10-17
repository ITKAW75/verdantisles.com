import {assetURL} from './babylon-render.js';
import {ground} from './physics.js';
// Original CC0 animals retain their rigs. Flying gull: Poly by Google, CC BY 3.0; adapted wing morphs.
export async function buildCoveWildlife(renderer,islets){
 const {B,scene}=renderer,creatures=[];
 for(const [id,count,span]of[['butterfly',7,.24],['bird',2,1.25],['seagull',2,1.7]]){
  const container=await B.SceneLoader.LoadAssetContainerAsync('',assetURL('wildlife/'+id+'.glb'),scene,undefined,'.glb');
  const extra=id==='butterfly'?3:1,highExtra=id==='butterfly'?3:id==='seagull'?2:1;
  const keepExtra=id==='butterfly'?3:1,cabinExtra=id==='butterfly'?4:1;
  for(let i=0;i<count+extra+highExtra+keepExtra+cabinExtra;i++){
   const entry=container.instantiateModelsToScene(n=>id+'-'+i+'-'+n,false,{doNotInstantiate:true}),root=new B.TransformNode(id+'-flight-'+i,scene);
   for(const n of entry.rootNodes)n.parent=root;
   const bounds=root.getHierarchyBoundingVectors(true);root.scaling.setAll(span/Math.max(.001,bounds.max.x-bounds.min.x));
   if(id==='bird'){
    // The evaluated beak lies along -Z after glTF's Blender-axis conversion.
    // Pitch the upright body forward without changing its model-facing axis.
    const flightPose=new B.TransformNode('bird-flight-pose-'+i,scene),origin=new B.TransformNode('bird-origin-'+i,scene);flightPose.parent=root;origin.parent=flightPose;
    for(const n of entry.rootNodes)n.parent=origin;origin.position.set(-(bounds.min.x+bounds.max.x)/2,-(bounds.min.y+bounds.max.y)/2,-(bounds.min.z+bounds.max.z)/2);flightPose.rotation.x=-.80;
   }
   for(const m of root.getChildMeshes()){m.isPickable=false;m.receiveShadows=true;if(m.material){m.material.backFaceCulling=false;m.material.environmentIntensity=.8;m.material.enableSpecularAntiAliasing=true;if(id!=='butterfly'){m.material.transparencyMode=B.PBRMaterial.PBRMATERIAL_OPAQUE;m.material.alpha=1;m.material.useAlphaFromAlbedoTexture=false;}}}
   // Only source frames 138–171 contain the wingbeat. Earlier frames are idle.
   for(const g of entry.animationGroups){const from=id==='bird'?g.to*138/171:g.from,to=g.to;g.start(true,id==='butterfly'?.75+i*.045:1.15,from,to);g.goToFrame(from+(to-from)*i/count);}
   const anchors=[[-16,25],[19,15],[-23,9],[21,-28],[-20,-39],[25,28],[-15,39]],anchor=anchors[i%anchors.length];
   const keepStart=count+extra+highExtra,cabinStart=keepStart+keepExtra,newZone=i>=cabinStart?4:i>=keepStart?2:null,newIndex=i-(newZone===4?cabinStart:keepStart);
   const wings=root.getChildMeshes().map(m=>m.morphTargetManager).filter(Boolean);
   creatures.push({id,root,groups:entry.animationGroups,wings,i,zoneIndex:i-count-extra,zone:newZone??(i>=count+extra?3:i>=count?1:0),x:newZone!==null?(newZone===4?[1178,1220,1250,1300][newIndex]:[310,460,605][newIndex]):i>=count+extra?[800,960,1115][i-count-extra]:i>=count?[137,174,141][i-count]:anchor[0],z:newZone!==null?(newZone===4?[-1280,-1320,-1390,-1480][newIndex]:[-357,-460,-570][newIndex]):i>=count+extra?[-784,-912,-1082][i-count-extra]:i>=count?[-153,-200,-228][i-count]:anchor[1]});
  }
 }
 const doeAsset=await B.SceneLoader.LoadAssetContainerAsync('',assetURL('wildlife/doe.glb'),scene,undefined,'.glb'),entry=doeAsset.instantiateModelsToScene(n=>'forest-doe-'+n,false,{doNotInstantiate:true}),doe=new B.TransformNode('forest-doe',scene);
 for(const n of entry.rootNodes)n.parent=doe;
 const b=doe.getHierarchyBoundingVectors(true),scale=1.35/(b.max.y-b.min.y),offset=new B.TransformNode('doe-origin',scene);offset.parent=doe;for(const n of entry.rootNodes)n.parent=offset;offset.position.set(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);doe.scaling.setAll(scale);const home=islets[1],dx=home.x+3,dz=home.z+10;doe.position.set(dx,home.groundHeight(dx,dz)-.06,dz);doe.rotation.y=-1.1;
 for(const m of doe.getChildMeshes()){m.isPickable=false;m.receiveShadows=true;if(m.material){m.material.environmentIntensity=.65;m.material.enableSpecularAntiAliasing=true;}}
 const grazing=entry.animationGroups.find(g=>g.name.includes('Grazing'));grazing?.start(true,.18);
 return {counts:{butterflies:7,birds:2,seagulls:2,deer:1,sanctuary:{butterflies:3,birds:1,seagulls:1},highland:{butterflies:3,birds:1,seagulls:2},keep:{butterflies:3,birds:1,seagulls:1},cabin:{butterflies:4,birds:1,seagulls:1}},creatures,update(time,quality){
  for(const c of creatures){const {root,i,id}=c,phase=time*(id==='bird'?.09:.24)+i*2.399;
   if(id==='bird'){
    const direction=i===0?1:-1,p=time*(i===0?.085:-.07)+i*2.4,radius=29+i*9;
    const x=35+Math.cos(p)*radius,z=-10+Math.sin(p)*radius*.72;
    root.position.set(x,36+i*9+Math.sin(p*2)*1.3,z);
    root.rotation.set(Math.sin(p)*.025,Math.atan2(direction*Math.sin(p),-direction*Math.cos(p)*.72),direction*.09);
   }else if(id==='seagull'){
    // Two independent coastal arcs, facing the path tangent rather than its center.
    const rate=i===0?.067:-.052,p=time*rate+i*3.1,rx=37+i*10,rz=19+i*7;
    const x=49+Math.cos(p)*rx,z=18+Math.sin(p)*rz,dx=-Math.sin(p)*rx*rate,dz=Math.cos(p)*rz*rate;
    root.position.set(x,25+i*8+Math.sin(p*1.7+i)*1.8,z);
    root.rotation.set(.025*Math.sin(p),Math.atan2(-dx,-dz),Math.sign(rate)*.12+Math.sin(p*1.7)*.035);
    const envelope=Math.pow(Math.max(0,Math.sin(time*.36+i*2.8)),2),beat=Math.sin(time*(i===0?4.6:3.8)+i*2);
    for(const manager of c.wings)for(let n=0;n<manager.numTargets;n++){const t=manager.getTarget(n);t.influence=envelope*Math.max(0,t.name==='Lift'?beat:-beat);}
   }
   else{const x=c.x+Math.sin(phase)*1.9,z=c.z+Math.sin(phase*.71+i)*1.5;root.position.set(x,ground(x,z)+1.1+Math.sin(phase*1.7)*.35,z);root.rotation.set(.1*Math.sin(phase*3),Math.atan2(Math.cos(phase)*1.9,Math.cos(phase*.71+i)*1.065),Math.sin(phase*2)*.12);}
   if(c.zone===1&&id==='bird'){root.position.x+=128;root.position.z-=186;root.position.y=42+Math.sin(time*.17)*2;}
   if(c.zone===1&&id==='seagull'){root.position.x+=142;root.position.z-=178;root.position.y=29+Math.sin(time*.13+2)*2.5;}
   if(c.zone===3&&id==='bird'){root.position.x+=880;root.position.z-=930;root.position.y=52+Math.sin(time*.17)*2;}
   if(c.zone===3&&id==='seagull'){root.position.x+=c.zoneIndex===0?730:915;root.position.z-=c.zoneIndex===0?815:965;root.position.y=37+Math.sin(time*.13+i)*2.5;}
   if((c.zone===2||c.zone===4)&&id!=='butterfly'){const p=time*(id==='bird'?.075:-.057)+i*1.7,rx=id==='bird'?30:42,rz=id==='bird'?22:28,rate=id==='bird'?.075:-.057,dx=-Math.sin(p)*rx*rate,dz=Math.cos(p)*rz*rate;root.position.set(c.x+Math.cos(p)*rx,ground(c.x,c.z)+(id==='bird'?42:28)+Math.sin(p*1.5)*1.5,c.z+Math.sin(p)*rz);root.rotation.y=Math.atan2(-dx,-dz);}
   const visible=(quality!==2||i===0||c.zone&&id==='seagull')&&(!c.zone||Math.hypot(renderer.camera.position.x-root.position.x,renderer.camera.position.z-root.position.z)<(c.zone===3?250:160));if(root.isEnabled()!==visible){root.setEnabled(visible);for(const g of c.groups)visible?g.play(true):g.pause();}
  }
 }};
}
