# 架構藍圖與模組契約（工程導引；以 `CODEX_SPEC.md` 為準）

## 1. 執行邊界

- 正式網站：專案根目錄 `index.html`，透過瀏覽器原生 ES Modules 啟動，GitHub Pages 可直接提供檔案，不得有 runtime server 或 build output 依賴。
- 開發工具：Node.js 20+ 可用於測試／校驗；不得把 Node.js 特有 API 放入瀏覽器模組。
- 正式資料：根目錄 `data/idioms_500.json`；工作包的 `codex-workpack/data/idioms_500_selection.json` 是**候選清單**。不可把後者當成前者。
- 所有靜態路徑為相對路徑，禁止從 `/assets`、`/data` 等站台根路徑讀取。使用 `new URL('./...', import.meta.url)` 或相對於 HTML 的路徑時應測試 Pages 專案子路徑。
- 若根目錄已有現成模組或測試框架，優先在不改變功能的前提下整合，勿生出兩套同功能的實作。

## 2. 建議目錄（不是必須覆蓋的樣板）

```text
index.html
README.md
assets/css/style.css
assets/js/main.js           # Bootstrap、RAF、初始化、畫面切換
assets/js/config.js         # 五關 immutable config、物理係數
assets/js/state.js          # 狀態機、記錄、時間、A/R/P
assets/js/idioms.js         # 500 題載入及一次19題無重複選題
assets/js/physics.js        # 純計算物理（不依賴 DOM）
assets/js/collision.js      # 圓形碰撞回報、字序規則
assets/js/input.js          # 感測器、校準、搖桿、鍵盤測試
assets/js/renderer.js       # Canvas 場地、球、支柱、動畫
assets/js/keyboard.js       # 首頁內建虛擬鍵盤
assets/js/ui.js             # HUD、提示、對話框、aria-live
data/idioms_500.json        # 審核合格後才交付正式題庫
data/keyboard-presets.json  # 僅通用字／示範名稱
... 既有檔案與其他測試（不得覆蓋）
codex-workpack/             # 本開發工作包
```

## 3. 統一資料契約

**LevelConfig**（鏡像：`contracts/levels.json`）：

```js
{
  level: 1, color: '#2E7D32', durationSeconds: 240, idiomsRequired: 2,
  targetPosts: 4, targetBalls: 0, distractorPosts: 2, distractorBalls: 0
}
```

`Object.freeze` 或不可變資料流；建議在 runtime 啟動時校驗五關（色碼／秒數／物件數），嚴禁從顯示層修改。

**PhysicsBody**：

```js
{
  id: 'unique-id', kind: 'player|targetPost|targetBall|distractorPost|distractorBall',
  x: 0, y: 0, vx: 0, vy: 0, radius: 22, mass: 1, inverseMass: 1,
  restitution: 0.75, char: '守', charIndex: 0, active: true
}
```

- 固定支柱 `inverseMass=0` 且位置不變；普通球質量正值；主球是唯一 `kind='player'`。
- 目標球／柱 `charIndex` 必為 `0..3`，同字重複不能共用同一 ID；干擾物不應擁有目標字序。
- 物件初始配置不得重疊，採有限次嘗試加確定性備援；球與牆碰撞必須解法向速度與重疊，避免卡牆。

**IdiomState**：

```js
{
  currentIdiomId: 'I0375', currentIdiomIndex: 0,
  nextIndex: 0,                         // 已完成的字數，範圍 0..4
  selectedIdiomIds: [],                  // 每次完整遊戲 19 題不重複
  remainingSeconds: 240,
  attemptsUsedThisLevel: 0,             // 0..3
  levelSeed: 123456,                     // A 重試可重現題組與佈局
  mistakes: 0
}
```

**碰撞判定回報**：物理引擎應回報穩定且可去重的 `begin-contact`（含兩物件 ID、法線、stepId）。規則層只接受「主球 vs 本題 `charIndex===nextIndex` 目標物件」的合法首次接觸；其他球相撞不得計入。每固定步最多吸收一字。物理引擎不能直接寫 DOM 或 HUD。

**字卡衍生狀態**：`nextIndex` 唯一真相。`i < nextIndex -> COMPLETED`、`i === nextIndex && nextIndex < 4 -> CURRENT`、其餘 `PENDING`。不得在 UI 另設可漂移的 `completedWords` 陣列。四字完成時 `nextIndex===4`，狀態全 `COMPLETED`。

## 4. 狀態機與更新次序

狀態列於 `contracts/state-machine.json`，正式裁決仍依規格 §1。推薦單一 `dispatch(action)`：

