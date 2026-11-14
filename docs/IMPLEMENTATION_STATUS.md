# 開發紀錄 2026-11-13

M0 本地盤點 DONE，遠端整合 BLOCKED（GitHub connector 404）。
M1–M3 已建立可操作本地版本，狀態 PARTIAL：核心程式及自動測試完成，尚需完整多尺寸／多指／實機驗收。
M4 BLOCKED：官方來源待審資料500條已匯入 _reference/，全部未人工核校。沒有寫入正式 data/idioms_500.json 或造假簽核。
M5 PARTIAL：本地HTTP與子路徑檢查完成，未發布、未平板實測。

新增 index.html、assets/css/style.css 及 config/idioms/physics/collision/state/keyboard/input/renderer/main 原生模組；tools/serve.mjs 提供僅127.0.0.1的隔離預覽。根目錄 AGENTS.md、package.json、.gitignore、README.md 及鍵盤示例設定已建立，工作包保持原狀。

Node v26.13.0：`node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs` 53/53 PASS。包含真實物理接觸推進76次命中／19題／五關、碰撞衝量、重試配置、暫停及臨界逾時。此為程式模擬，不等同使用者連續遊玩或平板驗收。

本地瀏覽器實際操作：載入500條待審資料、選擇玩家01、Start、準備倒數、進入第1關、P暫停；HUD四字／注音／釋義可見，無感測器自動切換搖桿。已觀察畫面，尚未完成三比例與全流程UI驗收。

預覽： http://127.0.0.1:4173/?preview=1 。預設8017埠在本機被拒絕綁定，改用4173成功。重啟：`node tools/serve.mjs --port 4173 --preview-data ./_reference/idioms_500_pending_2020_20260929.json`。

技術參考：權限請求依 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) 在使用者操作內同步發起。裝置方向與感測器實際手感仍須iPadOS／Android驗證。

## 追加控制與瀏覽器驗證

本輪完整測試結果更新為54/54 PASS（上文53項為前次結果）。新增方向鍵同時按住、失焦釋放指標、舊指標不可繼續拖曳、第二指標不接管及取消歸零的回歸測試。

修正方向鍵切到手動模式時才清除舊輸入，避免第二方向鍵抹去第一方向；clear釋放搖桿指標捕捉，避免失焦後殘留拖曳；螢幕方向鎖定同步失敗亦不阻擋遊戲啟動。

實際瀏覽器驗證：A取消不扣次數；確認後同題重置240秒；三次後A×0禁用。R確認後保留玩家名稱、重新抽題並恢復A×3。直向切回橫向後維持暫停，須手動繼續。無感測器時自動切換搖桿。本輪瀏覽器記錄未見error/warn。

尺寸：1024×768已觀察完整畫面；1024×768及1280×720的DOM邊界無水平溢出，四張字卡及底部控制位於視窗內。1280×800截圖未完整呈現，仍不列完整視覺驗收。已還原瀏覽器尺寸並保留暫停預覽。未完成平板多指、實體感測器與全流程人工遊玩驗收。

## 預覽服務隔離與規則回歸

M2/M3/M5仍為PARTIAL；M4人工核校仍為BLOCKED。五關硬參數及500候選詞目未變更。

- tools/serve.mjs：改為可測試的createLocalServer；解碼後拒絕反斜線、點路徑、控制字元及Windows冒號路徑，精確限制公開入口；以realpath防止assets/data下的目錄連結指向非公開位置。預覽資料只透過明確啟用的特殊路由提供，仍只綁定127.0.0.1。
- 預設埠改為4173，README同步；參數錯誤、缺少預覽檔及監聽失敗會顯示可理解的錯誤並退出。
- tests/server.test.mjs：使用獨立暫存目錄、實際HTTP服務及Windows junction驗證公開資源、子路徑、GET/HEAD、405、私有路徑拒絕和未啟用預覽時的404。
- tests/game.test.mjs：補測錯序、其他球間接碰撞、重字、同一步最多一字、重複及過期事件；READY/PLAYING/IDIOM_CLEAR的世界、字卡和各計時器暫停不變；不可在隱藏或直向恢復；感測器無效值、死區、校正、輸出上限及逾時回退。

