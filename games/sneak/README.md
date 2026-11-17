# 偷偷下班 Sneak Out（sneak）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#sneak`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「按住偷溜，老闆回頭前趕快裝忙。」｜每局 10 點 · 10 關挑戰
- 追蹤名稱（GA4 `game_name`）：偷偷下班，`game_id` 為 `sneak`
- 檔案：`games/sneak/card.html`、`games/sneak/game.js`、`games/sneak/icon.svg`、`games/sneak/view.html`；`game.js` 共 111 行、9.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「15. Sneak（sneak）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-sneak`、`sk-canvas`、`sk-stage`、`sk-progress`、`sk-best`、`sk-signal`、`sk-difficulty`、`sk-amount`、`sk-go`、`sk-hold`、`sk-cash`、`sk-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`sneakBusy`（L2）
- L4 常數：`MAX_LEVEL`、`MULT`

## 函式索引（game.js，行號為宣告位置）

`T` L6、`rnd` L11、`pay` L12、`saySneak` L13、`remember` L14、`release` L15、`ui` L16、`awayT` L25、`nextPhase` L26、`die` L35、`cash` L36、`win` L37、`update` L39、`sync` L52、`round` L53、`start` L54、`draw` L61、`press` L99、`lift` L100、`loop` L107

## 錢包與結算接點

**扣款（開始一局）**
- L59 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L36 `cash`：`S.balance+=amount;`

**餘額檢查**
- L58 `start`：`if(amount>S.balance){saySneak(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L35 `die`：`AN.end(sneakAnalytics,0,'loss',{stage:lv,progress_percent:Math.floor(pr)});`
- L36 `cash`：`AN.end(sneakAnalytics,amount,'cashout',{stage:lv,multiplier:MULT[score]});`
- L37 `win`：`AN.progress(sneakAnalytics,{stage:lv,multiplier:MULT[score]},true);`
- L53 `round`：`AN.resume(sneakAnalytics,{stage:lv});`
- L59 `start`：`sneakAnalytics=AN.start('sneak',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `sneak`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`sneakBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`sneakBusy` 所在 IIFE。按住畫面／按鈕或Space、右鍵方向／D往出口走，放開裝忙。10關，第s關需累積6+2×(s-1)秒移動時間。主管有背對、警示與轉頭；第3關起有30%假警示，第4關開始可能直接轉頭（第4關20%，第5關40%，之後每關+5%至第10關65%）。一般轉頭容許約.1秒反應，直接轉頭約.18秒；轉頭期間繼續移動被抓整局0。後關背對與警示時間縮短。每關到出口可領回／續關，第10關自動領回；離開或背景時釋放移動。

第1～10關倍率 `[.6,1.1,1.8,2.8,4.5,6.5,9,12,16,21]`。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/sneak/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
