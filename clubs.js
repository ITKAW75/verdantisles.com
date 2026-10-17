// PING standard G440 lofts. Carry/launch values are game tuning, not PING claims.
export const CLUBS={
 '5w':{group:'wood',label:'5',name:'5-wood',loft:19,carry:205,launch:19},
 '3w':{group:'wood',label:'3',name:'3-wood',loft:15,carry:225,launch:17},
 driver:{group:'wood',label:'D',name:'Driver',loft:10.5,carry:260,launch:14},
 '9i':{group:'iron',label:'9',name:'9-iron',loft:37,carry:120,launch:30},
 '8i':{group:'iron',label:'8',name:'8-iron',loft:33,carry:134,launch:28},
 '7i':{group:'iron',label:'7',name:'7-iron',loft:29,carry:147,launch:26},
 '6i':{group:'iron',label:'6',name:'6-iron',loft:25.5,carry:160,launch:24},
 '5i':{group:'iron',label:'5',name:'5-iron',loft:22,carry:173,launch:22},
 '4i':{group:'iron',label:'4',name:'4-iron',loft:19,carry:185,launch:20},
 '56':{group:'wedge',label:'56°',name:'56-degree wedge',loft:56,carry:60,launch:49,landingRetention:.035,bounceScale:.48},
 '52':{group:'wedge',label:'52°',name:'52-degree wedge',loft:52,carry:75,launch:43,landingRetention:.065,bounceScale:.62},
 uw:{group:'wedge',label:'U',name:'Utility wedge',loft:47,carry:90,launch:37,landingRetention:.10,bounceScale:.78},
 pw:{group:'wedge',label:'W',name:'Pitching wedge',loft:42,carry:105,launch:32,landingRetention:.15,bounceScale:.94},
 putter:{group:'putter',label:'Anser',name:'Anser putter',loft:3,carry:0,launch:0}
};
export const CLUB_GROUPS={wood:['5w','3w','driver'],iron:['9i','8i','7i','6i','5i','4i'],wedge:['56','52','uw','pw'],putter:['putter']};
// Touch/Roll/Lag are game stroke strengths, not adjustable putter face grooves.
export const PUTTING_GROOVES=[{id:0,label:'Touch',name:'Touch',feet:12},{id:1,label:'Roll',name:'Roll',feet:35},{id:2,label:'Lag',name:'Lag',feet:150}];
export function launchCarryFactor(club,lie){return lie==='sand'&&(club==='driver'||CLUBS[club]?.group==='iron')?.4:1;}
export function shotDistance(club,power,groove=1){
 const c=CLUBS[club];if(!c||!Number.isFinite(power)||power<1||power>100||!Number.isInteger(groove)||!PUTTING_GROOVES[groove])throw Error('Invalid shot selection');
 return (club==='putter'?PUTTING_GROOVES[groove].feet*.3048:c.carry*.9144)*power/100;
}
