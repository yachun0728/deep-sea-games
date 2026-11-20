# 拒絕加班 No Overtime!（office-shoot）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#office-shoot`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「自動開火擋下湧入的工作，打倒 17:00 大魔王準時下班。」｜立即開玩 · 自動射擊
- 追蹤名稱（GA4 `game_name`）：拒絕加班，`game_id` 為 `office-shoot`
- 檔案：`games/office-shoot/card.html`、`games/office-shoot/cover.webp`、`games/office-shoot/game.js`、`games/office-shoot/icon.svg`、`games/office-shoot/style.css`、`games/office-shoot/view.html`；`game.js` 共 1178 行、76.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「39. 拒絕加班 No Overtime!（office-shoot）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-office-shoot`、`os-canvas`、`os-day`、`os-score`、`os-best`、`os-pay`、`os-go`、`os-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`otBusy`（L2）
- L6 常數：`MID`、`TOP`、`LINE`、`STAGE_LEN`
- L7 常數：`FONT`
- L9 常數：`BONUS_PER_DAY`、`BONUS_DAYS`、`BEST_KEY`
- L24 常數：`UNITS`
- L35 常數：`WEAPONS`
- L44 常數：`WDPS`
- L45 常數：`GUN_LEN`
- L46 常數：`MODS`
- L51 常數：`ETYPES`
- L65 常數：`SHAPES`
- L66 常數：`BOSS_DEFS`
- L78 常數：`MECH_POOL`
- L79 常數：`MECH_NAME`
- L80 常數：`MECH_HINT`
- …另有 7 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`syncLang` L15、`ZH` L17、`L` L18、`LF` L19、`pickL` L20、`wName` L21、`rand` L22、`clamp` L23、`fmtMul` L25、`fmt` L26、`hexA` L27、`rr` L28、`circle` L29、`seeded` L30、`hsl2hex` L31、`k` L31、`wpick` L32、`bossDefFor` L82、`reset` L106、`prog` L116、`expDPS` L118、`dps` L125、`effRate` L128、`grow` L129、`power` L130、`initAudio` L134、`tone` L135、`spawnEnemy` L148、`pickType` L164、`spawnInterval` L172、`spawnCrate` L178、`makeBoss` L195、`spawnBoss` L201、`allTargets` L215、`isCircle` L223、`halfW` L224、`halfH` L225、`hitTest` L226、`weakPos` L230、`weakHit` L231、`damage` L237、`addBullet` L258、`fire` L261、`railShot` L277、`explode` L284、`applyMod` L295、`killEnemy` L304、`splitBoss` L317、`killBoss` L328、`breakCrate` L347、`stunPlayer` L365、`throwRock` L369、`fireMissile` L377、`teleportBoss` L382、`gameOver` L390、`spark` L403、`floatText` L408、`updateFx` L411、`update` L423、`updateBosses` L538、`hash` L567、`decor` L568、`desk` L584、`drawBG` L595、`drawGun` L635、`drawPlayer` L674、`eyes` L720、`txt` L724、`drawEnemy` L725、`drawCrate` L792、`drawBoss` L827、`faceFeatures` L890、`bubble` L903、`drawHazards` L909、`drawBullets` L928、`drawBeams` L944、`drawParts` L952、`drawTexts` L956、`drawVignette` L962、`clockStr` L968、`drawHUD` L973、`drawBanner` L1005、`drawOverlay` L1018、`render` L1027、`osShown` L1073、`clearInput` L1074、`pauseNow` L1075、`toLocal` L1089、`endDrag` L1107、`msgText` L1118、`say` L1119、`renderMsg` L1120、`setText` L1123、`ui` L1124、`dayCleared` L1135、`settle` L1142、`begin` L1151、`frame` L1166

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L1137 `dayCleared`：`S.balance+=BONUS_PER_DAY;`

