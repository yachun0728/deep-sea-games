# 小灰出門：毛氈美術與驗收紀錄

## 核准基準

- `approved-felt-v1.png`：使用者核准的第②版毛氈定格動畫設定集。保留灰色圓身、黃眼、單天線、補丁與棕色斜背包，角色與場景皆依此製作。
- `side-view-composition-v2.png`：使用者指出原遊戲是橫向散步後，提出的側視構圖修正；後續使用者指示「繼續完成」。直式手機承載側視橫向捲動，角色在左、事件由右側進場。
- 原圖保留不覆寫。`*-source-v1.png` 是第一輪衍生素材；其中往深處延伸的場景底圖未用於最終遊玩版。`*-side-source-v2.png` 是實際採用的三地形側視背景。

## 正式素材

`../art/felt-v1/` 僅保存執行時 WebP：三地形背景、角色身體／表情／大腿／小腿與腳、12 事件道具、物資與毛氈 UI。透明素材使用原生 alpha；使用本機 sprite-gen 的 `slice-sheet --chroma-key none --alpha-floor 64 --fit contain` 拆分物件，原始切割 PNG 與報告保存於 `extraction-v1/`。未執行 sprite-gen 生成服務、未切換 API 付費供應商。

步行使用毛氈部件雙骨架動畫：左右髖反相擺動、回收腿膝部彎曲、身體微幅晃動。這是程式骨架，不是聲稱工具生成逐格動畫。實際瀏覽器錄影影格位於 `qa-v1/motion-*.png`；逐格對照與 GIF 是從實際畫面取得。

三地形背景以水平切片分成遠景、水平步道與前景，分別以 0.18／1／1.25 倍捲動，不使用往遠處延伸的小路。所有圖片只在進入本遊戲後載入，必需素材未就緒前不開局；失敗時畫布可重試。原始採用圖與 QA 不加入靜態發布清單（`.assetsignore`）。

`cover-source-v1.png` 是未採用的彎路封面，`cover-side-source-v2.png` 才是水平步道封面原稿；`../cover.webp` 為 1056×1000、滿版英文 Pet Walkies 的驗收版本，待使用者試玩確認後才可發布。

## 生成方式及提示詞組

全部美術使用內建 image_gen，並傳入核准圖作參考；沒有使用 CLI/API 生成。每批生成提示詞的製作要求如下：

1. 角色部件：EXACT approved wool-felt identity; 3×2 transparent sheet; neutral/happy/surprised legless body, detached upper leg, detached lower leg and foot, complete portrait. Gray round robot, amber eyes, one antenna, beige patch, brown X-button satchel, fine fibers and cream seams.
2. UI：3×2 transparent sheet; blank stitched linen panel, mustard felt button, cream button, sage inventory tile, blank cloth-bound scrapbook, blank route banner. No baked words so game remains bilingual.
3. 事件物件：4×3 transparent sheet; discovery wheel, chest, locker, dog, scarecrow, river shark, floating crate, fisher, cave, pebbles, lamp, rain/rainbow. The first rainbow extraction was rejected and replaced with the complete rainbow from the items sheet.
4. 物資：4×3 transparent sheet; food tin, wood, stone, scrap, cloth, fish, rope, battery, ore, AI circuit patch, complete cloud/rainbow, daisies. Same tactile handmade wool as reference.
5. 三地形側視場景：LANDSCAPE 3:2; no characters/UI/text. Exact approved wool materials, cotton clouds, cardboard mountains, sage hills, cottage; level horizontal tan felt trail at y63–71%, foreground meadow below. Plains／river behind the path／rocky mountains. No winding or receding path. Stable left/right ground height for tiling.
6. 封面：1056:1000 full bleed, one large approved felt robot, tiny chunky feet, cottage and river, large stitched “PET WALKIES” in lower third, clear top-left badge zone, no added labels or frame.

## 契約及差異

- 不變更 60 步／地形事件／轉盤／物資／單次 BONUS／存檔格式／GA4 回合契約。
- 依目前 config 免費入場，舊規則文寫 10 點已修正；不是本次改動經濟。
- 介面保留可切換的真實文字，不把英文字烘焙進遊戲圖片；角色動作為骨架方式，非錄製的定格動畫影片。
- 實際功能、畫面比對、模擬視窗與實機驗證分別記錄於 `QA.md`；不得將桌面 Chrome 模擬當成手機實機或 CrazyGames 審核結果。

## 最終日記與事件排版（v4）

使用者指出縫線／扣環重疊後，日記改成上方相片冊、下方寬布頁完整內文；相片依左頁有效範圍水平／垂直置中，內文依實際行數在書冊與統計間置中。`diary-aligned-v4-*.png` 使用新檔名交付，避免與舊測試截圖混淆。大布頁採九宮格切片並重複織紋／縫線，保留角落裝飾大小；不再把整張小面板拉成長條。事件卡內容與角落叉線分離，選項放在下方操作區。

## 發布保存範圍

本次版本保存核准原稿、採納角色／道具／介面與水平場景的原始生成圖、抽取證據、實際步行影格及精簡驗收畫面。未採用的彎路場景與舊封面嘗試留在原工作區，不包含在發布提交。所有 design 檔案均由 `.assetsignore` 排除靜態部署。
