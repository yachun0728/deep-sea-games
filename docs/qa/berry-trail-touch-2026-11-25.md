# 莓果小蛇手機操作修正（2026-11-25）

依使用者實機截圖與連續指示：放大遊戲區、滑動靈敏、手機移除方向鍵、成功／失敗／重試都不顯示、消除上方空白。

## 修改

- 手機介面取消垂直置中，靠安全區頂端排列；壓縮標題與分數 HUD，棋盤接近滿寬。390×844 模擬下實際 Canvas 為 370×370（外框 378），標題頂距 10 CSS px、Canvas 頂距 106。
- 手機只以棋盤滑動轉向，隱藏方向鍵；暫停／重玩兩按鈕高 52px，提示改為「在棋盤上滑動轉向」。桌機保留實體鍵位 WASD／方向鍵與按鈕。
- 滑動門檻由 >18 改為 >=8 CSS px；可暫存一次快速接續轉彎，等下一格前進後才經原規則記錄，禁止反向且每格只轉一次。暫停／離頁清理尚未記錄的手勢，按 pointerId 隔離多指操作。
- 送分仍走現有流程；所有送分狀態與重試入口不顯示、不發出 live announcement、不參與版面。使用者主動開啟排行榜的載入訊息不在此次隱藏範圍。
- 沒有修改 shared 規則、速度、計分、API、D1、錢包、Analytics 事件或儲存格式，不需 migration 或 API 部署。

## 驗證

| 狀態 | 結果 |
| --- | --- |
| PASS | Python 48 tests；建置與簡中資料一致；git diff --check |
| PASS | `node tools/test_berry_trail.mjs`：原規則測試與新增真實子頁 VM 測試（7px 忽略、8px 轉向、快速接續轉彎、反向防護、暫停清理，操作紀錄通過未改動的 Worker 重播） |
| PASS | `node tools/test_berry_trail_api.mjs`：真實 Worker + 記憶體 SQLite，原有排名與存檔驗證通過 |
| PASS | `python3 tools/check_i18n_browser.py --suite berry_trail`，72 assertions，390×844／1366×900／844×390 三語、手機純滑動／桌機方向按鈕、成功與失敗狀態皆無 UI |
| PASS | Headless Chrome 額外六尺寸（390×844、430×760、320×568、768×1024、1366×900、844×390）繁中／英文／簡中無橫向溢出、主要按鈕 >=44px、hit test 與範圍檢查；本機真實對局吃莓果取得 10 分、碰撞送分成功，重玩、失焦暫停與路由重設正常 |
| PASS | Chrome `Input.dispatchTouchEvent` 真實觸控事件模擬：7px 不觸發、8px 觸發、第二次快速轉彎暫存；手機 Canvas 接近滿寬、上方不再置中留白；成功及失敗狀態連同 retry 強制設為非 hidden 後仍 display:none |
| FAIL | 無未解決失敗 |
| BLOCKED | 無開發阻塞 |
| NOT TESTED | 新版 iOS Safari／Android 實機手感、正式站更新、GA4 後台、低階及長時間效能。Chromium 模擬不能代表 Safari 實機通過 |
| NOT APPLICABLE | D1 migration、API 部署、CrazyGames 發布、音訊與多人 |

截圖：`berry-trail-touch-2026-11-25/mobile-playing.png`、`berry-trail-touch-2026-11-25/mobile-paused.png`。

以下為發布前驗收紀錄；正式發布結果見下節。

## 正式上線

使用者確認新版並指示「上」。已將 `fcdfdabff8442b61a664f57602efd4effc8f1dda` 推送 `origin/main`，發布主站 Worker 版本 `bb368b5c-b247-4e3a-a222-97d32b2fe80c`。此次不需變動 API Worker 或 D1。發布前遠端為 `eb5d1ef`，工作樹乾淨，插隊圖片無差異。

PASS：正式網站 `https://ticaticagames.com/#berry-trail` 在隔離 Chrome 的 390×844／1366×900 三語檢查通過；手機標題頂距 <20px、方向鍵不可見、按鈕觸控範圍正確。完成真實對局取得 10 分並送分成功；送分成功後 status 與 retry 均為 display:none。重玩、失焦暫停、返回大廳重設均通過，第一張卡片仍為莓果小蛇，未捕獲 runtime error。正式首頁、子頁、美術與 SEO 檔案經 SHA-256 比對均與核准版本一致。

NOT TESTED：iOS／Android 實機手感、Safari／Firefox、長時間及低階效能、GA4 後台收件。Chrome 裝置模擬不能代替實機。
