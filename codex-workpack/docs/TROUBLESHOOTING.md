# 問題排查速查

| 症狀 | 優先檢查 | 不可以採用的替代方式 |
|---|---|---|
| GitHub 倉庫 404/無權限 | owner/repo 是否正確、Codex 連線與權限、所在工作樹 | 宣稱已推送或任意覆蓋一個新倉庫 |
| GitHub Pages 題庫 404 | 相對 URL、Pages 專案子路徑、實際檔名大小寫 | 用 `/data/...` 硬編根路徑 |
| 直接雙擊 HTML 空白 | ES Modules/fetch 需 HTTP；用 `python -m http.server` | 關閉安全檢查或改用 CDN |
| iPad 沒有全螢幕或權限提示 | 支援的 API、Start user gesture、瀏覽器限制；提供搖桿 | 強制阻止開始遊戲 |
| 方向相反 | screen orientation angle、裝置座標轉換與中性點 | 把反向當成學習難度 |
| 60/120Hz 速度不同 | 是否只在 RAF 使用固定 dt+accumulator | 用 CSS 轉場取代物理 |
| HUD 少一字或進度飄移 | `nextIndex`、`charIndex`、切題原子更新 | 以球是否消失當進度來源 |
| 未完成注音／釋義 | 保留待審狀態，查核合法官方來源，逐筆審核 | 憑空生成500條聲稱完成 |
| A 重試物件配置不同 | 是否重用同關 levelSeed、配置隨機序列 | 暗改重試規則 |
| 切背景回來秒數大減 | `visibilitychange` 自動暫停、重設 RAF clock | 擅改五關時限 |
