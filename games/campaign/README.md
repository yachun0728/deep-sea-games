# 宣傳車 Campaign Truck（campaign）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#campaign`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「繞市區拉票，經過學校、醫院、豪宅要按住靜音。」｜每局 10 點 · 越開越快
- 追蹤名稱（GA4 `game_name`）：宣傳車，`game_id` 為 `campaign`
- 檔案：`games/campaign/card.html`、`games/campaign/game.js`、`games/campaign/icon.svg`、`games/campaign/view.html`；`game.js` 共 248 行、23.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「17. Campaign（campaign）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-campaign`、`cp-canvas`、`cp-votes`、`cp-miss`、`cp-lap`、`cp-signal`、`cp-amount`、`cp-best`、`cp-go`、`cp-hold`、`cp-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`CP`（L2）
- L3 常數：`CP_COUNT`、`CP_QUIET_COUNT`、`CP_START`、`CP_GAIN`、`CP_QUIET`、`CP_PENALTY`、`CP_MAX_MISS`、`CP_NOISE_LIMIT`
- L4 常數：`CP_V0`、`CP_V1`、`CP_TRUCK`、`CP_GAP`、`CP_LEAD`、`CP_GROUND`
- L5 常數：`CP_TIERS`
- L6 常數：`CP_KINDS`
- L7 常數：`CP_FONT`

## 函式索引（game.js，行號為宣告位置）

`cpText` L10、`cpSay` L11、`cpMult` L12、`cpRelease` L13、`cpSpeed` L14、`cpCity` L16、`cpFloat` L28、`cpRemember` L29、`cpLose` L30、`cpFinish` L35、`cpSettle` L43、`cpStep` L54、`cpSignal` L68、`cpUI` L76、`cpStart` L88、`cpSync` L96、`cpRR` L99、`cpBox` L100、`cpWindows` L101、`cpBuilding` L102、`cpTruck` L167、`cpDraw` L179、`cpPress` L235、`cpLift` L236、`cpLoop` L244

## 錢包與結算接點

**扣款（開始一局）**
- L92 `cpStart`：`S.balance-=stake;`

**入帳（領回／獎勵）**
- L38 `cpFinish`：`S.balance+=pay;`

**餘額檢查**
- L91 `cpStart`：`if(stake>S.balance){cpSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L31 `cpLose`：`AN.end(CP.analytics,0,'loss',{step:CP.idx,votes:CP.votes,misses:CP.miss});`
- L37 `cpFinish`：`AN.end(CP.analytics,pay,pay>0?'complete':'loss',{step:CP_COUNT,votes:CP.votes,misses:CP.miss,multiplier:mult}…`
- L62 `cpStep`：`if(CP.idx%15===0&&CP.idx<CP_COUNT)AN.progress(CP.analytics,{step:CP.idx,votes:CP.votes,misses:CP.miss});`
- L92 `cpStart`：`CP.analytics=AN.start('campaign',stake);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-campaign-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`CP`、`cpMult`、`cpSettle`、`cpFinish`、`cpLose`。跑過60棟建築，其中22棟安靜區；前兩棟普通，不連續出現3棟安靜區。放開廣播，按住靜音；起始200票。普通建築依廣播比例獲得 round(200×比例/10)×10票；安靜區廣播比例>.3算吵到一次並扣400票（最低0），否則加100票。吵到5次立即失敗，返還0；否則整段跑完依最終票數一次結算，途中不能領回。

票數 `<5000:0`、`>=5000:.5`、`>=6000:1`、`>=7000:1.5`、`>=8000:2.2`、`>=9000:3.2`、`>=9700:5` 倍。理想滿票為10,000，不直接等於錢包點數。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/campaign/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