1. `BOOT` → `HOME`：取得可用題庫與設定。
2. 點擊 Start：**先同步發起**感測器權限請求與全螢幕請求（若可），隨後才等待 Promise；失敗降級搖桿。
3. `READY`：三秒倒數、不扣該關倒數秒數；倒數結束進 `PLAYING`。
4. `PLAYING`：固定步先執行物理、取得接觸事件、合法命中、完成判定，再倒數／逾時判定。
5. `READY`、`PLAYING`、`IDIOM_CLEAR` 均可因背景／轉向／暫停進入 `PAUSED`，並保存 `resumeState`。所有物理、字序、準備倒數與切題回饋剩餘時間保持不變；前景且橫向時由玩家手動恢復到原狀態，不能一律進 `PLAYING`。恢復時重設 RAF 時間戳及累積器、清空輸入，避免補償背景時間。
6. `IDIOM_CLEAR`：短暫保留四字 `4／4`，原子化切入下一題（物件、字卡、注音、釋義一併重設）。
7. `LEVEL_CLEAR`：達到條數→下一關 `READY`；第五關→`GAME_CLEAR`。
8. `LEVEL_FAILED`：秒數用盡、禁止繼續物理；玩家可在尚有 A 次數時重開本關，或 R 全部重來。
9. `R`／`A`：**先確認再改狀態**；取消不得扣次數。R 重新選 19 題；A 必須重現同關初始 seed。

關於 120 Hz 的秒數：使用累積的固定 `dt` 作為正式遊戲內時間，避免頁面長時間背景時暗扣；渲染幀率 30／60／120 Hz 不得導致物理速度比例變化。每影格最多模擬合理子步數；背景／變更方向應先自動暫停。

`contracts/state-machine.json` v2 中，`when` 是 context 欄位的嚴格相等條件，`set` 是轉移後套用的 context 更新。沒有符合的轉移就保持原狀態；`pageVisible`／`landscape` 由平台事件更新，單純回前景不派送 `USER_RESUME`。重複背景事件不得覆寫 `resumeState`；R/A 成功重置則清除它。準備及切題計時器只累積有效前景時間，取消舊 callback，不能以背景仍會完成的裸 `setTimeout` 推進。權限請求在背景完成時先保留結果，待玩家前景橫向操作才進 `READY`。契約測試只驗證這份轉移表，網站仍須完成實際計時及生命週期測試。

## 5. 物理及輸入介面建議

| 模組 | 供應介面（可依現況改名並註明） | 禁止依賴 |
|---|---|---|
| `physics` | `createWorld(seed, objects)`, `step(world, dt, gravity)`, `getContacts(world)` | DOM、Canvas、navigator |
| `collision` | `classifyContact(state, event)`, `resolveIdiomHit(state, event)` | UI DOM、計時器 |
| `state` | `dispatch(action)`, `getSnapshot()`, `createProgressView()` | 直接更動 Canvas 物件 |
| `idioms` | `validateIdiom(item)`, `choose19(items, seed)`, `levelSlice()` | 網路分析 API |
| `input` | `requestOnStartGesture()`, `setMode()`, `recalibrate()`, `getGravityVector()` | 直接變更主球位置 |
| `renderer` | `draw(world, effectState)`, `resize()` | 變更物理／字序 |
| `ui` | `renderHUD(snapshot)`, `showModal()`, `showFeedback()` | 自行維護第二份完成字序 |
| `keyboard` | `setValue()`, `applyKey()`, `getValue()`, `isValid()` | 對外傳送姓名 |

## 6. 控制與平台例外

- `DeviceOrientationEvent.requestPermission` 是條件式 API；不得直接假設所有 iPad 或 Android 均存在。
- Safari 可能無法進入真正瀏覽器全螢幕，不能把全螢幕成功作為 Start 的前置條件。
- `deviceorientation`／`devicemotion` 需處理 null 值、無值逾時與方向座標轉換。只有一個作用向量可驅動世界，不同輸入不加總。
- 虛擬搖桿使用 Pointer Events，支援多指、指標捕捉、失去焦點清零；桌機 WASD／方向鍵只為測試輔助。
- `visibilitychange`、`pagehide`、方向變更會暫停；系統級手勢不能以 CSS 保證完全禁止。

## 7. 資安、隱私及可用性

- 只在這次遊戲會話中處理玩家名稱；不發請求或遠端保存姓名／座號，不在 Console log 輸出可識別姓名。
- 不能 `innerHTML = userInput`；以 `textContent` 呈現，必要時限制字素長度 1–16。
- 首頁虛擬鍵盤不要求實體鍵盤；大觸控區不小於 48 CSS px；色彩不作唯一辨識。
- HUD 字卡保持 ①~④ 四格，注音與成語每一字對齊；`aria-live` 僅於狀態改變時觸發。
- 資料缺漏時應顯示錯誤且不可開始正式遊戲；不得以四字詞目候選清單偷偷取代正式資料。

## 8. 版本與整合

若實作途中需要調整技術選型或新增檔案，請在 `docs/DECISIONS.md` 記錄決策，不得變更規格 §2 的固定值。完工時必須附實際執行紀錄與實機驗證狀態。
