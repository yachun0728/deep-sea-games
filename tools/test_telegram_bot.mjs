// node tools/test_telegram_bot.mjs (no packages). Telegram bot Worker: commands, languages, buttons, webhook secret.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker, { buildReply, languageFor, gameUrl, campaignFrom, RANDOM_GAMES, SITE } from '../telegram-bot/src/index.mjs';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('games/catalog.json', root), 'utf8'));
const visible = new Set(catalog.filter(g => !g.hidden).map(g => g.id));
const names = {};
for (const line of fs.readFileSync(new URL('games/README.md', root), 'utf8').split('\n')) {
  const m = line.match(/^\| \[(.+?)\]\(.+?\) \| `#(.+?)` \|/);
  if (m) names[m[2]] = m[1];
}

const msg = (text, { lang = 'zh-hant', type = 'private' } = {}) => ({ text, chat: { id: 42, type }, from: { language_code: lang } });
const firstButton = reply => reply.reply_markup.inline_keyboard[0][0];
const urlOf = b => b.web_app?.url ?? b.url;

// Random picks and the daily game must stay visible and keep their catalog names.
assert.ok(RANDOM_GAMES.length >= 5);
for (const [id, name] of RANDOM_GAMES) {
  assert.ok(visible.has(id), `random pick ${id} is hidden or removed`);
  assert.equal(name, names[id], `random pick ${id} name drifted from games/README.md`);
}
assert.equal(new Set(RANDOM_GAMES.map(g => g[0])).size, RANDOM_GAMES.length);
assert.ok(visible.has('keno'));

// Language mapping follows the site languages.
assert.equal(languageFor('zh-hant'), 'zh-Hant');
assert.equal(languageFor('zh-TW'), 'zh-Hant');
assert.equal(languageFor('zh-hk'), 'zh-Hant');
assert.equal(languageFor('zh'), 'en');
assert.equal(languageFor('zh-hantx'), 'en');
assert.equal(languageFor('zh-hans'), 'en');
assert.equal(languageFor('zh-CN'), 'en');
assert.equal(languageFor('en'), 'en');
assert.equal(languageFor('ja'), 'en');
assert.equal(languageFor(undefined), 'en');
const UTM = 'utm_source=telegram&utm_medium=bot';
assert.equal(gameUrl('', 'en'), SITE + '?lang=en&' + UTM + '&utm_campaign=organic');
assert.equal(gameUrl('clock-out', 'zh-Hant', { campaign: 'ads_nov', content: 'random' }),
  SITE + '?lang=zh-Hant&' + UTM + '&utm_campaign=ads_nov&utm_content=random#clock-out');

// Deep-link channel: only Telegram-valid start parameters become utm_campaign.
assert.equal(campaignFrom('/start'), 'organic');
assert.equal(campaignFrom('/start ads_nov'), 'ads_nov');
assert.equal(campaignFrom('/start@TicaticaBot channel-01'), 'channel-01');
assert.equal(campaignFrom('/start  friend '), 'friend');
assert.equal(campaignFrom('/start bad%20value'), 'organic');
assert.equal(campaignFrom('/start ' + 'a'.repeat(65)), 'organic');
assert.equal(campaignFrom('/start ' + 'a'.repeat(64)), 'a'.repeat(64));
assert.equal(campaignFrom('/start 廣告'), 'organic');

