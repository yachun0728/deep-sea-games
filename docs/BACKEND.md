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
| `GET /api/v1/leaderboard?gameId=mines` | 查詢指定遊戲至多 20 筆最佳紀錄，依分數降序，同分依玩家 ID 排序；回傳 `playerId`、`displayName` 與 `score` |

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
- `0004_mines_ranked_rounds.sql` 在同次寫入結算及更新 `best_scores`，以已翻安全格數降序，同分依玩家 ID。回合限 30 分鐘、500 次有效操作。其他棋盤維持本機玩法。
- 部署順序為 `0004`、Worker、前端。回退前端再回退 Worker，可保留 `mines_rounds` 與榜單資料。

## 既有遊戲的串接分組

截至這一批，共 42 款可見項目。完成狀態以正式部署與實測分開記錄。

| 狀態或分組 | 遊戲 ID | 串接方向 |
| --- | --- | --- |
| 已正式發布 | frog | Worker 重播 |
| 已通過本機 D1，待發布 | mines | Worker 管理棋盤 |
| 回合制與解謎，待串接 | merge、ocean-link、mermaid、banquet、frontier | 依各款動作與關卡狀態定義伺服器驗證 |
| 即時操作與反應，待串接 | dream、runner、elevator、sneak、fishing、campaign、cat、bird、nap、reaper、blaster、skybuilder、carp、rider、boss、thief、baby、pudding、clock-out、peek、mosquito、last-hair、breakout、pet-walk、office-shoot | 逐款核對時鐘、輸入及隨機性再重播 |
| 同來源 iframe，待串接 | boba、dive、mrt、pancake、rocket-chair、eat-smaller、mirror-twins、shadow-relay、one-line-defense | 保留父子頁生命週期，增設必要橋接與 Worker 驗證 |
| 每日免費補給 | keno | 隨機補給與配額，不列競賽榜 |

隱藏中的遊戲依既有改造與上架流程處理。新版遊戲上線前須完成 [訪客排行榜檢查](../RELEASE_CHECKLIST.md#訪客排行榜)。
