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


## Demo 03：長按、可撕線條、直式與放大

- **PASS**：Node 13 項實際物理引擎測試。新增密集已黏薄層穿越測試：30 粒鬆沙可穿過已黏沙層並物理出界，固定沙位置不變；鬆粒間仍碰撞及支援高度接觸。調整原先以已黏沙阻擋形成堆積的舊測試，改驗證鬆粒間的垂直接觸。
- **PASS**：瀏覽器 10 項真實 Path2D 回歸，14.4 萬像素符合可見圖形；31 個面／線條區域皆非空，眼睛能獨立撕開並上沙；232 個舊誤黏座標仍不黏，耳朵內部持續補沙達 100% 樣本覆蓋（不含邊緣），未使用填色。
- **PASS**：輸入回歸 16 項，驗證 CSS 與選取／contextmenu 取消、眼睛撕紙、縮放及座標、雙指縮放不誤撕、還原不清作品、橫放暫停與直放保留作品、鎖定拒絕 fallback、英文控制。此頁使用合成 pointer、mock capture／裝置 API，不能當成實機結果。
- **PASS**：390×844 iframe 原生滑鼠操作：+ 放大至約 2.46 倍，左眼長按約 1.8 秒後撕開、右眼獨立撕開；雙眼倒炭灰沙後方向鍵清沙。固定 225 粒僅在雙眼（左 138、右 87），鬆沙 0、物理出界 1645；截圖 `design/detail-zoom-v3-390x844.jpg`。
- **PASS**：JS 語法、Preview noindex／Lobby 隔離及 Python 48 項 Repo 測試。
- **NOT TESTED**：本版 iOS Safari 真機 callout、雙指縮放／平移、螢幕旋轉、Android 原生 fullscreen／orientation lock 與感測方向；仍待使用者手機試玩。
- **BLOCKED**：代理無實體手機感測器可操作。
- **NOT APPLICABLE**：正式 Lobby、共用錢包、帳號、排行榜、Analytics、CrazyGames 發布；全部未改動。
- **FAIL**：目前沒有未修正的已知回歸測試失敗；不代表手機實測已完成。

