# 青蛙吃蟲 Frog Snack（frog）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#frog`　分類：時機操作　狀態：顯示中
- 大廳卡片：「對準最底下的蟲按下去吃掉牠，紅色帶刺的不能吃。」｜立即開玩 · 一鍵反應
- 追蹤名稱（GA4 `game_name`）：青蛙吃蟲，`game_id` 為 `frog`
- 檔案：`games/frog/card.html`、`games/frog/cover.webp`、`games/frog/game.js`、`games/frog/icon.svg`、`games/frog/leaderboard.webp`、`games/frog/style.css`、`games/frog/view.html`；`game.js` 共 212 行、14.2 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「26. 青蛙吃蟲 Frog Snack（frog）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-frog`、`fg-canvas`、`fg-eaten`、`fg-level`、`fg-best`、`fg-amount`、`fg-go`、`fg-msg`、`fg-rank-status`、`fg-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`A`（L75）、`frogBusy`（L2）
- L4 常數：`DPR`
- L5 常數：`FNT`
- L6 常數：`AIM_X`
- L8 常數：`FROG_REWARD`
- L74 常數：`SPR`、`SCN`
- L76 常數：`BUGK`
- L125 常數：`PADX`、`PADY`

## 函式索引（game.js，行號為宣告位置）

`O` L11、`C` L12、`F` L13、`RR` L14、`tx` L15、`level` L18、`reset` L19、`say` L21、`setText` L23、`ui` L24、`fx` L29、`end` L30、`press` L45、`update` L66、`ok` L76、`spr` L77、`sprW` L78、`sprBox` L79、`pill` L80、`wt` L81、`drawBug` L82、`drawFrog` L88、`draw` L99、`wrapT` L126、`block` L127、`lh` L127、`begin` L133、`rankStatus` L140、`start` L146、`uploadRank` L166、`shown` L177、`loop` L190

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L61 `press`：`S.balance+=FROG_REWARD;`

**餘額檢查**
- L148 `start`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L34 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:state.pts,step:state.eaten,stage:level()});`
- L62 `press`：`AN.progress(analytics,{stage:level(),step:state.eaten,score:state.pts,bonus_points:FROG_REWARD});`
- L136 `begin`：`analytics=AN.start('frog',amount);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-frog-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`frogBusy` 所在 IIFE。單鍵時機遊戲（原型為敲高跟鞋）：8 隻蟲疊成一座塔，黃色箭頭在最底下兩隻蟲之間（畫布 y 412～500）等速來回。按空白鍵或點畫面時，箭頭與最底下那隻蟲中心（y 478）的距離 ≤16 畫素算命中，≤6 畫素算 PERFECT；命中就吃掉最底下那隻，整疊下移一格並從上方補一隻。

- 沒對準（MISS）：不扣愛心，連擊歸零，停頓 0.35 秒，並扣飽食（Lv.1 扣 2、Lv.2 起扣 4），避免狂按也能存活。
- 生氣的蟲（粉紅色、有眉毛）只在最底下三格計時：平靜 → 閃黃警告 0.5 秒 → 紅色帶刺（攻擊）→ 回到平靜，一直循環。紅色時命中算被螫：扣 1 顆愛心（共 3 顆）、連擊歸零、停頓 0.6 秒，那隻蟲留在原地並回到平靜。警告時吃掉另加 5 分。不會連續生成三隻生氣的蟲。
- 飽食 100 起算，每秒下降；一般命中 +8、PERFECT +12，上限 100；每升一級（吃滿 10 隻）再回復 10。
- 分數：一般 10、PERFECT 20，乘上連擊倍率（吃之前的連擊 0～4 為 ×1、5～14 為 ×2、15 以上 ×3）。分數可用於訪客排行榜，分數與連擊不換點數。
- 結束：愛心歸零或飽食歸零。

訪客榜以本局遊戲分數排序，瀏覽器最佳紀錄仍依吃掉隻數。Worker 發出回合與亂數種子，依 10 毫秒步進重播按鍵。回合需在開局後 15 分鐘內送出，最多驗證 10 分鐘的遊戲時間。連線失敗可繼續本機遊玩。

等級 = min(10, floor(吃掉隻數÷10)+1)，數值定義於 `shared/frog-rules.cjs`：

| 等級 | 箭頭速度(px/秒) | 新蟲生氣機率 | 平靜秒數 | 攻擊秒數 | 飽食下降(每秒) |
| --- | --- | --- | --- | --- | --- |
| 1 | 141 | 0% | 不適用 | 不適用 | 5 |
| 2 | 157 | 15% | 2.0～3.0 | 0.8 | 5.7 |
| 3 | 173 | 20% | 1.8～2.8 | 0.9 | 6.4 |
| 4 | 189 | 25% | 1.6～2.6 | 1.0 | 7.1 |
| 5 | 204 | 30% | 1.4～2.4 | 1.1 | 7.8 |
| 6 | 220 | 35% | 1.2～2.2 | 1.2 | 8.5 |
| 7 | 236 | 40% | 1.0～2.0 | 1.3 | 9.2 |
| 8 | 251 | 45% | 0.9～1.8 | 1.4 | 9.9 |
| 9 | 267 | 50% | 0.8～1.6 | 1.5 | 10.6 |
| 10 | 283 | 55% | 0.7～1.4 | 1.6 | 11.3 |

獎勵：**每吃滿 10 隻 +1 點**（`FROG_REWARD`、`REWARD_EVERY`），在吃到的當下加入共用餘額（`S.balance`）並存檔，每個 10 隻只入帳一次，第 10 級以後仍繼續給；結束時不再另外結算、不收回。`AN.end` 的 payout_points 為本局累計入帳（`earned`），附 score、step（吃掉隻數）、stage（等級）；每次入帳另送 game_progress（stage、step、score、bonus_points）。大廳卡片以 `game-card-bonus` 標示。

注意：入場 10 點，要吃滿 100 隻才回本。飽食下降速度經過機器人模擬調過一次（每種程度各 400 局；機器人每一趟都出手、只有時機誤差，比真人理想）：時機誤差 75 毫秒的機器人中位數吃 76 隻、55 毫秒 92 隻、40 毫秒 105 隻、28 毫秒 125 隻。真人會比這些數字低，尚未做真人測試，上線後看正式站 `game_end` 的 step 分布調整 `LV`。切換遊戲或背景分頁時停止更新（暫停），重新整理放棄本局、不退款、已入帳保留。最佳紀錄 `deep-sea-frog-best` 存吃掉隻數。本款沒有音效。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/frog/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
