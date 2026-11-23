# 萌獸破城隊 Critter Crashers（siege-architect）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#siege-architect`　分類：益智策略　狀態：顯示中
- 大廳卡片：「在時間軸上排好萌獸部隊的出發時間，利用每座塔的鎖定規則攻破城門。」｜立即開玩 · 20 關
- 追蹤名稱（GA4 `game_name`）：萌獸破城隊，`game_id` 為 `siege-architect`
- 檔案：`games/siege-architect/card.html`、`games/siege-architect/cover.webp`、`games/siege-architect/game.js`、`games/siege-architect/icon.svg`、`games/siege-architect/leaderboard.webp`、`games/siege-architect/original.html`、`games/siege-architect/style.css`、`games/siege-architect/view.html`；`game.js` 共 66 行、5.2 KB

## 畫面元素（view.html 的 id）

`view-siege-architect`、`sa-frame`、`sa-level`、`sa-cleared`、`sa-stars`、`sa-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`SA`（L3）

## 函式索引（game.js，行號為宣告位置）

`saL` L4、`saSay` L5、`saStored` L6、`saUI` L12、`saValid` L16、`saLevel` L17、`saRoute` L57

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L21 `saLevel`：`if(ENTRY_FEE>S.balance){saSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L23 `saLevel`：`SA.analytics=AN.start('siege-architect',ENTRY_FEE);`
- L31 `saLevel`：`AN.progress(SA.analytics,{stage:SA.level,step:SA.attempts});`
- L41 `saLevel`：`AN.end(SA.analytics,0,'complete',{score:level,step:stars});`
- L46 `saLevel`：`AN.end(SA.analytics,0,'cancelled',{score:level,step:SA.attempts});`
- L50 `saLevel`：`if(saValid(source)&&SA.active)AN.progress(SA.analytics,{phase:'pause'},true);`
- L51 `saLevel`：`if(saValid(source)&&SA.active)AN.resume(SA.analytics);`
- L56 `saLevel`：`AN.end(SA.analytics,0,'abandoned',{score:SA.level,step:SA.attempts});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `siegeArch.level`（讀）
- `siegeArch.stars`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`saRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/siege-architect/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
