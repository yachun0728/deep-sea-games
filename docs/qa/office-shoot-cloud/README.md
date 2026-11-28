# 拒絕加班雲端排行榜驗收

- PASS：17 項原有遊戲回歸，含操作、Boss、BONUS、暫停與雙語繪製。
- PASS：`node tools/test_office_shoot_api.mjs`，真實 Worker + SQLite 全部 migrations；合法終局、未完成／非法證明、訪客所有權、版本、偽造成績、重送冪等、過期 revision、低分不覆蓋、同分排序、API/feed/資料列一致。
- PASS：`node tools/test_office_shoot_upload.mjs`，網路失敗、同一證明重送、成功通知與操作上限轉本機。
- PASS：49 項 Python 測試、build/check、語法與 diff check；既有 added/puzzle leaderboard 測試。
- PASS：正式瀏覽器自然結束一局 10 分，顯示「成績已送到排行榜」；正式 API、feed、D1 `game_leaderboard` 及大廳均為 10 分。390×844 繁中／英文結算與提示截圖已保存，桌面無 console error。
- PASS：API Worker `c3bb6b56-f57d-4960-b7f8-b5121880d281`，前端 Worker `dd208f47-9c15-4c53-90d5-b37c73296ae9`。
- NOT TESTED：實體手機、十分鐘長局、正式網路斷線重送（以 helper 測試驗證）。
- NOT APPLICABLE：資料庫 migration、CrazyGames 發布／審核。

影響：僅 office-shoot 新增雲端成績；共用 helper 增加可選操作數上限，其他遊戲預設不變。使用既有訪客 API、前 50 名及最高分策略，不寫登入帳號最佳成績。原有美術、BONUS、追蹤事件保留。開局 API 失敗、超過 10 分鐘或 4,000 筆操作時本機遊玩；本機歷史最佳不倒灌雲端。

遠端基準：`976aa978f1354285f8a810ba9a488d4de595bea0`；推送前重新 fetch，插隊等其他遊戲素材與遠端一致。
