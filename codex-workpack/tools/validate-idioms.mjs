#!/usr/bin/env node
/**
 * 成語彈珠臺：正式可遊玩 JSON 核驗（純 Node.js，無第三方依賴）
 *
 * 從專案根目錄：
 *   node codex-workpack/tools/validate-idioms.mjs --data ./data/idioms_500.json
 * 僅驗結構，允許正式資料仍待審（不可用來宣稱可上線）：
 *   node codex-workpack/tools/validate-idioms.mjs --data ./data/idioms_500.json --allow-pending
 *
 * 審核記錄預設：codex-workpack/data/idiom_linguistic_review.csv。
 * --review 可選其它審核表路徑，嚴格模式仍要求 500 筆有人工核校記錄。
 * 程式只檢查格式、證據欄位、與候選詞目一致，不會判定注音或釋義的語言學正確性。
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { contentHash } from './lib/review-content.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const indexOf = key => args.indexOf(key);
const getArg = key => indexOf(key) >= 0 ? args[indexOf(key) + 1] : undefined;
const allowPending = args.includes('--allow-pending');
const dataArg = getArg('--data');
const reviewPath = resolve(getArg('--review') || resolve(root, 'data/idiom_linguistic_review.csv'));
const filePath = resolve(dataArg || resolve(root, 'data/idioms_500.json'));
const errors = [];
const fail = msg => errors.push(msg);
const warn = msg => console.warn('WARNING:', msg);
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/u, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/u, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (quoted) throw new Error('CSV 引號沒有結束');
  if (field || row.length) { row.push(field.replace(/\r$/u, '')); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}

if (!existsSync(filePath)) {
  console.error(`FAIL: 正式題庫不存在：${filePath}`);
  console.error('工作包只有 500 條候選詞目；請先依 DATA_GOVERNANCE.md 合法匯入並人工核校。');
  process.exit(1);
}
let selected, data;
try {
  selected = readJson(resolve(root, 'data/idioms_500_selection.json'));
  data = readJson(filePath);
} catch (error) {
  console.error(`FAIL: JSON 解析失敗：${error.message}`);
  process.exit(1);
}

if (!data || typeof data !== 'object' || Array.isArray(data)) {
  console.error('FAIL: 題庫 JSON 頂層必須為物件');
  process.exit(1);
}
if (data.schemaVersion !== 1) fail('schemaVersion 必須為 1');
if (data.count !== 500) fail(`count 應為 500，實際 ${data.count}`);
if (!Array.isArray(data.items) || data.items.length !== 500) fail(`items 必須有500筆，實際 ${data.items?.length ?? '無'}`);
if (!['PENDING', 'APPROVED'].includes(data.linguisticReviewStatus)) fail('linguisticReviewStatus 僅可為 PENDING 或 APPROVED');
if (!allowPending && data.linguisticReviewStatus !== 'APPROVED') fail('尚未核准：嚴格驗證要求 linguisticReviewStatus=APPROVED');

const seenId = new Set(); const seenIdiom = new Set();
const placeholder = /待補|待填|測試用|測試資料|TODO|TBD|placeholder|成語\d{2,}/iu;
const zhuyinRegex = /^˙?[ㄅ-ㄩ]+[ˊˇˋ]?$/u;
const hanziRegex = /^[\u3400-\u9FFF\uF900-\uFAFF]{4}$/u;
for (const [index, item] of (Array.isArray(data.items) ? data.items : []).entries()) {
  const candidate = selected.items[index];
  const label = `[${String(index + 1).padStart(3, '0')}]`;
  if (!item || typeof item !== 'object') { fail(`${label} 不是物件`); continue; }
  if (item.id !== candidate?.id) fail(`${label} ID 應為 ${candidate?.id}，實際 ${item.id}`);
  if (item.idiom !== candidate?.idiom) fail(`${label} 詞目不可擅換：${candidate?.idiom} !== ${item.idiom}`);
  if (seenId.has(item.id)) fail(`${label} ID 重複：${item.id}`);
  if (seenIdiom.has(item.idiom)) fail(`${label} 詞目重複：${item.idiom}`);
  seenId.add(item.id); seenIdiom.add(item.idiom);
  if (typeof item.idiom !== 'string' || !hanziRegex.test(item.idiom) || item.idiom.normalize('NFC') !== item.idiom) fail(`${label} 詞目非正規化四漢字`);
  if (placeholder.test(String(item.idiom))) fail(`${label} 出現占位詞目`);
  if (!Array.isArray(item.zhuyin) || item.zhuyin.length !== 4) fail(`${label} zhuyin 必須恰為四格`);
  else for (let i = 0; i < 4; i++) if (typeof item.zhuyin[i] !== 'string' || !zhuyinRegex.test(item.zhuyin[i])) fail(`${label} 第${i + 1}字注音格式錯誤：${item.zhuyin[i]}`);
  if (typeof item.definition !== 'string' || item.definition.trim().length < 2 || item.definition.normalize('NFC') !== item.definition || placeholder.test(item.definition)) fail(`${label} 釋義缺漏、非 NFC 或含占位字串`);
  if (!Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5) fail(`${label} difficulty 須為1..5`);
  if (typeof item.source !== 'string' || item.source.trim().length < 2 || placeholder.test(item.source)) fail(`${label} 來源缺漏`);
  if (item.source === 'moe-idioms-public-dictionary') {
    if (!/^\d{4}_\d{8}$/u.test(item.sourceEdition || data.sourceEdition || '')) fail(`${label} 教育部來源須紀錄正確格式的版號`);
    if (typeof item.originalZhuyin !== 'string' || !item.originalZhuyin.trim()) fail(`${label} 教育部來源須保留原始注音供核對`);
  }
}
if (data.items?.length === 500 && seenId.size !== 500) fail('ID 不足500個互異值');
if (data.items?.length === 500 && seenIdiom.size !== 500) fail('詞目不足500個互異值');
if ((Array.isArray(data.items) ? data.items : []).some(x => x?.source === 'moe-idioms-public-dictionary') &&
    (typeof data.legalAttribution !== 'string' || !data.legalAttribution.trim())) fail('教育部來源須提供 legalAttribution 原文署名及授權資訊');

// 已核准資料不能只改旗標：必須有實際 500 筆審核紀錄。
if (data.linguisticReviewStatus === 'APPROVED') {
  if (!existsSync(reviewPath)) fail(`審核表不存在：${reviewPath}`);
  else {
    try {
      const rows = parseCsv(readFileSync(reviewPath, 'utf8'));
      const header = rows.shift() || [];
      const needed = ['id', 'idiom', 'zhuyin_checked', 'definition_checked', 'source_checked', 'reviewer', 'reviewed_at', 'content_sha256'];
      for (const key of needed) if (!header.includes(key)) fail(`審核表缺欄：${key}`);
      if (rows.length !== 500) fail(`審核表必須500列，實際 ${rows.length}`);
      const ix = Object.fromEntries(needed.map(key => [key, header.indexOf(key)]));
      for (const [i, row] of rows.entries()) {
        const ref = selected.items[i]; const label = `審核第${i + 1}筆`;
        if (row[ix.id] !== ref?.id || row[ix.idiom] !== ref?.idiom) fail(`${label} ID/詞目與既定清單不一致`);
        for (const k of ['zhuyin_checked', 'definition_checked', 'source_checked']) if (row[ix[k]] !== 'Y') fail(`${label} ${k} 未簽核 Y`);
        if (!row[ix.reviewer]?.trim()) fail(`${label} 缺審核人員`);
        const dt = row[ix.reviewed_at] || '';
        const parsedDate = new Date(`${dt}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/u.test(dt) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dt) fail(`${label} reviewed_at 日期無效`);
        const item = Array.isArray(data.items) ? data.items[i] : undefined;
        const reviewedHash = row[ix.content_sha256] || '';
        if (!/^[a-f0-9]{64}$/u.test(reviewedHash)) fail(`${label} 缺少有效 content_sha256`);
        else if (!item || typeof item !== 'object' || Array.isArray(item) || reviewedHash !== contentHash(data, item)) {
          fail(`${label} content_sha256 與目前內容不同，須重新人工核校；不可沿用舊簽核`);
        }
      }
    } catch (error) { fail(`讀取審核表失敗：${error.message}`); }
  }
}

console.log(`正式題庫：${Array.isArray(data.items) ? data.items.length : 0} 筆；狀態：${data.linguisticReviewStatus ?? 'UNKNOWN'}`);
if (allowPending && data.linguisticReviewStatus === 'PENDING') warn('結構可驗，但資料尚待人工核校；這不是正式上線驗收。');
warn('語音／釋義實際正確性、使用授權及教科書收錄須另外人工審查。');
if (errors.length) {
  errors.forEach(msg => console.error('ERROR:', msg));
  console.error(`FAIL：共 ${errors.length} 個錯誤。`);
  process.exitCode = 1;
} else {
  console.log(allowPending ? 'PASS：僅結構／來源欄位檢核。' : 'PASS：結構及核校紀錄完整性；仍需核對審核本身真實性與授權。');
}
