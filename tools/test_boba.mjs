import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';
import boba from '../shared/boba-rules.cjs';

const STEP = replay.STEP_MS / 1000;
// Plays a round from a seed: `plan(state)` returns the input codes to send before each tick.
function play(seed, plan, maxTicks = 60000) {
  const random = replay.seeded(seed), state = boba.create(random), actions = [];
  for (let tick = 0; tick < maxTicks; tick++) {
    for (const code of plan(state)) {
      assert.ok(boba.input(state, code), `input ${code} refused at tick ${tick} in state ${state.state}`);
      actions.push(tick * boba.inputCount + code);
      if (state.dead) return { state, proof: [tick + 1, ...actions] };
    }
    boba.advance(state, STEP, random);
    state.events.length = 0;
  }
  throw new Error('round did not finish');
}

// Releases in the sweet zone, then quits at the next ready cup once enough cups are done.
function careful(cupsWanted) {
  return state => {
    if (state.cups >= cupsWanted && state.state === 'ready') return [boba.END];
    if (state.state === 'ready') return [boba.PRESS];
    if (state.state === 'charging') {
      const c = state.cup;
      if (state.power >= c.lo + c.w * 0.4 && state.power <= c.lo + c.w * 0.6) return [boba.RELEASE];
    }
    return [];
  };
}

const first = play(7, careful(6));
assert.ok(first.state.cups >= 6, 'a careful player clears the first cups');
assert.ok(replay.accepts(first.proof, boba.inputCount));
assert.equal(replay.verify(boba, 7, first.proof), boba.score(first.state));

// A proof is tied to the seed that issued it.
const mismatched = [8, 9, 10, 11, 12].filter(seed => replay.verify(boba, seed, first.proof) !== boba.score(first.state));
assert.ok(mismatched.length > 0);

// Forged length or a missing end input is refused.
assert.equal(replay.verify(boba, 7, [first.proof[0] + 1, ...first.proof.slice(1)]), null);
assert.equal(replay.verify(boba, 7, [first.proof[0] - 1, ...first.proof.slice(1)]), null);
assert.equal(replay.verify(boba, 7, first.proof.slice(0, -1)), null);

// Illegal inputs are refused: release without press, press while the cup slides in, ad with straws left.
const idle = boba.create(replay.seeded(1));
assert.equal(boba.input(idle, boba.RELEASE), false);
assert.equal(boba.input(idle, boba.PRESS), false);
assert.equal(boba.input(idle, boba.AD), false);
assert.equal(boba.input(idle, 9), false);
assert.equal(replay.verify(boba, 1, [50, boba.RELEASE * 1 + 49 * boba.inputCount, boba.END + 49 * boba.inputCount]), null);

// Ending right away scores zero cups and must end on the input tick.
assert.equal(replay.verify(boba, 1, [1, boba.END]), 0);
assert.equal(replay.verify(boba, 1, [2, boba.END]), null);

// Wasting every straw reaches the revive screen: one ad adds a straw, and only once per round.
{
  const plan = state => {
    if (state.state === 'ready') return [boba.PRESS];
    if (state.state === 'charging' && state.power > state.cup.lo + state.cup.w + 0.02) return [boba.RELEASE];
    if (state.state === 'out' && !state.ad && state.adsUsed === 0) return [boba.AD];
    if (state.state === 'out' && !state.ad && state.adsUsed === 1) return [boba.END];
    return [];
  };
  const { state, proof } = play(3, plan);
  assert.equal(state.adsUsed, 1);
  assert.equal(boba.score(state), state.cups);
  assert.equal(replay.verify(boba, 3, proof), boba.score(state));
  assert.equal(proof.slice(1).filter(code => code % boba.inputCount === boba.AD).length, 1);
  // Sending a second ad right before the end is refused.
  const again = proof.slice();
  again.splice(-1, 0, (proof[0] - 1) * boba.inputCount + boba.AD);
  assert.equal(replay.verify(boba, 3, again), null);
}

// Cancelling a charge (page hidden) returns to ready; the next press starts the bar from zero.
{
  const state = boba.create(replay.seeded(5)), random = replay.seeded(5);
  for (let i = 0; i < 200 && state.state !== 'ready'; i++) boba.advance(state, STEP, random);
  assert.equal(state.state, 'ready');
  assert.ok(boba.input(state, boba.PRESS));
  for (let i = 0; i < 30; i++) boba.advance(state, STEP, random);
  assert.ok(state.power > 0);
  assert.ok(boba.input(state, boba.CANCEL));
  assert.equal(state.state, 'ready');
  assert.equal(state.power, 0);
  assert.ok(boba.input(state, boba.PRESS));
  assert.equal(state.phase, 0);
}
console.log('boba rules ok');
