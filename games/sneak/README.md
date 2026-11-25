# 偷偷下班 Sneak Out（sneak）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#sneak`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「按住偷溜，老闆回頭前趕快裝忙。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：偷偷下班，`game_id` 為 `sneak`
- 檔案：`games/sneak/card.html`、`games/sneak/cover.webp`、`games/sneak/game.js`、`games/sneak/icon.svg`、`games/sneak/leaderboard.webp`、`games/sneak/style.css`、`games/sneak/view.html`；`game.js` 共 395 行、20.2 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「15. Sneak（sneak）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-sneak`、`sk-canvas`、`sk-stage`、`sk-progress`、`sk-best`、`sk-next`、`sk-signal`、`sk-difficulty`、`sk-amount`、`sk-go`、`sk-hold`、`sk-msg`、`sk-rank-status`、`sk-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`sneakBusy`（L2）
- L7 常數：`MILESTONES`、`ENDLESS_FROM`、`ENDLESS_STEP`、`ENDLESS_BONUS`

## 函式索引（game.js，行號為宣告位置）

`bonusAt` L8、`nextMilestone` L9、`T` L11、`saySneak` L17、`remember` L18、`setHold` L19、`release` L22、`ui` L23、`die` L54、`award` L63、`nextStage` L64、`update` L73、`sync` L79、`start` L83、`sprite` L103、`drawSneakLeg` L111、`drawWalkCycle` L145、`drawSneakingPlayer` L153、`drawCoworker` L173、`routeX` L194、`drawCover` L195、`drawGuard` L214、`drawBoss` L248、`drawHallway` L283、`draw` L288、`press` L383、`lift` L384、`loop` L391

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L63 `award`：`S.balance+=b;`

**餘額檢查**
- L86 `start`：`if(amount>S.balance){saySneak(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L56 `die`：`AN.end(sneakAnalytics,earned,earned>0?'complete':'loss',{stage:sneaking.lv,progress_percent:Math.floor(sneakR…`
- L63 `award`：`AN.progress(sneakAnalytics,{stage:n,bonus_points:b});`
- L65 `nextStage`：`AN.progress(sneakAnalytics,{stage:done},true);`
- L70 `nextStage`：`AN.resume(sneakAnalytics,{stage:sneaking.lv});`
- L89 `start`：`sneakAnalytics=AN.start('sneak',amount);`
- L91 `start`：`AN.resume(sneakAnalytics,{stage:sneaking.lv});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `sneak`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：按住畫面、前進按鈕、空白鍵、右方向鍵或 D 前進，放開裝忙。抵達出口就進入下一關，沒有關卡上限。第一關直接從辦公區開始，第二關起先走過捲動的入口走廊。第二關入口長 180 個畫布單位，之後每關加 18 單位，移動速度為每秒 64 單位。進入辦公區後，老闆、同事與保全才開始各自的行動。辦公區第一關需要累積移動 6 秒，第二關 11 秒，第三至第七關每關多 4 秒，第八關起每關多 1 秒。進度條包含走廊和辦公區。

第二關有一位同事經過，第三關兩次，第四關起通常三次，巡經位置隨關卡輪替；部分第十二關以後的配置有四次。到達該關巡經位置後，同事以黃色驚嘆號預告 0.95 秒，接著紅色 0.65 秒，繼續走就被發現；其後 0.55 秒離場，可以前進。第三關開始，主管在玩家進入辦公區後走回座位，坐下時先給回頭警示。第五關起每兩次回頭後會離座並走回來。走動期間主管不判定抓人，其餘警示、假警示、直接回頭和反應時間沿用原規則。離開或切到背景時釋放移動。

第五關起，站在檔案櫃後可擋老闆的視線，仍須留意同事。第八關起保全來回巡邏，折返時暫停照射；被光束掃到時繼續移動會被發現。第十二關起輪替三種遮蔽物、保全路徑及同事巡經配置。

里程碑按通過關數計，點數當場入帳：9 關 +3、11 關 +7、13 關 +15、16 關 +30，之後每多 3 關 +40。

訪客榜依終局通過關數排行。Worker 依種子與回合規則版本重播按住及放開。舊對局沿用舊版距離與主管判定，新版會驗證同事巡經。單局超過十分鐘可繼續遊玩，該局轉為本機成績。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/sneak/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
