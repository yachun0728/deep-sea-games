---
name: ticatica-y8-publishing
description: Package standalone TiCATiCA Games builds with the Y8 SDK, validate media packages and prepare submission QA for Y8 game publishing or media updates. Use for Y8 game ZIP exports, screenshots, promotional artwork, gameplay recordings, and review preparation; do not automatically upload, request review, or publish.
---

# TiCATiCA Games：Y8 上架素材與送審準備

先讀 [跨平台目錄與共用原則](../README.md)。本技能預設交付獨立遊戲 ZIP、本機素材包、驗證報告與待辦。不得因「準備上架」自行建立 Y8 紀錄、上傳、按 Request Review 或發布；這些外部操作須有使用者另外明確授權。不要宣稱通過檢查即保證 Y8 核准。

## 來源與更新

最後核對：2026-11-23。

- [Y8 Media Guidelines](https://docs.y8.com/studio/media/)：以下媒體規格與內容限制。
- [Y8 Game Requirements](https://docs.y8.com/studio/game-requirements/)：遊戲送審 QA。
- [Y8 Create Game](https://docs.y8.com/studio/create-game/)：工作室、Game ID 與 App ID。

每次實際製作／送審前重新讀取官方頁面，記錄核對日期和變更。無法讀取時，標示「沿用快照，未重新核實」，不可當作現行規格已確認。若入口網站與文件不一致，記錄差異並以實際驗證錯誤作待查項目，勿自行推定已獲豁免。規格變更時同步下表、驗證工具與報告。

## 可重複輸入

素材驗證必要：`game_name`（正式遊戲名）、`game_url`（可玩的版本網址）、`asset_path`（本機素材根目錄）。純本機打包可先以已知來源與本機預覽進行，不因尚無正式網址而阻塞；仍須取得本遊戲的 SDK ID。

其餘依需求取得：`game_slug`、`build_revision`、`language`、`supported_devices`、`supported_orientation`、`source_asset_path`、`output_path`、`mode`（new-game／media-update）、現有已核准欄位與檔案清單。預設品牌為 TiCATiCA Games；不可自行填入其他工作室或虛構 Y8 ID。記錄素材對應的遊戲版本，避免拍到舊版。

輸入不足時先盤點可讀的專案資料；只有會影響擷取或驗收的缺項才詢問。網址僅供開啟遊戲與報告引用，不要疊加在媒體上。

## 已核實的官方媒體要求

圖片只接受 JPG／PNG，像素須完全相符。每欄至少 1 張；更新可計入現有 live 素材。

| 欄位／manifest key | 像素 | 比例 | 每檔上限 | 數量 |
| --- | --- | --- | --- | --- |
| Standard Screenshot / `standard` | 760×570 | 4:3 | 2 MB | 1–6 |
| Widescreen Screenshot / `widescreen` | 1280×720 | 16:9 | 5 MB | 1–6 |
| Landscape Promo / `landscape_promo` | 1920×1080 | 16:9 | 5 MB | 1–3 |
| Portrait Promo / `portrait_promo` | 1080×1920 | 9:16 | 5 MB | 1–3 |
| Game Card Promo / `card_promo` | 760×570 | 4:3 | 2 MB | 1–3 |

| 影片／manifest key | 像素與比例 | 長度 | 格式 | 每檔上限／數量 |
| --- | --- | --- | --- | --- |
| Gameplay / `gameplay` | 16:9，至少 1280×720 | ≥15 秒 | MP4／MOV | 50 MB；必備 1 支 |
| 自備 4:3 / `gameplay_4_3` | 精確 960×720 | ≥15 秒 | MP4／MOV | 50 MB；選配 1 支 |

Y8 取開頭最多 20 秒生成預覽，4:3 預設取中央裁切；可用自備 4:3 取代。影片處理完成後才能請求審核。

### 官方內容限制（摘要，細節見來源）

所有素材限本遊戲內容。禁止廣告、網址、社群帳號、商店徽章及他遊戲素材。

- **截圖**：真實遊玩；避免選單／載入頁、大片空白與誤導修圖。
- **宣傳圖**：用本作角色／場景／資產表現實際玩法，可含遊戲標題；不可只放 logo、塞大量文字、促銷或虛構功能。
- **影片**：從第一秒開始連續實機遊玩；避免預告片、拼接、片頭 logo、選單、黑邊及誤導內容。

### TiCATiCA 建議（不是 Y8 硬性規定）

- 各截圖欄準備 3 個不同情境，各宣傳欄至少 1 張；不必湊滿上限。
- 影片建議 20 秒，MP4／H.264、yuv420p、30 fps；官方未在媒體頁限定 codec、fps、音訊或 bitrate。
- 主角／關鍵動作放中央，宣傳圖主體與標題保留約 8–10% 邊距；此百分比是內部建議。
- 檔案預留約 10% 容量餘裕。官方頁未界定 MB 的位元組基數，工具保守採十進位：1 MB = 1,000,000 bytes。
- 直接以目標 viewport 擷取，保留真實 HUD，不拉伸、不加假 HUD；不同比例應重新構圖／擷取，勿為填滿尺寸製造虛假畫面。影片可裁掉錄製前後等待，但保留連續玩法；不得剪接多段。
- 若使用生成工具製作宣傳圖，只能以本作已核准資產為基礎，逐項對照實機；生成圖不可冒充截圖或實機影片。

## 獨立遊戲打包流程（使用者指定，2026-11-23）

每次 Y8 打包只包含該遊戲實際需要的程式、樣式、圖片／音效、翻譯及 Y8 SDK 整合；ZIP 第一層直接放 `index.html`，開啟就進入本遊戲。不依賴原本大廳、原站路由、平台錢包、會員、GA4、其他遊戲或原站排行榜／API。這是 TiCATiCA 的發布約定，不是把所有條目都視為 Y8 官方規定。

1. **定位來源與相依**：讀取本遊戲維護文件，盤點 DOM、共用 helper、include、翻譯、素材、儲存與網路呼叫。以目前來源產生專用輸出，不直接改主站產出的 `index.html`，不整包複製原站。
2. **解除大廳依賴**：組合單款遊戲來源並補齊必要 helper／初始化。根層入口直接啟動目標 view，不靠 `#frontier` 等原站 hash。移除原站排行榜、會員、錢包與外連入口；只清除匯出包內的接線，保留核心玩法、進度、音效與語言切換，不改主站行為。平台專屬追蹤可在匯出層使用不連網的 adapter，但不能把不可用功能只藏起來仍留著必需的 API 呼叫。
3. **整合 Y8 SDK**：以該遊戲資料檔的 App ID／Game ID 套入。保留 async ready 事件與補發事件防競態、單次初始化及登入失敗仍可玩。廣告 helpers 接到實際暫停／音訊控制；未確認的獎勵設計不可自行新增。只有 Y8 平台服務可依其設定需要網路；SDK 不可用時核心本機遊戲仍可開始。不要宣稱遊戲可完全離線使用 Y8 登入／廣告。
4. **檔案白名單打包**：將必要檔案輸出至 `output/publishing/y8/<game-slug>/build/`；ZIP 僅收錄明確選定的遊戲檔案。`build/` 是本機整理層，不放進 ZIP 路徑前綴。SDK 可依官方方式用 CDN script 載入；SDK 設定／橋接程式必須已包含在遊戲包，不能依賴原站供應。美術設定板、維護文件、技能包、媒體送審圖／影片、驗證報告、截圖與測試工具留在 ZIP 外。
5. **驗證交付物**：檢查 ZIP 根層唯一且非空的 `index.html`、完整性與所有本機素材路徑。解壓到新目錄，以 HTTP 從根層進入，確認不需原站就能開始、移動、採集／建造、暫停／續玩、存檔／重載與切換語言；測試桌面與 390px 手機 viewport、全螢幕與失焦靜音。模擬 SDK 未載入／失敗仍可玩；Y8 登入與廣告另在平台預覽驗收，不把本機測試當平台通過。
6. **記錄與交付**：遊戲資料檔更新 ZIP 相對路徑、來源 revision、SHA-256、SDK 設定與實際驗收結果。提供 ZIP 下載與直達預覽；準備、上傳、送審、發布分開記錄，本流程不自動執行後三者。

### Frontier Islands 的已實作範例

從專案根目錄執行：

```bash
python3 tools/package_frontier_y8.py
```

目前打包器在 [`tools/package_frontier_y8.py`](../../../tools/package_frontier_y8.py)，SDK adapter 在 [`tools/y8_frontier_sdk.js`](../../../tools/y8_frontier_sdk.js)。這是 Frontier 專用程式，不是其他遊戲的通用打包器；新增遊戲時要重新盤點相依，不盲目套用字串替換。

輸出 `output/publishing/y8/frontier-islands/frontier-islands-y8.zip`。本次遊戲 ZIP 包含根層 `index.html` 和三張執行所需圖集；Y8 SDK 以官方 CDN 載入，初始化與廣告 helpers 內嵌於入口。保留本機遠征／存檔、音效與三語顯示，不連原站排行榜；廣告 helper 尚未接入新的獎勵玩法。先前本機檢查已確認可開始、暫停／續玩及 390px 無水平溢出；SDK 登入曾回報狀態不匹配，真實廣告與 Y8 平台驗收仍未完成。每次重新產生版本需重測，不沿用舊版結果冒充新版驗收。

## Build 上傳要求

來源：使用者於 2026-11-23 提供的 Y8「Upload New Build」[介面截圖](references/upload-build-2026-11-23.png)，屬入口網站證據；不是媒體頁規格。

- **介面確認**：以 ZIP 上傳，ZIP 根目錄必須直接包含小寫 `index.html`。`frontier-islands/index.html` 多包一層不符合要求。
- **介面確認**：遊戲必須支援響應式畫面才能獲准。官方 [Game Requirements](https://docs.y8.com/studio/game-requirements/) 另要求支援尺寸下 UI 不重疊／裁切、手機支援方向正確及遊玩不引發意外捲動。
- **尚未確認**：此截圖未提供 ZIP 容量上限或解壓後容量限制，不可套用圖片／影片的 MB 上限或自行填入數值。

正確 ZIP 內容範例：

```text
index.html
assets/
  game.js
  game.css
```

TiCATiCA 打包與驗收清單（內部流程）：

- [ ] 從本次核准版本建立獨立遊戲包；確認入口直接進入目標遊戲。原站 `/#frontier` 路由不代表解壓後 `/index.html` 已正確啟動該遊戲。
- [ ] 檢查 ZIP 檔案清單中有且僅有一個根層 `index.html`，可讀且不是空檔；ZIP 完整性檢查通過。
- [ ] 確認相依 JS、CSS、圖片、音訊皆包含，大小寫／相對路徑正確；不打包 `.git`、開發憑證或無關檔案。
- [ ] 將 ZIP 解壓至新目錄，以本機 HTTP 伺服器開啟根層入口，檢查缺檔、載入、開始遊玩與 SDK；不能只測原開發目錄。
- [ ] 測試支援的桌面／手機尺寸、嵌入容器大小變更、支援方向與全螢幕進出；關鍵 HUD／按鈕可見且能操作，無非預期捲動。測試尺寸是內部選擇，不是本截圖指定的官方像素規格。
- [ ] 記錄 ZIP 路徑、build revision、測試裝置及結果；尚未做過的項目填 NOT CHECKED。

現有 `scripts/validate_media.py` **僅驗證媒體**，不檢查 build ZIP 或響應式行為。技能資料夾的 ZIP 是技能下載包，不能當作遊戲 build 上傳。準備打包不代表已授權上傳、送審或發布。

## 工作流程

1. **盤點**：核對上述輸入、來源與現行規格，保留原始素材。確認內容與音樂授權；不改玩法、儲存或正式網站。
2. **拍攝清單**：從實際版本選出核心玩法、次要機制、不同環境／挑戰。先玩到可辨識的情境，再擷取；不要把概念設定圖當實機。
3. **輸出**：截圖與宣傳圖分開製作，按精確尺寸輸出。錄一段從首幀就有玩法的影片，檢查中央 4:3 是否仍能理解；必要時另做連續 4:3 影片。
4. **自動檢查**：建立 manifest，執行下方工具；保留 JSON 報告。失敗就修檔再查；缺工具標為未驗證，不得跳過後說通過。
5. **人工檢查**：逐張縮小查看、完整播放影片，確認實機一致性、版權、語言與裁切。填寫送審 QA，列出未完成項目。
6. **交付**：素材、manifest、報告、QA 結果與來源日期。預設停在「待使用者確認」，不執行外部操作。
7. **僅另獲送審授權後**：核對工作室／遊戲／build，於 Media 上傳，等影片處理後實看兩種預覽，再核對授權是否涵蓋 Request Review。媒體更新選 Keep the current live build；新 build 僅在本次授權內送審。記錄實際狀態，不把已上傳寫成已核准。

官方更新注意：每欄檔案核准後須等 7 天才可再上傳該欄，刪檔不解鎖。退件依理由替換；不要先刪掉必要的最後素材。上線後媒體審核與遊戲 build 更新是不同操作。

## 命名與目錄（TiCATiCA 慣例）

ASCII 小寫、連字號，版本不覆蓋舊檔：

```text
<asset_path>/
  originals/                         # 原始錄影／擷取；不列入提交清單
  deliverables/
    <slug>-y8-standard-gather-01-760x570-en-v01.jpg
    <slug>-y8-widescreen-build-01-1280x720-en-v01.jpg
    <slug>-y8-landscape-promo-keyart-01-1920x1080-en-v01.png
    <slug>-y8-portrait-promo-keyart-01-1080x1920-en-v01.png
    <slug>-y8-card-promo-keyart-01-760x570-en-v01.jpg
    <slug>-y8-gameplay-core-01-1280x720-en-v01.mp4
  manifest.json
  validation.json
  submission-qa.md
```

此格式不屬官方上傳規定。同一張 760×570 宣傳圖不能因尺寸相同就視為真實遊玩截圖。

## 自動驗證清單與用法

本目錄附 `scripts/validate_media.py`；僅下載本檔時，可按下列清單自行實作同等檢查。依賴 Python 3、Pillow、影片需 ffprobe（FFmpeg）。依環境既有方式安裝工具，不自行變更全域環境。

```bash
python3 docs/publishing/y8/scripts/validate_media.py /path/to/manifest.json > /path/to/validation.json
```

manifest 的 `asset_path` 可為絕對路徑或相對 manifest 的路徑；素材檔名相對該根目錄。`media` 中每個 key 對應上表欄位，值為檔名陣列。參考 [Frontier Islands manifest](examples/frontier-islands.manifest.json)，將網址、版本和素材檔名替換後才執行。範例是規劃資料，不代表素材已備妥或通過驗收。

自動檢查：

- [ ] 必要輸入、可讀檔案、根目錄內路徑；拒絕未知欄位與重複清單。
- [ ] 五種圖片欄位與必備影片的最少／最多數量。
- [ ] 副檔名及實際圖片解碼格式、完整性、精確像素、bytes。
- [ ] ffprobe 的實際容器、影片串流、像素、顯示比例與長度；拒絕旋轉／非方形像素，先正規化再檢查。
- [ ] 報告明列錯誤與人工待查項；非零結束碼代表未通過。

工具不會辨識真假玩法、廣告、版權、剪接、內容語言或 Y8 審核結果。更新模式請把仍有效的 live 素材之本機副本也納入清單；沒有副本時明列欄位存在的證據與「完整自動檢查未完成」，不可把新檔子集合冒充完整包。

## 送審 QA

以 PASS／FAIL／NOT CHECKED 加證據、測試版本與日期記錄，不預勾通過。

**媒體人工驗收**：五欄完整；每張看得清楚；截圖確屬本版；無禁用促銷內容；宣傳圖無虛構功能；影片連續、首秒有玩法；完整播放無損壞；4:3／16:9 均保留關鍵動作；Portal 轉碼後重新看過；語言／遊戲名一致；有必要權利。TiCATiCA 品牌資訊放報告，不要變成片頭或廣告覆蓋層。

**遊戲要求驗收**（依官方 Game Requirements，不能只查媒體）：遊戲完整可玩、載入與效能正常；支援裝置操作、UI、方向與捲動正常；有進度則可保存；移除 debug；失焦／隱藏與廣告期間暫停並靜音，恢復尊重音訊設定；訪客可玩；帳號功能按需整合 Y8 登入；多人處理斷線；權利與 AI Declaration 正確；無遊戲內外連／第三方廣告／強制付費下載；擋廣告仍能玩。英文 fallback 與可略過長教學是官方建議，非媒體必填項。SDK 行為需按適用官方文件另驗，不可因本包合格就宣稱整合完成。

**外部操作前**：確認 TiCATiCA Games 工作室、正式名稱、Game ID／App ID、目標 build 與授權範圍；新紀錄需在 SDK 初始化前取得 ID。資料不足時停在本機交付。

## SDK 與每款遊戲資料

本專案每款遊戲的 Y8 資料放在 `docs/publishing/y8/games/<game-slug>/y8-game.json`；目前為 [Frontier Islands 資料檔](games/frontier-islands/y8-game.json)。其中 `asset_path` 相對資料檔所在目錄解析；`media` 清單仍相對素材根目錄。資料檔可直接供本工具驗證，缺網址或素材時應回報未通過。

使用者提供 SDK 或需要準備整合時，讀取 [SDK 設定與驗收](references/sdk.md)。將 `game_id`、`app_id`、`ads_enabled`、來源與確認狀態保存在該遊戲的資料檔，不寫成所有遊戲的固定設定。SDK 準備不表示已授權改遊戲或啟用廣告。

## Frontier Islands 範例（可替換）

- `game_name`: Frontier Islands；`game_slug`: frontier-islands。
- 專案遊戲入口為 `#frontier`；`game_url` 請填本次驗收的實際完整網址，不猜正式網域。
- 候選截圖：採集、建造、戰鬥；每項先在該版本確認確實存在。不要用美術設定板替代 Canvas 實機畫面，也不要宣傳尚未實作功能。
- `asset_path` 建議為獨立的 `output/publishing/y8/frontier-islands`，不直接改遊戲原始碼。
- 舊素材若只有 1280×720 宣傳圖，仍缺官方 1920×1080 橫式宣傳尺寸；1080×1920 的圖先確認內容用途，不能自動歸類為截圖。
