# 偷睡大師 Nap Master（nap）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#nap`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「趁主管走開偷睡，他回頭前放開，還能丟垃圾砸暈他。」｜每局 10 點 · 按住反應
- 追蹤名稱（GA4 `game_name`）：偷睡大師，`game_id` 為 `nap`
- 檔案：`games/nap/card.html`、`games/nap/game.js`、`games/nap/icon.svg`、`games/nap/view.html`；`game.js` 共 458 行、24.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「32. 偷睡大師 Nap Master（nap）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-nap`、`np-canvas`、`np-level`、`np-hearts`、`np-best`、`np-amount`、`np-go`、`np-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`napBusy`（L2）
- L5 常數：`CONFIG`
- L175 常數：`NAP_REWARD`
- L176 常數：`BTN_SLEEP`、`BTN_THROW`
- L177 常數：`FONT`

## 函式索引（game.js，行號為宣告位置）

`createGame` L31、`rnd` L34、`emit` L41、`guilty` L42、`beginLevel` L48、`finish` L59、`startWarn` L66、`startWatch` L71、`backToPatrol` L74、`updateBoss` L77、`hitBoss` L104、`tryThrow` L111、`caught` L117、`step` L126、`inRect` L182、`sleepHeld` L183、`clearInput` L184、`say` L185、`setText` L187、`ui` L188、`addFloat` L194、`end` L195、`handleEvents` L206、`rrect` L229、`circ` L232、`line` L233、`tx` L234、`drawBackground` L238、`drawBoss` L245、`drawDesk` L287、`drawPlayer` L300、`drawProjectiles` L328、`drawHUD` L337、`drawButtons` L347、`tipFor` L358、`drawOverlay` L373、`draw` L404、`start` L420、`shown` L428、`toLocal` L429、`endPointer` L439、`loop` L450

## 錢包與結算接點

**扣款（開始一局）**
- L424 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L218 `handleEvents`：`S.balance+=NAP_REWARD;`

**餘額檢查**
- L423 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L200 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:earned,stage:G.level});`
- L219 `handleEvents`：`AN.progress(analytics,{stage:G.level,step:earned,score:G.score,bonus_points:NAP_REWARD});`
- L424 `start`：`analytics=AN.start('nap',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-nap-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`napBusy` 所在 IIFE。按住型反應遊戲：主管在走道來回巡邏，玩家按住睡覺鍵累積睡意（畫布左下大按鈕、空白鍵或 ↓），睡意條滿了過關，共 10 關。主管回頭前先停下、頭上冒紅色「!」（預警 `warn` 秒），之後盯人 `watch` 秒；盯人期間只要玩家姿勢是睡覺、剛放開（醒來緩衝）或丟垃圾，就被抓：考績 −1、睡意 −該關目標 25%、冷靜 1 秒；考績（3 顆）歸零即結束。第 4、7 關開始各補 1 顆（上限 3）。

睡意增加速度（每秒）＝(8＋12×深度)，主管暈倒時 ×1.5；深度 3 秒由 0 升到 1，放開、被抓、丟垃圾歸零。放開後的醒來緩衝＝0.15＋0.15×深度 秒。垃圾（上限 5，每關開始 2 個，之後依關卡每 2.0～3.0 秒補 1 個）每個扣主管 1 點血，冷卻 0.4 秒，丟出後 0.3 秒內視為心虛姿勢；每被砸中一次，主管下次回頭提早 0.8 秒（最低保留 0.35 秒）。血量歸零主管暈倒 3.4～5.0 秒（期間不會抓人、不能丟垃圾），之後血量回滿。第 3 關起預警可能是虛驚（20～35%），第 5 關起盯人結束後可能回馬槍（20～30%，預警 0.7 倍、最低 0.4 秒）。

關卡表（睡意目標／預警秒／血量）：1：100／1.10／2、2：110／1.00／2、3：120／0.92／3、4：130／0.85／3、5：140／0.78／3、6：150／0.72／4、7：160／0.67／4、8：170／0.62／4、9：180／0.58／5、10：190／0.55／5；其餘欄位見 `CONFIG.levels`。

獎勵：**每過 1 關 +1 點**（`NAP_REWARD`），在睡意達標當下加入共用餘額（`S.balance`）並存檔，每關只入帳一次，結束時不再另外結算、不收回；10 關全過共 10 點（等於入場費，是固定里程碑，沒有倍率、沒有領回）。分數（100×關卡＋50×剩餘考績＋時間加分）只是顯示用。

最佳紀錄：`deep-sea-nap-best`（最高分）。切換遊戲、背景分頁、換 hash 會暫停並清掉按住狀態；重新整理放棄本局，已扣點不退。追蹤：`AN.start('nap')`、每過一關 `AN.progress`、結束 `AN.end`（過 ≥1 關為 complete，否則 loss；step＝過關數）。

數值依機器人模擬調整（原型規格 `規格-偷睡大師-v0.1`）：不丟垃圾的機器人在反應 0.32 秒時通關率 0%，會丟垃圾的同樣反應速度 27%；尚未做真人測試。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/nap/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
