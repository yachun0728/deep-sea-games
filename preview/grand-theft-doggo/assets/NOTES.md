# 素材備註（骨架階段）

- 來源：`/Users/angellu/Documents/dev/grand-theft-doggo_vice-paw/design`（使用者提供的 MVP 地圖素材包 v0.1）的 buildings、tiles、vegetation、characters、backgrounds，以及 asset-manifest.json、world-map.json。
- `vehicles/`、`props/` 是素材包原本從概念圖誤裁的版本（有實心底色、裁到別的物件），**遊戲不使用**，只保留供對照。
- `vehicles2/`（6 款車）與 `props2/`（12 款街景小物）由 sprite-gen `gen`（codex，洋紅底）重畫，2026-11-24，已去背切圖。遊戲中的尺寸與碰撞寫在 index.html 的 VEHICLES、PROPS2。
- 敵人、主角沒有走路／攻擊動畫，只有靜態方向圖，動作由程式（彈跳、前傾、翻滾旋轉）呈現。

## 2026-11-24 改回 doggo.html 框架套皮

- index.html 是使用者 doggo.html 的 three.js 框架（55° 過肩鏡頭、HUD、按鈕大小、操作都沿用），只把畫面換成這個素材包：地磚烤成地面貼圖，角色與小物是面向鏡頭的 Sprite。
- 主角永遠只看得到背面，用 sprite-gen 出的背面動畫（`assets/hero/atlas_attack_run.png`：揮拳 4 格＋跑步 6 格；`atlas_roll_crouch.png`：翻滾 6 格＋蹲下 4 格，格子 256px）。待機用揮拳第 1 格加呼吸。
- 每個 city block 一棟大建築，整個 block 設為不可進入；建築斜躺在 block 上並面向鏡頭，遮住主角／敵人／車子時自動變半透明，避免擋畫面。
- 所有去背小圖都做過邊緣補色（透明像素填入鄰近顏色），避免縮小時出現黑邊。
- `window.__doggo` 是測試用掛鉤（骨架階段保留）。
