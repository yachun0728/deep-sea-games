# 閃避跑酷 Dodge Run（runner）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#runner`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「點左、點右換道，避開一路上的障礙。」｜每局 10 點 · 10 關挑戰
- 追蹤名稱（GA4 `game_name`）：閃避跑酷，`game_id` 為 `runner`
- 檔案：`games/runner/card.html`、`games/runner/game.js`、`games/runner/icon.svg`、`games/runner/view.html`；`game.js` 共 96 行、7.7 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「13. Dodge Run（runner）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-runner`、`rn-canvas`、`rn-distance`、`rn-best`、`rn-stage`、`rn-speed`、`rn-go`、`rn-finish`、`rn-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L3 常數：`HOR`、`BASE_LENGTH`、`MAX_STAGE`

## 函式索引（game.js，行號為宣告位置）

`T` L5、`perspective` L8、`stageLength` L9、`reward` L10、`note` L11、`remember` L12、`runnerUI` L13、`round` L20、`start` L21、`cash` L27、`die` L28、`spawn` L29、`update` L35、`draw` L46、`X` L48、`quad` L49、`L` L86、`loop` L91

## 錢包與結算接點

**扣款（開始一局）**
- L25 `start`：`S.balance-=ENTRY_FEE;`

**入帳（領回／獎勵）**
- L27 `cash`：`S.balance+=pay;`

**餘額檢查**
- L24 `start`：`if(S.balance<ENTRY_FEE){note(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 7 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L20 `round`：`AN.resume(runnerAnalytics,{stage:stage});`
- L25 `start`：`runnerAnalytics=AN.start('runner',ENTRY_FEE);`
- L27 `cash`：`AN.end(runnerAnalytics,pay,'cashout',{stage:stage,distance:Math.floor(dist)});`
- L28 `die`：`AN.end(runnerAnalytics,0,'loss',{stage:stage,distance:Math.floor(dist)});`
- L44 `update`：`AN.progress(runnerAnalytics,{stage:stage,distance:Math.floor(dist)},true);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `chayne`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`note`
- 「重設為 500 點」進行中防護（`js/controls.js`）：無法判斷（沒有偵測到狀態名稱）

## 規則摘要（取自 GAME_RULES.md）

定位：`runnerBusy` 所在 IIFE。只需左／右切換三條跑道；一組兩個障礙留下安全道，安全道不與上一組相同，沒有跳躍／蹲下。10關，第s關距離1200+(s-1)×160（末關2640），速度20+4×(s-1)。固定投入10，跑完整關才有續關／領回選擇；碰撞整局0，部分距離不返還，第10關自動領回。過w關倍率 round(1.35^w×100)/100：

1.35, 1.82, 2.46, 3.32, 4.48, 6.05, 8.17, 11.03, 14.89, 20.11。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/runner/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
