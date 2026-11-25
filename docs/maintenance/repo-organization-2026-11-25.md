# Repo 整理紀錄（2026-11-25）

使用者選擇：保留遊戲與工具入口，先整理文件和產物。所有原檔搬移均核對 SHA-256；沒有刪除遊戲、覆寫未提交修改或合併其他 worktree。

## 文件與歷史快照

| 原路徑 | 新路徑 |
| --- | --- |
| `I18N_VALIDATION.md` | `docs/qa/i18n-2026-11-17.md` |
| `HANDOVER_TOP_DOGGO.md` | `docs/handovers/top-doggo-2026-11-24.md` |
| `Claude outputs/itch-page-en.md` | `docs/archive/itch-peek/itch-page-en.md` |
| `Claude outputs/dont-peek-html5.zip` | `docs/archive/itch-peek/dont-peek-html5.zip` |

## 本機產物

以下實際檔案搬到分層目錄；舊路徑留相對符號連結以維持先前下載位置。這些本機檔案位於 Git 忽略的 output。

| 相容舊路徑 | 新的實體位置 | 檔案數 |
| --- | --- | --- |
| `output/frontier-previews` | `output/media/frontier-islands/videos` | 4 |
| `output/frontier-game-icons` | `output/media/frontier-islands/covers` | 6 |
| `output/frontier-screenshots` | `output/media/frontier-islands/screenshots` | 14 |
| `output/frontier-islands-y8` | `output/archive/y8/frontier-islands` | 8 |
| `output/ticatica-y8-publishing` | `output/archive/skills/ticatica-y8-publishing` | 4 |
| `output/top-doggo-vertical-v2.mp4` | `output/media/top-doggo/top-doggo-vertical-v2.mp4` | 1 |
| `output/top-doggo-vertical-v3.mp4` | `output/media/top-doggo/top-doggo-vertical-v3.mp4` | 1 |
| `output/top-doggo-vertical.mp4` | `output/media/top-doggo/top-doggo-vertical.mp4` | 1 |
| `output/top-doggo-endcard-vertical.png` | `output/media/top-doggo/top-doggo-endcard-vertical.png` | 1 |

## 保留與後續邊界

- 遊戲與共用 runtime、catalog、模板、index.html、Worker、D1、存檔與追蹤程式不變；tools 舊命令與輸出位置不改寫。
- 根目錄主要規範仍是入口；新文件用 docs 的分類目錄。新增文件索引、目錄導覽與工具索引。
- .gitignore 增加 Finder 的 .DS_Store；既有檔案仍保留在磁碟。
- index_v2.html、.co-stage、舊網址相容目錄與其他 worktree 保留，沒有按檔名就推定為可刪。
- 主工作樹有踩地雷、預覽與 Agent 規範等既有未提交修改，這次保留。TOP DOGGO 最新來源在另一個 worktree；本次不將其複製或合併回 main。
- 未新增截圖中的 Game Publisher 或 SEO／GEO 功能；這次只整理目錄。

## 驗證

具體結果在交付時回報；檔案雜湊可證明本次未修改遊戲內容，不能取代遊戲功能或部署驗收。沒有執行發布。

本次實際結果：

- PASS：既有非 Markdown 檔案逐一雜湊一致（包含遊戲、index.html、工具與部署設定）。
- PASS：四份搬移文件／ZIP 的原始內容一致；新索引連結可解析。
- PASS：舊交付 ZIP 完整性；40 份本機產物搬移前後雜湊一致，九個相容連結可讀。
- NOT APPLICABLE：遊戲行為回歸測試，這次未修改執行程式。
- NOT TESTED：網站部署／平台 QA，本次未發布。

### 推送整合驗證

從最新遠端 main（13415d4）建立獨立工作樹，保留遠端 QA 文件與遊戲更新。發布文件首次納入 Git，同時納入其既有 Y8 工具依賴。重新產生簡中字表及 index.html 的對應內嵌資料；因此這次推送另包含這兩份產出同步，不是遊戲邏輯改動。

PASS：build／--check、48 項 Python 測試、工具語法、文件連結、diff --check。games/elevator 與 games/thief 對遠端沒有差異。原主工作樹未提交內容保留；output 的本機搬移與相容連結不由 Git 推送。
