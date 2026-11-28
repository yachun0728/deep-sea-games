# Meow Link v1 驗收紀錄

2026-11-28，Internal / 本站待發布驗收版；未提交、未推送、未執行 migration 或正式部署。最終素材及封面待使用者試玩確認。不是 CrazyGames 上架版本。

## 修改與影響

- 新增 `games/meow-link/`、獨立 `shared/meow-link-rules.cjs`、board 驗證器與 game_names migration；大廳第 4 張卡。Ocean Link 原版全部來源雜湊保持一致。
- 36 張透明手繪 WebP，12 貓咪、8 玩具、8 食物、8 用品；拉布依使用者參考。每種難度都含物品。原圖及核准設定圖保留，design 已排除於正式靜態部署。
- 免費開始；第 3／6／10 關各 5 點、每遠征 15 點，接既有錢包／AN；另有平台原有首次完成與有效時間獎勵，不新增經濟模型。
- 新存檔 `deep-sea-meow-link-best-v1`；既有資料不遷移、不清除。獨立 game ID、排行、名稱與分享設定。
- 36 圖案 WebP 共 594076 bytes；封面 1056×1000、271316 bytes；榜單縮圖 192×192、7904 bytes。RGBA 原圖 alpha 實測含 0 與 255。

## 已執行

環境：macOS 26.6.2、Google Chrome 158.0.8127.37（隔離 Headless profile）、Node 26.13.1。尺寸為實際 CSS viewport：390×844、320×568、430×760、768×1024、1366×900、844×390。瀏覽器尺寸模擬不等同手機／平板實機。

| 狀態 | 項目與證據 |
|---|---|
| PASS | `python3 tools/build.py`、`--check`；`git diff --check`；`prototype.py --check` |
| PASS | `python3 -m unittest discover -s tools -p 'test_*.py'`，49 項全部通過 |
| PASS | `node tools/test_meow_link.mjs`：三模式共 30 關原始／洗牌盤面逐步連線、障礙位移、全部清空、圖案數量、分類及原版雜湊 |
| PASS | `node tools/test_meow_link_api.mjs`：真實 Worker handler＋本機 SQLite 全 migrations；十關、所有權、非法操作、重送不重發、低分不覆蓋、同分先到、資料庫／API／feed 一致、原版紀錄隔離 |
| PASS | `python3 tools/check_i18n_browser.py --suite meow_link --screenshots games/meow-link/design/qa`：1716 項檢查；六尺寸均簡單十關實際 DOM 操作到結算、逐關續玩、重複下一關、三次 5 點／總 15 點、單次 end、最佳紀錄、三模式精確圖案池／尺寸、所有圖片載入、英文動態及 aria、進行中語言切換、無水平溢出、棋盤在可視範圍、主要按鈕44px、網路不可用時本機模式，以及模擬觸控選牌 |
| PASS | 實際打開 `http://localhost:8765/?lang=zh-Hant#meow-link`，已確認新名稱、三種模式、手繪素材及可開始遊玩 |
| PASS | 最終大廳手機畫面：第四張卡為 Meow Link，封面與英文名清楚；截圖見 qa/meow-link-lobby-390.png |
| FAIL | 目前已執行檢查無失敗。過程中測試指出的字典重複、未使用 ID、規範徽章及名稱解析均已修正並重測通過 |
| NOT TESTED | iOS／Android／Safari／實體平板；App 切換／鎖屏；長時間遊玩、FPS 與低階裝置效能；普通／困難完整 UI 操作十關（純規則解法已通過）；GA4 後台收件；正式 D1 與正式大廳排行串接；真實網路結算失敗後前端重試流程 |
| BLOCKED | 正式發布驗收：待使用者試玩這一版與確認封面；目前不執行正式 migration／Worker／前端部署 |
| NOT APPLICABLE | CrazyGames SDK、廣告、IAP、多人連線、CrazyGames QA Tool／平台送審；本版無遊戲音訊 |

## 手機尺寸限制

依使用者指定保留原版棋盤尺寸，普通／困難在手機直式下每格會小於 44px，圖片辨識與誤觸尚需實機試玩確認。主要提示／退出按鈕達 44px；這不代表每格符合該目標。不得把視窗模擬通過宣稱為所有實機體驗合格。

## 試玩與發布

- 電腦：`http://localhost:8765/?lang=zh-Hant#meow-link`；大廳 `http://localhost:8765/#lobby`。
- 同 Wi-Fi 手機：`http://192.168.51.238:8765/?lang=zh-Hant#meow-link`（需電腦仍開機並運行本機服務；IP 可能變動，尚未在手機驗證）。
- 試玩重點：拉布與物品是否容易辨識、簡單／普通／困難圖案大小、提示／續關／離開、封面及第 4 張卡。
- 核准後仍須先核對遠端最新版、隔離其他既有工作，只發布本次授權來源；migration 0022、Worker、前端依序部署，再驗證正式榜與 GA4。回退前端接線與新 Worker 註冊並重建，保留新存檔與歷史排行，不修改原版。

## 發布核准與隱藏點數更新

使用者已明確核准「上線吧」，並要求先隱藏 BONUS 與點數。已加入全站純顯示開關，資料、點數計算與 Analytics 不變；修改後重新通過 49 項 Python 測試及六尺寸 1758 項瀏覽器檢查，含錢包／標章隱藏、通關時不顯示獎勵、分數／玩法文字保留、顯示層不寫錢包。發布基準遠端 SHA `8cd4efcd530451ac6da2d15d69e558c424568f24`，已保留行人地獄最新版本；不包含其他本機踩地雷、首頁文字、美術暫存的變更。原待使用者核准的 BLOCKED 狀態已解除，實機及 GA4 後台仍未驗證。
