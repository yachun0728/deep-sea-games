# 橫渡 Reef Run（crossing）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#crossing`　分類：機率挑戰　狀態：已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）
- 大廳卡片：「帶小海龜穿越暗流，決定何時收手。」｜10 點起 · 逐步闖關
- 追蹤名稱（GA4 `game_name`）：橫渡，`game_id` 為 `crossing`
- 檔案：`games/crossing/card.html`、`games/crossing/game.js`、`games/crossing/icon.svg`、`games/crossing/view.html`；`game.js` 共 86 行、6.2 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「11. Crossing（crossing）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-crossing`、`cr-stage`、`cr-lanes`、`cr-sub`、`cr-amount`、`cr-diff-label`、`cr-step`、`cr-mult`、`cr-p`、`cr-pos`、`cr-go`、`cr-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`CR`（L3）
- L2 常數：`CR_LANES`、`CR_P`
- L5 常數：`SVG_TURTLE`
- L6 常數：`SVG_RIP`

## 函式索引（game.js，行號為宣告位置）

`rSay` L7、`readCAmount` L8、`crMult` L9、`crUI` L10、`crStart` L37、`elCStage` L48、`crCash` L49、`crStep` L55

## 錢包與結算接點

**扣款（開始一局）**
- L42 `crStart`：`S.balance -= a;`

**入帳（領回／獎勵）**
- L51 `crCash`：`S.balance += pay;`

**餘額檢查**
- L40 `crStart`：`if (a > S.balance) { rSay('餘額不足，請調低下注或重設點數。', 'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L43 `crStart`：`CR.analytics=AN.start('crossing',a);`
- L51 `crCash`：`AN.end(CR.analytics,pay,'cashout',{step:CR.pos,multiplier:m});`
- L58 `crStep`：`AN.end(CR.analytics,0,'loss',{step:CR.failAt});`
- L62 `crStep`：`AN.progress(CR.analytics,{step:CR.pos});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`fmt`、`fx`、`MIN_BET`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`crUI`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`CR`。共12步；單步安全機率 easy=.92、mid=.85（預設）、hard=.75、extreme=.6。開始時抽出失敗步數。過k步倍率 `floor(0.97/p^k×100)/100`；成功一步後可領回，失敗全失，第12步自動領回。各步倍率：

| 難度 | 第1～12步 |
| --- | --- |
| easy | 1.05, 1.14, 1.24, 1.35, 1.47, 1.59, 1.73, 1.89, 2.05, 2.23, 2.42, 2.63 |
| mid | 1.14, 1.34, 1.57, 1.85, 2.18, 2.57, 3.02, 3.55, 4.18, 4.92, 5.79, 6.81 |
| hard | 1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26, 9.68, 12.91, 17.22, 22.96, 30.62 |
| extreme | 1.61, 2.69, 4.49, 7.48, 12.47, 20.79, 34.65, 57.75, 96.25, 160.42, 267.36, 445.61 |

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/crossing/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
