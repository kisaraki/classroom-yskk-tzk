import {requestPermissions} from './input.js?v=20261115.11';
import {requestDisplay} from './display.js?v=20261115.11';

// Ask for motion before fullscreen can consume the user's activation.
export function requestStartAccess(host=globalThis,timeoutMs=2200,requestMotion=()=>requestPermissions(host)){
  const permissions=requestMotion();
  const display=requestDisplay(host,timeoutMs);
  const settled=Promise.allSettled([permissions,display]);
  let timer;
  return Promise.race([
    settled.then(()=>({timedOut:false})),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({timedOut:true}),timeoutMs);})
  ]).finally(()=>clearTimeout(timer));
}

// A load-time attempt may be rejected before the browser has a user gesture.
// Retry on the first real click, before the clicked button's own handler runs.
export function requestHomeAccess(document,prepare){
  function retry(event){
    if(!event.isTrusted)return;
    document.removeEventListener('click',retry,true);
    // The Start button already requests the same access in its own handler.
    if(!event.target?.closest?.('#start'))void prepare();
  }
  document.addEventListener('click',retry,true);
  void prepare();
}
