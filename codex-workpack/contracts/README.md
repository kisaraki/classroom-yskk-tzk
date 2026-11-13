# 可機讀工程契約（鏡像而非改寫規格）

- `levels.json`：固定五關秒數、色碼、題數與四類障礙物數量。
- `state-machine.json`：v2 必要流程、`when` 條件與 `set` 更新；包含 READY／PLAYING／IDIOM_CLEAR 暫停後返回原狀態。
- `idioms.schema.json`：正式500條 JSON 基本結構；無法保證字音、語義與授權正確。
- `keyboard-presets.example.json`：通用虛擬鍵盤示例設定，不含真實學生名單。

若契約與 `../CODEX_SPEC.md` v1.3 衝突，以產品規格為準，提出差異修正，不可默默修改關卡硬參數。

正式資料的內容版本另由語文審核 CSV 的 `content_sha256` 綁定；它是簽核欄位，不是 JSON Schema 自行判定核准的依據。詳見 `../docs/DATA_GOVERNANCE.md`。
