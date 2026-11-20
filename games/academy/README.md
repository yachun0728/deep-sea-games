# 百萬大學堂 Millionaire Academy（academy）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#academy`　分類：益智策略　狀態：顯示中
- 大廳卡片：「一百道百科題，自選領域闖十關，挑戰 1,000,000 學分。」｜不限次數 · 百科問答
- 追蹤名稱（GA4 `game_name`）：百萬大學堂，`game_id` 為 `academy`
- 檔案：`games/academy/card.html`、`games/academy/cover.webp`、`games/academy/game.js`、`games/academy/i18n.js`、`games/academy/icon.svg`、`games/academy/style.css`、`games/academy/view.html`；`game.js` 共 554 行、24.0 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「百萬大學堂（academy）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-academy`、`ac-app`、`ac-exit`、`ac-stage`、`ac-credits`、`ac-timer`、`ac-ring`、`ac-time`、`ac-lang`、`ac-ladder`、`ac-intro`、`ac-best`、`ac-timer-toggle`、`ac-sound`、`ac-select`、`ac-pick-title`、`ac-domains`、`ac-ask`、`ac-domain-tag`、`ac-question`、`ac-hint`、`ac-feedback`、`ac-fb-status`、`ac-fb-exp`、`ac-over`、`ac-over-icon`、`ac-rank-badge`、`ac-over-title`、`ac-over-sub`、`ac-final`、`ac-stat-stages`、`ac-stat-acc`、`ac-stat-life`、`ac-stat-bonus`、`ac-rank-status`、`ac-lifelines`、`ac-fifty`、`ac-hint-btn`、`ac-swap`、`ac-options`、`ac-actions`、`ac-go`、`ac-next`、`ac-walk-btn`、`ac-rank-btn`、`ac-retry`、`ac-walk`、`ac-walk-title`、`ac-walk-text`、`ac-walk-no`、`ac-walk-yes`、`ac-rank`、`ac-rank-title`、`ac-rank-note`、`ac-rank-list`、`ac-rank-empty`、`ac-rank-close`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L8 常數：`LANGS`
- L9 常數：`LANG_ATTR`
- L10 常數：`TIME_LIMIT`
- L11 常數：`STAGES`

## 函式索引（game.js，行號為宣告位置）

`siteLang` L23、`savePrefs` L26、`t` L33、`fmt` L37、`questionOf` L38、`tone` L50、`prepareRankedRound` L77、`renderRankStatus` L86、`sendRankedRound` L91、`submitRankedRound` L111、`loadRankings` L121、`openRank` L144、`closeRank` L149、`stopTimer` L152、`paintTimer` L153、`startTimer` L160、`pauseTimer` L173、`resumeTimer` L179、`params` L186、`setText` L187、`renderStatic` L188、`renderLadder` L207、`renderDomains` L220、`renderQuestion` L249、`render` L274、`renderOver` L310、`pay` L331、`start` L341、`act` L363、`pickDomain` L368、`useLife` L378、`choose` L394、`timeUp` L402、`settle` L407、`next` L422、`finish` L430、`openWalk` L444、`closeWalk` L451、`confirmWalk` L452、`setLang` L458、`abandon` L462

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L335 `pay`：`S.balance += n;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L338 `pay`：`AN.progress(analytics, { stage, step: state.answered, score: state.credits, bonus_points: n }, false);`
- L359 `start`：`analytics = AN.start('academy', 0, params());`
- L418 `settle`：`AN.progress(analytics, params(), false);`
- L438 `finish`：`AN.end(analytics, bonusEarned, state.cleared > 0 ? 'complete' : 'loss', params());`
- L467 `abandon`：`AN.end(analytics, bonusEarned, 'abandoned', params());`
- L543 `abandon`：`if (analytics && (phase === 'ask' || phase === 'select')) AN.end(analytics, bonusEarned, 'abandoned', params(…`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

免費、不限次數的十關百科問答，內建 100 題（5 領域 × 20 題），繁中／英文／簡中三語（遊戲內「繁中／EN／简中」按鈕；簡中只在遊戲內選，站台語言仍只有繁中與英文）。題目文字在 `games/academy/i18n.js`，正解與規則在 `shared/academy-rules.cjs`。

- **學分只是成績，不是點數。** 十關學分 2,000、4,000、8,000、16,000、32,000、64,000、125,000、250,000、500,000、1,000,000。第 5 關通過後答錯或超時保底 32,000，之前歸零。任何時候在選領域畫面都能「結束挑戰」，以目前學分結算（原版「見好就收」，已不涉及點數返還）。錦囊 50:50、智囊提示、臨場換題各限一次。每關 30 秒，可關閉計時。
- **BONUS（固定、與學分無關）：** 每局每關首次通過 +1 點，最多 10 點，答對當下入帳一次，結束與結束挑戰不再結算。不以學分換算點數：學分逐關倍增，換算會變成返還倍率，違反全站不得有博弈元素的原則。
- 追蹤：`AN.start('academy', 0)`、每題 `progress`、結束 `complete`（至少通過一關）或 `loss`、離頁 `abandoned`，payout 為本局 BONUS。
- 儲存：新 Key `deep-sea-academy-best`（最佳學分）與 `deep-sea-academy-prefs-v1`（語言、計時、音效）。
- 排行榜：Worker 註冊 `academy`（`backend/src/services/ranked-boards.mjs`）。開局取得種子，前端與 Worker 共用狀態機；送出的操作碼為 0–4 選領域、5 隨機盲盒、10／11／12 錦囊、20–23 作答、24 超時、30 結束挑戰。Worker 重播並要求恰在最後一個操作結束，排行成績為通過的關數（0–10，不是學分；通過 0 關不送出）。同分先達成者在前。沿用訪客榜 `game_leaderboard`，無新 migration。已知限制：種子與題庫在前端，合法的自動作答無法排除，同青蛙吃蟲、收盤之前。
- 題庫修訂：原稿多數正解在 B，已在三語題庫內重排為平均分布；移除第 99 題「本遊戲背後的技術」的不實描述。
- 測試：`node tools/test_academy.mjs`（規則、題庫、Worker 指令）；`python3 tools/check_i18n_browser.py --suite academy`（桌面與 390px 流程、語言、BONUS 單次、離頁）。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/academy/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
