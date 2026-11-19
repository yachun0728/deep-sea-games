import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';
import cat from '../shared/cat-rules.cjs';
import skybuilder from '../shared/skybuilder-rules.cjs';
import reaper from '../shared/reaper-rules.cjs';
import sneak from '../shared/sneak-rules.cjs';

function simulate(engine, seed, inputs) {
  const random = replay.seeded(seed);
  const state = engine.create(random);
  const actions = [];
  for (let tick = 0; tick < 4000; tick++) {
    for (const action of inputs.get(tick) ?? []) {
      assert.ok(engine.input(state, action));
      actions.push(tick * engine.inputCount + action);
    }
    engine.advance(state, replay.STEP_MS / 1000, random);
    if (state.dead) return {state, proof: [tick + 1, ...actions]};
  }
  throw new Error('Round did not finish');
}

for (const [engine, inputs] of [
  [cat, new Map([[12, [0]], [25, [1]]])],
  [skybuilder, new Map([[0, [0]], [94, [0]]])],
  [sneak, new Map([[0, [0]]])],
  [reaper, new Map([[225, [0]]])],
]) {
  const {state, proof} = simulate(engine, 42, inputs);
  assert.ok(replay.accepts(proof, engine.inputCount));
  assert.equal(replay.verify(engine, 42, proof), engine.score(state));
  assert.equal(replay.verify(engine, 42, [proof[0] - 1, ...proof.slice(1)]), null);
  assert.equal(replay.verify(engine, 42, [proof[0] + 1, ...proof.slice(1)]), null);
}
assert.equal(replay.accepts([2, 3, 0], 2), false);
assert.equal(replay.accepts([2, 4], 2), false);
assert.equal(replay.verify(skybuilder, 42, [100, 0, 0]), null);
assert.equal(replay.verify(sneak, 42, [100, 1]), null);
const instantEnd = {
  inputCount: 1,
  create: () => ({dead:false}),
  input: state => {state.dead = true; return true;},
  advance: () => assert.fail('terminal input cannot advance simulation'),
  score: () => 10,
};
assert.equal(replay.verify(instantEnd, 42, [1,0]), 10);
assert.equal(replay.verify(instantEnd, 42, [1,0,0]), null);
console.log('PASS: four shared timed rule engines, terminal ticks, input ordering and invalid transitions');
