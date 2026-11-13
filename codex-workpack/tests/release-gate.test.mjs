import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { sandbox, dataset, reviewCsv, writeJson, runTool } from './helpers/fixtures.mjs';

function project(t) {
  const dir=sandbox(t), data=dataset('APPROVED');
  mkdirSync(join(dir,'data')); mkdirSync(join(dir,'tests'));
  writeFileSync(join(dir,'index.html'),'<!-- SYNTHETIC RELEASE GATE FIXTURE ONLY -->');
  writeJson(join(dir,'data/idioms_500.json'),data);
  writeFileSync(join(dir,'data/idiom_linguistic_review.csv'),reviewCsv(data));
  writeFileSync(join(dir,'tests/game.test.mjs'),"import test from 'node:test'; test('synthetic gate fixture',()=>{});\n");
  return {dir,data,run:()=>runTool('check-release.mjs',['--project-root',dir])};
}
test('release gate runs strict data validation and game tests in an isolated synthetic project',t=>{
  const p=project(t), result=p.run(); assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/synthetic gate fixture/u); assert.match(result.stdout,/工程發布檢查通過/u);
});
test('release gate fails when there are no game tests',t=>{
  const p=project(t); unlinkSync(join(p.dir,'tests/game.test.mjs'));
  const result=p.run(); assert.notEqual(result.status,0); assert.match(result.stderr,/至少一個遊戲測試檔/u);
});
test('release gate fails on PENDING data despite passing game tests',t=>{
  const p=project(t); p.data.linguisticReviewStatus='PENDING'; writeJson(join(p.dir,'data/idioms_500.json'),p.data);
  const result=p.run(); assert.notEqual(result.status,0); assert.match(result.stderr,/嚴格驗證要求/u);
});
test('release gate rejects stale content evidence',t=>{
  const p=project(t); p.data.items[0].definition='已修改的合成內容。'; writeJson(join(p.dir,'data/idioms_500.json'),p.data);
  const result=p.run(); assert.notEqual(result.status,0); assert.match(result.stderr,/content_sha256 與目前內容不同/u);
});
for (const [label, body] of [
  ['failing',"test('synthetic failing fixture',()=>{throw new Error('EXPECTED_FAILURE');});"],
  ['skipped',"test.skip('synthetic skipped fixture',()=>{});"],
  ['todo',"test.todo('synthetic unfinished fixture');"],
]) test(`release gate rejects ${label} game tests`,t=>{
  const p=project(t); writeFileSync(join(p.dir,'tests/game.test.mjs'),`import test from 'node:test'; ${body}\n`);
  assert.notEqual(p.run().status,0);
});
test('CI keeps development and explicit/tag release checks distinct',()=>{
  const workflow=readFileSync(new URL('../docs/CI_WORKFLOW_TEMPLATE.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/u); assert.match(workflow,/refs\/tags\/v/u);
  assert.match(workflow,/needs: verify/u); assert.match(workflow,/run: node codex-workpack\/tools\/check-release\.mjs/u);
  assert.doesNotMatch(workflow,/continue-on-error|--allow-pending/u);
});
