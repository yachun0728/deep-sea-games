# 三款像素接龍正式發布 · 2026-11-28

## 發布結果

- PASS：前端來源已推送 `main`，部署來源 commit `0512e7e7ea464ca4637dddb53e1dda01b39f8291`。
- PASS：以最新遠端 `064eca7` 為基準整合，保留死神打工、拒絕加班、尊嚴保衛戰與插隊的既有美術，不夾帶其他未提交修改。索引檔由合併後來源重新 build。
- PASS：正式 D1 migration `0024_game_names_solitaire_time.sql` 已套用，僅新增／更新名稱，無分數清除或資料表變更。
- PASS：API Worker 部署版本 `995cc371-96c5-4568-a820-55ac459b3700`。
- PASS：主站 Worker 部署版本 `96b0f072-05e7-422b-9656-8771b60c75a4`。
- PASS：正式網域 HTML 已包含兩款新遊戲；三款封面與三張榜單縮圖 SHA-256 均與發布檔一致。
- PASS：正式 API 五張時間榜可開局、讀取正確英文榜名，初始均為空榜；沒有送入任何人為捏造測試分數。
- PASS：隔離 Chrome 158 在正式網域逐一開啟三款，390×844 模擬尺寸可進入排名局、顯示完整中文名稱與 ⓘ，無 Runtime exception、無水平溢出。見 live-results.json 與各遊戲 design/live-help-390.png；大廳見 ../live-three-solitaire-lobby-390.png。
- NOT TESTED：真實手機／平板、Safari／Firefox、長時間效能與正式 GA4 後台收件；未以 Chrome 模擬宣稱裝置測試通過。
- NOT TESTED：正式雲端的完整隨機牌局通關與真實玩家成績入榜；完整合法 proof／計時／同分／重送資料庫驗證已在 Node Worker＋SQLite 的受控牌局完成，不能與真人實測混稱。
- FAIL（既有、非接龍阻擋）：全目錄分享測試仍指出 sand-art／cat-match／top-doggo 的舊缺口，已核對發布前同樣存在；本次接龍分享設定、素材與既有分享 API 斷言通過。詳見 QA.md。
- BLOCKED：無目前發布阻塞。
- NOT APPLICABLE：CrazyGames SDK／QA Tool／平台正式審核，本次只發布既有網站。

## 正式入口

- 人魚蜘蛛接龍： https://ticaticagames.com/#mermaid
- 夜航經典接龍： https://ticaticagames.com/#midnight-solitaire
- 星軌新接龍： https://ticaticagames.com/#orbit-freecell

大廳 icon 只含英文 Mermaid Spider／Midnight Klondike／Orbit FreeCell。遊戲頂部、說明與榜名依站台語言顯示，中文為完整遊戲名。五張時間榜依完整通關毫秒由快到慢，舊人魚分數榜與舊存檔仍保留。

## 本機來源

發布在乾淨 worktree `/private/tmp/deep-sea-mermaid-release` 完成，以免發布其他工作中的內容。已將本次擁有的遊戲檔案與必要接線以逐項方式同步回主工作區；未重設或清除其他遊戲的未提交修改。主工作區的整體狀態不能當成本次乾淨發布版本的測試證據。


## 2026-11-29 體驗修正與完整通關驗證

- PASS：來源 commit `902f8f8ba85ed0fed88c60d2d3695db64c81af60`，整合遠端 `7d07298` 後重建、49 個 Python 測試與兩組接龍 Node 測試通過；插隊素材無差異。
- PASS：正式前端 Worker `6dcf01b6-fa2b-46a1-bdf6-ce9b920a6582` 已發布。API／資料模型／時間計分規則未更動。
- PASS：雙擊收牌、新接龍安全自動收牌、復原停止自動重做；拖曳僅保留移動牌、非法／取消回原位；遊戲內禁選取／長按選單／縮放手勢；三款像素慶祝與結算入榜狀態。人魚深色標題不再套用深色陰影，實際通關截圖已確認清晰。
- PASS：正式站三款各兩次隨機完整通關、真正 API 入榜、毫秒時間／快慢排名與重送不重複，並已清除兩個 QA 訪客的六筆測試榜單及對局。新版自動收牌的完整 DOM proof 再交給真正後端驗證器驗證，本機不再次提交正式成績。
- 證據與限制：[full-live/README.md](full-live/README.md)。新版正式站 390×844 操作結果見 `full-live/published-controls.json`。
- NOT TESTED：實體手機、Safari／Firefox、GA4 收件；人魚 2／4 花色正式隨機完整通關仍未實測，五榜受控後端合約均通過。
- NOT APPLICABLE：CrazyGames 平台發布與審核。
