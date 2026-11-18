# 漲退 High Tide（hilo）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#hilo`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「猜下一張牌更高或更低，連猜累積。」｜10 點起 · 高低猜牌
- 追蹤名稱（GA4 `game_name`）：漲退，`game_id` 為 `hilo`
- 檔案：`games/hilo/card.html`、`games/hilo/game.js`、`games/hilo/icon.svg`、`games/hilo/view.html`；`game.js` 共 91 行、6.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「7. HiLo（hilo）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-hilo`、`hl-stage`、`hl-card`、`hl-sub`、`hl-trail`、`hl-amount`、`hl-hi`、`hl-lo`、`hl-skip`、`hl-mult`、`hl-win`、`hl-picks`、`hl-go`、`hl-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`HL`（L4）
- L2 常數：`RANKS`、`SUITS`、`HL_SKIPS`

## 函式索引（game.js，行號為宣告位置）

`hDraw` L3、`hSay` L6、`readHAmount` L7、`hName` L8、`hRed` L9、`hOpts` L11、`hTest` L17、`hMult` L18、`hUI` L19、`hStart` L44、`hGuess` L54、`hCash` L67

## 錢包與結算接點

**扣款（開始一局）**
- L48 `hStart`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L69 `hCash`：`S.balance += pay;`

**餘額檢查**
- L47 `hStart`：`if (a > S.balance) { hSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L49 `hStart`：`HL.analytics=AN.start('hilo',a);`
- L59 `hGuess`：`AN.progress(HL.analytics,{step:HL.picks});`
- L62 `hGuess`：`AN.end(HL.analytics,0,'loss',{step:HL.picks});`
- L69 `hCash`：`AN.end(HL.analytics,pay,'cashout',{step:HL.picks,multiplier:m});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`MIN_BET`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`hUI`
- 「重設為 500 點」進行中防護（`js/controls.js`）：**未涵蓋**：進行中按「重設」仍可能生效

## 規則摘要（取自 GAME_RULES.md）

定位：`HL`、`hOpts`、`hMult`、`hGuess`、`hCash`。13種牌階 A=1、K=13，花色不影響機率，抽牌可重複。raw初值1，每次猜對 raw除以該次成功機率p；返還倍率 `floor(0.97×raw×100)/100`。至少猜對一次可領回；猜錯全失。可免費跳過3次，不增加倍率。

一般牌猜高含相等，p=(14-r)/13；猜低含相等，p=r/13。端點特例：A猜高為嚴格大於、12/13；K猜高只猜相等、1/13；K猜低為嚴格小於、12/13；A猜低只猜相等、1/13。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/hilo/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
