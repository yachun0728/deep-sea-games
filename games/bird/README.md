# 便便鳥大戰狼群 Poop Bird vs Wolves（bird）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#bird`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「跳過仙人掌和狼群，用便便把狼王打跑。」｜每局 10 點 · 狼王挑戰
- 追蹤名稱（GA4 `game_name`）：便便鳥大戰狼群，`game_id` 為 `bird`
- 檔案：`games/bird/card.html`、`games/bird/game.js`、`games/bird/icon.svg`、`games/bird/view.html`；`game.js` 共 195 行、13.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「20. Poop Bird vs Wolves（bird）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-bird`、`pb-canvas`、`pb-score`、`pb-boss`、`pb-best`、`pb-amount`、`pb-go`、`pb-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`birdBusy`（L2）
- L5 常數：`TIERS`、`BOSS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`tierMult` L8、`rnd` L9、`O` L10、`C` L11、`F` L12、`RR` L13、`tx` L14、`reset` L17、`score` L19、`mult` L20、`say` L21、`setText` L23、`ui` L24、`die` L31、`jump` L41、`shoot` L45、`spawn` L46、`hitRect` L52、`update` L53、`drawPoop` L79、`drawBird` L88、`leg` L90、`drawWolf` L100、`drawCactus` L113、`label` L120、`drawEgg` L127、`draw` L128、`start` L164、`pos` L171、`down` L172、`loop` L191

## 錢包與結算接點

**扣款（開始一局）**
- L168 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L35 `die`：`S.balance+=paid;`

**餘額檢查**
- L167 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L35 `die`：`AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,bosses:eggs,multiplier:m});`
- L61 `update`：`AN.progress(analytics,{stage:eggs+1,step:score(),phase:'alpha'})}}`
- L168 `start`：`analytics=AN.start('bird',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-bird-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`birdBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`birdBusy` 所在 IIFE。地面／空中二段跳，第二跳可按住短暫提升；點攻擊或X／P／下方向鍵射擊，冷卻.3秒。每8個障礙有狼王，需3次命中擊敗，擊敗增加一顆蛋。碰撞結束時自動結算，無關卡現金退出。

score=floor(dist/60)。距離基礎倍率 `<30:0`、`>=30:.5`、`>=60:1`、`>=90:1.4`、`>=130:2`、`>=180:2.8`、`>=250:4`。最終倍率=基礎倍率+0.5×蛋數，返還 floor(投入×最終倍率)。4倍只是基礎上限，不是含蛋總倍率上限；不能將碰撞一律當作返還0。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/bird/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
