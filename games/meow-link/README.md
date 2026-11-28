# 貓咪連連看 Meow Link（meow-link）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#meow-link`　分類：懷舊經典　狀態：顯示中
- 大廳卡片：「貓咪、玩具與罐罐配對，尋找藏在其中的拉布。」｜不限次數 · 配對解謎
- 追蹤名稱（GA4 `game_name`）：貓咪連連看，`game_id` 為 `meow-link`
- 檔案：`games/meow-link/card.html`、`games/meow-link/cover.webp`、`games/meow-link/game.js`、`games/meow-link/icon.svg`、`games/meow-link/leaderboard.webp`、`games/meow-link/style.css`、`games/meow-link/tiles.js`、`games/meow-link/view.html`；`game.js` 共 466 行、17.9 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「63. 貓咪連連看 Meow Link（meow-link）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-meow-link`、`ml-stage`、`ml-rule`、`ml-clock`、`ml-clock-label`、`ml-time`、`ml-toolbar-actions`、`ml-mode`、`ml-go`、`ml-hint`、`ml-count`、`ml-level`、`ml-left`、`ml-bonus`、`ml-record`、`ml-best`、`ml-msg`、`ml-rank-status`、`ml-rank-retry`、`ml-game-area`、`ml-board-actions`、`ml-full`、`ml-playfield`、`ml-board`、`ml-trace`、`ml-result`、`ml-result-title`、`ml-result-level`、`ml-result-time`、`ml-result-reward`、`ml-result-actions`

## 狀態與常數

- 狀態物件／進行中旗標：`meowLinkBusy`（L2）

## 函式索引（game.js，行號為宣告位置）

`updateClock` L27、`twoDigits` L32、`resumeClock` L37、`pauseClock` L43、`hideResult` L51、`showResult` L58、`say` L73、`sizeBoard` L75、`paint` L102、`bestStages` L129、`showRecord` L134、`updateButtons` L138、`drawTrace` L150、`center` L152、`clearTrace` L160、`stageRule` L167、`dealLevel` L177、`params` L202、`rankStatus` L207、`submitLevel` L214、`start` L242、`end` L285、`completeLevel` L303、`recover` L340、`pick` L344、`matchTiles` L368、`clearHint` L389、`showHint` L393、`setExpanded` L404、`syncFull` L410、`toggleFull` L428、`routeMeowLink` L457

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L324 `completeLevel`：`S.balance += reward;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L249 `start`：`AN.resume(round, params());`
- L282 `start`：`round = AN.start('meow-link', 0, params());`
- L290 `end`：`AN.end(round, paid, result, params());`
- L328 `completeLevel`：`AN.progress(round, params({bonus_points: reward}), level < levels.length);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

獨立於 Ocean Link 的貓咪換皮版本；大廳第 4 款。簡單 6×8／12 種、普通 14×18／24 種、困難 16×26／36 種。36 種為 12 貓咪（含拉布）、8 玩具、8 食物、8 用品。簡單混合 6 貓咪、2 玩具、2 食物、2 用品；普通使用全部 12 貓咪及三類物品各 4 種；困難使用全部。相同貓咪或相同物品皆能配對。

沿用原版十關、最多兩次轉彎、可繞外框、免費提示、無路自動洗牌、障礙分段位移、不限時與關間停表。簡單十關均經典；普通／困難依序為經典、經典、左移、下移、障礙、障礙、右移、上移、障礙左移、障礙下移。免費開始，第 3、6、10 關各即時獎勵 5 點，同一次遠征每門檻只發一次，共 15 點；平台既有有效遊玩及首次完成獎勵另照原平台規則。

獨立最佳紀錄鍵 `deep-sea-meow-link-best-v1`，不讀寫 Ocean Link 存檔。CSS 全視窗操作，離開全視窗、回大廳、pagehide 放棄未完成進度，已發點數保留。背景停留沿用原版累計時鐘，不提供暫停玩法。

訪客榜沿用 board API 與驗證架構，只接簡單模式，以通關數高者優先、同分先到；Worker 逐關重播 24 次合法配對。純規則 `shared/meow-link-rules.cjs` 與前端使用同一份，每關均為 12 種圖案；普通／困難只記本機最佳。獨立 game ID、GA4 生命週期與分享設定，不改 Ocean Link 的規則、追蹤或榜單。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/meow-link/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