**餘額檢查**
- L1153 `begin`：`if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 3 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L1138 `dayCleared`：`if(analytics)AN.progress(analytics,{stage:day,step:kills,score,bonus_points:BONUS_PER_DAY,total_bonus_points:…`
- L1145 `settle`：`if(analytics)AN.end(analytics,earned,earned>0?'complete':'loss',{stage,score,step:kills,weapon_level:p.tier+1…`
- L1154 `begin`：`analytics=AN.start('office-shoot',ENTRY_FEE);`
- L1162 `begin`：`AN.end(analytics,earned,'abandoned',{stage,score,step:kills,weapon_level:p.tier+1});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/member.js` 會呼叫：`fmt`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`otBusy` 所在 IIFE，內含完整遊戲邏輯（`WEAPONS` 7 階裝備、`MODS` 3 種強化、`ETYPES` 10 種敵人、`BOSS_DEFS` 10 位固定魔王與 `bossDefFor` 隨機組合）。2026-11-18 由使用者提供的單檔 HTML（office-shoot.html）改寫接入平台，保留原玩法與數值。直式雙道射擊：角色自動開火，只能左右移動；右道是湧入的工作（敵人），左道是補給箱。畫布 450×800，只在 `view-office-shoot` 顯示且分頁可見時更新。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始上班」時一次扣除並呼叫 `AN.start('office-shoot')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不會再扣。畫布內沒有開始按鈕，點畫布或按空白鍵不會開局（原版點擊／空白鍵開始已移除）。
- 流程：每天 35 秒波次（畫面時鐘 09:00→17:00），17:00 預警後出現當天大魔王；擊敗魔王（含分裂、分身的真身全部倒下）即「準時下班」，進入下一天。任何敵人或魔王碰到下班線即結束（加班），沒有生命數或續關。敵人血量依「預期火力」與目前火力動態調整，每天變強；第 11 天起魔王隨機組合 2 種機制、第 16 天起 3 種，第 15 天起戴皇冠。
- 補給：左道每 6 秒落下一個補給箱，打破護盾才拿得到；武器箱與上一個至少間隔 16 秒，且裝備階數不會超過目前天數（滿階後改為至少間隔 24 秒的精煉箱，傷害 ×1.3），一般箱為射速 +15%、傷害 +20% 或多一隻手（最多 4 隻）。金框「老闆交辦」精英怪打倒後給射速 +6% 或傷害 +8%；擊敗魔王另給傷害 ×1.3。這些都是遊戲內戰力數值，不是點數返還。
- BONUS（固定點數，不依入場費計算）：第 1～5 天（`BONUS_DAYS`）每擊敗當天大魔王立即 +2 點（`BONUS_PER_DAY`），由 `dayCleared` 以 `paidDays` 確保每天每局只發一次，一局最多 10 點、剛好回本。第 6 天起可繼續挑戰最佳績效但不再給點。加班結束不扣回，結束時 `settle` 不另發點；中途重新整理，已入帳的保留，已扣入場不退回。
- 結算：`gameOver` 只在進行中執行一次，接著 `settle` 送一次 `AN.end`（payout_points 為本局已入帳 BONUS，有入帳為 `complete`，否則 `loss`，附 `stage`、`score`、`step`＝處理件數、`weapon_level`）。正常離頁由本款 capture 階段的 `pagehide` 先送 `abandoned` 並帶已入帳 BONUS；BFCache persisted 不結束。每次 BONUS 送一次 `AN.progress`（`stage`＝天數、`bonus_points`、`total_bonus_points`）。
- 暫停：切換遊戲（hashchange）、背景分頁或視窗失焦時暫停並清除按鍵／拖曳；回來後點畫面或按空白鍵繼續。暫停中敵人不移動、不計時。
- 操作：電腦 ←→／A D 或滑鼠左右移動；手機在畫布上按住拖曳（相對位移）。`M` 或畫布右上角喇叭切換音效（不保存）。按鍵只在本款畫面顯示且進行中作用，輸入框與按鈕上的按鍵不攔截。
- 分數：擊倒敵人依類型 × 天數（精英 ×5），擊敗魔王 +500 × 天數；只顯示績效與最佳紀錄，不換點數。
- 儲存：`deep-sea-office-shoot-best`（最佳績效整數）。原版的 `lanegun_best`／`lanegun_lang` 不再使用，也不讀取。
- 重設 500 點：本局進行中（`otBusy`）會被擋下並顯示提示；重設不算 BONUS。
- 語言：原版畫布內的語言鈕已移除，改跟隨大廳語言（`window.deepSeaI18n`），每格依目前語言輸出。所有遊戲內字串寫成「中文|English」單一字面量，`locales/en.json` 以完整字串當 key（同小灰出門做法，避免短 key 影響其他遊戲）。右側訊息與數值欄位標記 `data-i18n-ignore` 由遊戲自行輸出；按鈕、規則與卡片沿用顯示層翻譯。`js/i18n.js` 的 `names` 清單加入 `No Overtime!`。
- 測試：`node tools/test_office_shoot.mjs`。
- 平衡：沿用原版數值，尚未依真人數據調整；前 5 天能否穩定通過（影響 BONUS 期望值）待真人測試。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/office-shoot/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
