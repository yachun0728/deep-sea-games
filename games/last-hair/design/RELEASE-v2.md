# The Last Hair v2 發布核准與檢查

- 2026-11-28 使用者確認大廳可用並表示「大廳沒問題，上去吧」，授權發布此美術版本。
- 以最新遠端 main `b77b1e8757abe6d84a661f110873aa06318630bc` 建立乾淨發布 worktree；未夾帶本機其他遊戲的未提交修改。
- 範圍：Last Hair 原稿參考素材、Canvas 呈現與 HUD、手機按鈕配置、素材載入提示、採納原圖與 QA 紀錄，以及使用者要求的設計還原 skill／規範。大廳封面維持使用者確認版本。
- PASS：乾淨發布版 Build／--check、13 項遊戲行為測試、49 項 Python 測試、git diff --check、Wrangler dry-run；與 origin/main 比較 games/elevator/ 沒有任何差異。
- PASS：本機原稿素材版 390×844、320×640、1366×900 Chrome 模擬；詳見 qa-v2/VERIFICATION.md。正式站驗證結果另行記錄，不用本機結果代替。
- NOT TESTED：手機實機、Safari／Android、實體多點觸控、音訊聽感、長時間效能與 GA4 後台收件。
- NOT APPLICABLE：沒有資料庫 migration／後端 API／SDK／廣告變更；不是 CrazyGames 送審或發布。
- 已知限制：三張狀態立繪切換與位移／傾斜，尚非完整逐格走路動畫，已於使用者核准前說明。
- 原稿、QA、未壓縮角色與切圖報告保留 Git；.assetsignore 僅將本次 design/ 與不供執行使用的 PNG／JSON 排除靜態發布。

## 正式站結果

- 已提交、推送：`246b17d565d098819de15a92dd03f3187ab19fd4` → origin/main。
- Cloudflare 部署成功：Worker `deep-sea-games`，Version ID `372e06ad-2286-434c-95ec-b805dc124536`。12 個新增／修改靜態檔案，其餘既有資產沿用；未重新部署 API。
- 正式網址：<https://ticaticagames.com/#last-hair>。
- PASS：隔離 Chrome 158、390×844 模擬下，正式頁面與四張 WebP 的 SHA-256 均與發布版一致。實際從 hash 載入，開局距離增加；CDP 觸控護髮顯示正確立繪，釋放後可退出並返回有遊戲入口的大廳。畫布無水平溢出／超出視窗。截圖與結果見 `qa-production-v2/`。
- 驗證工具紀錄：Python urllib 曾收到 HTTP 403；curl 及 Chrome 均已成功讀取正式站，未將先前 403 當作正式站故障。
- NOT TESTED：實機、正式局完整通關與排行榜寫入、音訊聽感、GA4 後台。瀏覽器驗證刻意封鎖 Analytics 網域。
- NOT APPLICABLE：CrazyGames 送審、SDK、廣告與資料庫 migration。
