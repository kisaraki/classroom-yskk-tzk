// All generated content/signatures are SYNTHETIC TEST FIXTURES in an OS temp
// directory. Never writes the workpack's real review table or a playable dataset.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { contentHash } from '../../tools/lib/review-content.mjs';

export const packRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const candidates = JSON.parse(readFileSync(join(packRoot,'data/idioms_500_selection.json'),'utf8')).items;
export function sandbox(t) {
  const tempRoot = resolve(tmpdir());
  const dir = mkdtempSync(join(tempRoot,'idioms-workpack-audit-'));
  t.after(() => {
    assert.equal(dirname(resolve(dir)), tempRoot);
    assert.ok(basename(dir).startsWith('idioms-workpack-audit-'));
    rmSync(dir,{recursive:true,force:true});
  });
  return dir;
}
export function runTool(name, args = [], options = {}) {
  const env={...process.env};
  // Launch an independent CLI test runner, not a recursive node:test child.
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath,[join(packRoot,'tools',name),...args],{encoding:'utf8',env,...options});
}
export function dataset(status = 'PENDING') {
  return {schemaVersion:1,count:500,linguisticReviewStatus:status,
    fixtureNotice:'SYNTHETIC TEST ONLY - NOT TEACHING DATA OR HUMAN APPROVAL',
    items:candidates.map(c => ({id:c.id,idiom:c.idiom,zhuyin:['ㄧ','ㄇㄠˊ','ㄅㄨˋ','ㄅㄚˊ'],
      definition:'僅供自動測試的合成說明，不作教學用途。',difficulty:2,source:'synthetic-test-only',linguisticReview:'pending'}))};
}
export function reviewCsv(data) {
  const header = 'id,idiom,zhuyin_checked,definition_checked,source_checked,reviewer,reviewed_at,notes,content_sha256';
  return [header,...data.items.map(item => [item.id,item.idiom,'Y','Y','Y',
    'AUTOMATED_TEST_FIXTURE_NOT_A_PERSON','2000-01-01','SYNTHETIC TEST ONLY',contentHash(data,item)].join(','))].join('\n')+'\n';
}
export function writeJson(path, value) { writeFileSync(path,JSON.stringify(value,null,2)+'\n','utf8'); }
export function sourceRows() {
  return candidates.map(c => ({成語:c.idiom,注音:'ㄧ ㄇㄠˊ ㄅㄨˋ ㄅㄚˊ',
    釋義:'僅供自動測試的合成說明，不作教學用途。',編號:c.id}));
}
