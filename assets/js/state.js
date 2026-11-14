import { LEVELS,PHYSICS as P,TIMING,mixSeed,newSeed } from './config.js?v=20261114.11';
import { choose19 } from './idioms.js';
import { createWorld,step } from './physics.js?v=20261114.8';
import { classifyContact,progressView } from './collision.js';
const WRONG_HIT_PENALTY_SECONDS = 5;
export class Game {
  constructor(items){this.items=items;this.status='HOME';this.revision=0;this.feedback=null;this.effects=[];}
  get level(){return LEVELS[this.levelIndex];}
  get idiom(){return this.groups?.[this.levelIndex]?.[this.idiomIndex];}
  start(name,seed=newSeed()){
    this.name=name;this.seed=seed;this.groups=choose19(this.items,seed);this.levelIndex=0;
    this.summaries=[];this.retryHistory=[];this.setupLevel();
  }
  setupLevel(){this.attemptsUsed=0;this.resetLevel();}
  resetLevel(){this.remaining=this.level.durationSeconds;this.idiomIndex=0;this.mistakes=0;this.completed=[];this.resumeState=null;
    this.setupIdiom();this.readyRemaining=TIMING.ready;this.status='READY';this.revision++;}
  setupIdiom(){this.nextIndex=0;this.world=createWorld(this.level,this.idiom,mixSeed(mixSeed(this.seed,this.levelIndex),this.idiomIndex));
    this.feedback=null;this.effects=[];this.clearRemaining=0;this.revision++;}
  pause(reason='遊戲已暫停'){
    if(!['READY','PLAYING','IDIOM_CLEAR'].includes(this.status))return false;
    this.resumeState=this.status;this.status='PAUSED';this.pauseReason=reason;this.revision++;return true;
  }
  resume({visible=true,landscape=true}={}){
    if(this.status!=='PAUSED'||!visible||!landscape)return false;
    this.status=this.resumeState;this.resumeState=null;this.revision++;return true;
  }
  retry(confirmed){
    if(!confirmed||this.attemptsUsed>=3||!['PLAYING','READY','PAUSED','IDIOM_CLEAR','LEVEL_FAILED'].includes(this.status))return false;
    this.retryHistory.push({level:this.level.level,attempt:this.attemptsUsed+1,remaining:this.remaining,mistakes:this.mistakes});
    this.attemptsUsed++;this.resetLevel();return true;
  }
  restart(confirmed,seed=newSeed()){if(!confirmed||!this.groups)return false;this.start(this.name,seed===this.seed?(seed+1)>>>0:seed);return true;}
  nextLevel(){if(this.status!=='LEVEL_CLEAR')return false;this.levelIndex++;this.setupLevel();return true;}
  applyContacts(contacts){
    if(this.status!=='PLAYING')return;
    let collected=false;
    for(const event of contacts){
      const result=classifyContact(this.world,event,this.nextIndex);if(!result)continue;
      if(result.correct){
        if(collected)continue;collected=true;result.body.active=false;this.nextIndex++;
        this.effects.push({x:result.body.x,y:result.body.y,char:result.body.char,life:.5});
        this.feedback={type:'correct',text:`✓ 已碰撞「${result.body.char}」`,serial:++this.revision,life:1};
        if(this.nextIndex===4){this.status='IDIOM_CLEAR';this.clearRemaining=TIMING.idiomClear;break;}
      }else{
        this.mistakes++;result.body.flash=.35;
        this.remaining=Math.max(0,this.remaining-WRONG_HIT_PENALTY_SECONDS);
        this.feedback={type:'wrong',text:`扣 ${WRONG_HIT_PENALTY_SECONDS} 秒 · 請先碰第 ${this.nextIndex+1} 字「${Array.from(this.idiom.idiom)[this.nextIndex]}」`,serial:++this.revision,life:1.1};
      }
    }
  }
  tick(dt,gravity={x:0,y:0}){
    if(this.status==='PLAYING'||this.status==='IDIOM_CLEAR'){
      for(const body of this.world.bodies)body.flash=Math.max(0,(body.flash||0)-dt);
      this.effects=this.effects.map(x=>({...x,life:x.life-dt})).filter(x=>x.life>0);
      if(this.feedback)this.feedback.life=Math.max(0,this.feedback.life-dt);
    }
    if(this.status==='READY'){this.readyRemaining=Math.max(0,this.readyRemaining-dt);if(this.readyRemaining<=1e-8){this.status='PLAYING';this.revision++;}return;}
    if(this.status==='IDIOM_CLEAR'){
      this.clearRemaining=Math.max(0,this.clearRemaining-dt);
      if(this.clearRemaining<=1e-8){
        this.completed.push(this.idiom.id);
        if(this.completed.length===this.level.idiomsRequired){
          this.summaries.push({level:this.level.level,remaining:this.remaining,mistakes:this.mistakes,attempts:this.attemptsUsed,idioms:this.groups[this.levelIndex].map(x=>x.idiom)});
          this.status=this.levelIndex===4?'GAME_CLEAR':'LEVEL_CLEAR';this.revision++;
        }else{this.idiomIndex++;this.setupIdiom();this.status='PLAYING';}
      }
      return;
    }
    if(this.status!=='PLAYING')return;
    this.applyContacts(step(this.world,dt,gravity));
    this.remaining=Math.max(0,this.remaining-dt);
    const levelComplete=this.nextIndex===4&&this.idiomIndex+1===this.level.idiomsRequired;
    if(this.remaining<=1e-8&&!levelComplete){this.remaining=0;this.status='LEVEL_FAILED';this.revision++;}
  }
  view(){return this.idiom?progressView(this.idiom,this.nextIndex):[];}
}
export class FixedClock{
  constructor(){this.accumulator=0;}
  reset(){this.accumulator=0;}
  advance(delta,update){
    this.accumulator+=Math.max(0,Math.min(P.maxFrame,Number.isFinite(delta)?delta:0));let steps=0;
    while(this.accumulator+1e-9>=P.dt&&steps<P.maxSteps){update(P.dt);this.accumulator-=P.dt;steps++;}
    if(this.accumulator<0)this.accumulator=0;return steps;
  }
}
