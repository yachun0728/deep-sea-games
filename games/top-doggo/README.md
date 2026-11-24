# TOP DOGGO Paw City（top-doggo）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#top-doggo`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「美式鬥牛犬清空紫色浣熊幫，三種難度比誰闖到第幾關。」｜不限次數 · 街頭動作闖關
- 追蹤名稱（GA4 `game_name`）：TOP DOGGO，`game_id` 為 `top-doggo`
- 檔案：`games/top-doggo/card.html`、`games/top-doggo/cover.webp`、`games/top-doggo/game.js`、`games/top-doggo/icon.svg`、`games/top-doggo/leaderboard.webp`、`games/top-doggo/play.html`、`games/top-doggo/style.css`、`games/top-doggo/view.html`；`game.js` 共 58 行、3.9 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「52. TOP DOGGO: Paw City（top-doggo）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-top-doggo`、`td-frame`

## 狀態與常數

- 狀態物件／進行中旗標：`TD`（L4）
- L5 常數：`TD_DIFFS`

## 函式索引（game.js，行號為宣告位置）

`tdValid` L6、`tdFrame` L7、`tdLang` L8、`tdEnd` L9、`tdApi` L10、`tdRoute` L50

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 0 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L9 `tdEnd`：`if(round)AN.end(round,0,result,params||{});`
- L16 `tdApi`：`TD.round=AN.start('top-doggo',0,{difficulty:difficulty});`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`tdRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：父頁 `games/top-doggo/game.js`（`TD`、`window.deepSeaTopDoggo`），子頁 `games/top-doggo/play.html`（three.js r128 + 低面數 3D 場景模型 `models/`，主角與敵人為 2D Sprite）以 iframe 載入。2026-11-24 由預覽區骨架 `preview/grand-theft-doggo/` 升級上架（骨架保留作玩法參考）。

- 入場：免費、無 BONUS、不給點。主角是美式鬥牛犬，用網球槍對抗紫色浣熊幫；沒有任何下注、倍率或領回。
- 操作與負載（2026-11-24 調整版，待驗收）：手機目標 30 FPS、像素比上限 1；桌面目標 60 FPS、像素比上限 1.5；開場／暫停 10 FPS，離頁／背景停止 3D 渲染。手機遠處建築與道具減少繪製及外框，碰撞與地圖不變。搖桿 12% 死區，取消觸控／暫停清除輸入；車輛轉向與視角獨立，低速轉向減弱、放開加速會煞車，倒車速度上限 11（前進 22）。
- 沒有遊戲金錢或購買功能：已移除原型留下的金額 HUD、金額飄字與結算金額；既有追擊強度累計值改名 `threatScore`，原公式不變，不是點數、不存檔、不送排行榜。
- 玩法：第三人稱 55° 過肩視角。電腦 WASD 移動、按住滑鼠右鍵拖曳轉向（不需鎖定游標）、滑鼠左鍵攻擊、空白鍵翻滾、C 蹲下、X 轉身 180°、Q 換武器、E 上下車；手機左手搖桿、右側按鈕（FIRE／DODGE／CROUCH／180°／換武器／DRIVE）。DRIVE 固定顯示，距離車身邊緣 2 單位內啟用，遠離時變暗停用；上車後變為 EXIT。下車落點會包含原車體碰撞，搜尋周圍 12 單位內有餘裕且至少能走開 2 單位的位置；找不到安全位置時留在車上，成功下車時車速歸零。機車、速克達與敞篷車駕駛時保留可見的狗狗；封閉車輛維持隱藏。武器：網球槍、小刀、揮拳（無限），以及彈藥有限的網球手榴彈、網球大砲、狙擊槍（地圖武器箱或敵人掉落）。
- 視角與輔助瞄準（試玩版）：左搖桿移動，其餘非按鈕空白畫面可拖曳轉向；電腦 WASD 移動、←／→ 轉向、J 按住攻擊，滑鼠仍可右拖轉向／左鍵攻擊。橫移不自動轉鏡頭，斜前方移動時以該次移動起始方向為基準平順跟隨；手動轉向後保留 1.8 秒。開車鏡頭跟隨車尾，倒車不翻轉。槍械優先輔助前方 45° 半角、28 單位內且路徑無障礙的存活敵人；不鎖背後或隔牆目標，子彈仍走既有碰撞判定。
- 首次操作教學：移動到圓圈 → 攻擊練習靶 3 次 → 換一次武器 → 翻滾，期間凍結敵人與拾取／計分，不開訪客回合、不受傷、不送榜。完成或跳過後存 `top-doggo-tutorial-v1=1`，儲存不可用時僅當次記住；完成或跳過後直接銜接正式回合，不彈出準備畫面；教學提示不鎖移動、攻擊或換武器。可從暫停選單重新練習，會先結束當前正式回合並從第一關重新準備，不保留該局進度。
- 關卡：每關任務鏈依序為擊倒浣熊、撿金骨頭、開車撞人、打出連擊，奇數關另有頭目（浣熊老闆／浣熊將軍），偶數關改為擊倒射手或壯漢。全部完成顯示通關，按「下一關」進入下一關：敵人血量 +18%、傷害 +10%、射速與速度略增、目標增加。金骨頭回血，滿血變護盾。
- 難度：簡單／普通／困難（預設普通，存在 `top-doggo-diff`）。一局開始後鎖定難度，死亡或離開後才能更換。
- 結束：血量歸零（本局結束）或離開遊戲頁都算一局結束；離開會把目前到達的關卡送榜並重置，再進入從第 1 關重來。
- 排行榜：三個難度各一張榜（`top-doggo-easy`／`-normal`／`-hard`），成績 = 該局到達的關卡數（越高越好，同分依伺服器紀錄時間最早者在前）。遊戲開始前只顯示該難度第 1 名，大廳榜單依難度分列並顯示 `Lv N`。
- 驗證（Worker 合理性驗證，`shared/top-doggo-rules.cjs`）：即時 3D 動作遊戲無法在伺服器完整重播，所以 Worker 只檢查：開局時間由 Worker 記錄；結束送 `[關卡, 累計擊倒數, 遊玩毫秒]`；關卡 1～60；每通過一關至少擊倒 8 名；遊玩時間不得低於 6 秒＋每關 18 秒，也不得超過實際經過時間（容差 3 秒）；擊倒速度上限每秒 3 名。不合理或重送的成績不入榜。這不能擋住「等夠久再送出假成績」的進階作弊，榜單只代表合理性，不是完整防作弊。
- 結算與追蹤：每局一次 `start`（entry_points=0，參數 difficulty），死亡為 `loss`、離開為 `abandoned`，各一次 `end`（payout=0，score=到達關卡、step=擊倒數、level）。
- 語言：子頁內建繁中／英文／簡中字串表（`EN`／`HANS`），跟隨父頁語言，`<body data-i18n-ignore>` 不走全站字典。卡片與選單文字照一般流程補 `locales/en.json`。
- 儲存：`top-doggo-diff`（上次選的難度）；新增於 2026-11-24。不讀寫點數或其他平台 Key。
- 測試：`node tools/test_top_doggo.mjs`（父頁橋接與字串表）、`node tools/test_top_doggo_board.mjs`（真實 Worker 路由＋SQLite 套用全部 migration）。
- 未驗證：真機手機操作手感、低階手機幀率、長時間遊玩平衡（關卡 8 以上）；Worker／D1 尚需依 `docs/BACKEND.md` 發布。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/top-doggo/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
