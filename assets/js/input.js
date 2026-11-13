import {TIMING} from './config.js';
export function screenVector(x,y,angle){const r=angle*Math.PI/180;return {x:x*Math.cos(r)+y*Math.sin(r),y:-x*Math.sin(r)+y*Math.cos(r)};}
export function clampVector(v){const length=Math.max(1,Math.hypot(v.x,v.y));return {x:v.x/length,y:v.y/length};}
// Must be called directly in the user gesture, before the caller's first await.
export function requestPermissions(host=globalThis){
  const pending=[];
  for(const key of ['DeviceOrientationEvent','DeviceMotionEvent']){
    const api=host[key];if(typeof api?.requestPermission==='function'){
      try{pending.push(Promise.resolve(api.requestPermission()));}catch(error){pending.push(Promise.reject(error));}
    }
  }
  return Promise.allSettled(pending);
}
export class InputController{
  constructor(host=globalThis){
    this.host=host;this.mode='joystick';this.modeRevision=0;this.tiltPending=false;this.joy={x:0,y:0};this.keys=new Set();this.raw=null;this.neutral=null;this.filtered={x:0,y:0};this.lastValid=-Infinity;this.lastMotion=-Infinity;this.source=null;this.modeMessage='手動搖桿';
  }
  now(){return this.host.performance?.now()??Date.now();}
  angle(){return this.host.screen?.orientation?.angle??this.host.orientation??0;}
  accept(x,y,source,now=this.now()){
    if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    const raw=screenVector(x,y,this.angle());
    if(this.source!==source){this.source=source;this.neutral=null;this.filtered={x:0,y:0};}
    this.raw=raw;this.lastValid=now;if(!this.neutral)this.neutral={...raw};
    const v=clampVector({x:raw.x-this.neutral.x,y:raw.y-this.neutral.y});
    this.filtered.x+=.22*(v.x-this.filtered.x);this.filtered.y+=.22*(v.y-this.filtered.y);return true;
  }
  motion(event){const g=event.accelerationIncludingGravity;if(!g||typeof g.x!=='number'||typeof g.y!=='number')return;
    if(this.accept(-g.x/4,g.y/4,'motion'))this.lastMotion=this.now();}
  orientation(event){if(this.now()-this.lastMotion<400||typeof event.gamma!=='number'||typeof event.beta!=='number')return;
    this.accept(event.gamma/25,event.beta/25,'orientation');}
  calibrate(){if(!this.raw||this.now()-this.lastValid>TIMING.sensorTimeout)return false;this.neutral={...this.raw};this.filtered={x:0,y:0};return true;}
  clear(){this.modeRevision++;this.tiltPending=false;this.releasePointer?.();this.joy={x:0,y:0};this.keys.clear();this.filtered={x:0,y:0};this.updateKnob?.();}
  resetOrientation(){this.clear();this.raw=null;this.neutral=null;this.source=null;this.lastValid=-Infinity;this.lastMotion=-Infinity;}
  setMode(mode){
    this.clear();this.mode=mode;this.modeSince=this.now();this.modeMessage=mode==='tilt'?'傾斜控制':'手動搖桿';
    if(mode==='tilt')this.neutral=this.raw&&this.now()-this.lastValid<=TIMING.sensorTimeout?{...this.raw}:null;
  }
  requestTilt(){
    const revision=++this.modeRevision;this.tiltPending=true;
    // Start permission requests synchronously; late results must not undo manual input.
    return requestPermissions(this.host).then(()=>{
      if(revision!==this.modeRevision)return false;
      this.setMode('tilt');return true;
    });
  }
  gravity(now=this.now()){
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
    this.host.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(movement.includes(key)&&!e.target.closest?.('dialog')){e.preventDefault();if(this.mode!=='joystick'||this.tiltPending)this.setMode('joystick');this.keys.add(key);}},{signal});
    this.host.addEventListener('keyup',e=>this.keys.delete(e.key.length===1?e.key.toLowerCase():e.key),{signal});
    this.host.addEventListener('blur',()=>this.clear(),{signal});
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
