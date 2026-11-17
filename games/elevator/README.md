# 插隊大師 Queue Cutter（elevator）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#elevator`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「趁乘客背對你，偷偷往前插一位。」｜每局 10 點 · 5 關挑戰
- 追蹤名稱（GA4 `game_name`）：插隊大師，`game_id` 為 `elevator`
- 檔案：`games/elevator/card.html`、`games/elevator/game.js`、`games/elevator/icon.svg`、`games/elevator/view.html`；`game.js` 共 132 行、12.2 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「14. Queue Cutter（elevator）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-elevator`、`eq-canvas`、`eq-progress`、`eq-remaining`、`eq-stage`、`eq-total`、`eq-best`、`eq-watch`、`eq-amount`、`eq-go`、`eq-cash`、`eq-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`EQ`（L2）
- L3 常數：`EQ_COUNTS`、`EQ_END`
- L4 常數：`EQ_MULT`

## 函式索引（game.js，行號為宣告位置）

`eqRand` L7、`eqRest` L8、`eqCount` L9、`eqTotal` L10、`eqMultAt` L11、`eqPay` L12、`eqRound` L13、`eqSay` L14、`eqRemember` L15、`eqUI` L16、`eqLose` L29、`eqCash` L30、`eqStep` L37、`eqSync` L52、`eqAction` L53、`eqPerson` L68、`eqDraw` L87、`spot` L89、`eqLoop` L129

## 錢包與結算接點

**扣款（開始一局）**
- L60 `eqAction`：`S.balance-=stake;`

**入帳（領回／獎勵）**
- L33 `eqCash`：`S.balance+=pay;`

**餘額檢查**
- L58 `eqAction`：`if(stake>S.balance){eqSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L13 `eqRound`：`AN.resume(EQ.analytics,{stage:EQ.stage,step:0});`
- L29 `eqLose`：`AN.end(EQ.analytics,0,'loss',{stage:EQ.stage,step:EQ.passed});`
- L33 `eqCash`：`AN.end(EQ.analytics,pay,'cashout',{stage:EQ.stage,step:EQ.passed,multiplier:eqMultAt(EQ.passed)});`
- L49 `eqStep`：`AN.progress(EQ.analytics,{stage:EQ.stage,step:EQ.passed,multiplier:eqMultAt(EQ.passed)},EQ.passed===eqCount()…`
- L59 `eqAction`：`EQ.analytics=AN.start('elevator',stake);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-queue-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`eqSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`EQ`

## 規則摘要（取自 GAME_RULES.md）

定位：`EQ`。5關分別排10、12、14、16、18人，共70人；點一下往前插一位，移動期間若前面仍有人處於轉頭狀態即被抓，靜止等待不被抓。警示本身不抓人，但之後可能轉頭；警示後70%轉頭，否則回安全。每次成功移動後在等待狀態可領回，移動途中不能領回。每關插到最前面可繼續，末關自動領回，被抓整局0。

首關第1～10位倍率 `[.4,.6,.85,1.05,1.3,1.65,2.1,2.7,3.5,4.6]`。五關終點倍率 `[4.6,6.3,8.2,10.4,13]`；第2關起在上一關終點與當關終點間依已過乘客比例線性插值，round至兩位小數。續關剛開始尚未插下一位時，仍保有前關可領回金額。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/elevator/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
