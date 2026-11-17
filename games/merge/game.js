  /* ---------- Merge ---------- */
  var MG_FEE = ENTRY_FEE, BEST = 'pearl-merge-best';
  var G = { grid: [0, 0, 2, 0, 0, 4, 2, 0, 8, 4, 0, 0, 32, 16, 2, 0], score: 0, best: 0, active: false, over: false, fresh: {} };
  var elMg = $('mg'), elGGo = $('mg-go'), elGMsg = $('mg-msg'), cells = [];
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
    document.querySelectorAll('[data-dir]').forEach(function (b) { b.disabled = !G.active; });
    if (G.active) { elGGo.dataset.mode = 'cancel'; elGGo.innerHTML = '放棄重開<small>再扣 ' + MG_FEE + ' 點</small>'; }
    else { elGGo.dataset.mode = 'bet'; elGGo.innerHTML = (G.over ? '再玩一局' : '開始一局') + '<small>扣 ' + MG_FEE + ' 點</small>'; }
  }
  function mgSpawn() {
    var empty = []; G.grid.forEach(function (v, i) { if (!v) empty.push(i); });
    if (!empty.length) return;
    var i = empty[Math.floor(Math.random() * empty.length)];
    G.grid[i] = Math.random() < 0.9 ? 2 : 4; G.fresh[i] = 1;
  }
  function mgCanMove() {
    for (var i = 0; i < 16; i++) {
      if (!G.grid[i]) return true;
      if (i % 4 < 3 && G.grid[i] === G.grid[i + 1]) return true;
      if (i < 12 && G.grid[i] === G.grid[i + 4]) return true;
    }
    return false;
  }
  function mgStart() {
    if (S.balance < MG_FEE) { gSay(LOW_MSG, 'lose'); return; }
    if(G.active)AN.end(G.analytics,0,'restart',{score:G.score});
    G.analytics=AN.start('merge',MG_FEE); S.balance -= MG_FEE;
    G.grid = []; for (var i = 0; i < 16; i++) G.grid.push(0);
    G.score = 0; G.active = true; G.over = false; G.fresh = {};
    mgSpawn(); mgSpawn();
    gSay('已扣 ' + MG_FEE + ' 點，開始養珠。');
    syncBalance(); mgRender();
  }
  function mgMove(dir) {
    if (!G.active) return;
    var moved = false, before = Math.max.apply(null, G.grid);
    for (var a = 0; a < 4; a++) {
      var idxs = [], b;
      for (b = 0; b < 4; b++) idxs.push(dir === 'left' ? a * 4 + b : dir === 'right' ? a * 4 + 3 - b : dir === 'up' ? b * 4 + a : (3 - b) * 4 + a);
      var vals = idxs.map(function (i) { return G.grid[i]; }).filter(Boolean), out = [], merged = {};
      for (b = 0; b < vals.length; b++) {
        if (vals[b] === vals[b + 1]) { out.push(vals[b] * 2); G.score += vals[b] * 2; merged[out.length - 1] = 1; b++; }
        else out.push(vals[b]);
      }
      while (out.length < 4) out.push(0);
      idxs.forEach(function (gi, p) { if (G.grid[gi] !== out[p]) moved = true; G.grid[gi] = out[p]; if (merged[p]) G.fresh[gi] = 1; });
    }
    if (!moved) { G.fresh = {}; return; }
    mgSpawn();
    if (G.score > G.best) { G.best = G.score; try { localStorage.setItem(BEST, String(G.best)); } catch (e) {} }
    var max = Math.max.apply(null, G.grid);
    if (!mgCanMove()) { AN.end(G.analytics,0,'complete',{score:G.score}); G.active = false; G.over = true; gSay('盤面滿了，這一局結束：' + fmt(G.score) + ' 分，最大珍珠 ' + max + '。', 'lose'); }
    else if (max > before && max >= 128) gSay('養出 ' + max + ' 的珍珠了！', 'win');
    mgRender();
  }
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

