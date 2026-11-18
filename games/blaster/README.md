# 深海火線 Reef Blaster（blaster）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#blaster`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「七種武器三選一，闖過水雷、礁石與深海巨獸。」｜每局 10 點 · 無盡 · 每10關+1點
- 追蹤名稱（GA4 `game_name`）：深海火線，`game_id` 為 `blaster`
- 檔案：`games/blaster/card.html`、`games/blaster/game.js`、`games/blaster/icon.svg`、`games/blaster/style.css`、`games/blaster/view.html`；`game.js` 共 394 行、36.8 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「22. 深海火線 Reef Blaster（blaster）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-blaster`、`bl-canvas`、`bl-stage`、`bl-lives`、`bl-wave`、`bl-weapon`、`bl-power`、`bl-evolution`、`bl-speed`、`bl-kills`、`bl-best`、`bl-amount`、`bl-reward-status`、`bl-pay`、`bl-go`、`bl-picks`、`bl-pick-0`、`bl-pick-1`、`bl-pick-2`、`bl-retry`、`bl-retry-info`、`bl-left`、`bl-right`、`bl-cash`、`bl-msg`

## 狀態與常數

- 狀態物件／進行中旗標：`BL`（L2）
- L9 常數：`BL_GUNS`
- L50 常數：`BL_CARD_EVERY`
- L97 常數：`BL_MOBS`
- L111 常數：`BL_SLOTS`
- L112 常數：`BL_COST`
- L113 常數：`BL_UNLOCK`

## 函式索引（game.js，行號為宣告位置）

`blSay` L5、`blRetryFee` L6、`blPay` L7、`blWeapon` L18、`blBossStage` L22、`blStageConfig` L23、`blHealth` L24、`blPace` L25、`blVisible` L26、`blTracking` L27、`blUI` L28、`blRound` L39、`blCardText` L43、`blOfferPicks` L51、`blChoose` L57、`blStart` L63、`blRetry` L71、`blCash` L78、`blHurt` L84、`blClear` L89、`blEnemy` L114、`blWavePlan` L118、`blSpawn` L136、`blBossSpawn` L144、`blAdvanceBoss` L148、`blAdvanceEnemy` L162、`blDamage` L176、`blSegmentHit` L195、`blClampX` L199、`blMove` L201、`blAim` L205、`blBurst` L206、`blAdvanceBullet` L212、`blEffect` L233、`blStep` L234、`blSync` L261、`blRoundRect` L265、`blDrawBoss` L266、`blDrawMonster` L273、`blDrawBullet` L309、`blDrawInk` L319、`blDrawPlayer` L324、`blPickCard` L337、`blDrawPicks` L338、`blDraw` L343、`blHold` L365、`down` L366、`up` L367、`blPointerX` L372、`blSuspend` L388、`blLoop` L392

## 錢包與結算接點

**扣款（開始一局）**
- L69 `blStart`：`S.balance-=stake;`
- L76 `blRetry`：`S.balance-=cost;`

**入帳（領回／獎勵）**
- L92 `blClear`：`S.balance+=bonus;`

**餘額檢查**
- L35 `blUI`：`$('bl-retry').disabled=BL.phase!=='lost'||S.balance<blRetryFee();`
- L36 `blUI`：`$('bl-retry-info').textContent='保留 Lv.'+BL.weapon+' 武器，恢復 3 心，從第 '+BL.stage+' 關第一波重來。'+(S.balance<blRetryFee(…`
- L67 `blStart`：`if(stake>S.balance){blSay(LOW_MSG,'lose');`
- L74 `blRetry`：`if(S.balance<cost){blSay('餘額不足，重玩第 '+BL.stage+' 關需要 '+cost+' 點；可等待平台自動回點。','lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L27 `blTracking`：`if(engaged)AN.resume(BL.analytics,{stage:BL.stage});`
- L27 `blTracking`：`else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);`
- L69 `blStart`：`BL.analytics=AN.start('blaster',stake);`
- L76 `blRetry`：`BL.analytics=AN.start('blaster',cost,{stage:BL.stage,entry_kind:'stage_retry',retry_count:BL.retries});`
- L81 `blCash`：`AN.end(BL.analytics,BL.attemptEarned,'cashout',{stage:BL.cleared,score:BL.kills,multiplier:BL.stake?BL.attemp…`
- L86 `blHurt`：`AN.end(BL.analytics,BL.attemptEarned,'loss',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});`
- L93 `blClear`：`AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,bonus_points:bonus,total_bonus_points:BL.earned,weapo…`
- L391 `blSuspend`：`AN.end(BL.analytics,BL.attemptEarned,'abandoned',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-blaster-best`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fx`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`blSay`
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`BL`

## 規則摘要（取自 GAME_RULES.md）

定位：`games/blaster/game.js` 的 BL、blWeapon、blSpawn、blStep、blClear、blCash；樣式獨立於 style.css。固定投入10，只在新局扣款。自動朝前射擊，**自由左右移動**（2026-11-17 由三條航道改版）：在畫面上按住拖曳／點按設定目標 x，或按住左右按鈕、← →／A D 連續移動；玩家位置 x∈[28,372]，最高移速 720px/s，鍵盤／按鈕滑動速度 430px/s；`blMove(方向)` 為單步微調（±80px，鍵盤啟動按鈕的 click 使用）。

無盡關卡（2026-11-17 大改，目標：更密、更有壓力）：第s關波數為 min(180,54+12×(s-1))（首關54、第10關162、第11關起上限180；2026-11-17 起一關約為原本的 3 倍長）；每5關（5、10、15…）為王關，波數取 ceil(原波數×.6)，怪潮清完後出現王。基本波間距 max(.7,1.3-(s-1)×.05)，再乘以 1-.16×當前波數/總波數；場上沒有怪時下一波提早至.35秒。同關移速加成為 1+.35×當前波數/總波數，第1～10關普通移速基準 150+14s，第11關起 290+12×log2(s-9)。背景航道隨實際速度捲動。

**出怪預算**：怪物從 5 個欄位（x=56、128、200、272、344）落下，每波怪數隨總進度 T=(s-1)+當前波/總波數 漸增：平均數 min(3.6,1+.55×T)（取整後以機率補小數，另有 20% 機率 ±1），限制為 1～5 隻，所以開局幾乎每波1隻，約第5關後才到平均3.6隻。預算 1.4×怪數+.5 限制高成本怪；各怪成本：章魚1、魟魚1、螃蟹1.4、電鰻1.3、海龜1.6、水母1.5、水雷1.1、礁石1.2、烏賊1.6，同一波至多一塊礁石、每隻使用不同欄位。多怪同波時每隻血量乘 max(.6,1-.1×(同波數量-1))，並以 -70px 錯開出場高度。每種新東西在首次解鎖的關卡第3波單獨出現一次。怪物（王除外）縮為原尺寸的80%，子彈命中半徑22（電漿+7），碰到玩家的判定為 |dx|<34 且 |dy|<34。

普通血量H在第1～10關為 3+ceil(.8×s)，第11關起為 11+3×(s-10)（血量放低，難度主要來自密度、速度與障礙），各種血量乘數向上取整：

| 怪物／障礙 | 解鎖 | 行為 | 血量／移速倍率 |
| --- | --- | --- | --- |
| 泡泡章魚 | 第1關 | 基本直線移動 | 1／1 |
| 衝刺魟魚 | 第2關 | 高速衝線 | .65／1.48 |
| 裝甲螃蟹 | 第2關 | 厚甲與蟹鉗輪廓 | 1.7／.82 |
| 水雷 | 第3關 | 打爆時連鎖爆炸（半徑90，對其他怪造成 ceil(.6H) 傷害），若在 y>400 且距玩家<110 引爆則扣1心；漏過底部同樣扣1心 | .45／1.1 |
| 橫移電鰻 | 第3關 | 先預告箭頭.65秒才平滑橫移到距離1～2個欄位的位置，接近底部不再啟動新橫移 | .9／1.08 |
| 護盾海龜 | 第4關 | 另有ceil(.75H)護盾，先吸收傷害，超出部分扣血 | 1／.86 |
| 礁石（障礙） | 第5關 | 擋住子彈（最近的目標先中彈）；不計擊破；漏過底部不扣心，只在碰到玩家時扣1心 | 2.2／.62 |
| 分裂水母 | 第6關 | 死亡生成2隻小水母（左右相鄰欄位），小水母不再分裂 | 1.15／.9 |
| 噴墨烏賊 | 第7關 | 下降到 y=150 後懸停最多4秒，每1.7秒朝「玩家當時所在的 x」吐一顆墨彈（速度300，可被子彈打掉；碰到玩家扣1心，彈體1次）；懸停結束後繼續下降 | 1.1／.72 |

小水母血量為.25H向上取整，速度1.18倍；分裂位置最多到y=390，保留反應距離。

**王關（深海巨獸）**：第 5、10、15… 關最後一波清完後出現一次。血量 28H（約 10～15 秒的對戰），固定在 y=150 左右游動（x=200±105）；每個循環先以紅色標示 1～2 個欄位區域（寬72px）.9秒（第10關起或血量<50% 時標2個，否則1個，5個欄位最多標2個），隨後發射墨浪（速度500，寬約52，不可被打掉，碰到玩家扣1心）；循環間隔：第5～9關 3.2秒（血量<50% 為2.4秒），第10關起 2.6秒（血量<50% 為1.9秒）；血量<50% 時每個循環另丟一顆水雷（場上怪物<7隻）。王不會因碰撞扣心，也不受寒流減速。擊敗王：擊破數+10、火力 +1、清除墨彈，其餘怪物處理完即過關。

**武器形態與三選一**：火力等級 L 從1起，不設遊玩上限（數值限制為安全整數上限），只決定單發傷害 D=1+ceil(L/3) 與射速（火箭間隔.34秒，其餘 max(.11,.27-L×.005)秒）；每過一關 L+1、擊敗王再 +1，**選卡不增加火力**。一開局固定使用脈衝彈（最小的單發槍），沒有起始選擇，關卡開始前也不彈卡。戰鬥中每累計出 36 波怪（跨關累計，最後一波不彈出）就暫停彈出 3 張卡（時間凍結，戰鬥接著繼續；可點卡片、按 1／2／3 或用面板按鈕）；卡片是與目前不同的 3 種武器形態，若生命<3，其中一張改為「修補船體」（恢復1心）。已移除掉落的武器箱。形態、火力與剩餘生命跨關保留，新局重設；付費重玩關卡保留形態與火力。

| 形態 | 外觀 | 實際攻擊 |
| --- | --- | --- |
| 脈衝彈（預設） | 薄荷色圓彈與單管 | 1發，1.2D |
| 雙管速射 | 藍色雙管與長彈 | 2發，各D |
| 穿透光槍 | 綠色長導軌與光束 | 2發，各1.35D，每發最多命中3隻，同一隻不重複計直接傷害 |
| 追蹤火箭 | 紅色側掛發射筒與尾焰 | 2發，各2.2D，會轉向追蹤，爆炸半徑78 |
| 電漿砲 | 紫色能量核心與光球 | 3發，各1.6D，每發穿透2隻，範圍半徑58 |
| 寒流彈 | 淡藍雙管與菱形彈 | 2發，各.9D，命中使怪物減速（移速×.55）2秒，王不受影響 |
| 電鏈彈 | 黃色線圈與閃電彈 | 1發，1.3D，命中後對最近2隻（距離<140）造成該發60%傷害 |

2026-11-17 因過於強勢移除扇形散彈；已無任何限時武器效果與倒數。火箭速度600、電漿720、寒流720、電鏈800，其他速度沿用。範圍攻擊對直接命中以外的半徑內怪物造成該發55%傷害；護盾同樣先吸收。不依目前火力降低敵人血量。

整局3心，碰到怪物、任一隻漏怪穿過底部、水雷近距離引爆、墨彈或王的墨浪打到都扣1心，每個來源只扣一次（礁石漏過不扣）。生命歸零時本局結束，不發點數獎勵。場上怪物與武器箱處理完、波數全部出完才過關；關後可繼續或提前收隊，續關不扣費亦不補心。

首次入場扣10點，無關卡上限；每通過10、20、30……關時即獎勵1點，與武器、擊殺數及最佳紀錄無關。每個里程碑只發一次，收隊或死亡不再加發，也不扣回已入帳點數；重新整理會放棄進度，但已入帳餘額保留。例：500點入場變490，過10關491，過20關492（未計重玩與自動回點）。每關後可選擇下一關或收隊，第10關不會自動結束。

死亡後付費重玩目前關卡：min(5,ceil(關卡/2))，即1～2關1點、3～4關2點、5～6關3點、7～8關4點、第9關起5點；第10、11、20、100關以上均為5點。武器與已完成關卡／獎勵保留，恢復3心，當關波數、怪物、子彈及道具重置；不退回第1關。每次另扣費、不限次數，餘額不足不可重玩。重玩不重複領先前十關獎勵。最佳紀錄沿用 deep-sea-blaster-best，不再把讀取值截為10。

切遊戲、背景或失焦暫停；關後選擇時間不計有效遊玩。GA4 每個付費嘗試各一組 start/end，關後 progress 記錄 bonus_points（當次入帳）與 total_bonus_points（本輪累計）；死亡 loss、收隊 cashout、離頁 abandoned 的 payout_points 記錄該付費嘗試已入帳獎勵，end 不再加款。付費重玩另開 stage_retry 嘗試，attemptEarned歸零，但本輪已得獎勵與里程碑紀錄保留，避免分析重複計數。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/blaster/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
