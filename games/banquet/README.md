# 最後的晚餐 The Last Banquet（banquet）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#banquet`　分類：益智策略　狀態：顯示中
- 大廳卡片：「與莊家在暗室輪流喝未知的酒，用記憶、機率和道具撐到最後。」｜每局 10 點 · 心理博弈
- 追蹤名稱（GA4 `game_name`）：最後的晚餐，`game_id` 為 `banquet`
- 檔案：`games/banquet/card.html`、`games/banquet/game.js`、`games/banquet/icon.svg`、`games/banquet/style.css`、`games/banquet/view.html`；`game.js` 共 594 行、36.2 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「41. 最後的晚餐 The Last Banquet（banquet）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-banquet`、`bq-stage`、`bq-act`、`bq-dealerbox`、`bq-dealer`、`bq-side-d`、`bq-hp-d`、`bq-hp-d-t`、`bq-dr-d`、`bq-items-d`、`bq-chips`、`bq-comp`、`bq-table`、`bq-center`、`bq-center-1`、`bq-center-2`、`bq-reveal`、`bq-ticker`、`bq-side-p`、`bq-hp-p`、`bq-hp-p-t`、`bq-dr-p`、`bq-items-p`、`bq-prompt`、`bq-prompt-t`、`bq-believe`、`bq-doubt`、`bq-actions`、`bq-turn`、`bq-act-row`、`bq-self`、`bq-toast`、`bq-silver`、`bq-notes`、`bq-dhand-t`、`bq-dhand`、`bq-hand`、`bq-log`、`bq-flash`、`bq-stage-t`、`bq-bonus`、`bq-best`、`bq-amount`、`bq-go`、`bq-quit`、`bq-adv`、`bq-mute`、`bq-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`SAY`（L27）、`SFX`（L391）、`bqBusy`（L2）
- L5 常數：`HP_MAX`、`DR_MAX`、`HAND_MAX`、`HEAL_CAP`、`OT_SECONDS`、`LOG_KEEP`、`LOG_SHOW`
- L6 常數：`BONUS`
- L7 常數：`ACTS`
- L12 常數：`SHORT`
- L13 常數：`TNAME`
- L14 常數：`TICON`
- L15 常數：`ITEMS`
- L26 常數：`IKEYS`
- L27 常數：`SAY`
- L28 常數：`ADV`、`MUTED`
- L391 常數：`SFX`
- L411 常數：`CUP_SVG`

## 函式索引（game.js，行號為宣告位置）

`shuffle` L32、`pick` L33、`fresh` L34、`log` L41、`forget` L47、`wipeInfo` L50、`reshuffle` L51、`rotateTable` L52、`deal` L53、`putKnown` L62、`drunkMid` L63、`targetOk` L65、`canUse` L71、`takeItem` L81、`useItem` L82、`removeCup` L131、`hurt` L136、`heal` L137、`drinkEffect` L142、`resolveFaints` L159、`selfDrink` L168、`toast` L175、`claim` L182、`respond` L189、`beginTurn` L216、`finish` L221、`pay` L227、`endAct` L232、`checkEnd` L242、`endGame` L248、`aiEstimate` L261、`aiView` L268、`aiPickUnknown` L281、`aiPlan` L282、`aiHas` L305、`aiUse` L306、`aiItemStep` L307、`aiRespond` L328、`aiStep` L344、`tick` L359、`ac` L371、`tone` L377、`noise` L384、`setCls` L406、`restart` L407、`say` L413、`put` L415、`putAttr` L416、`hearts` L417、`mmss` L418、`kLabel` L419、`renderCups` L423、`renderHand` L440、`renderDealerHand` L452、`renderLog` L459、`renderNotes` L464、`renderChips` L471、`floatNum` L480、`playFx` L483、`render` L499、`pickCup` L536、`playerItem` L540、`playerAct` L547、`playerRespond` L555、`start` L556、`quit` L564、`loop` L584

## 錢包與結算接點

**扣款（開始一局）**
- L560 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L228 `pay`：`S.balance+=n;`

