# 荒島遠征：開發驗證紀錄

2026-11-18；game_id `frontier`；整合基準 `f4b1fec`（工作樹變更，尚未提交／推送）。依 RELEASE_CHECKLIST.md 核對。

- 已接入：大廳卡片／圖示／益智策略分類、hash／VIEWS／標題、runtime片段、錢包與進行中重設防護。無下注／返還／cashout，沒有BONUS或點數獎勵。
- `tools/test_frontier.mjs`：292項純模擬及DOM替身測試通過。全部50關驗證可用材料、燈塔前置條件、橋樑建造、各任務達成及建燈塔結束。材料與清怪使用測試fixture，不代表真人逐關通關或真實耗時／難度驗收。
- 已驗證：背包／倉庫、材料再生、升級精確扣料、補血上限、過河阻擋、衝刺無敵與冷卻、首領預告／命中／閃避、地面危險預告、後期站樁死亡、夜幕上限。錢包不足不開局、連點開始單次扣10點、免費重試／續關、科技保留、刷新讀取、儲存失敗不扣款、可辨識損壞存檔保留付費資格、pagehide／BFCache與暫停／resume，皆為隔離替身驗證。
- 19項Python單元測試通過，包含字串翻譯覆蓋；build與--check通過；組合後可執行script與JSON分別語法解析通過；git diff --check通過。
- 已新增 `tools/i18n_browser_frontier.js` 並接入瀏覽器檢查器，涵蓋中英、進行中切換、390px、動態文字、鍵盤、觸控處理器、讀取及不足額流程。執行 `python3 tools/check_i18n_browser.py` 因sandbox禁止本機socket綁定而未啟動，不能視為通過。Chrome headless pipe亦無法建立；本機file網址被瀏覽器政策阻擋，未繞過限制。
- 未驗證：瀏覽器實際畫面／溢出、真實390px觸控、全螢幕、背景與多點觸控的實機操作、50關真人難度與平衡、正式部署、GA4後台收件、跨分頁競爭與意外關機交易一致性。存檔與共用餘額是兩個本機Key，不宣稱原子交易或防作弊。
- 回復：只回復本次frontier來源與新增接線，重新組合index；保留`deep-sea-frontier-v1`，舊程式會忽略。不清玩家資料，不回復其他遊戲的既有更新。

## 2026-11-18 採集視覺更新（尚未發布）

- 大廳卡片移到第一張；不更動分類、點數、難度或存檔格式。
- Canvas 人物改為草帽探險家，含背包、五官、走路起伏與揮斧；樹木分層樹冠、樹幹與樹樁；岩石加入切面、陰影與耗損裂紋。
- 採集效果沿用 effects 短期陣列，新增可選 gain、empty、px、py 顯示資料；載入既有存檔仍清空 effects，沒有新增必要 schema 欄位。
- 19 項 Python 測試、292 項 Frontier 行為檢查通過；7 個非空 script 分別以 JS／JSON 解析通過；Canvas mock 執行 50 關共 100 個採集／耗盡繪圖狀態通過（不是實際視覺驗收）。
- build 與 --check 通過。git diff --check 仍報既有 merge/pancake 及其組合產出的空白，未改動其他遊戲清理。
- 本機 HTTP 綁定遭環境拒絕，i18n 瀏覽器檢查同樣無法啟動；桌面／390px 手機畫面、動畫觀感與實機操作尚未驗證。未推送、未宣稱正式站更新。

## 2026-11-18 村落遠征版本（本機工作樹，未發布）

此節取代前述付費、扣料升級、木材廠憑空供料、固定62資源與自動跳關的歷史描述。

