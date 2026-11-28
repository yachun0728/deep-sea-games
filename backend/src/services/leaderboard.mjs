import meowRules from '../../../shared/meow-link-rules.cjs';
import { LEADERBOARD_LIMIT } from '../../../shared/api.mjs';

const NAME_COLUMN = { en: 'game_name_en', 'zh-cn': 'game_name_zh_cn', 'zh-hans': 'game_name_zh_cn' };

// lang: 'en' | 'zh-Hans' | 'zh-CN' (case-insensitive, '_' accepted); anything else -> zh-Hant default.
// Empty or missing localized names fall back to game_name; unknown game IDs give null.
function pickName(row, lang) {
  if (!row) return null;
  const key = String(lang ?? '').toLowerCase().replace('_', '-');
  const column = NAME_COLUMN[key];
  return (column && row[column]) || row.game_name;
}

export async function getGameName(db, gameId, lang) {
  const row = await db.prepare(
    'SELECT game_name, game_name_en, game_name_zh_cn FROM game_names WHERE game_id = ?',
  ).bind(gameId).first();
  return pickName(row, lang);
}

export async function getLeaderboard(db, gameId) {
  const { results } = await db.prepare(
    `SELECT scores.player_id AS playerId, players.display_name AS displayName, scores.score, scores.recorded_at AS recordedAt
       FROM game_leaderboard AS scores JOIN players ON players.id = scores.player_id
      WHERE scores.game_id = ?
      ORDER BY scores.score DESC, scores.recorded_at, scores.score_order, scores.player_id
      LIMIT ?`,
  ).bind(gameId, LEADERBOARD_LIMIT).all();
  return results.map(entry => timedEntry(gameId,entry));
}

export async function getLeaderboardFeed(db, lang) {
  const { results } = await db.prepare(
    `SELECT scores.game_id AS gameId, scores.player_id AS playerId,
            players.display_name AS displayName, scores.score, scores.recorded_at AS recordedAt,
            activity.last_played_at AS lastPlayedAt
       FROM game_leaderboard AS scores JOIN players ON players.id = scores.player_id
       LEFT JOIN leaderboard_activity AS activity ON activity.game_id = scores.game_id
      WHERE scores.game_id <> 'meow-link'
      ORDER BY activity.last_played_at DESC, scores.game_id, scores.score DESC,
               scores.recorded_at, scores.score_order, scores.player_id`,
  ).all();
  const { results: names } = await db.prepare(
    'SELECT game_id, game_name, game_name_en, game_name_zh_cn FROM game_names',
  ).all();
  const nameById = new Map(names.map(row => [row.game_id, pickName(row, lang)]));
  const games = new Map();
  for (const { gameId, lastPlayedAt, ...entry } of results) {
    if (!games.has(gameId)) games.set(gameId, {gameId, gameName: nameById.get(gameId) ?? null, lastPlayedAt, entries: []});
    games.get(gameId).entries.push(timedEntry(gameId,entry));
  }
  return Array.from(games.values());
}

function timedEntry(gameId,entry) {
  if(!/^meow-link-(easy|normal|hard)$/.test(gameId))return entry;
  const elapsedMs=meowRules.MEOW_TIME_LIMIT_MS-entry.score;
  return {...entry,elapsedMs,time:meowRules.formatMeowLinkTime(elapsedMs)};
}
