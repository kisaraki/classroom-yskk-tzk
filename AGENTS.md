# 專案工作規則

元件安裝：Windows 優先 winget，其次官方內建工具；macOS 優先 homebrew；Python 優先 uv，其次 pip。

開始修改前讀取 codex-workpack/START_HERE.md、AGENTS.md、CODEX_SPEC.md 及 docs/IMPLEMENTATION_PLAN.md、ACCEPTANCE_MATRIX.md。規格 v1.3 為權威；網站在根目錄，工作包保持核驗用途。先盤點，不覆蓋原有工作。

保留五關時間 240/210/180/180/150 秒、題數 2/3/4/5/5、指定物件數／色碼及500候選詞。正式題庫需人工核校，不得自填簽核。待審資料只能在 loopback 本地隔離預覽，不得發布；來源存 _reference/。

執行 node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs；正式發布另需 check-release 及實機證據。無 Git 權限或裝置須明記限制，不得宣稱已上線。
