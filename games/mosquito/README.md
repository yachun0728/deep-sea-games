# 血壓上升 Midnight Mosquito（mosquito）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#mosquito`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「深夜當蚊子，吸飽血再從窗戶逃走，別吵醒他。」｜立即開玩 · 按住吸血
- 追蹤名稱（GA4 `game_name`）：血壓上升，`game_id` 為 `mosquito`
- 檔案：`games/mosquito/card.html`、`games/mosquito/cover.webp`、`games/mosquito/game.js`、`games/mosquito/icon.svg`、`games/mosquito/leaderboard.webp`、`games/mosquito/view.html`；`game.js` 共 347 行、21.6 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「35. 血壓上升 Midnight Mosquito（mosquito）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-mosquito`、`mq-canvas`、`mq-blood`、`mq-alert`、`mq-best`、`mq-info`、`mq-help`、`mq-help-title`、`mq-help-close`、`mq-amount`、`mq-go`、`mq-msg`、`mq-rank-status`、`mq-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`mqBusy`（L2）
- L6 常數：`MQ_REWARDS`、`MQ_WIN_REWARD`
- L12 常數：`FONT`
- L21 常數：`INK`、`WALL`
- L24 常數：`ART`、`BED_Y`、`BED_H`
- L25 常數：`MQ_SPRITE`
- L33 常數：`SKIN_LIFT`
- L141 常數：`SWAT_HEAD`
- L192 常數：`CAUSE`

## 函式索引（game.js，行號為宣告位置）

`rr` L13、`text` L14、`lerp` L19、`bloodColor` L20、`loadArt` L26、`ready` L31、`skinLift` L39、`line` L47、`drawRoom` L49、`sleeperPose` L72、`drawHuman` L87、`drawMosquito` L115、`swatFrame` L142、`drawZap` L143、`drawExitGuide` L152、`drawBar` L160、`drawHUD` L166、`computeHint` L179、`held` L194、`releaseInput` L195、`say` L196、`setText` L198、`ui` L199、`pay` L204、`checkMilestones` L208、`finish` L212、`handleEvents` L227、`tick` L242、`drawOverlay` L261、`draw` L291、`start` L307、`shown` L317、`setHelp` L319、`endPointer` L334、`loop` L344

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L205 `pay`：`S.balance+=n;`

**餘額檢查**
- L310 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L206 `pay`：`AN.progress(analytics,{stage:1,step:paidCount,score:Math.round(mo.blood),bonus_points:n,total_bonus_points:ea…`
- L220 `finish`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:Math.round(result.blood),step:paidCount,stage:1});`
- L312 `start`：`analytics=AN.start('mosquito',amount);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-mosquito-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`mqBusy` 所在 IIFE。蚊子視角單鍵遊戲：按住俯衝、放開上升，水平自動來回（120 px/s）。畫布 480×720，只在 `view-mosquito` 顯示且分頁可見時更新；Space 只在本款畫面且本局進行中作用，放開、失焦、切換畫面或分頁都會釋放按鍵。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始」時一次扣除並呼叫 `AN.start('mosquito')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。
- 玩法：慢速（≤190）降落在臉頰／手臂／腳的皮膚區可吸血（速率 16／12／9 %/s，警覺增加 3.8／2.1／1.4），太快撞上會摔暈 1 秒；吸得越飽越重（上升變慢、俯衝變快）。警覺滿 100% 會開燈。
- 降落區（規則 v2，2026-11-28 換新畫面時移到皮膚上；畫布座標 x／高度）：臉 60～132／485、手臂 152～248／572（與 v1 同高，從手臂起飛的逃脫時間不變）、腳 416～458／544，非皮膚表面 578。速率與警覺值未改。開燈後逃跑時間由 2 秒放寬為 4.5 秒（2026-11-28 使用者要求）。排行榜重播分版本：`rulesVersion` 2 用 `shared/mosquito-rules.cjs`，未送版本的舊客戶端用 `shared/mosquito-rules-v1.cjs`；發布時須先部署 API Worker 再更新前端。
- 畫面：漫畫風素材在 `games/mosquito/art/`（4×2×2 格人物圖與蚊子 6 姿勢），進入本款畫面才載入；睡覺表情依警覺值分 4 段，抓癢與翻身依規則計時播放。皮膚輪廓的高低差只影響蚊子畫的位置，不影響判定。翻身預警與發生時畫出 y=400 危險線。
- 三種死法：抓癢（吸血中被發癢預兆後 1.2 秒出手，仍在該皮膚區才死）、翻身（預警 1.8 秒，飛行高度 y>400 即被壓死）、開燈（4.5 秒內沒飛到窗洞就被電蚊拍打死；v1 舊客戶端為 2 秒）。
- 勝利：吸血 100% 後從左牆窗洞（y 62～130）飛出。吸滿但被開燈逼出窗洞也算勝利；吸不滿就逃走只算逃脫，沒有勝利獎勵。
- BONUS（固定點數，不依入場費計算；數值為暫定提案）：吸血 25% 立即 +1、50% +2、75% +3，吸滿逃出 +4；全拿共 10 點，剛好回本。每個門檻每局只發一次，即時入帳後死亡不扣回；每次入帳 `AN.progress` 帶 `bonus_points` 與 `total_bonus_points`；結束只呼叫一次 `AN.end`，payout 為本局已入帳總和。
- 最高紀錄與重設：最高吸血百分比存 `deep-sea-mosquito-best`（只增不減，一位小數），只顯示、不換點數。重設 500 點在本局進行中（`mqBusy`）會被擋下；餘額快照也計入已扣入場費。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目；`js/i18n.js` 的 `names` 清單加入 `Midnight Mosquito`；`tools/i18n_browser_games.js` 登錄 `mosquito:'mq-go'`。
- 尚未實作（預計 v0.2）：音效、死亡卡片、死亡熱點。難度數值（警覺、翻身、抓癢）依機器人模擬調整，非真人數據。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/mosquito/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
