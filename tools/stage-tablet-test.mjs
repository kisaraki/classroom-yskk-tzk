// Explicit, user-authorized test publication. Does not approve formal data.
import {mkdir,readFile,writeFile,copyFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDataset} from '../assets/js/idioms.js';
const base=fileURLToPath(new URL('..',import.meta.url));
try{
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--data'||args[2]!=='--output')throw Error('用法：node tools/stage-tablet-test.mjs --data <待審JSON> --output <新的輸出資料夾>');
 const source=resolve(args[1]),out=resolve(args[3]),raw=await readFile(source),data=JSON.parse(raw);
 validateDataset(data,{preview:true});if(data.count!==500||data.linguisticReviewStatus!=='PENDING')throw Error('測試包須使用500條PENDING資料，不處理正式核准資料');
 await mkdir(out); // Never overwrite an existing publication directory.
 async function copyAssets(from,to){
  await mkdir(to);for(const entry of await readdir(from,{withFileTypes:true})){
   const src=join(from,entry.name),dest=join(to,entry.name);
   if((await lstat(src)).isSymbolicLink())throw Error('拒絕發布符號連結');
   if(entry.isDirectory())await copyAssets(src,dest);else if(entry.isFile())await copyFile(src,dest);
  }
 }
 await copyFile(join(base,'index.html'),join(out,'index.html'));
 await copyAssets(join(base,'assets'),join(out,'assets'));
 await writeFile(join(out,'assets/js/site-config.js'),"export const SITE_MODE='tablet-test';\n");
 await mkdir(join(out,'data'));await copyFile(join(base,'data/keyboard-presets.json'),join(out,'data/keyboard-presets.json'));
 await writeFile(join(out,'data/idioms_tablet_test.json'),raw);
 await writeFile(join(out,'.nojekyll'),'');
 await writeFile(join(out,'README.md'),'# 成語彈珠臺：平板操作測試\n\n此為經專案使用者要求發布的測試網站；500條題庫仍為PENDING，未經人工語文核校，不作正式教學或正式發布驗收。\n\n官方來源與完整授權說明可由遊戲「玩法與來源」查看。玩家名稱僅存在當次瀏覽器記憶體，不上傳。\n');
 console.log(`已準備平板測試網站：${out}；正式核准狀態未修改。`);
}catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1;}
