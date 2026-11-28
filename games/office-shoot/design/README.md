# 拒絕加班：核准美漫設計 02

## 核准與後續指示（2026-11-28）

- 使用者核准 `approved-v2/art-direction-02.png`，要求角色、完整辦公室背景與上下介面照稿套用。
- 使用者再次指定上方分格、黃色箭頭、主管頭像與紅血條不得重新設計。正式畫面直接取用核准圖的原始圖塊（`frame.webp`），不是重新畫矩形模仿。
- 最後指示：底部可以中文，字體要調整，且中間文字維持一行。使用者最後澄清筆與左右黃箭頭也要保留。最終採原稿筆圖示、雙箭頭、黑底、黃色單行「拖曳移動・自動開火」與原稿筆刷邊框；英文直接保留原圖文字。最後以使用者 22:41 截圖 `approved-v2/footer-user-reference.png` 作為筆與箭頭的像素來源，保留原有比例與間距，不用重新生成或重畫的替代品。

## 原稿與素材

| 檔案 | 用途 |
| --- | --- |
| `approved-v2/art-direction-02.png` | 核准角色、場景、HUD 與直式構圖原檔，保留不覆寫 |
| `approved-v2/office-background-source.png` | 用核准原圖作參考取得的完整辦公室背景；正式繪製裁去新增的天花板，對齊原稿百葉窗與時鐘高度 |
| `approved-v2/actors-source.png` | 用核准圖作參考製作的原生透明角色／道具來源 |
| `walk-v2/raw/walk.png` | 六格背面側移動作來源；左右腳交替、彎膝 |
| `walk-v2/manifest.json` | sprite-gen 抽取及組合的動作座標與幀率 |
| `walk-v2/previews/walk.gif` | 已輸出的循環動作預覽 |
| `approved-v2/cover-source.png` | 同畫風封面原檔；正式封面 1056×1000，294184 bytes |
| `extracted-v2/` | sprite-gen 保留的透明 PNG、alpha 與切圖報告 |
| `../art/comic-v2/` | 實際載入的 WebP、在地字型與授權 |
| `qa-v2/` | 實際 Chromium 截圖、驗收報告與並排比對 |

生成使用內建 imagegen 並附上核准圖作參考；未使用外部收費 API。sprite-gen 僅用於既有素材的透明切圖、動作抽取、組合、檢查及縮圖輸出，沒有呼叫其生成供應商。

## 畫面與玩法邊界

- 遊戲模擬保持原本 450×800；時間、速度、難度、武器數值、碰撞、關卡、獎勵、存檔 Key、追蹤契約均維持。
- 繪圖投影預留後方辦公室牆面，並還原較窄的補給道；觸控與滑鼠以反投影對應，跨道拖曳保持手指相對位移。
- 首次開啟本遊戲才載入素材；載入完成前禁止開局，有獨立載入／失敗畫面。
- 上方按鈕為原圖上方的透明可點區；暫停時可切換音效，M 快捷鍵維持。遊玩中不增加遮住原稿的音效方框。
- 中文字型採 Noto Sans TC Black 900 精簡子集，英文採 Bangers；僅本機載入，附 OFL 授權。來源：[Noto Sans TC](https://github.com/google/fonts/tree/main/ofl/notosanstc)、[Bangers](https://github.com/google/fonts/tree/main/ofl/bangers)。

這是本站本機驗收版；未提交、推送、正式部署或送 CrazyGames 審核。
