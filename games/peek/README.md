# 別看 Don’t Peek（peek）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#peek`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「轉動八音盒發條，躲開盒子裡的東西，燈滅前蓋住螢幕。」｜每局 10 點 · 聽聲反應
- 追蹤名稱（GA4 `game_name`）：別看，`game_id` 為 `peek`
- 檔案：`games/peek/card.html`、`games/peek/game.js`、`games/peek/icon.svg`、`games/peek/view.html`；`game.js` 共 203 行、16.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「34. 別看 Don’t Peek（peek）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-peek`、`peek-canvas`、`peek-prog`、`peek-spirits`、`peek-best`、`peek-amount`、`peek-go`、`peek-gyro`、`peek-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`EYE`（L11）、`peekBusy`（L2）
- L5 常數：`WIND_RATE`
- L6 常數：`WIND_MAX_TILT`
- L7 常數：`MILE_EVENTS`、`MILE_REWARD`、`WIN_REWARD`
- L8 常數：`FIRST_GAP`、`GAP_MIN`、`GAP_MAX`
- L9 常數：`DIRECTOR_AT`、`DIRECTOR_P`
- L10 常數：`TILT_SPEED`
- L11 常數：`EYE`
- L12 常數：`TWIN`
- L13 常數：`WALK`
- L14 常數：`TYPES`
- L15 常數：`CAUSES`
- L16 常數：`BTN`
- L184 常數：`KEYMAP`

## 函式索引（game.js，行號為宣告位置）

`rnd` L20、`clamp` L21、`tx` L22、`RR` L23、`reset` L26、`audioInit` L30、`tone` L31、`say` L37、`setText` L39、`ui` L40、`fx` L45、`end` L46、`pay` L58、`startEvent` L62、`survive` L66、`inputs` L69、`update` L72、`lampLevel` L97、`drawBox` L102、`drawBeam` L113、`drawTwins` L117、`drawButtons` L124、`draw` L127、`start` L161、`shown` L169、`region` L170、`syncPtrs` L174、`upPtr` L181、`clearInput` L189、`onOrient` L194、`go` L198、`loop` L200

## 錢包與結算接點

**扣款（開始一局）**
- L166 `start`：`S.balance-=amount;`

**入帳（領回／獎勵）**
- L59 `pay`：`S.balance+=n;`

**餘額檢查**
- L164 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L52 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p});`
- L60 `pay`：`AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});`
- L166 `start`：`analytics=AN.start('peek',amount);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-peek-best`（寫、讀）
- `deep-sea-peek-deaths`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`peekBusy`

## 規則摘要（取自 GAME_RULES.md）

定位：`peekBusy` 所在 IIFE，內含完整遊戲邏輯（`WIND_RATE`、`EYE`／`TWIN`／`WALK` 判定參數、`CAUSES`）。第一人稱八音盒機關：按住發條上弦到 100%，期間三種邪靈輪流襲擊。畫布 400×560，只在 `view-peek` 顯示且分頁可見時更新，切換遊戲或背景分頁時暫停（並清空按鍵與觸控狀態）。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始上弦」時一次扣除並呼叫 `AN.start('peek')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。
- 操作：電腦 `W` 發條、`A`／`D` 傾斜、空白鍵蓋住；手機用畫布下方四顆按鈕（多點觸控）；「啟用體感」為選用，用 `deviceorientation` 的 gamma 當傾斜、`|beta|>145` 當螢幕朝下（iOS 需使用者授權；不支援時改用按鈕）。發條只在盒子接近水平（|傾斜|≤0.35）且沒蓋住時轉動，每秒 +3%。
- 邪靈：窺視之眼（前兆 2.5 秒，紅光 3 秒，需往反方向傾斜 ≥0.5，累計暴露超過 0.35 秒即死）；雙子怨靈（前兆 2.5 秒，判定 1.5 秒內往笑聲反方向傾斜 ≥0.6，往笑聲方向超過 0.3 即死，時間到沒躲到也死）；無頭巡夜人（前兆 6 秒、最後 1.5 秒燈閃三下，熄滅時必須蓋住，之後 4 秒內蓋住且傾斜 ≤0.3，否則死）。同一種不連續出現；第一次襲擊 4 秒後，之後每次結束後隔 4～7 秒；進度達 85% 時有 75% 機率在 1～3 秒內再補一次（每局一次）。
- 結束：死亡（四種死因 `eye`／`twins`／`walkerLate`／`walkerMove`）或發條到 100%（打開盒子）。結束時只呼叫一次 `AN.end`，payout 為本局已入帳 BONUS 總和。
- BONUS（固定點數，不依入場費計算）：躲過第 3 次襲擊立即 +2 點；打開盒子立即 +5 點。每項每局只發一次；全拿 7 點、低於入場 10 點，不會回本。即時入帳後死亡不扣回；中途離開或重新整理已入帳者保留、入場點數不退。每次入帳 `AN.progress` 帶 `bonus_points`。
- 分數（每躲過一次 +100、通關 +500）只顯示，不換點數。最佳進度存 `deep-sea-peek-best`，各死因次數存 `deep-sea-peek-deaths`（JSON 物件）。
- 重設 500 點：本局進行中（`peekBusy`）會被擋下並顯示提示；重設不算 BONUS。
- 音效：Web Audio 立體聲提示（單耳笑聲、紅光、腳步聲），瀏覽器不支援時靜音，不影響玩法。畫面含閃爍燈光，規則說明有警語。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目；`js/i18n.js` 的 `names` 清單加入 `Don’t Peek`。
- 平衡（機器人模擬 1000 局／組，非真人數據）：完美操作 100% 通關、平均 60～66 秒；每次襲擊漏看 15% 約 48% 通關、30% 約 20%、50% 約 5%。真人測試前數值為暫定。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/peek/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
