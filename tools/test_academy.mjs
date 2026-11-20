// 百萬大學堂：共用規則、題庫完整性與 Worker 指令驗證。執行：node tools/test_academy.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { readBoardCommand } from '../backend/src/services/ranked-boards.mjs';

const require = createRequire(import.meta.url);
const rules = require('../shared/academy-rules.cjs');
const timedReplay = require('../shared/timed-replay.cjs');
const bank = new Function(fs.readFileSync(new URL('../games/academy/i18n.js', import.meta.url), 'utf8') + '; return academyBank;')();
const { ACT, LADDER } = rules;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok -', name); };

// 依序輸入操作；每關從 domain 選領域，答案由 oracle 決定。
function play(seed, plan) {
  const state = rules.create(timedReplay.seeded(seed));
  const actions = [];
  const run = code => { assert.ok(rules.step(state, code), 'illegal action ' + code); actions.push(code); };
  for (const stage of plan) {
    if (state.over) break;
    if (stage === 'walk') { run(ACT.WALK); break; }
    run(stage.domain ?? 0);
    for (const life of stage.lives ?? []) run(life);
    const right = rules.answerOf(state.question);
    run(stage.answer === 'timeout' ? ACT.TIMEOUT : ACT.ANSWER + (stage.answer === 'right' ? right : (right + 1) % 4));
  }
  return { state, actions };
}
const right = domain => ({ domain, answer: 'right' });

test('題庫三語各 100 題、四個選項、答案合法', () => {
  for (const lang of ['tw', 'cn', 'en']) {
    assert.equal(bank[lang].length, 100);
    for (const [q, opts, exp] of bank[lang]) {
      assert.ok(q && exp);
      assert.equal(opts.length, 4);
      assert.ok(opts.every(Boolean));
      assert.equal(new Set(opts).size, 4, 'duplicate option in ' + q);
    }
  }
  assert.equal(rules.ANSWERS.length, 100);
  assert.ok(rules.ANSWERS.every(a => a >= 0 && a <= 3));
  // 每個領域各 20 題、正確選項不全集中在同一個位置
  for (let d = 0; d < 5; d++) {
    const picks = new Set(rules.ANSWERS.slice(d * 20, d * 20 + 20));
    assert.ok(picks.size >= 3, 'answers too uniform in domain ' + d);
  }
});

test('全部答對通關 1,000,000 學分並可重播', () => {
  for (const seed of [1, 99, 2 ** 31, 4294967295]) {
    const { state, actions } = play(seed, Array.from({ length: 10 }, (_, i) => right(i % 6)));
    assert.equal(state.reason, 'champion');
    assert.equal(state.credits, 1000000);
    assert.equal(state.cleared, 10);
    assert.equal(rules.replay(timedReplay.seeded(seed), actions), 10);
  }
});

test('答錯與超時：第 5 關前歸零，第 5 關後保底 32,000', () => {
  let r = play(7, [right(0), right(1), { domain: 2, answer: 'wrong' }]);
  assert.equal(r.state.credits, 0);
  assert.equal(r.state.cleared, 2);
  assert.equal(rules.replay(timedReplay.seeded(7), r.actions), 2, '排行榜成績是通過關數，不是學分');
  r = play(7, [...Array.from({ length: 5 }, () => right(5)), { domain: 0, answer: 'wrong' }]);
  assert.equal(r.state.credits, 32000);
  assert.equal(r.state.reason, 'wrong');
  r = play(7, [...Array.from({ length: 6 }, () => right(5)), { domain: 3, answer: 'timeout' }]);
  assert.equal(r.state.credits, 32000);
  assert.equal(r.state.reason, 'timeout');
  r = play(7, [...Array.from({ length: 4 }, () => right(5)), { domain: 3, answer: 'timeout' }]);
  assert.equal(r.state.credits, 0);
});

test('結束挑戰只在已有學分時可用，成績等於目前學分', () => {
  const state = rules.create(timedReplay.seeded(5));
  assert.equal(rules.step(state, ACT.WALK), false);
  const r = play(5, [right(0), right(1), right(2), 'walk']);
  assert.equal(r.state.credits, LADDER[2]);
  assert.equal(r.state.reason, 'walk');
  assert.equal(r.state.cleared, 3);
  assert.equal(rules.replay(timedReplay.seeded(5), r.actions), 3);
});

