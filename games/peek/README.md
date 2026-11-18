# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「抱著八音盒夜逃，聽聲辨位躲開走廊裡的東西，燈滅前蓋住螢幕。」｜免費遊玩 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 249 行、20.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「34. 別看 Don’t Peek（peek）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-peek`、`peek-canvas`、`peek-prog`、`peek-spirits`、`peek-best`、`peek-codex`、`peek-dodges`、`peek-amount`、`peek-go`、`peek-gyro`、`peek-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L15）、`peekBusy`（L2）
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
- …另有 4 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`rnd` L25、`clamp` L26、`tx` L27、`RR` L28、`reset` L31、`audioInit` L35、`tone` L36、`say` L42、`setText` L44、`ui` L45、`fx` L50、`end` L51、`pay` L63、`pickPool` L67、`startEvent` L70、`nextGap` L76、`survive` L80、`inputs` L84、`update` L87、`lampLevel` L113、`frm` L120、`wallY` L121、`depthS` L122、`poly` L123、`shade` L124、`drawCorridor` L125、`drawRunner` L142、`drawSpirits` L153、`drawScene` L173、`drawButtons` L174、`draw` L177、`start` L207、`shown` L215、`region` L216、`syncPtrs` L220、`upPtr` L227、`clearInput` L235、`onOrient` L240、`go` L244、`loop` L246

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L64 `pay`：`S.balance+=n;`

**餘額檢查**
- L210 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L57 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p});`
- L65 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L212 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）
- `deep-sea-peek-dodges`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`peekBusy` 所在 IIFE，內含完整遊戲邏輯（`WIND_RATE`、`EYE`／`TWIN`／`WALK` 判定參數、`CAUSES`）。夜間走廊夜逃（背後視角）：玩家自動往出口跑（`BASE_RATE` 每秒 2%），按住「衝刺」變兩倍快（`WIND_RATE` 每秒 4%），進度到 100% 過關，期間三種邪靈依本局躲過次數登場。畫布 400×560，只在 `view-peek` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停（並清空按鍵與觸控狀態）。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始逃跑」時一次扣除並呼叫 `AN.start('peek')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。
- 操作：電腦 `W` 衝刺（按住）、`A`／`D` 靠左右牆、空白鍵蓋住；手機用畫布下方四顆按鈕（靠左、靠右、蓋住、衝刺，多點觸控）。衝刺時身體被固定在走廊中間、不能靠牆；衝刺時下一次襲擊來得快 2 倍（`SPRINT_GAP`）；蓋住螢幕時停止前進。「啟用體感」為選用，用 `deviceorientation` 的 gamma 當左右位置、`|beta|>145` 當螢幕朝下（iOS 需使用者授權；不支援時改用按鈕）。沒蓋住時一直往前跑。
- 邪靈：窺視之眼（前兆 2.5 秒，紅光 3 秒，需往反方向傾斜 ≥0.5，累計暴露超過 0.35 秒即死）；雙子怨靈（前兆 2.5 秒，判定 1.5 秒內往笑聲反方向傾斜 ≥0.6，往笑聲方向超過 0.3 即死，時間到沒躲到也死）；無頭巡夜人（前兆 6 秒、最後 1.5 秒燈閃三下，熄滅時必須蓋住，之後 4 秒內蓋住且傾斜 ≤0.3，否則死）。同一種不連續出現（只剩一種可選時除外）。登場依本局已躲過次數：0～1 次只有窺視之眼、2 次起加入雙子怨靈（`UNLOCK_TWINS`）、3 次起加入無頭巡夜人（`UNLOCK_WALKER`）。前兩次窺視之眼的前兆放寬為 3.5 秒（`EYE_EASY_WARN`）。第一次襲擊在開局 9 秒後（`FIRST_GAP`）；之後間隔由進度 0% 的約 7 秒線性縮到 80% 的約 4 秒（±1 秒），每躲過 3 次下一次多 3 秒喘息；進度達 85% 時有 75% 機率在 1～3 秒內再補一次（每局一次）。聲音比畫面前兆早 0.4 秒（`SOUND_LEAD`）。
- 結束：死亡（四種死因 `eye`／`twins`／`walkerLate`／`walkerMove`）或進度到 100%（衝出出口、打開盒子）。結束時只呼叫一次 `AN.end`，payout 為本局已入帳 BONUS 總和。
- BONUS（固定點數，不依入場費計算）：躲過第 2 次襲擊立即 +2 點；衝出出口打開盒子立即 +5 點。每項每局只發一次；全拿 7 點、低於入場 10 點，不會回本。即時入帳後死亡不扣回；中途離開或重新整理已入帳者保留、入場點數不退。每次入帳 `AN.progress` 帶 `bonus_points`。
- 分數（每躲過一次 +100、通關 +500）只顯示，不換點數。最佳進度存 `deep-sea-peek-best`，各死因次數存 `deep-sea-peek-deaths`（JSON 物件），累計躲過次數存 `deep-sea-peek-dodges`；畫面顯示「死因圖鑑 X / 4」與累計躲過，只顯示不換點數。
- 重設 500 點：本局進行中（`peekBusy`）會被擋下並顯示提示；重設不算 BONUS。
- 音效：Web Audio 立體聲提示（單耳笑聲、紅光、腳步聲），瀏覽器不支援時靜音，不影響玩法。畫面含閃爍燈光，規則說明有警語。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目；`js/i18n.js` 的 `names` 清單加入 `Don’t Peek`。
- 平衡（機器人模擬 1000 局／組，非真人數據，v0.2）：完美操作 100% 通關，不衝刺平均約 55 秒、每次遇到鬼就放開衝刺的衝刺型約 40 秒；每次襲擊漏看 15% 約 53～61% 通關、30% 約 26～32%、50% 約 7～11%（衝刺型略高）。階段登場與放寬前兆讓新手首局比 v0.1 容易，真人測試前數值為暫定。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
