# 拒絕加班 No Overtime!（office-shoot）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#office-shoot`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「自動開火擋下湧入的工作，打倒 17:00 大魔王準時下班。」｜立即開玩 · 自動射擊
- 追蹤名稱（GA4 `game_name`）：拒絕加班，`game_id` 為 `office-shoot`
- 檔案：`games/office-shoot/card.html`、`games/office-shoot/cover.webp`、`games/office-shoot/game.js`、`games/office-shoot/icon.svg`、`games/office-shoot/leaderboard.webp`、`games/office-shoot/style.css`、`games/office-shoot/view.html`；`game.js` 共 632 行、42.3 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「39. 拒絕加班 No Overtime!（office-shoot）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-office-shoot`、`os-canvas`、`os-pause`、`os-sound`、`os-day`、`os-score`、`os-best`、`os-pay`、`os-go`、`os-rank-status`、`os-rank-retry`、`os-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`otBusy`（L2）
- L6 常數：`MID`、`TOP`、`LINE`、`STAGE_LEN`
- L7 常數：`FONT`
- L9 常數：`BONUS_PER_DAY`、`BONUS_DAYS`、`BEST_KEY`
- L14 常數：`COMIC_PATH`
- L16 常數：`WORLD_TOP`、`VIEW_LINE`、`WORLD_SCALE`
- L19 常數：`VIEW_MID`、`VIEW_ANCHOR`
- L67 常數：`UNITS`
- L77 常數：`RULE_TEXT`
- L182 常數：`WEAPONS`

## 函式索引（game.js，行號為宣告位置）

`drawX` L20、`worldX` L21、`loadComicArt` L24、`loaded` L28、`comicImage` L41、`comicBox` L48、`comicText` L52、`syncLang` L58、`ZH` L60、`L` L61、`LF` L62、`pickL` L63、`wName` L64、`rand` L65、`clamp` L66、`fmtMul` L68、`fmt` L69、`hexA` L70、`rr` L71、`circle` L72、`seeded` L73、`hsl2hex` L74、`k` L74、`wpick` L75、`syncSimulation` L184、`reset` L185、`dps` L191、`floatText` L192、`updateFx` L193、`update` L194、`input` L198、`target` L199、`initAudio` L203、`tone` L204、`drawBG` L217、`drawGun` L237、`drawPlayer` L242、`eyes` L266、`txt` L270、`drawEnemy` L271、`drawCrate` L283、`drawBoss` L297、`faceFeatures` L320、`bubble` L333、`drawHazards` L339、`drawBullets` L358、`drawBeams` L376、`drawParts` L386、`drawTexts` L390、`drawVignette` L396、`clockStr` L402、`drawHUD` L407、`drawBanner` L437、`drawOverlay` L450、`render` L460、`osShown` L516、`clearInput` L517、`pauseNow` L518、`toLocal` L532、`endDrag` L549、`msgText` L560、`say` L561、`renderMsg` L562、`setText` L565、`ui` L566、`dayCleared` L582、`settle` L589、`begin` L598、`frame` L619

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L584 `dayCleared`：`S.balance+=BONUS_PER_DAY;`

**餘額檢查**
- L601 `begin`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 3 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L585 `dayCleared`：`if(analytics)AN.progress(analytics,{stage:day,step:kills,score,bonus_points:BONUS_PER_DAY,total_bonus_points:…`
- L592 `settle`：`if(analytics)AN.end(analytics,earned,earned>0?'complete':'loss',{stage,score,step:kills,weapon_level:p.tier+1…`
- L603 `begin`：`analytics=AN.start('office-shoot',ENTRY_FEE);`
- L615 `begin`：`AN.end(analytics,earned,'abandoned',{stage,score,step:kills,weapon_level:p.tier+1});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/member.js` 會呼叫：`fmt`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`games/office-shoot/game.js` 處理畫面／平台，`shared/office-shoot-rules.cjs` 共用模擬規則，包含（`WEAPONS` 7 階裝備、`MODS` 3 種強化、`ETYPES` 10 種敵人、`BOSS_DEFS` 10 位固定魔王與 `bossDefFor` 隨機組合）。2026-11-18 由使用者提供的單檔 HTML（office-shoot.html）改寫接入平台，保留原玩法與數值。直式雙道射擊：角色自動開火，只能左右移動；右道是湧入的工作（敵人），左道是補給箱。畫布 450×800，只在 `view-office-shoot` 顯示且分頁可見時更新。

