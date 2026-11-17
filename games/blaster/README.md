# 深海火線 Reef Blaster（blaster）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#blaster`　分類：技巧闖關　狀態：顯示中
- 大廳卡片：「五種武器進化，迎戰換道、護盾與分裂怪。」｜每局 10 點 · 無盡 · 每10關+1點
- 追蹤名稱（GA4 `game_name`）：深海火線，`game_id` 為 `blaster`
- 檔案：`games/blaster/card.html`、`games/blaster/game.js`、`games/blaster/icon.svg`、`games/blaster/style.css`、`games/blaster/view.html`；`game.js` 共 251 行、24.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「22. 深海火線 Reef Blaster（blaster）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-blaster`、`bl-canvas`、`bl-stage`、`bl-lives`、`bl-wave`、`bl-weapon`、`bl-power`、`bl-evolution`、`bl-speed`、`bl-kills`、`bl-best`、`bl-amount`、`bl-reward-status`、`bl-pay`、`bl-go`、`bl-retry`、`bl-retry-info`、`bl-left`、`bl-right`、`bl-cash`、`bl-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`BL`（L2）
- L8 常數：`BL_GUNS`
- L74 常數：`BL_MOBS`

## 函式索引（game.js，行號為宣告位置）

`blSay` L5、`blRetryFee` L6、`blPay` L7、`blWeapon` L15、`blStageConfig` L19、`blHealth` L20、`blPace` L21、`blNextGun` L22、`blVisible` L23、`blTracking` L24、`blUI` L25、`blRound` L36、`blStart` L40、`blRetry` L48、`blCash` L55、`blHurt` L61、`blClear` L66、`blEnemy` L83、`blMobType` L87、`blSpawn` L95、`blAdvanceEnemy` L102、`blDamage` L108、`blSegmentHit` L119、`blMove` L123、`blBurst` L127、`blAdvanceBullet` L133、`blEffect` L151、`blStep` L152、`blSync` L166、`blRoundRect` L170、`blDrawMonster` L171、`blDrawBullet` L197、`blDrawPickup` L205、`blDrawPlayer` L210、`blDraw` L221、`blSuspend` L245、`blLoop` L249

## 錢包與結算接點

**扣款（開始一局）**
- L46 `blStart`：`S.balance-=stake;`
- L53 `blRetry`：`S.balance-=cost;`

**入帳（領回／獎勵）**
- L69 `blClear`：`S.balance+=bonus;`

