# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「抱著八音盒夜逃，聽聲辨位躲開走廊裡的東西，點對牠怕的道具。」｜立即開玩 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 909 行、106.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「34. 別看 Don’t Peek（peek）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-peek`、`peek-canvas`、`peek-fsx`、`peek-prog`、`peek-spirits`、`peek-best`、`peek-lvl`、`peek-lives`、`peek-codex`、`peek-dodges`、`peek-level`、`peek-seed`、`peek-daily`、`peek-amount`、`peek-go`、`peek-dex`、`peek-share`、`peek-full`、`peek-gyro`、`peek-msg`、`peek-assist`、`peek-lowscare`、`peek-caps`、`peek-vol-amb`、`peek-vol`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L16）、`BOG`（L20）、`ART`（L26）、`BP`（L74）、`HP`（L557）、`peekBusy`（L2）
- L4 常數：`MINSZ`
- L7 常數：`BASE_RATE`
- L8 常數：`MILE_EVENTS`、`MILE_REWARD`、`WIN_REWARD`
- L9 常數：`FIRST_GAP`
- L10 常數：`GAP_NEAR`、`GAP_FAR`、`BREATH_EVERY`、`BREATH_EXTRA`
- L11 常數：`UNLOCK_TWINS`、`UNLOCK_WALKER`
- L12 常數：`EASY_EYES`、`EYE_EASY_WARN`
- L13 常數：`SOUND_LEAD`
- L14 常數：`DIRECTOR_AT`、`DIRECTOR_P`
- L15 常數：`TILT_SPEED`
- L16 常數：`EYE`
- L17 常數：`TWIN`
- L18 常數：`REACH`
- L19 常數：`BELL`
- …另有 38 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`needOf` L21、`passesOf` L22、`art` L27、`rnd` L43、`clamp` L44、`tx` L45、`RR` L46、`mulberry` L67、`deathsOf` L68、`levelCfg` L69、`wpick` L81、`dailyOn` L85、`dailyLvl` L86、`wantLevel` L87、`sv` L91、`mark` L92、`terrOf` L95、`applyLevel` L99、`reset` L116、`audioInit` L120、`tone` L121、`noiseBuf` L128、`weatherAudio` L129、`nburst` L135、`breathSfx` L138、`say` L147、`setText` L149、`ui` L150、`fx` L157、`end` L158、`boom` L169、`pay` L182、`pickPool` L187、`tutHelp` L195、`tutFail` L196、`tutOk` L197、`tutEnd` L201、`tutTick` L202、`keyCap` L206、`drawControls` L207、`introNext` L222、`introClick` L223、`drawIntro` L224、`drawTutUI` L232、`startEvent` L243、`sol` L259、`okS` L260、`nextGap` L274、`survive` L279、`inputs` L287、`gestCover` L290、`spotAt` L291、`hideOK` L292、`genSpots` L293、`ensureSpot` L294、`swipe` L295、`wkWhy` L296、`itemsUp` L297、`setHead` L298、`tailPush` L299、`tap` L300、`colPlan` L301、`passEnd` L303、`allClear` L304、`update` L305、`lampLevel` L386、`isRot` L389、`cxy` L390、`giveItem` L393、`spawnDrop` L402、`collect` L403、`updateDrops` L404、`canPick` L412、`startCamp` L413、`updateCamp` L414、`campTap` L420、`optSave` L423、`drawWorld` L434、`drawExit` L447、`sprite` L451、`floatImg` L452、`blob` L453、`drawSpirits` L454、`drawEvItems` L521、`drawDrops` L526、`drawCamp` L534、`wrapLines` L553、`txp` L554、`txd` L555、`hpRect` L558、`hpClick` L561、`drawHeadphone` L566、`capText` L574、`hud` L575、`btnImg` L602、`btnRow` L603、`deathClick` L606、`doAct` L611、`later` L618、`playCue` L619、`causeText` L637、`shareText` L638、`share` L639、`shareCard` L643、`drawScare` L656、`behind` L657、`drawDeath` L668、`drawWon` L688、`dexPos` L724、`dexPages` L725、`dexGo` L727、`txl` L729、`drawDex` L730、`dexClick` L750、`practiceStart` L760、`drawSpots` L762、`HIDE_LEAVES` L769、`drawHide` L770、`howCards` L783、`drawHead` L794、`drawWeather` L799、`hs` L809、`draw` L817、`start` L849、`shown` L860、`upPtr` L872、`clearInput` L883、`onOrient` L888、`fsOff` L891、`fsOn` L892、`go` L904、`loop` L906

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L184 `pay`：`S.balance+=n;`

