import {DAYLIGHT} from './daylight.js?v=20261114.8';
import {graphemes} from './keyboard.js?v=20261114.5';
import {PHYSICS as P} from './config.js';
export class Renderer{
 constructor(canvas,host=globalThis){this.canvas=canvas;this.host=host;this.ctx=canvas.getContext('2d');if(host.Image){this.landscape=new host.Image();this.daylight=new host.Image();this.daylight.src=new URL('../art/guanyin-reef-daylight.png',import.meta.url).href;this.landscape.src=new URL('../art/guanyin-reef-sunset.png',import.meta.url).href;}this.observer=new host.ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(2,this.host.devicePixelRatio||1),width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);if(this.canvas.width!==width)this.canvas.width=width;if(this.canvas.height!==height)this.canvas.height=height;}
 destroy(){this.observer.disconnect();}
 draw(game,now=0){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.clearRect(0,0,w,h);if(!game.world)return;const theme=DAYLIGHT[game.levelIndex??0];const scale=Math.min(w/P.width,h/P.height);c.save();c.translate((w-P.width*scale)/2,(h-P.height*scale)/2);c.scale(scale,scale);c.fillStyle=theme.color;c.fillRect(0,0,P.width,P.height);c.fillStyle=theme.board;c.globalAlpha=.3;c.fillRect(0,0,P.width,P.height);c.globalAlpha=1;const art=theme.sun?this.daylight:this.landscape;
 if(art?.complete&&art.naturalWidth){c.globalAlpha=.72;c.drawImage(art,0,0,P.width,P.height);c.globalAlpha=1;}
 const t=this.host.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:now/1000;
 if(theme.sun){const [x,y]=theme.sun;c.fillStyle=theme.sunColor;c.shadowColor=theme.sunColor;c.shadowBlur=25;c.beginPath();c.arc(x,y,30,0,Math.PI*2);c.fill();c.shadowBlur=0;}
 // Subtle traveling wavelets and bubbles keep the board alive without hiding letters.
 c.strokeStyle='#ffffff80';c.lineWidth=2;
 for(let i=0;i<16;i++){const x=(i*89+t*16)%P.width,y=170+(i%5)*100+Math.sin(t+i)*9;c.beginPath();c.arc(x,y,12+i%3*7,.15,2.7);c.stroke();}
 c.strokeStyle='#ffffff30';c.lineWidth=2;for(let x=40;x<P.width;x+=80)for(let y=40;y<P.height;y+=80){c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.stroke();}c.strokeStyle=theme.color;c.lineWidth=5;c.strokeRect(4,4,P.width-8,P.height-8);
 const sheen=c.createLinearGradient?.(0,0,P.width,P.height);
 if(sheen){sheen.addColorStop(0,'#ffffff38');sheen.addColorStop(.35,'#ffffff04');sheen.addColorStop(.65,'#ffffff18');sheen.addColorStop(1,'#001a3544');c.fillStyle=sheen;c.fillRect(0,0,P.width,P.height);}
 c.strokeStyle='#ffffff99';c.lineWidth=3;c.strokeRect(9,9,P.width-18,P.height-18);
 for(const b of game.world.bodies){if(!b.active)continue;
 if(!b.inverseMass){c.save();c.translate(b.x,b.y+13);c.scale(1,.72);c.beginPath();c.arc(0,0,b.radius+5,0,Math.PI*2);c.fillStyle='#183650';c.shadowColor='#001c45aa';c.shadowBlur=14;c.shadowOffsetY=9;c.fill();c.strokeStyle='#bdeeff';c.lineWidth=3;c.stroke();c.restore();}
const player=b.kind==='player',target=b.kind.startsWith('target'),current=target&&b.charIndex===game.nextIndex;c.beginPath();c.arc(b.x,b.y,b.radius,0,Math.PI*2);c.fillStyle=player?'#f552ff':target?'#fffbe8':'#123e85';if(b.flash&&!player)c.fillStyle='#df9d7b';
 const base=c.fillStyle,glass=c.createRadialGradient?.(b.x-b.radius*.35,b.y-b.radius*.45,2,b.x,b.y,b.radius);
 if(glass){glass.addColorStop(0,player?'#ffceff':target?'#ffffff':'#80cbff');glass.addColorStop(.35,base);glass.addColorStop(.72,base);glass.addColorStop(1,player?'#9407bc':target?'#74aebc':'#031e52');c.fillStyle=glass;}
 c.shadowColor='#0005';c.shadowBlur=10;c.shadowOffsetY=5;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle=player?'#fff3ff':current?'#f4d26b':target?'#a6ba91':'#7c9a82';c.lineWidth=current?6:3;c.stroke();if(current){c.beginPath();c.arc(b.x,b.y,b.radius+10,0,Math.PI*2);c.strokeStyle='#f4d26b77';c.lineWidth=2;c.stroke();}c.save();c.beginPath();c.arc(b.x-b.radius*.32,b.y-b.radius*.48,b.radius*.2,0,Math.PI*2);c.fillStyle='#ffffffa8';c.fill();c.beginPath();c.arc(b.x,b.y,b.radius-6,.2,1.15);c.strokeStyle='#ffffff77';c.lineWidth=2;c.stroke();c.restore();
 c.fillStyle=player?'#240c31':target?'#193d33':'#ffffff';c.font='bold 30px system-ui';c.textAlign='center';c.textBaseline='middle';const name=player?graphemes(game.name||b.char):[];
 if(player&&name.length===2)c.font='bold 20px system-ui';
 c.fillText(player?(name.length<=2?name.join(''):name[0]):b.char,b.x,b.y,b.radius*1.65);if(target){c.beginPath();c.arc(b.x+27,b.y-28,13,0,Math.PI*2);c.fillStyle='#e2c36b';c.fill();c.fillStyle='#173f33';c.font='bold 18px system-ui';c.fillText(String(b.charIndex+1),b.x+27,b.y-28);}if(!b.inverseMass){c.fillStyle='#183c33';c.fillRect(b.x-9,b.y+b.radius-7,18,5);}}
 for(const effect of game.effects){c.globalAlpha=effect.life/.5;c.strokeStyle='#ffe289';c.lineWidth=3;c.beginPath();c.arc(effect.x,effect.y,36+(1-effect.life/.5)*38,0,Math.PI*2);c.stroke();}c.restore();}
}
