# Deep Sea Arcade

51 款遊戲共用本機點數與 GA4，部署為 GitHub Pages 靜態網站。目前顯示 39 款一般遊戲與獨立每日挖礦（踩地雷免費不限次數、挖礦每日免費配額，其他依入場說明扣點；點數低於 100 時每分鐘回 1 點），另外 8 款機率遊戲以 catalog 的 `hidden` 隱藏，程式碼保留。

## 產品方向：純小遊戲，禁止博弈元素

所有遊戲（包含隱藏與新增遊戲）都不得有下注、全押、賠率／返還倍率、領回或提前兌現。不得僅隱藏文字而保留博弈機制；改以操作、推理、探索、分數與關卡提供遊戲目標。固定入場費與自然回點可保留，但不得以入場費作本金計算輸贏返還。

踩地雷與挖金礦已完成改造，其他遊戲尚未全部完成；下文的返還與結算用語是現況紀錄。完整限制與踩地雷／挖金礦的待辦見 [GAME_RULES.md](GAME_RULES.md)，執行規範見 [AGENTS.md](AGENTS.md)。本次文件更新不代表遊戲已符合新規範。

## 目錄導覽

- [Repo 目錄與檔案歸屬](docs/repository-layout.md)：遊戲、共用系統、工具與產物放哪裡。
- [文件索引](docs/README.md)：維護規範、平台上架 skill、驗收與交接。
- [工具入口](tools/README.md)：建置、測試、翻譯與平台匯出命令。
- 本機交付檔放在 `output/`，平台包放在 `output/publishing/<platform>/<game>/`；舊版本保留供回復。

## 先定位，再讀程式

1. [AGENTS.md](AGENTS.md)：Agent 維護規範。
2. [ARCHITECTURE.md](ARCHITECTURE.md)：實際相依、資料 Key、共用程式邊界。
3. [GAME_RULES.md](GAME_RULES.md)：玩法、扣款與返還公式。
4. `games/catalog.json`：用 hash ID 找到遊戲來源。
5. [games/README.md](games/README.md) 與各款的 `games/<id>/README.md`：自動產生的函式索引（含行號）、扣款與追蹤位置、規則摘要。改某一款先讀它，不必掃整支 `game.js`。改完執行 `python3 tools/game_docs.py` 重新產生。

例如修改插隊遊戲，先讀 `games/elevator/game.js` 與 `view.html`；修改大廳入口才讀該目錄的 card.html／icon.svg。不要從 400 KB 的 index.html 開始；它是產出。原生單款邏輯約 2～25 KB，珍奶完整子頁另存，沒有改珍奶時不必讀取。

## 本機修改、組合與預覽

從專案根目錄執行（需要 Python 3.9 或更新版本，不需安裝套件）：

```sh
python3 tools/build.py
python3 tools/build.py --check
python3 -m unittest discover -s tools -p 'test_*.py'
python3 -m http.server 8765
```

開啟 `http://localhost:8765/`。GA4 在 localhost 刻意不送事件；正式環境驗收見 [ANALYTICS.md](ANALYTICS.md)。

`templates/`、`games/`、`js/`、`css/` 是來源。`index.html` 是追蹤在 Git 的靜態產出，修改來源後必須重新組合，提交時一併包含來源與產出。GitHub Pages 不需 Python，也不用調整現有入口。`--check` 可用於未來 CI，但目前沒有擅自加入部署 workflow。

`{{include:路徑}}` 原樣插入內容，`{{json:路徑}}` 插入安全序列化的子頁字串；路徑均相對專案根目錄。JS 片段仍組成同一個原有 IIFE，不可各自用 script 標籤載入或當成 ES module。檔案結尾的空白與換行屬組合內容，工具不做格式化。

## 遊戲骨架與預覽區

新遊戲概念先做可玩骨架，放在 `preview/<id>/`（獨立單檔，不進 catalog／大廳／`index.html`，noindex，不接點數與 GA4），確認好玩再上架。

