export const TREE_LAYOUT=[[-14,13,2.15,0],[19,-20,1.8,0],[-17,-57,1.65,0],[24,35,.85,1],[-25,38,.8,0],[27,2,.8,1],[-24,-15,.95,0],[26,-43,.85,2],[-25,-36,.85,1],[16,-65,.85,0]];
export function courseColliders(){return TREE_LAYOUT.map(([x,z,s])=>({x,z,r:1.1*s,height:10.5*s})).concat([-24,-17].map(x=>({x,z:-28,r:1.4,height:9})));}
