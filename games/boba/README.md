# 插珍奶 Boba Straw（boba）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#boba`　分類：時機操作　狀態：顯示中
- 大廳卡片：「抓準力道插吸管，原版粉紅珍奶小遊戲。」｜立即開玩 · 只扣入場點數
- 追蹤名稱（GA4 `game_name`）：插珍奶，`game_id` 為 `boba`
- 檔案：`games/boba/card.html`、`games/boba/game.js`、`games/boba/icon.svg`、`games/boba/original.html`、`games/boba/view.html`；`game.js` 共 28 行、2.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「18. 珍奶插吸管（boba）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-boba`、`boba-finish`、`boba-msg`、`boba-frame`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`BOBA`

## 函式索引（game.js，行號為宣告位置）

`bobaUI` L3、`bobaValid` L4、`bobaRoute` L21

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L8 `bobaValid`：`if(S.balance<BOBA.fee){bobaUI(LOW_MSG);`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L9 `bobaValid`：`BOBA.analytics=AN.start('boba',BOBA.fee);`
- L14 `bobaValid`：`AN.end(BOBA.analytics,0,'complete',{score:cups});`
- L16 `bobaValid`：`if(bobaValid(source)&&BOBA.active)AN.progress(BOBA.analytics,{step:Math.max(0,Math.floor(Number(cups)||0))});`
- L17 `bobaValid`：`if(bobaValid(source)&&BOBA.active)AN.progress(BOBA.analytics,{phase:'revive'},true);`
- L18 `bobaValid`：`if(bobaValid(source)&&BOBA.active)AN.resume(BOBA.analytics);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`bobaRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/boba/original.html`、`games/boba/game.js` 的 `BOBA`、`deepSeaBoba`；boba-source 是組合後的資料容器。保留原始粉色畫面；按住蓄力並放開，在甜蜜區插入吸管。開始／重試固定扣10，開啟畫面或暫停恢復不扣費；沒有點數返還。初始3根吸管，上限5；失誤彎曲／爆杯消耗一根，連續3次 perfect補一根（不超上限）。厚杯需兩次命中，另有抖動與移動杯等變化。

難度D在杯數N<=5時為N，之後為5+ceil((N-5)/5)；甜蜜區寬 max(.08,.30-(D-1)×.015)，週期 max(.45,1.2-(D-1)×.04)。無吸管時每局有一次模擬5秒廣告復活補一根；購買畫面也是示意，未串真實廣告或付款。杯數／本機事件與最佳紀錄不是共用點數。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/boba/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
