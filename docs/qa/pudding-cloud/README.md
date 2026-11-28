# 布丁突圍雲端排行榜驗收

## 實作與範圍

沿用訪客 ranked boards、D1 `game_leaderboard` 最高分／前 50 名與既有同分排序。Worker 發種子，`shared/pudding-rules.cjs` 第 1 版以 10ms 步進驗證營帳選擇、旋轉、放置、鍛造／跳過、鍵盤與指標移動；僅合法失敗／八段全破計算成績。既有美術、難度、存檔 key、BONUS 與 Analytics 事件保留。修正玩法文件中過時的入場 10 點描述：實際程式一直沿用全站免費設定。

無新增 migration；不寫登入帳號 `player_best_scores`。每局超過 4,000 筆操作或 10 分鐘有效遊玩時轉本機成績，開局 API 失敗也可本機遊玩。歷史本機最佳不直接上傳；暫存的失敗提交可重送同一證明。長按鍵盤只記按下／放開變化。

## 已執行檢查

- PASS：`node tools/test_pudding.mjs` 21 項，含原有拼圖、敵人剋制、移動、八段 BONUS、結算、最佳紀錄與繪製，加上長按重複事件去重。
- PASS：改動前遊戲與抽出後模擬，種子 1、2、3、42，以相同步進逐步核對分數、血量、段落、武器格與入帳；終局分別 540、595、510、525。
- PASS：`node tools/test_pudding_api.mjs` 真實 Worker + SQLite 全 migrations；合法八段全破 2,610 分、訪客所有權、規則版本、未完成／非法證明、偽造成績欄位、過快提交、重送冪等、舊 revision、低分不覆蓋、同分先後、到期、API/feed/D1 一致及不寫帳號最佳成績。
- PASS：`node tools/test_pudding_upload.mjs` 網路失敗、原證明重送、成功通知、操作上限、離線本機開局及離頁取消開局。
- PASS：49 項 Python 測試、game_docs、build/check、Node 語法與 diff check；拒絕加班 API 及五張接龍計時榜回歸。
- PASS：本機真實瀏覽器自然終局 605 分並顯示上傳成功；390×844 繁中／英文結算，新增上傳提示與重玩／分享不重疊。
- NOT TESTED：實體手機、Safari／Firefox、十分鐘長局、正式斷線重送（以 helper 測試驗證）、GA4 後台收件。
- NOT APPLICABLE：CrazyGames 平台發布／QA Tool／正式審核。
- FAIL：無未解決測試失敗。
- BLOCKED：無。

## 發布基準

已合併遠端 `ea9055c`（包含 `902f8f8` 接龍新版），確認插隊、拒絕加班及接龍來源與素材未被還原。主功能 commit `df69099`，長按去重／離線補測 `ac5666f`。API Worker：`65fe37d6-9fe0-43cd-9528-0e8bc5fec524`。

## 正式驗收

- PASS：正式瀏覽器實際選擇／旋轉／放置／鍛造碎片與鍵盤走位，自然失敗於第 5 段，結算 **590 分**、BONUS 4 點，顯示「成績已送到排行榜」。
- PASS：正式 `/api/v1/leaderboard?gameId=pudding`、feed、D1 `game_leaderboard` 與大廳均為同一筆 **590 分**。瀏覽器未見 console error。
- PASS：390×844 繁中／英文新增上傳訊息與分享／重玩無遮擋；桌面結算與大廳截圖已保存。既有英文動態訊息及規則區仍有部分中文混用，本次未改動，不能視為全遊戲翻譯驗收通過。
- PASS：正式前端 Worker `a6455f27-e5b1-44c5-bc4c-58523c9750ea`，來源 `ac5666f`。初次部署 `fcbd4043-f994-4c72-a008-d25f0fbba30a` 的回合仍可由同一版規則完成上傳。

正式入口：<https://ticaticagames.com/?v=pudding-cloud-2#pudding>
- 初次整站比對遇到同步死神發布，布丁雲端回合仍正常，但該份正式 HTML 尚未包含長按去重。已合併最新遠端 `4b9b07a`，保留死神更新與布丁修正後重新組合；最終部署驗證另列下方。
- PASS：最終正式版本 `064e2931-7e32-4d0f-b68c-dbc7caafee94`；重新下載 HTML 與合併來源逐位元組一致（排除平台注入的 analytics script），SHA-256 `103ae11d3ff22dfa3c769ce45f7527abd2ccd29bca86167c79914941295e1884`。包含布丁長按去重及最新死神／接龍內容。
