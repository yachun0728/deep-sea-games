# 最後的晚餐 The Last Banquet（banquet）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#banquet`　分類：益智策略　狀態：顯示中
- 大廳卡片：「與莊家在暗室輪流喝未知的酒，用記憶、機率和道具撐到最後。」｜立即開玩 · 心理博弈
- 追蹤名稱（GA4 `game_name`）：最後的晚餐，`game_id` 為 `banquet`
- 檔案：`games/banquet/card.html`、`games/banquet/game.js`、`games/banquet/i18n.js`、`games/banquet/icon.svg`、`games/banquet/style.css`、`games/banquet/view.html`；`game.js` 共 730 行、48.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「41. 最後的晚餐 The Last Banquet（banquet）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-banquet`、`bq-stage`、`bq-scene`、`bq-act`、`bq-center`、`bq-center-1`、`bq-center-2`、`bq-dealerbox`、`bq-side-d`、`bq-hp-d`、`bq-hp-d-t`、`bq-dr-d`、`bq-items-d`、`bq-dhand-t`、`bq-dhand`、`bq-table`、`bq-reveal`、`bq-hands`、`bq-chips`、`bq-comp`、`bq-menu`、`bq-menu-main`、`bq-m-start`、`bq-m-rules`、`bq-m-codex`、`bq-m-adv`、`bq-m-mute`、`bq-menu-rules`、`bq-m-back`、`bq-menu-codex`、`bq-cx-grid`、`bq-cx-card`、`bq-m-back2`、`bq-menu-intro`、`bq-intro-t`、`bq-intro-skip`、`bq-intro-next`、`bq-itemfx`、`bq-bubble`、`bq-bubble-t`、`bq-lang`、`bq-ticker`、`bq-side-p`、`bq-hp-p`、`bq-hp-p-t`、`bq-dr-p`、`bq-items-p`、`bq-prompt`、`bq-prompt-t`、`bq-believe`、`bq-doubt`、`bq-actions`、`bq-turn`、`bq-act-row`、`bq-self`、`bq-toast`、`bq-silver`、`bq-notes`、`bq-hand-box`、`bq-hand`、`bq-detail`、`bq-flash`、`bq-stage-t`、`bq-bonus`、`bq-best`、`bq-amount`、`bq-go`、`bq-quit`、`bq-home`、`bq-adv`、`bq-mute`、`bq-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`SFX`（L401）、`DLG`（L435）、`IFX`（L538）、`bqBusy`（L2）
- L5 常數：`HP_MAX`、`DR_MAX`、`HAND_MAX`、`HEAL_CAP`、`OT_SECONDS`、`LOG_KEEP`
- L6 常數：`BONUS`
- L7 常數：`ACTS`
- L13 常數：`LANGS`、`LANG`
- L26 常數：`TICON`
- L27 常數：`ITEMS`
- L28 常數：`IKEYS`
- L29 常數：`STIMG`
- L33 常數：`ADV`、`MUTED`
- L401 常數：`SFX`
- L431 常數：`CUP_SVG`
- L434 常數：`DPOOL`
- L435 常數：`DLG`
- L444 常數：`SAYST`
- …另有 2 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`tr` L15、`iconImg` L30、`txt` L31、`stIcon` L32、`shuffle` L37、`pick` L38、`fresh` L39、`log` L46、`logm` L47、`logText` L48、`forget` L55、`wipeInfo` L58、`reshuffle` L59、`rotateTable` L60、`deal` L61、`putKnown` L70、`drunkMid` L71、`targetOk` L73、`canUse` L79、`takeItem` L89、`useItem` L90、`useItem0` L91、`removeCup` L140、`hurt` L145、`heal` L146、`drinkEffect` L151、`resolveFaints` L169、`selfDrink` L178、`toast` L185、`claim` L192、`respond` L199、`beginTurn` L226、`finish` L231、`pay` L237、`endAct` L242、`checkEnd` L252、`endGame` L258、`aiEstimate` L271、`aiView` L278、`aiPickUnknown` L291、`aiPlan` L292、`aiHas` L315、`aiUse` L316、`aiItemStep` L317、`aiRespond` L338、`aiStep` L354、`tick` L369、`ac` L381、`tone` L387、`noise` L394、`setCls` L426、`restart` L427、`drand` L436、`dnow` L437、`showBubble` L438、`hideBubble` L440、`hostSay` L441、`showSay` L445、`say` L446、`put` L448、`putAttr` L449、`pips` L450、`hearts` L452、`mmss` L453、`kLabel` L454、`renderCups` L458、`renderHand` L477、`renderDetail` L494、`renderDealerHand` L510、`renderNotes` L517、`renderChips` L524、`setPose` L533、`laterPose` L534、`floatNum` L535、`fxItem` L539、`playFx` L564、`render` L584、`pickCup` L623、`playerItem` L627、`playerAct` L634、`playerRespond` L642、`start` L643、`quit` L651、`loop` L685、`loadFont` L695、`buildCodex` L699、`applyLang` L703、`setLang` L713、`fitStage` L718

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L238 `pay`：`S.balance+=n;`

