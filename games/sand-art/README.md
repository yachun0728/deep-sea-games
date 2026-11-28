# 沙沙時光 Sand & Chill（sand-art）

> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。

## 概覽

- 網址：`#sand-art`　分類：益智策略　狀態：顯示中
- 大廳卡片：「挑開黃紙，自由混色，讓沙粒慢慢沾附成畫。」｜不限次數 · 療癒手作
- 追蹤名稱（GA4 `game_name`）：沙沙時光，`game_id` 為 `sand-art`
- 檔案：`games/sand-art/QA.md`、`games/sand-art/app.js`、`games/sand-art/card.html`、`games/sand-art/cover.webp`、`games/sand-art/engine.js`、`games/sand-art/game.js`、`games/sand-art/icon.svg`、`games/sand-art/pictures-detailed.js`、`games/sand-art/play.css`、`games/sand-art/play.html`、`games/sand-art/style.css`、`games/sand-art/view.html`；`game.js` 共 22 行、2.8 KB

- 完整規則與公式：[GAME_RULES.md](../../docs/GAME_RULES.md) 的「沙沙時光（sand-art）」（下方「規則摘要」已複製）

## 畫面元素（view.html 的 id）

`view-sand-art`、`sand-frame`

## 狀態與常數

- 狀態物件／進行中旗標：（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）
- L2 常數：`SART`

## 函式索引（game.js，行號為宣告位置）

`sArtValid` L3、`sArtFrame` L4、`sArtLanguage` L5、`sArtPicture` L6、`sArtEnd` L7、`sArtRoute` L19

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

- L7 `sArtEnd`：`AN.end(round,0,result,params||{});`
- L12 `sArtEnd`：`SART.round=AN.start('sand-art',0,{picture:picture});`
- L13 `sArtEnd`：`AN.progress(SART.round,{phase:'pause',picture:SART.picture},true);`
- L14 `sArtEnd`：`SART.round=AN.start('sand-art',0,{picture:picture});`
- L14 `sArtEnd`：`AN.resume(SART.round,{picture:SART.picture});`

- 契約見 [ANALYTICS.md](../../docs/ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。

## 儲存（localStorage）

- （沒有使用）

## 平台共用相依

- 直接使用的共用名稱：`AN`（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）
- `js/navigation.js` 會呼叫：`sArtRoute`
- 平台已移除重設點數功能；沒有重設按鈕或點數重設處理器。

## 規則摘要（取自 GAME_RULES.md）

- Sand & Chill 是沒有競賽分數、倒數或勝負的手作沙畫沙盒。主大廳排第一款，先選十八張圖之一（小朋友款 12 張，含星花曼陀羅、彩窗蝴蝶、錦鯉蓮池、孔雀開屏、浪花與富士、夜燈老街；大人款 6 張：千瓣曼陀羅、玫瑰花窗、繁花獅王、羽紋貓頭鷹、花紋海龜、花磚拼盤，每張約 260～580 個可撕區塊含輪廓線，細線吸附範圍較小、不顯示畫紙底部英文字），再挑紙、選色、長按倒沙及緩慢推沙。
- 12 色可複選或全取消；同時最多 5,000 粒鬆沙，已黏顆粒不佔額度。實際接觸白膠才黏附，黃紙不黏，原色不混成新色。
- 誤撕可按畫板左下「貼回」（電腦按 Z），從最近撕的一塊開始逐步貼回；已黏住沙的區塊不能貼回（提示後略過），不會移除任何沙粒。換紙清除撕紙紀錄。貼回不新增追蹤事件。
- 牙籤挑紙，刮板與毛刷推鬆沙，沙匙少量倒沙。手機感測僅由玩家按鈕觸發；電腦用滑鼠與方向鍵，設定內另有方向鈕。
- 首次選紙後提供可跳過的四步提示，按實際操作進展；設定→玩法可重看。換紙明確提示清除作品；沒有自動儲存或匯出。
- 本款不直接操作錢包、不設單局獎勵、帳號、廣告或付款。因沒有競賽指標，不提交排行榜。沿用平台有效遊玩時間追蹤與全站規則。
- 欣賞記為 admired，不作 complete 通關或發完成點數。選畫／設定／說明不計有效遊玩時間；離開立即暫停物理、音訊與操作，返回保留當頁作品。

## 修改檢查清單

- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。
- 改 `games/sand-art/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。
- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。
- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。
