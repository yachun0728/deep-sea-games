# CrazyGames Platform Compliance

本文件規範 Deep Sea Arcade 遊戲在 CrazyGames 平台開發、測試、上架及發布時，必須遵守的要求。

Agent 執行相關任務時，應依據 CrazyGames 官方最新文件確認規則；若官方政策與本文件不同，以官方最新政策為準。

---

## 1. Launch Stage

發布前必須確認預計使用的發布階段。

### Basic Launch

- 確認遊戲符合 CrazyGames Basic Launch 的技術、品質及內容要求。
- Basic Launch 階段不應擅自加入尚未核准或不符合該階段要求的 SDK、廣告或 Monetization 功能。
- 確認遊戲可以正常執行、操作及遊玩。
- 確認沒有未完成的功能、明顯錯誤或影響遊戲體驗的問題。

### Full Launch

若目標為 Full Launch，必須依 CrazyGames 最新規範確認並實作必要項目：

- CrazyGames SDK 整合
- GameplayStart 事件
- Audio / Mute 控制
- SDK 廣告整合
- AdBlock 相容性
- 使用者帳號整合（若適用）
- Multiplayer（若遊戲有使用）
- In-App Purchases（僅限符合平台資格及核准條件的遊戲）
- 其他官方要求的功能及整合

不得將 Basic Launch 的完成狀態視為 Full Launch 合規。

---

## 2. Technical Requirements

發布前必須檢查：

- 初始下載大小符合平台限制（目前參考限制為 50 MB）。
- 遊戲完整下載大小符合平台限制（目前參考限制為 250 MB）。
- 檔案數量符合平台限制（目前參考限制為 1,500 files）。
- 遊戲可以在 CrazyGames 支援的瀏覽器及環境正常執行。
- 遊戲載入流程正常。
- 不得有重大 JavaScript Error。
- 不得有無法正常載入的必要資源。
- 避免不必要的外部依賴。
- 遊戲必須能正常重新載入及開始遊玩。
- 確認平台要求的 SDK、事件及整合正常運作。

以上限制可能因平台政策更新而變更，發布前必須確認官方最新要求。

---

## 3. Gameplay & Quality Requirements

遊戲必須具備：

- 清楚的遊戲目標。
- 玩家能理解的基本操作。
- 正常運作的核心玩法。
- 合理的新手引導。
- 適當的難度與進度。
- 完整的遊戲體驗。
- 清楚的勝利、失敗或結束狀態（依遊戲設計）。
- 正常運作的 UI。
- 合理的音效及音樂控制。
- 不得存在阻礙玩家正常遊玩的重大 Bug。
- 不得以未完成的 Prototype 作為正式發布版本。

---

## 4. Content Policy

發布內容必須符合 CrazyGames 平台適用的內容政策。

- 必須符合平台適用的內容規範及 PEGI 12 要求。
- 不得包含違反平台政策的內容。
- 若涉及暴力、恐怖、賭博、性內容、歧視、政治或其他可能涉及分級疑慮的內容，發布前必須確認官方要求並進行人工審查。
- 不得擅自使用未授權的圖片、音樂、字型、素材或其他第三方資產。
- 必須確認遊戲素材及內容具有適當使用權。

---

## 5. Advertising & Monetization

- 廣告必須使用 CrazyGames 官方允許的整合方式。
- 不得擅自加入未經允許的第三方廣告。
- 不得讓廣告破壞正常遊戲流程。
- 廣告播放前後應正確處理遊戲狀態。
- 必須確認廣告播放時遊戲音訊、暫停及恢復機制正常。
- 不得假造廣告播放成功或 SDK callback。
- 不得透過不符合平台政策的方式規避廣告限制。
- 若遊戲使用 Monetization，必須符合目標 Launch Stage 的規定。

---

## 6. SDK & Integration

若使用 CrazyGames SDK：

