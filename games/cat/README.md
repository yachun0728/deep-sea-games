# 屋頂貓貓 Rooftop Cat（cat）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#cat`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「無盡跑酷，看你能跑多遠。」｜立即開玩 · 無盡挑戰
- 追蹤名稱（GA4 `game_name`）：屋頂貓貓，`game_id` 為 `cat`
- 檔案：`games/cat/card.html`、`games/cat/cover.webp`、`games/cat/game.js`、`games/cat/icon.svg`、`games/cat/leaderboard.webp`、`games/cat/view.html`；`game.js` 共 719 行、67.8 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「19. Rooftop Cat（cat）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-cat`、`ct-canvas`、`ct-score`、`ct-best`、`ct-next`、`ct-amount`、`ct-go`、`ct-msg`、`ct-rank-status`、`ct-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`KC`（L80）、`K`（L81）、`SFX`（L604）、`BTN`（L636）、`catBusy`（L2）
- L7 常數：`DPR`
- L13 常數：`MILESTONES`、`ENDLESS_FROM`、`ENDLESS_STEP`、`ENDLESS_BONUS`、`LADDER`
- L22 常數：`FONT`
- L82 常數：`TAU`
- L114 常數：`SEP`
- L235 常數：`CITY`
- L243 常數：`SIGNS`
- L244 常數：`SIGNC`
- L301 常數：`GRAIN`
- L327 常數：`DEP`
- L329 常數：`ROD`
- L332 常數：`BLD`
- L363 常數：`PROPS`
- L371 常數：`SHEDC`
- …另有 7 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`puff` L10、`bonusAt` L14、`nextMilestone` L15、`O` L18、`C` L19、`F` L20、`mix` L24、`dark` L25、`tx` L26、`score` L32、`say` L33、`setText` L35、`award` L36、`ui` L42、`die` L49、`update` L59、`chain` L83、`limb` L85、`shape` L88、`el` L89、`blobPath` L92、`patch` L93、`bodyPath` L96、`tailUpdate` L101、`drawTail` L103、`hp` L116、`inHead` L117、`headShape` L123、`earInner` L128、`neckBridge` L130、`headCoat` L135、`face` L142、`coat` L153、`headFront` L156、`farEar` L158、`collar` L159、`nearLimb` L161、`catBody` L163、`front` L165、`gallop` L181、`fa` L183、`catPose` L186、`kitty` L206、`catSit` L209、`bp` L211、`tp` L213、`catFlop` L226、`seeded` L233、`layer` L234、`fillP` L245、`drawHills` L247、`ridge` L248、`drawCloud` L252、`drawTower` L258、`drawFar` L270、`one` L272、`drawMid` L284、`one` L286、`drawCanopy` L299、`grain` L302、`bgLayers` L304、`scroll` L305、`pigeon` L306、`backdrop` L307、`dxAt` L328、`poly` L331、`box` L339、`acUnit` L342、`prop` L346、`shed` L365、`sideFace` L372、`grilleWindow` L378、`vSign` L385、`roof` L389、`grade` L416、`roofAt` L418、`tinRoof` L421、`firstSeen` L435、`pigeon` L440、`marker` L452、`star` L458、`paw` L459、`tapHint` L461、`drawFx` L468、`sitImg` L476、`runFrame` L483、`catSprite` L486、`obstacle` L498、`fishIcon` L529、`drawFish` L534、`tripMarks` L538、`draw` L544、`cityTitle` L575、`LS` L581、`audioInit` L583、`syncAudio` L593、`mf` L595、`tone` L597、`hiss` L602、`sfx` L615、`music` L620、`openPanel` L637、`closePanel` L638、`autoPause` L639、`canvasPoint` L640、`tapUI` L642、`cornerButton` L647、`pill` L656、`drawPanel` L658、`row` L662、`signAhead` L670、`slideButton` L671、`slide` L676、`holdHint` L678、`start` L684、`down` L696、`release` L700、`loop` L711

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L37 `award`：`S.balance+=b;`

