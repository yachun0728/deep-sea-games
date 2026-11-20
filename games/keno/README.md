# 挖金礦 Gold Digger（keno）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#keno`　分類：每日補給　狀態：顯示中
- 大廳卡片：「挖金礦拿點數，再去挑戰喜歡的小遊戲。」｜不限次數 · 台灣時間午夜重置
- 追蹤名稱（GA4 `game_name`）：挖金礦，`game_id` 為 `keno`
- 檔案：`games/keno/card.html`、`games/keno/game.js`、`games/keno/icon.svg`、`games/keno/style.css`、`games/keno/view.html`；`game.js` 共 76 行、7.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「8. Keno（keno）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-keno`、`ke-board`、`ke-free`、`ke-earned`、`ke-left`、`ke-score`、`ke-best`、`ke-go`、`ke-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`KE`（L3）
- L2 常數：`KE_N`、`KE_DIGS`、`KE_DAILY_KEY`
- L5 常數：`KE_ORES`

## 函式索引（game.js，行號為宣告位置）

`kSay` L6、`keDay` L7、`keRead` L8、`keStore` L15、`keLocked` L16、`run` L17、`keArt` L21、`keBuild` L26、`keSync` L31、`keUI` L41、`kePlay` L52、`keDig` L57

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L63 `keDig`：`S.balance+=bonus;`

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L32 `keSync`：`AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});`
- L36 `keSync`：`KE.analytics=AN.start('keno',0);`
- L39 `keSync`：`AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});`
- L65 `keDig`：`AN.progress(KE.analytics,{step:KE.digs,score:KE.score,bonus_points:bonus,total_bonus_points:KE.earned});`
- L66 `keDig`：`AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});`
- L73 `keDig`：`if(!e.persisted&&KE.active)AN.end(KE.analytics,KE.earned,'abandoned',{step:KE.digs,score:KE.score});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-gold-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`syncBalance`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/bootstrap.js` 會呼叫：`keBuild`、`keUI`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

挖金礦，每日免費補給。定位：`KE`、`keDay`、`keRead`、`keLocked`、`kePlay`、`keDig`。不扣入場費，台灣時間每日免費3次，每次5格，開局即消耗1次。6×6礦區固定18石頭（0點）、10銅礦（2點）、6金礦（3點）、2鑽石（5點），每次洗牌。挖到當下入帳，每日最多30點；臨近上限只發剩餘額度，達上限提前完成當次且當日不能再開。無付費加挖、下注或倍率。每次最多5個不同格子，重點不重發。分數沿用0／10／30／60，與錢包點數分開；最佳分數Key保持 `deep-sea-gold-best`。新增 `deep-sea-gold-daily-v1` 保存 `{day,plays,earned,round}`，round含layout與open，可重新整理接續同一次剩餘機會，不補發已發點數。午夜尚未挖完的舊日回合到期，已得點數不收回；恢復頁面或最晚30秒刷新日期提示。Web Locks可用時序列化同瀏覽器跨分頁操作；無支援時採同步操作。紀錄僅限本瀏覽器，清除儲存、調整系統時間或另用裝置仍可影響限制，不宣稱帳戶級防作弊。儲存異常時停止開局／發點，不重設玩家資料。每筆先保存消耗與配額再存錢包，突然中斷可能少發該筆，不會藉重新整理重發；無伺服器交易保證。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/keno/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
