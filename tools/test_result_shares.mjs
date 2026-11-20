// Result share links: D1 migrations on node:sqlite, real Worker routes, page rendering.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { route } from '../backend/src/routes/api.mjs';
import worker from '../backend/src/index.mjs';
import site from '../site/worker.mjs';
import { readShareCommand } from '../backend/src/services/shares.mjs';
import { SHARE_ID, shareCopy, shareLang } from '../shared/share-games.mjs';

const dir = new URL('../backend/migrations/', import.meta.url);
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON');
for (const file of readdirSync(dir).filter(name => name.endsWith('.sql')).sort()) {
  sqlite.exec(readFileSync(new URL(file, dir), 'utf8'));
}

// Minimal D1 surface used by the Worker services.
const db = {
  prepare(sql) {
    let params = [];
    const statement = {
      bind: (...values) => { params = values; return statement; },
      first: async () => sqlite.prepare(sql).get(...params) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
      run: async () => sqlite.prepare(sql).run(...params),
    };
    return statement;
  },
};
const env = { DB: db, FRONTEND_ORIGIN: 'https://ticaticagames.com', SITE_ORIGIN: 'https://ticaticagames.com' };
const call = (path, init = {}) => route(new Request('https://api.test' + path, init), db, env);
const post = (path, token, body) => call(path, {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const player = await (await call('/api/v1/players', { method: 'POST' })).json();
const other = await (await call('/api/v1/players', { method: 'POST' })).json();
const round = await (await post('/api/v1/boards/rounds', player.token, { gameId: 'bird' })).json();

// Unfinished rounds cannot be shared.
let response = await post('/api/v1/shares', player.token, { gameId: 'bird', roundId: round.id, lang: 'zh-Hant' });
assert.equal(response.status, 409);
assert.equal((await response.json()).error, 'round_unfinished');

sqlite.prepare('UPDATE ranked_boards SET score = 1234 WHERE id = ?').run(round.id);

// Another guest cannot share someone else's round.
response = await post('/api/v1/shares', other.token, { gameId: 'bird', roundId: round.id, lang: 'zh-Hant' });
assert.equal(response.status, 404);
response = await call('/api/v1/shares', { method: 'POST', body: '{}' });
assert.equal(response.status, 401);

// Invalid commands are rejected before touching the database.
for (const body of [
  { gameId: 'crash', roundId: round.id },
  { gameId: 'bird', roundId: 'nope' },
  { gameId: 'bird', roundId: round.id, score: 99999 },
  [],
]) {
  response = await post('/api/v1/shares', player.token, body);
  assert.equal(response.status, 400, JSON.stringify(body));
}
assert.equal(await readShareCommand(new Request('https://x', { method: 'POST', body: 'x'.repeat(2000) })), null);

response = await post('/api/v1/shares', player.token, { gameId: 'bird', roundId: round.id, lang: 'zh-Hant' });
assert.equal(response.status, 201);
const share = await response.json();
assert.match(share.id, SHARE_ID);
assert.equal(share.path, '/s/' + share.id);
assert.equal(share.score, 1234);
assert.equal(Object.hasOwn(share, 'playerId'), false);

// Same round always maps to the same link; the stored score is a snapshot.
response = await post('/api/v1/shares', player.token, { gameId: 'bird', roundId: round.id, lang: 'en' });
assert.equal((await response.json()).id, share.id);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM result_shares').get().n, 1);

// Share page: Open Graph preview, escaped content, no player ID.
sqlite.prepare('UPDATE players SET display_name = ? WHERE id = ?').run('<b>魚</b>', player.id);
response = await call(share.path);
assert.equal(response.status, 200);
assert.match(response.headers.get('Content-Type'), /^text\/html/);
assert.match(response.headers.get('Content-Security-Policy'), /default-src 'none'/);
let html = await response.text();
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /<meta property="og:title" content="便便鳥大戰狼群｜跑了 1,234 公尺">/);
assert.match(html, new RegExp(`<meta property="og:url" content="https://ticaticagames.com/s/${share.id}">`));
assert.match(html, /og:image" content="https:\/\/ticaticagames.com\/images\/ticatica-logo.png"/);
assert.match(html, /href="https:\/\/ticaticagames.com\/#bird"/);
assert.match(html, /&lt;b&gt;魚&lt;\/b&gt;/);
assert.equal(html.includes('<b>魚</b>'), false);
assert.equal(html.includes(player.id), false);

html = await (await call(share.path + '?lang=en')).text();
assert.match(html, /<html lang="en">/);
assert.match(html, /og:title" content="Poop Bird vs Wolves \| Ran 1,234 m"/);

response = await call(share.path, { method: 'HEAD' });
assert.equal(response.status, 200);
assert.equal(await response.text(), '');
assert.equal((await call('/s/ZZZZZZZZZZ')).status, 404);
assert.equal((await call(share.path, { method: 'POST' })).status, 405);
assert.equal((await call('/s/short')).status, 404);

// Through the Worker entry: browser navigation (no Origin header) is allowed.
response = await worker.fetch(new Request('https://api.test' + share.path), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://api.test/api/v1/shares', {
  method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}',
}), env);
assert.equal(response.status, 403);

// Main-site Worker forwards only share paths to the API binding.
const seen = [];
const siteEnv = {
  API: { fetch: request => { seen.push('api ' + new URL(request.url).pathname); return new Response('api'); } },
  ASSETS: { fetch: request => { seen.push('assets ' + new URL(request.url).pathname); return new Response('asset'); } },
};
await site.fetch(new Request('https://ticaticagames.com/s/' + share.id), siteEnv);
await site.fetch(new Request('https://ticaticagames.com/s/short'), siteEnv);
await site.fetch(new Request('https://ticaticagames.com/index.html'), siteEnv);
assert.deepEqual(seen, ['api /s/' + share.id, 'assets /s/short', 'assets /index.html']);

assert.equal(shareLang('en-US'), 'en');
assert.equal(shareLang('zh-Hant'), 'zh');
assert.equal(shareCopy('bird', 'brag', 'en', 1234), 'I ran 1,234 m in Poop Bird vs Wolves. Can you beat that?');
assert.equal(shareCopy('bird', 'brag', 'zh', 1234), '我在《便便鳥大戰狼群》跑了 1,234 公尺，你能超越嗎？');

// Every shareable game is a visible catalog game with a valid score param and icon.
const { SHARE_GAMES } = await import('../shared/share-games.mjs');
const catalog = JSON.parse(readFileSync(new URL('../games/catalog.json', import.meta.url), 'utf8'));
const visible = new Set(catalog.filter(game => !game.hidden).map(game => game.id));
for (const [id, game] of Object.entries(SHARE_GAMES)) {
  assert.ok(visible.has(id), id + ' is a visible game');
  assert.match(game.param, /^[a-z_]+$/, id + ' param');
  assert.ok(readFileSync(new URL('../' + game.art, import.meta.url)).length > 0, id + ' art');
  assert.ok(readFileSync(new URL('../' + game.image, import.meta.url)).length > 0, id + ' image');
  for (const lang of ['zh', 'en']) assert.ok(game.result[lang].includes('{score}') && game.unit[lang], id + ' ' + lang);
}
for (const id of visible) {
  if (id !== 'keno') assert.ok(Object.hasOwn(SHARE_GAMES, id), id + ' has share settings');
}
console.log('PASS result share links');
