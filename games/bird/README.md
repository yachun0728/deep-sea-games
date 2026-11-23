# 便便鳥大戰狼群 Poop Bird vs Wolves（bird）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#bird`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「跳過仙人掌和狼群，用便便把狼王打跑。」｜立即開玩 · 狼王挑戰
- 追蹤名稱（GA4 `game_name`）：便便鳥大戰狼群，`game_id` 為 `bird`
<<<<<<< Updated upstream
- 檔案：`games/bird/card.html`、`games/bird/cover.webp`、`games/bird/game.js`、`games/bird/icon.svg`、`games/bird/leaderboard.webp`、`games/bird/view.html`；`game.js` 共 336 行、19.0 KB
=======
- 檔案：`games/bird/card.html`、`games/bird/cover.webp`、`games/bird/game.js`、`games/bird/icon.svg`、`games/bird/leaderboard.webp`、`games/bird/view.html`；`game.js` 共 178 行、11.5 KB
>>>>>>> Stashed changes

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「20. Poop Bird vs Wolves（bird）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-bird`、`pb-canvas`、`pb-score`、`pb-boss`、`pb-best`、`pb-amount`、`pb-go`、`pb-msg`、`pb-rank-status`、`pb-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`birdBusy`（L2）
- L5 常數：`BOSS_REWARD`
- L22 常數：`ART_NAMES`
- L29 常數：`LIFT`
- L42 常數：`STRIDE`、`DUST_LIFE`

## 函式索引（game.js，行號為宣告位置）

`cl` L8、`O` L9、`C` L10、`F` L11、`RR` L12、`tx` L14、`artReady` L25、`spr` L26、`fit` L30、`score` L46、`say` L47、`setText` L49、`ui` L50、`die` L55、`update` L66、`birdEvent` L77、`drawPoop` L85、`drawAttackButton` L102、`drawBird` L123、`leg` L125、`drawWolf` L135、`drawCactus` L148、`label` L155、`drawEgg` L162、`drawWorld` L163、`layer` L165、`updateRunEffects` L177、`drawRunDust` L188、`drawRunningLeg` L200、`drawHero` L227、`drawWolfArt` L240、`drawCactusArt` L248、`draw` L253、`start` L295、`pos` L305、`input` L306、`down` L307、`release` L308、`shoot` L309、`loop` L328

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L80 `birdEvent`：`S.balance+=BOSS_REWARD;`

**餘額檢查**
- L298 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L60 `die`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:s,bosses:bird.eggs});`
- L78 `birdEvent`：`AN.progress(analytics,{stage:bird.eggs+1,step:score(),phase:'alpha'});`
- L81 `birdEvent`：`AN.progress(analytics,{step:score(),score:score(),bosses:bird.eggs,bonus_points:BOSS_REWARD});`
- L301 `start`：`analytics=AN.start('bird',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-bird-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/result-share.js` 會呼叫：`score`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`birdBusy` 所在 IIFE。無盡跑酷：地面／空中二段跳，第二跳可按住短暫提升；點攻擊或X／P／下方向鍵射擊，冷卻.3秒。每8個障礙有狼王，需3次命中擊敗，擊敗增加一顆蛋。撞到障礙才結束。速度每跑 50 公尺（score 每 50、距離每 3000 畫素）提升一級：`v=min(460, 290+級數×15)`，最高 460；升級時畫面短暫出現速度線。

獎勵：**只有打贏狼王才給點數**，每隻 +1（`BOSS_REWARD`），在擊敗的當下加入共用餘額（`S.balance`）並存檔，每隻只入帳一次，之後撞到障礙不收回。跑多遠（score=floor(dist/60)）沒有任何獎勵，也沒有倍率；結束時不再另外結算。`AN.end` 的 payout_points 為本局累計入帳（`earned`），每隻狼王另送 game_progress（step、score、bosses、bonus_points）。大廳卡片以 `game-card-bonus`（「✦ BONUS」）標示，不說明達成方式。

注意：入場 10 點，所以要打贏 10 隻狼王才回本。每隻狼王約每通過 8 個障礙出現一次（障礙間距 300～480 畫素，另加戰鬥時間）；本款尚未做模擬校準，需要時看正式站的 `game_end`（bosses）分布。

訪客榜以自然終局時的整數距離排名。Worker 依種子重播跳躍、放開、投射物、狼王擊退及障礙碰撞，最多驗證十分鐘的遊戲時間。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/bird/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
