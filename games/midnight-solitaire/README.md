# 夜航經典接龍 Midnight Klondike（midnight-solitaire）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#midnight-solitaire`　分類：益智策略　狀態：顯示中
- 大廳卡片：「搭上夜航列車，紅黑交錯接牌，四種花色依序收 A→K。」｜立即開玩 · 七欄經典接龍
- 追蹤名稱（GA4 `game_name`）：夜航經典接龍，`game_id` 為 `midnight-solitaire`
- 檔案：`games/midnight-solitaire/card.html`、`games/midnight-solitaire/cover.webp`、`games/midnight-solitaire/game.js`、`games/midnight-solitaire/icon.svg`、`games/midnight-solitaire/leaderboard.webp`、`games/midnight-solitaire/style.css`、`games/midnight-solitaire/view.html`；`game.js` 共 2 行、0.1 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「67. 夜航經典接龍 Midnight Klondike（midnight-solitaire）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-midnight-solitaire`、`ks-window`、`ks-info`、`ks-time`、`ks-moves`、`ks-home`、`ks-message`、`ks-rack`、`ks-table`、`ks-undo`、`ks-hint`、`ks-restart`、`ks-ranking`、`ks-cover`、`ks-result`、`ks-result-rank`、`ks-go`、`ks-help`、`ks-help-title`、`ks-board-list`、`ks-entries`、`ks-rank-status`、`ks-rank-retry`、`ks-help-close`、`ks-confirm`、`ks-confirm-yes`、`ks-confirm-no`

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

52 張、不含鬼牌；七欄初始牌數 1–7，各只翻開最後一張，牌堆剩 24 張。每次翻一張，可循環重翻；桌面牌由大到小、紅黑交錯，同樣連續的一串可一起搬；空欄僅可放 K。四個收牌格依花色從 A 到 K，收齊 52 張才通關。收牌格的最上張可移回桌面。可悔棋（保留最近 400 步）、提示與重發；重發或退出會結束原局，未通關不列榜。無保證每副隨機牌都有解，卡住時可重發。

免費、無點數收費或 BONUS。規則在 shared/solitaire-rules.cjs。專用本機 Key `deep-sea-midnight-solitaire-time-best-v1` 保存本機最快毫秒；不遷移其他資料。時間榜 `midnight-solitaire-time`，伺服器核對合法操作、所有權與完整通關，用伺服器時鐘決定毫秒。每局限兩小時、最多 4096 次輸入；超過限制或離線仍可練習，會明示不列榜。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/midnight-solitaire/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
