# The Last Hair v4 發布驗收

2026-11-28 使用者確認「好，畫面可以了，你測好上線」。核准本機 v4：全畫面、短胖六格步行、護髮並行步行、原稿手繪 HUD 與控制、距離牌字形與旗幟垂直置中。

範圍限本遊戲畫面及字串；規則、錢包、排行榜、存檔鍵、Analytics 事件契約不改。v3 細長腿版本為 FAIL，未發布，已由 v4 取代。原稿與生成來源保留在 design/，部署只帶 runtime WebP 與有 OFL 授權的自託管字型。

- PASS：13 項遊戲行為檢查、動畫與字形位置回歸檢查、49 項 Python 測試、build/check 與 diff whitespace。
- PASS：Chrome 模擬 320×640、390×844、790×740、1366×900；啟動、觸控護髮、六格步行、暫停恢復、回大廳、字型及圖片載入。詳見 qa-v4 與 qa-v4-actual。
- PASS：六格短胖體型、褲腰接合靜態複查；使用者實際預覽核准畫面。
- NOT TESTED：手機／平板實機、Safari／Firefox、長時間 FPS、實際聽音、正式排行榜寫入、GA4 後台收件。
- NOT APPLICABLE：此次為本站發布，沒有 CrazyGames 平台送審、SDK 或廣告改動，無 migration／API Worker 變更。
- BLOCKED：無發布阻塞。

正式部署版本、遠端基準與上線後驗收另記錄。

發布基準：origin/main `64a48d4`，遊戲實作 `6f04077`。整合後重新通過 49 項 Python、13 項行為、動畫回歸、5 個可執行 script 語法、JSON 解析、四尺寸 Chrome；qa-release-v4 為無狀態掛鉤的待發布頁面操作結果。插隊目錄與 origin/main 無差異。
