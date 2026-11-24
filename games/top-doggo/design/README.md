# TOP DOGGO: Paw City 設計圖

畫風（2026-11-24 使用者選定）：粗輪廓美式復古卡通角色 + 邁阿密夕陽場景。原創角色與標題，不使用任何他人 IP、商標或美術。

## 已採納

| 檔案 | 用途 | 版本 / 日期 |
| --- | --- | --- |
| `character-sheet-v1.png` | GPT 繪製的角色設定集原圖（透明背景）。第一排是主角美式鬥牛犬；第二、三排是敵人草稿，**未採用**（敵人改由 sprite-gen 依主角畫風重畫成紫色浣熊幫） | v1 / 2026-11-24 |
| `hero/dog_front_blaster.png`、`dog_front.png`、`dog_side_left.png`、`dog_back_blaster.png`、`dog_back.png`、`dog_side_right.png` | 主角六個視角，從設定集第一排依連通區域切出的透明 PNG，未縮放 | v1 / 2026-11-24，使用者確認採用 |
| `logo-v1.png` | 標題 logo「TOP DOGGO: Paw City」原稿（透明背景）：橘黃到紅的夕陽漸層立體字、肉球當作 O、霓虹青 PAW CITY。放在遊戲開始畫面與大廳封面 | v1 / 2026-11-24，使用者確認採用名稱 |
| `cover-art-v1.webp` | 大廳封面的主角與背景原稿（不含文字，下方留白給標題）。正式封面 `../cover.webp`（1056×1000）由它加上 `logo-v1.png` 組成；排行榜縮圖 `../leaderboard.webp`（192×192）是主角頭像裁切 | v1 / 2026-11-24 |

主角：倒戴紅色星星帽、金框墨鏡、金項鍊、星條旗背心、牛仔短褲、紅白球鞋，持藍色網球槍。遊玩視角為背面 55° 過肩。

## 遊戲內美術來源

- 主角與敵人的動畫圖集（跑、攻擊、翻滾、蹲下，各武器一組）：sprite-gen（codex）依主角原稿生成，統一站立高度後壓成 256 色 PNG，放在 `../assets/hero`、`../assets/enemies`、`../assets/characters`。
- 建築、車輛、樹與街景小物：codex 以程式碼組出的低面數 Three.js 3D 模型，放在 `../models/`；地面由程式繪製。
- UI 圖示（武器、操作提示、HUD）：GPT 繪製後切圖，放在 `../assets/ui`。

## 未採納 / 待定

- 場景設定集、390×844 直式遊玩構圖：未另外製作，提示詞見 `preview/grand-theft-doggo/ART_BRIEF.md`。
