export function guideStep(input,calibrated){
 if(input.tiltPending)return 1;
 if(input.mode!=='tilt')return 1;
 if(!input.raw||input.now()-input.lastValid>=2000)return 2;
 return calibrated?4:3;
}
export const GUIDE_STEPS=[
 ['步驟 1／4：開啟感測器授權','按「① 開啟感測器授權」。若跳出動作／方向授權視窗，請選「允許」。已授權時可能不會再詢問。'],
 ['步驟 2／4：確認感測資料','請橫拿平板，輕輕向左右傾斜一下。收到有效資料後會自動進入步驟 3。若一直沒有資料，請重新開啟授權，或改用搖桿。'],
 ['步驟 3／4：平放桌面，校正水平','請將平板橫向、完全平放在平整且水平的桌面上。不要手持，也不要墊高任何一側。保持靜止後，按「③ 已平放桌面，開始校正」。'],
 ['步驟 4／4：校正完成','按「④ 完成引導」。進入遊戲後輕輕傾斜，哪一側壓低，球就往哪側滾；若遊戲已暫停，請再按「繼續」。換握持方向後請重新平放桌面校正。']
];
