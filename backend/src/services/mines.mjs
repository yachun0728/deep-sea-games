import minesRules from '../../../shared/mines-rules.cjs';
import timedReplay from '../../../shared/timed-replay.cjs';

const LIFETIME_MS = 30 * 60 * 1000;
const MAX_MOVES = 500;
const ROUND_ID = /^[a-f0-9-]{36}$/;
const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

function initialBoard(seed) {
  return minesRules.create(5, 3, timedReplay.seeded(seed));
}

function snapshot(id, revision, board, seed) {
  const visible = Array.from({ length: board.size ** 2 }, (_, cell) => {
    if (board.open[cell] && !board.layout[cell]) return minesRules.number(board, cell);
    return board.flags[cell] ? 'flag' : null;
  });
  return { id, revision, seed, visible, picks: board.picks, result: board.result };
}

// The client plays the board locally from this seed and sends every move once, when the round ends.
export async function startMinesRound(db, playerId) {
  const id = crypto.randomUUID(), seed = newSeed();
  await db.prepare(
    'INSERT INTO mines_rounds (id, player_id, started_at, board) VALUES (?, ?, ?, ?)',
  ).bind(id, playerId, Date.now(), JSON.stringify({ seed })).run();
  return snapshot(id, 0, initialBoard(seed), seed);
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
      if (bytes > 4096) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    const move = JSON.parse(text + decoder.decode());
    if (!move || Object.keys(move).length !== 3 || typeof move.id !== 'string' ||
        !ROUND_ID.test(move.id) || !Number.isInteger(move.revision) ||
        move.revision < 0 || move.revision > 1 || !Array.isArray(move.moves) ||
        move.moves.length < 1 || move.moves.length > MAX_MOVES ||
        !move.moves.every(code => Number.isInteger(code) && code >= 0 && code < 50)) return null;
    return move;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function applyMinesMove(db, playerId, { id, revision, moves }) {
  const query = db.prepare(
    'SELECT started_at, revision, last_move, board, score FROM mines_rounds WHERE id = ? AND player_id = ?',
  ).bind(id, playerId);
  const prior = await query.first();
  if (!prior) return { error: 'round_not_found', status: 404 };

  const key = JSON.stringify(moves);
  const stored = JSON.parse(prior.board);
  const isRetry = row => row.revision === revision + 1 && row.last_move === key;
  const response = row => snapshot(id, row.revision, JSON.parse(row.board), stored.seed);
  if (isRetry(prior)) return response(prior);
  if (prior.revision !== revision || revision !== 0 || prior.score !== null) return { error: 'stale_move', status: 409 };
  if (Date.now() - prior.started_at > LIFETIME_MS) return { error: 'round_expired', status: 410 };

  const board = initialBoard(stored.seed);
  for (const code of moves) {
    if (minesRules.move(board, code & 1 ? 'flag' : 'open', code >> 1) !== true) return snapshot(id, revision, initialBoard(stored.seed), stored.seed);
  }
  if (!board.result) return snapshot(id, revision, initialBoard(stored.seed), stored.seed);

  const saved = await db.prepare(
    'UPDATE mines_rounds SET board = ?, revision = revision + 1, last_move = ?, score = ? WHERE id = ? AND player_id = ? AND revision = ? AND score IS NULL RETURNING board, revision',
  ).bind(JSON.stringify({ ...board, seed: stored.seed }), key, board.result === 'win' ? board.picks : null, id, playerId, revision).first();
  if (saved) return response(saved);
  const current = await query.first();
  return isRetry(current) ? response(current) : { error: 'stale_move', status: 409 };
}
