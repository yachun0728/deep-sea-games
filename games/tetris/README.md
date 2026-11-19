# 俄羅斯方塊 Tetris（tetris）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#tetris`　分類：免費懷舊　狀態：顯示中
- 大廳卡片：「經典落塊消行，旋轉、牆踢與暫存都有。」｜立即開玩 · 最高分
- 追蹤名稱（GA4 `game_name`）：俄羅斯方塊，`game_id` 為 `tetris`
- 檔案：`games/tetris/card.html`、`games/tetris/cover.webp`、`games/tetris/game.js`、`games/tetris/icon.svg`、`games/tetris/original.html`、`games/tetris/style.css`、`games/tetris/view.html`；`game.js` 共 50 行、3.7 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「47. 俄羅斯方塊 Tetris（tetris）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-tetris`、`tt-frame`、`tt-score`、`tt-lines`、`tt-best`、`tt-go`、`tt-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`TET`（L2）
- L2 常數：`TET`

## 函式索引（game.js，行號為宣告位置）

`ttL` L3、`ttSay` L4、`ttBest` L5、`ttUI` L6、`ttValid` L10、`ttRoute` L35

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L14 `ttValid`：`if(ENTRY_FEE>S.balance){ttSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L16 `ttValid`：`TET.analytics=AN.start('tetris',ENTRY_FEE);`
- L25 `ttValid`：`AN.end(TET.analytics,0,'complete',{score:score,step:lines,level:level});`
- L29 `ttValid`：`if(ttValid(source)&&TET.active)AN.progress(TET.analytics,{phase:'pause'},true);`
- L30 `ttValid`：`if(ttValid(source)&&TET.active)AN.resume(TET.analytics);`
- L34 `ttValid`：`AN.end(TET.analytics,0,'abandoned',{score:TET.score});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `tetris-best`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`ttRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：父頁 `games/tetris/game.js`（`TET`、`window.deepSeaTetris`），子頁 `games/tetris/original.html` 以 srcdoc 載入。2026-11-19 由使用者提供的單檔 HTML 接入平台，保留原玩法：10×20 棋盤、7-bag 隨機、SRS 旋轉與牆踢、暫存（每塊一次）、幽靈方塊、鎖定延遲 500 ms（最多重置 15 次）、DAS／ARR 連按。計分：消 1／2／3／4 行得 100／300／500／800 × 等級，軟降每格 +1、硬降每格 +2；每消 10 行升一級。分數、行數與等級只是成績。

- 入場：免費（全站 `ENTRY_FEE=0`）。右側「開始遊戲」、子頁「開始遊戲」「再來一局」與 Enter 都走子頁 `start` → `deepSeaTetris.start(window)`；回傳 0 不開局。進行中右側按鈕停用，重複點擊不會再開一局。
- BONUS：沒有。不換點數，沒有下注或倍率返還。每款遊戲每天第一次完整玩過一局（至少 10 秒有效時間）的平台完成獎勵由 `AN.end` 的 `complete` 觸發，與成績無關。
- 結算：頂端放不下時子頁 `endGame` 呼叫一次 `finish({score,lines,level})`，父頁送一次 `AN.end`（payout 0、result `complete`，附 `score`、`step`＝行數、`level`）。正常離頁由 capture 階段 `pagehide` 先送 `abandoned`；BFCache persisted 不結束。
- 暫停：按 P／Esc、視窗失焦、分頁隱藏或切到別的遊戲畫面都會暫停並顯示「繼續」，送 `AN.progress`（`phase:pause`）與 `AN.resume`。
- 子頁單獨開啟（無父頁）時是一般的俄羅斯方塊示範。
- 儲存：沿用原版 Key `tetris-best`（最高分，整數字串）；新增於 2026-11-19。
- 語言：子頁以 `data-i` 屬性＋`L` 字典與 `T(中文, English)` 依父頁 `deepSeaI18n` 目前語言輸出，並在 `arcade-languagechange` 時重繪；父頁訊息 `tt-msg` 與數值欄位標記 `data-i18n-ignore`；`locales/en.json` 補齊卡片、規則與子頁字串。
- 排行榜：尚未串接。指標預定為分數（高者優先），上線前需接訪客身分與 Worker 驗證，見 RELEASE_CHECKLIST.md 的訪客排行榜；在此之前不顯示榜單。
- 測試：`node tools/test_tetris.mjs`（父頁橋接與子頁流程）與 `node tools/test_freeplay_bridges.mjs`。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/tetris/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
