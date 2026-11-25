# 蓋樓大師 Sky Builder（skybuilder）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#skybuilder`　分類：時機操作　狀態：顯示中
- 大廳卡片：「抓準時機疊樓層，蓋得挑戰高度紀錄，享有 BONUS 獎勵。」｜立即開玩 · 高度挑戰
- 追蹤名稱（GA4 `game_name`）：蓋樓大師，`game_id` 為 `skybuilder`
- 檔案：`games/skybuilder/card.html`、`games/skybuilder/cover.webp`、`games/skybuilder/game.js`、`games/skybuilder/icon.svg`、`games/skybuilder/leaderboard.webp`、`games/skybuilder/style.css`、`games/skybuilder/view.html`；`game.js` 共 191 行、13.9 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「20. Sky Builder（skybuilder）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-skybuilder`、`sb-canvas`、`sb-floors`、`sb-score`、`sb-best`、`sb-amount`、`sb-pay`、`sb-next`、`sb-go`、`sb-msg`、`sb-rank-status`、`sb-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`A`（L6）、`sbBusy`（L2）
- L4 常數：`DPR`、`BASE`
- L7 常數：`SPR`、`SKY`、`GND`
- L12 常數：`MILESTONES`、`BONUS`
- L80 常數：`MOBILE`
- L112 常數：`GAP`

## 函式索引（game.js，行號為宣告位置）

`ok` L8、`spr` L10、`rnd` L16、`floors` L18、`hook` L19、`burst` L21、`say` L22、`setText` L24、`ui` L25、`end` L32、`awardBonus` L42、`update` L53、`floor` L76、`roof` L77、`fit` L81、`scene` L82、`crane` L90、`pill` L104、`num` L105、`meter` L107、`hud` L109、`wrapLines` L120、`block` L122、`lh` L124、`draw` L128、`start` L159、`act` L171、`loop` L184

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L47 `awardBonus`：`S.balance+=BONUS;`

**餘額檢查**
- L162 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L36 `end`：`AN.end(analytics,paid,'loss',{score:tower.sc,floors:n,total_bonus_points:paid});`
- L48 `awardBonus`：`AN.progress(analytics,{step:n,score:tower.sc,floors:n,milestone,bonus_points:BONUS,total_bonus_points:paid});`
- L166 `start`：`analytics=AN.start('skybuilder',amount);`
- L182 `act`：`AN.end(analytics,paid,'abandoned',{score:tower.sc,floors:floors(),total_bonus_points:paid});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-skybuilder-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`sbBusy` 所在 IIFE（改編自使用者提供的 TowerBuilding.html，已移除多語切換，僅繁中）。起重機吊著樓層擺盪，點畫面／空白鍵／↓ 放下。落點偏差 a 像素評級：≤4 Perfect、≤12 Great、≤24 Good、≤38 Average、≤56 Poor、其餘 Fail（失手，直接結束）。分數 `100/70/50/30/10`，連續 Perfect 另加 `25×(連擊-1)`；偏差使樓傾斜 `+d×0.34`度，Perfect 回正 4°、Great 回正 1.5°，傾斜超過 45° 倒塌。分數只供比較，不入帳。

顯示層數 floors＝已疊成的樓層數（不含地基）。每局固定入場 10 點；穩定達到 10、20、30 層，各立即送固定 BONUS 5 點，每個門檻當局只發一次，最多 15 點；造成倒塌的樓層不計獎勵。沒有下注、返還倍率或領回，獎勵不依入場費計算。失手／倒塌結束不另入帳，也不扣回已得獎勵。最佳層數沿用 `deep-sea-skybuilder-best`。切換遊戲或背景分頁時暫停；重新整理放棄本局，已扣點不退、已入帳獎勵保留。大廳貼上「✦ BONUS」。

訪客榜以終局樓層數排名。Worker 重播吊鉤放手、堆疊、傾斜及倒塌。 最多驗證十分鐘的遊戲時間。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/skybuilder/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