- 必須依官方文件正確安裝及初始化。
- 必須處理 SDK 尚未初始化完成的狀態。
- 不得讓 SDK 初始化失敗導致遊戲無法遊玩。
- 必須正確使用平台要求的 GameplayStart 事件。
- 必須正確處理遊戲暫停及恢復。
- 必須正確處理 Audio / Mute 狀態。
- 必須測試 SDK 在正常及異常情況下的行為。
- 不得使用假 SDK 或模擬結果宣稱正式整合已通過。

---

## 7. User Data, Accounts & Privacy

- 不得未經允許收集不必要的玩家個人資料。
- 必須遵守平台及適用的隱私政策。
- 若使用帳號、存檔、排行榜或玩家資料，必須確認資料處理方式。
- 不得暴露 API Key、Secret、Token 或其他機密資訊。
- 不得將機密資訊直接寫入公開前端程式碼。
- 必須確認玩家資料不會因版本更新而意外遺失。
- 若涉及 Analytics，必須遵守平台規範及適用的隱私要求。

---

## 8. Multiplayer & IAP

### Multiplayer

若遊戲有多人連線功能：

- 必須確認多人連線功能正常。
- 必須確認連線失敗、斷線及重新連線的處理方式。
- 必須遵守 CrazyGames 對 Multiplayer 的相關要求。
- 不得以單機模擬結果宣稱多人功能已驗證。

若遊戲不包含 Multiplayer，標示為 NOT APPLICABLE。

### In-App Purchases

若遊戲包含 IAP：

- 必須先確認遊戲及整合符合平台資格。
- 必須遵守平台核准及相關整合要求。
- 不得擅自加入未經核准的付款系統。
- 必須確認付款、購買結果及玩家資料處理流程。

若遊戲不包含 IAP，標示為 NOT APPLICABLE。

---

## 9. Metadata & Presentation

發布前必須確認：

- 遊戲名稱正確。
- 遊戲描述符合實際玩法。
- 遊戲分類正確。
- Tags 正確。
- 封面及截圖符合平台規範。
- 封面、截圖與實際遊戲內容一致。
- 不得使用誤導性宣傳。
- 不得宣稱遊戲具有尚未實作的功能。

若重大修改遊戲類型、核心玩法或定位，必須評估是否需要更新 Metadata、封面及重新審核。

---

## 10. QA & Testing

發布前應執行：

- Build Test
- Runtime Test
- Gameplay Test
- UI Test
- Audio Test
- Input Test
- Restart Test
- Save / Load Test（若適用）
- Mobile / Responsive Test（若適用）
- SDK Test（若適用）
- Ads Test（若適用）
- CrazyGames QA Tool（若適用）
- Platform-specific Test

不得將 Build 成功視為完整 QA 通過。

不得將本站 Preview 通過視為 CrazyGames 平台正式審核通過。

不得將 CrazyGames QA Tool 通過視為正式審核或發布完成。

---

## 11. Verification Status

所有檢查項目必須使用以下狀態：

- PASS：已實際執行並確認通過。
- FAIL：已測試且未通過。
- NOT TESTED：尚未執行測試。
- BLOCKED：因環境、權限、平台資格或工具限制無法測試。
- NOT APPLICABLE：該項目不適用於本遊戲。

Agent 不得將 NOT TESTED、BLOCKED 或 NOT APPLICABLE 改寫成 PASS。

---

## 12. Release Report

每次發布前，Agent 必須提供：

1. 預計發布階段：Basic Launch / Full Launch
2. 本次修改內容
3. Build 結果
4. QA 測試結果
5. CrazyGames Compliance 檢查結果
6. 尚未測試的項目
7. 阻塞問題
8. 風險及影響範圍
9. 是否建議發布

若仍存在重大 FAIL、未解決的 BLOCKED 項目或重要 NOT TESTED 項目，必須明確說明，不得直接宣稱可以正式發布。

正式發布及平台審核狀態應由實際平台結果確認。