**餘額檢查**
- L559 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L229 `pay`：`if(analytics)AN.progress(analytics,{stage:E.act,step:E.act,score:E.hp.p,bonus_points:n,total_bonus_points:E.e…`
- L254 `endGame`：`AN.end(analytics,E.earned,res,{score:E.hp.p,step:E.act,stage:E.act});`
- L560 `start`：`analytics=AN.start('banquet',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-banquet-adv`（寫、讀）
- `deep-sea-banquet-best`（寫、讀）
- `deep-sea-banquet-mute`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`bqBusy` 所在 IIFE（`games/banquet/game.js`，純 DOM、無畫布）。單人回合制心理博弈：和莊家 AI 輪流面對桌上的酒杯，生命各 5 點，先歸零者輸。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始」時一次扣除並呼叫 `AN.start('banquet')`；餘額不足顯示 `LOW_MSG`；進行中重複點擊不會再扣。
- 流程：第一幕 4 杯、第二幕 6 杯、第三幕 8 杯，杯子喝完進下一幕（酒醉 −1，手牌保留）；第三幕結束生命相同進 180 秒延長賽（5 杯：3 毒 2 真言水），時間到比生命，仍相同為平手。延長賽時間由 `tick(dt)` 推進，分頁隱藏時暫停。
- BONUS（固定點數，不依入場費計算）：撐過第一／二／三幕 +1／+2／+3，贏下整場 +2，每項每局只發一次、當場入帳，一局最多 8 點（小於入場費）。輸、平手或放棄不扣回已入帳點數。
- 酒杯與酒醉：劇毒 −1、雙倍劇毒 −2、瓊漿 +1（每方每幕回血最多 2 次，仍給再行動）、毒瓊漿（喝的人回血、對方 −1）、真言水（公開手牌，無手牌則隨機公開桌上一杯）。每喝一杯酒醉 +1；酒醉 3–4 時劇毒多 −1、針與氣味結果可能說謊；酒醉滿 5 醉倒：歸零、+1 生命、跳過下一次行動、杯子重新洗牌且雙方資訊清空。
- 基礎版／進階模式：預設（基礎版）只有自己喝、直接敬酒與道具，不出現銀蓋按鈕，莊家也不吹牛；右側「進階模式」開關（`deep-sea-banquet-adv`，只能在局外切換）打開後才有銀蓋話術。規則引擎的 `claim`／`respond` 一直保留，只是介面與 AI 依開關決定是否使用。
- 銀蓋話術（僅進階模式）：宣稱「這杯是瓊漿」，對方選相信或質疑；規則見 `claim`／`respond`，被相信的謊言由相信者承受並讓說謊者酒醉 +1，被質疑的謊言由說謊者自己喝並多 +1 酒醉、輪到質疑者，被質疑的實話由質疑者無回血喝下並隨機丟一張手牌、輪回宣稱者。被下令（敕令）的一方不能敬酒、不能用銀蓋、不能碰杯。
- 道具 10 種（針、氣味、換杯、碰杯、旋轉、酒中酒、醒酒藥、冰塊、粉末、敕令）：手牌上限 4；同名道具每回合只能用一次（再行動不重置）；需要選杯的道具沒選杯時不消耗；粉末只對劇毒／瓊漿、冰塊只對雙倍毒／毒／毒瓊漿、換杯只對毒／瓊漿／真言水，不符合時拒絕且不消耗。
- 莊家 AI：只用公開資訊、自己查到的杯子和玩家已公開的手牌，不讀桌上隱藏杯種；質疑率限制在約 30–80%。測試以「換掉隱藏杯種但公開資訊相同，決策必須相同」驗證。
- 演出（只影響畫面，不改規則）：暗色顆粒＋掃描線＋燈光閃爍；喝下每杯酒會彈出揭曉卡、受傷震動與紅閃、回血綠閃與飄字、醉倒翻桌旋轉；揭曉期間（約 0.9 秒，最多 1.8 秒）雙方都不能行動，莊家也會等它播完。音效全部用 WebAudio 即時合成，沒有音檔，可用「音效」開關靜音（`deep-sea-banquet-mute`）；生命剩 1 時有心跳聲。系統開啟「減少動態效果」時動畫停用。
- 儲存與重設：贏局次數存 `deep-sea-banquet-best`（只顯示、不換點數）。重設 500 點在本局進行中（`bqBusy`）會被擋下；餘額快照計入已扣入場費。放棄需按兩次確認。
- 英文：所有介面與紀錄字串都有 `locales/en.json` 條目（動態字串用片段加空白組合）；`js/i18n.js` 的 `names` 清單加入 `The Last Banquet`；`tools/i18n_browser_games.js` 登錄 `banquet:'bq-go'`。
- 測試：`node tools/test_banquet.mjs`（單次扣款、各項 BONUS 只發一次、10 種道具規則、銀蓋各結果、醉倒跳過、延長賽、AI 不洩漏隱藏資訊、3000 局 AI 對隨機玩家的不變量模擬）。
- 平衡（目前僅機器人模擬，沒有真人數據）：規格中未明說的規則採上述假設，需真人試玩再調整。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/banquet/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
