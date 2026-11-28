# 小灰出門 Pet Walkies（pet-walk）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#pet-walk`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「一鍵帶小灰散步，路上撞見野狗、河鯊和幸運轉盤。」｜立即開玩 · 一鍵散步
- 追蹤名稱（GA4 `game_name`）：小灰出門，`game_id` 為 `pet-walk`
- 檔案：`games/pet-walk/card.html`、`games/pet-walk/cover.webp`、`games/pet-walk/game.js`、`games/pet-walk/icon.svg`、`games/pet-walk/style.css`、`games/pet-walk/view.html`；`game.js` 共 852 行、49.9 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「38. 小灰出門 Pet Walkies（pet-walk）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-pet-walk`、`pw-canvas`、`pw-steps`、`pw-score`、`pw-best`、`pw-go`、`pw-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`EVT`（L49）、`TX`（L105）、`G`（L159）、`BTN`（L510）、`petBusy`（L2）
- L6 常數：`CONFIG`
- L15 常數：`STEPS_PER_SEG`
- L19 常數：`ITEMS`
- L31 常數：`ITEM`
- L33 常數：`GEN_NO_CAN`
- L34 常數：`MATS`
- L35 常數：`UNCOMMON`
- L37 常數：`TERR`
- L38 常數：`TERR_NAME`
- L39 常數：`TERR_STYLE`
- L44 常數：`POOLS`
- L49 常數：`EVT`
- L89 常數：`EVENT_IDS`
- L91 常數：`CELLS`
- …另有 11 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`T` L18、`IN` L32、`mulberry32` L129、`rint` L134、`pick` L135、`pickW` L136、`shuffle` L137、`defaultSave` L140、`loadSave` L142、`persist` L156、`L` L166、`syncLang` L167、`tf` L168、`terrNow` L169、`invOf` L170、`addFloatText` L172、`startTrip` L177、`terrAt` L193、`doStep` L194、`completeStep` L198、`addItem` L230、`gainLine` L238、`spawnFlights` L242、`chooseEvent` L247、`triggerEvent` L260、`resolveChoice` L336、`evDesc` L385、`evQuoteObj` L386、`setQuote` L387、`dismissEvent` L388、`endEvent` L396、`startWheel` L408、`drawCellIdx` L412、`stopWheel` L422、`mod` L433、`applyWheelCell` L437、`finishWheel` L456、`updateWheel` L465、`endTrip` L486、`diaryLines` L502、`hit` L516、`press` L518、`release` L554、`toLogical` L560、`pwShown` L561、`update` L577、`loadFelt` L617、`feltReady` L621、`art` L622、`rr` L628、`circ` L629、`txt` L630、`wrap` L631、`lines` L632、`panel` L633、`btn` L655、`chip` L656、`drawPet` L657、`eyeColor` L673、`drawWorld` L674、`drawProp` L689、`petOpts` L690、`petPose` L691、`drawBubble` L692、`drawHUD` L696、`drawFlights` L708、`drawFloatTexts` L709、`drawCard` L710、`drawWheel` L720、`drawTitle` L737、`diaryPageLayout` L743、`drawDiary` L753、`drawDex` L769、`drawWalk` L777、`render` L785、`saveImage` L794、`say` L798、`setText` L800、`ui` L801、`segmentDone` L811、`finishTrip` L817、`begin` L826、`resetClock` L839、`frame` L843

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L813 `segmentDone`：`S.balance+=1;`

