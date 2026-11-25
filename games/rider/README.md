# 外送員大戰惡犬 Rider vs Dogs（rider）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#rider`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「巷子裡閃狗送餐，餐涼之前送越多越好。」｜立即開玩 · 閃避送餐
- 追蹤名稱（GA4 `game_name`）：外送員大戰惡犬，`game_id` 為 `rider`
- 檔案：`games/rider/card.html`、`games/rider/cover.webp`、`games/rider/game.js`、`games/rider/icon.svg`、`games/rider/leaderboard.webp`、`games/rider/style.css`、`games/rider/view.html`；`game.js` 共 218 行、17.7 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「28. 外送員大戰惡犬 Rider vs Dogs（rider）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-rider`、`rider-canvas`、`rider-score`、`rider-best`、`rider-amount`、`rider-pay`、`rider-next`、`rider-go`、`rider-msg`、`rider-rank-status`、`rider-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`A`（L42）、`LA`（L43）、`KM`（L204）、`riderBusy`（L2）
- L4 常數：`DPR`
- L5 常數：`FNT`
- L6 常數：`MILESTONES`、`BONUS`、`KEY`、`SKEY`、`UNIT`
- L26 常數：`PXL`
- L41 常數：`SPR`、`LAY`
- L44 常數：`DOGS`
- L117 常數：`CHY`
- L163 常數：`PADX`、`PADY`

## 函式索引（game.js，行號為宣告位置）

`rnd` L8、`O` L9、`C` L10、`E` L11、`F` L12、`RR` L13、`P` L14、`L2` L15、`tx` L16、`acc` L17、`syncModel` L30、`control` L31、`ok` L44、`wrap` L45、`spr` L46、`tint` L48、`layer` L57、`shadow` L58、`bg` L59、`house` L70、`dog` L75、`bike` L81、`pill` L90、`wt` L91、`hud` L92、`controls` L98、`SK` L117、`T` L118、`ST` L119、`pick` L121、`release` L122、`say` L123、`setText` L125、`ui` L126、`awardBonus` L133、`die` L143、`start` L153、`card` L162、`wrapT` L164、`block` L169、`lh` L171、`overlay` L174、`bonusDraw` L191、`pos` L192、`loop` L211

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L137 `awardBonus`：`S.balance+=BONUS;`

**餘額檢查**
- L156 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L138 `awardBonus`：`AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});`
- L149 `die`：`AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});`
- L158 `start`：`analytics=AN.start('rider',amount);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`riderBusy` 所在 IIFE（改編自使用者提供的 DeliveryMan.html；原頁面的越／英／中語言切換移除，僅繁中；造型解鎖與選擇保留，存於 `deep-sea-rider-skin`）。訂單溫度降到 0 即結束；點左半邊跳、按住右半邊加速、喇叭嚇狗；到客人家門口放開加速約0.45秒才算送達（+20分並回溫）。分數＝floor(距離/50)+送達數×20。

每局固定入場 10 點，無終點。BONUS：300／700／1,300 分 三個里程碑，各立即入帳固定 5 點（單局最多 15 點），每個里程碑當局只發一次；達標判定在遊戲更新之後、且回合仍進行時，造成失敗的那一幀不計。獎勵與入場費無關，失敗或重新整理不扣回，結束時不另發點；`end.payout_points` 記錄本局已入帳總額。最佳紀錄存於 `deep-sea-rider-best`。里程碑門檻依原頁造型解鎖門檻設定，尚未經大量實測校準。切換遊戲或背景分頁時暫停，重新整理放棄本局、已扣點不退。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/rider/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
