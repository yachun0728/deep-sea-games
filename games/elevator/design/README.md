# Queue Cutter：暖色手繪辦公大樓 v1

2026-11-28 使用者核准 `approved-v1/direction.png`，授權製作正式素材與套入遊戲；後續指定動畫自然、路人總數十種。此版為本機驗收版，尚未正式發布。

## 原稿與用途

- `approved-v1/direction.png`：核准的角色、場景、色盤與直式構圖，原檔完整保存。
- `approved-v1/lobby-source.png`：無人物的電梯大廳原稿。
- `approved-v1/characters-source.png`：主角初稿，以及咖啡上班族、紫衫提袋女子三種警戒姿勢。
- `approved-v1/step-source.png`：採用的六影格短步，準備、抬腳、跨步、落腳、收腳、站穩。
- `approved-v1/cast-02-source.png`：帶傘大叔、捲髮主管。
- `approved-v1/cast-03-source.png`：銀髮讀者、耳機背包青年。
- `approved-v1/cast-04-source.png`：短髮水壺女子、公事包男子。
- `approved-v1/cast-05-source.png`：馬尾通勤族、報紙紳士。
- `approved-v1/cover-source.png`：採用的近方形大廳封面；橫版探索保存在 `cover-landscape-source.png`。
- `approved-v1/leaderboard-source.png`：排行榜主角頭像。
- `previous/`：改版前封面與排行榜圖備份；舊 `queue-cutter-leaderboard.webp` 保留不刪除。
- `cast-preview.html`：十種路人的正式切片檢視頁；`qa-v1/cast-10.png` 為瀏覽器擷取。

## 製作與接線

使用 Codex 內建 imagegen 依核准設定圖生成，未使用另外計費的 API 或其他供應商。原圖分層生成，不將整張概念圖當成可點擊遊戲畫面。

本機 sprite-gen 僅用於既有透明圖的 `slice-sheet` 切片與 alpha haze 清理：`--chroma-key none --alpha-floor 64 --cell-width 300 --cell-height 400 --baseline-y 392 --scale sheet`。人物表目標高度 370、主角短步目標高度 360；每張表的診斷保存在 `art/` 的 JSON。Pillow 僅轉換尺寸與編碼，運行圖片使用保留真正透明度的 WebP。37 張運行素材合計約 859 KB，第一次進入本遊戲才載入。

`game.js` 只改繪圖與視覺時間。十位路人的排列使用固定映射，不消耗規則亂數；前十位不重複，每隊改變出場順序。路人保持原地站位，主角從前景通過兩人間空隙；短步不用全身透明混合、上下彈跳或伸縮。v2 修正：乘客每幀只顯示一張完整姿勢，不疊加舊頭部；保留各姿勢的共用腳底基準。減少動態效果偏好會停用主角動作影格。

`style.css` 是限定 `#view-elevator` 的直式 HUD、警戒提示、主按鈕與安全區；v3 桌機亦滿視窗呈現，寬螢幕可同時看到更多乘客。封面使用 `../cover.webp`；榜單保留既有 `icon-elevator` symbol，加入 `../leaderboard.webp`，底下保留舊向量 fallback。設計原稿以 `.assetsignore` 排除於網站發布檔。

規則、點數獎勵、排行榜回放、localStorage Key 與 Analytics 控制器維持原樣。畫面不顯示點數，沿用目前站台的隱藏政策。

## 提示詞重點

全部圖使用核准設定圖作參考，要求 warm hand-painted cartoon、brown ink outlines、natural adult proportions、cream terrazzo office lobby、teal elevator、amber lighting；不得仿用其他 IP。

- 場景：portrait empty side-view lobby，no people / UI / text，floor meets wall near 72% height。
- 人物：transparent regular grid，每人三種狀態為 facing right / head partly turning left / head looking back left；腳、身體、道具在三格中固定，只轉頭與上肩；全身完整、不裁腳、不含文字或警戒泡泡。
- 主角：transparent 6×1 finite short step，prepare / lift / reach / plant / recover / stand；腳底共用基準，no airborne jumps / rubber stretching。
- 封面：1056×1000 近方形構圖，正式英文名 Queue Cutter 放下半部，左上留空、安全區內保留臉與標題。
- 排行榜：square chest-up yellow jacket protagonist，mischievous smile，no text，at 32 px still recognizable。

完整生成呼叫與提示詞保留在本次 Codex 對話工具紀錄中。

## 驗收

詳見 [QA.md](QA.md)。本機入口：`http://127.0.0.1:8876/#elevator`，使用 `python3 -m http.server 8876 --bind 127.0.0.1`。

回復：還原本次 elevator 來源與模板的樣式引用、封面／symbol，重新組合；不刪除玩家存檔、不調整後端或歷史排名。素材原稿與舊圖備份保留。

## v2：場景滿寬與轉頭殘影修正

依使用者 2026-11-28 的兩張實際截圖修正。Canvas backing ratio 改為跟隨實際場景容器，背景用等比例 cover，人物按可用高度調整，避免固定390×620內容被縮成中間窄條。移除舊姿勢先畫、新姿勢再覆蓋的混合方式，每幀僅畫當下完整姿勢。對照圖與待機／警戒畫面保存於 `qa-v2/`；維持玩法、儲存與追蹤。

## v3：滿視窗與腳底接地

2026-11-28 使用者指出 v2 路人浮在牆腳、背景仍有上下純色區。v3 將 Canvas 擴充到完整視窗（含 HUD 與按鈕下方），背景等比例 cover 並按地板交界定位；移除桌機置中窄框。寬螢幕採用更寬的世界視野，不把人物拉寬。

逐一量測36張角色素材的 alpha 鞋底，保存為渲染端 `eqFeet`；每張圖以實際鞋底對齊地面及接觸影子。路人站在牆腳線下方28個世界單位，主角在前景再偏下18個單位；不再將路人上移6個單位。最矮手機則調整背景裁切和人物顯示尺寸，避免被下方按鈕遮住。

畫面保存於 `qa-v3/`；核准設定圖與各版本原稿不覆寫。玩法、規則亂數、存檔、點數與追蹤不變。
