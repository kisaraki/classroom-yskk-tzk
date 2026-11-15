import test from 'node:test';
import assert from 'node:assert/strict';
import {requestHomeAccess,requestStartAccess} from '../assets/js/startup.js';

test('access invokes permissions and fullscreen synchronously, then tries landscape',async()=>{
 const calls=[];const host={DeviceOrientationEvent:{requestPermission(){calls.push('orientation');return Promise.resolve('granted');}},DeviceMotionEvent:{requestPermission(){calls.push('motion');return Promise.resolve('granted');}},document:{documentElement:{requestFullscreen(){calls.push('fullscreen');return Promise.resolve();}}},screen:{orientation:{lock(value){calls.push(value);}}}};
 const result=requestStartAccess(host);assert.deepEqual(calls,['orientation','motion','fullscreen']);assert.deepEqual(await result,{timedOut:false});
 assert.deepEqual(calls,['orientation','motion','fullscreen','landscape']);
});

test('unsupported, throwing and rejected display APIs do not reject startup',async()=>{
 assert.deepEqual(await requestStartAccess({}),{timedOut:false});
 for(const action of [()=>{throw Error('unsupported');},()=>Promise.reject(Error('denied'))]){
  const host={DeviceOrientationEvent:{requestPermission:action},DeviceMotionEvent:{requestPermission:action},document:{documentElement:{requestFullscreen:action}},screen:{orientation:{lock:action}}};
  assert.deepEqual(await requestStartAccess(host),{timedOut:false});
 }
});

test('unanswered permissions are bounded and a late rejection remains handled',async()=>{
 let reject;const host={DeviceOrientationEvent:{requestPermission:()=>new Promise((resolve,fail)=>{reject=fail;})}};
 assert.deepEqual(await requestStartAccess(host,5),{timedOut:true});reject(Error('late denial'));
 await new Promise(resolve=>setImmediate(resolve));
});

test('homepage attempts access on load and retries exactly once on an actual click',()=>{
 for(const clicked of ['entry-yes','entry-no','start']){
  let listener,attempts=0;
  const document={
   addEventListener(type,fn,capture){assert.equal(type,'click');assert.equal(capture,true);listener=fn;},
   removeEventListener(type,fn,capture){assert.equal(type,'click');assert.equal(capture,true);assert.equal(fn,listener);listener=undefined;}
  };
  requestHomeAccess(document,()=>attempts++);
  assert.equal(attempts,1);
  listener({isTrusted:false});assert.equal(attempts,1);
  listener({isTrusted:true,target:{closest:selector=>selector==='#'+clicked}});
  assert.equal(attempts,clicked==='start'?1:2);
  assert.equal(listener,undefined);
 }
});
