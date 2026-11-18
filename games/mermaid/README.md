# 人魚接龍 Mermaid Spider（mermaid）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mermaid`　分類：益智策略　狀態：顯示中
- 大廳卡片：「牌背是美人魚的蜘蛛接龍，排滿 K 到 A 收成珍珠。」｜每局 10 點 · 策略接龍
- 追蹤名稱（GA4 `game_name`）：人魚接龍，`game_id` 為 `mermaid`
- 檔案：`games/mermaid/card.html`、`games/mermaid/game.js`、`games/mermaid/icon.svg`、`games/mermaid/style.css`、`games/mermaid/view.html`；`game.js` 共 287 行、20.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「40. 人魚接龍 Mermaid Spider（mermaid）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mermaid`、`mm-su0`、`mm-su1`、`mm-su2`、`mm-su3`、`mm-art-q`、`mm-art-k`、`mm-art-j`、`mm-stage`、`mm-avatar`、`mm-bubble`、`mm-info`、`mm-stock`、`mm-stock-count`、`mm-slots`、`mm-undo`、`mm-hint`、`mm-board`、`mm-cover`、`mm-cover-title`、`mm-cover-text`、`mm-pearls`、`mm-score`、`mm-best`、`mm-go`、`mm-quit`、`mm-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`M`（L91）、`mmBusy`（L2）
- L4 常數：`BEST_KEY`
- L5 常數：`RUN_POINTS`、`CLEAR_BONUS`、`TOTAL_RUNS`
- L6 常數：`MODES`
- L7 常數：`RANK`
- L8 常數：`BACK_SVG`

## 函式索引（game.js，行號為宣告位置）

`shuffle` L10、`createGame` L11、`snap` L18、`pushHistory` L19、`undo` L20、`flipTop` L21、`runStart` L22、`canDrop` L26、`completeRun` L31、`sweep` L35、`move` L41、`canDeal` L48、`deal` L49、`allMoves` L57、`chainLen` L64、`scoreMove` L68、`findHint` L75、`saveStore` L84、`bestFor` L85、`say` L92、`setText` L94、`metrics` L95、`colX` L100、`colY` L101、`need` L103、`relPos` L109、`cardEl` L110、`render` L118、`updateSlots` L145、`buildBoard` L147、`runFx` L150、`ui` L161、`pay` L175、`clearHint` L178、`afterAction` L179、`end` L191、`start` L201、`locked` L208、`doMove` L210、`tapColumn` L213、`colAtX` L221、`finishDrag` L241、`layoutIdle` L285

## 錢包與結算接點

**扣款（開始一局）**
- L204 `start`：`S.balance-=ENTRY_FEE;`

**入帳（領回／獎勵）**
- L176 `pay`：`S.balance+=n;`

**餘額檢查**
- L203 `start`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 4 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L177 `pay`：`AN.progress(analytics,{stage:G.done,step:earned,score:G.score,bonus_points:n})}`
- L196 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:G.score,step:G.done,stage:G.done});`
- L204 `start`：`analytics=AN.start('mermaid',ENTRY_FEE);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`M`、`mmBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`mmBusy` 所在 IIFE（`games/mermaid/game.js`，純 DOM＋內嵌 SVG，無畫布）。2026-11-18 由使用者要求新增：蜘蛛接龍（Spider Solitaire），牌背換成美人魚。花色為貝殼／海星／珊瑚／魚尾（`mm-su0`–`mm-su3`），J／Q／K 為海馬／美人魚／海王；牌背是內嵌 SVG（`BACK_SVG`），每張暗牌露出的上緣是一顆探頭的人魚頭。牌桌背景有氣泡、海草與人魚頭像（收成珍珠時唱歌），皆為純視覺，`prefers-reduced-motion` 時停用動畫。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點發牌」時一次扣除並呼叫 `AN.start('mermaid')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。難度（淺灘 1 花色／珊瑚礁 2 花色／深海 4 花色）要在扣點前選，進行中鎖定。
- 規則：104 張、10 列（前 4 列 6 張、後 6 列 5 張，只翻最上面一張），牌堆 50 張分 5 次、每次每列各發一張（發牌前每列都要有牌）。牌可放在比它大 1 的牌上（不限花色）或空列；只有同花色、由大到小連續的牌能一起搬。同花色 K→A 滿 13 張自動收成一顆珍珠（`sweep`），收滿 8 顆通關。悔棋不限次數（歷史上限 400 步），悔棋與每步各 −1 分，每顆珍珠 +100 分，起始 500 分；分數只顯示與記錄最高分，不換點數。
- 指路：`findHint` 列舉所有合法步並依「完成一組、接同花色、翻開暗牌、不拆同花色串」評分；沒有好步時建議發牌。不限次數、不扣點。
- BONUS（固定點數，不依入場費計算）：每收成一顆珍珠 +1 點當場入帳（`RUN_POINTS`）；珊瑚礁與深海通關再 +2 點（`CLEAR_BONUS`，`bonusPaid` 確保只發一次）。淺灘最多 8 點、其餘最多 10 點，沒有下注、倍率或領回。防刷：以 `maxDone`（本局歷史最大完成組數）判斷，悔棋後再收同一顆不重複發點。放棄或輸不扣回已入帳點數。
- 結算：通關或按兩次「放棄本局」才結束；`end` 只在進行中執行一次，送一次 `AN.end`（payout_points 為本局已入帳 BONUS，有入帳為 `complete`，否則 `loss`，附 `score`、`step`／`stage`＝完成組數）。每次入帳送一次 `AN.progress`（含 `bonus_points`）。沒有計時器；沒有可走的步時只提示，不自動結束。
- 儲存與重設：`deep-sea-mermaid-best`（JSON：各難度最高分與上次難度；完成 ≥1 組才記最高分）。重設 500 點在本局進行中（`mmBusy`）會被擋下；`hot.snapshot` 計入已扣入場費；重新整理放棄本局，已扣不退。
- 操作：拖曳，或點一下牌再點目標列（選取時合法目標列會發光）；左上牌堆發牌，悔棋、指路在牌桌上方。沒有鍵盤快捷鍵；按鈕皆可聚焦。
- 英文：所有介面字串都有 `locales/en.json` 條目（動態字串用片段組合）；`js/i18n.js` 的 `names` 加入 `Mermaid Spider`；`tools/i18n_browser_games.js` 登錄 `mermaid:'mm-go'`。
- 測試：`node tools/test_mermaid.mjs`。
- 平衡（沒有真人數據）：4 花色蜘蛛接龍對一般玩家勝率很低，通關加發的 2 點在深海幾乎領不到，這是刻意的技巧門檻；若玩家反映深海沒有動機，再調整深海的固定獎勵。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mermaid/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
