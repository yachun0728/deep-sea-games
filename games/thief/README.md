# 偷水果的貓 Fruit Thief Cat（thief）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#thief`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「換道、跳籃子，偷水果躲開老闆娘。」｜立即開玩 · 市場追逐
- 追蹤名稱（GA4 `game_name`）：偷水果的貓，`game_id` 為 `thief`
- 檔案：`games/thief/card.html`、`games/thief/cover.webp`、`games/thief/game.js`、`games/thief/icon.svg`、`games/thief/leaderboard.webp`、`games/thief/style.css`、`games/thief/view.html`；`game.js` 共 743 行、74.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「30. 偷水果的貓 Fruit Thief Cat（thief）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-thief`、`thief-canvas`、`thief-score`、`thief-best`、`thief-amount`、`thief-pay`、`thief-next`、`thief-go`、`thief-msg`、`thief-rank-status`、`thief-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`A`（L92）、`MS`（L259）、`R`（L285）、`SFX`（L362）、`SS`（L503）、`LS0`（L531）、`LS`（L532）、`KM`（L716）、`thiefBusy`（L2）
- L4 常數：`DPR`
- L5 常數：`MILESTONES`、`BONUS`、`KEY`、`SKEY`
- L18 常數：`FNT`
- L20 常數：`CJK`
- L67 常數：`MISSIONS`
- L74 常數：`CYT`
- L91 常數：`SPR`、`LOGO`
- L93 常數：`CATF`
- L109 常數：`SIDE`、`SIDE2`
- L112 常數：`ZONES`
- L119 常數：`STARS`
- L202 常數：`STREAK`
- L253 常數：`CAUGHT_HOLD`
- L258 常數：`MKEY`、`SNDKEY`、`TKEY`、`SWIPE`、`SBX`、`SBY`、`SKY0`
- …另有 11 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`rnd` L7、`O` L8、`C` L9、`E` L10、`F` L11、`RR` L12、`P` L13、`L2` L14、`font` L22、`eob` L23、`tx` L24、`ptx` L26、`waveTx` L28、`acc` L38、`syncModel` L79、`control` L80、`sprOk` L93、`spr` L94、`tint` L96、`pj` L106、`hw` L107、`wrap` L108、`poly` L110、`hexRGB` L116、`mixZ` L117、`zoneOf` L120、`bg` L121、`item` L143、`goldApple` L158、`star` L159、`cat` L162、`granny` L182、`sign` L187、`wt` L188、`card` L189、`hud` L191、`streaks` L203、`zoneFx` L209、`drawBanner` L222、`danger` L230、`SK` L254、`T` L255、`localText` L256、`ST` L257、`saveMS` L261、`saveTut` L266、`lvDone` L267、`lvAll` L268、`curLevel` L269、`isOpen` L270、`skinAt` L271、`mLabel` L272、`lockText` L273、`listMissions` L277、`puff` L278、`deliver` L280、`drawFlying` L281、`burst` L283、`trackMissions` L284、`events` L302、`audioInit` L333、`tone` L341、`noise` L342、`brass` L344、`wah` L349、`slide` L354、`meow` L357、`sfx` L393、`windOn` L394、`windOff` L395、`toggleSound` L396、`music` L402、`hint` L422、`pick` L439、`release` L440、`say` L441、`setText` L443、`ui` L444、`awardBonus` L451、`nearMiss` L463、`L0` L464、`die` L470、`start` L483、`go` L488、`saveSS` L504、`unseen` L506、`openStory` L507、`closeStory` L508、`kits` L509、`drawStory` L520、`saveLS` L535、`stName` L547、`stDesc` L548、`checkStickers` L549、`recordRun` L553、`dayKey` L559、`dailySeed` L560、`dailyGoal` L561、`dailyDoneToday` L562、`homeLv` L564、`openSheet` L565、`closeSheet` L566、`sheetTap` L567、`albumAt` L572、`badgeIcon` L573、`drawAlbum` L583、`drawHome` L593、`sideBtn` L615、`storyBtn` L621、`soundBtn` L625、`missionCard` L631、`overlay` L643、`drawToasts` L675、`drawParts` L684、`bonusDraw` L685、`pos` L686、`loop` L726

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L455 `awardBonus`：`S.balance+=BONUS;`

