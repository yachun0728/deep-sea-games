# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「抱著八音盒夜逃，聽聲辨位躲開走廊裡的東西，燈滅前蓋住螢幕。」｜免費遊玩 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 581 行、53.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「34. 別看 Don’t Peek（peek）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-peek`、`peek-canvas`、`peek-prog`、`peek-spirits`、`peek-best`、`peek-lvl`、`peek-lives`、`peek-codex`、`peek-dodges`、`peek-level`、`peek-seed`、`peek-daily`、`peek-amount`、`peek-go`、`peek-dex`、`peek-share`、`peek-gyro`、`peek-msg`、`peek-assist`、`peek-lowscare`、`peek-caps`、`peek-vol-amb`、`peek-vol`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L15）、`ART`（L20）、`HP`（L336）、`peekBusy`（L2）
- L5 常數：`SPRINT_GAP`
- L6 常數：`BASE_RATE`、`WIND_RATE`
- L7 常數：`MILE_EVENTS`、`MILE_REWARD`、`WIN_REWARD`
- L8 常數：`FIRST_GAP`
- L9 常數：`GAP_NEAR`、`GAP_FAR`、`BREATH_EVERY`、`BREATH_EXTRA`
- L10 常數：`UNLOCK_TWINS`、`UNLOCK_WALKER`
- L11 常數：`EASY_EYES`、`EYE_EASY_WARN`
- L12 常數：`SOUND_LEAD`
- L13 常數：`DIRECTOR_AT`、`DIRECTOR_P`
- L14 常數：`TILT_SPEED`
- L15 常數：`EYE`
- L16 常數：`TWIN`
- L17 常數：`WALK`
- L18 常數：`TYPES`
- …另有 28 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`art` L21、`R` L35、`rnd` L37、`clamp` L38、`tx` L39、`RR` L40、`mulberry` L55、`deathsOf` L56、`levelCfg` L57、`wpick` L68、`wantLevel` L72、`sv` L76、`mark` L77、`applyLevel` L78、`reset` L93、`audioInit` L97、`tone` L98、`say` L104、`setText` L106、`ui` L107、`fx` L114、`end` L115、`pay` L135、`pickPool` L140、`startEvent` L143、`nextGap` L160、`survive` L165、`inputs` L171、`update` L174、`lampLevel` L212、`cxy` L218、`giveItem` L219、`spawnDrop` L224、`collect` L225、`updateDrops` L226、`canPick` L234、`startCamp` L235、`updateCamp` L236、`campTap` L242、`onMotion` L245、`optSave` L249、`drawWorld` L260、`one` L264、`sprite` L270、`floatImg` L271、`blob` L272、`drawSpirits` L273、`drawDrops` L299、`drawCamp` L307、`wrapLines` L326、`txp` L327、`txd` L328、`drawButtons` L329、`hpRect` L337、`hpClick` L340、`drawHeadphone` L345、`capText` L352、`hud` L353、`btnRow` L391、`deathClick` L394、`doAct` L398、`later` L405、`playCue` L406、`shareText` L414、`share` L415、`shareCard` L419、`drawDeath` L432、`drawWon` L452、`dexPos` L476、`txl` L478、`drawDex` L479、`dexClick` L497、`practiceStart` L505、`draw` L506、`start` L534、`shown` L544、`region` L545、`syncPtrs` L549、`upPtr` L558、`clearInput` L567、`onOrient` L572、`go` L576、`loop` L578

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L137 `pay`：`S.balance+=n;`

