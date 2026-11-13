import {setText,progressMessage,summaryMessage,sourceMessage} from './ui.js';
import {LEVELS} from './config.js';
import {loadDataset} from './idioms.js';
import {Game,FixedClock} from './state.js';
import {mountKeyboard,validName} from './keyboard.js';
import {InputController} from './input.js';
import {requestStartAccess,lockLandscape} from './startup.js';
import {Renderer} from './renderer.js';
const $=id=>document.getElementById(id),preview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1';
let game=null,dataset=null,name='',busy=false,lastIdiom=null,lastIndex=-1,lastStatus='',lastFeedback=0,permissionInterrupted=false,keyboardReady=false,loading=false;
const clock=new FixedClock(),input=new InputController(),renderer=new Renderer($('canvas'));input.attach($('joystick'));
const landscape=()=>matchMedia('(orientation:landscape)').matches;
if(preview)setText($('environment'),'本地開發預覽 · 題庫待核校 · 不可發布');
for(const level of LEVELS){const el=document.createElement('span');el.style.setProperty('--level',level.color);el.textContent=`${level.level} ${level.name} · ${level.durationSeconds}秒 / ${level.idiomsRequired}題`;$('levels').append(el);}
function enableStart(){$('start').disabled=!dataset||!validName(name)||busy;$('retry-data').disabled=loading||busy;}
async function load(){
 if(loading||busy)return;loading=true;dataset=null;enableStart();setText($('data-status'),'載入題庫與鍵盤中…');
 try{
  if(!keyboardReady){
   let presets;
   try{const response=await fetch('./data/keyboard-presets.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();presets=await response.json();}
   catch{throw new Error('鍵盤設定載入失敗，請按「重新載入」再試。');}
   mountKeyboard($('keyboard'),presets,value=>{name=value;enableStart();});keyboardReady=true;
  }
  dataset=await loadDataset(preview);setText($('data-status'),preview?`${dataset.count}條待審資料 · 僅本地驗證玩法`:'題庫已就緒');
 }catch(error){setText($('data-status'),error.message);}
 finally{loading=false;$('retry-data').disabled=false;enableStart();}
}
$('retry-data').addEventListener('click',load);load();
function pause(reason){permissionInterrupted=busy||permissionInterrupted;game?.pause(reason);input.clear();clock.reset();}
function showDialog(title,text,action=null){pause('確認操作');$('source-links').hidden=true;setText($('dialog-title'),title);setText($('dialog-text'),text);$('confirm').onclick=()=>{$('dialog').close();action?.();clock.reset();};$('cancel').hidden=!action;$('dialog').showModal();}
$('cancel').onclick=()=>$('dialog').close();
$('about').onclick=()=>{showDialog('玩法與資料來源','依序碰撞第1至第4字，只有「我」直接撞中才算完成。\nP 暫停；R 全部重來；A 每關最多重試3次。\n傾斜控制不可用時，可隨時拖曳左下搖桿。\nSafari 無法全螢幕時可使用「加入主畫面」。\n\n'+sourceMessage(dataset)+'\n'+(preview?'目前使用待審原始資料，不能作為正式教學或發布驗收。':''));$('source-links').hidden=!dataset?.items.some(item=>item.source==='moe-idioms-public-dictionary');};
$('start').onclick=async()=>{
 if(busy||!dataset||!validName(name))return;busy=true;permissionInterrupted=false;enableStart();
 const playerName=name.trim(),gameItems=dataset.items;
 const access=requestStartAccess();
 try{await access;
   lockLandscape();
   game=new Game(gameItems);game.start(playerName);input.setMode('tilt');$('home').hidden=true;$('game').hidden=false;renderer.resize();
   if(permissionInterrupted||document.hidden||!landscape())game.pause('準備完成，按繼續開始');
 }catch(error){setText($('data-status'),`無法開始：${error.message}`);}finally{busy=false;enableStart();clock.reset();}
};
$('pause').onclick=()=>{if(game?.status==='PAUSED')game.resume({visible:!document.hidden,landscape:landscape()});else pause('休息一下，準備好再繼續');clock.reset();input.clear();};
$('restart').onclick=()=>showDialog('全部重新開始？','將返回第1關，重新抽取19條成語。玩家名稱會保留。',()=>game.restart(true));
$('retry').onclick=()=>{if(!game||game.attemptsUsed>=3)return;showDialog('重新挑戰本關？',`本關時間與進度重設，題組及配置不變。還可使用 ${3-game.attemptsUsed} 次。`,()=>game.retry(true));};
$('continue').onclick=()=>{if(game.status==='PAUSED')game.resume({visible:!document.hidden,landscape:landscape()});else if(game.status==='LEVEL_CLEAR')game.nextLevel();else if(game.status==='LEVEL_FAILED')$('retry').click();else if(game.status==='GAME_CLEAR')$('restart').click();clock.reset();input.clear();};
$('mode').onclick=()=>{if(input.mode==='tilt'||input.tiltPending){input.setMode('joystick');return;}pause('切換控制方式後，按繼續');input.requestTilt();};
$('calibrate').onclick=()=>{pause('校正後，按繼續');const ok=input.calibrate();if(!ok){input.setMode('joystick');game.pauseReason='尚無有效感測器資料，請使用搖桿';}else game.pauseReason='水平已校正，按繼續';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('已切到背景，按繼續恢復');});
window.addEventListener('pagehide',()=>pause('已離開頁面'));window.addEventListener('blur',()=>pause('已離開遊戲視窗'));
matchMedia('(orientation:landscape)').addEventListener('change',()=>{pause('方向已變更，按繼續恢復');input.resetOrientation();});
screen.orientation?.addEventListener('change',()=>{pause('握持方向已變更，請重新校正');input.resetOrientation();});
function drawUI(){if(!game)return;if(document.documentElement.style.getPropertyValue('--accent')!==game.level.color)document.documentElement.style.setProperty('--accent',game.level.color);
 setText($('player-label'),game.name);setText($('level-label'),`第${game.level.level}關 · ${game.level.name}`);setText($('question-label'),`成語 ${game.idiomIndex+1}/${game.level.idiomsRequired}`);
 setText($('timer'),`${Math.ceil(game.remaining)} 秒`);setText($('retry'),`A × ${3-game.attemptsUsed}`);$('retry').disabled=game.attemptsUsed>=3||['LEVEL_CLEAR','GAME_CLEAR'].includes(game.status);
 setText($('pause'),game.status==='PAUSED'?'P 繼續':'P 暫停');setText($('control-mode'),input.modeMessage);
 if(lastIdiom!==game.idiom||lastIndex!==game.nextIndex){lastIdiom=game.idiom;lastIndex=game.nextIndex;$('cards').replaceChildren();for(const item of game.view()){
   const el=document.createElement('div');el.className=item.status;const letter=document.createElement('strong');letter.textContent=item.char;
   const detail=document.createElement('small');detail.textContent=`${item.charIndex+1} · ${item.zhuyin}　${{COMPLETED:'✓ 已完成',CURRENT:'★ 下一目標',PENDING:'○ 未完成'}[item.status]}`;el.append(letter,detail);$('cards').append(el);
 }setText($('definition'),game.idiom.definition);}
 setText($('feedback'),progressMessage(game));
 const overlay=['READY','PAUSED','LEVEL_CLEAR','LEVEL_FAILED','GAME_CLEAR'].includes(game.status);$('overlay').hidden=!overlay;
 $('continue').hidden=game.status==='READY';
 if(game.status==='READY'){setText($('overlay-title'),String(Math.ceil(game.readyRemaining)));setText($('overlay-text'),'準備出發 · 依序碰撞四個目標字');}
 else if(game.status==='PAUSED'){setText($('overlay-title'),'遊戲已暫停');setText($('overlay-text'),game.pauseReason);setText($('continue'),'繼續');}
 else if(game.status==='LEVEL_CLEAR'){setText($('overlay-title'),'本關完成！');setText($('overlay-text'),`剩餘 ${Math.ceil(game.remaining)} 秒 · 失誤 ${game.mistakes} 次`);setText($('continue'),'前往下一關 →');}
 else if(game.status==='LEVEL_FAILED'){setText($('overlay-title'),'時間到，再試一次');setText($('overlay-text'),`已完成 ${game.completed.length}/${game.level.idiomsRequired} 條。也可以使用 R 全部重來。`);setText($('continue'),'A 重試本關');$('continue').disabled=game.attemptsUsed>=3;}
 else if(game.status==='GAME_CLEAR'){setText($('overlay-title'),`${game.name}，五關全通！`);setText($('overlay-text'),summaryMessage(game));setText($('continue'),'再挑戰一次');}
 if(game.status!=='LEVEL_FAILED')$('continue').disabled=false;
 if(game.feedback&&game.feedback.serial!==lastFeedback){lastFeedback=game.feedback.serial;if($('sound').checked){try{const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=game.feedback.type==='correct'?660:220;gain.gain.value=.04;osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.09);osc.onended=()=>audio.close().catch(()=>{});}catch{}}}
 if(lastStatus!==game.status){lastStatus=game.status;clock.reset();}
}
let previous=performance.now();function frame(now){const delta=(now-previous)/1000;previous=now;const gravity=input.gravity(now);if(game&&!document.hidden&&landscape())clock.advance(delta,dt=>game.tick(dt,gravity));drawUI();if(game)renderer.draw(game);requestAnimationFrame(frame);}requestAnimationFrame(frame);
