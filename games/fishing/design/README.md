# 深海釣手換皮設計圖（B：大漁旗浮世繪）

2026-11-28 使用者選定 B 畫風，要求動作要有動感、不能只移動一張圖、魚游泳也要有動畫、背景分早中晚切換，並確認設定圖與動作試做後開始製作。以下以 sprite-gen（codex）生成。

| 檔案 | 用途 | 狀態 |
| --- | --- | --- |
| `style-b-v1.png` | 選定畫風的原始概念圖。天空放射線近似旭日旗，**不得沿用** | 僅畫風參考 |
| `scene-b-v2.png`、`angler-sheet-v1.png`、`fish-sheet-v1.png` | 直式構圖、釣手與紅鯛設定圖 | 使用者已確認 |
| `motion-*-test-v1.*` | 收線、掙扎動作試做 | 使用者已確認 |
| `source/*-v1.png` | 正式素材原圖：釣手 4 組（`reel`、`release`、`fight`、`result`）、紅鯛 3 組（`swim`、`thrash`、`moods`）、`boat`、五時段背景 `bg-*` | 使用者試玩確認上線（2026-11-28） |
| `cover-v2.png` → `../cover.webp` | 大廳封面（舊版 `cover-previous-v0.webp`） | 使用者確認上線（2026-11-28） |
| `leaderboard-v1.png` → `../leaderboard.webp` | 排行榜縮圖與 `icon.svg` | 使用者確認上線（2026-11-28） |

`python3 build_art.py`（需 Pillow、numpy）由 `source/` 重新產生 `../art/`，並輸出 `game.js` 的 `FI_SHEETS` 對位表（每格釣竿尖端／魚嘴座標）。時段順序清晨→早上→中午→黃昏→夜晚，每釣 3 條換一次。

## 動畫原則

- 每個動作以多張重畫的連續影格呈現，不以單張圖平移、旋轉或縮放代替。
- 魚線、浪花、鬥氣、速度線與畫面震動由程式疊加；`prefers-reduced-motion` 時關閉震動與閃光。
- 只換畫面；`shared/fishing-rules.cjs`、獎勵、排行榜與追蹤不變。
