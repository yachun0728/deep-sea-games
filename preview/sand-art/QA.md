# Sand & Chill Demo 驗收紀錄

日期：2026-11-26（Asia/Taipei）。目標：Internal Preview，非 CrazyGames Basic／Full Launch。

## 結果與範圍

| 狀態 | 項目／實際證據 |
| --- | --- |
| PASS | JavaScript 語法解析、Chrome 實際初始化、貓咪與 12 色色盤顯示；瀏覽器 error／warn 記錄為空。 |
| PASS | 390×844 逐區點擊全部 12 區，診斷 `peeled` 包含 0～11；可任意順序撕紙，黃紙露出白膠。 |
| PASS | 瀏覽器按住倒沙、複選顏色、逐粒黏附；不自動填區塊，保留個別沙色。高度軸更新後再測倒沙、刮板、毛刷、搖動、敲擊與方向鍵。 |
| PASS | 刮板／毛刷拖曳、牙籤推沙、沙匙少量倒沙（瀏覽器操作）；引擎測試確認推動期間重力仍運作，已黏沙粒不動。 |
| PASS | 方向鍵／方向按鈕、搖動及敲擊按鈕。較早版本的鬆沙測試 emitted=727、exited=727、bound=0；最終高度軸引擎再以自動測試驗證實際經邊緣出界及顆粒數守恆。 |
| PASS | 物理引擎 9 項測試：黃紙不黏、非自動填色、經過白膠才黏、逐步黏附與原色、工具及重力、慣性與堆積、出界守恆、上限不刪沙、高度堆積及空中不黏。 |
| PASS | 390×844、320×568、430×760、768×1024、1280×900 CSS viewport 版面；無水平溢出，窄螢幕按鈕高度至少 44px。此為桌面 Chrome viewport 模擬，不是手機／平板實機。 |
| PASS | 繁中／英文切換、工具提示、色名及無障礙名稱；欣賞／繼續／換紙循環。 |
| PASS | 桌面沒有感測資料時，顯示英文無資料提示並回到手動操作；不會自動要求權限。 |
| PASS | Repo Python 測試 48 項；發布 checkout 的 build 與 --check、prototype --check、git diff --check。 |
| PASS | 發布基底為最新 origin/main；不改 catalog、Lobby、共用錢包、排行榜、存檔、帳號、GA4 或其他遊戲。 |
| NOT TESTED | iOS／Android 真機傾斜方向、OS 感測授權／拒絕、實際搖動及輕敲邊框辨識；須由手機 HTTPS 試玩確認。 |
| NOT TESTED | 真機多指觸控、Safari／Firefox／Android Chrome、螢幕旋轉、App 切換／鎖屏恢復、長時間與低階手機效能。 |
| NOT TESTED | ASMR 主觀聽感與真機喇叭／耳機音量；Web Audio 已實作及操作觸發，未以聽測宣稱音質合格。 |
| BLOCKED | 此代理環境無可操作的實體手機感測器，不能完成真機感測驗收；不阻擋 Internal Preview 試玩。 |
| NOT APPLICABLE | CrazyGames SDK／廣告／帳號／多人／IAP／QA Tool／正式審核；沒有申請或發布至 CrazyGames。 |
| FAIL | 目前沒有尚未修正的已知測試失敗；不等同所有裝置或品質驗收通過。 |

## 效能觀察（非跨裝置保證）

本機 macOS Chrome，390×844：最終含高度軸的版本約 2,600 粒時，讀到一秒視窗 120 FPS。此前平面接觸版本曾測約 11,200 粒，讀到約 84 FPS；此數字不可當成最終高度版本的高負載結果。未完成手機、長時間或滿額效能測試。

## 發布

隨既有 Cloudflare Workers Builds 的 GitHub 整合發布 `/preview/sand-art/`。遊戲版本 commit：`92721db`。已推送 origin/main，HTTPS 頁面 HTTP 200，內容包含最終高度物理。線上 Chrome 已實際撕紙、雙色倒沙、刮板、搖動及敲擊；觀察 emitted=935、bound=329、loose=606，error／warn 記錄為空。頁面：https://www.ticaticagames.com/preview/sand-art/ 。CI/CD 與瀏覽器驗證皆不等同手機實機通過。

建議：可提供 Internal Preview 供手機試玩，尚不建議正式上架。美術為試玩稿，實際敲擊辨識為實驗性功能；作品重整即清除。


## Demo 02：實機回報修正

使用者手機截圖確認 Demo 01 有兩項 **FAIL**：未撕的嘴巴／月亮等輪廓黏沙，以及耳朵仍露白卻不再收沙。先前測試未涵蓋真實 Path2D 抗鋸齒 ID 與飽和覆蓋率，不能以既有 PASS 掩蓋本次回報。

修正：區塊 ID 改為逐像素幾何內含測試，不解碼抗鋸齒 RGB；檢查黏附顆粒接觸範圍；黏附位點從約 2.7 px 格子細化至 0.7 px，調整固定沙層的接觸排斥以容許自然嵌合，補沙仍由真實顆粒落下／接觸產生。

- **PASS**：Node 12 項實際引擎測試，含跨紙邊界、區塊幾何與持續補沙密度；JavaScript 語法、Python 48 項測試及 Preview 檢查。
- **PASS**：Chrome 真實貓咪 Path2D 回歸頁 `tools/test_sand_art_browser.html`；14.4 萬像素全數符合最上層圖形。舊 RGB 遮罩可重現 232 個誤黏位置；修正版從這些位置倒沙後，0 粒在未撕輪廓黏附。
- **PASS**：回歸頁持續倒沙／搖動後，左耳內部實際顆粒覆蓋率 82.49% → 99.79%（排除約 2 px 邊緣，樣本中心以實際顆粒半徑判斷），不使用區塊填色。
- **PASS**：390×844 iframe 手動操作只撕雙耳、倒藍沙、方向鍵及搖動清除餘沙。657 粒固定沙僅分布在左耳 338、右耳 319；其他區塊固定沙為 0。截圖 `design/dense-ears-v2-390x844.jpg`。
- **NOT TESTED**：修正版手機實機手感／感測與敲擊；桌面瀏覽器結果不能代替 iOS 實測。
- **BLOCKED**：代理無可操作的實體手機。
- **NOT APPLICABLE**：錢包、帳號、排行榜、共用存檔、Analytics、CrazyGames 上架；本次均未改動。

發布僅更新沙畫 Preview 與回歸測試；新頁右上標記 `DEMO 02`。