**餘額檢查**
- L828 `begin`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 3 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L814 `segmentDone`：`if(analytics)AN.progress(analytics,{stage:seg,step:t.steps,score:t.loot+CONFIG.newEntryBonus*t.newCount,bonus…`
- L820 `finishTrip`：`if(analytics)AN.end(analytics,earned,earned>0?'complete':'loss',{score:total,step:CONFIG.stepsPerTrip,stage:3…`
- L829 `begin`：`analytics=AN.start('pet-walk',ENTRY_FEE);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

- **排行榜政策（2026-11-29 使用者指定）**：本遊戲不加入 Leaderboard／訪客排行榜，不上傳散步分數、不顯示全球名次；分數與最高紀錄僅保留為本機個人紀錄。後續美術更新、玩法改造或重新上架，不得因預設接榜規範自行加入排行榜；變更須由使用者另行明確授權。

定位：`petBusy` 所在 IIFE，內含完整遊戲邏輯（`CONFIG`、`EVT` 12 種事件、`POOLS` 三種地形事件池、`CELLS` 轉盤 8 格）。一鍵自動散步：點一下走一步、按住連續走，每隔 3～6 步觸發隨機事件，部分事件二選一，幸運轉盤可抓時機停下。畫布 400×844，只在 `view-pet-walk` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停。

- 入場：依目前 `js/config.js` 為免費（`ENTRY_FEE=0`），按「出門」時呼叫 `AN.start('pet-walk')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。畫布內沒有開始按鈕，也不會因點畫布或按空白鍵而開始一趟。
- 流程：一趟 60 步（平原、水域、山地各 20 步，順序隨機）；走滿 60 步寫日記並結束。沒有失敗狀態，小灰不會受傷或死亡。
- BONUS（固定點數，不依入場費計算）：每走完一段 20 步立刻 +1 點，每段每趟只發一次，一趟最多 3 點。完整走完一趟目前不扣入場點數、入帳 3 點。獎勵當場入帳，結束後不收回；中途重新整理，已入帳的保留；目前沒有入場費（本趟不會呼叫 `AN.end`，與其他遊戲相同）。
- 轉盤、物資、圖鑑與分數（物資分 1／3／10，每個新事件、稀有事件、物資第一次出現 +5）只顯示，不換點數。轉盤只決定物資，不給點數；「完美時機」與彩虹只調整物資格子的權重。
- 事件二選一：E03 鐵櫃（用頭撞開免費／繩索撬開需繩索 ×1）、E04 野狗（分罐頭 ×1 換一次轉盤／跟著吠）、E07 漂流箱（小心打開換一次轉盤／用力踹開）。選項點按鈕；按空白鍵或閒置 8 秒會自動選標示預設的免費選項，避免只用鍵盤時卡住。
- 終點：走滿 60 步後，門口會出現最後一次幸運轉盤（只給物資），轉完才寫日記。BONUS 第 3 點在走完第 60 步當下入帳，不等轉盤。
- 物資用途：持有 3 個以上 AI 字詞碎片時，下一趟出門自動消耗 3 個，前 3 次轉盤好運加成（與彩虹相同），不給點數。
- 首趟固定劇情：第一個事件是 E02 木箱，第二個是 E01 轉盤；之後依地形事件池加權隨機，同事件不連續出現，轉盤的「有事發生」會讓下一個事件在 1 步後出現並避開轉盤類。
- 儲存：`deep-sea-pet-walk-save`（JSON：最高分、出門次數、物資、事件圖鑑、物資圖鑑、上次事件）。壞資料會回到預設值；物資每種上限 99。
- 重設：平台目前沒有重設點數按鈕。
- 語言：遊戲內文字依大廳語言（`window.deepSeaI18n`）每格直接輸出中文或英文；遊戲內雙語字串由 `{{tb:pet-walk.say.*}}` 搭配 `locales/zh-Hant.json`／`locales/en.ids.json` 在組合時展開，不使用短物資名稱去影響其他遊戲的顯示層翻譯。`js/i18n.js` 的 `names` 清單加入 `Pet Walkies`。
- 測試：`node tools/test_pet_walk.mjs`。
- 平衡（目前僅機器人模擬，非真人數據）：單趟平均物資分約 24（35% 的「繩索撬開」會出 AI 字詞碎片，會拉高）；門檻 27／18 決定日記第三句。分數平衡尚待真人測試。

- 2026-11-29 毛氈外觀：依核准設計稿製作灰色機器寵物、雙骨架短腳步行、三地形側視橫向捲動毛氈場景、布料 HUD／事件卡／圖鑑與日記。正式素材位於 `games/pet-walk/art/felt-v1/`，核准稿及來源保存在 `design/`；圖片失敗可點畫布重試，載入完成前不開局。只改呈現，不改既有玩法、點數、存檔或追蹤。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/pet-walk/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
