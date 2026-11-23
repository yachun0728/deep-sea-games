// 萌獸破城隊排行榜：真實 Worker 路由 + node:sqlite 套用全部 D1 migration。
// 過關編排由 Worker 重播驗證；分數 = 已驗證的不同關卡數，同一關重送不重複計分，偽造與非法編排不計分。
// 用法：node tools/test_siege_architect_board.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../backend/src/index.mjs';
import { API } from '../shared/api.mjs';

const plans = ['00000001000002000000', '00100000002000000000', '02330000000000000000'].map(p => [...p].map(Number));
const sql = new DatabaseSync(':memory:');
const migrations = new URL('../backend/migrations/', import.meta.url);
for (const file of readdirSync(migrations).sort()) sql.exec(readFileSync(new URL(file, migrations), 'utf8'));
const DB = {
  prepare(query) {
    const stmt = sql.prepare(query);
    const bind = (...args) => ({ first: async () => stmt.get(...args) ?? null, run: async () => stmt.run(...args), all: async () => ({ results: stmt.all(...args) }) });
    return { ...bind(), bind };
  },
};
async function request(path, { token, body, method = body ? 'POST' : 'GET', status = 200 } = {}) {
  const response = await worker.fetch(new Request('http://arcade.test' + path, {
    method, headers: token ? { Authorization: 'Bearer ' + token } : {}, body: body && JSON.stringify(body),
  }), { DB });
  const result = await response.json();
  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}
const gameId = 'siege-architect';
const player = await request(API.players, { method: 'POST', status: 201 });
const other = await request(API.players, { method: 'POST', status: 201 });
const board = API.leaderboard + '?gameId=' + gameId;
assert.deepEqual((await request(board)).entries, [], 'empty board');
// same flow as frontend/services/api.mjs submitPuzzleSolution
async function submit(token, action) {
  const round = await request(API.boardStart, { token, status: 201, body: { gameId } });
  return request(API.boardMove, { token, body: { gameId, id: round.id, revision: round.revision, action } });
}

assert.equal((await submit(player.token, [1, ...Array(20).fill(0)])).revision, 0, 'empty plan rejected');
assert.equal((await submit(player.token, [2, ...plans[0]])).revision, 0, 'plan for another level rejected');
assert.equal((await submit(player.token, [1, ...Array(20).fill(2)])).revision, 0, 'over budget rejected');
assert.equal((await submit(player.token, [99, ...plans[0]])).revision, 0, 'unknown level rejected');
assert.deepEqual((await request(board)).entries, [], 'rejected plans do not score');

assert.equal((await submit(player.token, [1, ...plans[0]])).revision, 1, 'level 1 verified');
assert.equal((await submit(player.token, [1, ...plans[0]])).revision, 1, 'repeat clear is accepted');
assert.equal((await request(board)).entries[0].score, 1, 'repeat clear counts once');
assert.equal((await submit(player.token, [2, ...plans[1]])).revision, 1);
assert.equal((await submit(player.token, [3, ...plans[2]])).revision, 1);
assert.equal((await submit(other.token, [1, ...plans[0]])).revision, 1);
const entries = (await request(board)).entries;
assert.deepEqual(entries.map(e => e.score), [3, 1], 'distinct verified levels per player');
const names = sql.prepare('SELECT * FROM game_names WHERE game_id = ?').get(gameId);
assert.equal(names.game_name_en, 'Critter Crashers');
console.log('PASS: Critter Crashers Worker verification, distinct-level scoring and D1 names');
