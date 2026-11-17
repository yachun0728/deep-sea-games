# 水雷區 Mine Field（mines）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mines`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「翻出珍珠、避開水雷，見好就收。」｜10 點起 · 翻格尋寶
- 追蹤名稱（GA4 `game_name`）：水雷區，`game_id` 為 `mines`
- 檔案：`games/mines/card.html`、`games/mines/game.js`、`games/mines/icon.svg`、`games/mines/view.html`；`game.js` 共 92 行、5.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「2. Mines（mines）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mines`、`board`、`mines-amount`、`mines-count`、`mines-mult`、`mines-next`、`mines-left`、`mines-go`、`mines-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`M`（L3）
- L6 常數：`SVG_PEARL`
- L7 常數：`SVG_MINE`

## 函式索引（game.js，行號為宣告位置）

`minesMult` L9、`readMines` L10、`readMAmount` L11、`mSay` L12、`syncBalance` L13、`buildBoard` L15、`renderMines` L23、`startMines` L45、`cashMines` L57、`pick` L63

## 錢包與結算接點

**扣款（開始一局）**
- L52 `startMines`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L59 `cashMines`：`S.balance += pay;`

**餘額檢查**
- L48 `startMines`：`if (a > S.balance) { mSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L53 `startMines`：`M.analytics=AN.start('mines',a);`
- L59 `cashMines`：`AN.end(M.analytics,pay,'cashout',{step:M.picks,multiplier:mult});`
- L67 `pick`：`AN.end(M.analytics,0,'loss',{step:M.picks});`
- L71 `pick`：`AN.progress(M.analytics,{step:M.picks});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`save`、`fmt`、`fx`、`MIN_BET`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`buildBoard`、`renderMines`
- `js/controls.js` 會呼叫：`mSay`、`renderMines`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`M`

## 規則摘要（取自 GAME_RULES.md）

定位：`M`、`minesMult`。25 格，可選 1～24 雷，預設 3。成功翻 k 格的倍率為 `floor(100 × 0.97 × ∏[(25-i)/(25-m-i)]) / 100`，i 從 0 到 k-1、m 為雷數。至少翻一個安全格後可領回；踩雷返還 0；翻完全部安全格自動結算。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mines/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
