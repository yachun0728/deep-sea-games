# TiCATiCA Games：跨平台發布與打包

發布規範與各平台的遊戲資料統一放在本目錄，以平台分子資料夾。先讀目標平台技能；本機打包不代表已授權上傳、送審或發布。

```text
docs/publishing/
  README.md
  y8/
    SKILL.md
    references/
    scripts/
    examples/
    games/frontier-islands/y8-game.json
  crazygames/
    SKILL.md
    references/sdk.md
    games/frontier-islands/crazygames-game.json
  <platform>/                       # 日後確定平台後才建立
    SKILL.md
    games/<game-slug>/...

output/publishing/
  y8/frontier-islands/
    build/index.html                # 打包來源
    frontier-islands-y8.zip          # 第一層為 index.html
    build-validation.json           # ZIP 外驗證報告
    preview.jpg                     # ZIP 外預覽
  <platform>/<game-slug>/...         # 各平台產物分開
```

目前平台：[Y8 技能](y8/SKILL.md)、[Y8 Frontier Islands 資料](y8/games/frontier-islands/y8-game.json)；[CrazyGames 技能](crazygames/SKILL.md)、[CrazyGames Frontier Islands 資料](crazygames/games/frontier-islands/crazygames-game.json)。未指定的其他平台不預建空目錄或臆測其規格。

## 共用原則

- 每個發布包只放單款遊戲、必要資產與該平台 SDK／adapter；遊戲獨立啟動，不依賴原站大廳或其服務。Y8 的 ZIP 第一層必須為 `index.html`；其他平台依核實後的要求產生入口與格式。
- 各平台 SDK、遊戲 ID、App ID、廣告接線及產物分開，不能把 Y8 SDK 或 ID 帶進其他平台包。共用遊戲來源，平台差異只在匯出／adapter 層處理，不複製分叉整款遊戲維護。
- 各遊戲資料與相對路徑以檔案所在地為基準；明列平台、遊戲、來源 revision、成品 SHA-256 與驗收狀態。媒體和報告存放在遊戲產物目錄，但不混入可執行遊戲 ZIP。
- 新平台先核對官方規格與 SDK，再建立對應子資料夾及任務入口。保持現有下載交付檔可用，後續新產物以 `output/publishing/<platform>/<game-slug>/` 為準；舊 `output/frontier-islands-y8/` 是先前交付副本，不再當作新版來源。
- 只產生／驗證本機檔案；外部上傳、請求審核或正式發布依使用者授權範圍另行處理。
