# 成語彈珠臺

原生 ES Modules + Canvas 的五關成語遊戲，無框架、CDN、安裝或建置需求。正式規格為 codex-workpack/CODEX_SPEC.md v1.3。

## 本地啟動

```powershell
node tools/serve.mjs --preview-data ./_reference/idioms_500_pending_2020_20260929.json
```

開啟 http://127.0.0.1:4173/?preview=1 。這是使用官方來源待審資料的本地隔離預覽，仍需500條人工語文核校；不是正式發布。預覽檔不納入公開網站。伺服器僅綁定127.0.0.1，拒絕直接存取工作包、測試、私人來源與隱藏檔。

正式模式：`node tools/serve.mjs`，需要人工核准的 data/idioms_500.json。沒有檔案或未核准時會阻擋 Start。請先遵循工作包資料治理與簽核流程，不能只變更旗標。

## 操作

使用內建鍵盤輸入名稱，按開始。傾斜平板或拖曳左下搖桿；桌機使用方向鍵／WASD。依序碰撞四字，HUD保留已收集文字。P暫停，R確認後全關重來，A確認後本關重試，最多3次。切背景／方向改變會暫停，回來手動繼續。

## 驗證與發布

`node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs`

`node codex-workpack/tools/check-release.mjs`

正式題庫及人工簽核尚未完成，因此發布檢查預期失敗。GitHub 私有倉庫已建立於 https://github.com/kisaraki/classroom-yskk-tzk ，尚未部署；iPadOS、Android實機未測。瀏覽器畫面與感測器方向仍須實際驗收。

所有網站資源使用相對路徑；可用 http://127.0.0.1:4173/classroom-yskk-tzk/?preview=1 驗證專案子路徑。發布時只提供 index.html、assets/ 和已審核 data/，不得包含 _reference、測試夾具或私人備份。


## 核校與交付

人工核校閱讀包已產生於 `_reference/review-20261113/REVIEW_PACKET.md`，對應簽核表維持空白。完整接手步驟、裝置測試與發布前門檻見 [docs/HANDOFF.md](docs/HANDOFF.md)；最新逐項驗收見 [docs/ACCEPTANCE_STATUS.md](docs/ACCEPTANCE_STATUS.md)。

`.github/workflows/idioms-pinball-ci.yml` 已準備本地／遠端開發檢查及嚴格發布檢查；不會自動發布；遠端檢查結果另記於開發紀錄。

## GitHub Pages 平板測試版

依使用者明確指示，倉庫改為公開，gh-pages分支用於平板操作測試；這是先前僅本機預覽規則的指定例外。題庫仍PENDING，網站顯示「平板測試版 · 題庫待核校 · 非正式教學」。main預設正式模式與check-release不變。

以新輸出資料夾準備網站（拒絕覆寫既有目錄）：

```powershell
node tools/stage-tablet-test.mjs --data ./_reference/idioms_500_pending_2020_20260929.json --output ./.local/tablet-pages-next
```

僅將輸出的網站檔案更新到gh-pages分支，不可把專案根目錄整份當作Pages輸出。題庫不改為APPROVED，完整署名與官方授權說明仍須保留。網站部署結果及網址見開發紀錄。
