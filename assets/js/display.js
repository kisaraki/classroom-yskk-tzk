// Browsers can reject the initial attempt until a real user click.
export async function requestDisplay(host=globalThis,timeoutMs=2000){
 const bounded=async action=>{
  let timer;
  try{return await Promise.race([Promise.resolve(action()).then(()=>true,()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})]);}
  catch{return false;}finally{clearTimeout(timer);}
 };
 const doc=host.document,root=doc?.documentElement;
 const full=root?.requestFullscreen||root?.webkitRequestFullscreen;
 if(!doc?.fullscreenElement&&!doc?.webkitFullscreenElement&&full)await bounded(()=>full.call(root));
 const orientation=host.screen?.orientation;
 const locked=typeof orientation?.lock==='function'?await bounded(()=>orientation.lock('landscape')):false;
 return {fullscreen:Boolean(doc?.fullscreenElement||doc?.webkitFullscreenElement),locked};
}
