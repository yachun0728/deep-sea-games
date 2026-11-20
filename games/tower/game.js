  /* ---------- Tower ---------- */
  var TW_ROWS = 8, TW_DIFF = { easy: { n: 4, safe: 3 }, mid: { n: 3, safe: 2 }, hard: { n: 2, safe: 1 }, extreme: { n: 3, safe: 1 } };
  var TW = { active: false, over: false, bet: 0, diff: 'mid', level: 0, layout: [], picks: [], hit: null };
  var elTGo = $('tw-go'), elTMsg = $('tw-msg'), elTAmt = $('tw-amount'), elTower = $('tw-tower');
  function tSay(text, cls) { elTMsg.textContent = text; elTMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function readTAmount() { var v = Math.floor(Number(elTAmt.value)); return isFinite(v) ? v : 0; }
  function twMult(level) { var d = TW_DIFF[TW.diff]; return Math.floor(0.97 * Math.pow(d.n / d.safe, level) * 100) / 100; }
  function twUI() {
    var d = TW_DIFF[TW.diff], html = '';
    for (var r = TW_ROWS - 1; r >= 0; r--) {
      var cur = TW.active && r === TW.level;
      html += '<div class="trow' + (cur ? ' cur' : '') + (r < TW.level ? ' done' : '') + '"><span class="tmult">' + fx(twMult(r + 1)) + '×</span>' +
              '<div class="tcells" style="grid-template-columns:repeat(' + d.n + ',minmax(0,1fr))">';
      for (var c = 0; c < d.n; c++) {
        var chosen = TW.picks[r] === c, cls = 'tcell', icon = '', label = '第 ' + (r + 1) + ' 層第 ' + (c + 1) + ' 格';
        if (TW.over && TW.layout[r]) {
          if (TW.layout[r][c]) { cls += ' mine' + (TW.hit && TW.hit.r === r && TW.hit.c === c ? ' hit' : ''); icon = SVG_MINE; label += '{{t:tower.msg.001}}'; }
          else { cls += ' gem'; icon = SVG_PEARL; label += '{{t:tower.msg.002}}'; }
          if (!chosen) cls += ' dim';
        } else if (chosen) { cls += ' gem'; icon = SVG_PEARL; label += '{{t:tower.msg.002}}'; }
        html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + label + '"' + (cur ? '' : ' disabled') + '>' + icon + '</button>';
      }
      html += '</div></div>';
    }
    elTower.innerHTML = html;
    document.querySelectorAll('[data-tdiff]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tdiff === TW.diff)); b.disabled = TW.active; });
    document.querySelectorAll('.tchip').forEach(function (b) { b.disabled = TW.active; });
    elTAmt.disabled = TW.active;
    var m = twMult(TW.level);
    $('tw-mult').textContent = TW.level > 0 ? fx(m) + '×' : '—';
    $('tw-next').textContent = TW.over || TW.level >= TW_ROWS ? '—' : fx(twMult(TW.level + 1)) + '×';
    $('tw-level').textContent = TW.active || TW.over ? TW.level + ' / ' + TW_ROWS : '—';
    if (!TW.active) { elTGo.dataset.mode = 'bet'; elTGo.disabled = false; elTGo.innerHTML = (TW.over ? '{{t:tower.msg.003}}' : '{{t:tower.msg.004}}') + '<small>下注 ' + fmt(readTAmount()) + ' 點</small>'; }
    else if (TW.level === 0) { elTGo.dataset.mode = 'done'; elTGo.disabled = true; elTGo.innerHTML = '選最底層的一格<small>第一層 ' + fx(twMult(1)) + '×</small>'; }
    else { elTGo.dataset.mode = 'surface'; elTGo.disabled = false; elTGo.innerHTML = '領回<small>' + fmt(Math.floor(TW.bet * m)) + ' 點 · ' + fx(m) + '×</small>'; }
  }
  function twStart() {
    var a = readTAmount(), d = TW_DIFF[TW.diff];
    if (a < MIN_BET) { tSay('最低下注 ' + MIN_BET + ' 點。', 'lose'); return; }
    if (a > S.balance) { tSay('{{t:tower.msg.005}}', 'lose'); return; }
    var layout = [];
    for (var r = 0; r < TW_ROWS; r++) {
      var row = [], c;
      for (c = 0; c < d.n; c++) row.push(c >= d.safe);          // traps first sit at the end…
      for (c = d.n - 1; c > 0; c--) { var j = Math.floor(Math.random() * (c + 1)), tmp = row[c]; row[c] = row[j]; row[j] = tmp; }  // …then shuffle
      layout.push(row);
    }
    S.balance -= a;
    TW.analytics=AN.start('tower',a); TW.active = true; TW.over = false; TW.bet = a; TW.level = 0; TW.layout = layout; TW.picks = []; TW.hit = null;
    tSay('已下注 ' + fmt(a) + ' 點，從最底層選一格。');
    syncBalance(); twUI();
  }
  function twCash() {
    var m = twMult(TW.level), pay = Math.floor(TW.bet * m);
    AN.end(TW.analytics,pay,'cashout',{stage:TW.level,multiplier:m}); S.balance += pay; TW.active = false; TW.over = true;
    tSay((TW.level === TW_ROWS ? '{{t:tower.msg.006}}' : '') + '在 ' + fx(m) + '× 領回 ' + fmt(pay) + ' 點（' + (pay >= TW.bet ? '+' : '−') + fmt(Math.abs(pay - TW.bet)) + '）。', pay >= TW.bet ? 'win' : 'lose');
    syncBalance(); twUI();
  }
  function twPick(r, c) {
    if (!TW.active || r !== TW.level) return;
    TW.picks[r] = c;
    if (TW.layout[r][c]) {
      AN.end(TW.analytics,0,'loss',{stage:TW.level+1}); TW.active = false; TW.over = true; TW.hit = { r: r, c: c };
      tSay('第 ' + (r + 1) + ' 層選到海膽，失去 ' + fmt(TW.bet) + ' 點。', 'lose');
      twUI(); return;
    }
    TW.level++; AN.progress(TW.analytics,{stage:TW.level});
    if (TW.level === TW_ROWS) { twCash(); return; }
    tSay('氣泡！上浮到第 ' + TW.level + ' 層，目前 ' + fx(twMult(TW.level)) + '{{t:tower.msg.007}}');
    twUI();
  }
  elTower.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.tcell') : null;
    if (b && !b.disabled) twPick(Number(b.dataset.r), Number(b.dataset.c));
  });
  elTGo.addEventListener('click', function () { if (TW.active) { if (TW.level > 0) twCash(); } else twStart(); });
  elTAmt.addEventListener('input', twUI);
  document.querySelectorAll('[data-tdiff]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (TW.active) return;
      TW.diff = b.dataset.tdiff; TW.over = false; TW.level = 0; TW.layout = []; TW.picks = []; TW.hit = null;
      twUI();
    });
  });
  document.querySelectorAll('[data-tchip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readTAmount() || MIN_BET, k = b.dataset.tchip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elTAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      twUI();
    });
  });

