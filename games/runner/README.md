# 閃避跑酷：深海快遞 Dodge Run（runner）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#runner`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「點左、點右換道，避開一路上的障礙。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：閃避跑酷，`game_id` 為 `runner`
- 檔案：`games/runner/card.html`、`games/runner/cover.webp`、`games/runner/game.js`、`games/runner/icon.svg`、`games/runner/leaderboard.webp`、`games/runner/style.css`、`games/runner/view.html`；`game.js` 共 334 行、15.0 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「13. Dodge Run（runner）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-runner`、`rn-canvas`、`rn-distance`、`rn-best`、`rn-next`、`rn-speed`、`rn-go`、`rn-msg`、`rn-rank-status`、`rn-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L7 常數：`MILESTONES`、`ENDLESS_FROM`、`ENDLESS_STEP`、`ENDLESS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`bonusAt` L8、`nextMilestone` L9、`prevMilestone` L10、`T` L12、`runStatus` L17、`perspective` L22、`note` L23、`remember` L24、`runnerUI` L25、`award` L31、`beginRun` L37、`start` L44、`sendRun` L63、`die` L81、`update` L93、`loadArt` L111、`drawSprite` L118、`drawRunner` L126、`draw` L139、`X` L153、`Y` L154、`changeLane` L251、`L` L261、`canSteer` L268、`tapLane` L269、`steerSwipe` L273、`endSwipe` L282、`loop` L310

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L32 `award`：`S.balance+=b;`

**餘額檢查**
- L46 `start`：`if(S.balance<ENTRY_FEE){note(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L33 `award`：`AN.progress(runnerAnalytics,{step:m,distance:m,bonus_points:b});`
- L40 `beginRun`：`runnerAnalytics=AN.start('runner',ENTRY_FEE);`
- L83 `die`：`AN.end(runnerAnalytics,earned,earned>0?'complete':'loss',{distance:Math.floor(run.dist)});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `chayne`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`runnerBusy` 所在 IIFE。無盡跑酷（2026-11-17 改為直到撞上障礙）：往左或往右滑動可換一條跑道，也能點畫面左右半邊或用鍵盤按鍵切換三條跑道；一組兩個障礙留下安全道，安全道不與上一組相同，沒有跳躍／蹲下。沒有關卡與領回；初速 20 m/s，每跑滿 100 公尺增加 0.8 m/s（初速的 4%），最高 60 m/s，每排間距隨距離縮短（換道時間窗由約 2 秒縮至約 0.28 秒，見 `shared/runner-rules.cjs`）。免費開始。 每跑滿 1 公里的位置有黃色虛線標記。

里程碑點數當場入帳（`award`，每局每個里程碑只一次），撞上後不扣回、不另結算：3,500m +3、4,500m +7（累計10點）、5,500m +15、6,500m +30，之後每多1,000m +40。里程碑以文字模擬（技巧不同的四種玩家）校準：一般玩家約跑3,000m，抵達3,500m約三成，4,500m不到1%；技巧好的玩家抵達4,500m約七成。尚無真人資料，上線後可用 GA4 `game_end` 的分數重新校準。大廳卡片只標示「✦ BONUS」。

訪客榜按碰撞結束時的整數距離排名。Worker 依障礙種子和換道時間重播，確認碰撞與距離後才寫入公開榜。排行榜最多驗證十分鐘的遊戲時間。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/runner/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
