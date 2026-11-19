# Deep Sea Games：GA4 遊戲分析設定

網站：https://yachun0728.github.io/deep-sea-games/

GA4 評估 ID：`G-B5PKZSCCEQ`

目前採用 Google tag 直接串接 GA4。網站只載入一套分析標籤，沒有另外安裝 GTM 容器，避免同一批事件重複送出。

## 先確認資料有進來

1. 登入 https://analytics.google.com/ ，選擇對應 `G-B5PKZSCCEQ` 的資源。
2. 在另一個分頁開啟網站，選一款遊戲並開始一局。
3. 查看 GA4「報表 → 即時」，確認 `game_view`、`game_start` 等事件出現。
4. 要檢查每筆參數，可用 https://yachun0728.github.io/deep-sea-games/?analytics_debug=1#fishing 開啟測試，再到 GA4 的 DebugView。DebugView 需要在資源中查看，網站上的測試不代表這份指南已替你確認 GA4 收到資料。

## 在 GA4 新增自訂定義

進入「管理 → 資料顯示 → 自訂定義」。以下設定需要該資源的編輯者權限。

事件範圍的自訂維度：

| 顯示名稱 | 事件參數 |
|---|---|
| 遊戲代碼 | `game_id` |
| 遊戲名稱 | `game_name` |
| 結果 | `result` |
| 關卡 | `stage` |
| 步數／乘客進度 | `step` |
| 是否完成關卡 | `checkpoint` |

自訂指標：

| 顯示名稱 | 事件參數 | 單位／用途 |
|---|---|---|
| 有效遊玩秒數 | `active_seconds` | 秒；總遊玩時間請使用這個指標 |
| 投入點數 | `entry_points` | 標準；只在開始一局時發送 |
| 領回點數 | `payout_points` | 標準；只在結束時發送 |
| 玩家淨得點數 | `net_points` | 標準；領回減本局投入，可能為負 |

可以先建立「遊戲名稱」與「有效遊玩秒數」，其餘逐步補齊。自訂定義建立後，報表通常需要 24～48 小時處理；不會補回未安裝追蹤前的資料。不要將每局唯一的 `round_id` 註冊成自訂維度，以免產生大量不同值。

## 三張優先做的探索報表

1. **哪款遊戲最受歡迎**：列放「遊戲名稱」，指標放「總使用者、事件計數」，篩選 `event_name = game_start`。事件計數代表局數，總使用者代表可識別的使用者估計值。
2. **每款遊戲玩多久**：列放「遊戲名稱」，指標放「有效遊玩秒數」，篩選 `event_name = game_active_time`。需要分鐘數時將秒數除以 60。
3. **結果與點數**：列放「遊戲名稱、結果」，指標放「事件計數、領回點數、玩家淨得點數」，篩選 `event_name = game_end`。`cashout` 領回不代表一定獲利，請搭配淨得點數。

不要把整張報表都篩成 `game_start` 又期待看到遊玩秒數；時間是由另一種事件分段發送的。已結束局數的總投入若要以 `stake_points` 分析，可另建同名自訂指標，並只看 `game_end`。

## 事件定義

| 事件 | 發送時機 |
|---|---|
| `lobby_view` | 進入遊戲大廳，與遊戲瀏覽分開記錄 |
| `game_view` | 切換到某款遊戲，包括遊戲直達網址 |
| `game_start` | 成功扣點開始一局；餘額不足不計入 |
| `game_resume` | 開始某關／下一條魚／下一段挑戰 |
| `game_progress` | 成功過關或完成一步；`checkpoint=1` 表示停下來等待領回／下一關 |
| `game_active_time` | 每 15 秒及切換、暫停、結束時，送出尚未計入的有效秒數 |
| `game_end` | 領回、失敗、完成、取消、重開或真正離開頁面 |
| `points_reset` | 測試用重設點數的調整，不列為遊戲贏得點數 |

有效時間只計算目前遊戲中尚未結束且正在遊玩的局，排除遊戲大廳、背景分頁、視窗失焦、過關選擇畫面及連續 60 秒無操作後的時間。等待乘客／老闆轉頭仍屬遊玩；同時投出多顆落珠不會把總遊玩時間重複相加。`round_active_seconds` 是各局各自的時間，落珠多局重疊時不要用它加總平台總時數。

`game_end` 的結果：`cashout` 領回、`loss` 失敗、`complete` 完成、`cancelled` 取消下注、`restart` 放棄舊局重開、`abandoned` 重新整理或真正離開頁面時尚未完成。切換遊戲不會立即判定放棄；瀏覽器返回快取可恢復的頁面也不會誤算放棄。

