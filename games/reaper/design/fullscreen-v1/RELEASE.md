# 死神打工：原畫加上下資訊 v1

2026-11-29 使用者要求滿版、畫風角色不變，否決延伸場景／支架拼接後，指定「用本來的畫，但上下加上什麼東西」，並在實際截圖後回覆「好」。本版完整保留 400×523 核准遊玩構圖與所有角色素材；上方招牌，下方操作提示及最佳紀錄，填入原留黑區。新增紙材為原背景空白指示牌 (50,1080)–(300,1270) 無重繪裁切。未使用 imagegen 重新生成，也未改玩法、共用點數、排行榜、存檔或追蹤契約。

## 驗收

- PASS：實際 Chrome 六尺寸（390×844、320×568、430×932、768×1024、1366×900、844×390）完整原稿比例、角色等比例、操作位置、觸控開局／收魂／結算重玩、旋轉保留回合及返回大廳。見 results.json。
- PASS：待機、遊玩與結算實際截圖，原稿並排 comparison.png；原稿本身不裁切、不延展、不重複拼支架。較短畫面與桌機保持直式原畫，無足夠多餘空間時不顯示上下資訊牌。
- PASS：44px 頂部及 34px 底部 padding 的模擬安全區版面。這是版面模擬，不能視為 iOS 實機驗收。
- PASS：49 項單元、78 項六尺寸語系斷言、13 項真實 Chrome 連點／選取／縮放／退出斷言；刀尖幾何、原畫幽靈姿勢與共享 timed replay。
- NOT TESTED：實體 iPhone／Android／平板、iOS Safari 原生安全區與工具列變化、低階裝置長時間效能、此版本 GA4 後台重新收件。
- NOT APPLICABLE：CrazyGames 送審／SDK／廣告；資料遷移或 API Worker 部署。

初版延展場景曾出現橫紋支架，使用者指出後判定視覺 FAIL 並退掉；未部署。Chrome 此版本不提供 Emulation.setSafeAreaInsets，故明列 padding 模擬與原生安全區未驗證，未將不支援的呼叫視為通過。

## 正式發布與資料驗證

- 合併最新版遠端 `1eb57d2`（保留 Pet Walkies 美術與不列排行榜修改），發布遊戲 commit `2a9377a`；`dc56a5f` 排除本次 QA 截圖的公開靜態資源。
- 正式 Worker 版本：`4705363b-faf4-4690-9401-b646fd8fc352`。網址：https://www.ticaticagames.com/#reaper 。
- PASS：正式站觸控開局、普通幽靈收魂、三心結束、結算與送分；HTTP 201 開局，HTTP 200 回放結算，score=1、revision=1。
- PASS：回合 `9c87c83a-9ebb-41f4-a7d0-6357289d341b`，D1 唯讀 JOIN 確認 round_score=1、leaderboard_score=1、revision=1，rows_written=0。
- PASS：正式站實際遊玩截圖 live-captured-390.png，原畫與上下資訊沒有窄條拼接或角色拉伸。
- PASS：該回合客戶端恰好排入一次 game_start 與一次 game_end。GA4 後台收件仍標示 NOT TESTED，沒有用 dataLayer 取代後台證據。
- 未解決 FAIL／BLOCKED：無。實機與長時間效能的未驗證範圍仍維持上述 NOT TESTED。
