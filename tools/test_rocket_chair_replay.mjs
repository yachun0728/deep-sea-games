import assert from 'node:assert/strict';
import rules from '../shared/rocket-chair-rules.js';
import replay from '../shared/timed-replay.cjs';

for (const seed of [1, 42, 1234]) {
  const state = rules.create(replay.seeded(seed));
  const actions = [];
  let tick = 0;
  function act(code) {
    if (rules.input(state, code)) actions.push(tick * rules.inputCount + code);
  }
  act(122);
  act(60);
  while (!state.game.done && tick < 6000) {
    if (tick % 160 === 0) act(121);
    rules.advance(state, .01);
    tick++;
  }
  assert.equal(state.game.cleared, true);
  assert.ok(state.score > 0);
  act(126);
  const proof = [tick + 1, ...actions];
  assert.equal(replay.verify(rules, seed, proof), state.score);
  assert.equal(replay.verify(rules, seed, [tick, ...actions]), null);
}
const timeout = rules.create(replay.seeded(42));
timeout.input(122);
for(let tick=0;tick<6001;tick++)rules.advance(timeout,.01);
assert.ok(timeout.game.done);
assert.ok(timeout.input(124));
assert.equal(timeout.game.meetingTotal,80);
assert.equal(timeout.input(124),false);
for(let tick=0;tick<2000;tick++)rules.advance(timeout,.01);
assert.ok(timeout.input(125));
assert.equal(timeout.game.meetingTotal,95);
assert.ok(timeout.input(126));
assert.equal(timeout.score,0);
console.log('PASS: Rocket seeded physics, five-floor wins, terminal proof, ad and coffee continuation');
