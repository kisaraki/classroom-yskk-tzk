import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=fileURLToPath(new URL('..',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.pdf':'application/pdf'};
const within=(base,file)=>{const rel=relative(base,file);return rel!==''&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('../')&&!rel.startsWith('..\\');};
export function createLocalServer({base=projectRoot,preview=null}={}){
 base=resolve(base);
 return createServer(async(req,res)=>{try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  // Validate before URL normalization can erase traversal segments.
  let path=decodeURIComponent((req.url||'/').split('?')[0]);
  if(!path.startsWith('/')||/[\\\u0000-\u001f:]/u.test(path)||path.split('/').some(p=>p==='.'||p==='..'))throw new Error('Invalid path');
  if(path.startsWith('/classroom-yskk-tzk/'))path=path.slice('/classroom-yskk-tzk'.length);
  let file;
  if(path==='/__preview/idioms.json'&&preview)file=resolve(preview);
  else{
   if(path==='/')path='/index.html';
   const parts=path.slice(1).split('/');
   if(parts.some(p=>!p||p.startsWith('.')||p.startsWith('_')))throw new Error('Private path');
   if(path!=='/index.html'&&!['assets','data'].includes(parts[0]))throw new Error('Not public');
   file=await realpath(resolve(base,...parts));
   // Junctions and symlinks must not escape the allowed public directory.
   if(!within(path==='/index.html'?base:resolve(base,parts[0]),file))throw new Error('Outside public directory');
  }
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':(types[extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end(req.method==='HEAD'?undefined:'Not found');}});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);let port=4173,preview=null;
 try{
  for(let i=0;i<args.length;i++){
   const key=args[i],value=args[++i];if(!value||value.startsWith('--'))throw new Error(`缺少參數：${key}`);
   if(key==='--port')port=Number(value);else if(key==='--preview-data')preview=resolve(value);else throw new Error(`未知參數：${key}`);
  }
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('port 必須為1至65535的整數');
  if(preview)await readFile(preview);
  const server=createLocalServer({preview});
  server.on('error',error=>{console.error(`無法啟動本地預覽（${error.code}）；請確認埠未被使用，或用 --port 指定其他埠。`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/${preview?'?preview=1':''}`));
 }catch(error){console.error(`無法啟動：${error.message}`);process.exitCode=1;}
}
