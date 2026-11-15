import {mountEditor} from './editor.js?v=20261115.4';
import {guideStep,GUIDE_STEPS} from './tilt-guide.js?v=20261115.3';
import {requestDisplay} from './display.js?v=20261115.1';
import {setText,progressMessage,summaryMessage,sourceMessage,resultStats,controlLabel} from './ui.js?v=20261114.9';
import {SITE_MODE} from './site-config.js';
import {LEVELS} from './config.js?v=20261114.11';
import {loadDataset} from './idioms.js?v=20261115.4';
import {Game,FixedClock} from './state.js?v=20261114.11';
import {mountKeyboard,validName} from './keyboard.js?v=20261114.10';
import {InputController} from './input.js?v=20261114.5';
import {requestStartAccess,lockLandscape} from './startup.js?v=20261114.5';
import {Renderer} from './renderer.js?v=20261115.7';
import {DAYLIGHT,gateProgress} from './daylight.js?v=20261114.8';
const $=id=>document.getElementById(id),tabletTest=SITE_MODE==='tablet-test',preview=tabletTest||(['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1');
let editor=null,customItems=null;
let game=null,dataset=null,name='',busy=false,lastIdiom=null,lastIndex=-1,lastStatus='',lastFeedback=0,permissionInterrupted=false,keyboardReady=false,loading=false;
const clock=new FixedClock(),input=new InputController(),renderer=new Renderer($('canvas'));input.attach($('joystick'));
const landscape=()=>matchMedia('(orientation:landscape)').matches;
for (const level of LEVELS) {
 const theme = DAYLIGHT[level.level - 1];
 const item = document.createElement('li');
 item.style.setProperty('--level', theme.color);
 const title = document.createElement('strong');
 title.textContent = `第${level.level}關 ${theme.name}`;
 const details = document.createElement('div');
 details.className = 'level-details';
 for (const label of [`${level.durationSeconds} 秒`, `${level.idiomsRequired} 題`]) {
  const amount = document.createElement('span');
  amount.textContent = label;
  details.append(amount);
 }
 item.append(title, details);
 $('levels').append(item);
}
function enableStart(){$('start').disabled=!dataset||!validName(name)||busy||(preview&&(!customItems||customItems.length<19));$('retry-data').disabled=loading||busy;}
async function load(){
 if(loading||busy)return;loading=true;dataset=null;enableStart();setText($('data-status'),'載入題庫與鍵盤中…');
 try{
  if(!keyboardReady){
   let presets;
   try{const response=await fetch('./data/keyboard-presets.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();presets=await response.json();}
   catch{throw new Error('鍵盤設定載入失敗，請按「重新載入」再試。');}
   mountKeyboard($('keyboard'),presets,value=>{name=value;enableStart();});keyboardReady=true;
  }
  dataset=await loadDataset(preview,{tabletTest});
   if(!editor)editor=mountEditor({base:dataset.items,onChange:items=>{customItems=items;setText($('data-status'),items===null?'編修題庫無法讀取，請開啟編修模式處理。':items.length<19?'可使用成語不足 19 條，請新增或解除凍結。':'題庫已就緒 · 可使用 '+items.length+' 條');enableStart();}});
   else editor.refresh();
   $('editor-open').disabled=false;
 }catch(error){setText($('data-status'),error.message);}
 finally{loading=false;$('retry-data').disabled=false;enableStart();}
}
$('editor-open').onclick=()=>editor?.open();
$('retry-data').addEventListener('click',load);load();
function pause(reason){permissionInterrupted=busy||permissionInterrupted;game?.pause(reason);input.clear({cancelRequest:false});clock.reset();}
function showDialog(title,text,action=null){pause('確認操作');$('source-links').hidden=true;setText($('dialog-title'),title);setText($('dialog-text'),text);$('confirm').onclick=()=>{$('dialog').close();action?.();clock.reset();};$('cancel').hidden=!action;$('dialog').showModal();}
$('cancel').onclick=()=>$('dialog').close();
let aboutPage=0;
function showAboutPage(index){
 aboutPage=index;
 for(const [i,panel] of [...document.querySelectorAll('[data-about-panel]')].entries())panel.hidden=i!==index;
 for(const button of document.querySelectorAll('[data-about]'))button.setAttribute('aria-pressed',String(Number(button.dataset.about)===index));
 $('about-prev').disabled=index===0;$('about-next').disabled=index===3;
 setText($('about-page'),(index+1)+' / 4');$('about-guide').scrollTop=0;
}
$('about').onclick=()=>{pause('說明已關閉，準備好後按繼續');setText($('about-source'),sourceMessage(dataset));$('source-links').hidden=!dataset?.items.some(item=>item.source==='moe-idioms-public-dictionary');showAboutPage(0);$('about-guide').showModal();};
for(const button of document.querySelectorAll('[data-about]'))button.onclick=()=>showAboutPage(Number(button.dataset.about));
$('about-prev').onclick=()=>showAboutPage(Math.max(0,aboutPage-1));$('about-next').onclick=()=>showAboutPage(Math.min(3,aboutPage+1));
$('about-close').onclick=()=>$('about-guide').close();
$('about-tilt').onclick=()=>{$('about-guide').close();openGuide();};
$('start').onclick=async()=>{
 if(busy||!dataset||!validName(name)||(preview&&(!customItems||customItems.length<19)))return;busy=true;permissionInterrupted=false;enableStart();
 const playerName=name.trim(),gameItems=preview?customItems:dataset.items;
 $('player-name').blur();
 const access=requestStartAccess(globalThis,2200,()=>guideCalibrated&&input.mode==='tilt'&&input.now()-input.lastValid<2000?Promise.resolve():input.requestTilt());
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
let guideCalibrated=false,guideRequest=0;
function updateGuide(){
 if(!$('control-guide').open)return;
 const step=guideStep(input,guideCalibrated);
 setText($('guide-step-title'),GUIDE_STEPS[step-1][0]);setText($('guide-step-text'),GUIDE_STEPS[step-1][1]);
 for(const [i,item] of [...document.querySelectorAll('.guide-progress li')].entries()){
  item.classList.toggle('current',i===step-1);item.classList.toggle('done',i<step-1);
  if(i===step-1)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
 }
 const fresh=!!input.raw&&input.now()-input.lastValid<2000;
 setText($('guide-live'),controlLabel(input)+' · '+(fresh?'✓ 已收到有效感測資料':'尚未收到有效感測資料'));
 $('grant-sensors').disabled=input.tiltPending;
 $('guide-calibrate').disabled=step!==3;
 $('grant-sensors').classList.toggle('primary',step===1||step===2);
 $('guide-calibrate').classList.toggle('primary',step===3);
 $('guide-close').classList.toggle('primary',step===4);
 setText($('grant-sensors'),'① 開啟感測器授權');setText($('guide-calibrate'),'③ 已平放桌面，開始校正');
 setText($('guide-close'),step===4?'④ 完成引導':'稍後設定，關閉');
}
function openGuide(){pause('操作說明已關閉，準備好後按繼續');guideCalibrated=false;setText($('guide-status'),'');$('control-guide').showModal();updateGuide();}
$('control-help').onclick=openGuide;
$('guide-close').onclick=()=>$('control-guide').close();
$('control-guide').addEventListener('close',()=>{guideRequest++;if(input.tiltPending)input.setMode('joystick');});
$('grant-sensors').onclick=()=>{
 const serial=++guideRequest;guideCalibrated=false;setText($('guide-status'),'請查看瀏覽器授權提示，選擇「允許」。');
 input.requestTilt().then(ok=>{if(serial!==guideRequest)return;setText($('guide-status'),ok?'授權程序已完成，接著確認有效感測資料。':'未取得授權。可重新載入頁面再試，或按「使用搖桿」。');});
 setTimeout(()=>{if(serial===guideRequest&&input.tiltPending){input.setMode('joystick');setText($('guide-status'),'授權尚未完成，請再按一次授權按鈕，或使用搖桿。');}},10000);
};
$('guide-calibrate').onclick=()=>{
 if(guideStep(input,false)!==3)return;
 guideCalibrated=input.calibrate();
 setText($('guide-status'),guideCalibrated?'✓ 水平校正成功！請按「④ 完成引導」。':'感測資料已中斷，請重新偵測後再校正。');updateGuide();
};
$('guide-joystick').onclick=()=>{guideRequest++;guideCalibrated=false;input.setMode('joystick');setText($('guide-status'),'已選擇搖桿模式。按「稍後設定，關閉」後，可拖曳搖桿操作。');};
for(let i=0;i<28;i++){const piece=document.createElement('i');piece.style.setProperty('--i',i);$('celebration').append(piece);}
$('mode').onclick=()=>{if(input.mode==='tilt'||input.tiltPending){input.setMode('joystick');return;}pause('切換控制方式後，按繼續');input.requestTilt();};
$('calibrate').onclick=openGuide;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('已切到背景，按繼續恢復');});
window.addEventListener('pagehide',()=>pause('已離開頁面'));window.addEventListener('blur',()=>pause('已離開遊戲視窗'));
matchMedia('(orientation:landscape)').addEventListener('change',()=>{pause('方向已變更，按繼續恢復');input.resetOrientation();guideCalibrated=false;});
screen.orientation?.addEventListener('change',()=>{pause('握持方向已變更，請重新校正');input.resetOrientation();});
if(!screen.orientation)window.addEventListener('orientationchange',()=>{pause('握持方向已變更，請重新校正');input.resetOrientation();});
function drawUI(){
 updateGuide();
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

$('entry-yes').onclick=()=>{$('entry-choice').close();$('display-guide').showModal();};
$('entry-no').onclick=()=>$('entry-choice').close();
$('display-help').onclick=()=>{$('control-guide').close();$('display-guide').showModal();};
$('display-close').onclick=()=>$('display-guide').close();
$('display-request').onclick=async()=>{
 const button=$('display-request');button.disabled=true;
 const result=await requestDisplay();
 setText($('display-status'),(result.fullscreen?'已進入全螢幕。':'此瀏覽器未進入全螢幕，請依上方加入主畫面說明操作。')+(result.locked?'已鎖定橫向。':'請手動將平板轉為橫向。'));
 button.disabled=false;
};
$('qr-open').onclick=()=>$('qr-dialog').showModal();$('qr-close').onclick=()=>$('qr-dialog').close();
let tiltPromptPending=true;
function offerTiltGuide(){
 if(!tiltPromptPending||$('display-guide').open)return;
 tiltPromptPending=false;$('tilt-choice').showModal();
}
$('entry-choice').addEventListener('close',offerTiltGuide);
$('display-guide').addEventListener('close',offerTiltGuide);
$('tilt-skip').onclick=()=>$('tilt-choice').close();
$('tilt-guide').onclick=()=>{$('tilt-choice').close();openGuide();};
$('entry-choice').showModal();
