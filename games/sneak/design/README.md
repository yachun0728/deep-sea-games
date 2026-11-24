# 偷偷下班美術設定

- [角色與場景設定 v1](retro-office-direction-v1.png) 記錄上班族的偷溜和裝忙姿勢、主管的三種視線狀態，以及雨夜辦公室的漫畫印刷配色。
- [手機遊玩構圖 v1](retro-office-portrait-v1.png) 記錄直式 HUD、橫向逃跑路線、右側出口與下方拇指操作區。

以上兩張為本次確認採用的概念原圖。實際遊戲使用獨立的背景和人物素材，以便顯示正確的角色狀態。

[排行榜縮圖](../leaderboard.webp) 取自大廳封面角色的回頭表情，以 192 × 192 px 的方形構圖顯示在遊戲名稱旁。

[大廳封面原圖 v1](retro-office-cover-v1.png) 為正式 WebP 封面與排行榜角色縮圖的原始素材。

## 巡邏版角色

- [老闆全身動作 v2](boss-poses-v2.png) 用於走路、轉身和落座，沿用原本的橘色針織衫與漫畫網點。
- [巡經同事 v1](coworker-poses-v1.png) 用於兩位路過的同事。

2026-11-20 使用者試玩確認本版可發布。

## 2026-11-24 走路與走廊（sprite-gen + GPT）

- [走路循環 v1](walk-cycle-v1.png)（原始條帶 [walk-cycle-v1-raw.png](walk-cycle-v1-raw.png)）：以 `art/step-a.webp` 為底圖，用 sprite-gen 的 GPT 圖列生成 8 格潛行走路，每格 256×384、腳底線在第 348 列；正式素材為 `art/walk-cycle.webp`。walk 屬 sprite-gen 的實驗狀態，未經使用者確認前視為待驗收。
- [入口走廊 v1](hallway-v1-raw.png)：以 `art/rainy-office.webp` 為風格參考生成，沒有桌椅、檯燈與盆栽，雨向與辦公室一致；正式素材 `art/hallway.webp` 由原圖右段加左段接成一個可單向重複的區塊（不再鏡像）。
