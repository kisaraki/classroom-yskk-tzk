export const DAYLIGHT = Object.freeze([
 {name:'清晨',color:'#008c92',board:'#037f98',sun:[1030,115],sunColor:'#ffe18a'},
 {name:'上午',color:'#0075d9',board:'#066ac0',sun:[910,75],sunColor:'#ffe660'},
 {name:'中午',color:'#c28b00',board:'#008da9',sun:[640,45],sunColor:'#fff29a'},
 {name:'下午',color:'#e35e22',board:'#bd652e',sun:null},
 {name:'黃昏',color:'#8544c4',board:'#704995',sun:null}
]);
// Use the READY clock so the gate freezes when the game pauses.
export function gateProgress(remaining){return Math.max(0,Math.min(1,(3-remaining)/2.6));}
export const LEVEL_DAMPING=Object.freeze([.95,.75,.55,.35,.18]);
