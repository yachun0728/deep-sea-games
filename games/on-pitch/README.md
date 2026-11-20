# 不准跑調 Stay On Pitch（on-pitch）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#on-pitch`　分類：時機操作　狀態：顯示中
- 大廳卡片：「對著麥克風唱出缺口的音，音準對了才能穿牆。」｜立即開玩 · 聲控挑戰
- 追蹤名稱（GA4 `game_name`）：不准跑調，`game_id` 為 `on-pitch`
- 檔案：`games/on-pitch/card.html`、`games/on-pitch/cover.webp`、`games/on-pitch/game.js`、`games/on-pitch/icon.svg`、`games/on-pitch/style.css`、`games/on-pitch/view.html`；`game.js` 共 883 行、42.7 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「50. 不准跑調 Stay On Pitch（on-pitch）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-on-pitch`、`op-canvas`、`op-level`、`op-score`、`op-stars`、`op-go`、`op-msg`、`op-in-mic`、`op-in-key`、`op-oct-any`、`op-oct-strict`、`op-mic-test`

## 狀態與常數

- 狀態物件／進行中旗標：`OP`（L255）
- L6 常數：`NOTE_KEYS`
- L7 常數：`SEMI`
- L8 常數：`SOLF`
- L9 常數：`NOTE_HZ`
- L10 常數：`PC_NAMES`
- L68 常數：`CUE_FULL`
- L69 常數：`CUE_W3`
- L70 常數：`CUE_W4`
- L229 常數：`FONT`
- L232 常數：`TITLE_EN`
- L234 常數：`THEME`
- L240 常數：`STEP_H`、`BASE_Y`、`CHAR_X`、`SPEED`
- L249 常數：`SAVE_KEY`
- L254 常數：`LEVELS`

## 函式索引（game.js，行號為宣告位置）

`opRoute` L2、`mod` L11、`hzToMidi` L12、`mulberry32` L13、`detectPitch` L16、`seq` L56、`randSeq` L57、`makeLevels` L67、`endlessLevel` L111、`createGame` L116、`addWall` L124、`addEndless` L134、`EN` L230、`T` L231、`LT` L233、`rowY` L241、`sizeCanvas` L246、`persist` L252、`toast` L259、`ensureCtx` L263、`playTone` L268、`playTick` L280、`keyHz` L321、`getHz` L341、`ensureMic` L349、`startLevel` L358、`endRound` L376、`pauseRound` L382、`resumeRound` L389、`leaveToMenu` L399、`toLogical` L407、`releasePtr` L427、`shape` L434、`heart` L445、`text` L453、`rrect` L464、`panel` L468、`button` L484、`noteName` L492、`stars` L493、`drawBackground` L508、`drawHero` L531、`drawSteps` L559、`drawWall` L576、`body` L586、`drawHUD` L625、`semiToStep` L663、`heroY` L671、`drawKeys` L673、`lighten` L688、`drawPlay` L693、`drawPause` L720、`gradeText` L727、`drawResult` L728、`drawMenu` L752、`frame` L788、`opShown` L833、`opSay` L834、`opL` L838、`opUI` L843、`onRoute` L855

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L360 `startLevel`：`if (ENTRY_FEE > S.balance){ opSay(LOW_MSG, 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L372 `startLevel`：`OP.analytics = AN.start('on-pitch', ENTRY_FEE, { stage: lv.w + 1, step: 0 });`
- L379 `endRound`：`AN.end(a, 0, result, extra);`
- L386 `pauseRound`：`if (OP.analytics) AN.progress(OP.analytics, { phase:'pause' }, true);`
- L396 `resumeRound`：`if (OP.analytics) AN.resume(OP.analytics);`
- L876 `onRoute`：`AN.end(a, 0, 'abandoned', { score: OP.score });`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`opRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/on-pitch/game.js`（自帶 IIFE，對外只有 `window.deepSeaOnPitch`），畫面為 `#op-canvas`（400×720，直接畫在父頁，不用 iframe，因為 iframe 需要額外授權麥克風）。2026-11-19 由聲控原型改寫接入平台。

- 玩法：機器人往前滑，牆上缺口高度對應 C D E F G A B（第 4 八度）。玩家用麥克風唱出該音，音高在容許誤差內並撐住 0.20～0.25 秒就通過；過牆時間內沒通過失去 1 顆愛心，共 3 顆。通過依誤差分「完美／好／過」，連續通過累積連擊分。
- 關卡：5 個世界×4 關＋無盡。世界 1 全提示、2 公版旋律（小星星、瑪莉有隻小綿羊、歡樂頌、Jingle Bells）、3 藏起缺口高度、4 只剩顏色閃現、5 逐步拿掉提示。容許誤差 ±45／40／40／35／30 音分。星數依失誤次數。
- 判定：YIN 音高偵測，70～1200 Hz，clarity ≥ 0.8，中位數平滑 120 ms；預設「任何八度」只看音名，可切「嚴格第 4 八度」。播放參考音或音效時暫停偵測（約 +150 ms），避免麥克風收回喇叭聲。
- 入場：免費（全站 `ENTRY_FEE=0`）。右側「開始遊戲」與畫面上的關卡按鈕都走同一個 `startLevel`；進行中或等待麥克風授權時再點不會再開一局。
- BONUS：沒有。分數、連擊與星數只是成績，不換點數，沒有任何下注或倍率返還。每款遊戲每天第一次完整玩過一局（至少 10 秒有效時間）的平台完成獎勵由 `AN.end` 的 `complete` 觸發，與成績無關。
- 結算：過關或失敗各送一次 `AN.end`（payout 0、result `complete`，附 `score`、`step`、`level`、`cleared`、`stars`）。暫停後選「回選單」或正常離頁送 `abandoned`；BFCache persisted 不結束。
- 麥克風：只在遊戲中即時分析，不錄音、不上傳；暫停、切換分頁、離開本頁都會立刻關閉麥克風並於繼續時重開。被拒絕或不支援時自動改用螢幕琴鍵（練習模式，電腦也可按 C D E F G A B 或 1～7）並記住。
- 儲存：Key `on-pitch-v1`（JSON：`stars`、`input`、`octave`）；新增於 2026-11-19。
- 語言：畫面文字以 `T(中文, English)` 依 `deepSeaI18n` 目前語言輸出；DOM 字串與訊息（`中文|English`）補在 `locales/en.json`。
- 排行榜：本次上架**尚未串接**（不是「不參與」）。聲控成績可定義為各關最高分或無盡最高分，但 Worker 能驗證的只有「聲音輸入的音高序列」，無法證明音高真的來自嗓音；要做需先決定排行指標與可接受的作弊風險，再依 README「新增遊戲必接訪客排行榜」補 Worker 驗證器（以 `createGame` 重播音高序列）、D1 公開榜與測試。在此之前不顯示榜單。
- 未驗證：真人嗓音在各種手機／瀏覽器（特別是 iOS Safari）的偵測穩定度、藍牙耳機延遲、環境噪音下的誤判；容許誤差與 3 顆愛心的難度需真人測試。
- 測試：`node tools/test_on_pitch.mjs`。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/on-pitch/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
