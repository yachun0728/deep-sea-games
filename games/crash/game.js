  /* ---------- round flow ---------- */
  function startBetting(now) {
    S.phase = 'betting'; S.phaseEnd = now + BET_MS; S.m = 1; S.bet = null;
    S.crash = rollCrash();
    S.bots = BOT_NAMES.filter(function () { return Math.random() < 0.7; }).map(function (name) {
      var stakes = [20, 50, 100, 200, 500];
      return { name: name, stake: stakes[Math.floor(Math.random() * stakes.length)],
               target: Math.min(60, Math.max(1.05, Math.round(99 / (1 - Math.random())) / 100)), out: null };
    });
    sea.classList.remove('safe');
    if (S.queued) { S.queued = false; if (!placeBet()) say('預約的下注未成立：餘額不足。', 'lose'); }
    renderAll();
  }
  function startDive(now) {
    S.phase = 'diving'; S.t0 = now; S.m = 1;
    if (S.bet) say('下潛中，倍率到了就上浮。');
    renderAll();
  }
  function doCrash(now) {
    if(S.bet&&!S.bet.out)AN.end(S.bet.analytics,0,'loss',{multiplier:S.crash});
    S.phase = 'crashed'; S.m = S.crash; S.crashedAt = now; S.phaseEnd = now + REST_MS;
    S.history.unshift(S.crash); S.history.length = Math.min(S.history.length, 18);
    if (S.bet && !S.bet.out) say('艇身在 ' + fx(S.crash) + '× 壓潰，失去 ' + fmt(S.bet.amount) + ' 點。', 'lose');
    if (!reduceMotion) { sea.classList.remove('shake'); void sea.offsetWidth; sea.classList.add('shake'); }
    renderAll();
  }
  function placeBet() {
    var a = checkAmount(); if (!a) return false;
    S.balance -= a; S.bet = { amount: a, auto: readAuto(), out: null, analytics:AN.start('crash',a) }; save();
    say('已下注 ' + fmt(a) + ' 點' + (S.bet.auto ? '，到 ' + fx(S.bet.auto) + '× 自動上浮。' : '。'));
    return true;
  }
  function cashOut(at) {
    if (!S.bet || S.bet.out) return;
    var pay = Math.floor(S.bet.amount * at);
    AN.end(S.bet.analytics,pay,'cashout',{multiplier:at});
    S.bet.out = at; S.bet.pay = pay; S.balance += pay; save();
    sea.classList.add('safe');
    say('在 ' + fx(at) + '× 上浮，領回 ' + fmt(pay) + ' 點（+' + fmt(pay - S.bet.amount) + '）。', 'win');
    renderAll();
  }
  function mainAction() {
    if (S.phase === 'betting') {
      if (S.bet) { AN.end(S.bet.analytics,S.bet.amount,'cancelled'); S.balance += S.bet.amount; S.bet = null; save(); say('已取消下注。'); }
      else placeBet();
    } else if (S.phase === 'diving' && S.bet && !S.bet.out) {
      cashOut(S.m);
    } else if (!(S.phase === 'diving' && S.bet)) {
      if (S.queued) { S.queued = false; say('已取消預約。'); }
      else if (checkAmount()) { S.queued = true; say('已預約，下一回合自動下注 ' + fmt(readAmount()) + ' 點。'); }
    }
    renderAll();
  }

  /* ---------- DOM ---------- */
  function renderAll() {
    sea.dataset.phase = S.phase;
    elBal.textContent = fmt(S.balance);
    var locked = !!S.bet && S.phase !== 'crashed';
    elAmt.disabled = locked; elAuto.disabled = locked;
    document.querySelectorAll('#view-crash .chip').forEach(function (b) { b.disabled = locked; });
    renderPills(); renderCrew(); renderGo();
  }
  function setGo(mode, html, disabled) {
    if (elGo.dataset.mode !== mode) elGo.dataset.mode = mode;
    if (elGo.innerHTML !== html) elGo.innerHTML = html;
    elGo.disabled = !!disabled;
  }
  function renderGo() {
    if (S.phase === 'betting') {
      if (S.bet) setGo('cancel', '取消下注<small>已下注 ' + fmt(S.bet.amount) + ' 點</small>');
      else setGo('bet', '下注<small>' + fmt(readAmount()) + ' 點</small>');
    } else if (S.phase === 'diving' && S.bet && !S.bet.out) {
      setGo('surface', '上浮<small>領回 ' + fmt(Math.floor(S.bet.amount * S.m)) + ' 點</small>');
    } else if (S.phase === 'diving' && S.bet) {
      setGo('done', '已上浮<small>' + fx(S.bet.out) + '× · ' + fmt(S.bet.pay) + ' 點</small>', true);
    } else if (S.queued) {
      setGo('unqueue', '取消預約<small>下一回合 ' + fmt(readAmount()) + ' 點</small>');
    } else {
      setGo('queue', '預約下一回合<small>' + fmt(readAmount()) + ' 點</small>');
    }
  }
  function pillClass(v) { return v < 1.5 ? 'low' : v >= 10 ? 'jackpot' : v >= 3 ? 'high' : ''; }
  function renderPills() {
    elPills.innerHTML = S.history.map(function (v) { return '<span class="pill ' + pillClass(v) + '">' + fx(v) + '×</span>'; }).join('');
  }
  function crewRow(name, stake, out, me) {
    var state, cls = '';
    if (out) { state = fx(out) + '× +' + fmt(Math.floor(stake * out) - stake); cls = 'up'; }
    else if (S.phase === 'crashed') { state = '壓潰'; cls = 'lost'; }
    else state = S.phase === 'diving' ? '下潛中' : '待命';
    return '<li' + (me ? ' class="me"' : '') + '><span class="name">' + name + '</span><span class="stake">' + fmt(stake) +
           '</span><span class="state ' + cls + '">' + state + '</span></li>';
  }
  function renderCrew() {
    var rows = [];
    if (S.bet) rows.push(crewRow('你', S.bet.amount, S.bet.out, true));
    S.bots.forEach(function (b) { rows.push(crewRow(b.name, b.stake, b.out, false)); });
    elCrew.innerHTML = rows.join('') || '<li class="empty">這一趟沒有人下潛。</li>';
  }

  /* ---------- canvas ---------- */
  function resize() {
    var r = sea.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seedSnow() { snow = []; for (var i = 0; i < 70; i++) snow.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.6, a: .08 + Math.random() * .25 }); }
  function niceStep(span) { var steps = [.1, .2, .5, 1, 2, 5, 10, 20, 50, 100, 200, 500]; for (var i = 0; i < steps.length; i++) if (span / steps[i] <= 5) return steps[i]; return 1000; }

  function draw(now, dt) {
    if (!W) return;
    var pad = { l: 14, r: 58, t: 26, b: 18 };
    var t = S.phase === 'betting' ? 0 : Math.log(S.m) / K;
    var tMax = Math.max(6, t / 0.8), mMax = Math.max(1.8, 1 + (S.m - 1) / 0.76);
    var X = function (tt) { return pad.l + tt / tMax * (W - pad.l - pad.r); };
    var Y = function (mm) { return pad.t + (mm - 1) / (mMax - 1) * (H - pad.t - pad.b); };

    // water: darkens as the dive goes deeper
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C['sea-top']); g.addColorStop(.45, C.sea); g.addColorStop(1, C.abyss);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var dark = Math.min(.62, Math.log(S.m) / 5);
    ctx.globalAlpha = dark; ctx.fillStyle = C.abyss; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

    // marine snow
    var speed = S.phase === 'diving' ? .05 + Math.min(.12, Math.log(S.m) * .03) : .008;
    ctx.fillStyle = C.fg;
    for (var i = 0; i < snow.length; i++) {
      var p = snow[i];
      if (!reduceMotion) { p.y -= speed * dt * (0.6 + p.r / 2); p.x -= speed * dt * .5; if (p.y < 0) { p.y += 1; p.x = Math.random(); } if (p.x < 0) p.x += 1; }
      ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // depth lines + labels
    var step = niceStep(mMax - 1);
    ctx.font = '600 12px "Chakra Petch", monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var mm = 1 + step; mm < mMax; mm += step) {
      var yy = Y(mm);
      if (yy > H - pad.b) break;
      ctx.strokeStyle = C.line; ctx.globalAlpha = .7; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r + 6, yy); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = C.muted;
      ctx.fillText((step < 1 ? mm.toFixed(1) : mm.toFixed(0)) + '×', W - 10, yy);
    }
    // sea surface
    ctx.strokeStyle = C.fg; ctx.globalAlpha = .55; ctx.lineWidth = 1.5; ctx.beginPath();
    for (var x = 0; x <= W; x += 6) { var wy = Y(1) + Math.sin(x / 22 + (reduceMotion ? 0 : now / 600)) * 2.2; if (x) ctx.lineTo(x, wy); else ctx.moveTo(x, wy); }
    ctx.stroke(); ctx.globalAlpha = 1;

    // dive path
    var tipX = X(t), tipY = Y(S.m), crashed = S.phase === 'crashed';
    var bob = S.phase === 'betting' && !reduceMotion ? Math.sin(now / 500) * 2 : 0;
    if (t > 0) {
      var col = crashed ? C.crush : C.lamp, n = 48;
      ctx.beginPath(); ctx.moveTo(X(0), Y(1));
      for (var j = 1; j <= n; j++) { var tt = t * j / n; ctx.lineTo(X(tt), Y(Math.exp(K * tt))); }
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.lineTo(tipX, Y(1)); ctx.closePath(); ctx.globalAlpha = .1; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
    }
    // your surfacing mark
    if (S.bet && S.bet.out && S.phase !== 'betting') {
      var ot = Math.log(S.bet.out) / K, ox = X(ot), oy = Y(S.bet.out);
      ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = C.glow; ctx.globalAlpha = .5; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, Y(1)); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.fillText('你 ' + fx(S.bet.out) + '×', ox + 9, oy - 9);
    }

    if (crashed) {
      var e = (now - S.crashedAt) / 1000;
      for (var k = 0; k < 3; k++) {
        var rr = (e * 90 - k * 22); if (rr <= 0) continue;
        ctx.strokeStyle = C.crush; ctx.globalAlpha = Math.max(0, .8 - rr / 140); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(tipX, tipY, reduceMotion ? 20 + k * 14 : rr, 0, 6.2832); ctx.stroke();
      }
      ctx.fillStyle = C.fg;
      for (var b = 0; b < 12; b++) {
        var bx = tipX + Math.sin(b * 2.4) * (10 + b * 2.2), by = tipY - (reduceMotion ? 20 + b * 6 : e * (40 + b * 9));
        if (by < Y(1)) continue;
        ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(bx, by, 1.5 + (b % 3), 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // submersible, nose along the dive path
      var slope = t > 0 ? Math.atan2((K * S.m) * (H - pad.t - pad.b) / (mMax - 1), (W - pad.l - pad.r) / tMax) : 0;
      ctx.save(); ctx.translate(tipX + (t > 0 ? 0 : 26), tipY + bob + (t > 0 ? 0 : 10)); ctx.rotate(slope);
      var beam = ctx.createLinearGradient(14, 0, 110, 0);
      beam.addColorStop(0, 'rgba(98,230,210,.38)'); beam.addColorStop(1, 'rgba(98,230,210,0)');
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(110, -30); ctx.lineTo(110, 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.lamp;
      ctx.beginPath(); ctx.ellipse(-4, 0, 20, 9, 0, 0, 6.2832); ctx.fill();          // hull
      ctx.fillRect(-10, -15, 11, 8);                                                  // sail
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-31, -8); ctx.lineTo(-31, 8); ctx.closePath(); ctx.fill(); // tail
      ctx.fillStyle = C.abyss; ctx.beginPath(); ctx.arc(6, -1, 3.6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = C.glow; ctx.beginPath(); ctx.arc(6, -1, 2, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- loop ---------- */
  function frame(now) {
    var dt = Math.min(.1, (now - (lastFrame || now)) / 1000); lastFrame = now;
    if (S.phase === 'betting') {
      var left = S.phaseEnd - now;
      if (left <= 0) startDive(now);
      else { elMult.innerHTML = '1.00<small>×</small>'; elSub.textContent = '下注中 · ' + (left / 1000).toFixed(1) + ' 秒後下潛'; }
    }
    if (S.phase === 'diving') {
      var m = Math.exp(K * (now - S.t0) / 1000), hit = m >= S.crash, lim = hit ? S.crash : m;
      var changed = false;
      if (S.bet && !S.bet.out && S.bet.auto && S.bet.auto <= lim) cashOut(S.bet.auto);
      S.bots.forEach(function (b) { if (!b.out && b.target <= lim) { b.out = b.target; changed = true; } });
      S.m = lim;
      if (hit) doCrash(now);
      else {
        if (changed) renderCrew();
        renderGo();
        elMult.innerHTML = fx(S.m) + '<small>×</small>';
        elSub.textContent = '深度 ' + fmt((S.m - 1) * 1000) + ' m';
      }
    }
    if (S.phase === 'crashed') {
      elMult.innerHTML = fx(S.crash) + '<small>×</small>';
      elSub.textContent = '壓潰於 ' + fmt((S.crash - 1) * 1000) + ' m';
      if (now >= S.phaseEnd) startBetting(now);
    }
    draw(now, dt);
    pkTick(now);
    requestAnimationFrame(frame);
  }

