# 挖金礦 Gold Digger（keno）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#keno`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「五次挖掘機會，發現金礦與閃亮寶石。」｜入場 10 點 · 探索集分
- 追蹤名稱（GA4 `game_name`）：挖金礦，`game_id` 為 `keno`
- 檔案：`games/keno/card.html`、`games/keno/game.js`、`games/keno/icon.svg`、`games/keno/style.css`、`games/keno/view.html`；`game.js` 共 50 行、3.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「8. Keno（keno）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-keno`、`ke-board`、`ke-left`、`ke-score`、`ke-best`、`ke-go`、`ke-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`KE`（L3）
- L2 常數：`KE_N`、`KE_DIGS`
- L5 常數：`KE_ORES`

## 函式索引（game.js，行號為宣告位置）

`kSay` L6、`keBuild` L7、`keUI` L14、`kePlay` L26、`keDig` L36

## 錢包與結算接點

**扣款（開始一局）**
- L32 `kePlay`：`S.balance -= ENTRY_FEE;`

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L28 `kePlay`：`if (S.balance < ENTRY_FEE) { kSay(LOW_MSG, 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 4 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L33 `kePlay`：`KE.analytics = AN.start('keno', ENTRY_FEE);`
- L41 `keDig`：`AN.progress(KE.analytics, {step: KE.digs, score: KE.score});`
- L44 `keDig`：`AN.end(KE.analytics, 0, 'complete', {step: KE.digs, score: KE.score});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-gold-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`ENTRY_FEE`、`LOW_MSG`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`keBuild`、`keUI`
- `js/controls.js` 會呼叫：`kSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`KE`

## 規則摘要（取自 GAME_RULES.md）

挖金礦。定位：`KE`、`KE_ORES`、`kePlay`、`keDig`。每局固定入場10點；40格固定包含石頭20格（0分）、銅礦10格（10分）、金礦8格（30分）、寶石2格（60分），開局隨機洗牌。每次挖一個未挖過的格子並即時揭曉，共5次，石頭不扣已累積分數；挖完自動結束。最佳總分存在 `deep-sea-gold-best`，分數不換錢包點數、不發點、不退款。進行中不重開；重點同格不消耗次數，結束後點格不再計分。回大廳及背景不自動挖掘，回來可繼續；重新整理放棄進度。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/keno/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
