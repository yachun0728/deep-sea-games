import { LEADERBOARD_LIMIT } from '../../../shared/api.mjs';

export async function getLeaderboard(db, gameId) {
  const { results } = await db.prepare(
    `SELECT scores.player_id AS playerId, players.display_name AS displayName, scores.score
       FROM best_scores AS scores JOIN players ON players.id = scores.player_id
      WHERE scores.game_id = ?
      ORDER BY scores.score DESC, scores.player_id
      LIMIT ?`,
  ).bind(gameId, LEADERBOARD_LIMIT).all();
  return results;
}
