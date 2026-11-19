import { API } from '../../shared/api.mjs';

export function createApiClient(baseUrl) {
  async function request(path, init, query) {
    const url = new URL(path, baseUrl);
    if (query) url.search = new URLSearchParams(query);
    const response = await fetch(url, { ...init, redirect: 'error' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'api_error');
    return body;
  }

  return {
    health: () => request(API.health),
    createPlayer: () => request(API.players, { method: 'POST' }),
    getPlayer: (token) => request(API.me, { headers: { Authorization: `Bearer ${token}` } }),
    leaderboard: (gameId, signal) => request(API.leaderboard, { signal }, { gameId }),
  };
}
