# 偷偷下班 Sneak Out（sneak）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#sneak`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「按住偷溜，老闆回頭前趕快裝忙。」｜每局 10 點 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：偷偷下班，`game_id` 為 `sneak`
- 檔案：`games/sneak/card.html`、`games/sneak/game.js`、`games/sneak/icon.svg`、`games/sneak/view.html`；`game.js` 共 116 行、10.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「15. Sneak（sneak）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-sneak`、`sk-canvas`、`sk-stage`、`sk-progress`、`sk-best`、`sk-next`、`sk-signal`、`sk-difficulty`、`sk-amount`、`sk-go`、`sk-hold`、`sk-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`sneakBusy`（L2）
- L6 常數：`MILESTONES`、`ENDLESS_FROM`、`ENDLESS_STEP`、`ENDLESS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`bonusAt` L7、`nextMilestone` L8、`lvCap` L9、`T` L11、`rnd` L16、`saySneak` L17、`remember` L18、`release` L19、`ui` L20、`lookGrace` L29、`awayT` L30、`nextPhase` L31、`die` L40、`award` L41、`win` L42、`update` L44、`sync` L57、`round` L58、`start` L59、`draw` L65、`press` L104、`lift` L105、`loop` L112

## 錢包與結算接點

**扣款（開始一局）**
- L63 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L41 `award`：`S.balance+=b;`

**餘額檢查**
- L62 `start`：`if(amount>S.balance){saySneak(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L40 `die`：`AN.end(sneakAnalytics,earned,earned>0?'complete':'loss',{stage:lv,progress_percent:Math.floor(pr)});`
- L41 `award`：`AN.progress(sneakAnalytics,{stage:n,bonus_points:b});`
- L42 `win`：`AN.progress(sneakAnalytics,{stage:done},true);`
- L58 `round`：`AN.resume(sneakAnalytics,{stage:lv});`
- L63 `start`：`sneakAnalytics=AN.start('sneak',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `sneak`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`sneakBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`sneakBusy` 所在 IIFE。無盡下班（2026-11-17 改為直到被抓）：按住畫面／按鈕或Space、右鍵方向／D往出口走，放開裝忙。第n關需累積 `6+2×(min(n,10)-1)` 秒移動時間（第10關起固定24秒），走到出口立刻進下一關，沒有領回。主管有背對、警示與轉頭；第3關起有30%假警示，第4關起可能直接轉頭（第4關15%，之後每關+3%，最高50%）。反應時間：直接轉頭約 `max(.22, .34-.01(n-4))` 秒，警示後轉頭約 `max(.12, .16-.003n)` 秒（此版比舊版寬鬆，因舊版直接轉頭僅.18秒幾乎無法反應）；轉頭期間繼續移動被抓。後關背對與警示時間縮短。離開或背景時釋放移動。

里程碑以通過關數計，點數當場入帳、不扣回：9關 +3、11關 +7（累計10點，回本）、13關 +15、16關 +30，之後每多3關 +40。以反應時間模擬校準：平均玩家約通過5關，技巧好者約11～12關，達13關約三成以下。大廳卡片只標示「✦ BONUS」。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/sneak/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
