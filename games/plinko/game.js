  /* ---------- Plinko ---------- */
  var RISK = { low: { c: 0.5, p: 2 }, mid: { c: 0.4, p: 4 }, high: { c: 0.2, p: 6 } };
  var P = { rows: 12, risk: 'mid', table: [], rtp: 0, balls: [], pegHit: {}, binHit: [], last: [], W: 0, H: 0 };
  var pk = $('pk'), pctx = pk.getContext('2d'), pkWrap = $('pk-wrap'), elPGo = $('pk-go'), elPMsg = $('pk-msg'), elPAmt = $('pk-amount');
  var MAX_BALLS = 15;

  function pSay(text, cls) { elPMsg.textContent = text; elPMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readPAmount() { var v = Math.floor(Number(elPAmt.value)); return isFinite(v) ? v : 0; }
  function pkLabel(m) { var s = String(m); return (s.charAt(0) === '0' && s.length > 1 ? s.slice(1) : s) + '×'; }
  // Payout table: centre pays c, edges rise as distance^p, scaled so the expected return is 97% before rounding.
  function pkSetup() {
    var n = P.rows, cfg = RISK[P.risk], probs = [], comb = 1, e = 0, i;
    var dist = function (i) { return Math.pow(Math.abs(i - n / 2) / (n / 2), cfg.p); };
    for (i = 0; i <= n; i++) { probs.push(comb / Math.pow(2, n)); comb = comb * (n - i) / (i + 1); }
    for (i = 0; i <= n; i++) e += probs[i] * dist(i);
    var s = (0.97 - cfg.c) / e, rtp = 0;
    P.table = probs.map(function (_, i) {
      var m = cfg.c + s * dist(i);
      return m >= 10 ? Math.round(m) : m >= 1 ? Math.round(m * 10) / 10 : Math.round(m * 100) / 100;
    });
    for (i = 0; i <= n; i++) rtp += probs[i] * P.table[i];
    P.rtp = rtp; P.pegHit = {}; P.binHit = [];
  }
  function pkUI() {
    var busy = P.balls.length > 0;
    document.querySelectorAll('[data-risk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.risk === P.risk)); b.disabled = busy; });
    document.querySelectorAll('[data-rows]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.rows) === P.rows)); b.disabled = busy; });
    $('pk-max').textContent = P.table[0] + '×';
    $('pk-mid').textContent = P.table[P.rows / 2] + '×';
    $('pk-rtp').textContent = (P.rtp * 100).toFixed(1) + '%';
    $('pk-last').innerHTML = P.last.map(function (m) { return '<span class="pill ' + (m < 1 ? 'low' : m >= 10 ? 'jackpot' : m >= 2 ? 'high' : '') + '">' + m + '×</span>'; }).join('') ||
      '<span class="pill">尚未投珠</span>';
    elPGo.innerHTML = '投下珍珠<small>下注 ' + fmt(readPAmount()) + ' 點</small>';
  }
  function pkDrop() {
    var a = readPAmount();
    if (a < MIN_BET) { pSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { pSay('餘額不足，請調低下注或重設點數。', 'lose'); return; }
    if (P.balls.length >= MAX_BALLS) { pSay('水裡已經有 ' + MAX_BALLS + ' 顆珍珠，等它們落底再投。'); return; }
    var k = [], rights = 0;
    for (var r = 0; r < P.rows; r++) { k.push(rights); if (Math.random() < 0.5) rights++; }
    S.balance -= a;
    P.balls.push({ analytics:AN.start('plinko',a), bet: a, k: k, bin: rights, t0: performance.now(), seg: 190 - P.rows * 6, at: 0 });
    syncBalance(); pkUI();
  }
  function pkLand(b, now) {
    var m = P.table[b.bin], pay = Math.floor(b.bet * m);
    AN.end(b.analytics,pay,'complete',{multiplier:m}); S.balance += pay; P.binHit[b.bin] = now;
    P.last.unshift(m); P.last.length = Math.min(P.last.length, 8);
    pSay('落在 ' + m + '×，領回 ' + fmt(pay) + ' 點（' + (pay >= b.bet ? '+' : '−') + fmt(Math.abs(pay - b.bet)) + '）。', pay >= b.bet ? 'win' : 'lose');
  }
  function pkResize() {
    var r = pkWrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    P.W = r.width; P.H = r.height;
    if (!P.W) return;
    pk.width = Math.round(P.W * dpr); pk.height = Math.round(P.H * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function pkGeo() {
    var n = P.rows, binH = Math.max(20, Math.min(30, P.H * 0.07)), binsY = P.H - binH - 10, top = 20;
    var dx = (P.W - 16) / (n + 2), dy = (binsY - 12 - top) / n;
    return { n: n, dx: dx, dy: dy, cx: P.W / 2, top: top, binsY: binsY, binH: binH,
             pegR: Math.max(1.8, Math.min(4, dx * 0.12)), ballR: Math.max(3.5, Math.min(8, dx * 0.28)) };
  }
  // idx 0 = release point, 1..n = resting on the peg of row idx-1, n+1 = inside the bin
  function pkPoint(g, b, idx) {
    if (idx <= 0) return { x: g.cx, y: g.top - g.ballR };
    if (idx <= g.n) { var r = idx - 1; return { x: g.cx + (b.k[r] - r / 2) * g.dx, y: g.top + (r + 0.5) * g.dy - g.pegR - g.ballR }; }
    return { x: g.cx + (b.bin - g.n / 2) * g.dx, y: g.binsY + g.binH / 2 };
  }
  function pkTick(now) {
    var landed = false;
    P.balls.forEach(function (b) {
      var n = b.k.length, idx = Math.floor((now - b.t0) / b.seg);
      while (b.at < Math.min(idx, n)) { b.at++; P.pegHit[(b.at - 1) + '-' + (b.k[b.at - 1] + 1)] = now; }
      if (idx >= n + 1) { pkLand(b, now); b.done = true; landed = true; }
    });
    if (landed) { P.balls = P.balls.filter(function (b) { return !b.done; }); syncBalance(); pkUI(); }
    if (P.W && !$('view-plinko').hidden) pkDraw(now, pkGeo());
  }
  function pkDraw(now, g) {
    var c = pctx, r, j, i;
    c.clearRect(0, 0, P.W, P.H);
    for (r = 0; r < g.n; r++) {
      for (j = 0; j <= r + 2; j++) {
        var px = g.cx + (j - (r + 2) / 2) * g.dx, py = g.top + (r + 0.5) * g.dy;
        var age = now - (P.pegHit[r + '-' + j] || -1e9), hot = age < 260;
        c.globalAlpha = hot ? 1 : .7; c.fillStyle = hot ? C.glow : C.muted;
        c.beginPath(); c.arc(px, py, g.pegR * (hot ? 1.7 - age / 370 : 1), 0, 6.2832); c.fill();
      }
    }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '600 ' + Math.max(7, Math.min(13, g.dx * 0.46)).toFixed(1) + 'px "Chakra Petch", monospace';
    for (i = 0; i <= g.n; i++) {
      var m = P.table[i], bx = g.cx + (i - g.n / 2) * g.dx, w = g.dx - 3;
      var bump = now - (P.binHit[i] || -1e9) < 180 ? 4 : 0, by = g.binsY + bump;
      var fill = m >= 10 ? C.lamp : m >= 2 ? C.lamp : m >= 1 ? C.glow : C['panel-2'];
      c.globalAlpha = m >= 10 ? 1 : m >= 2 ? .28 : m >= 1 ? .2 : 1; c.fillStyle = fill;
      c.beginPath();
      if (c.roundRect) c.roundRect(bx - w / 2, by, w, g.binH, 4); else c.rect(bx - w / 2, by, w, g.binH);
      c.fill(); c.globalAlpha = 1;
      c.fillStyle = m >= 10 ? C['lamp-ink'] : m >= 2 ? C.lamp : m >= 1 ? C.glow : C.muted;
      c.fillText(pkLabel(m).replace('×', g.dx < 26 ? '' : '×'), bx, by + g.binH / 2 + 1);
    }
    P.balls.forEach(function (b) {
      var e = Math.max(0, (now - b.t0) / b.seg), idx = Math.min(Math.floor(e), g.n), t = Math.min(1, e - idx);
      var A = pkPoint(g, b, idx), B = pkPoint(g, b, idx + 1);
      var x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t * t - (idx > 0 ? g.dy * 0.22 * Math.sin(Math.PI * t) : 0);
      c.fillStyle = C.fg; c.shadowColor = C.glow; c.shadowBlur = 10;
      c.beginPath(); c.arc(x, y, g.ballR, 0, 6.2832); c.fill(); c.shadowBlur = 0;
      c.fillStyle = C.glow; c.globalAlpha = .55; c.beginPath(); c.arc(x + g.ballR * .25, y + g.ballR * .25, g.ballR * .55, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    });
  }
  elPGo.addEventListener('click', pkDrop);
  elPAmt.addEventListener('input', pkUI);
  document.querySelectorAll('[data-pchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readPAmount() || MIN_BET;
      a = b.dataset.pchip === 'half' ? a / 2 : a * 2;
      elPAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      pkUI();
    });
  });
  document.querySelectorAll('[data-risk]').forEach(function (b) {
    b.addEventListener('click', function () { if (P.balls.length) return; P.risk = b.dataset.risk; pkSetup(); pkUI(); });
  });
  document.querySelectorAll('[data-rows]').forEach(function (b) {
    b.addEventListener('click', function () { if (P.balls.length) return; P.rows = Number(b.dataset.rows); pkSetup(); pkUI(); });
  });
  if (window.ResizeObserver) new ResizeObserver(pkResize).observe(pkWrap); else window.addEventListener('resize', pkResize);

