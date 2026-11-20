import assert from 'node:assert/strict';
import rules from '../shared/boss-rules.cjs';
import replay from '../shared/timed-replay.cjs';
import { readBoardCommand, startRankedBoard, moveRankedBoard } from '../backend/src/services/ranked-boards.mjs';

const version = rules.rulesVersion;
const engines = new Map([
  [undefined, {...rules, create: rng => rules.create(rng, 1)}],
  [version, rules],
]);

function run(engine, seed, check = () => {}) {
  const state = engine.create(replay.seeded(seed));
  for (let tick = 1; tick <= 6000; tick++) {
    engine.advance(state, replay.STEP_MS / 1000);
    check(state.snapshot(), state);
    if (state.dead) return { proof: [tick], score: engine.score(state) };
  }
  assert.fail('The round never ended.');
}

let lastMisses = 0;
const newRun = run(rules, 1, (snapshot, state) => {
  if (snapshot.misses === lastMisses) return;
  lastMisses++;
  assert.equal(snapshot.misses, lastMisses);
  assert.equal(snapshot.gap, [150, 95, 42, 0][lastMisses]);
  assert.equal(Boolean(state.dead), lastMisses === 3);
});
assert.equal(lastMisses, 3);

const cleanRun = rules.create(() => .9); // Only banners, all cleared by holding Slide.
assert(rules.input(cleanRun, 2));
for (let tick = 0; tick < 12000; tick++) rules.advance(cleanRun, replay.STEP_MS / 1000);
assert.equal(cleanRun.dead, false);
assert.equal(cleanRun.snapshot().misses, 0);
assert.equal(cleanRun.snapshot().gap, 150);
assert(rules.input(cleanRun, 3));
assert.equal(cleanRun.snapshot().slide, false);

const oldRun = run(engines.get(undefined), 1);
assert.notEqual(oldRun.proof[0], newRun.proof[0]);
assert.equal(replay.verify(rules, 1, oldRun.proof), null);

for (const [rulesVersion, engine] of engines) {
  const body = {gameId: 'boss', rulesVersion};
  const request = new Request('https://example.test/rounds', {method:'POST', body: JSON.stringify(body)});
  assert.equal((await readBoardCommand(request, false)).rulesVersion, rulesVersion);
  let row;
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          if (sql.startsWith('INSERT')) return {run() {
            row = {revision: 0, score: null, started_at: args[3] - 120000, state: args[4]};
          }};
          if (sql.startsWith('SELECT')) return {first: () => row};
          assert(sql.startsWith('UPDATE'));
          return {first() {
            row = {...row, revision: 1, state: args[0], last_action: args[1], score: args[2]};
            return row;
          }};
        },
      };
    },
  };
  const round = await startRankedBoard(db, 'test-player', 'boss', undefined, rulesVersion);
  assert.equal(JSON.parse(row.state).rulesVersion, rulesVersion);
  row.state = JSON.stringify({...JSON.parse(row.state), issuedAt: Date.now() - 120000});
  const {proof, score} = run(engine, round.state.seed);
  const move = await moveRankedBoard(db, 'test-player', {gameId: 'boss', id: round.id, revision: 0, action: proof});
  assert.equal(move.revision, 1);
  assert.equal(move.state.score, score);
}

console.log('PASS: Boss ends on the third hit and the Worker verifies legacy and current rounds.');
