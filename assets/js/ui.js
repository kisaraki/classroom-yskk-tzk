// Avoid replacing live-region text nodes when their visible content is unchanged.
export function setText(element,value){
  const text=String(value);
  if(element.textContent!==text)element.textContent=text;
}

export function progressMessage(game){
  const progress=`${game.nextIndex}/4`;
  if(game.nextIndex===4)return `${progress} · 本題完成`;
  const message=game.feedback?.life>0?game.feedback.text:`下一個目標：第${game.nextIndex+1}字「${Array.from(game.idiom.idiom)[game.nextIndex]}」`;
  return `${progress} · ${message}`;
}

export function summaryMessage(game){
  const levels=game.summaries.map(s=>`第${s.level}關 · 剩餘${Math.ceil(s.remaining)}秒 · 失誤${s.mistakes}次 · 重試${s.attempts}次\n${s.idioms.join('、')}`).join('\n');
  const retries=game.retryHistory.map(r=>`第${r.level}關第${r.attempt}次重試 · 重試前剩餘${Math.ceil(r.remaining)}秒／失誤${r.mistakes}次`).join('\n');
  return `${levels}\n\n重試紀錄\n${retries||'本次挑戰未使用重試'}`;
}

export function sourceMessage(dataset){
  if(!dataset)return '正式題庫仍待匯入與人工核校。';
  const official=dataset.items.some(item=>item.source==='moe-idioms-public-dictionary');
  const attribution=official?`中華民國教育部（Ministry of Education, R.O.C.）。《成語典》（版本編號：${dataset.sourceEdition||'未提供'}）網址：http://dict.idioms.moe.edu.tw/\n`:'';
  return attribution+(dataset.legalAttribution||'來源與授權資訊尚待確認。');
}

export function sensorMessage(input){
  const states={unknown:'尚未要求',requesting:'等待回覆',granted:'已允許',denied:'未允許','not-required':'不需此授權 API',unavailable:'瀏覽器未提供此 API',error:'請求失敗'};
  const permission=key=>{const p=input.permission[key]||{state:'unknown'};return (states[p.state]||String(p.state))+(p.error?`（${p.error}）`:'');};
  const age=Number.isFinite(input.lastValid)?`${Math.max(0,Math.round(input.now()-input.lastValid))} 毫秒前`:'尚未收到';
  return `控制版本：20261114.2\n安全連線：${input.host.isSecureContext===true?'是（HTTPS）':input.host.isSecureContext===false?'否':'未知'}\n`+
    `動作權限：${permission('DeviceMotionEvent')}\n方向權限：${permission('DeviceOrientationEvent')}\n`+
    `動作事件：${input.eventCounts.motion} 次\n方向事件：${input.eventCounts.orientation} 次\n有效資料：${input.eventCounts.valid} 次\n`+
    `最近有效資料：${age}\n感測器轉換角度：${input.angle()}°\n螢幕原始角度：${input.host.screen?.orientation?.angle??'未提供'}°\n裝置角度：${input.host.orientation??'未提供'}°\n資料來源：${input.source||'尚無'}\n`+
    `方向（右／下為正）：${input.filtered.x.toFixed(2)} / ${input.filtered.y.toFixed(2)}\n控制狀態：${input.modeMessage}`;
}

export function resultStats(game){
 const recorded=game.summaries.some(s=>s.level===game.level.level);
 const completed=game.summaries.reduce((n,s)=>n+s.idioms.length,0)+(recorded?0:game.completed.length);
 const mistakes=game.summaries.reduce((n,s)=>n+s.mistakes,0)+(recorded?0:game.mistakes)+game.retryHistory.reduce((n,r)=>n+r.mistakes,0);
 return {completed,cleared:game.summaries.length,mistakes,retries:game.retryHistory.length,remaining:Math.ceil(game.remaining)};
}
export function controlLabel(input){return input.tiltPending?'◌ 搖桿模式 · 等待感測授權':input.mode==='tilt'?'▱ 平板傾斜模式':'✥ 搖桿模式';}
