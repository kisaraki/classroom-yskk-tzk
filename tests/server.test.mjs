import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {request} from 'node:http';
import {once} from 'node:events';
import {createLocalServer} from '../tools/serve.mjs';

test('HTTP preview isolates private paths, junctions and preview data',async()=>{
  const base=await mkdtemp(join(tmpdir(),'idioms-http-'));let server;
  try{
    for(const dir of ['assets','data','_reference'])await mkdir(join(base,dir));
    await writeFile(join(base,'index.html'),'home');await writeFile(join(base,'assets','main.js'),'export {};');
    await writeFile(join(base,'_reference','private.json'),'private-source');await writeFile(join(base,'preview.json'),'pending-fixture');
    await symlink(join(base,'_reference'),join(base,'assets','linked'),'junction');
    server=createLocalServer({base,preview:join(base,'preview.json')});server.listen(0,'127.0.0.1');await once(server,'listening');
    const get=(path,method='GET')=>new Promise((resolve,reject)=>{
      const req=request({host:'127.0.0.1',port:server.address().port,path,method},res=>{
        let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
      });req.on('error',reject);req.end();
    });
    assert.equal((await get('/')).body,'home');
    assert.equal((await get('/classroom-yskk-tzk/assets/main.js')).status,200);
    assert.equal((await get('/classroom-yskk-tzk/__preview/idioms.json')).body,'pending-fixture');
    const head=await get('/assets/main.js','HEAD');assert.equal(head.status,200);assert.equal(head.body,'');assert.equal(head.headers['content-type'],'text/javascript; charset=utf-8');
    for(const path of ['/_reference/private.json','/preview.json','/index.html.backup','/assets/../_reference/private.json','/assets/%2e%2e/_reference/private.json','/assets/%2e%2e%5c_reference%5cprivate.json','/assets/linked/private.json','/assets/.hidden','/assets/main.js:secret','/%E0%A4%A','//assets/main.js'])assert.equal((await get(path)).status,404,path);
    assert.equal((await get('/','POST')).status,405);
    await new Promise(resolve=>server.close(resolve));server=null;
    server=createLocalServer({base});server.listen(0,'127.0.0.1');await once(server,'listening');
    assert.equal((await get('/__preview/idioms.json')).status,404);
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    assert.equal(dirname(resolve(base)),resolve(tmpdir()));
    await rm(base,{recursive:true,force:true});
  }
});
