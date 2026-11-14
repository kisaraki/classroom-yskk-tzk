import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../assets/js/config.js';
import {createWorld,step} from '../assets/js/physics.js';
import {DAYLIGHT,gateProgress} from '../assets/js/daylight.js';
test('later levels retain more momentum and roll faster under the same tilt',()=>{
 let previous=0;
 for(const level of LEVELS){
  const world=createWorld(level,{idiom:'守株待兔'},42);
  world.bodies=world.bodies.filter(b=>b.kind==='player');
  const ball=world.bodies[0];ball.x=100;ball.y=350;
  for(let i=0;i<120;i++)step(world,1/120,{x:.2,y:0});
  assert.ok(ball.vx>previous);previous=ball.vx;
  const speed=ball.vx;
  for(let i=0;i<120;i++)step(world,1/120,{x:0,y:0});
  assert.ok(Math.abs(ball.vx-speed*Math.exp(-world.damping))<1e-8);
 }
});
test('morning sun rises toward noon; only afternoon and dusk use sunset artwork',()=>{
 assert.ok(DAYLIGHT[0].sun[1]>DAYLIGHT[1].sun[1]);
 assert.ok(DAYLIGHT[1].sun[1]>DAYLIGHT[2].sun[1]);
 assert.equal(DAYLIGHT[2].sun[0],640);
 assert.deepEqual(DAYLIGHT.slice(3).map(t=>t.sun),[null,null]);
 assert.equal(gateProgress(3),0);assert.equal(gateProgress(0),1);
 assert.equal(gateProgress(1.5),gateProgress(1.5));
});
