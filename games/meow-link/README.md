# 貓咪連連看 Meow Link（meow-link）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#meow-link`　分類：懷舊經典　狀態：顯示中
- 大廳卡片：「貓咪、玩具與罐罐配對，尋找藏在其中的拉布。」｜不限次數 · 配對解謎
- 追蹤名稱（GA4 `game_name`）：貓咪連連看，`game_id` 為 `meow-link`
- 檔案：`games/meow-link/card.html`、`games/meow-link/cover.webp`、`games/meow-link/game.js`、`games/meow-link/icon.svg`、`games/meow-link/leaderboard.webp`、`games/meow-link/style.css`、`games/meow-link/tiles.js`、`games/meow-link/view.html`；`game.js` 共 502 行、20.1 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「63. 貓咪連連看 Meow Link（meow-link）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-meow-link`、`ml-stage`、`ml-rule`、`ml-clock`、`ml-clock-label`、`ml-time`、`ml-toolbar-actions`、`ml-mode`、`ml-go`、`ml-hint`、`ml-count`、`ml-level`、`ml-left`、`ml-bonus`、`ml-record`、`ml-best`、`ml-msg`、`ml-rank-status`、`ml-rank-retry`、`ml-game-area`、`ml-board-actions`、`ml-full`、`ml-playfield`、`ml-board`、`ml-trace`、`ml-result`、`ml-result-title`、`ml-result-level`、`ml-result-time`、`ml-result-reward`、`ml-result-actions`、`ml-leaderboard`

## 狀態與常數

- 狀態物件／進行中旗標：`meowLinkBusy`（L2）

## 函式索引（game.js，行號為宣告位置）

`rankMode` L18、`updateClock` L30、`twoDigits` L35、`resumeClock` L40、`pauseClock` L46、`hideResult` L54、`showResult` L61、`say` L76、`sizeBoard` L78、`paint` L105、`bestStages` L132、`showRecord` L137、`updateButtons` L142、`drawTrace` L154、`center` L156、`clearTrace` L164、`stageRule` L171、`dealLevel` L181、`params` L206、`rankStatus` L211、`submitLevel` L218、`rememberTime` L252、`beginLevelClock` L257、`start` L276、`end` L320、`completeLevel` L338、`recover` L376、`pick` L380、`matchTiles` L404、`clearHint` L425、`showHint` L429、`setExpanded` L440、`syncFull` L446、`toggleFull` L464、`routeMeowLink` L493

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L359 `completeLevel`：`S.balance += reward;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L283 `start`：`AN.resume(round, params());`
- L317 `start`：`round = AN.start('meow-link', 0, params());`
- L325 `end`：`AN.end(round, paid, result, params());`
- L363 `completeLevel`：`AN.progress(round, params({bonus_points: reward}), level < levels.length);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

獨立於 Ocean Link 的貓咪換皮版本；大廳第 4 款。簡單 6×8／12 種、普通 14×18／24 種、困難 16×26／36 種。36 種為 12 貓咪（含拉布）、8 玩具、8 食物、8 用品。簡單混合 6 貓咪、2 玩具、2 食物、2 用品；普通使用全部 12 貓咪及三類物品各 4 種；困難使用全部。相同貓咪或相同物品皆能配對。

沿用原版十關、最多兩次轉彎、可繞外框、免費提示、無路自動洗牌、障礙分段位移、不限時與關間停表。簡單十關均經典；普通／困難依序為經典、經典、左移、下移、障礙、障礙、右移、上移、障礙左移、障礙下移。免費開始，第 3、6、10 關各即時獎勵 5 點，同一次遠征每門檻只發一次，共 15 點；平台既有有效遊玩及首次完成獎勵另照原平台規則。

獨立最佳紀錄鍵 `deep-sea-meow-link-best-v1`，不讀寫 Ocean Link 存檔。CSS 全視窗操作，離開全視窗、回大廳、pagehide 放棄未完成進度，已發點數保留。背景停留沿用原版累計時鐘，不提供暫停玩法。

訪客計時榜分為 `meow-link-easy`、`meow-link-normal`、`meow-link-hard` 三榜，對應簡單、普通、困難。全破 10 關才入榜，完成時間較短者優先，同毫秒先到者優先。Worker 逐關重播合法配對、障礙位移及洗牌；每關先接收開表指令，完成驗證後停表，結算停留及等候下一關不計時。伺服器計時包含指令傳輸延遲，結算以已驗證總時間校正；切到背景不暫停。沿用兩小時對局期限。沿用高分優先的資料表，以 7200000 減去全破毫秒數保存排序值；API、大廳及遊戲內榜顯示分:秒.毫秒，不顯示排序值。舊 meow-link 通關數紀錄及回合保留，從大廳 feed 隱藏，不混入新榜。最快全破時間另存 `deep-sea-meow-link-time-best-v1`，舊最高關卡紀錄不清除。Ocean Link 不受影響。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/meow-link/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
