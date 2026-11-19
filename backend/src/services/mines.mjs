import minesRules from '../../../shared/mines-rules.cjs';

const LIFETIME_MS = 30 * 60 * 1000;
const MAX_MOVES = 500;
const ROUND_ID = /^[a-f0-9-]{36}$/;
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

function snapshot(id, revision, board, flagLimit = false) {
  const visible = Array.from({ length: board.size ** 2 }, (_, cell) => {
    if (!board.result && !board.open[cell]) return board.flags[cell] ? 'flag' : null;
    return board.layout[cell] ? 'mine' : minesRules.number(board, cell);
  });
  return { id, revision, visible, picks: board.picks, result: board.result, flagLimit };
}

export async function startMinesRound(db, playerId) {
  const id = crypto.randomUUID();
  const board = minesRules.create(5, 3, random);
  await db.prepare(
    'INSERT INTO mines_rounds (id, player_id, started_at, board) VALUES (?, ?, ?, ?)',
  ).bind(id, playerId, Date.now(), JSON.stringify(board)).run();
  return snapshot(id, 0, board);
}

export async function readMinesMove(request) {
  // The largest valid move fits comfortably within this single bounded stream.
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const decoder = new TextDecoder();
    let bytes = 0, text = '';
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
    const move = JSON.parse(text + decoder.decode());
    if (!move || Object.keys(move).length !== 4 || typeof move.id !== 'string' ||
        !ROUND_ID.test(move.id) || !Number.isInteger(move.revision) ||
        move.revision < 0 || move.revision > MAX_MOVES ||
        !['open', 'flag'].includes(move.action) || !Number.isInteger(move.cell) ||
        move.cell < 0 || move.cell > 24) return null;
    return move;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function applyMinesMove(db, playerId, move) {
  const { id, revision, action, cell } = move;
  const query = db.prepare(
    'SELECT started_at, revision, last_move, board, score FROM mines_rounds WHERE id = ? AND player_id = ?',
  ).bind(id, playerId);
  const prior = await query.first();
  if (!prior) return { error: 'round_not_found', status: 404 };

  const key = `${action}:${cell}`;
  const isRetry = row => row.revision === revision + 1 && row.last_move === key;
  const response = row => snapshot(id, row.revision, JSON.parse(row.board));
  if (isRetry(prior)) return response(prior);
  if (prior.revision !== revision || prior.score !== null) return { error: 'stale_move', status: 409 };
  if (revision >= MAX_MOVES || Date.now() - prior.started_at > LIFETIME_MS) {
    return { error: 'round_expired', status: 410 };
  }

  const board = JSON.parse(prior.board);
  const outcome = minesRules.move(board, action, cell);
  if (outcome !== true) return snapshot(id, revision, board, outcome === 'flag-limit');

  const saved = await db.prepare(
    'UPDATE mines_rounds SET board = ?, revision = revision + 1, last_move = ?, score = ? WHERE id = ? AND player_id = ? AND revision = ? AND score IS NULL RETURNING board, revision',
  ).bind(JSON.stringify(board), key, board.result ? board.picks : null, id, playerId, revision).first();
  if (saved) return response(saved);
  const current = await query.first();
  return isRetry(current) ? response(current) : { error: 'stale_move', status: 409 };
}
