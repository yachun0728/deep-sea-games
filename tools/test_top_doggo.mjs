// TOP DOGGO: Paw City 行為測試：父頁橋接（免費、單次開局／結算、離頁、重送）與遊戲頁字串表。無需 npm 套件。
// 排行榜 Worker 驗證另見 tools/test_top_doggo_board.mjs。用法：node tools/test_top_doggo.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readSource } from './expand_ids.mjs';

const root = new URL('../', import.meta.url);
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(JSON.stringify(a), JSON.stringify(b), m); checks++; }; // vm 內外的物件原型不同，以 JSON 比較

// ---------- 父頁橋接 ----------
{
  const els = new Map(), events = [], sent = [];
  const el = id => {
    if (!els.has(id)) els.set(id, { textContent: '', hidden: false, contentWindow: { calls: [], setTopDoggoActive(a) { this.calls.push(['active', a]); }, setTopDoggoLanguage(l) { this.calls.push(['lang', l]); } }, onload: null });
    return els.get(id);
  };
  const win = { deepSeaI18n: { getLanguage: () => 'en' }, listeners: {}, addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }, dispatchEvent(e) { events.push(['dispatch', e.type, e.detail]); } };
  const loc = { hash: '#top-doggo' };
  let startCount = 0, failStart = false;
  const fakeApi = {
    startBoardRound: async gameId => { startCount++; if (failStart) throw new Error('offline'); return { token: 't', id: 'round-' + startCount, revision: 0, state: { issuedAt: 1, score: null }, gameId }; },
    moveBoardRound: async (token, move) => { sent.push(move); return { id: move.id, revision: 1, state: { score: move.action[0] } }; },
    createApiClient: () => ({ leaderboard: async gameId => ({ entries: [], gameId }) }), arcadeApiOrigin: () => 'x',
  };
  const ctx = {
    $: el, window: win, location: loc, AbortSignal, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }, setTimeout, Promise,
    AN: { interact() {}, start: (...a) => { events.push(['start', ...a]); return 'r' + events.filter(e => e[0] === 'start').length; }, end: (...a) => events.push(['end', ...a]) },
  };
  vm.createContext(ctx);
  vm.runInContext(readSource('games/top-doggo/game.js', root), ctx);
  ctx.tdApi = async () => fakeApi;
  const api = win.deepSeaTopDoggo, frame = el('td-frame').contentWindow;
  ok(api, 'bridge available');
  eq(api.getLanguage(frame), 'en', 'language follows the site');
  ok(!api.prepare({}, 'normal'), 'foreign window rejected');
  ok(!api.prepare(frame, 'insane'), 'unknown difficulty rejected');
  ok(api.prepare(frame, 'normal'), 'prepare accepted');
  eq(events.filter(e => e[0] === 'start').length, 1, 'analytics start once');
  eq(events[0].slice(1, 3), ['top-doggo', 0], 'free entry: stake 0');
  const done = await api.finish(frame, { difficulty: 'normal', level: 4, kills: 31, playMs: 80000, reason: 'dead' });
  eq(done, { saved: true }, 'score saved');
  eq(sent[0], { gameId: 'top-doggo-normal', id: 'round-1', revision: 0, action: [4, 31, 80000] }, 'move carries [level, kills, playMs] on the normal board');
  const end = events.filter(e => e[0] === 'end');
  eq(end.length, 1, 'one analytics end');
  eq([end[0][2], end[0][3], end[0][4].score], [0, 'loss', 4], 'payout 0, loss, score = level');
  eq(await api.finish(frame, { difficulty: 'normal', level: 9, kills: 90, playMs: 1e6, reason: 'dead' }), { saved: false, offline: true }, 'a second finish cannot resend the same round');
  eq(sent.length, 1, 'no second move');
  // each difficulty uses its own board
  for (const d of ['easy', 'hard']) {
    api.prepare(frame, d);
    await api.finish(frame, { difficulty: d, level: 2, kills: 10, playMs: 30000, reason: 'left' });
    eq(sent.at(-1).gameId, 'top-doggo-' + d, d + ' board');
  }
  eq(events.filter(e => e[0] === 'end').at(-1)[3], 'abandoned', 'leaving is abandoned');
  // difficulty mismatch between prepare and finish never submits
  api.prepare(frame, 'easy');
  eq(await api.finish(frame, { difficulty: 'hard', level: 5, kills: 40, playMs: 90000, reason: 'dead' }), { saved: false, offline: true }, 'board mismatch is not sent');
  // offline start: finish degrades without throwing
  failStart = true;
  api.prepare(frame, 'normal');
  eq(await api.finish(frame, { difficulty: 'normal', level: 3, kills: 20, playMs: 60000, reason: 'dead' }), { saved: false, offline: true }, 'offline start keeps local play working');
  failStart = false;
  // leaving the view tells the game page to end the run; entering reactivates it
  ctx.tdRoute(true);
  ok(el('td-frame').src === 'games/top-doggo/play.html', 'frame loads the game page on first entry');
  ctx.tdRoute(false);
  ok(frame.calls.some(c => c[0] === 'active' && c[1] === false), 'leaving deactivates the game page');
  // page hide while a round is open is abandoned once
  api.prepare(frame, 'normal');
  const before = events.filter(e => e[0] === 'end').length;
  win.listeners.pagehide[0]({ persisted: false });
  eq(events.filter(e => e[0] === 'end').length, before + 1, 'pagehide abandons the open round');
  api.exit(frame);
  eq(loc.hash, 'lobby', 'exit returns to the lobby');
}

// ---------- 遊戲頁：字串表與模板 ----------
{
  const html = fs.readFileSync(new URL('games/top-doggo/play.html', root), 'utf8');
  const table = name => {
    const m = html.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n  \\});'));
    ok(m, name + ' table exists');
    return vm.runInNewContext('(' + m[1] + ')');
  };
  const EN = table('EN'), HANS = table('HANS');
  const han = /[一-鿿]/;
  eq(Object.keys(EN).sort(), Object.keys(HANS).sort(), 'English and Simplified tables have the same keys');
  for (const [k, v] of Object.entries(EN)) ok(!han.test(v), 'English value has no Chinese: ' + k);
  for (const [k, v] of Object.entries(HANS)) ok(v.trim() && k !== undefined, 'Simplified value present: ' + k);
  // every L('…') literal used by the page is translated
  const used = new Set([...html.matchAll(/\bL\('((?:[^'\\]|\\.)*)'/g)].map(m => m[1]));
  for (const text of used) if (han.test(text)) ok(text in EN, 'L() text has an English entry: ' + text);
  // mission and weapon names/descriptions and the static overlay text are in the tables too
  for (const m of html.matchAll(/(?:text|name|how): '([^']*[一-鿿][^']*)'/g)) ok(m[1] in EN, 'table entry for ' + m[1]);
  const markup = html.slice(html.indexOf('<body'), html.indexOf('<script src'));
  for (const m of markup.matchAll(/<(?:div|span|button|b)[^>]*>([^<>]*[一-鿿][^<>]*)</g)) ok(m[1].trim() in EN, 'static text translated: ' + m[1].trim());
  ok(!html.includes('__doggo'), 'no test hook in the shipped page');
  ok(!/proto-grand|PROTOTYPE|WASTED|🏆|🎯/.test(html), 'no prototype tag, borrowed wording or emoji');
  ok(html.includes('data-i18n-ignore'), 'page is self-localized');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  assert.doesNotThrow(() => new vm.Script(script), 'game script compiles');
  checks++;
}
console.log('PASS: TOP DOGGO bridge and string tables (' + checks + ' checks)');
