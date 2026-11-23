# 萌獸破城隊 Critter Crashers 設計檔

| 檔案 | 用途 | 版本 |
| --- | --- | --- |
| `cover-v3.png` | 大廳封面原稿（1056×1000），壓成 `../cover.webp`（目前使用）：大砲塔、河狸工兵、城堡三個主要元素放大集中在畫面中間，其他隊伍縮小在後方路上，風車、池塘、樹叢等細節退到四周 | v3，2026-11-23 |
| `cover-v2.png` | 封面第二版（已由 v3 取代）：河狸工兵在前景當主角，隊伍縮小在後方路上，加上大砲塔射程、風車、池塘、蘑菇圈等場景 | v2，2026-11-23 |
| `cover-v1.png` | 大廳封面初版：角色排在同一條路上、背景較空，已由 v2 取代 | v1，2026-11-23 |
| `leaderboard-v1.png` | 排行榜縮圖原稿（192×192，河狸工兵），壓成 `../leaderboard.webp` | v1，2026-11-23 |
| `cover-v3.js` | 產生 cover-v3 與排行榜縮圖的程式：用遊戲本身的 `drawUnit`、`drawCastle`、`drawLandmark` 等繪圖函式繪製 | v3 |
| `cover-v2.js`、`cover-v1.js` | 產生 v2、v1 的程式 | v2、v1 |

角色與場景沿用 games-innovation/siege-architect 已完成的遊戲美術（黑色粗描邊＋鮮豔平塗，全部程式繪製），沒有另外的概念圖。
重新產圖：把 `cover-v3.js` 注入 games-innovation 的 `submit/siege-architect/thumbnails/siege-architect-thumb-page.html`（取代其縮圖 IIFE），以 `?size=1056x1000` 或 `?size=192x192` 開啟，取頁面上 `#out` 的 WebP data URL。
