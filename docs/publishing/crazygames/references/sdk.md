# CrazyGames HTML5 SDK v3

2026-11-23 核對：[初始化](https://docs.crazygames.com/sdk/intro/)、[Game](https://docs.crazygames.com/sdk/game/)、[Video ads](https://docs.crazygames.com/sdk/video-ads/)、[廣告要求](https://docs.crazygames.com/requirements/ads/)。實作時重查；以下是接線說明，不是完成的遊戲 adapter。

## 初始化

```html
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
```

於遊戲碼之前載入，SDK v3 需等待：

```js
await window.CrazyGames.SDK.init();
```

僅初始化一次，失敗保留核心遊玩（內部容錯要求）。此 HTML5 初始化不使用 Y8 的 App ID／Game ID，不可帶入 `295027` 或原 Y8 App ID。SDK 已載入不等於初始化完成；本機可測不代表平台認證／廣告已通過。

## 遊戲事件與音訊

- Basic 若有 SDK：真正可玩時 `game.gameplayStart()`；Full 在開始／續玩送 start、選單／暫停／關卡結束送 `game.gameplayStop()`。不要在僅失焦／離開遊戲區時額外送 stop，官方自行處理此情境。遊戲仍可依內部需求失焦暫停／靜音；分開管理本機狀態與平台事件。
- HTML5 的 `game.loadingStart()`／`loadingStop()` 描述載入；技術要求總覽將 loading 事件列為選配，不可用它代替 gameplayStart。
- Full 支援 `game.settings.muteAudio`，並透過 `game.addSettingsChangeListener()` 跟隨變更。平台 mute 的優先權高於遊戲音效開關。不要在廣告結束時覆寫平台靜音或玩家原本靜音。

## 廣告

Basic 不啟用廣告。Full 經確認營利與玩法設計後使用：

```js
window.CrazyGames.SDK.ad.requestAd('midgame', {
  adStarted: () => { /* 暫停、靜音；要接真實遊戲 */ },
  adFinished: () => { /* 解除本次廣告鎖、恢復適用狀態 */ },
  adError: (error) => { /* 同樣解除鎖，維持可玩 */ }
});
```

獎勵型使用 `rewarded`，玩家主動選擇，只在該請求 `adFinished` 發放已約定獎勵一次；`adError` 不發。不能把 Promise 完成或 Y8 的 `adViewed` 當此平台回呼。

官方要求：請求期間即阻擋操作／進度，直到 finished 或 error；真正播放的 `adStarted` 才靜音。於自然斷點請求 midgame，不在導覽／商店按鈕插廣告。獎勵可跳過且有替代取得方式，不強制廣告才可過關。

內部實作：以請求、廣告播放、玩家暫停與背景狀態分開控制，防連點／重複發獎；同步 throw、錯誤、無填充、擋廣告也要釋放本次鎖，不能強制恢復背景或原本暫停的遊戲。不自行加入新的復活／貨幣獎勵。

## 驗收

SDK 正常／延遲／失敗；開始與續玩事件不重複；首次 start 對應可玩狀態；muteAudio 與設定變更；廣告完成／錯誤／無填充／重複回呼／背景切換；Basic 停用廣告不留死按鈕。可用 `?muteAudio=true` 做官方提供的本機設定測試。最後仍需 Portal 預覽與 QA Tool。

帳號、Data、多人、banner 或內購若適用，另查該模組官方要求，不因本檔已有 SDK 初始化就宣稱全功能整合完成。
