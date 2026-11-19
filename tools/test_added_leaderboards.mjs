import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';

for (const id of ['carp','nap','campaign','mosquito','last-hair','rider','boss','thief','baby','mermaid']) {
  const {default: engine} = await import('../shared/' + id + '-rules.cjs');
  const seed = 42, random = replay.seeded(seed), state = engine.create(random), actions = [];
  let ticks = 0;
  if (id === 'nap' || id === 'mosquito') {
    assert.ok(engine.input(state, 0));
    actions.push(0);
  }
  if (id === 'mermaid') {
    assert.ok(engine.input(state, 2));
    actions.push(2);
    ticks = 1;
  }
  while (!state.dead && ticks < replay.MAX_TICKS) {
    engine.advance(state, .01, random);
    ticks++;
  }
  assert.ok(state.dead, id + ' natural terminal');
  const proof = [ticks, ...actions];
  assert.equal(replay.verify(engine, seed, proof), engine.score(state), id);
  assert.equal(replay.verify(engine, seed, [ticks + 1, ...actions]), null, id + ' forged end');
  console.log('PASS ' + id + ', terminal score ' + engine.score(state));
}