**餘額檢查**
- L537 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L129 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p,level:lvl,seed:seedCode…`
- L138 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L539 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）
- `deep-sea-peek-dodges`（寫、讀）
- `deep-sea-peek-opts`（寫、讀）
- `deep-sea-peek-save`（寫、讀）
- `deep-sea-peek-scrolls`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`peekBusy` 所在 IIFE，內含完整遊戲邏輯。設計依據《聽見就躲》v0.5 整合草案（遊戲名維持「別看 Don’t Peek」）。畫布 800×450 橫式、第一人稱：玩家自動往出口跑（基礎速度由關卡決定；按住「衝刺」變兩倍快），進度到 100% 過關。只在 `view-peek` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停（並清空按鍵與觸控狀態）。

- 入場：免費（`ENTRY_FEE` 目前為 0）；按「免費開始」呼叫 `AN.start('peek')`，進行中按鈕停用。
- 模式：關卡欄 `peek-level`（`data-lv="1"`）填 1–100 為關卡模式（只能選已解鎖的關），填 0 為「自由跑」（沒有生命與關卡，舊版規則：依本局躲過次數登場、85% 導演突襲、每 20% 營火）。測試用 `forceLvl` 蓋過輸入欄；沒有 `data-lv` 的環境視為自由跑。
- 100 關、五個世界各 20 關（`WORLD_BASE` 1.00／1.15／1.30／1.45／1.60；背景森林、墓地、沼澤、雪原、火山）。每十關節奏 `RHYTHM`：第 1 關安全緩衝 0.65、2–4 學新鬼 0.80–0.90、5 緩衝或低壓複習 0.65（十關區段單雙輪替）、6–8 混合 0.95–1.05、9 高峰 1.20、10 首領 1.00；世界內第 11–20 關整體 ×1.10。難度 D＝世界底線 × 節奏 × 加成，`t=(D−0.65)/1.45` 夾在 0–1，換算：襲擊次數 `round(2+6t)`（安全 0、複習 1、學新鬼 3、首領＝已學鬼數＋1）、襲擊間隔 `8−5t` 秒、前兆倍率 `1.25−0.65t`（下限 `WARN_FLOOR`：葉下客 1.6、敲枝者 1.4、靜林鬼 3.5、逆風客 1.6 秒）、一關約 30～70 秒。學新鬼關前兆再加 0.6 秒。
- 鬼：葉下客 `eye`（落葉聚在一側，紅光時往反方向傾斜 ≥0.5，暴露超過 0.35 秒即死）、敲枝者 `twins`（鳥群飛走後一側敲擊，往敲擊方向傾斜 >0.3 即死，判定 1.5 秒內要往反方向傾斜 ≥0.6）、靜林鬼 `walker`（蟲鳴停、燈閃三下，熄滅前蓋住並保持不動 4 秒）、逆風客 `gale`（風向反、拖行聲從一側靠近，判定 2 秒內要往來源側傾斜 ≥0.5，累計不足超過 0.35 秒即死）、首領空殼 `hollow`（＝`walker` 加 `boss` 旗標，判定 6.4 秒）。登場關：葉下客第 2 關、敲枝者第 3 關、靜林鬼第 4 關、逆風客第 12 關；學新鬼關只出現該鬼，其他關從已學的鬼加權抽（最新 ×2、死最多次 ×1.5、不連續同種）。每十關第 10 關是首領關：依序出現已學的鬼，最後是空殼，固定種子。
- 假前兆：第 15 關起，一般／混合／高峰關每次襲擊有 `0.15t` 機率只是虛驚（前兆結束後消失、不算躲過、不扣 `left`）。連續襲擊：第 25 關起，躲過後有 `0.35t` 機率 1.4 秒後立刻再來一次。安全緩衝關只會在 45% 時出現一次無害的假前兆。
- 世界規則：墓地濃霧縮小視野、沼澤聲音變悶（效果音 ×0.7）、雪原靠邊速度 ×0.7、火山畫面輕微晃動（低驚嚇模式關閉）。
- 生命與存檔：3 條命（上限 5）。關卡內死亡扣 1 命並在同一關重來；命用完回到存檔點（`ck`，打倒首領後設為下一關）並回復 3 命。首領通關 +1 命並存檔；營火停留 3 秒補 1 命，每十關最多一次（`healTen`）。同一關累計死 2 次後，下次重試前兆 +0.3 秒、襲擊少 1 次，畫面明確告知，`AN.end` 帶 `retry_assist`。
- 種子：第 1、10 關固定種子（`關卡×7919+101`）；其他關每次隨機，種子碼（36 進位）顯示在畫面右下與結果卡，可在 `peek-seed` 輸入重玩；`peek-daily` 勾選時用當天日期當種子。同一種子的鬼種、方向、掉落都相同。
- 道具：路邊掉落火把（下次襲擊前兆 +0.6 秒並標出方向，上限 3）、護身符（擋下一次致命失誤，上限 2）、舊卷軸（收藏，存 `deep-sea-peek-scrolls`，集滿 3 卷營火旁掛骷髏燈籠）；Nib 每關約 2% 機率跑過，給 1 卷軸。連續 3 關沒有掉落，下一關在 8% 進度後必掉（連續 6 關則掉護身符）。營火（第 5 關 50% 處；自由跑每 20%）三選一，旅人 Rook 在旁；撿取靠近 30% 深度內可按 F／「撿」／搖手機。
- 操作：電腦 `W` 衝刺、`A`／`D` 靠邊、空白鍵蓋住、`F` 撿、營火按 `1`～`3`；手機用畫布下方五顆按鈕（靠左、靠右、蓋住、衝刺、撿，多點觸控）。「啟用體感」為選用（`deviceorientation` 的 gamma 當左右、`|beta|>145` 當螢幕朝下、`devicemotion` 搖動撿東西；iOS 需使用者授權）。
- 死亡教學：結果畫面顯示死因、規則、小螢提示與按鈕（立刻重試、再聽一次、看鬼圖鑑、稍後再學；同種死 3 次起多一顆「開輔助標記」）。第 1 次完整說明規則，第 2 次聚焦差異，第 3 次起建議輔助與練習。鬼圖鑑 12 格（5 隻鬼、小螢、旅人、Nib、火把、護身符、舊卷軸、骷髏燈籠），遇見後解鎖線索／判斷／應對，可「聽一次」與「練習」（練習不扣命、不計死因、不發點）。
- 無障礙：首次進入先做耳機檢查（可試聽左右聲道）；選項有輔助標記（顯示危險側與安全側）、字幕方向、低驚嚇（降低閃光與震動）、環境音量與音效音量分開。選項存 `deep-sea-peek-opts`。
- 結束：死亡或進度 100%。`AN.end` 只呼叫一次，payout 為本局已入帳 BONUS；附 `level`、`seed`。
- BONUS（固定點數）：躲過 2 次襲擊 +2、通關 +5，每項每局一次；關卡模式只有該關第一次通關才發（重玩已過的關和練習都不發）；自由跑照舊每局可發。每局最多 7 點。分數、最佳進度（只計自由跑）、死因圖鑑 X / 7（`CAUSES`）、累計躲過只顯示。
- 儲存：`deep-sea-peek-save`（最高解鎖關、存檔點、生命、無掉落關數、補命區段、各關死亡數、圖鑑）、`deep-sea-peek-best`、`deep-sea-peek-deaths`、`deep-sea-peek-dodges`、`deep-sea-peek-scrolls`。
- 分享：結束畫面「分享結果卡」複製一句結果文字並下載 1200×630 的 PNG 結果卡，不自動發文。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目。
- 尚未做：多世界各自專屬的鬼（目前五個世界共用 4 隻鬼＋空殼）、三連襲擊、藏身點互動、Nib 專用圖、正式配樂、圖鑑的場景片段與音訊樣本、生成後 1000 次機器人可解率驗證。以上數值皆為初始假設，需真人試玩校正。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
