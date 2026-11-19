# 貓咪疊書舖 Cat Book Stack（book-sort）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#book-sort`　分類：益智策略　狀態：顯示中
- 大廳卡片：「把書依顏色疊進紙箱，集滿 5 本同色自動封箱。」｜免費遊玩 · 分類整理
- 追蹤名稱（GA4 `game_name`）：貓咪疊書舖，`game_id` 為 `book-sort`
- 檔案：`games/book-sort/card.html`、`games/book-sort/game.js`、`games/book-sort/icon.svg`、`games/book-sort/style.css`、`games/book-sort/view.html`；`game.js` 共 247 行、16.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「50. 貓咪疊書舖 Cat Book Stack（book-sort）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-book-sort`、`bs-stage`、`bs-tip`、`bs-boxes`、`bs-modal`、`bs-modal-title`、`bs-modal-quote`、`bs-final-moves`、`bs-final-rating`、`bs-next`、`bs-level-text`、`bs-moves`、`bs-best`、`bs-level`、`bs-undo`、`bs-hint`、`bs-restart`、`bs-add`、`bs-random`、`bs-sound`、`bs-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L3 常數：`CAP`、`BEST_KEY`、`GAME_ID`
- L4 常數：`BOOKS`
- L13 常數：`COLORS`
- L14 常數：`CATS`
- L15 常數：`QUOTES`
- L16 常數：`LEVELS`

## 函式索引（game.js，行號為宣告位置）

`isFull` L23、`topCount` L24、`canMove` L25、`moveCountOf` L29、`applyMove` L30、`solved` L33、`legalMoves` L34、`keyOf` L50、`solve` L51、`dfs` L53、`scramble` L63、`randomLevel` L72、`rate` L79、`g` L82、`I` L83、`T` L84、`saveStore` L89、`say` L101、`paintSay` L102、`bestFor` L103、`trackEnd` L104、`load` L108、`ui` L117、`describe` L124、`render` L129、`shake` L158、`sparkles` L159、`click` L165、`doMove` L178、`win` L204、`findHint` L215

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

- L106 `trackEnd`：`AN.end(round,0,result,{step:moves,stage:level})}catch(_){}`
- L194 `doMove`：`round=AN.start(GAME_ID,0,{stage:level})}catch(_){round=null}}`
- L201 `doMove`：`AN.progress(round,{stage:level,step:moves})}catch(_){}}`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`load`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/book-sort/game.js`（純 DOM，無畫布，IIFE 內自成一體）。2026-11-19 由使用者提供單檔 HTML 小遊戲後整理上架，分類為益智策略。完全免費：不扣入場費、沒有點數獎勵，不讀寫 `S.balance`、`save()`、`renderAll()`，也不需要 `hot.snapshot` 或重設防護；沒有任何下注、倍率或領回。

- 規則：每箱最多 5 本，點一個箱子拿起頂部連續同色書，再點另一個箱子；目標必須是空箱，或頂部同色且有空位，一次最多搬滿目標空位（超出的留在原箱）。集滿 5 本同色自動封箱（封箱狀態由「滿 5 本且同色」推導，不另存），封箱後不可再動。所有非空箱都封箱即過關。
- 關卡：5 個固定關卡（3／4／5／6／8 色，各有 2 個空箱）＋隨機關卡。隨機關卡以合法逆向打亂產生，並用深度優先解題器（`solve`，節點上限 30000）檢查有解、且開場沒有已封箱的箱子，失敗最多重試 40 次，仍失敗則退回固定關卡。每關一次臨時紙箱，撤銷與提示不限次數；撤銷會一併還原臨時紙箱。
- 提示：以解題器回傳目前盤面的第一步；解不出來時退回貪心評分。
- 評級：步數 ≤ 色數×3＋4 為三星，≤ ×3＋12 為二星，其餘一星；僅顯示用。
- 儲存：`deep-sea-book-sort-best`（JSON：固定關卡編號 → 最少步數；隨機關卡不記錄）。新增於 2026-11-19。
- 追蹤：`AN.start('book-sort', 0, {stage})` 在每個關卡嘗試的第一步才送出；過關送 `complete`，重新開始、切換關卡、離開本款頁面送 `abandoned`，各只送一次；每步送一次 `AN.progress`。入帳與扣點皆為 0。
- 英文：全部介面字串都有 `locales/en.json` 條目；動態字串以 `{0}` 樣板經 `deepSeaI18n.text` 組合，並在 `arcade-languagechange` 事件時重新繪製；`names` 加入 `Cat Book Stack`。書脊符號為每色獨立圖示，色盲可辨識。
- 測試：`node tools/test_book_sort.mjs`（預設關卡每色 5 本且有解、搬運規則、隨機關卡有解、原始碼不碰錢包）。DOM、動畫與多語系需在瀏覽器實測。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/book-sort/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