**餘額檢查**
- L487 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L456 `awardBonus`：`AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});`
- L479 `die`：`AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});`
- L491 `go`：`analytics=AN.start('thief',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`thiefBusy` 所在 IIFE（改編自使用者提供的 CatThief.html；原頁面的越／英／中語言切換移除，僅繁中；造型解鎖與選擇保留，存於 `deep-sea-thief-skin`）。三道換道＋跳躍；與老闆娘的距離縮到 0 即結束；水果+5分但變重變慢（最多5顆），魚讓貓變輕。分數＝floor(距離/50)+水果數×5。

難度參數在 `shared/thief-rules.cjs` 的 `TUNING`，排行榜依 `rulesVersion` 回放。v2（2026-11-25）：起速 260、每單位距離加 0.006、上限 430（每顆水果再慢 7%）；距離每秒流失 2＋水果數×2＋min(4, 距離×0.0002)；竹籃 −30、拖鞋 −45；竹籃出現率 30%→50%（距離 2,500）→65%（距離 9,000）；拖鞋間隔 max(1.6, 3.5～6 秒−距離×0.0001)。v1 保留舊數值（流失 4＋水果數×5＋距離×0.002、竹籃 −50、拖鞋 −80、距離 400 起竹籃 75%）供未帶版本的舊客戶端回放；模擬顯示 v1 連不會受傷的玩家也到不了 400 分。

任務（2026-11-25）：開始與結束畫面顯示目前等級的 3 個任務，完成一個就補上下一個，獎勵只有造型、不發點數。共三級、各 6 個，目標依模擬成績由易到難：Lv1 啃掉 5 顆蘋果、吞下 5 條魚、閃過 5 隻瞄準你的拖鞋、跳過 10 個竹籃（以上跨局累計）、一次抱著 5 顆水果、連續 30 秒毫髮無傷；Lv2 收集 15 顆橘子、跳過 30 個竹籃（累計）、一局吞下 3 條魚、一局閃過 3 隻瞄準拖鞋、一局拿到 250 分、連續 45 秒毫髮無傷；Lv3 收集 30 顆綠色水果（累計）、一局偷到 15 顆水果、一局閃過 5 隻瞄準拖鞋、一局跳過 15 個竹籃、一局拿到 450 分、連續 60 秒毫髮無傷。Lv1 每個任務各解鎖一款造型；Lv2、Lv3 全部完成時各解鎖一款（金爪喵、市場傳奇）。「瞄準你的拖鞋」指驚嘆號出現時就在貓所在跑道、飛過時貓已不在該跑道且未被打中，此時顯示「差一根鬍鬚！」。計數由 `shared/thief-rules.cjs` 的 `stats` 提供，不影響分數、回放或排行榜。進度存在 `deep-sea-thief-missions`（`{p:{任務id:進度}, done:[任務id]}`），8 款任務造型接在原 4 款之後（索引 4～11，沿用 `deep-sea-thief-skin`）。

操作：左右滑動或點左右兩側換道，往上滑或點中間跳；滑動距離達 22 單位立即觸發，沒滑動就在放開時當作點擊。鍵盤 ←／→／A／D 換道、空白鍵／↑／W 跳，M 開關音效（存於 `deep-sea-thief-sound`）。音效與背景音樂以 Web Audio 即時合成，沒有音檔：撿到東西是短促的勝利音，任務與升級是銅管號角，被抓是刮唱片、管弦重擊配定音鼓與鈸、滑哨下墜、晶片音「哇—哇—哇—哇～」洩氣長音，最後一聲委屈的「喵～」；背景是 150 BPM 的 C–Am–F–G 追逐節奏，搭配隨速度變強的風聲，分數過 150 後鼓點加密。新手提示：竹籃接近或拖鞋瞄準時，在貓上方顯示滑動手勢或按鍵圖示 1.5 秒，兩次提示至少間隔 7 秒；跳過 2 個竹籃且躲過 1 次瞄準拖鞋、或玩滿 3 局後不再出現（`deep-sea-thief-tutorial`）。場景與故事（2026-11-25，僅畫面與聲音）：分數達 150 進入「第 2 章 · 黃昏市集」、達 400 進入「第 3 章 · 夜市狂奔」（與 BONUS 門檻相同），天空、草地與整體色調在 1.2 秒內漸變，黃昏有夕陽、夜晚有星星月亮、兩側紙燈籠與攤位燈光；換章時顯示章節橫幅與號角，配樂黃昏加沙鈴、夜晚改為 Am–F–C–G 並在每輪開頭敲鑼。每章有 3 格以遊戲素材繪製的漫畫，首次開啟遊戲自動顯示第 1 章（點一下或按空白鍵關閉，也可直接開始），之後到達的新章節在結算畫面以左上角書本按鈕（有驚嘆號提示）閱讀，進度存在 `deep-sea-thief-story`（`{r:最高章節索引, seen:[已讀章節]}`）。結算畫面依序提示一個「再來一局」的理由：未讀章節、差一點破紀錄、快完成的任務、快到下一章；結算卡出現 0.5 秒後點畫面或按空白鍵／Enter 即可再玩，開始畫面點畫面也會直接開始。

長期目標（2026-11-25，僅存在瀏覽器、不發點數）：開始與結算畫面左側四個按鈕依序為故事書、貼紙簿、小貓窩、每日挑戰。累計數據存在 `deep-sea-thief-life`（局數、各水果、魚、跳籃、閃拖鞋、暴衝、金蘋果、暴怒閃過、送回水果數、單次最多送回、最高章節、最高分、已得貼紙、每日挑戰紀錄）。貼紙簿 20 張：第一局、蘋果 100、橘子 50、魚 50、跳籃 100、閃瞄準拖鞋 50、一次送回 5 顆、累計送回 200、抵達黃昏、抵達夜市、第一次暴衝、暴衝 25 次、第一顆金蘋果、金蘋果 20、閃過一整輪暴怒、單局 400、單局 800、被抓 25 次、完成一次每日挑戰、連續 7 天；得到時跳出「新貼紙！」，點貼紙看取得方式。小貓窩依累計送回的水果數升級（0／20／60／150／300／600 共 6 級：毯子、魚缸、紙燈籠、坐墊、歡迎回家招牌），小貓隨等級變胖，點小貓會喵一聲並冒愛心。每日挑戰：以當地日期產生同一顆種子（v3 規則、固定 10 毫秒步進），目標分數依日期在 200／250／300／350 輪替；只在本機記錄今日最佳、是否完成與連續天數，不送排行榜，但 BONUS 里程碑、任務、GA4 與一般局相同。結算後點畫面或按空白鍵會以同一模式再玩。

臨場感（僅畫面與聲音，不改判定）：老闆娘逼近時畫面四周泛紅並隨心跳脈動，距離越近心跳越快；被打中時手機震動（支援時）。兩側風線隨速度變多變亮。被打中只有約 0.15 秒、幾像素的輕微晃動（規則檔的 `shake` 設定後不會歸零，畫面不讀取它，改由實際被打中時觸發）。撞到竹籃時貓會側摔、頭上冒星星再爬起，竹籃翻倒並灑出三顆水果；被拖鞋打中則壓扁一下。被抓時先刮唱片、管弦重擊與定格放大約 0.7 秒，再落下結算卡（系統開啟「減少動態效果」時略過定格與動畫）。畫面字型：標題用 Lilita One、內文用 Baloo 2、中文用粗體 Noto Sans TC，由頁面的 Google Fonts 連結載入。跳躍的滯空時間仍由規則檔決定（0.55 秒），畫面上只加高拋物線、起跳拉長、落地壓扁與塵土，不影響判定。

v3（2026-11-25，目前版本，`rulesVersion=3`）＝v2 數值再加三項玩法：①暴衝模式 Zoomies：連續撿 10 顆水果且中途沒被打到，進入 5 秒暴衝（速度 ×1.08、不受背上水果重量影響、老闆娘距離每秒 +2 而非流失、每顆水果再加 5 分即共 10 分；暴衝中背上滿 5 顆仍可撿）；②金蘋果：距離 6,000 起、之後每 16,000～22,000 出現在空跑道，撿到 +15 分、距離 +10 並直接觸發暴衝；③老闆娘暴怒：距離 9,000 起、之後每 9,000～13,000 觸發，1 秒後連丟 3 隻瞄準貓當下跑道的拖鞋（警示 0.7 秒、間隔 0.75 秒，期間暫停一般拖鞋），三隻都沒被打中 +20 分。分數＝floor(距離/50)＋水果數×5＋上述額外分。模擬：反應正常的玩家約每局 0.6 次暴衝、0.6 顆金蘋果，達 400 分比例由 v2 的約 17% 升到約 38%。排行榜依 `rulesVersion` 分別回放 v1（未帶版本的舊客戶端）、v2 與 v3。

吃魚的意義：背上的水果會飛回左上角的小貓窩（顯示「送回去給小貓了！」），所以背上歸零、身體變輕；背上沒有水果時顯示「身輕如燕！」。

每局固定入場 10 點（現行全站 `ENTRY_FEE=0`，實際免費），無終點。BONUS：150／400／800 分 三個里程碑，各立即入帳固定 5 點（單局最多 15 點），每個里程碑當局只發一次；達標判定在遊戲更新之後、且回合仍進行時，造成失敗的那一幀不計。獎勵與入場費無關，失敗或重新整理不扣回，結束時不另發點；`end.payout_points` 記錄本局已入帳總額。最佳紀錄存於 `deep-sea-thief-best`。里程碑門檻沿用原頁造型解鎖門檻；v2 以模擬校準：不操作約 12 秒結束，反應正常的玩家多數可達 150 分、約兩成達 400 分，800 分需高手（僅模擬，未經真人實測）。切換遊戲或背景分頁時暫停，重新整理放棄本局、已扣點不退。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/thief/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