旋轉鎖定的瀏覽器前置條件與限制依 [Screen Orientation 規範](https://www.w3.org/TR/screen-orientation/)；不支援時使用直式提示，不要求使用者開啟實驗性設定。


## Demo 04：低角度流動手感

使用者澄清為「畫面順，但傾斜時沙子不太滑」。本次專注物理阻力，不以更換渲染或降粒子數當作修復。

- 調低底面靜態阻力及速度拖曳；碰撞配對每一輪只解一次，降低切向速度損耗與反彈，保留鬆粒碰撞、堆積與薄黏膠層。
- **PASS**：同種子、相同 800 粒沙堆在紙上沉降 2 秒，設定重力投影 `gx=sin(10°)`，再模擬 3 秒；Demo 03 平均橫移 26.21 邏輯 px，Demo 04 為 75.38 px，無搖動、刮板或刪粒。此為確定性引擎模擬，不是真機量測。
- **PASS**：Node 19 項實際引擎測試。新增 800 粒、10° 低傾角、3 秒移動至少 65 px 的回歸；放平後自行停下、粒子數守恆、已黏沙不動、未撕黃紙不吸沙、餘沙物理出界仍驗證。降低阻力後停穩測試延長至 4 秒，保留「漸停」而非立即停止。
- **NOT TESTED／BLOCKED**：新版 iPhone／Android 真機低角度手感與實際感測資料；代理無實體手機可操作，仍待使用者試玩。
- **NOT APPLICABLE**：正式 Lobby、共用錢包、帳號、排行榜、Analytics、CrazyGames 發布；未改動。
- **FAIL**：無未修正的已知回歸失敗。

本輪追加修正：

- **PASS**：上層鬆沙較易滑落的引擎測試；上下兩粒鬆沙在同樣 10° 投影下，0.5 秒後上層比底層多移動超過 3 px 並落到底面，沒有刪粒或移動已黏沙。
- **PASS**：重現截圖中「約 14,000 已黏／少量鬆沙卻滿額」的容量問題；新測試先保留 14,000 粒已黏沙，再倒入 100 粒，仍能倒沙、流出並繼續倒。已黏沙不佔 4,000 粒鬆沙額度，不以清除作品解決。
- 一般倒沙 520 → 850 粒／秒，沙匙 70 → 90 粒／秒。已黏薄層使用繪圖快取，物理只掃描鬆沙；整張畫保留的顆粒仍可讀取。放大、重玩與手機手感需另依實際驗收列結果。

- **PASS**：刮板掃掠測試保留至少 40 px 的橫向範圍，整條刀口把鬆沙帶過路徑，不收束成單點；毛刷保持 30 px 寬的柔性掃痕，沒有工具注入的垂直速度。反覆工具輸入的速度有上限。
- 工具正在接觸時降低黏附速率，仍可沿移動過程逐粒沾附；刮板為掃掠線段的接觸推動，毛刷依橫向刷毛位置漸變，不是圓形爆炸力場。
- **PASS**：本機 Chrome 連續倒沙約 1 秒，實際 emitted=857；原生刮板／毛刷拖曳能推動鬆沙，方向鍵能清出。另一次畫頭部後固定 667 粒、鬆沙 0，放大與還原保留色層，換紙後資料與快取畫面皆清空。此為桌面操作，不代表真機手感已通過。


## Demo 05：容易起滑、縮短滑行距離

使用者回報 Demo 04 太滑。本次保留低靜態阻力，增加速度阻尼及高速時的額外阻力，並縮短工具放開後的滑行；上層仍比底層容易滑落。

- **PASS**：相同 55 px/s 初速、放平後模擬 3 秒：Demo 04 滑行 52.68 px 且仍有殘速，Demo 05 滑行 25.95 px 並停下，沒有直接清除粒子。
- **PASS**：同種子 800 粒、10° 傾斜 3 秒，平均移動約 46.56 px，介於 Demo 03 約 26.21 px 與 Demo 04 約 75.38 px 之間。以上均為引擎模擬，不是真機手感結論。
- **PASS**：23 項物理回歸，包括新增「放開後滑行小於 30 px 且漸停」、10° 流動控制在 35～60 px，上層滑落、刮板寬掃、毛刷不抬沙、黏附固定與容量守恆。
- **NOT TESTED／BLOCKED**：本版手機感測與真實手感，代理無實機可操作，待使用者試玩。
- **FAIL**：無尚未修正的已知回歸測試失敗。
- **NOT APPLICABLE**：正式 Lobby、共用點數、帳號、排行榜、Analytics 與平台上架；未改動。

同版再納入使用者「堆著只微滑、工具推著走」的澄清：

- 工具以掃掠接觸搬動鬆沙，減少離開刀口後的動量；新增刮板釋放後漂移少於 8 px 的測試，不額外給向上推力。
- 未覆蓋白膠加入局部阻力與較快的逐粒黏附；紙張與已覆蓋區域不套用黏膠阻力，仍不自動填區域。
- 感測啟用後第一筆有效姿勢作為放平基準，含小角度雜訊區與角度跨 ±180° 處理；避免直拿手機時持續施加接近最大向下力。可關閉後重新啟用校正。
- 真機感測手感仍 **NOT TESTED／BLOCKED**；純函式及合成感測事件不能取代手機驗收。

## DEMO 06：直立感測角度跳變

- 改為重力向量投影到校正平面，避免 beta/gamma 在直立姿勢換表示法時產生假傾斜。
- PASS：24 項 Node 物理／感測數學回歸（包含等價 Euler 表示）。
- NOT TESTED：iPhone／Android 實體感測，往上飛的實機原因仍待確認。

- PASS：22 項瀏覽器合成輸入回歸（零色不出沙、重新選色恢復、感測校正等）；不代表實機通過。
- 色盤允許全取消，未選色不產生沙粒或倒沙音效。

## DEMO 07：原地沙堆與裸膠黏性

- 新沙從已有支撐的鬆沙表面上方落下，減少出沙的橫向初速度，避免在堆內出生將沙擠開。下層接觸可承重，高層仍會屈服滑落；保持粒子、重力、工具與原色。
- 裸膠接觸等待縮短至 25 ms，逐步捕捉率提高；固定顆粒按實際覆蓋足跡佔位，不只佔中心的單一細格。後色仍可沾在真正裸露的白膠。
- PASS：26 項 Node 測試，包括同點倒 2,520 粒、停倒後堆積、刮板搬移、未刪沙守恆、快速黏附與防止重黏足跡。上層滑落測試觀察改為 1.5 秒，符合微滑而非立即散開。
- PASS：本機瀏覽器實際長按倒出 2,557 粒、刮板與毛刷推沙，白膠產生黏附。
- NOT TESTED：實體手機觸控、感測及主觀手感。

## DEMO 08

- Gravity acceleration: 210 to 125 logical px/s2; pouring, adhesive and tool strokes unchanged. A 10-degree tilt travels 20-40 px over 3 seconds.
- Pick now lifts paper only, with directional paper and pick animation. Five main tools.
- Larger paper, twelve sand jars, a compact tool tray and a Settings drawer. Chinese and English supported.
- PASS: 26 physics tests, 33 synthetic input/layout checks at 390x844, 320x568 and 430x760. Main touch targets >=44px.
- PASS: Chrome native mouse pick drag, held pour, settings and manual tilt in a 390x844 iframe.
- NOT TESTED: physical mobile/iPad sensor and touch behavior, subjective flow feel.

- Tool/jar feedback: 260 ms lift/rock animation, gentle procedural wood/glass/brush sounds, optional 7 ms vibration where supported. Muting suppresses selection sounds; reduced-motion skips animation/vibration. Physical haptic and audio comfort NOT TESTED.

## DEMO 09

- Stable per-grain friction and height-dependent tool carry reduce rigid-sheet motion. No added random jitter, color blending or artificial grain displacement.
- Cached irregular sand silhouettes, fixed faceted lighting, contact/falling shadows and height-sorted loose grains replace identical circles with square highlights.
- PASS: 28 physics tests, including different friction travel and upper-layer yield under a blade. Coating spill test allows 7.5 seconds for the slower flow.
- PASS: local Chrome initialization and mouse tool interaction with about 2,550 loose grains. An observed FPS sample is not a full performance certification.
- NOT TESTED: physical phone touch, sensors, haptics, subjective sound and naturalness.

## DEMO 10

- Loose-sand allowance increased to 5,000. Attached pigment does not consume this allowance. Existing capacity and pigment-budget regression tests apply.
- Physical phone performance at the new cap remains NOT TESTED.

- PASS local browser: held pour reached exactly 5,000 loose grains; peeling exposed glue bound 1,820 grains and reopened capacity. A further held pour increased total emitted to 5,602 (2,051 attached / 3,551 loose). No grains were deleted.
