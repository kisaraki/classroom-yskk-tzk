import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {Game,FixedClock} from '../assets/js/state.js';import {LEVELS,PHYSICS as P} from '../assets/js/config.js';import {createWorld,body,resolvePair,step} from '../assets/js/physics.js';import {choose19,validateDataset} from '../assets/js/idioms.js';import {editName,validName} from '../assets/js/keyboard.js';import {InputController,requestPermissions,screenVector} from '../assets/js/input.js';
const selected=JSON.parse(readFileSync(new URL('../codex-workpack/data/idioms_500_selection.json',import.meta.url),'utf8')).items;
const items=selected.map(x=>({...x,zhuyin:['ㄧ','ㄧ','ㄧ','ㄧ'],definition:'隔離測試夾具，非教學資料',source:'synthetic-test-only',difficulty:3}));
test('five level configurations honor approved 200-second override and remaining workpack contract',()=>{const contract=JSON.parse(readFileSync(new URL('../codex-workpack/contracts/levels.json',import.meta.url),'utf8'));for(const [i,l] of contract.levels.entries())for(const [k,v]of Object.entries(l))assert.equal(LEVELS[i][k],k==='durationSeconds'&&i<2?200:v);});
test('19 unique idioms and deterministic layouts',()=>{assert.deepEqual(choose19(items,7),choose19(items,7));assert.equal(new Set(choose19(items,7).flat().map(x=>x.id)).size,19);for(const l of LEVELS){const w=createWorld(l,items[0],42);assert.deepEqual(w,createWorld(l,items[0],42));assert.equal(w.bodies.length,1+4+l.distractorPosts+l.distractorBalls);for(let i=0;i<w.bodies.length;i++)for(let j=i+1;j<w.bodies.length;j++)assert.ok(Math.hypot(w.bodies[i].x-w.bodies[j].x,w.bodies[i].y-w.bodies[j].y)>w.bodies[i].radius+w.bodies[j].radius);}});
test('mass impulses, fixed posts, coincident circles and walls stay finite',()=>{const a=body('a','player',100,100,{vx:100}),b=body('b','targetBall',150,100,{vx:-100});resolvePair(a,b);assert.ok(a.vx<0&&b.vx>0);const p=body('p','targetPost',100,100),c=body('c','player',100,100);resolvePair(p,c);assert.equal(p.x,100);assert.ok(Number.isFinite(c.x));const w={bodies:[body('x','player',1,1,{vx:-100,vy:-100})],width:1280,height:720,stepId:0,lastContacts:new Map()};step(w,P.dt,{x:0,y:0});assert.ok(w.bodies[0].vx>0&&w.bodies[0].x>=28);});
test('30, 60 and 120 Hz deliver equal fixed steps',()=>{const counts=[];for(const hz of [30,60,120]){const c=new FixedClock();let count=0;for(let i=0;i<hz*10;i++)c.advance(1/hz,()=>count++);counts.push(count);}assert.deepEqual(counts,[1200,1200,1200]);});
test('pause freezes preparation; retries preserve layout and spend exactly three attempts',()=>{const g=new Game(items);g.start('示範',12);const first=structuredClone(g.world);g.tick(.5);g.pause();const ready=g.readyRemaining;g.tick(10);assert.equal(g.readyRemaining,ready);g.resume();assert.equal(g.status,'READY');assert.equal(g.retry(false),false);for(let i=0;i<3;i++){assert.ok(g.retry(true));assert.deepEqual(g.world,first);}assert.equal(g.retry(true),false);g.restart(true,13);assert.equal(g.attemptsUsed,0);});
test('real contact simulation completes 76 ordered hits and all 19 idioms',()=>{const g=new Game(items);g.start('示範',99);let hits=0;for(let level=0;level<5;level++){g.tick(3);for(let q=0;q<g.level.idiomsRequired;q++){for(let char=0;char<4;char++){const target=g.world.bodies.find(b=>b.charIndex===char),player=g.world.bodies[0];player.x=target.x;player.y=target.y;player.vx=player.vy=0;g.tick(P.dt);assert.equal(g.nextIndex,char+1);hits++;}g.tick(1);}assert.equal(g.status,level===4?'GAME_CLEAR':'LEVEL_CLEAR');if(level<4)g.nextLevel();}assert.equal(hits,76);assert.equal(g.summaries.flatMap(s=>s.idioms).length,19);});
test('last legal hit wins over timeout; other timeout fails',()=>{const g=new Game(items);g.start('示範',4);g.tick(3);g.idiomIndex=g.level.idiomsRequired-1;g.setupIdiom();g.nextIndex=3;g.remaining=P.dt/2;const target=g.world.bodies.find(b=>b.charIndex===3);Object.assign(g.world.bodies[0],{x:target.x,y:target.y,vx:0,vy:0});g.tick(P.dt);assert.equal(g.status,'IDIOM_CLEAR');const f=new Game(items);f.start('示範',4);f.tick(3);f.remaining=P.dt/2;f.tick(P.dt);assert.equal(f.status,'LEVEL_FAILED');});
test('names count graphemes and pending formal dataset is rejected',()=>{assert.equal(editName('王👨‍👩‍👧','delete'),'王');assert.ok(validName('804-01'));assert.equal(validName('  '),false);assert.throws(()=>validateDataset({schemaVersion:1,count:500,items,linguisticReviewStatus:'PENDING'}),/核校/);});
test('permission requests happen synchronously and handle rejection',async()=>{const calls=[];const result=requestPermissions({DeviceOrientationEvent:{requestPermission(){calls.push(1);return Promise.reject(new Error('denied'));}},DeviceMotionEvent:{requestPermission(){calls.push(2);return Promise.resolve('granted');}}});assert.deepEqual(calls,[1,2]);assert.equal((await result)[0].status,'rejected');assert.ok(Math.abs(screenVector(1,0,90).y+1)<1e-9);});

