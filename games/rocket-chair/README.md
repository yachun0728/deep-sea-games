# 社畜要下班 Roar Through the Ceiling（rocket-chair）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#rocket-chair`　分類：時機操作　狀態：顯示中
- 大廳卡片：「對著手機大吼，火箭椅一路撞破天花板提早下班。」｜免費遊玩 · 不限次數
- 追蹤名稱（GA4 `game_name`）：社畜要下班，`game_id` 為 `rocket-chair`
- 檔案：`games/rocket-chair/card.html`、`games/rocket-chair/game.js`、`games/rocket-chair/icon.svg`、`games/rocket-chair/original.html`、`games/rocket-chair/style.css`、`games/rocket-chair/view.html`；`game.js` 共 40 行、2.2 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「25b. 社畜要下班 Roar Through the Ceiling（rocket-chair）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-rocket-chair`、`rocket-chair-msg`、`rocket-chair-frame`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L3 常數：`ROCKET`
- L4 常數：`ROCKET_FREE_KEY`

## 函式索引（game.js，行號為宣告位置）

`rocketFreeLeft` L5、`rocketUI` L6、`rocketValid` L7、`rocketRoute` L35

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L13 `rocketValid`：`if(S.balance<fee){rocketUI(LOW_MSG);`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L16 `rocketValid`：`ROCKET.analytics=AN.start('rocket-chair',fee,free?{entry_kind:'free_pass'}:undefined);`
- L24 `rocketValid`：`AN.progress(ROCKET.analytics,{phase:'free_coffee',extra_points:0});`
- L30 `rocketValid`：`AN.end(ROCKET.analytics,0,'complete',{score:early,cleared:data&&data.cleared?1:0,extra_spent_points:ROCKET.ex…`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`rocketRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/rocket-chair/original.html`（獨立子頁，以 iframe `src` 載入，圖片在 `games/rocket-chair/assets/`）、`games/rocket-chair/game.js` 的 `ROCKET`、`deepSeaRocket`。子頁可單獨開啟（自己讀寫同一個餘額 Key），嵌入大廳時扣點與 GA4 交給父頁；iframe 需 `allow="microphone"`。

玩法：對著手機大吼，音量換成火箭椅推力往上飛；短而突然的大吼觸發衝刺，速度夠快才撞破天花板。共 5 層（業務部、財務部、會議室、茶水間、頂樓前），18:00 主管會議結束前衝出頂樓就過關，提早的分鐘數就是成績。另有小聲模式（哼歌就能飛）與按住螢幕模式。麥克風只在遊玩中開啟，切到背景或大廳別的分頁就關閉並暫停。

點數：選好模式開局時父頁 `start` 扣固定10點並送 game_start；看過示範廣告的30分鐘內（`deep-sea-free-until`）不扣點。會議時間用完可：用30點買特濃咖啡（父頁 `spend`，送 `game_progress` 的 `phase=buy_coffee`）、看5秒示範廣告延長20秒（每局1次），或放棄。結算只送一次 `finish`，game_end 為 complete、payout_points=0，附 `score`（提早分鐘數）、`cleared`、`extra_spent_points`。沒有點數返還，重新整理放棄回合、不退款。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/rocket-chair/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
