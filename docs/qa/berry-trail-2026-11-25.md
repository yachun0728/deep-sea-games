# 莓果小蛇 Berry Trail 驗收版（2026-11-25）

新增 `berry-trail` 到經典小遊戲，並依使用者指定排大廳第一張。沿用提供的莓果森林美術與 `berryTrailBest`，採用 imagegen v2 封面與排行榜縮圖。原始 HTML、兩版封面原稿與生成提示詞均在 `games/berry-trail/design/`。支援繁中、英文、簡中。

基於遠端 `aba16f7dff45f9fdc6f8407573dd2e9af01abe0f`，保留最新版遊戲及插隊兩張圖片。這是本站驗收版，未發布正式遊戲。

## 已驗證

| 項目 | 結果／證據 |
| --- | --- |
| Build／一致性／簡中資料 | PASS：`python3 tools/build.py`、`--check`、`python3 tools/build_zh_hans.py --check` |
| Python 全套 | PASS：48 tests，`python3 -m unittest discover -s tools -p 'test_*.py'` |
| 遊戲規則與橋接 | PASS：`node tools/test_berry_trail.mjs`；吃莓果、轉向佇列、反向限制、身體／牆碰撞、尾格、吃滿、20 種子重播、非法終點、來源驗證、單次結算與 0 點派發 |
| Worker／儲存 | PASS：`node tools/test_berry_trail_api.mjs`；真實 Worker + 記憶體 SQLite 套全部 migration，驗證空榜、合法 10 分、錯誤訪客、非法／未完成 proof、重送、衝突、低分不覆蓋、同分順序、三語名稱 API、feed 與資料列。測試使用虛擬伺服器時鐘，不代表正式 D1 |
| 三語瀏覽器 | PASS：`python3 tools/check_i18n_browser.py --suite berry_trail`，63 isolated assertions（390×844、1366×900、844×390），含語言切換、實體鍵位 WASD、暫停／繼續、失焦、路由 |
| 額外版面檢查 | PASS：macOS headless Chrome，390×844、430×760、320×568、768×1024、1366×900、844×390 三語，按鈕至少 44px、主要按鈕 hit test、無橫向溢出 |
| 完整實際瀏覽器對局 | PASS：同源 iframe + 本機 Worker API，以有效轉向吃莓果得 10 分、碰撞結算，收到「成績已送到排行榜」，開啟榜單有資料，重玩、失焦暫停、離頁重設正常。此項為桌面 Chrome 裝置模擬 |
| 手機卡片 | PASS：390px 實際 CSS viewport，確認第一張是 Berry Trail、經典分類可見、滿版 imagegen 封面及英文題字清晰；見附件截圖 |
| JS／JSON | PASS：組合首頁與子頁所有 inline JS 語法、JSON script 解析；`git diff --check` |
| 目前失敗 | FAIL：無未解決失敗 |
| 目前阻塞 | BLOCKED：無開發阻塞；正式發布仍待使用者試玩核准 |
| 正式資料／裝置 | NOT TESTED：正式 D1、正式 Worker、正式前端、GA4 後台收件、Safari／Firefox、iOS／Android／平板實機、鎖屏與 App 切換、低階裝置 FPS 與長時間效能 |
| CrazyGames／廣告／音訊 | NOT APPLICABLE：此次不是 CrazyGames 上架；此遊戲不新增廣告、SDK、音訊、IAP 或多人 |

畫面：`berry-trail-2026-11-25/mobile-playing.png`、`berry-trail-2026-11-25/mobile-lobby.png`。

## 影響與發布順序

沿用錢包及既有儲存模型，遊戲不扣點、不將成績換點、不新增 BONUS；平台既有遊玩獎勵沿用 AN。新增 Analytics 名稱 `berry-trail`，既有遊戲追蹤事件不變。排名使用既有訪客 API 與 timedLeaderboard，Worker 以種子及操作重播計分，不信任前端自報分數。分享設定沿用既有 resultShare；正式分享連結尚未驗證。

核准後依序：套用 `backend/migrations/0019_game_names_berry_trail.sql` → 部署 API Worker → 發布前端。正式上線後再核對實際對局、D1、單款 API、大廳 feed 與 GA4。若回退，還原此前端與 API 註冊，不清除 `berryTrailBest` 或既有訪客排行榜資料。

## 正式發布紀錄

使用者於本次對話明確核准「直接上吧！」。核准遊戲版本 `933e929`，上線版本 `b9c7f80`（僅額外排除設計原稿靜態發布，遊戲內容不變），發布前核對遠端 `aba16f7` 並確認插隊素材沒有差異。

- PASS：正式 D1 已套用唯一待執行的 `0019_game_names_berry_trail.sql`，未清除或遷移玩家資料；三語名稱已唯讀查核。
- PASS：API Worker 已發布，版本 `44e1019e-562b-4af9-ae26-53acd8cdcdfe`。
- PASS：已推送 `origin/main`，主站 Worker 已發布，版本 `6d91e1fc-9a1c-45b8-8c80-c677e441f80e`。
- PASS：正式網址 `https://ticaticagames.com/#berry-trail`，正式首頁、子頁、封面、排行榜縮圖、about.html、robots.txt、sitemap.xml 均經瀏覽器 fetch SHA-256 比對核准版本一致。
- PASS：正式站隔離 Chrome（macOS，390×844 裝置模擬及 1366×900）三語標題、操作、44px 按鈕與版面；完整對局吃莓果取得 10 分、合法碰撞結算，收到「成績已送到排行榜」。正式 D1 唯讀查詢已有合法成績（最高 10 分）；遊戲內榜單可載入。重玩、失焦暫停、離頁重設均通過，未捕獲 runtime error。
- NOT TESTED：iOS／Android 實機、Safari／Firefox、低階及長時間效能、正式分享連結、GA4 後台收件。Chrome 裝置模擬不能代替實機。
- NOT APPLICABLE：CrazyGames 正式審核或發布，此次僅本站。

正式資料保留正常驗收對局的訪客成績；沒有以清除正式資料作為測試清理。
