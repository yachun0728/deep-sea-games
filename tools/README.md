# 工具入口

所有命令從 repo 根目錄執行。這次保留工具位置與舊命令，依用途查找即可。

| 用途 | 入口 | 常用方式 |
| --- | --- | --- |
| 靜態組合 | [build.py](build.py) | `python3 tools/build.py`、`--check` |
| 遊戲程式索引 | [game_docs.py](game_docs.py) | `python3 tools/game_docs.py`、`--check` |
| 原型預覽 | [prototype.py](prototype.py) | `new`、`index`、`--check` |
| 簡中資料產生 | [build_zh_hans.py](build_zh_hans.py) | `python3 tools/build_zh_hans.py` |
| 多語系瀏覽器檢查 | [check_i18n_browser.py](check_i18n_browser.py) | 先讀 [語言指南](../docs/agent-guides/localization.md) |
| Python 測試 | `test_*.py` | `python3 -m unittest discover -s tools -p 'test_*.py'` |
| 遊戲／契約 Node 測試 | `test_<game-or-feature>.mjs` | `node tools/test_<name>.mjs`；依本次修改選擇 |
| Don't Peek 獨立包 | [build_itch_peek.py](build_itch_peek.py) | 既有輸出 `dist/`；使用前先檢查平台選項 |
| Rocket Chair CrazyGames 匯出 | [export_crazygames_rocket.py](export_crazygames_rocket.py) | 先讀來源與 [平台 skill](../docs/publishing/crazygames/SKILL.md) |
| Frontier Islands Y8 匯出 | [package_frontier_y8.py](package_frontier_y8.py) | 依 [Y8 skill](../docs/publishing/y8/SKILL.md)；輸出 `output/publishing/y8/` |

`i18n_browser_*.js` 是瀏覽器檢查分組，`i18n_data.py` 等是工具 helper；不要當遊戲入口載入。SDK adapter 和遊戲匯出器需與對應平台成對使用。

不同分支可能有更多工具（例如 TOP DOGGO CrazyGames 打包器）；此索引依本工作樹現有檔案整理，找不到時先核對分支與 `git worktree list`。既有工具的輸出路徑各有歷史，這次不改寫它們；新增平台工具則遵循 [跨平台打包目錄](../docs/publishing/README.md)。

本次沒有新增截圖中提及的 Game Publisher 或 SEO／GEO generator；那需要另訂功能範圍，不能用資料夾整理代替實作與驗收。
