# 布丁突圍 Pudding Dash（pudding）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#pudding`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「拼出武器，背著小王子殺出重圍。」｜免費遊玩 · 拼武器闖關
- 追蹤名稱（GA4 `game_name`）：布丁突圍，`game_id` 為 `pudding`
- 檔案：`games/pudding/card.html`、`games/pudding/game.js`、`games/pudding/icon.svg`、`games/pudding/view.html`；`game.js` 共 386 行、26.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「27. 布丁突圍 Pudding Dash（pudding）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-pudding`、`pd-canvas`、`pd-seg`、`pd-score`、`pd-best`、`pd-amount`、`pd-go`、`pd-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`E`（L42）、`puddingBusy`（L2）
- L4 常數：`FONT`
- L5 常數：`XMIN`、`XMAX`、`KEY_SPEED`、`PTR_SPEED`
- L6 常數：`CELL`、`WTOP`
- L7 常數：`SEGS`、`SEG_TIME`、`SPAWN_STOP`、`FIRST_SPAWN`、`CAV_WARN`、`ARROW_SPEED`
- L8 常數：`SPEED_MUL`、`HURT`、`KILL`
- L9 常數：`SEG_SCORE`、`WIN_SCORE`、`CALM_SCORE`、`STREAK_STEP`、`STREAK_HEAL`、`SEG_HEAL`
- L10 常數：`SEG_REWARD`、`WIN_REWARD`
- L11 常數：`BLADE_DPS`、`SPEAR_BURST`、`SPEAR_CD`、`SPEAR_KNOCK`、`BLADE_SLOW`、`GUARD_PER`、`GUARD_MAX`
- L12 常數：`CAV_SLOW`、`SHIELD_BLADE`、`SHIELD_SPEAR`、`CAV_KNOCK`、`SHIELD_FROM`
- L13 常數：`HP_MUL`
- L14 常數：`SPAWN_X`、`START_CELLS`
- L25 常數：`CARD_HINT`
- L26 常數：`TYPES`
- L28 常數：`SHAPES`

## 函式索引（game.js，行號為宣告位置）

`rnd` L32、`wpick` L33、`RR` L34、`tx` L35、`cardX` L36、`inRect` L37、`emptyGrid` L39、`startGrid` L40、`computeStats` L41、`rotateCells` L53、`dims` L54、`reset` L61、`resetRun` L62、`clearInput` L63、`say` L65、`setText` L67、`ui` L68、`fl` L73、`end` L74、`enterForge` L87、`clampGhost` L93、`previewGrid` L94、`forgeRotate` L95、`forgeConfirm` L96、`forgeSkip` L102、`forgeTap` L103、`weaponCells` L110、`touches` L111、`makeEnemy` L112、`spawn` L113、`hurt` L118、`kill` L123、`moveHero` L128、`endSegment` L134、`updateRun` L143、`update` L178、`drawRoad` L193、`drawHero` L197、`drawWeaponWorld` L222、`drawEnemyBody` L229、`drawEnemy` L247、`drawArcher` L252、`drawBar` L257、`drawGrid` L263、`drawRun` L272、`drawForge` L294、`segs` L302、`line` L308、`drawOver` L325、`drawReady` L340、`draw` L347、`start` L351、`shown` L358、`ptX` L359、`release` L369、`isL` L372、`loop` L383

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L77 `end`：`S.balance+=WIN_REWARD}`
- L137 `endSegment`：`S.balance+=SEG_REWARD;`

**餘額檢查**
- L354 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L80 `end`：`AN.end(analytics,earned,reason==='win'||earned>0?'complete':'loss',{score:score,step:seg,stage:seg});`
- L138 `endSegment`：`AN.progress(analytics,{stage:seg,step:seg,score:score,bonus_points:SEG_REWARD});`
- L355 `start`：`analytics=AN.start('pudding',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-pudding-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`puddingBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`puddingBusy` 所在 IIFE。橫向護送闖關：玩家護送「布丁」走過 8 段路（每段 16 秒），敵人從上方逼近。每段開始前進營帳，拿到刃（紅）、矛（藍）、盾（黃）各一塊隨機拼圖碎片，選一塊放進 4×4 武器格（新碎片覆蓋舊格子，可旋轉，也可跳過）。武器畫在布丁正前方（每格 20 畫素、畫布 y 332～412），這個武器就是實際判定範圍。

