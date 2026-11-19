import mergeRules from '../../../shared/merge-rules.cjs';

const LIFETIME_MS = 2 * 60 * 60 * 1000;
const MAX_REVISIONS = 16384;
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const boards = new Map([
  ['merge', {
    create: () => mergeRules.create(random),
    accepts: action => mergeRules.directions.includes(action),
    apply: (state, action) => mergeRules.move(state, action, random),
    score: state => state.over ? state.score : null,
    visible: state => state,
  }],
]);

export async function readBoardCommand(request, isMove) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const decoder = new TextDecoder();
    let text = '', bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    const command = JSON.parse(text + decoder.decode());
    const game = boards.get(command?.gameId);
    if (!game || Object.keys(command).length !== (isMove ? 4 : 1)) return null;
    if (isMove && (typeof command.id !== 'string' || !ID.test(command.id) ||
        !Number.isInteger(command.revision) || command.revision < 0 ||
        command.revision > MAX_REVISIONS || !game.accepts(command.action))) return null;
    return command;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function startRankedBoard(db, playerId, gameId) {
  const id = crypto.randomUUID(), game = boards.get(gameId), state = game.create();
  await db.prepare(
    'INSERT INTO ranked_boards (id, player_id, game_id, started_at, state) VALUES (?, ?, ?, ?, ?)',
  ).bind(id, playerId, gameId, Date.now(), JSON.stringify(state)).run();
  return { id, revision: 0, state: game.visible(state) };
}

export async function moveRankedBoard(db, playerId, { gameId, id, revision, action }) {
  const game = boards.get(gameId);
  const select = db.prepare(
    'SELECT started_at, revision, last_action, state, score FROM ranked_boards WHERE id = ? AND player_id = ? AND game_id = ?',
  ).bind(id, playerId, gameId);
  const prior = await select.first();
  if (!prior) return { error: 'round_not_found', status: 404 };

  const isRetry = row => row?.revision === revision + 1 && row.last_action === action;
  const response = row => ({ id, revision: row.revision, state: game.visible(JSON.parse(row.state)) });
  if (isRetry(prior)) return response(prior);
  if (prior.revision !== revision || prior.score !== null) return { error: 'stale_move', status: 409 };
  if (revision >= MAX_REVISIONS || Date.now() - prior.started_at > LIFETIME_MS) {
    return { error: 'round_expired', status: 410 };
  }

  const state = JSON.parse(prior.state);
  if (!game.apply(state, action)) return response(prior);

  const saved = await db.prepare(
    'UPDATE ranked_boards SET state = ?, revision = revision + 1, last_action = ?, score = ? WHERE id = ? AND player_id = ? AND game_id = ? AND revision = ? AND score IS NULL RETURNING revision, state',
  ).bind(JSON.stringify(state), action, game.score(state), id, playerId, gameId, revision).first();
  if (saved) return response(saved);
  const current = await select.first();
  return isRetry(current) ? response(current) : { error: 'stale_move', status: 409 };
}
