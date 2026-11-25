# 偷水果的貓 Fruit Thief Cat（thief）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#thief`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「換道、跳籃子，偷水果躲開老闆娘。」｜立即開玩 · 市場追逐
- 追蹤名稱（GA4 `game_name`）：偷水果的貓，`game_id` 為 `thief`
- 檔案：`games/thief/card.html`、`games/thief/cover.webp`、`games/thief/game.js`、`games/thief/icon.svg`、`games/thief/leaderboard.webp`、`games/thief/style.css`、`games/thief/view.html`；`game.js` 共 942 行、101.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「30. 偷水果的貓 Fruit Thief Cat（thief）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-thief`、`thief-canvas`、`thief-score`、`thief-best`、`thief-amount`、`thief-pay`、`thief-next`、`thief-go`、`thief-msg`、`thief-rank-status`、`thief-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`A`（L105）、`MS`（L336）、`R`（L364）、`SFX`（L442）、`SS`（L604）、`LS0`（L638）、`LS`（L639）、`PB`（L833）、`KM`（L905）、`thiefBusy`（L2）
- L4 常數：`DPR`
- L7 常數：`MILESTONES`、`BONUS`、`KEY`、`SKEY`
- L20 常數：`FNT`
- L22 常數：`CJK`
- L74 常數：`EVENTS`、`EV_RUNS`
- L76 常數：`EVNOW`
- L80 常數：`MISSIONS`
- L87 常數：`CYT`
- L104 常數：`SPR`、`LOGO`
- L106 常數：`CATF`
- L122 常數：`SIDE`、`SIDE2`
- L126 常數：`ZONES`
- L144 常數：`STARS`
- L263 常數：`STREAK`
- …另有 19 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`rnd` L9、`O` L10、`C` L11、`E` L12、`F` L13、`RR` L14、`P` L15、`L2` L16、`font` L24、`eob` L25、`tx` L26、`ptx` L28、`waveTx` L30、`acc` L40、`activeEvent` L75、`syncModel` L92、`control` L93、`sprOk` L106、`spr` L107、`tint` L109、`pj` L119、`hw` L120、`wrap` L121、`poly` L123、`hexRGB` L132、`mixZ` L133、`passGate` L135、`drawGate` L137、`zoneOf` L145、`bg` L146、`blob` L177、`snowCap` L178、`pumpkin` L180、`drawTree` L181、`dress` L189、`roadDecals` L196、`item` L204、`goldApple` L219、`star` L220、`cat` L223、`granny` L243、`sign` L248、`wt` L249、`card` L250、`hud` L252、`streaks` L264、`glowImg` L272、`glow` L273、`zoneFx` L274、`seasonFx` L287、`drawBanner` L296、`danger` L304、`RM` L327、`SK` L330、`T` L331、`localText` L332、`ST` L333、`saveMS` L338、`saveTut` L343、`lvDone` L344、`lvAll` L345、`curLevel` L346、`isOpen` L347、`skinAt` L348、`mLabel` L349、`lockText` L350、`listMissions` L356、`puff` L357、`deliver` L359、`drawFlying` L360、`burst` L362、`trackMissions` L363、`events` L381、`audioInit` L413、`tone` L421、`noise` L422、`brass` L424、`wah` L429、`slide` L434、`meow` L437、`sfx` L476、`windOn` L477、`windOff` L478、`syncAudio` L479、`toggleSound` L481、`SEMI` L484、`syn` L489、`music` L491、`note` L501、`hint` L522、`pick` L539、`release` L540、`say` L541、`setText` L543、`ui` L544、`awardBonus` L551、`nearMiss` L563、`L0` L564、`die` L571、`start` L584、`go` L589、`saveSS` L605、`unseen` L607、`openStory` L608、`closeStory` L609、`kits` L610、`drawStory` L627、`saveLS` L642、`stName` L657、`stDesc` L658、`checkStickers` L659、`recordRun` L663、`checkEpilogue` L670、`dayKey` L672、`dailySeed` L673、`dailyGoal` L674、`dailyDoneToday` L675、`homeLv` L677、`openSheet` L678、`closeSheet` L679、`sheetTap` L680、`albumAt` L686、`stIcon` L688、`apple` L690、`cal` L691、`face` L692、`b0` L704、`sticker` L713、`stProg` L721、`drawAlbum` L722、`stickerCard` L739、`drawHome` L747、`woodBtn` L771、`badgeDot` L775、`iconBook` L776、`iconAlbum` L778、`iconHome` L780、`iconDaily` L782、`iconSound` L783、`menuItems` L786、`newFeatures` L788、`btnLabel` L789、`sideBtn` L790、`storyBtn` L791、`soundBtn` L792、`missionCard` L793、`overlay` L805、`toggleRow` L834、`drawPanel` L835、`panelTap` L842、`openPanel` L845、`closePanel` L846、`pauseBtn` L847、`drawShelf` L850、`drawToasts` L862、`drawParts` L871、`bonusDraw` L872、`pos` L873、`loop` L921

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L555 `awardBonus`：`S.balance+=BONUS;`

