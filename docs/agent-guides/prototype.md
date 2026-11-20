# 遊戲骨架（Prototype）與預覽區

2026-11-20 使用者指定：遊戲分兩個階段，先做**可玩的骨架**推上去試玩，確認好玩再**上架**到大廳。

| 階段 | 位置 | 大廳 | 點數／GA4／排行榜 | 狀態 |
| --- | --- | --- | --- | --- |
| 骨架 | `preview/<id>/index.html`（獨立單檔） | 不出現 | 不接 | `prototype`／`playtest` |
| 上架 | `games/<id>/` 並登錄 `games/catalog.json` | 出現 | 依 [new-game.md](new-game.md) 全部接入 | `graduated` |

## 做骨架

1. 使用者提出遊戲概念或想法時，先建立骨架，不要直接走 `games/` 上架流程：

   ```sh
   python3 tools/prototype.py new <id> "<中文名稱>" "<一句話概念>"
   ```

   會產生 `preview/<id>/index.html`（開始／結束／重玩循環、手機直式 Canvas、`PROTOTYPE · 未上架` 標籤、noindex）並更新 `preview/prototypes.json` 與預覽入口 `preview/index.html`。
2. 骨架只做**核心循環**：一個操作、一個目標、一個失敗條件，要能從開始玩到結束。美術用色塊／線稿即可，不用做完整素材。
3. 骨架必須遵守 [product-policy.md](product-policy.md)（不得有博弈元素），但**不需要**：多語系、錢包、GA4、訪客排行榜、BONUS、`js/`／`templates/` 接線。不得讀寫 `crush-depth-balance` 等平台儲存 Key；需要存檔時用 `proto-<id>-` 開頭的獨立 Key。
4. 骨架 id 不可與 `games/catalog.json` 的 id 重複（工具會擋）。不要為骨架修改 `catalog.json`、`templates/lobby.html`、`templates/index.html`、`js/`，也不用重新組合 `index.html`。

## 預覽位置（測試用）

- 本機：`python3 -m http.server 8765`，開 `http://localhost:8765/preview/`（總覽）或 `/preview/<id>/`（直達）。手機實機用同網段電腦 IP 開同一路徑。
- 線上：`preview/` 隨靜態站一起推送，位址為 `https://yachun0728.github.io/deep-sea-games/preview/<id>/`（總覽 `/preview/`）。推送後約 1 分鐘部署完成，需實際開啟確認。每頁有 noindex meta（實際擋搜尋引擎的是這個）；`_headers` 也對 `/preview/*` 設 `X-Robots-Tag`，但 GitHub Pages 不讀 `_headers`，該標頭只在 Cloudflare 等會讀它的部署才生效（2026-11-20 已在 GitHub Pages 實測沒有此標頭）；大廳與選單沒有任何連結，只靠網址進入。
- 交付時直接給使用者可點開的網址（含版本說明、適用裝置、要驗收的操作），先自己點開確認可開始遊玩，規則同 [release.md](release.md)「先提供可遊玩的驗收入口」。

## 推送骨架

- 推送前跑 `python3 tools/prototype.py --check` 與 `python3 -m unittest discover -s tools -p "test_*.py"`；檢查包含：預覽入口是最新、每頁 noindex、尚未上架的骨架沒有出現在 catalog／大廳／`index.html`。
- 骨架 commit 只包含 `preview/` 與必要文件，不夾帶其他未提交修改；仍須遵守 [release.md](release.md)「推送前必須檢查最新版」。
- 推送骨架不需要使用者確認「可以上線」，但**不得**因此順手上架。

## 從骨架上架

使用者確認骨架好玩並明確要上架後，才依 [new-game.md](new-game.md)、[release.md](release.md) 在 `games/<id>/` 重做成正式版（含多語系、訪客排行榜、驗收），把 `preview/prototypes.json` 該筆改成 `graduated` 並執行 `python3 tools/prototype.py index`。骨架程式只作為玩法參考，不直接複製成正式遊戲。放棄的概念改成 `dropped`，可保留或刪除資料夾。
