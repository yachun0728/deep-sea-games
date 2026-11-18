# 下班保衛戰 Clock Out（clock-out）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#clock-out`　分類：益智策略　狀態：顯示中
- 大廳卡片：「擺好辦公用品擋住一波波工作，撐到 17:00 打卡下班。」｜每局 10 點 · 背包塔防
- 追蹤名稱（GA4 `game_name`）：下班保衛戰，`game_id` 為 `clock-out`
- 檔案：`games/clock-out/card.html`、`games/clock-out/game.js`、`games/clock-out/icon.svg`、`games/clock-out/view.html`；`game.js` 共 1096 行、43.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「33. 下班保衛戰 Clock Out（clock-out）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-clock-out`、`co-canvas`、`co-wave`、`co-san`、`co-best`、`co-go`、`co-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`G`（L184）、`BTN`（L306）、`clockBusy`（L2）
- L6 常數：`CLOCK_BONUS`
- L53 常數：`CONFIG`
- L69 常數：`TOOLS`
- L78 常數：`TOOL_ORDER`
- L81 常數：`ENEMIES`
- L90 常數：`MULT`
- L99 常數：`WAVES`
- L109 常數：`CLOCK`
- L135 常數：`SEG`、`PATH_LEN`
- L305 常數：`CARD_RECTS`
- L306 常數：`BTN`

## 函式索引（game.js，行號為宣告位置）

`coShown` L9、`say` L10、`setText` L12、`ui` L13、`pay` L21、`clockWaveDone` L27、`clockFinish` L31、`begin` L42、`clamp` L118、`dist` L119、`rrect` L120、`text` L127、`pathPos` L143、`normShape` L156、`rotateShape` L163、`shapeRot` L168、`shapeSize` L169、`cellCenter` L174、`itemCenter` L175、`saveBest` L187、`resetGame` L189、`pickTool` L206、`drawCards` L217、`enterBuild` L228、`occupied` L234、`itemAt` L243、`canPlace` L250、`areAdjacent` L259、`bonusesFor` L268、`recalc` L280、`newItem` L290、`addFloat` L296、`addFx` L299、`toast` L300、`inRect` L310、`toLogical` L315、`handleTap` L337、`startGame` L351、`cardCells` L359、`clampGhost` L360、`ghostCells` L364、`buildTap` L370、`confirmBuy` L423、`doRotate` L435、`doRecycle` L454、`doReroll` L463、`doGo` L468、`startWave` L479、`makeEnemy` L494、`enemyPos` L498、`heroThrow` L500、`damage` L515、`fireTool` L525、`updateWave` L579、`waveClear` L680、`totalScore` L695、`winGame` L696、`gameOver` L703、`updateFx` L713、`update` L723、`drawField` L737、`drawSelBox` L803、`drawToolCells` L816、`drawItem` L825、`drawGhost` L849、`drawEnemy` L866、`drawFx` L917、`drawHud` L939、`drawMiniShape` L951、`drawButton` L958、`drawBenchBuild` L962、`drawBenchWave` L986、`drawEnemyIcon` L1013、`drawOverlayText` L1024、`draw` L1028、`resetClock` L1084、`frame` L1088

## 錢包與結算接點

**扣款（開始一局）**
- L46 `begin`：`S.balance-=ENTRY_FEE;`

**入帳（領回／獎勵）**
- L23 `pay`：`S.balance+=n;`

**餘額檢查**
- L44 `begin`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 4 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L24 `pay`：`if(analytics)AN.progress(analytics,{stage:wave,step:wave,score:G.killScore+G.waveScoreTotal,bonus_points:n,to…`
- L36 `clockFinish`：`AN.end(analytics,earned,result,{score:G.score,step:G.wi+1,stage:G.wi+1});`
- L45 `begin`：`analytics=AN.start('clock-out',ENTRY_FEE);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-clock-out-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`clockBusy` 所在 IIFE，內含完整遊戲邏輯（`CONFIG`、`G` 狀態、`WAVES`、`TOOLS`、`ENEMIES`）。辦公室背包塔防：6×6 抽屜擺放工具，戰鬥時敵人沿 C 形桌面路徑（長 900）走向座位。畫布 400×560，只在 `view-clock-out` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始上班」時一次扣除並呼叫 `AN.start('clock-out')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。
- 8 波（09:00～16:00）；理智 20，每波完成回復 2；漏怪扣理智，老闆漏怪直接結束；便利貼起始 150，每波完成 +30。
- 結束：理智歸零、老闆走到座位（失敗）或擊退第 8 波老闆（通關）。結束時只呼叫一次 `AN.end`，payout 為本局已入帳 BONUS 總和。
- BONUS（固定點數，不依入場費計算）：撐過第 5 波立即 +3 點（`pay(3,…,5)`）；通關第 8 波立即 +7 點（`pay(7,…,8)`）。每個門檻每局只發一次（`paid` 記錄）；兩項都拿到共 10 點，剛好回本。即時入帳後輸掉不扣回；中途離開或重新整理已入帳者保留、入場點數不退。每次入帳 `AN.progress` 帶 `bonus_points` 與 `total_bonus_points`。
- 分數（擊倒分＋波次分＋通關獎勵＋理智×分數）與最高分只顯示，不換點數。最高分存 `deep-sea-clock-out-best`。
- 重設 500 點：本局進行中（`clockBusy`）會被擋下並顯示提示；重設不算 BONUS。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目；含波數的句子用固定字串（`WV` 陣列）組成，讓顯示層翻譯能精確比對。另在 `js/i18n.js` 的 `names` 清單加入 `Clock Out`，避免標題出現「Clock Out Clock Out」。
- 平衡（獨立模擬器 `claude/模擬器-下班保衛戰.py`，非真人數據）：熟手策略第 5 波完成率近 100%、通關約 6 成，隨機擺放通關 0%、第 5 波約 65%；玩家實測前數值為暫定。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/clock-out/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
