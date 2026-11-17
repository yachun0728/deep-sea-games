  /* ---------- Mines ---------- */
  var N = 25;
  var M = { active: false, over: false, bet: 0, mines: 3, layout: [], open: [], picks: 0, hit: -1 };
  var elBoard = $('board'), elMGo = $('mines-go'), elMMsg = $('mines-msg'), elMAmt = $('mines-amount'), elMCount = $('mines-count');
  var tiles = [];
  var SVG_PEARL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="currentColor"/><circle cx="9.2" cy="9.2" r="2.4" fill="#fff" opacity=".75"/></svg>';
  var SVG_MINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="6.5" fill="currentColor"/></svg>';

  function minesMult(k, m) { var x = 0.97; for (var i = 0; i < k; i++) x *= (N - i) / (N - m - i); return Math.floor(x * 100) / 100; }
  function readMines() { var v = Math.floor(Number(elMCount.value)); return isFinite(v) ? Math.max(1, Math.min(N - 1, v)) : 3; }
  function readMAmount() { var v = Math.floor(Number(elMAmt.value)); return isFinite(v) ? v : 0; }
  function mSay(text, cls) { elMMsg.textContent = text; elMMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function syncBalance() { elBal.textContent = fmt(S.balance); save(); renderGo(); }

  function buildBoard() {
    for (var i = 0; i < N; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tile';
      b.addEventListener('click', pick.bind(null, i));
      elBoard.appendChild(b); tiles.push(b);
    }
  }
  function renderMines() {
    var m = M.active || M.over ? M.mines : readMines();
    tiles.forEach(function (b, i) {
      var pos = '第 ' + (Math.floor(i / 5) + 1) + ' 列第 ' + (i % 5 + 1) + ' 格', cls = 'tile', html = '', label = pos + '，未翻開';
      var shown = M.open[i] || M.over;
      if (shown && M.layout[i]) { cls += ' mine' + (i === M.hit ? ' hit' : ''); html = SVG_MINE; label = pos + '，水雷'; }
      else if (shown) { cls += ' gem'; html = SVG_PEARL; label = pos + '，珍珠'; }
      if (M.over && !M.open[i]) cls += ' dim';
      if (!M.active && !M.over) cls += ' idle';
      b.className = cls; b.innerHTML = html; b.setAttribute('aria-label', label);
      b.disabled = !M.active || !!M.open[i];
    });
    var safeLeft = N - m - M.picks;
    $('mines-mult').textContent = M.picks > 0 ? fx(minesMult(M.picks, m)) + '×' : '—';
    $('mines-next').textContent = M.over || safeLeft <= 0 ? '—' : fx(minesMult(M.picks + 1, m)) + '×';
    $('mines-left').textContent = M.over ? '—' : String(safeLeft);
    elMAmt.disabled = M.active; elMCount.disabled = M.active;
    document.querySelectorAll('.mchip').forEach(function (b) { b.disabled = M.active; });
    if (!M.active) { elMGo.dataset.mode = 'bet'; elMGo.disabled = false; elMGo.innerHTML = (M.over ? '再來一局' : '開始') + '<small>下注 ' + fmt(readMAmount()) + ' 點 · ' + readMines() + ' 顆水雷</small>'; }
    else if (M.picks === 0) { elMGo.dataset.mode = 'done'; elMGo.disabled = true; elMGo.innerHTML = '先翻開一格<small>第一格 ' + fx(minesMult(1, m)) + '×</small>'; }
    else { elMGo.dataset.mode = 'surface'; elMGo.disabled = false; elMGo.innerHTML = '領回<small>' + fmt(Math.floor(M.bet * minesMult(M.picks, m))) + ' 點 · ' + fx(minesMult(M.picks, m)) + '×</small>'; }
  }
  function startMines() {
    var a = readMAmount();
    if (a < MIN_BET) { mSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { mSay('餘額不足，請調低下注或重設點數。', 'lose'); return; }
    var m = readMines(); elMCount.value = m;
    var cells = []; for (var i = 0; i < N; i++) cells.push(i < m);
    for (var j = N - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = cells[j]; cells[j] = cells[r]; cells[r] = tmp; }
    S.balance -= a;
    M.analytics=AN.start('mines',a); M.active = true; M.over = false; M.bet = a; M.mines = m; M.layout = cells; M.open = []; M.picks = 0; M.hit = -1;
    mSay('已下注 ' + fmt(a) + ' 點，海域裡有 ' + m + ' 顆水雷。');
    syncBalance(); renderMines();
  }
  function cashMines() {
    var mult = minesMult(M.picks, M.mines), pay = Math.floor(M.bet * mult);
    AN.end(M.analytics,pay,'cashout',{step:M.picks,multiplier:mult}); S.balance += pay; M.active = false; M.over = true;
    mSay('在 ' + fx(mult) + '× 領回 ' + fmt(pay) + ' 點（+' + fmt(pay - M.bet) + '）。', 'win');
    syncBalance(); renderMines();
  }
  function pick(i) {
    if (!M.active || M.open[i]) return;
    M.open[i] = true;
    if (M.layout[i]) {
      AN.end(M.analytics,0,'loss',{step:M.picks}); M.active = false; M.over = true; M.hit = i;
      mSay('翻到水雷，失去 ' + fmt(M.bet) + ' 點。', 'lose');
      renderMines(); return;
    }
    M.picks++; AN.progress(M.analytics,{step:M.picks});
    if (M.picks === N - M.mines) { cashMines(); return; }
    mSay('珍珠！目前 ' + fx(minesMult(M.picks, M.mines)) + '×，可以領回或繼續翻。');
    renderMines();
  }
  elMGo.addEventListener('click', function () { if (M.active) { if (M.picks > 0) cashMines(); } else startMines(); });
  elMAmt.addEventListener('input', renderMines);
  elMCount.addEventListener('input', renderMines);
  elMCount.addEventListener('change', function () { elMCount.value = readMines(); renderMines(); });
  document.querySelectorAll('[data-mchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readMAmount() || MIN_BET, k = b.dataset.mchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elMAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      renderMines();
    });
  });
  document.querySelectorAll('[data-mcount]').forEach(function (b) {
    b.addEventListener('click', function () { elMCount.value = b.dataset.mcount; renderMines(); });
  });

