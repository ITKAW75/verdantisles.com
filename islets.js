import {fitForestBase} from './forest.js';
// Three composed landforms: a lone tree, a paired canopy, and a central forest.
export function buildForestIslets(renderer,place,mesh){
 const {B}=renderer,grass=renderer.material('islet-moss',[.16,.26,.075],'cove-grass.jpg',.96);
 grass.bumpTexture=renderer.texture('cove-grass-normal.jpg');grass.bumpTexture.level=.38;
 const groups=[{x:-102,z:-124,rx:15,rz:12,h:4,trees:[[0,0,23]]},{x:4,z:-168,rx:24,rz:18,h:7,trees:[[-11,0,27],[-4,-7,33],[7,-5,30],[12,5,25],[0,7,29],[-7,6,23]]},{x:108,z:-119,rx:17,rz:13,h:5,trees:[[-5,0,27],[5,-2,23]]},{x:455,z:-345,rx:19,rz:14,h:5,trees:[[-5,0,27],[5,-3,24],[0,5,22]]},{x:550,z:-371,rx:14,rz:11,h:4,trees:[[0,0,25],[-5,-2,19]]}];
 for(const [g,a] of groups.entries()){
  const height=(x,z)=>{const dx=(x-a.x)/a.rx,dz=(z-a.z)/a.rz,angle=Math.atan2(dz,dx),r=Math.hypot(dx,dz)/(1+.07*Math.sin(angle*5+g));return -9+(a.h+9)*Math.pow(Math.max(0,1-r*r),1.35);};
  const pos=[],ix=[],uv=[],n=48;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=a.x+(i/n*2-1)*a.rx*1.12,z=a.z+(j/n*2-1)*a.rz*1.12;pos.push(x,height(x,z),z);uv.push(x*.15,z*.15);if(i<n&&j<n){const k=j*(n+1)+i;ix.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}}
  mesh('forested-islet-'+g,pos,ix,grass,null,uv);
  for(let i=0;i<7;i++){const t=i/7*Math.PI*2+.2*g,x=a.x+Math.cos(t)*a.rx*.78,z=a.z+Math.sin(t)*a.rz*.8+(g===2?(i===2?-13:i===1?-9:0):0);place(['namaqualand_boulder_04','namaqualand_boulder_06','namaqualand_boulder_02'][i%3],x,-9,z,9+(i%3)*2.3,t,false);}
  for(const [i,[dx,dz,h]]of a.trees.entries()){const x=a.x+dx,z=a.z+dz,root=place(i%3===1?'fir_sapling_medium':'pine_tree_01',x,height(x,z)-.14,z,h,i*2.31,false);fitForestBase(root,B,height);root.metadata={...root.metadata,distantScenery:true};}
 }
 return groups.map(g=>({x:g.x,z:g.z,trees:g.trees.length,groundHeight:(x,z)=>{const dx=(x-g.x)/g.rx,dz=(z-g.z)/g.rz,angle=Math.atan2(dz,dx),r=Math.hypot(dx,dz)/(1+.07*Math.sin(angle*5+groups.indexOf(g)));return -9+(g.h+9)*Math.pow(Math.max(0,1-r*r),1.35);}}));
}
