import { PHYSICS as P,seededRandom } from './config.js';
export function body(id,kind,x,y,extra={}) {
  const fixed=kind.endsWith('Post');
  return {id,kind,x,y,vx:0,vy:0,radius:kind==='player'?P.playerRadius:P.radius,mass:1,inverseMass:fixed?0:1,restitution:P.restitution,active:true,...extra};
}
export function createWorld(level,idiom,seed){
  const random=seededRandom(seed),bodies=[body('player','player',P.width/2,P.height-80,{char:'我'})];
  const chars=Array.from(idiom.idiom), distractors=Array.from('天地山水風雲日月星海花鳥森林春夏秋冬光明心手').filter(c=>!chars.includes(c));
  for(let i=distractors.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[distractors[i],distractors[j]]=[distractors[j],distractors[i]];}
  const kinds=[...Array(level.targetPosts).fill('targetPost'),...Array(level.targetBalls).fill('targetBall'),...Array(level.distractorPosts).fill('distractorPost'),...Array(level.distractorBalls).fill('distractorBall')];
  const safe=(x,y,r)=>bodies.every(b=>Math.hypot(x-b.x,y-b.y)>=r+b.radius+P.spawnGap);
  for(const [index,kind] of kinds.entries()){
    let pos=null;
    for(let n=0;n<150;n++){const x=75+random()*(P.width-150),y=75+random()*(P.height-220);if(safe(x,y,P.radius)){pos={x,y};break;}}
    if(!pos)for(let y=85;y<P.height-100&&!pos;y+=120)for(let x=85;x<P.width-60;x+=120)if(safe(x,y,P.radius)){pos={x,y};break;}
    if(!pos)throw new Error('無法建立安全的場地配置');
    const target=index<4, item=body(`object-${index}`,kind,pos.x,pos.y,{char:target?chars[index]:distractors[index-4],...(target?{charIndex:index}:{})});
    if(item.inverseMass){item.vx=(random()-.5)*70;item.vy=(random()-.5)*70;}
    bodies.push(item);
  }
  return {bodies,width:P.width,height:P.height,stepId:0,lastContacts:new Map()};
}
export function resolvePair(a,b){
  let dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),r=a.radius+b.radius;
  if(distance>r+0.02)return false;
  const inv=a.inverseMass+b.inverseMass;if(!inv)return true;
  const nx=distance>1e-9?dx/distance:1,ny=distance>1e-9?dy/distance:0;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(relative<0){const impulse=-(1+Math.min(a.restitution,b.restitution))*relative/inv;
    a.vx-=impulse*nx*a.inverseMass;a.vy-=impulse*ny*a.inverseMass;b.vx+=impulse*nx*b.inverseMass;b.vy+=impulse*ny*b.inverseMass;}
  const correction=Math.max(0,r-distance+0.005)/inv;
  a.x-=correction*nx*a.inverseMass;a.y-=correction*ny*a.inverseMass;b.x+=correction*nx*b.inverseMass;b.y+=correction*ny*b.inverseMass;
  return true;
}
export function wall(b,width,height){
  if(!b.inverseMass)return;
  const r=b.radius;
  if(b.x<r){b.x=r;b.vx=Math.abs(b.vx)*b.restitution;}else if(b.x>width-r){b.x=width-r;b.vx=-Math.abs(b.vx)*b.restitution;}
  if(b.y<r){b.y=r;b.vy=Math.abs(b.vy)*b.restitution;}else if(b.y>height-r){b.y=height-r;b.vy=-Math.abs(b.vy)*b.restitution;}
}
export function step(world,dt,gravity){
  world.stepId++;const contacts=[],active=world.bodies.filter(x=>x.active);
  const gx=Number.isFinite(gravity.x)?gravity.x:0,gy=Number.isFinite(gravity.y)?gravity.y:0;
  const norm=Math.max(1,Math.hypot(gx,gy));
  for(const b of active){
    if(!b.inverseMass){b.vx=0;b.vy=0;continue;}
    b.vx=(b.vx+gx/norm*P.acceleration*dt)*Math.exp(-P.damping*dt);b.vy=(b.vy+gy/norm*P.acceleration*dt)*Math.exp(-P.damping*dt);
    const speed=Math.hypot(b.vx,b.vy);if(speed>P.maxSpeed){b.vx*=P.maxSpeed/speed;b.vy*=P.maxSpeed/speed;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;wall(b,world.width,world.height);
  }
  const seen=new Set();
  for(let iteration=0;iteration<3;iteration++){
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
      const a=active[i],b=active[j],key=[a.id,b.id].sort().join('|');
      if(resolvePair(a,b)){
        if(!seen.has(key)){
          const last=world.lastContacts.get(key);
          if(last===undefined||world.stepId-last>P.contactCooldown)contacts.push({a:a.id,b:b.id,stepId:world.stepId});
          world.lastContacts.set(key,world.stepId);seen.add(key);
        }
      }
    }
    for(const b of active)wall(b,world.width,world.height);
  }
  return contacts;
}