**餘額檢查**
- L588 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L556 `awardBonus`：`AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});`
- L580 `die`：`AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});`
- L592 `go`：`analytics=AN.start('thief',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-thief-motion`（寫）
- `deep-sea-thief-music`（寫）
- `deep-sea-thief-sfx`（寫）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`thiefBusy` 所在 IIFE（改編自使用者提供的 CatThief.html；原頁面的越／英／中語言切換移除，僅繁中；造型解鎖與選擇保留，存於 `deep-sea-thief-skin`）。三道換道＋跳躍；與老闆娘的距離縮到 0 即結束；水果+5分但變重變慢（最多5顆），魚讓貓變輕。分數＝floor(距離/50)+水果數×5。

難度參數在 `shared/thief-rules.cjs` 的 `TUNING`，排行榜依 `rulesVersion` 回放。v2（2026-11-25）：起速 260、每單位距離加 0.006、上限 430（每顆水果再慢 7%）；距離每秒流失 2＋水果數×2＋min(4, 距離×0.0002)；竹籃 −30、拖鞋 −45；竹籃出現率 30%→50%（距離 2,500）→65%（距離 9,000）；拖鞋間隔 max(1.6, 3.5～6 秒−距離×0.0001)。v1 保留舊數值（流失 4＋水果數×5＋距離×0.002、竹籃 −50、拖鞋 −80、距離 400 起竹籃 75%）供未帶版本的舊客戶端回放；模擬顯示 v1 連不會受傷的玩家也到不了 400 分。

任務（2026-11-25）：開始與結束畫面顯示目前等級的 3 個任務，完成一個就補上下一個，獎勵只有造型、不發點數。共三級、各 6 個，目標依模擬成績由易到難：Lv1 啃掉 5 顆蘋果、吞下 5 條魚、閃過 5 隻瞄準你的拖鞋、跳過 10 個竹籃（以上跨局累計）、一次抱著 5 顆水果、連續 30 秒毫髮無傷；Lv2 收集 15 顆橘子、跳過 30 個竹籃（累計）、一局吞下 3 條魚、一局閃過 3 隻瞄準拖鞋、一局拿到 250 分、連續 45 秒毫髮無傷；Lv3 收集 30 顆綠色水果（累計）、一局偷到 15 顆水果、一局閃過 5 隻瞄準拖鞋、一局跳過 15 個竹籃、一局拿到 450 分、連續 60 秒毫髮無傷。Lv1 每個任務各解鎖一款造型；Lv2、Lv3 全部完成時各解鎖一款（金爪喵、市場傳奇）。「瞄準你的拖鞋」指驚嘆號出現時就在貓所在跑道、飛過時貓已不在該跑道且未被打中，此時顯示「差一根鬍鬚！」。計數由 `shared/thief-rules.cjs` 的 `stats` 提供，不影響分數、回放或排行榜。進度存在 `deep-sea-thief-missions`（`{p:{任務id:進度}, done:[任務id]}`），8 款任務造型接在原 4 款之後（索引 4～11，沿用 `deep-sea-thief-skin`）。