```sh
python3 tools/prototype.py new <id> "<中文名稱>" "<一句話概念>"   # 建立骨架並更新預覽入口
python3 tools/prototype.py --check                              # 檢查入口、noindex、未外洩到大廳
python3 -m http.server 8765                                     # 開 http://localhost:8765/preview/
```

推送後線上網址為 `https://yachun0728.github.io/deep-sea-games/preview/<id>/`，總覽在 `/preview/`。完整流程見 [prototype.md](docs/agent-guides/prototype.md)，驗收見 [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) 第 0 節。

## 隱藏或重新顯示遊戲

在 `games/catalog.json` 該遊戲加上 `"hidden": true`，重新執行 `python3 tools/build.py`：大廳卡片、選單與網址都不會出現，view 與邏輯仍會組合。要重新顯示就移除該欄位。重新顯示前必須完成非博弈玩法改造與驗證，不能只改成固定 10 點就重新上架。

## 新增一款遊戲

新增遊戲預設包含訪客排行榜。負責上架的開發者或 Agent 應在同一份 PR 完成遊戲、Worker 成績驗證、公開榜與驗收紀錄，依以下接點接入。catalog 登錄後仍須實作該款驗證邏輯。

1. 建立 `games/<id>/game.js`、`view.html`、`card.html`、`icon.svg`。ID 使用小寫英數與連字號；view 使用唯一 `view-<id>`，圖示 symbol 使用 `icon-<id>`，卡片 href 指向 `#<id>` 並附分類。
2. 在 `games/catalog.json` 加入 ID 與四個來源路徑。這是維護／檢查索引，不會自動產生程式註冊。
3. 在 `js/runtime.js` 的 bootstrap 前放入邏輯 include；在 `templates/index.html` 加入 view include 及遊戲選單的 `tab-<id>`；在 `templates/lobby.html` 對應位置加入 icon／card include，更新大廳總數。既有遊戲的顯示順序應保持。
4. 在 `js/navigation.js` 的 VIEWS 加名稱；在 `js/analytics.js` 既有遊戲名稱對照加入名稱，依 start／progress／resume／end 契約追蹤。
5. 核對 `js/bootstrap.js` 是否需要初始化；核對 hot.snapshot、`js/controls.js` 重設防護與提示、route 的必要回呼。不要為新增遊戲重寫其他款的設定。
6. 使用原有 S.balance／save／renderAll 等共享流程；明確實作單次扣款與單次結算。設定新遊戲專屬 DOM／狀態名稱，避免與共享作用域衝突。若要新建 localStorage Key，先核對既有 Key，勿覆寫舊資料。
7. 新樣式優先放 `games/<id>/style.css`，在 templates/index.html 的既有 style 區段末尾 include；限定於該遊戲的 selector。既有 CSS 本次保留原順序，沒有逐一改寫。
8. 同步提供繁體中文與英文，補齊 `locales/en.json`；依下方「新增遊戲的多語系清單」驗證卡片、規則、動態提示、Canvas、無障礙標籤與 iframe，並把新遊戲加入瀏覽器多語系檢查。只補中文介面不算完成。
9. 完成下方「新增遊戲必接訪客排行榜」的串接與實測，在同一份 PR 附驗收結果。免費補給等無競賽指標項目，明列不參與原因。
10. 更新 GAME_RULES.md，必要時更新架構與追蹤文件。組合並執行檢查，再驗證不足額、扣款、失敗、續關、回大廳、直接 hash、手機及背景恢復流程。不得為新增遊戲引入領回或點數返還倍率。

組合工具會檢查 catalog 檔案、唯一 view／tab／icon／card 與引用；它不能證明遊戲規則、餘額與 GA4 行為正確。仍需依修改範圍做行為驗證。

## 新增遊戲必接訪客排行榜

每次新增遊戲，開發者與 Agent 都應主動完成本節，作為預設上架範圍。適用固定入場與免費競賽遊戲，也適用同來源 iframe。每日免費補給等無競賽指標項目可在 PR 說明不參與原因。

