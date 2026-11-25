---
name: ticatica-crazygames-publishing
description: Prepare standalone TiCATiCA Games builds, CrazyGames SDK integration plans, cover media and submission QA for CrazyGames Basic or Full Launch. Use for CrazyGames packaging and publishing preparation; do not automatically upload, request review or publish.
---

# TiCATiCA Games：CrazyGames 打包與上架準備

先讀 [跨平台共用原則](../README.md)。交付單款獨立遊戲、該平台 SDK、必要素材與驗證報告；不依賴原站大廳。準備打包不代表授權建立外部紀錄、上傳、送審或發布。

## 官方來源與核對

核對日：2026-11-23。每次實際製作／送審前重新讀取適用來源，記錄日期與差異。無法查閱時標示沿用快照、尚未重新核實；不得宣稱已確認最新要求。

- [Launch 與要求總覽](https://docs.crazygames.com/requirements/intro/)
- [技術規範](https://docs.crazygames.com/requirements/technical/)
- [遊戲體驗規範](https://docs.crazygames.com/requirements/gameplay/)
- [品質指南（Guideline）](https://docs.crazygames.com/requirements/quality/)
- [封面與影片](https://docs.crazygames.com/requirements/game-covers/)
- [SDK v3 初始化](https://docs.crazygames.com/sdk/intro/)
- [Game 模組](https://docs.crazygames.com/sdk/game/)
- [廣告規範](https://docs.crazygames.com/requirements/ads/)、[廣告 API](https://docs.crazygames.com/sdk/video-ads/)

以下「官方」指頁面已核對的條件；「內部」是 TiCATiCA 製作慣例，不將 Y8 規定推定為 CrazyGames 規定。

## 重複輸入與存放

取得 `game_name`、`game_slug`、`source_path`、`build_revision`、`launch_phase`（basic／full）、支援裝置／方向與語言；素材作業再取得 `game_url`、`asset_path`。正式網址未知可先用本機預覽，不猜網域或虛構平台 ID。Full Launch 是否獲選、廣告與帳號功能需核對實際狀態。

- 技能與來源：`docs/publishing/crazygames/`。
- 每款遊戲資料：`games/<game-slug>/crazygames-game.json`，路徑相對該資料檔解析。
- 遊戲產物：`output/publishing/crazygames/<game-slug>/`，包含 `build/`、遊戲 ZIP、`media/`、驗證報告與預覽；媒體／報告不放進遊戲 ZIP。
- 檔名內部慣例：`<slug>-crazygames-<role>-<width>x<height>-<language>-v01.<ext>`；遊戲包用 `<slug>-crazygames-v01.zip`，避免覆蓋已驗收版本。

## 官方：Basic 與 Full 不可混淆

| 階段 | SDK | 廣告／營利 | 其他接線 |
| --- | --- | --- | --- |
| Basic Launch | 可選；若接入須在真實可玩時送 Gameplay start | 停用；不能留無作用的獎勵廣告按鈕 | 無外部登入 |
| Full Launch（獲選後） | 必須，含 gameplay start/stop | 只能使用 CrazyGames SDK；擋廣告仍可玩 | 依適用情況接 Data／User 等功能 |

不要自行宣稱遊戲已獲 Full Launch。內部預設製作 CrazyGames 專用 SDK adapter，但 Basic 版本保持廣告停用。

## 官方：Build 技術要求

- 總檔案 ≤250 MB、檔案數 ≤1500；初始下載 ≤50 MB。沒有 SDK 時總大小視為初始下載（因此 ≤50 MB）。手機首頁資格需初始下載 ≤20 MB。
- SDK 版本的初始下載測量到首次真實 Gameplay start，不能提前送事件來縮小數字。ZIP 壓縮大小不等於總檔案大小或初始下載量。
- 包內檔案使用相對路徑；測 Chrome／Edge，支援手機則測觸控、安全區、方向與 App。不同刷新率的玩法應一致。
- 英文必備；依 SDK locale 選語言，無對應則英文。介面需在響應式 iframe 內可讀。
- **禁止自製遊戲內全螢幕按鈕**，由 CrazyGames 提供。Full 進入玩法應直接開始，特殊情況最多一次點擊。

上述容量以官方 MB 表示；內部自動檢查保守用 1 MB＝1,000,000 bytes。ZIP 格式、ZIP 容量上限及根層入口的精確上傳限制仍以本次 Portal 為準，不把 Y8 截圖當官方佐證。

## 獨立打包流程（內部約定）

1. 盤點本遊戲的程式、DOM、CSS、翻譯、音訊、圖集、存檔及網路相依。由來源組合獨立版，保留核心玩法與既有存檔格式，不改主站產出的 `index.html`。
2. 移除匯出版的大廳、原站路由、共用錢包／會員／排行榜／GA4 接線與其他遊戲；必要 helper 放進包內。移除 Y8 CDN、初始化、廣告 helpers 及其 ID，不能只改 ZIP 檔名。
3. 讀取 [SDK 整合與驗收](references/sdk.md)，以 CrazyGames adapter 串起真實遊戲生命週期。從匯出層移除全螢幕按鈕與原生 requestFullscreen／自動全螢幕流程；一般響應式容器仍需保留，不能因移除按鈕就讓手機版面失效。
4. 輸出至 `build/`。**TiCATiCA 統一讓 ZIP 第一層直接放 `index.html`**，直接進入本遊戲；不包入 `build/` 或遊戲名外層。這是內部交付約定，本次未從 Portal 驗證為官方硬性格式。
5. 只以必要檔案白名單壓縮。遊戲圖片／音效／翻譯在包內；SDK 可依官方 CDN 載入。維護文件、測試、封面、影片、報告、截圖與 `.git` 留在 ZIP 外。
6. 將成品解壓到新目錄，以 HTTP 開啟根層入口，查缺檔與原站連線。測開始、移動、主要機制、結束／續玩、存檔／重載、語言、失焦靜音及手機版面；另測 SDK 不可用仍能玩。
7. 記錄來源 revision、ZIP SHA-256、實際 byte／檔案數、初始下載量與驗收結果，交付 ZIP 及預覽。SDK 平台行為需在 Portal QA Tool／預覽再驗，不能沿用 Y8 的測試結論。

目前未有 CrazyGames 遊戲打包器；`tools/package_frontier_y8.py` 會嵌入 Y8 SDK，不可拿來產生 CrazyGames 成品。

## 官方：封面與預覽影片

來源：[Game covers](https://docs.crazygames.com/requirements/game-covers/)。

| 媒體 | 必備數量 | 尺寸／比例 | 容量／時長 |
| --- | --- | --- | --- |
| 橫式封面 | 1 | 1920×1080，16:9 | 本頁未列圖片容量／格式上限 |
| 直式封面 | 1 | 800×1200，2:3 | 同上 |
| 方形封面 | 1 | 800×800，1:1 | 同上 |
| 橫式影片 | 1 | 1080p，16:9 | 每支 ≤50 MB，15–20 秒；超長截至20秒 |
| 直式影片 | 1 | 1080p，2:3 | 同上；頁面未明列精確寬高 |

封面三版視覺一致；不加邊框、商店／圖示、未授權或模糊影像，文字限遊戲標題。影片無聲、不快轉；以封面開場，避免黑畫面／logo轉場、黑邊、預設游標、促銷與社群圖示。允許能代表玩法且不誤導的動畫影片。不可搬用 Y8「第一幀必須為連續實機」規則到此平台。

官方建議封面作藝術構圖、不要只用截圖，並建議放標題。內部採 JPG／PNG 與 MP4／H.264 作初稿、影片移除音訊軌且預留容量餘裕；這些格式／codec 是內部建議，Portal 接受格式須再確認。不要把 Y8 的 9:16 宣傳圖拿來充當本平台 2:3。

**待確認**：直式影片僅給「1080p、2:3」而無像素對；製作前以 Portal／官方確認具體輸出尺寸，不把自行推算值寫成已驗證要求。未見獨立截圖張數硬性規格，不沿用 Y8 五欄截圖／宣傳圖要求。

## 自動檢查清單

執行工具依環境選擇；本技能尚未附完整自動驗證器，不要宣稱此清單已自動執行。可用 Python `zipfile` 讀成品、Pillow 解碼圖片、ffprobe 查影片；對實際檔案檢查並輸出 JSON 報告：

- [ ] ZIP 完整性、根層唯一且非空 `index.html`、無越界／絕對路徑；列出解壓後檔案總數及 bytes，依階段／SDK 狀態採正確門檻。
- [ ] 所有本機素材路徑可讀，JS 可解析，JSON 不是當 JS 檢查；掃描 Y8 CDN／ID、原站 API／連結等跨平台殘留，再人工判讀結果。
- [ ] 三封面數量與精確尺寸、解碼完整性；兩影片比例／解析度、15–20秒、≤50 MB、無音訊軌。直式精確像素尚未確認時列 NOT CHECKED，不能猜測通過。
- [ ] 以瀏覽器 Network／平台工具測首次 gameplayStart 前下載量；靜態加總不能證明真實初始下載量。
- [ ] 記錄 SHA-256 與結果；無工具或無素材明列未檢查。自動掃描不能證明玩法、權利或平台核准。

## 品質指南與體驗檢查

準備打包或送審時，讀取 [品質檢查與紀錄方式](references/quality.md)，涵蓋引導、核心循環、辨識度、視聽一致性與鍵盤相容。官方 Quality guidelines 是建議，不取代強制規範。以實際試玩記錄問題與證據，不因新增文件就宣稱遊戲已符合，也不擅自修改玩法。品質報告留在遊戲 ZIP 外。

## 送審 QA

製作新版、更新上傳包或執行送審 QA 時，讀取 [版本更新與遊戲 QA](references/update-qa.md)。對最終 ZIP 執行適用檢查，將未完成項目保留為未驗證；不能只驗來源頁或沿用舊版結果。

以 PASS／FAIL／NOT TESTED／BLOCKED／NOT APPLICABLE 記錄日期、版本、證據與待辦。最低範圍：

- 獨立可玩與存檔、英文及動態翻譯、DPR 1、桌面 iframe／手機、安全區與方向、音效中斷恢復；無自製全螢幕、無跨平台宣傳，內容適合 PEGI 12。
- 桌面代表 viewport 可選官方列舉的 821×462、907×510、1216×684、1280×720；另選 390px 直式為內部手機檢查。需按宣告裝置完整測試，不把少數尺寸當全部支援已通過。
- Basic：無營利、無第三方登入、廣告停用不會卡住。Full：真實玩法事件、平台音訊設定、適用的帳號／進度接線、廣告完成／失敗與擋廣告均正常。
- 版權、封面／影片規格與真實內容、英文介紹和操作說明；以 Portal 實際欄位為準，不代填未知 ID 或獨家條款。
- 交付需區分「文件已整理」「遊戲包已建立」「本機已驗」「平台已驗」「已送審／已發布」。使用者僅要求整理文件時，不修改遊戲或啟用營利。

## Frontier Islands 範例

[專用資料檔](games/frontier-islands/crazygames-game.json) 為準備用資料，還沒有 CrazyGames 成品／平台驗收。沿用遊戲來源，不沿用 Y8 憑證。將來製作時，特別檢查本作自製全螢幕按鈕、自動進入全螢幕、原站排行榜，以及 CrazyGames gameplay 事件；保留遊戲內金幣、存檔、音效與語言功能。
