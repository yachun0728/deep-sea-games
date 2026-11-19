import { API } from '../../shared/api.mjs';

export function arcadeApiOrigin() {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    return 'http://' + location.hostname + ':8787';
  }
  return document.querySelector('meta[name="leaderboard-api-origin"]').content.trim() || location.origin;
}

export function createApiClient(baseUrl) {
  async function request(path, init, query) {
    const url = new URL(path, baseUrl);
    if (query) url.search = new URLSearchParams(query);
    const response = await fetch(url, { ...init, redirect: 'error' });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error ?? 'api_error');
      error.status = response.status;
      error.retryable = response.status >= 500 || response.status === 429;
      throw error;
    }
    return body;
  }

  function authorized(method, token, signal, proof) {
    const headers = { Authorization: `Bearer ${token}` };
    if (proof) headers['Content-Type'] = 'application/json';
    return { method, headers, signal, body: proof ? JSON.stringify(proof) : undefined };
  }

  return {
    health: () => request(API.health),
    createPlayer: signal => request(API.players, { method: 'POST', signal }),
    getPlayer: token => request(API.me, authorized('GET', token)),
    leaderboard: (gameId, signal) => request(API.leaderboard, { signal }, { gameId }),
    startFrog: (token, signal) => request(API.frogStart, authorized('POST', token, signal)),
    finishFrog: (token, proof, signal) => request(API.frogFinish, authorized('POST', token, signal, proof)),
  };
}

const GUEST_KEY = 'deep-sea-leaderboard-guest-v1';
let guestToken;

async function ensureGuest(api, signal, rejected) {
  const load = async () => {
    let saved = guestToken;
    try { saved = localStorage.getItem(GUEST_KEY) || saved; } catch {}
    if (/^[a-f0-9]{64}$/.test(saved ?? '') && saved !== rejected) return saved;
    const guest = await api.createPlayer(signal);
    guestToken = guest.token;
    try { localStorage.setItem(GUEST_KEY, guestToken); } catch {}
    return guestToken;
  };
  return navigator.locks
    ? navigator.locks.request(GUEST_KEY, { signal }, load) : load();
}

export async function startFrogRound(signal) {
  const api = createApiClient(arcadeApiOrigin());
  let token = await ensureGuest(api, signal);
  try {
    return { ...await api.startFrog(token, signal), token };
  } catch (error) {
    if (error.status !== 401) throw error;
    token = await ensureGuest(api, signal, token);
    return { ...await api.startFrog(token, signal), token };
  }
}

export function finishFrogRound({ id, token, ticks, presses }, signal) {
  return createApiClient(arcadeApiOrigin()).finishFrog(token, { id, ticks, presses }, signal);
}
