export const LEVELS = Object.freeze([
  [1,'#2E7D32','翠綠',200,2,4,0,2,0],
  [2,'#1565C0','湛藍',200,3,3,1,2,2],
  [3,'#EF6C00','琥珀',180,4,2,2,2,4],
  [4,'#6A1B9A','紫羅蘭',180,5,1,3,1,6],
  [5,'#C62828','緋紅',150,5,0,4,1,8]
].map(([level,color,name,durationSeconds,idiomsRequired,targetPosts,targetBalls,distractorPosts,distractorBalls])=>
  Object.freeze({level,color,name,durationSeconds,idiomsRequired,targetPosts,targetBalls,distractorPosts,distractorBalls})));
export const PHYSICS = Object.freeze({width:1280,height:720,dt:1/120,maxFrame:0.1,maxSteps:12,
  radius:36,playerRadius:28,acceleration:720,maxSpeed:360,damping:0.75,restitution:0.72,spawnGap:32,contactCooldown:15});
export const TIMING = Object.freeze({ready:3,idiomClear:0.8,sensorTimeout:2000});
export function seededRandom(seed) {
  let value=seed>>>0;
  return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function mixSeed(seed,index){return (seed ^ Math.imul(index+1,0x9E3779B1))>>>0;}
export function newSeed(){return globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Math.floor(Math.random()*4294967296);}
