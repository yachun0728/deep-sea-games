import { arcadeApiOrigin, createApiClient } from './api.mjs';

const api = createApiClient(arcadeApiOrigin());
for (const gameId of ['frontier', 'rocket-chair', 'blaster']) {
  const view = document.getElementById('view-' + gameId);
  if (!view) continue;
  const details = document.createElement('details');
  details.className = 'rules game-leaderboard';
  const summary = document.createElement('summary');
  summary.textContent = '排行榜';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const list = document.createElement('ol');
  details.append(summary, status, list);
  const host = view.querySelector('deep-sea-leaderboard[game-id="' + gameId + '"]');
  if (host) details.id = 'bl-rank-panel';
  (host || view).append(details);
  let generation = 0;
  async function refresh() {
    if (!details.open) return;
    const request = ++generation;
    status.textContent = '載入排行榜中…';
    list.replaceChildren();
    try {
      const result = await api.leaderboard(gameId, AbortSignal.timeout(10000));
      if (request !== generation) return;
      list.replaceChildren(...result.entries.map(entry => {
        const row = document.createElement('li');
        const name = document.createElement('span');
        if (entry.displayName) name.setAttribute('data-i18n-ignore', '');
        name.textContent = entry.displayName || '訪客';
        const score = gameId === 'blaster' ? entry.score.toLocaleString('en-US') + ' m' : entry.score;
        row.append(name, document.createTextNode(' · ' + score));
        return row;
      }));
      status.textContent = result.entries.length ? '' : '目前尚無排行榜紀錄。';
    } catch {
      if (request === generation) status.textContent = '目前無法載入排行榜。';
    }
  }
  details.addEventListener('toggle', refresh);
  window.addEventListener('deep-sea-score-saved', event => {
    if (event.detail.gameId === gameId) refresh();
  });
}
