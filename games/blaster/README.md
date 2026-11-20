# 深海火線 Reef Blaster（blaster）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#blaster`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「帶領潛艇編隊航行，閃過怪潮和打不碎的硬礁。」｜立即開玩 · 無盡航行 · 每萬米+1點
- 追蹤名稱（GA4 `game_name`）：深海火線，`game_id` 為 `blaster`
- 檔案：`games/blaster/card.html`、`games/blaster/game.js`、`games/blaster/icon.svg`、`games/blaster/style.css`、`games/blaster/view.html`；`game.js` 共 670 行、41.7 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「22. 深海火線 Reef Blaster（blaster）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-blaster`、`bl-playfield`、`bl-canvas`、`bl-go`、`bl-exit`、`bl-lives`、`bl-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`BL`（L3）
- L2 常數：`BL_FLEET_MAX`、`BL_GATE_CAP`、`BL_GATE_HALF`、`BL_SPAWN_Y`、`BL_MILESTONE`、`BL_DEPTH_STEP`
- L5 常數：`BL_ART_PATH`
- L8 常數：`BL_SPRITES`
- L25 常數：`BL_GUNS`
- L94 常數：`BL_CARD_EVERY`
- L131 常數：`BL_MOBS`
- L146 常數：`BL_SLOTS`
- L147 常數：`BL_COST`
- L148 常數：`BL_UNLOCK`
- L649 常數：`BL_DIRECTIONS`

## 函式索引（game.js，行號為宣告位置）

`blLoadArt` L9、`blDrawSprite` L14、`blSay` L22、`blPay` L23、`blWeapon` L34、`blStageConfig` L38、`blHealth` L39、`blPace` L40、`blMeters` L41、`blSaveBest` L42、`blAdvanceDistance` L47、`blVisible` L69、`blTracking` L70、`blUI` L71、`blFinish` L78、`blExit` L83、`blRound` L87、`blOfferPicks` L95、`blChoose` L101、`blStart` L107、`blHurt` L114、`blChangeFleet` L119、`blEnemy` L149、`blWavePlan` L153、`blSpawn` L169、`blSpawnGates` L181、`blSpawnSwarm` L194、`blBossSpawn` L206、`blAdvanceBoss` L210、`blAdvanceEnemy` L226、`blDamage` L249、`blSegmentHit` L268、`blFleetWidth` L272、`blFleet` L273、`blFleetTouch` L284、`blClampX` L290、`blClampY` L294、`blReleaseDirections` L299、`blAim` L302、`blAdvanceFleet` L305、`blBurst` L313、`blGateContains` L323、`blAdvanceBullet` L327、`blEffect` L382、`blStep` L383、`blSync` L432、`blRoundRect` L436、`blDrawBoss` L437、`blDrawMonster` L444、`blDrawBullet` L514、`blDrawInk` L524、`blDrawPlayer` L529、`blDrawShip` L538、`blPickCard` L559、`blDrawPicks` L560、`blDraw` L565、`blPointerPosition` L620、`blSuspend` L664、`blLoop` L668

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L56 `blAdvanceDistance`：`S.balance+=bonus;`

**餘額檢查**
- L110 `blStart`：`if(stake>S.balance){blSay(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L52 `blAdvanceDistance`：`AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,distance_m:Math.floor(BL.distance)});`
- L57 `blAdvanceDistance`：`AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,distance_m:Math.floor(BL.distance),bonus_points:bonus…`
- L70 `blTracking`：`if(engaged)AN.resume(BL.analytics,{stage:BL.stage});`
- L70 `blTracking`：`else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);`
- L81 `blFinish`：`AN.end(BL.analytics,BL.earned,result,{stage:BL.stage,score:BL.kills,distance_m:Math.floor(BL.distance),weapon…`
- L112 `blStart`：`BL.analytics=AN.start('blaster',stake);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-blaster-distance-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

免費無盡航行。從 0 公尺、3 艘潛艇開始，最多 35 艘。從畫布內開始或重玩，拖曳或以方向鍵／W A S D 移動；每艘自動朝前射擊。手機開局後畫布填滿可用視窗，左上可退出。艇數歸零便結束。重新出擊從起點開始，火力、艇數和怪潮重置。

距離按實際前進速度累計，每 1,000 公尺調高火力與難度；怪潮持續進場。每 36 波暫停提供三張武器或救援卡。普通怪物和可擊碎礁石可以閃過，游出畫面不扣艇。從 1,500 公尺起每隔 350 公尺出現硬礁，左右交替，會擋子彈、無法擊碎，接觸損失一艘。每隔 5,000 公尺巨獸會短暫出現，擊倒可加火力，也可閃避攻擊直到牠撤離。

每 5 波出一組數字區。首組正區 +2、上限 +4，後續 +1～+3、上限 +5。打穿後續路障後，每 5 發穿過正區加 1；負區每發減 1，最低 −35。編隊中心穿過才結算，同組一次。未打穿路障便進入正區會套用同組負區數字。

每 10,000 公尺即時獎勵 1 點，同一趟航行的各門檻只入帳一次。失敗與離頁記錄最遠距離，使用 deep-sea-blaster-distance-best。舊 deep-sea-blaster-best 仍保留原通關數。離開遊戲、失焦或背景分頁暫停；選卡和暫停不計距離。追蹤沿用 blaster ID、擊破數 score 和開始／暫停／結束流程，stage 代表距離難度段，另記 distance_m。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/blaster/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
