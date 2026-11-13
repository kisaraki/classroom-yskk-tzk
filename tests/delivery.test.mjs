import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {sourceMessage} from '../assets/js/ui.js';

test('review packet preserves source bytes, leaves approval blank and refuses overwriting output',()=>{
 const dir=mkdtempSync(join(tmpdir(),'idioms-review-'));
 try{
  const selected=JSON.parse(readFileSync('codex-workpack/data/idioms_500_selection.json','utf8')).items.slice(0,19);
  const data={schemaVersion:1,count:19,linguisticReviewStatus:'PENDING',items:selected.map(x=>({...x,zhuyin:['ㄧ','ㄧ','ㄧ','ㄧ'],definition:'synthetic test only',source:'synthetic',difficulty:1}))};
  const input=join(dir,'input.json'),output=join(dir,'review.md'),before=JSON.stringify(data);writeFileSync(input,before);
  const args=['tools/prepare-review.mjs','--data',input,'--output',output];
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const packet=readFileSync(output,'utf8');assert.equal((packet.match(/待核對版本指紋/g)||[]).length,19);assert.equal(packet.includes('[x]'),false);assert.match(packet,/未簽核/);
  assert.equal(readFileSync(input,'utf8'),before);
  const second=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(second.status,1);assert.equal(readFileSync(output,'utf8'),packet);
 }finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});}
});

test('official attribution includes edition and the original license PDF is byte-preserved',()=>{
 const text=sourceMessage({sourceEdition:'2020_20260929',legalAttribution:'CC BY-ND 3.0 TW',items:[{source:'moe-idioms-public-dictionary'}]});
 assert.match(text,/中華民國教育部/);assert.match(text,/2020_20260929/);assert.match(text,/CC BY-ND/);
 const pdf=readFileSync('assets/legal/idiomsdict_10409.pdf');assert.equal(createHash('sha256').update(pdf).digest('hex'),'ce154de2a9fb1eee4a591d2fa0d8cef2437f82e72d21fecdd5098d85d81ac8ad');
 assert.match(sourceMessage(null),/人工核校/);
});

test('tablet staging is explicit, byte-preserves PENDING data and excludes private material',()=>{
 const dir=mkdtempSync(join(tmpdir(),'idioms-stage-'));
 try{
  const selected=JSON.parse(readFileSync('codex-workpack/data/idioms_500_selection.json','utf8')).items;
  const data={schemaVersion:1,count:500,linguisticReviewStatus:'PENDING',items:selected.map(x=>({...x,zhuyin:['ㄧ','ㄧ','ㄧ','ㄧ'],definition:'synthetic test only',source:'synthetic',difficulty:1}))};
  const input=join(dir,'data.json'),output=join(dir,'site'),raw=JSON.stringify(data);writeFileSync(input,raw);
  const args=['tools/stage-tablet-test.mjs','--data',input,'--output',output];
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  assert.equal(readFileSync(join(output,'data/idioms_tablet_test.json'),'utf8'),raw);
  assert.match(readFileSync(join(output,'assets/js/site-config.js'),'utf8'),/tablet-test/);
  assert.match(readFileSync('assets/js/site-config.js','utf8'),/production/);
  for(const name of ['_reference','docs','tests','codex-workpack','data/idiom_linguistic_review.csv','data/idioms_500.json'])assert.throws(()=>readFileSync(join(output,name)),/ENOENT/);
  assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,1);
 }finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});}
});
