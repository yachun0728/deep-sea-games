# 深海前哨 Deep Sea Outpost（outpost）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#outpost`　分類：益智策略　狀態：顯示中
- 大廳卡片：「扳動海流閘門，將敵群導入防守火網。」｜不限次數 · 分路塔防
- 追蹤名稱（GA4 `game_name`）：深海前哨，`game_id` 為 `outpost`
- 檔案：`games/outpost/card.html`、`games/outpost/game.js`、`games/outpost/icon.svg`、`games/outpost/style.css`、`games/outpost/view.html`；`game.js` 共 320 行、14.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「51. 深海前哨 Deep Sea Outpost（outpost）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-outpost`、`outpost-time`、`outpost-wave`、`outpost-stage`、`outpost-stage-mode`、`outpost-energy`、`outpost-hull`、`outpost-score`、`outpost-best-stat`、`outpost-best`、`outpost-guide`、`outpost-guide-text`、`outpost-guide-skip`、`outpost-board`、`outpost-current`、`outpost-direction`、`outpost-message`、`outpost-start`、`outpost-next`、`outpost-rank`、`outpost-rank-status`、`outpost-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）

## 函式索引（game.js，行號為宣告位置）

`outpostRoute` L1、`active` L32、`ticking` L33、`screenX` L34、`endGuide` L36、`write` L71、`attack` L78、`render` L89、`operate` L182、`tracking` L209、`finish` L213、`animate` L231、`step` L238、`play` L254、`pause` L264、`begin` L277、`chooseStage` L290

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L226 `finish`：`AN.end(round, 0, state.won ? 'complete' : 'loss', tracking());`
- L248 `step`：`AN.progress(round, tracking());`
- L257 `play`：`if (resuming) AN.resume(round, tracking());`
- L258 `play`：`else round = AN.start(id, 0, tracking());`
- L269 `pause`：`AN.progress(round, tracking(), true);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`outpostRoute`
- `js/timed-leaderboard.js` 會呼叫：`active`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

- 單關 180 秒，三條各有五格的航道，三波固定敵群於第 9、60、116 秒開始。研究站有 5 格完整度，每漏一隻扣 1 格。歸零失敗，守滿 180 秒通關。
- 起始能源 95，每 4 秒補 5。泡泡砲（40）可範圍傷害，聲納塔（25）標記敵群以提高受到的傷害，脈衝線圈（35）對厚甲有效。海流閘門（30）部署時指定相鄰航道，敵群在範圍內時點擊閘門換道，成功後冷卻 8 秒。每隻敵人換道後有 1.5 秒的換道保護。
- 擊退一般、快速、厚甲敵人依序得 40、60、120 分，曾換道的敵人擊退時額外加 15 分。通關加 300 分及每格剩餘站體 100 分。排行榜以單一模式的防守分數由高至低排序，同分由最早達到者優先，失敗和通關均可送出。離頁暫停，返回手動繼續，重新整理放棄進行中的回合。最佳分數保存在此瀏覽器。
- 免費遊玩。能源和分數只用於本局，無遊戲專屬 BONUS，沿用平台固定遊玩獎勵。
- 首次進入時提供可跳過的實戰教學。依提示部署中路泡泡砲及上路向下的閘門，等首批敵人進入範圍後點擊閘門。等待部署和首次點擊時暫停倒數，完成或跳過後繼續原本回合，瀏覽器會記住教學狀態。
- 完整版有 30 關，逐關通關解鎖。第二關「火力升級」起始能源 125，第三關「洋流交會」起始能源 145，後者增加厚甲及快魚跨路混編。第 4–30 關由固定種子產生（結果固定，無隨機）：起始能源 150 起每關 +2.5、至 212；每波敵數約 12–13 隻增至約 23 隻，總敵數約 36 增至 69；厚甲及快魚比例逐步上升，敵人生命值最高為原值 1.9 倍，第 26 關起一般與快速敵人每回合多游 1 單位；每 4 秒補充能源由 5 逐步升到 7。每關重置站體、能源與設備，失敗可重試，通關解鎖下一關。第二關起自第二波，點已部署的泡泡砲或脈衝線圈可花 25 局內能源升級一次，分別擴大濺射半徑、縮短射擊間隔。第一關保留原有排行規則與紀錄，其餘 29 關為本機關卡進度（`deep-sea-outpost-unlocked-v1` 存最高已解鎖關）。無點數返還，通關不影響錢包。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/outpost/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