## 資料範圍

- 資料從安裝後開始收集；沒有登入帳號時，使用者人數依分析工具的瀏覽器／裝置識別估計，可能受封鎖器、Cookie 清除與跨裝置影響。
- 本機 `file:` 預覽與 localhost 不載入分析標籤、不送資料。
- `round_id` 是每局隨機識別碼；事件只帶遊戲進度、虛擬點數與時間，沒有加入姓名、Email、密碼或付款資料。
- 這些是前端遊戲分析事件，適合觀察使用情況；正式收費與點數帳務需要獨立的伺服器紀錄。

## 官方文件

- 事件參數與報表定義：https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
- 建立事件範圍自訂維度：https://support.google.com/analytics/answer/14239696
- 建立自訂指標：https://support.google.com/analytics/answer/14239619
- DebugView：https://support.google.com/analytics/answer/7201382

## 插珍奶（boba）

原版畫面以內嵌文件保留，開始與重玩各扣 20 點，沒有點數獎勵。平台記錄 `game_start`、成功杯數的 `game_progress`，與領回為 0 的 `game_end`。原版復活選擇與示範廣告不計入有效遊玩時間；在遊戲內的點擊與按鍵會通知平台，讓跨文件的遊玩時間正確計算。

## 泡麵煎餅翻面（pancake）

子頁以 iframe 載入，開始與再煎一次各扣 10 點（看示範廣告後 30 分鐘內 entry_points 為 0，另附 `entry_kind=free_pass`），沒有點數獎勵。平台記錄 `game_start`、每煎好一片的 `game_progress`（`step` 為片數）、泡麵用完時的暫停 checkpoint、以 30 點換泡麵的 `game_progress`（`phase=buy_noodles`、`extra_points`）、續煎時的 `game_resume`，以及領回為 0 的 `game_end`（附 `score`、`cleared`、`extra_spent_points`；整局總支出為 entry_points 加 extra_spent_points）。子頁內的點擊、按鍵與晃動會節流通知平台，避免跨文件遊玩時間被當成閒置。子頁自己的本機事件只存 localStorage，不另外送出。

## 死神打工（reaper）

無盡值班（2026-11-17 起），每局先扣入場10點，沒有班別上限與領回。每到一個里程碑（處理 120、150、200、260 位，之後每 50 位）送一次 `game_progress`，`step` 為處理數、`score` 為累計接走數、`bonus_points` 為該次入帳點數；生命歸零送 `game_end`（本局入帳總點數 > 0 為 `complete`，否則 `loss`）。

## 一口氣探險（dive）與捷運搶位（mrt）

兩款都以內嵌原畫面運作，由父頁扣入場點數並送出 `game_start`；子頁內的點擊與按鍵會通知平台，維持跨文件有效遊玩時間。

- dive：每次下潛後送 `game_progress`，`stage` 為海域（1 淺海～4 深淵）、`step` 為層數。`game_end` 的 `score` 為分數（珍珠＋層數×2）、`depth` 為最深層數，點數為 0；溺水為 `loss`，其餘為 `complete`。不再送 `multiplier`，也沒有 `cashout`。
- mrt：每站開始送 `game_progress`，`stage` 為第幾站、`step` 為目前階數。暫停時送 `checkpoint=1` 的 progress 並停止計時，按繼續送 `game_resume`。`game_end` 的 `score` 為階數、點數為 0；有搶到座位為 `complete`，一個座位都沒搶到為 `loss`。不再送 `multiplier`，也沒有 `cashout`。

## 無盡里程碑遊戲（runner / sneak / elevator / fishing / campaign）

2026-11-17 起閃避跑酷、偷偷下班、插隊大師、深海釣手、宣傳車與死神打工一樣改為無盡玩法，每局只送一次 `game_start`（entry_points=10），沒有領回，`cashout` 不再出現。里程碑當場入帳時送 `game_progress`，帶 `bonus_points`；`game_end` 的點數為本局入帳總和，大於 0 為 `complete`，否則 `loss`。`step`／`stage` 以各遊戲自己的進度為準：跑酷為距離（`distance`）、偷偷下班為關數、插隊大師為累計人數、深海釣手為條數（`landed_fish`）、宣傳車為已過建築（`step`）與得票（`votes`）。舊的 `multiplier` 參數不再送出。

## 程式來源定位

追蹤實作位於 `js/analytics.js`，各遊戲呼叫位於 `games/<id>/game.js`，路由追蹤位於 `js/navigation.js`。`index.html` 為靜態組合產出，修改後執行 `python3 tools/build.py` 與 `--check`；事件與欄位契約沒有因來源拆分而變更。

