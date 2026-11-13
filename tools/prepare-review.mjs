// Produces a private reading packet only. Never changes data or fills approvals.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {validateDataset} from '../assets/js/idioms.js';
import {contentHash} from '../codex-workpack/tools/lib/review-content.mjs';

try{
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--data'||args[2]!=='--output')throw new Error('用法：node tools/prepare-review.mjs --data <待審JSON> --output <新的私人Markdown路徑>');
  const input=resolve(args[1]),output=resolve(args[3]);
  if(input===output)throw new Error('輸出不能覆寫題庫');
  const raw=readFileSync(input),data=JSON.parse(raw.toString('utf8'));validateDataset(data,{preview:true});
  const {items,...metadata}=data;
  const code=value=>JSON.stringify(value,null,2).replaceAll('`','\\u0060');
  const lines=['# 語文核校閱讀包（未簽核）','',
    `題數：${items.length}；特別待審：${items.filter(x=>x.requiresPronunciationReview).length}。`,
    `輸入檔案 SHA-256：${createHash('sha256').update(raw).digest('hex')}`,'',
    '這份文件只呈現現有資料與內容指紋，不代表正音、語義或授權已通過。所有審查勾選、姓名、日期及簽核雜湊均須由實際核校者填寫。',
    '先閱讀共用中繼資料，再逐題核對四字注音、變讀、原始釋義、來源及完整內容。若修改共用中繼資料，全部題目的指紋會改變；不可沿用舊簽核。',
    '參考 docs/DATA_SOURCE_RESEARCH.md 與 codex-workpack/docs/DATA_GOVERNANCE.md。需特別審查的條目列於最前，ID及原資料不變。','',
    '## 共用中繼資料','```json',code(metadata),'```',''];
  for(const item of [...items].sort((a,b)=>Number(!!b.requiresPronunciationReview)-Number(!!a.requiresPronunciationReview)||a.id.localeCompare(b.id))){
    lines.push(`## ${item.id} ${item.idiom}${item.requiresPronunciationReview?' — 特別待審':''}`,'',
      `待核對版本指紋（非簽核）：${contentHash(data,item)}`,'',
      '```json',code(item),'```','',
      '- [ ] 逐字注音及變讀已核對','- [ ] 釋義完整性與適用性已核對','- [ ] 來源與授權呈現已核對',
      '核校人：＿＿＿＿　日期：＿＿＿＿　差異與依據：＿＿＿＿','');
  }
  writeFileSync(output,lines.join('\n'),{flag:'wx'});
  console.log(`已產生未簽核閱讀包：${output}（${items.length}條；來源未修改）`);
}catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1;}
