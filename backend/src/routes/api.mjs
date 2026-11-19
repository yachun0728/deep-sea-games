import { API, GAME_ID } from '../../../shared/api.mjs';
import { createPlayer, findPlayer } from '../services/players.mjs';
import { finishFrogRound, readFrogProof, startFrogRound } from '../services/frog.mjs';
import { getBalance } from '../services/points.mjs';
import { getLeaderboard } from '../services/leaderboard.mjs';

export function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function withPlayer(handler) {
  return async (request, db) => {
    const player = await findPlayer(db, request.headers.get('Authorization'));
    if (!player) return json({ error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
    return handler(request, db, player);
  };
}

const routes = new Map([
  [API.health, ['GET', async (_request, db) => {
    await db.prepare('SELECT id FROM players LIMIT 1').first();
    return json({ status: 'ok' });
  }]],
  [API.players, ['POST', async (_request, db) => {
    return json(await createPlayer(db), 201);
  }]],
  [API.me, ['GET', withPlayer(async (_request, db, player) => {
    return json({ id: player.id, balance: await getBalance(db, player.id) });
  })]],
  [API.frogStart, ['POST', withPlayer(async (_request, db, player) => {
    return json(await startFrogRound(db, player.id), 201);
  })]],
  [API.frogFinish, ['POST', withPlayer(async (request, db, player) => {
    const proof = await readFrogProof(request);
    if (!proof) return json({ error: 'invalid_proof' }, 400);
    const result = await finishFrogRound(db, player.id, proof);
    return result.error ? json({ error: result.error }, result.status) : json(result);
  })]],
  [API.leaderboard, ['GET', async (_request, db, url) => {
    const gameId = url.searchParams.get('gameId') ?? '';
    if (!GAME_ID.test(gameId)) return json({ error: 'invalid_game_id' }, 400);

    return json({ gameId, entries: await getLeaderboard(db, gameId) });
  }]],
]);

export async function route(request, db) {
  const url = new URL(request.url);
  const endpoint = routes.get(url.pathname);
  if (!endpoint) return json({ error: 'not_found' }, 404);

  const [method, handler] = endpoint;
  if (request.method !== method) {
    return json({ error: 'method_not_allowed' }, 405, { Allow: method });
  }
  return handler(request, db, url);
}
