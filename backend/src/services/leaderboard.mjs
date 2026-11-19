import { LEADERBOARD_LIMIT } from '../../../shared/api.mjs';

export async function getLeaderboard(db, gameId) {
  const { results } = await db.prepare(
    `SELECT scores.player_id AS playerId, players.display_name AS displayName, scores.score, scores.recorded_at AS recordedAt
       FROM game_leaderboard AS scores JOIN players ON players.id = scores.player_id
      WHERE scores.game_id = ?
      ORDER BY scores.score DESC, scores.recorded_at, scores.score_order, scores.player_id
      LIMIT ?`,
  ).bind(gameId, LEADERBOARD_LIMIT).all();
  return results;
}

export async function getLeaderboardFeed(db) {
  const { results } = await db.prepare(
    `SELECT scores.game_id AS gameId, scores.player_id AS playerId,
            players.display_name AS displayName, scores.score, scores.recorded_at AS recordedAt
       FROM game_leaderboard AS scores JOIN players ON players.id = scores.player_id
      ORDER BY scores.game_id, scores.score DESC, scores.recorded_at, scores.score_order, scores.player_id`,
  ).all();
  const games = new Map();
  for (const { gameId, ...entry } of results) {
    if (!games.has(gameId)) games.set(gameId, []);
    games.get(gameId).push(entry);
  }
  return Array.from(games, ([gameId, entries]) => ({gameId, entries}));
}
