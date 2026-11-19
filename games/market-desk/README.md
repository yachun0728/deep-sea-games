# 收盤之前 Closing Call（market-desk）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#market-desk`　分類：益智策略　狀態：顯示中
- 大廳卡片：「20 個交易日，從台股怪新聞裡挖出可信的消息。」｜免費 · 不限次數 · 消息查證
- 追蹤名稱（GA4 `game_name`）：收盤之前，`game_id` 為 `market-desk`
- 檔案：`games/market-desk/card.html`、`games/market-desk/cases.js`、`games/market-desk/cover.webp`、`games/market-desk/game.js`、`games/market-desk/icon.svg`、`games/market-desk/style.css`、`games/market-desk/view.html`；`game.js` 共 437 行、19.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「49. 收盤之前 Closing Call（market-desk）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-market-desk`、`mk-day`、`mk-sound`、`mk-status`、`mk-character`、`mk-portrait`、`mk-life-title`、`mk-life-story`、`mk-exchange`、`mk-index-label`、`mk-index`、`mk-change`、`mk-market-index`、`mk-market-change`、`mk-risk`、`mk-focus`、`mk-risk-meter`、`mk-risk-warning`、`mk-chart`、`mk-axis`、`mk-layout`、`mk-intro`、`mk-go`、`mk-case`、`mk-headline`、`mk-clue`、`mk-actions`、`mk-settling`、`mk-review`、`mk-reveal`、`mk-result-move`、`mk-life-shift`、`mk-verdict`、`mk-market-recap`、`mk-feedback`、`mk-next`、`mk-score`、`mk-best`、`mk-tape-label`、`mk-tape`、`mk-finish`、`mk-ending-status`、`mk-replay`、`mk-ending-tag`、`mk-ending`、`mk-epilogue`、`mk-ending-art`、`mk-final-revenue`、`mk-result`、`mk-final-market`、`mk-rank-status`、`mk-rank-retry`、`mk-rank-board`、`mk-rank-board-status`、`mk-rank-list`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）

## 函式索引（game.js，行號為宣告位置）

`money` L33、`prepareRankedRound` L34、`renderRankStatus` L43、`sendRankedRound` L47、`submitRankedRound` L68、`loadRankings` L77、`lifeAt` L113、`portraitPath` L116、`paintCharacter` L119、`playBell` L138、`signedPercent` L156、`paintChart` L159、`percent` L169、`local` L196、`params` L199、`render` L202、`renderFinale` L261、`start` L287、`choose` L317、`reveal` L328、`next` L352

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

- L313 `start`：`round = AN.start('market-desk', 0, params());`
- L348 `reveal`：`AN.progress(round, params(), false);`
- L362 `next`：`AN.end(round, 0, focus === 0 ? 'lose' : 'win', params());`
- L391 `next`：`AN.end(round, 0, 'abandoned', params());`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

- 免費益智遊戲。玩家辭職後以 20 個交易日完成一份虛構市場查證報告。首版從原企劃改寫 20 個台股事件，每局打散順序。
- 每日閱讀新聞與線索，選擇刊登可核對的事實、暫緩未獲佐證的消息，或針對明確詐騙跡象示警。事件有固定答案，選擇後可閱讀判斷理由。
- 初始專注力 100。答對加 5 分並回復 4 專注力（上限 100），答錯扣 18 專注力。答完第 20 天或專注力歸零時查看結局。專注力歸零為「提早收工」。完成 20 天時，信心指數與開局差距在 40 以內為平收、低於開局超過 40 為失利。信心領先大盤至少 100 指數點時走大勝結局，追平大盤或領先較少時穩健收官。
- 報告最高 100 分，結局確認時記錄本機最高分。離開遊戲或重新整理會結束當局。開局、選擇、結束均無平台點數交易或 BONUS。
- 每天收盤以紅漲綠跌的 K 線展示虛構信心指數。阿澤信心指數從 1,000 起算。答對上升、連對時漲幅增加；暫緩已核實可刊登的資訊會依當天大盤小幅上揚或持平，其餘錯誤會下跌。信心指數不參與分數或點數結算。可自行開啟收盤音效。
- 送出判斷後，盤面短暫顯示收盤撮合，再揭曉當日結果。啟用減少動態效果時立即揭曉。專注力剩 18 以下會提示再答錯一次即出局。
- 劇情場景隨虛構信心指數在五個階段切換。1,090 起搬進新辦公室，1,230 起升至頂樓；960 以下開始靠泡麵過日子，860 以下進入低潮。場景隨後續表現可升可降，重玩從一般辦公桌開始。場景僅供敘事呈現。
- 五種處境各有獨立插畫。跨越門檻時有短場景切換，收盤結果會標示升級或下滑，減少動態效果時直接換圖。手機遊戲卡直接開啟單欄直式配置；遊戲內的展開鍵只在頁內展開。
- 虛構大盤從 1,000 起算，每題走勢固定且不受玩家選項影響。完成 20 天、阿澤信心指數較開局上升超過 40、但落後大盤時，觸發「牛市裡的慢半拍」，並顯示兩者累計百分比。
- 結局獨立呈現最後一幕和累計成績，上方「下一輪」直接開始新一局。
- 最終營收是虛構金額，開局為 NT$100,000，每個信心指數點對應 NT$100。完成 20 天或專注力歸零時，將該局最終金額提交訪客排行榜。金額從高到低，同分先達成者優先。虛構大盤、查證分數及平台點數不納入排名。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/market-desk/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
