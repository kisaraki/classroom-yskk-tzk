import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,PHYSICS as P} from '../assets/js/config.js';
import {createWorld,step} from '../assets/js/physics.js';
import {FixedClock} from '../assets/js/state.js';
import {loadDataset} from '../assets/js/idioms.js';
import {validatePresets} from '../assets/js/keyboard.js';
const idiom={idiom:'日日夜夜'};

test('500 seeded layouts retain exact object kinds, unique distractors and safe gaps',()=>{
 for(const level of LEVELS)for(let seed=0;seed<100;seed++){
  const w=createWorld(level,idiom,seed);
  for(const kind of ['targetPost','targetBall','distractorPost','distractorBall'])assert.equal(w.bodies.filter(b=>b.kind===kind).length,level[kind+'s']);
  const distractors=w.bodies.filter(b=>b.kind.startsWith('distractor')).map(b=>b.char);
  assert.equal(new Set(distractors).size,distractors.length);assert.ok(distractors.every(c=>!idiom.idiom.includes(c)));
  for(let i=0;i<w.bodies.length;i++)for(let j=i+1;j<w.bodies.length;j++)assert.ok(Math.hypot(w.bodies[i].x-w.bodies[j].x,w.bodies[i].y-w.bodies[j].y)>=w.bodies[i].radius+w.bodies[j].radius+P.spawnGap);
 }
});

test('full 960 seconds of simulated physics remain finite and inside walls with immobile posts',()=>{
 for(const level of LEVELS){
  const world=createWorld(level,idiom,123);const posts=world.bodies.filter(b=>!b.inverseMass).map(b=>({id:b.id,x:b.x,y:b.y}));
  for(let i=0;i<level.durationSeconds/P.dt;i++){
   step(world,P.dt,{x:Math.sin(i/211),y:Math.cos(i/317)});
   for(const b of world.bodies){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(b.x>=b.radius&&b.x<=P.width-b.radius&&b.y>=b.radius&&b.y<=P.height-b.radius);}
  }
  for(const p of posts){const b=world.bodies.find(b=>b.id===p.id);assert.equal(b.x,p.x);assert.equal(b.y,p.y);assert.equal(b.vx,0);assert.equal(b.vy,0);}
 }
});

test('30/60/120 Hz produce identical physical positions and velocities',()=>{
 const worlds=[];
 for(const hz of [30,60,120]){
  const w=createWorld(LEVELS[4],idiom,93),clock=new FixedClock();
  for(let frame=0;frame<hz*10;frame++)clock.advance(1/hz,dt=>step(w,dt,{x:.7,y:-.4}));worlds.push(w);
 }
 assert.deepEqual(worlds[0],worlds[1]);assert.deepEqual(worlds[1],worlds[2]);
});

test('dataset load errors are actionable and formal mode cannot fall back to preview',async()=>{
 await assert.rejects(loadDataset(false,{fetchImpl:async path=>{assert.equal(path,'./data/idioms_500.json');return {ok:false};}}),/正式題庫尚未就緒/);
 await assert.rejects(loadDataset(true,{fetchImpl:async()=>{throw new Error('network');}}),/連線失敗或逾時/);
 await assert.rejects(loadDataset(true,{fetchImpl:async()=>({ok:true,json:async()=>{throw new SyntaxError();}})}),/有效的 JSON/);
 assert.throws(()=>validatePresets({commonCharacters:['王'],presetNames:[null]}),/鍵盤設定格式/);
 assert.throws(()=>validatePresets({commonCharacters:'王',presetNames:[]}),/鍵盤設定格式/);
 assert.deepEqual(validatePresets({commonCharacters:['王'],presetNames:['804-01']}),{commonCharacters:['王'],presetNames:['804-01']});
});
