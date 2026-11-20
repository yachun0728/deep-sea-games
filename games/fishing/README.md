# 深海釣手 Fishing（fishing）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#fishing`　分類：時機操作　狀態：顯示中
- 大廳卡片：「按住收線、放開卸力，把大魚拉上岸。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：深海釣手，`game_id` 為 `fishing`
- 檔案：`games/fishing/card.html`、`games/fishing/cover.webp`、`games/fishing/game.js`、`games/fishing/icon.svg`、`games/fishing/view.html`；`game.js` 共 99 行、11.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「16. Fishing（fishing）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-fishing`、`fi-canvas`、`fi-number`、`fi-distance`、`fi-best`、`fi-next`、`fi-name`、`fi-signal`、`fi-tension-label`、`fi-tension-value`、`fi-tension`、`fi-tension-fill`、`fi-slack`、`fi-amount`、`fi-go`、`fi-hold`、`fi-msg`、`fi-rank-status`、`fi-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`FI`（L2）
- L4 常數：`FI_MILESTONES`、`FI_ENDLESS_FROM`、`FI_ENDLESS_STEP`、`FI_ENDLESS_BONUS`
- L8 常數：`FI_NAMES`

## 函式索引（game.js，行號為宣告位置）

`fiBonusAt` L5、`fiNextMilestone` L6、`fiFishName` L7、`fiText` L11、`fiSay` L12、`fiHold` L14、`fiRelease` L15、`fiRemember` L16、`fiUI` L17、`fiRound` L32、`fiStart` L36、`fiLose` L51、`fiAward` L52、`fiLand` L53、`fiSync` L59、`fiDraw` L60、`fiPress` L86、`fiLift` L87、`fiLoop` L95

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L52 `fiAward`：`S.balance+=b;`

**餘額檢查**
- L39 `fiStart`：`if(stake>S.balance){fiSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L33 `fiRound`：`AN.resume(FI.analytics,{stage:FI.number});`
- L41 `fiStart`：`FI.analytics=AN.start('fishing',stake);`
- L51 `fiLose`：`AN.end(FI.analytics,FI.earned,FI.earned>0?'complete':'loss',{stage:FI.number,landed_fish:FI.landed});`
- L52 `fiAward`：`AN.progress(FI.analytics,{stage:n,landed_fish:n,bonus_points:b});`
- L55 `fiLand`：`AN.progress(FI.analytics,{stage:FI.number,landed_fish:FI.landed},true);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-fishing-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`FI`、`fiStep`、`fiLand`。無盡釣魚（2026-11-17 改為直到斷線／脫鉤）：按住收線、放開卸力，觀察平靜／警示／掙扎／疲累狀態，掙扎時硬拉可能拉遠。初始張力45，第n條距離 `18+2×min(n,20)` 公尺，難度參數在第20條後不再增加；張力>=100斷線，張力<=8持續1.2秒魚逃脫，皆結束本局。釣上一條後下一條立刻上鉤，沒有領回。第11條起魚名為「深海魚王 · 第N代」。

里程碑以釣到條數計，點數當場入帳、不扣回：10條 +3、12條 +7（累計10點，回本）、14條 +15、17條 +30，之後每多3條 +40。以收線控制器機器人模擬（反應0.18～0.45秒）：多數在第13～16條失敗；但機器人比真人穩定，此校準偏寬鬆，正式上線後應以 GA4 分數重新檢視。大廳卡片只標示「✦ BONUS」。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/fishing/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
