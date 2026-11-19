# 深海連連看 Ocean Link（ocean-link）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#ocean-link`　分類：免費懷舊　狀態：顯示中
- 大廳卡片：「把相同的圖案連起來，穿越礁石與移動棋盤。」｜不限次數 · 配對解謎
- 追蹤名稱（GA4 `game_name`）：深海連連看，`game_id` 為 `ocean-link`
- 檔案：`games/ocean-link/board.js`、`games/ocean-link/card.html`、`games/ocean-link/cover.webp`、`games/ocean-link/game.js`、`games/ocean-link/icon.svg`、`games/ocean-link/style.css`、`games/ocean-link/tiles.js`、`games/ocean-link/view.html`；`game.js` 共 407 行、15.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「40. 深海連連看 Ocean Link（ocean-link）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-ocean-link`、`ol-stage`、`ol-rule`、`ol-clock`、`ol-clock-label`、`ol-time`、`ol-toolbar-actions`、`ol-mode`、`ol-go`、`ol-hint`、`ol-count`、`ol-level`、`ol-left`、`ol-bonus`、`ol-record`、`ol-best`、`ol-msg`、`ol-game-area`、`ol-board-actions`、`ol-full`、`ol-playfield`、`ol-board`、`ol-trace`、`ol-result`、`ol-result-title`、`ol-result-level`、`ol-result-time`、`ol-result-reward`、`ol-result-actions`

## 狀態與常數

- 狀態物件／進行中旗標：`oceanLinkBusy`（L2）

## 函式索引（game.js，行號為宣告位置）

`updateClock` L23、`twoDigits` L28、`resumeClock` L33、`pauseClock` L39、`hideResult` L47、`showResult` L54、`say` L69、`sizeBoard` L71、`paint` L98、`bestStages` L121、`showRecord` L126、`updateButtons` L130、`drawTrace` L141、`center` L143、`clearTrace` L151、`stageRule` L158、`dealLevel` L162、`params` L186、`start` L191、`end` L213、`completeLevel` L231、`recover` L259、`pick` L269、`matchTiles` L293、`clearHint` L313、`showHint` L317、`setExpanded` L328、`syncFull` L334、`toggleFull` L352、`routeOceanLink` L398

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L243 `completeLevel`：`S.balance += reward;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L198 `start`：`AN.resume(round, params());`
- L210 `start`：`round = AN.start('ocean-link', 0, params());`
- L218 `end`：`AN.end(round, paid, result, params());`
- L247 `completeLevel`：`AN.progress(round, params({bonus_points: reward}), level < levels.length);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

簡單棋盤為 6 列 × 8 欄，標準為 14 列 × 18 欄，挑戰為 16 列 × 26 欄。簡單模式 10 關皆為經典消除，第 1–3 關使用 6 種圖案，第 4–6 關使用 8 種，第 7–10 關使用 12 種。配對相同圖案，路徑只能水平或垂直，最多轉兩次，允許繞行一圈空白外框。棋盤使用 64 種圖案。礁石固定，會阻擋路徑並分隔移動區段；移動關每次配對後推擠同列或同欄的圖案。不限時，提示免費。沒有可配對的圖案時自動洗牌，保留礁石和剩餘圖案種類與數量，並重新安排位置。開局與洗牌均有可重播至清空的解法，包含移動關的位移。

免費懷舊分類。選擇難度後，點一下遊戲區即可進入全螢幕並免費開始遠征，過關後按下一關繼續。第 3、6、10 關完成時各立即入帳 5 點，每個門檻當次遠征限一次，總上限 15 點。重新開啟遠征會重開獎勵資格；未完成的關沒有獎勵。離開全螢幕、回大廳、離開網頁或重新整理會放棄未完成的進度，已入帳獎勵保留。簡單、標準與挑戰各自記錄最高通關關卡，固定獎勵規則相同。

標準與挑戰模式首版第 1–10 關依序為經典、經典、左移、下移、礁石、礁石、右移、上移、礁石加左移、礁石加下移。40 關規劃如下，第 11–40 關尚未實作。

| 關卡 | 規劃 |
| --- | --- |
| 11–20 | 方向移動進階，加入較長的連線與分段推擠 |
| 21–30 | 礁石進階，加入狹窄通道及更多外框連線 |
| 31–40 | 混合區，組合方向、礁石與高密度配對 |

遠征計時從開局開始，切換全螢幕及關卡進行中的背景停留會持續累計。每關完成時停表，顯示恭喜畫面及累計用時，按下一關才恢復累計；遠征結束後保留完成時間，下一次開始時歸零。計時沒有倒數或逾時判定。放大模式優先使用可用空間顯示棋盤，手機直式將短邊排在水平方向，放大每塊圖案，並把計時與操作放在棋盤上方。橫式將計時與操作放在旁邊。旋轉只調整顯示方向，保留當前棋局與計時。點擊遊戲區任一位置可進入全螢幕，離開全螢幕的按鈕位於上方控制列。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/ocean-link/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
