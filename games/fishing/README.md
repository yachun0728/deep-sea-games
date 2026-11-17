# 深海釣手 Fishing（fishing）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#fishing`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「按住收線、放開卸力，把大魚拉上岸。」｜每局 10 點 · 每條可收手
- 追蹤名稱（GA4 `game_name`）：深海釣手，`game_id` 為 `fishing`
- 檔案：`games/fishing/card.html`、`games/fishing/game.js`、`games/fishing/icon.svg`、`games/fishing/view.html`；`game.js` 共 116 行、12.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「16. Fishing（fishing）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-fishing`、`fi-canvas`、`fi-number`、`fi-distance`、`fi-best`、`fi-name`、`fi-signal`、`fi-tension-label`、`fi-tension-value`、`fi-tension`、`fi-tension-fill`、`fi-slack`、`fi-amount`、`fi-go`、`fi-hold`、`fi-cash`、`fi-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`FI`（L2）
- L3 常數：`FI_MULT`
- L4 常數：`FI_NAMES`

## 函式索引（game.js，行號為宣告位置）

`fiText` L7、`fiSay` L8、`fiRand` L9、`fiPay` L10、`fiRelease` L11、`fiRemember` L12、`fiUI` L13、`fiRound` L30、`fiStart` L34、`fiLose` L41、`fiCash` L42、`fiLand` L47、`fiNextMode` L53、`fiStep` L59、`fiSync` L76、`fiDraw` L77、`fiPress` L103、`fiLift` L104、`fiLoop` L112

## 錢包與結算接點

**扣款（開始一局）**
- L39 `fiStart`：`S.balance-=stake;`

**入帳（領回／獎勵）**
- L44 `fiCash`：`S.balance+=pay;`

**餘額檢查**
- L38 `fiStart`：`if(stake>S.balance){fiSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L31 `fiRound`：`AN.resume(FI.analytics,{stage:FI.number});`
- L39 `fiStart`：`FI.analytics=AN.start('fishing',stake);`
- L41 `fiLose`：`AN.end(FI.analytics,0,'loss',{stage:FI.number,landed_fish:FI.landed});`
- L44 `fiCash`：`AN.end(FI.analytics,pay,'cashout',{stage:FI.number,landed_fish:FI.landed,multiplier:FI_MULT[FI.landed]});`
- L49 `fiLand`：`AN.progress(FI.analytics,{stage:FI.number,landed_fish:FI.landed,multiplier:FI_MULT[FI.landed]},true);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-fishing-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`fiSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`FI`

## 規則摘要（取自 GAME_RULES.md）

定位：`FI`、`fiStep`、`fiLand`。最多10條魚；按住收線、放開卸力，觀察平靜／警示／掙扎／疲累狀態，掙扎時硬拉可能拉遠。初始張力45，第n條距離18+2n公尺；張力>=100斷線，張力<=8持續1.2秒魚逃脫，皆整局0。只有真正釣上魚才提高倍率；每條上岸後可領回或繼續，不按撐住秒數增加獎勵，第10條自動領回。

第1～10條倍率 `[.6,1.1,1.7,2.5,3.6,5,6.8,9.2,12.5,17]`。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/fishing/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
