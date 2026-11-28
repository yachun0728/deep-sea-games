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
