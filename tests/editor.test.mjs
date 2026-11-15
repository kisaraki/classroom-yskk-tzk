import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanItems,loadDraft,saveDraft,exportDraft,importDraft,playableItems,changeItem,EDITOR_KEY} from '../assets/js/editor-store.js';
const row={id:'1',idiom:'一心一意',zhuyin:['ㄧ','ㄒㄧㄣ','ㄧ','ㄧˋ'],definition:'專注',source:'測試夾具',difficulty:2};
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
test('CRUD, freeze, persistence and export retain edits without changing original data',()=>{
 const original=[structuredClone(row)],store=storage();let rows=loadDraft(store,original);
 rows=changeItem(rows,{...row,id:'2',idiom:'三心二意'});assert.equal(rows.length,2);
 rows=changeItem(rows,{...row,definition:'修改',frozen:true});saveDraft(store,rows);
 assert.equal(playableItems(loadDraft(store,original)).length,1);
 assert.deepEqual(importDraft(exportDraft(rows)),rows);
 rows=changeItem(rows,{...row,frozen:false});assert.equal(playableItems(rows).length,2);
 saveDraft(store,rows.filter(x=>x.id!=='1'));assert.equal(loadDraft(store,original).length,1);
 assert.deepEqual(original,[row]);
});
test('invalid, duplicated and forged approved imports are handled safely',()=>{
 assert.throws(()=>cleanItems([row,{...row,id:'2'}]));assert.throws(()=>cleanItems([{...row,zhuyin:['abc']} ]));
 assert.throws(()=>cleanItems([{...row,frozen:'false'}]));assert.throws(()=>importDraft('{'));
 assert.throws(()=>importDraft(JSON.stringify({schemaVersion:1,kind:'other',items:[row]})));
 const result=cleanItems([{...row,linguisticReviewStatus:'APPROVED',reviewer:'forged'}]);
 assert.equal(result[0].linguisticReviewStatus,'PENDING');assert.equal(result[0].reviewer,undefined);
});
test('corrupt storage and quota failures never silently replace drafts',()=>{
 const s=storage();s.setItem(EDITOR_KEY,'broken');assert.throws(()=>loadDraft(s,[row]));assert.equal(s.getItem(EDITOR_KEY),'broken');
 assert.throws(()=>saveDraft({setItem(){throw Error('quota');}},[row]),/quota/);
 assert.deepEqual(importDraft(exportDraft([])),[]);
});
