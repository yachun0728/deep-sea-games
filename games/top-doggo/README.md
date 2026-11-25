# TOP DOGGO Paw City（top-doggo）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#top-doggo`　分類：跑酷動作　狀態：顯示中
- 大廳卡片：「美式鬥牛犬清空紫色浣熊幫，三種難度比誰闖到第幾關。」｜不限次數 · 街頭動作闖關
- 追蹤名稱（GA4 `game_name`）：TOP DOGGO，`game_id` 為 `top-doggo`
- 檔案：`games/top-doggo/card.html`、`games/top-doggo/cover.webp`、`games/top-doggo/game.js`、`games/top-doggo/icon.svg`、`games/top-doggo/leaderboard.webp`、`games/top-doggo/levels.js`、`games/top-doggo/play.html`、`games/top-doggo/progress.js`、`games/top-doggo/style.css`、`games/top-doggo/view.html`；`game.js` 共 28 行、1.8 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「52. TOP DOGGO: Paw City（top-doggo）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-top-doggo`、`td-frame`

## 狀態與常數

- 狀態物件／進行中旗標：`TD`（L2）

## 函式索引（game.js，行號為宣告位置）

`tdValid` L3、`tdFrame` L4、`tdLang` L5、`tdEnd` L6、`tdRoute` L20

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

- L6 `tdEnd`：`if(round)AN.end(round,0,result,params||{});`
- L11 `tdEnd`：`TD.round=AN.start('top-doggo',0,{level:level,mode:mode||'campaign'});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

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
- 建築碰撞：依建築模型外緣加 0.15 單位安全邊界，再計入角色半徑；不再封鎖整片草地。外圈建築同樣處理，未建築空地不產生假碰撞，樹籬只阻擋實際模型範圍。
- 視角與輔助瞄準（試玩版）：左搖桿移動，其餘非按鈕空白畫面可拖曳轉向；電腦 WASD 移動、←／→ 轉向、J 按住攻擊，桌機取消滑鼠拖曳轉向與固定中央準心；滑鼠游標十字準心直接投射世界座標，左鍵按住攻擊（含近戰與特殊武器），輔助範圍縮為游標方向約 7°；手機維持中央準心與前方 45° 輔助。橫移不自動轉鏡頭，斜前方移動時以該次移動起始方向為基準平順跟隨；手動轉向後保留 1.8 秒。開車鏡頭鎖定車尾，倒車不翻轉；方向鍵與 A/D 都轉車身，上車時清掉鏡頭快速轉身與拖曳狀態，車上禁止獨立滑動鏡頭與 180° 轉身。槍械優先輔助前方 45° 半角、28 單位內且路徑無障礙的存活敵人；不鎖背後或隔牆目標，子彈仍走既有碰撞判定。
- 首次操作教學：移動到圓圈 → 攻擊練習靶 3 次 → 換一次武器 → 翻滾，期間凍結敵人與拾取／計分，不開訪客回合、不受傷、不送榜。完成或跳過後存 `top-doggo-tutorial-v1=1`，儲存不可用時僅當次記住；完成或跳過後直接銜接正式回合，不彈出準備畫面；教學提示不鎖移動、攻擊或換武器。可從暫停選單重新練習，會先結束當前追蹤回合，保留關卡存檔，教學後回到選定關卡。
- 關卡：每關任務鏈依序為擊倒浣熊、撿金骨頭、開車撞人、打出連擊，第 1／3／5／7／9 關與第 10 關終戰另有頭目，其餘關卡改為擊倒射手或壯漢。進入頭目任務會補足未擊敗頭目，避免提早擊倒造成卡關。全部完成顯示通關，按「下一關」進入下一關：敵人數量、血量、傷害、射速與目標按各關設定明顯增加。金骨頭回血，滿血變護盾。 共 10 關，逐關解鎖，已解鎖可重玩；每頁 10 張卡，自動分頁，最後增加不可點的「第 11 關施工中」。擴充只需追加 levels.js 設定，存檔上限跟隨設定。
- 難度：移除難度選單；`games/top-doggo/levels.js` 定義逐關敵人血量、傷害、射速、速度、增援與任務目標。每關明顯提升，尚待真人平衡驗收。
- 結束：死亡或離頁結束當前追蹤回合，保留本機任務檢查點；通關送一次 win。通關後可下一關、重玩或繼續自由玩，第 10 關不會進入未完成的第 11 關。
- 排行榜：2026-11-25 使用者要求移除本站與 CrazyGames 版排行榜；前端不再領回合憑證、查榜或送分，大廳過濾本遊戲舊榜，Worker 停止接受新榜單回合。舊規則模組僅供歷史參考。
- 結算與追蹤：每關一次 start（entry_points=0，level）；通關 win、死亡 loss、離開 abandoned，各一次 end（payout=0、score=關卡、step=擊倒數、level）。自由玩另開追蹤回合，不提交排行榜。
- 音訊：開場／選關／暫停選單使用原創 88 BPM 合成旋律；進入遊戲切回既有 108 BPM 節奏，切換停止舊排程、不疊播。沿用 MUSIC 與靜音；首次互動啟用音訊，背景／離頁停止。未使用外部歌曲或錄音。
- 語言：子頁內建繁中／英文／簡中字串表（`EN`／`HANS`），跟隨父頁語言，`<body data-i18n-ignore>` 不走全站字典。卡片與選單文字照一般流程補 `locales/en.json`。
- 儲存：`top-doggo-progress-v1`（version、completed、unlocked、current={level,mission,progress}）；新 Key 不覆寫舊 `top-doggo-diff` 與教學記錄。只存此瀏覽器，損毀／未知版本回退安全預設，儲存受阻顯示提示並允許當次遊玩。載入重建場景與敵人，恢復任務進度，不保存戰鬥位置、車速、血量或彈藥。
- 測試：`tools/test_top_doggo.mjs`、`tools/test_top_doggo_progress.cjs`、`tools/test_top_doggo_board.mjs`、操作／教學測試。
- 未驗證：真機手機操作手感、低階手機幀率、長時間遊玩平衡（關卡 8 以上）；Worker／D1 尚需依 `docs/BACKEND.md` 發布。

TOP DOGGO 自由探索：獨立入口，無任務限制，擊倒敵人後持續補充，不解鎖關卡、不覆寫關卡存檔；目前採第 1 關戰鬥參數。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/top-doggo/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
