# 貓咪疊書舖 Cat Book Stack（book-sort）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#book-sort`　分類：益智策略　狀態：顯示中
- 大廳卡片：「把書依顏色疊進紙箱，集滿 5 本同色自動封箱。」｜不限次數 · 分類整理
- 追蹤名稱（GA4 `game_name`）：貓咪疊書舖，`game_id` 為 `book-sort`
- 檔案：`games/book-sort/card.html`、`games/book-sort/game.js`、`games/book-sort/icon.svg`、`games/book-sort/ranking.js`、`games/book-sort/style.css`、`games/book-sort/view.html`；`game.js` 共 236 行、14.4 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「50. 貓咪疊書舖 Cat Book Stack（book-sort）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-book-sort`、`bs-stage`、`bs-title`、`bs-level-text`、`bs-moves`、`bs-menu`、`bs-level`、`bs-campaign-options`、`bs-best`、`bs-restart`、`bs-add`、`bs-random`、`bs-sound`、`bs-ranking`、`bs-rank-status`、`bs-rank-retry`、`bs-rank-board-status`、`bs-rank-list`、`bs-tip`、`bs-boxes`、`bs-undo`、`bs-hint`、`bs-modal`、`bs-modal-title`、`bs-modal-quote`、`bs-final-moves`、`bs-final-rating`、`bs-next`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L3 常數：`BEST_KEY`、`GAME_ID`
- L5 常數：`QUOTES`

## 函式索引（game.js，行號為宣告位置）

`g` L7、`I` L8、`T` L9、`readScores` L14、`highestUnlocked` L21、`saveBest` L28、`say` L47、`paintSay` L48、`bestFor` L49、`trackEnd` L50、`updateLevelPicker` L54、`load` L63、`ui` L79、`describe` L86、`render` L91、`shake` L125、`sparkles` L126、`click` L132、`doMove` L145、`win` L172、`findHint` L186、`closeMenu` L214

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

- L52 `trackEnd`：`AN.end(round,0,result,{step:moves,stage:level})}catch(_){}`
- L162 `doMove`：`round=AN.start(GAME_ID,0,{stage:level})}catch(_){round=null}}`
- L169 `doMove`：`AN.progress(round,{stage:level,step:moves})}catch(_){}}`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`load`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/book-sort/game.js`（純 DOM，無畫布，IIFE 內自成一體）。2026-11-19 由使用者提供單檔 HTML 小遊戲後整理上架，分類為益智策略。完全免費：不扣入場費、沒有點數獎勵，不讀寫 `S.balance`、`save()`、`renderAll()`，也不需要 `hot.snapshot` 或重設防護；沒有任何下注、倍率或領回。

- 規則：每箱最多 5 本，點一個箱子拿起頂部連續同色書，再點另一個箱子；目標必須是空箱，或頂部同色且有空位，一次最多搬滿目標空位（超出的留在原箱）。集滿 5 本同色自動封箱（封箱狀態由「滿 5 本且同色」推導，不另存），封箱後不可再動。所有非空箱都封箱即過關。
- 關卡：前 5 關維持固定盤面，第 6、11、21 關起分別有 9、10、11 色，第 36 關起只有 1 個起始空箱。後續關卡以編號作種子產生可解盤面，維持最高難度。另有 6 色隨機挑戰。每局可加一次臨時紙箱，撤銷可還原，提示不限次數。
- 評級與紀錄：固定關和隨機挑戰維持原評級。進階關以生成時找到的解法步數為三星門檻。沿用 `deep-sea-book-sort-best` 保存編號關卡的最少步數，從最高已通關編號推算下一關。
- 訪客排行榜：透過新版 SDK 開立綁定關卡的訪客回合，Worker 重播未撤銷的合法搬書與臨時箱操作。以最高通關編號排名，同分依既有伺服器順序。隨機挑戰不入榜，離線保留本機紀錄。
- 追蹤：`AN.start('book-sort', 0, {stage})` 在每個關卡嘗試的第一步才送出；過關送 `complete`，重新開始、切換關卡、離開本款頁面送 `abandoned`，各只送一次；每步送一次 `AN.progress`。入帳與扣點皆為 0。
- 英文：全部介面字串都有 `locales/en.json` 條目；動態字串以 `{0}` 樣板經 `deepSeaI18n.text` 組合，並在 `arcade-languagechange` 事件時重新繪製；`names` 加入 `Cat Book Stack`。書脊符號為每色獨立圖示，色盲可辨識。
- 測試：`node tools/test_book_sort.mjs`（預設關卡每色 5 本且有解、搬運規則、隨機關卡有解、原始碼不碰錢包）。DOM、動畫與多語系需在瀏覽器實測。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/book-sort/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
