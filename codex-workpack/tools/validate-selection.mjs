/**
 * 成語彈珠臺 v1.3 — 成語候選清單品質檢核（不代表教科書出現證據）
 * Run: node tools/validate-selection.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
let errors = [];
const fail = (message) => errors.push(message);
const dataset = JSON.parse(read('data/idioms_500_selection.json'));
const items = dataset.items ?? [];
if (dataset.count !== 500 || items.length !== 500) fail(`筆數錯誤：宣告 ${dataset.count}，實際 ${items.length}`);
const idSet = new Set();
const idiomSet = new Set();
const stages = new Set(['國小', '國中', '高中']);
for (const [i, entry] of items.entries()) {
  const label = `第 ${i + 1} 筆`;
  if (typeof entry.id !== 'string' || !/^I\d{4}$/.test(entry.id) || entry.id !== `I${String(i + 1).padStart(4,'0')}`) fail(`${label} 編號錯誤`);
  if (idSet.has(entry.id)) fail(`${label} 編號重複 ${entry.id}`);
  idSet.add(entry.id);
  if (typeof entry.idiom !== 'string' || !/^[\u3400-\u9fff\uf900-\ufaff]{4}$/u.test(entry.idiom) || entry.idiom !== entry.idiom.normalize('NFC')) fail(`${label} 非四字繁體成語或格式不符：${entry.idiom}`);
  if (idiomSet.has(entry.idiom)) fail(`${label} 詞目重複：${entry.idiom}`);
  idiomSet.add(entry.idiom);
  if (!stages.has(entry.suggestedStage)) fail(`${label} 學段標籤錯誤：${entry.suggestedStage}`);
  if (!['unverified', 'confirmed'].includes(entry.textbookEvidence)) fail(`${label} 教材查核狀態錯誤`);
  if (!['pending', 'reviewed'].includes(entry.linguisticReview)) fail(`${label} 語文查核狀態錯誤`);
}
// 對照規格書附錄：規格書與 JSON 不可各自漂移
const spec = read('CODEX_SPEC.md');
const match = spec.match(/<!-- BEGIN IDIOM_SELECTION_500 -->([\s\S]*?)<!-- END IDIOM_SELECTION_500 -->/);
if (!match) fail('規格書缺少 500 條詞目附錄標記');
else {
  const entries = [...match[1].matchAll(/\b(I\d{4})：([\u3400-\u9fff\uf900-\ufaff]{4})/gu)];
  if (entries.length !== 500) fail(`規格書附錄實際 ${entries.length} 條，非 500`);
  const lookup = new Map(entries.map(x => [x[1], x[2]]));
  for (const entry of items) if (lookup.get(entry.id) !== entry.idiom) fail(`規格書附錄不一致：${entry.id} ${entry.idiom}`);
}
const stats = items.reduce((acc,item)=>{ acc[item.suggestedStage]=(acc[item.suggestedStage]??0)+1; return acc; },{});
console.log('清單筆數：', items.length, '| 不重複詞目：', idiomSet.size, '| 建議學段：', JSON.stringify(stats));
console.log('注意：通過結構檢核不代表已完成注音釋義審核、教材逐版核對或 2026 版官方資料比對。');
if (errors.length) { for (const msg of errors) console.error('ERROR:', msg); process.exitCode=1; }
else console.log('PASS: 成語候選清單與規格書附錄內容一致。');
