# 荒島遠征美術與互動規範 / Frontier Islands art direction

修改本遊戲前，請先讀本文件、[玩法規則](../../GAME_RULES.md#46-荒島遠征-frontier-islandsfrontier) 與 [設定圖](art/direction-board.png)。設定圖也附在遊戲的「美術設定與設計規範」中。遊戲的實際可玩場景由 draw.js 的 Canvas 繪製；設定圖不是實機截圖，也不可以整張拿來當地圖假裝可互動。

## 美術方向 / Visual language

- 深青綠介面、暖金色邊框與按鈕，羊皮紙色文字；草地、海水、砂岸須有明確對比。保留清楚、柔和的卡通體積與落地陰影。
- 主角：草帽、青綠帽帶與羽毛、青綠衣服、棕靴、皮革背包，揮斧可辨識。保留五官、走路起伏與背負資源。
- 樹木：多層不對稱樹冠、深淺葉群、可見樹幹與耗盡樹樁，不能退回單一圓形。人物走到樹冠後方時變透明，避免遮住操作。
- 岩石：藍灰色切面、亮面、暗面與耗損裂紋，不能只用一個灰色方塊。
- 建築：木構架、青綠屋頂、暖色窗光；小屋、市集、木材廠、採石場、箭塔、燈塔需一眼能分辨。未完工地基顯示材料，受損顯示耐久。
- 揮砍：斧頭揮動、弧形軌跡、樹木晃動、木屑或碎石、浮出採量；耗盡樹木有傾倒淡出。特效不改變採量或傷害判定。

Art direction: dimensional cartoon exploration, deep teal and warm brass, straw-hat explorer, layered foliage, faceted blue-gray rocks, distinguishable timber buildings, readable axe swings and material-specific impact debris. Keep visual effects separate from simulation and economy.

## 地圖與操作 / Maps and controls

- 不是稀疏展示場景：各區 160／205／250／295／340 個可再生資源點，木材約三分之二，避開建築、救援點與河道。
- 地圖從 1200×900 逐區擴到 2400×1500。手機用攝影機跟隨，不能把整張地圖縮到人物看不清。遠方樹木不繪製，粒子同時最多 70 個。
- 主要操作是移動：靠近自動採集、建造、攻擊、卸貨、拾金幣與修復。交易與買裝備是次要操作，不要求一直點砍樹按鈕。
- 電腦預設視窗遊玩，只有主動點全螢幕才切換；桌面資訊列保持單列，交易面板使用獨立側欄縮減Canvas寬度，不能擋住角色。手機開始時要求原生全螢幕，失敗則以固定全視窗版面呈現；保留退出、暫停、交易、裝備與前往下一島。搖桿及點地面移動並存；衝刺是電腦可選操作，手機不能強迫使用。
- 不可把大量往返或等待再生當成難度。生產交給實際採集搬運的 NPC，後期以敵營、分倉、敵襲與戰鬥組合增加挑戰。

Dense renewable forests, camera-following mobile maps, automatic proximity actions and optional trading/equipment panels are required. Later difficulty comes from expansion and defense, not repetitive waiting.

## 維護契約 / Maintenance contract

`world.js` 管純模擬、`draw.js` 管畫面、`game.js` 管 DOM／儲存／GA4。金幣只屬本遊戲，與平台點數分離。不得新增下注、抽裝備或點數倍率。中英顯示須同步更新 locales/en.json，切換語言不重新開局。

儲存鍵仍為 deep-sea-frontier-v1，新增欄位採相容補齊，保留舊材料、科技及通關。不得清資料測試；用隔離測試替身。以 VALIDATION.md 記錄實際測試，不能把 Canvas mock 或設定圖當作實機驗收。

Keep storage compatible and analytics single-settlement. Preserve existing gameplay unless explicitly authorized. Update both languages and record real verification limits.

## Production art and in-game HUD (2026-11-18)

The playable renderer loads art/sprites.png (4 columns, 3 rows) and art/enemies.png (2 columns, 2 rows). Crop using natural image dimensions. Primary slots: idle explorer, chopping explorer, tree, stump, ore, logs, cottage, market, mill, forge, tower, beacon. Enemy slots: melee, ranged, charger, boss. These are actual independent game assets, separate from direction-board.png. Keep the vector renderer only as a loading/error fallback.

The map fills the main game frame. Status and inventory float inside it; mission details expand on demand. Expedition records and help sit below the map. Desktop trading reserves its own column, while narrow screens use a bottom drawer. Desktop starts windowed. Handheld and <=600px layouts enter immersive play when starting/resuming. Mobile play is portrait-first. Never lock landscape or pause behind a rotation prompt. Keep the joystick clear of inventory/actions; portrait camera shows at least 480 world units across. Hide all platform header and switch-game navigation during immersion, then restore on exit. Do not shrink the map to fit stacked HUD rows.

Friendly defenders use art/warrior.png: teal crest, sword and shield, readable from the explorer and enemies. Preserve mobile help before play and in the journal; do not place instructional overlays over active movement.
