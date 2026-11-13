import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sandbox, sourceRows, writeJson, runTool } from './helpers/fixtures.mjs';

function setup(t, modify=()=>{}) {
  const dir=sandbox(t), source=join(dir,'synthetic-source.json'), output=join(dir,'import.json');
  const rows=sourceRows(); modify(rows); writeJson(source,{idioms:rows});
  const args=['--source',source,'--edition','2020_20260929','--output',output];
  return {dir,source,output,report:join(dir,'import.IMPORT_REVIEW.md'),args,run:()=>runTool('import-idioms.mjs',args)};
}
test('imports all candidates, preserves raw content, flags alternative pronunciation',t=>{
  const f=setup(t,rows=>{
    rows.push({...rows[0], '主條成語／非主條成語':'主條成語',
      注音:'ㄧ ㄇㄠˊ ㄅㄨˋ ㄅㄚˊ（變）ㄧˋ ㄇㄠˊ ㄅㄨˋ ㄅㄚˊ',釋義:'合成主條內容，僅作解析驗證。'});
  });
  const result=f.run(); assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(readFileSync(f.output,'utf8'));
  assert.equal(data.items.length,500); assert.equal(data.linguisticReviewStatus,'PENDING');
  assert.equal(data.items[0].definition,'合成主條內容，僅作解析驗證。');
  assert.equal(data.items[0].originalZhuyin,'ㄧ ㄇㄠˊ ㄅㄨˋ ㄅㄚˊ（變）ㄧˋ ㄇㄠˊ ㄅㄨˋ ㄅㄚˊ');
  assert.deepEqual(data.items[0].alternativeZhuyin,[['ㄧˋ','ㄇㄠˊ','ㄅㄨˋ','ㄅㄚˊ']]);
  assert.equal(data.items[0].requiresPronunciationReview,true);
  assert.match(readFileSync(f.report,'utf8'),/需特別審核：1 筆/u);
  const validation=runTool('validate-idioms.mjs',['--data',f.output,'--allow-pending']);
  assert.equal(validation.status,0,validation.stderr);
  const strict=runTool('validate-idioms.mjs',['--data',f.output]);
  assert.notEqual(strict.status,0); assert.match(strict.stderr,/嚴格驗證要求/u);
});
for (const [name, modify, error] of [
  ['missing candidate',rows=>rows.pop(),/詞目在此版本找不到/u],
  ['incomplete phonetics',rows=>{rows[0].注音='ㄧ ㄇㄠˊ ㄅㄨˋ';},/非四的倍數/u],
  ['missing definition',rows=>{delete rows[0].釋義;},/缺少.*釋義/u],
]) test(`invalid import leaves no output: ${name}`,t=>{
  const f=setup(t,modify); const result=f.run(); assert.notEqual(result.status,0);
  assert.match(result.stderr,error); assert.equal(existsSync(f.output),false); assert.equal(existsSync(f.report),false);
});
for (const which of ['output','report']) test(`refuses to overwrite existing ${which} and preserves its bytes`,t=>{
  const f=setup(t); writeFileSync(f[which],'KEEP EXISTING REVIEW WORK');
  const result=f.run(); assert.notEqual(result.status,0); assert.match(result.stderr,/拒絕覆寫/u);
  assert.equal(readFileSync(f[which],'utf8'),'KEEP EXISTING REVIEW WORK');
  assert.equal(existsSync(f[which==='output'?'report':'output']),false);
});
test('repeated import cannot reset an edited output to PENDING',t=>{
  const f=setup(t); assert.equal(f.run().status,0);
  const data=JSON.parse(readFileSync(f.output,'utf8')); data.items[0].definition='人工整理成果的合成測試代表值。';
  writeJson(f.output,data); const before=readFileSync(f.output), report=readFileSync(f.report);
  assert.notEqual(f.run().status,0);
  assert.deepEqual(readFileSync(f.output),before); assert.deepEqual(readFileSync(f.report),report);
});
test('explicit output and report must be different paths',t=>{
  const f=setup(t); const result=runTool('import-idioms.mjs',[...f.args,'--report',f.output]);
  assert.notEqual(result.status,0); assert.match(result.stderr,/不可使用同一路徑/u);
  assert.equal(existsSync(f.output),false);
});
test('explicit report path is honored',t=>{
  const f=setup(t), report=join(f.dir,'custom-review.md');
  const result=runTool('import-idioms.mjs',[...f.args,'--report',report]);
  assert.equal(result.status,0,result.stderr); assert.equal(existsSync(report),true);
  assert.equal(existsSync(f.report),false);
});
test('report creation failure rolls back only the newly-created JSON',t=>{
  const f=setup(t), parent=join(f.dir,'not-a-directory'); writeFileSync(parent,'KEEP');
  const result=runTool('import-idioms.mjs',[...f.args,'--report',join(parent,'report.md')]);
  assert.notEqual(result.status,0); assert.equal(existsSync(f.output),false);
  assert.equal(readFileSync(parent,'utf8'),'KEEP');
});
test('unsupported overwrite flag is rejected before creating files',t=>{
  const f=setup(t); const result=runTool('import-idioms.mjs',[...f.args,'--force']);
  assert.equal(result.status,2); assert.equal(existsSync(f.output),false); assert.equal(existsSync(f.report),false);
});
