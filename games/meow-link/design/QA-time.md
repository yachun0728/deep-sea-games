# Meow Link 計時排行驗收

需求：簡單、普通、困難各自分榜，全破十關才入榜，時間越短越前面；結算停留不計時。舊通關數紀錄保留但不混入新榜，原版 Ocean Link 不改，點數隱藏維持。

- PASS：三難度全部十關純規則、Worker 與 SQLite 重播；不完整、錯誤訪客、非法操作、重送、結算停留、慢成績不覆蓋、較快成績更新、同分先到、三語名稱及時間 API。
- PASS：390×844 與 1366×900 隔離 Chrome 搭配真實 Worker handler 及記憶體 SQLite，兩尺寸各 3606 項實際頁面操作檢查，三種難度各完成十關；API 接收、結果時間、個人最快與榜單一致，遊戲及大廳顯示時間。另測原本已開榜單的自動更新。
- PASS：六尺寸 1770 項原有瀏覽器檢查，含離線備援、語言切換、原版資料隔離、點數隱藏、提示及通關生命週期。
- PASS：49 項 Python 專案測試；build 及 --check；git diff --check。
- FAIL：目前已執行檢查無未修正失敗。
- NOT TESTED：實體 iOS／Android／平板、長時間 FPS、GA4 後台。
- NOT APPLICABLE：CrazyGames、廣告、IAP、多人。

以伺服器收到每關開表與完成指令的時間核對，含網路延遲；結算顯示會校正為伺服器結果。背景停留照常計時，不能靠切換分頁暫停競速。原有兩小時回合上限保留。資料庫不改 schema，排序值為 7200000 減去完成毫秒數；API 額外提供 elapsedMs/time，前端不顯示內部排序值。

測試：node tools/test_meow_link_time.mjs；node tools/test_meow_link_api.mjs；node tools/test_meow_link.mjs；python3 tools/check_meow_link_time_browser.py；python3 tools/check_i18n_browser.py --suite meow_link。

發布基準遠端 SHA：efd34c978c66b9fe6b9198897d00982410393438。回復時保留新榜時間格式化，或先隱藏三個時間榜；不得把內部排序值顯示成分數。現有時間紀錄與舊存檔皆不刪除。