- 入場：全站免費（`ENTRY_FEE=0`），按「開始上班」時呼叫 `AN.start('office-shoot')` 開啟一局；進行中按鈕停用，重複點擊不會重開回合或扣點。畫布內沒有開始按鈕，點畫布或按空白鍵不會開局（原版點擊／空白鍵開始已移除）。
- 流程：每天 35 秒波次（畫面時鐘 09:00→17:00），17:00 預警後出現當天大魔王；擊敗魔王（含分裂、分身的真身全部倒下）即「準時下班」，進入下一天。任何敵人或魔王碰到下班線即結束（加班），沒有生命數或續關。敵人血量依「預期火力」與目前火力動態調整，每天變強；第 11 天起魔王隨機組合 2 種機制、第 16 天起 3 種，第 15 天起戴皇冠。
- 補給：左道每 6 秒落下一個補給箱，打破護盾才拿得到；武器箱與上一個至少間隔 16 秒，且裝備階數不會超過目前天數（滿階後改為至少間隔 24 秒的精煉箱，傷害 ×1.3），一般箱為射速 +15%、傷害 +20% 或多一隻手（最多 4 隻）。金框「老闆交辦」精英怪打倒後給射速 +6% 或傷害 +8%；擊敗魔王另給傷害 ×1.3。這些都是遊戲內戰力數值，不是點數返還。
- BONUS（固定點數，不依入場費計算）：第 1～5 天（`BONUS_DAYS`）每擊敗當天大魔王立即 +2 點（`BONUS_PER_DAY`），由 `dayCleared` 以 `paidDays` 確保每天每局只發一次，一局最多 10 點，與投入無關。第 6 天起可繼續挑戰最佳績效但不再給點。加班結束不扣回，結束時 `settle` 不另發點；中途重新整理，已入帳的保留；沒有入場費。
- 結算：`gameOver` 只在進行中執行一次，接著 `settle` 送一次 `AN.end`（payout_points 為本局已入帳 BONUS，有入帳為 `complete`，否則 `loss`，附 `stage`、`score`、`step`＝處理件數、`weapon_level`）。正常離頁由本款 capture 階段的 `pagehide` 先送 `abandoned` 並帶已入帳 BONUS；BFCache persisted 不結束。每次 BONUS 送一次 `AN.progress`（`stage`＝天數、`bonus_points`、`total_bonus_points`）。
- 暫停：切換遊戲（hashchange）、背景分頁或視窗失焦時暫停並清除按鍵／拖曳；回來後點畫面或按空白鍵繼續。暫停中敵人不移動、不計時。
- 操作：電腦 ←→／A D 或滑鼠左右移動；手機在畫布上按住拖曳（相對位移）。`M` 或暫停面板的音效鈕切換音效（不保存）；上方暫停鈕可暫停／繼續。按鍵只在本款畫面顯示且進行中作用，輸入框與按鈕上的按鍵不攔截。
- 分數：擊倒敵人依類型 × 天數（精英 ×5），擊敗魔王 +500 × 天數；只顯示績效與最佳紀錄，不換點數。
- 雲端排行榜：訪客回合由 Worker 發種子，前後端共用第 1 版規則，以 10ms 步進重播左右按鍵與 0.1px 目標位置，僅結束的合法回合寫入 `game_leaderboard`。保留最高分／前 50 名與既有同分排序；斷線可重送同一份證明。超過 10 分鐘或 4,000 筆操作轉為本機成績，不影響遊玩與 BONUS。
- 儲存：`deep-sea-office-shoot-best`（最佳績效整數）。原版的 `lanegun_best`／`lanegun_lang` 不再使用，也不讀取。
- 平台：不提供重設為 500 點或自動回點；沿用目前共用免費遊玩契約。
- 語言：原版畫布內的語言鈕已移除，改跟隨大廳語言（`window.deepSeaI18n`），每格依目前語言輸出。所有遊戲內字串寫成「中文|English」單一字面量，`locales/en.json` 以完整字串當 key（同小灰出門做法，避免短 key 影響其他遊戲）。右側訊息與數值欄位標記 `data-i18n-ignore` 由遊戲自行輸出；按鈕、規則與卡片沿用顯示層翻譯。`js/i18n.js` 的 `names` 清單加入 `No Overtime!`。
- 測試：`node tools/test_office_shoot.mjs`。
- 平衡：沿用原版數值，尚未依真人數據調整；前 5 天能否穩定通過（影響 BONUS 期望值）待真人測試。

2026-11-28 美術改版：依核准美漫稿套用完整背景、角色與六格步行；上方 HUD 取用核准原稿，底部筆與箭頭取用使用者指定截圖，中間單行繁中粗字。顯示投影對齊較窄補給道與下班線，輸入反投影；模擬仍為 450×800，原有碰撞、速度、難度、獎勵、存檔與追蹤不改。大廳封面與排行榜縮圖同批更新。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/office-shoot/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
