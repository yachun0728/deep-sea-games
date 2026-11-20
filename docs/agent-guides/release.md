# 遊戲驗收與推送

## 遊戲上線與 BONUS 驗收

新增、改造、重新上架、調整 BONUS 或準備發布時，必須依 [RELEASE_CHECKLIST.md](../../RELEASE_CHECKLIST.md) 核對適用項目，並記錄實測結果及未驗證事項。BONUS 採固定技能／里程碑獎勵，核對卡片標章、規則、單次入帳與離頁追蹤；不得以獎勵名義保留博弈機制。提交及推送後須區分遠端收件、正式內容更新、實機操作與 GA4 後台驗收，不能互相替代。純文件需求只更新規範，不執行遊戲改造或自動發布。

## 推送前必須檢查最新版（防止圖片或他人變更被蓋掉）

2026-11-20 使用者指定：插隊（Queue Cutter，`games/elevator/queue-cutter-cover.webp`、`games/elevator/queue-cutter-leaderboard.webp`）的封面與排行榜圖示曾被舊版本覆蓋。每次推送前：

1. `git fetch origin`，與 `origin/main` 及目標遠端分支比較；遠端較新時先合併或 rebase，保留對方變更，禁止強推。
2. 合併後重新執行 `python3 tools/build.py` 與 `--check`，`index.html` 一律由最新來源重新組合，不沿用舊的產出或以自己的版本解衝突。
3. 以 `git diff origin/main --stat` 與 `git diff origin/main -- games/elevator/` 核對：不得有未被授權的圖片／素材被還原或刪除；插隊兩張圖的內容須與遠端最新版一致，除非本次明確要改。
4. 推送後在 PR 或回報中記錄已核對的遠端 commit SHA。
