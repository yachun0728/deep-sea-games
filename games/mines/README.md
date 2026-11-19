# 踩地雷 Minesweeper（mines）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mines`　分類：免費懷舊　狀態：顯示中
- 大廳卡片：「低中高難度或自訂棋盤，重溫經典踩地雷。」｜不限次數 · 推理排雷
- 追蹤名稱（GA4 `game_name`）：踩地雷，`game_id` 為 `mines`
- 檔案：`games/mines/VALIDATION.md`、`games/mines/card.html`、`games/mines/cover.webp`、`games/mines/game.js`、`games/mines/icon.svg`、`games/mines/style.css`、`games/mines/view.html`；`game.js` 共 189 行、11.0 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「2. Mines（mines）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mines`、`mines-difficulty`、`mines-custom`、`mines-size`、`mines-bomb-limit`、`mines-bombs`、`board`、`mines-level`、`mines-left`、`mines-flags`、`mines-best`、`mines-go`、`mines-msg`、`mines-rank-status`、`mines-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`M`（L4）
- L3 常數：`M_PRESETS`

## 函式索引（game.js，行號為宣告位置）

`mSay` L6、`syncBalance` L8、`mineNumber` L10、`mineRankStatus` L11、`bindMineTile` L18、`cancel` L20、`buildBoard` L38、`renderMines` L51、`beginMines` L70、`startMines` L80、`mineFinish` L103、`mineUpdateProgress` L111、`sendMineMove` L123、`mineMove` L154、`mineFlag` L167、`pick` L168、`mineSettings` L172

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L76 `beginMines`：`M.analytics = AN.start('mines', 0);`
- L107 `mineFinish`：`AN.end(M.analytics, 0, won ? 'complete' : 'loss', {step:M.picks,board_size:M.size,mine_count:M.mines});`
- L118 `mineUpdateProgress`：`AN.progress(M.analytics, {stage: M.level, step: M.picks, score: M.picks});`
- L145 `sendMineMove`：`AN.end(M.analytics, 0, 'abandoned', {step:M.picks,board_size:M.size,mine_count:M.mines});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-mines-best`（寫、讀）
- `deep-sea-mines-level-best`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`save`、`fmt`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`renderMines`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

踩地雷。定位：`M`、`M_PRESETS`、`mineSettings`、`startMines`。完全免費、不限次數、不發點。低為5×5／3雷、中為8×8／10雷、高為10×10／20雷；自訂N×N，N須為2～10整數，地雷數須為1～N×N−1整數。輸入無效不開局，不悄悄截斷；進行中鎖定設定，勝負後可重新選擇，每局固定棋盤不逐關擴大。開局立即隨機佈雷，第一格不保證安全。地雷達總格數減1時只有1安全格，只有翻到唯一安全格才獲勝。數字代表八鄰格雷數，零雷區展開，可插旗（上限為當局雷數）。難度設定位於棋盤上方，選擇後立即更新未開局的示意棋盤與統計，不開局或送追蹤。手機長按格子500毫秒插旗／取消，移動超過10px或取消觸控不插旗；長按後不翻格。電腦右鍵插旗，鍵盤聚焦後F插旗，保留原旗子圖示。已翻開的數字格可再次點擊：周圍旗子數恰好等於數字時，一次翻開未插旗的相鄰格並依原規則展開空白區；旗數不足或過多不動作。旗子位置不一定正確，插錯仍可能快開地雷而失敗。翻開全部安全格勝利complete、踩雷loss，各只end一次；重玩另開start，entry_points與payout_points皆0。保留deep-sea-mines-best與deep-sea-mines-level-best舊Key及格式，不將自訂成績寫入舊關卡紀錄；5×5／3雷的安全格舊紀錄仍相容。大棋盤格子至少44px、可水平捲動；重新整理不還原本局。

5×5／3 雷為訪客榜的標準棋盤。Worker 在開局產生並保存雷盤，逐步驗證翻格、插旗及快開；回傳已翻開的安全格、鄰雷數、玩家旗子與勝負，結束後仍不傳雷位。僅通關更新排行榜，標準棋盤通關為 22 格，同分先達成者優先。其他棋盤仍可在本機遊玩，連線開局失敗時也可使用本機棋盤。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mines/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
