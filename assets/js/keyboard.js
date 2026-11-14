const segmenter=new Intl.Segmenter('zh-Hant',{granularity:'grapheme'});
export function graphemes(value){return Array.from(segmenter.segment(value),x=>x.segment);}
export function validName(value){const text=value.trim();return text.length>0&&graphemes(text).length<=16;}
export function editName(value,key){
  if(key==='clear')return '';
  if(key==='delete')return graphemes(value).slice(0,-1).join('');
  const candidate=value+(key==='space'?' ':key);return graphemes(candidate).length<=16?candidate:value;
}
export function validatePresets(presets){
  if(!presets||!Array.isArray(presets.commonCharacters)||!presets.commonCharacters.length||
    presets.commonCharacters.some(x=>typeof x!=='string'||graphemes(x).length!==1||!x.trim())||
    !Array.isArray(presets.presetNames)||presets.presetNames.some(x=>typeof x!=='string'||!validName(x)))
    throw new Error('鍵盤設定格式不正確，請檢查設定後重新載入。');
  return presets;
}
export function mountKeyboard(root,presets,onChange){
  validatePresets(presets);
  const field=document.querySelector('#player-name'),counter=document.querySelector('#name-length');
  let composing=false;
  function sync(){
    const letters=graphemes(field.value);
    if(!composing&&letters.length>16)field.value=letters.slice(0,16).join('');
    counter.textContent=graphemes(field.value).length+'/16';
    onChange(composing?'':field.value);
  }
  field.addEventListener('compositionstart',()=>{composing=true;sync();});
  field.addEventListener('compositionend',()=>{composing=false;sync();});
  field.addEventListener('input',sync);
  field.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!composing&&!event.isComposing){event.preventDefault();field.blur();}
  });
  function button(label,action,className=''){
    const b=document.createElement('button');
    b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',action);
    return b;
  }
  function press(key){field.value=editName(field.value,key);sync();}
  for(const key of '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ-')root.append(button(key,()=>press(key)));
  root.append(button('空白',()=>press('space'),'key-wide'),button('⌫ 刪除',()=>press('delete'),'key-wide'),button('清除',()=>press('clear'),'key-wide'));
  const names=document.querySelector('#preset-names');
  for(const name of presets.presetNames)names.append(button(name,()=>{field.value=name;sync();},'preset'));
  sync();return {getValue:()=>field.value.trim()};
}
