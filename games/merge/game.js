  /* ---------- Merge ---------- */
  var MG_FEE = ENTRY_FEE, BEST = 'pearl-merge-best';
  var G = { grid: [0, 0, 2, 0, 0, 4, 2, 0, 8, 4, 0, 0, 32, 16, 2, 0], score: 0, best: 0, active: false, over: false, fresh: {} };
  var elMg = $('mg'), elGGo = $('mg-go'), elGMsg = $('mg-msg'), cells = [];
  var mergeRound = null, mergePending = null, mergeStarting = false, mergeSending = false;
  try { var gb = parseInt(localStorage.getItem(BEST), 10); if (isFinite(gb) && gb > 0) G.best = gb; } catch (e) {}

  function gSay(text, cls) { elGMsg.textContent = text; elGMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function mgTier(v) { var l = Math.round(Math.log(v) / Math.LN2); return l <= 2 ? 't1' : l <= 5 ? 't2' : l <= 8 ? 't3' : l <= 10 ? 't4' : 't5'; }
  function mgBuild() { for (var i = 0; i < 16; i++) { var c = document.createElement('div'); c.className = 'cell'; elMg.appendChild(c); cells.push(c); } }
  function mgRender() {
    var max = 0;
    cells.forEach(function (c, i) {
      var v = G.grid[i]; if (v > max) max = v;
      c.innerHTML = v ? '<span class="orb ' + mgTier(v) + (v >= 1000 ? ' d4' : v >= 100 ? ' d3' : '') + (G.fresh[i] ? ' new' : '') + '">' + v + '</span>' : '';
    });
    G.fresh = {};
    elMg.classList.toggle('idle', !G.active);
    $('mg-score').textContent = fmt(G.score);
    $('mg-max').textContent = G.active || G.over ? String(max) : '—';
    $('mg-best').textContent = fmt(G.best);
    document.querySelectorAll('[data-dir]').forEach(function (b) { b.disabled = !G.active || !!mergePending; });
    elGGo.disabled = mergeStarting || mergeSending;
    if (G.active) { elGGo.dataset.mode = 'cancel'; elGGo.innerHTML = '放棄重開'; }
    else { elGGo.dataset.mode = 'bet'; elGGo.innerHTML = (G.over ? '再玩一局' : '開始一局') + ''; }
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
    Object.assign(G, round ? round.state : mergeRules.create());
    G.fresh = Object.fromEntries(G.grid.flatMap((tile, i) => tile ? [[i,1]] : []));
    G.active = true;
    gSay('開始養珠。');
    syncBalance();
    mgRender();
  }
  async function mgStart() {
    if (mergeStarting || mergeSending) return;
    if (S.balance < MG_FEE) { gSay(LOW_MSG, 'lose'); return; }
    mergePending = null;
    if (typeof location === 'undefined' || location.protocol === 'file:') { beginMerge(null); return; }

    mergeStarting = true;
    mergeStatus('正在準備訪客排行…');
    mgRender();
    var round = null;
    try {
      var api = await import('./frontend/services/api.mjs');
      round = await api.startBoardRound('merge',AbortSignal.timeout(4000));
    } catch {}
    mergeStarting = false;
    if ($('view-merge').hidden) { mergeStatus(''); mgRender(); return; }
    mergeStatus(round ? '本局將列入訪客排行。' : '這一局可在本機遊玩。');
    beginMerge(round);
  }
  function updateMerge(before) {
    if (G.score > G.best) { G.best = G.score; try { localStorage.setItem(BEST, String(G.best)); } catch (e) {} }
    var max = Math.max(...G.grid);
    if (G.over) {
      AN.end(G.analytics,0,'complete',{score:G.score});
      G.active = false;
      gSay('盤面滿了，這一局結束：' + fmt(G.score) + ' 分，最大珍珠 ' + max + '。', 'lose');
    } else if (max > before && max >= 128) gSay('養出 ' + max + ' 的珍珠了！', 'win');
    mgRender();
  }
  async function sendMergeMove() {
    if (!mergePending || mergeSending) return;
    mergeSending = true;
    mergeStatus('正在驗證遊戲操作…');
    mgRender();
    try {
      var api = await import('./frontend/services/api.mjs');
      var next = await api.moveBoardRound(mergeRound.token,mergePending,AbortSignal.timeout(8000));
      var changed = next.revision !== mergeRound.revision;
      var before = Math.max(...G.grid);
      Object.assign(mergeRound,next);
      if (changed) Object.assign(G,next.state);
      mergePending = null;
      mergeStatus(next.state.over ? '成績已送到排行榜。' : '本局將列入訪客排行。');
      if (changed) updateMerge(before);
    } catch (error) {
      if (error.retryable === false) {
        mergePending = null;
        G.active = false;
        AN.end(G.analytics,0,'abandoned',{score:G.score});
        mergeStatus('排行榜回合已中斷，請再開一局。');
        mgRender();
      } else mergeStatus('遊戲操作未能送出。',true);
    } finally {
      mergeSending = false;
      elGGo.disabled = false;
      document.querySelectorAll('[data-dir]').forEach(function (button) { button.disabled = !G.active || !!mergePending; });
    }
  }
  function mgMove(dir) {
    if (!G.active || mergePending || mergeStarting || $('view-merge').hidden) return;
    if (mergeRound) {
      mergePending = {gameId:'merge',id:mergeRound.id,revision:mergeRound.revision,action:dir};
      sendMergeMove();
      return;
    }
    var before = Math.max(...G.grid);
    if (mergeRules.move(G,dir)) updateMerge(before);
  }
  $('mg-rank-retry').addEventListener('click',sendMergeMove);
  elGGo.addEventListener('click', mgStart);
  document.querySelectorAll('[data-dir]').forEach(function (b) { b.addEventListener('click', function () { mgMove(b.dataset.dir); }); });
  document.addEventListener('keydown', function (e) {
    if ($('view-merge').hidden || !G.active || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target.tagName || '').toLowerCase() === 'input') return;
    var map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' };
    var dir = map[e.code]; if (!dir) return;
    e.preventDefault(); mgMove(dir);
  });
  var swipe = null;
  elMg.addEventListener('pointerdown', function (e) { swipe = { x: e.clientX, y: e.clientY }; });
  elMg.addEventListener('pointerup', function (e) {
    if (!swipe) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y; swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    mgMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  elMg.addEventListener('pointercancel', function () { swipe = null; });

