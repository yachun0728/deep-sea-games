# 探底 Deep Probe（limbo）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#limbo`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「選定目標倍率，看看探測錘能到多深。」｜10 點起 · 目標倍率
- 追蹤名稱（GA4 `game_name`）：探底，`game_id` 為 `limbo`
- 檔案：`games/limbo/card.html`、`games/limbo/game.js`、`games/limbo/icon.svg`、`games/limbo/view.html`；`game.js` 共 66 行、4.0 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「6. Limbo（limbo）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-limbo`、`lb-stage`、`lb-result`、`lb-sub`、`lb-fill`、`lb-tlabel`、`lb-last`、`lb-amount`、`lb-target`、`lb-chance`、`lb-mult`、`lb-win`、`lb-go`、`lb-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`L`（L2）

## 函式索引（game.js，行號為宣告位置）

`lSay` L4、`readLAmount` L5、`readLTarget` L6、`lUI` L7、`lRoll` L19、`step` L33

## 錢包與結算接點

**扣款（開始一局）**
- L27 `lRoll`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L41 `step`：`S.balance += pay;`

**餘額檢查**
- L23 `lRoll`：`if (a > S.balance) { lSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L27 `lRoll`：`L.analytics=AN.start('limbo',a);`
- L41 `step`：`AN.end(L.analytics,pay,pay>0?'complete':'loss');`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`MIN_BET`、`reduceMotion`、`rollCrash`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`lUI`
- `js/timed-leaderboard.js` 會呼叫：`step`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`L`、`readLTarget`、`lRoll`、共用 `rollCrash`。目標取兩位小數，限1.01～1000；結果使用 Crash 的隨機式，結果>=目標才返還 floor(投入×目標)，否則0。UI 的97/目標百分比是公式顯示，實際仍含共用隨機式的取整與上限。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/limbo/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
