# 撒網 Cast Net（keno）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#keno`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「選好海域撒網，看看能命中幾格。」｜10 點起 · 選號撒網
- 追蹤名稱（GA4 `game_name`）：撒網，`game_id` 為 `keno`
- 檔案：`games/keno/card.html`、`games/keno/game.js`、`games/keno/icon.svg`、`games/keno/view.html`；`game.js` 共 103 行、5.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「8. Keno（keno）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-keno`、`ke-board`、`ke-pay-label`、`ke-pay`、`ke-amount`、`ke-random`、`ke-clear`、`ke-count`、`ke-hits`、`ke-rtp`、`ke-go`、`ke-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`KE`（L3）
- L2 常數：`KE_N`、`KE_DRAW`、`KE_MAX`

## 函式索引（game.js，行號為宣告位置）

`kSay` L5、`readKAmount` L6、`nCr` L7、`kePicks` L8、`keTables` L10、`keBuild` L24、`keUI` L32、`keClearDraw` L54、`keToggle` L55、`kePlay` L63、`reveal` L75

## 錢包與結算接點

**扣款（開始一局）**
- L72 `kePlay`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L79 `reveal`：`S.balance += pay;`

**餘額檢查**
- L68 `kePlay`：`if (a > S.balance) { kSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L72 `kePlay`：`KE.analytics=AN.start('keno',a);`
- L79 `reveal`：`AN.end(KE.analytics,pay,pay>0?'complete':'loss');`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`MIN_BET`、`reduceMotion`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`keBuild`、`keTables`、`keUI`
- `js/controls.js` 會呼叫：`kSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`KE`

## 規則摘要（取自 GAME_RULES.md）

定位：`KE`、`nCr`、`keTables`。40號中選1～10個，每局不重複開10號；預設選3、11、18、26、34。選k中h的機率為 C(k,h)×C(40-k,10-h)/C(40,10)。門檻t=max(1,round(0.3k))，低於t為0；其餘原始倍率 s×3.5^(h-t)，s將未取整期望校準到0.97。至少100取整數、至少10取一位、其餘兩位小數。依命中數自動結算。

每列依序為命中0～k個的倍率：

| 選號數k | 返還倍率（h=0 起） |
| --- | --- |
| 1 | 0, 3.88 |
| 2 | 0, 1.65, 5.79 |
| 3 | 0, 0.91, 3.18, 11.1 |
| 4 | 0, 0.55, 1.91, 6.69, 23.4 |
| 5 | 0, 0, 1.41, 4.93, 17.2, 60.4 |
| 6 | 0, 0, 0.84, 2.95, 10.3, 36.2, 127 |
| 7 | 0, 0, 0.53, 1.86, 6.5, 22.8, 79.6, 279 |
| 8 | 0, 0, 0.34, 1.21, 4.22, 14.8, 51.7, 181, 633 |
| 9 | 0, 0, 0, 0.87, 3.04, 10.6, 37.2, 130, 456, 1595 |
| 10 | 0, 0, 0, 0.57, 1.98, 6.94, 24.3, 85, 298, 1041, 3645 |

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/keno/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
