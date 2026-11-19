# 養珠 Pearl Merge（merge）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#merge`　分類：益智策略　狀態：顯示中
- 大廳卡片：「滑動合併珍珠，養出更大的數字。」｜立即開玩 · 滑動合併
- 追蹤名稱（GA4 `game_name`）：養珠，`game_id` 為 `merge`
- 檔案：`games/merge/card.html`、`games/merge/cover.webp`、`games/merge/game.js`、`games/merge/icon.svg`、`games/merge/view.html`；`game.js` 共 132 行、6.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「4. Pearl Merge（merge）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-merge`、`mg`、`mg-score`、`mg-max`、`mg-best`、`mg-dir-label`、`mg-go`、`mg-msg`、`mg-rank-status`、`mg-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`G`（L3）
- L2 常數：`MG_FEE`、`BEST`

## 函式索引（game.js，行號為宣告位置）

`gSay` L8、`mgTier` L9、`mgBuild` L10、`mgRender` L11、`mergeStatus` L27、`beginMerge` L33、`mgStart` L44、`updateMerge` L63、`sendMergeMove` L73、`mgMove` L102

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L46 `mgStart`：`if (S.balance < MG_FEE) { gSay(LOW_MSG, 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L35 `beginMerge`：`if (G.active) AN.end(G.analytics,0,'restart',{score:G.score});`
- L36 `beginMerge`：`G.analytics = AN.start('merge',MG_FEE);`
- L67 `updateMerge`：`AN.end(G.analytics,0,'complete',{score:G.score});`
- L92 `sendMergeMove`：`AN.end(G.analytics,0,'abandoned',{score:G.score});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`mgBuild`、`mgRender`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`G`、`MG_FEE`、`mgStart`、`mgMove`、`mgCanMove`。4×4 滑動合併相同數字；開始兩格，新生格 90% 為2、10%為4。合併增加分數；棋盤無合法移動結束。開始與重開免費，沒有點數獎勵；本機最佳分數保存於 pearl-merge-best。訪客榜以棋盤無合法移動時的合併累計分數降序排列，同分先達成者優先。Worker 每步套用滑動規則和產生新珠；放棄重開不提交排行榜。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/merge/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