實際執行 node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs：58/58 PASS，0 skipped、0 todo。上述輸入／狀態測試不代替平板實機驗收。

已重啟原4173預覽服務載入修正。對正在運行的服務檢查：首頁、專案子路徑main.js、明確預覽JSON均200；編碼反斜線跳轉及_reference直接存取均404。--port invalid正常回報錯誤並exit 1。

再次執行 check-release.mjs：如預期FAIL，缺少正式data/idioms_500.json及data/idiom_linguistic_review.csv；未建立假簽核、未發布。後續仍需人工語文核校、完整三比例視覺與iPadOS/Android觸控及姿態驗收。

## HUD、資料載入與穩定性驗證

- 新增assets/js/ui.js：相同文字不重寫DOM，字卡只在題目或字序改變時重建；碰撞提示保留x/4數字；最終結算包含每次重試之前的剩餘時間及失誤。
- main.js：鍵盤與題庫共用可重試的初始化流程；鍵盤失敗不再被題庫成功訊息覆蓋；載入中停用重複請求；題庫重載保留已輸入名稱。
- keyboard.js：掛載前驗證設定，避免無效名稱／字集造成部分初始化。
- idioms.js：連線逾時與JSON損壞提供可理解的重試訊息，正式模式不回退到待審題庫。
- tests/ui.test.mjs及tests/robustness.test.mjs：補測文字更新次數、碰撞提示保留進度、逐次重試摘要、500組安全配置、完整960秒物理模擬、三種幀率實際世界一致性與載入失敗。

三比例完整頁面截圖：.local/qa/hud-1024x768.png、hud-1280x800.png、hud-1280x720.png。已觀察四格原字／注音／三種狀態、1/4進度、釋義及P/R/A；1280×800量測三鍵高度均48 CSS px、寬度均超過65 CSS px。此為桌面瀏覽器模擬視窗，不能將A32的平板實機門檻標為PASS。原先1280×800原生截圖裁切問題改以fullPage截圖取得完整證據。

本地UI另外驗證中文頁籤、逐字輸入、刪除、清除、預設名稱與重新載入；重新載入後保留804-01、6/16與可啟動狀態。畫面：.local/qa/keyboard-1024x768.png。瀏覽器error/warn記錄為空。

960秒為純物理模擬時間，不代表平板16分鐘連續遊玩、60FPS或觸控手感合格。長時間模擬涵蓋有限值、牆面邊界、固定支柱；不宣稱已排除全部卡住或抖動情境。

最新完整測試65/65 PASS；逐項驗收證據與缺口見docs/ACCEPTANCE_STATUS.md。

## 控制切換時序與剩餘規則測試

InputController新增可失效的傾斜授權請求：新的手動模式、搖桿／方向鍵操作、失焦清除或轉向會使舊請求失效，晚返回的授權不得覆蓋最新操作。重新啟用傾斜使用新鮮的目前姿勢作中性點；過期樣本則等下一筆有效值校正；轉向也清除motion優先時間戳，允許orientation立即接手。main.js控制切換使用此流程。

新增四項測試：延遲授權與手動模式／生命週期競爭、切換傾斜時校正、五關逐關恢復三次重試與15次歷史紀錄、持續接觸抑制及分離後再次接觸。

完整執行node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs：69/69 PASS，0 skipped、0 todo；main.js及input.js語法檢查通過。HTTP確認正在執行的4173服務已提供新版input.js；既有瀏覽器頁面需重新整理才載入新模組。未重新聲稱實機感測方向或手感合格。

驗收表A19與A28已補齊自動化證據。人工語文核校與iPadOS／Android實機門檻保持BLOCKED。

## 過關動畫與渲染隔離

修正state.js：第四字完成後的IDIOM_CLEAR仍更新吸收效果、閃爍與回饋的顯示壽命；關卡時間與物理位置／速度維持凍結。PAUSED不更新動畫壽命。新增實際第四次接觸後的切題等待／暫停／恢復測試。

