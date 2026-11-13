import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(base,path),'utf8');
const j = path => JSON.parse(read(path));

const expected = [
  [1, '#2E7D32', 240, 2, 4, 0, 2, 0, 6],
  [2, '#1565C0', 210, 3, 3, 1, 2, 2, 8],
  [3, '#EF6C00', 180, 4, 2, 2, 2, 4, 10],
  [4, '#6A1B9A', 180, 5, 1, 3, 1, 6, 11],
  [5, '#C62828', 150, 5, 0, 4, 1, 8, 13],
];

test('levels: five configurations, hardcoded v1.3 totals and ball/post counts', () => {
  const levels = j('contracts/levels.json');
  assert.equal(levels.levels.length, 5);
  for (const [i, lev] of levels.levels.entries()) {
    const [num, color, sec, idioms, tp, tb, dp, db, total] = expected[i];
    assert.deepEqual([lev.level,lev.color,lev.durationSeconds,lev.idiomsRequired,lev.targetPosts,lev.targetBalls,lev.distractorPosts,lev.distractorBalls], [num,color,sec,idioms,tp,tb,dp,db]);
    assert.equal(lev.targetPosts+lev.targetBalls, 4, `第 ${num} 關目標不是4件`);
    assert.equal(tp+tb+dp+db, total);
  }
  assert.deepEqual(levels.totals, {durationSeconds:960, idiomsRequired:19, requiredHits:76});
});

test('500 fixed candidates and three provisional school stages', () => {
  const data = j('data/idioms_500_selection.json');
  assert.equal(data.count, 500);
  assert.equal(data.items.length, 500);
  assert.equal(new Set(data.items.map(x=>x.idiom)).size,500);
  assert.equal(new Set(data.items.map(x=>x.id)).size,500);
  const counts={國小:0,國中:0,高中:0};
  data.items.forEach((row,i)=>{
    assert.equal(row.id,`I${String(i+1).padStart(4,'0')}`);
    assert.match(row.idiom,/^[\u3400-\u9FFF\uF900-\uFAFF]{4}$/u);
    assert.equal(row.textbookEvidence,'unverified');
    assert.equal(row.linguisticReview,'pending');
    counts[row.suggestedStage]++;
  });
  assert.deepEqual(counts,{國小:133,國中:201,高中:166});
});

test('spec appendix has same 500 fixed candidate id and idiom pairs', () => {
  const spec=read('CODEX_SPEC.md');
  const segment=spec.split('<!-- BEGIN IDIOM_SELECTION_500 -->')[1].split('<!-- END IDIOM_SELECTION_500 -->')[0];
  const pairs=[...segment.matchAll(/\b(I\d{4})：([\u3400-\u9FFF\uF900-\uFAFF]{4})/gu)].map(x=>[x[1],x[2]]);
  assert.equal(pairs.length,500);
  const fromData=j('data/idioms_500_selection.json').items.map(x=>[x.id,x.idiom]);
  assert.deepEqual(Object.fromEntries(pairs),Object.fromEntries(fromData));
});

test('state machine includes pause, manual resume, final victory, and no direct invalid shortcuts', () => {
  const sm=j('contracts/state-machine.json');
  assert.ok(sm.states.includes('PAUSED'));
  assert.ok(sm.states.includes('GAME_CLEAR'));
  const has=(a,ev,b)=>sm.transitions.some(t=>t.from===a&&t.event===ev&&t.to===b);
  assert.ok(has('PLAYING','PAUSE_OR_BACKGROUND','PAUSED'));
  assert.ok(has('PAUSED','USER_RESUME','PLAYING'));
  assert.ok(has('LEVEL_CLEAR','FIFTH_LEVEL_DONE','GAME_CLEAR'));
  assert.ok(!has('HOME','START_VALID','PLAYING'));
});

test('generic keyboard example contains no personal list and supports name mode', () => {
  const presets=j('contracts/keyboard-presets.example.json');
  assert.ok(presets.commonCharacters.length > 10);
  assert.ok(presets.presetNames.length > 1);
  assert.equal(new Set(presets.commonCharacters).size,presets.commonCharacters.length);
  assert.ok(!Object.hasOwn(presets,'studentRecords'));
});

test('existing selection validator passes', () => {
  const run=spawnSync(process.execPath,[resolve(base,'tools/validate-selection.mjs')],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stdout,/PASS/u);
});

test('workpack verify script passes', () => {
  const run=spawnSync(process.execPath,[resolve(base,'tools/verify-workpack.mjs')],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stdout,/PASS/u);
});
