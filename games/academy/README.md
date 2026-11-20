# 百萬大學堂 Millionaire Academy（academy）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#academy`　分類：益智策略　狀態：顯示中
- 大廳卡片：「一百道百科題，自選領域闖十關，挑戰 1,000,000 學分。」｜不限次數 · 百科問答
- 追蹤名稱（GA4 `game_name`）：百萬大學堂，`game_id` 為 `academy`
- 檔案：`games/academy/card.html`、`games/academy/game.js`、`games/academy/icon.svg`、`games/academy/questions.js`、`games/academy/style.css`、`games/academy/view.html`；`game.js` 共 683 行、36.9 KB

## 畫面元素（view.html 的 id）

`view-academy`、`ac-app`、`ac-exit`、`ac-stage`、`ac-credits`、`ac-timer`、`ac-ring`、`ac-time`、`ac-lang`、`ac-ladder`、`ac-intro`、`ac-best`、`ac-timer-toggle`、`ac-sound`、`ac-select`、`ac-pick-title`、`ac-domains`、`ac-ask`、`ac-domain-tag`、`ac-question`、`ac-hint`、`ac-feedback`、`ac-fb-status`、`ac-fb-exp`、`ac-over`、`ac-over-icon`、`ac-rank-badge`、`ac-over-title`、`ac-over-sub`、`ac-final`、`ac-stat-stages`、`ac-stat-acc`、`ac-stat-life`、`ac-stat-bonus`、`ac-rank-status`、`ac-lifelines`、`ac-fifty`、`ac-hint-btn`、`ac-swap`、`ac-options`、`ac-actions`、`ac-go`、`ac-next`、`ac-walk-btn`、`ac-rank-btn`、`ac-retry`、`ac-walk`、`ac-walk-title`、`ac-walk-text`、`ac-walk-no`、`ac-walk-yes`、`ac-rank`、`ac-rank-title`、`ac-rank-note`、`ac-rank-list`、`ac-rank-empty`、`ac-rank-close`

## 狀態與常數

- 狀態物件／進行中旗標：`T`（L15）
- L8 常數：`LANGS`
- L9 常數：`LANG_ATTR`
- L10 常數：`LANG_LABEL`
- L11 常數：`TIME_LIMIT`
- L12 常數：`STAGES`

## 函式索引（game.js，行號為宣告位置）

`siteLang` L151、`savePrefs` L154、`t` L161、`fmt` L165、`questionOf` L166、`tone` L178、`prepareRankedRound` L205、`renderRankStatus` L214、`sendRankedRound` L219、`submitRankedRound` L239、`loadRankings` L249、`openRank` L272、`closeRank` L277、`stopTimer` L280、`paintTimer` L281、`startTimer` L288、`pauseTimer` L301、`resumeTimer` L307、`params` L314、`setText` L315、`renderStatic` L316、`renderLadder` L335、`renderDomains` L348、`renderQuestion` L377、`render` L402、`renderOver` L438、`pay` L459、`start` L469、`act` L491、`pickDomain` L496、`useLife` L506、`choose` L522、`timeUp` L530、`settle` L535、`next` L550、`finish` L558、`openWalk` L572、`closeWalk` L579、`confirmWalk` L580、`setLang` L586、`abandon` L590

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L463 `pay`：`S.balance += n;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L466 `pay`：`AN.progress(analytics, { stage, step: state.answered, score: state.credits, bonus_points: n }, false);`
- L487 `start`：`analytics = AN.start('academy', 0, params());`
- L546 `settle`：`AN.progress(analytics, params(), false);`
- L566 `finish`：`AN.end(analytics, bonusEarned, state.cleared > 0 ? 'complete' : 'loss', params());`
- L595 `abandon`：`AN.end(analytics, bonusEarned, 'abandoned', params());`
- L672 `abandon`：`if (analytics && (phase === 'ask' || phase === 'select')) AN.end(analytics, bonusEarned, 'abandoned', params(…`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/academy/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
