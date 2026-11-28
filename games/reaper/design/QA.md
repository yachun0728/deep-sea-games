# 死神打工 C 款驗收（2026-11-28）

## 範圍與契約

只改死神打工美術、呈現尺寸、操作文字與素材載入。共用錢包、排行榜 API／Worker、GA4 與 `shared/reaper-rules.cjs` 不改。點數與判定沿用實際程式；歷史 Analytics 文件仍寫每局扣 10 點，但目前 `ENTRY_FEE=0`，這次不改經濟。

## 本機實測

環境：macOS，隔離 Chrome headless。390×844、320×568、430×760、768×1024、1366×900、844×390 為 CSS viewport 模擬，不是手機實機。

| 項目 | 結果與證據 |
|---|---|
| 核准 C 稿比對 | PASS：`comparison-c-v2.png`；場景、角色、材質、金色托盤、綠證與按鈕造型保持同款，400×523 等比完整顯示 |
| 使用者回報「揮鐮」偏位 | PASS：獨立文字 span 固定在黑色按鈕下半部；三語系中心量測 x=224.25、y=605.55（390×844），對應設計位置誤差 <0.03 CSS px |
| 三語系／六尺寸 | PASS：`python3 tools/check_i18n_browser.py --suite reaper`，60 個斷言；包括字串、畫布英文未漏翻、比例、觸控尺寸、切換時回合保留 |
| 真實輸入完整循環 | PASS：以觸控開局、觀察畫面上的靈魂並按原操作，實際處理 120 位；普通靈魂捕捉、綠證放行、高班次淡出、三心歸零、結算、重玩與 Space 冷卻均驗證 |
| 暫停與存檔 | PASS：離開路由期間分數和愛心不變，原 `reaper` key 保存最佳紀錄；結算閒置不重複入帳 |
| Runtime | PASS：上述試玩沒有 JS error／unhandled rejection |
| 大廳封面 | PASS：新圖已接入；1056×1000，296,392 bytes；英文名稱正確，沒有外框，手機縮小仍可辨識 |
| 排行榜縮圖 | 待正式站實際列驗收：192×192；保留 `icon-reaper` symbol，改指向新縮圖 |
| 全遊戲語系回歸 | FAIL（既有、非本次範圍）：`--suite games` 在踩地雷的「旗子插錯仍會踩mines.」停止；全站 Canvas 初始化另有「茶／飲」，專用監測依 canvas ID 區分 |
| 手機／Safari／Android 實機、長時間低階裝置 FPS | NOT TESTED：目前沒有相應實機操作證據 |
| 音訊變更 | NOT APPLICABLE：本次未加入或修改音訊 |
| CrazyGames SDK／QA／正式審核 | NOT APPLICABLE：本次發布至本站，沒有送審或聲稱平台通過 |

Build、單元測試與部署後驗證隨最終 commit 記錄。`output/reaper-c-qa/` 保存實際截圖與本機瀏覽器斷言紀錄（不隨部署公開）。原始設計與部件 PNG 由 `.assetsignore` 排除出站台資產，Git 仍保留原稿。
