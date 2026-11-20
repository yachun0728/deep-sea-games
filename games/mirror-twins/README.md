# 鏡像雙子 Mirror Twins（mirror-twins）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mirror-twins`　分類：益智策略　狀態：顯示中
- 大廳卡片：「同時操控兩位太空人，其中一位左右相反，一起走進傳送艙。」｜立即開玩 · 10 關
- 追蹤名稱（GA4 `game_name`）：鏡像雙子，`game_id` 為 `mirror-twins`
- 檔案：`games/mirror-twins/card.html`、`games/mirror-twins/cover.webp`、`games/mirror-twins/game.js`、`games/mirror-twins/icon.svg`、`games/mirror-twins/original.html`、`games/mirror-twins/style.css`、`games/mirror-twins/view.html`；`game.js` 共 64 行、5.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「43. 鏡像雙子 Mirror Twins（mirror-twins）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mirror-twins`、`mt-frame`、`mt-cleared`、`mt-pay`、`mt-best`、`mt-go`、`mt-end`、`mt-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`MIRR`、`MIRR_LEVELS`、`MIRR_BONUS`、`MIRR_CAP`

## 函式索引（game.js，行號為宣告位置）

`mtL` L3、`mtSay` L4、`mtStored` L5、`mtCleared` L6、`mtUI` L7、`mtValid` L11、`mtFinish` L39、`mtRoute` L47

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L28 `mtValid`：`S.balance+=got;`

**餘額檢查**
- L15 `mtValid`：`if(ENTRY_FEE>S.balance){mtSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 4 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L17 `mtValid`：`MIRR.analytics=AN.start('mirror-twins',ENTRY_FEE);`
- L29 `mtValid`：`AN.progress(MIRR.analytics,{stage:level+1,step:MIRR.cleared,bonus_points:got,total_bonus_points:MIRR.earned});`
- L35 `mtValid`：`if(mtValid(source)&&MIRR.active)AN.progress(MIRR.analytics,{phase:'pause'},true);`
- L36 `mtValid`：`if(mtValid(source)&&MIRR.active)AN.resume(MIRR.analytics);`
- L41 `mtFinish`：`AN.end(MIRR.analytics,MIRR.earned,'complete',{step:MIRR.cleared});`
- L46 `mtFinish`：`AN.end(MIRR.analytics,MIRR.earned,'abandoned',{step:MIRR.cleared});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `mirrorTwins.stars`（讀）
- `mirrorTwins.unlocked`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`mtRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

**訪客排行榜**：每過一關送出該關的移動方向序列，Worker 用 `shared/mirror-twins-rules.cjs` 重播驗證；分數＝已驗證的不同關卡數（每關一次）。

定位：父頁 `games/mirror-twins/game.js`（`MIRR`、`window.deepSeaMirrorTwins`），子頁 `games/mirror-twins/original.html` 以 srcdoc 載入（同一口氣探險模式，右側 `.console` 面板）。2026-11-18 由使用者提供的單檔 HTML（games-innovation/mirror-twins.html）接入平台，保留原玩法、關卡與數值。回合制推箱類解謎：一次操控兩位太空人，藍色照按鍵方向、橘色左右相反；撞到小行星的那位停住，兩人同時站進各自傳送艙才過關，踩到雷射地雷自動退回上一步。最少步數由 BFS（`solve`）計算，依步數給 1～3 星。

- 入場：每局固定扣 `ENTRY_FEE`（10 點）。按右側「扣點開始一局」，或在子頁選單直接點一關，都走子頁 `ensureRound` → `deepSeaMirrorTwins.start` 由父頁驗證來源、檢查餘額後扣款並 `AN.start('mirror-twins')`；回傳 0 代表未扣款，子頁不開關。餘額不足顯示 `LOW_MSG`；進行中右側開始鈕停用、重複點擊不再扣。
- 一局：扣款後可在子頁自由選已解鎖的關、重玩，失敗可按上一步或 R 重來不另扣點。按右側「結束本局」（`mtFinish` → `endMirrorPlatformRound`）結束；子頁回到選單，下一次選關需重新扣點。沒有自動結束條件。
- BONUS（固定點數，不依入場費計算）：子頁過關時呼叫 `deepSeaMirrorTwins.clear(level)`；父頁以 `paid[level]` 確保同一局每關只發一次 2 點，累計上限 10 點（共 10 關，最多 5 關有獎勵，剛好回本）。同關重複通過、已達上限都回 0 並提示。已入帳點數不收回，結束不另發點；重新整理時已入帳的保留，入場不退。
- 追蹤：每次過關送一次 `AN.progress`（`stage`＝關卡、`step`＝本局過關次數、`bonus_points`＝本次入帳，可能為 0、`total_bonus_points`）。結束本局送一次 `AN.end`（payout＝本局已入帳 BONUS，result `complete`，附 `step`）。正常離頁由本款 capture 階段 `pagehide` 先送 `abandoned` 並帶已入帳 BONUS；BFCache persisted 不結束。回合制不需暫停，切走畫面時只停止繪圖（`setMirrorPlatformActive`）。
- 子頁單獨開啟（無父頁）時是不扣點的示範模式。
- 儲存：沿用原版 Key `mirrorTwins.unlocked`（已解鎖關數）與 `mirrorTwins.stars`（每關最佳星等，JSON），子頁同源寫入；新增於 2026-11-18。
- 語言：子頁字串寫成「中文|English」單一字面量，`Lx()` 依父頁 `window.deepSeaI18n` 的目前語言輸出並在 `arcade-languagechange` 時重繪（粗體以 `**` 標記，避免翻譯測試把句子拆成短 key）；`locales/en.json` 以完整字串當 key。父頁訊息 `*-msg` 與數值欄位標記 `data-i18n-ignore` 由遊戲自行輸出，按鈕、規則與卡片沿用顯示層翻譯。單獨開啟子頁時維持中文。
- 重設 500 點：本局進行中會被擋下並顯示提示；重設不算 BONUS。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mirror-twins/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
