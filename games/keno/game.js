  /* ---------- Keno ---------- */
  var KE_N = 40, KE_DRAW = 10, KE_MAX = 10;
  var KE = { picked: {}, drawn: [], shown: 0, pending: 0, settled: false, tables: {}, rtp: {} };
  var elKGo = $('ke-go'), elKMsg = $('ke-msg'), elKAmt = $('ke-amount'), elKBoard = $('ke-board'), kcells = [];
  function kSay(text, cls) { elKMsg.textContent = text; elKMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readKAmount() { var v = Math.floor(Number(elKAmt.value)); return isFinite(v) ? v : 0; }
  function nCr(n, r) { if (r < 0 || r > n) return 0; var x = 1; for (var i = 1; i <= r; i++) x = x * (n - r + i) / i; return x; }
  function kePicks() { var a = []; for (var n = 1; n <= KE_N; n++) if (KE.picked[n]) a.push(n); return a; }
  // One payout table per pick count: nothing below a threshold, then ×3.5 per extra hit, scaled to a 97% return.
  function keTables() {
    for (var k = 1; k <= KE_MAX; k++) {
      var t = Math.max(1, Math.round(k * 0.3)), probs = [], e = 0, h, rtp = 0;
      for (h = 0; h <= k; h++) { probs.push(nCr(k, h) * nCr(KE_N - k, KE_DRAW - h) / nCr(KE_N, KE_DRAW)); if (h >= t) e += probs[h] * Math.pow(3.5, h - t); }
      var s = 0.97 / e;
      KE.tables[k] = probs.map(function (_, h) {
        if (h < t) return 0;
        var m = s * Math.pow(3.5, h - t);
        return m >= 100 ? Math.round(m) : m >= 10 ? Math.round(m * 10) / 10 : Math.round(m * 100) / 100;
      });
      for (h = 0; h <= k; h++) rtp += probs[h] * KE.tables[k][h];
      KE.rtp[k] = rtp;
    }
  }
  function keBuild() {
    for (var n = 1; n <= KE_N; n++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'kcell'; b.textContent = n;
      b.addEventListener('click', keToggle.bind(null, n));
      elKBoard.appendChild(b); kcells.push(b);
    }
  }
  function keUI() {
    var picks = kePicks(), k = picks.length, busy = KE.pending > 0, shown = {}, hits = 0;
    KE.drawn.slice(0, KE.shown).forEach(function (n) { shown[n] = 1; if (KE.picked[n]) hits++; });
    kcells.forEach(function (b, i) {
      var n = i + 1, state = shown[n] ? (KE.picked[n] ? 'hit' : 'miss') : KE.picked[n] ? 'picked' : '';
      b.className = 'kcell' + (state ? ' ' + state : '');
      b.disabled = busy;
      b.setAttribute('aria-pressed', String(!!KE.picked[n]));
      b.setAttribute('aria-label', n + ' 號' + (state === 'hit' ? '，命中' : state === 'miss' ? '，魚群出現但沒下網' : ''));
    });
    var table = KE.tables[k];
    $('ke-pay').innerHTML = table ? table.map(function (m, h) {
      return '<span class="kp' + (m ? '' : ' zero') + (KE.settled && h === hits ? ' on' : '') + '">' + h + ' 格<b>' + (m ? m + '×' : '0') + '</b></span>';
    }).join('') : '<span class="none">先在上面選格子，這裡會顯示對應的倍率表。</span>';
    $('ke-count').textContent = k + ' / ' + KE_MAX;
    $('ke-hits').textContent = KE.shown ? hits + ' 格' : '—';
    $('ke-rtp').textContent = k ? (KE.rtp[k] * 100).toFixed(1) + '%' : '—';
    elKAmt.disabled = busy;
    document.querySelectorAll('.kchip').forEach(function (b) { b.disabled = busy; });
    elKGo.disabled = busy;
    elKGo.innerHTML = busy ? '收網中…' : '撒網<small>下注 ' + fmt(readKAmount()) + ' 點 · 已選 ' + k + ' 格</small>';
  }
  function keClearDraw() { KE.drawn = []; KE.shown = 0; KE.settled = false; }
  function keToggle(n) {
    if (KE.pending) return;
    keClearDraw();
    if (KE.picked[n]) delete KE.picked[n];
    else if (kePicks().length >= KE_MAX) { kSay('最多選 ' + KE_MAX + ' 格，先取消一格再選。', 'lose'); keUI(); return; }
    else KE.picked[n] = 1;
    keUI();
  }
  function kePlay() {
    if (KE.pending) return;
    var a = readKAmount(), picks = kePicks(), k = picks.length;
    if (!k) { kSay('先選至少 1 格再撒網。', 'lose'); return; }
    if (a < MIN_BET) { kSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { kSay('餘額不足，請調低下注或重設點數。', 'lose'); return; }
    var pool = [], i;
    for (i = 1; i <= KE_N; i++) pool.push(i);
    for (i = KE_N - 1; i > 0; i--) { var r = Math.floor(Math.random() * (i + 1)), tmp = pool[i]; pool[i] = pool[r]; pool[r] = tmp; }
    KE.analytics=AN.start('keno',a); S.balance -= a; KE.pending = a; KE.drawn = pool.slice(0, KE_DRAW); KE.shown = 0; KE.settled = false;
    kSay('魚群出現中…');
    syncBalance(); keUI();
    (function reveal() {
      if (reduceMotion) KE.shown = KE_DRAW; else KE.shown++;
      if (KE.shown < KE_DRAW) { keUI(); setTimeout(reveal, 95); return; }
      var hits = KE.drawn.filter(function (n) { return KE.picked[n]; }).length, m = KE.tables[k][hits], pay = Math.floor(a * m);
      AN.end(KE.analytics,pay,pay>0?'complete':'loss'); S.balance += pay; KE.pending = 0; KE.settled = true;
      if (!pay) kSay('命中 ' + hits + ' 格，這一網落空，失去 ' + fmt(a) + ' 點。', 'lose');
      else kSay('命中 ' + hits + ' 格，' + m + '× 領回 ' + fmt(pay) + ' 點（' + (pay >= a ? '+' : '−') + fmt(Math.abs(pay - a)) + '）。', pay >= a ? 'win' : 'lose');
      syncBalance(); keUI();
    })();
  }
  elKGo.addEventListener('click', kePlay);
  elKAmt.addEventListener('input', keUI);
  $('ke-clear').addEventListener('click', function () { if (KE.pending) return; KE.picked = {}; keClearDraw(); kSay('已清除，重新選格子。'); keUI(); });
  $('ke-random').addEventListener('click', function () {
    if (KE.pending) return;
    KE.picked = {}; keClearDraw();
    while (kePicks().length < 5) KE.picked[1 + Math.floor(Math.random() * KE_N)] = 1;
    kSay('已隨機選 5 格。'); keUI();
  });
  document.querySelectorAll('[data-kchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readKAmount() || MIN_BET, k = b.dataset.kchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elKAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      keUI();
    });
  });

