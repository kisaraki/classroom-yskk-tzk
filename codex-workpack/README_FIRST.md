# 給專案維護者

將這份 ZIP 解壓縮到 GitHub 專案根目錄，保留 `codex-workpack/` 資料夾名稱及內部結構。**不要把壓縮包內檔案全部平鋪到專案根目錄。**

進入 Codex，貼上 `codex-workpack/CODEX_RUN_PROMPT.txt` 全文，或在任務中指定「先讀 `codex-workpack/START_HERE.md`」。若希望 Codex 每次在倉庫根目錄啟動都能看見導讀，將 `ROOT_AGENTS_SNIPPET.md` 內容合併到既有根目錄 `AGENTS.md`（若尚無此檔才建立），不要覆蓋原有指示。

工作包本身可以在 Node.js 20+ 下檢驗，不用 npm install：

```bash
node codex-workpack/tools/verify-workpack.mjs
node --test codex-workpack/tests/*.test.mjs
```

關卡與資料界線：遊戲尚待 Codex 實作；500 條僅已完成詞目選定，注音、釋義、逐版教科書收錄仍須實際取得資料與核校。詳見 `START_HERE.md`。
