import {CLUBS} from './clubs.js';
// Seconds from minimum to maximum. Putting remains the most deliberate.
export const SWING_SECONDS={wood:1.6,iron:2.0,wedge:2.5,putter:3.2};
export function swingPower(seconds,club='putter'){
 const half=SWING_SECONDS[CLUBS[club]?.group||club]||SWING_SECONDS.putter,cycle=half*2,phase=((seconds%cycle)+cycle)%cycle;
 return Math.round(1+99*(phase<=half?phase/half:(cycle-phase)/half));
}
