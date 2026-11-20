  /* ---------- Hi-Lo ---------- */
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'], HL_SKIPS = 3;
  function hDraw() { return { r: 1 + Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4) }; }
  var HL = { active: false, over: false, bet: 0, card: hDraw(), raw: 1, picks: 0, trail: [], skips: 0, fresh: false };
  var elHGo = $('hl-go'), elHMsg = $('hl-msg'), elHAmt = $('hl-amount'), elHStage = $('hl-stage'), elHCard = $('hl-card');
  function hSay(text, cls) { elHMsg.textContent = text; elHMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readHAmount() { var v = Math.floor(Number(elHAmt.value)); return isFinite(v) ? v : 0; }
  function hName(c) { return RANKS[c.r - 1] + SUITS[c.s]; }
  function hRed(c) { return c.s === 1 || c.s === 2; }
  // The two guesses for a card of rank r: label, chance, and the comparison the next rank must pass.
  function hOpts(r) {
    return {
      hi: r === 1 ? { label: '{{t:hilo.msg.001}}', p: 12 / 13, kind: 'gt' } : r === 13 ? { label: '{{t:hilo.msg.002}}', p: 1 / 13, kind: 'eq' } : { label: '{{t:hilo.msg.003}}', p: (14 - r) / 13, kind: 'ge' },
      lo: r === 13 ? { label: '{{t:hilo.msg.004}}', p: 12 / 13, kind: 'lt' } : r === 1 ? { label: '{{t:hilo.msg.002}}', p: 1 / 13, kind: 'eq' } : { label: '{{t:hilo.msg.005}}', p: r / 13, kind: 'le' }
    };
  }
  function hTest(kind, n, r) { return kind === 'gt' ? n > r : kind === 'ge' ? n >= r : kind === 'lt' ? n < r : kind === 'le' ? n <= r : n === r; }
  function hMult(raw) { return Math.floor(0.97 * raw * 100) / 100; }
  function hUI() {
    var c = HL.card, o = hOpts(c.r);
    elHCard.className = 'card' + (hRed(c) ? ' red' : '') + (!HL.active && !HL.over ? ' idle' : '') + (HL.fresh ? ' new' : '');
    elHCard.innerHTML = '<span class="rank">' + RANKS[c.r - 1] + '</span><span class="suit">' + SUITS[c.s] + '</span>';
    elHCard.setAttribute('aria-label', '目前的牌 ' + hName(c));
    HL.fresh = false;
    $('hl-trail').innerHTML = HL.trail.length ? HL.trail.slice(-10).map(function (t) { return '<span class="mini' + (hRed(t) ? ' red' : '') + '">' + hName(t) + '</span>'; }).join('<span aria-hidden="true">›</span>') + '<span aria-hidden="true">›</span>' : '';
    [['hl-hi', '漲 ▲ ', o.hi], ['hl-lo', '退 ▼ ', o.lo]].forEach(function (x) {
      var b = $(x[0]);
      b.disabled = !HL.active;
      b.innerHTML = x[1] + x[2].label + '<small>' + (HL.active ? (x[2].p * 100).toFixed(1) + '% · 猜中 ' + fx(hMult(HL.raw / x[2].p)) + '×' : '—') + '</small>';
    });
    $('hl-skip').disabled = !HL.active || HL.skips >= HL_SKIPS;
    $('hl-skip').textContent = '{{t:hilo.msg.006}}' + (HL.active ? '（剩 ' + (HL_SKIPS - HL.skips) + ' 次）' : '');
    var has = (HL.active || HL.over) && HL.picks > 0, m = hMult(HL.raw);
    $('hl-mult').textContent = has ? fx(m) + '×' : '—';
    $('hl-win').textContent = HL.active && HL.picks > 0 ? fmt(Math.floor(HL.bet * m)) : '—';
    $('hl-picks').textContent = HL.active || HL.over ? HL.picks + ' 次' : '—';
    $('hl-sub').textContent = HL.active ? '{{t:hilo.msg.007}}' : HL.over ? '{{t:hilo.msg.008}}' : '{{t:hilo.msg.009}}';
    elHAmt.disabled = HL.active;
    document.querySelectorAll('.hchip').forEach(function (b) { b.disabled = HL.active; });
    if (!HL.active) { elHGo.dataset.mode = 'bet'; elHGo.disabled = false; elHGo.innerHTML = (HL.over ? '{{t:hilo.msg.010}}' : '{{t:hilo.msg.011}}') + '<small>下注 ' + fmt(readHAmount()) + ' 點</small>'; }
    else if (HL.picks === 0) { elHGo.dataset.mode = 'done'; elHGo.disabled = true; elHGo.innerHTML = '先猜一次<small>猜對才能領回</small>'; }
    else { elHGo.dataset.mode = 'surface'; elHGo.disabled = false; elHGo.innerHTML = '領回<small>' + fmt(Math.floor(HL.bet * m)) + ' 點 · ' + fx(m) + '×</small>'; }
  }
  function hStart() {
    var a = readHAmount();
    if (a < MIN_BET) { hSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { hSay('{{t:hilo.msg.012}}', 'lose'); return; }
    S.balance -= a;
    HL.analytics=AN.start('hilo',a); HL.active = true; HL.over = false; HL.bet = a; HL.card = hDraw(); HL.raw = 1; HL.picks = 0; HL.trail = []; HL.skips = 0; HL.fresh = true;
    elHStage.classList.remove('win', 'lose');
    hSay('已下注 ' + fmt(a) + ' 點，第一張是 ' + hName(HL.card) + '。');
    syncBalance(); hUI();
  }
  function hGuess(side) {
    if (!HL.active) return;
    var prev = HL.card, o = hOpts(prev.r)[side], next = hDraw();
    HL.trail.push(prev); HL.card = next; HL.fresh = true;
    if (hTest(o.kind, next.r, prev.r)) {
      HL.raw /= o.p; HL.picks++; AN.progress(HL.analytics,{step:HL.picks});
      hSay('翻出 ' + hName(next) + '，猜對了！目前 ' + fx(hMult(HL.raw)) + '{{t:hilo.msg.013}}', 'win');
    } else {
      AN.end(HL.analytics,0,'loss',{step:HL.picks}); HL.active = false; HL.over = true; elHStage.classList.add('lose');
      hSay('翻出 ' + hName(next) + '，猜錯了，失去 ' + fmt(HL.bet) + ' 點。', 'lose');
    }
    hUI();
  }
  function hCash() {
    var m = hMult(HL.raw), pay = Math.floor(HL.bet * m);
    AN.end(HL.analytics,pay,'cashout',{step:HL.picks,multiplier:m}); S.balance += pay; HL.active = false; HL.over = true; elHStage.classList.add('win');
    hSay('在 ' + fx(m) + '× 領回 ' + fmt(pay) + ' 點（' + (pay >= HL.bet ? '+' : '−') + fmt(Math.abs(pay - HL.bet)) + '）。', pay >= HL.bet ? 'win' : 'lose');
    syncBalance(); hUI();
  }
  elHGo.addEventListener('click', function () { if (HL.active) { if (HL.picks > 0) hCash(); } else hStart(); });
  $('hl-hi').addEventListener('click', function () { hGuess('hi'); });
  $('hl-lo').addEventListener('click', function () { hGuess('lo'); });
  $('hl-skip').addEventListener('click', function () {
    if (!HL.active || HL.skips >= HL_SKIPS) return;
    HL.skips++; HL.card = hDraw(); HL.fresh = true;
    hSay('換成 ' + hName(HL.card) + '。'); hUI();
  });
  elHAmt.addEventListener('input', hUI);
  document.querySelectorAll('[data-hchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readHAmount() || MIN_BET, k = b.dataset.hchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elHAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      hUI();
    });
  });

