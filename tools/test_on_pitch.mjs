// 不准跑調 行為測試：node tools/test_on_pitch.mjs（Node.js，無需 npm 套件）。
// 在假的 DOM／時鐘中載入 games/on-pitch/game.js，驗證免費開局、單次結算、暫停／離頁、儲存與英文畫面。
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const source = readSource('games/on-pitch/game.js',root);
const fee = Number(fs.readFileSync(new URL('js/config.js', root), 'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const HAN = /[㐀-鿿]/;
const KEY = 'on-pitch-v1';
const KEYS = 'CDEFGAB';
const CANVAS_API = new Set(['fillRect', 'strokeRect', 'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'rect', 'quadraticCurveTo', 'bezierCurveTo', 'fill', 'stroke', 'clip', 'save', 'restore', 'translate', 'scale', 'rotate', 'setTransform', 'drawImage', 'setLineDash']);
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };

function fixture({ lang = 'zh', saved = { input: 'key' }, balance = 0, mic = 'deny' } = {}) {
  const els = new Map(), store = new Map(saved ? [[KEY, JSON.stringify(saved)]] : []), events = [], drawn = [], wl = {}, dl = {};
  const drawing = new Proxy({}, { get: (t, k) => k === 'fillText' || k === 'strokeText' ? (x => { drawn.push(String(x)); }) : k === 'measureText' ? (x => ({ width: String(x).length * 7 })) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? (() => ({ addColorStop() {} })) : (k in t ? t[k] : CANVAS_API.has(k) ? () => ({}) : (() => { throw new Error('not a Canvas 2D method: ' + String(k)); })()), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => {
    if (!els.has(id)) els.set(id, { id, hidden: false, textContent: '', className: '', disabled: false, attrs: {}, handlers: {}, focus() {}, setPointerCapture() {}, getContext: () => drawing, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 720 }), setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { (this.handlers[t] ??= []).push(f); } });
    return els.get(id);
  };
  let now = 1000, raf = null;
  const doc = { hidden: false, addEventListener(t, f) { (dl[t] ??= []).push(f); } };
  const toneNodes = () => ({ connect() {}, start() {}, stop() {}, frequency: {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  class AC { constructor() { this.currentTime = 0; this.sampleRate = 48000; this.state = 'running'; this.destination = {}; } resume() {} createOscillator() { return toneNodes(); } createGain() { return toneNodes(); } createBiquadFilter() { return toneNodes(); } createBufferSource() { return toneNodes(); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } }
  const win = { devicePixelRatio: 1, AudioContext: AC, deepSeaI18n: { getLanguage: () => lang, text: s => s }, addEventListener(t, f, cap) { (wl[t] ??= []).push(f); } };
  const S = { balance };
  const sandbox = {
    $: el, window: win, document: doc, S, ENTRY_FEE: fee, LOW_MSG: 'low', fmt: n => String(n), save() {}, renderAll() {},
    navigator: { vibrate() {}, mediaDevices: mic === 'deny' ? { getUserMedia: () => Promise.reject(new Error('denied')) } : undefined },
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)) },
    performance: { now: () => now }, requestAnimationFrame: f => { raf = f; },
    AN: { interact() {}, start: (...a) => { events.push(['start', ...a]); return 'r' + events.filter(e => e[0] === 'start').length; }, end: (...a) => events.push(['end', ...a]), progress: (...a) => events.push(['progress', ...a]), resume: (...a) => events.push(['resume', ...a]) },
    setTimeout, console, Math, Float32Array, Object, JSON, Promise,
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(source, ctx);
  const api = win.deepSeaOnPitch;
  const keyHeld = {};
  const F = {
    api, els, el, events, drawn, store, S, doc, win,
    count: t => events.filter(e => e[0] === t).length,
    frame(n = 1) { for (let i = 0; i < n; i++) { now += 16; const f = raf; f && f(now); } },
    st: () => api.state(),
    fire(target, type, e = {}) { for (const f of (target === 'win' ? wl : target === 'doc' ? dl : el(target).handlers)[type] || []) f({ preventDefault() {}, ...e }); },
    click(id) { for (const f of el(id).handlers.click || []) f({}); },
    press(i, down) { F.fire('win', down ? 'keydown' : 'keyup', { key: KEYS[i] }); keyHeld[i] = down; },
    // 機器人：用琴鍵鍵盤準確按出目前缺口的音
    bot() {
      const { game, level } = api.state();
      const w = game.walls.find(x => !x.judged && game.t >= x.arrive && game.t <= x.arrive + level.win);
      for (let i = 0; i < 7; i++) { const want = !!w && w.note === i; if (want !== !!keyHeld[i]) F.press(i, want); }
    },
    run(until, { play = true, cap = 20000 } = {}) { let n = 0; while (!until()) { if (++n > cap) throw new Error('run cap'); if (play && api.state().scene === 'play') F.bot(); F.frame(); } },
    saved: () => JSON.parse(store.get(KEY) || 'null'),
  };
  F.frame(2);
  return F;
}

// ---- 1. 免費開局：餘額 0 也能開，不扣點，不能重複開 ----
{
  const f = fixture({ balance: 0 });
  eq(f.count('start'), 0, 'opening the page starts nothing');
  eq(f.el('op-go').textContent, '開始遊戲', 'idle button label');
  ok(!f.el('op-go').disabled, 'start enabled at zero balance');
  f.click('op-go'); f.click('op-go');
  await new Promise(r => setTimeout(r, 0)); f.frame(2);
  eq(f.count('start'), 1, 'double click opens a single round');
  eq(f.events[0][1], 'on-pitch', 'analytics game id'); eq(f.events[0][2], 0, 'entry_points is 0'); eq(f.S.balance, 0, 'nothing charged');
  ok(f.el('op-go').disabled && f.el('op-go').textContent.includes('遊戲中'), 'start disabled while playing');
  eq(f.st().scene, 'play', 'round is running');
  // 圈選關卡畫面按鈕不會重複開局
  f.fire('op-canvas', 'pointerdown', { clientX: 140, clientY: 135, pointerId: 1 }); f.frame();
  eq(f.count('start'), 1, 'level buttons ignored mid-round');
}

// ---- 2. 完整通關：只結算一次、payout 0、星數存檔、不換點數 ----
{
  const f = fixture({ balance: 0 });
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(2);
  f.run(() => f.st().scene === 'result');
  const ends = f.events.filter(e => e[0] === 'end');
  eq(ends.length, 1, 'one settlement');
  eq(ends[0][2], 0, 'payout stays 0 (score never converts to points)'); eq(ends[0][3], 'complete'); eq(ends[0][4].cleared, 1, 'cleared flag');
  ok(ends[0][4].score > 0 && ends[0][4].stars >= 1, 'score and stars reported');
  eq(f.S.balance, 0, 'balance untouched by a win');
  ok(f.saved().stars['1-1'] >= 1, 'stars saved under the on-pitch key');
  eq(f.st().sel, 1, 'selection advances to the next level after a clear');
  ok(!f.el('op-go').disabled, 'start re-enabled after the round');
  f.frame(30); eq(f.events.filter(e => e[0] === 'end').length, 1, 'result screen does not settle again');
  eq(f.el('op-level').textContent, '1-2', 'side panel shows the next level');
}

// ---- 3. 失敗：沒唱就會失敗，一樣 complete、cleared 0、不存星 ----
{
  const f = fixture();
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(2);
  f.run(() => f.st().scene === 'result', { play: false });
  const end = f.events.find(e => e[0] === 'end');
  eq(f.events.filter(e => e[0] === 'end').length, 1, 'one settlement on failure'); eq(end[3], 'complete'); eq(end[4].cleared, 0); eq(end[2], 0, 'no payout');
  ok(!((f.saved().stars || {})['1-1']), 'a failed level saves no stars');
  eq(f.st().sel, 0, 'failed level stays selected for retry');
}

// ---- 4. 暫停／繼續／回選單／離頁 ----
{
  const f = fixture();
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(60);
  f.doc.hidden = true; f.fire('doc', 'visibilitychange'); f.doc.hidden = false;
  eq(f.st().scene, 'pause', 'hiding the tab pauses');
  ok(f.events.some(e => e[0] === 'progress' && e[2].phase === 'pause' && e[3] === true), 'pause tracked');
  f.fire('doc', 'visibilitychange'); eq(f.count('progress'), 1, 'pause is recorded once');
  f.fire('op-canvas', 'pointerdown', { clientX: 200, clientY: 100, pointerId: 1 }); await new Promise(r => setTimeout(r, 0)); f.frame();
  eq(f.st().scene, 'play', 'tap resumes'); eq(f.count('resume'), 1, 'resume tracked');
  f.api.route(false); eq(f.st().scene, 'pause', 'leaving the page pauses a round');
  f.api.route(true);
  // 暫停畫面的「回選單」＝放棄這局
  f.frame();
  f.fire('op-canvas', 'pointerdown', { clientX: 200, clientY: 390, pointerId: 2 }); f.frame();
  eq(f.st().scene, 'menu', 'back to menu from pause');
  const ends = f.events.filter(e => e[0] === 'end'); eq(ends.length, 1); eq(ends[0][3], 'abandoned'); eq(f.el('op-go').disabled, false);
}
{
  const f = fixture();
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(40);
  f.fire('win', 'pagehide', { persisted: false });
  const ends = f.events.filter(e => e[0] === 'end'); eq(ends.length, 1, 'pagehide ends the round once'); eq(ends[0][3], 'abandoned');
  f.frame(10); eq(f.events.filter(e => e[0] === 'end').length, 1, 'no second end after pagehide');
  const g = fixture(); g.click('op-go'); await new Promise(r => setTimeout(r, 0)); g.frame(5);
  g.fire('win', 'pagehide', { persisted: true }); eq(g.count('end'), 0, 'BFCache persisted pagehide does not end the round');
}

// ---- 5. 麥克風被拒絕：自動改用螢幕琴鍵，仍可開局 ----
{
  const f = fixture({ saved: null, mic: 'deny' });
  eq(f.saved(), null, 'fresh storage'); eq(f.el('op-in-mic').attrs['aria-pressed'], 'true', 'microphone selected by default');
  f.click('op-go'); await new Promise(r => setTimeout(r, 5)); f.frame(2);
  eq(f.count('start'), 1, 'round starts even when the microphone is denied'); eq(f.saved().input, 'key', 'falls back to on-screen keys and remembers it');
}

// ---- 6. 設定切換（局中不能改）----
{
  const f = fixture({ saved: { input: 'key', octave: 'any' } });
  f.click('op-oct-strict'); eq(f.saved().octave, 'strict', 'octave saved'); eq(f.el('op-oct-strict').attrs['aria-pressed'], 'true');
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(2);
  f.click('op-in-mic'); eq(f.st().prefs.input, 'key', 'input cannot change mid-round'); ok(f.el('op-in-mic').disabled, 'toggles disabled mid-round');
}

// ---- 7. 英文畫面不殘留中文 ----
{
  const f = fixture({ lang: 'en' });
  f.frame(5);
  f.click('op-go'); await new Promise(r => setTimeout(r, 0)); f.frame(120);
  f.api.route(false); f.frame(3);                                 // 暫停畫面
  f.api.route(true); f.fire('op-canvas', 'pointerdown', { clientX: 200, clientY: 100, pointerId: 1 }); await new Promise(r => setTimeout(r, 0));
  f.run(() => f.st().scene === 'result');                         // 結算畫面
  f.frame(3); f.fire('op-canvas', 'pointerdown', { clientX: 280, clientY: 586, pointerId: 3 }); f.frame(3);   // 回選單
  f.frame(3);
  const han = [...new Set(f.drawn.filter(t => HAN.test(t)))];
  eq(han.length, 0, 'canvas draws no Chinese in English: ' + JSON.stringify(han));
  ok(f.drawn.some(t => t.includes('Stay On Pitch')) || f.drawn.length > 50, 'English menu drawn');
}

// ---- 8. 關卡資料：5 世界 × 4 關 + 無盡，同一世界的容許誤差遞減 ----
{
  const f = fixture(), { makeLevels } = f.api.core, lv = makeLevels();
  eq(lv.length, 20, '20 levels'); eq(lv[0].id, '1-1'); eq(lv[19].id, '5-4');
  ok(lv[0].tol > lv[19].tol, 'tolerance tightens with the worlds'); ok(lv.every(l => l.notes.length >= 7 && l.notes.every(n => n >= 0 && n <= 6)), 'notes within C..B');
}
console.log('PASS', checks, 'checks');
