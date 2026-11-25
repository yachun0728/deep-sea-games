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
const player=await request(API.players,{method:'POST',status:201});
for(const difficulty of rules.DIFFICULTIES){
 await request(API.boardStart,{token:player.token,body:{gameId:rules.boardId(difficulty)},status:400});
}
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM ranked_boards WHERE game_id LIKE 'top-doggo-%'").get().n,0);
console.log('PASS: retired TOP DOGGO boards reject new rounds and write no records');
