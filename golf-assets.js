import {geometry} from './geometry.js';
import {ground,slope,HOLE,greenRadius,BALL_RADIUS} from './physics.js';
import {buildRabbitParts,RABBIT_COVERS} from './art.js';
export function buildGolfAssets(renderer,offset={x:0,z:0,stretch:1}){
 const localGround=(x,z)=>ground(x+offset.x,z*offset.stretch+offset.z),localGreen=(x,z)=>greenRadius(x+offset.x,z*offset.stretch+offset.z),localSlope=(x,z)=>slope(x+offset.x,z*offset.stretch+offset.z);
 const flag=geometry();flag.material=7;for(let i=0;i<12;i++){const x=i*.15,xx=(i+1)*.15,z=Math.sin(x*4)*.08,zz=Math.sin(xx*4)*.08;flag.quad([x,4.25-x*.05,z],[xx,4.25-xx*.05,zz],[xx,3.45-xx*.05,zz],[x,3.45-x*.05,z],[.95,.72,.35]);}
 const ball=geometry();ball.material=16;ball.sphere(0,0,0,BALL_RADIUS,BALL_RADIUS,BALL_RADIUS,[.98,.98,.96],32,20);
 const shadow=geometry();shadow.disk(0,0,0,.085,.085,[.12,.22,.12],24);
 const mote=geometry();mote.sphere(0,0,0,.035,.035,.035,[.92,.85,.48],6,4);
 const marker=geometry();for(let i=0;i<32;i++){const a=i/32*6.283,b=(i+.5)/32*6.283;marker.quad([Math.cos(a)*.5,0,Math.sin(a)*.5],[Math.cos(b)*.5,0,Math.sin(b)*.5],[Math.cos(b)*.525,0,Math.sin(b)*.525],[Math.cos(a)*.525,0,Math.sin(a)*.525],[.86,.89,.61]);}
 const readGreen=geometry();
 function ribbon(x1,z1,x2,z2,width,color){x1+=offset.x;x2+=offset.x;z1=z1*offset.stretch+offset.z;z2=z2*offset.stretch+offset.z;const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz)||1,ox=-dz/l*width,oz=dx/l*width;readGreen.quad([x1+ox,ground(x1,z1)+.04,z1+oz],[x2+ox,ground(x2,z2)+.04,z2+oz],[x2-ox,ground(x2,z2)+.04,z2-oz],[x1-ox,ground(x1,z1)+.04,z1-oz],color);}
 const bounds=offset.greenBounds||[-10,17,-63,-39],slopeBeads=[];for(let z=bounds[2];z<bounds[3];z+=1.25)for(let x=bounds[0];x<bounds[1];x+=1.25){if(localGreen(x,z)>.94||Math.hypot(x-(offset.cup?offset.cup.x-offset.x:HOLE.x),z-(offset.cup?(offset.cup.z-offset.z)/offset.stretch:HOLE.z))<.6)continue;if(localGreen(x+1.25,z)<.96)ribbon(x,z,x+1.25,z,.009,[.7,.85,.62]);if(localGreen(x,z+1.25)<.96)ribbon(x,z,x,z+1.25,.009,[.7,.85,.62]);const s=localSlope(x,z),l=Math.hypot(s.x,s.z);if(l>.012&&Math.round(x*4+z*4)%2===0){const dx=-s.x/l*.42,dz=-s.z/l*.42;ribbon(x,z,x+dx,z+dz,.018,[.96,.88,.5]);ribbon(x+dx,z+dz,x+dx*.5-dz*.3,z+dz*.5+dx*.3,.018,[.96,.88,.5]);ribbon(x+dx,z+dz,x+dx*.5+dz*.3,z+dz*.5-dx*.3,.018,[.96,.88,.5]);slopeBeads.push({x:x+offset.x,z:z*offset.stretch+offset.z,dx,dz:dz*offset.stretch});}}
 const fairy=geometry(),wing=geometry();fairy.sphere(0,0,0,.07,.13,.07,[.67,.91,.73]);fairy.sphere(0,.18,0,.075,.075,.075,[.97,.87,.66]);fairy.branch([-.02,.03,0],[-.17,-.03,0],.018,.012,[.92,.84,.64],5);fairy.branch([.02,.03,0],[.17,-.03,0],.018,.012,[.92,.84,.64],5);fairy.branch([-.025,-.08,0],[-.05,-.24,0],.014,.01,[.92,.84,.64],5);fairy.branch([.025,-.08,0],[.05,-.24,0],.014,.01,[.92,.84,.64],5);wing.sphere(.16,.055,.045,.17,.24,.014,[.76,.89,1.],10,8);wing.sphere(.12,-.12,.05,.12,.12,.012,[.88,.77,.98],9,6);

return{covers:RABBIT_COVERS,flag:renderer.mesh(flag.data),ball:renderer.mesh(ball.data),shadow:renderer.mesh(shadow.data),mote:renderer.mesh(mote.data),marker:renderer.mesh(marker.data),greenGuide:renderer.mesh(readGreen.data),fairy:renderer.mesh(fairy.data),wing:renderer.mesh(wing.data),slopeBeads};
}
