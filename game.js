import {cabinAimPoint} from './cabin-layout.js';
import {createRangefinder,measureRange} from './rangefinder.js';
import {createCart} from './cart.js';
import {highAimPoint} from './highland-layout.js';
import {createJump} from './jump.js';
import {keepAimPoint} from './fortress-layout.js';
import {COURSES,courseProgress} from './courses.js';
import {swingPower} from './swing-meter.js';
import {resolveWalk} from './scenery.js';
import {createWildlife,updateWildlife} from './wildlife.js';
import {createRenderer} from './babylon-render.js';
import {buildGarden} from './realm.js';
import {CLUBS,CLUB_GROUPS,PUTTING_GROOVES} from './clubs.js';
import {setActiveCourse,HOLE,START,BALL_RADIUS,ground,inside,makeShot,stepShot,ballPosition,surface,greenRadius} from './physics.js';
const $=id=>document.getElementById(id),canvas=$('world');
let renderer,garden;
try{renderer=createRenderer(canvas);garden=await buildGarden(renderer);$('enter').disabled=false;$('enter').innerHTML='Explore the cove <span>↗</span>';}catch(e){$('error').classList.remove('hidden');$('errorMessage').textContent=e.message;throw e;}
const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
document.body.classList.toggle('touch',touch);
if(touch){$('introControls').textContent='Left thumb to walk · Drag right to look';$('help').textContent='Left thumb to walk. Drag right to look around. Walk to your ball and tap Play ball.';}
const jump=createJump(),cart=createCart(),rangefinder=createRangefinder();let rangeSample=0,rangeReading=null;
let holeIndex=0,holeScores=[];
let mode='intro',player={x:0,z:36},yaw=.03,pitch=-.06,ball={...START,y:ground(START.x,START.z)+BALL_RADIUS},club='uw',power=85,groove=1,strokes=0,shot=null,restClock=0,near=false,finished=false,guide=false,lastShotStats=null;
let shotShape='fade';
let swingActive=false,swingElapsed=0,completionDue=0,completedCup=null;
let ratio=Math.min(devicePixelRatio||1,2.25),sway=!matchMedia('(prefers-reduced-motion:reduce)').matches,time=0,last=0,walkPhase=0,hintUntil=0,active=true,quality=1;
let eye=[42,13,43],look=[13,1,-24];const keys=new Set(),joy={x:0,y:0,id:null,ox:0,oy:0},drag={id:null,x:0,y:0};
let audio=null,audioGain=null,audioOn=false;
const rabbits=[];
const fairies=[];
function showHint(message,seconds=4){$('hint').textContent=message;$('hint').classList.add('visible');hintUntil=time+seconds;}
function cartUI(){const b=$('cartToggle');b.classList.toggle('hidden',!cart.unlocked||mode!=='walk');b.disabled=cart.busy;const label=cart.busy?(cart.mounted?'Leaving cart':'Entering cart')+' · '+Math.ceil(cart.remaining)+'s':cart.mounted?'Exit cart · C':'Enter cart · C';if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',String(cart.mounted));}
function toggleCart(){if(mode!=='walk'||jump.airborne||$('settings').open||$('complete').open)return;if(cart.toggle(yaw)){closeRange();clearInput();near=false;updateUI();}}
$('cartToggle').onclick=toggleCart;
function rangeUI(){const allowed=(mode==='walk'||mode==='aim')&&!cart.mounted&&!cart.busy;const b=$('rangeToggle');b.classList.toggle('hidden',!rangefinder.unlocked||!allowed);b.textContent=rangefinder.active?'Lower rangefinder · R':'Rangefinder · R';b.setAttribute('aria-pressed',String(rangefinder.active));$('rangeView').classList.toggle('hidden',!rangefinder.active);document.body.classList.toggle('range-view',rangefinder.active);}
function closeRange(){rangefinder.close();rangeReading=null;rangeUI();}
function toggleRange(){if(!['walk','aim'].includes(mode)||cart.busy||cart.mounted||$('settings').open||$('complete').open)return;if(rangefinder.toggle()){cancelSwing();clearInput();rangeSample=0;rangeUI();}}
$('rangeToggle').onclick=toggleRange;
function updateUI(){cartUI();rangeUI();
 document.body.classList.toggle('playing',mode!=='intro');document.body.classList.toggle('aiming',mode==='aim'||mode==='flight');$('shot').classList.toggle('hidden',mode!=='aim');$('approach').classList.toggle('hidden',!(mode==='walk'&&near&&!finished&&!cart.mounted&&!cart.busy));$('chapter').textContent=finished&&holeIndex===COURSES.length-1?'A ROUND WELL WANDERED':(holeIndex+1)+' · '+COURSES[holeIndex].name.toUpperCase();
 const d=Math.hypot(ball.x-HOLE.x,ball.z-HOLE.z),onGreen=greenRadius(ball.x,ball.z)<1.2;
 $('shotInfo').textContent=`${onGreen?(d/.3048).toFixed(1)+' FT':Math.round(d/.9144)+' YD'} TO CUP · ${strokes} ${strokes===1?'SHOT':'SHOTS'}`;
 greenReadUI();$('greenRead').textContent=guide?'Hide slopes':'Read green';$('greenRead').setAttribute('aria-pressed',String(guide));$('windText').textContent=club==='putter'?PUTTING_GROOVES[groove].name+' stroke':'Gentle breeze · no rush';
}
$('shotShape').onclick=()=>{if(mode!=='aim')return;cancelSwing();shotShape={fade:'draw',draw:'straight',straight:'fade'}[shotShape];powerUI();};
function powerUI(){
 $('shotShape').classList.toggle('hidden',club==='putter');$('shotShape').textContent='Flight: '+shotShape[0].toUpperCase()+shotShape.slice(1);

 $('powerValue').textContent=power+'%';$('power').setAttribute('aria-label',swingActive?'Hit ball at current power':'Start swing');$('hit').textContent=swingActive?'Hit ball':'Start swing';$('power').classList.toggle('sweeping',swingActive);$('power').style.setProperty('--power',power+'%');
 const c=CLUBS[club];$('clubDetail').textContent=club==='putter'?'PING Anser · stroke strength':'PING G440 · '+c.name+' · '+c.loft+'°';
}
function distances(){
 const c=CLUBS[club],putt=club==='putter';$('distances').replaceChildren();$('distances').setAttribute('aria-label',putt?'Putter stroke strength':'Club selection, shortest to longest');
 for(const option of putt?PUTTING_GROOVES:CLUB_GROUPS[c.group]){
  const id=putt?option.id:option,selected=putt?id===groove:id===club,b=document.createElement('button');
  b.textContent=putt?option.label:CLUBS[id].label;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',putt?option.name+' stroke, '+option.feet+' feet on level green at full power':CLUBS[id].name);b.dataset.option=id;
  b.onclick=()=>{if(mode!=='aim')return;cancelSwing();if(putt)groove=id;else club=id;distances();};$('distances').append(b);
 }
 document.querySelectorAll('[data-club]').forEach(b=>{const selected=b.dataset.club===c.group;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});powerUI();updateUI();
}
function cancelSwing(){swingActive=false;swingElapsed=0;powerUI();}
$('power').onclick=()=>takeSwing();
function clearInput(){cart.stop();keys.clear();joy.id=null;joy.x=joy.y=0;drag.id=null;$('stick').style.transform='';}
function start(){mode='walk';$('intro').classList.add('hidden');yaw=.015;pitch=-.12;updateUI();showHint(touch?'Left thumb to walk · Right thumb to look':'WASD to walk · Drag to look',7);}
$('enter').onclick=start;
const rememberedClubs={wood:'5w',iron:'7i',wedge:'uw',putter:'putter'};
document.querySelectorAll('[data-club]').forEach(b=>b.onclick=()=>{if(mode!=='aim')return;cancelSwing();rememberedClubs[CLUBS[club].group]=club;club=rememberedClubs[b.dataset.club];pitch=club==='putter'?-.85:-.50;guide=false;distances();});
$('approach').onclick=()=>{if(mode!=='walk'||!near||finished||jump.airborne||cart.mounted||cart.busy)return;closeRange();mode='aim';clearInput();const target=holeIndex===4?cabinAimPoint(ball,HOLE):holeIndex===3?highAimPoint(ball,HOLE):holeIndex===2?keepAimPoint(ball,HOLE):HOLE;yaw=Math.atan2(target.x-ball.x,-(target.z-ball.z));const d=Math.hypot(ball.x-HOLE.x,ball.z-HOLE.z);const targetDistance=Math.hypot(target.x-ball.x,target.z-ball.z);club=holeIndex===4&&ball.z>-1455&&greenRadius(ball.x,ball.z)<1.25?(d>55?'52':'56'):greenRadius(ball.x,ball.z)<1.25?'putter':d<28?'56':holeIndex>=2?(targetDistance>185?'driver':targetDistance>150?'5w':targetDistance>110?'7i':targetDistance>80?'pw':'uw'):'uw';pitch=club==='putter'?-.85:-.50;power=club==='putter'?50:85;shotShape=CLUBS[club].group==='wedge'?'straight':'fade';guide=false;distances();};
$('walk').onclick=()=>{closeRange();cancelSwing();mode='walk';pitch=-.08;guide=false;updateUI();};
function nearbyGreen(){
 if(!['walk','aim'].includes(mode)||rangefinder.active||cart.mounted||cart.busy||$('complete').open)return -1;
 const p=mode==='aim'?ball:player;let best=-1,distance=45;
 COURSES.forEach((c,i)=>{const d=Math.hypot(p.x-c.cup.x,p.z-c.cup.z);if(d<distance){best=i;distance=d;}});return best;
}
function greenReadUI(){const allowed=nearbyGreen()>=0;if(!allowed)guide=false;for(const id of ['greenRead','walkGreenRead']){const b=$(id);b.classList.toggle('hidden',!allowed||(id==='walkGreenRead'&&mode!=='walk'));b.textContent=guide?'Hide slopes':'Read green';b.setAttribute('aria-pressed',String(guide));}}
function toggleGreenRead(){if(nearbyGreen()<0)return;guide=!guide;greenReadUI();}
$('greenRead').onclick=toggleGreenRead;$('walkGreenRead').onclick=toggleGreenRead;
function adjustAim(n){if(mode==='aim'){cancelSwing();yaw+=n*(club==='putter'?.012:.028);}}
$('aimLeft').onclick=()=>adjustAim(-1);$('aimRight').onclick=()=>adjustAim(1);
function takeSwing(){if(rangefinder.active||mode!=='aim'||$('settings').open||$('complete').open)return;if(!swingActive){swingActive=true;swingElapsed=0;power=swingPower(0,club);clearInput();powerUI();return;}swingActive=false;shot=makeShot(ball,yaw,club,power,Math.random,groove,shotShape);restClock=0;strokes++;near=false;mode='flight';clearInput();updateUI();powerUI();pluck();}
$('hit').onclick=takeSwing;
function reset(){completedCup=null;rangefinder.reset();garden.rangePickup.reset();rangeReading=null;completionDue=0;garden.magic.reset();garden.speedCoin.reset();garden.jumpPickup.reset();jump.reset();garden.cartPickup.reset();cart.reset();holeIndex=0;holeScores=[];setActiveCourse(0);swingActive=false;swingElapsed=0;player={x:0,z:36};ball={...START,y:ground(START.x,START.z)+BALL_RADIUS};yaw=.015;pitch=-.12;strokes=0;finished=false;near=false;shot=null;lastShotStats=null;club='uw';power=85;groove=1;guide=false;mode='walk';clearInput();$('complete').close();$('settings').close();$('intro').classList.add('hidden');distances();showHint('A fresh round. Walk to your ball to begin.');if(audioGain&&audioOn)audioGain.gain.setTargetAtTime(.09,audio.currentTime,.3);}
$('again').onclick=reset;$('restart').onclick=reset;
function advanceHole(){if(holeIndex>=COURSES.length-1)return;holeIndex++;setActiveCourse(holeIndex);ball={...START,y:ground(START.x,START.z)+BALL_RADIUS};strokes=0;shot=null;finished=false;near=false;guide=false;swingActive=false;club='uw';power=85;mode='walk';distances();}
function dismissScorecard(){completionDue=0;completedCup=null;$('complete').close();mode='walk';pitch=-.08;clearInput();updateUI();}
$('nextHole').onclick=dismissScorecard;
$('explore').onclick=dismissScorecard;
$('complete').addEventListener('cancel',()=>{completedCup=null;clearInput();});
function openSettings(){closeRange();clearInput();$('settings').showModal();if(audioGain)audioGain.gain.setTargetAtTime(0,audio.currentTime,.3);}
function closeSettings(){$('settings').close();if(audioGain&&audioOn)audioGain.gain.setTargetAtTime(.09,audio.currentTime,.3);}
$('menuButton').onclick=openSettings;$('closeSettings').onclick=closeSettings;$('resume').onclick=closeSettings;
$('settings').addEventListener('cancel',()=>{if(audioGain&&audioOn)audioGain.gain.setTargetAtTime(.09,audio.currentTime,.3);});
$('motion').setAttribute('aria-pressed',String(sway));$('motion').textContent=sway?'On':'Off';
$('motion').onclick=()=>{sway=!sway;$('motion').textContent=sway?'On':'Off';$('motion').setAttribute('aria-pressed',String(sway));};
renderer.setQuality(1);$('quality').textContent='Ultra';$('quality').onclick=()=>{quality=(quality+1)%3;ratio=Math.min(devicePixelRatio||1,[1.6,2.25,1][quality]);$('quality').textContent=['Lush','Ultra','Battery'][quality];renderer.setQuality(quality);renderer.resize(ratio);};
async function toggleAudio(){try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();audioGain=audio.createGain();audioGain.gain.value=0;audioGain.connect(audio.destination);const length=audio.sampleRate*3,buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);let sm=0;for(let i=0;i<length;i++){sm=(sm+(Math.random()*2-1)*.025)/1.026;data[i]=sm*4;}const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;source.connect(filter);filter.connect(audioGain);source.start();}await audio.resume();audioOn=!audioOn;audioGain.gain.setTargetAtTime(audioOn?.09:0,audio.currentTime,.4);$('audioToggle').textContent=audioOn?'On':'Off';$('audioToggle').setAttribute('aria-pressed',String(audioOn));}catch{showHint('Audio is unavailable in this browser.');}}
$('audioToggle').onclick=toggleAudio;
function pluck(){if(!audioOn||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(club==='putter'?350:650,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(180,audio.currentTime+.09);gain.gain.setValueAtTime(.07,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.16);}
canvas.addEventListener('pointerdown',e=>{if(mode==='intro'||$('settings').open||$('complete').open)return;canvas.setPointerCapture(e.pointerId);if(mode==='walk'&&e.pointerType!=='mouse'&&e.clientX<innerWidth*.45&&e.clientY>innerHeight*.3){if(joy.id!==null)return;joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;}else if(drag.id===null){if(mode==='aim')cancelSwing();drag.id=e.pointerId;drag.x=e.clientX;drag.y=e.clientY;}e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===joy.id){joy.x=Math.max(-1,Math.min(1,(e.clientX-joy.ox)/42));joy.y=Math.max(-1,Math.min(1,(e.clientY-joy.oy)/42));$('stick').style.transform=`translate(${joy.x*29}px,${joy.y*29}px)`;}else if(e.pointerId===drag.id){if(cart.mounted&&mode==='walk')yaw=cart.heading+Math.max(-.85,Math.min(.85,yaw-cart.heading+(e.clientX-drag.x)*.0035));else if(!cart.busy)yaw+=(e.clientX-drag.x)*.0035*(rangefinder.active?.25:1);pitch=Math.max(-.95,Math.min(.85,pitch-(e.clientY-drag.y)*.0028*(rangefinder.active?.25:1)));drag.x=e.clientX;drag.y=e.clientY;}});
function release(e){if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;$('stick').style.transform='';}if(e.pointerId===drag.id)drag.id=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('settings').open&&!$('complete').open)openSettings();return;}if($('settings').open||$('complete').open||mode==='intro')return;if(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='r'&&!e.repeat)toggleRange();if(e.key.toLowerCase()==='c'&&!e.repeat)toggleCart();if(mode==='aim'&&e.key==='ArrowLeft')adjustAim(-1);if(mode==='aim'&&e.key==='ArrowRight')adjustAim(1);if(e.key==='e'&&mode==='walk'&&near)$('approach').click();if(e.key===' '&&mode==='aim'&&!e.repeat)$('hit').click();else if(e.key===' '&&mode==='walk'&&!e.repeat&&!cart.mounted&&!cart.busy)jump.start(garden.height(player.x,player.z));});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{active=!document.hidden;clearInput();last=performance.now();if(audio)document.hidden?audio.suspend():audioOn&&audio.resume();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;$('error').classList.remove('hidden');$('errorMessage').textContent='The graphics session paused. Reload to return to the course.';});
function finish(){closeRange();finished=true;shot=null;mode='walk';clearInput();const completed=holeIndex;holeScores[completed]=strokes;completedCup={...HOLE};const total=holeScores.reduce((a,b)=>a+(b||0),0),par=COURSES.slice(0,completed+1).reduce((a,b)=>a+b.par,0),next=COURSES[completed+1];$('completeName').textContent=COURSES[completed].name;$('completeTitle').textContent='Scorecard';$('score').innerHTML='<table class="scorecard"><caption>Verdant Isles</caption><thead><tr><th scope="col">Hole</th>'+COURSES.map(c=>'<th scope="col">'+c.number+'</th>').join('')+'<th scope="col">Total</th></tr></thead><tbody><tr><th scope="row">Par</th>'+COURSES.map(c=>'<td>'+c.par+'</td>').join('')+'<td>'+COURSES.reduce((a,c)=>a+c.par,0)+'</td></tr><tr class="score-row"><th scope="row">Score</th>'+COURSES.map((c,i)=>'<td class="'+(i===completed?'just-played':'')+'">'+(holeScores[i]??'—')+'</td>').join('')+'<td>'+total+'</td></tr></tbody></table><p class="score-relative">'+(total===par?'Even par':(total>par?'+':'')+(total-par))+' through '+(completed+1)+'</p>';$('completeNote').textContent=next?next.name+' · Par '+next.par:'Round complete.';$('nextHole').classList.toggle('hidden',!next);$('nextHole').textContent=next?'Walk to hole '+next.number:'';$('again').classList.toggle('hidden',!!next);$('explore').classList.toggle('hidden',!!next);$('explore').textContent='Back to course';garden.magic.celebrate(completedCup);completionDue=time+1.5;if(next)advanceHole();updateUI();}