test('held diagonal keys survive a second keydown; blur releases pointer ownership',()=>{
  const host=new EventTarget(),joystick=new EventTarget(),captures=new Set(),knob={style:{}};
  joystick.querySelector=()=>knob;
  joystick.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
  joystick.setPointerCapture=id=>captures.add(id);
  joystick.hasPointerCapture=id=>captures.has(id);
  joystick.releasePointerCapture=id=>captures.delete(id);
  const emit=(target,type,props={})=>target.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),props));
  const input=new InputController(host);input.attach(joystick);
  try{
    emit(host,'keydown',{key:'ArrowRight'});emit(host,'keydown',{key:'ArrowUp'});
    assert.ok(Math.abs(input.gravity().x-Math.SQRT1_2)<1e-12);assert.ok(Math.abs(input.gravity().y+Math.SQRT1_2)<1e-12);
    emit(host,'keyup',{key:'ArrowUp'});assert.deepEqual(input.gravity(),{x:1,y:0});
    emit(joystick,'pointerdown',{pointerId:1,clientX:86,clientY:50});assert.ok(captures.has(1));
    emit(host,'blur');assert.equal(captures.size,0);assert.deepEqual(input.gravity(),{x:0,y:0});
    emit(joystick,'pointermove',{pointerId:1,clientX:86,clientY:50});assert.deepEqual(input.gravity(),{x:0,y:0});
    emit(joystick,'pointerdown',{pointerId:2,clientX:50,clientY:86});assert.deepEqual(input.gravity(),{x:0,y:1});
    emit(joystick,'pointerdown',{pointerId:3,clientX:86,clientY:50});assert.deepEqual(input.gravity(),{x:0,y:1});
    emit(joystick,'pointercancel',{pointerId:2});assert.deepEqual(input.gravity(),{x:0,y:0});
  }finally{input.destroy();}
});

