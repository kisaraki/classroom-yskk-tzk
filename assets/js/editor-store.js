import {validateItems} from './idioms.js?v=20261115.4';
export const EDITOR_KEY='guanyin-idiom-editor-v1';
export function cleanItems(items){
 if(!Array.isArray(items)||items.length>5000)throw Error('題庫必須是陣列，最多 5000 條。');
 const clean=items.map(x=>{
  if(!x||typeof x.id!=='string'||!x.id.trim()||x.id.length>120||typeof x.frozen!=='undefined'&&typeof x.frozen!=='boolean')throw Error('成語 ID 或凍結狀態不正確。');
  if(typeof x.definition!=='string'||x.definition.length>5000||typeof x.source!=='string'||x.source.length>2000)throw Error('釋義或來源格式不正確／過長。');
  return {id:x.id,idiom:x.idiom,zhuyin:Array.isArray(x.zhuyin)?[...x.zhuyin]:x.zhuyin,definition:x.definition,source:x.source,difficulty:x.difficulty,frozen:x.frozen===true,linguisticReviewStatus:'PENDING'};
 });
 validateItems(clean);return clean;
}
export function importDraft(text){
 if(text.length>5_000_000)throw Error('備份檔過大（上限 5 MB）。');
 const data=JSON.parse(text);
 if(data.schemaVersion!==1||data.kind!=='guanyin-local-draft')throw Error('請匯入由成語編修模式匯出的備份檔。');
 return cleanItems(data.items);
}
export function exportDraft(items){return JSON.stringify({schemaVersion:1,kind:'guanyin-local-draft',linguisticReviewStatus:'PENDING',items:cleanItems(items)},null,2);}
export function loadDraft(storage,base){const raw=storage.getItem(EDITOR_KEY);return raw===null?cleanItems(base):importDraft(raw);}
export function saveDraft(storage,items){const text=exportDraft(items);storage.setItem(EDITOR_KEY,text);return JSON.parse(text).items;}
export function playableItems(items){return items.filter(x=>!x.frozen);}
export function changeItem(items,item){const next=items.filter(x=>x.id!==item.id);next.push(item);return cleanItems(next);}
