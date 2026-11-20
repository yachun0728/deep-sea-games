  /* ---------- Wheel ---------- */
  // Each 10-slot pattern averages 0.97, so every setting returns 97%.
  var WH_BASE = { low: [1.3, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0], mid: [0, 1.5, 0, 1.7, 0, 2, 0, 3, 0, 1.5] };
  var WL = { risk: 'mid', n: 20, segs: [], colorOf: {}, rot: 0, pending: 0, last: [] };
  var elWGo = $('wh-go'), elWMsg = $('wh-msg'), elWAmt = $('wh-amount'), elWStage = $('wh-stage'), elWheel = $('wh'), wctx = elWheel.getContext('2d');
  function wSay(text, cls) { elWMsg.textContent = text; elWMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readWAmount() { var v = Math.floor(Number(elWAmt.value)); return isFinite(v) ? v : 0; }
  function whSetup() {
    var segs = [], i;
    for (i = 0; i < WL.n; i++) segs.push(WL.risk === 'high' ? (i === 0 ? Math.round(0.97 * WL.n * 100) / 100 : 0) : WH_BASE[WL.risk][i % 10]);
    WL.segs = segs;
    var vals = segs.filter(function (v, i) { return v > 0 && segs.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    var tones = vals.length === 1 ? ['lamp'] : ['sea-top', 'glow', 'lamp', 'crush'];
    WL.colorOf = { 0: 'panel-2' };
    vals.forEach(function (v, i) { WL.colorOf[v] = tones[Math.min(i, tones.length - 1)]; });
    var c = wctx, R = 420, a = Math.PI * 2 / WL.n;
    c.clearRect(0, 0, 840, 840);
    for (i = 0; i < WL.n; i++) {
      c.beginPath(); c.moveTo(R, R); c.arc(R, R, R - 8, -Math.PI / 2 + i * a, -Math.PI / 2 + (i + 1) * a); c.closePath();
      c.fillStyle = C[WL.colorOf[segs[i]]]; c.fill();
      c.strokeStyle = C.abyss; c.lineWidth = 4; c.stroke();
    }
    c.beginPath(); c.arc(R, R, R - 8, 0, Math.PI * 2); c.strokeStyle = C.line; c.lineWidth = 8; c.stroke();
  }
  function whUI() {
    var busy = WL.pending > 0, n = WL.n, counts = {}, sum = 0, paying = 0;
    WL.segs.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; sum += v; if (v) paying++; });
    $('wh-legend').innerHTML = Object.keys(counts).map(Number).sort(function (a, b) { return a - b; }).map(function (v) {
      return '<span class="kp' + (v ? '' : ' zero') + '"><i style="background:var(--' + WL.colorOf[v] + ')"></i><b>' + (v ? v + '×' : '0') + '</b>' + counts[v] + ' / ' + n + ' 格</span>';
    }).join('');
    document.querySelectorAll('[data-wrisk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.wrisk === WL.risk)); b.disabled = busy; });
    document.querySelectorAll('[data-wn]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.wn) === n)); b.disabled = busy; });
    document.querySelectorAll('.wchip').forEach(function (b) { b.disabled = busy; });
    elWAmt.disabled = busy;
    $('wh-max').textContent = Math.max.apply(null, WL.segs) + '×';
    $('wh-chance').textContent = (paying / n * 100).toFixed(1) + '%';
    $('wh-rtp').textContent = (sum / n * 100).toFixed(1) + '%';
    $('wh-last').innerHTML = WL.last.map(function (m) { return '<span class="pill ' + (m === 0 ? 'low' : m >= 5 ? 'jackpot' : m >= 1.5 ? 'high' : '') + '">' + m + '×</span>'; }).join('') || '<span class="pill">尚未轉動</span>';
    elWGo.disabled = busy;
    elWGo.innerHTML = busy ? '{{t:wheel.msg.001}}' : '轉動羅盤<small>下注 ' + fmt(readWAmount()) + ' 點</small>';
  }
  function whSpin() {
    if (WL.pending) return;
    var a = readWAmount();
    if (a < MIN_BET) { wSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { wSay('{{t:wheel.msg.002}}', 'lose'); return; }
    var i = Math.floor(Math.random() * WL.n), m = WL.segs[i], deg = 360 / WL.n;
    // Slot i's centre sits (i + 0.5)·deg clockwise of the pointer, so the wheel must end that far short of a full turn.
    var stop = ((360 - (i + 0.5) * deg + (Math.random() - 0.5) * deg * 0.7) % 360 + 360) % 360;
    WL.rot = Math.ceil(WL.rot / 360) * 360 + 360 * 4 + stop;
    WL.analytics=AN.start('wheel',a); S.balance -= a; WL.pending = a;
    elWStage.classList.remove('win', 'lose');
    $('wh-hub').textContent = '…';
    elWheel.style.transform = 'rotate(' + WL.rot.toFixed(2) + 'deg)';
    wSay('{{t:wheel.msg.003}}');
    syncBalance(); whUI();
    setTimeout(function () {
      var pay = Math.floor(a * m);
      AN.end(WL.analytics,pay,pay>0?'complete':'loss'); S.balance += pay; WL.pending = 0;
      WL.last.unshift(m); WL.last.length = Math.min(WL.last.length, 10);
      $('wh-hub').textContent = m ? m + '×' : '0';
      elWStage.classList.add(pay >= a ? 'win' : 'lose');
      if (!pay) wSay('指到 0，失去 ' + fmt(a) + ' 點。', 'lose');
      else wSay('指到 ' + m + '×，領回 ' + fmt(pay) + ' 點（' + (pay >= a ? '+' : '−') + fmt(Math.abs(pay - a)) + '）。', pay >= a ? 'win' : 'lose');
      syncBalance(); whUI();
    }, reduceMotion ? 0 : 3100);
  }
  elWGo.addEventListener('click', whSpin);
  elWAmt.addEventListener('input', whUI);
  document.querySelectorAll('[data-wrisk]').forEach(function (b) {
    b.addEventListener('click', function () { if (WL.pending) return; WL.risk = b.dataset.wrisk; whSetup(); whUI(); });
  });
  document.querySelectorAll('[data-wn]').forEach(function (b) {
    b.addEventListener('click', function () { if (WL.pending) return; WL.n = Number(b.dataset.wn); whSetup(); whUI(); });
  });
  document.querySelectorAll('[data-wchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readWAmount() || MIN_BET, k = b.dataset.wchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elWAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      whUI();
    });
  });

