# The Last Hair — 美術 v1

- `character-gameplay-v1.png`：2026-11-28 使用者以「好」核准的角色、場景及手機構圖原圖。原圖由內建 imagegen 產生；保留原檔，不覆寫。
- 方向：都市喜劇、深藍西裝與珊瑚領帶、三根頭髮、青綠街景、暖色天空、奶油紙色操作區。
- 實作：`../game.js` 的 Canvas 原生街景、角色與介面。頭髮、護髮手、傾斜、汗水與表情依既有遊戲狀態繪製；未製作新的逐格動畫。核准圖是方向參考，並非實際遊戲截圖。
- 素材工具：已查閱本機 sprite-gen 的 image workflow；因流程尚需供應商／存取確認，未進行生成、登入、API 呼叫或修改工具偏好。
- 變更僅限畫面；共用規則、排行榜、點數、儲存鍵與 Analytics 生命週期維持現有實作。
- 本次不替換大廳封面、排行榜縮圖或發布網站。後續封面版本需另行驗收。

原圖 prompt 摘要：The Last Hair character and gameplay concept board; middle-aged office worker protecting exactly three crown hairs on a windy 500m walk to an interview; hand-painted 2D cartoon, teal city, navy suit, coral tie, cream control overlay; character views and walk/protect/gust poses; balance slider plus hold-to-protect button.

## v2：依核准稿重製正式素材（2026-11-28）

v1 的程式幾何人物與場景被使用者指出不符合核准稿，**視覺驗收 FAIL**，不作為交付版。此後依新 skill 要求，直接以核准原圖作為 imagegen 的圖片參考重製：

- `character-states-v2.png`：忠實保留矮胖輪廓、疲憊五官、深藍西裝皺褶、紅領帶與磨損公事包；三個獨立的行走姿勢、護髮姿勢與失敗姿勢。為讓掉髮狀態正確，頭頂不畫固定髮絲，由遊戲畫三根存活頭髮。這是狀態立繪，不是逐格行走動畫。
- `city-background-v2.png`：依核准圖的咖啡店、青綠城市、暖色天空、鐵欄杆與行人道重製的空場景。
- `../art/character-v2/`：用本機 sprite-gen `slice-sheet --grid 3x1 --chroma-key none --alpha-floor 64 --scale sheet --fit contain` 拆出三張保留透明度的狀態立繪；PNG、切圖報告與 alpha 清理報告皆保留。未將此流程稱為動畫生成。
- WebP 是上述素材的部署版本；角色三張共約 224 KB，背景約 240 KB。無額外外部圖片網址。
- `qa-v1/` 保留被退回的實際截圖；`qa-v2/` 為新素材版實際 Chrome 截圖。QA 的失敗／成功畫面以測試用 hook 強制進入，不代表自然完整通關；hook 不在正式來源。
- 視覺比對：新版已使用參考圖重製的角色與背景；手機比例、HUD 中英文字與可操作區做響應式調整。動作目前是三張狀態立繪切換加位移／傾斜，尚非完整逐格走路動畫。不能宣稱原稿所有動態細節已完成。

角色 prompt：以核准原圖作為 identity reference；same stocky middle-aged office worker, tired heavy eyelids, bald crown, side tufts, orange nose, rumpled navy suit, salmon tie, worn leather briefcase, ink/gouache texture；三張同尺度狀態立繪（walk/protect/lost），頭頂無固定髮絲，透明背景。

背景 prompt：以核准原圖作為 environment reference；same hand-painted ink/gouache city, teal buildings, coral sunset, striped cafe awning, bent trees, sidewalk and iron railing；不含人物、UI、文字、固定風線，前景留空。
