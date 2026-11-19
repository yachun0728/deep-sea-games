# Cloudflare Workers 後端

在 Repo 根目錄執行下列指令。需要 Node.js 與 Wrangler 4，兩個指令共用本機 D1 狀態。

```sh
npx wrangler@4 d1 migrations apply DB --local --config backend/wrangler.jsonc
npx wrangler@4 dev --local --config backend/wrangler.jsonc --var FRONTEND_ORIGIN:http://127.0.0.1:8765
```

`FRONTEND_ORIGIN` 是允許跨來源呼叫的完整 origin。除錯前端時可在另一個終端執行 `python3 -m http.server 8765 --bind 127.0.0.1`。使用 `http://127.0.0.1:8765` 開大廳。當前端在 `127.0.0.1` 或 `localhost` 時，排行榜預設連同一主機的 8787 埠。這組指令允許的前端 origin 是 `http://127.0.0.1:8765`。

| 方法與路徑 | 行為 |
| --- | --- |
| `GET /api/v1/health` | 確認 Worker 可查詢已套用 migration 的 D1 |
| `POST /api/v1/players` | 建立訪客，回傳 `id` 與一次性顯示的 bearer token |
| `GET /api/v1/me` | 使用 bearer token 查詢玩家 ID 與帳本餘額，初始為 0 |
| `GET /api/v1/leaderboard?gameId=mines` | 查詢指定遊戲至多 20 筆最佳紀錄，依分數降序，同分依玩家 ID 排序；回傳 `playerId`、`displayName` 與 `score` |

`frontend/services/api.mjs` 提供上述 API 的前端呼叫介面。資料庫保存 token 的雜湊。點數帳本以玩家 ID 和事件 ID 作為唯一鍵，排行榜保存每位玩家在各遊戲的最佳紀錄。寫入點數與成績的流程待定義伺服器驗證、交易與重試規則後接入。目前遊戲大廳仍使用既有 localStorage，訪客 token 的保存與帳戶恢復留待前端整合。

`backend/wrangler.jsonc` 使用本機 D1 ID，公開的 Workers 網址與預覽網址均關閉。部署時另行設定正式 D1、Worker 公開路由、允許的前端 origin 與訪客建立頻率限制。根目錄的 Wrangler 設定供原有靜態站使用。[Cloudflare D1 開始使用指南](https://developers.cloudflare.com/d1/get-started/)

大廳的遊戲選單取自當前可見的遊戲卡片。切換遊戲或回到大廳時會重新查詢 D1。`display_name` 可由可信來源匯入，缺少時顯示「訪客」及 ID 的前八碼。空資料庫會顯示空榜，新建訪客不會自動產生成績。

正式環境預設查詢前端同來源的 `/api/v1/leaderboard`。若 Worker 另有網址，在 `templates/index.html` 的 `leaderboard-api-origin` meta 填入完整 HTTPS origin，執行 `python3 tools/build.py`，並把 Worker 的 `FRONTEND_ORIGIN` 設為正式前端 origin。
