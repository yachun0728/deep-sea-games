# 行人地獄 Just Want Boba（pedestrian-hell）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#pedestrian-hell`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「騎樓被占滿，只好走馬路。看你能喝到幾杯珍奶！」｜不限次數 · 喝到幾杯
- 追蹤名稱（GA4 `game_name`）：行人地獄，`game_id` 為 `pedestrian-hell`
- 檔案：`games/pedestrian-hell/card.html`、`games/pedestrian-hell/cover.webp`、`games/pedestrian-hell/game.js`、`games/pedestrian-hell/icon.svg`、`games/pedestrian-hell/leaderboard.webp`、`games/pedestrian-hell/play.html`、`games/pedestrian-hell/style.css`、`games/pedestrian-hell/view.html`；`game.js` 共 33 行、2.6 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「53. 行人地獄（pedestrian-hell）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-pedestrian-hell`、`ph-frame`、`ph-rank-status`、`ph-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`PH`（L2）

## 函式索引（game.js，行號為宣告位置）

`phUI` L3、`phValid` L5、`phEnd` L6、`phRoute` L25

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

- L6 `phEnd`：`AN.end(PH.round,0,result,{score:score||0});`
- L15 `phEnd`：`PH.round=AN.start('pedestrian-hell',0);`
- L20 `phEnd`：`if(phValid(source)&&PH.round)AN.progress(PH.round,{phase:'pause'},true);`
- L21 `phEnd`：`if(phValid(source)&&PH.round)AN.resume(PH.round);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`phRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

- 免費遊玩，不扣點、沒有 BONUS、沒有任何博弈元素。英文名 Just Want Boba。
- 目標：每杯走 50 步到珍奶店，買到後休息 1.8 秒換下一條路。被車撞到（含倒車機車）就結束；開局滿 570 秒「珍奶店打烊」也結束，確保整局在排行榜重播上限內。
- 操作：點一下往前；滑動左右閃、往下後退；鍵盤方向鍵或 WASD，空白鍵暫停。切到背景或回大廳自動暫停。
- 難度：第 2～6 杯逐杯提高車速（每杯 +9%）、縮短出車間隔與停車路段空檔、騎樓更擠、倒車預告更短，並增加倒車機車與黑狗；第 6 杯之後維持相同難度。
- 地圖一定留有可走的路。路邊停車路段內側車道停止出車，玩家走外側車道抓空檔。黑狗讓位、垃圾車鄰居只暫時堵路，不會讓人出局；貓路過不擋路。
- 排行榜分數＝買到的杯數（不另計步數或時間），同杯數依伺服器紀錄時間排序。
- 規則在 `shared/pedestrian-hell-rules.cjs`（瀏覽器與 Worker 共用，固定 10 毫秒步進，出車位置固定用 15.5 列，不隨螢幕高度改變）。
- 本機最佳紀錄：`pedestrianHellBestCups`。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/pedestrian-hell/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
