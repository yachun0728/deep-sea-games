# TOP DOGGO 本機關卡版驗證（2026-11-25）

PASS：build / build --check、Python unittest 48 項、TOP DOGGO 橋接與字串表、進度／解鎖／重玩／自由探索存檔隔離、操作與教學、退役 Worker 榜單拒絕新回合、diff --check。

PASS（瀏覽器）：十關選關、第 11 關施工中分頁、開始與暫停回選關、自由探索、390×844 選單與按鈕可見、英文切換、精簡任務條。桌機固定中央準心 display:none、手機 display:block；按住滑鼠攻擊未見 JS error。實際走到計程車上車、前進與方向鍵轉向，鏡頭維持車尾；碰撞與所有車型未完整回歸。

PASS（正式 D1）：依使用者要求備份並刪除 TOP DOGGO game_leaderboard 30 筆，刪除後查詢 0。備份位於本機 /private/tmp/top-doggo-leaderboard-backup-20261125.json。帳戶最高分與活動回合未刪除。原先涵蓋這兩類資料的操作被自動審核拒絕後，改成僅備份並刪除已授權的榜單分數。

FAIL（已修正）：初版 parent language callback 早於 campaignMenu 初始化，已加 ready 防護；簡中產出過期，已重產並重新通過 48 項測試。

NOT TESTED：iPhone Safari / Android 實機、低階裝置發熱與長時間效能、真人連續完整通過十關、各關實際平衡、實際喇叭音樂音效聽感、GA4 後台收件。

NOT APPLICABLE：CrazyGames SDK／QA Tool／平台審核（本次為本站本機試玩版）。

BLOCKED：無。未發布前端或 Worker；舊正式版本在新版發布前仍可能產生榜單分數。Worker 停用新回合的修改尚未部署。

2026-11-25 補充：操作說明次要小字改圖示／按鍵卡片，手機 16px、桌機 17px，畫面說明內文 16px；瀏覽器已檢查桌機與 390×844。新增 tools/test_top_doggo_audio.mjs，以 mock Web Audio 驗證開場／遊玩音樂切換、靜音、背景與不疊播；未以此推論真實裝置音訊聽感通過。

音訊疊播修正：場景切換同步斷開舊 musicBus、停止並斷開所有舊 voices，generation 使舊 interval 回呼失效；失去視窗焦點停音。mock Web Audio 測試覆蓋 stop() 拋錯時仍斷開舊輸出。已關閉 Agent 留下的試玩分頁；未宣稱使用者實際喇叭聽感已驗收。

草地碰撞：單元測試確認建築模型外緣 +0.15 安全邊界與角色半徑、空地／草地通行、牆面仍阻擋。瀏覽器以鍵盤實際走至房旁草地並保存截圖；未完整巡查所有建築與真機碰撞。
