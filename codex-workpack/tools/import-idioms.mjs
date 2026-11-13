/**
 * 成語彈珠臺：將下載的教育部《成語典》JSON（或其合法整理版本）
 * 與本版 500 條已選定詞目合併，產生待人工複核的遊戲資料。
 *
 * 用法（不需要 npm 安裝）：
 * node tools/import-idioms.mjs --source /path/to/dict_idioms_2020_20260929.json --edition 2020_20260929
 *
 * 注意：此程式不下載資料、不爬站、不替代語文教師對變讀、釋義和授權的審查。
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const allowed = new Set(['--source', '--edition', '--output', '--report']);
for (let i = 0; i < args.length; i += 2) {
  if (!allowed.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || args.indexOf(args[i]) !== i) {
    console.error('FAIL: 參數須為 --source / --edition / --output / --report 與其值；不支援強制覆寫。');
    process.exit(2);
  }
}
const getArg = flag => { const i=args.indexOf(flag); return i>=0 ? args[i+1] : undefined; };
const sourceArg=getArg('--source');
const edition=getArg('--edition');
if (!sourceArg || !edition || !/^\d{4}_\d{8}$/.test(edition)) {
  console.error('用法：node tools/import-idioms.mjs --source <本機完整官方JSON路徑> --edition 2020_20260929 [--output <新JSON路徑>] [--report <新報告路徑>]');
  process.exit(2);
}
const dest=resolve(getArg('--output') || resolve(root,'data/idioms_500.json'));
const report=resolve(getArg('--report') || (getArg('--output')
  ? resolve(dirname(dest), `${basename(dest, extname(dest))}.IMPORT_REVIEW.md`)
  : resolve(root,'data/IMPORT_REVIEW.md')));
const pathKey = path => process.platform === 'win32' ? path.toLowerCase() : path;
if (pathKey(dest) === pathKey(report)) {
  console.error('FAIL: JSON 與報告不可使用同一路徑。');
  process.exit(2);
}
for (const path of [dest, report]) {
  if (existsSync(path)) {
    console.error(`FAIL: 拒絕覆寫既有檔案：${path}；請用 --output / --report 指定新版本路徑。`);
    process.exit(1);
  }
  if (!existsSync(dirname(path))) {
    console.error(`FAIL: 輸出目錄不存在：${dirname(path)}；請先建立目錄。`);
    process.exit(1);
  }
}
const chosen=JSON.parse(readFileSync(resolve(root,'data/idioms_500_selection.json'),'utf8'));
const parsed=JSON.parse(readFileSync(resolve(sourceArg),'utf8'));
const rows=Array.isArray(parsed)?parsed:(parsed.idioms ?? parsed.items ?? parsed.data);
if (!Array.isArray(rows)) throw new Error('無法辨識資料格式：來源須為成語資料陣列，或有 idioms/items/data 陣列。');
const dictionary=new Map();
for(const row of rows){
  const idiom=row['成語'] ?? row.idiom ?? row.title;
  if(typeof idiom!=='string')continue;
  const previous=dictionary.get(idiom);
  const isMain=row['主條成語／非主條成語']==='主條成語';
  if(!previous || (isMain && previous['主條成語／非主條成語']!=='主條成語'))dictionary.set(idiom,row);
}
const phoneticRegex=/˙?[ㄅ-ㄩ]+[ˊˇˋ]?/gu;
function obtainZhuyin(raw){
  if(typeof raw!=='string'||!raw.trim())return {main:[],alternatives:[],error:'注音缺漏'};
  // 保留原始注音欄；只為逐字 HUD 在執行時產生 4 格讀音。
  // 官方可有「（變）」「（一）」「（二）」多組讀音。超過 4 音節時一律標記需教師複核。
  const sounds=[...raw.matchAll(phoneticRegex)].map(x=>x[0]);
  if(sounds.length<4 || sounds.length%4!==0)return {main:sounds.slice(0,4),alternatives:[],error:`解析得到 ${sounds.length} 音節，非四的倍數`};
  const groups=[]; for(let i=0;i<sounds.length;i+=4)groups.push(sounds.slice(i,i+4));
  return {main:groups[0],alternatives:groups.slice(1),error:null};
}
const errors=[];const reviews=[];const items=[];
for (const candidate of chosen.items){
  const row=dictionary.get(candidate.idiom);
  if(!row){errors.push(`${candidate.id} ${candidate.idiom}: 詞目在此版本找不到`);continue;}
  const rawZhuyin=row['注音'] ?? row.zhuyin;
  const z=obtainZhuyin(rawZhuyin);
  if(z.error){errors.push(`${candidate.id} ${candidate.idiom}: ${z.error}`);continue;}
  const meaningName=['用法說明-語義說明','用法-語意說明','釋義'].find(k=>typeof row[k]==='string'&&row[k].trim());
  if(!meaningName){errors.push(`${candidate.id} ${candidate.idiom}: 缺少可直接引用的完整字串釋義`);continue;}
  const definition=row[meaningName];
  const needsReview=z.alternatives.length>0||/[＆＃◎△※]/u.test(definition);
  items.push({
    id:candidate.id,
    idiom:candidate.idiom,
    zhuyin:z.main,
    definition,
    difficulty:candidate.suggestedStage==='國小'?2:candidate.suggestedStage==='國中'?3:5,
    source:'moe-idioms-public-dictionary',
    sourceEntryId:row['編號']??null,
    sourceEdition:edition,
    sourceMeaningField:meaningName,
    originalZhuyin:rawZhuyin,
    alternativeZhuyin:z.alternatives,
    suggestedStage:candidate.suggestedStage,
    textbookEvidence:candidate.textbookEvidence,
    linguisticReview:'pending',
    requiresPronunciationReview:needsReview,
  });
  if(needsReview) reviews.push(`${candidate.id} ${candidate.idiom}: 變讀或釋義含官方分組記號，需教師確認呈現方式`);
}
if(errors.length){
  console.error(`無法輸出正式遊戲 JSON，錯誤 ${errors.length} 筆`);
  for(const error of errors) console.error('ERROR',error);
  process.exit(1);
}
if(items.length!==500 || new Set(items.map(x=>x.idiom)).size!==500)throw new Error('正式資料不滿500條或存在重複詞目');
const out={
  schemaVersion:1,
  count:500,
  sourceEdition:edition,
  legalAttribution:'教育部《成語典》，姓名標示－禁止改作3.0臺灣（CC BY-ND 3.0 TW）；原始注音及語義欄未改作。',
  linguisticReviewStatus:'PENDING',
  textbookValidationStatus:'NOT_VERIFIED',
  items
};
const reportText='# 成語資料匯入待審核報告\n\n'+
  `資料版號：${edition}；成功匯入：500 筆；需特別審核：${reviews.length} 筆。\n\n`+
  '提醒：所有500條仍須教師核對臺灣正音與語意；此報告不是逐版課本收錄證明。\n\n'+
  reviews.map(x=>'- '+x).join('\n')+'\n';
let createdData = false;
try {
  // Exclusive creation also protects against a file appearing after preflight.
  writeFileSync(dest,JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  createdData = true;
  writeFileSync(report,reportText,{encoding:'utf8',flag:'wx'});
} catch (error) {
  // Remove only the new JSON created by this invocation, never a prior file.
  if (createdData) unlinkSync(dest);
  console.error(`FAIL: 無法建立匯入產物，未覆寫既有檔案：${error.message}`);
  process.exit(1);
}
console.log(`資料成功匯入：${dest}`);
console.log(`保留原注音與原釋義；特別待審核 ${reviews.length} 筆。請先完成語文審查，切勿標示為正式上線資料。`);
