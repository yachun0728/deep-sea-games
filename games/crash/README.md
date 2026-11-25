# 壓潰深度 Crush Depth（crash）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#crash`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「隨潛艇一起下潛，在壓潰前上浮。」｜10 點起 · 隨時上浮
- 追蹤名稱（GA4 `game_name`）：壓潰深度，`game_id` 為 `crash`
- 檔案：`games/crash/card.html`、`games/crash/game.js`、`games/crash/icon.svg`、`games/crash/view.html`；`game.js` 共 235 行、12.1 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「1. Crush Depth（crash）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-crash`、`pills`、`sea`、`cv`、`mult`、`subline`、`bet-amount`、`auto-out`、`go`、`msg`、`crew`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）

## 函式索引（game.js，行號為宣告位置）

`startBetting` L2、`startDive` L14、`doCrash` L19、`placeBet` L27、`cashOut` L33、`mainAction` L42、`renderAll` L56、`setGo` L64、`renderGo` L69、`pillClass` L83、`renderPills` L84、`crewRow` L87、`renderCrew` L95、`resize` L103、`seedSnow` L109、`niceStep` L110、`draw` L112、`frame` L204

## 錢包與結算接點

**扣款（開始一局）**
- L29 `placeBet`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L37 `cashOut`：`S.balance += pay;`
- L44 `mainAction`：`S.balance += S.bet.amount;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L20 `doCrash`：`if(S.bet&&!S.bet.out)AN.end(S.bet.analytics,0,'loss',{multiplier:S.crash});`
- L29 `placeBet`：`amount: a, auto: readAuto(), out: null, analytics:AN.start('crash',a) };`
- L36 `cashOut`：`AN.end(S.bet.analytics,pay,'cashout',{multiplier:at});`
- L44 `mainAction`：`AN.end(S.bet.analytics,S.bet.amount,'cancelled');`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`reduceMotion`、`C`、`rollCrash`、`elGo`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`renderAll`、`resize`、`seedSnow`
- `js/controls.js` 會呼叫：`mainAction`、`renderGo`
- `js/navigation.js` 會呼叫：`resize`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`rollCrash`、`placeBet`、`cashOut`、`doCrash`、`mainAction`、`S`。

每輪投注期 6 秒，爆裂後休息 3.2 秒；運行倍率 `exp(0.12 × 經過秒數)`。爆裂點為 `min(1000, max(1, floor(97/(1-r))/100))`，r 為 Math.random()。手動或自動在爆裂前領回，返還 floor(投入×實際領回倍率)；未及領回為 0。自動領回目標最低 1.01，取兩位小數。投注期間取消退回完整投入；預約下一局在真正 placeBet 時才扣款。畫面其他玩家是模擬資料。隨機式含上下限及取整，不應把 97% 直接宣稱為所有操作的精確實際返還率。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/crash/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