**餘額檢查**
- L32 `blUI`：`$('bl-retry').disabled=BL.phase!=='lost'||S.balance<blRetryFee();`
- L33 `blUI`：`$('bl-retry-info').textContent='保留 Lv.'+BL.weapon+' 武器，恢復 3 心，從第 '+BL.stage+' 關第一波重來。'+(S.balance<blRetryFee(…`
- L44 `blStart`：`if(stake>S.balance){blSay(LOW_MSG,'lose');`
- L51 `blRetry`：`if(S.balance<cost){blSay('餘額不足，重玩第 '+BL.stage+' 關需要 '+cost+' 點；可等待平台自動回點。','lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L24 `blTracking`：`if(engaged)AN.resume(BL.analytics,{stage:BL.stage});`
- L24 `blTracking`：`else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);`
- L46 `blStart`：`BL.analytics=AN.start('blaster',stake);`
- L53 `blRetry`：`BL.analytics=AN.start('blaster',cost,{stage:BL.stage,entry_kind:'stage_retry',retry_count:BL.retries});`
- L58 `blCash`：`AN.end(BL.analytics,BL.attemptEarned,'cashout',{stage:BL.cleared,score:BL.kills,multiplier:BL.stake?BL.attemp…`
- L63 `blHurt`：`AN.end(BL.analytics,BL.attemptEarned,'loss',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});`
- L70 `blClear`：`AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,bonus_points:bonus,total_bonus_points:BL.earned},true…`
- L248 `blSuspend`：`AN.end(BL.analytics,BL.attemptEarned,'abandoned',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-blaster-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`blSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`BL`

## 規則摘要（取自 GAME_RULES.md）

定位：`games/blaster/game.js` 的 BL、blWeapon、blSpawn、blStep、blClear、blCash；樣式獨立於 style.css。固定投入10，只在新局扣款。自動朝前射擊，點左／右半邊或按 ← →／A D 換道，亦可用畫面外的左右按鈕。

無盡關卡，第s關min(96,24+6×(s-1))波（首關24、第10關78、第13關起96）。基本波間距max(.62,1.6-(s-1)×.11)，再乘以1-.16×當前波數/總波數。同關移速加成為1+.35×當前波數/總波數，第1～10關普通移速基準105+15s，第11關起255+12×log2(s-9)，維持遞增但放緩增幅（2026-11-17 因難度偏低加快節奏，約為舊版 1.25 倍）；後關與同關後段都更快，增加波數讓出怪段仍比舊版長至少1.5倍。背景航道也隨實際速度捲動。第3關起每4波中的第2波加第二隻怪，錯開出場。

六種怪物以可辨識輪廓與顏色呈現，不只增加血量。普通血量H在第1～10關為3+ceil(s²×1.25)，第11關起為3+ceil(1.25×(100+18×(s-10)))，各種血量乘數向上取整：

| 怪物 | 出現條件／行為 | 血量／移速倍率 |
| --- | --- | --- |
| 泡泡章魚 | 基本直線移動 | 1／1 |
| 裝甲螃蟹 | 每4波，厚甲與蟹鉗輪廓 | 1.7／.82 |
| 衝刺魟魚 | 第2關起部分偶數波，高速衝線 | .65／1.48 |
| 換道電鰻 | 第3關起部分3倍數波；先預告箭頭.65秒才平滑換道，接近底部不再啟動新換道 | .9／1.08 |
| 護盾海龜 | 第4關起部分7倍數波；另有ceil(.75H)護盾，先吸收傷害，超出部分扣血 | 1／.86 |
| 分裂水母 | 第5關起部分5倍數波；死亡生成2隻小水母，小水母不再分裂 | 1.15／.9 |

怪物種類依 blMobType 的判斷優先序選出，不是每個倍數同時生出所有種類。小水母血量為.25H向上取整，速度1.18倍；分裂位置最多到y=390，保留反應距離。

武器Lv.1起，不設遊玩上的等級上限（數值限制為安全整數上限）；每4波（第1、5、9…波）保證一個不同於第一隻怪物跑道的彩色武器箱，撿取+1級。武器與剩餘生命跨關保留，新局重設。單發基礎傷害D=1+ceil(等級/3)；武器各有獨立槍身與彈色／彈形，箱子會預告升級後的型態：

| 解鎖 | 武器 | 實際攻擊 |
| --- | --- | --- |
| Lv.1 | 脈衝彈，薄荷色圓彈與單管 | 1發，1.2D |
| Lv.4 | 雙管速射，藍色雙管與長彈 | 2發，各D |
| Lv.13 | 穿透光槍，綠色長導軌與光束 | 2發，各1.35D，每發最多命中3隻，同一隻不重複計直接傷害 |
| Lv.18 | 追蹤火箭，紅色側掛發射筒與尾焰 | 2發，各2.2D，會轉向追蹤，爆炸半徑78 |
| Lv.24 | 電漿砲，紫色能量核心與光球 | 3發，各1.6D，每發穿透2隻，範圍半徑58 |

2026-11-17 因過於強勢移除扇形散彈（原 Lv.8）：Lv.4～12 維持雙管速射，Lv.13 起切換光槍；已無任何限時武器效果與倒數。拾取箱子容許水平距離<52、垂直距離<48；火箭速度600、電漿720，其他速度沿用。

火箭連射間隔.34秒，其餘max(.11,.27-等級×.005)秒。範圍攻擊對直接命中以外的半徑內怪物造成該發55%傷害；護盾同樣先吸收。未撿武器不補發，也不依目前火力降低敵人血量。

整局3心，碰到怪物或任一道漏怪穿過底部都扣1心，每隻只扣一次。生命歸零時本局結束，不發點數獎勵。場上怪物與武器箱處理完、波數全部出完才過關；關後可繼續或提前收隊，續關不扣費亦不補心。

首次入場扣10點，無關卡上限；每通過10、20、30……關時即獎勵1點，與武器、擊殺數及最佳紀錄無關。每個里程碑只發一次，收隊或死亡不再加發，也不扣回已入帳點數；重新整理會放棄進度，但已入帳餘額保留。例：500點入場變490，過10關491，過20關492（未計重玩與自動回點）。每關後可選擇下一關或收隊，第10關不會自動結束。

死亡後付費重玩目前關卡：min(5,ceil(關卡/2))，即1～2關1點、3～4關2點、5～6關3點、7～8關4點、第9關起5點；第10、11、20、100關以上均為5點。武器與已完成關卡／獎勵保留，恢復3心，當關波數、怪物、子彈及道具重置；不退回第1關。每次另扣費、不限次數，餘額不足不可重玩。重玩不重複領先前十關獎勵。最佳紀錄沿用 deep-sea-blaster-best，不再把讀取值截為10。

切遊戲、背景或失焦暫停；關後選擇時間不計有效遊玩。GA4 每個付費嘗試各一組 start/end，關後 progress 記錄 bonus_points（當次入帳）與 total_bonus_points（本輪累計）；死亡 loss、收隊 cashout、離頁 abandoned 的 payout_points 記錄該付費嘗試已入帳獎勵，end 不再加款。付費重玩另開 stage_retry 嘗試，attemptEarned歸零，但本輪已得獎勵與里程碑紀錄保留，避免分析重複計數。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/blaster/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
