// 本機驗收用：以真實 Worker 程式碼 + node:sqlite（套用全部 migration）在 :8787 提供 API，供大廳頁面實際對局時使用。
// 用法：node tools/local_api_for_test.mjs [SITE_ORIGIN]
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import worker from '../backend/src/index.mjs';

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
const origin = process.argv[2] || 'http://localhost:8777';
createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const response = await worker.fetch(new Request('http://127.0.0.1:8787' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), { DB, SITE_ORIGIN: origin, FRONTEND_ORIGIN: origin });
  const headers = Object.fromEntries(response.headers);
  headers['access-control-allow-origin'] ??= '*';
  headers['access-control-allow-headers'] ??= 'authorization, content-type';
  headers['access-control-allow-methods'] ??= 'GET, POST, OPTIONS';
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(8787, '127.0.0.1', () => console.log('local API on 8787'));
