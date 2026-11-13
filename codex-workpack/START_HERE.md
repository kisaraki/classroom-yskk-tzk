# 《成語彈珠臺》Codex 開發工作包｜從這裡開始

工作包版本：2.1（2026-11-13）；**產品規格來源維持 `CODEX_SPEC.md` v1.3**。
適用：`kisaraki/classroom-yskk-tzk`，直接部署 GitHub Pages 的純前端平板遊戲。

2.1 修正背景暫停／恢復契約、人工簽核內容雜湊、嚴格發布檢查與匯入拒絕覆寫；五關配置及 500 候選詞目均未變更。變更與本地驗證記錄見 `docs/WORKPACK_FIX_REPORT.md`。

## 這包是什麼

這是供 Codex **實作遊戲** 的完整工程任務包，**不是已完成、可上線的遊戲**。含原始正式需求、500 條固定候選成語、資料匯入腳本、契約、工作拆解、檢核指令及驗收表單。不要把 `codex-workpack/` 當成網站根目錄。網站正式程式應寫在倉庫根目錄（或遵循倉庫現有結構），本工作包保留作為規格與核驗證據。

## 安裝目錄

```text
classroom-yskk-tzk/                   ← GitHub 倉庫根目錄
├── codex-workpack/                   ← 將這個資料夾完整放在這裡
│   ├── START_HERE.md                 ← 本檔
│   ├── AGENTS.md
│   ├── CODEX_SPEC.md                 ← 產品需求唯一權威
│   ├── docs/  contracts/  data/  tools/  tests/
│   └── ...
├── AGENTS.md                          ← 如已存在應合併，不可覆蓋
├── index.html                         ← Codex 後續在根目錄實作
├── assets/  data/  tests/  tools/      ← Codex 後續在根目錄實作
└── ...
```

**Codex 發現規則：** 放在子目錄的 `AGENTS.md` 不保證會被「從專案根目錄啟動」的 Codex 自動讀取。首次請明確指令：

> 請先完整閱讀 `codex-workpack/START_HERE.md`、`codex-workpack/AGENTS.md`、`codex-workpack/CODEX_SPEC.md`，再檢視現有倉庫，依 `codex-workpack/docs/IMPLEMENTATION_PLAN.md` 的 M0→M5 執行；實作在專案根目錄，不要覆寫現有程式或在工作包內建立網站。

也可將 `ROOT_AGENTS_SNIPPET.md` 的內容**合併**到倉庫根目錄既有 `AGENTS.md`（若已有內容必須保留）；該片段並不是要求覆蓋根目錄檔案。

## 優先閱讀順序

1. `AGENTS.md` — 禁止事項、執行流程與回報格式。
2. `CODEX_SPEC.md` — v1.3 全部產品要求，包含五關設定與 500 成語附錄。
3. `contracts/levels.json` — 關卡硬參數的機讀鏡像，以規格書為準。
4. `docs/ARCHITECTURE.md` — 模組、界面、狀態及部署邊界。
5. `docs/IMPLEMENTATION_PLAN.md`、`docs/TASK_BOARD.md` — 建置與交付門檻。
6. `docs/ACCEPTANCE_MATRIX.md`、`docs/QA_DEVICE_MATRIX.md` — 自測與實機核對。
7. `docs/DATA_GOVERNANCE.md`、`data/SOURCES.md` — 注音、釋義、授權、人工作業的未完成界線。
8. `docs/GITHUB_PAGES_AND_CI.md` — 本地 HTTP、GitHub Pages 子路徑與選用 CI。

## 在倉庫根目錄執行（無 npm install）

```bash
node codex-workpack/tools/validate-selection.mjs
node codex-workpack/tools/verify-workpack.mjs
node --test codex-workpack/tests/*.test.mjs
```

若由工作包所在資料夾執行，也可用：

```bash
node tools/validate-selection.mjs
node tools/verify-workpack.mjs
node --test tests/*.test.mjs
```

**正式遊戲資料尚未建立：** `data/idioms_500_selection.json` 是「選詞」而非可直接遊玩的「有注音、釋義題庫」。取得合法官方資料後可依 `docs/DATA_GOVERNANCE.md` 匯入，嚴格驗證須人工簽核通過。不可用造假的 500 條注音或空釋義湊數；也不可將備用測試資料發布。

## 版本裁決

- 本包 `CODEX_SPEC.md` v1.3 為唯一產品需求權威；其他文件是工程實作指南。衝突時，先以規格書裁決並留下紀錄，不可默改需求。
- 五關秒數固定：**240／210／180／180／150**（均已比最初版本增加 120 秒），完成條數：**2／3／4／5／5**，共 19 題 76 字。
- 每題固定四個「保留文字」的 HUD 字卡：`✓ 已完成`／`★ 下一目標`／`○ 未完成`；字序以 `charIndex` 判定。
- 500 條候選詞目不可擅自抽換，**國小 133／國中 201／高中 166** 是建議難度，**不是教科書逐版出處證明**。

## 交付邊界

本工作包沒有自行修改 GitHub 倉庫，也沒有冒稱完成正式資料庫或 iPad／Android 實機測試。倉庫權限不可用時，Codex 應在可存取的工作目錄完成可執行成果並回報待推送步驟，不得虛稱已部署。
