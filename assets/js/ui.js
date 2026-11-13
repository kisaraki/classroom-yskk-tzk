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
