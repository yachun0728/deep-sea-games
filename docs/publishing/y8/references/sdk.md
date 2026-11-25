# Y8 SDK 設定與整合驗收

核對日：2026-11-23。
官方來源：[初始化憑證](https://docs.y8.com/studio/sdk-initialization/)、[JavaScript 初始化](https://docs.y8.com/sdk/intro/)、[廣告](https://docs.y8.com/sdk/advertising/)。每次實作前重新核對。

使用者提供的本次遊戲範例：Game ID `295027`，App ID `6b03ea57e1e0e654199f21fb`。本機資料暫以 Frontier Islands 歸檔；尚未登入 Portal 驗證這組 ID 對應的遊戲／工作室。其他遊戲必須取得自己的 ID，不能沿用。

官方確認：App ID 必填，使用廣告才需 Game ID／adConfig。SDK URL 為 `https://cdn.y8.com/minimal-sdk/2-0/y8.min.js`。等 `y8sdk.ready` 才取得實例，初始化一次，保留 `emitReadyEvent()` 補發事件避免 async 載入競態。`autoLogin: true` 是預設；`onAuth` 的失敗不能阻止訪客遊玩。

使用者提供的初始化片段（清理貼文跳脫字元；這不是已完成的遊戲整合）：

```html
<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>
<script>
let y8Sdk;
window.addEventListener('y8sdk.ready', function () {
  y8Sdk = y8.sdk();
  const appConfig = {
    appId: '6b03ea57e1e0e654199f21fb',
    autoLogin: true
  };
  // 只有遊戲決定使用廣告時才加入這個參數。
  const adConfig = {
    gameId: '295027',
    preloadAdBreaks: 'on',
    sound: 'on',
    onReady: () => {}
  };
  y8Sdk.init(appConfig, adConfig);
  y8Sdk.onAuth((user, error) => {
    if (error) console.error(error);
    // 在這裡更新遊戲登入狀態；保留訪客模式。
  });
}, { once: true });
if (window.y8 && window.y8.emitReadyEvent) {
  window.y8.emitReadyEvent();
}
</script>
```

上例含 adConfig 是為保存使用者提供的設定，不表示使用者已決定啟用廣告；無廣告版改用 `y8Sdk.init(appConfig)`。`preloadAdBreaks`／`sound` 的適用範圍依官方設定表，不可當作遊戲音訊控制。

廣告規則：呼叫 `showAd`；在 `beforeAd` 暫停並靜音，`afterAd` 恢復。不要在請求前暫停，因為無廣告／頻率限制時可能完全不觸發這兩個回呼。獎勵廣告須玩家主動選擇；`beforeReward` 呼叫 `showAdFn()` 才播放；只在 `adViewed` 發獎，`adDismissed` 不發。`adBreakDone` 記錄結果，不能作為發獎依據；Promise 失敗亦需處理。不得自行呼叫 `preroll`。

TiCATiCA 實作建議：把暫停原因分開管理（失焦、玩家暫停、廣告）；廣告結束僅解除廣告的暫停原因，不能強制把背景遊戲恢復。防連點與單次發獎，錯誤／無填充時維持可玩。不要把範例中的空函式當作已實作暫停／音訊。未授權玩法變更時，只記錄獎勵位置為待確認，不新增復活或貨幣獎勵。

驗收至少涵蓋：SDK 先／後載入、只初始化一次、登入失敗仍可玩、廣告完成、提前關閉、無填充、頻率限制、Promise 失敗、擋廣告、廣告期間切分頁、重複點擊與重複回呼。僅有 `y8Sdk` 變數不代表廣告系統已 ready；`onReady` 與實際回呼仍需觀察。開發網域／手機測試來源須在 Portal 登錄 Development Origins，效期 30 天。

以上是準備與驗收指引；套用到遊戲程式需依本次使用者授權與專案規範執行，不自行發布。
