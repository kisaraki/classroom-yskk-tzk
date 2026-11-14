# 專案工作規則

元件安裝：Windows 優先 winget，其次官方內建工具；macOS 優先 homebrew；Python 優先 uv，其次 pip。

開始修改前讀取 codex-workpack/START_HERE.md、AGENTS.md、CODEX_SPEC.md 及 docs/IMPLEMENTATION_PLAN.md、ACCEPTANCE_MATRIX.md。規格 v1.3 為權威；網站在根目錄，工作包保持核驗用途。先盤點，不覆蓋原有工作。

保留五關時間 240/210/180/180/150 秒、題數 2/3/4/5/5、指定物件數／色碼及500候選詞。正式題庫需人工核校，不得自填簽核。待審資料只能在 loopback 本地隔離預覽，不得發布；來源存 _reference/。

執行 node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs；正式發布另需 check-release 及實機證據。無 Git 權限或裝置須明記限制，不得宣稱已上線。

## 使用者指定的平板測試部署例外

使用者於本次作業明確要求「啟用 github pages，並提供網址供平板測試」，並選擇將現有倉庫改為公開。允許將現有500條PENDING資料以明確標示的平板操作測試版部署到gh-pages分支；不代表語文核校完成或正式發布核准。main中的SITE_MODE仍為production，只有stage-tablet-test.mjs產出的網站副本使用tablet-test。不得代填簽核；正式check-release守門不變。公開網站僅包含index.html、assets、必要JSON、.nojekyll與測試版README，禁止把_reference、備份、核校表或本機證據放入網站。

## 使用者指定時間調整（2026-11-14）
第一、二關時限依使用者最新要求改為各 200 秒；現行五關為 200/200/180/180/150 秒。原始工作包保留歷史規格，網站及根目錄測試採此明確覆寫，其餘關卡參數不變。
