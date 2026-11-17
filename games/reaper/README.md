# 死神打工 Reaper Shift（reaper）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#reaper`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「普通靈魂要接走，綠色通行證要放行。」｜每局 10 點 · 10 班挑戰
- 追蹤名稱（GA4 `game_name`）：死神打工，`game_id` 為 `reaper`
- 檔案：`games/reaper/card.html`、`games/reaper/game.js`、`games/reaper/icon.svg`、`games/reaper/view.html`；`game.js` 共 100 行、10.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「21. Reaper Shift（reaper）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-reaper`、`rp-canvas`、`rp-level`、`rp-progress`、`rp-lives`、`rp-score`、`rp-best`、`rp-difficulty`、`rp-amount`、`rp-go`、`rp-cash`、`rp-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`RP`（L2）
- L3 常數：`RP_MULT`

## 函式索引（game.js，行號為宣告位置）

`rpRand` L6、`rpPay` L7、`rpSay` L8、`rpRemember` L9、`rpUI` L10、`rpRound` L17、`rpStart` L25、`rpCash` L32、`rpStrike` L36、`rpCheck` L41、`rpSpawn` L46、`rpStep` L47、`rpSync` L59、`rpAct` L60、`rpGhost` L68、`rpDraw` L72、`rpLoop` L97

## 錢包與結算接點

**扣款（開始一局）**
- L30 `rpStart`：`S.balance-=stake;`

**入帳（領回／獎勵）**
- L34 `rpCash`：`S.balance+=pay;`

**餘額檢查**
- L29 `rpStart`：`if(stake>S.balance){rpSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L23 `rpRound`：`AN.resume(RP.analytics,{stage:RP.level});`
- L30 `rpStart`：`RP.analytics=AN.start('reaper',stake);`
- L34 `rpCash`：`AN.end(RP.analytics,pay,'cashout',{stage:RP.level,score:RP.total,multiplier:RP_MULT[RP.cleared]});`
- L38 `rpStrike`：`AN.end(RP.analytics,0,'loss',{stage:RP.level,step:RP.resolved,score:RP.total});`
- L43 `rpCheck`：`AN.progress(RP.analytics,{stage:RP.level,score:RP.total,lives:RP.lives,multiplier:RP_MULT[RP.cleared]},true);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `reaper`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`rpSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`RP`

## 規則摘要（取自 GAME_RULES.md）

定位：`RP`、`RP_MULT`、`rpPay`、`rpRemember`。10班，第s班有8+2×(s-1)個靈魂（8～26個）。正常靈魂進入金色區時點擊收割；綠色光環者應放行。漏掉正常靈魂或誤收綠色者扣一心；空揮冷卻.35秒，不扣心。開始3心，續班不回滿，生命歸零整局返還0。

每班所有靈魂處理完且仍有心即可過班，允許帶著犯錯過班，不要求全對。每班後可領回或帶剩餘生命續班，末班自動領回。後班靈魂速度增加、判定區縮小；前3班綠光明顯，4～6班接近時消退，7～10班更早消退，需記住辨識。

第1～10班倍率 `[.7,1.15,1.8,2.7,4,5.8,8.2,11.5,16,22]`。實際返還為 `floor(投入×round(倍率×100)/100)`，保留此乘法順序以避免浮點邊界差異。投入10全過返還220、淨增加210。最佳紀錄是正常靈魂處理總數，不是最高餘額。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/reaper/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