1. 在玩法文件定義遊戲 ID、計分單位、適用模式、難度與合法結束點。沿用分數由高到低排序。若玩法以耗時越短越好，先定義可比較的排行指標與顯示方式。
2. 沿用 `frontend/services/api.mjs` 的訪客身分與開局／操作介面。Worker 為本局建立可驗證的狀態或亂數種子，前端記錄有效操作與遊戲時間。每款必須在 `backend/src/services/ranked-boards.mjs` 註冊驗證器，或沿用該款既有專用端點。
3. 以 `shared/` 的純規則供前端與 Worker 共用。即時操作遊戲可參照 `shared/timed-replay.cjs`、`js/timed-leaderboard.js` 及已完成遊戲，Worker 重播操作並計算最終分數。回合制遊戲可由 Worker 持有棋盤、驗證每一步。iframe 保留既有畫面與來源驗證，透過父頁橋接傳遞可驗證輸入。
4. Worker 檢查訪客所有權、回合版本、操作是否合法、遊戲時間與合法結束點，並防止重複結算。前端顯示驗證中、成功、失敗、重試等繁中／英文狀態。
5. 訪客成績只寫 `game_leaderboard`，每款在 D1 保留前 50 筆，沿用既有較高成績更新與時間／寫入順序 trigger。登入用的 `player_best_scores` 保留給帳戶。大廳從公開 feed 讀取每款最高分一筆，同分顯示最早達到該分數的人，依 `recorded_at`、`score_order` 排序。沿用 D1 伺服器時間；舊紀錄缺時間時依既有相容規則顯示。
6. 用正常操作完成至少一局，核對畫面分數、Worker 結算、D1 紀錄、單款 API 與大廳最高分。驗證同分先到、較低分、重送、偽造分數、錯誤訪客、非法操作、空榜及網路失敗。完成桌面與 390px、繁中與英文、直接 hash、離頁與背景恢復檢查。
7. PR 附遊戲 ID、驗證器位置、計分規則、測試指令與結果、migration 需求、未驗證事項及回復方式。依序套用需要的 D1 migration、部署 Worker、部署前端，再用正式站實際對局確認。

