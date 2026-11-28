# 星軌新接龍 Orbit FreeCell（orbit-freecell）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#orbit-freecell`　分類：益智策略　狀態：顯示中
- 大廳卡片：「太空維修站裡，運用四個暫存格調度全明牌，四花色收 A→K。」｜立即開玩 · 四格暫存新接龍
- 追蹤名稱（GA4 `game_name`）：星軌新接龍，`game_id` 為 `orbit-freecell`
- 檔案：`games/orbit-freecell/card.html`、`games/orbit-freecell/cover.webp`、`games/orbit-freecell/game.js`、`games/orbit-freecell/icon.svg`、`games/orbit-freecell/leaderboard.webp`、`games/orbit-freecell/style.css`、`games/orbit-freecell/view.html`；`game.js` 共 2 行、0.1 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「68. 星軌新接龍 Orbit FreeCell（orbit-freecell）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-orbit-freecell`、`fc-window`、`fc-info`、`fc-time`、`fc-moves`、`fc-home`、`fc-message`、`fc-rack`、`fc-table`、`fc-undo`、`fc-hint`、`fc-restart`、`fc-ranking`、`fc-cover`、`fc-result`、`fc-go`、`fc-help`、`fc-help-title`、`fc-board-list`、`fc-entries`、`fc-rank-status`、`fc-rank-retry`、`fc-help-close`、`fc-confirm`、`fc-confirm-yes`、`fc-confirm-no`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）

## 函式索引（game.js，行號為宣告位置）

（沒有偵測到具名函式）

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- （沒有偵測到 `AN.*` 呼叫）

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：（無）（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

52 張全明牌，八欄輪流發牌，前四欄各 7 張、後四欄各 6 張。四個暫存格各放一張；桌面由大到小、紅黑交錯，空欄可放任意牌。同時搬運一串牌最多 `(空暫存格 + 1) × 2^可用空欄` 張；目的地空欄不計入可用空欄。四個收牌格按花色收 A→K，收齊 52 張通關。無抽牌堆，允許悔棋、提示、重發；不保證每副隨機牌都能解。

免費、無 BONUS，不操作錢包。專用本機 Key `deep-sea-orbit-freecell-time-best-v1`；時間榜 `orbit-freecell-time`，與夜航同樣只接受完整合法通關，以伺服器毫秒計時、較快在前；同時間以較早紀錄及既有穩定排序為準。

### 三款接龍的時間榜與顯示名稱

人魚蜘蛛接龍／夜航經典接龍／星軌新接龍在手機頂部常駐完整名稱與玩法標籤、ⓘ。封面只使用 Mermaid Spider／Midnight Klondike／Orbit FreeCell 英文。三款的計時在看說明、悔棋、切到背景時持續；同一遊戲各訪客只留最快紀錄，各榜最多 50 人。網路失敗可重送同一回合、不重複記時或入榜；無法驗證時只算練習。

人魚原本 1／2／4 花色分數與獎勵規則不變，三個新時間榜只收 8 組全完成的局，不再把中途分數當時間名次。舊 `deep-sea-mermaid-best`、舊分數榜與舊分享資料保留，介面將舊最佳分數明標為「舊版最高分」。時間榜與既有 GA4 有效遊玩時間分開計算，沒有更改 GA4 原事件或共用點數經濟。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/orbit-freecell/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
