# data/ 的資料邊界

本資料夾目前有：

- `idioms_500_selection.json`：**唯一固定候選詞目**，500筆，包含 ID、字形、建議學段及待核對旗標。
- `idioms_500_selection.csv`：相同500筆方便人工閱覽。
- `idiom_textbook_review.csv`：出版社、版本、課次／頁碼查核；目前全數未證實。
- `idiom_linguistic_review.csv`：正式注音、釋義、來源的逐條人工核校簽核表；新增 `content_sha256` 綁定已審內容版本，目前全部簽核及雜湊仍空白待審。
- `SOURCES.md`：來源與著作權背景及限制。

**不含 `idioms_500.json`**：這是正式遊戲需用的完整500筆注音／釋義檔，必須先合法取得來源、逐筆審校後產生，不能把候選詞目改名上線。即使自動結構驗證通過，也不等於語文內容正確。

請先閱讀 `../docs/DATA_GOVERNANCE.md`。
