# 死神打工動作與防誤觸修正版：正式驗收

## 版本

- 功能提交 `abc2362`，點擊高亮補件 `2a8ff0b`；整合布丁最新連按修正後提交 `4b9b07a` 已進入 main。
- 自有部署 `803ad93c-49c3-402b-8cff-170916e62bea`；後續並行發布曾短暫切換到舊版，已修復。最終驗證所見為包含兩邊修正的 `064e2931-7e32-4d0f-b68c-dbc7caafee94`。
- 實際讀取 www、主網域及 Worker 網址，三處均包含 `rpLegPose`、`touch-action:none!important` 及最新布丁 held-input 去重；沒有只依 CLI 成功判斷正式內容。

## 實際結果

| 項目 | 結果 |
|---|---|
| HUD／前後層次／完整手套 | PASS：正式截圖 `live-ready-390.png` |
| 幽靈步態及刀尖下揮 | PASS：正常觸控開局後，以新畫面擷取到的靈魂位置操作，接走 1 位 |
| 三心結束與伺服器回放 | PASS：開局 HTTP 201，結算 HTTP 200；分數 1、revision 1 |
| D1 與公開榜 | PASS：回合 `c2771530-91cd-4936-9835-d42a63a38de4` JOIN game_leaderboard，round_score=1、leaderboard_score=1、revision=1；唯讀驗證寫入 0 rows |
| 正式輸入壓力檢查 | PASS：13 項，包括連點不選字／重開、點擊高亮關閉、原生雙指捏合與 Ctrl-wheel 不縮放、長按選單取消、Space 與退出正常 |
| Analytics | PASS：新版客戶端這一局只有一個 game_start 與 game_end；追蹤原始碼與契約未改。上一版 GA 後台收件證據保留在 QA；本次沒有將 dataLayer 當成新的後台收件證據 |
| 單元／語系尺寸／回放 | PASS：49 項單元、60 項六尺寸語系斷言、刀尖及雙腿步態幾何檢查、共用 timed replay |
| 未解決 FAIL | 無 |
| BLOCKED | 本次正式發布無阻塞 |
| NOT TESTED | 手機／平板實機、iOS Safari 手勢、長時間低階效能、此修正版 GA 後台重新核對 |
| NOT APPLICABLE | CrazyGames 送審、SDK、廣告、帳號與資料遷移 |

## 發布期間的修正

第一次部署漏入剛新增的布丁 held-input 修正，已立即合併並重新發布；後續另有並行部署短暫切換舊頁面。最終正式內容已逐項讀取並通過新版完整遊玩與 13 項原生輸入檢查。保留這段記錄，不把中途的版本失敗寫成通過。

根工作區曾因其他未完成變更引用不存在的 `games/pet-walk/style.css` 而無法 build；本次使用乾淨隔離 checkout 重建、驗證及發布，沒有藉此改動其他遊戲。
