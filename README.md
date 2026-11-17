# Deep Sea Arcade

33 款遊戲共用本機點數與 GA4，部署為 GitHub Pages 靜態網站。目前顯示 24 款一般遊戲與獨立每日挖礦（踩地雷免費不限次數、挖礦每日免費配額，其他依入場說明扣點；點數低於 100 時每分鐘回 1 點），另外 8 款機率遊戲以 catalog 的 `hidden` 隱藏，程式碼保留。

## 產品方向：純小遊戲，禁止博弈元素

所有遊戲（包含隱藏與新增遊戲）都不得有下注、全押、賠率／返還倍率、領回或提前兌現。不得僅隱藏文字而保留博弈機制；改以操作、推理、探索、分數與關卡提供遊戲目標。固定入場費與自然回點可保留，但不得以入場費作本金計算輸贏返還。

踩地雷與挖金礦已完成改造，其他遊戲尚未全部完成；下文的返還與結算用語是現況紀錄。完整限制與踩地雷／挖金礦的待辦見 [GAME_RULES.md](GAME_RULES.md)，執行規範見 [AGENTS.md](AGENTS.md)。本次文件更新不代表遊戲已符合新規範。

## 先定位，再讀程式

1. [AGENTS.md](AGENTS.md)：Agent 維護規範。
2. [ARCHITECTURE.md](ARCHITECTURE.md)：實際相依、資料 Key、共用程式邊界。
3. [GAME_RULES.md](GAME_RULES.md)：玩法、扣款與返還公式。
4. `games/catalog.json`：用 hash ID 找到遊戲來源。
5. [games/README.md](games/README.md) 與各款的 `games/<id>/README.md`：自動產生的函式索引（含行號）、扣款與追蹤位置、規則摘要。改某一款先讀它，不必掃整支 `game.js`。改完執行 `python3 tools/game_docs.py` 重新產生。

例如修改插隊遊戲，先讀 `games/elevator/game.js` 與 `view.html`；修改大廳入口才讀該目錄的 card.html／icon.svg。不要從 400 KB 的 index.html 開始；它是產出。原生單款邏輯約 2～25 KB，珍奶完整子頁另存，沒有改珍奶時不必讀取。

## 本機修改、組合與預覽

從專案根目錄執行（需要 Python 3.9 或更新版本，不需安裝套件）：

```sh
python3 tools/build.py
python3 tools/build.py --check
python3 -m unittest discover -s tools -p 'test_*.py'
python3 -m http.server 8765
```

開啟 `http://localhost:8765/`。GA4 在 localhost 刻意不送事件；正式環境驗收見 [ANALYTICS.md](ANALYTICS.md)。

`templates/`、`games/`、`js/`、`css/` 是來源。`index.html` 是追蹤在 Git 的靜態產出，修改來源後必須重新組合，提交時一併包含來源與產出。GitHub Pages 不需 Python，也不用調整現有入口。`--check` 可用於未來 CI，但目前沒有擅自加入部署 workflow。

`{{include:路徑}}` 原樣插入內容，`{{json:路徑}}` 插入安全序列化的子頁字串；路徑均相對專案根目錄。JS 片段仍組成同一個原有 IIFE，不可各自用 script 標籤載入或當成 ES module。檔案結尾的空白與換行屬組合內容，工具不做格式化。

## 隱藏或重新顯示遊戲

在 `games/catalog.json` 該遊戲加上 `"hidden": true`，重新執行 `python3 tools/build.py`：大廳卡片、選單與網址都不會出現，view 與邏輯仍會組合。要重新顯示就移除該欄位。重新顯示前必須完成非博弈玩法改造與驗證，不能只改成固定 10 點就重新上架。

## 新增一款遊戲

目前沒有自動註冊 API。新增時依以下接點逐一接入，避免漏掉扣點、初始化或追蹤：

1. 建立 `games/<id>/game.js`、`view.html`、`card.html`、`icon.svg`。ID 使用小寫英數與連字號；view 使用唯一 `view-<id>`，圖示 symbol 使用 `icon-<id>`，卡片 href 指向 `#<id>` 並附分類。
2. 在 `games/catalog.json` 加入 ID 與四個來源路徑。這是維護／檢查索引，不會自動產生程式註冊。
3. 在 `js/runtime.js` 的 bootstrap 前放入邏輯 include；在 `templates/index.html` 加入 view include 及遊戲選單的 `tab-<id>`；在 `templates/lobby.html` 對應位置加入 icon／card include，更新大廳總數。既有遊戲的顯示順序應保持。
4. 在 `js/navigation.js` 的 VIEWS 加名稱；在 `js/analytics.js` 既有遊戲名稱對照加入名稱，依 start／progress／resume／end 契約追蹤。
5. 核對 `js/bootstrap.js` 是否需要初始化；核對 hot.snapshot、`js/controls.js` 重設防護與提示、route 的必要回呼。不要為新增遊戲重寫其他款的設定。
6. 使用原有 S.balance／save／renderAll 等共享流程；明確實作單次扣款與單次結算。設定新遊戲專屬 DOM／狀態名稱，避免與共享作用域衝突。若要新建 localStorage Key，先核對既有 Key，勿覆寫舊資料。
7. 新樣式優先放 `games/<id>/style.css`，在 templates/index.html 的既有 style 區段末尾 include；限定於該遊戲的 selector。既有 CSS 本次保留原順序，沒有逐一改寫。
8. 同步提供繁體中文與英文，補齊 `locales/en.json`；依下方「新增遊戲的多語系清單」驗證卡片、規則、動態提示、Canvas、無障礙標籤與 iframe，並把新遊戲加入瀏覽器多語系檢查。只補中文介面不算完成。
9. 更新 GAME_RULES.md，必要時更新架構與追蹤文件。組合並執行檢查，再驗證不足額、扣款、失敗、續關、回大廳、直接 hash、手機及背景恢復流程。不得為新增遊戲引入領回或點數返還倍率。

