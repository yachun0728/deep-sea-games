# 拒絕加班：美漫 02 發布

2026-11-28 使用者試玩後確認「這樣可以，幫我推上去」，並要求 game icon、leaderboard 縮圖，上線後測試及檢查既有榜單。使用者已澄清本次不新增雲端成績上傳或排名功能。

## 發布範圍

- 核准的完整美漫場景、人物、移動動畫、HUD、使用者指定的筆與左右箭頭、單行粗體繁中操作文字。
- 大廳封面：1056×1000 WebP，294184 bytes，正式英文名稱 `NO OVERTIME!`。
- 排行榜縮圖：192×192 WebP，27654 bytes，同款主角的近臉與藍筆；保留 `icon-office-shoot` symbol 接線。
- 必要字型、OFL 授權、字串 ID、組合產出、驗收工具與採納原圖；design/ 排除於部署素材。
- 修正文檔過時的「10 點入場／回本／重設 500」敘述：實際程式維持全站免費，未修改點數與獎勵經濟。
- 沒有改動後端、D1、API Worker、雲端排行榜規則、共用錢包、存檔鍵或 Analytics 契約。

## 遠端整合

從 `origin/main` 基準 `c3572bee336f5b3f0b1495602563b93e6aa19233` 建立獨立發布 worktree。只帶本遊戲與必要字串修改，重新產生 index 與遊戲文件。推送前再接上 `7ddd1a69bcb1ac786ee126cabdb49c870415c8fe`，保留尊嚴保衛戰剛核准的封面、排行榜圖與正式站驗收記錄。插隊、尊嚴保衛戰、人魚接龍與其他遊戲均保留最新遠端內容，沒有夾帶原工作區未提交修改。

## 驗收

- PASS：17 項本遊戲行為測試、49 項 Python 測試、build/check、diff whitespace。
- PASS：既有本機 QA 已測六尺寸畫面、CDP 觸控、六格移動、暫停／重玩／路由與中英文。最後使用者指定的筆／箭頭另驗證 320×568、390×844、430×760，保留原比例。
- PASS：在最新遠端整合版的 390px 真正榜單列，用唯讀 fetch fixture 檢查主角縮圖、遊戲名稱／成績排版，點列連結能進入遊戲並開始。此 fixture 不寫 D1，不代表正式資料新增了本遊戲成績。詳見 qa-release-v2。
- PASS：部署 dry-run，素材與 Worker binding 可組合，未包含 design/ 生成來源。
- NOT TESTED：手機／平板實機、Safari／Firefox、長時間或後期高負載 FPS、音訊聽感、GA4 後台收件。
- NOT APPLICABLE：新雲端成績上傳、D1 migration、API Worker 更新、CrazyGames 審核／QA Tool／SDK／廣告。本次僅本站發布。
- FAIL／BLOCKED：目前無未解決的發布阻塞；正式站部署與驗證結果於完成後補記。
