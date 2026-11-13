import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname,resolve,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const tool=resolve(base,'tools/validate-idioms.mjs');

test('formal validator fails if no official data file exists; no silent fallbacks',()=>{
  const res=spawnSync(process.execPath,[tool,'--data','/nonexistent/idioms_500.json'],{encoding:'utf8'});
  assert.notEqual(res.status,0);
  assert.match(res.stderr,/不存在/u);
});

test('formal validator rejects incomplete data even with --allow-pending',()=>{
  const dir=mkdtempSync(join(tmpdir(),'idioms-workpack-test-'));
  try {
    const filename=join(dir,'small-fixture.json');
    writeFileSync(filename,JSON.stringify({schemaVersion:1,count:1,linguisticReviewStatus:'PENDING',items:[]}), 'utf8');
    const res=spawnSync(process.execPath,[tool,'--data',filename,'--allow-pending'],{encoding:'utf8'});
    assert.notEqual(res.status,0);
    assert.match(res.stderr,/count 應為 500/u);
  } finally { rmSync(dir,{force:true,recursive:true}); }
});

test('formal validator rejects PENDING when strict approval is required',()=>{
  const dir=mkdtempSync(join(tmpdir(),'idioms-workpack-test-'));
  try {
    const filename=join(dir,'pending-fixture.json');
    writeFileSync(filename,JSON.stringify({schemaVersion:1,count:500,linguisticReviewStatus:'PENDING',items:[]}), 'utf8');
    const res=spawnSync(process.execPath,[tool,'--data',filename],{encoding:'utf8'});
    assert.notEqual(res.status,0);
    assert.match(res.stderr,/嚴格驗證要求/u);
  } finally { rmSync(dir,{force:true,recursive:true}); }
});

test('import tool requires explicit local source and edition',()=>{
  const run=spawnSync(process.execPath,[resolve(base,'tools/import-idioms.mjs')],{encoding:'utf8'});
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/--source/u);
});