test('wrong order, indirect hits, repeated characters and simultaneous contacts preserve HUD order',()=>{
 const g=new Game(items);g.start('規則測試',15);g.groups[0][0]={...g.idiom,idiom:'日日夜夜'};g.setupIdiom();g.status='PLAYING';
 const event=(a,b)=>({a,b,stepId:g.world.stepId});
 const original=g.view();
 g.applyContacts([event('object-0','object-1')]);assert.equal(g.nextIndex,0);
 g.applyContacts([event('player','object-2')]);assert.equal(g.mistakes,1);assert.deepEqual(g.view(),original);
 g.applyContacts([event('player','object-0'),event('player','object-1')]);assert.equal(g.nextIndex,1);
 assert.deepEqual(g.view().map(x=>x.status),['COMPLETED','CURRENT','PENDING','PENDING']);
 assert.equal(g.view()[0].char,'日');assert.equal(g.view()[1].char,'日');
 g.applyContacts([event('player','object-0')]);assert.equal(g.nextIndex,1);
 g.applyContacts([{...event('player','object-1'),stepId:-1}]);assert.equal(g.nextIndex,1);
 g.applyContacts([event('player','object-1')]);assert.equal(g.nextIndex,2);
});

test('all active game phases freeze timers, world and progress until visible landscape resume',()=>{
 for(const status of ['READY','PLAYING','IDIOM_CLEAR']){
  const g=new Game(items);g.start('暫停測試',16);g.status=status;g.clearRemaining=.6;
  const snapshot=structuredClone({world:g.world,remaining:g.remaining,ready:g.readyRemaining,clear:g.clearRemaining,view:g.view()});
  assert.equal(g.pause('background'),true);g.tick(100,{x:1,y:1});
  assert.deepEqual({world:g.world,remaining:g.remaining,ready:g.readyRemaining,clear:g.clearRemaining,view:g.view()},snapshot);
  assert.equal(g.resume({visible:false}),false);assert.equal(g.resume({landscape:false}),false);
  assert.equal(g.resume(),true);assert.equal(g.status,status);
 }
});

test('sensor invalid samples, dead zone, calibration and timeout use a bounded fallback',()=>{
 let now=0;const input=new InputController({performance:{now:()=>now},screen:{orientation:{angle:90}}});input.setMode('tilt');
 assert.equal(input.accept(NaN,1,'motion'),false);assert.equal(input.calibrate(),false);
 input.accept(0,0,'motion');input.accept(.01,0,'motion');assert.deepEqual(input.gravity(),{x:0,y:0});
 for(let i=0;i<30;i++)input.accept(10,10,'motion');assert.ok(Math.hypot(input.gravity().x,input.gravity().y)<=1);
 assert.equal(input.calibrate(),true);assert.deepEqual(input.gravity(),{x:0,y:0});
 now=2100;assert.deepEqual(input.gravity(),{x:0,y:0});assert.equal(input.mode,'joystick');
});

test('late tilt permission cannot override manual mode or a lifecycle clear',async()=>{
 let grant;const input=new InputController({DeviceOrientationEvent:{requestPermission:()=>new Promise(resolve=>{grant=resolve;})}});
 const pending=input.requestTilt();assert.equal(typeof grant,'function');assert.equal(input.tiltPending,true);
 input.setMode('joystick');input.joy={x:1,y:0};grant('granted');assert.equal(await pending,false);
 assert.equal(input.mode,'joystick');assert.deepEqual(input.gravity(),{x:1,y:0});
 const interrupted=input.requestTilt();input.clear();grant('granted');assert.equal(await interrupted,false);assert.equal(input.mode,'joystick');
 const accepted=input.requestTilt();grant('granted');assert.equal(await accepted,true);assert.equal(input.mode,'tilt');
});

test('entering tilt uses current posture rather than stale home-screen calibration',()=>{
 let now=0;const input=new InputController({performance:{now:()=>now}});
 input.accept(0,0,'motion');input.accept(1,1,'motion');input.setMode('tilt');
 input.accept(1,1,'motion');assert.deepEqual(input.gravity(),{x:0,y:0});
 input.setMode('joystick');now=3000;input.setMode('tilt');input.accept(-1,0,'motion');assert.deepEqual(input.gravity(),{x:0,y:0});
 input.lastMotion=now;input.resetOrientation();input.orientation({gamma:20,beta:10});assert.equal(input.source,'orientation');
});

