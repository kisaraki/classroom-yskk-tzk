#!/usr/bin/env node
/** 驗證工作包本身的必要檔案、硬性關卡規格與500條候選資料。 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const missing = [];
const required = [
  'AGENTS.md','START_HERE.md','README_FIRST.md','ROOT_AGENTS_SNIPPET.md','CODEX_RUN_PROMPT.txt','CODEX_SPEC.md',
  'docs/ARCHITECTURE.md','docs/IMPLEMENTATION_PLAN.md','docs/TASK_BOARD.md','docs/ACCEPTANCE_MATRIX.md',
  'docs/QA_DEVICE_MATRIX.md','docs/DATA_GOVERNANCE.md','docs/DECISIONS.md','docs/REPORT_TEMPLATES.md','docs/TROUBLESHOOTING.md',
  'contracts/levels.json','contracts/state-machine.json','contracts/idioms.schema.json',
  'data/idioms_500_selection.json','data/idioms_500_selection.csv','data/idiom_textbook_review.csv',
  'data/idiom_linguistic_review.csv','data/SOURCES.md','tools/import-idioms.mjs','tools/validate-selection.mjs','tools/validate-idioms.mjs',
  'tools/lib/review-content.mjs','tools/review-fingerprint.mjs','tools/check-release.mjs',
  'tests/import.test.mjs','tests/review-binding.test.mjs','tests/pause-contract.test.mjs','tests/release-gate.test.mjs',
  'tests/helpers/fixtures.mjs','docs/CI_WORKFLOW_TEMPLATE.yml'
];
for (const path of required) if (!existsSync(resolve(root,path))) missing.push(path);
if (missing.length) { console.error('FAIL 缺少檔案：'+missing.join(', ')); process.exit(1); }
const levels = JSON.parse(read('contracts/levels.json'));
const spec = read('CODEX_SPEC.md');
const chosen = JSON.parse(read('data/idioms_500_selection.json'));
const expected = [
 [1,'#2E7D32',240,2,4,0,2,0],
 [2,'#1565C0',210,3,3,1,2,2],
 [3,'#EF6C00',180,4,2,2,2,4],
 [4,'#6A1B9A',180,5,1,3,1,6],
 [5,'#C62828',150,5,0,4,1,8]
];
const errors=[];
const bad=x=>errors.push(x);
const keys=['level','color','durationSeconds','idiomsRequired','targetPosts','targetBalls','distractorPosts','distractorBalls'];
if (levels.levels.length !== 5) bad(`level JSON 數量非5：${levels.levels.length}`);
for (const exp of expected) {
  const lv=levels.levels[exp[0]-1];
  for (const [i,key] of keys.entries()) if (lv?.[key] !== exp[i]) bad(`第${exp[0]}關 ${key}：${lv?.[key]} 應為 ${exp[i]}`);
  const row = spec.split('\n').find(line => line.startsWith(`| ${exp[0]} |`));
  if (!row) { bad(`規格書缺第${exp[0]}關`); continue; }
  const col=row.split('|').map(s=>s.trim()).slice(1,-1);
  if (!col[1].startsWith('`'+exp[1]+'`')) bad(`規格書第${exp[0]}關色碼不合`);
  if (col[2] !== `${exp[2]} 秒`) bad(`規格書第${exp[0]}關時限不合`);
  for (let i=3;i<=7;i++) if (Number(col[i]) !== exp[i]) bad(`規格書第${exp[0]}關表格值第${i}欄不合`);
}
if (levels.totals.durationSeconds !== 960 || levels.totals.idiomsRequired !== 19 || levels.totals.requiredHits !== 76) bad('總計不等於960秒/19題/76字');
if (chosen.count !== 500 || chosen.items?.length !== 500) bad('候選詞目不等於500');
for (const path of ['data/idioms_500_selection.csv','data/idiom_textbook_review.csv','data/idiom_linguistic_review.csv']) {
  const lineCount=read(path).replace(/^\uFEFF/,'').trimEnd().split(/\r?\n/).length;
  if (lineCount!==501) bad(`${path} 不是500筆加表頭：${lineCount}行`);
}
const chk=spawnSync(process.execPath,[resolve(root,'tools/validate-selection.mjs')],{encoding:'utf8'});
if (chk.status!==0) bad('validate-selection.mjs 未通過：'+(chk.stderr||chk.stdout));
if (errors.length){errors.forEach(x=>console.error('ERROR:',x)); process.exit(1);}
console.log('PASS 工作包必要檔案齊全、關卡固定規格一致、三份CSV均500列。');
console.log(chk.stdout.trim());
console.log('NOTE 本檢查不代表正式資料、課本收錄、實機或遊戲程式已完成。');
