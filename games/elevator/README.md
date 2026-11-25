# 插隊大師 Queue Cutter（elevator）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#elevator`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「趁乘客背對你，偷偷往前插一位。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：插隊大師，`game_id` 為 `elevator`
- 檔案：`games/elevator/card.html`、`games/elevator/cover.webp`、`games/elevator/game.js`、`games/elevator/icon.svg`、`games/elevator/queue-cutter-leaderboard.webp`、`games/elevator/view.html`；`game.js` 共 129 行、11.3 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「14. Queue Cutter（elevator）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-elevator`、`eq-canvas`、`eq-progress`、`eq-remaining`、`eq-stage`、`eq-total`、`eq-best`、`eq-next`、`eq-watch`、`eq-amount`、`eq-go`、`eq-msg`、`eq-rank-status`、`eq-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`EQ`（L2）
- L5 常數：`EQ_MILESTONES`、`EQ_ENDLESS_FROM`、`EQ_ENDLESS_STEP`、`EQ_ENDLESS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`eqBonusAt` L6、`eqNext` L7、`eqCount` L11、`eqTotal` L12、`eqRound` L13、`eqSay` L14、`eqRemember` L15、`eqUI` L16、`eqLose` L28、`eqAward` L29、`eqEvent` L30、`eqSync` L43、`eqAction` L44、`eqPerson` L64、`eqDraw` L83、`spot` L85、`eqLoop` L126

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L29 `eqAward`：`S.balance+=b;`

**餘額檢查**
- L50 `eqAction`：`if(stake>S.balance){eqSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L13 `eqRound`：`AN.resume(EQ.analytics,{stage:EQ.stage,step:0});`
- L28 `eqLose`：`AN.end(EQ.analytics,EQ.earned,EQ.earned>0?'complete':'loss',{stage:EQ.stage,step:EQ.passed});`
- L29 `eqAward`：`AN.progress(EQ.analytics,{stage:EQ.stage,step:n,bonus_points:b});`
- L38 `eqEvent`：`AN.progress(EQ.analytics,{stage:EQ.stage,step:EQ.passed},EQ.passed===eqCount());`
- L52 `eqAction`：`EQ.analytics=AN.start('elevator',stake);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-queue-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`EQ`。無盡排隊（2026-11-17 改為直到被抓）：第n隊有 `min(30, 10+2(n-1))` 人，插到隊首後立刻換下一隊，沒有領回按鈕。點一下往前插一位，移動期間（`.4+已過人數×.012` 秒）若前面仍有人處於轉頭狀態即被抓，靜止等待不被抓。警示本身不抓人，之後可能轉頭；警示後轉頭機率 `min(.95, .7+.02(n-1))`；乘客休息時間乘以 `max(.3, 1-.1(n-1))`（最短0.8秒）。

里程碑以累計插過人數計，點數當場入帳、不扣回：40人 +3、55人 +7（累計10點，回本）、70人 +15、90人 +30，之後每多20人 +40。以乘客狀態機模擬校準（結果對操作熟練度不敏感，運氣成分較大：平均玩家約25人，抵達40人約兩成多，抵達60人約5%）。大廳卡片只標示「✦ BONUS」。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/elevator/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
