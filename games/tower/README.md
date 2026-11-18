# 浮升 Ascent（tower）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#tower`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「挑選安全的氣泡，一層一層往上浮。」｜10 點起 · 逐層冒險
- 追蹤名稱（GA4 `game_name`）：浮升，`game_id` 為 `tower`
- 檔案：`games/tower/card.html`、`games/tower/game.js`、`games/tower/icon.svg`、`games/tower/view.html`；`game.js` 共 94 行、5.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「10. Tower（tower）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-tower`、`tw-stage`、`tw-tower`、`tw-amount`、`tw-diff-label`、`tw-mult`、`tw-next`、`tw-level`、`tw-go`、`tw-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`TW`（L3）
- L2 常數：`TW_ROWS`、`TW_DIFF`

## 函式索引（game.js，行號為宣告位置）

`tSay` L5、`readTAmount` L6、`twMult` L7、`twUI` L8、`twStart` L37、`twCash` L53、`twPick` L59

## 錢包與結算接點

**扣款（開始一局）**
- L48 `twStart`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L55 `twCash`：`S.balance += pay;`

**餘額檢查**
- L40 `twStart`：`if (a > S.balance) { tSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L49 `twStart`：`TW.analytics=AN.start('tower',a);`
- L55 `twCash`：`AN.end(TW.analytics,pay,'cashout',{stage:TW.level,multiplier:m});`
- L63 `twPick`：`AN.end(TW.analytics,0,'loss',{stage:TW.level+1});`
- L67 `twPick`：`AN.progress(TW.analytics,{stage:TW.level});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`MIN_BET`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`twUI`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`TW`。共8層，難度 easy=4格3安全、mid=3格2安全（預設）、hard=2格1安全、extreme=3格1安全。過k層倍率 `floor(0.97×(格數/安全格數)^k×100)/100`。成功一層後可領回，踩陷阱全失，第8層自動領回。各層倍率：

| 難度 | 第1～8層 |
| --- | --- |
| easy | 1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26, 9.68 |
| mid | 1.45, 2.18, 3.27, 4.91, 7.36, 11.04, 16.57, 24.86 |
| hard | 1.94, 3.88, 7.76, 15.52, 31.04, 62.08, 124.16, 248.32 |
| extreme | 2.91, 8.73, 26.19, 78.56, 235.7, 707.13, 2121.39, 6364.17 |

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/tower/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