function creatures(dt){updateWildlife(rabbits,dt,player,garden.colliders,shot&&!shot.settled?ball:null);}
function tick(dt){if(mode==='aim'&&swingActive){swingElapsed+=dt;power=swingPower(swingElapsed,club);powerUI();}time+=dt;if(completionDue&&time>=completionDue){completionDue=0;clearInput();$('complete').showModal();}creatures(dt);if(time>hintUntil)$('hint').classList.remove('visible');if(mode==='walk'){
 let mx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x;
 let mz=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-joy.y;
 if(cart.busy||cart.mounted){const wasBusy=cart.busy,oldHeading=cart.heading,delta=cart.step(dt,mz,mx);yaw+=cart.heading-oldHeading;if(cart.mounted&&!wasBusy){const before=player;player=resolveWalk(player,delta.x,delta.z,garden.colliders,garden.walkable);if(Math.hypot(player.x-before.x,player.z-before.z)<Math.hypot(delta.x,delta.z)*.25)cart.speed=0;}if(wasBusy&&!cart.busy){yaw=cart.heading;showHint(cart.mounted?'W/S to drive · A/D to steer · C to exit':'Back on foot.',5);}cartUI();}
 else {const length=Math.hypot(mx,mz);if(length>.1){mx/=Math.max(1,length);mz/=Math.max(1,length);const speed=7*garden.speedCoin.state.multiplier*dt,dx=(Math.sin(yaw)*mz+Math.cos(yaw)*mx)*speed,dz=(-Math.cos(yaw)*mz+Math.sin(yaw)*mx)*speed;player=resolveWalk(player,dx,dz,garden.colliders,garden.walkable,jump.airborne?jump.y:null);walkPhase+=dt*8;}}
 if(garden.rangePickup.collect(player,garden.height(player.x,player.z))){rangefinder.unlock();rangeUI();showHint('Rangefinder discovered · R to look through · Aim the crosshair to measure · R to lower.',10);}
 if(garden.cartPickup.collect(player,garden.height(player.x,player.z))){cart.unlock();cartUI();showHint('Wayfarer cart unlocked · C to enter or exit · Two seconds each way.',9);pluck();}
 if(garden.speedCoin.collect(player,garden.height(player.x,player.z))){showHint('Navigator’s blessing — movement speed +50% for this round.',7);pluck();}
 jump.step(dt,garden.height(player.x,player.z));if(garden.jumpPickup.collect(player)){jump.unlock();showHint('Wayfarer’s leap — press Space for a small jump. Yours for this round.',8);pluck();}
 const n=!jump.airborne&&!cart.mounted&&!cart.busy&&Math.hypot(player.x-ball.x,player.z-ball.z)<3.8;if(n!==near){near=n;updateUI();}
 }else if(mode==='flight'&&shot){stepShot(shot,dt,garden.colliders);ball=ballPosition(shot);if(shot.settled){restClock+=dt;lastShotStats={bounces:shot.bounces,rollDistance:shot.rollDistance,elapsed:shot.elapsed,holed:shot.holed};if(shot.holed){if(restClock>.25)finish();return;}if(restClock>1){if(shot.outOfBounds){ball={...shot.start};strokes++;showHint('Beyond the garden. Ball returned · +1 stroke',5);}else showHint('Follow your ball.',4);shot=null;mode='walk';pitch=-.08;updateUI();}}}
}
function draw(dt){let targetEye,targetLook;
 if(mode==='intro'){const drift=Math.sin(time*.07)*1.5;targetEye=[42+drift,13,43];targetLook=[13,1,-24];}
 else if((completionDue||$('complete').open)&&completedCup){targetEye=[completedCup.x-Math.sin(yaw)*3.6,ground(completedCup.x,completedCup.z)+2.5,completedCup.z+Math.cos(yaw)*3.6];targetLook=[completedCup.x,ground(completedCup.x,completedCup.z)+.6,completedCup.z];}
 else if(mode==='flight'&&shot){const rolling=shot.phase!=='air',back=rolling?3.6:10;targetEye=[ball.x-Math.sin(yaw)*back,rolling?ground(ball.x,ball.z)+2.5:Math.max(ball.y+4,6),ball.z+Math.cos(yaw)*back];targetLook=[ball.x,ball.y+.15,ball.z];}
 else {let x=player.x,z=player.z,y=(jump.airborne?jump.y:garden.height(x,z))+1.8;if(mode==='aim'){const putting=club==='putter';x=ball.x-Math.sin(yaw)*(putting?3.3:5);z=ball.z+Math.cos(yaw)*(putting?3.3:5);y=ground(x,z)+(putting?3.7:2.8);}else if(sway&&!cart.mounted&&!cart.busy&&(keys.size||Math.hypot(joy.x,joy.y)>.1))y+=Math.sin(walkPhase)*.035;targetEye=[x,y,z];targetLook=[x+Math.sin(yaw)*Math.cos(pitch)*20,y+Math.sin(pitch)*20,z-Math.cos(yaw)*Math.cos(pitch)*20];}
 const blend=1-Math.exp(-dt*(mode==='flight'?5:9));for(let i=0;i<3;i++){eye[i]+=(targetEye[i]-eye[i])*blend;look[i]+=(targetLook[i]-look[i])*blend;}
 garden.update(time,quality);renderer.frame(eye,look,rangefinder.active?14:innerWidth<innerHeight?72:63,time);if(rangefinder.active&&time>=rangeSample){rangeSample=time+.15;const origin={x:eye[0],y:eye[1],z:eye[2]},direction={x:look[0]-eye[0],y:look[1]-eye[1],z:look[2]-eye[2]};rangeReading=measureRange(origin,direction,ground,garden.colliders,{x:HOLE.x,y:ground(HOLE.x,HOLE.z)+2.8,z:HOLE.z});$('rangeDistance').textContent=rangeReading?Math.round(rangeReading.distance/.9144)+' YD':'—';$('rangeDetail').textContent=rangeReading?rangeReading.kind+' · '+Math.round(rangeReading.horizontal/.9144)+' yd horizontal · '+(rangeReading.elevation>=0?'+':'')+(rangeReading.elevation/.9144).toFixed(1)+' yd elevation':'Aim at land, an object or the pin';}renderer.draw(garden.world);if(quality!==2)renderer.draw(garden.grass);renderer.draw(garden.water,[0,0,0],[1,1,1],0);for(const c of COURSES)renderer.draw(garden.flag,[c.cup.x,ground(c.cup.x,c.cup.z),c.cup.z],[1,1,1+Math.sin(time*2)*.4]);
 greenReadUI();const readIndex=nearbyGreen();if(guide&&readIndex>=0){renderer.draw(garden.guides[readIndex].greenGuide,[0,0,0],[1,1,1],.1,null,.65);for(let i=0;i<garden.guides[readIndex].slopeBeads.length;i+=4){const b=garden.guides[readIndex].slopeBeads[i],t=(time*.45+i*.17)%1,x=b.x+b.dx*t,z=b.z+b.dz*t;renderer.draw(garden.mote,[x,ground(x,z)+.07,z],[.65,.65,.65],.25);}}
 if(!finished){const by=ground(ball.x,ball.z);if(inside(ball.x,ball.z))renderer.draw(garden.shadow,[ball.x,by+.035,ball.z],[1,1,1],0,null,.35);renderer.draw(garden.ball,[ball.x,ball.y,ball.z],[1,1,1],.08,[ball.rotationX||0,0,ball.rotationZ||0]);if(mode==='walk'||mode==='aim')renderer.draw(garden.marker,[ball.x,by+.045,ball.z],[1,1,1],.05,null,.65);}
 if(mode==='aim'){for(let i=1;i<8;i++){const d=i*.25,x=ball.x+Math.sin(yaw)*d,z=ball.z-Math.cos(yaw)*d;renderer.draw(garden.mote,[x,ground(x,z)+.07,z],[.5,.5,.5],.16);}}
 fairies.forEach(([hx,hz],i)=>{const x=hx+Math.sin(time*.55+i)*1.4,z=hz+Math.cos(time*.4+i)*1.1,y=ground(x,z)+1.65+Math.sin(time*1.4+i)*.24,flap=.3+Math.abs(Math.sin(time*18+i))*.8;renderer.draw(garden.mote,[x,y,z],[1.1,1.1,1.1],.7);renderer.draw(garden.wing,[x,y,z],[flap*.55,.55,.55],.2,[0,time*.2+i,0],.65);renderer.draw(garden.wing,[x,y,z],[-flap*.55,.55,.55],.2,[0,time*.2+i,0],.65);for(let j=1;j<4;j++)renderer.draw(garden.mote,[x-.09*j,y-.13*j,z+.06*j],[.55,.55,.55],.22);});
 if(sway&&quality!==2)for(let i=0;i<36;i++){const x=Math.sin(i*17+time*.08)*28,z=Math.cos(i*13+time*.055)*55-8,y=2+Math.sin(time*.5+i)*1.1+(i%5);const twinkle=Math.pow(Math.max(0,Math.sin(time*.7+i*2.17)),10),size=.45+twinkle*.8;renderer.draw(garden.mote,[x,y,z],[size,size,size],.2+twinkle*.75,null,.25+twinkle*.6);}
 renderer.finishFrame();
}
let frameAverage=16,frameCount=0;
function frame(now){const elapsed=now-last,dt=Math.min(.05,elapsed/1000||.016);last=now;if(active){frameAverage=frameAverage*.97+Math.min(150,elapsed||16)*.03;frameCount++;if(!$('settings').open&&!$('complete').open)tick(dt);draw(dt);}requestAnimationFrame(frame);}
renderer.resize(ratio);addEventListener('resize',()=>{clearInput();renderer.resize(ratio);});distances();requestAnimationFrame(frame);
Object.defineProperty(window,'verdantState',{get:()=>({rangefinder:{unlocked:rangefinder.unlocked,active:rangefinder.active,reading:rangeReading},mode,shotShape,cart:{unlocked:cart.unlocked,mounted:cart.mounted,remaining:cart.remaining,speed:cart.speed,heading:cart.heading},jumpUnlocked:jump.unlocked,jumping:jump.airborne,feetY:jump.y,celebrating:!!completionDue,speedBoost: garden.speedCoin.state.multiplier,coinCollected:garden.speedCoin.state.collected,hole:holeIndex+1,holeScores:[...holeScores],course:COURSES[holeIndex].name,swingActive,player:{...player},ball:{...ball},yaw,club,clubGroup:CLUBS[club].group,power,groove,guide,strokes,near,finished,shot:shot?{phase:shot.phase,bounces:shot.bounces,speed:Math.hypot(shot.vx,shot.vz),elapsed:shot.elapsed}:null,lastShotStats,surface:surface(ball.x,ball.z),vertices:renderer.stats.totalVertices,renderer:renderer.stats,width:canvas.width,height:canvas.height,shadows:renderer.shadowOK,frameAverage,frameCount,creatures:{rabbits:rabbits.map(r=>({x:r.x,z:r.z,state:r.state,speed:r.speed,motion:r.motion,phase:r.phase,opacity:r.opacity})),fairies:fairies.length}})});
