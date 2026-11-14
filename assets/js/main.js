import {setText,progressMessage,summaryMessage,sourceMessage,resultStats,controlLabel} from './ui.js?v=20261114.9';
import {SITE_MODE} from './site-config.js';
import {LEVELS} from './config.js?v=20261114.11';
import {loadDataset} from './idioms.js';
import {Game,FixedClock} from './state.js?v=20261114.11';
import {mountKeyboard,validName} from './keyboard.js?v=20261114.10';
import {InputController} from './input.js?v=20261114.5';
import {requestStartAccess,lockLandscape} from './startup.js?v=20261114.5';
import {Renderer} from './renderer.js?v=20261114.8';
import {DAYLIGHT,gateProgress} from './daylight.js?v=20261114.8';
const $=id=>document.getElementById(id),tabletTest=SITE_MODE==='tablet-test',preview=tabletTest||(['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1');
let game=null,dataset=null,name='',busy=false,lastIdiom=null,lastIndex=-1,lastStatus='',lastFeedback=0,permissionInterrupted=false,keyboardReady=false,loading=false;
const clock=new FixedClock(),input=new InputController(),renderer=new Renderer($('canvas'));input.attach($('joystick'));
const landscape=()=>matchMedia('(orientation:landscape)').matches;
for(const level of LEVELS){const el=document.createElement('span');const theme=DAYLIGHT[level.level-1];el.style.setProperty('--level',theme.color);el.textContent=`${level.level} ${theme.name} · ${level.durationSeconds}秒 / ${level.idiomsRequired}題`;$('levels').append(el);}
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
  dataset=await loadDataset(preview,{tabletTest});setText($('data-status'),'題庫已就緒');
 }catch(error){setText($('data-status'),error.message);}
 finally{loading=false;$('retry-data').disabled=false;enableStart();}
}
$('retry-data').addEventListener('click',load);load();
function pause(reason){permissionInterrupted=busy||permissionInterrupted;game?.pause(reason);input.clear({cancelRequest:false});clock.reset();}
function showDialog(title,text,action=null){pause('確認操作');$('source-links').hidden=true;setText($('dialog-title'),title);setText($('dialog-text'),text);$('confirm').onclick=()=>{$('dialog').close();action?.();clock.reset();};$('cancel').hidden=!action;$('dialog').showModal();}
$('cancel').onclick=()=>$('dialog').close();
$('about').onclick=()=>{showDialog('玩法與資料來源','依序碰撞第1至第4字，只有玩家球直接撞中才算完成。撞到未輪到的目標字或干擾字，每次扣 5 秒。\nP 暫停；R 全部重來；A 每關最多重試3次。\n傾斜控制不可用時，可隨時拖曳左下搖桿。\nSafari 無法全螢幕時可使用「加入主畫面」。\n\n'+sourceMessage(dataset));$('source-links').hidden=!dataset?.items.some(item=>item.source==='moe-idioms-public-dictionary');};
$('start').onclick=async()=>{
 if(busy||!dataset||!validName(name))return;busy=true;permissionInterrupted=false;enableStart();
 const playerName=name.trim(),gameItems=dataset.items;
 $('player-name').blur();
 const access=requestStartAccess(globalThis,2200,()=>input.requestTilt());
 try{await access;
   lockLandscape();
   game=new Game(gameItems);game.start(playerName);$('home').hidden=true;$('game').hidden=false;$('home-button').hidden=false;renderer.resize();
   if(permissionInterrupted||document.hidden||!landscape())game.pause('準備完成，按繼續開始');
 }catch(error){setText($('data-status'),`無法開始：${error.message}`);}finally{busy=false;enableStart();clock.reset();}
};
$('pause').onclick=()=>{if(game?.status==='PAUSED')game.resume({visible:!document.hidden,landscape:landscape()});else pause('休息一下，準備好再繼續');clock.reset();input.clear();};
$('restart').onclick=()=>showDialog('全部重新開始？','將返回第1關，重新抽取19條成語。玩家名稱會保留。',()=>game.restart(true));
$('retry').onclick=()=>{if(!game||game.attemptsUsed>=3)return;showDialog('重新挑戰本關？',`本關時間與進度重設，題組及配置不變。還可使用 ${3-game.attemptsUsed} 次。`,()=>game.retry(true));};
$('continue').onclick=()=>{if(game.status==='PAUSED')game.resume({visible:!document.hidden,landscape:landscape()});else if(game.status==='LEVEL_CLEAR')game.nextLevel();else if(game.status==='LEVEL_FAILED')$('retry').click();else if(game.status==='GAME_CLEAR')$('restart').click();clock.reset();input.clear();};
function returnHome(){
 input.clear();input.setMode('joystick');game=null;clock.reset();lastIdiom=null;lastIndex=-1;lastStatus='';lastFeedback=0;
 $('game').hidden=true;$('home').hidden=false;$('home-button').hidden=true;
 document.documentElement.style.setProperty('--accent','#0075d9');enableStart();$('start').focus();
}
$('result-home').onclick=returnHome;
$('result-restart').onclick=()=>{game.restart(true);clock.reset();input.clear();};
$('home-button').onclick=()=>{
 if(['LEVEL_FAILED','GAME_CLEAR','LEVEL_CLEAR'].includes(game?.status))returnHome();
 else showDialog('回到首頁？','本次挑戰進度將結束，玩家名稱會保留。',returnHome);
};
function openGuide(){pause('操作說明已關閉，準備好後按繼續');$('guide-status').textContent=controlLabel(input);$('control-guide').showModal();}
$('control-help').onclick=openGuide;
$('guide-close').onclick=()=>$('control-guide').close();
$('grant-sensors').onclick=()=>{
 setText($('guide-status'),'正在請求感測器授權，請查看瀏覽器提示…');
 input.requestTilt().then(ok=>setText($('guide-status'),ok?'已開啟傾斜模式，請保持平板穩定，再按「以目前姿勢校正」。':'未能開啟感測器，請使用搖桿。若曾拒絕授權，請重新載入網頁再試。'));
};
function calibrateFromGuide(){
 const ok=input.calibrate();
 setText($('guide-status'),ok?'✓ 已以目前姿勢校正。關閉說明後，按繼續。':'尚未收到感測資料，請先開啟授權並輕輕傾斜平板；也可使用搖桿。');
}
$('guide-calibrate').onclick=calibrateFromGuide;
$('guide-joystick').onclick=()=>{input.setMode('joystick');setText($('guide-status'),'已切換為搖桿模式，拖曳左下方亮藍色搖桿即可操作。');};
for(let i=0;i<28;i++){const piece=document.createElement('i');piece.style.setProperty('--i',i);$('celebration').append(piece);}
$('mode').onclick=()=>{if(input.mode==='tilt'||input.tiltPending){input.setMode('joystick');return;}pause('切換控制方式後，按繼續');input.requestTilt();};
$('calibrate').onclick=openGuide;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('已切到背景，按繼續恢復');});
window.addEventListener('pagehide',()=>pause('已離開頁面'));window.addEventListener('blur',()=>pause('已離開遊戲視窗'));
matchMedia('(orientation:landscape)').addEventListener('change',()=>{pause('方向已變更，按繼續恢復');input.resetOrientation();});
screen.orientation?.addEventListener('change',()=>{pause('握持方向已變更，請重新校正');input.resetOrientation();});
if(!screen.orientation)window.addEventListener('orientationchange',()=>{pause('握持方向已變更，請重新校正');input.resetOrientation();});
function drawUI(){
 setText($('control-mode'),controlLabel(input));
 $('control-mode').dataset.mode=input.mode;
 setText($('mode'),input.mode==='tilt'?'切換搖桿模式':'切換平板傾斜');
 if(!game)return;
 const theme=DAYLIGHT[game.levelIndex];
 const ready=game.status==='READY';
 $('gate').hidden=!ready;
 $('gate').style.setProperty('--gate-open',gateProgress(game.readyRemaining));
 $('overlay').classList.toggle('gate-ready',ready);
 const style=document.documentElement.style;
 if(style.getPropertyValue('--accent')!==theme.color)style.setProperty('--accent',theme.color);
 setText($('player-label'),game.name);setText($('level-label'),`第${game.level.level}關 · ${theme.name}`);setText($('question-label'),`成語 ${game.idiomIndex+1}/${game.level.idiomsRequired}`);
 setText($('timer'),`${Math.ceil(game.remaining)} 秒`);setText($('retry'),`A × ${3-game.attemptsUsed}`);$('retry').disabled=game.attemptsUsed>=3||['LEVEL_CLEAR','GAME_CLEAR'].includes(game.status);
 setText($('pause'),game.status==='PAUSED'?'P 繼續':'P 暫停');
 if(lastIdiom!==game.idiom||lastIndex!==game.nextIndex){lastIdiom=game.idiom;lastIndex=game.nextIndex;$('cards').replaceChildren();for(const item of game.view()){
   const el=document.createElement('div');el.className=item.status;const letter=document.createElement('strong');letter.textContent=item.char;
   const detail=document.createElement('small');detail.textContent=`${item.charIndex+1} · ${item.zhuyin}　${{COMPLETED:'✓ 已完成',CURRENT:'★ 下一目標',PENDING:'○ 未完成'}[item.status]}`;el.append(letter,detail);$('cards').append(el);
 }setText($('definition'),game.idiom.definition);}
 setText($('feedback'),progressMessage(game));
 const ended=['LEVEL_FAILED','GAME_CLEAR'].includes(game.status);
 $('overlay').classList.toggle('results',ended);
 $('overlay').classList.toggle('grand-finale',game.status==='GAME_CLEAR');
 $('result-actions').hidden=!ended;
 $('result-restart').hidden=game.status==='GAME_CLEAR';
 $('result-emblem').hidden=!ended;$('result-stats').hidden=!ended;$('celebration').hidden=!ended;
 if(ended&&lastStatus!==game.status){
  const stats=resultStats(game);$('result-stats').replaceChildren();
  for(const [label,value] of [['完成成語',stats.completed+'/19'],['通過關卡',stats.cleared+'/5'],['總失誤',stats.mistakes+' 次'],['重試次數',stats.retries+' 次']]){
   const item=document.createElement('div'),number=document.createElement('strong'),caption=document.createElement('span');number.textContent=value;caption.textContent=label;item.append(number,caption);$('result-stats').append(item);
  }
  setText($('result-emblem'),game.status==='GAME_CLEAR'?'🏆':'🐬');
 }
 const overlay=['READY','PAUSED','LEVEL_CLEAR','LEVEL_FAILED','GAME_CLEAR'].includes(game.status);$('overlay').hidden=!overlay;
 $('continue').hidden=game.status==='READY';
 if(game.status==='READY'){setText($('overlay-title'),String(Math.ceil(game.readyRemaining)));setText($('overlay-text'),'準備出發 · 依序碰撞四個目標字');}
 else if(game.status==='PAUSED'){setText($('overlay-title'),'遊戲已暫停');setText($('overlay-text'),game.pauseReason);setText($('continue'),'繼續');}
 else if(game.status==='LEVEL_CLEAR'){setText($('overlay-title'),'本關完成！');setText($('overlay-text'),`剩餘 ${Math.ceil(game.remaining)} 秒 · 失誤 ${game.mistakes} 次`);setText($('continue'),'前往下一關 →');}
 else if(game.status==='LEVEL_FAILED'){setText($('overlay-title'),`${game.name}，本次航行成績`);setText($('overlay-text'),`已完成 ${game.completed.length}/${game.level.idiomsRequired} 條。也可以使用 R 全部重來。`);setText($('continue'),'A 重試本關');$('continue').disabled=game.attemptsUsed>=3;}
 else if(game.status==='GAME_CLEAR'){setText($('overlay-title'),`${game.name}，五關全通！`);setText($('overlay-text'),summaryMessage(game));setText($('continue'),'再挑戰一次');}
 if(game.status!=='LEVEL_FAILED')$('continue').disabled=false;
 if(game.feedback&&game.feedback.serial!==lastFeedback){lastFeedback=game.feedback.serial;if($('sound').checked){try{const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=game.feedback.type==='correct'?660:220;gain.gain.value=.04;osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.09);osc.onended=()=>audio.close().catch(()=>{});}catch{}}}
 if(lastStatus!==game.status){lastStatus=game.status;clock.reset();}
}
let previous=performance.now();function frame(now){const delta=(now-previous)/1000;previous=now;const gravity=input.gravity(now);if(game&&!document.hidden&&landscape())clock.advance(delta,dt=>game.tick(dt,gravity));drawUI();if(game)renderer.draw(game,now);requestAnimationFrame(frame);}requestAnimationFrame(frame);
