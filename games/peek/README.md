# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「抱著八音盒夜逃，聽聲辨位躲開走廊裡的東西，點對牠怕的道具。」｜免費遊玩 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 672 行、67.6 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「34. 別看 Don’t Peek（peek）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-peek`、`peek-canvas`、`peek-fsx`、`peek-prog`、`peek-spirits`、`peek-best`、`peek-lvl`、`peek-lives`、`peek-codex`、`peek-dodges`、`peek-level`、`peek-seed`、`peek-daily`、`peek-amount`、`peek-go`、`peek-dex`、`peek-share`、`peek-full`、`peek-gyro`、`peek-msg`、`peek-assist`、`peek-lowscare`、`peek-caps`、`peek-vol-amb`、`peek-vol`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L14）、`ART`（L21）、`HP`（L388）、`peekBusy`（L2）
- L5 常數：`BASE_RATE`
- L6 常數：`MILE_EVENTS`、`MILE_REWARD`、`WIN_REWARD`
- L7 常數：`FIRST_GAP`
- L8 常數：`GAP_NEAR`、`GAP_FAR`、`BREATH_EVERY`、`BREATH_EXTRA`
- L9 常數：`UNLOCK_TWINS`、`UNLOCK_WALKER`
- L10 常數：`EASY_EYES`、`EYE_EASY_WARN`
- L11 常數：`SOUND_LEAD`
- L12 常數：`DIRECTOR_AT`、`DIRECTOR_P`
- L13 常數：`TILT_SPEED`
- L14 常數：`EYE`
- L15 常數：`TWIN`
- L16 常數：`REACH`
- L17 常數：`BELL`
- L18 常數：`WALK`、`ITEM_OF`、`ITEM_SHOW`
- …另有 31 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`art` L22、`rnd` L39、`clamp` L40、`tx` L41、`RR` L42、`mulberry` L60、`deathsOf` L61、`levelCfg` L62、`wpick` L73、`dailyOn` L77、`dailyLvl` L78、`wantLevel` L79、`sv` L83、`mark` L84、`applyLevel` L85、`reset` L101、`audioInit` L105、`tone` L106、`say` L112、`setText` L114、`ui` L115、`fx` L122、`end` L123、`pay` L143、`pickPool` L148、`startEvent` L151、`sol` L166、`okS` L167、`nextGap` L180、`survive` L185、`inputs` L191、`gestCover` L194、`spotAt` L195、`hideOK` L196、`genSpots` L197、`ensureSpot` L198、`swipe` L199、`itemsUp` L200、`tap` L201、`passEnd` L202、`update` L203、`lampLevel` L253、`isRot` L256、`cxy` L257、`giveItem` L260、`spawnDrop` L267、`collect` L268、`updateDrops` L269、`canPick` L277、`startCamp` L278、`updateCamp` L279、`campTap` L285、`optSave` L288、`drawWorld` L299、`one` L303、`drawExit` L310、`sprite` L315、`floatImg` L316、`blob` L317、`drawSpirits` L318、`drawEvItems` L352、`drawDrops` L357、`drawCamp` L365、`wrapLines` L384、`txp` L385、`txd` L386、`hpRect` L389、`hpClick` L392、`drawHeadphone` L397、`capText` L404、`hud` L405、`btnRow` L431、`deathClick` L434、`doAct` L438、`later` L445、`playCue` L446、`shareText` L456、`share` L457、`shareCard` L461、`drawDeath` L474、`drawWon` L494、`dexPos` L522、`dexPages` L523、`dexGo` L525、`txl` L527、`drawDex` L528、`dexClick` L548、`practiceStart` L558、`drawSpots` L560、`drawHide` L567、`drawTut` L571、`drawWeather` L577、`draw` L587、`start` L617、`shown` L627、`upPtr` L637、`clearInput` L646、`onOrient` L651、`fsOff` L654、`fsOn` L655、`go` L667、`loop` L669

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L145 `pay`：`S.balance+=n;`