**餘額檢查**
- L852 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L176 `boom`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p,level:lvl,seed:seedCode…`
- L185 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L854 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）
- `deep-sea-peek-dodges`（寫、讀）
- `deep-sea-peek-opts`（寫、讀）
- `deep-sea-peek-save`（寫、讀）
- `deep-sea-peek-scrolls`（寫、讀）
- `deep-sea-peek-tut2`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`peekBusy` 所在 IIFE，內含完整遊戲邏輯。設計依據《聽見就躲》v0.5 整合草案（遊戲名維持「別看 Don’t Peek」）。畫布 800×450 橫式、第一人稱：玩家自動往出口跑（基礎速度由關卡決定；衝刺已取消），進度到 100% 過關。只在 `view-peek` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停（並清空按鍵與觸控狀態）。

- 入場：免費（`ENTRY_FEE` 目前為 0）；按「免費開始」呼叫 `AN.start('peek')`，進行中按鈕停用。
- 模式：關卡欄 `peek-level`（`data-lv="1"`）填 1–100 為關卡模式（只能選已解鎖的關），填 0 為「自由跑」（沒有生命與關卡，舊版規則：依本局躲過次數登場、85% 導演突襲、每 20% 營火）。測試用 `forceLvl` 蓋過輸入欄；沒有 `data-lv` 的環境視為自由跑。
- 100 關、五個世界各 20 關（`WORLD_BASE` 1.00／1.15／1.30／1.45／1.60；背景森林、墓地、沼澤、雪原、火山）。每十關節奏 `RHYTHM`：第 1 關安全緩衝 0.65、2–4 學新鬼 0.80–0.90、5 緩衝或低壓複習 0.65（十關區段單雙輪替）、6–8 混合 0.95–1.05、9 高峰 1.20、10 首領 1.00；世界內第 11–20 關整體 ×1.10。難度 D＝世界底線 × 節奏 × 加成，`t=(D−0.65)/1.45` 夾在 0–1，換算：襲擊次數 `round(2+6t)`（安全 0、複習 1、學新鬼 3、首領＝已學鬼數＋1）、襲擊間隔 `8−5t` 秒、前兆倍率 `1.25−0.65t`（下限 `WARN_FLOOR`：葉下客 1.6、敲枝者 1.4、靜林鬼 3.5、逆風客 1.6 秒）、一關約 30～70 秒。學新鬼關前兆再加 0.6 秒。
- 鬼：葉下客 `eye`（落葉聚在一側，紅光時往反方向傾斜 ≥0.5，暴露超過 0.35 秒即死）、敲枝者 `twins`（鳥群飛走後一側敲擊，往敲擊方向傾斜 >0.3 即死，判定 1.5 秒內要往反方向傾斜 ≥0.6）、靜林鬼 `walker`（蟲鳴停，判定開始時 Wraith 圖突然撲到眼前（jumpscare，白閃＋震動）；最後 3.5 秒左右各冒出一件道具，點牠怕的燈籠那一側過關，點錯道具死、逾時（再 2.5 秒）死；第一次遇到只出現一件。道具對應：Hush 燈籠、Hollow 符紙、Glassface 鐵鎚、Ash 水桶，皆走 `walker` 流程以 `ev.gh` 區分）、逆風客 `gale`（風向反、拖行聲從一側靠近，判定 2 秒內要往來源側傾斜 ≥0.5，累計不足超過 0.35 秒即死）、首領空殼 `hollow`（＝`walker` 加 `boss` 旗標；第 30 關首領為玻璃臉 `glass`，已用專屬圖）。登場關：葉下客第 2 關、敲枝者第 3 關、靜林鬼第 4 關、逆風客第 12 關；學新鬼關只出現該鬼，其他關從已學的鬼加權抽（最新 ×2、死最多次 ×1.5、不連續同種）。每十關第 10 關是首領關：依序出現已學的鬼，最後是空殼，固定種子。
- 躲藏（取代傾斜）：路兩側各有依種子排列的躲藏處（每側約每 12–15 秒路程一處，`genSpots`，視窗 `[t0,t1]`）；沒有躲藏處的那一側滑動只會顯示「這裡沒地方躲」。每次襲擊開始時 `ensureSpot` 保證安全側（葉下客、敲枝者、墳手為來向反側，逆風客為來向同側）在前兆後 0.6 秒到判定結束前有躲藏處。躲進去（|tilt|>0.5）每秒消耗憋氣 1/4.5，離開後每秒回復 1/2；憋氣歸零即死（死因 `breath`）。敲枝者與逆風客在第 8 關起（非學習關、非首領）為兩趟襲擊：第一趟判定結束進入 1 秒空檔（可離開），再 0.8 秒預警後第二趟；多趟襲擊期間蟲鳴停止。守墓鐘 `bell`（第 23 關）鐘響三下，第三下之後須在 0.8 秒內往下滑（電腦 ↓／S）低頭並一直維持 3 秒，晚低頭或中途抬頭（上滑、點一下）即死，低頭時畫面變成腳下的路與逼近的影子；墳手 `reach`（第 22 關）判定 2 秒躲進反側。
- 假前兆：第 15 關起，一般／混合／高峰關每次襲擊有 `0.15t` 機率只是虛驚（前兆結束後消失、不算躲過、不扣 `left`）。連續襲擊：第 25 關起，躲過後有 `0.35t` 機率 1.4 秒後立刻再來一次。安全緩衝關只會在 45% 時出現一次無害的假前兆。
- 世界規則與天氣：10 種天氣（白天、黃昏、夜、雨、霧、霧夜、下雪、暴風雪、灰燼、熱浪）依 `LVT` 關卡表的天氣池抽，不連兩關相同。霧視野 80%、霧夜與暴風雪 60%；墳場下雨時聲音方向減半；沼澤聲音變悶（效果音 ×0.7）；雪原躲進去速度 ×0.7；灰燼與熱浪效果音 ×0.8；火山畫面輕微晃動（低驚嚇模式關閉）。
- 生命與存檔：3 條命（上限 5）。關卡內死亡扣 1 命並在同一關重來；命用完整輪重來：回到第 1 關並回復 3 命，沒有存檔點（`ck` 固定為 1）。選關上限為本輪實際打到的關（`runTop`，命用完時重設為 1）；每日挑戰（`dailyLvl`，依日期固定一關、非安全關與首領關）不扣命、不存檔、不發點；關卡進度在襲擊出完前停在 97%。首領通關 +1 命；營火停留 3 秒補 1 命，每十關最多一次（`healTen`）。同一關累計死 2 次後，下次重試前兆 +0.3 秒、襲擊少 1 次，畫面明確告知，`AN.end` 帶 `retry_assist`。
- 種子：第 1、10 關固定種子（`關卡×7919+101`）；其他關每次隨機，種子碼（36 進位）顯示在畫面右下與結果卡，可在 `peek-seed` 輸入重玩；`peek-daily` 勾選時用當天日期當種子。同一種子的鬼種、方向、掉落都相同。
- 道具：路邊掉落火把（下次襲擊前兆 +0.6 秒並標出方向，上限 3）、護身符（擋下一次致命失誤，上限 2）、舊卷軸（收藏，存 `deep-sea-peek-scrolls`，集滿 3 卷營火旁掛骷髏燈籠）；Nib 每關約 2% 機率跑過，給 1 卷軸。連續 3 關沒有掉落，下一關在 8% 進度後必掉（連續 6 關則掉護身符）。營火（第 5 關 50% 處；自由跑每 20%）三選一，旅人 Rook 在旁；撿取靠近 30% 深度內可按 F／「撿」／搖手機。
- 操作（無按鈕，全畫面手勢）：左右滑＝躲進該側躲藏處（再往反方向滑或點一下＝出來）；道具出現時點左／右半邊畫面（或 `←`／`→`）＝選該側道具；往下滑＝低頭（只在守墓鐘攻擊中有效，上滑或點一下抬頭）；一指按住 0.25 秒＝蓋住螢幕（已無任何鬼使用，程式仍保留）；點一下＝撿掉落物（點撿，不再搖手機）；連點兩下（`dbl`）留給 Bog 等後續鬼。電腦 `←`／`→` 躲、`F` 撿、營火按 `1`～`3`。衝刺已取消（`keys.wind` 僅測試用）。「啟用體感」為選用（`deviceorientation` 的 gamma 當左右、`|beta|>145` 當閉眼；iOS 需使用者授權）。教學面板只在第一次遊玩的前 9 秒顯示（`deep-sea-peek-tut`）。
- 死亡教學：結果畫面顯示死因、規則、小螢提示與按鈕（立刻重試、再聽一次、看鬼圖鑑、稍後再學；同種死 3 次起多一顆「開輔助標記」）。第 1 次完整說明規則，第 2 次聚焦差異，第 3 次起建議輔助與練習。鬼圖鑑 12 格（5 隻鬼、小螢、旅人、Nib、火把、護身符、舊卷軸、骷髏燈籠），遇見後解鎖線索／判斷／應對，可「聽一次」與「練習」（練習不扣命、不計死因、不發點）。
- 無障礙：首次進入先做耳機檢查（可試聽左右聲道）；選項有輔助標記（顯示危險側與安全側）、字幕方向、低驚嚇（降低閃光與震動）、環境音量與音效音量分開。選項存 `deep-sea-peek-opts`。
- 結束：死亡或進度 100%。`AN.end` 只呼叫一次，payout 為本局已入帳 BONUS；附 `level`、`seed`。
- BONUS（固定點數）：躲過 2 次襲擊 +2、通關 +5，每項每局一次；關卡模式只有該關第一次通關才發（重玩已過的關和練習都不發）；自由跑照舊每局可發。每局最多 7 點。分數、最佳進度（只計自由跑）、死因圖鑑 X / 16（`CAUSES`）、累計躲過只顯示。
- 儲存：`deep-sea-peek-save`（最高解鎖關、存檔點、生命、無掉落關數、補命區段、各關死亡數、圖鑑）、`deep-sea-peek-best`、`deep-sea-peek-deaths`、`deep-sea-peek-dodges`、`deep-sea-peek-scrolls`。
- 分享：結束畫面「分享結果卡」複製一句結果文字並下載 1200×630 的 PNG 結果卡，不自動發文。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目。
- 新鬼（2026-11-18，第 42–83 關起）：Bog `bog`（水面冒泡，判定 2.2 秒內連點兩下，第 42 關）、Flick `flick`（假螢火群，判定 2.4 秒內點畫面下方火把 [T 鍵] 消耗 1 個火把過關，沒火把或不點則要躲進 `-side` 側，第 43 關；第 41–43 關保證掉火把）、Howler `howl`（嚎叫 2–3 聲，結束後 3 秒內照同樣間隔點畫面，間隔誤差 ≤0.25 秒，第 62 關）、Crawler `crawl`（裂縫延伸，判定 1.2 秒內點一下，提早點不算，第 63 關）、Whiteout `white`（畫面變白、一側閃光，躲進閃光側＝同 Gale 規則，第 64 關）、Magma `magma`（一側冒煙，躲進另一側＝同 Reacher 規則，第 82 關）。Magma／Whiteout 與 Knocker／Gale 同為多趟（第 8 關起 2 趟，第 50 關起 3 趟）。多趟結束時蟲鳴爆發提示；第 41 關起 25% 機率加一次假折返（只有聲音，不判定）；前世界的鬼權重 ×0.35；第 15 關起前兆有 0–0.4 秒隨機延遲；第 60 關起連續襲擊可到三連；第 40、100 關連續襲擊機率 100%。
- 首領計畫（`BP`）：30＝Reacher、Bellkeeper、Hush、Glassface；40＝Reacher、Bellkeeper、Reacher、Glassface；50＝Flick、Bog、Flick；60＝Bog×2、Flick；70＝Howler×2、Crawler、Howler；80＝Whiteout、Howler、Crawler、Whiteout；90＝Magma、Ash、Magma、Ash；100＝Magma、Bellkeeper、Bog（Colossus 專屬機制未做，目前用組合頂替）。以上除第 30 關外都是我的提案。
- 尚未做：Colossus 專屬機制與外觀、Nib 專用圖、正式配樂與鐘聲音檔、圖鑑的場景片段與音訊樣本、生成後 1000 次機器人可解率驗證、每關不同地形。以上數值皆為初始假設，需真人試玩校正。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
