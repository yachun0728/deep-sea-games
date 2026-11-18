# 捷運搶位 MRT Seat Grab（mrt）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mrt`　分類：益智策略　狀態：顯示中
- 大廳卡片：「看小動作猜誰要下車，一階一階往上搶座位。」｜每局 10 點 · 8 階挑戰
- 追蹤名稱（GA4 `game_name`）：捷運搶位，`game_id` 為 `mrt`
- 檔案：`games/mrt/card.html`、`games/mrt/game.js`、`games/mrt/icon.svg`、`games/mrt/original.html`、`games/mrt/style.css`、`games/mrt/view.html`；`game.js` 共 52 行、3.2 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「24. 捷運搶位（mrt）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mrt`、`mr-frame`、`mr-tier`、`mr-best`、`mr-amount`、`mr-go`、`mr-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`MRT`（L2）
- L2 常數：`MRT`

## 函式索引（game.js，行號為宣告位置）

`mrtSay` L3、`mrtBest` L4、`mrtUI` L5、`mrtValid` L11、`mrtRoute` L39

## 錢包與結算接點

**扣款（開始一局）**
- L18 `mrtValid`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L16 `mrtValid`：`if(amount>S.balance){mrtSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L18 `mrtValid`：`MRT.analytics=AN.start('mrt',amount);`
- L30 `mrtValid`：`AN.end(MRT.analytics,0,tier>0?'complete':'loss',{score:tier});`
- L34 `mrtValid`：`if(mrtValid(source)&&MRT.active)AN.progress(MRT.analytics,{stage:Math.max(1,Math.floor(Number(round)||1)),ste…`
- L35 `mrtValid`：`if(mrtValid(source)&&MRT.active)AN.progress(MRT.analytics,{phase:'pause'},true);`
- L36 `mrtValid`：`if(mrtValid(source)&&MRT.active)AN.resume(MRT.analytics);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `mrtBestTier`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`mrtRoute`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`games/mrt/original.html`（子頁規則）、`games/mrt/game.js` 的 `MRT`、`deepSeaMrt`；mrt-source 是組合後的資料容器。保留原始黑色直式畫面。固定投入10（`ENTRY_FEE`），按右側「扣點上車」或子頁「上車」才扣款，兩者共用同一開局流程；結算後須再按一次才重新扣款。

共21站，6個座位。進站前依乘客的小動作與隨身物品（人設對應車站區域）猜誰會下車並站到他面前；猜中坐下升一階，在進站前半段就站定位者坐下時體力+8。站著沒坐到扣體力 `25+3×階數`，體力歸零立即結束。坐著每站體力+6，可預約下一站起身再搶。坐著時可能遇到讓座事件：讓座體力+20但起身；裝睡有四成機率降一階（最低1階）。階數越高進站越快、線索越不可靠；2階起阿姨、5階起大叔會搶位。

2026-11-17 移除倍率與領回：成績為搶到的最高階數（0～8，`mrtBestTier`，舊 `mrtBestMult` 不再使用），只作紀錄，不換算點數。已移除「下車結算」；搶滿8階、體力歸零或抵達最後一站時這一趟結束，體力歸零保留已搶到的階數。離開畫面或背景分頁時，進站中的回合會暫停，需按「繼續」恢復。此款為一般遊戲，沒有 BONUS 里程碑。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mrt/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