**餘額檢查**
- L646 `start`：`if(amount>S.balance){say(LOW_MSG,null,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L239 `pay`：`if(analytics)AN.progress(analytics,{stage:E.act,step:E.act,score:E.hp.p,bonus_points:n,total_bonus_points:E.e…`
- L264 `endGame`：`AN.end(analytics,E.earned,res,{score:E.hp.p,step:E.act,stage:E.act});`
- L647 `start`：`analytics=AN.start('banquet',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-banquet-adv`（寫、讀）
- `deep-sea-banquet-best`（寫、讀）
- `deep-sea-banquet-intro`（寫、讀）
- `deep-sea-banquet-lang`（寫、讀）
- `deep-sea-banquet-mute`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

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
- 版面與美術（只影響畫面）：橫向單一畫面（寬螢幕為 16:9、寬度約 960–1240px 依視窗高度縮放，下方只有一條細控制列；手機直式則場景在上、操作在下）；配色為深綠＋金（桌布、背景、外框、按鈕），酒杯保持紅色以形成對比，另有蠟燭閃爍、暗角與飄浮微塵的純 CSS 氛圍動態（遵守「減少動態」設定）。第一人稱視角，莊家坐在桌子對面，橢圓桌面在中間（酒杯依遠近縮放），你的雙手在畫面下方；全部操作疊在場景上：左上莊家資訊（含莊家道具格）、左下你的狀態與道具欄、右上關卡／回合文字與酒種清單、右下行動按鈕（或質疑／相信）、上方中間一行最新事件；沒有事件紀錄清單。場景外圍有雕花金框，按鈕、下方控制列與分隔線用深綠金邊圖（`ui-btn`／`ui-panel`／`ui-div`／`ui-frame`，webp，以 CSS border-image 九宮格切片）。莊家有六種表情圖（待機、敬酒伸手、喝酒、被抓到、受傷、勝利），圖檔放在 `games/banquet/assets/`（webp、去背；酒杯另有 `cup-normal`／`cup-selected`；另有 `bg`、`table`、`cover`、`cup-empty` 與 10 個 `item-*`、8 個 `st-*` 圖示）：莊家喝自己的酒＝喝酒、被你敬酒＝被抓到、他敬你＝伸手、他受傷＝受傷（喝酒後約 0.65 秒切換）、你受傷或醉倒＝勝利，整局結束固定顯示你贏＝受傷、莊家贏＝勝利。
- 開始畫面與全螢幕：進入遊戲先看到標題選單（開始晚宴、玩法說明、進階模式開關、音效開關，語言選單仍在右上角），按開始才發牌。舞台內部固定以 1000×562 排版，再依視窗大小整體縮放（`game.js` 的 `fitStage`），所以全螢幕時是固定一個畫面、不捲動、等比置中，不會被拉伸。大廳圖示為深綠金框、紅酒杯加兩支蠟燭的新圖。開始畫面是首頁（開始晚宴、玩法、道具圖鑑、進階模式、音效；遊戲中控制列的「Home」可回到首頁）。「玩法」頁用五個圖示步驟加四種酒說明，「道具圖鑑」列出全部 10 個道具，點圖示看名稱與用途（文字沿用道具說明，六語系）。全螢幕縮放加了遲滯（變動小於 24px 不重算），避免捲軸出現／消失造成畫面抖動。畫面刻意減字：血量與醉酒用愛心／酒醉圖示（醉酒為 0 時不顯示）、酒種提示只剩圖示加數字（滑過才顯示名稱）、道具欄只有圖示（名稱與用途點開才看）、不顯示提示句與「剩幾杯」。
- 道具欄：你的道具以圖示格排在場景左下，只顯示圖示與名稱；點一下展開說明卡（名稱、用途、「使用」「關閉」），按「使用」才會真的使用（需要選杯的道具沒選杯不會消耗）。莊家的道具在莊家資訊框內，未公開時是「?」，公開後翻成圖示。
- 演出（只影響畫面，不改規則）：暗色顆粒＋掃描線＋燈光閃爍；喝下每杯酒會彈出揭曉卡、受傷震動與紅閃、回血綠閃與飄字、醉倒翻桌旋轉；揭曉期間（約 0.9 秒，最多 1.8 秒）雙方都不能行動，莊家也會等它播完。音效全部用 WebAudio 即時合成，沒有音檔，可用「音效」開關靜音（`deep-sea-banquet-mute`）；生命剩 1 時有心跳聲。系統開啟「減少動態效果」時動畫停用。
- 儲存與重設：贏局次數存 `deep-sea-banquet-best`（只顯示、不換點數）。重設 500 點在本局進行中（`bqBusy`）會被擋下；餘額快照計入已扣入場費。放棄需按兩次確認。
- 多語系（只在遊戲內，不經過全站 `js/i18n.js`）：預設英文，場景右上角下拉選單可切換 English／Español／Deutsch／日本語／한국어／中文（存 `deep-sea-banquet-lang`）。遊戲區塊標 `data-i18n-ignore`，全站翻譯器不會碰它。所有字串集中在 `tools/banquet_i18n.py`（單一來源），執行 `python3 tools/banquet_i18n.py` 產生 `games/banquet/i18n.js`（ASCII 跳脫、不含 CJK 字面量，並由 `js/runtime.js` 在 `game.js` 前載入）；`--check` 會檢查檔案是否過期。事件紀錄在記憶體內存「鍵＋參數」，切換語言時最新一行事件也會跟著換。字體：英／西／德用 Cinzel＋Cormorant Garamond，日／韓／中各用 Noto Serif JP／KR／TC（切換時才載入）。
- 測試：`node tools/test_banquet.mjs`（六語系完整性與切換不改紀錄、單次扣款、各項 BONUS 只發一次、10 種道具規則、銀蓋各結果、醉倒跳過、延長賽、AI 不洩漏隱藏資訊、3000 局 AI 對隨機玩家的不變量模擬）。
- 平衡（目前僅機器人模擬，沒有真人數據）：規格中未明說的規則採上述假設，需真人試玩再調整。

- 使用道具時有第一視角動畫：道具從道具列（對手則從主持人）飛到桌面中央並顯示名稱，手抬起，再依道具播放特效，約 1 秒，點一下可跳過；播放期間暫停操作與 AI（不改規則數值）。選中的杯子不畫外框，只用發光與放大區分。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/banquet/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