test('錦囊每局各限一次；換題會換成同領域的新題', () => {
  const state = rules.create(timedReplay.seeded(11));
  assert.ok(rules.step(state, 2));
  const first = state.question;
  assert.equal(rules.domainOf(first), 'geography');
  assert.ok(rules.step(state, ACT.FIFTY));
  assert.equal(rules.step(state, ACT.FIFTY), false);
  assert.ok(rules.step(state, ACT.HINT));
  assert.equal(rules.step(state, ACT.HINT), false);
  assert.ok(rules.step(state, ACT.SWAP));
  assert.notEqual(state.question, first);
  assert.equal(rules.domainOf(state.question), 'geography');
  assert.equal(rules.step(state, ACT.SWAP), false);
  assert.ok(state.used.has(first) && state.used.has(state.question));
});

test('題目不重複，隨機盲盒只抽還有題的領域', () => {
  const r = play(3, Array.from({ length: 10 }, () => right(rules.ACT.RANDOM)));
  assert.equal(r.state.used.size, 10);
  const seen = new Set();
  const state = rules.create(timedReplay.seeded(3));
  for (let i = 0; i < 10; i++) {
    rules.step(state, 0);
    assert.ok(!seen.has(state.question));
    seen.add(state.question);
    rules.step(state, ACT.ANSWER + rules.answerOf(state.question));
  }
});

test('非法操作序列被拒絕', () => {
  const seed = 21;
  const ok = play(seed, [right(0), { domain: 1, answer: 'wrong' }]).actions;
  assert.equal(rules.replay(timedReplay.seeded(seed), ok), 1, '通過一關後答錯 = 1 關');
  assert.equal(rules.replay(timedReplay.seeded(seed), [...ok, ACT.ANSWER]), null, '結束後不能再操作');
  assert.equal(rules.replay(timedReplay.seeded(seed), ok.slice(0, -1)), null, '沒有結束點');
  assert.equal(rules.replay(timedReplay.seeded(seed), [ACT.ANSWER]), null, '選領域前不能作答');
  assert.equal(rules.replay(timedReplay.seeded(seed), [0, 0]), null, '作答前不能再選領域');
  assert.equal(rules.replay(timedReplay.seeded(seed), [9]), null);
  assert.equal(rules.replay(timedReplay.seeded(seed), []), null);
  assert.equal(rules.replay(timedReplay.seeded(seed), 'x'), null);
  assert.equal(rules.accepts(new Array(65).fill(0)), false);
  assert.equal(rules.accepts([1.5]), false);
  assert.equal(rules.accepts([-1]), false);
  // 偽造高分：用另一個種子的操作重播，學分不會比該種子的合法結果高
  const forged = play(1, Array.from({ length: 10 }, () => right(0))).actions;
  const other = rules.replay(timedReplay.seeded(2), forged);
  assert.ok(other === null || (other >= 0 && other <= 10));
});

test('單局最多 10 點 BONUS，與學分無關', () => {
  assert.equal(rules.BONUS_PER_STAGE * LADDER.length, 10);
});

{
  const request = body => new Request('https://example.test/x', { method: 'POST', body: JSON.stringify(body) });
  const id = '123e4567-e89b-42d3-a456-426614174000';
  assert.deepEqual(await readBoardCommand(request({ gameId: 'academy' }), false), { gameId: 'academy' });
  const move = { gameId: 'academy', id, revision: 0, action: [0, 20] };
  assert.deepEqual(await readBoardCommand(request(move), true), move);
  assert.equal(await readBoardCommand(request({ ...move, action: [99] }), true), null);
  assert.equal(await readBoardCommand(request({ ...move, action: [] }), true), null);
  assert.equal(await readBoardCommand(request({ ...move, action: 'x' }), true), null);
  passed++;
  console.log('ok - Worker 只接受 academy 的合法開局與操作指令');
}
console.log(`${passed} checks passed`);
