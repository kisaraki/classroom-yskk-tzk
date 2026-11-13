# GitHub Pages／本地測試與 CI 導引

## 網站部署規則

- 假設 repo 為 `kisaraki/classroom-yskk-tzk`，常見 Pages 專案網址形式為 `https://kisaraki.github.io/classroom-yskk-tzk/`；**這是推導的網址形式，不代表已完成實際發布**。
- 專案入口應位於 Pages 發布來源能讀取的 `index.html`；如目前 repo Pages 採 `/docs` 或 Actions，應先檢視設定再決定整合方式，禁止擅自改變部署方式。
- HTML 使用 `./assets/css/style.css`、`./assets/js/main.js`；後者使用明確相對路徑匯入模組。正式 JSON 以相對於實際網站根目錄的 URL 載入，如 `./data/idioms_500.json`，不要用 `/data/idioms_500.json`。
- 用 fetch 的正式題庫必須提供 `Content-Type` 合理的靜態 JSON 與正確編碼 UTF-8；若未完成資料審核，不可發布空檔或範本冒充。
- 針對 iPadOS Safari，`requestFullscreen` 或 `screen.orientation.lock` 不一定支援；橫向提醒／安全區域／搖桿可降級使用。

## 無建置工具的本地 HTTP 測試

在 repo 根目錄執行任一可用的本地伺服器（**只需其一**）：

```bash
python -m http.server 8000
# 或已安裝 Python 的 Windows 系統
py -m http.server 8000
```

瀏覽 `http://localhost:8000/`。不可只用 `file://` 驗證 ES Modules + fetch。若要驗證真實的 Pages **子路徑**，可將相同檔案用測試 HTTP 伺服器放到名為 `classroom-yskk-tzk` 的子資料夾，開啟 `/classroom-yskk-tzk/`，檢查 Network 無 404；不得為通過測試而改用站台絕對路徑。

## Codex 應完成的自動化測試（網站實作後）

```bash
node codex-workpack/tools/verify-workpack.mjs
node --test codex-workpack/tests/*.test.mjs
node --test tests/*.test.mjs
node codex-workpack/tools/validate-idioms.mjs --data ./data/idioms_500.json --review ./data/idiom_linguistic_review.csv
node codex-workpack/tools/check-release.mjs
```

最後兩項在正式資料尚未核校完成時**預期失敗**；不可把此失敗隱藏、跳過或改造成無條件 PASS。

## 選用 CI

本工作包提供 `docs/CI_WORKFLOW_TEMPLATE.yml`，可在符合倉庫現況且經審核後，複製到根目錄 `.github/workflows/idioms-pinball-ci.yml`；**不會自動發布或幫資料做人工簽核**。若 repo 已有 CI 工作流，應合併而非覆蓋。

- 一般 push/PR：檢查工作包及現有遊戲測試，容許尚未完成正式題庫的開發進度；綠燈不代表可發布。
- 推送 `v*` 標籤，或手動執行 workflow 並保留 `release_check=true`：另跑 `release-check`，依賴前項成功，必須通過 `check-release.mjs`，不得忽略失敗。
- 發布檢查要求網站根目錄 `index.html`、`data/idioms_500.json`、`data/idiom_linguistic_review.csv` 與至少一個 `tests/*.test.mjs`；正式題庫採無 `--allow-pending` 的嚴格驗證，核對全部內容雜湊，再執行遊戲測試；失敗、skipped、todo 都阻擋通過。
- 網站若採既有其他根目錄，可在部署工作流用 `node codex-workpack/tools/check-release.mjs --project-root <網站根目錄>`。其測試及正式資料都必須位於該根目錄。
- 實際部署工作流須以發布檢查成功作為前置條件；本範本不自動啟用 Pages，也無法攔截繞過它的手動發布。測試內容品質、實機、資料審查真實性與授權仍依驗收矩陣另查，不因這項 CLI 通過就標記整案完成。
