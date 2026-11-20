  /* ---------- Crossing ---------- */
  var CR_LANES = 12, CR_P = { easy: 0.92, mid: 0.85, hard: 0.75, extreme: 0.6 };
  var CR = { active: false, over: false, bet: 0, diff: 'mid', pos: 0, failAt: 0, lost: false };
  var elCGo = $('cr-go'), elCMsg = $('cr-msg'), elCAmt = $('cr-amount'), elCStep = $('cr-step'), elCLanes = $('cr-lanes');
  var SVG_TURTLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9L3 6M18 9l3-3M6.5 18L4 21M17.5 18l2.5 3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="4.6" r="2.7" fill="currentColor"/><ellipse cx="12" cy="13.5" rx="7" ry="6.5" fill="currentColor"/></svg>';
  var SVG_RIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 7c3-3 4 3 7 0s4 3 7 0 4 2 6 0M2 12.5c3-3 4 3 7 0s4 3 7 0 4 2 6 0M2 18c3-3 4 3 7 0s4 3 7 0 4 2 6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  function rSay(text, cls) { elCMsg.textContent = text; elCMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readCAmount() { var v = Math.floor(Number(elCAmt.value)); return isFinite(v) ? v : 0; }
  function crMult(k) { return Math.floor(0.97 / Math.pow(CR_P[CR.diff], k) * 100) / 100; }
  function crUI() {
    var html = '<div class="lane start"><span class="lslot' + (CR.pos === 0 && !CR.lost ? ' me' : '') + '">' + (CR.pos === 0 && !CR.lost ? SVG_TURTLE : '') + '</span><span class="lmult">起點</span></div>';
    for (var i = 1; i <= CR_LANES; i++) {
      var cls = 'lane', icon = '', me = false;
      if (CR.lost && i === CR.failAt) { cls += ' lost'; icon = SVG_RIP; }
      else if (i <= CR.pos) { cls += ' passed'; if (i === CR.pos) { icon = SVG_TURTLE; me = true; } }
      else if (CR.over && i === CR.failAt) { cls += ' would'; icon = SVG_RIP; }
      else if (CR.active && i === CR.pos + 1) cls += ' next';
      html += '<div class="' + cls + '"><span class="lslot' + (me ? ' me' : '') + '">' + icon + '</span><span class="lmult">' + fx(crMult(i)) + '×</span></div>';
    }
    elCLanes.style.gridTemplateColumns = 'repeat(' + (CR_LANES + 1) + ', minmax(0, 1fr))';
    elCLanes.innerHTML = html;
    document.querySelectorAll('[data-cdiff]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cdiff === CR.diff)); b.disabled = CR.active; });
    document.querySelectorAll('.cchip').forEach(function (b) { b.disabled = CR.active; });
    elCAmt.disabled = CR.active;
    var m = crMult(CR.pos);
    elCStep.disabled = !CR.active;
    elCStep.innerHTML = '前進一道 ▶<small>' + (CR.active ? '過關率 ' + (CR_P[CR.diff] * 100).toFixed(0) + '% · 渡過後 ' + fx(crMult(CR.pos + 1)) + '×' : '—') + '</small>';
    $('cr-mult').textContent = CR.pos > 0 && !CR.lost ? fx(m) + '×' : '—';
    $('cr-p').textContent = (CR_P[CR.diff] * 100).toFixed(0) + '%';
    $('cr-pos').textContent = CR.active || CR.over ? CR.pos + ' / ' + CR_LANES : '—';
    $('cr-sub').textContent = CR.lost ? '在第 ' + CR.failAt + ' 道被暗流捲走' : CR.active ? '已渡過 ' + CR.pos + ' 道，還有 ' + (CR_LANES - CR.pos) + ' 道' :
      CR.over ? (CR.failAt <= CR_LANES ? '平安上岸；暗流原本在第 ' + CR.failAt + ' 道' : '{{t:crossing.msg.001}}') : '{{t:crossing.msg.002}}';
    if (!CR.active) { elCGo.dataset.mode = 'bet'; elCGo.disabled = false; elCGo.innerHTML = (CR.over ? '{{t:crossing.msg.003}}' : '{{t:crossing.msg.004}}') + '<small>下注 ' + fmt(readCAmount()) + ' 點</small>'; }
    else if (CR.pos === 0) { elCGo.dataset.mode = 'done'; elCGo.disabled = true; elCGo.innerHTML = '先前進一道<small>渡過才能領回</small>'; }
    else { elCGo.dataset.mode = 'surface'; elCGo.disabled = false; elCGo.innerHTML = '領回<small>' + fmt(Math.floor(CR.bet * m)) + ' 點 · ' + fx(m) + '×</small>'; }
  }
  function crStart() {
    var a = readCAmount();
    if (a < MIN_BET) { rSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { rSay('{{t:crossing.msg.005}}', 'lose'); return; }
    var fail = 1; while (fail <= CR_LANES && Math.random() < CR_P[CR.diff]) fail++;   // first lane that hides the rip current; 13 = none
    S.balance -= a;
    CR.analytics=AN.start('crossing',a); CR.active = true; CR.over = false; CR.lost = false; CR.bet = a; CR.pos = 0; CR.failAt = fail;
    elCStage().classList.remove('win', 'lose');
    rSay('已下注 ' + fmt(a) + ' 點，按「前進一道」出發。');
    syncBalance(); crUI();
  }
  function elCStage() { return $('cr-stage'); }
  function crCash() {
    var m = crMult(CR.pos), pay = Math.floor(CR.bet * m);
    AN.end(CR.analytics,pay,'cashout',{step:CR.pos,multiplier:m}); S.balance += pay; CR.active = false; CR.over = true;
    rSay((CR.pos === CR_LANES ? '{{t:crossing.msg.006}}' : '') + '在 ' + fx(m) + '× 領回 ' + fmt(pay) + ' 點（' + (pay >= CR.bet ? '+' : '−') + fmt(Math.abs(pay - CR.bet)) + '）。', pay >= CR.bet ? 'win' : 'lose');
    syncBalance(); crUI();
  }
  function crStep() {
    if (!CR.active) return;
    if (CR.pos + 1 === CR.failAt) {
      AN.end(CR.analytics,0,'loss',{step:CR.failAt}); CR.active = false; CR.over = true; CR.lost = true;
      rSay('第 ' + CR.failAt + ' 道遇上暗流，失去 ' + fmt(CR.bet) + ' 點。', 'lose');
      crUI(); return;
    }
    CR.pos++; AN.progress(CR.analytics,{step:CR.pos});
    if (CR.pos === CR_LANES) { crCash(); return; }
    rSay('渡過第 ' + CR.pos + ' 道，目前 ' + fx(crMult(CR.pos)) + '{{t:crossing.msg.007}}');
    crUI();
  }
  elCStep.addEventListener('click', crStep);
  elCGo.addEventListener('click', function () { if (CR.active) { if (CR.pos > 0) crCash(); } else crStart(); });
  elCAmt.addEventListener('input', crUI);
  document.querySelectorAll('[data-cdiff]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (CR.active) return;
      CR.diff = b.dataset.cdiff; CR.over = false; CR.lost = false; CR.pos = 0; CR.failAt = 0;
      crUI();
    });
  });
  document.querySelectorAll('[data-cchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readCAmount() || MIN_BET, k = b.dataset.cchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elCAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      crUI();
    });
  });

