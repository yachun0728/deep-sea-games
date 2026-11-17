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

## 死神打工（reaper）

每局先扣入場點數，十班制；普通靈魂要接走，綠色通行證要放行。每班全部處理完才送出 `game_progress`，班次以 `stage` 記錄，累計接走數以 `score` 記錄。過關選擇時間不列入有效遊玩時間；收手與三顆心用完分別送出 `cashout` 與 `loss` 的 `game_end`。第一班領回 0.70 倍，第十班自動領回 22 倍。

## 一口氣探險（dive）與捷運搶位（mrt）

兩款都以內嵌原畫面運作，由父頁扣入場點數並送出 `game_start`；子頁內的點擊與按鍵會通知平台，維持跨文件有效遊玩時間。

- dive：每次下潛後送 `game_progress`，`stage` 為海域（1 淺海～4 深淵）、`step` 為層數。`game_end` 的 `score` 為最終層數、`multiplier` 為結算倍率；上浮為 `cashout`，到海底或救生繩為 `complete`，溺水或領回 0 為 `loss`。
- mrt：每站開始送 `game_progress`，`stage` 為第幾站、`step` 為目前階數。暫停時送 `checkpoint=1` 的 progress 並停止計時，按繼續送 `game_resume`。`game_end` 的 `score` 為階數；下車結算為 `cashout`，搶滿 8 階或末班車為 `complete`，體力歸零或領回 0 為 `loss`。

## 程式來源定位

追蹤實作位於 `js/analytics.js`，各遊戲呼叫位於 `games/<id>/game.js`，路由追蹤位於 `js/navigation.js`。`index.html` 為靜態組合產出，修改後執行 `python3 tools/build.py` 與 `--check`；事件與欄位契約沒有因來源拆分而變更。

## 深海火線（blaster）

無盡關卡，首次入場10點；每通過10關即加1點至錢包。game_progress 的 bonus_points 是該次里程碑入帳，total_bonus_points 是本輪累計；一般關卡 bonus_points=0。關後暫停、續關 resume 及有效時間邏輯保留。game_end 的 payout_points 記錄「目前付費嘗試已入帳點數」，結束事件不再發點，避免二次入帳；loss、cashout、abandoned 均可能有正的 payout_points，死亡不扣回。multiplier 為該嘗試實際入帳／實際扣款，不是 UI 獎勵規則。

死亡後重玩目前關卡另開 start（entry_kind=stage_retry、stage、retry_count），費用1～5點，第10關以上固定5點。每個新付費嘗試的入帳累計歸零，但本輪總獎勵及已發里程碑保留。正常離頁以捕獲階段 handler 先結束該回合並帶入已入帳點數；BFCache persisted 不提前結束。事件名稱與既有 round_id／entry_points／net_points 等契約保持。未驗證後台收件或自訂定義。

## 屋頂貓貓（cat）

無盡跑酷，沒有關卡。每局只送一次 game_start（entry_points=10）。每到一個里程碑（150、300、500、750、1000 公尺，之後每 250 公尺）就送一次 `game_progress`，帶 `step`／`score`（公尺數）與 `bonus_points`（該里程碑獎勵），不暫停有效遊玩時間。摔下去時送 `game_end`：`payout_points` 為本局累計入帳點數（沒到 150 公尺為 0）、結果 `complete`（有入帳）或 `loss`，`score` 為跑到的公尺數。`bonus_points` 沒有註冊為 GA4 自訂定義，需要時在後台新增。
