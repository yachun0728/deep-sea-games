import assert from 'node:assert/strict';
import rules from '../shared/runner-rules.cjs';

for (const seed of [0, 1, 1234, 0xffffffff]) {
  const run = rules.create();
  const random = rules.seeded(seed);
  const lanes = [0];
  run.tl = -1;
  let ticks = 0;
  while (!run.dead && ticks < rules.MAX_TICKS) {
    if (ticks === 50) {
      run.tl = 1;
      lanes.push(ticks * 3 + 2);
    }
    rules.step(run, rules.STEP_MS / 1000, random);
    ticks++;
  }
  assert.ok(run.dead);
  assert.ok(rules.accepts([ticks, ...lanes]));
  assert.equal(rules.replay(seed, [ticks, ...lanes]), Math.floor(run.dist));
  assert.equal(rules.replay(seed, [ticks - 1, ...lanes]), null);
  assert.equal(rules.replay(seed, [ticks + 1, ...lanes]), null);
}
assert.equal(rules.accepts([100, 2, 1]), false);
assert.equal(rules.accepts([100, 301]), false);
assert.equal(rules.accepts([rules.MAX_TICKS + 1]), false);
console.log('PASS: shared Dodge Run replay, exact terminal tick, and input bounds');