操作：左右滑動或點左右兩側換道，往上滑或點中間跳；滑動距離達 22 單位立即觸發，沒滑動就在放開時當作點擊。鍵盤 ←／→／A／D 換道、空白鍵／↑／W 跳，M 開關音效（存於 `deep-sea-thief-sound`）。音效與背景音樂以 Web Audio 即時合成，沒有音檔：撿到東西是短促的勝利音，任務與升級是銅管號角，被抓是刮唱片、管弦重擊配定音鼓與鈸、滑哨下墜、晶片音「哇—哇—哇—哇～」洩氣長音，最後一聲委屈的「喵～」；背景配樂（2026-11-25 改版）從 172 BPM 起跑、隨距離加快到約 186 BPM，暴衝時再快 25%：四拍大鼓、反拍拍手與十六分音符鈸、八分音符八度貝斯、反拍和弦重音、第六八度的高音琶音主旋律加回聲，每四小節小鼓滾奏與上升掃頻；春 C 大調 I–V–vi–IV、夏升到 D 大調、秋改 A 小調、冬再升一個全音並加雪橇鈴；老闆娘逼近時加入急促的高音滴答。新手提示：竹籃接近或拖鞋瞄準時，在貓上方顯示滑動手勢或按鍵圖示 1.5 秒，兩次提示至少間隔 7 秒；跳過 2 個竹籃且躲過 1 次瞄準拖鞋、或玩滿 3 局後不再出現（`deep-sea-thief-tutorial`）。場景與故事（2026-11-25，僅畫面與聲音）：四季隨分數推進，皆維持明亮：0 分「第 1 章 · 春日市集」（櫻花瓣）、150 分「第 2 章 · 盛夏追逐」（豔陽與閃光）、400 分「第 3 章 · 秋葉狂奔」（落葉）、700 分「第 4 章 · 雪地足跡」（雪花、雪地與燈串）；每季有自己的遠山、路面顏色與路面落物（花瓣、落葉、積雪與車轍）、路旁樹木（櫻花樹、綠樹、楓樹、積雪松樹）與攤位裝飾（花串、西瓜、南瓜、屋頂積雪與冰柱），皆以畫布繪製、沿用素材的深棕描邊風格。到達門檻時，下一季的拱門從街道遠端出現並迎面而來，貓穿過拱門時畫面閃白、換景（色調 1.2 秒漸變）並顯示章節橫幅與號角。配樂春 C 大調、夏升 D 大調、秋 A 小調、冬再升一個全音並加雪橇鈴。每章 3 格以遊戲素材繪製的漫畫，首次開啟遊戲自動顯示第 1 章（點一下或按空白鍵關閉，也可直接開始），之後到達的新章節在結算畫面以左上角書本按鈕（有驚嘆號提示）閱讀，進度存在 `deep-sea-thief-story`（`{r:最高章節索引 0–3, seen:[已讀章節，4 為終章]}`）。結算畫面依序提示一個「再來一局」的理由：未讀章節、差一點破紀錄、快完成的任務、快到下一季；結算卡出現 0.5 秒後點畫面或按空白鍵／Enter 即可再玩，開始畫面點畫面也會直接開始。

長期目標（2026-11-25，僅存在瀏覽器、不發點數）：開始與結算畫面左側的木牌按鈕依玩家進度逐一出現：故事書（一開始）、貼紙簿（玩滿 2 局）、小貓窩（第一次送回水果）、每日挑戰（玩滿 3 局），新出現時跳出「新功能解鎖！」；第一次開啟遊戲時不顯示造型架，畫面只留任務與開始提示。右上角喇叭開啟設定卡（背景音樂、遊戲音效、震動與閃光三個開關，分別存於 `deep-sea-thief-music`／`-sfx`／`-motion`；系統開啟減少動態效果時一律視為關閉）；M 鍵一次開關全部聲音。遊玩中右上方有暫停鈕（或按 P），切換分頁或視窗失去焦點也會自動暫停並顯示同一張卡片，暫停期間規則不前進、配樂停止。上手與操作（2026-11-25）：第一次開啟遊戲直接是開始畫面，點一下即開跑，第 1 章漫畫改由書本按鈕的驚嘆號與結算提示引導閱讀；左側與右上按鈕下方加上文字標籤（Story／Stickers／Hideout／Daily／Settings）；點畫面最左或最右約四分之一處在按下瞬間就換道，中間區域仍在放開時判斷點擊（跳）或滑動。音效依離線算出的短時峰值 RMS 分層校正（提示音 -34 dB、拾取與動作 -28、受擊與號角 -24、被抓 -20、心跳 -30），校正值在 `SFXV`。效能：造型架改為離屏快取（內容改變時才重畫），燈光改用一次建好的光暈圖；本機量測遊玩中每幀約 2.4 毫秒（p95 3.9 毫秒，含規則更新），選單約 3.6 毫秒。累計數據存在 `deep-sea-thief-life`（局數、各水果、魚、跳籃、閃拖鞋、暴衝、金蘋果、暴怒閃過、送回水果數、單次最多送回、最高章節、最高分、已得貼紙、每日挑戰紀錄）。貼紙簿 20 張：第一局、蘋果 100、橘子 50、魚 50、跳籃 100、閃瞄準拖鞋 50、一次送回 5 顆、累計送回 200、抵達秋日市集、抵達冬日市集、第一次暴衝、暴衝 25 次、第一顆金蘋果、金蘋果 20、閃過一整輪暴怒、單局 400、單局 800、被抓 25 次、完成一次每日挑戰、連續 7 天；貼紙依主題分 5 列（基本、技巧、送貨與季節、加速道具、目標），以向量圖示畫成白邊模切貼紙並依列配色；未取得的顯示虛線空格與鎖，可計數的附進度條；得到時跳出「新貼紙！」，點貼紙開啟大卡片顯示取得方式與進度。小貓窩依累計送回的水果數升級（0／20／60／150／300／600 共 6 級：毯子、魚缸、紙燈籠、坐墊、歡迎回家招牌），小貓隨等級變胖，點小貓會喵一聲並冒愛心。每日挑戰：以當地日期產生同一顆種子（v3 規則、固定 10 毫秒步進），目標分數依日期在 200／250／300／350 輪替；只在本機記錄今日最佳、是否完成與連續天數，不送排行榜，但 BONUS 里程碑、任務、GA4 與一般局相同。結算後點畫面或按空白鍵會以同一模式再玩。

