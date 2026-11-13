export function classifyContact(world,event,nextIndex){
  const a=world.bodies.find(x=>x.id===event.a),b=world.bodies.find(x=>x.id===event.b);
  if(!a?.active||!b?.active||event.stepId!==world.stepId)return null;
  const other=a.kind==='player'?b:b.kind==='player'?a:null;
  if(!other)return null;
  return {body:other,correct:other.kind.startsWith('target')&&other.charIndex===nextIndex};
}
export function progressView(idiom,nextIndex){
  return Array.from(idiom.idiom).map((char,charIndex)=>({char,charIndex,zhuyin:idiom.zhuyin[charIndex],
    status:charIndex<nextIndex?'COMPLETED':charIndex===nextIndex?'CURRENT':'PENDING'}));
}