**餘額檢查**
- L688 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L38 `award`：`AN.progress(analytics,{step:m,score:m,bonus_points:b});`
- L53 `die`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:s});`
- L691 `start`：`analytics=AN.start('cat',amount);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-cat-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/result-share.js` 會呼叫：`score`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`catBusy` 所在 IIFE。無盡跑酷：自動跑屋頂，點按／按住調整跳躍；掉進空隙或撞牆才結束。顯示距離 score=floor(dist/60)。每局固定扣 10；**沒有倍率，也沒有結束時的結算**，改為里程碑獎勵：跑到下列公尺數時，固定點數當場加入共用餘額（`award`，每個里程碑只入帳一次，之後摔下去不收回）：

| 公尺 | 150 | 300 | 500 | 750 | 1000 | 之後每 +250 |
| --- | --- | --- | --- | --- | --- | --- |
| 獎勵 | +3 | +7 | +15 | +30 | +60 | +40 |
| 累計 | 3 | 10（回本） | 25 | 55 | 115 | — |

大廳卡片以 `game-card-bonus`（「✦ BONUS」）標示有獎勵，不說明達成方式；遊戲畫面不顯示本局累計淨賺／損。里程碑以常數 `MILESTONES`／`ENDLESS_*` 定義，`bonusAt`、`nextMilestone` 為純函式。結束時 `AN.end` 的 payout_points 為本局累計入帳，每個里程碑另送 game_progress（step、score、bonus_points）。

難度：速度 `min(400, 190+dist×0.0035)` px/s（約 1,000 公尺到最高速）；空隙 45～`40+v×0.34`；屋頂寬 `[max(105,170−s×.12), max(180,300−s×.3)]`、高低落差額外 ±`min(20,s×.04)`（s 為公尺）；剛走出邊緣 0.14 秒內仍可起跳（`COYOTE`）。

距離校準（2026-11-17，非真人數據）：用重現本遊戲物理的模擬器，讓帶雜訊的玩家各跑 400 局。「技術好」起跳誤差σ≈0.05 秒、「不錯」0.07、「一般」0.09、「新手」0.13（另有按住時間誤差）。到達各距離的比例：

| 距離 | 150 m | 300 m | 500 m | 750 m | 1000 m |
| --- | --- | --- | --- | --- | --- |
| 技術好 | 94% | 85% | 57% | 23% | 9% |
| 不錯 | 73% | 48% | 16% | 2% | 0% |
| 一般 | 35% | 7.5% | 0.3% | 0% | 0% |
| 新手 | 6% | 0% | 0% | 0% | 0% |

中位數約：一般 100 m（約 30 秒）、不錯 290 m、技術好 540 m。此外一個固定節奏的腳本在正式參數下的測試副本跑到過 415 m。這些數字只是起點，應以正式站的 `game_end` score 分布（GA4）重新校準；調整時只改 `MILESTONES` 與難度常數。重新整理會放棄本局但已入帳的獎勵保留；最佳紀錄 `deep-sea-cat-best` 不變。

**規則 v2（2026-11-27，`shared/cat-rules.cjs` 的 `rulesVersion: 2`；尚未上線）**：加快速度、屋頂障礙、會塌的鐵皮屋頂、鴿子、要滑過去的招牌、更大的高低差與小魚乾。v1 原封保留（不多抽亂數、兩種操作），舊用戶端開的局仍以 v1 重播驗證。開局時用戶端送 `{rulesVersion: 2}`，伺服器 `ranked-boards.mjs` 依版本選 v1（`inputCount` 2）或 v2（`inputCount` 3）重播。

- **操作**：0 按下跳、1 放開跳、2 滑行（v2 新增）。滑行 0.55 秒，身體高度由 38 降為 18；在空中按滑行會加速下落（下落速度至少 450）並在 0.2 秒內落地時接著滑行；跳躍會取消滑行。手機為左下角的滑行鈕，鍵盤為 ↓ 或 S（`KeyboardEvent.code`），不使用 Escape。
- **速度**：`v = min(430, 230 + 距離px × 0.00476)`，約 700 m 到最高速（v1 為 `min(400, 190 + 距離px × 0.0035)`，1000 m 才到頂）。
- **高低差**：高低範圍 `min(70, 公尺 × 0.12)`，屋頂最高可到 y 300（v1 為 `min(20, 公尺×0.04)`、最高 340）。往上爬的高度有上限：一般 `40 + 空隙 × 0.5`，鐵皮屋頂之後或剛爬過 60 以上時為 50，確保在邊緣才起跳也跳得上去。
- **障礙**（30 m 起；距離前緣至少 `max(60, v×0.6) + 爬升高度×1.5`（留落地空間）、距離後緣至少 `max(90, v×0.5)`，兩個障礙之間至少 `max(120, v×0.6)`；被選中放障礙的屋頂會加寬到放得下）：
  - `low` 屋頂雜物（冷氣、木箱、花台；寬 26～40、高 16～22）：碰到就**絆倒**。
  - `step` 不鏽鋼水塔（寬 50～84、高 30～42）：可以站上去；從側面撞上（腳低於頂面 14 以上）就結束，與撞屋頂牆相同。
  - `line` 曬衣繩（寬 70～110，衣服掛在屋頂上方 54～76）：跑過或滑過不會碰到；在它下方起跳或落下時身體碰到就**絆倒**。
  - `sign` 低掛的招牌（寬 34～50，掛在屋頂上方 26～110）：站著跑會撞到而**絆倒**，要**滑過去**（或用大跳越過）。
  - 30～150 m 只有 `low`；150 m 起 `low` 45%、`step` 20%、`line` 15%、`sign` 20%；300 m 起每個屋頂最多 2 個；每個位置的出現機率 `min(0.75, 0.25 + 公尺×0.001)`。
- **鐵皮屋頂**（60 m 起，機率 `min(0.3, 0.1 + 公尺×0.0004)`）：寬 80～120、上面不放其他東西；貓落地 0.45 秒後塌掉，要趕快再跳。
- **鴿子**（120 m 起，機率 `min(0.6, 0.15 + 公尺×0.0008)`）：飛在屋頂上方 58～100、往貓的方向多飛 40～90 px/s；碰到就**絆倒**。出生位置經過計算，讓牠在屋頂中段、遠離邊緣與障礙的地方和貓相遇，所以只要那時不要跳就能避開。
- **絆倒**：0.6 秒內速度降為 60%；之後 4 秒內再絆倒一次就結束本局（結果畫面標題改為「Tripped twice!」）。
- **小魚乾**：空隙上方的弧線（20 m 起，45%）、空屋頂上的一排（10 m 起，40%）、水塔頂上 2 條；碰到就收集。只計本局數量，不換成站內點數、不另外儲存（用途待定），也不送 GA4（待定）。
- **排名與獎勵不變**（使用者 2026-11-27 決定）：仍以終局整數距離排名，里程碑公尺數與點數不變；v2 較難，所以玩家達成里程碑的比例會下降。
- **公平性驗證**（瀏覽器測試頁，2026-11-27）：會預判、會滑行的機器人在 200 個種子上全部跑到 2,000 m，0 次絆倒；平均經過 88 個 `low`、37 個 `step`、27 個 `line`、36 個 `sign`、56 個鐵皮屋頂、7 隻鴿子。v1 與舊檔逐格一致（60 個種子）；完成的局重播分數一致。
- **難度對照**（同一個帶雜訊、會滑行的玩家模型，各 150 局；模型比上方 2026-11-17 的校準嚴格，只用來比較 v1／v2）：起跳誤差σ 0.03 秒時 150／300／500／750 m 達成率 v1 87%／84%／74%／29%、v2 87%／67%／36%／14%；σ 0.045 秒時 v1 47%／27%／13%／1%、v2 48%／11%／5%／2%。150 m 前難度相同，之後明顯變難；里程碑點數的實際發放率會跟著下降，需上線後以 GA4 `game_end` 分布確認。

訪客榜以終局整數距離排名。Worker 重播跳躍按下／放開（v2 另有滑行）與屋頂碰撞。 最多驗證十分鐘的遊戲時間。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/cat/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
