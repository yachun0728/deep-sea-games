# 2026-11-29 完整通關與操作 QA

## 正式站（舊版控制器的完整通關）

PASS：正式站發出隨機種子，以 QA 解牌搜尋取得合法完整操作，經正式 DOM 的牌張選取／移動事件執行，遊戲自行送出 proof，真正 Worker 重播後入榜。每款兩個全新 QA 訪客各完成一局。沒有改牌局、規則、終局狀態、時間或自行填分。這是自動化操作時間，不代表人類遊玩速度。

| 遊戲 | 由快至慢的伺服器時間 | 通關、入榜、顯示、排序、重送 |
| --- | --- | --- |
| mermaid | 00:45.304、01:16.766 | PASS |
| midnight-solitaire | 00:03.712、00:05.478 | PASS |
| orbit-freecell | 00:04.490、00:04.513 | PASS |

`results.json` 保存種子、合法操作、round/player ID、伺服器時間與排名，不含 token。`before-cleanup.json` 為實際榜單。結算畫面時間與 API `time` 一致；`score=7200000-elapsedMs`，由快至慢正確；重送相同指令得到同一回覆且榜單未重複。

PASS：兩個 QA 訪客的 6 筆榜單和 6 筆 ranked_boards 已按玩家 ID 與三個 game ID 清除。`after-cleanup.json` 與 `baseline.json` 的 entries 完全相同，均為空；一般玩家資料未刪除。使用者在清除前看到了測試成績並要求移除，已立即清除並重新查證。後續完整操作改用本機，避免再次污染正式榜。

## 新版操作（本機固定種子、模擬網路 acknowledgement）

PASS：390×844 和 1366×900 的 Chrome 觸控／滑鼠：經典接龍雙擊收牌；新接龍安全自動收牌、復原後不立即重做、雙擊收牌。拖曳時原牌 visibility:hidden，僅 ghost 顯示，取消／非法落點皆清除 ghost 並還原原牌位置。ghost 座標扣除容器邊框，避免開始拖曳時偏移。

PASS：三款 game scope 的 user-select:none、-webkit-touch-callout:none、selectstart preventDefault、touch-action:pan-y；牌桌／牌面 touch-action:none，仍保留說明視窗捲動。沒有全站關閉縮放。

PASS：經典接龍 seed 7 透過 DOM 完整完成 143 個合法動作；新接龍 seed 7 手動操作 84 個後，自動完成最後 16 張，100 個動作皆記錄。`local-auto-win-*.json` 的 proof 另交給未修改的真正 completionTimeBoards verifier 驗證通過。網路 acknowledgement 為本機模擬，不算第二次正式入榜。

PASS：人魚使用已完成正式驗證的原隨機牌局在本機重播；拖曳使用同一實體牌，不產生副本，取消還原。三款完成時顯示不同配色的像素星光／紙花、完成時間與排行榜儲存狀態，動畫 pointer-events:none、3.2 秒清除，支援 reduced-motion。截圖人工檢查；修正了慶祝主題類別與既有 .sea 衝突。

PASS：49 個 Python 測試、build/check、Mermaid 規則／錢包回歸、五個時間榜的實際 Worker+SQLite 合約測試（較快個人最佳、同時先完成者優先、非法 proof、伺服器計時、重送、模式隔離）。

NOT TESTED：人魚 2／4 花色的正式隨機完整通關（五榜的後端合約已測）；實體 iOS／Android、Safari 原生長按及縮放；GA4 後台收件。

NOT APPLICABLE：CrazyGames 平台發布及正式審核。本次只更新本站。

FAIL（既有、非本次範圍）：result-share 全目錄斷言發現 sand-art、cat-match、top-doggo 缺少 share 設定；此前基準已存在，三款接龍設定正常。
