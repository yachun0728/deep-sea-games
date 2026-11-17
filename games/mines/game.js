  /* ---------- Mines: classic puzzle ---------- */
  var N = 25;
  var M = { active: false, over: false, mines: 3, layout: [], open: [], flags: [], picks: 0, flagMode: false, ready: false, best: 0 };
  var elBoard = $('board'), elMGo = $('mines-go'), elMMsg = $('mines-msg'), tiles = [];
  function mSay(text, cls) { elMMsg.textContent = text; elMMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  // Shared wallet refresh is also used by the other games.
  function syncBalance() { elBal.textContent = fmt(S.balance); save(); renderGo(); }
  function mineNeighbors(i) {
    var result = [];
    for (var j = 0; j < N; j++) if (j !== i && Math.abs(Math.floor(j / 5) - Math.floor(i / 5)) <= 1 && Math.abs(j % 5 - i % 5) <= 1) result.push(j);
    return result;
  }
  function mineNumber(i) { return mineNeighbors(i).filter(function (j) { return M.layout[j]; }).length; }
  function buildBoard() {
    try { var best = Number(localStorage.getItem('deep-sea-mines-best')); M.best = Number.isSafeInteger(best) && best >= 0 && best <= 22 ? best : 0; } catch (e) {}
    for (var i = 0; i < N; i++) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tile';
      b.addEventListener('click', pick.bind(null, i));
      b.addEventListener('contextmenu', (function (n) { return function (e) { e.preventDefault(); mineFlag(n); }; })(i));
      elBoard.appendChild(b); tiles.push(b);
    }
  }
  function renderMines() {
    tiles.forEach(function (b, i) {
      var shown = M.open[i] || M.over, number = shown && !M.layout[i] ? mineNumber(i) : 0;
      var text = shown ? (M.layout[i] ? '✹' : number || '·') : M.flags[i] ? '⚑' : '';
      b.className = 'tile' + (shown ? (M.layout[i] ? ' mine' : ' gem') : M.flags[i] ? ' flagged' : '');
      b.textContent = text; b.disabled = !M.active || !!M.open[i];
      b.setAttribute('aria-label', '第 ' + (Math.floor(i / 5) + 1) + ' 列第 ' + (i % 5 + 1) + ' 格，' + (shown ? M.layout[i] ? '地雷' : '周圍 ' + number + ' 顆雷' : M.flags[i] ? '已插旗' : '未翻開'));
    });
    $('mines-left').textContent = (22 - M.picks) + ' 格';
    $('mines-flags').textContent = M.flags.filter(Boolean).length + ' / 3';
    $('mines-best').textContent = M.best + ' / 22';
    $('mines-flag').disabled = !M.active;
    $('mines-flag').setAttribute('aria-pressed', String(M.flagMode));
    $('mines-flag').textContent = M.flagMode ? '⚑ 插旗模式（點此改翻格）' : '翻格模式（點此改插旗）';
    elMGo.disabled = M.active; elMGo.dataset.mode = M.active ? 'playing' : 'start';
    elMGo.innerHTML = M.active ? '找出全部安全格' : (M.over ? '再玩一局' : '開始踩地雷') + '<small>入場 ' + ENTRY_FEE + ' 點</small>';
  }
  function startMines() {
    if (M.active) return;
    if (S.balance < ENTRY_FEE) { mSay(LOW_MSG, 'lose'); return; }
    S.balance -= ENTRY_FEE;
    M.active = true; M.over = false; M.layout = []; M.open = []; M.flags = []; M.picks = 0; M.ready = false; M.flagMode = false;
    M.analytics = AN.start('mines', ENTRY_FEE);
    mSay('5 × 5 棋盤藏著 3 顆雷。第一格安全，數字代表周圍八格的雷數。');
    syncBalance(); renderMines();
  }
  function mineFinish(won) {
    if (!M.active) return;
    M.active = false; M.over = true;
    AN.end(M.analytics, 0, won ? 'complete' : 'loss', {step: M.picks, score: M.picks});
    mSay(won ? '成功排雷！22 格安全區全部找到了。' : '踩到地雷！這次找出 ' + M.picks + ' 格安全區，再試一次吧。', won ? 'win' : 'lose');
  }
  function mineFlag(i) {
    if (!M.active || M.open[i] || i < 0 || i >= N) return;
    if (!M.flags[i] && M.flags.filter(Boolean).length >= 3) { mSay('最多插 3 面旗，可以先取消其他旗子。'); return; }
    M.flags[i] = !M.flags[i]; renderMines();
  }
  function pick(i) {
    if (!M.active || i < 0 || i >= N || M.open[i]) return;
    if (M.flagMode) { mineFlag(i); return; }
    if (M.flags[i]) return;
    if (!M.ready) {
      var pool = []; for (var n = 0; n < N; n++) if (n !== i) pool.push(n);
      for (var j = pool.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = pool[j]; pool[j] = pool[r]; pool[r] = tmp; }
      pool.slice(0, 3).forEach(function (n) { M.layout[n] = true; }); M.ready = true;
    }
    if (M.layout[i]) { M.open[i] = true; mineFinish(false); renderMines(); return; }
    var queue = [i];
    while (queue.length) {
      var cell = queue.pop();
      if (M.open[cell] || M.flags[cell] || M.layout[cell]) continue;
      M.open[cell] = true; M.picks++;
      if (!mineNumber(cell)) queue = queue.concat(mineNeighbors(cell));
    }
    if (M.picks > M.best) { M.best = M.picks; try { localStorage.setItem('deep-sea-mines-best', String(M.best)); } catch (e) {} }
    AN.progress(M.analytics, {step: M.picks, score: M.picks});
    if (M.picks === 22) mineFinish(true);
    else mSay('已找到 ' + M.picks + ' 格安全區；根據數字判斷，再翻下一格。');
    renderMines();
  }
  elMGo.addEventListener('click', startMines);
  $('mines-flag').addEventListener('click', function () { if (!M.active) return; M.flagMode = !M.flagMode; renderMines(); });