- 新內容：160到340個資源、1200×900到2400×1500地圖、實體工人採集搬運、小屋／市集／採石場／分倉、資源出售、怪物金幣掉落、金幣裝備升級、敵營／襲擊／受損修復、自行選擇離島。
- 手機：點畫面或開始嘗試原生全螢幕，不支援則固定滿視窗；搖桿及點地面移動、跨橋尋路、返回營地步行；交易裝備抽屜與退出操作留在全螢幕主框。衝刺僅是可選操作，手機不顯示衝刺鍵。
- 美術：Canvas沿用草帽探險家、分層森林、切面礦石與揮砍特效，增加實體NPC、建築差異、金幣與敵營。`art/direction-board.png` 是方向參考，非實機截圖；遊戲內有圖與ART_DIRECTION.md連結，AGENTS.md維護入口要求先讀。
- `node tools/test_frontier.mjs`：325項純模型／DOM替身檢查通過。50關以材料fixture和中和怪物驗證村落前置、任務、橋樑、燈塔、自行離島；不能代表真人50關難度或耗時驗收。額外涵蓋金幣交易不足額與數量、金幣裝備、死亡掉落一次、NPC實際移動與交貨、倒數敵襲、生產建築損壞、倉庫零木時使用背包修復、跨橋雙向返回、舊存檔相容補齊、金幣跨關／失敗保留、全視窗fallback與退出、單次start／end、交易面板開關。
- 19項Python測試（含中英字串覆蓋）、build及--check通過；7個非空script依類型JS／JSON解析、50關100個Canvas mock繪製狀態通過；無重複DOM ID。mock不是視覺、全螢幕或實機效能驗收。
- 本次指定來源的diff空白檢查通過；全工作樹仍有先前merge／pancake及其部署產出空白，未清理其他遊戲。
- `python3 tools/check_i18n_browser.py` 已嘗試，因本機HTTP socket綁定PermissionError無法啟動，非通過。測試腳本已擴充新前置條件、金幣升級、交易面板與自主離島。
- 待驗證：桌面與390px實際CSS版面、原生Fullscreen及iOS fallback、真實觸控、實際畫面品質、後期效能、真人戰鬥與經濟平衡、正式部署及GA4收件。尚無手動工人分配、推車、多路橋或多階段攻城，不能宣稱這些已實作。
- 儲存：沿用deep-sea-frontier-v1，保留version／paid／cleared和既有材料裝備座標，新增欄位相容補齊；新版本陣列較大，舊loader不保證接受，退版前須保留存檔副本。失敗解析不清原資料。不提供帳號同步或跨分頁強一致。
- 發布：未提交／未推送；原工作樹已有其他遊戲／平台修改，本次不混入提交，不更新既有/tmp發行副本。後續發布須以最新遠端乾淨副本只整合授權的frontier與接點，再重新驗證。

## 發行整合檢查

以遠端已知main `c1f10cd` 建立乾淨發行副本，保留別看自動奔跑等既有更新。只整合荒島遠征來源、美術資料、相關翻譯／文件／測試、大廳排序與重新組合的index.html；未包含828c239的點數變更。發行副本325項Frontier檢查、19項Python測試、build --check及git diff --check通過。網頁亦確認GitHub main目前為c1f10cd。命令列GitHub DNS失敗，發布狀態須以後續GitHub及正式站結果確認。

## Painted assets and landscape HUD release (2026-11-18)

Integrated on origin/main 78f0a23 to preserve the latest TiCATiCA name, BONUS label, zero-balance behavior and removal of reset controls. Only Frontier updates, related documentation/translations, and explicitly requested Profile entry hiding are added. No previous Cloudflare deployment is restored for this release.

- 343 model/DOM-adapter assertions pass, including ground and worker-cargo pickups, exact partial transfer, full-bag preservation, supply migration, construction bonuses, level caps and handheld portrait pause/exit.
- 19 Python tests pass; build and --check pass; scripts/JSON parse in the Frontier test; whitespace check passes.
- Actual Chrome local preview verified: painted explorer, trees, ore and buildings load; desktop stays windowed; trading reserves a separate column (canvas right 801, panel left 811, no overlap); 390px English has no untranslated visible Frontier text or horizontal overflow; English title deduplicates correctly.
- Actual Chrome viewport 844x390 in fullscreen: Canvas height 388px, no horizontal overflow, platform switch-game/navigation hidden. Portrait 390px displays a rotate prompt and pauses; landscape removes the prompt and requires manual resume. Temporary viewport override reset afterwards. This is browser emulation, not an iPhone orientation-lock acceptance test.
- Local play visibly reached stage 2, with four active workers, warehouse deliveries, full 36-slot quarry bag, gold retained and manual stage departure. Not all 50 stages were human-playtested.
- Screenshot saved at /tmp/frontier-polish-landscape.jpg. The automated headless browser runner was attempted but Chrome closed its test pipe; it is not reported as passed. Manual Chrome checks above were performed instead.
- Remaining: real iOS/Android orientation lock and touch feel, long-session mobile performance, 50-stage human balance, GA4 backend receipt. Publication must be confirmed separately after push.