- 移動：按住 ←→ 或 A／D（`KEY_SPEED` 230 畫素/秒），或按住畫面朝指標走（`PTR_SPEED` 280 畫素/秒）；範圍 x 60～340。切換遊戲、換分頁、放開按鍵時停止移動。營帳階段可按 R 旋轉、Enter 確認、S 跳過。
- 刃：武器格碰到敵人時持續傷害，每格每秒 4×權重，且敵人移動速度 ×0.5。矛：碰到時一次 3×權重，0.5 秒冷卻，並把敵人擊退 14 畫素（騎兵 ×1.5）。盾：擋下箭矢；受傷減免 = min(0.6, 0.05×有效盾格數)。
- 剋制（`SHIELD_BLADE` 0.5、`SHIELD_SPEAR` 1.3、`CAV_SLOW` 0.8、`CAV_KNOCK` 1.5）：盾兵受刃傷 ×0.5、受矛傷 ×1.3；刃對騎兵的減速只有 ×0.8（對其他敵人 ×0.5）；矛對騎兵擊退 ×1.5。目的是讓只塞一種碎片的玩法不再是最優解，必須混搭。
- 碎片供應：第 1、2 段營帳只提供刃與矛（兩張），從第 3 段（`SHIELD_FROM`）起才加入盾；營帳前兩次會顯示操作提示，盾兵頭上標示「怕矛」，營帳每張碎片下方有一行用途提示。
- 連成一塊：同種類四方向相連 s 格，算 s + max(0, s−2) 個有效格，每格權重 = 有效格數 ÷ s。
- 敵人：步兵（速度 ×1）、騎兵（×1.7，出現前 0.6 秒顯示「!」預警）、盾兵（×0.7）、弓兵（0.8 秒紅色瞄準線後射出箭，箭速 420 畫素/秒）。每段第 13 秒後不再出新敵人，段落結束時場上敵人清空且不扣血。
- 安心值（血量）100 起算：步兵碰到 −10、騎兵 −15、盾兵 −12、箭 −8、敵人漏過底線 −3，皆乘上 (1 − 受傷減免)；連殺 8 隻 +5；每段結束 +10；上限 100。歸零結束。
- 分數：擊殺 10／15／20、過一段 +100、全破再 +500 並加 floor(安心值)×5。分數只顯示，不換點數。

八段數值（`LV`，間隔 = 出敵間隔秒，HP 為步兵／騎兵／盾兵；實際 HP = 表內數值 × `HP_MUL` 1.2 四捨五入）：

| 段 | 出敵間隔(秒) | 基礎速度(px/秒) | HP 步兵／騎兵／盾兵 | 出敵權重 步兵:騎兵:盾兵:弓兵 |
| --- | --- | --- | --- | --- |
| 1 | 0.85～1.28 | 90 | 5／5／10 | 100:0:0:0 |
| 2 | 0.77～1.19 | 100 | 6／5／13 | 80:20:0:0 |
| 3 | 0.72～1.11 | 110 | 8／6／16 | 60:20:20:0 |
| 4 | 0.68～1.02 | 120 | 10／8／19 | 40:20:20:20 |
| 5 | 0.64～0.98 | 130 | 13／10／24 | 35:20:20:25 |
| 6 | 0.60～0.94 | 140 | 16／13／29 | 30:25:20:25 |
| 7 | 0.55～0.89 | 150 | 19／16／35 | 30:25:25:20 |
| 8 | 0.51～0.85 | 160 | 22／19／42 | 25:25:30:20 |

獎勵：入場固定 10 點；**每突破一段 +1 點**（`SEG_REWARD`），當下加入共用餘額並存檔，每段只入帳一次；全部 8 段突破再 +2 點（`WIN_REWARD`），一局最多 10 點，剛好回本、沒有倍率也沒有領回。中途失敗不扣回已入帳點數。`AN.end` 的 payout_points 為本局累計入帳（`earned`），有入帳為 complete、沒有為 loss，附 score、step、stage；每段入帳另送 game_progress。大廳卡片以 `game-card-bonus` 標示。

注意：每段 +1、全破 +2 是暫定經濟，可調整 `SEG_REWARD`／`WIN_REWARD`。難度用機器人模擬調過（各策略 100 局，機器人會自動走位閃躲，屬理想化操作）：均衡混搭放置約 70%，只塞矛約 21%，只塞刃約 14%，偏重刃矛的貪婪混搭約 29%，隨機放置約 7%，大多跳過與全塞盾為 0%。這不是真人數據，上線後看正式站 `game_end` 的 stage 分布調整 `LV`。切換遊戲或背景分頁時暫停，重新整理放棄本局、不退款、已入帳保留。最佳紀錄 `deep-sea-pudding-best` 存分數。本款沒有音效。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/pudding/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
