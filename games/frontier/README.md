# 荒島遠征 Frontier Islands（frontier）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#frontier`　分類：益智策略　狀態：顯示中
- 大廳卡片：「砍出道路，建立據點，挑戰五大區域與五十關考驗。」｜遠征與續玩皆免費 · 50 關 · 自動存檔
- 追蹤名稱（GA4 `game_name`）：荒島遠征，`game_id` 為 `frontier`
- 檔案：`games/frontier/AGENTS.md`、`games/frontier/ART_DIRECTION.md`、`games/frontier/VALIDATION.md`、`games/frontier/card.html`、`games/frontier/draw.js`、`games/frontier/game.js`、`games/frontier/icon.svg`、`games/frontier/style.css`、`games/frontier/view.html`、`games/frontier/world.js`；`game.js` 共 128 行、20.5 KB

- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「46. 荒島遠征 Frontier Islands（frontier）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-frontier`、`ft-main`、`ft-zone`、`ft-level`、`ft-health`、`ft-base-health`、`ft-journal`、`ft-full`、`ft-assault`、`ft-objective`、`ft-task-details`、`ft-checklist`、`ft-warning`、`ft-hauling`、`ft-army`、`ft-journal-stock`、`ft-stage`、`ft-canvas`、`ft-overlay`、`ft-title`、`ft-message`、`ft-browser-tip`、`ft-browser-tip-close`、`ft-go`、`ft-rotate`、`ft-rotate-exit`、`ft-stick`、`ft-knob`、`ft-dash`、`ft-bag`、`ft-stock`、`ft-coins`、`ft-workers`、`ft-home`、`ft-shop-toggle`、`ft-pause`、`ft-next`、`ft-shop`、`ft-shop-close`、`ft-sale-count`、`ft-building-effects`、`ft-recruit`、`ft-sell-wood`、`ft-sell-stone`、`ft-tool`、`ft-blade`、`ft-pack`、`ft-upgrade`、`ft-storage`、`ft-record`、`ft-map`、`ft-select`、`ft-select-label`、`ft-select-yes`、`ft-select-no`

## 狀態與常數

- 狀態物件／進行中旗標：`frontierBusy`（L2）

## 函式索引（game.js，行號為宣告位置）

`set` L14、`safeNumbers` L15、`validShape` L16、`loadFrontier` L17、`persist` L30、`params` L31、`release` L32、`endRound` L33、`pause` L34、`start` L35、`selectLevel` L48、`updateMap` L49、`update` L50、`finishStage` L70、`frame` L71、`moveStick` L82、`isHandheld` L85、`autoScreen` L86、`screenClass` L87、`syncOrientation` L88、`requestLandscape` L95、`enterScreen` L101、`fallback` L103、`exitScreen` L107、`showShop` L116

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

- L33 `endRound`：`AN.end(round,0,result,params());`
- L34 `pause`：`AN.progress(round,params(),true);`
- L41 `start`：`round=AN.start('frontier',0,params());`
- L45 `start`：`if(round)AN.resume(round,params());`
- L45 `start`：`else round=AN.start('frontier',0,params());`
- L70 `finishStage`：`AN.progress(round,params(),true);`
- L78 `frame`：`AN.progress(round,params(),false);`

- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- `deep-sea-frontier-v1`（寫、讀）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- 共用檔沒有直接呼叫本遊戲的函式。
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

五區各十關，共50關；同一模擬規則以關卡種子產生不同資源與敵人位置，木材廠與鐵匠鋪上下交替，箭塔與燈塔位置偏移。不是50張手繪地圖。每區任務順序為建設、救援、討伐、守點、精英、救援、守點、討伐、精英、首領。完成任務、小屋、市集、木材廠，以及第二區起的前線分倉，並清除所有敵營後才能修復燈塔；建好後可留島採集，按「前往下一島」才結束當關。建設關需擊敗 ceil(守衛數×0.65)，討伐關全部擊敗；救援兩人需清除附近130距離內敵人；守點須建箭塔、存活指定秒數並清除所有增援；精英／首領需擊敗指定大怪。

所有遠征、續關、刷新與重試免費，不操作平台點數，沒有點數獎勵或BONUS。金幣是遊戲內貨幣，與共用餘額獨立。新Key沿用 `deep-sea-frontier-v1`，仍保存 version、paid（歷史資格欄位）、cleared 與完整 world。每5秒、交易、升級、過關及暫停存檔；裝備、已撿金幣跨關及失敗保留，材料、建築與工人每關重建。舊62資源／6建築存檔以加法遷移補上小屋、市集、採石場、分倉、森林、工人與掉落陣列；不清除既有材料、科技、最高通關或目前位置，舊金幣缺少時從0起算。保留version=1，新欄位為相容擴充；退版前保留存檔副本，舊版不保證接受增大的陣列。非帳號同步、非防作弊；解析失敗不清除原始資料。

靠近53距離內資源自動採集，背包24+9×容量等級，14秒資源再生；靠近營地67距離卸貨入倉庫。靠近地基68距離每0.07秒投入各1材料（背包優先，再用倉庫）。小屋耗16木4石，招募2工人；市集耗12木6石；採石場耗18木12石，加1名採石工；救援工人加入採集隊。工人走向真實資源，每次採1+floor(工具等級/3)，背滿5後搬回最近可用營地／分倉；木材廠將採集間隔從1.1秒降到0.65秒，不憑空加料。分倉第二區起出現，耗30+6c木、20+4c石，提供卸貨與縮短工人搬運。鐵匠鋪+9傷害；箭塔235射程，每0.8秒傷害22+3×武器等級。營地總計每關最多補35生命，每秒7；科技最高8級，費用25+30×現有等級金幣，限營地105距離。靠近已建且未損壞的市集100距離可按5／10／25份出售倉庫材料：每木2金、每石3金，數量不足不交易。一般怪掉4+2c金、首領掉35+12c金，敵營掉25+8c金，65距離自動拾取，死亡只掉一次。工具影響單次採量與採集速度，武器基礎傷害16+5×等級，自動攻擊間隔0.58秒，衝刺冷卻2.2秒、前0.3秒無敵，受到攻擊有0.6秒無敵。

令 c=floor((關卡−1)/10)、n=(關卡−1)%10：木材基準24+6c+2n，石材14+4c+n；守衛4+2c+floor(n/2)，生命36+13c+3n，傷害9+3c+floor(n/3)，預告max(0.62,1.18−0.09c−0.015n)秒。精英3倍生命、區域首領7倍生命（僅戰鬥數值，不是點數倍率）。第2關起衝刺怪、第4關起遠程怪；第三區起9秒循環地面危險，6秒時預告、7.2秒後生效；第四區未建鐵匠鋪移速84%。守點2+c波，每波2+c怪、相隔12秒，需24+6c秒且所有增援清除。150−12c秒後夜幕逐漸增速，70秒增1級、最多4級，不會自動逾時失敗。數值尚需真人長時間試玩校準。

每次嘗試一次start、過關progress/end（payout=0）；下關與重試另建免費回合。暫停progress(checkpoint=1)、繼續resume；切換遊戲／失焦／背景暫停並釋放輸入，不自動恢復。刷新當關從保存點恢復，舊回合abandoned、新回合entry=0。手機搖桿或點地面移動，桌面WASD／方向鍵，空白衝刺可選。採集、建造、近戰、卸貨、拾幣與修復自動執行；返回營地按鈕是自動步行而非瞬移。點遊戲畫面／開始要求Fullscreen API，失敗使用固定全視窗fallback；所有交易、裝備與離島操作都在遊戲主框內，提供退出按鈕。中英文沿用頁首切換，不重開關卡。

地圖每區變大：寬1200+300c、高900+150c，資源160+45c個，約三分之二樹木。第三區起有c−1個敵營，每28秒最多補1怪，活怪35隻時停止補兵；每75秒敵襲，前10秒倒數，生成2+c名襲擊者。敵營需靠近78距離自動攻擊消滅。襲擊者優先找最近生產建築，附近120距離有人物時交戰；建築耐久歸零停工但不刪除，靠近68距離每0.25秒耗1木恢復8耐久，背包優先再用倉庫，確保破營仍可採木修復。箭塔損壞停止攻擊，小屋損壞工人停工；可修復重啟。雪地與火山沿用既有環境危險，並非新引擎或50張手繪地圖；尚未實作工人手動分配、推車、多路橋樑及多階段攻城。

美術設定、實際Canvas呈現與維護規範見 games/frontier/ART_DIRECTION.md，設定圖保存在 games/frontier/art/direction-board.png，遊戲內可開啟。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/frontier/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
