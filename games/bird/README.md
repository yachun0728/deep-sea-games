# 便便鳥大戰狼群 Poop Bird vs Wolves（bird）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#bird`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「跳過仙人掌和狼群，用便便把狼王打跑。」｜每局 10 點 · 狼王挑戰
- 追蹤名稱（GA4 `game_name`）：便便鳥大戰狼群，`game_id` 為 `bird`
- 檔案：`games/bird/card.html`、`games/bird/game.js`、`games/bird/icon.svg`、`games/bird/view.html`；`game.js` 共 190 行、12.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「20. Poop Bird vs Wolves（bird）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-bird`、`pb-canvas`、`pb-score`、`pb-boss`、`pb-best`、`pb-amount`、`pb-go`、`pb-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`birdBusy`（L2）
- L5 常數：`BOSS_REWARD`

## 函式索引（game.js，行號為宣告位置）

`rnd` L8、`O` L9、`C` L10、`F` L11、`RR` L12、`tx` L13、`reset` L16、`score` L18、`say` L19、`setText` L21、`ui` L22、`die` L27、`jump` L36、`shoot` L40、`spawn` L41、`hitRect` L47、`update` L48、`drawPoop` L74、`drawBird` L83、`leg` L85、`drawWolf` L95、`drawCactus` L108、`label` L115、`drawEgg` L122、`draw` L123、`start` L159、`pos` L166、`down` L167、`loop` L186

## 錢包與結算接點

**扣款（開始一局）**
- L163 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L71 `update`：`S.balance+=BOSS_REWARD;`

**餘額檢查**
- L162 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L31 `die`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:s,bosses:eggs});`
- L56 `update`：`AN.progress(analytics,{stage:eggs+1,step:score(),phase:'alpha'})}}`
- L71 `update`：`AN.progress(analytics,{step:score(),score:score(),bosses:eggs,bonus_points:BOSS_REWARD});`
- L163 `start`：`analytics=AN.start('bird',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-bird-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`birdBusy` 所在 IIFE。無盡跑酷：地面／空中二段跳，第二跳可按住短暫提升；點攻擊或X／P／下方向鍵射擊，冷卻.3秒。每8個障礙有狼王，需3次命中擊敗，擊敗增加一顆蛋。撞到障礙才結束。

獎勵：**只有打贏狼王才給點數**，每隻 +1（`BOSS_REWARD`），在擊敗的當下加入共用餘額（`S.balance`）並存檔，每隻只入帳一次，之後撞到障礙不收回。跑多遠（score=floor(dist/60)）沒有任何獎勵，也沒有倍率；結束時不再另外結算。`AN.end` 的 payout_points 為本局累計入帳（`earned`），每隻狼王另送 game_progress（step、score、bosses、bonus_points）。大廳卡片以 `game-card-bonus`（「✦ BONUS」）標示，不說明達成方式。

注意：入場 10 點，所以要打贏 10 隻狼王才回本。每隻狼王約每通過 8 個障礙出現一次（障礙間距 300～480 畫素，另加戰鬥時間）；本款尚未做模擬校準，需要時看正式站的 `game_end`（bosses）分布。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/bird/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
