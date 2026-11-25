# 遊戲驗收與推送

## 遊戲上線與 BONUS 驗收

新增、改造、重新上架、調整 BONUS 或準備發布時，必須依 [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) 核對適用項目，並記錄實測結果及未驗證事項。BONUS 採固定技能／里程碑獎勵，核對卡片標章、規則、單次入帳與離頁追蹤；不得以獎勵名義保留博弈機制。提交及推送後須區分遠端收件、正式內容更新、實機操作與 GA4 後台驗收，不能互相替代。純文件需求只更新規範，不執行遊戲改造或自動發布。

## 先提供可遊玩的驗收入口

尚未上架的遊戲概念先做骨架放在 `preview/`，流程見 [prototype.md](prototype.md)；本節的上線確認適用於正式上架。

每次交付新增或改版的遊戲，Agent 都要啟動待發布版本的驗收環境，提供使用者可點開就能玩的網址。連結應直達該遊戲（例如 `/#runner`），並附上版本、適用裝置與要驗收的操作。交付前由 Agent 點開網址，確認載入的是該版且可以開始遊玩。若需用手機實機驗收，須提供該手機可連線的預覽位址。

Agent 完成測試與推送驗收分支後，等使用者實際試玩並明確確認這個版本可以上線，再合併會觸發正式部署的分支或執行正式發布。驗收後若修改了本次驗收的內容，提供新版入口，等使用者重新確認。

## 從設計確認到正式發布

1. 確認畫風、角色與場景設定集及直式遊玩構圖後才製作遊戲畫面。採納的概念原圖與圖示原稿存入各遊戲的 `design/`，並記錄用途與版本。詳見 [手機畫面與美術設定](mobile-design.md)。
2. 實作完成後擷取 390×844 的遊玩畫面，將包含正式英文遊戲名的大廳圖示接進驗收版。提供直達遊戲與大廳的預覽網址，讓使用者可試玩並確認圖示與名稱。
3. 記錄使用者核准的版本與範圍。發布僅包含核准的遊戲、素材、文件、必要的相依程式及重新組合的產出。規則涉及排行榜時，先確認 Worker 能正確回放新版及仍在進行的舊版對局。
4. 核對最新遠端後，按 migration、API Worker、正式前端順序發布適用項目。正式網址更新後實際確認大廳圖示、遊戲入口與玩法，分開回報遠端收件、部署及驗收結果。

## 推送前必須檢查最新版（防止圖片或他人變更被蓋掉）

2026-11-20 使用者指定：插隊（Queue Cutter，`games/elevator/queue-cutter-cover.webp`、`games/elevator/queue-cutter-leaderboard.webp`）的封面與排行榜圖示曾被舊版本覆蓋。每次推送前：

1. `git fetch origin`，與 `origin/main` 及目標遠端分支比較；遠端較新時先合併或 rebase，保留對方變更，禁止強推。
2. 合併後重新執行 `python3 tools/build.py` 與 `--check`，`index.html` 一律由最新來源重新組合，不沿用舊的產出或以自己的版本解衝突。
3. 以 `git diff origin/main --stat` 與 `git diff origin/main -- games/elevator/` 核對：不得有未被授權的圖片／素材被還原或刪除；插隊兩張圖的內容須與遠端最新版一致，除非本次明確要改。
4. 推送後在 PR 或回報中記錄已核對的遠端 commit SHA。

## CrazyGames Release Gate

當遊戲準備上架、更新、重新上架或發布至 CrazyGames 時，必須執行本節檢查。

執行前必須閱讀：
- [CrazyGames 平台合規規範](crazygames-compliance.md)
- [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md)
- [跨裝置相容性與效能規範](cross-platform-performance.md)

### 1. 確認發布階段

- [ ] 確認目標階段：Basic Launch / Full Launch
- [ ] 確認本次版本符合該階段的要求
- [ ] 不得將 Basic Launch 的完成視為 Full Launch 合規

### 2. Build 與遊戲運作

- [ ] Build 成功
- [ ] 遊戲正常載入
- [ ] 核心玩法正常
- [ ] UI、音訊及操作正常
- [ ] Restart / Replay 正常
- [ ] 沒有重大 Runtime Error
- [ ] 沒有影響正常遊玩的重大 Bug

### 3. CrazyGames 平台合規

- [ ] 技術限制符合官方最新要求
- [ ] 遊戲內容符合平台政策及適用的 PEGI 12 要求
- [ ] 遊戲素材具有適當使用權
- [ ] Metadata、封面及截圖正確
- [ ] 廣告及 Monetization 整合符合目標發布階段
- [ ] 隱私及玩家資料處理符合要求

### 4. SDK 與廣告

若目標發布階段需要 SDK：

- [ ] SDK 初始化正常
- [ ] GameplayStart 正確觸發
- [ ] Audio / Mute 正常
- [ ] Pause / Resume 正常
- [ ] SDK 失敗時有適當處理

若遊戲使用廣告：

- [ ] 使用平台允許的廣告整合方式
- [ ] 廣告播放及結束流程正常
- [ ] 廣告前後遊戲狀態處理正常
- [ ] 沒有未經允許的第三方廣告

不適用的項目必須標示 NOT APPLICABLE。

### 5. QA 測試

依遊戲實際功能執行：

- [ ] Gameplay QA
- [ ] UI QA
- [ ] Input QA
- [ ] Audio QA
- [ ] Restart QA
- [ ] Save / Load QA（若適用）
- [ ] SDK QA（若適用）
- [ ] Ads QA（若適用）
- [ ] CrazyGames QA Tool（若適用）
- [ ] Mobile QA
- [ ] Tablet QA（若適用）
- [ ] Desktop QA
- [ ] Responsive Layout QA
- [ ] Touch / Mouse / Keyboard QA（依裝置適用）
- [ ] Performance / FPS QA
- [ ] Lifecycle / State Recovery QA

### 6. 驗證狀態

所有檢查項目必須使用以下狀態：

- PASS：已實際測試並通過
- FAIL：測試未通過
- NOT TESTED：尚未測試
- BLOCKED：受環境、權限或其他限制而無法測試
- NOT APPLICABLE：不適用

不得將未測試或無法測試的項目標示為 PASS。

### 7. 發布前報告

Agent 必須回報：

| 項目 | 結果 |
|---|---|
| 目標發布階段 | Basic Launch / Full Launch |
| Build | PASS / FAIL |
| Runtime | PASS / FAIL / NOT TESTED |
| Gameplay QA | PASS / FAIL / NOT TESTED |
| Platform Compliance | PASS / FAIL / BLOCKED / NOT TESTED |
| Cross-Platform QA | PASS / FAIL / NOT TESTED |
| SDK | PASS / FAIL / NOT APPLICABLE / NOT TESTED |
| Monetization | PASS / FAIL / NOT APPLICABLE / NOT TESTED |
| CrazyGames QA Tool | PASS / FAIL / NOT APPLICABLE / NOT TESTED |
| 未驗證項目 | 列出 |
| 阻塞問題 | 列出 |
| 發布風險 | 列出 |

### 8. 正式發布權限

- Agent 完成檢查後，必須提供驗收結果。
- 必須等待使用者實際試玩並明確核准。
- 未經使用者確認，不得合併會觸發正式部署的分支或執行正式發布。
- 有重大 FAIL、BLOCKED 或重要 NOT TESTED 項目時，必須說明風險。
- 不得將本站 Preview、Build 成功或 CrazyGames QA Tool 通過宣稱為 CrazyGames 正式審核通過。
- CrazyGames 正式審核及發布狀態，必須以平台實際結果確認。
