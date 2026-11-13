# 開發交付與人工接手

本地原生遊戲已具備首頁、內建鍵盤、五關物理與規則、姿態／搖桿控制、P/R/A、HUD及總結。產品仍未達正式發布門檻；不能把自動測試、待審資料或桌面視窗模擬當作人工語文及平板實機簽核。

## 立即試玩

```powershell
node tools/serve.mjs --preview-data ./_reference/idioms_500_pending_2020_20260929.json
```

開啟 http://127.0.0.1:4173/?preview=1 。若服務已啟動，直接開啟連結，不需再啟動第二個服務。服務僅綁定loopback，待審資料不得透過對外網站或網路分享發布。

## 語文核校（需要真實審查者）

- 閱讀包：`_reference/review-20261113/REVIEW_PACKET.md`，包含全部500條的完整內容、共用中繼資料及待核對指紋；116條特別待審優先列出。
- 空白簽核表：`_reference/review-20261113/idiom_linguistic_review.csv`。所有Y、核校人、日期及content_sha256均保持空白，沒有自動簽核。
- 來源：`docs/DATA_SOURCE_RESEARCH.md`。官方原始ZIP／XLSX／JSON及匯入報告保留在`_reference/`；正式使用說明原PDF在`assets/legal/idiomsdict_10409.pdf`。
- 核對逐字注音、原始讀音／變讀、完整釋義、字形、來源及授權呈現。須變更者留下依據，不可擅自改寫官方原文或替換500候選詞目。
- 閱讀包內的指紋不是簽核。只有實際核對過該版本者才能在簽核表登錄其指紋。共用來源／授權欄位變更時，全部題目都需要重新核對。
- 完成後，由有權責者依工作包DATA_GOVERNANCE流程核准，將真實核准資料及表格放入根目錄data/；不可只改APPROVED旗標。

重新產生閱讀包必須指定新檔名，工具拒絕覆寫：

```powershell
node tools/prepare-review.mjs --data ./_reference/idioms_500_pending_2020_20260929.json --output ./_reference/review-20261113/REVIEW_PACKET-v2.md
```

## 裝置驗收（需要可操作的實機）

完整項目見`codex-workpack/docs/QA_DEVICE_MATRIX.md`；請在正式資料核校完成後的受控測試環境進行，使用支援感測器授權的HTTPS頁面。未核校題庫仍限本機隔離預覽。

每款至少記錄裝置型號、OS／瀏覽器版本、時間、網址及截圖或影片：

1. iPadOS Safari與Android Chrome各自Start授權一次；另驗拒絕授權／無有效感測資料仍可使用搖桿。
2. 兩種橫向握法與校正；手指搖桿同時操作P/R/A，沒有殘留移動或誤捲頁。
3. 4:3、16:10、16:9四格字卡、長注音／釋義與操作鍵完整可見；長結算紀錄可讀。
4. READY、PLAYING、IDIOM_CLEAR切背景、旋轉、系統提示；回前景不自動恢復、計時及進度不損失。
5. 連續完成五關；確認19題、76次命中、錯序不加分、重字分序、A每關三次、R重抽及結算重試紀錄。

## GitHub與發布（目前未部署）

經使用者明確要求，已在登入帳號kisaraki建立新的私有倉庫：https://github.com/kisaraki/classroom-yskk-tzk 。先前404為歷史紀錄；目前改以此新倉庫進行遠端整合。尚未啟用Pages或發布待審題庫。

已準備`.github/workflows/idioms-pinball-ci.yml`：一般push/PR執行驗證；v*標籤及指定手動執行要求嚴格發布檢查。它不自動部署；遠端執行結果見IMPLEMENTATION_STATUS.md。

發布前必須執行：

```powershell
node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs
node codex-workpack/tools/check-release.mjs
```

目前第二個命令因正式題庫與真實簽核缺失而失敗，屬必要門檻，不應繞過。正式部署只取index.html、assets/及已核准的必要JSON；不應公開_reference、備份、測試、閱讀包、簽核人員表或本機證據。

## 證據入口

- `docs/ACCEPTANCE_STATUS.md`：各驗收項目、證據與缺口。
- `docs/IMPLEMENTATION_STATUS.md`：變更及命令紀錄。
- `.local/qa/`：桌面瀏覽器三比例、鍵盤、來源視窗、正式模式阻擋及子路徑截圖。

程式模型與Canvas測試替身的PASS，只代表所測條件；不替代實機效能、觸控手感、完整人工遊玩或資料語義正確性。
