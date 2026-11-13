import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../assets/js/renderer.js';
import {createWorld} from '../assets/js/physics.js';
import {LEVELS} from '../assets/js/config.js';

test('renderer resize and draw preserve world coordinates and omit absorbed objects',()=>{
 const calls=[];const methods=['clearRect','save','restore','translate','scale','fillRect','strokeRect','beginPath','arc','stroke','fill','fillText'];
 const context=Object.fromEntries(methods.map(name=>[name,(...args)=>calls.push([name,...args])]));
 let rect={width:1024,height:768},resize,disconnected=false,width=0,height=0,writes=0;
 const canvas={get width(){return width;},set width(v){width=v;writes++;},get height(){return height;},set height(v){height=v;writes++;},getContext:()=>context,getBoundingClientRect:()=>rect};
 const host={devicePixelRatio:3,ResizeObserver:class{constructor(callback){resize=callback;}observe(){}disconnect(){disconnected=true;}}};
 const renderer=new Renderer(canvas,host);assert.equal(width,2048);assert.equal(height,1536);
 const initialWrites=writes;resize();assert.equal(writes,initialWrites);
 for(const level of LEVELS){
  const world=createWorld(level,{idiom:'守株待兔'},4);world.bodies.find(b=>b.charIndex===0).active=false;
  const game={world,nextIndex:1,effects:[{x:20,y:20,life:.25}]},before=structuredClone(game);
  for(const size of [{width:1024,height:768},{width:1280,height:800},{width:1280,height:720}]){
   rect=size;resize();calls.length=0;renderer.draw(game);assert.deepEqual(game,before);
   assert.equal(calls.filter(c=>c[0]==='fillText'&&c[1]==='我').length,1);
   assert.equal(calls.some(c=>c[0]==='fillText'&&c[1]==='守'),false);
   for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert.ok(Number.isFinite(v));
   assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
  }
 }
 renderer.destroy();assert.equal(disconnected,true);
});
