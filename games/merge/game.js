  /* ---------- Merge ---------- */
  var MG_FEE = ENTRY_FEE, BEST = 'pearl-merge-best';
  var G = { grid: [0, 0, 2, 0, 0, 4, 2, 0, 8, 4, 0, 0, 32, 16, 2, 0], score: 0, best: 0, active: false, over: false, fresh: {} };
  var elMg = $('mg'), elGGo = $('mg-go'), elGMsg = $('mg-msg'), cells = [];
  var mergeRound = null, mergeRandom = null, mergeActions = [], mergePending = null, mergeStarting = false, mergeSending = false;
  try { var gb = parseInt(localStorage.getItem(BEST), 10); if (isFinite(gb) && gb > 0) G.best = gb; } catch (e) {}

  var mergeMilestone = 0, mergeNoticeTimer = 0;
  var mergeResult = null, mergeStartingBest = G.best;

  function mergeText(template, values) {
    var i18n = window.deepSeaI18n;
    return (i18n ? i18n.text(template) : template).replace(/\{(\d+)\}/g, (_, index) => values[index]);
  }

  function mergeFeedback() {
    $('mg-milestone').textContent = mergeMilestone
      ? mergeText('{{t:merge.msg.013}}', [mergeMilestone]) : '';
    if (mergeResult) {
      elGMsg.setAttribute('data-i18n-ignore', '');
      elGMsg.textContent = mergeText(
        mergeResult.best ? '{{t:merge.msg.014}}' : '{{t:merge.msg.015}}',
        [fmt(G.score), mergeResult.max]
      );
    }
  }

  function celebrateMerge(max) {
    clearTimeout(mergeNoticeTimer);
    mergeMilestone = max;
    mergeFeedback();
    if (max) mergeNoticeTimer = setTimeout(() => {
      mergeMilestone = 0;
      mergeFeedback();
    }, 1000);
  }

  function gSay(text) {
    elGMsg.removeAttribute('data-i18n-ignore');
    elGMsg.textContent = text;
  }
  function mgTier(v) { var l = Math.round(Math.log(v) / Math.LN2); return l <= 2 ? 't1' : l <= 5 ? 't2' : l <= 8 ? 't3' : l <= 10 ? 't4' : 't5'; }
  function mgBuild() { for (var i = 0; i < 16; i++) { var c = document.createElement('div'); c.className = 'cell'; elMg.appendChild(c); cells.push(c); } }
  function mgRender() {
    var max = 0;
    cells.forEach(function (c, i) {
      var v = G.grid[i]; if (v > max) max = v;
      c.innerHTML = v ? '<span class="orb ' + mgTier(v) + (v >= 10000 ? ' d5' : v >= 1000 ? ' d4' : v >= 100 ? ' d3' : '') + (G.fresh[i] ? ' new' : '') + '">' + v + '</span>' : '';
    });
    G.fresh = {};
    elMg.classList.toggle('idle', !G.active);
    $('mg-score').textContent = fmt(G.score);
    $('mg-max').textContent = G.active || G.over ? String(max) : '—';
    $('mg-best').textContent = fmt(G.best);
    $('view-merge').classList.toggle('mg-playing', G.active);
    elGGo.disabled = mergeStarting || mergeSending;
    if (G.active) { elGGo.dataset.mode = 'cancel'; elGGo.innerHTML = '{{t:merge.msg.001}}'; }
    else { elGGo.dataset.mode = 'bet'; elGGo.innerHTML = (G.over ? '{{t:merge.msg.002}}' : '{{t:merge.msg.003}}') + ''; }
  }
  function mergeStatus(text, retry) {
    var status = $('mg-rank-status');
    status.textContent = text;
    status.hidden = !text;
    $('mg-rank-retry').hidden = !retry;
  }
  function beginMerge(round) {
    mergeRound = round;
    if (G.active) AN.end(G.analytics,0,'restart',{score:G.score});
    G.analytics = AN.start('merge',MG_FEE);
    mergeActions = [];
    mergeRandom = round ? timedReplay.seeded(round.state.seed) : null;
    Object.assign(G, round ? Object.assign(mergeRules.create(mergeRandom), {over:false}) : mergeRules.create());
    G.fresh = Object.fromEntries(G.grid.flatMap((tile, i) => tile ? [[i,1]] : []));
    G.active = true;
    elMgArea.querySelector('.mg-rules').open = false;
    mergeResult = null;
    mergeStartingBest = G.best;
    celebrateMerge(0);
    gSay('{{t:merge.msg.004}}');
    syncBalance();
    mgRender();
  }
  async function mgStart() {
    if (mergeStarting || mergeSending) return;
    if (S.balance < MG_FEE) { gSay(LOW_MSG); return; }
    mergePending = null;
    if (typeof location === 'undefined' || location.protocol === 'file:') { beginMerge(null); return; }

    mergeStarting = true;
    mergeStatus('{{t:merge.msg.005}}');
    mgRender();
    var round = null;
    try {
      var api = await import('./frontend/services/api.mjs');
      round = await api.startBoardRound('merge',AbortSignal.timeout(4000));
    } catch {}
    mergeStarting = false;
    if ($('view-merge').hidden) { mergeStatus(''); mgRender(); return; }
    mergeStatus(round ? '{{t:merge.msg.006}}' : '{{t:merge.msg.007}}');
    beginMerge(round);
  }
  function updateMerge(before) {
    if (G.score > G.best) { G.best = G.score; try { localStorage.setItem(BEST, String(G.best)); } catch (e) {} }
    var max = Math.max(...G.grid);
    if (G.over) {
      AN.end(G.analytics,0,'complete',{score:G.score});
      G.active = false;
      mergeResult = { max, best: G.score > mergeStartingBest };
      mergeFeedback();
    }
    if (max > before && max >= 2048) celebrateMerge(max);
    mgRender();
  }
  async function sendMergeMove() {
    if (!mergePending || mergeSending) return;
    mergeSending = true;
    mergeStatus('{{t:merge.msg.009}}');
    mgRender();
    try {
      var api = await import('./frontend/services/api.mjs');
      var next = await api.moveBoardRound(mergeRound.token,mergePending,AbortSignal.timeout(10000));
      var saved = next.revision !== mergePending.revision && next.state.score === G.score;
      mergePending = null;
      mergeStatus(saved ? '{{t:merge.msg.010}}' : '{{t:merge.msg.011}}');
    } catch (error) {
      if (error.retryable === false) {
        mergePending = null;
        mergeStatus('{{t:merge.msg.011}}');
      } else mergeStatus('{{t:merge.msg.012}}',true);
    } finally {
      mergeSending = false;
      mgRender();
    }
  }
  function mgMove(dir) {
    if (!G.active || mergeStarting || $('view-merge').hidden) return;
    var before = Math.max(...G.grid);
    if (!mergeRules.move(G,dir,mergeRandom || Math.random)) return;
    if (mergeRound) {
      mergeActions.push(mergeRules.directions.indexOf(dir));
      if (mergeActions.length > 8000) { mergeRound = null; mergeStatus('{{t:merge.msg.011}}'); }
    }
    updateMerge(before);
    if (mergeRound && G.over) {
      mergePending = {gameId:'merge',id:mergeRound.id,revision:mergeRound.revision,action:mergeActions};
      sendMergeMove();
    }
  }
  window.addEventListener('arcade-languagechange', mergeFeedback);
  $('mg-rank-retry').addEventListener('click',sendMergeMove);
  elGGo.addEventListener('click', mgStart);
  $('mg-exit').addEventListener('click', function () { window.location.hash = 'lobby'; });
  document.addEventListener('keydown', function (e) {
    if ($('view-merge').hidden || !G.active || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target.tagName || '').toLowerCase() === 'input') return;
    var map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' };
    var dir = map[e.code]; if (!dir) return;
    e.preventDefault(); mgMove(dir);
  });
  var swipe = null, elMgArea = elMg.closest('.mg-console');
  elMgArea.addEventListener('pointerdown', function (e) {
    if (!G.active || mergeStarting || swipe || !e.isPrimary || e.button !== 0 ||
        e.target.closest('button, summary')) return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
    elMgArea.setPointerCapture(e.pointerId);
  });
  elMgArea.addEventListener('pointerup', function (e) {
    if (!swipe || e.pointerId !== swipe.id) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    mgMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  function cancelMergeSwipe(e) {
    if (swipe && e.pointerId === swipe.id) swipe = null;
  }
  elMgArea.addEventListener('pointercancel', cancelMergeSwipe);
  elMgArea.addEventListener('lostpointercapture', cancelMergeSwipe);
  window.addEventListener('blur', () => { swipe = null; });
  window.addEventListener('hashchange', () => { swipe = null; });
  elMgArea.addEventListener('contextmenu', function (e) { if (G.active) e.preventDefault(); });