// Every command answers in the chat with the expected destination.
const expected = { start: '', play: '', daily: '#keno', leaderboard: '#lobby' };
for (const [command, hash] of Object.entries(expected)) {
  const reply = buildReply(msg('/' + command));
  assert.equal(reply.method, 'sendMessage');
  assert.equal(reply.chat_id, 42);
  const b = firstButton(reply);
  assert.ok(b.web_app, `${command} uses a web_app button in private chats`);
  assert.equal(new URL(b.web_app.url).hash, hash);
  const params = new URL(b.web_app.url).searchParams;
  assert.equal(params.get('lang'), 'zh-Hant');
  assert.equal(params.get('utm_source'), 'telegram');
  assert.equal(params.get('utm_medium'), 'bot');
  assert.equal(params.get('utm_campaign'), 'organic');
  assert.equal(params.get('utm_content'), command);
}
const tagged = new URL(urlOf(firstButton(buildReply(msg('/start ads_nov'))))).searchParams;
assert.equal(tagged.get('utm_campaign'), 'ads_nov');
assert.equal(tagged.get('utm_content'), 'start');
// The start tag is not remembered: other commands (even with arguments) stay organic.
assert.equal(new URL(urlOf(firstButton(buildReply(msg('/play ads_nov'))))).searchParams.get('utm_campaign'), 'organic');
assert.equal(new URL(urlOf(firstButton(buildReply(msg('/random'), () => 0)))).searchParams.get('utm_content'), 'random');
const random = buildReply(msg('/random'), () => 0.999999);
assert.equal(new URL(urlOf(firstButton(random))).hash, '#' + RANDOM_GAMES.at(-1)[0]);
assert.ok(random.text.includes(RANDOM_GAMES.at(-1)[1]));
assert.equal(new URL(urlOf(firstButton(buildReply(msg('/random'), () => 0)))).hash, '#' + RANDOM_GAMES[0][0]);
const help = buildReply(msg('/help'));
assert.equal(help.reply_markup, undefined);
for (const c of ['/play', '/random', '/daily', '/leaderboard', '/help']) assert.ok(help.text.includes(c));

// Languages: English by default (including Simplified/plain zh tags), with matching lang in the link.
const en = buildReply(msg('/start', { lang: 'en' }));
assert.match(en.text, /Welcome/);
assert.doesNotMatch(en.text + firstButton(en).text, /[一-鿿]/);
assert.equal(new URL(urlOf(firstButton(en))).searchParams.get('lang'), 'en');
for (const lang of ['zh-hans', 'zh', 'fr']) {
  const reply = buildReply(msg('/play', { lang }));
  assert.match(reply.text, /game lobby/);
  assert.equal(new URL(urlOf(firstButton(reply))).searchParams.get('lang'), 'en');
}

// Groups: plain url buttons, /cmd@Bot works, unknown commands stay silent.
const group = buildReply(msg('/play@TicaticaBot', { type: 'supergroup' }));
assert.equal(firstButton(group).web_app, undefined);
assert.equal(firstButton(group).url, SITE + '?lang=zh-Hant&' + UTM + '&utm_campaign=organic&utm_content=play');
assert.equal(buildReply(msg('/other', { type: 'group' })), null);
assert.equal(buildReply(msg('/other')).text, help.text);
assert.equal(buildReply(msg('/PLAY extra')).text, buildReply(msg('/play')).text);

// Non-commands and malformed updates are ignored.
assert.equal(buildReply(msg('hello')), null);
assert.equal(buildReply(undefined), null);
assert.equal(buildReply({ text: '/play' }), null);

// Webhook: secret required, ignored updates still get 200.
const env = { WEBHOOK_SECRET: 's3cret-value' };
const post = (body, secret = env.WEBHOOK_SECRET) => new Request('https://bot.example/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(secret ? { 'X-Telegram-Bot-Api-Secret-Token': secret } : {}) },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
assert.equal((await worker.fetch(post({ message: msg('/play') }, null), env)).status, 403);
assert.equal((await worker.fetch(post({ message: msg('/play') }, 'wrong-value!'), env)).status, 403);
assert.equal((await worker.fetch(post({ message: msg('/play') }), {})).status, 403);
const ok = await worker.fetch(post({ update_id: 1, message: msg('/play') }), env);
assert.equal(ok.status, 200);
assert.equal((await ok.json()).method, 'sendMessage');
assert.equal((await worker.fetch(post({ update_id: 2, edited_message: msg('/play') }), env)).status, 200);
assert.equal((await worker.fetch(post('not json'), env)).status, 200);
assert.equal((await worker.fetch(new Request('https://bot.example/'), env)).status, 200);

console.log('telegram bot ok');
