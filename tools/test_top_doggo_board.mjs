// TOP DOGGO 排行榜：真實 Worker 路由 + node:sqlite 套用全部 D1 migration。
// 三個難度各一張榜，成績 = 到達關卡；只做合理性驗證（開局時間、擊倒數、遊玩時間上下限）。
// 用法：node tools/test_top_doggo_board.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import worker from '../backend/src/index.mjs';
import { API } from '../shared/api.mjs';

const rules = createRequire(import.meta.url)('../shared/top-doggo-rules.cjs');
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
const realNow = Date.now;
let offset = 0;
Date.now = () => realNow() + offset;

const player = await request(API.players, { method: 'POST', status: 201 });
const other = await request(API.players, { method: 'POST', status: 201 });
async function play(token, difficulty, action, waitMs) {
  const gameId = rules.boardId(difficulty);
  const round = await request(API.boardStart, { token, status: 201, body: { gameId } });
  offset += waitMs;
  const result = await request(API.boardMove, { token, body: { gameId, id: round.id, revision: round.revision, action } });
  offset -= waitMs;
  return result;
}
const sec = s => s * 1000;
const board = difficulty => request(API.leaderboard + '?gameId=' + rules.boardId(difficulty));
for (const d of rules.DIFFICULTIES) assert.deepEqual((await board(d)).entries, [], d + ' board starts empty');

// 非法或不合理的成績一律不入榜
assert.equal((await play(player.token, 'normal', [5, 40, sec(95)], sec(2))).revision, 0, '5 關卻只過 2 秒');
assert.equal((await play(player.token, 'normal', [5, 40, sec(300)], sec(95))).revision, 0, '宣稱遊玩時間比實際長');
assert.equal((await play(player.token, 'normal', [5, 3, sec(95)], sec(95))).revision, 0, '擊倒數太少');
assert.equal((await play(player.token, 'normal', [5, 9000, sec(95)], sec(95))).revision, 0, '擊倒數太多');
assert.equal((await play(player.token, 'normal', [999, 9999, sec(100)], sec(100))).revision, 0, '關卡超過上限');
assert.equal((await play(player.token, 'normal', [0, 0, sec(10)], sec(10))).revision, 0, '第 0 關');
for (const bad of [[3, 20, 1.5, sec(60)], [3, 20.5, sec(60)], [3, 20], 'x', null]) {
  const round = await request(API.boardStart, { token: player.token, status: 201, body: { gameId: 'top-doggo-normal' } });
  await request(API.boardMove, { token: player.token, status: 400, body: { gameId: 'top-doggo-normal', id: round.id, revision: round.revision, action: bad } });
}
assert.deepEqual((await board('normal')).entries, [], '不合理成績不入榜');

// 合理的成績：各難度分開記錄
assert.equal((await play(player.token, 'easy', [1, 2, sec(30)], sec(31))).revision, 1, '簡單第 1 關');
assert.equal((await play(player.token, 'easy', [4, 40, sec(70)], sec(72))).revision, 1, '簡單第 4 關');
assert.equal((await play(player.token, 'normal', [3, 20, sec(50)], sec(52))).revision, 1, '普通第 3 關');
assert.equal((await play(player.token, 'hard', [2, 12, sec(40)], sec(42))).revision, 1, '困難第 2 關');
assert.equal((await play(other.token, 'hard', [6, 60, sec(120)], sec(122))).revision, 1, '另一位困難第 6 關');
assert.equal((await play(player.token, 'easy', [2, 12, sec(40)], sec(42))).revision, 1, '較低成績可送出');
assert.deepEqual((await board('easy')).entries.map(e => e.score), [4], '簡單榜保留個人最高關卡');
assert.deepEqual((await board('normal')).entries.map(e => e.score), [3]);
assert.deepEqual((await board('hard')).entries.map(e => e.score), [6, 2], '困難榜依關卡由高到低');

// 同一局不能重送
const round = await request(API.boardStart, { token: player.token, status: 201, body: { gameId: 'top-doggo-hard' } });
offset += sec(200);
const action = [7, 70, sec(190)];
const first = await request(API.boardMove, { token: player.token, body: { gameId: 'top-doggo-hard', id: round.id, revision: 0, action } });
assert.equal(first.revision, 1);
await request(API.boardMove, { token: player.token, body: { gameId: 'top-doggo-hard', id: round.id, revision: 1, action: [9, 90, sec(190)] }, status: 409 });
offset = 0;
assert.equal((await board('hard')).entries[0].score, 7, '重送被擋下，成績維持 7');

for (const d of rules.DIFFICULTIES) {
  const names = sql.prepare('SELECT * FROM game_names WHERE game_id = ?').get(rules.boardId(d));
  assert.ok(names && names.game_name_en.startsWith('TOP DOGGO'), d + ' has a display name');
}
assert.equal(rules.verify([3, 20, 50000], 52000)?.score, 3);
assert.equal(rules.verify([3, 20, 50000], 1000), null);
Date.now = realNow;
console.log('PASS: TOP DOGGO per-difficulty boards, plausibility checks, retries and D1 names');
