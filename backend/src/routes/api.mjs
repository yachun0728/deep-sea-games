import { API, GAME_ID } from '../../../shared/api.mjs';
import { createPlayer, findPlayer } from '../services/players.mjs';
import { finishFrogRound, readFrogProof, startFrogRound } from '../services/frog.mjs';
import { applyMinesMove, readMinesMove, startMinesRound } from '../services/mines.mjs';
import { moveRankedBoard, readBoardCommand, startRankedBoard } from '../services/ranked-boards.mjs';
import { getBalance } from '../services/points.mjs';
import { getGameName, getLeaderboard, getLeaderboardFeed } from '../services/leaderboard.mjs';
import { createShare, findShare, readShareCommand, renderSharePage } from '../services/shares.mjs';
import { SHARE_PATH } from '../../../shared/share-games.mjs';

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
  [API.minesStart, ['POST', withPlayer(async (_request, db, player) => {
    return json(await startMinesRound(db, player.id), 201);
  })]],
  [API.minesMove, ['POST', withPlayer(async (request, db, player) => {
    const move = await readMinesMove(request);
    if (!move) return json({ error: 'invalid_move' }, 400);
    const result = await applyMinesMove(db, player.id, move);
    return result.error ? json({ error: result.error }, result.status) : json(result);
  })]],
  [API.boardStart, ['POST', withPlayer(async (request, db, player) => {
    const command = await readBoardCommand(request, false);
    return command ? json(await startRankedBoard(db, player.id, command.gameId, command.stage, command.rulesVersion), 201)
      : json({ error: 'invalid_game' }, 400);
  })]],
  [API.boardMove, ['POST', withPlayer(async (request, db, player) => {
    const command = await readBoardCommand(request, true);
    if (!command) return json({ error: 'invalid_move' }, 400);
    const result = await moveRankedBoard(db, player.id, command);
    return result.error ? json({ error: result.error }, result.status) : json(result);
  })]],
  [API.leaderboardFeed, ['GET', async (_request, db, url) => {
    return json({ games: await getLeaderboardFeed(db, url.searchParams.get('lang')) });
  }]],
  [API.leaderboard, ['GET', async (_request, db, url) => {
    const gameId = url.searchParams.get('gameId') ?? '';
    if (!GAME_ID.test(gameId)) return json({ error: 'invalid_game_id' }, 400);

    const lang = url.searchParams.get('lang');
    return json({
      gameId,
      gameName: await getGameName(db, gameId, lang),
      entries: await getLeaderboard(db, gameId),
    });
  }]],
  [API.shares, ['POST', withPlayer(async (request, db, player) => {
    const command = await readShareCommand(request);
    if (!command) return json({ error: 'invalid_share' }, 400);
    const result = await createShare(db, player.id, command);
    return result.error ? json({ error: result.error }, result.status) : json(result, 201);
  })]],
]);

async function sharePage(request, db, url, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const id = SHARE_PATH.exec(url.pathname)[1];
  const response = renderSharePage(await findShare(db, id), {
    id, siteOrigin: env?.SITE_ORIGIN || undefined, langOverride: url.searchParams.get('lang'),
  });
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

export async function route(request, db, env) {
  const url = new URL(request.url);
  if (SHARE_PATH.test(url.pathname)) return sharePage(request, db, url, env);
  const endpoint = routes.get(url.pathname);
  if (!endpoint) return json({ error: 'not_found' }, 404);

  const [method, handler] = endpoint;
  if (request.method !== method) {
    return json({ error: 'method_not_allowed' }, 405, { Allow: method });
  }
  return handler(request, db, url);
}
