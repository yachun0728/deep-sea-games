# 根目錄文件整理（2026-11-25）

使用者核准將根目錄跨遊戲規範移入 docs，同步修正引用，保留遊戲與部署入口。

| 原位置 | 新位置 |
| --- | --- |
| ARCHITECTURE.md | [docs/ARCHITECTURE.md](../ARCHITECTURE.md) |
| GAME_RULES.md | [docs/GAME_RULES.md](../GAME_RULES.md) |
| ANALYTICS.md | [docs/ANALYTICS.md](../ANALYTICS.md) |
| GAME_ICON_SPEC.md | [docs/GAME_ICON_SPEC.md](../GAME_ICON_SPEC.md) |
| RELEASE_CHECKLIST.md | [docs/RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) |
| index_v2.html 完整快照 | [docs/archive/site/index_v2.html](../archive/site/index_v2.html) |

根目錄 Markdown 只留 README.md、AGENTS.md。所有受影響文件的相對連結已重算；tools/game_docs.py 改讀 docs/GAME_RULES.md，產生的規則與追蹤連結也指向新位置，命令保持原樣。index_v2 舊網址留轉址頁，保留 query／hash；未搬動正式 index.html 或其他遊戲路由。

沒有刪除其他工作樹、合併分支或覆蓋現有未提交的遊戲工作；提交／推送狀態依 Git 與交付訊息為準。

驗證結果：PASS：48 項 Python 測試、60 份遊戲文件新鮮度、build --check、受影響文件連結、轉址 query/hash 保留及舊版快照雜湊；789 份遊戲／資產／執行檔內容未改。NOT TESTED：正式站轉址與部署；提交／推送狀態依 Git 與交付訊息為準。

後續清理：原本保留的個別舊網址轉址已移除，改由 `_redirects` 統一處理，GitHub Pages 用 `404.html` 相容；舊原稿仍歸檔，詳見 unused-files-2026-11-25.json。

推送整合：以 origin/main 5046e8b 為基底，保留遠端較新的規則與 QA 文件內容，只更新搬移路徑與連結。build／--check、48 項 Python 測試及 15 條舊網址轉址單元檢查 PASS；遊戲程式、素材與 index.html 無差異。正式 Cloudflare／GitHub Pages 轉址 NOT TESTED，需部署後驗收。
