# 踩地雷 Minesweeper（mines）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mines`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「看懂數字、標記地雷，找出全部安全區。」｜入場 10 點 · 推理排雷
- 追蹤名稱（GA4 `game_name`）：踩地雷，`game_id` 為 `mines`
- 檔案：`games/mines/card.html`、`games/mines/game.js`、`games/mines/icon.svg`、`games/mines/style.css`、`games/mines/view.html`；`game.js` 共 85 行、5.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「2. Mines（mines）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mines`、`board`、`mines-flag`、`mines-left`、`mines-flags`、`mines-best`、`mines-go`、`mines-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`M`（L3）

## 函式索引（game.js，行號為宣告位置）

`mSay` L5、`syncBalance` L7、`mineNeighbors` L8、`mineNumber` L13、`buildBoard` L14、`renderMines` L23、`startMines` L40、`mineFinish` L49、`mineFlag` L55、`pick` L60

## 錢包與結算接點

**扣款（開始一局）**
- L43 `startMines`：`S.balance -= ENTRY_FEE;`

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L42 `startMines`：`if (S.balance < ENTRY_FEE) { mSay(LOW_MSG, 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 4 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L45 `startMines`：`M.analytics = AN.start('mines', ENTRY_FEE);`
- L52 `mineFinish`：`AN.end(M.analytics, 0, won ? 'complete' : 'loss', {step: M.picks, score: M.picks});`
- L78 `pick`：`AN.progress(M.analytics, {step: M.picks, score: M.picks});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-mines-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`buildBoard`、`renderMines`
- `js/controls.js` 會呼叫：`mSay`、`renderMines`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`M`

## 規則摘要（取自 GAME_RULES.md）

踩地雷。定位：`M`、`mineNeighbors`、`mineNumber`、`startMines`、`pick`、`mineFinish`。每局固定入場10點；5×5共25格、3顆雷，第一次實際翻格才配置地雷並排除該格，保證首格安全（不保證整盤無須猜測）。數字為周圍八格雷數，零雷區自動展開；可切換插旗模式或按右鍵，最多3面旗，可取消，旗子不算翻開。翻開全部22格安全區過關，踩雷失敗。最佳成績為最多翻開的安全格數，存在 `deep-sea-mines-best`；與錢包無關，不發點、不退款。進行中不重開、不重複扣款；回大廳及背景不自動操作，回來可繼續；重新整理放棄進度。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mines/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
