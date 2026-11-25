# 莓果小蛇 Berry Trail（berry-trail）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#berry-trail`　分類：懷舊經典　狀態：顯示中
- 大廳卡片：「吃莓果長大，避開牆壁與自己的身體。」｜不限次數 · 最高分
- 追蹤名稱（GA4 `game_name`）：莓果小蛇，`game_id` 為 `berry-trail`
- 檔案：`games/berry-trail/card.html`、`games/berry-trail/cover.webp`、`games/berry-trail/game.js`、`games/berry-trail/icon.svg`、`games/berry-trail/leaderboard.webp`、`games/berry-trail/play.html`、`games/berry-trail/style.css`、`games/berry-trail/view.html`；`game.js` 共 33 行、2.5 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「莓果小蛇 Berry Trail（berry-trail）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-berry-trail`、`bt-frame`、`bt-rank-status`、`bt-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`BT`（L2）

## 函式索引（game.js，行號為宣告位置）

`btUI` L3、`btValid` L5、`btEnd` L6、`btRoute` L25

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

- L6 `btEnd`：`AN.end(BT.round,0,result,{score:score||0});`
- L15 `btEnd`：`BT.round=AN.start('berry-trail',0);`
- L20 `btEnd`：`if(btValid(source)&&BT.round)AN.progress(BT.round,{phase:'pause'},true);`
- L21 `btEnd`：`if(btValid(source)&&BT.round)AN.resume(BT.round);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`btRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

經典分類的 20×20 貪食蛇，使用者提供的莓果森林原畫面。初始長度 3，每吃一顆莓果 +10 分、身體長一格；莓果只出現在空格。撞牆或撞身體結束；未吃莓果時允許移入同時移走的尾格。不能反向、同一步最多一次轉向。吃滿棋盤最高 3970 分。速度由 155 ms／格逐漸降至 75 ms／格，使用既有排行榜 10 ms 固定模擬步長量化。

鍵盤方向鍵／KeyboardEvent.code WASD、畫面滑動與方向按鈕操作。空白鍵暫停，保留 Escape 及瀏覽器快捷鍵。背景／失焦暫停，返回手動繼續；離開大廳路由時放棄本局，返回為待機。重新開始放棄舊局再開新局。

免費、不使用錢包、不額外派發 BONUS；共用平台獎勵沿用既有 AN 流程。沿用附件儲存鍵 `berryTrailBest` 保存本機最佳分，損壞資料不清除。新增訪客榜 `berry-trail`，成績為整數分數。Worker 從種子及有效轉向重播，只接收碰撞／吃滿棋盤的合法終點。網路失敗可單機遊玩，送分失敗沿用重試；重新整理／離頁不提交未完成分數。

需先套用 `0019_game_names_berry_trail.sql` 及部署 API 驗證器，再發布前端。回復時移除入口及註冊、還原前端與 Worker，保留本機儲存及已有排行資料。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/berry-trail/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
