# 成語典官方資料取得與待審匯入紀錄

查核日期：2026-11-13（Asia/Taipei）。本紀錄只證明來源取得、格式轉換及機械比對；500 條的字音、語義、教學適用性仍未經人工核校，M4 維持 BLOCKED。

## 官方來源與版本

- [教育部《成語典》資料下載頁](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_idiomsdict_download.html)：本次實際開啟列示 `dict_idioms_2020_20260929`，頁面更新日期為民國 115-10-1。
- [官方文字資料庫 ZIP](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/download/dict_idioms_2020_20260929.zip)：由上述下載連結取得，不是爬取成語查詢頁。
- [官方公眾授權入口](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html)：同樣列示最新版本編號 `2020_20260929`。
- [《成語典》公眾授權使用說明 PDF](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/idiomsdict_10409.pdf)：已完整下載並保留於 `_reference/idiomsdict_10409.pdf`。

官方 ZIP 僅包含 `dict_idioms_2020_20260929.xlsx`，不是匯入器接受的 JSON。工作表為「成語資料」，共有 5,490 列（含表頭）與 22 欄，即 5,489 條來源資料。

## 授權與署名

官方頁與使用說明列明採 CC BY-ND 3.0 臺灣。使用說明要求保留完整說明、確認版本，且不得修改或簡化個別條目的詞目、音讀、釋義等內容；依官方字碼對照或不更動條目內容的調整另有說明。正式公開前仍須依實際呈現方式完成授權檢查。

應使用的署名：

> 中華民國教育部（Ministry of Education, R.O.C.）。《成語典》（版本編號：2020_20260929）網址：http://dict.idioms.moe.edu.tw/

既有匯入器的 `legalAttribution` 是簡短提示，網站的資料來源介面與正式交付仍應提供上述完整機關名稱、版號、官方來源，以及完整使用說明。不能僅靠 `APPROVED` 或結構檢查宣稱授權及人工審查均完成。

## 本地檔案與完整性

原始與待審資料均位於不應發布的 `_reference/`。

| 檔案 | SHA-256 或用途 |
|---|---|
| `dict_idioms_2020_20260929.zip` | `33dc230ceb126cccfe3dc6e17e3b38b99618b8d6c6ff85ee911493065dc2850e` |
| `dict_idioms_2020_20260929.xlsx` | `fa4395e9a94288b1f21266d3a5121b6c4d6709f22edb8e0f99bdf04df8d26f83` |
| `idiomsdict_10409.pdf` | `ce154de2a9fb1eee4a591d2fa0d8cef2437f82e72d21fecdd5098d85d81ac8ad` |
| `extract-official-idioms.py` | 使用 bundled Python/openpyxl 唯讀擷取來源儲存格；不修改 XLSX |
| `dict_idioms_2020_20260929.raw.json` | 5,489 條原始欄位序列化，保留原儲存格字串與全部 22 欄 |
| `idioms_500_pending_2020_20260929.json` | 既有匯入器產生的 500 條 PENDING 資料；僅供本機隔離開發與人工核校 |
| `idioms_500_pending_2020_20260929.IMPORT_REVIEW.md` | 116 條變讀／特殊記號的逐條待審清單 |

部分來源非採用欄位含 Excel 文字逸出 `_x000D_`，原始 JSON 保留其值。本次採用的 500 條語義說明均未含此標記；未自行清理、縮寫或改寫釋義。

## 執行紀錄

1. 透過官方下載連結取得 ZIP，僅解出已知檔名 XLSX。
2. 使用 `mcp__codex_app__load_workspace_dependencies` 回傳的 bundled Python 與現成 openpyxl，執行唯讀轉檔：

```powershell
& 'C:\Users\Adolf\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 '.\_reference\extract-official-idioms.py'
```

3. 執行現有匯入器，輸出指定的新待審檔：

```text
node codex-workpack/tools/import-idioms.mjs --source ./_reference/dict_idioms_2020_20260929.raw.json --edition 2020_20260929 --output ./_reference/idioms_500_pending_2020_20260929.json
```

結果：500 條成功匯入；50 條含其他讀音、72 條釋義含特殊記號，兩者聯集 116 條被標為特別待審。

4. 以來源條目編號逐筆回查：全部 500 條 `definition` 與來源 `sourceMeaningField` 原值一致，`originalZhuyin` 與來源注音原值一致；不一致數為 0。所有 `sourceMeaningField` 均為 `用法說明-語義說明`。
5. 固定候選 ID／詞目全部匹配：500 條、500 個不重複詞目、缺漏 0。釋義長度為 5–72 個 Unicode 字元。
6. 結構驗證：

```text
node codex-workpack/tools/validate-idioms.mjs --data ./_reference/idioms_500_pending_2020_20260929.json --allow-pending
```

結果：exit 0，PASS 僅結構／來源欄位檢核。

7. 同一路徑不加 `--allow-pending`：exit 1，明確拒絕 `linguisticReviewStatus=PENDING`，符合預期。

## 交付邊界

- 可讓 localhost 隔離預覽讀取上述 PENDING JSON 驗證五關工程流程；需顯示待審狀態，不能發布或當作正式教學驗收。
- 未新增 `data/idioms_500.json`；未更動 `codex-workpack/`、人工核校表或其簽核旗標。
- 未生成任何 APPROVED 資料，也未代填審核者、人員、日期或雜湊簽核。
- 所有 500 條仍需人工核校；116 條只是工具特別標記，不代表其餘 384 條已通過人工審查。
- 教材收錄仍未逐版查證；本次沒有新增教材收錄主張。
