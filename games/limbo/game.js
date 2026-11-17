  /* ---------- Limbo ---------- */
  var L = { pending: 0, last: [] };
  var elLGo = $('lb-go'), elLMsg = $('lb-msg'), elLAmt = $('lb-amount'), elLTarget = $('lb-target'), elLStage = $('lb-stage'), elLFill = $('lb-fill'), elLResult = $('lb-result');
  function lSay(text, cls) { elLMsg.textContent = text; elLMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readLAmount() { var v = Math.floor(Number(elLAmt.value)); return isFinite(v) ? v : 0; }
  function readLTarget() { var v = Number(elLTarget.value); return isFinite(v) ? Math.round(v * 100) / 100 : 0; }
  function lUI() {
    var t = readLTarget(), ok = t >= 1.01 && t <= 1000, busy = L.pending > 0;
    $('lb-chance').textContent = ok ? (97 / t).toFixed(2) + '%' : '—';
    $('lb-mult').textContent = ok ? fx(t) + '×' : '—';
    $('lb-win').textContent = ok ? fmt(Math.floor(readLAmount() * t)) : '—';
    if (!busy) $('lb-tlabel').textContent = ok ? '目標 ' + fx(t) + '×' : '目標 —';
    $('lb-last').innerHTML = L.last.map(function (r) { return '<span class="pill ' + (r.win ? 'high' : 'low') + '">' + fx(r.result) + '×</span>'; }).join('') || '<span class="pill">尚未放下探測錘</span>';
    elLAmt.disabled = busy; elLTarget.disabled = busy;
    document.querySelectorAll('.lchip').forEach(function (b) { b.disabled = busy; });
    elLGo.disabled = busy;
    elLGo.innerHTML = busy ? '下沉中…' : '放下探測錘<small>下注 ' + fmt(readLAmount()) + ' 點</small>';
  }
  function lRoll() {
    if (L.pending) return;
    var a = readLAmount(), t = readLTarget();
    if (a < MIN_BET) { lSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { lSay('餘額不足，請調低下注或重設點數。', 'lose'); return; }
    if (t < 1.01 || t > 1000) { lSay('目標倍率要在 1.01 到 1000 之間。', 'lose'); return; }
    elLTarget.value = fx(t);
    var result = rollCrash(), win = result >= t, dur = reduceMotion ? 0 : 520, t0 = performance.now();
    L.analytics=AN.start('limbo',a); S.balance -= a; L.pending = a;
    elLStage.classList.remove('win', 'lose');
    $('lb-sub').textContent = '探測錘下沉中';
    elLFill.style.transition = 'none'; elLFill.style.width = '0'; void elLFill.offsetWidth; elLFill.style.transition = '';
    elLFill.style.width = Math.max(1.5, Math.min(100, 70 * Math.log(result) / Math.log(t))) + '%';
    syncBalance(); lUI();
    (function step(now) {
      if (!L.pending || !dur) return;
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      elLResult.innerHTML = fx(Math.exp(Math.log(result) * e)) + '<small>×</small>';
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    setTimeout(function () {
      var pay = win ? Math.floor(a * t) : 0;
      AN.end(L.analytics,pay,pay>0?'complete':'loss'); S.balance += pay; L.pending = 0;
      L.last.unshift({ result: result, win: win }); L.last.length = Math.min(L.last.length, 10);
      elLResult.innerHTML = fx(result) + '<small>×</small>';
      $('lb-sub').textContent = '目標 ' + fx(t) + '× · ' + (win ? '達標' : '沒到');
      elLStage.classList.add(win ? 'win' : 'lose');
      if (win) lSay('沉到 ' + fx(result) + '×，達到目標！以 ' + fx(t) + '× 領回 ' + fmt(pay) + ' 點（+' + fmt(pay - a) + '）。', 'win');
      else lSay('只沉到 ' + fx(result) + '×，沒到 ' + fx(t) + '×，失去 ' + fmt(a) + ' 點。', 'lose');
      syncBalance(); lUI();
    }, dur + 60);
  }
  elLGo.addEventListener('click', lRoll);
  elLAmt.addEventListener('input', lUI);
  elLTarget.addEventListener('input', lUI);
  document.querySelectorAll('[data-ltarget]').forEach(function (b) {
    b.addEventListener('click', function () { elLTarget.value = Number(b.dataset.ltarget).toFixed(2); lUI(); });
  });
  document.querySelectorAll('[data-lchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readLAmount() || MIN_BET, k = b.dataset.lchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elLAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      lUI();
    });
  });