renderer.js：尺寸未變時不重設Canvas繪圖緩衝區；提供ResizeObserver清理介面及可測試的環境依賴。新增tests/renderer.test.mjs，以Canvas測試替身驗證五關在1024×768、1280×800、1280×720縮放與繪製前後不改動世界／進度／特效資料、DPR上限2、已吸收目標不再繪出、主球只繪出一次及繪圖堆疊配對。這是渲染命令驗證，不是實機像素／效能驗收。

完整執行node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs：71/71 PASS，0 skipped、0 todo。驗收A22補齊自動化證據，實機及人工核校仍未完成。

## 交付準備與最終本地驗證

新增官方來源完整署名及版本顯示、遊戲內授權PDF連結；assets/legal/idiomsdict_10409.pdf與已下載官方原檔SHA-256一致。未變更題庫內容、核准旗標或簽核。

新增tools/prepare-review.mjs，產生只讀核校閱讀包（拒絕覆寫）；500條完整內容與待核對指紋、116條特別待審優先列出。_reference/review-20261113/idiom_linguistic_review.csv為原空白範本逐位元組複製，Y／核校人／日期／簽核雜湊均未填寫。新增delivery.test.mjs驗證工具保留來源、不自填核准、拒絕覆寫及官方PDF完整性。

根目錄新增.github/workflows/idioms-pinball-ci.yml，沿用工作包檢查流程，不自動發布；無遠端推送或Actions執行。README及docs/HANDOFF.md提供本地試玩、真實核校、實機驗收及發布接手步驟。

瀏覽器實際逐一點測0–9及A–Z，分段輸入結果完全一致；連字號、空白、清除正常。正式模式即使有玩家名稱仍阻擋Start，顯示題庫未就緒。/classroom-yskk-tzk/?preview=1可載入500條並開始、暫停遊戲。來源視窗署名與連結可見。截圖：.local/qa/sources-1024x768.png、formal-mode-blocked.png、subpath-game.png。本輪瀏覽器error/warn為空。

最終執行node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs：73/73 PASS、0 skipped、0 todo。待審題庫結構檢查PASS但500條狀態仍PENDING；閱讀包有500個待核對指紋，空白簽核表未變；授權PDF子路徑HTTP200、application/pdf。

嚴格check-release仍FAIL：缺少data/idioms_500.json及data/idiom_linguistic_review.csv。這是正式資料與真實簽核缺失的正確阻擋，不是產品已完成的證明。完整產品仍需人工語文核校、實機驗收與可存取GitHub／Pages環境；詳細未完成項目維持在ACCEPTANCE_STATUS.md，不以本地測試取代。

## 啟動相容性與新倉庫整合

新增startup.js及startup.test.mjs：同步發起兩種感測器權限與全螢幕、處理不支援／同步例外／Promise拒絕、限制未返回權限等待時間、吸收延遲拒絕並清理計時器。Start固定本次玩家名稱與題庫引用，啟動期間阻止重載造成資料競爭。76/76完整測試PASS；瀏覽器子路徑實際Start、倒數、遊玩及暫停成功，error/warn為空，截圖.local/qa/startup-verified.png。

再次唯讀查詢：原GitHub connector仍404，gh亦無法解析。使用者隨後明確要求「創立新倉庫」。已透過登入帳號kisaraki建立私有倉庫 https://github.com/kisaraki/classroom-yskk-tzk ，準備推送程式、測試、文件及CI；待審來源、閱讀包、備份與本機截圖仍排除。

新私有倉庫已初始化main並推送首個提交9bb7e1f。只在本倉庫設定已登入帳號kisaraki及GitHub noreply作者信箱，未更動全域Git設定。新增.gitattributes保留工作包精確位元組；Git索引內46項雜湊全部匹配，82個檔案不含_reference／.local／備份，憑證樣式掃描未發現匹配。遠端樹確認私人目錄未上傳。

首輪GitHub Actions驗證成功：https://github.com/kisaraki/classroom-yskk-tzk/actions/runs/43436310997 。verify含工作包檢查、44項契約及32項遊戲測試；release-check依一般push規則略過，並不代表發布核准。

依遠端Node 20 Actions棄用提示，查核官方[checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)與[setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)，僅更新根目錄實際工作流並固定官方commit SHA，使用Node 24、ubuntu-24.04；工作包範本及manifest保持不變。待第二輪遠端確認。

