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
| `GET /api/v1/leaderboard?gameId=mines` | 查詢指定遊戲至多 50 筆最佳紀錄，依分數降序、上榜時間升序、寫入順序、玩家 ID 排序；回傳 `playerId`、`displayName`、`score` 與 `recordedAt`（UTC ISO 8601，舊紀錄可為 null） |

`frontend/services/api.mjs` 提供上述 API 的前端呼叫介面。資料庫保存 token 的雜湊。點數帳本以玩家 ID 和事件 ID 作為唯一鍵，公開榜每款保留前 50 筆，訪客只寫公開榜。點數錢包仍使用既有 localStorage。青蛙吃蟲使用單獨的瀏覽器 Key 保存訪客憑證。清除網站資料或更換瀏覽器會建立新的訪客身分。

`backend/wrangler.jsonc` 包含正式 D1 binding 與 Worker 公開路由。使用 `--local` 時，Wrangler 仍使用獨立的本機資料。根目錄的 Wrangler 設定供原有靜態站使用。[Cloudflare D1 開始使用指南](https://developers.cloudflare.com/d1/get-started/)

大廳的遊戲選單取自當前可見的遊戲卡片。切換遊戲或回到大廳時會重新查詢 D1。`display_name` 可由可信來源匯入，缺少時顯示「訪客」。空資料庫會顯示空榜，訪客的第一個已驗證回合結束後才會有成績。

正式環境預設查詢前端同來源的 `/api/v1/leaderboard`。若 Worker 另有網址，在 `templates/index.html` 的 `leaderboard-api-origin` meta 填入完整 HTTPS origin，執行 `python3 tools/build.py`，並把 Worker 的 `FRONTEND_ORIGIN` 設為正式前端 origin。

## 青蛙吃蟲訪客成績

- `POST /api/v1/frog/rounds` 以訪客 bearer token 建立一局，回傳回合 ID 與種子。
- `POST /api/v1/frog/rounds/finish` 接收 `{id,ticks,presses}`。Worker 用 `shared/frog-rules.cjs` 重算自然結束時的遊戲分數，並核對回合所有者及經過時間。
- `0003_frog_ranked_rounds.sql` 把結算和最高分更新放在同一次資料庫寫入。相同結算重送會取得原分數。排行榜仍透過既有讀取 API。可重送的網路失敗在遊戲畫面提供重試，直到開始下一局或重新整理。
- 重播驗證可排除直接填分、過早送出和不符合遊戲規則的操作時間。已知種子可被用來編排合法的自動操作，因此這不是人類遊玩的證明。

部署這版時先套用第三個 D1 migration，再部署 Worker，最後發布前端。回退時可先回退前端，再回退 Worker，保留既有回合及排行榜資料。

## 使用 SDK 加入排行榜

1. 在既有開局和結算接上 `frontend/services/api.mjs`。SDK 使用共用訪客身分及正式 API 網址。通用回合使用 `startBoardRound(gameId, signal)` 和 `moveBoardRound(token, move, signal)`，可參照深海連連看或 `js/timed-leaderboard.js` 的實際呼叫。
2. 在 Worker 註冊該遊戲的對局驗證，從合法操作計算成績。大廳會從公開排行榜 feed 讀取分數。單款名次可用 `createApiClient(arcadeApiOrigin()).leaderboard(gameId)`。
3. 用本機 Worker 和 D1 跑一局，確認合法結算入榜，直接填分與重送依契約處理。新增遊戲的顯示及發布驗收見 [新增遊戲必接訪客排行榜](../README.md#新增遊戲必接訪客排行榜)。

## 分享成績連結

玩家結算後可分享已驗證成績。連結格式為 `https://ticaticagames.com/s/<10 碼代碼>`，打開後顯示成績卡和「我也要玩」按鈕，貼到 LINE、Facebook、Discord 等平台會出現 Open Graph 預覽。

| 方法與路徑 | 行為 |
| --- | --- |
| `POST /api/v1/shares` | 訪客 bearer token，body `{gameId, roundId, lang}`。只接受 `shared/share-games.mjs` 列出的遊戲，並確認回合屬於該訪客、且已有驗證成績。同一回合永遠回同一條連結，回傳 `{id, gameId, score, path}`，不含玩家 ID |
| `GET /s/<id>`（也接受 HEAD） | 成績卡頁面。預設使用建立時的語言，`?lang=en` 或 `?lang=zh` 可覆寫；不存在的代碼回 404 頁 |

- `0012_result_shares.sql` 新增 `result_shares` 表。建立連結時複製當下分數，之後不會變動。
- 主站由根目錄 `wrangler.jsonc` 的 `site/worker.mjs` 處理，只有 `/s/*` 會執行這支程式（`run_worker_first`），再透過 service binding 轉給 API Worker。其餘路徑照舊由靜態資產直接回應。分享頁內的連結與預覽圖使用 API Worker 的 `SITE_ORIGIN`。
- 前端 SDK 是 `frontend/services/share.mjs`（`createShareLink`、`inviteLink`、`shareMessage`、`presentResult`）與 `frontend/services/share-card.mjs`。按下分享後開啟對話框：在瀏覽器以 canvas 產生 1080×1350 PNG 成績卡（TICATICA logo、結束當下的遊戲畫面、遊戲名稱、分數與站名），提供「分享圖片」（支援檔案分享的手機以系統選單傳送 PNG 與連結）、「下載圖片」與「複製連結」。成績卡不上傳伺服器；分享頁的 Open Graph 預覽圖目前仍是站台 logo。卡片與對話框文字依按下時的介面語言產生。
- 所有可見遊戲（每日免費補給「挖金礦」除外）都已接入，設定集中在 `shared/share-games.mjs`：中英文名稱、`AN.end` 中代表成績的參數、單位與文案。`js/result-share.js` 在回合結束時自動於操作區（排行榜重送按鈕或遊戲訊息之後）插入「分享成績」按鈕，並截取畫面中最大的 canvas（含同源 iframe）。截圖幾乎是單色、無法匯出，或該款標為只用封面時，卡片改用 `cover.webp` 或大廳圖示。
- 成績來源分兩種：使用 `timedLeaderboard` 的遊戲由排行榜模組提供成績，驗證成功後連結升級為 `/s/<id>` 成績頁，驗證中按鈕顯示「成績驗證中…」；其他遊戲由 `js/analytics.js` 的 `deepSeaRoundEnd` 掛勾取 `AN.end` 參數（`abandoned`、`restart`、`cancelled` 不提供分享），連結為 `/#<gameId>`。掛勾不影響 GA4 事件內容。
- 新增遊戲時在 `shared/share-games.mjs` 加一列即可；若遊戲已有自己的 `#<gameId>-share` 按鈕（例如「別看」），不會另外插入按鈕，由遊戲呼叫 `resultShare.open(gameId)` 開啟同一個對話框。
- 未接排行榜的遊戲：卡片仍顯示本局分數（瀏覽器端數值，未經伺服器驗證），連結打開直接進遊戲；兩者的成績卡外觀相同。
- 非正式網域（例如本機預覽容器）產生的連結使用當下網址，`ticaticagames.com` 與 `github.io` 一律連到 `https://ticaticagames.com`。
- 本機測試：先套用 migration，再以 `--var SITE_ORIGIN:http://127.0.0.1:8765` 啟動 API Worker；本機產生的分享連結由 `127.0.0.1:8787/s/...` 回應。`node tools/test_result_shares.mjs` 以 SQLite 跑全部 migration 並測試路由。
- 部署順序：套用 `0012` → 部署 API Worker → 部署主站 Worker（根目錄 `wrangler.jsonc`）→ 發布前端。回退時依相反順序，保留 `result_shares` 資料；回退主站 Worker 後 `/s/*` 會回到 404。

### 踩地雷訪客成績

踩地雷使用同一支 SDK 的專用介面。

```js
import { startMinesRound, moveMinesRound } from './frontend/services/api.mjs';

const round = await startMinesRound(signal);
const next = await moveMinesRound(round.token, {
  id: round.id,
  revision: round.revision,
  action: 'open',
  cell: 0,
}, signal);
```

每步使用最新回傳的 `revision`。`open` 用於翻格和快開，`flag` 切換旗子。Worker 在標準 5×5／3 雷棋盤判定每步，回應中只含已翻開的安全格數字、玩家旗子及回合狀態。勝負後也不傳雷位。相同版本及動作可安全重送。

只有通關才使用既有 D1 trigger 更新訪客榜。標準棋盤通關為 22 分，既有榜單保留。回合限 30 分鐘、500 次有效操作，其他棋盤在本機遊玩。本次沿用正式 D1 表與 triggers，可先部署 Worker 再發布前端，無新增 migration。

## 既有遊戲的串接分組

截至這一批，共 43 款可見項目。完成狀態以正式部署與實測分開記錄。

| 狀態或分組 | 遊戲 ID | 串接方向 |
| --- | --- | --- |
| 已正式發布 | frog | Worker 重播 |
| 已正式發布 | mines | Worker 管理棋盤 |
| 已接入，待整批發布 | merge、ocean-link、dream、runner、cat、skybuilder、sneak、reaper、bird、tetris、elevator、fishing、top-doggo | Worker 管理棋盤或重播玩家輸入 |
| 回合制與解謎，待串接 | mermaid、banquet | 依各款動作與關卡狀態定義伺服器驗證 |
| 即時操作與反應，待串接 | campaign、nap、blaster、carp、rider、boss、thief、baby、pudding、clock-out、peek、mosquito、last-hair、breakout、pet-walk、office-shoot | 逐款核對時鐘、輸入及隨機性再重播 |
| 同來源 iframe，待串接 | boba、dive、mrt、pancake、eat-smaller、mirror-twins、shadow-relay、one-line-defense | 保留父子頁生命週期，增設必要橋接與 Worker 驗證 |
| 每日免費補給 | keno | 隨機補給與配額，不列競賽榜 |

隱藏中的遊戲依既有改造與上架流程處理。新版遊戲上線前須完成 [訪客排行榜檢查](../RELEASE_CHECKLIST.md#訪客排行榜)。

## 養珠訪客成績

- `POST /api/v1/boards/rounds` 接收 `{gameId:"merge"}`，以訪客 bearer token 取得新棋盤。
- `POST /api/v1/boards/rounds/move` 接收 `{gameId,id,revision,action}`。養珠的 `action` 為 `left`、`right`、`up` 或 `down`。Worker 套用移動及生成新珍珠；沒有合法移動才結算。
- `0005_ranked_boards.sql` 在同次寫入更新回合與較高的個人最佳分數。回合限兩小時、16,384 次有效操作；同版本與動作可重送。其他遊戲使用這個 API 前須各自註冊及驗證規則。上線先套用 `0005`，再部署 Worker、最後發布前端。

## 榜單時間與每款前 50 筆

`0006_leaderboard_top_50.sql` 在 D1 接受新上榜紀錄或個人進步時，以 UTC 記錄時間。大廳顯示台北時間；相同分數先達成者優先，同毫秒以 `0008` 的 `score_order` 寫入順序判定。舊資料缺少時間時維持空值，同分排在已記時紀錄之前，避免假造時間或將舊成績移到同分隊尾。

`player_best_scores` 保留給有登入的帳戶，訪客不寫入。公開 API 讀取 `game_leaderboard`，每款最多 50 筆，每位訪客同一款最多一筆。對局本身仍由各遊戲資料表保存，供驗證重送。

`0006` 將既有訪客榜 `best_scores` 改名為 `game_leaderboard`，每款保留前 50 筆，並建立空的帳戶用 `player_best_scores`。原名稱暫時以唯讀 view 保留，既有 Worker 可在切換期間繼續查榜。先套用 D1 migration，再部署新版 Worker 與前端。

## 深海連連看訪客成績

簡單模式的 6×8 棋盤使用排行榜。Worker 為每關發出亂數種子，依 24 組配對重播路徑、消除與洗牌。每次驗證成功才發下一關種子並以通關數更新公開榜。同分依達成時間排序。標準和挑戰模式仍保存各自的本機紀錄，既有提示、獎勵與 GA4 流程不變。

沿用棋盤對局 API。開局的 `gameId` 為 `ocean-link`，動作為依序編碼的 24 組配對，`a * 80 + b` 表示一組。套用 `0007_ranked_board_checkpoints.sql` 後，回合可在終局前更新已驗證的關卡紀錄，與公開榜同次入帳。回退時先回退前端與 Worker，保留資料表欄位及既有紀錄。

## 時序修復訪客成績

沿用棋盤對局 API，以 `dream` 開局。每關由 Worker 發種子，瀏覽器送出停針時的 10 毫秒步數。Worker 檢查步數未超過伺服器經過時間，重播指針及反轉，驗證命中才更新通過關卡數。失手結束本局；同一停針請求可重送。排行榜關卡最多考慮每關 120 秒的遊戲時間，超過仍可本機繼續。允許按同樣規則自動操作的可能性，與青蛙吃蟲相同。

大廳以 `GET /api/v1/leaderboard/feed` 讀取公開榜。依 `lastPlayedAt`（UTC ISO 8601，可為 null）由新到舊排列遊戲，同時間以遊戲 ID 排序。前端先篩掉不可見遊戲，再取前 10 款，每款顯示最高分及最後一次排行活動時間（台北時間）。大廳可見時每 30 秒重新整理。榜內同分依先達成者優先，單款查詢端點維持原契約。

`0009_leaderboard_activity.sql` 以 D1 trigger 記錄 Worker 驗證的終局或排行檢查點，即使沒有刷新最高分也會更新。開始或重送同一筆操作不計入活動。舊紀錄以原有的成績時間初始化，缺時間的遊戲排在後面。部署依序套用 migration、更新 Worker、發布前端；回退時依相反順序切回版本，保留新增的活動表與 triggers。

## 閃避跑酷訪客成績

沿用棋盤對局 API，以 `runner` 開局。Worker 發出障礙種子，結束時客戶端送出固定 10 毫秒步進數與各次換道。Worker 重算障礙、換道插值與碰撞，只有在指定步數確實碰撞才以整數公尺更新公開榜。每局可驗證最多十分鐘及 6,000 筆換道，超過仍可本機遊玩。里程碑點數維持原有本機流程。

## 屋頂貓貓、蓋樓大師、偷偷下班與死神打工訪客成績

四款沿用棋盤對局 API，使用固定 10 毫秒步進及共用重播驗證。屋頂貓貓記錄跳躍按下／放開，Worker 依種子重算屋頂、碰撞與整數距離。蓋樓大師記錄吊鉤放手，Worker 重算落點、傾斜、倒塌及終局樓層數。偷偷下班記錄按住／放開，Worker 重算老闆轉身、發現時機和完成關卡數。死神打工記錄揮鐮，Worker 重算靈魂、冷卻、誤接、漏接與最終接走數。四款只接受自然終局，驗證上限為十分鐘和 6,000 筆操作。里程碑點數和瀏覽器既有紀錄沿用原本流程，驗證成績只寫公開榜。

## 俄羅斯方塊與便便鳥大戰狼群訪客成績

俄羅斯方塊（Block Drop）沿用 `tetris` ID。父頁使用已驗證來源的 iframe bridge 申請訪客回合及記錄固定步進操作；Worker 與子頁共用七袋、SRS、鎖定與消行規則，只以自然終局重算的分數排行。子頁單獨開啟仍可遊玩並保存原本本機紀錄。

便便鳥大戰狼群記錄跳躍按下／放開與投射物，Worker 用種子重算障礙、狼王與終局距離。兩款都只寫 `game_leaderboard`，沿用十分鐘、6,000 筆操作上限與同回合防重送驗證。

插珍奶（`boba`）以杯數排行：`shared/boba-rules.cjs` 在 Worker 與子頁共用，Worker 用種子重播按住／放開／取消／續命廣告／結束輸入，只接受以結束輸入收尾的回合；只寫 `game_leaderboard`，沿用十分鐘與 6,000 筆操作上限、同回合防重送。`game_names` 本來就有 `boba`，不需要新的 migration。

新增遊戲的預設串接要求與 PR 驗收紀錄見 [新增遊戲必接訪客排行榜](../README.md#新增遊戲必接訪客排行榜)。

## Frontier Islands 與 Roar Through the Ceiling 訪客成績

- `frontier` 使用既有棋盤 API，Worker 持有完整遠征世界。每段最多 400 個 50 毫秒步數與 1,600 個操作，驗證移動、建造、選卡、訓練與關卡轉移。以已完成島數（0～50）寫公開榜，島嶼完成時 checkpoint，戰敗時結算。可在同一訪客身分恢復最後已驗證狀態；傳輸回合到期後從驗證快照建立新回合。排行進度獨立於既有本機存檔。斷線時暫停並保留待重送請求，伺服器已收件的相同版本可安全重試。
- `rocket-chair` 使用共用種子規則，記錄量化推力（0～1.2，精度 0.01）、觸控／語音模式、衝刺、一次廣告續命與咖啡續命，按固定 10 毫秒步數重播。Worker 由樓層、耗時與障礙罰時重算提早下班分鐘數；離局或未通關為 0。麥克風音訊與校準錄音不傳給 Worker，驗證的是合法輸入下的遊戲結果。
- 延用 `0007` checkpoint 與 `0008` 排序，無新增 D1 migration。兩款都沿用訪客公開榜前 50 筆與同分最早達成的排序。
便便鳥大戰狼群記錄跳躍按下／放開與投射物，Worker 用種子重算障礙、狼王與終局距離。兩款都只寫 `game_leaderboard`，沿用十分鐘、6,000 筆操作上限與同回合防重送驗證。

### 收盤之前

使用棋盤對局 API 開 market-desk 訪客回合。Worker 發種子，客戶端結局送出最多 20 個選項（0 刊登、1 暫緩、2 示警）。共享規則重播至第 20 天或專注力歸零，再將最終信心指數乘 100 存為整數 NT$。中途離開和未結束的操作序列不入榜。沿用現有對局期限、版本、訪客授權、重試及 D1 排序，不需要新 migration。部署先更新 Worker，再發布靜態前端；回退可還原前端與 Worker，保留已存的排行榜資料。

## 首頁更新與快取

根目錄的 `_headers` 要求首頁、HTML 與 SDK 檔案每次重新驗證快取。部署時連同靜態資產一起發布，玩家從首頁開啟即可取得目前版本。


## 新增的共用 SDK 驗證器

鯉魚躍龍門、偷睡大師、外送員、胖老闆、偷水果、寶寶逃洗澡、宣傳車、蚊子、最後一根頭髮與人魚接龍使用既有 `timedLeaderboard`，透過 `startBoardRound` 和 `moveBoardRound` 送出固定時間步進與操作。Worker 與前端共用 `shared/<game>-rules.cjs` 計算終局。單局驗證上限沿用十分鐘與 6,000 次輸入，超過上限仍可本機遊玩。

此批驗證器使用既有棋盤 API 與公開榜。每日挖礦屬每日補給，排行榜接入需另訂與點數分離的競賽指標。

## 靜態入口快取

根目錄 `_headers` 要求首頁、HTML、共用 SDK 與 shared 資源使用 `Cache-Control: no-cache, must-revalidate`。瀏覽器下次導覽會重新驗證。已開啟的頁面繼續保留目前遊戲狀態，重新導覽時讀取更新。


### 本批驗證紀錄

2026-11-19，本機 Worker + 暫存 D1 驗證上述十款開局、合法終局、榜單讀回與重送。為縮短測試等待，測試腳本只在本機資料庫調整 issuedAt，重播引擎使用真實規則逐步運算。桌面與 390px 的遊戲翻譯、切換語言、版面及初始化檢查通過。全站 i18n 執行仍因宴會遊戲既有漏翻中止，針對十款的手機測試最後遇到舊頁首錢包定位斷言失敗。實體手機、正式站自然終局與 GA4 後台尚未驗收。

其餘尚待接入的競賽遊戲包含 blaster、boba、dive、mrt、pancake、pudding、clock-out、peek、breakout、pet-walk、office-shoot、banquet、eat-smaller、mirror-twins、shadow-relay、one-line-defense、on-pitch。book-sort 已由獨立 SDK 模組接入。


## 已串接遊戲的榜單顯示

Frontier Islands 需由「訪客排行挑戰」啟動可驗證遠征，島嶼完成後提交檢查點。既有本機遠征進度保留。Roar Through the Ceiling 於回合完成後提交重播。兩款的遊戲下方提供可展開的單款排行榜，空資料時顯示空榜提示。大廳只呈現近期有排行活動的遊戲。

Closing Call 開局會等待訪客排行回合準備完成，避免快速點擊時錯過已預取的回合。回合取得失敗時顯示本機遊玩狀態。單款排行榜位於遊戲的結算區。

## Reef Blaster 訪客距離榜

使用 `blaster` 棋盤回合。Worker 與瀏覽器共用 `shared/blaster-rules.cjs`，用伺服器種子重播固定 10 毫秒步進、移動目標、方向鍵及選卡。只有編隊歸零的合法終局才會提交整數公尺，公開榜每位訪客保留最高距離，分數相同依達成時間。沿用現有十分鐘與 6,000 筆輸入上限，超出或連線失敗可繼續本機遊玩。手動退出不提交排行，仍保存本機最遠距離。無新增 migration；部署順序為 Worker、靜態前端，回退採相反順序。

補員路障耐久調整使用 `rulesVersion: 2` 開局。沒有指定規則版本的舊客戶端仍使用第 1 版，已開始的回合依原版本重播。

## 百萬大學堂訪客成績

沿用棋盤對局 API，以 `academy` 開局。Worker 發種子，客戶端結束時送出操作碼陣列（最多 64 個），Worker 用 `shared/academy-rules.cjs` 重播並以通過關數寫公開榜。無新 migration；先部署 Worker 再發布前端，回退可還原前端與 Worker 註冊，保留既有紀錄。

### 養珠排行榜換算

`0011_merge_largest_pearl.sql` 將養珠公開榜改用 Worker 驗證後的終局棋盤最大值，回合資料仍保存累計分數。遷移會從既有已完成回合回填前 50 名，保留其他遊戲的榜單。舊回合沒有完局時間，歷史同值紀錄按對局寫入順序排序，顯示時間留空。新完局維持伺服器記錄時間與寫入順序。先套用 D1 migration 再發布前端。若要回復原排名，可用已保存的累計分數重建養珠榜，並還原 `0006` 的終局排名觸發器。

## 益智與音準遊戲的訪客排行榜

- **打磚塊（`breakout`）、不准跑調（`on-pitch`）** 沿用 `timedBoard`：`shared/breakout-rules.cjs`、`shared/on-pitch-rules.cjs` 由瀏覽器與 Worker 共用，以 10 毫秒固定步進重播操作碼，結束必須由輸入結尾。成績是重播後的分數，寫入 `game_leaderboard`。
- **呱呱池塘（`quack-pond`）、鏡像雙子（`mirror-twins`）** 是關卡制：每過一關，客戶端用一個回合送出該關解答（呱呱池塘為每列皇冠欄位；鏡像雙子為移動方向序列），Worker 用 `puzzleBoard` 對照伺服器內的關卡資料驗證，通過後把 `lastCleared` 寫進回合狀態。分數是「已驗證的不同關卡數」，每關最多算一次。
- `0014_verified_puzzle_stages.sql` 新增 `verified_puzzle_stages`（主鍵 `game_id, player_id, stage`，重複過同一關不會重複計分）與兩個 trigger：回合狀態出現 `lastCleared` 時登記關卡，登記後把該玩家的已驗證關卡數寫入 `game_leaderboard`（只在變高時更新），並更新 `leaderboard_activity`。既有的前 50 名與時間排序 trigger 照常運作。
- 排行榜面板：`frontend/services/leaderboard-view.mjs` 的遊戲清單加入呱呱池塘與鏡像雙子。
- **萌獸破城隊（`siege-architect`）** 同樣用 `puzzleBoard`：攻破城門時送 `[關卡, 20 個時間格代碼]`（0 = 空格，1～6 = shield、sapper、scout、rats、peacock、mole）。`shared/siege-architect-rules.cjs` 檢查兵種已解鎖、花費在預算內，再用遊戲同一份確定性模擬重播，城門被攻破才寫入 `lastCleared`。`0015_game_names_siege_architect.sql` 新增遊戲名稱，`0016_siege_architect_puzzle_stages.sql` 把它加入 `verified_puzzle_stage_after_move` trigger。測試：`node tools/test_puzzle_leaderboards.mjs`、`node tools/test_siege_architect_board.mjs`（真實 Worker 路由＋SQLite 套用全部 migration）。發布順序同上：migration → Worker → 前端；回復時移除前端接線，trigger 與名稱可保留。
- 發布順序：先套用 `0014` migration，再部署 Worker，最後發布前端。回復時反向處理；`verified_puzzle_stages` 與 trigger 可保留。

## TOP DOGGO 三難度排行榜（top-doggo）

2026-11-24 新增。三個難度各一張榜：`top-doggo-easy`、`top-doggo-normal`、`top-doggo-hard`（棋盤對局 API 的 gameId），成績 = 該局到達的關卡數。即時 3D 動作遊戲無法在 Worker 完整重播，所以只做合理性驗證：`shared/top-doggo-rules.cjs` 的 `verify([關卡, 擊倒數, 遊玩毫秒], 開局至今毫秒)` 檢查關卡範圍（1～60）、每關至少 8 名擊倒、遊玩時間下限（6 秒＋每關 18 秒）與不得超過實際經過時間（容差 3 秒）、擊倒速度上限。`backend/src/services/ranked-boards.mjs` 以 `topDoggoBoard()` 為三個 ID 各註冊一份，沿用兩小時對局期限、重送保護、`ranked_board_best_after_finish` trigger 與前 50 筆保留，不需要新 trigger。`0018_game_names_top_doggo.sql` 新增大廳卡片名稱與三張榜的顯示名稱。大廳榜單（`js/member.js`）把 `<遊戲>-easy|normal|hard` 的榜依難度分列，列上顯示 `Lv N`，連結回遊戲。已知限制：此驗證不能擋住「等待足夠時間後送出假成績」；若日後需要更強防護，要改成由 Worker 逐關核發憑證。

測試：`node tools/test_top_doggo_board.mjs`（真實 Worker 路由＋SQLite 套用全部 migration）。發布順序：先套用 `0018` migration，再部署 Worker，最後發布前端；回復時反向處理，名稱列與榜單資料可保留。前端在 Worker 尚未部署時會顯示「排行榜連線失敗，仍可繼續遊玩」，不影響遊玩。
