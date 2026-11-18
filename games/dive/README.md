# 一口氣探險 One Breath Dive（dive）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#dive`　分類：益智策略　狀態：顯示中
- 大廳卡片：「選路線往下潛撿珍珠，氧氣用完前上浮，挑戰最高分。」｜免費遊玩 · 最佳分數
- 追蹤名稱（GA4 `game_name`）：一口氣探險，`game_id` 為 `dive`
- 檔案：`games/dive/card.html`、`games/dive/game.js`、`games/dive/icon.svg`、`games/dive/original.html`、`games/dive/style.css`、`games/dive/view.html`；`game.js` 共 54 行、3.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「23. 一口氣探險（dive）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-dive`、`dv-frame`、`dv-score`、`dv-depth`、`dv-best`、`dv-amount`、`dv-go`、`dv-msg`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`DIVE`

## 函式索引（game.js，行號為宣告位置）

`diveSay` L3、`diveBest` L4、`diveUI` L5、`diveValid` L11、`diveRoute` L41

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L16 `diveValid`：`if(amount>S.balance){diveSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L18 `diveValid`：`DIVE.analytics=AN.start('dive',amount);`
- L30 `diveValid`：`AN.end(DIVE.analytics,0,kind==='drown'?'loss':'complete',{score:score,depth:depth});`
- L37 `diveValid`：`AN.progress(DIVE.analytics,{stage:d>=30?4:d>=20?3:d>=10?2:1,step:d});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `diveBestScore`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`diveRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/dive/original.html`（子頁規則）、`games/dive/game.js` 的 `DIVE`、`deepSeaDive`；dive-source 是組合後的資料容器。保留原始黑色直式畫面。固定投入10（`ENTRY_FEE`），按右側「扣點開始下潛」或子頁「深吸一口氣」才扣款，兩者共用同一開局流程；結算後須再按一次才重新扣款。

每層選一張路線卡往下潛（氣泡帶、寶箱、水雷區、捷徑洋流、未知洞穴、沉船、寄居蟹商人），耗氧 `max(2, round(6+深度×0.35) ± 遺物修正)`。上浮所需氧氣＝`ceil(深度×1.2×遺物修正)`＋珍珠重量 `floor(珍珠/10)`；氧氣不足但高於基本需求時可丟珍珠減重上浮。10／20／30層起進入暮光／午夜／深淵帶，看不清的卡片增加、水雷變多。開局隨機給一個遺物，約每5層有沉船可選遺物。

2026-11-17 移除倍率與領回：分數 `珍珠+深度×2` 只作成績與最佳紀錄（`diveBestScore`，舊 `diveBestMult` 不再使用），不換算成點數。上浮（需氧氣高於紅線，可丟珍珠減重）或到第40層海底時這一趟結束；氧氣耗盡分數歸零；持有救生繩時第一次耗盡改以一半珍珠計分並結束。此款為一般遊戲，沒有 BONUS 里程碑（尚無難度校準資料）。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/dive/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
