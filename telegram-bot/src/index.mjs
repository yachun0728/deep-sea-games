// TICATICA GAMES Telegram bot: answers six commands with a short message and a button that opens the site.
// Replies are returned in the webhook response itself, so this Worker never needs the bot token.
// No storage, wallet, leaderboard or analytics access; only WEBHOOK_SECRET is required.

export const SITE = 'https://ticaticagames.com/';

// Curated random picks. Names copy games/README.md; tools/test_telegram_bot.mjs checks each id is still visible.
export const RANDOM_GAMES = [
  ['mines', '踩地雷 Minesweeper'],
  ['merge', '養珠 Pearl Merge'],
  ['runner', '閃避跑酷：深海快遞 Dodge Run'],
  ['sneak', '偷偷下班 Sneak Out'],
  ['cat', '屋頂貓貓 Rooftop Cat'],
  ['nap', '偷睡大師 Nap Master'],
  ['skybuilder', '蓋樓大師 Sky Builder'],
  ['carp', '鯉魚躍龍門 Carp Leap'],
  ['clock-out', '下班保衛戰 Clock Out'],
  ['breakout', '打磚塊 Breakout'],
  ['office-shoot', '拒絕加班 No Overtime!'],
  ['ocean-link', '深海連連看 Ocean Link'],
  ['tetris', '俄羅斯方塊 Block Drop'],
  ['quack-pond', '呱呱池塘 Quack Pond'],
  ['siege-architect', '萌獸破城隊 Critter Crashers'],
  ['book-sort', '貓咪疊書舖 Cat Book Stack'],
];

const TEXT = {
  'zh-Hant': {
    welcome: '🌊 歡迎來到 TICATICA GAMES 深海遊樂場！\n免費小遊戲，免下載、免註冊，點下方按鈕就能開始玩。',
    lobby: '🎮 遊戲大廳在這裡，挑一款開始吧！',
    random: name => `🎲 今天就玩這款：${name}`,
    daily: '⛏️ 每日免費挖金礦：每天 3 次免費機會，挖到的點數會存進你的帳戶。',
    leaderboard: '🏆 進入大廳後往下捲，就能看到各遊戲排行榜。挑戰最佳紀錄吧！',
    help: '可用指令：\n/play 開啟遊戲大廳\n/random 隨機推薦一款遊戲\n/daily 每日免費挖金礦\n/leaderboard 查看排行榜\n/help 使用說明',
    openLobby: '開啟大廳',
    play: '開始玩',
    dig: '去挖金礦',
    board: '看排行榜',
  },
  en: {
    welcome: '🌊 Welcome to TICATICA GAMES, the Deep Sea Arcade!\nFree mini games. No download, no sign-up. Tap below to play.',
    lobby: '🎮 Here is the game lobby. Pick one and dive in!',
    random: name => `🎲 Try this one today: ${name}`,
    daily: '⛏️ Daily free Gold Digger: 3 free runs a day. Points you dig go straight to your balance.',
    leaderboard: '🏆 Scroll down in the lobby to see every game’s leaderboard. Go for your best!',
    help: 'Commands:\n/play open the game lobby\n/random get a random game pick\n/daily daily free Gold Digger\n/leaderboard view leaderboards\n/help how to use',
    openLobby: 'Open lobby',
    play: 'Play',
    dig: 'Go dig',
    board: 'Leaderboards',
  },
};

// English by default. Telegram has no official Chinese UI: community language packs often report "zh-hans"
// or plain "zh" even when the user reads Traditional Chinese, so only explicit Traditional tags get zh-Hant.
export function languageFor(code) {
  return /^zh-(hant|tw|hk|mo)\b/.test(String(code || '').toLowerCase()) ? 'zh-Hant' : 'en';
}

// GA4 reads utm_* from page_location. Telegram's in-app browser sends no referrer, so without these
// visits from the bot would show up as (direct) / (none).
export const DEFAULT_CAMPAIGN = 'organic';

// Channel tag from a deep link such as t.me/<bot>?start=ads_nov, which arrives as "/start ads_nov".
// Telegram only allows A-Z a-z 0-9 _ - (up to 64) in start parameters; anything else is ignored.
export function campaignFrom(text) {
  const payload = String(text || '').trim().split(/\s+/)[1] || '';
  return /^[A-Za-z0-9_-]{1,64}$/.test(payload) ? payload : DEFAULT_CAMPAIGN;
}

export function gameUrl(hash, language, { campaign = DEFAULT_CAMPAIGN, content } = {}) {
  const url = new URL(SITE);
  url.searchParams.set('lang', language);
  url.searchParams.set('utm_source', 'telegram');
  url.searchParams.set('utm_medium', 'bot');
  url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  if (hash) url.hash = hash;
  return url.href;
}

// web_app buttons open inside Telegram but only work in private chats; groups get a normal link.
function button(text, hash, language, isPrivate, tracking) {
  const url = gameUrl(hash, language, tracking);
  return isPrivate ? { text, web_app: { url } } : { text, url };
}

export function buildReply(message, random = Math.random) {
  const text = typeof message?.text === 'string' ? message.text : '';
  const chat = message?.chat;
  if (!text.startsWith('/') || chat?.id == null) return null;

  const command = text.slice(1).split(/[\s@]/)[0].toLowerCase();
  const language = languageFor(message.from?.language_code);
  const t = TEXT[language];
  const isPrivate = chat.type === 'private';
  // Only /start carries a deep-link channel; the bot stores nothing, so later commands count as organic.
  const tracking = { campaign: command === 'start' ? campaignFrom(text) : DEFAULT_CAMPAIGN, content: command };
  const send = (body, label, hash) => ({
    method: 'sendMessage',
    chat_id: chat.id,
    text: body,
    ...(label ? { reply_markup: { inline_keyboard: [[button(label, hash, language, isPrivate, tracking)]] } } : {}),
  });

  switch (command) {
    case 'start':
      return send(t.welcome, t.openLobby, '');
    case 'play':
      return send(t.lobby, t.openLobby, '');
    case 'random': {
      const index = Math.min(RANDOM_GAMES.length - 1, Math.floor(random() * RANDOM_GAMES.length));
      const [hash, name] = RANDOM_GAMES[index];
      return send(t.random(name), t.play, hash);
    }
    case 'daily':
      return send(t.daily, t.dig, 'keno');
    case 'leaderboard':
      return send(t.leaderboard, t.board, 'lobby');
    case 'help':
      return send(t.help);
    default:
      // Ignore other commands in groups so the bot does not answer commands meant for other bots.
      return isPrivate ? send(t.help) : null;
  }
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('ok');
    if (!env.WEBHOOK_SECRET || !safeEqual(request.headers.get('X-Telegram-Bot-Api-Secret-Token'), env.WEBHOOK_SECRET)) {
      return new Response('forbidden', { status: 403 });
    }
    const update = await request.json().catch(() => null);
    const reply = buildReply(update?.message);
    // Always answer 200 so Telegram does not keep retrying updates the bot ignores.
    return reply ? Response.json(reply) : new Response('ok');
  },
};
