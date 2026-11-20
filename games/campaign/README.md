# 宣傳車 Campaign Truck（campaign）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#campaign`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「繞市區拉票，經過學校、醫院、豪宅要按住靜音。」｜立即開玩 · 無盡 · 越開越快
- 追蹤名稱（GA4 `game_name`）：宣傳車，`game_id` 為 `campaign`
- 檔案：`games/campaign/card.html`、`games/campaign/cover.webp`、`games/campaign/game.js`、`games/campaign/icon.svg`、`games/campaign/style.css`、`games/campaign/view.html`；`game.js` 共 397 行、33.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「17. Campaign（campaign）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-campaign`、`cp-stage`、`cp-canvas`、`cp-exit`、`cp-votes`、`cp-miss`、`cp-lap`、`cp-signal`、`cp-amount`、`cp-best`、`cp-next`、`cp-go`、`cp-hold`、`cp-msg`、`cp-rank-status`、`cp-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`CP`（L2）
- L3 常數：`CP_START`、`CP_GAIN`、`CP_QUIET`、`CP_PENALTY`、`CP_MAX_MISS`、`CP_NOISE_LIMIT`、`CP_NEGLECT`
- L5 常數：`CP_V0`、`CP_VK`、`CP_VMAX`、`CP_TRUCK`、`CP_GAP`、`CP_LEAD`、`CP_GROUND`、`CP_PQ0`、`CP_PQK`、`CP_PQMAX`
- L7 常數：`CP_MILESTONES`、`CP_ENDLESS_FROM`、`CP_ENDLESS_STEP`、`CP_ENDLESS_BONUS`
- L9 常數：`CP_KINDS`
- L10 常數：`CP_FONT`
- L84 常數：`CP_PAL`

## 函式索引（game.js，行號為宣告位置）

`cpNextMilestone` L8、`cpText` L13、`cpSay` L14、`cpHold` L16、`cpRelease` L17、`cpSpeed` L18、`cpPassed` L19、`cpFloat` L20、`cpRemember` L21、`cpLose` L22、`cpMilestones` L27、`cpSignal` L37、`cpUI` L45、`cpStart` L55、`cpFit` L72、`cpSync` L80、`cpRR` L83、`cpC` L85、`cpBox` L86、`cpWindows` L87、`cpBuilding` L88、`cpTruck` L168、`cpMuteIcon` L200、`cpMobileVehicle` L215、`cpMobileHud` L235、`cpMobileText` L294、`cpDraw` L302、`cpPress` L384、`cpLift` L385、`cpLoop` L393

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L30 `cpMilestones`：`S.balance+=b;`

**餘額檢查**
- L58 `cpStart`：`if(stake>S.balance){cpSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L23 `cpLose`：`AN.end(CP.analytics,CP.earned,CP.earned>0?'complete':'loss',{step:cpPassed(),votes:CP.votes,misses:CP.miss});`
- L31 `cpMilestones`：`AN.progress(CP.analytics,{step:cpPassed(),votes:CP.votes,misses:CP.miss,bonus_points:b});`
- L60 `cpStart`：`CP.analytics=AN.start('campaign',stake);`
- L64 `cpStart`：`else if(event==='progress')AN.progress(CP.analytics,{step:cpPassed(),votes:CP.votes,misses:CP.miss});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-campaign-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`CP`、`cpMake`、`cpSettle`、`cpMilestones`、`cpLose`。無盡街道（2026-11-17 改為直到落選，並大幅加快加難）：建築依序即時生成，前兩棟普通，不連續出現3棟安靜區；第n棟為安靜區機率 `min(.6, .35+.004n)`。車速 `min(800, 300+0.06×已行距離)` px/s（舊版150→380）。放開廣播，按住靜音；起始200票。普通建築依廣播比例獲得 round(200×比例/10)×10票，但廣播比例<.3（靜音太久）算「沒宣傳到」記一次失誤；安靜區廣播比例>.3算吵到並記一次失誤、扣400票（最低0），否則加100票。累計5次失誤落選。

里程碑以得票計，點數當場入帳、每個里程碑每局只入帳一次（票數被扣再回升不重複）：8,000票 +3、10,000票 +7（累計10點，回本）、12,000票 +15、15,000票 +30，之後每多3,000票 +40。以靜音時機模擬校準（四種操作誤差）：平均玩家中位約5,600票，抵達8,000票約6%；技巧好者約六成。大廳卡片只標示「✦ BONUS」。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/campaign/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