驗收細項見 [訪客排行榜上線檢查](RELEASE_CHECKLIST.md#訪客排行榜)，接入步驟與踩地雷程式碼範例見 [使用 SDK 加入排行榜](docs/BACKEND.md#使用-sdk-加入排行榜)。`tools/build.py` 目前檢查來源組合與 catalog，排行榜串接須由上架者依本節完成並實測。

## 來源拆分的驗證與回復

本次初始拆分以組合後 HTML 與拆分前檔案逐位元組一致為驗證，沒有改規則、倍率、畫面、localStorage Key 或 GA4。

一般遊戲修改若需回復，回復該次變更的來源與對應產出，再跑 `--check`。不要只回復 index.html，否則下一次組合會覆蓋它。不要使用會丟棄其他未提交工作的全目錄重設；Git 提交與推送依本次授權範圍處理。

## 深海火線行為檢查

修改 `games/blaster/` 時可在有 Node.js 的環境執行 `node tools/test_blaster.mjs`，驗證單次扣款／結算、續關、武器升級、漏怪扣心與暫停。無需 npm 套件；Python 組合檢查仍照常執行。

## 青蛙吃蟲行為檢查

修改 `games/frog/` 時可在有 Node.js 的環境執行 `node tools/test_frog.mjs`，驗證單次扣款、每 10 隻入帳一次、單次結算、被螫與餓昏結束、生氣蟲的狀態循環與空白鍵只在本款畫面作用。無需 npm 套件。

## 俄羅斯方塊行為檢查

修改 `games/tetris/` 時可執行 `node tools/test_tetris.mjs`，驗證父頁橋接免費開始、單次結算、暫停／繼續、離頁 abandoned，以及子頁整局流程只回報一次 finish。無需 npm 套件。

## TOP DOGGO 行為檢查

修改 `games/top-doggo/`、`shared/top-doggo-rules.cjs` 或其 Worker 註冊時，執行 `node tools/test_top_doggo.mjs`（父頁橋接免費開局、單次結算、三難度各用自己的榜、離頁 abandoned、遊戲頁繁中／英文／簡中字串表齊全）與 `node tools/test_top_doggo_board.mjs`（真實 Worker 路由＋SQLite 套用全部 migration，驗證合理性規則、各難度分榜、重送與名稱）。遊戲頁 `games/top-doggo/play.html` 由預覽區骨架升級而來，之後直接維護這份。無需 npm 套件。

## 不准跑調行為檢查

修改 `games/on-pitch/` 時可執行 `node tools/test_on_pitch.mjs`，在假的 DOM 與時鐘中驗證免費開局（餘額 0 也能開、不重複開局）、通關與失敗各只結算一次且 payout 為 0、星數存檔、暫停／繼續／回選單、離頁 abandoned、麥克風被拒絕時改用螢幕琴鍵，以及英文畫面不殘留中文。無需 npm 套件；真人聲音與各瀏覽器麥克風行為需手動試玩。

## Telegram Bot 檢查

修改 `telegram-bot/` 時可執行 `node tools/test_telegram_bot.mjs`，驗證六個指令的回覆與按鈕網址、UTM 參數與 `/start` 深連結管道、繁中／簡中／英文對應、群組改用一般連結、未知指令在群組不回應、webhook secret 驗證，以及隨機推薦的遊戲仍為可見遊戲且名稱與 `games/README.md` 一致。無需 npm 套件。

## 遊戲上線與 BONUS 檢查

新增、改造、重新上架及發布前，依 [遊戲上線與 BONUS 檢查規範](RELEASE_CHECKLIST.md) 驗證非博弈玩法、固定獎勵門檻、BONUS 標章、錢包防重複、追蹤與正式站部署。清單也包含遠端較新及本機有其他未提交修改時的隔離發布流程；每次只回報實際通過的項目。各款獎勵數值仍以 GAME_RULES.md 與來源核對，不統一套用蓋樓遊戲的門檻。

## 免費懷舊與每日補給

踩地雷完全免費，可選低中高或自訂2×2～10×10、最多N×N−1顆雷，第一格也可能踩雷。每日免費挖礦以大廳右下角浮動小圖示呈現，台灣時間每天免費3次、每次挖5格、最多30點。詳見 GAME_RULES.md。

## 偷睡大師行為檢查

修改 `games/nap/` 時可在有 Node.js 的環境執行 `node tools/test_nap.mjs`，驗證單次扣款、每過 1 關入帳一次、考績歸零單次結算、通關 10 關入帳 10 點與按鍵只在遊戲顯示時作用。

修改 `games/pudding/` 時可執行 `node tools/test_pudding.mjs`，驗證單次扣款、每段入帳一次、全破加 2 點、單次結算、按住方向鍵移動與邊界、刃／矛／盾與箭矢的判定、安心值歸零結束，以及各狀態都能畫出來。

## 別看行為檢查

修改 `games/peek/` 時可在有 Node.js 的環境執行 `node tools/test_peek.mjs`，驗證單次扣款、自動奔跑、衝刺與靠牆互斥、蓋住會停下、三種邪靈的生死判定與依躲過次數登場、2 次襲擊 +2 點與衝出出口 +5 點各只發一次、結束只結算一次、手機按鈕多點觸控與按鍵只在本款畫面作用。無需 npm 套件。

## 血壓上升行為檢查

修改 `games/mermaid/` 時可執行 `node tools/test_mermaid.mjs`，驗證單次扣款、每顆珍珠 BONUS 只發一次（悔棋後重收不重發）、通關加發、發牌／移動／收組規則與放棄單次結算。無需 npm 套件。

修改 `games/banquet/` 時可執行 `node tools/test_banquet.mjs`，驗證扣款、BONUS、道具、銀蓋、醉倒、延長賽與 AI 完整對戰不變量。無需 npm 套件。

修改 `games/mosquito/` 時可在有 Node.js 的環境執行 `node tools/test_mosquito.mjs`，驗證單次扣款、25／50／75% 里程碑與吸滿逃出各只入帳一次、三種死法（抓癢、翻身、開燈）、開燈逃生、最佳紀錄、空白鍵與指標按住只在本款畫面作用，以及機器人難度合理性檢查。無需 npm 套件。

## 尊嚴保衛戰行為檢查

修改 `games/last-hair/` 時可在有 Node.js 的環境執行 `node tools/test_last_hair.mjs`，驗證不足點數不扣款、單次扣款、四個里程碑（100／250／400／500 公尺）各入帳一次共 10 點、頭髮掉光與抵達終點各只結算一次、雙拇指觸控分工與按鍵只在遊戲顯示時作用。

## 小灰出門行為檢查

修改 `games/pet-walk/` 時可在有 Node.js 的環境執行 `node tools/test_pet_walk.mjs`，驗證單次扣款、不能重複開始、每段 20 步 BONUS +1 點各只發一次、整趟淨支出 7 點、轉盤與分數不給點、終點轉盤、二選一事件空白鍵自動選預設、結束只結算一次、存檔壞資料回復與英文模式不出現中文字。

## 拒絕加班行為檢查

修改 `games/office-shoot/` 時可在有 Node.js 的環境執行 `node tools/test_office_shoot.mjs`，驗證不足點數不扣款、單次扣款、第 1～5 天擊敗魔王各 +2 點只發一次（最多 10 點）、第 6 天起不給點、加班結束只結算一次且不扣回、離頁 abandoned 帶已入帳點數、暫停、按鍵只在本款畫面作用與英文模式畫布不出現中文字。

## 數字吞噬、鏡像雙子、影子接力、一筆畫守城

2026-11-18 由 games-innovation 的單檔 HTML 接入，沿用一口氣探險的 srcdoc 子頁＋右側面板模式（`games/<id>/original.html`）。四款都是固定入場 10 點、BONUS 最多 10 點：三款關卡制在一局內每關第一次通過 +2 點，按「結束本局」結束；一筆畫守城教學後每撐過 30 秒 +2 點。子頁字串寫成「中文|English」跟隨頁首語言。目前沒有 Node 行為測試檔；扣點、BONUS 上限與防重複、結束、重設防護、暫停、不足額已用一次性的瀏覽器腳本驗證，並納入 `tools/i18n_browser_games.js`。

## 中英文版本

頁首「繁中／EN」可即時切換大廳、遊戲操作、規則、動態提示與 Canvas 文字，保留目前遊戲及點數。珍奶內嵌原版已使用英文，保留原畫面。可分享 `index.html?lang=en#lobby`，或以 `index.html?lang=en#dream` 直接開啟英文遊戲；中文網址使用 `?lang=zh-Hant`。語言偏好保存在此瀏覽器，明確網址參數優先，不跨裝置同步。

翻譯來源為 `locales/en.json`，顯示邏輯為 `js/i18n.js`，樣式為 `css/i18n.css`。新增或調整遊戲文字後，補齊翻譯並執行既有組合與單元測試。額外瀏覽器驗證：

### 簡體中文（簡中）

頁首語言選單為「繁中／簡中／EN」，網址參數 `?lang=zh-Hans`，偏好存在既有的 `deep-sea-language-v1`。簡中不是另一份人工翻譯：`js/i18n.js` 在顯示層把繁中原文轉成簡體，規則來自 `locales/zh-Hans.json`（內嵌為 `#arcade-hans`）：字表 `chars`、台灣→大陸用語 `words`（軟體→软件、滑鼠→鼠标）、整句例外 `exact`。遊戲狀態、儲存、GA4 與 id 都不受影響，Canvas 文字與同源 iframe 也會轉換。

- 產生：`python3 tools/build_zh_hans.py`（開發機需 `pip3 install --user opencc`，成品 json 已提交，建置與部署不需要 OpenCC）。新增或修改繁中文字後重跑一次，再 `python3 tools/build.py`。
- 人工修正：改 `locales/zh-Hans.overrides.json`（`exact` 整句、`words` 詞、`remove` 拒絕 OpenCC 的詞，例如「核心」不可轉成「内核」），再重新產生；重新產生不會覆蓋它。
- 驗證：`tools/test_i18n_hans.py`（表格格式、已知詞、所有可見文字轉換後不殘留繁體字、成品是否為最新）與 `python3 tools/check_i18n_browser.py --suite hans`（桌面與 390px：切換、記憶、大廳與數款遊戲畫面無繁體殘留）。
- 範圍：Academy 有自己的繁中／簡中／英文題庫，站台選簡中時會跟著用簡中。珍奶原版維持英文。譯文為機器轉換，上線前建議請母語者校對常用詞並寫入 overrides。

### 文字 id（逐步把繁中抽出來）

已遷移的文字（目前為卡片頁尾、大廳模板與各遊戲 `view.html` 的靜態文字，以及各遊戲 `game.js` 與 `js/`、`platform/` 平台檔的提示字串；Academy 因進行中暫未遷移，`shared/` 規則檔（後端也讀取）與 GA4 遊戲名稱表 `js/analytics.js` 刻意不遷移）在原始碼裡寫 `{{t:card.mines.tag}}`，繁中寫在 `locales/zh-Hant.json`、英文寫在 `locales/en.ids.json`，兩邊以相同 id 對應。`tools/build.py` 會把 `{{t:id}}` 展開成中文，並把「中文→英文」併入內嵌字典，所以 `js/i18n.js` 與玩家看到的畫面完全不變。改字只改這兩個 json 再 build；未遷移的字串仍用 `locales/en.json`（以中文原文為 key）。`tools/test_i18n_ids.py` 檢查 id 都存在、沒有孤兒 id、中英對應與值乾淨；`tools/i18n_data.py` 是共用的讀取／合併工具。`game.js` 內寫成 `'{{t:id}}'`（純中文）或 `'{{tb:id}}'`（遊戲內 `中文|English` 雙語字串，id 慣例為 `<遊戲>.say.NNN`，英文取自 `en.ids.json`），build 會依前一個引號做 JS 跳脫。因此 `game.js` 原始檔不再是可直接執行的 JS：測試請用 `tools/expand_ids.mjs` 的 `readSource()`／`expandIds()`、Python 工具用 `i18n_data.expand_ids()` 讀取。新字串請優先用 id，值不得含半形雙引號與 `{{`。

```sh
python3 tools/check_i18n_browser.py
# Chrome 不在預設位置時可加 --chrome /完整/執行檔路徑
# 可加 --screenshots /tmp/arcade-i18n-shots 保留英文版截圖
```

此工具使用獨立暫存設定檔與測試點數，不操作使用者的瀏覽器紀錄或正式站；檢查桌面及 390px 裝置尺寸、語言記憶、顯示文字、既有資料與單次扣點。它不取代全關卡、實體手機或 GA4 後台驗收。

### 新增遊戲的多語系清單

- 同步繁中／英文：大廳卡片、分類、選單、頁面標題、規則與 BONUS 條件、按鈕、提示與無障礙文字。沿用 `locales/en.json` 及既有語言切換，不另建重複遊戲頁或重載整頁來切換。
- 檢查動態句子：關卡、分數、點數、倒數、開始、成功、失敗、餘額不足、暫停、續關及重玩。驗證實際組合結果與 Canvas 文字，避免只有初始畫面翻完。
- 若是 iframe，連子頁的靜態／動態文字與畫布一起驗證，包含延遲載入與重新載入；原本已是英文的珍奶畫面維持原樣。無法翻譯的外部頁面須明列限制。
- 切換語言須保留遊戲狀態、點數與 hash；不得改變規則數值、遊戲 ID、GA4 追蹤契約或既有存檔。原按鈕與扣點處理器不重建，不因語言切換重複開局或結算。
- 將新遊戲加入 `tools/i18n_browser_*.js`，執行翻譯覆蓋單元測試、組合檢查與上方瀏覽器檢查；確認 `?lang=en#<id>`、`?lang=zh-Hant#<id>`、語言記憶、進行中切換、桌面與真正 390px CSS viewport 無漏翻／溢出。將實測與未驗證項目寫入驗收紀錄。
