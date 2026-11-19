async function tokenHash(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest).toHex();
}

export async function createPlayer(db) {
  const id = crypto.randomUUID();
  const token = crypto.getRandomValues(new Uint8Array(32)).toHex();
  await db.prepare('INSERT INTO players (id, token_hash) VALUES (?, ?)')
    .bind(id, await tokenHash(token)).run();
  return { id, token };
}

export async function findPlayer(db, authorization) {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization ?? '');
  if (!match) return null;

  return db.prepare('SELECT id FROM players WHERE token_hash = ?')
    .bind(await tokenHash(match[1])).first();
}
