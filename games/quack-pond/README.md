# 呱呱池塘 Quack Pond（quack-pond）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#quack-pond`　分類：益智策略　狀態：顯示中
- 大廳卡片：「每行、每列、每個顏色區域各放一隻鴨子，而且不能相鄰。」｜立即開玩 · 200 關
- 追蹤名稱（GA4 `game_name`）：呱呱池塘，`game_id` 為 `quack-pond`
- 檔案：`games/quack-pond/card.html`、`games/quack-pond/cover.webp`、`games/quack-pond/game.js`、`games/quack-pond/icon.svg`、`games/quack-pond/original.html`、`games/quack-pond/style.css`、`games/quack-pond/view.html`；`game.js` 共 65 行、4.9 KB

## 畫面元素（view.html 的 id）

`view-quack-pond`、`qp-frame`、`qp-level`、`qp-cleared`、`qp-stars`、`qp-go`、`qp-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`QP`（L2）

## 函式索引（game.js，行號為宣告位置）

`qpL` L3、`qpSay` L4、`qpStored` L5、`qpUI` L6、`qpValid` L10、`qpRoute` L51

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L14 `qpValid`：`if(ENTRY_FEE>S.balance){qpSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 2 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L16 `qpValid`：`QP.analytics=AN.start('quack-pond',ENTRY_FEE);`
- L24 `qpValid`：`AN.progress(QP.analytics,{stage:Math.max(1,Math.floor(Number(level)||QP.level)),step:QP.ducks});`
- L35 `qpValid`：`AN.end(QP.analytics,0,'complete',{score:level,step:stars});`
- L38 `qpValid`：`AN.end(QP.analytics,0,'loss',{score:level,step:QP.ducks});`
- L41 `qpValid`：`AN.end(QP.analytics,0,'abandoned',{score:level,step:QP.ducks});`
- L45 `qpValid`：`if(qpValid(source)&&QP.active)AN.progress(QP.analytics,{phase:'pause'},true);`
- L46 `qpValid`：`if(qpValid(source)&&QP.active)AN.resume(QP.analytics);`
- L50 `qpValid`：`AN.end(QP.analytics,0,'abandoned',{score:QP.level,step:QP.ducks});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `qp_progress`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`qpRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/quack-pond/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
