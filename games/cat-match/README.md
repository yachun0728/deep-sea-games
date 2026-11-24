# 貓貓三消 Cat Match（cat-match）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#cat-match`　分類：益智策略　狀態：顯示中
- 大廳卡片：「拉布陪你交換貓咪與玩具，三消連鎖、無限接關。」｜不限次數 · 療癒三消
- 追蹤名稱（GA4 `game_name`）：貓貓三消，`game_id` 為 `cat-match`
- 檔案：`games/cat-match/.gitignore`、`games/cat-match/DESIGN.md`、`games/cat-match/RELEASE.md`、`games/cat-match/audio.js`、`games/cat-match/card.html`、`games/cat-match/cover.webp`、`games/cat-match/game.js`、`games/cat-match/i18n.js`、`games/cat-match/icon.svg`、`games/cat-match/leaderboard.webp`、`games/cat-match/main.js`、`games/cat-match/play.css`、`games/cat-match/play.html`、`games/cat-match/style.css`、`games/cat-match/view.html`；`game.js` 共 42 行、4.4 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「貓貓三消 Cat Match（cat-match）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-cat-match`、`cm-frame`

## 狀態與常數

- 狀態物件／進行中旗標：`CM`（L2）

## 函式索引（game.js，行號為宣告位置）

`cmValid` L3、`cmFrame` L4、`cmEnd` L5、`cmRoute` L39

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

- L5 `cmEnd`：`AN.end(CM.round,0,result,{score:Math.max(0,Number(score)||0)});`
- L19 `cmEnd`：`CM.round=AN.start('cat-match',0);`
- L34 `cmEnd`：`if(cmValid(source)&&CM.round)AN.progress(CM.round,{phase:'pause'},true);`
- L35 `cmEnd`：`CM.round=AN.start('cat-match',0);`
- L35 `cmEnd`：`else AN.resume(CM.round);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`cmRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

免費、無 BONUS，無倒數無體力限制。手機交換鄰格，三連收集；四連生成整行／列消除、五連生成彩虹球、T/L 生成 3×3 消除。24 步收集指定圖案，前五關目標 6～10 個，第 6 關起 12 個、每關加 1 個，第 24 關達 30 個封頂；補格時目標圖案出現率前 10 關約 3 成、第 11～15 關約 2 成、第 16 關起回到完全平均的 1/6；完成可繼續下一關，失敗可免費重試。三種 8×8 遮罩輪替，無解自動洗牌。每關 3 次提示、2 次手動洗牌（第 11 關起 5 次提示、4 次手動洗牌），新關／重玩補滿，自動洗牌不耗次數。每個消除格 10×當次連鎖段數分，成績不換點數。

正式規則 `shared/cat-match-rules.js` 重建為具種子的純引擎，前端與 Worker 共用。排行榜比較已結束之單關分數（成功或步數耗盡），不是旅程關數；同訪客只留最佳，前50名，同分先到優先。Worker 發 seed 與指定旅程 level，重播最多33個合法操作（24次交換+5提示+4洗牌），拒絕中途結算、超額道具、非法交換、多送操作、偽造成績。每次新關重新領取票據；離線可玩但不送榜。

獨立 iframe `games/cat-match/play.html`，來源驗證橋接 `deepSeaCatMatch`，一關一次免費 start、complete/loss/abandoned end，離頁／背景停音樂與操作。`deep-sea-cat-match-progress-v1` 保存旅程與最高旅程，`deep-sea-cat-match-audio-v1` 保存獨立音樂／音效設定；不改 preview 存檔，也不改平台餘額。繁中／英文介面及平台語言切換，簡中沿平台轉換。封面1056×1000，排行榜頭像192×192。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/cat-match/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
