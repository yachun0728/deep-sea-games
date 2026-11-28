# 死神打工 C 款驗收（2026-11-28）

## 範圍與契約

只改死神打工美術、呈現尺寸、操作文字與素材載入。共用錢包、排行榜 API／Worker、GA4 與 `shared/reaper-rules.cjs` 不改。點數與判定沿用實際程式；歷史 Analytics 文件仍寫每局扣 10 點，但目前 `ENTRY_FEE=0`，這次不改經濟。

## 本機實測

環境：macOS，隔離 Chrome headless。390×844、320×568、430×760、768×1024、1366×900、844×390 為 CSS viewport 模擬，不是手機實機。

| 項目 | 結果與證據 |
|---|---|
| 核准 C 稿比對 | PASS：`comparison-c-v2.png`；場景、角色、材質、金色托盤、綠證與按鈕造型保持同款，400×523 等比完整顯示 |
| 使用者回報「揮鐮」偏位 | PASS：獨立文字 span 固定在黑色按鈕下半部；三語系中心量測 x=224.25、y=605.55（390×844），對應設計位置誤差 <0.03 CSS px |
| 三語系／六尺寸 | PASS：`python3 tools/check_i18n_browser.py --suite reaper`，60 個斷言；包括字串、畫布英文未漏翻、比例、觸控尺寸、切換時回合保留 |
| 真實輸入完整循環 | PASS：以觸控開局、觀察畫面上的靈魂並按原操作，實際處理 120 位；普通靈魂捕捉、綠證放行、高班次淡出、三心歸零、結算、重玩與 Space 冷卻均驗證 |
| 暫停與存檔 | PASS：離開路由期間分數和愛心不變，原 `reaper` key 保存最佳紀錄；結算閒置不重複入帳 |
| Runtime | PASS：上述試玩沒有 JS error／unhandled rejection |
| 大廳封面 | PASS：新圖已接入；1056×1000，296,392 bytes；英文名稱正確，沒有外框，手機縮小仍可辨識 |
| 排行榜縮圖 | PASS：正式 Chrome 390px 實際列已顯示新頭像；192×192，沿用 `icon-reaper`，點擊列可進新版遊戲 |
| 全遊戲語系回歸 | FAIL（既有、非本次範圍）：`--suite games` 在踩地雷的「旗子插錯仍會踩mines.」停止；全站 Canvas 初始化另有「茶／飲」，專用監測依 canvas ID 區分 |
| 手機／Safari／Android 實機、長時間低階裝置 FPS | NOT TESTED：目前沒有相應實機操作證據 |
| 音訊變更 | NOT APPLICABLE：本次未加入或修改音訊 |
| CrazyGames SDK／QA／正式審核 | NOT APPLICABLE：本次發布至本站，沒有送審或聲稱平台通過 |

Build、單元測試與部署後驗證隨最終 commit 記錄。`output/reaper-c-qa/` 保存實際截圖與本機瀏覽器斷言紀錄（不隨部署公開）。原始設計與部件 PNG 由 `.assetsignore` 排除出站台資產，Git 仍保留原稿。

## 正式發布與資料驗證

