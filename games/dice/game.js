  /* ---------- Dice ---------- */
  var D = { mode: 'under', target: 50, pending: 0, last: [] };
  var elDGo = $('dc-go'), elDMsg = $('dc-msg'), elDAmt = $('dc-amount'), elDTarget = $('dc-target'), elDStage = $('dc-stage'), elDMarker = $('dc-marker');
  function dSay(text, cls) { elDMsg.textContent = text; elDMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readDAmount() { var v = Math.floor(Number(elDAmt.value)); return isFinite(v) ? v : 0; }
  function dChance() { return D.mode === 'under' ? D.target : 100 - D.target; }
  function dMult() { return Math.floor(9700 / dChance()) / 100; }
  function dUI() {
    var lo = D.mode === 'under' ? 2 : 5, hi = D.mode === 'under' ? 95 : 98, busy = D.pending > 0;
    D.target = Math.max(lo, Math.min(hi, D.target));
    elDTarget.min = lo; elDTarget.max = hi; elDTarget.value = D.target; elDTarget.disabled = busy;
    $('dc-target-out').textContent = D.target;
    var win = 'var(--glow)', lose = 'var(--crush)';
    $('dc-zones').style.background = 'linear-gradient(90deg, ' + (D.mode === 'under' ? win : lose) + ' 0 ' + D.target + '%, ' + (D.mode === 'under' ? lose : win) + ' ' + D.target + '% 100%)';
    $('dc-under').textContent = '低於 ' + D.target; $('dc-over').textContent = D.target + ' 以上';
    document.querySelectorAll('[data-dmode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.dmode === D.mode)); b.disabled = busy; });
    document.querySelectorAll('.dchip').forEach(function (b) { b.disabled = busy; });
    elDAmt.disabled = busy;
    $('dc-chance').textContent = dChance() + '%';
    $('dc-mult').textContent = fx(dMult()) + '×';
    $('dc-win').textContent = fmt(Math.floor(readDAmount() * dMult()));
    $('dc-last').innerHTML = D.last.map(function (r) { return '<span class="pill ' + (r.win ? 'high' : 'low') + '">' + r.roll.toFixed(2) + '</span>'; }).join('') || '<span class="pill">尚未發出聲納</span>';
    elDGo.disabled = busy;
    elDGo.innerHTML = busy ? '等待回波…' : '發出聲納<small>下注 ' + fmt(readDAmount()) + ' 點</small>';
  }
  function dRoll() {
    if (D.pending) return;
    var a = readDAmount();
    if (a < MIN_BET) { dSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { dSay('餘額不足，請調低下注或重設點數。', 'lose'); return; }
    var roll = Math.floor(Math.random() * 10000) / 100;
    var win = D.mode === 'under' ? roll < D.target : roll >= D.target, mult = dMult(), mode = D.mode, target = D.target;
    D.analytics=AN.start('dice',a); S.balance -= a; D.pending = a;
    elDStage.classList.remove('win', 'lose');
    $('dc-result').textContent = '··.··'; $('dc-sub').textContent = '聲納發出，等待回波';
    elDMarker.hidden = false; void elDMarker.offsetWidth; elDMarker.style.left = roll + '%';
    syncBalance(); dUI();
    setTimeout(function () {
      var pay = win ? Math.floor(a * mult) : 0;
      AN.end(D.analytics,pay,pay>0?'complete':'loss'); S.balance += pay; D.pending = 0;
      D.last.unshift({ roll: roll, win: win }); D.last.length = Math.min(D.last.length, 10);
      $('dc-result').textContent = roll.toFixed(2);
      $('dc-sub').textContent = (mode === 'under' ? '猜低於 ' + target : '猜 ' + target + ' 以上') + (win ? ' · 猜中' : ' · 沒中');
      elDStage.classList.add(win ? 'win' : 'lose');
      if (win) dSay('讀數 ' + roll.toFixed(2) + '，猜中！以 ' + fx(mult) + '× 領回 ' + fmt(pay) + ' 點（+' + fmt(pay - a) + '）。', 'win');
      else dSay('讀數 ' + roll.toFixed(2) + '，沒猜中，失去 ' + fmt(a) + ' 點。', 'lose');
      syncBalance(); dUI();
    }, reduceMotion ? 0 : 480);
  }
  elDGo.addEventListener('click', dRoll);
  elDAmt.addEventListener('input', dUI);
  elDTarget.addEventListener('input', function () { D.target = Number(elDTarget.value); dUI(); });
  document.querySelectorAll('[data-dmode]').forEach(function (b) {
    b.addEventListener('click', function () { if (D.pending) return; D.mode = b.dataset.dmode; dUI(); });
  });
  document.querySelectorAll('[data-dchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readDAmount() || MIN_BET, k = b.dataset.dchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elDAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      dUI();
    });
  });

