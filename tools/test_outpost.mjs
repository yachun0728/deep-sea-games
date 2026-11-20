import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../backend/src/index.mjs';
import { API } from '../shared/api.mjs';
import rules from '../shared/outpost-rules.cjs';
import replay from '../shared/timed-replay.cjs';

function play(divert, stage = 1) {
  const state = rules.createStage(stage), actions = [];
  const builds = [36, 28, 87, 43, 32, 62, 12, 72, 50, 7];
  let next = 0;
  function press(code) {
    if (!rules.input(state, code)) return false;
    actions.push(state.tick * rules.inputCount + code);
    return true;
  }
  assert.equal(press(3), false, 'Cannot send an upper-lane enemy off the board');
  while (!state.dead) {
    if (next < builds.length && press(builds[next])) next++;
    if (divert) {
      for (const gate of [29, 89]) {
        if (press(gate)) assert.equal(press(gate), false, 'A pulse has a cooldown');
      }
    }
    if (state.tick % 100 === 0) {
      for (const cell of [6,8,5,1,11]) {
        const energy = state.energy;
        if (!rules.upgrade(state, cell)) continue;
        assert.equal(state.energy, energy - 25);
        assert.equal(rules.upgrade(state, cell), false);
        assert.equal(state.energy, energy - 25, 'Repeated taps cannot charge again');
      }
    }
    rules.advance(state);
  }
  return { state, proof: [state.tick, ...actions], score: rules.score(state) };
}

const winning = play(true), losing = play(false);
assert.equal(winning.state.tick, 18000);
assert.equal(winning.state.hull, 3);
assert.equal(winning.state.diverted, 25);
assert.equal(winning.score, 3735);
assert.equal(losing.state.hull, 0);
assert.equal(replay.verify(rules, 42, winning.proof), winning.score);
assert.equal(replay.verify(rules, 42, losing.proof), losing.score);
assert.equal(replay.verify(rules, 42, [winning.proof[0] + 1, ...winning.proof.slice(1)]), null);
assert.equal(replay.verify(rules, 42, [winning.proof[0], 3, ...winning.proof.slice(1)]), null);

for (const stage of [2, 3]) {
  const cleared = play(true, stage).state;
  assert.equal(cleared.won, true);
  assert.ok(cleared.diverted > 0);
  assert.ok(cleared.devices.some(device => device?.upgraded));
}
assert.ok(winning.state.devices.every(device => !device?.upgraded), 'Ranked stage never enables upgrades');

