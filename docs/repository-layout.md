# Repo 目錄與檔案歸屬

本次採用「保留遊戲與工具入口，整理文件和產物」方案；第二階段將五份跨遊戲規範移進 docs。以下描述現有結構，不將遊戲改成新框架，也不搬動公開網址。

```text
deep-sea-games/
├── README.md / AGENTS.md                    根目錄開發入口
├── games/<id>/                              正式遊戲來源與 design
├── preview/<id>/                            原型／預覽來源
├── templates/                              大廳與頁面組合來源
├── js/ / css/ / locales/ / images/           共用前端來源
├── platform/                               共用平台功能（例如造型）
├── frontend/services/                      前端 API client
├── shared/                                 前後端共用規則與契約
├── backend/                                API Worker、D1 migrations
├── site/                                   前端 Worker
├── telegram-bot/                           Bot 服務
├── tools/                                  既有命令、測試與匯出入口
├── docs/
│   ├── README.md                           文件總索引
│   ├── ARCHITECTURE.md                      架構與來源定位
│   ├── GAME_RULES.md / ANALYTICS.md          規則與追蹤
│   ├── GAME_ICON_SPEC.md                    遊戲圖示規範
│   ├── RELEASE_CHECKLIST.md                 發布驗收清單
│   ├── agent-guides/                       維護規範
│   ├── publishing/<platform>/              平台 skill、SDK 參考與 manifest
│   ├── qa/                                 歷史驗收
│   ├── handovers/                          工作交接
│   ├── maintenance/                        Repo 維護紀錄
│   └── archive/                            舊交付快照
├── output/                                 本機媒體、平台包及驗證產物（Git 忽略）
└── index.html                              組合產出，勿手改
```

## 新檔案要放哪裡

| 內容 | 位置 | 維護方式 |
| --- | --- | --- |
| 正式遊戲程式、圖示、模型 | `games/<id>/` | 沿用 catalog、組合與路由契約 |
| 遊戲採用的設計原稿、提示詞 | `games/<id>/design/` | 有版本與用途；執行素材另外壓縮 |
| 尚未上架的玩法 | `preview/<id>/` | 依 prototype 流程，不混進正式大廳 |
| 平台上架 skill／manifest | `docs/publishing/<platform>/` | 延伸既有技能，不另複製一套 `skills/` |
| 自動建置／驗證／匯出工具 | `tools/` | 先看 [工具索引](../tools/README.md)，保留既有命令 |
| 平台遊戲 ZIP、送審圖、影片、報告 | `output/publishing/<platform>/<game>/` | `build/`、`media/`、報告與 ZIP 分開；保留已交付版本 |
| 一般遊戲錄影與宣傳素材 | `output/media/<game>/` | 新產物採此位置；既有交付路徑保留 |
| 品牌素材交付 | `output/branding/` | 與遊戲上架包分開 |
| 有日期的 QA、交接、維護紀錄 | `docs/qa/`、`docs/handovers/`、`docs/maintenance/` | 日期與版本寫明，不冒充目前狀態 |
| 歷史交付快照 | `docs/archive/<topic>/` | 原檔保留，不當作正式來源 |

## 為什麼有幾個看起來重複的資料夾

`js/` 是既有共享 runtime，`frontend/services/` 是 API client，`platform/` 是共用平台畫面；它們目前不是可直接合併的同一層。`backend/` 與 `site/` 分別是 API Worker 與前端 Worker。搬動這些目錄會連動相依、測試及部署，這次保留。

舊根目錄 `clock-out/`、`last-hair/`、`quack-pond/` 的完整原稿已歸檔至 `docs/archive/standalone-games/`，三個舊目錄與 `dodge-run.html`、`dream-repair.html`、`index_v2.html` 均已移除。舊網址統一由根目錄 `_redirects` 轉往大廳對應遊戲；`404.html` 提供 GitHub Pages 的相容處理及一般找不到頁面的提示。轉址設定屬必要網站入口，不再為每個舊遊戲保留一個根目錄。`.co-stage/` 與正在使用的 worktree 保留。

舊本機 `crush-depth.html` 已移至 `output/archive/legacy/`。過期 `dist/` 建置副本已移除；其中與先前交付不同的 ZIP 保存在 `output/archive/itch-peek/`。`tools/build_itch_peek.py` 仍可依原命令重新產生 dist，不需先建空目錄。平台新版產物走 `output/publishing/`，一般媒體走 `output/media/`。已交付的 output 版本及相容連結保留。

## 多個工作樹

同一 repo 可有多個 worktree。主目錄不一定包含另一個分支的最新改動，使用 `git worktree list` 定位；不要直接把整個工作樹複製回主目錄或刪除正在工作的暫存目錄。整理分支、合併、清理 worktree 是另一項工作。
