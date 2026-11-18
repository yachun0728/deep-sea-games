# 荒島遠征 Frontier Islands（frontier）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#frontier`　分類：益智策略　狀態：顯示中
- 大廳卡片：「砍出道路，建立據點，挑戰五大區域與五十關考驗。」｜遠征與續玩皆免費 · 50 關 · 自動存檔
- 追蹤名稱（GA4 `game_name`）：荒島遠征，`game_id` 為 `frontier`
- 檔案：`games/frontier/VALIDATION.md`、`games/frontier/card.html`、`games/frontier/draw.js`、`games/frontier/game.js`、`games/frontier/icon.svg`、`games/frontier/style.css`、`games/frontier/view.html`、`games/frontier/world.js`；`game.js` 共 80 行、11.1 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「46. 荒島遠征 Frontier Islands（frontier）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-frontier`、`ft-main`、`ft-full`、`ft-zone`、`ft-level`、`ft-health`、`ft-objective`、`ft-stage`、`ft-canvas`、`ft-overlay`、`ft-title`、`ft-message`、`ft-go`、`ft-stick`、`ft-knob`、`ft-dash`、`ft-bag`、`ft-stock`、`ft-pause`、`ft-record`、`ft-map`、`ft-select`、`ft-select-label`、`ft-select-yes`、`ft-select-no`、`ft-tool`、`ft-blade`、`ft-pack`、`ft-upgrade`、`ft-storage`

## 狀態與常數

- 狀態物件／進行中旗標：`frontierBusy`（L2）

## 函式索引（game.js，行號為宣告位置）

`set` L13、`safeNumbers` L14、`validShape` L15、`loadFrontier` L16、`persist` L27、`params` L28、`release` L29、`endRound` L30、`pause` L31、`start` L32、`selectLevel` L45、`updateMap` L46、`update` L47、`finishStage` L62、`frame` L63、`moveStick` L72

## 錢包與結算接點

**扣款（開始一局）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**入帳（領回／獎勵）**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

**餘額檢查**
- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）

- 入場費常數 `ENTRY_FEE` 在本檔出現 1 次、餘額不足訊息 `LOW_MSG` 0 次（定義在 `js/config.js`）。
- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。

## 追蹤（GA4）

- L30 `endRound`：`AN.end(round,0,result,params());`
- L31 `pause`：`AN.progress(round,params(),true);`
- L38 `start`：`round=AN.start('frontier',ENTRY_FEE,params());`
- L42 `start`：`if(round)AN.resume(round,params());`
- L42 `start`：`else round=AN.start('frontier',0,params());`
- L62 `finishStage`：`AN.progress(round,params(),true);`
- L68 `frame`：`AN.progress(round,params(),false);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-frontier-v1`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`AN`、`renderAll`、`save`、`ENTRY_FEE`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 「重設為 500 點」進行中防護（`js/controls.js`）：已涵蓋：`frontierBusy`

## 規則摘要（取自 GAME_RULES.md）

五區各十關，共50關；同一模擬規則以關卡種子產生不同資源與敵人位置，木材廠與鐵匠鋪上下交替，箭塔與燈塔位置偏移。不是50張手繪地圖。每區任務順序為建設、救援、討伐、守點、精英、救援、守點、討伐、精英、首領。完成任務後投入木材、石材修復燈塔過關。建設關需擊敗 ceil(守衛數×0.65)，討伐關全部擊敗；救援兩人需清除附近130距離內敵人；守點須建箭塔、存活指定秒數並清除所有增援；精英／首領需擊敗指定大怪。

遠征完全免費，保存進度後，續關、刷新續玩、重試、重遊均免費；沒有點數獎勵與BONUS。新Key `deep-sea-frontier-v1` 保存 version、paid、cleared 與完整 world。不遷移或改動舊Key，回復程式時可保留此鍵，舊版忽略。每5秒、升級、通關及暫停存檔；失敗重建當關，保留科技；新關重建當地資源與建築；可確認後重玩已解鎖關卡。最高通關與科技為本機資料，沒有帳號同步或防作弊。存檔不可用仍可免費遊玩，但無法保存；跨遠征與錢包兩個Key不是原子交易，異常關閉／跨分頁並行不保證強一致。

靠近53距離內資源自動採集，背包24+9×容量等級，14秒資源再生；靠近營地67距離卸貨入倉庫。靠近地基68距離每0.07秒投入各1材料（背包優先，再用倉庫）。木材廠每3秒產2木1石；鐵匠鋪+9傷害；箭塔235射程，每0.8秒傷害22+3×武器等級。營地總計每關最多補35生命，每秒7；科技最高8級，每級花20+22×現有等級木材、floor(木材費×0.65)石材，限營地100距離。工具影響單次採量與採集速度，武器基礎傷害16+5×等級，自動攻擊間隔0.58秒，衝刺冷卻2.2秒、前0.3秒無敵，受到攻擊有0.6秒無敵。

令 c=floor((關卡−1)/10)、n=(關卡−1)%10：木材基準24+6c+2n，石材14+4c+n；守衛4+2c+floor(n/2)，生命36+13c+3n，傷害9+3c+floor(n/3)，預告max(0.62,1.18−0.09c−0.015n)秒。精英3倍生命、區域首領7倍生命（僅戰鬥數值，不是點數倍率）。第2關起衝刺怪、第4關起遠程怪；第三區起9秒循環地面危險，6秒時預告、7.2秒後生效；第四區未建鐵匠鋪移速84%。守點2+c波，每波2+c怪、相隔12秒，需24+6c秒且所有增援清除。150−12c秒後夜幕逐漸增速，70秒增1級、最多4級，不會自動逾時失敗。數值尚需真人長時間試玩校準。

每次嘗試一次start、過關progress/end（payout=0）；下關與重試另建免費回合。暫停progress(checkpoint=1)、繼續resume；切換遊戲／失焦／背景暫停並釋放輸入，不自動恢復。刷新當關從保存點恢復，舊回合abandoned、新回合entry=0。手機搖桿＋衝刺、桌面WASD／方向鍵＋空白；FullScreen API可用時支援全螢幕，不可用則顯示提示。中英文沿用頁首切換，不重開關卡。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/frontier/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
