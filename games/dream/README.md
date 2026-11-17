# 時序修復 Dream Repair Shop（dream）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#dream`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「抓準時機，讓指針停在青綠色區域。」｜每局 10 點 · 無限關卡
- 追蹤名稱（GA4 `game_name`）：時序修復，`game_id` 為 `dream`
- 檔案：`games/dream/card.html`、`games/dream/game.js`、`games/dream/icon.svg`、`games/dream/view.html`；`game.js` 共 79 行、6.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「12. Dream Repair Shop（dream）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-dream`、`dr-canvas`、`dr-stage`、`dr-amount`、`dr-go`、`dr-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`DR`（L2）、`runnerBusy`（L4）
- L6 常數：`DR_MIN_WIDTH`、`DR_MAX_SPEED`、`DR_WARNING`、`DR_GUARD`

## 函式索引（game.js，行號為宣告位置）

`drSay` L5、`drDistance` L7、`drDifficulty` L8、`drUI` L13、`drDraw` L20、`drRound` L32、`drPlaying` L40、`drAdvance` L41、`drAction` L56、`drLoop` L76

## 錢包與結算接點

**扣款（開始一局）**
- L68 `drAction`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L67 `drAction`：`if(amount>S.balance){drSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L33 `drRound`：`AN.resume(DR.analytics,{stage:DR.stage});`
- L61 `drAction`：`AN.progress(DR.analytics,{stage:DR.stage,score:DR.wins,reversals:DR.reversals},true);`
- L62 `drAction`：`AN.end(DR.analytics,0,'loss',{stage:DR.stage,score:DR.wins});`
- L68 `drAction`：`DR.analytics=AN.start('dream',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`drSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`DR`、`runnerBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`DR`。無限關卡轉針時機遊戲，每局固定10點、續關不再扣點，沒有下注、倍率、領回或點數獎勵。指針與目標的圓周角距離 <= 目標寬度一半即過關，失誤結束；關卡與完成數是成績，不是錢包點數。

難度進度 n=s-1-min(3,max(0,s-11))-min(3,max(0,s-21))，引入反轉時暫緩加難。寬度為 max(24,80-min(n,4)×5-max(0,min(n-4,10))×2.5-max(0,n-14)) 度；速度 min(2.4,1.6+n×.035) 弧度／秒，最窄最快時通過目標約0.175秒。第1～10關不反轉，11～20關最多一次，21關起最多兩次；首次提示在遊玩1.5～2.5秒後嘗試觸發，反轉後至少1.5秒才可再次提示。中心燈閃爍和文字預告至少0.5秒，提示開始時須離目標超過「半寬+速度×0.75秒」，反轉時須超過「半寬+速度×0.25秒」；不安全即延後，反轉不加速。達標可先停針，不必等反轉，故實際反轉可能少於上限。

每局一次start，過關progress暫停計時，下一關resume，失敗end且payout_points=0；離頁依共用abandoned流程。切遊戲／背景／失焦暫停指針與預告，回來不補跑背景時間。重新整理放棄本局，入場費不退；不新增儲存鍵。hot.snapshot不把入場費當本金加回。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/dream/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
