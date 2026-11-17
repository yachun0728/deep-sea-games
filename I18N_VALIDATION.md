# 中英文發布驗證紀錄

日期：2026-11-17。以 GitHub `origin/main` 的 `5c14ad2` 為基底，在獨立工作樹整合英文版；原工作區的其他未提交修改未帶入。

## 範圍

新增 `locales/en.json`、`js/i18n.js`、`css/i18n.css` 與頁首繁中／EN 切換，更新模板並由 `tools/build.py` 產生 index.html。語言參數支援 `?lang=en`／`?lang=zh-Hant`；新 Key `deep-sea-language-v1` 僅儲存偏好，不遷移或清除既有資料。切換不重新載入、不呼叫遊戲路由或追蹤生命週期。手機原按鈕的判斷改讀原文，保留原節點與處理器。珍奶卡片原無障礙說明20點改為實際10點。

遠端新增的青蛙、偷睡、一口氣探險、捷運、煎餅及布丁文字已補翻。對同來源iframe的文字及Canvas使用顯示層翻譯，不更動原始遊戲、橋接、點數或規則；珍奶原英文畫面保留。ARCHITECTURE.md與README.md同步記錄語言維護方式。

## 已執行

- `python3 tools/build.py`、`python3 tools/build.py --check`、`git diff --check`：通過。
- 組合後3段JavaScript編譯、4段JSON解析：通過。
- `python3 -m unittest discover -s tools -p 'test_*.py'`：18項中17項通過；1項為下述已證明存在於遠端的文件同步問題。英文翻譯覆蓋、英文值與JSON安全測試通過。
- 既有手機按鈕10項及手機導覽11項測試：透過Node工具執行，通過。
- `python3 tools/check_i18n_browser.py --screenshots /tmp/english-release-shots`：220項獨立Chrome斷言通過。使用僅本機HTTP與暫存瀏覽器設定檔，不讀取使用者的瀏覽器資料。
- 驗證預設中文、英文網址、重新載入偏好、明確參數優先、偏好儲存受限、其他query及hash保留、aria-pressed；切換不改既有儲存及不呼叫analytics start/progress/resume/end/view。
- 所有初始遊戲頁面及無障礙標籤翻譯檢查通過，8款隱藏遊戲維持封鎖。20款可由既有主頁開始的遊戲驗證扣款及切換；探險、捷運、煎餅另驗證實際iframe載入、開局10點、動態翻譯與切換不重扣。每日挖礦仍免費，珍奶橋接及原英文畫面正常。
- 桌面1366×900及真實CSS390×844裝置模擬通過；英文大廳、受測遊戲與iframe父頁無橫向溢出，語言控制未遮住錢包。英文Canvas未發現漏翻中文。

## 既有問題與限制

`python3 tools/game_docs.py` 在遠端原版即會改寫 `games/pudding/README.md` 與 `games/README.md`；原因是布丁的導覽／追蹤等登記尚未與其文件同步。已逐位元組核對文件、generator與相關登記來源皆與 `5c14ad2` 相同，確認不是英文版造成。保留原遠端文件，不提交產生器將名稱改成「? ?」及刪除規則的差異。布丁既有hash路由未登記也不在本次修改範圍，未聲稱其可開局驗收。

未逐一實玩全部高關卡、每個BONUS或死亡邊界；未使用實體手機，未驗證GA4後台收件。本機方法呼叫、裝置模擬、Git遠端收件與正式站部署須分別確認，不互相替代。回復本次提交時可保留語言偏好Key，舊版會忽略它。
