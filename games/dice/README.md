# 測深 Sonar Dice（dice）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#dice`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「設定聲納讀數範圍，等待海底回音。」｜10 點起 · 範圍預測
- 追蹤名稱（GA4 `game_name`）：測深，`game_id` 為 `dice`
- 檔案：`games/dice/card.html`、`games/dice/game.js`、`games/dice/icon.svg`、`games/dice/view.html`；`game.js` 共 65 行、4.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「5. Dice（dice）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-dice`、`dc-stage`、`dc-result`、`dc-sub`、`dc-zones`、`dc-marker`、`dc-target-out`、`dc-target`、`dc-last`、`dc-amount`、`dc-mode-label`、`dc-under`、`dc-over`、`dc-chance`、`dc-mult`、`dc-win`、`dc-go`、`dc-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`D`（L2）

## 函式索引（game.js，行號為宣告位置）

`dSay` L4、`readDAmount` L5、`dChance` L6、`dMult` L7、`dUI` L8、`dRoll` L26

## 錢包與結算接點

**扣款（開始一局）**
- L33 `dRoll`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L40 `dRoll`：`S.balance += pay;`

**餘額檢查**
- L30 `dRoll`：`if (a > S.balance) { dSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L33 `dRoll`：`D.analytics=AN.start('dice',a);`
- L40 `dRoll`：`AN.end(D.analytics,pay,pay>0?'complete':'loss');`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`MIN_BET`、`reduceMotion`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`dUI`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`D`、`dRoll`。預設 under 50；under 目標限2～95，over限5～98。隨機數 `floor(random×10000)/100`，範圍0～99.99。under為 roll<t，over為 roll>=t；機率百分比 chance 分別 t 或100-t。倍率 `floor(9700/chance)/100`；猜中返還 floor(投入×倍率)，未中0，單次自動結算。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/dice/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