## 使用者授權的GitHub Pages平板測試版

使用者要求啟用Pages並提供平板測試網址。GitHub起初422回覆目前方案不支援私有倉庫Pages；準備19個必要網站檔案後，使用者明確選擇將現有classroom-yskk-tzk改為公開。已完成可見性變更並推送gh-pages分支。這是先前僅本機待審資料規則的明確指定例外，不代表正式語文核校。

新增site-config.js與stage-tablet-test.mjs。main保持production模式，輸出副本使用tablet-test並讀取data/idioms_tablet_test.json；原始500條內容及PENDING狀態逐位元組保留。部署只含19個網站檔案，無_reference、工作包、測試、簽核人員表或備份。網站顯示「平板測試版 · 題庫待核校 · 非正式教學」，保持完整來源及授權PDF。正式check-release不變。

本地77/77測試PASS；來源提交d3c7a38遠端CI成功：https://github.com/kisaraki/classroom-yskk-tzk/actions/runs/43438847769 。Pages提交b71a439部署成功：https://github.com/kisaraki/classroom-yskk-tzk/actions/runs/43438861551 。GitHub Pages API確認來源gh-pages、根目錄、https_enforced=true。

正式提供的平板操作測試網址：https://kisaraki.github.io/classroom-yskk-tzk/ 。實際HTTP驗證首頁、site-config.js、500條PENDING JSON、授權PDF皆200且MIME正確。公開網址瀏覽器驗證載入500條、玩家01、Start、3秒倒數、遊戲計時與暫停成功；error/warn為空。證據：.local/qa/github-pages-live.png。尚未把桌面瀏覽器驗證宣稱為iPad／Android實機完成。

CI限制main及v*標籤，gh-pages不執行需要開發檔案的根目錄測試流程。網站分支獨立更新，main變更不會暗中重部署待審資料。

## 2026-11-14 感測方向與診斷修正

使用者回報 iPad mini 7 / iPadOS 26 Safari 已能取得感測器，但橫向滾動方向不符預期。查核 WebKit WebCoreMotionManager.mm：iOS 將 Core Motion userAcceleration + gravity 直接傳入 accelerationIncludingGravity，與 W3C 示範的符號不同。input.js 現在依 iOS 身分（含 MacIntel + 多點觸控的 iPad 桌面網站模式）正規化符號，再使用原有螢幕座標轉換；方向事件備援改成重力投影，避免直接旋轉 Euler 角造成姿態失真。舊版 Safari orientationchange 同樣清除舊校正並暫停。

來源：https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/ios/WebCoreMotionManager.mm ；https://www.w3.org/TR/orientation-event/ 。這是程式與來源核對，並非已取得使用者裝置上的原始讀值證據。

新增「感測狀態」：本機顯示權限、事件數、有效資料、螢幕角度、控制方向及重新要求權限。授權視窗造成失焦時保留未完成請求，手動選搖桿仍可取消其影響。Start 同一次手勢發起請求。

