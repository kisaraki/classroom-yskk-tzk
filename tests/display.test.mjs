import test from 'node:test';
import assert from 'node:assert/strict';
import {requestDisplay} from '../assets/js/display.js';
test('display request is synchronous at entry and locks only after fullscreen settles',async()=>{
 const calls=[],doc={documentElement:{requestFullscreen(){calls.push('full');doc.fullscreenElement=this;return Promise.resolve();}}};
 const promise=requestDisplay({document:doc,screen:{orientation:{lock(mode){calls.push(mode);}}}});
 assert.deepEqual(calls,['full']);assert.deepEqual(await promise,{fullscreen:true,locked:true});assert.deepEqual(calls,['full','landscape']);
});
test('unsupported, rejected and unanswered display requests report failure',async()=>{
 assert.deepEqual(await requestDisplay({}),{fullscreen:false,locked:false});
 assert.deepEqual(await requestDisplay({document:{documentElement:{requestFullscreen(){throw Error();}}},screen:{orientation:{lock(){return Promise.reject(Error());}}}}),{fullscreen:false,locked:false});
 assert.deepEqual(await requestDisplay({document:{documentElement:{requestFullscreen:()=>new Promise(()=>{})}}},5),{fullscreen:false,locked:false});
});
