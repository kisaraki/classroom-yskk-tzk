import {loadDraft,saveDraft,exportDraft,importDraft,playableItems,changeItem} from './editor-store.js?v=20261115.4';
export function mountEditor({base,onChange}){
 const $=id=>document.getElementById(id),dialog=$('idiom-editor');
 let rows=[],selected=null,dirty=false,ready=false,storedRaw=null;
 const message=text=>{$('editor-message').textContent=text;};
 function changed(){onChange(playableItems(rows));render();}
 function reload(){try{storedRaw=localStorage.getItem('guanyin-idiom-editor-v1');rows=loadDraft(localStorage,base);ready=true;changed();message('資料僅儲存在此瀏覽器；請定期匯出備份。');}catch(e){ready=false;onChange(null);message('無法讀取編修資料：'+e.message+'。可匯入有效備份或恢復原始題庫。');}}
 function commit(next){try{if(localStorage.getItem('guanyin-idiom-editor-v1')!==storedRaw)throw Error('其他分頁已修改資料，請重新開啟編修模式。');rows=saveDraft(localStorage,next);storedRaw=localStorage.getItem('guanyin-idiom-editor-v1');ready=true;changed();message('已儲存於此瀏覽器，下次開始挑戰時套用。');return true;}catch(e){message('儲存失敗，原資料未變更：'+e.message);return false;}}
 function mayLeave(){return !dirty||confirm('表單尚未儲存，確定捨棄這次修改？');}
 function select(item){selected=item?.id??null;dirty=false;$('edit-word').value=item?.idiom??'';$('edit-definition').value=item?.definition??'';$('edit-source').value=item?.source??'';$('edit-difficulty').value=item?.difficulty??3;$('edit-frozen').checked=item?.frozen??false;for(let i=0;i<4;i++)$('edit-sound-'+i).value=item?.zhuyin[i]??'';$('edit-heading').textContent=item?'修改成語':'新增成語';$('edit-delete').disabled=!item;$('edit-save').disabled=!ready;}
 function render(){
  const query=$('editor-search').value.trim(),filter=$('editor-filter').value;
  const matches=rows.filter(x=>(!query||x.idiom.includes(query)||x.definition.includes(query))&&(filter==='all'||(filter==='frozen')===x.frozen));
  $('editor-count').textContent=`總共 ${rows.length} 條 · 可使用 ${playableItems(rows).length} 條 · 凍結 ${rows.filter(x=>x.frozen).length} 條 · 搜尋結果 ${matches.length} 條`;
  $('editor-list').replaceChildren();
  for(const row of matches){const button=document.createElement('button');button.type='button';button.className='editor-row';button.textContent=`${row.idiom}　${row.frozen?'❄ 凍結':'可使用'} · 難度 ${row.difficulty}`;button.onclick=()=>{if(mayLeave())select(row);};$('editor-list').append(button);}
  if(!matches.length){const text=document.createElement('p');text.textContent='沒有符合條件的成語。';$('editor-list').append(text);}
 }
 $('edit-form').oninput=()=>{dirty=true;};
 $('edit-form').onsubmit=e=>{e.preventDefault();if(!ready)return;try{
  const item={id:selected??'local-'+crypto.randomUUID(),idiom:$('edit-word').value.trim(),zhuyin:Array.from({length:4},(_,i)=>$('edit-sound-'+i).value.trim()),definition:$('edit-definition').value.trim(),source:$('edit-source').value.trim(),difficulty:Number($('edit-difficulty').value),frozen:$('edit-frozen').checked};
  if(commit(changeItem(rows,item)))select(item);
 }catch(error){message(error.message);}};
 $('edit-new').onclick=()=>{if(mayLeave())select(null);};
 $('edit-delete').onclick=()=>{if(!selected)return;const word=rows.find(x=>x.id===selected)?.idiom;if(confirm(`確定刪除「${word}」？可先匯出備份，或改用凍結暫停出題。`)&&commit(rows.filter(x=>x.id!==selected)))select(null);};
 $('editor-search').oninput=render;$('editor-filter').onchange=render;
 $('editor-close').onclick=()=>{if(mayLeave()){dirty=false;dialog.close();}};
 dialog.addEventListener('cancel',e=>{if(!mayLeave())e.preventDefault();else dirty=false;});
 $('editor-export').onclick=()=>{try{if(!ready)throw Error('請先載入有效題庫');const url=URL.createObjectURL(new Blob([exportDraft(rows)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='觀中成語編修備份-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('已匯出已儲存的題庫備份；未儲存表單不包含在內。');}catch(e){message(e.message);}};
 $('editor-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('備份檔過大');const next=importDraft(await file.text());if(confirm(`匯入 ${next.length} 條成語將取代此瀏覽器目前的題庫及未儲存表單，是否繼續？`)&&commit(next))select(null);}catch(error){message('匯入失敗：'+error.message);}finally{e.target.value='';}};
 $('editor-reset').onclick=()=>{if(confirm('恢復網站原始題庫？此瀏覽器的新增、修改、刪除及凍結設定都會被取代，請先匯出備份。')&&commit(base))select(null);};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 window.addEventListener('storage',e=>{if(e.key==='guanyin-idiom-editor-v1'){ready=false;onChange(null);$('edit-save').disabled=true;message('其他分頁已修改題庫，請關閉後重新開啟編修模式，以免覆蓋。');}});
 reload();select(null);
 return {open(){reload();select(null);dialog.showModal();},refresh:reload};
}
