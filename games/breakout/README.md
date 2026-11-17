# 打磚塊 Breakout（breakout）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#breakout`　分類：免費懷舊　狀態：顯示中
- 大廳卡片：「移動擋板反彈小球，打光磚塊一關闖過一關。」｜免費 · 不限次數 · 反應闖關
- 追蹤名稱（GA4 `game_name`）：打磚塊，`game_id` 為 `breakout`
- 檔案：`games/breakout/card.html`、`games/breakout/game.js`、`games/breakout/icon.svg`、`games/breakout/view.html`；`game.js` 共 228 行、14.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「37. 打磚塊 Breakout（breakout）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-breakout`、`br-canvas`、`br-level`、`br-score`、`br-lives`、`br-best`、`br-best-level`、`br-go`、`br-pause`、`br-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L5 常數：`COLS`、`GAP`、`TOP`、`LEFT`
- L6 常數：`COLORS`
- L7 常數：`KEY_BEST`、`KEY_LEVEL`

## 函式索引（game.js，行號為宣告位置）

`say` L15、`setText` L16、`baseSpeed` L17、`curSpeed` L18、`paddleWidth` L19、`buildLevel` L21、`serve` L32、`burst` L36、`pop` L37、`ui` L39、`start` L47、`finish` L54、`launch` L63、`togglePause` L68、`dropChance` L73、`hitBrick` L74、`applyDrop` L81、`stepBall` L97、`update` L121、`rr` L154、`tx` L157、`draw` L161、`moveTo` L190、`loop` L221

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

- L49 `start`：`analytics = AN.start('breakout', 0);`
- L59 `finish`：`AN.end(analytics, 0, 'loss', { score: score, level: level, bricks: bricksBroken });`
- L148 `update`：`AN.progress(analytics, { stage: level, step: level, score: score, level: level });`
- L219 `moveTo`：`AN.end(analytics, 0, 'abandoned', { score: score, level: level, bricks: bricksBroken });`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：無法判斷（沒有偵測到狀態名稱）

## 規則摘要（取自 GAME_RULES.md）

定位：`games/breakout/game.js` 的獨立 IIFE（狀態為 `st`／`level`／`score`／`lives`，畫布 `br-canvas`，開始鈕 `br-go`）。免費懷舊分類，完全免費、不限次數：不扣點、不發點、不碰 `S.balance`，也沒有 BONUS；重設為 500 點的進行中防護不需涵蓋。

玩法：用擋板接住並反彈小球，打光全部磚塊即過關並進入下一關，無終點關卡。每局 3 顆球，漏接少一顆，用完結束。球打在擋板邊緣會斜飛；關卡越後磚塊列數越多（最多 8 列）、球越快（基準 300，每關 +25，上限 520），第 3 關起上方 2 列、第 6 關起 3 列為兩下才破的磚塊；版型每 4 關輪替（全滿、棋盤、空心、條紋）。打碎磚塊有 14% 機率掉道具：加寬擋板 12 秒、球速 ×0.72 持續 10 秒、多出兩顆球；道具只影響操作，不涉及點數。

分數：每次擊中 +10，磚塊破壞再 +10×耐久，接到道具 +25，過關 +100。分數與關卡只用於個人最佳紀錄（`deep-sea-breakout-best`、`deep-sea-breakout-level-best`），不等於錢包點數。進行中可暫停（按鈕或 P）；切換遊戲、背景分頁會暫停，重新整理放棄本局。操作：拖曳／觸控、←→／AD、空白鍵或點畫面發球。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/breakout/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
