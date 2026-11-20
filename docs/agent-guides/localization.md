# 遊戲多語系

## 新增與修改遊戲的多語系要求

- 新增遊戲必須同時支援繁體中文與英文；簡體中文由 `locales/zh-Hans.json` 自動轉換提供（修改繁中文字後執行 `python3 tools/build_zh_hans.py`，詳見 [README 的「簡體中文」](../../README.md#簡體中文簡中)）；修改既有遊戲文字時也須同步翻譯，不得把僅有中文的版本當作完成上線。
- 使用既有 `locales/en.json`、`window.deepSeaI18n` 與頁首語言切換。翻譯須涵蓋大廳卡片、分類、遊戲選單與標題、玩法與 BONUS 規則、操作按鈕、成功／失敗／不足額／暫停／續關等動態提示、Canvas 文字，以及 aria-label／title／placeholder／alt。動態數字與樣板組合須驗證完整句子，不只檢查靜態字串。
- 新增同來源 iframe 遊戲時，確認載入、重新載入、動態文字與 Canvas 在目前語言下正常，切換後可還原原文；檢查子頁內的規則與提示，不得只翻譯父頁。珍奶原版已為英文，維持原畫面約定；外部或無法存取的 iframe 須明列未涵蓋範圍，不能宣稱全站翻譯完成。
- 翻譯只改顯示，不更動遊戲 ID／hash、GA4 事件與追蹤名稱、既有儲存 Key／格式、規則數值、扣點／獎勵或判定。不得以換語言重新載入頁面、重開回合或重複扣點／入帳／送追蹤；依文字判斷操作狀態的程式應使用原文或獨立狀態，不依賴翻譯後標籤。
- 發布前執行翻譯覆蓋與組合檢查（`python3 -m unittest discover -s tools -p 'test_*.py'`、`python3 tools/build.py --check`），並擴充 `tools/i18n_browser_*.js` 納入新遊戲，再執行 `python3 tools/check_i18n_browser.py`。驗證中英文直接 hash、語言記憶、進行中切換、動態與結束提示、桌面及實際 390px CSS viewport，記錄漏翻、溢出與未驗證事項；模擬不等於實機或 GA4 後台驗收。
- 純文件任務只更新上述規範，不因此執行遊戲翻譯、程式改造或發布。
