# 文件索引

先用 [repo 目錄導覽](repository-layout.md) 找到責任範圍，再開相關規範。根目錄只保留產品與開發的主要入口文件。

| 類別 | 入口 | 用途 |
| --- | --- | --- |
| 開發入口 | [README](../README.md)、[架構](../ARCHITECTURE.md) | 建置、來源與共用相依 |
| 維護規範 | [AGENTS](../AGENTS.md)、[修改流程](agent-guides/workflow.md) | 修改前定位、驗證與回報 |
| 遊戲規則 | [GAME_RULES](../GAME_RULES.md)、[遊戲索引](../games/README.md) | 規則與自動產生的程式索引 |
| Analytics | [ANALYTICS](../ANALYTICS.md) | 事件及驗收 |
| 後端 | [BACKEND](BACKEND.md) | Worker、D1 與 API |
| 發布 | [Release](agent-guides/release.md)、[檢查表](../RELEASE_CHECKLIST.md) | 本站發布與驗收 |
| 跨平台上架 | [publishing](publishing/README.md) | 平台 skill、SDK、遊戲 manifest；交付包另外放 output |
| 美術與手機 | [手機設計](agent-guides/mobile-design.md)、[圖示規範](../GAME_ICON_SPEC.md) | 遊戲畫面、素材與封面 |
| 跨裝置效能 | [效能指南](agent-guides/cross-platform-performance.md) | 裝置、輸入、生命週期與效能 |
| 多語系 | [語言指南](agent-guides/localization.md) | 翻譯、動態顯示與檢查 |
| 歷史驗收 | [2026-11-17 語言驗收](qa/i18n-2026-11-17.md) | 只代表該次版本，不能當作目前驗收 |
| 工作交接 | [TOP DOGGO 2026-11-24](handovers/top-doggo-2026-11-24.md) | 歷史工作位置與狀態，以目前 Git／來源為準 |
| 舊交付快照 | [Don't Peek itch.io](archive/itch-peek/README.md) | 保留原交付文字與 ZIP，不是新版來源 |
| 本次整理 | [整理紀錄](maintenance/repo-organization-2026-11-25.md) | 搬移表、驗證與保留項目 |

`agent-guides/` 放跨遊戲維護規範；`publishing/<platform>/` 放平台專屬 skill 與參考；`qa/` 放有日期的驗收紀錄；`handovers/` 放交接；`archive/` 放歷史快照。遊戲專屬設計仍放 `games/<id>/design/`。
