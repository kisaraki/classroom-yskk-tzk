import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sandbox, dataset, reviewCsv, writeJson, runTool } from './helpers/fixtures.mjs';
import { contentHash } from '../tools/lib/review-content.mjs';

function fixture(t) {
  const dir=sandbox(t), data=dataset('APPROVED');
  const file=join(dir,'synthetic.json'), review=join(dir,'synthetic-review.csv');
  writeJson(file,data); writeFileSync(review,reviewCsv(data));
  return {data,file,review,run:()=>runTool('validate-idioms.mjs',['--data',file,'--review',review])};
}
test('strict validation accepts matching synthetic content and review evidence',t=>{
  const f=fixture(t); const result=f.run();
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/PASS/u);
});
for (const [name, change] of [
  ['definition',d=>{d.items[0].definition='已變更的合成說明，不作教學用途。';}],
  ['pronunciation',d=>{d.items[0].zhuyin[0]='ㄧˊ';}],
  ['shared source edition',d=>{d.sourceEdition='2020_20260929';}],
  ['additional source field',d=>{d.items[0].sourceEntryId='changed-entry';}],
]) test(`strict validation rejects stale review after changing ${name}`,t=>{
  const f=fixture(t); change(f.data); writeJson(f.file,f.data);
  const result=f.run(); assert.notEqual(result.status,0);
  assert.match(result.stderr,/content_sha256 與目前內容不同/u);
});
test('approval flags and JSON property ordering do not invalidate reviewed content',()=>{
  const data=dataset(); const original=contentHash(data,data.items[0]);
  data.linguisticReviewStatus='APPROVED'; data.items[0].linguisticReview='reviewed';
  const reordered=Object.fromEntries(Object.entries(data.items[0]).reverse());
  assert.equal(contentHash(data,reordered),original);
});
test('missing hash and impossible calendar date are rejected',t=>{
  const f=fixture(t);
  const csv=readFileSync(f.review,'utf8').replaceAll('2000-01-01','2000-02-31').replace(/,[a-f0-9]{64}\n/u,',\n');
  writeFileSync(f.review,csv);
  const result=f.run(); assert.notEqual(result.status,0);
  assert.match(result.stderr,/reviewed_at 日期無效/u);
  assert.match(result.stderr,/缺少有效 content_sha256/u);
});
test('fingerprint helper prints hashes only and leaves both inputs unchanged',t=>{
  const f=fixture(t), beforeData=readFileSync(f.file), beforeReview=readFileSync(f.review);
  const result=runTool('review-fingerprint.mjs',['--data',f.file]);
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stdout.trim().split('\n').length,501);
  assert.match(result.stdout,/^id,idiom,content_sha256/u);
  assert.ok(!result.stdout.includes('AUTOMATED_TEST_FIXTURE_NOT_A_PERSON'));
  assert.deepEqual(readFileSync(f.file),beforeData); assert.deepEqual(readFileSync(f.review),beforeReview);
});
test('null dataset fails cleanly without an uncaught exception',t=>{
  const dir=sandbox(t), path=join(dir,'null.json'); writeJson(path,null);
  const result=runTool('validate-idioms.mjs',['--data',path]);
  assert.notEqual(result.status,0); assert.match(result.stderr,/頂層必須為物件/u);
  assert.doesNotMatch(result.stderr,/TypeError/u);
});
