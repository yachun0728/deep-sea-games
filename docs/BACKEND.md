# Cloudflare Workers 後端

在 Repo 根目錄執行下列指令。需要 Node.js 與 Wrangler 4，兩個指令共用本機 D1 狀態。

```sh
npx wrangler@4 d1 migrations apply DB --local --config backend/wrangler.jsonc
npx wrangler@4 dev --local --config backend/wrangler.jsonc --var FRONTEND_ORIGIN:http://127.0.0.1:8765
```

`FRONTEND_ORIGIN` 是允許跨來源呼叫的完整 origin，可用逗號分隔多個正式網址。除錯前端時可在另一個終端執行 `python3 -m http.server 8765 --bind 127.0.0.1`。使用 `http://127.0.0.1:8765` 開大廳。當前端在 `127.0.0.1` 或 `localhost` 時，排行榜預設連同一主機的 8787 埠。這組指令允許的前端 origin 是 `http://127.0.0.1:8765`。

| 方法與路徑 | 行為 |
| --- | --- |
| `GET /api/v1/health` | 確認 Worker 可查詢已套用 migration 的 D1 |
| `POST /api/v1/players` | 建立訪客，回傳 `id` 與一次性顯示的 bearer token |
| `GET /api/v1/me` | 使用 bearer token 查詢玩家 ID 與帳本餘額，初始為 0 |
| `GET /api/v1/leaderboard?gameId=mines` | 查詢指定遊戲至多 50 筆最佳紀錄，依分數降序、上榜時間升序、玩家 ID 排序；回傳 `playerId`、`displayName`、`score` 與 `recordedAt`（UTC ISO 8601，舊紀錄可為 null） |

`frontend/services/api.mjs` 提供上述 API 的前端呼叫介面。資料庫保存 token 的雜湊。點數帳本以玩家 ID 和事件 ID 作為唯一鍵，排行榜保存每位玩家在各遊戲的最佳紀錄。點數錢包仍使用既有 localStorage。青蛙吃蟲使用單獨的瀏覽器 Key 保存訪客憑證。清除網站資料或更換瀏覽器會建立新的訪客身分。

