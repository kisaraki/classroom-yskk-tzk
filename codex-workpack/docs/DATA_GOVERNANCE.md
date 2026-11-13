# 500 條成語資料治理、可用性與授權守門

## 當前狀態（2026-11-13）

- `data/idioms_500_selection.json`：500 條已選定的候選四字詞目，ID I0001–I0500，**不可擅換**；結構核驗通過。
- `data/idioms_500_selection.csv`：便於人工查核與排序的同批詞目。
- `data/idiom_textbook_review.csv`：教科書收錄證據工作表；目前沒有逐版實證。
- `data/idiom_linguistic_review.csv`：本工作包新增的語文核對表；每筆預設待審。
- `data/idioms_500.json`：**未隨包提供**，因為仍缺逐筆可查驗的注音／釋義。不可把候選 JSON 直接改檔名冒充正式遊戲資料。

## 定義四個彼此獨立的驗證結果

| 層次 | 檢核項目 | 當前狀態 | 是否足夠上線 |
|---|---|---|---|
| 選詞完整性 | 500 條、四字、ID／詞目唯一、規格附錄一致 | 已經自動檢核 | 否 |
| 語文正確性 | 逐字注音、變讀、詞義、來源欄位、核對者簽核 | 待審 | 否 |
| 著作權合規 | 原文著作權／授權標示、版本、資料使用條件 | 待核對正式輸入 | 否 |
| 課本逐版收錄 | 指定出版社、學年度、年級、冊次、課次及頁碼 | 未查證 | 不影響「一般成語題庫」開發；不可聲稱教材收錄 |

## 來源作業

1. 以教育部《成語典》官方網站的公開下載檔及其使用說明為查核來源：<https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_idiomsdict_download.html>。來源頁、版號、取得日與授權說明需人工再次確認並記錄；本包舊資料註記的是 `2020_20260929`，**不得未經確認即稱為永遠最新版**。
2. 來源檔由開發者合法下載到本地私人 `_reference/`（建議在 `.gitignore` 忽略）；不得撰寫抓取官方網站頁面的程式。
3. 先確認來源欄位確實對應 500 條「指定詞目」。同字異義、異體字、編號、變讀、官方欄位格式都要核對，不可機械合併。
4. 在工作包目錄內執行範本：

```bash
node tools/import-idioms.mjs --source ../_reference/dict_idioms_2020_20260929.json --edition 2020_20260929
```

這會生成工作包內 `data/idioms_500.json` 與 `data/IMPORT_REVIEW.md`，**狀態為 `PENDING`**；不是核校通過的正式檔。若確定可用，再依批准流程複製到網站根目錄 `data/idioms_500.json`；切勿在審核前發布。

匯入預設拒絕覆寫 JSON 或報告，沒有強制覆寫選項。重跑時先建立私人工作目錄，使用 `--output <新JSON路徑>`；報告預設為同目錄的 `<JSON檔名不含副檔名>.IMPORT_REVIEW.md`，亦可用 `--report <新報告路徑>` 指定。兩個路徑必須不同且均未存在；保留前次核校成果，另行比對新版本。

5. 格式核驗可從倉庫根目錄執行（`--data` 指定要驗證的實際 JSON 路徑）：

```bash
node codex-workpack/tools/validate-idioms.mjs --data ./codex-workpack/data/idioms_500.json --allow-pending
```

6. 語文教師／具適當職責的審校人員逐一核對四字注音、常用字形、釋義完整性、來源授權，於工作包的 `data/idiom_linguistic_review.csv` 填寫三項 `Y`、核對者、ISO 日期、註記及該筆 `content_sha256`。核對過程保存差異與修正依據，禁止程式自填簽核人與日期。下列唯讀指令只輸出 ID／詞目／內容雜湊，不會修改審核表；必須核對所列版本後才可由審校者填入對應雜湊：

```bash
node codex-workpack/tools/review-fingerprint.mjs --data ./codex-workpack/data/idioms_500.json
```

雜湊格式為 `idiom-review-v1` 的 SHA-256：物件鍵名排序、陣列順序及字串內容保留，涵蓋該題全部欄位及題庫共用中繼資料。僅排除題庫 `linguisticReviewStatus`、該題 `linguisticReview`，所以完成簽核後改核准旗標不會讓雜湊失效。注音、釋義或任一該題內容改變，需重新核對該筆；來源版號、授權文字等共用欄位改變，全部雜湊失效。不可只重新計算雜湊以沿用舊簽核。雜湊證明內容版本相同，不證明審核者身分或語文正確性。

7. 僅在全部 500 條都實際審核後，才能由被授權者將正式 JSON `linguisticReviewStatus` 改為 `APPROVED`；執行嚴格驗證：

```bash
node codex-workpack/tools/validate-idioms.mjs --data ./data/idioms_500.json --review ./data/idiom_linguistic_review.csv
```

正式交付時把已核校 JSON 與對應審核表一併放到網站根目錄 `data/`，以上指令及發布檢查明確讀取該表。驗證工作包內的候選產物時可用 `--review ./codex-workpack/data/idiom_linguistic_review.csv`；不指定時仍預設讀工作包審核表。舊版沒有 `content_sha256` 的簽核不能直接通過，須先確認其實際審過的內容版本再補登。

8. Codex 將 `data/SOURCES.md` 中的來源說明和適當署名／授權資訊加入網站，確認教育部原文資料可直接引用的範圍與條件。來源 JSON 的授權不等於第三方 GitHub 程式碼授權；不可混淆。

## 正式 JSON 範圍

必填 `schemaVersion:1`、`count:500`、`items[500]`；每筆 `id`, `idiom`, `zhuyin[4]`, `definition`, `difficulty`（1..5）, `source`。正式採官方原文時需保留來源版號與歸屬文字，以及可追溯條目資訊；資料欄位示意在 `CODEX_SPEC.md` §6.1 及 `contracts/idioms.schema.json`。**Schema／程式只驗資料結構，不保證語意正確或授權完備。**

## 資料完整性與產出邊界

- `--allow-pending` 僅允許結構檢查，不代表發布許可。
- 沒有審核者實際簽署，不可透過工具強制全數寫 `Y` 或套用預設日期。
- 發現 500 候選詞目中有不適合國中生、官方資料查無或字形不一致：保留 ID、詳列疑點與來源並請使用者裁決，不能自行默默替換。
- 釋義若為官方條目原文，遵守實際適用授權，勿擅自縮寫改作；若另撰教學提示，需另欄標示原創、保留版本與審核者。
- 正式頁面不得含真實學生姓名、班級名單或遙測蒐集；玩家名稱僅在當次遊玩狀態內保存。

自動測試使用 OS 暫存目錄內明確標示 `SYNTHETIC TEST ONLY` 的合成內容及簽核夾具，只用於驗證通過／拒絕邏輯，結束後移除。這些夾具不會寫入真實 500 筆審核表，也不能作為正式題庫或人工審查證據。
