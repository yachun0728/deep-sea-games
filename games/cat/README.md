# 屋頂貓貓 Rooftop Cat（cat）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#cat`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「無盡跑酷，看你能跑多遠。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：屋頂貓貓，`game_id` 為 `cat`
- 檔案：`games/cat/card.html`、`games/cat/game.js`、`games/cat/icon.svg`、`games/cat/view.html`；`game.js` 共 125 行、8.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「19. Rooftop Cat（cat）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-cat`、`ct-canvas`、`ct-score`、`ct-best`、`ct-next`、`ct-amount`、`ct-go`、`ct-msg`、`ct-rank-status`、`ct-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`catBusy`（L2）
- L7 常數：`MILESTONES`、`ENDLESS_FROM`、`ENDLESS_STEP`、`ENDLESS_BONUS`、`LADDER`

## 函式索引（game.js，行號為宣告位置）

`bonusAt` L8、`nextMilestone` L9、`O` L12、`C` L13、`F` L14、`tx` L15、`score` L18、`say` L19、`setText` L21、`award` L22、`ui` L28、`die` L35、`update` L45、`drawCat` L54、`leg` L56、`draw` L68、`start` L92、`down` L103、`release` L107、`loop` L117

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L23 `award`：`S.balance+=b;`

**餘額檢查**
- L95 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L24 `award`：`AN.progress(analytics,{step:m,score:m,bonus_points:b});`
- L39 `die`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:s});`
- L98 `start`：`analytics=AN.start('cat',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-cat-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`catBusy` 所在 IIFE。無盡跑酷：自動跑屋頂，點按／按住調整跳躍；掉進空隙或撞牆才結束。顯示距離 score=floor(dist/60)。每局固定扣 10；**沒有倍率，也沒有結束時的結算**，改為里程碑獎勵：跑到下列公尺數時，固定點數當場加入共用餘額（`award`，每個里程碑只入帳一次，之後摔下去不收回）：

| 公尺 | 150 | 300 | 500 | 750 | 1000 | 之後每 +250 |
| --- | --- | --- | --- | --- | --- | --- |
| 獎勵 | +3 | +7 | +15 | +30 | +60 | +40 |
| 累計 | 3 | 10（回本） | 25 | 55 | 115 | — |

大廳卡片以 `game-card-bonus`（「✦ BONUS」）標示有獎勵，不說明達成方式；遊戲畫面不顯示本局累計淨賺／損。里程碑以常數 `MILESTONES`／`ENDLESS_*` 定義，`bonusAt`、`nextMilestone` 為純函式。結束時 `AN.end` 的 payout_points 為本局累計入帳，每個里程碑另送 game_progress（step、score、bonus_points）。

難度：速度 `min(400, 190+dist×0.0035)` px/s（約 1,000 公尺到最高速）；空隙 45～`40+v×0.34`；屋頂寬 `[max(105,170−s×.12), max(180,300−s×.3)]`、高低落差額外 ±`min(20,s×.04)`（s 為公尺）；剛走出邊緣 0.14 秒內仍可起跳（`COYOTE`）。

距離校準（2026-11-17，非真人數據）：用重現本遊戲物理的模擬器，讓帶雜訊的玩家各跑 400 局。「技術好」起跳誤差σ≈0.05 秒、「不錯」0.07、「一般」0.09、「新手」0.13（另有按住時間誤差）。到達各距離的比例：

| 距離 | 150 m | 300 m | 500 m | 750 m | 1000 m |
| --- | --- | --- | --- | --- | --- |
| 技術好 | 94% | 85% | 57% | 23% | 9% |
| 不錯 | 73% | 48% | 16% | 2% | 0% |
| 一般 | 35% | 7.5% | 0.3% | 0% | 0% |
| 新手 | 6% | 0% | 0% | 0% | 0% |

中位數約：一般 100 m（約 30 秒）、不錯 290 m、技術好 540 m。此外一個固定節奏的腳本在正式參數下的測試副本跑到過 415 m。這些數字只是起點，應以正式站的 `game_end` score 分布（GA4）重新校準；調整時只改 `MILESTONES` 與難度常數。重新整理會放棄本局但已入帳的獎勵保留；最佳紀錄 `deep-sea-cat-best` 不變。

訪客榜以終局整數距離排名。Worker 重播跳躍按下／放開與屋頂碰撞。 最多驗證十分鐘的遊戲時間。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/cat/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
