#!/usr/bin/env node
// Engineering release gate. Does not deploy or replace human/device acceptance.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const packRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--project-root' || args[1].startsWith('--'))) {
  console.error('用法：node codex-workpack/tools/check-release.mjs [--project-root <網站根目錄>]');
  process.exit(2);
}
const projectRoot = resolve(args[1] || resolve(packRoot, '..'));
const required = ['index.html', 'data/idioms_500.json', 'data/idiom_linguistic_review.csv'];
const missing = required.filter(path => !existsSync(resolve(projectRoot, path)) || !statSync(resolve(projectRoot, path)).isFile());
const testsDir = resolve(projectRoot, 'tests');
const tests = existsSync(testsDir) && statSync(testsDir).isDirectory()
  ? readdirSync(testsDir, { withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.test.mjs')).map(entry => resolve(testsDir, entry.name)).sort()
  : [];
if (!tests.length) missing.push('tests/*.test.mjs（至少一個遊戲測試檔）');
if (missing.length) {
  console.error(`FAIL: 發布檢查缺少：${missing.join('、')}`);
  process.exit(1);
}

function run(label, argv) {
  console.log(label);
  const result = spawnSync(process.execPath, argv, { cwd: projectRoot, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`FAIL: ${label}${result.error ? `：${result.error.message}` : ''}`);
    process.exit(1);
  }
  return result.stdout;
}
run('正式題庫與內容簽核嚴格驗證', [resolve(packRoot, 'tools/validate-idioms.mjs'),
  '--data', resolve(projectRoot, 'data/idioms_500.json'),
  '--review', resolve(projectRoot, 'data/idiom_linguistic_review.csv')]);
const output = run('執行遊戲測試', ['--test', '--test-reporter=tap', ...tests]);
if (!/^# pass [1-9]\d*\s*$/mu.test(output) || /^# (?:skipped|todo) [1-9]\d*\s*$/mu.test(output)) {
  console.error('FAIL: 發布檢查要求至少一項通過的遊戲測試，且不得有 skipped / todo。');
  process.exit(1);
}
console.log('PASS: 工程發布檢查通過；仍須實機、授權與部署驗收證據，本工具不發布網站。');
