import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';

for (const id of ['rider', 'boss', 'thief', 'baby']) {
  const {default: engine} = await import('../shared/' + id + '-rules.cjs');
  for (const seed of [1, 42, 1234]) {
    const state = engine.create(replay.seeded(seed));
    const actions = [];
    let ticks = 0;
    while (!state.dead && ticks < replay.MAX_TICKS) {
      if (ticks % 150 === 0) {
        assert.ok(engine.input(state, 0));
        actions.push(ticks * engine.inputCount);
      }
      engine.advance(state, .01);
      ticks++;
    }
    assert.ok(state.dead, id + ' must end naturally');
    assert.ok(engine.score(state) > 0);
    assert.equal(replay.verify(engine, seed, [ticks, ...actions]), engine.score(state));
    assert.equal(replay.verify(engine, seed, [ticks - 1, ...actions]), null);
  }
}
console.log('PASS: four runner engines, seeded inputs, positive scores, natural terminal validation');
