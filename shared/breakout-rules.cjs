const breakoutRules = (() => {
function create(random, hooks = {}) {
 const Math = Object.create(globalThis.Math);
 Math.random = random;
 const W = 400, H = 520, analytics = null;
 const say = hooks.say || (() => {});
 const AN = {progress: (_, data) => hooks.progress?.(data)};
 let bestLevel = 0;
    var COLS = 8, BW = 44, BH = 18, GAP = 4, TOP = 64, LEFT = 10, PY = 484, PH = 12, BR = 7;
    var COLORS = ['#ff766b', '#ff9f5a', '#ffc857', '#7ee08a', '#62e6d2', '#6cc4ff', '#b79cff', '#ff8fd0'];
    var st = 'ready', paused = false, serving = true, level = 1, score = 0, lives = 3, bricksBroken = 0;
    var bricks = [], balls = [], drops = [], parts = [], pops = [];
    var padX = W / 2, padW = 80, wideT = 0, slowT = 0, banner = 0, t = 0, keys = { l: false, r: false }, recorded = false;

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
    function launch() {
      if (st !== 'run' || paused || !serving) return;
      var a = (Math.random() - .5) * 0.9, sp = curSpeed(), b = balls[0];
      b.vx = sp * Math.sin(a); b.vy = -sp * Math.cos(a); serving = false; say('加油！');
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
 function finish() { st = 'over'; }
 st = 'run'; buildLevel(); serve();
 return {
  get dead() { return st === 'over'; },
  get keys() { return keys; },
  snapshot() { return {st,serving,level,score,lives,bricksBroken,bricks,balls,drops,parts,pops,padX,padW,wideT,slowT,banner,t}; },
  launch,
  update,
  input(code) {
   if (st !== 'run' || !Number.isInteger(code) || code < 0 || code >= 406) return false;
   if (code <= 400) { padX = Math.max(padW / 2, Math.min(W - padW / 2, code)); return true; }
   if (code === 401) { if (!serving) return false; launch(); return true; }
   const name = code < 404 ? 'l' : 'r', held = code % 2 === 0;
   if (keys[name] === held) return false;
   keys[name] = held; return true;
  },
 };
}
return {create, inputCount:406, input:(state,code)=>state.input(code), advance:(state,dt)=>state.update(dt), score:state=>state.snapshot().score};
})();
if (typeof module !== 'undefined') module.exports = breakoutRules;
