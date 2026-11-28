# 人魚接龍 Retro Aquarium v1 驗收

2026-11-28；本機 Internal Preview，未發布。

| 狀態 | 項目與證據 |
| --- | --- |
| PASS | 使用者核准的復古水族箱構圖與帶銀框封面已保存；實際畫面並排見 comparison.png。角色、藍色水族箱、銀色按鈕、十欄牌桌與底部操作區已對照。 |
| PASS | Score／Pearls 被共用 column 排列裁切的問題已修正，標籤與數值改為 row；六尺寸均檢查文字中心對齊、文字未超出容器。fixed-score-390.png 為實際修正後畫面。 |
| PASS | Chrome/158.0.8127.37 隔離無頭瀏覽器：390×844、320×568、430×760、768×1024、1366×900、844×390，無水平溢出、主要按鈕至少 44px 高、牌面不遮收集區，見 browser-results.json。橫向使用置中的窄版牌桌。 |
| PASS | 真實 DOM 事件與 CDP 觸控輸入：開局 54 張牌、10 欄翻牌；發牌增加 10 張且只減一次牌堆；悔棋還原；觸控選牌移牌；提示；離開大廳後返回保留牌局；兩次確認結束；重玩重設牌堆。 |
| PASS | 繁中、簡中、英文進行中切換保留牌局；可見英文控制項無中文。原有翻譯 ID 保留，未加新玩法文字。 |
| PASS | 大廳 390px 實際載入使用者指定封面，縮圖引用新的 leaderboard.webp。封面 1056×1000、約 180KB；榜單縮圖 192×192。 |
| PASS | node tools/test_mermaid.mjs：12 項行為測試，涵蓋三難度、規則、單次獎勵、悔棋不重發、結算、隨機局不變量。測試使用排行榜 stub，不代表真實後端已驗收。 |
| PASS | python3 tools/game_docs.py、build.py、build.py --check、49 項 Python 測試、5 段組合後可執行 inline script 語法檢查、git diff --check。 |
| FAIL | 無已知尚未修正的測試失敗。測試中發現的分數裁切、桌面畫面高度、提示卡被共用 helper CSS 隱藏均已修正；測試本身同步修正頁面重載與繁中提示判定。 |
| NOT TESTED | iOS／Android／iPad 實機觸控、鎖屏與切 App、Safari／Firefox、長時間 FPS／記憶體與低階裝置；沒有以無頭模擬推論實機通過。 |
| NOT TESTED | 真實榜單 API 寫入／排行榜列、GA4 後台收件、8 組珍珠的完整實際遊玩通關；獎勵和通關以既有 Node 行為測試驗證，不能視為真人通關 QA。 |
| BLOCKED | 無目前本機實作阻塞。預覽僅 127.0.0.1，未提供可供手機連線的對外位址；0.0.0.0 網路綁定曾被自動審查拒絕，已採僅本機的安全替代方案。 |
| NOT APPLICABLE | 本次未新增音訊、廣告、SDK、帳號、資料表或資料模型。未申請 CrazyGames Basic／Full Launch，無正式平台審核或 QA Tool 通過聲明。 |

## 影響與差異

- 只改人魚接龍呈現、底部既有發牌轉送與顯示尺寸，沒有修改 shared/mermaid-rules.cjs、錢包規則、獎勵額度、既有儲存 Key、排行榜與 Analytics 事件。
- 實作文字使用瀏覽器字體以支援繁中／英文，牌面花色沿用原 SVG。真正隨機牌局與設計稿示例牌局不同；背景人魚為核准稿衍生的靜態像素素材。
- GAME_RULES.md 原記錄的入場費 10 點已標為歷史資料，目前程式採全站免費 ENTRY_FEE=0，本次未變動經濟。
- 沒有提交、推送、合併或正式部署。尚待使用者試玩本機版本後決定發布。

## 重跑

1. 本機限定伺服器：python3 -m http.server 8893 --bind 127.0.0.1
2. python3 tools/check_mermaid_retro_browser.py
3. node tools/test_mermaid.mjs
4. python3 -m unittest discover -s tools -p 'test_*.py'

預覽：http://127.0.0.1:8893/?retro=20261128b#mermaid

## 後續：拖放後水平偏移修正

使用者回報放下牌後會往右偏。原本在放開時同時動畫 `left/top` 與舊的 drag `transform`，位移疊加造成超越目標。

改為先在 `.dragging` 的無 transition 狀態，把視覺位置轉成相對牌桌的 left/top，清除 transform、確定版面更新，再讓牌動畫至合法目標或返回來源。規則、計分、排行榜與獎勵不變。

- PASS：修正前實際 DOM 動畫逐影格重現向右超移（目標 310.797px，最右 374.460px，約 63.663px）；修正後測到目標與最右均為 348.891px，無超移。`drag-before.json`／`drag-after.json`；可用 `python3 tools/check_mermaid_drag_browser.py` 重跑（隨機牌局，座標依牌局不同）。
- PASS：12 項 Mermaid Node 行為測試；build --check、game_docs --check、git diff --check。
- FAIL：此次最新完整 Python 測試 49 項中有 3 項失敗，分別為其他進行中修改的 office-shoot 文字未覆蓋、office-shoot 翻譯 ID 孤立及簡中字表不同步。沒有修改或清除其他遊戲的翻譯；上方 49 項 PASS 是前次完整改版驗收時的結果，不代表目前整個共享工作樹通過。
- NOT TESTED：拖曳修正尚未做實體手機測試；尚未再跑完六尺寸整套瀏覽器驗收。
- BLOCKED：無；NOT APPLICABLE：規則、平台 API、SDK 或發布變更。
