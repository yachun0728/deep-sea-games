# 一筆畫守城 One-Line Defense（one-line-defense）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#one-line-defense`　分類：時機操作　狀態：顯示中
- 大廳卡片：「只能畫一條線擋住湧向核心的敵人，線越長消失越快。」｜每局 10 點 · 最佳分數
- 追蹤名稱（GA4 `game_name`）：一筆畫守城，`game_id` 為 `one-line-defense`
- 檔案：`games/one-line-defense/card.html`、`games/one-line-defense/game.js`、`games/one-line-defense/icon.svg`、`games/one-line-defense/original.html`、`games/one-line-defense/style.css`、`games/one-line-defense/view.html`；`game.js` 共 59 行、4.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「45. 一筆畫守城 One-Line Defense（one-line-defense）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-one-line-defense`、`ol-frame`、`ol-score`、`ol-pay`、`ol-best`、`ol-go`、`ol-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`ONEL`、`ONEL_BONUS`、`ONEL_MARKS`、`ONEL_EVERY`

## 函式索引（game.js，行號為宣告位置）

`olL` L3、`olSay` L4、`olBest` L5、`olUI` L6、`olValid` L10、`olRoute` L43

## 錢包與結算接點

**扣款（開始一局）**
- L17 `olValid`：`S.balance-=ENTRY_FEE;`

**入帳（領回／獎勵）**
- L24 `olValid`：`S.balance+=ONEL_BONUS;`

**餘額檢查**
- L14 `olValid`：`if(ENTRY_FEE>S.balance){olSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 6 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L16 `olValid`：`ONEL.analytics=AN.start('one-line-defense',ENTRY_FEE);`
- L25 `olValid`：`AN.progress(ONEL.analytics,{stage:mark,step:mark*ONEL_EVERY,bonus_points:ONEL_BONUS,total_bonus_points:ONEL.e…`
- L33 `olValid`：`AN.end(ONEL.analytics,ONEL.earned,ONEL.earned>0?'complete':'loss',{score:score,step:time,combo:combo});`
- L37 `olValid`：`if(olValid(source)&&ONEL.active)AN.progress(ONEL.analytics,{phase:'pause'},true);`
- L38 `olValid`：`if(olValid(source)&&ONEL.active)AN.resume(ONEL.analytics);`
- L42 `olValid`：`AN.end(ONEL.analytics,ONEL.earned,'abandoned',{score:ONEL.score});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `oneLine.best`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`olSay`
- `js/navigation.js` 會呼叫：`olRoute`
- 「重設為 500 點」進行中防護（`js/controls.js`）：無法判斷（沒有偵測到狀態名稱）

## 規則摘要（取自 GAME_RULES.md）

定位：父頁 `games/one-line-defense/game.js`（`ONEL`、`window.deepSeaOneLine`），子頁 `games/one-line-defense/original.html` 以 srcdoc 載入。2026-11-18 由使用者提供的單檔 HTML 接入平台，保留原玩法與數值。敵人從四周湧向核心，同時只能有一條線，碰到線的敵人消滅；線越長壽命越短（0.6～4.5 秒），一條線連續消滅越多，連擊分數越高（只影響遊戲分數，不是點數倍率；原文「連擊倍率」改稱「連擊加分」）。大顆會撞斷線、紫色會分裂，核心被撞 5 次結束。首次遊玩先跑 3 步教學，教學中核心不受傷、時間不計。

- 入場：每局固定扣 `ENTRY_FEE`（10 點）。右側「扣點開始守城」、子頁「開始」「重看教學」「再來一局」與空白鍵都走子頁 `begin` → `deepSeaOneLine.start`；回傳 0 不開局。進行中右側按鈕停用，重複點擊不再扣。
- BONUS（固定點數）：教學結束後遊戲時間每滿 30 秒（`BONUS_EVERY`）呼叫 `deepSeaOneLine.bonus(mark)`，30／60／90／120／150 秒各 +2 點，父頁以 `marks[mark]` 防重發，一局最多 10 點、剛好回本。已入帳不收回。
- 結算：核心被攻破時子頁 `gameOver` 呼叫一次 `finish({score,time,combo})`，父頁送一次 `AN.end`（payout＝已入帳 BONUS，有入帳 `complete`、否則 `loss`，附 `score`、`step`＝存活秒數、`combo`），結束不另發點。每次 BONUS 送 `AN.progress`（`stage`＝第幾個 30 秒、`step`＝秒數、`bonus_points`、`total_bonus_points`）。正常離頁由 capture 階段 `pagehide` 先送 `abandoned` 帶已入帳 BONUS。
- 暫停：切走畫面或背景分頁時暫停並顯示「繼續」，送 pause／resume；暫停期間波次預定生成會跳過。
- 子頁單獨開啟（無父頁）時是不扣點的示範模式。
- 儲存：沿用原版 Key `oneLine.best`（最佳分數）與 `oneLine.tutDone`（教學已完成）；新增於 2026-11-18。
- 語言：子頁字串寫成「中文|English」單一字面量，`Lx()` 依父頁 `window.deepSeaI18n` 的目前語言輸出並在 `arcade-languagechange` 時重繪（粗體以 `**` 標記，避免翻譯測試把句子拆成短 key）；`locales/en.json` 以完整字串當 key。父頁訊息 `*-msg` 與數值欄位標記 `data-i18n-ignore` 由遊戲自行輸出，按鈕、規則與卡片沿用顯示層翻譯。單獨開啟子頁時維持中文。
- 重設 500 點：本局進行中會被擋下並顯示提示；重設不算 BONUS。
- 平衡：沿用原版數值；能否穩定撐過 30～150 秒（影響 BONUS 期望值）待真人測試。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/one-line-defense/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