- PASS：功能版本 `70ee7c1` 已推送 `main` 與 `codex/reaper-rubber-hose`。上線前整合並核對 `origin/main` 的 `9b71ec0`；其他遊戲、共用規則、錢包、追蹤與後端沒有被回退。
- PASS：Cloudflare 主站 Worker 部署版本 `72a9f169-7a15-46e0-8d32-c1bb5bf407f4`，只上傳 17 個新增／修改資產；無需 D1 migration 或 API Worker 更新。
- PASS：發布版 Build／`--check`、49 項 Python 單元測試、共用 timed replay 測試（包含 reaper）、5 段 JS 語法與 13 段 JSON script 解析、`git diff --check`。整合遠端後再跑 Reaper 60 項瀏覽器斷言也通過。
- PASS：正式站在真實 Chrome 390px 檢查封面與排行榜縮圖。封面實際卡片 174×154.25 CSS px，英文 `REAPER SHIFT` 和角色清楚，使用 `cover.webp?v=8db57be1`。榜單第一列顯示新死神頭像與既有最佳 28；點榜單及封面都能開啟新版遊戲。
- PASS：正式遊戲以真正輸入接走 3 位普通靈魂，再自然三心歸零。開局 API HTTP 201、結算回放 HTTP 200，回合 `6136806c-9f36-4216-a7ba-057ec76f6794` 的回傳分數為 3、revision 1，公開榜亦包含 3。
- PASS：D1 唯讀查詢同一 round，並 JOIN `game_leaderboard`；`round_score=3`、`leaderboard_score=3`、`revision=1`。驗證查詢寫入 0 rows。
- PASS：已登入的 Analytics Realtime 報表，分別進入 `game_start` 和 `game_end` → `game_id`，兩處都看得到 `reaper`。這是後台收件證據；不只依 dataLayer 或部署成功推論。
- BLOCKED：本次發布無尚待排除的阻塞。
- NOT TESTED：實體 iOS／Android 與低階裝置長時間 FPS；GA 收集端逐筆 HTTP 回應未完成單獨監測（已改以真實後台收件驗證）。
- NOT APPLICABLE：CrazyGames 發布／審核、SDK、廣告及帳號改動。

自動正式站流程曾因等待初始化、誤把建立回合的 201 當成 200，以及選擇器／feed 等待而停止；保留原始失敗紀錄，不列為自動全程通過。成績回放及公開 API 的自動步驟已實際通過；封面、實際 feed 列、縮圖與連結由真實 Chrome 手動補驗，GA 由登入後台補驗。

證據位於工作區 `output/reaper-c-qa/`：`production-playing-390.png`、`production-over-390.png`、`production-cover-cua-390.jpg`、`production-leaderboard-cua-390.jpg`、`analytics-game-start-reaper.jpg`、`analytics-game-end-reaper.jpg`、`production-verification.json`。

## v3：依後續截圖修正的驗收

- PASS：死神在輸送帶後方，整段台面遮住身體；手套已獨立分離，沒有黑色矩形殘邊或切斷手指。
- PASS：HUD 箭頭／愛心以原紙牌位置對齊，班次與分數用字體實際墨跡置中。
- PASS：刀尖從約 `(306.5,190.2)` 向下掃到 `(195.9,272.4)`，位於金色區與幽靈身體中；0.28 秒純視覺動作在原 0.35 秒冷卻內結束。
- PASS：幽靈左右腳交替落地／抬腳並有兩段腿骨彎膝；實際錄下 1 秒 60 個影格，圖檔與原速 GIF 見 `motion-v3/`。這不是實體低階裝置長時間 FPS 驗證。
- PASS：收魂特效縮小並落進盒子，沒有往上飄過死神的臉。
- PASS：`tools/check_reaper_input_browser.py`，12 項真實 Chrome 斷言：雙擊只開一局、快速雙擊／三擊不選字或重開、原生雙指捏合不放大、Ctrl-wheel 觸控板式縮放被取消、長按選單被取消、連按 Space 與退出正常、沒有 JS 錯誤。
- PASS：六尺寸中／英／簡中 60 項斷言、49 項 Python 單元測試、`test_reaper_visual.mjs` 刀尖／腿部測試、`test_timed_replay.mjs`、Build 與 `--check`。
- PASS：共用規則、錢包、排行榜與 Analytics 原始碼未改，沒有改判定、冷卻、分數與獎勵時機。
- NOT TESTED：本次手機實機、iOS Safari 手勢及長時間低階裝置測試。
- BLOCKED：本次功能無阻塞。NOT APPLICABLE：CrazyGames 送審、SDK、廣告與帳號改動。

本次修改的正式部署與複測記錄將另列於 `motion-v3/RELEASE.md`，不把上述本機 QA 當成已發布。
