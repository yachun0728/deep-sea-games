# 小灰出門毛氈版：發布紀錄

## 授權與範圍

2026-11-29 使用者試玩並核准：「可以了，推上去，記得小灰出門不要進排行榜。」
採核准 v5 毛氈外觀、側視水平步道、短腳骨架動畫、日記置中與完整視窗背景。以最新遠端 `1bc8ca4a563fa65973a4fdb8cb840ec2efa9ec56` 的乾淨 checkout 整合，保留其他已發布遊戲原樣，沒有複製髒工作區的 index.html。

## 排行榜排除

- 不接 Pet Walkies 的回合／成績上傳、不新增 Worker verifier 或 migration。
- 大廳 `js/member.js` 明確排除 `pet-walk`，包含 API 意外回傳該遊戲舊資料的情況。
- 遊戲內沒有排行榜面板；保留既有本機分數、物資與圖鑑。
- `docs/GAME_RULES.md` 與 `docs/agent-guides/new-game.md` 記錄使用者指定例外，後續維護不可自行接榜。

## 乾淨發布版本驗收

| 狀態 | 實際結果 |
| --- | --- |
| PASS | build 與 --check、JS 語法、17 項遊戲檢查、49 項 Python 測試、diff --check |
| PASS | 真實觸控／鍵盤 60 步、三段單次獎勵、最後轉盤、日記、圖鑑、回憶、PNG 匯出、重玩、語言切換、離頁返回 |
| PASS | 324 種日記、24 種中英事件畫面；手機／桌面模擬尺寸、完整視窗背景與分享／返回鈕不重疊 |
| PASS | 合成排行榜 feed 內含 pet-walk 和 frog：小灰不顯示、青蛙正常；小灰開局沒有成績 API 請求。未以此宣稱正式 D1 已驗證 |
| PASS | Wrangler dry-run 成功；設計原圖由 .assetsignore 排除靜態部署 |
| FAIL／BLOCKED | 無已知未解決項目 |
| NOT TESTED | 手機／平板實機、iOS Safari、長時間低階效能、GA4 後台收件 |
| NOT APPLICABLE | CrazyGames SDK／QA Tool／審核／發布、排行榜 API／D1 變更 |

## 發布狀態

提交與遠端推送、正式部署及正式站操作結果會於完成後分別補記，不以 dry-run 代替發布。

## Production verification completed

- Code commit: 1eb57d22d91260d8c77502cafd9f04f0318558b5, pushed to origin/main.
- Cloudflare deployment: 80025ae6-eaca-4012-8b95-d81862a7c5ae; 50 static assets uploaded.
- Live URL: https://www.ticaticagames.com/?lang=zh-Hant&v=1eb57d2#pet-walk
- PASS: exact Pet Walkies runtime and CSS on www, apex and workers.dev; all three contain the explicit leaderboard exclusion. Published cover, CSS, character, scene and member.js match the release files byte for byte. See live-release-report.json.
- PASS: actual official-site browser start and held walking to step 2 with the crate event. Screenshot: live-v5-event.jpg. The live smoke test does not claim a full 60-step live round; the complete round passed on the clean local release build.
- Concurrent release preserved: origin/main dc56a5f adds Reaper fullscreen improvements. It was fast-forwarded into this checkout after verifying the live Pet Walkies fragment. No old-site redeployment overwrote that concurrent work.
- NOT TESTED: physical mobile/tablet, GA4 backend receipt, long-running low-end performance.
- NOT APPLICABLE: Pet Walkies leaderboard uploads, backend migrations, CrazyGames review.
- FAIL / BLOCKED: no unresolved Pet Walkies release issues.
