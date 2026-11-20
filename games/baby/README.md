# 寶寶逃洗澡 Baby Bath Escape（baby）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#baby`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「跳過玩具、鑽過櫃子，別被媽媽抓去洗澡。」｜立即開玩 · 居家逃亡
- 追蹤名稱（GA4 `game_name`）：寶寶逃洗澡，`game_id` 為 `baby`
- 檔案：`games/baby/card.html`、`games/baby/cover.webp`、`games/baby/game.js`、`games/baby/icon.svg`、`games/baby/view.html`；`game.js` 共 286 行、14.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「31. 寶寶逃洗澡 Baby Bath Escape（baby）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-baby`、`baby-canvas`、`baby-score`、`baby-best`、`baby-gap`、`baby-amount`、`baby-pay`、`baby-next`、`baby-go`、`baby-msg`、`baby-rank-status`、`baby-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`KM`（L272）、`babyBusy`（L2）
- L5 常數：`MILESTONES`、`BONUS`、`KEY`、`SKEY`、`UNIT`
- L24 常數：`PXL`
- L157 常數：`CHY`

## 函式索引（game.js，行號為宣告位置）

`rnd` L7、`O` L8、`C` L9、`E` L10、`F` L11、`RR` L12、`P` L13、`L2` L14、`acc` L15、`syncModel` L28、`control` L29、`fitStage` L43、`overlayShift` L55、`asset` L57、`hallLayer` L63、`bg` L76、`drawPose` L99、`drawObs` L105、`shadow` L120、`drawRun` L124、`mom` L129、`baby` L135、`SK` L157、`T` L158、`ST` L159、`pick` L161、`release` L162、`say` L163、`setText` L165、`ui` L166、`awardBonus` L174、`die` L184、`start` L194、`panel` L203、`clayText` L206、`overlay` L210、`localText` L243、`bonusText` L244、`bonusTotal` L247、`bonusDraw` L250、`pos` L260、`loop` L279

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L178 `awardBonus`：`S.balance+=BONUS;`

**餘額檢查**
- L197 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L179 `awardBonus`：`AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});`
- L190 `die`：`AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});`
- L199 `start`：`analytics=AN.start('baby',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`babyBusy` 所在 IIFE。媽媽每次碰撞後會拉近距離，第三次碰撞時抓到寶寶。點遊戲畫面跳躍、按住右下角「趴」鍵爬行，放開後恢復奔跑。跳過積木和玩具車、爬過櫃子。分數＝floor(距離/60)。舊回放的輸入代碼與判定保留，供排行榜核對。造型解鎖與選擇存於 `deep-sea-baby-skin`。

免費遊玩，無終點。BONUS：200／500／900 m 三個里程碑，各立即入帳固定 5 點（單局最多 15 點），每個里程碑當局只發一次；達標判定在遊戲更新之後、且回合仍進行時，造成失敗的那一幀不計。失敗或重新整理不扣回，結束時不另發點；`end.payout_points` 記錄本局已入帳總額。最佳紀錄存於 `deep-sea-baby-best`。里程碑門檻依原頁造型解鎖門檻設定，尚未經大量實測校準。切換遊戲或背景分頁時暫停，重新整理放棄本局。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/baby/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
