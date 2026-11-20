# TICATICA GAMES Telegram Bot

獨立的 Cloudflare Worker，負責回覆 Telegram 指令，並附上開啟 `https://ticaticagames.com` 的按鈕。不讀寫 D1、錢包、排行榜或 GA4，也不需要 Bot Token：回覆直接放在 webhook 的回應內容裡。

| 指令 | 回覆 | 按鈕開啟 |
| --- | --- | --- |
| `/start` | 歡迎訊息 | 大廳 |
| `/play` | 開啟遊戲大廳 | 大廳 |
| `/random` | 從 `RANDOM_GAMES` 隨機推薦一款 | `#<遊戲 id>` |
| `/daily` | 每日免費挖金礦 | `#keno` |
| `/leaderboard` | 提示在大廳往下捲可看排行榜 | `#lobby` |
| `/help` | 指令列表（私聊中的未知指令也回這個） | 無 |

- 預設英文。Telegram 沒有官方中文介面，社群語言包常回報 `zh-hans` 或 `zh`，即使使用者看的是繁體；因此只有明確的 `zh-hant`／`zh-tw`／`zh-hk`／`zh-mo` 用繁中，其餘一律英文。連結帶 `?lang=` 讓網站使用同一種語言，使用者仍可在網站上切換。
- 私聊使用 `web_app` 按鈕，在 Telegram 內開啟網站；群組只能用一般連結按鈕。群組中的未知指令不回應。
- 調整隨機推薦清單時，名稱要和 `games/README.md` 一致。執行 `node tools/test_telegram_bot.mjs` 會檢查。

## 第一次部署

以下指令都在 `telegram-bot/` 目錄執行。Token 與 secret 只在終端機輸入，不要寫進檔案或提交。

```bash
cd telegram-bot

# 1. 設定 webhook 驗證用的 secret（自行產生，例如 openssl rand -hex 32，記下來第 3 步要用）
npx wrangler secret put WEBHOOK_SECRET

# 2. 部署，記下輸出的 https://ticatica-telegram-bot.<帳號>.workers.dev
npx wrangler deploy
```

第 3 步會用到 BotFather 給的 Token。先在終端機設定變數：`read -s TOKEN`、`read -s SECRET`。

```bash
# 3. 把 webhook 指向 Worker，帶上同一組 secret
curl -s "https://api.telegram.org/bot$TOKEN/setWebhook" \
  --data-urlencode "url=https://ticatica-telegram-bot.<帳號>.workers.dev" \
  --data-urlencode "secret_token=$SECRET" \
  --data-urlencode 'allowed_updates=["message"]'

# 4. 註冊指令選單（英文為預設，中文介面另一組）
curl -s "https://api.telegram.org/bot$TOKEN/setMyCommands" -H 'Content-Type: application/json' -d '{"commands":[
  {"command":"start","description":"Get started with the Deep Sea Arcade"},
  {"command":"play","description":"Open the game lobby"},
  {"command":"random","description":"Get a random game pick"},
  {"command":"daily","description":"Daily free Gold Digger"},
  {"command":"leaderboard","description":"View game leaderboards"},
  {"command":"help","description":"How to use and command list"}]}'

curl -s "https://api.telegram.org/bot$TOKEN/setMyCommands" -H 'Content-Type: application/json' -d '{"language_code":"zh","commands":[
  {"command":"start","description":"開始使用，認識深海遊樂場"},
  {"command":"play","description":"開啟遊戲大廳"},
  {"command":"random","description":"隨機推薦一款遊戲"},
  {"command":"daily","description":"每日免費挖金礦"},
  {"command":"leaderboard","description":"查看各遊戲排行榜"},
  {"command":"help","description":"使用說明與指令列表"}]}'

# 5. 確認狀態：url 正確、pending_update_count 不持續增加、沒有 last_error_message
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo"
```

## 之後更新

修改 `src/index.mjs` 後執行 `node tools/test_telegram_bot.mjs`，再到 `telegram-bot/` 執行 `npx wrangler deploy`。webhook 與指令選單不必重設；只有改指令名稱或說明時才需要重跑第 4 步。

## 驗收

- 私聊送出六個指令：`/play` 等按鈕應在 Telegram 內開啟網站，網址的 hash 與語言正確。
- 群組送出 `/play@<Bot 名稱>`：應回一般連結按鈕。
- 不帶 secret 直接 POST 到 Worker：應回 403。
