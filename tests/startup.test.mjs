import test from 'node:test';
import assert from 'node:assert/strict';
import {requestStartAccess,lockLandscape} from '../assets/js/startup.js';

test('Start invokes both permissions and fullscreen synchronously before returning',async()=>{
 const calls=[];const host={DeviceOrientationEvent:{requestPermission(){calls.push('orientation');return Promise.resolve('granted');}},DeviceMotionEvent:{requestPermission(){calls.push('motion');return Promise.resolve('granted');}},document:{documentElement:{requestFullscreen(){calls.push('fullscreen');return Promise.resolve();}}}};
 const result=requestStartAccess(host);assert.deepEqual(calls,['orientation','motion','fullscreen']);assert.deepEqual(await result,{timedOut:false});
});

test('unsupported, throwing and rejected display APIs do not reject startup',async()=>{
 assert.deepEqual(await requestStartAccess({}),{timedOut:false});
 for(const action of [()=>{throw Error('unsupported');},()=>Promise.reject(Error('denied'))]){
  const host={DeviceOrientationEvent:{requestPermission:action},DeviceMotionEvent:{requestPermission:action},document:{documentElement:{requestFullscreen:action}},screen:{orientation:{lock:action}}};
  assert.deepEqual(await requestStartAccess(host),{timedOut:false});assert.equal(await lockLandscape(host),false);
 }
 assert.equal(await lockLandscape({}),true);
 let direction;assert.equal(await lockLandscape({screen:{orientation:{lock(value){direction=value;return Promise.resolve();}}}}),true);assert.equal(direction,'landscape');
});

test('unanswered permissions are bounded and a late rejection remains handled',async()=>{
 let reject;const host={DeviceOrientationEvent:{requestPermission:()=>new Promise((resolve,fail)=>{reject=fail;})}};
 assert.deepEqual(await requestStartAccess(host,5),{timedOut:true});reject(Error('late denial'));
 await new Promise(resolve=>setImmediate(resolve));
});