test('each newly entered level restores three retries and preserves earlier retry records',()=>{
 const g=new Game(items);g.start('跨關重試',22);
 for(let level=0;level<5;level++){
  assert.equal(g.attemptsUsed,0);
  for(let attempt=0;attempt<3;attempt++)assert.equal(g.retry(true),true);
  assert.equal(g.retry(true),false);assert.equal(g.retryHistory.length,(level+1)*3);
  g.tick(3);
  for(let q=0;q<g.level.idiomsRequired;q++){
   for(let char=0;char<4;char++){
    const target=g.world.bodies.find(b=>b.charIndex===char);Object.assign(g.world.bodies[0],{x:target.x,y:target.y,vx:0,vy:0});g.tick(P.dt);
   }
   g.tick(1);
  }
  assert.equal(g.summaries[level].attempts,3);
  if(level<4)assert.equal(g.nextLevel(),true);
 }
 assert.equal(g.status,'GAME_CLEAR');assert.equal(g.retryHistory.length,15);
});

test('contact cooldown suppresses continuous hits but allows a separated later contact',()=>{
 const player=body('p','player',100,100),post=body('t','targetPost',160,100);
 const world={bodies:[player,post],width:P.width,height:P.height,stepId:0,lastContacts:new Map()};
 const touch=()=>{Object.assign(player,{x:100,y:100,vx:0,vy:0});return step(world,P.dt,{x:0,y:0});};
 assert.equal(touch().length,1);
 for(let i=0;i<P.contactCooldown*2;i++)assert.equal(touch().length,0);
 Object.assign(player,{x:400,y:400,vx:0,vy:0});
 for(let i=0;i<P.contactCooldown+1;i++)assert.equal(step(world,P.dt,{x:0,y:0}).length,0);
 assert.equal(touch().length,1);
});

test('fourth-hit absorption continues during clear transition but freezes when paused',()=>{
 const g=new Game(items);g.start('動畫測試',32);g.tick(3);
 for(let char=0;char<4;char++){
  const target=g.world.bodies.find(b=>b.charIndex===char);Object.assign(g.world.bodies[0],{x:target.x,y:target.y,vx:0,vy:0});g.tick(P.dt);
 }
 assert.equal(g.status,'IDIOM_CLEAR');const remaining=g.remaining,world=structuredClone(g.world);
 const life=g.effects.at(-1).life;g.tick(.1);assert.ok(g.effects.at(-1).life<life);assert.equal(g.remaining,remaining);
 assert.deepEqual(g.world.bodies.map(b=>[b.x,b.y,b.vx,b.vy]),world.bodies.map(b=>[b.x,b.y,b.vx,b.vy]));
 g.pause();const effects=structuredClone(g.effects);g.tick(1);assert.deepEqual(g.effects,effects);
 g.resume();g.tick(.45);assert.equal(g.effects.length,0);assert.equal(g.status,'IDIOM_CLEAR');
});

test('wrong targets and distractors cost five seconds, sustained contact and correct hits do not',()=>{
 const g=new Game(items);g.start('扣時測試',64);g.tick(3);
 const player=g.world.bodies[0];
 const touch=target=>{Object.assign(player,{x:target.x,y:target.y,vx:0,vy:0});g.tick(P.dt);};
 const wrong=g.world.bodies.find(b=>b.charIndex===2);
 const right=g.world.bodies.find(b=>b.charIndex===0);
 const distractor=g.world.bodies.find(b=>b.kind==='distractorPost');
 const before=g.remaining;
 touch(wrong);
 assert.ok(Math.abs(g.remaining-(before-5-P.dt))<1e-9);
 assert.match(g.feedback.text,/扣 5 秒/);
 const after=g.remaining;
 touch(wrong);
 assert.ok(Math.abs(g.remaining-(after-P.dt))<1e-9);
 const beforeCorrect=g.remaining;
 touch(right);
 assert.equal(g.nextIndex,1);
 assert.ok(Math.abs(g.remaining-(beforeCorrect-P.dt))<1e-9);
 g.remaining=4;
 touch(distractor);
 assert.equal(g.mistakes,2);
 assert.equal(g.remaining,0);
 assert.equal(g.status,'LEVEL_FAILED');
 assert.equal(g.nextIndex,1);
});
