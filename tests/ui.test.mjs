import test from 'node:test';
import assert from 'node:assert/strict';
import {setText,progressMessage,summaryMessage} from '../assets/js/ui.js';

test('live-region text changes only when its displayed value changes',()=>{
 let text='',writes=0;const element={get textContent(){return text;},set textContent(value){writes++;text=value;}};
 for(let frame=0;frame<120;frame++)setText(element,'1/4 · 已碰撞「日」');
 assert.equal(writes,1);setText(element,'2/4 · 已碰撞「日」');assert.equal(writes,2);
 setText(element,'<img src=x>');assert.equal(text,'<img src=x>');
});

test('progress count remains visible during correct and wrong feedback',()=>{
 const g={nextIndex:1,idiom:{idiom:'日日夜夜'},feedback:{life:1,text:'✓ 已碰撞「日」'}};
 assert.equal(progressMessage(g),'1/4 · ✓ 已碰撞「日」');
 g.feedback.text='請先碰第 2 字「日」';assert.equal(progressMessage(g),'1/4 · 請先碰第 2 字「日」');
 g.feedback.life=0;assert.equal(progressMessage(g),'1/4 · 下一個目標：第2字「日」');
 g.nextIndex=4;assert.equal(progressMessage(g),'4/4 · 本題完成');
});

test('final summary includes completed idioms and individual retry records',()=>{
 const g={summaries:[{level:1,remaining:100.1,mistakes:2,attempts:1,idioms:['日日夜夜']}],retryHistory:[{level:1,attempt:1,remaining:20.5,mistakes:5}]};
 const text=summaryMessage(g);assert.match(text,/日日夜夜/);assert.match(text,/剩餘101秒/);assert.match(text,/第1關第1次重試 · 重試前剩餘21秒／失誤5次/);
 g.retryHistory=[];assert.match(summaryMessage(g),/本次挑戰未使用重試/);
});
