# 泡麵煎餅翻面 Noodle Pancake（pancake）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#pancake`　分類：時機操作　狀態：顯示中
- 大廳卡片：「半夜偷煮宵夜，晃手機煎到金黃再甩起來翻面。」｜每局 10 點 · 只扣入場點數
- 追蹤名稱（GA4 `game_name`）：泡麵煎餅翻面，`game_id` 為 `pancake`
- 檔案：`games/pancake/card.html`、`games/pancake/game.js`、`games/pancake/icon.svg`、`games/pancake/original.html`、`games/pancake/style.css`、`games/pancake/view.html`；`game.js` 共 43 行、3.3 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「25. 泡麵煎餅翻面 Noodle Pancake（pancake）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-pancake`、`pancake-finish`、`pancake-msg`、`pancake-frame`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`PANCAKE`
- L3 常數：`PANCAKE_FREE_KEY`

## 函式索引（game.js，行號為宣告位置）

`pancakeFreeLeft` L4、`pancakeUI` L5、`pancakeValid` L6、`pancakeRoute` L37

## 錢包與結算接點

**扣款（開始一局）**
- L16 `pancakeValid`：`S.balance-=fee;`
- L22 `pancakeValid`：`S.balance-=n;`

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- L12 `pancakeValid`：`if(S.balance<fee){pancakeUI(LOW_MSG);`
- L21 `pancakeValid`：`if(!pancakeValid(source)||!PANCAKE.active||n<=0||S.balance<n)return false;`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L15 `pancakeValid`：`PANCAKE.analytics=AN.start('pancake',fee,free?{entry_kind:'free_pass'}:undefined);`
- L23 `pancakeValid`：`AN.progress(PANCAKE.analytics,{phase:'buy_noodles',extra_points:n});`
- L29 `pancakeValid`：`AN.end(PANCAKE.analytics,0,'complete',{score:served,cleared:data&&data.passed?1:0,extra_spent_points:PANCAKE.…`
- L32 `pancakeValid`：`if(pancakeValid(source)&&PANCAKE.active)AN.progress(PANCAKE.analytics,{step:Math.max(0,Math.floor(Number(serv…`
- L33 `pancakeValid`：`if(pancakeValid(source)&&PANCAKE.active)AN.progress(PANCAKE.analytics,{phase:'revive'},true);`
- L34 `pancakeValid`：`if(pancakeValid(source)&&PANCAKE.active)AN.resume(PANCAKE.analytics);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`ENTRY_FEE`、`LOW_MSG`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/controls.js` 會呼叫：`pancakeUI`
- `js/navigation.js` 會呼叫：`pancakeRoute`
- 「重設為 500 點」進行中防護（`js/controls.js`）：無法判斷（沒有偵測到狀態名稱）

## 規則摘要（取自 GAME_RULES.md）

定位：`games/pancake/original.html`（獨立子頁，以 iframe `src` 載入，圖片在 `games/pancake/assets/`）、`games/pancake/game.js` 的 `PANCAKE`、`deepSeaPancake`。子頁可單獨開啟（自己讀寫同一個餘額 Key），嵌入大廳時扣點與 GA4 一律交給父頁。

玩法：俯視平底鍋，晃手機（傾斜30度內）讓煎餅滑動防黏鍋，外圈光暈變金黃時往上甩一下翻面，第二面金黃再甩一下起鍋；沒有動作感應時用手指拖曳（晃）與快速上滑放開（甩），桌機另有方向鍵＋空白鍵。第1晚煎3片過關。每面熟度：0～1.2秒生、1.2～2.0秒金黃、2.0～2.8秒有點焦、2.8秒黑炭。兩面金黃為完美，有一面生的不算片數也不扣泡麵。初始3包泡麵、上限5，掉地上／黏天花板／黑炭／被媽媽抓到各扣一包，連續3片完美補一包。第3片會出現一次「媽媽開門」，需靜止1.5秒。

點數：按「開火」或「再煎一次」時父頁 `start` 扣固定10點並送 game_start，開啟畫面、暫停恢復不扣費；沒有點數返還，煎好片數、本機事件與稱號都不是共用點數。泡麵用完時三個選項：

- 用30點換5包泡麵：父頁 `spend` 扣點並送 `game_progress`（`phase=buy_noodles`、`extra_points`），可重複，餘額不足不可換。
- 看5秒示範廣告：之後30分鐘（`deep-sea-free-until`）本遊戲開局不扣點，泡麵用完可免費補3包。只有泡麵煎餅讀取此 Key，其他遊戲照常扣點；示範廣告不是真實廣告。
- 不煮了：直接結算。

結算（過關、放棄或大廳的「結束本局」）只送一次 `finish`，game_end 為 complete、payout_points=0，附 `score`（煎好片數）、`cleared`、`extra_spent_points`。重新整理放棄回合、不退款。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/pancake/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