`backend/wrangler.jsonc` 包含正式 D1 binding 與 Worker 公開路由。使用 `--local` 時，Wrangler 仍使用獨立的本機資料。根目錄的 Wrangler 設定供原有靜態站使用。[Cloudflare D1 開始使用指南](https://developers.cloudflare.com/d1/get-started/)

大廳的遊戲選單取自當前可見的遊戲卡片。切換遊戲或回到大廳時會重新查詢 D1。`display_name` 可由可信來源匯入，缺少時顯示「訪客」。空資料庫會顯示空榜，訪客的第一個已驗證回合結束後才會有成績。

正式環境預設查詢前端同來源的 `/api/v1/leaderboard`。若 Worker 另有網址，在 `templates/index.html` 的 `leaderboard-api-origin` meta 填入完整 HTTPS origin，執行 `python3 tools/build.py`，並把 Worker 的 `FRONTEND_ORIGIN` 設為正式前端 origin。

## 青蛙吃蟲訪客成績

- `POST /api/v1/frog/rounds` 以訪客 bearer token 建立一局，回傳回合 ID 與種子。
- `POST /api/v1/frog/rounds/finish` 接收 `{id,ticks,presses}`。Worker 用 `shared/frog-rules.cjs` 重算自然結束時的遊戲分數，並核對回合所有者及經過時間。
- `0003_frog_ranked_rounds.sql` 把結算和最高分更新放在同一次資料庫寫入。相同結算重送會取得原分數。排行榜仍透過既有讀取 API。可重送的網路失敗在遊戲畫面提供重試，直到開始下一局或重新整理。
- 重播驗證可排除直接填分、過早送出和不符合遊戲規則的操作時間。已知種子可被用來編排合法的自動操作，因此這不是人類遊玩的證明。

部署這版時先套用第三個 D1 migration，再部署 Worker，最後發布前端。回退時可先回退前端，再回退 Worker，保留既有回合及排行榜資料。

## 踩地雷訪客成績

- `POST /api/v1/mines/rounds` 用既有訪客 bearer token 開立標準 5×5／3 雷棋盤。
- `POST /api/v1/mines/rounds/move` 接收 `{id,revision,action,cell}`。`action` 為 `open` 或 `flag`，`cell` 為 0～24。Worker 回傳遮蔽後的棋盤、已翻安全格與結果，未翻的地雷保留在伺服器。相同版本與動作重送時回傳已套用的棋盤，其他過期版本拒絕。
- `0004_mines_ranked_rounds.sql` 在同次寫入結算及更新 `best_scores`，以已翻安全格數降序，同分先達成者優先。回合限 30 分鐘、500 次有效操作。其他棋盤維持本機玩法。
- 部署順序為 `0004`、Worker、前端。回退前端再回退 Worker，可保留 `mines_rounds` 與榜單資料。

## 既有遊戲的串接分組

截至這一批，共 43 款可見項目。完成狀態以正式部署與實測分開記錄。

| 狀態或分組 | 遊戲 ID | 串接方向 |
| --- | --- | --- |
| 已正式發布 | frog | Worker 重播 |
| 已正式發布 | mines | Worker 管理棋盤 |
| 已接入，待整批發布 | merge、ocean-link、dream、runner、cat、skybuilder、sneak、reaper | Worker 管理棋盤或重播玩家輸入 |
| 回合制與解謎，待串接 | mermaid、banquet、frontier | 依各款動作與關卡狀態定義伺服器驗證 |
| 即時操作與反應，待串接 | elevator、fishing、campaign、bird、nap、blaster、carp、rider、boss、thief、baby、pudding、clock-out、peek、mosquito、last-hair、breakout、pet-walk、office-shoot | 逐款核對時鐘、輸入及隨機性再重播 |
| 同來源 iframe，待串接 | boba、dive、mrt、pancake、rocket-chair、eat-smaller、mirror-twins、shadow-relay、one-line-defense、tetris | 保留父子頁生命週期，增設必要橋接與 Worker 驗證 |
| 每日免費補給 | keno | 隨機補給與配額，不列競賽榜 |

隱藏中的遊戲依既有改造與上架流程處理。新版遊戲上線前須完成 [訪客排行榜檢查](../RELEASE_CHECKLIST.md#訪客排行榜)。

## 養珠訪客成績

- `POST /api/v1/boards/rounds` 接收 `{gameId:"merge"}`，以訪客 bearer token 取得新棋盤。
- `POST /api/v1/boards/rounds/move` 接收 `{gameId,id,revision,action}`。養珠的 `action` 為 `left`、`right`、`up` 或 `down`。Worker 套用移動及生成新珍珠；沒有合法移動才結算。
- `0005_ranked_boards.sql` 在同次寫入更新回合與較高的個人最佳分數。回合限兩小時、16,384 次有效操作；同版本與動作可重送。其他遊戲使用這個 API 前須各自註冊及驗證規則。上線先套用 `0005`，再部署 Worker、最後發布前端。

## 榜單時間與每款前 50 筆

`0006_leaderboard_top_50.sql` 在 D1 接受新上榜紀錄或個人進步時，以 UTC 記錄時間。大廳顯示台北時間；相同分數先達成者優先，同毫秒再依玩家 ID。舊資料缺少時間時維持空值，同分排在已記時紀錄之前，避免假造時間或將舊成績移到同分隊尾。

`player_best_scores` 保留給有登入的帳戶，訪客不寫入。公開 API 讀取 `game_leaderboard`，每款最多 50 筆，每位訪客同一款最多一筆。對局本身仍由各遊戲資料表保存，供驗證重送。

`0006` 將既有訪客榜 `best_scores` 改名為 `game_leaderboard`，每款保留前 50 筆，並建立空的帳戶用 `player_best_scores`。原名稱暫時以唯讀 view 保留，既有 Worker 可在切換期間繼續查榜。先套用 D1 migration，再部署新版 Worker 與前端。

## 深海連連看訪客成績

簡單模式的 6×8 棋盤使用排行榜。Worker 為每關發出亂數種子，依 24 組配對重播路徑、消除與洗牌。每次驗證成功才發下一關種子並以通關數更新公開榜。同分依達成時間排序。標準和挑戰模式仍保存各自的本機紀錄，既有提示、獎勵與 GA4 流程不變。

沿用棋盤對局 API。開局的 `gameId` 為 `ocean-link`，動作為依序編碼的 24 組配對，`a * 80 + b` 表示一組。套用 `0007_ranked_board_checkpoints.sql` 後，回合可在終局前更新已驗證的關卡紀錄，與公開榜同次入帳。回退時先回退前端與 Worker，保留資料表欄位及既有紀錄。

## 時序修復訪客成績

沿用棋盤對局 API，以 `dream` 開局。每關由 Worker 發種子，瀏覽器送出停針時的 10 毫秒步數。Worker 檢查步數未超過伺服器經過時間，重播指針及反轉，驗證命中才更新通過關卡數。失手結束本局；同一停針請求可重送。排行榜關卡最多考慮每關 120 秒的遊戲時間，超過仍可本機繼續。允許按同樣規則自動操作的可能性，與青蛙吃蟲相同。

大廳輪播以 `GET /api/v1/leaderboard/feed` 一次讀取各款已有已驗證成績的公開榜，再依大廳可見遊戲篩選。單款查詢端點維持原契約。

## 閃避跑酷訪客成績

沿用棋盤對局 API，以 `runner` 開局。Worker 發出障礙種子，結束時客戶端送出固定 10 毫秒步進數與各次換道。Worker 重算障礙、換道插值與碰撞，只有在指定步數確實碰撞才以整數公尺更新公開榜。每局可驗證最多十分鐘及 6,000 筆換道，超過仍可本機遊玩。里程碑點數維持原有本機流程。

## 屋頂貓貓、蓋樓大師、偷偷下班與死神打工訪客成績

四款沿用棋盤對局 API，使用固定 10 毫秒步進及共用重播驗證。屋頂貓貓記錄跳躍按下／放開，Worker 依種子重算屋頂、碰撞與整數距離。蓋樓大師記錄吊鉤放手，Worker 重算落點、傾斜、倒塌及終局樓層數。偷偷下班記錄按住／放開，Worker 重算老闆轉身、發現時機和完成關卡數。死神打工記錄揮鐮，Worker 重算靈魂、冷卻、誤接、漏接與最終接走數。四款只接受自然終局，驗證上限為十分鐘和 6,000 筆操作。里程碑點數和瀏覽器既有紀錄沿用原本流程，驗證成績只寫公開榜。