組合工具會檢查 catalog 檔案、唯一 view／tab／icon／card 與引用；它不能證明遊戲規則、餘額與 GA4 行為正確。仍需依修改範圍做行為驗證。

## 來源拆分的驗證與回復

本次初始拆分以組合後 HTML 與拆分前檔案逐位元組一致為驗證，沒有改規則、倍率、畫面、localStorage Key 或 GA4。

一般遊戲修改若需回復，回復該次變更的來源與對應產出，再跑 `--check`。不要只回復 index.html，否則下一次組合會覆蓋它。不要使用會丟棄其他未提交工作的全目錄重設；Git 提交與推送依本次授權範圍處理。

## 深海火線行為檢查

修改 `games/blaster/` 時可在有 Node.js 的環境執行 `node tools/test_blaster.mjs`，驗證單次扣款／結算、續關、武器升級、漏怪扣心與暫停。無需 npm 套件；Python 組合檢查仍照常執行。

## 青蛙吃蟲行為檢查

修改 `games/frog/` 時可在有 Node.js 的環境執行 `node tools/test_frog.mjs`，驗證單次扣款、每 10 隻入帳一次、單次結算、被螫與餓昏結束、生氣蟲的狀態循環與空白鍵只在本款畫面作用。無需 npm 套件。

## 遊戲上線與 BONUS 檢查

新增、改造、重新上架及發布前，依 [遊戲上線與 BONUS 檢查規範](RELEASE_CHECKLIST.md) 驗證非博弈玩法、固定獎勵門檻、BONUS 標章、錢包防重複、追蹤與正式站部署。清單也包含遠端較新及本機有其他未提交修改時的隔離發布流程；每次只回報實際通過的項目。各款獎勵數值仍以 GAME_RULES.md 與來源核對，不統一套用蓋樓遊戲的門檻。

## 免費懷舊與每日補給

踩地雷完全免費，可選低中高或自訂2×2～10×10、最多N×N−1顆雷，第一格也可能踩雷。每日免費挖礦以大廳右下角浮動小圖示呈現，台灣時間每天免費3次、每次挖5格、最多30點。詳見 GAME_RULES.md。

## 偷睡大師行為檢查

修改 `games/nap/` 時可在有 Node.js 的環境執行 `node tools/test_nap.mjs`，驗證單次扣款、每過 1 關入帳一次、考績歸零單次結算、通關 10 關入帳 10 點與按鍵只在遊戲顯示時作用。

## 中英文版本

頁首「繁中／EN」可即時切換大廳、遊戲操作、規則、動態提示與 Canvas 文字，保留目前遊戲及點數。珍奶內嵌原版已使用英文，保留原畫面。可分享 `index.html?lang=en#lobby`，或以 `index.html?lang=en#dream` 直接開啟英文遊戲；中文網址使用 `?lang=zh-Hant`。語言偏好保存在此瀏覽器，明確網址參數優先，不跨裝置同步。

翻譯來源為 `locales/en.json`，顯示邏輯為 `js/i18n.js`，樣式為 `css/i18n.css`。新增或調整遊戲文字後，補齊翻譯並執行既有組合與單元測試。額外瀏覽器驗證：

```sh
python3 tools/check_i18n_browser.py
# Chrome 不在預設位置時可加 --chrome /完整/執行檔路徑
# 可加 --screenshots /tmp/arcade-i18n-shots 保留英文版截圖
```

此工具使用獨立暫存設定檔與測試點數，不操作使用者的瀏覽器紀錄或正式站；檢查桌面及 390px 裝置尺寸、語言記憶、顯示文字、既有資料與單次扣點。它不取代全關卡、實體手機或 GA4 後台驗收。

### 新增遊戲的多語系清單

- 同步繁中／英文：大廳卡片、分類、選單、頁面標題、規則與 BONUS 條件、按鈕、提示與無障礙文字。沿用 `locales/en.json` 及既有語言切換，不另建重複遊戲頁或重載整頁來切換。
- 檢查動態句子：關卡、分數、點數、倒數、開始、成功、失敗、餘額不足、暫停、續關及重玩。驗證實際組合結果與 Canvas 文字，避免只有初始畫面翻完。
- 若是 iframe，連子頁的靜態／動態文字與畫布一起驗證，包含延遲載入與重新載入；原本已是英文的珍奶畫面維持原樣。無法翻譯的外部頁面須明列限制。
- 切換語言須保留遊戲狀態、點數與 hash；不得改變規則數值、遊戲 ID、GA4 追蹤契約或既有存檔。原按鈕與扣點處理器不重建，不因語言切換重複開局或結算。
- 將新遊戲加入 `tools/i18n_browser_*.js`，執行翻譯覆蓋單元測試、組合檢查與上方瀏覽器檢查；確認 `?lang=en#<id>`、`?lang=zh-Hant#<id>`、語言記憶、進行中切換、桌面與真正 390px CSS viewport 無漏翻／溢出。將實測與未驗證項目寫入驗收紀錄。