## 深海火線（blaster）

無盡關卡，首次入場10點；每通過10關即加1點至錢包。game_progress 的 bonus_points 是該次里程碑入帳，total_bonus_points 是本輪累計；一般關卡 bonus_points=0。關後暫停、續關 resume 及有效時間邏輯保留。game_end 的 payout_points 記錄「目前付費嘗試已入帳點數」，結束事件不再發點，避免二次入帳；loss、cashout、abandoned 均可能有正的 payout_points，死亡不扣回。multiplier 為該嘗試實際入帳／實際扣款，不是 UI 獎勵規則。

死亡後重玩目前關卡另開 start（entry_kind=stage_retry、stage、retry_count），費用1～5點，第10關以上固定5點。每個新付費嘗試的入帳累計歸零，但本輪總獎勵及已發里程碑保留。正常離頁以捕獲階段 handler 先結束該回合並帶入已入帳點數；BFCache persisted 不提前結束。事件名稱與既有 round_id／entry_points／net_points 等契約保持。2026-11-17 起關後 game_progress 另帶 weapon_form（目前武器形態）與 boss（該關是否王關）參數；每關前的三選一不另送事件（pick 階段不計有效遊玩時間，離頁記 abandoned）。未驗證後台收件或自訂定義。

## 屋頂貓貓（cat）

無盡跑酷，沒有關卡。每局只送一次 game_start（entry_points=10）。每到一個里程碑（150、300、500、750、1000 公尺，之後每 250 公尺）就送一次 `game_progress`，帶 `step`／`score`（公尺數）與 `bonus_points`（該里程碑獎勵），不暫停有效遊玩時間。摔下去時送 `game_end`：`payout_points` 為本局累計入帳點數（沒到 150 公尺為 0）、結果 `complete`（有入帳）或 `loss`，`score` 為跑到的公尺數。`bonus_points` 沒有註冊為 GA4 自訂定義，需要時在後台新增。

## 打磚塊（breakout）

免費懷舊遊戲，每局一次 `game_start`（entry_points=0）。每清一關送一次 `game_progress`，帶 `stage`／`step`（關卡）、`score` 與 `level`。球用完送 `game_end`，result 為 `loss`；離頁為 `abandoned`，兩者皆帶 `score`、`level`、`bricks`（累計破壞磚塊數），payout_points=0。暫停以現有可見性與互動計時處理，不另送事件。

## 蓋樓大師（skybuilder）

固定入場10點，start一次；10、20、30層各立即發5點並送progress（step、score、floors、milestone、bonus_points、total_bonus_points），不暫停有效時間。失手／倒塌送loss，正常離頁送abandoned；end的payout_points記錄本局已入帳BONUS，不再發點，不帶返還倍率。BFCache保留回合。未驗證GA4後台收件。

## 踩地雷（mines）與每日挖金礦（keno）

踩地雷每局一次start（entry_points=0），翻格progress帶step；勝利complete、踩雷loss或離頁abandoned結束，payout_points=0。單局難度固定，無逐關resume；勝負帶board_size與mine_count，不更改game_id。每日挖礦每次免費回合start（entry_points=0），每挖progress帶step、score、bonus_points與total_bonus_points；最後一次或到每日30點上限送complete。end只記錄本次分析回合已入帳總點數，不再發點。重新整理後舊回合abandoned，新分析回合start從本次載入後的入帳重新累計，剩餘免費機會不變；捕獲pagehide先送已入帳總額，BFCache保留回合。午夜到期以complete結束舊日回合。未驗證正式GA4後台收件。

## 拒絕加班（office-shoot）

無盡天數、固定入場10點。每局一次start；第1～5天擊敗大魔王各送一次progress（stage為天數、step為處理件數、score、bonus_points=2、total_bonus_points），同一天不重送。加班（碰到下班線）只送一次end：有入帳為complete、否則loss，payout_points為本局已入帳BONUS，結束不再發點，附stage、score、step、weapon_level。正常離頁由本款capture階段pagehide先送abandoned並帶已入帳總額；BFCache persisted不結束。暫停（切遊戲、背景、失焦）不另送事件，有效時間沿用共用的可見／聚焦判定。未驗證GA4後台收件。

## 數字吞噬、鏡像雙子、影子接力（eat-smaller、mirror-twins、shadow-relay）

