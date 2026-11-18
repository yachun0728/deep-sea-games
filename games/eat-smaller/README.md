# 數字吞噬 Number Gulp（eat-smaller）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#eat-smaller`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「吃掉比你小的數字、躲開比你大的，剛好變成目標數字就過關。」｜每局 10 點 · 8 關
- 追蹤名稱（GA4 `game_name`）：數字吞噬，`game_id` 為 `eat-smaller`
- 檔案：`games/eat-smaller/card.html`、`games/eat-smaller/game.js`、`games/eat-smaller/icon.svg`、`games/eat-smaller/original.html`、`games/eat-smaller/style.css`、`games/eat-smaller/view.html`；`game.js` 共 62 行、5.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「40. 數字吞噬 Number Gulp（eat-smaller）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-eat-smaller`、`es-frame`、`es-cleared`、`es-pay`、`es-best`、`es-go`、`es-end`、`es-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`EATS`、`EATS_LEVELS`、`EATS_BONUS`、`EATS_CAP`

## 函式索引（game.js，行號為宣告位置）

`esL` L3、`esSay` L4、`esStored` L5、`esCleared` L6、`esUI` L7、`esValid` L11、`esFinish` L37、`esRoute` L45

## 錢包與結算接點

**扣款（開始一局）**
- L18 `esValid`：`S.balance-=ENTRY_FEE;`

**入帳（領回／獎勵）**
- L26 `esValid`：`S.balance+=got;`

**餘額檢查**
- L15 `esValid`：`if(ENTRY_FEE>S.balance){esSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 6 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L17 `esValid`：`EATS.analytics=AN.start('eat-smaller',ENTRY_FEE);`
- L27 `esValid`：`AN.progress(EATS.analytics,{stage:level+1,step:EATS.cleared,bonus_points:got,total_bonus_points:EATS.earned});`
- L33 `esValid`：`if(esValid(source)&&EATS.active)AN.progress(EATS.analytics,{phase:'pause'},true);`
- L34 `esValid`：`if(esValid(source)&&EATS.active)AN.resume(EATS.analytics);`
- L39 `esFinish`：`AN.end(EATS.analytics,EATS.earned,'complete',{step:EATS.cleared});`
- L44 `esFinish`：`AN.end(EATS.analytics,EATS.earned,'abandoned',{step:EATS.cleared});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `eatSmaller.bests`（讀）
- `eatSmaller.unlocked`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`esSay`
- `js/navigation.js` 會呼叫：`esRoute`
- 「重設為 500 點」進行中防護（`js/controls.js`）：無法判斷（沒有偵測到狀態名稱）

## 規則摘要（取自 GAME_RULES.md）

定位：父頁 `games/eat-smaller/game.js`（`EATS`、`window.deepSeaEatSmaller`），子頁 `games/eat-smaller/original.html` 以 srcdoc 載入（同一口氣探險模式，右側 `.console` 面板）。2026-11-18 由使用者提供的單檔 HTML（games-innovation/eat-smaller.html）接入平台，保留原玩法、關卡與數值。你是一個數字，吃掉比你小的、躲開比你大的（碰到即結束本關），運算符 −3／+1／÷2 碰到立即生效，剛好等於目標才過關；越大游得越慢，部分大數字會追人。8 關目標依序為 12、25、40、30、99、50、61、128。

- 入場：每局固定扣 `ENTRY_FEE`（10 點）。按右側「扣點開始一局」，或在子頁選單直接點一關，都走子頁 `ensureRound` → `deepSeaEatSmaller.start` 由父頁驗證來源、檢查餘額後扣款並 `AN.start('eat-smaller')`；回傳 0 代表未扣款，子頁不開關。餘額不足顯示 `LOW_MSG`；進行中右側開始鈕停用、重複點擊不再扣。
- 一局：扣款後可在子頁自由選已解鎖的關、重玩，失敗按「再試一次」或 R 直接重來不另扣點。按右側「結束本局」（`esFinish` → `endEatPlatformRound`）結束；子頁回到選單，下一次選關需重新扣點。沒有自動結束條件。
- BONUS（固定點數，不依入場費計算）：子頁過關時呼叫 `deepSeaEatSmaller.clear(level)`；父頁以 `paid[level]` 確保同一局每關只發一次 2 點，累計上限 10 點（共 8 關，最多 5 關有獎勵，剛好回本）。同關重複通過、已達上限都回 0 並提示。已入帳點數不收回，結束不另發點；重新整理時已入帳的保留，入場不退。
- 追蹤：每次過關送一次 `AN.progress`（`stage`＝關卡、`step`＝本局過關次數、`bonus_points`＝本次入帳，可能為 0、`total_bonus_points`）。結束本局送一次 `AN.end`（payout＝本局已入帳 BONUS，result `complete`，附 `step`）。正常離頁由本款 capture 階段 `pagehide` 先送 `abandoned` 並帶已入帳 BONUS；BFCache persisted 不結束。暫停：切走畫面（`setEatPlatformActive(false)`）或背景分頁時進行中的關卡會暫停並顯示「繼續」，暫停送 `AN.progress(phase:pause)`、繼續送 `AN.resume`。
- 子頁單獨開啟（無父頁）時是不扣點的示範模式。
- 儲存：沿用原版 Key `eatSmaller.unlocked`（已解鎖關數）與 `eatSmaller.bests`（每關最佳秒數，JSON），子頁同源寫入；新增於 2026-11-18。
- 語言：子頁字串寫成「中文|English」單一字面量，`Lx()` 依父頁 `window.deepSeaI18n` 的目前語言輸出並在 `arcade-languagechange` 時重繪（粗體以 `**` 標記，避免翻譯測試把句子拆成短 key）；`locales/en.json` 以完整字串當 key。父頁訊息 `*-msg` 與數值欄位標記 `data-i18n-ignore` 由遊戲自行輸出，按鈕、規則與卡片沿用顯示層翻譯。單獨開啟子頁時維持中文。
- 重設 500 點：本局進行中會被擋下並顯示提示；重設不算 BONUS。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/eat-smaller/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
