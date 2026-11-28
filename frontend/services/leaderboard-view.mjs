import { arcadeApiOrigin, createApiClient } from './api.mjs';

const api = createApiClient(arcadeApiOrigin());
for (const gameId of ['meow-link', 'frontier', 'rocket-chair', 'blaster', 'quack-pond', 'mirror-twins', 'siege-architect']) {
  const view = document.getElementById('view-' + gameId);
  if (!view) continue;
  const details = document.createElement('details');
  details.className = 'rules game-leaderboard';
  const summary = document.createElement('summary');
  // The game name comes localized from the API (data-i18n-ignore keeps the i18n runtime off it);
  // '排行榜' stays a normal translatable text node, so the title reads "<gameName> 排行榜".
  const title = document.createElement('span');
  title.setAttribute('data-i18n-ignore', '');
  const label = document.createElement('span');
  label.textContent = '排行榜';
  summary.append(title, label);
  const setTitle = name => { title.textContent = name ? name + ' ' : ''; };
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const list = document.createElement('ol');
  details.append(summary, status, list);
  const host = view.querySelector('deep-sea-leaderboard[game-id="' + gameId + '"]');
  if (host) details.id = 'bl-rank-panel';
  (gameId==='meow-link'?document.getElementById('ml-leaderboard'):(host||view)).append(details);
  let generation = 0;
  async function refresh() {
    if (!details.open) { if(gameId==='meow-link'){generation++;list.replaceChildren();setTitle('');}return; }
    const request = ++generation;
    status.textContent = '載入排行榜中…';
    list.replaceChildren();
    try {
      const boardId=gameId==='meow-link'?'meow-link-'+({easy:'easy',standard:'normal',challenge:'hard'}[document.getElementById('ml-mode').value]):gameId;
      const result = await api.leaderboard(boardId, AbortSignal.timeout(10000));
      if (request !== generation) return;
      setTitle(result.gameName);
      list.replaceChildren(...result.entries.map(entry => {
        const row = document.createElement('li');
        const name = document.createElement('span');
        if (entry.displayName) name.setAttribute('data-i18n-ignore', '');
        name.textContent = entry.displayName || '訪客';
        const score = entry.time ? entry.time : gameId === 'blaster' ? entry.score.toLocaleString('en-US') + ' m' : entry.score;
        row.append(name, document.createTextNode(' · ' + score));
        return row;
      }));
      status.textContent = result.entries.length ? '' : '目前尚無排行榜紀錄。';
    } catch {
      if (request === generation) status.textContent = '目前無法載入排行榜。';
    }
  }
  details.addEventListener('toggle', refresh);
  if(gameId==='meow-link')document.getElementById('ml-mode').addEventListener('change',refresh);
  // The cached name is in the old language: drop it until the next load.
  window.addEventListener('arcade-languagechange', () => {
    setTitle('');
    refresh();
  });
  window.addEventListener('deep-sea-score-saved', event => {
    if (event.detail.gameId === gameId) refresh();
  });
}

// Mermaid's help panel always selects the currently chosen suit-count board.
const mmPanel=document.getElementById('mm-board-list');
if(mmPanel){
 let generation=0;
 async function load(){if(!mmPanel.open)return;const n=++generation,list=document.getElementById('mm-board-entries');list.textContent='';
 try{const mode=document.getElementById('mm-stage').dataset.mode||'1';const result=await api.leaderboard('mermaid-time-'+mode,AbortSignal.timeout(10000));if(n!==generation)return;
 if(!result.entries.length){const li=document.createElement('li');li.textContent='目前尚無排行榜紀錄。';list.append(li);}for(const entry of result.entries){const li=document.createElement('li');li.setAttribute('data-i18n-ignore','');li.textContent=(entry.displayName||'Guest')+' · '+entry.time;list.append(li);}
 }catch{const li=document.createElement('li');li.textContent='目前無法載入排行榜。';list.append(li);}}
 mmPanel.addEventListener('toggle',load);document.querySelectorAll('.mm-mode').forEach(b=>b.addEventListener('click',()=>{generation++;load();}));window.addEventListener('deep-sea-score-saved',load);
}