關卡制、固定入場10點，一局內可自由選關重玩。扣款時一次start；每次過關送一次progress（stage為關卡、step為本局過關次數、bonus_points為本次入帳，同局同關重複或已達10點上限時為0、total_bonus_points）。按「結束本局」送一次end：result為complete，payout_points為本局已入帳BONUS，附step。正常離頁由本款capture階段pagehide先送abandoned並帶已入帳總額；BFCache persisted不結束。數字吞噬與影子接力切走畫面暫停時送progress(phase:pause)、繼續時resume；鏡像雙子為回合制不送暫停。未驗證GA4後台收件。

## 一筆畫守城（one-line-defense）

無盡、固定入場10點。每局一次start；教學後每撐過30秒送一次progress（stage為第幾個30秒、step為秒數、bonus_points=2、total_bonus_points），最多5次。核心被攻破送一次end：有入帳為complete、否則loss，payout_points為已入帳BONUS，附score、step（存活秒數）、combo。離頁abandoned與暫停處理同上。未驗證GA4後台收件。

## 俄羅斯方塊（tetris）

無盡、免費、沒有 BONUS。每局一次start（entry_points=0）；暫停送progress（phase=pause、checkpoint=1）並停止有效時間，繼續送resume。頂端放不下送一次end：result為complete、payout_points=0，附score、step（消除行數）、level。正常離頁由pagehide送abandoned；BFCache persisted不結束。

## 不准跑調（on-pitch）

免費、沒有 BONUS。每次開始一個關卡就一次start（entry_points=0，stage＝世界 1～5）；暫停（按 ❚❚、Esc、切走分頁或離開本頁）送progress（phase=pause、checkpoint=1）並停止有效時間，點畫面繼續送resume。過關或三顆愛心用完送一次end：result為complete、payout_points=0，附score、step（通過的牆數）、level（1～20，無盡為 0）、cleared（1／0）、stars；從暫停回選單或正常離頁送abandoned。因為遊戲只用聲音操作，每次通過／失誤與每秒偵測到聲音時會呼叫 `AN.interact()`，避免 60 秒沒有點擊被當成閒置。

## 時序修復（dream）

無限關卡、固定入場10點，沒有點數獎勵。每局一次start；過關progress帶stage、score（完成關數）、reversals（本關已反轉次數）並暫停有效時間，下一關resume。失敗end為loss、payout_points=0，不送multiplier或cashout；正常離頁由共用層送abandoned，BFCache沿用暫停／恢復。未驗證GA4後台收件。

## Ocean Link 深海連連看

`game_id=ocean-link`，`game_name=深海連連看`。每次免費開始遠征時發一次 start（`entry_points=0`），關卡完成送 progress（含 `stage`、`step`、`bonus_points`、`total_bonus_points` 與 `mode`），等待下一關時暫停有效時間，下一關送 resume。`mode` 可為 `easy`、`standard` 或 `challenge`。第 10 關完成送 win；離開全螢幕、路由離開或非 BFCache 離頁送 abandoned。end 的 `payout_points` 為這次遠征已實際入帳的總點數，非 BFCache 離頁在共用 pagehide 結束處理前送出。背景與失焦沿用共用時間追蹤。

## 荒島遠征（frontier）

首次建立遠征 `game_start entry_points=10`；已保存資格後新關、重試或重新載入以 `entry_points=0` 開啟新的嘗試。每關完成 `game_progress checkpoint=1` 及 `game_end complete`，生命歸零 `loss`；無點數獎勵，end payout_points固定0。進度附stage、chapter、mission、step（擊敗數）；升級也回報progress。離開遊戲／背景／失焦暫停progress，按繼續resume；正常pagehide在共用處理前結束abandoned，BFCache不提前結束。沒有另載tag。正式站與GA4後台收件尚未驗收。

## 免費遊玩改版（2026-11-18）

所有已上架遊戲entry_points=0，免費重試與補給extra_points=0；game_id與game_name及回合生命周期不變。Reef Blaster結束以complete記錄已入帳固定獎勵，移除cashout/multiplier參數。平台依現有有效時間判定給固定遊玩與每日完成獎勵，另送platform_points_earned（reward_kind=play_time或daily_complete、reward_points）；外觀兌換送cosmetic_redeemed（item_id、spent_points）。這些獎勵不再次加入game_end的payout，避免把原遊戲里程碑與平台獎勵混算。不傳玩家姓名或本機收藏內容，不新增Google tag。正式GA4後台未驗收。

`market-desk`（收盤之前）以零入場點數開始，提交每日答案時以 `step` 回報已完成天數、`score` 回報查證分數。確認結局時送出 `win` 或 `lose`，離開遊戲時送出 `abandoned`，結束入帳為 0。切換分頁的有效時間由共用追蹤處理。
