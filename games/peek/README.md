# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「轉動八音盒發條，躲開盒子裡的東西，燈滅前蓋住螢幕。」｜每局 10 點 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 203 行、16.0 KB

## 畫面元素（view.html 的 id）

`view-peek`、`pk-canvas`、`pk-prog`、`pk-spirits`、`pk-best`、`pk-amount`、`pk-go`、`pk-gyro`、`pk-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L11）、`peekBusy`（L2）
- L5 常數：`WIND_RATE`
- L6 常數：`WIND_MAX_TILT`
- L7 常數：`MILE_EVENTS`、`MILE_REWARD`、`WIN_REWARD`
- L8 常數：`FIRST_GAP`、`GAP_MIN`、`GAP_MAX`
- L9 常數：`DIRECTOR_AT`、`DIRECTOR_P`
- L10 常數：`TILT_SPEED`
- L11 常數：`EYE`
- L12 常數：`TWIN`
- L13 常數：`WALK`
- L14 常數：`TYPES`
- L15 常數：`CAUSES`
- L16 常數：`BTN`
- L184 常數：`KEYMAP`

## 函式索引（game.js，行號為宣告位置）

`rnd` L20、`clamp` L21、`tx` L22、`RR` L23、`reset` L26、`audioInit` L30、`tone` L31、`say` L37、`setText` L39、`ui` L40、`fx` L45、`end` L46、`pay` L58、`startEvent` L62、`survive` L66、`inputs` L69、`update` L72、`lampLevel` L97、`drawBox` L102、`drawBeam` L113、`drawTwins` L117、`drawButtons` L124、`draw` L127、`start` L161、`shown` L169、`region` L170、`syncPtrs` L174、`upPtr` L181、`clearInput` L189、`onOrient` L194、`go` L198、`loop` L200

## 錢包與結算接點

**扣款（開始一局）**
- L166 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L59 `pay`：`S.balance+=n;`

**餘額檢查**
- L164 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L52 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p});`
- L60 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L166 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`peekBusy`

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