**餘額檢查**
- L620 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L137 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p,level:lvl,seed:seedCode…`
- L146 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L622 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）
- `deep-sea-peek-dodges`（寫、讀）
- `deep-sea-peek-opts`（寫、讀）
- `deep-sea-peek-save`（寫、讀）
- `deep-sea-peek-scrolls`（寫、讀）
- `deep-sea-peek-tut`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`peekBusy` 所在 IIFE，內含完整遊戲邏輯。設計依據《聽見就躲》v0.5 整合草案（遊戲名維持「別看 Don’t Peek」）。畫布 800×450 橫式、第一人稱：玩家自動往出口跑（基礎速度由關卡決定；衝刺已取消），進度到 100% 過關。只在 `view-peek` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停（並清空按鍵與觸控狀態）。

- 入場：免費（`ENTRY_FEE` 目前為 0）；按「免費開始」呼叫 `AN.start('peek')`，進行中按鈕停用。
- 模式：關卡欄 `peek-level`（`data-lv="1"`）填 1–100 為關卡模式（只能選已解鎖的關），填 0 為「自由跑」（沒有生命與關卡，舊版規則：依本局躲過次數登場、85% 導演突襲、每 20% 營火）。測試用 `forceLvl` 蓋過輸入欄；沒有 `data-lv` 的環境視為自由跑。
- 100 關、五個世界各 20 關（`WORLD_BASE` 1.00／1.15／1.30／1.45／1.60；背景森林、墓地、沼澤、雪原、火山）。每十關節奏 `RHYTHM`：第 1 關安全緩衝 0.65、2–4 學新鬼 0.80–0.90、5 緩衝或低壓複習 0.65（十關區段單雙輪替）、6–8 混合 0.95–1.05、9 高峰 1.20、10 首領 1.00；世界內第 11–20 關整體 ×1.10。難度 D＝世界底線 × 節奏 × 加成，`t=(D−0.65)/1.45` 夾在 0–1，換算：襲擊次數 `round(2+6t)`（安全 0、複習 1、學新鬼 3、首領＝已學鬼數＋1）、襲擊間隔 `8−5t` 秒、前兆倍率 `1.25−0.65t`（下限 `WARN_FLOOR`：葉下客 1.6、敲枝者 1.4、靜林鬼 3.5、逆風客 1.6 秒）、一關約 30～70 秒。學新鬼關前兆再加 0.6 秒。
- 鬼：葉下客 `eye`（落葉聚在一側，紅光時往反方向傾斜 ≥0.5，暴露超過 0.35 秒即死）、敲枝者 `twins`（鳥群飛走後一側敲擊，往敲擊方向傾斜 >0.3 即死，判定 1.5 秒內要往反方向傾斜 ≥0.6）、靜林鬼 `walker`（蟲鳴停；最後 3.5 秒左右各冒出一件道具，點牠怕的燈籠那一側過關，點錯道具死、逾時（再 2.5 秒）死；第一次遇到只出現一件。道具對應：Hush 燈籠、Hollow 符紙、Glassface 鐵鎚、Ash 水桶，皆走 `walker` 流程以 `ev.gh` 區分）、逆風客 `gale`（風向反、拖行聲從一側靠近，判定 2 秒內要往來源側傾斜 ≥0.5，累計不足超過 0.35 秒即死）、首領空殼 `hollow`（＝`walker` 加 `boss` 旗標；第 30 關首領為玻璃臉 `glass`，用 Wraith 圖暫代）。登場關：葉下客第 2 關、敲枝者第 3 關、靜林鬼第 4 關、逆風客第 12 關；學新鬼關只出現該鬼，其他關從已學的鬼加權抽（最新 ×2、死最多次 ×1.5、不連續同種）。每十關第 10 關是首領關：依序出現已學的鬼，最後是空殼，固定種子。
- 躲藏（取代傾斜）：路兩側各有依種子排列的躲藏處（每側約每 12–15 秒路程一處，`genSpots`，視窗 `[t0,t1]`）；沒有躲藏處的那一側滑動只會顯示「這裡沒地方躲」。每次襲擊開始時 `ensureSpot` 保證安全側（葉下客、敲枝者、墳手為來向反側，逆風客為來向同側）在前兆後 0.6 秒到判定結束前有躲藏處。躲進去（|tilt|>0.5）每秒消耗憋氣 1/4.5，離開後每秒回復 1/2；憋氣歸零即死（死因 `breath`）。敲枝者與逆風客在第 8 關起（非學習關、非首領）為兩趟襲擊：第一趟判定結束進入 1 秒空檔（可離開），再 0.8 秒預警後第二趟；多趟襲擊期間蟲鳴停止。守墓鐘 `bell`（第 23 關）鐘響三下，第三下後 1.5 秒（寬限 0.25 秒）內任何輸入即死；墳手 `reach`（第 22 關）判定 2 秒躲進反側。
- 假前兆：第 15 關起，一般／混合／高峰關每次襲擊有 `0.15t` 機率只是虛驚（前兆結束後消失、不算躲過、不扣 `left`）。連續襲擊：第 25 關起，躲過後有 `0.35t` 機率 1.4 秒後立刻再來一次。安全緩衝關只會在 45% 時出現一次無害的假前兆。
- 世界規則與天氣：10 種天氣（白天、黃昏、夜、雨、霧、霧夜、下雪、暴風雪、灰燼、熱浪）依 `LVT` 關卡表的天氣池抽，不連兩關相同。霧視野 80%、霧夜與暴風雪 60%；墳場下雨時聲音方向減半；沼澤聲音變悶（效果音 ×0.7）；雪原躲進去速度 ×0.7；灰燼與熱浪效果音 ×0.8；火山畫面輕微晃動（低驚嚇模式關閉）。
- 生命與存檔：3 條命（上限 5）。關卡內死亡扣 1 命並在同一關重來；命用完整輪重來：回到第 1 關並回復 3 命，沒有存檔點（`ck` 固定為 1）。選關上限為本輪實際打到的關（`runTop`，命用完時重設為 1）；每日挑戰（`dailyLvl`，依日期固定一關、非安全關與首領關）不扣命、不存檔、不發點；關卡進度在襲擊出完前停在 97%。首領通關 +1 命；營火停留 3 秒補 1 命，每十關最多一次（`healTen`）。同一關累計死 2 次後，下次重試前兆 +0.3 秒、襲擊少 1 次，畫面明確告知，`AN.end` 帶 `retry_assist`。
- 種子：第 1、10 關固定種子（`關卡×7919+101`）；其他關每次隨機，種子碼（36 進位）顯示在畫面右下與結果卡，可在 `peek-seed` 輸入重玩；`peek-daily` 勾選時用當天日期當種子。同一種子的鬼種、方向、掉落都相同。
- 道具：路邊掉落火把（下次襲擊前兆 +0.6 秒並標出方向，上限 3）、護身符（擋下一次致命失誤，上限 2）、舊卷軸（收藏，存 `deep-sea-peek-scrolls`，集滿 3 卷營火旁掛骷髏燈籠）；Nib 每關約 2% 機率跑過，給 1 卷軸。連續 3 關沒有掉落，下一關在 8% 進度後必掉（連續 6 關則掉護身符）。營火（第 5 關 50% 處；自由跑每 20%）三選一，旅人 Rook 在旁；撿取靠近 30% 深度內可按 F／「撿」／搖手機。
- 操作（無按鈕，全畫面手勢）：左右滑＝躲進該側躲藏處（再往反方向滑或點一下＝出來）；道具出現時點左／右半邊畫面（或 `←`／`→`）＝選該側道具；一指按住 0.25 秒＝蓋住螢幕（目前只有守墓鐘把它當亂動）；點一下＝撿掉落物（點撿，不再搖手機）；連點兩下（`dbl`）留給 Bog 等後續鬼。電腦 `←`／`→` 躲、`F` 撿、營火按 `1`～`3`。衝刺已取消（`keys.wind` 僅測試用）。「啟用體感」為選用（`deviceorientation` 的 gamma 當左右、`|beta|>145` 當閉眼；iOS 需使用者授權）。教學面板只在第一次遊玩的前 9 秒顯示（`deep-sea-peek-tut`）。
- 死亡教學：結果畫面顯示死因、規則、小螢提示與按鈕（立刻重試、再聽一次、看鬼圖鑑、稍後再學；同種死 3 次起多一顆「開輔助標記」）。第 1 次完整說明規則，第 2 次聚焦差異，第 3 次起建議輔助與練習。鬼圖鑑 12 格（5 隻鬼、小螢、旅人、Nib、火把、護身符、舊卷軸、骷髏燈籠），遇見後解鎖線索／判斷／應對，可「聽一次」與「練習」（練習不扣命、不計死因、不發點）。
- 無障礙：首次進入先做耳機檢查（可試聽左右聲道）；選項有輔助標記（顯示危險側與安全側）、字幕方向、低驚嚇（降低閃光與震動）、環境音量與音效音量分開。選項存 `deep-sea-peek-opts`。
- 結束：死亡或進度 100%。`AN.end` 只呼叫一次，payout 為本局已入帳 BONUS；附 `level`、`seed`。
- BONUS（固定點數）：躲過 2 次襲擊 +2、通關 +5，每項每局一次；關卡模式只有該關第一次通關才發（重玩已過的關和練習都不發）；自由跑照舊每局可發。每局最多 7 點。分數、最佳進度（只計自由跑）、死因圖鑑 X / 10（`CAUSES`）、累計躲過只顯示。
- 儲存：`deep-sea-peek-save`（最高解鎖關、存檔點、生命、無掉落關數、補命區段、各關死亡數、圖鑑）、`deep-sea-peek-best`、`deep-sea-peek-deaths`、`deep-sea-peek-dodges`、`deep-sea-peek-scrolls`。
- 分享：結束畫面「分享結果卡」複製一句結果文字並下載 1200×630 的 PNG 結果卡，不自動發文。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目。
- 尚未做：Glassface／Bog／Flick／Howler／Crawler／Whiteout／Magma／Ash／Colossus 的機制（墳場起的關卡目前以舊鬼頂替；圖已入庫）、三連襲擊、Hush 的專用畫面、Nib 專用圖、正式配樂與鐘聲音檔、圖鑑的場景片段與音訊樣本、生成後 1000 次機器人可解率驗證。以上數值皆為初始假設，需真人試玩校正。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
