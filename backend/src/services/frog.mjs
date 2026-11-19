import frogRules from '../../../shared/frog-rules.cjs';

const ROUND_LIFETIME_MS = 15 * 60 * 1000;
const MAX_PROOF_BYTES = 40 * 1024;
const ROUND_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export async function startFrogRound(db, playerId) {
  const now = Date.now();
  const id = crypto.randomUUID();
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  await db.prepare(
    'INSERT INTO frog_rounds (id, player_id, seed, started_at) VALUES (?, ?, ?, ?)',
  ).bind(id, playerId, seed, now).run();
  return { id, seed };
}

export async function readFrogProof(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let json = '', size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PROOF_BYTES) {
        await reader.cancel();
        return null;
      }
      json += decoder.decode(value, { stream: true });
    }
    const proof = JSON.parse(json + decoder.decode());
    if (!proof || Object.keys(proof).length !== 3 || typeof proof.id !== 'string' ||
        !ROUND_ID.test(proof.id) || !Number.isInteger(proof.ticks) ||
        proof.ticks < 1 || proof.ticks > frogRules.MAX_TICKS || !Array.isArray(proof.presses)) return null;
    let previous = -1;
    for (const tick of proof.presses) {
      if (!Number.isInteger(tick) || tick <= previous || tick > proof.ticks) return null;
      previous = tick;
    }
    return proof;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function finishFrogRound(db, playerId, proof) {
  const roundQuery = db.prepare(
    'SELECT seed, started_at, proof_hash, score FROM frog_rounds WHERE id = ? AND player_id = ?',
  ).bind(proof.id, playerId);
  const round = await roundQuery.first();
  if (!round) return { error: 'round_not_found', status: 404 };

  const encoded = new TextEncoder().encode(JSON.stringify([proof.ticks, proof.presses]));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoded)).toHex();
  const priorResult = record => record.proof_hash === hash
    ? { score: record.score } : { error: 'round_already_finished', status: 409 };
  if (round.score !== null) return priorResult(round);

  const elapsed = Date.now() - round.started_at;
  if (elapsed > ROUND_LIFETIME_MS) return { error: 'round_expired', status: 410 };
  if (proof.ticks * frogRules.STEP_MS > elapsed) return { error: 'round_too_fast', status: 422 };

  const verified = frogRules.replay(round.seed, proof.ticks, proof.presses);
  if (!verified) return { error: 'invalid_round', status: 422 };

  // The migration trigger updates the personal best in this same atomic write.
  const saved = await db.prepare(
    'UPDATE frog_rounds SET score = ?, proof_hash = ? WHERE id = ? AND player_id = ? AND score IS NULL RETURNING score',
  ).bind(verified.score, hash, proof.id, playerId).first();
  return saved ?? priorResult(await roundQuery.first());
}
