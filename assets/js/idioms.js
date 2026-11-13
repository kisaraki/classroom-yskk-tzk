import { LEVELS,seededRandom } from './config.js';
export function validateDataset(data,{preview=false}={}) {
  if(!data || data.schemaVersion!==1 || !Array.isArray(data.items) || data.count!==data.items.length) throw new Error('題庫格式不正確。');
  if(preview ? data.items.length<19 : data.items.length!==500) throw new Error(preview?'預覽至少需要19條不同成語。':'正式題庫須有500條。');
  if(!preview && data.linguisticReviewStatus!=='APPROVED') throw new Error('正式題庫尚待語文核校，暫時無法開始。');
  const ids=new Set(),words=new Set();
  for(const item of data.items) {
    if(!item || typeof item.id!=='string' || ids.has(item.id) || typeof item.idiom!=='string' || !/^[\u3400-\u9FFF\uF900-\uFAFF]{4}$/u.test(item.idiom) || words.has(item.idiom) ||
      !Array.isArray(item.zhuyin) || item.zhuyin.length!==4 || item.zhuyin.some(z=>typeof z!=='string'||!/^˙?[ㄅ-ㄩ]+[ˊˇˋ]?$/u.test(z)) ||
      typeof item.definition!=='string' || !item.definition.trim() || typeof item.source!=='string' || !item.source.trim() || !Number.isInteger(item.difficulty)||item.difficulty<1||item.difficulty>5)
      throw new Error(`題庫條目不完整或重複：${item?.id ?? '未知'}。`);
    ids.add(item.id);words.add(item.idiom);
  }
  return data.items;
}
export function choose19(items,seed) {
  if(items.length<19 || new Set(items.map(x=>x.idiom)).size!==items.length) throw new Error('需要至少19條互異成語');
  const random=seededRandom(seed),pool=[...items],groups=[];
  for(const level of LEVELS){
    const group=[];
    for(let n=0;n<level.idiomsRequired;n++){
      const weights=pool.map(x=>1/(1+Math.abs(x.difficulty-Math.min(5,level.level+1))*2));
      let pick=random()*weights.reduce((a,b)=>a+b,0),index=0;
      for(;index<weights.length-1;index++){pick-=weights[index];if(pick<0)break;}
      group.push(pool.splice(index,1)[0]);
    }
    groups.push(group);
  }
  return groups;
}
export async function loadDataset(preview=false,{fetchImpl=globalThis.fetch,tabletTest=false}={}){
  const path=tabletTest?'./data/idioms_tablet_test.json':preview?'./__preview/idioms.json':'./data/idioms_500.json';
  let response;
  try{response=await fetchImpl(path,{cache:'no-store',signal:AbortSignal.timeout(10000)});}
  catch{throw new Error('題庫連線失敗或逾時，請按「重新載入」再試。');}
  if(!response.ok)throw new Error(preview?'尚未提供本地預覽題庫。':'正式題庫尚未就緒，請稍後重試。');
  let data;try{data=await response.json();}catch{throw new Error('題庫檔案不是有效的 JSON，請檢查資料後重新載入。');}
  validateDataset(data,{preview:preview||tabletTest});return data;
}
