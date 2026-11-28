# Retro Aquarium v1 — 人魚接龍

2026-11-28 使用者核准復古電腦水族箱設計，並另外指定採用帶銀色視窗框、藍色標題列的封面。既有 `design/cover-v1-source.png` 等舊檔全部保留。

## 素材與核准紀錄

- `approved.png`：核准的直式遊玩構圖原稿。
- `approved-cover.png`：使用者貼圖確認的封面原稿；保留視窗框與頂部名稱，這是使用者明確指定，優先於一般封面「不要外框」慣例。
- `aquarium-source.png`、`card-back-source.png`：內建 imagegen 以核准稿作為參考產生的原檔。
- `../../art/aquarium.webp`、`../../art/card-back.webp`：同尺寸 WebP 匯出；背景約 105 KB、牌背約 71 KB。
- `../../cover.webp`：核准封面匯出 1056×1000，約 180 KB。
- `../../leaderboard.webp`：同一封面角色區裁切為 192×192。
- `comparison.html`、`comparison.png`：核准稿與實際 390×844 遊玩截圖並排。
- `fixed-score-390.png`：針對使用者回報 Score／Pearls 裁切問題的修正後實際截圖。共用 `.stats div` 預設 column，遊戲限定 row 修正。
- `ready-390.png`、`playing-*-390.png`、`over-390.png`、`layout-*.png`、`lobby-390.png`：隔離 Chromium 實際執行畫面，不是裝置實測。

## imagegen 提示詞

背景（參考 `approved.png`）：

> Edit target is approved Mermaid Spider retro aquarium mockup. Produce the exact aquarium BACKGROUND LAYER alone for the actual game, tall portrait 390:760 aspect. Remove ALL UI, text, cards, pearl sockets, stock, headers, footers, borders and buttons, reconstruct clean cyan water beneath them. Preserve the original purple-haired pixel mermaid with yellow star hair clip, pale skin, turquoise tail, facing right, original fish, seaweed, pink coral and rocks along bottom. Preserve their pixel art identity and proportions, no redesign. Mermaid centered at x45%, y84%, width28% of image. Bottom scene fills only lower 22%; upper 78% is quiet cyan-blue water with a few small bubbles and surface ripples at very top. Crisp pixel art, identical to reference, no gradients with smooth vector character, no painting. Full bleed background, no transparency.

牌背（參考 `approved.png`）：

> Extract/recreate one exact blue pixel art card BACK design from approved reference. Output ONE portrait playing card back with aspect ratio 5:7, filling entire image edge to edge, square corners. Royal blue fill, stepped white and pale blue double pixel border, central white swimming mermaid silhouette facing right, tiny white pixel bubbles, diamonds and sea plant motifs, identical retro computer aquarium aesthetic to reference. No ranks, no text, no other objects, no shadow outside card, no tabletop, no mockup. Crisp pixel art with large enough pixel clusters to read when card is 34px wide.

## 實作範圍與比對

採用原生 DOM/CSS 復古視窗與可翻譯的實際文字，牌背及場景使用正式像素素材。背景人魚的紫髮、黃色海星髮夾、青綠尾巴、位置及比例與原稿對照。十欄牌局、底部按鈕與收集區保留原稿層級。差異：介面文字使用可讀的瀏覽器字體，牌面花色沿用本站原 SVG；實際隨機牌局與概念示例牌局不同。分數、珍珠數依真實遊玩狀態更新。

既有 rules、存檔 Key、錢包獎勵及 Analytics 契約不變。新增底部 Deal 只轉送原牌堆 click。既有行為測試補載實際的 shared rules 與排行榜 stub，並未用 stub 宣稱平台驗收。

## 驗收與限制

詳見 `QA.md`、`browser-results.json`。本機入口：`http://127.0.0.1:8893/?retro=1#mermaid`。

這次只做本機驗收，未提交、推送或正式發布。預覽僅綁定本機；手機無法直接連線此位址。首次 0.0.0.0 綁定被自動審查拒絕（避免對外暴露整個專案），已改用 127.0.0.1，無須再開放對外介面。
