# 工作包 2.1 修正與驗證紀錄

日期：2026-11-13（Asia/Taipei）
範圍：修正工作包分析指出的四項缺口；不執行遊戲 M1–M5，也不發布網站。
狀態：工作包修正 DONE；遊戲、正式資料、實機與遠端部署未完成。

## M0 本地盤點

- 工作目錄：`C:\Users\Adolf\OneDrive\桌面\WorkSpace\classroom-yskk-tzk`。
- 修改前只有 `codex-workpack/`，38 個檔案；沒有 index.html、assets、根目錄 data/tests 或根目錄 AGENTS.md。
- `git status --short` 與 `git branch --show-current` 均回報 not a git repository；沒有可記錄的本地分支或 Git diff。遠端預設分支、權限與 Pages 設定為 UNKNOWN，本次未查詢／變更遠端。
- 保留執行環境提供的安裝指示；需要 Python YAML 格式檢查時使用 uv 暫存環境，未新增工作包執行依賴。
- 修改前 `verify-workpack.mjs` 通過；前一輪基準測試為 11/11。
- 原包備份：工作目錄 `.workpack-backups/codex-workpack-before-fix-20261113-201537.zip`。備份目錄已加入供合併用的 ROOT_GITIGNORE_SNIPPET.txt，未建立或覆蓋根目錄 Git 設定。

## 變更內容與檔案

1. 背景暫停：`contracts/state-machine.json` 升至契約 v2，加入 READY／IDIOM_CLEAR 的暫停及各狀態有條件恢復；保存 resumeState、禁止背景倒數／切題直接進 PLAYING。同步 `docs/ARCHITECTURE.md`、`contracts/README.md`。
2. 簽核綁定：新增 `tools/lib/review-content.mjs`、唯讀 `tools/review-fingerprint.mjs`；`tools/validate-idioms.mjs` 對 APPROVED 資料核對 content_sha256，並拒絕無效日曆日期及非物件頂層。`data/idiom_linguistic_review.csv` 僅增加空白 content_sha256 欄；500 筆真實簽核保持空白。同步 `docs/DATA_GOVERNANCE.md`、`data/README.md`。
3. 發布檢查：新增 `tools/check-release.mjs`，要求入口、正式題庫、對應審核表及遊戲測試；嚴格資料驗證通過後才執行遊戲測試。測試失敗／skipped／todo 均拒絕。`docs/CI_WORKFLOW_TEMPLATE.yml` 加入 v* 標籤及手動 release-check，與一般開發 verify 分開；同步 `docs/GITHUB_PAGES_AND_CI.md`。
4. 匯入保護：`tools/import-idioms.mjs` 支援 --output／--report，預檢並以 wx 獨占建立新檔，拒絕覆寫任何既有輸出；報告建立失敗時撤回本次新建 JSON。無強制覆寫選項。
5. 回歸測試：新增 `tests/import.test.mjs`、`tests/pause-contract.test.mjs`、`tests/review-binding.test.mjs`、`tests/release-gate.test.mjs`、`tests/helpers/fixtures.mjs`。合成資料與簽核只存在 OS 暫存測試目錄，測試結束移除；不作正式資料或人工審核證據。
6. 導讀與交付：更新 `START_HERE.md`、`docs/IMPLEMENTATION_PLAN.md`、`docs/ACCEPTANCE_MATRIX.md`、`docs/DECISIONS.md`、`tools/verify-workpack.mjs` 必要檔案清單與 `BUNDLE_MANIFEST.json`；加入本報告。既有遊戲任務及實機驗收未因此勾選通過。

## 實際驗證

環境：Windows PowerShell、Node.js v26.13.0。以下命令從工作目錄執行。

| 命令／檢查 | 實際結果 |
|---|---|
| `node codex-workpack/tools/validate-selection.mjs` | PASS；500 條、唯一、附錄一致 |
| `node codex-workpack/tools/verify-workpack.mjs` | PASS；必要檔案、關卡參數及三份 CSV 列數符合 |
| `node --test codex-workpack/tests/*.test.mjs` | 44/44 PASS；0 fail、0 skipped、0 todo |
| `node codex-workpack/tools/check-release.mjs` | 預期 exit 1；缺 index.html、正式 JSON、根目錄審核表與遊戲測試，未誤報可發布 |
| 使用 uv 暫存環境的 PyYAML 解析 CI 範本 | PASS；workflow_dispatch、release-check、needs: verify 均存在且 YAML 可解析 |
| 對照修正前 Manifest 的 SHA-256 | CODEX_SPEC.md、levels.json、候選 JSON/CSV、教材表及文字詞目清單均完全未變 |
| 真實語文審核表 | 500 列；三項簽核、人員、日期、content_sha256 全部空白 |

新測試實際涵蓋：成功匯入與多讀音、缺詞／缺釋義／不完整注音拒絕、輸出及報告保留位元組、匯入重跑／寫入失敗、暫停／手動恢復原狀態、舊內容簽核失效、雜湊工具唯讀、發布缺檔／待審／失敗／跳過／TODO 測試拒絕。發布通過案例使用明確標示的合成專案，只驗證檢查工具能執行並傳遞結果。

## 未完成邊界

- 產品規格仍為 v1.3；五關時限、題數、物件數與色碼差異：無。
- 沒有正式來源匯入、真實語文簽核或官方授權的新增核驗；沒有可玩的遊戲及 iPadOS／Android 實測。
- CI 僅修正範本並做本地 YAML／契約檢查，未於 GitHub Actions 執行；Node 20 的 CI 環境未在本機重現。
- check-release 是工程守門，不能判斷測試內容是否充分、人工審核是否真實，也無法攔截繞過它的手動部署。實際發布工作流仍須依文件接入並完成完整驗收。
- SHA-256 是內容版本連結，並非審核者數位簽章；舊簽核缺雜湊時需先確認原審內容，不能直接自動補登。

下一步：在實際 Git 工作樹確認整合與 Pages 設定，按既定 M0–M5 計畫實作遊戲；正式資料及裝置驗收另行完成。
