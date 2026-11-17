# 時序修復 Dream Repair Shop（dream）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#dream`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「抓準時機，讓指針停在青綠色區域。」｜每局 10 點 · 10 關挑戰
- 追蹤名稱（GA4 `game_name`）：時序修復，`game_id` 為 `dream`
- 檔案：`games/dream/card.html`、`games/dream/game.js`、`games/dream/icon.svg`、`games/dream/view.html`；`game.js` 共 57 行、5.0 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「12. Dream Repair Shop（dream）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-dream`、`dr-canvas`、`dr-stage`、`dr-amount`、`dr-go`、`dr-cash`、`dr-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`DR`（L2）、`runnerBusy`（L4）

## 函式索引（game.js，行號為宣告位置）

`drSay` L5、`drMultiplier` L6、`drUI` L7、`drDraw` L16、`drRound` L28、`drAdvance` L29、`drAction` L33、`drCash` L46、`drLoop` L54

## 錢包與結算接點

**扣款（開始一局）**
- L44 `drAction`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L48 `drCash`：`S.balance+=pay;`

**餘額檢查**
- L43 `drAction`：`if(amount>S.balance){drSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L28 `drRound`：`AN.resume(DR.analytics,{stage:DR.stage});`
- L37 `drAction`：`AN.progress(DR.analytics,{stage:DR.stage,multiplier:drMultiplier()},true);`
- L38 `drAction`：`AN.end(DR.analytics,0,'loss',{stage:DR.stage});`
- L44 `drAction`：`DR.analytics=AN.start('dream',amount);`
- L48 `drCash`：`AN.end(DR.analytics,pay,'cashout',{stage:DR.stage,multiplier:drMultiplier()});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`drSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`DR`、`runnerBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`DR`。目前是轉針時機遊戲，非舊版放置經營。共10關，按停時指針與目標的圓周角距離<=目標寬度一半才過關。第s關寬度 max(.36,1.5-(s-1)×.16) 弧度；速度2.1+(s-1)×.38弧度／秒。過關後選領回或續關，失誤整局0，第10關自動領回。勝w關倍率 round(1.4^w×100)/100：

1.4, 1.96, 2.74, 3.84, 5.38, 7.53, 10.54, 14.76, 20.66, 28.93。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/dream/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
