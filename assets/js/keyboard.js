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
  let value='',mode='latin';const display=document.querySelector('#player-name'),counter=document.querySelector('#name-length');
  function renderValue(){display.textContent=value||'點選下方鍵盤輸入';display.classList.toggle('empty',!value);counter.textContent=`${graphemes(value).length}/16`;onChange(value);}
  function button(label,action,className=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',action);return b;}
  function keys(){root.replaceChildren();
    const list=mode==='latin'?Array.from('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ-'):presets.commonCharacters;
    for(const key of list)root.append(button(key,()=>{value=editName(value,key);renderValue();}));
    root.append(button('空白',()=>{value=editName(value,'space');renderValue();},'key-wide'),button('⌫ 刪除',()=>{value=editName(value,'delete');renderValue();},'key-wide'),button('清除',()=>{value='';renderValue();},'key-wide'));
  }
  for(const tab of document.querySelectorAll('[data-keyboard-mode]'))tab.addEventListener('click',()=>{
    mode=tab.dataset.keyboardMode;for(const t of document.querySelectorAll('[data-keyboard-mode]'))t.setAttribute('aria-selected',String(t===tab));keys();
  });
  const names=document.querySelector('#preset-names');for(const name of presets.presetNames)names.append(button(name,()=>{value=graphemes(name).slice(0,16).join('');renderValue();},'preset'));
  keys();renderValue();return {getValue:()=>value.trim()};
}
