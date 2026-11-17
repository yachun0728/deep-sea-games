
  /* ---------- Breakout: free retro brick game. No entry fee, no points in or out; score and level are records only. ---------- */
  (function () {
    var c = $('br-canvas'), g = c.getContext('2d'), W = 400, H = 520;
    var COLS = 8, BW = 44, BH = 18, GAP = 4, TOP = 64, LEFT = 10, PY = 484, PH = 12, BR = 7;
    var COLORS = ['#ff766b', '#ff9f5a', '#ffc857', '#7ee08a', '#62e6d2', '#6cc4ff', '#b79cff', '#ff8fd0'];
    var KEY_BEST = 'deep-sea-breakout-best', KEY_LEVEL = 'deep-sea-breakout-level-best';
    var best = 0, bestLevel = 0;
    try { best = Number(localStorage.getItem(KEY_BEST)) || 0; bestLevel = Number(localStorage.getItem(KEY_LEVEL)) || 0; } catch (e) {}
    var analytics = null;
    var st = 'ready', paused = false, serving = true, level = 1, score = 0, lives = 3, bricksBroken = 0;
    var bricks = [], balls = [], drops = [], parts = [], pops = [];
    var padX = W / 2, padW = 80, wideT = 0, slowT = 0, banner = 0, last = 0, t = 0, keys = { l: false, r: false }, recorded = false;

    function say(text, cls) { $('br-msg').textContent = text; $('br-msg').className = 'msg' + (cls ? ' ' + cls : ''); }
    function setText(id, value) { var el = $(id); if (el.textContent !== value) el.textContent = value; }
    function baseSpeed() { return Math.min(520, 300 + (level - 1) * 25); }
    function curSpeed() { return baseSpeed() * (slowT > 0 ? 0.72 : 1); }
    function paddleWidth() { return wideT > 0 ? 124 : 80; }

    function buildLevel() {
      var rows = Math.min(8, 3 + level), pattern = (level - 1) % 4, hard = level >= 6 ? 3 : level >= 3 ? 2 : 0;
      bricks = [];
      for (var r = 0; r < rows; r++) for (var col = 0; col < COLS; col++) {
        if (pattern === 1 && (r + col) % 2) continue;
        if (pattern === 2 && r > 0 && r < rows - 1 && col > 1 && col < COLS - 2) continue;
        if (pattern === 3 && r % 2 && (col === 0 || col === COLS - 1)) continue;
        var hp = r < hard ? 2 : 1;
        bricks.push({ x: LEFT + col * (BW + GAP), y: TOP + r * (BH + GAP), hp: hp, max: hp, color: COLORS[r % COLORS.length] });
      }
    }
    function serve() {
      serving = true; drops = []; wideT = 0; slowT = 0; padW = 80;
      balls = [{ x: padX, y: PY - BR - 1, vx: 0, vy: 0 }];
    }
    function burst(x, y, col, n) { for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: (Math.random() - .5) * 220, vy: (Math.random() - .7) * 220, l: 1, c: col }); }
    function pop(text, x, y, col) { pops.push({ s: text, x: x, y: y, t: 0, c: col || '#fff' }); }

    function ui() {
      var live = st === 'run';
      setText('br-level', String(level)); setText('br-score', String(score)); setText('br-lives', String(lives));
      setText('br-best', String(best)); setText('br-best-level', String(bestLevel));
      $('br-go').disabled = live; setText('br-go', live ? '遊戲進行中' : st === 'over' ? '再玩一次' : '開始打磚塊');
      $('br-pause').disabled = !live; $('br-pause').setAttribute('aria-pressed', String(paused)); setText('br-pause', paused ? '繼續' : '暫停');
    }

    function start() {
      if (st === 'run') return;
      analytics = AN.start('breakout', 0);
      st = 'run'; paused = false; level = 1; score = 0; lives = 3; bricksBroken = 0; recorded = false; padX = W / 2;
      buildLevel(); serve(); parts = []; pops = []; last = performance.now();
      say('點畫面或按空白鍵發球。'); ui(); c.focus();
    }
    function finish() {
      if (st !== 'run') return;
      st = 'over'; paused = false; recorded = false;
      if (score > best) { best = score; recorded = true; try { localStorage.setItem(KEY_BEST, best); } catch (e) {} }
      if (level > bestLevel) { bestLevel = level; recorded = true; try { localStorage.setItem(KEY_LEVEL, bestLevel); } catch (e) {} }
      AN.end(analytics, 0, 'loss', { score: score, level: level, bricks: bricksBroken }); analytics = null;
      say('球用完了。關卡 ' + level + ' · 分數 ' + score, recorded ? 'win' : '');
      ui();
    }
    function launch() {
      if (st !== 'run' || paused || !serving) return;
      var a = (Math.random() - .5) * 0.9, sp = curSpeed(), b = balls[0];
      b.vx = sp * Math.sin(a); b.vy = -sp * Math.cos(a); serving = false; say('加油！');
    }
    function togglePause() {
      if (st !== 'run') return;
      paused = !paused; last = performance.now(); say(paused ? '已暫停。' : '繼續！'); ui();
    }

    function dropChance(b) { return Math.random() < 0.14; }
    function hitBrick(b) {
      b.hp--; score += 10; bricksBroken++;
      if (b.hp > 0) { burst(b.x + BW / 2, b.y + BH / 2, '#ffffff', 4); return; }
      score += 10 * b.max; burst(b.x + BW / 2, b.y + BH / 2, b.color, 10);
      if (dropChance(b)) drops.push({ x: b.x + BW / 2, y: b.y + BH, type: ['W', 'S', 'M'][Math.floor(Math.random() * 3)] });
      bricks.splice(bricks.indexOf(b), 1);
    }
    function applyDrop(d) {
      if (d.type === 'W') { wideT = 12; pop('擋板加寬', padX, PY - 30, '#62e6d2'); }
      else if (d.type === 'S') { slowT = 10; pop('球變慢', padX, PY - 30, '#6cc4ff'); }
      else {
        var src = balls[0];
        if (src && !serving) {
          [-0.5, 0.5].forEach(function (rot) {
            var sp = Math.hypot(src.vx, src.vy) || curSpeed(), ang = Math.atan2(src.vy, src.vx) + rot;
            balls.push({ x: src.x, y: src.y, vx: sp * Math.cos(ang), vy: sp * Math.sin(ang) });
          });
        }
        pop('多球', padX, PY - 30, '#ffc857');
      }
      score += 25;
    }

    function stepBall(b, dt) {
      var sp = Math.hypot(b.vx, b.vy), want = curSpeed();
      if (sp > 0 && Math.abs(sp - want) > 1) { var k = want / sp; b.vx *= k; b.vy *= k; sp = want; }
      var n = Math.max(1, Math.ceil(sp * dt / 4)), sub = dt / n;
      for (var s = 0; s < n; s++) {
        b.x += b.vx * sub; b.y += b.vy * sub;
        if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); }
        if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx); }
        if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy); }
        if (b.vy > 0 && b.y + BR >= PY && b.y - BR <= PY + PH && b.x >= padX - padW / 2 - BR && b.x <= padX + padW / 2 + BR) {
          var off = Math.max(-1, Math.min(1, (b.x - padX) / (padW / 2))), ang = off * 1.05, sp2 = Math.hypot(b.vx, b.vy) || want;
          b.vx = sp2 * Math.sin(ang); b.vy = -sp2 * Math.cos(ang); b.y = PY - BR - 0.5;
        }
        for (var i = 0; i < bricks.length; i++) {
          var br = bricks[i], cx = Math.max(br.x, Math.min(b.x, br.x + BW)), cy = Math.max(br.y, Math.min(b.y, br.y + BH));
          var dx = b.x - cx, dy = b.y - cy;
          if (dx * dx + dy * dy > BR * BR) continue;
          var ox = BR - Math.abs(b.x - (br.x + BW / 2)) + BW / 2, oy = BR - Math.abs(b.y - (br.y + BH / 2)) + BH / 2;
          if (ox < oy) b.vx = (b.x < br.x + BW / 2 ? -1 : 1) * Math.abs(b.vx); else b.vy = (b.y < br.y + BH / 2 ? -1 : 1) * Math.abs(b.vy);
          hitBrick(br); break;
        }
      }
    }

    function update(dt) {
      t += dt;
      parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.l -= dt * 1.6; }); parts = parts.filter(function (p) { return p.l > 0; });
      pops.forEach(function (p) { p.t += dt; }); pops = pops.filter(function (p) { return p.t < 1; });
      if (st !== 'run' || paused) return;
      if (banner > 0) banner -= dt;
      if (wideT > 0) wideT -= dt; if (slowT > 0) slowT -= dt;
      padW += (paddleWidth() - padW) * Math.min(1, dt * 10);
      var dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      if (dir) padX = Math.max(padW / 2, Math.min(W - padW / 2, padX + dir * 420 * dt));
      padX = Math.max(padW / 2, Math.min(W - padW / 2, padX));
      if (serving) { balls[0].x = padX; balls[0].y = PY - BR - 1; }
      else {
        balls.forEach(function (b) { stepBall(b, dt); });
        balls = balls.filter(function (b) { return b.y - BR <= H; });
        if (!balls.length) {
          lives--; burst(padX, PY, '#ff766b', 14);
          if (lives <= 0) { finish(); return; }
          serve(); say('漏接了！還剩 ' + lives + ' 顆球，點畫面發球。', 'lose');
        }
      }
      drops.forEach(function (d) { d.y += 130 * dt; });
      drops = drops.filter(function (d) {
        if (d.y >= PY - 8 && d.y <= PY + PH + 10 && Math.abs(d.x - padX) <= padW / 2 + 10) { applyDrop(d); return false; }
        return d.y < H + 20;
      });
      if (!bricks.length) {
        score += 100; AN.progress(analytics, { stage: level, step: level, score: score, level: level });
        if (level >= bestLevel) bestLevel = level;
        level++; buildLevel(); serve(); banner = 1.4; say('過關！準備下一關，點畫面發球。', 'win');
      }
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
      if (st === 'run' && serving && !paused && banner <= 0) tx('點一下發球', W / 2, 330, 24, '#ffffff');
      if (banner > 0) tx('過關！', W / 2, 300, 40, '#ffc857');
      if (paused) { g.fillStyle = 'rgba(10,26,40,.6)'; g.fillRect(0, 0, W, H); tx('暫停', W / 2, 270, 40, '#ffffff'); tx('按 P 或「繼續」', W / 2, 310, 20, '#ffffff'); }
      if (st === 'ready') { g.fillStyle = 'rgba(10,26,40,.55)'; g.fillRect(0, 0, W, H); tx('打磚塊', W / 2, 250, 38, '#ffc857'); tx('到操作區按開始', W / 2, 300, 22, '#ffffff'); }
      if (st === 'over') {
        g.fillStyle = 'rgba(10,26,40,.6)'; g.fillRect(0, 0, W, H); tx('遊戲結束', W / 2, 215, 32, '#ff8f80');
        tx('關卡 ' + level, W / 2, 275, 40, '#ffffff'); tx('分數 ' + score, W / 2, 312, 22, '#ffffff');
        if (recorded) tx('新紀錄！', W / 2, 348, 22, '#ffc857'); tx('到操作區再玩一次', W / 2, 400, 20, '#ffffff');
      }
    }

    function moveTo(clientX) { var r = c.getBoundingClientRect(); if (!r.width) return; padX = Math.max(padW / 2, Math.min(W - padW / 2, (clientX - r.left) / r.width * W)); }
    $('br-go').addEventListener('click', start);
    $('br-pause').addEventListener('click', togglePause);
    c.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (st === 'run') { e.preventDefault(); c.focus(); moveTo(e.clientX); if (c.setPointerCapture) { try { c.setPointerCapture(e.pointerId); } catch (x) {} } launch(); }
      else say(st === 'over' ? '這一局已結束。按「再玩一次」開始新的一局。' : '先按「開始打磚塊」。');
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
      if (!$('view-breakout').hidden && !document.hidden) { update(dt); ui(); draw(); }
      requestAnimationFrame(loop);
    }
    buildLevel(); serve(); ui(); draw(); requestAnimationFrame(loop);
  })();
