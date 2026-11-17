# ? ?（pudding）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#pudding`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「拼出武器，背著小王子殺出重圍。」｜每局 10 點 · 拼武器闖關
- 追蹤名稱（GA4 `game_name`）：未登記，`game_id` 為 `pudding`
- 檔案：`games/pudding/card.html`、`games/pudding/game.js`、`games/pudding/icon.svg`、`games/pudding/view.html`；`game.js` 共 380 行、26.0 KB

## 畫面元素（view.html 的 id）

`view-pudding`、`pd-canvas`、`pd-seg`、`pd-score`、`pd-best`、`pd-amount`、`pd-go`、`pd-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`E`（L38）、`puddingBusy`（L2）
- L4 常數：`FONT`
- L5 常數：`XMIN`、`XMAX`、`KEY_SPEED`、`PTR_SPEED`
- L6 常數：`CELL`、`WTOP`
- L7 常數：`SEGS`、`SEG_TIME`、`SPAWN_STOP`、`FIRST_SPAWN`、`CAV_WARN`、`ARROW_SPEED`
- L8 常數：`SPEED_MUL`、`HURT`、`KILL`
- L9 常數：`SEG_SCORE`、`WIN_SCORE`、`CALM_SCORE`、`STREAK_STEP`、`STREAK_HEAL`、`SEG_HEAL`
- L10 常數：`SEG_REWARD`、`WIN_REWARD`
- L11 常數：`BLADE_DPS`、`SPEAR_BURST`、`SPEAR_CD`、`SPEAR_KNOCK`、`BLADE_SLOW`、`GUARD_PER`、`GUARD_MAX`
- L12 常數：`SPAWN_X`、`START_CELLS`
- L23 常數：`TYPES`
- L25 常數：`SHAPES`

## 函式索引（game.js，行號為宣告位置）

`rnd` L29、`wpick` L30、`RR` L31、`tx` L32、`inRect` L33、`emptyGrid` L35、`startGrid` L36、`computeStats` L37、`rotateCells` L49、`dims` L50、`reset` L57、`resetRun` L58、`clearInput` L59、`say` L61、`setText` L63、`ui` L64、`fl` L69、`end` L70、`enterForge` L83、`clampGhost` L89、`previewGrid` L90、`forgeRotate` L91、`forgeConfirm` L92、`forgeSkip` L98、`forgeTap` L99、`weaponCells` L106、`touches` L107、`makeEnemy` L108、`spawn` L109、`hurt` L114、`kill` L119、`moveHero` L124、`endSegment` L130、`updateRun` L139、`update` L173、`drawRoad` L188、`drawHero` L192、`drawWeaponWorld` L217、`drawEnemyBody` L224、`drawEnemy` L242、`drawArcher` L247、`drawBar` L252、`drawGrid` L258、`drawRun` L267、`drawForge` L288、`segs` L296、`line` L302、`drawOver` L319、`drawReady` L334、`draw` L341、`start` L345、`shown` L352、`ptX` L353、`release` L363、`isL` L366、`loop` L377

## 錢包與結算接點

**扣款（開始一局）**
- L349 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L73 `end`：`S.balance+=WIN_REWARD}`
- L133 `endSegment`：`S.balance+=SEG_REWARD;`

**餘額檢查**
- L348 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L76 `end`：`AN.end(analytics,earned,reason==='win'||earned>0?'complete':'loss',{score:score,step:seg,stage:seg});`
- L134 `endSegment`：`AN.progress(analytics,{stage:seg,step:seg,score:score,bonus_points:SEG_REWARD});`
- L349 `start`：`analytics=AN.start('pudding',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-pudding-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/pudding/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
