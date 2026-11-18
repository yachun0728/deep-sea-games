# 羅盤 Compass（wheel）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#wheel`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「轉動深海羅盤，等待指針停下。」｜10 點起 · 轉盤挑戰
- 追蹤名稱（GA4 `game_name`）：羅盤，`game_id` 為 `wheel`
- 檔案：`games/wheel/card.html`、`games/wheel/game.js`、`games/wheel/icon.svg`、`games/wheel/view.html`；`game.js` 共 85 行、5.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「9. Wheel（wheel）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-wheel`、`wh-stage`、`wh`、`wh-hub`、`wh-legend-label`、`wh-legend`、`wh-last`、`wh-amount`、`wh-risk-label`、`wh-n-label`、`wh-max`、`wh-chance`、`wh-rtp`、`wh-go`、`wh-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`WL`（L4）
- L3 常數：`WH_BASE`

## 函式索引（game.js，行號為宣告位置）

`wSay` L6、`readWAmount` L7、`whSetup` L8、`whUI` L25、`whSpin` L42

## 錢包與結算接點

**扣款（開始一局）**
- L51 `whSpin`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L59 `whSpin`：`S.balance += pay;`

**餘額檢查**
- L46 `whSpin`：`if (a > S.balance) { wSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L51 `whSpin`：`WL.analytics=AN.start('wheel',a);`
- L59 `whSpin`：`AN.end(WL.analytics,pay,pay>0?'complete':'loss');`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`MIN_BET`、`reduceMotion`、`C`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`whSetup`、`whUI`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`WL`。10／20／30等機率槽，預設20槽、中風險。低風險重複 `[1.3,1.2,1.2,1.2,0,1.2,1.2,1.2,1.2,0]`；中風險重複 `[0,1.5,0,1.7,0,2,0,3,0,1.5]`。高風險只有第一槽非零，分別9.7／19.4／29.1倍，其餘0。轉輪前抽定槽，動畫後返還 floor(投入×槽倍率)。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/wheel/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
