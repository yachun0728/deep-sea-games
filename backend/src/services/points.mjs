export async function getBalance(db, playerId) {
  const result = await db.prepare(
    'SELECT COALESCE(SUM(delta), 0) AS balance FROM point_entries WHERE player_id = ?',
  ).bind(playerId).first();
  return result.balance;
}