終章與季節活動（2026-11-25）：累計送回 300 顆水果（小貓窩 Lv5）解鎖「終章 · 回家」三格漫畫（原來每晚留魚的是老闆娘）與造型「好朋友」，已達標的舊玩家載入時即解鎖。季節活動依本機日期：秋日豐收 11/1–11/30、冬夜燈火 12/1–1/10、春櫻盛開 2/1–4/15、夏夜螢火 6/15–8/31（飄落效果改跟隨遊戲中的季節）；活動期間玩滿 5 局解鎖該季造型（楓葉帽、雪球毛帽、櫻花喵、草帽喵），進度存於 `deep-sea-thief-life` 的 `ev`／`evDone`，開始畫面以提示列顯示進度。造型選單改為 3 列 × 6（共 17 款）。

臨場感（僅畫面與聲音，不改判定）：老闆娘逼近時畫面四周泛紅並隨心跳脈動，距離越近心跳越快；被打中時手機震動（支援時）。兩側風線隨速度變多變亮。被打中只有約 0.15 秒、幾像素的輕微晃動（規則檔的 `shake` 設定後不會歸零，畫面不讀取它，改由實際被打中時觸發）。撞到竹籃時貓會側摔、頭上冒星星再爬起，竹籃翻倒並灑出三顆水果；被拖鞋打中則壓扁一下。被抓時先刮唱片、管弦重擊與定格放大約 0.7 秒，再落下結算卡（系統開啟「減少動態效果」時略過定格與動畫）。畫面字型：Fredoka（標題 700、內文 600），中文用粗體 Noto Sans TC，由頁面的 Google Fonts 連結載入。跳躍的滯空時間仍由規則檔決定（0.55 秒），畫面上只加高拋物線、起跳拉長、落地壓扁與塵土，不影響判定。

v3（2026-11-25，目前版本，`rulesVersion=3`）＝v2 數值再加三項玩法：①暴衝模式 Zoomies：連續撿 10 顆水果且中途沒被打到，進入 5 秒暴衝（速度 ×1.08、不受背上水果重量影響、老闆娘距離每秒 +2 而非流失、每顆水果再加 5 分即共 10 分；暴衝中背上滿 5 顆仍可撿）；②金蘋果：距離 6,000 起、之後每 16,000～22,000 出現在空跑道，撿到 +15 分、距離 +10 並直接觸發暴衝；③老闆娘暴怒：距離 9,000 起、之後每 9,000～13,000 觸發，1 秒後連丟 3 隻瞄準貓當下跑道的拖鞋（警示 0.7 秒、間隔 0.75 秒，期間暫停一般拖鞋），三隻都沒被打中 +20 分。分數＝floor(距離/50)＋水果數×5＋上述額外分。模擬：反應正常的玩家約每局 0.6 次暴衝、0.6 顆金蘋果，達 400 分比例由 v2 的約 17% 升到約 38%。排行榜依 `rulesVersion` 分別回放 v1（未帶版本的舊客戶端）、v2 與 v3。

吃魚的意義：背上的水果會飛回左上角的小貓窩（顯示「送回去給小貓了！」），所以背上歸零、身體變輕；背上沒有水果時顯示「身輕如燕！」。

每局固定入場 10 點（現行全站 `ENTRY_FEE=0`，實際免費），無終點。BONUS：150／400／800 分 三個里程碑，各立即入帳固定 5 點（單局最多 15 點），每個里程碑當局只發一次；達標判定在遊戲更新之後、且回合仍進行時，造成失敗的那一幀不計。獎勵與入場費無關，失敗或重新整理不扣回，結束時不另發點；`end.payout_points` 記錄本局已入帳總額。最佳紀錄存於 `deep-sea-thief-best`。里程碑門檻沿用原頁造型解鎖門檻；v2 以模擬校準：不操作約 12 秒結束，反應正常的玩家多數可達 150 分、約兩成達 400 分，800 分需高手（僅模擬，未經真人實測）。切換遊戲或背景分頁時暫停，重新整理放棄本局、已扣點不退。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/thief/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
