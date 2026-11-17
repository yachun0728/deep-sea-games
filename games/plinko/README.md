# 落珠 Pearl Drop（plinko）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#plinko`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「投下珍珠，看它穿過釘陣落在哪一格。」｜10 點起 · 落點倍率
- 追蹤名稱（GA4 `game_name`）：落珠，`game_id` 為 `plinko`
- 檔案：`games/plinko/card.html`、`games/plinko/game.js`、`games/plinko/icon.svg`、`games/plinko/view.html`；`game.js` 共 133 行、7.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「3. Plinko（plinko）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-plinko`、`pk-wrap`、`pk`、`pk-amount`、`pk-risk-label`、`pk-rows-label`、`pk-max`、`pk-mid`、`pk-rtp`、`pk-last`、`pk-go`、`pk-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`P`（L3）
- L2 常數：`RISK`
- L5 常數：`MAX_BALLS`

## 函式索引（game.js，行號為宣告位置）

`pSay` L7、`readPAmount` L8、`pkLabel` L9、`pkSetup` L11、`pkUI` L24、`pkDrop` L35、`pkLand` L46、`pkResize` L52、`pkGeo` L59、`pkPoint` L66、`pkTick` L71、`pkDraw` L81

## 錢包與結算接點

**扣款（開始一局）**
- L42 `pkDrop`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L48 `pkLand`：`S.balance += pay;`

**餘額檢查**
- L38 `pkDrop`：`if (a > S.balance) { pSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L43 `pkDrop`：`analytics:AN.start('plinko',a), bet: a, k: k, bin: rights, t0: performance.now(), seg: 190 - P.rows * 6, at: …`
- L48 `pkLand`：`AN.end(b.analytics,pay,'complete',{multiplier:m});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`MIN_BET`、`C`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`pkSetup`、`pkUI`
- `js/controls.js` 會呼叫：`pSay`
- `js/navigation.js` 會呼叫：`pkResize`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`P`

## 規則摘要（取自 GAME_RULES.md）

定位：`P`、`RISK`、`pkSetup`。8／12／16 排，預設 12 排、中風險；每球單獨扣款，最多 15 球同時運行，有球時不改排數與風險。每層左右各半，終槽於投球時決定，依槽倍率自動返還。

低／中／高風險 `(c,p)` 分別為 `(0.5,2)`、`(0.4,4)`、`(0.2,6)`。n 排第 i 槽機率為 C(n,i)/2^n；d_i=(|i-n/2|/(n/2))^p，e=Σ機率×d_i，原始倍率 `c+(0.97-c)/e×d_i`。倍率至少10取整數、至少1取一位小數，其餘兩位；取整後各表期望並不完全等於0.97。

下列從最左槽列至中央，右半以中央為軸鏡像，不重複中央：

| 排數 | 風險 | 左側至中央倍率 |
| --- | --- | --- |
| 8 | low | 4.3, 2.6, 1.4, 0.74, 0.5 |
| 8 | mid | 14, 4.6, 1.2, 0.45, 0.4 |
| 8 | high | 34, 6.3, 0.74, 0.21, 0.2 |
| 12 | low | 6.1, 4.4, 3, 1.9, 1.1, 0.66, 0.5 |
| 12 | mid | 29, 14, 6.1, 2.2, 0.76, 0.42, 0.4 |
| 12 | high | 106, 36, 9.5, 1.8, 0.34, 0.2, 0.2 |
| 16 | low | 8, 6.3, 4.7, 3.4, 2.4, 1.6, 0.97, 0.62, 0.5 |
| 16 | mid | 51, 30, 16, 8.1, 3.6, 1.4, 0.6, 0.41, 0.4 |
| 16 | high | 239, 108, 43, 14, 3.9, 0.87, 0.26, 0.2, 0.2 |

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/plinko/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