// Searched winning deployments (cell, action) for stages 4-30; gates fire whenever ready.
const clearPlans = {
  4: [[9,0],[12,2],[8,2],[0,2],[3,2],[5,2],[4,2],[7,4],[1,2],[13,2],[2,1],[10,3]],
  5: [[14,0],[12,2],[6,2],[2,2],[3,1],[9,2],[5,2],[11,2],[4,4],[1,2],[7,0],[0,2],[10,0]],
  6: [[8,0],[11,3],[6,1],[0,2],[5,0],[12,0],[13,3],[7,2],[4,2]],
  7: [[9,0],[12,2],[8,2],[0,2],[3,2],[5,2],[4,2],[7,4],[1,2],[13,2],[2,1],[10,3]],
  8: [[5,2],[0,2],[8,1],[11,2],[3,2],[6,2],[1,1],[10,0],[14,2],[13,2],[7,1],[9,0],[4,2]],
  9: [[5,2],[3,1],[11,2],[0,0],[13,0],[12,0],[4,0],[7,1],[1,0]],
  10: [[14,0],[12,2],[6,2],[2,2],[3,1],[9,2],[5,2],[11,2],[4,4],[1,2],[7,0],[0,2],[10,0]],
  11: [[9,0],[12,2],[8,2],[0,2],[3,2],[5,2],[4,2],[7,4],[1,2],[13,2],[2,1],[10,3]],
  12: [[14,0],[12,2],[6,2],[2,2],[3,1],[9,2],[5,2],[11,2],[4,4],[1,2],[7,0],[0,2],[10,0]],
  13: [[7,2],[2,2],[13,3],[10,2],[1,1],[5,2],[12,1],[8,3],[14,2],[3,1],[9,0]],
  14: [[5,2],[8,1],[0,2],[9,0],[10,2],[3,0],[1,4],[12,2],[4,1],[13,0],[6,0],[11,3]],
  15: [[14,0],[12,2],[6,2],[2,2],[3,1],[9,2],[5,2],[11,2],[4,4],[1,2],[7,0],[0,2],[10,0]],
  16: [[7,1],[9,2],[13,2],[0,2],[1,2],[8,4],[12,2],[10,2]],
  17: [[5,2],[0,2],[8,1],[11,2],[3,2],[6,2],[1,1],[10,0],[14,2],[13,2],[7,1],[9,0],[4,2]],
  18: [[13,2],[7,2],[3,2],[9,2],[1,0],[10,2],[8,3],[14,2],[5,0],[4,4],[12,0],[0,4]],
  19: [[13,2],[7,2],[3,2],[1,0],[10,2],[5,2],[0,4]],
  20: [[6,2],[0,2],[3,2],[13,2],[5,1],[12,1],[14,0],[10,0]],
  21: [[13,2],[7,2],[3,2],[9,2],[1,0],[10,2],[14,2],[8,3],[11,1],[2,1],[12,3]],
  22: [[13,2],[7,2],[3,2],[9,2],[2,2],[10,2],[8,3],[14,2],[1,0],[4,4],[12,0]],
  23: [[1,2],[0,2],[12,2],[7,0],[10,2],[3,2],[8,3]],
  24: [[1,0],[10,2],[5,2],[14,2],[3,2],[2,2],[8,2]],
  25: [[5,2],[0,2],[11,2],[9,2],[3,2],[6,2],[10,0],[13,2],[2,2],[12,0]],
  26: [[9,2],[5,2],[0,2],[7,1],[13,2],[1,2],[12,2],[10,2]],
  27: [[5,2],[6,2],[13,3],[2,2],[0,2],[1,1],[7,1],[11,2],[14,0]],
  28: [[6,2],[0,2],[1,2],[12,2],[7,1],[9,2],[10,2],[13,2]],
  29: [[2,1],[0,2],[10,2],[11,2],[1,2],[7,2],[6,2]],
  30: [[5,2],[0,2],[3,2],[12,0],[13,1],[11,2],[6,2],[1,1],[10,0],[8,1]]
};
function clear(stage, plan, upgrade = true) {
  const state = rules.createStage(stage);
  let next = 0;
  const gates = plan.filter(([, action]) => action >= 3).map(([cell]) => cell);
  while (!state.dead) {
    if (next < plan.length && rules.input(state, plan[next][0] * 6 + plan[next][1])) next++;
    for (const gate of gates) rules.input(state, gate * 6 + 5);
    if (upgrade && state.tick % 50 === 0 && rules.wave(state) >= 2) {
      for (const [cell] of plan) if (rules.upgrade(state, cell)) break;
    }
    rules.advance(state);
  }
  return state;
}
assert.equal(rules.stageCount, 30);
const defenceless = [];
for (let stage = 4; stage <= 30; stage++) {
  const won = clear(stage, clearPlans[stage]);
  assert.ok(won.won && won.hull > 0, 'Stage ' + stage + ' stays clearable');
  const idle = rules.createStage(stage);
  while (!idle.dead) rules.advance(idle);
  assert.equal(idle.won, false, 'Stage ' + stage + ' is lost without defenses');
  const config = rules.createStage(stage);
  defenceless.push(config.energy);
}
assert.ok(defenceless.every((energy, i) => i === 0 || energy >= defenceless[i - 1]), 'Starting energy never drops');
assert.ok(rules.enemyCount(30) >= rules.enemyCount(4) + 10, 'Late stages send more enemies than early ones');
assert.equal(rules.createStage(30).enemies.length, 0);


