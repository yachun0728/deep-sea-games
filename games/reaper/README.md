# 死神打工 Reaper Shift（reaper）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#reaper`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「普通靈魂要接走，綠色通行證要放行。」｜每局 10 點 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：死神打工，`game_id` 為 `reaper`
- 檔案：`games/reaper/card.html`、`games/reaper/game.js`、`games/reaper/icon.svg`、`games/reaper/view.html`；`game.js` 共 107 行、10.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「21. Reaper Shift（reaper）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-reaper`、`rp-canvas`、`rp-level`、`rp-progress`、`rp-lives`、`rp-score`、`rp-best`、`rp-next`、`rp-difficulty`、`rp-amount`、`rp-go`、`rp-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`RP`（L2）
- L5 常數：`RP_PER`、`RP_VK`、`RP_VMAX`、`RP_ZK`、`RP_ZMIN`、`RP_PPMAX`
- L6 常數：`RP_MILESTONES`、`RP_ENDLESS_FROM`、`RP_ENDLESS_STEP`、`RP_ENDLESS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`rpBonusAt` L7、`rpNext` L8、`rpLevel` L9、`rpRand` L12、`rpSay` L13、`rpRemember` L14、`rpParams` L15、`rpUI` L16、`rpStart` L24、`rpAward` L32、`rpGood` L38、`rpStrike` L39、`rpSpawn` L47、`rpStep` L52、`rpSync` L65、`rpAct` L66、`rpGhost` L74、`rpDraw` L78、`rpLoop` L104

## 錢包與結算接點

**扣款（開始一局）**
- L29 `rpStart`：`S.balance-=stake;`

**入帳（領回／獎勵）**
- L33 `rpAward`：`S.balance+=b;`

**餘額檢查**
- L27 `rpStart`：`if(stake>S.balance){rpSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L29 `rpStart`：`RP.analytics=AN.start('reaper',stake);`
- L34 `rpAward`：`AN.progress(RP.analytics,{step:n,score:RP.total,lives:RP.lives,bonus_points:b});`
- L42 `rpStrike`：`AN.end(RP.analytics,RP.earned,RP.earned>0?'complete':'loss',{step:RP.good,score:RP.total});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `reaper`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`rpSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`RP`

## 規則摘要（取自 GAME_RULES.md）

定位：`RP`、`rpGood`、`rpAward`、`rpRemember`。無盡值班（2026-11-17 改為直到生命歸零）：每正確處理10位靈魂升一班，沒有班別上限與領回。正常靈魂進入金色區時點擊收割；綠色光環者應放行。漏掉正常靈魂或誤收綠色者扣一心；空揮冷卻.35秒，不扣心。開始3心，不回滿。班次 L=1+floor(正確處理數/10)：速度 `min(300, 110+12L)`、金色區半寬 `max(15, 29-0.9(L-1))`、持證機率 `min(.5, .18+.012L)`，間隔 `max(.5, rand(1.1,1.7)-.065(L-1))` 秒。前3班綠光明顯，4～6班接近時消退，7班起更早消退。

里程碑以正確處理數計，點數當場入帳、不扣回：120位 +3、150位 +7（累計10點，回本）、200位 +15、260位 +30，之後每多50位 +40。以揮鐮誤差模擬校準：休閒約72位、一般約104位、不錯約143位、高手約218位（中位數）；一般玩家到120位約兩成。最佳紀錄是接走的正常靈魂總數，不是最高餘額。大廳卡片只標示「✦ BONUS」。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/reaper/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