node --test tests/*.test.mjs codex-workpack/tests/*.test.mjs：82/82 PASS。verify-workpack PASS。新增 input.test.mjs 覆蓋五種螢幕角度、四方向、兩種 iPad 身分與 Android、姿態投影、旋轉清除校正、授權失焦和錯誤診斷。尚待 iPad 實機重測，不宣稱 A29 通過。五關配置與 500 條 PENDING 資料不變；僅更新使用者已授權的平板測試網站，非正式發布。

### 2026-11-14 第二次實機回報：iPad 角度基準

上一版仍異常，使用者確認以平放桌面校正。查得 WebKit 260984@main（2023-03-01）將 iPad Screen Orientation 的自然方向設為 landscape-primary：https://github.com/WebKit/WebKit/commit/f0224968ed57e28fcf80825627817e4e435231eb 。因此原 angle() 把 screen.orientation.angle 直接當成感測器直向座標的角度不成立；上一版測試只使用直向自然基準，未涵蓋此組合。

iOS 改用與感測器同基準的 window.orientation；缺少時由 Screen Orientation type 轉為直向基準。Android 保留原生角度。新增四姿態、兩種角度來源的回歸測試。診斷顯示控制版本 20261114.2、實際轉換角度及兩種 API 原始角度；入口及更新模組附版本查詢參數避免沿用舊快取。實機方向仍待使用者重測，不宣稱已通過。

## 2026-11-14 山林中式視覺與首頁宣告

使用者回報感測方向正常（iPad mini 7 / iPadOS 26）；此為使用者實測回報，不擴張為其他裝置全項驗收。保留控制模組20261114.2。

依要求新增原創 SVG 山林插畫（遠山、松竹、亭閣、飛鳥）、宣紙及印章風格首頁，加入原文「2026桃園市立觀音國民中學國語文領域教學研究會」「圖書館閱讀推動教師團隊」。五關固定色碼不變，擴展至場地底色、邊框、HUD、搖桿及按鈕。靜態 SVG 一次載入，Canvas 使用同一圖像繪製；不改物理與關卡條件。

83/83 自動測試 PASS。1133×744 橫向瀏覽器首頁截圖 .local/qa/forest-home.png；文字與鍵盤完整可見，啟動遊戲成功，error/warn 為空。此為桌面視窗尺寸驗證，不等於新主題的 iPad 實機驗收。網站入口版本20261114.3，控制診斷仍顯示20261114.2。平板測試部署增加一個插畫資源，題庫保持 PENDING，正式發布守門不變。

## 2026-11-14 觀音地方意象畫卷

依使用者要求將泛用森林改為觀音地方意象，以內建 imagegen 生成中式水墨設色插畫 guanyin-scroll.png：校門（紅褐圓柱、圓孔牆）、灰色 IKEA 物流中心、白沙岬燈塔、甘泉寺、蓮花、台61線、沙丘落日、風機、大潭電廠。為藝術化混合場景，非實際位置地圖、建築測繪或照片。未將網路照片複製到網站。生成原圖保留於 Codex generated_images，專案資源有獨立副本。

外觀參考：桃園市政府 IKEA 物流中心啟用 https://news.tycg.gov.tw/News_Content.aspx?n=5016&s=845590 ；桃園觀光白沙岬燈塔 https://travel.tycg.gov.tw/en/Travel/Attraction/1024 ；甘泉寺 https://travel.tycg.gov.tw/zh-tw/travel/attraction/292 ；台電大潭電廠 https://www.taipower.com.tw/2764/61044/2849/25378/ 。校門參考搜尋結果 https://cingyang.com.tw/03-open.aspx?id=44 。圖片為重新生成的藝術詮釋，不宣稱精確復原。

首頁完整展示畫卷與圖像替代文字，標題為「讀觀音，拾字成章。」；同畫卷用於場地淡化背景。保留五關主色、兩組宣告及感測控制。入口版本20261114.4，控制版本仍20261114.2。增加本地服務 PNG MIME。

83/83 測試 PASS。1133×744 瀏覽器檢查首頁宣告、完整插畫、鍵盤及遊戲啟動，error/warn 為空；截圖 .local/qa/guanyin-home.png。未冒稱本次視覺已經 iPad 實機驗收。待審資料及正式核校守門不變。

### 撞錯字扣時（20261114.7）

依使用者新增規則，玩家球每次直接撞到未輪到的目標字或干擾字，剩餘時間減 5 秒，最低為零。沿用物理接觸去重，維持原有完成與逾時的結算優先順序。此規則更新規格 v1.3 §3.4 的不額外扣秒條款，工作包保留原始規格與雜湊。

## 2026-11-14 Ocean edition (20261114.8)
User-requested presentation override: vivid ocean palette, animated homepage, three exact organizer/motto declarations, opening school gates tied to READY countdown, and progressively reduced damping (.95/.75/.55/.35/.18). Contract level times/counts/colors remain stored unchanged. Morning/noon use new daylight art with separately rendered sun; levels 4/5 use sunset art. Reduced-motion preference disables decorative motion and substitutes gate fading. 86/86 tests and verify-workpack passed. Desktop visual inspection was blocked by Computer Use URL identification; no iPad visual or touch acceptance claimed. Formal language review remains PENDING; deployment uses the previously authorized tablet-test exception.