const sql = new DatabaseSync(':memory:');
const migrations = new URL('../backend/migrations/', import.meta.url);
for (const file of readdirSync(migrations).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'));
const DB = {
  prepare(query) {
    const stmt = sql.prepare(query);
    const bind = (...args) => ({
      first: async () => stmt.get(...args) ?? null,
      run: async () => stmt.run(...args),
      all: async () => ({results: stmt.all(...args)}),
    });
    return {...bind(), bind};
  },
};
async function request(path, { token, body, method = body ? 'POST' : 'GET', status = 200 } = {}) {
  const response = await worker.fetch(new Request('http://arcade.test' + path, {
    method,
    headers: token ? {Authorization: 'Bearer ' + token} : {},
    body: body && JSON.stringify(body),
  }), { DB });
  const result = await response.json();
  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}
const first = await request(API.players, { method: 'POST', status: 201 });
const second = await request(API.players, { method: 'POST', status: 201 });
const leaderboard = API.leaderboard + '?gameId=outpost';
assert.deepEqual((await request(leaderboard)).entries, []);
const start = token => request(API.boardStart, {token, status: 201, body: {gameId: 'outpost'}});
const move = (token, body, status) => request(API.boardMove, {token, body, status});
const command = (round, action) => ({gameId: 'outpost', id: round.id, revision: round.revision, action});

const a = await start(first.token), body = command(a, winning.proof);
assert.equal((await move(second.token, body, 404)).error, 'round_not_found');
assert.equal((await move(first.token, {...body, score: 999999}, 400)).error, 'invalid_move');
assert.equal((await move(first.token, body)).revision, 0, 'Reject implausible elapsed time');

const clock = Date.now;
try {
  Date.now = () => clock() + 181000;
  assert.equal((await move(first.token, command(a, [2, 3]))).revision, 0, 'Reject illegal deployment');
  assert.equal((await move(first.token, command(a, [100]))).revision, 0, 'Reject an unfinished replay');
  const [sent, retried] = await Promise.all([move(first.token, body), move(first.token, body)]);
  assert.deepEqual(sent, retried);
  assert.equal(sent.state.score, winning.score);
  assert.equal(sent.revision, 1);
  assert.equal((await move(first.token, command(a, losing.proof), 409)).error, 'stale_move');
} finally { Date.now = clock; }

const b = await start(second.token), c = await start(first.token);
const oldRules = await start(first.token), expired = await start(first.token);
sql.prepare("UPDATE ranked_boards SET state = json_set(state, '$.rulesVersion', 0) WHERE id = ?").run(oldRules.id);
sql.prepare('UPDATE ranked_boards SET started_at = ? WHERE id = ?').run(clock() - 7200001, expired.id);
try {
  Date.now = () => clock() + 181000;
  assert.equal((await move(first.token, command(oldRules, winning.proof))).revision, 0);
  assert.equal((await move(first.token, command(expired, winning.proof), 410)).error, 'round_expired');
  assert.equal((await move(second.token, command(b, winning.proof))).state.score, winning.score);
  assert.equal((await move(first.token, command(c, losing.proof))).state.score, losing.score);
} finally { Date.now = clock; }
const entries = (await request(leaderboard)).entries;
assert.deepEqual(entries.map(({playerId, score}) => [playerId, score]),
  [[first.id, winning.score], [second.id, winning.score]]);
assert.equal((await request(API.leaderboardFeed)).games.find(game => game.gameId === 'outpost').entries[0].playerId, first.id);
assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM player_best_scores').get().count, 0);
console.log('PASS: Outpost rules, full three-wave clear, 30 clearable stages, Worker replay and local SQLite leaderboard');
