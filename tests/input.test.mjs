import test from 'node:test';
import assert from 'node:assert/strict';
import {InputController} from '../assets/js/input.js';
import {sensorMessage} from '../assets/js/ui.js';

// Fixtures describe physical downhill directions. At +90 degrees the device's
// portrait top is at screen-left; at -90 it is at screen-right.
const poses=[
 {angle:0,right:[1,0],down:[0,-1]},
 {angle:90,right:[0,-1],down:[-1,0]},
 {angle:270,right:[0,1],down:[1,0]},
 {angle:-90,right:[0,1],down:[1,0]},
 {angle:180,right:[-1,0],down:[0,1]},
];
test('iPad desktop/mobile identities and Android roll downhill in every screen orientation',()=>{
 for(const [navigator,sign] of [[{platform:'iPad'},1],[{platform:'MacIntel',maxTouchPoints:5},1],[{platform:'Linux armv8l'},-1]]){
  for(const pose of poses)for(const [direction,axis] of [['right','x'],['down','y']])for(const reverse of [1,-1]){
   const host={navigator,screen:{orientation:{angle:pose.angle}},performance:{now:()=>0}};
   const input=new InputController(host);input.setMode('tilt');
   input.motion({accelerationIncludingGravity:{x:0,y:0,z:sign*-9.8}});
   const [x,y]=pose[direction];
   for(let i=0;i<30;i++)input.motion({accelerationIncludingGravity:{x:sign*x*reverse*3,y:sign*y*reverse*3,z:sign*-9.3}});
   const v=input.gravity();assert.ok(v[axis]*reverse>.7,JSON.stringify({navigator,pose,direction,reverse,v}));
   assert.ok(Math.abs(v[axis==='x'?'y':'x'])<1e-9);
  }
 }
});
test('orientation gravity projection agrees with iPad motion at tilted and inverted postures',()=>{
 for(const angle of [0,90,270])for(const [beta,gamma] of [[20,30],[120,30],[-20,-30]]){
  const host={navigator:{platform:'iPad'},screen:{orientation:{angle}},performance:{now:()=>0}};
  const motion=new InputController(host),orientation=new InputController(host);
  const b=beta*Math.PI/180,g=gamma*Math.PI/180;
  motion.motion({accelerationIncludingGravity:{x:9.80665*Math.cos(b)*Math.sin(g),y:-9.80665*Math.sin(b)}});
  orientation.orientation({beta,gamma});
  assert.ok(Math.abs(motion.raw.x-orientation.raw.x)<1e-9);assert.ok(Math.abs(motion.raw.y-orientation.raw.y)<1e-9);
 }
});
test('rotation discards old neutral posture and supports legacy Safari angle',()=>{
 const host={orientation:90,navigator:{platform:'iPad'}};const input=new InputController(host);input.setMode('tilt');
 input.motion({accelerationIncludingGravity:{x:1,y:2}});host.orientation=-90;input.resetOrientation();
 input.motion({accelerationIncludingGravity:{x:2,y:1}});assert.deepEqual(input.gravity(),{x:0,y:0});
 assert.equal(input.angle(),-90);assert.equal(input.calibrate(),true);
});
test('permission focus loss preserves pending request and reports result without timeout fallback',async()=>{
 let grant,now=0;const host=new EventTarget();Object.assign(host,{performance:{now:()=>now},DeviceMotionEvent:{requestPermission:()=>new Promise(resolve=>{grant=resolve;})}});
 const joystick=new EventTarget();joystick.querySelector=()=>({style:{}});
 const input=new InputController(host);input.attach(joystick);
 try{const pending=input.requestTilt();host.dispatchEvent(new Event('blur'));now=3000;
  assert.deepEqual(input.gravity(),{x:0,y:0});assert.equal(input.tiltPending,true);
  grant('granted');assert.equal(await pending,true);assert.equal(input.mode,'tilt');
  assert.match(sensorMessage(input),/動作權限：已允許/);assert.match(sensorMessage(input),/有效資料：0 次/);
 }finally{input.destroy();}
});
test('denied and failed permission requests are distinguishable in diagnostics',async()=>{
 const input=new InputController({DeviceMotionEvent:{requestPermission:()=>Promise.resolve('denied')},DeviceOrientationEvent:{requestPermission:()=>Promise.reject(Object.assign(Error(),{name:'NotAllowedError'}))}});
 assert.equal(await input.requestTilt(),false);assert.equal(input.mode,'joystick');
 assert.match(sensorMessage(input),/動作權限：未允許/);assert.match(sensorMessage(input),/NotAllowedError/);
});
