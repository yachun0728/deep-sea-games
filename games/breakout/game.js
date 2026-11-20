
  /* ---------- Breakout: free retro brick game. No entry fee, no points in or out; score and level are records only. ---------- */
  (function () {
    var c = $('br-canvas'), g = c.getContext('2d'), W = 400, H = 520;
    var COLS = 8, BW = 44, BH = 18, GAP = 4, TOP = 64, LEFT = 10, PY = 484, PH = 12, BR = 7;
    var COLORS = ['#ff766b', '#ff9f5a', '#ffc857', '#7ee08a', '#62e6d2', '#6cc4ff', '#b79cff', '#ff8fd0'];
    var KEY_BEST = 'deep-sea-breakout-best', KEY_LEVEL = 'deep-sea-breakout-level-best';
    var best = 0, bestLevel = 0;
    try { best = Number(localStorage.getItem(KEY_BEST)) || 0; bestLevel = Number(localStorage.getItem(KEY_LEVEL)) || 0; } catch (e) {}
    var analytics = null, model;
    var rank = timedLeaderboard('breakout','br',breakoutRules.inputCount,ui);
    // Texts produced by shared/breakout-rules.cjs (go, wide paddle, slow ball, multi-ball, stage clear). Listed here so the translation table keeps them.
    var RULE_TEXTS = ['{{t:breakout.msg.007}}', '{{t:breakout.msg.010}}', '{{t:breakout.msg.011}}', '{{t:breakout.msg.012}}', '{{t:breakout.msg.013}}'];
    function syncModel() {
      if (!model) return;
      var snapshot = model.snapshot();
      st=snapshot.st;serving=snapshot.serving;level=snapshot.level;score=snapshot.score;lives=snapshot.lives;bricksBroken=snapshot.bricksBroken;
      bricks=snapshot.bricks;balls=snapshot.balls;drops=snapshot.drops;parts=snapshot.parts;pops=snapshot.pops;
      padX=snapshot.padX;padW=snapshot.padW;wideT=snapshot.wideT;slowT=snapshot.slowT;banner=snapshot.banner;t=snapshot.t;
    }
    function act(code) { if(model && breakoutRules.input(model,code)){rank.record(code);syncModel();} }
    function launch(){if(st==='run'&&!paused)act(401);}

    var st = 'ready', paused = false, serving = true, level = 1, score = 0, lives = 3, bricksBroken = 0;
    var bricks = [], balls = [], drops = [], parts = [], pops = [];
    var padX = W / 2, padW = 80, wideT = 0, slowT = 0, banner = 0, last = 0, t = 0, keys = { l: false, r: false }, recorded = false;

    function say(text, cls) { $('br-msg').textContent = text; $('br-msg').className = 'msg' + (cls ? ' ' + cls : ''); }
    function setText(id, value) { var el = $(id); if (el.textContent !== value) el.textContent = value; }

    function ui() {
      var live = st === 'run';
      setText('br-level', String(level)); setText('br-score', String(score)); setText('br-lives', String(lives));
      setText('br-best', String(best)); setText('br-best-level', String(bestLevel));
      $('br-go').disabled = live || rank.busy(); setText('br-go', live ? '{{t:breakout.msg.001}}' : st === 'over' ? '{{t:breakout.msg.002}}' : '{{t:breakout.msg.003}}');
      $('br-pause').disabled = !live; $('br-pause').setAttribute('aria-pressed', String(paused)); setText('br-pause', paused ? '{{t:breakout.msg.004}}' : '{{t:breakout.msg.005}}');
    }

    function start() {
      if (st === 'run' || rank.busy()) return;
      rank.start(function(random){
      analytics = AN.start('breakout', 0);
      st = 'run'; paused = false; level = 1; score = 0; lives = 3; bricksBroken = 0; recorded = false; padX = W / 2;
      model = breakoutRules.create(random || Math.random, {
        say: say, progress: function(data){AN.progress(analytics,data);}
      });
      syncModel(); last = performance.now();
      say('{{t:breakout.msg.006}}'); ui(); c.focus();
      },ui);
    }
    function finish() {
      if (st !== 'run') return;
      rank.finish(score);
      st = 'over'; paused = false; recorded = false;
      if (score > best) { best = score; recorded = true; try { localStorage.setItem(KEY_BEST, best); } catch (e) {} }
      if (level > bestLevel) { bestLevel = level; recorded = true; try { localStorage.setItem(KEY_LEVEL, bestLevel); } catch (e) {} }
      AN.end(analytics, 0, 'loss', { score: score, level: level, bricks: bricksBroken }); analytics = null;
      say('球用完了。關卡 ' + level + ' · 分數 ' + score, recorded ? 'win' : '');
      ui();
    }

    function togglePause() {
      if (st !== 'run') return;
      paused = !paused; last = performance.now(); say(paused ? '{{t:breakout.msg.008}}' : '{{t:breakout.msg.009}}'); ui();
    }

    function rr(x, y, w, h, r, fill) {
      g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fillStyle = fill; g.fill();
    }
    function tx(s, x, y, size, col, al) {
      g.font = '800 ' + size + 'px "Noto Sans TC",system-ui,sans-serif'; g.textAlign = al || 'center'; g.lineJoin = 'round';
      g.lineWidth = size / 5; g.strokeStyle = '#0a1a28'; g.strokeText(s, x, y, W - 30); g.fillStyle = col; g.fillText(s, x, y, W - 30);
    }
    function draw() {
      var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#12263a'); bg.addColorStop(1, '#0a1a28');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      bricks.forEach(function (b) {
        rr(b.x, b.y, BW, BH, 4, b.hp < b.max ? '#dfeaf2' : b.color);
        if (b.max > 1) { g.strokeStyle = 'rgba(10,26,40,.55)'; g.lineWidth = 2; g.strokeRect(b.x + 3, b.y + 3, BW - 6, BH - 6); }
        g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(b.x + 4, b.y + 3, BW - 8, 3);
      });
      drops.forEach(function (d) {
        rr(d.x - 14, d.y - 8, 28, 16, 8, d.type === 'W' ? '#62e6d2' : d.type === 'S' ? '#6cc4ff' : '#ffc857');
        g.fillStyle = '#0a1a28'; g.font = '800 12px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(d.type, d.x, d.y + 4);
      });
      rr(padX - padW / 2, PY, padW, PH, 6, wideT > 0 ? '#62e6d2' : '#e8f4ff');
      balls.forEach(function (b) { g.beginPath(); g.arc(b.x, b.y, BR, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#6cc4ff'; g.stroke(); });
      parts.forEach(function (p) { g.globalAlpha = Math.max(0, p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, 4, 4); }); g.globalAlpha = 1;
      pops.forEach(function (p) { g.globalAlpha = 1 - p.t; tx(p.s, p.x, p.y - p.t * 40, 18, p.c); g.globalAlpha = 1; });
      tx('關卡 ' + level, 12, 28, 18, '#ffc857', 'left'); tx('分數 ' + score, W / 2, 28, 18, '#ffffff');
      for (var i = 0; i < lives; i++) { g.beginPath(); g.arc(W - 20 - i * 18, 22, 6, 0, 7); g.fillStyle = '#fff'; g.fill(); }
      if (st === 'run' && serving && !paused && banner <= 0) tx('{{t:breakout.msg.014}}', W / 2, 330, 24, '#ffffff');
      if (banner > 0) tx('{{t:breakout.msg.015}}', W / 2, 300, 40, '#ffc857');
      if (paused) { g.fillStyle = 'rgba(10,26,40,.6)'; g.fillRect(0, 0, W, H); tx('{{t:breakout.msg.005}}', W / 2, 270, 40, '#ffffff'); tx('{{t:breakout.msg.016}}', W / 2, 310, 20, '#ffffff'); }
      if (st === 'ready') { g.fillStyle = 'rgba(10,26,40,.55)'; g.fillRect(0, 0, W, H); tx('{{t:breakout.msg.017}}', W / 2, 250, 38, '#ffc857'); tx('{{t:breakout.msg.018}}', W / 2, 300, 22, '#ffffff'); }
      if (st === 'over') {
        g.fillStyle = 'rgba(10,26,40,.6)'; g.fillRect(0, 0, W, H); tx('{{t:breakout.msg.019}}', W / 2, 215, 32, '#ff8f80');
        tx('關卡 ' + level, W / 2, 275, 40, '#ffffff'); tx('分數 ' + score, W / 2, 312, 22, '#ffffff');
        if (recorded) tx('{{t:breakout.msg.020}}', W / 2, 348, 22, '#ffc857'); tx('{{t:breakout.msg.021}}', W / 2, 400, 20, '#ffffff');
      }
    }

    function moveTo(clientX) { var r = c.getBoundingClientRect(); if (!r.width) return; act(Math.round(Math.max(0,Math.min(W,(clientX-r.left)/r.width*W)))); }
    $('br-go').addEventListener('click', start);
    $('br-pause').addEventListener('click', togglePause);
    c.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (st === 'run') { e.preventDefault(); c.focus(); moveTo(e.clientX); if (c.setPointerCapture) { try { c.setPointerCapture(e.pointerId); } catch (x) {} } launch(); }
      else say(st === 'over' ? '{{t:breakout.msg.022}}' : '{{t:breakout.msg.023}}');
    });
    c.addEventListener('pointermove', function (e) { if (st === 'run' && !paused && (e.pointerType !== 'mouse' || document.activeElement === c || e.buttons)) moveTo(e.clientX); });
    c.addEventListener('mousemove', function (e) { if (st === 'run' && !paused) moveTo(e.clientX); });
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    addEventListener('keydown', function (e) {
      if ($('view-breakout').hidden || document.hidden || st !== 'run' || e.metaKey || e.altKey || e.ctrlKey) return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'SUMMARY'].indexOf(e.target.tagName) >= 0) return;
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); keys.l = true; }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); keys.r = true; }
      else if (k === ' ') { e.preventDefault(); if (!e.repeat) launch(); }
      else if (k === 'p' || k === 'P') { e.preventDefault(); if (!e.repeat) togglePause(); }
    });
    addEventListener('keyup', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
    });
    addEventListener('blur', function () { keys.l = keys.r = false; last = performance.now(); });
    document.addEventListener('visibilitychange', function () { keys.l = keys.r = false; last = performance.now(); });
    window.addEventListener('hashchange', function () { keys.l = keys.r = false; last = performance.now(); });
    window.addEventListener('pagehide', function (e) {
      if (!e.persisted && st === 'run') { AN.end(analytics, 0, 'abandoned', { score: score, level: level, bricks: bricksBroken }); analytics = null; st = 'over'; }
    }, { capture: true });
    function loop(ts) {
      var dt = Math.min(.05, Math.max(0, (ts - last) / 1000) || 0); last = ts;
      if (!$('view-breakout').hidden && !document.hidden) {
        if (model && st==='run' && !paused) {
          if (model.keys.l!==keys.l) act(keys.l?402:403);
          if (model.keys.r!==keys.r) act(keys.r?404:405);
          var wasLive=st==='run';
          rank.update(dt*1000,()=>st==='run'&&!paused,function(step){breakoutRules.advance(model,step);syncModel();});
          if(wasLive&&model.dead){st='run';finish();}
        }
        ui(); draw();
      }
      requestAnimationFrame(loop);
    }
    model=breakoutRules.create(Math.random);syncModel();st='ready';ui();draw();requestAnimationFrame(loop);
  })();
