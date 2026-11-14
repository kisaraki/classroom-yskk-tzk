import {TIMING} from './config.js';
export function screenVector(x,y,angle){const r=angle*Math.PI/180;return {x:x*Math.cos(r)+y*Math.sin(r),y:-x*Math.sin(r)+y*Math.cos(r)};}
export function clampVector(v){const length=Math.max(1,Math.hypot(v.x,v.y));return {x:v.x/length,y:v.y/length};}
// WebKit iOS exposes Core Motion gravity; its sign is opposite to W3C
// accelerationIncludingGravity. iPad's desktop-site navigator reports MacIntel.
export function motionPolarity(host){const n=host.navigator;return /iPad|iPhone|iPod/.test(n?.platform||'')||(n?.platform==='MacIntel'&&n.maxTouchPoints>1)?1:-1;}
// Must be called directly in the user gesture, before the caller's first await.
export function requestPermissions(host=globalThis,onResult=()=>{}){
  const pending=[];
  for(const key of ['DeviceOrientationEvent','DeviceMotionEvent']){
    const api=host[key];if(typeof api?.requestPermission==='function'){
      onResult(key,'requesting');
      let request;try{request=Promise.resolve(api.requestPermission());}catch(error){request=Promise.reject(error);}
      pending.push(request.then(value=>{onResult(key,value);return value;},error=>{onResult(key,'error',error?.name||'Error');throw error;}));
    }else onResult(key,api?'not-required':'unavailable');
  }
  return Promise.allSettled(pending);
}
export class InputController{
  constructor(host=globalThis){
    this.host=host;this.mode='joystick';this.modeRevision=0;this.tiltPending=false;this.joy={x:0,y:0};this.keys=new Set();this.raw=null;this.neutral=null;this.filtered={x:0,y:0};this.lastValid=-Infinity;this.lastMotion=-Infinity;this.source=null;this.modeMessage='手動搖桿';
    this.permission={};this.eventCounts={motion:0,orientation:0,valid:0};
  }
  now(){return this.host.performance?.now()??Date.now();}
  angle(){
    // iPad Screen Orientation uses a landscape natural origin, whereas its
    // motion axes and legacy window.orientation use the portrait origin.
    if(motionPolarity(this.host)===1){
      if(Number.isFinite(this.host.orientation))return this.host.orientation;
      const portraitAngles={'portrait-primary':0,'landscape-primary':90,'portrait-secondary':180,'landscape-secondary':270};
      const angle=portraitAngles[this.host.screen?.orientation?.type];
      if(angle!==undefined)return angle;
    }
    return this.host.screen?.orientation?.angle??this.host.orientation??0;
  }
  accept(x,y,source,now=this.now()){
    if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    const raw=screenVector(x,y,this.angle());
    if(this.source!==source){this.source=source;this.neutral=null;this.filtered={x:0,y:0};}
    this.raw=raw;this.lastValid=now;this.eventCounts.valid++;if(!this.neutral)this.neutral={...raw};
    const v=clampVector({x:raw.x-this.neutral.x,y:raw.y-this.neutral.y});
    this.filtered.x+=.22*(v.x-this.filtered.x);this.filtered.y+=.22*(v.y-this.filtered.y);return true;
  }
  motion(event){this.eventCounts.motion++;const g=event.accelerationIncludingGravity;if(!g||typeof g.x!=='number'||typeof g.y!=='number')return;
    const sign=motionPolarity(this.host);
    if(this.accept(sign*g.x/4,-sign*g.y/4,'motion'))this.lastMotion=this.now();}
  orientation(event){this.eventCounts.orientation++;if(this.now()-this.lastMotion<400||typeof event.gamma!=='number'||typeof event.beta!=='number')return;
    // Project gravity rather than rotating Euler angles as a 2D vector.
    const beta=event.beta*Math.PI/180,gamma=event.gamma*Math.PI/180;
    this.accept(Math.cos(beta)*Math.sin(gamma)*9.80665/4,Math.sin(beta)*9.80665/4,'orientation');}
  calibrate(){if(!this.raw||this.now()-this.lastValid>TIMING.sensorTimeout)return false;this.neutral={...this.raw};this.filtered={x:0,y:0};return true;}
  clear({cancelRequest=true}={}){if(cancelRequest){this.modeRevision++;this.tiltPending=false;}this.releasePointer?.();this.joy={x:0,y:0};this.keys.clear();this.filtered={x:0,y:0};this.updateKnob?.();}
  resetOrientation(){this.clear();this.raw=null;this.neutral=null;this.source=null;this.lastValid=-Infinity;this.lastMotion=-Infinity;}
  setMode(mode){
    this.clear();this.mode=mode;this.modeSince=this.now();this.modeMessage=mode==='tilt'?'傾斜控制':'手動搖桿';
    if(mode==='tilt')this.neutral=this.raw&&this.now()-this.lastValid<=TIMING.sensorTimeout?{...this.raw}:null;
  }
  requestTilt(){
    const revision=++this.modeRevision;this.tiltPending=true;this.modeMessage='等待動作與方向權限…';
    // Start permission requests synchronously; late results must not undo manual input.
    return requestPermissions(this.host,(key,state,error)=>{if(revision===this.modeRevision)this.permission[key]={state,error};}).then(results=>{
      if(revision!==this.modeRevision)return false;
      if(results.length&&!results.some(r=>r.status==='fulfilled'&&r.value==='granted')){
        this.setMode('joystick');this.modeMessage='感測權限未允許，請查看感測狀態';return false;
      }
      this.setMode('tilt');return true;
    });
  }
  gravity(now=this.now()){
    if(this.tiltPending)return {x:0,y:0};
    if(this.mode==='tilt'){
      if(now-Math.max(this.lastValid,this.modeSince)>TIMING.sensorTimeout){this.setMode('joystick');this.modeMessage='感測器無資料，已切換搖桿';}
      else return {x:Math.abs(this.filtered.x)<.055?0:this.filtered.x,y:Math.abs(this.filtered.y)<.055?0:this.filtered.y};
    }
    if(this.keys.size)return clampVector({x:Number(this.keys.has('ArrowRight')||this.keys.has('d'))-Number(this.keys.has('ArrowLeft')||this.keys.has('a')),
      y:Number(this.keys.has('ArrowDown')||this.keys.has('s'))-Number(this.keys.has('ArrowUp')||this.keys.has('w'))});
    return this.joy;
  }
  attach(joystick){
    const signal=(this.abort=new AbortController()).signal;
    this.host.addEventListener('devicemotion',e=>this.motion(e),{signal});this.host.addEventListener('deviceorientation',e=>this.orientation(e),{signal});
    const movement=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','w','s','d'];
    this.host.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(movement.includes(key)&&!e.target.closest?.('dialog,input,textarea,[contenteditable]')){e.preventDefault();if(this.mode!=='joystick'||this.tiltPending)this.setMode('joystick');this.keys.add(key);}},{signal});
    this.host.addEventListener('keyup',e=>this.keys.delete(e.key.length===1?e.key.toLowerCase():e.key),{signal});
    this.host.addEventListener('blur',()=>this.clear({cancelRequest:false}),{signal});
    let pointer=null;const knob=joystick.querySelector('.joystick-knob');
    this.releasePointer=()=>{const held=pointer;pointer=null;if(held!==null&&joystick.hasPointerCapture?.(held))joystick.releasePointerCapture(held);};
    this.updateKnob=()=>{knob.style.transform=`translate(${this.joy.x*28}px,${this.joy.y*28}px)`;};
    const move=e=>{if(e.pointerId!==pointer)return;const rect=joystick.getBoundingClientRect();this.joy=clampVector({x:(e.clientX-rect.left-rect.width/2)/36,y:(e.clientY-rect.top-rect.height/2)/36});this.updateKnob();};
    joystick.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();this.setMode('joystick');pointer=e.pointerId;joystick.setPointerCapture(pointer);move(e);},{signal});
    joystick.addEventListener('pointermove',move,{signal});
    const end=e=>{if(e.pointerId===pointer){pointer=null;this.joy={x:0,y:0};this.updateKnob();}};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,end,{signal});
  }
  destroy(){this.abort?.abort();this.clear();}
}
