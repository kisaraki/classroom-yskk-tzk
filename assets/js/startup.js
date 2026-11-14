import {requestPermissions} from './input.js?v=20261114.5';

function attempt(action){
  try{return Promise.resolve(action()).then(()=>true,()=>false);}
  catch{return Promise.resolve(false);}
}

// Invoke this directly in Start's click handler: permission and fullscreen calls
// must happen before yielding, even if the browser ultimately rejects them.
export function requestStartAccess(host=globalThis,timeoutMs=2200,requestMotion=()=>requestPermissions(host)){
  const permissions=requestMotion();
  const fullscreen=attempt(()=>host.document?.documentElement?.requestFullscreen?.());
  const settled=Promise.allSettled([permissions,fullscreen]);
  let timer;
  return Promise.race([
    settled.then(()=>({timedOut:false})),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({timedOut:true}),timeoutMs);})
  ]).finally(()=>clearTimeout(timer));
}

export function lockLandscape(host=globalThis){
  return attempt(()=>host.screen?.orientation?.lock?.('landscape'));
}
