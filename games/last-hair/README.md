# 尊嚴保衛戰 The Last Hair（last-hair）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#last-hair`　分類：潛行偷閒　狀態：顯示中
- 大廳卡片：「頂著最後三根頭髮，在強風中走完 500 公尺去面試。」｜立即開玩 · 雙拇指操作
- 追蹤名稱（GA4 `game_name`）：尊嚴保衛戰，`game_id` 為 `last-hair`
- 檔案：`games/last-hair/card.html`、`games/last-hair/cover.webp`、`games/last-hair/game.js`、`games/last-hair/icon.svg`、`games/last-hair/style.css`、`games/last-hair/view.html`；`game.js` 共 457 行、36.9 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「36. 尊嚴保衛戰 The Last Hair（last-hair）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-last-hair`、`lh-canvas`、`lh-dist`、`lh-hairs`、`lh-best`、`lh-pause`、`lh-amount`、`lh-go`、`lh-msg`、`lh-rank-status`、`lh-rank-retry`

## 狀態與常數

- 狀態物件／進行中旗標：`SFX`（L62）、`hairBusy`（L2）
- L7 常數：`SCENE_H`
- L8 常數：`DPR`
- L10 常數：`FONT`
- L20 常數：`REWARDS`
- L21 常數：`RANK_ORDER`
- L22 常數：`RANKS`
- L28 常數：`CAUSE`
- L29 常數：`WIN_MSG`
- L30 常數：`HAIR_LEFT`
- L31 常數：`TIPS`
- L62 常數：`SFX`
- L114 常數：`INK`、`PAPER`
- L151 常數：`SKIN`
- L171 常數：`WALK_RECTS`
- …另有 2 行常數宣告，請直接搜尋大寫名稱

## 函式索引（game.js，行號為宣告位置）

`artReady` L19、`lsSet` L36、`lerp` L44、`hash` L45、`padBox` L46、`say` L47、`setText` L49、`aliveN` L50、`ui` L51、`audioInit` L59、`tone` L60、`vib` L61、`addFloat` L63、`end` L65、`milestones` L82、`handleEvents` L90、`txt` L109、`rrect` L110、`bar` L111、`mix` L112、`inkBox` L115、`drawScene` L116、`drawStreaks` L146、`drawHair` L152、`walkFrameAt` L173、`clipLegs` L174、`clipUpper` L175、`drawMan` L183、`handFont` L206、`paintedText` L207、`drawPaper` L210、`drawEventsWorld` L217、`bannerList` L226、`uiText` L238、`paintPlate` L239、`hudIcon` L245、`paintedMeter` L249、`distanceLayout` L255、`drawHUD` L264、`drawControls` L291、`wrapC` L311、`TOGGLES` L318、`drawReady` L319、`drawOver` L331、`draw` L350、`fitViewport` L361、`shown` L371、`toLocal` L372、`clampT` L373、`recomputePress` L374、`clearInput` L375、`pauseNow` L376、`start` L377、`endPointer` L418、`loop` L436

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- L84 `milestones`：`S.balance+=pts;`

**餘額檢查**
- L381 `start`：`if(amount>S.balance){say(LOW_MSG,'lose');`

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 1 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L76 `end`：`AN.end(analytics,earned,earned>0?'complete':'loss',{score:Math.floor(g.dist),step:earned,stage:Math.min(4,rew…`
- L85 `milestones`：`AN.progress(analytics,{stage:rewarded,step:earned,score:Math.floor(g.dist),bonus_points:pts,total_bonus_point…`
- L383 `start`：`analytics=AN.start('last-hair',amount);`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-last-hair-best`（讀）
- `deep-sea-last-hair-deaths`（讀）
- `deep-sea-last-hair-sound`（讀）
- `deep-sea-last-hair-swap`（讀）

## 平台共用相依

- 直接使用的共用名稱：`S`、`AN`、`renderAll`、`save`、`fmt`、`ENTRY_FEE`、`LOW_MSG`、`reduceMotion`、`C`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`shown`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

定位：`hairBusy` 所在 IIFE（`createGame` 純邏輯＋畫布介面）。畫布 400×720，只在 `view-last-hair` 顯示且分頁可見時更新，切換遊戲、背景分頁、換 hash 會暫停並清掉按住狀態。操作技巧遊戲：頂著最後 3 根頭髮在強風中走完 500 公尺。手機雙拇指：左半邊畫面滑動脖子（傾斜 −1～1）、右半邊按住「死命壓住」；桌機滑鼠左右移動歪頭、按住壓頭，或 ←→／A D 歪頭、空白鍵／J／↓ 壓頭；可在待機畫面對調左右手與開關音效。

- 入場：每局固定扣 `ENTRY_FEE`（10 點），按「扣點開始出門」一次扣除並呼叫 `AN.start('last-hair')`；餘額不足顯示 `LOW_MSG`；進行中按鈕停用，重複點擊不再扣。
- 風：依路段有風向與變向預警；受風量 E＝|風|×(1−0.75×對齊度)＋下沉氣流（第 4 路段），壓頭 ×0.25。三根頭髮抗風係數 1.0／1.2／0.85，先流失髮膠（黃條）再掉髮根（紅條），掉光一根頭髮飛走並短暫慢動作，三根全掉光結束；壓頭可回復髮膠。
- 喘息：250–266 公尺（約 2.7 秒）風力上限降到 0.3、不排新事件，進入橫幅「風停了…喘口氣」（`CONFIG.calm`，`at: []` 可關閉）。只影響節奏與難度，不影響里程碑。
- 限制：歪頭超過 85% 連續 3 秒脖子抽筋僵直 2 秒；壓頭累積手汗（滿了壓不住），壓頭時路人側目，側目滿格社死（腳步變慢、被迫放手 1.5 秒）；頭髮越少走得越慢。四個路段（0–100／100–250／250–400／400–500 公尺）各有打招呼、傳單、滴水、鴿子亂流、面試官回頭等事件，皆有預警。
- BONUS（固定點數，不依入場費計算）：抵達 100／250／400／500 公尺立即入帳 1／2／3／4 點，每個里程碑每局只發一次（`rewarded` 記錄），全部達成共 10 點，剛好回本。入帳後頭髮掉光或重新整理都不扣回，入場點數不退；每次入帳 `AN.progress` 帶 `bonus_points` 與 `total_bonus_points`。結局稱號（S／A／絡腮鬍藝術家／B／C）只是顯示，頭髮根數與距離不給點數。結束時只呼叫一次 `AN.end`（本局有入帳為 complete，否則 loss；step＝入帳點數）。
- 重設 500 點：本局進行中（`hairBusy`）會被擋下並顯示提示；重設不算 BONUS。
- 最佳與設定：`deep-sea-last-hair-best`（最遠距離）、`-deaths`、`-swap`、`-sound`。
- 英文：所有介面與畫布文字都有 `locales/en.json` 條目；含數字的句子拆成固定片段。另在 `js/i18n.js` 的 `names` 清單加入 `The Last Hair`。
- 平衡（獨立機器人模擬，非真人數據，原型規格 `規格-尊嚴保衛戰-v0.1`）：不操作約 131 公尺死亡；只歪頭或只壓頭 0% 通關；平衡策略機器人 98–100% 通關、平均剩約 1.9 根；高手保 3 根 9–35%、S 級 0–7%。尚未做真人與 iOS Safari 實測，里程碑與難度為暫定。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/last-hair/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
