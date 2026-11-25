# 修改與驗證流程

## 每次修改前

1. 確認需求、Git 分支、`git status --short` 與既有未提交修改，不覆蓋或順手提交他人的變更。
2. 先讀 `games/catalog.json` 定位遊戲 ID，再讀該遊戲的 `games/<id>/README.md`（由 `python3 tools/game_docs.py` 從原始碼自動產生：檔案、畫面元素、函式索引與行號、扣款／入帳／追蹤位置、規則摘要；`games/README.md` 是全部遊戲的索引），之後只打開需要的行號範圍，必要時再搜尋 `games/<id>/` 或對應 `js/` 檔案。不要讀取整份產出的 `index.html`，也不要預設讀完所有遊戲。珍奶原始畫面位於 `games/boba/original.html`，只在需求涉及原畫面時讀取。
3. 使用者提出的是尚未確定的新遊戲概念或想法時，先依 [遊戲骨架與預覽區](prototype.md) 做 `preview/` 骨架，不直接上架；已確認要上架的遊戲才走 `games/` 流程。
4. 優先進行最小範圍的修改。未經要求，不得修改其他遊戲規則、倍率、難度或 UI。
5. 若涉及多個模組的大幅重構，先提出分階段方案，說明相依性、驗證與回復方式，再開始修改。文件中的未來拆分方向不是重構授權。

## 修改後驗證

依變更範圍執行相關檢查，不需要為純文件修改重玩全部遊戲：

- 通用：修改遊戲來源或 GAME_RULES.md 後先執行 `python3 tools/game_docs.py` 重新產生說明檔（單元測試會檢查是否過期）；再執行 `python3 tools/build.py`、`python3 tools/build.py --check`、`python3 -m unittest discover -s tools -p "test_*.py"` 與 `git diff --check`。確認僅修改授權範圍、產出已同步、文件連結正確。
- 骨架（`preview/`）：執行 `python3 tools/prototype.py --check`（預覽入口、noindex、不外洩到大廳）與 `tools/test_prototype.py`；本機與推送後的線上網址各實際玩一輪，逐項依 [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) 第 0 節。純骨架不需重新組合 `index.html`。
- JavaScript：擷取可執行 script 後做語法檢查；JSON script 必須以 JSON 解析，不能當作 JavaScript 程式。若無 Node 或瀏覽器環境，明列限制。
- 錢包／遊戲：檢查不足額、開始只扣一次、成功／失敗／領回、續關、重複點擊、重新開始及重新整理後的儲存結果；核對倍率與取整。
- 路由／UI：從大廳、直接 hash、左上回大廳、手機尺寸、切分頁／背景恢復驗證受影響流程。不得假設每款遊戲離開頁面後都會自動暫停。
- 追蹤：確認 start／progress／resume／end 與停留時間沒有遺漏或重複。localhost 與 file 協定刻意不送 GA4；本機無請求不能證明正式站追蹤失效。只有看到後台收件才可聲稱 GA4 已驗收。
- 文件：若只新增文件，比對原有程式檔案雜湊，確認遊戲、點數與倍率沒有變動。

最後用繁體中文簡短說明：修改檔案與目的、已執行的驗證及結果、尚未驗證的事項。不得把未執行的測試寫成通過。提交或推送只包含已授權且檢查過的內容；不要夾帶既有未提交修改。
