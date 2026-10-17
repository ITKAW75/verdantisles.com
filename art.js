import {geometry} from './geometry.js';
export const RABBIT_COVERS=[{x:-10,z:25},{x:-14,z:17},{x:14,z:10},{x:16,z:1},{x:-14,z:-12},{x:-18,z:-20},{x:18,z:-29},{x:22,z:-35},{x:-15,z:-46},{x:-22,z:-41}];
export function buildRabbitParts(renderer){
 const fur=[.77,.72,.6],cream=[.94,.9,.79],body=geometry(),head=geometry(),ear=geometry(),foot=geometry(),tail=geometry();
 for(const part of [body,head,ear,foot,tail])part.material=8;
 body.sphere(0,.30,0,.22,.24,.35,fur,16,12);body.sphere(0,.3,-.21,.18,.21,.18,cream,14,10);body.sphere(-.16,.22,.14,.13,.17,.18,fur);body.sphere(.16,.22,.14,.13,.17,.18,fur);
 head.sphere(0,0,0,.165,.17,.185,cream,18,12);head.sphere(0,-.06,-.16,.10,.075,.085,cream,12,8);for(const side of[-1,1]){head.sphere(side*.127,.037,-.10,.03,.036,.025,[.075,.10,.09],10,8);head.sphere(side*.133,.048,-.117,.01,.012,.008,[1,.98,.9],7,5);}head.sphere(0,-.025,-.239,.025,.017,.016,[.62,.40,.38],9,6);
 ear.sphere(0,.20,0,.049,.22,.04,cream,14,10);ear.sphere(0,.20,-.035,.025,.155,.012,[.80,.56,.53],10,8);foot.sphere(0,0,0,.07,.065,.145,cream,12,8);tail.sphere(0,0,0,.095,.095,.1,cream,12,8);
 return Object.fromEntries(Object.entries({body,head,ear,foot,tail}).map(([k,g])=>[k,renderer.mesh(g.data)]));
}
