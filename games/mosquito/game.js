  /* ---------- Midnight Mosquito: hold to dive, let go to rise; land on skin and keep holding to suck blood while the sleeper's alertness climbs ---------- */
  var mqBusy=false,mqStake=0,mqSay=function(){};
  (function(){
const cv=$('mq-canvas'),g=cv.getContext('2d'),W=480,H=720;
// Fixed BONUS (points are credited the moment the milestone is reached; each once per round, never taken back).
const MQ_REWARDS=[[25,1],[50,2],[75,3]],MQ_WIN_REWARD=4;
let best=0;try{best=+localStorage.getItem('deep-sea-mosquito-best')||0}catch(e){}
let analytics=null,earned=0,paid=[false,false,false],winPaid=false,paidCount=0;
// ---- game rules (pure logic) ----
  var MQC = {
    W: 480, H: 720, R: 7, wallL: 22, wallR: 458, ceiling: 34,
    vx: 120, panicVx: 220, steer: 7,
    riseBase: 200, riseWeight: 0.5, diveBase: 235, diveHeavy: 0.5, safeSpeed: 190,
    stunTime: 1.0, stunFall: 150,
    flyAlert: 2.8, nearHeadMult: 1.8, highY: 250, highMult: 1.3, headX: 190, headY: 430,
    lateBlood: 90, lateMult: 0.5,
    itchBase: 0.30, itchAlert: 0.012, itchWind: 1.2, grabTime: 0.3, itchCd: 2.5, itchReachX: 20, itchReachY: 80,
    rollFirst: 8, rollGapMin: 9, rollGapMax: 13, rollWarn: 1.8, rollSweep: 0.6, rollSafeY: 400,
    lightTime: 2.0, panicRise: 1.15,
    winY0: 62, winY1: 130, deadLock: 0.25
  };
  var MQZ = [
    { id: 'face', x0: 70, x1: 150, y: 556, rate: 16, alert: 3.8 },
    { id: 'arm',  x0: 250, x1: 340, y: 572, rate: 12, alert: 2.1},
    { id: 'foot', x0: 420, x1: 458, y: 582, rate: 9,  alert: 1.4}
  ];
  var BLANKET_Y = 592;

  function mqSurface(x) {
    for (var i = 0; i < MQZ.length; i++) {
      var z = MQZ[i];
      if (x >= z.x0 && x <= z.x1) return { y: z.y, zone: z };
    }
    return { y: BLANKET_Y, zone: null };
  }
  function mqInWin(y) { return y >= MQC.winY0 && y <= MQC.winY1; }

  function mqNew(rng) {
    rng = rng || Math.random;
    return {
      rng: rng, t: 0, state: 'play', endT: 0,
      x: 40, y: 95, vy: 0, dir: 1, mode: 'fly', stun: 0, zone: null,
      blood: 0, alert: 0, pressed: false, suckTime: 0,
      itch: { phase: 'none', t: 0, zone: null, cd: 1.5 },
      roll: { phase: 'wait', t: MQC.rollFirst },
      light: { on: false, t: 0 },
      events: [], result: null
    };
  }

  function mqPush(q, type, data) { q.events.push({ type: type, data: data }); }

  function mqKill(q, cause, part) {
    if (q.state !== 'play') return;
    q.state = 'dead'; q.endT = 0;
    q.result = { cause: cause, part: part, blood: q.blood, time: q.t };
    mqPush(q, 'dead', q.result);
  }

  function mqStep(q, dt, pressed) {
    if (q.state !== 'play') { q.endT += dt; return; }
    q.t += dt;
    var panic = q.light.on;
    if (panic) pressed = (q.mode === 'suck') ? false : pressed;
    q.pressed = pressed;

    // alertness
    var aMult = q.blood >= MQC.lateBlood ? MQC.lateMult : 1;
    if (!panic) {
      if (q.mode === 'suck') q.alert += q.zone.alert * aMult * dt;
      else {
        var r = MQC.flyAlert;
        if (q.x < MQC.headX && q.y > MQC.headY) r *= MQC.nearHeadMult;
        if (q.y < MQC.highY) r *= MQC.highMult;
        q.alert += r * aMult * dt;
      }
      if (q.alert >= 100) {
        q.alert = 100; q.light.on = true; q.light.t = MQC.lightTime; panic = true;
        q.itch.phase = 'none'; q.roll.phase = 'wait';
        if (q.mode === 'suck') { q.mode = 'fly'; q.vy = -60; q.y -= 1; }
        mqPush(q, 'light');
      }
    }

    // sucking
    if (q.mode === 'suck') {
      if (pressed) { q.blood = Math.min(100, q.blood + q.zone.rate * dt); q.suckTime += dt; }
      else { q.mode = 'fly'; q.vy = -90; q.y -= 1; q.zone = null; mqPush(q, 'takeoff'); }
    }

    // flying
    if (q.mode !== 'suck') {
      if (q.stun > 0) { q.stun -= dt; if (q.stun <= 0) q.mode = 'fly'; }
      // horizontal
      if (panic) q.x = Math.max(MQC.wallL, q.x - MQC.panicVx * dt);
      else {
        q.x += q.dir * MQC.vx * dt;
        if (q.x >= MQC.wallR) { q.x = MQC.wallR; q.dir = -1; }
        if (q.x <= MQC.wallL) {
          if (q.blood >= 100 && mqInWin(q.y)) { q.x = MQC.wallL; q.state = 'won'; q.endT = 0; q.result = { blood: 100, time: q.t }; mqPush(q, 'win'); return; }
          q.x = MQC.wallL; q.dir = 1;
        }
      }
      // vertical
      var w = q.blood / 100;
      var rise = MQC.riseBase * (1 - MQC.riseWeight * w) * (panic ? MQC.panicRise : 1);
      var dive = MQC.diveBase * (1 + MQC.diveHeavy * w);
      var target = q.stun > 0 ? MQC.stunFall : (pressed ? dive : -rise);
      q.vy += (target - q.vy) * Math.min(1, MQC.steer * dt);
      q.y += q.vy * dt;
      if (q.y < MQC.ceiling) { q.y = MQC.ceiling; if (q.vy < 0) q.vy = 0; }
      // surfaces
      if (q.vy > 0) {
        var s = mqSurface(q.x);
        if (q.y + MQC.R >= s.y) {
          q.y = s.y - MQC.R - 0.5;
          if (s.zone && q.stun <= 0 && !panic && q.vy <= MQC.safeSpeed) {
            q.mode = 'suck'; q.zone = s.zone; q.vy = 0; q.y = s.y - MQC.R; mqPush(q, 'land', s.zone.id);
          } else if (s.zone && q.stun <= 0 && !panic) {
            q.stun = MQC.stunTime; q.mode = 'stun'; q.vy = -140; mqPush(q, 'crash');
          } else { q.vy = -70; mqPush(q, 'bounce'); }
        }
      }
      // escape through hole while lights are on
      if (panic && q.x <= MQC.wallL + 0.5 && mqInWin(q.y)) {
        q.endT = 0; q.result = { blood: q.blood, time: q.t };
        if (q.blood >= 100) { q.state = 'won'; mqPush(q, 'win'); } else { q.state = 'escaped'; mqPush(q, 'escape'); }
        return;
      }
    }

    // human events
    if (!panic) {
      var it = q.itch;
      if (it.phase === 'none') {
        it.cd -= dt;
        if (q.mode === 'suck' && it.cd <= 0 && q.rng() < (MQC.itchBase + MQC.itchAlert * q.alert) * dt) {
          it.phase = 'wind'; it.t = MQC.itchWind; it.zone = q.zone; mqPush(q, 'itch', it.zone.id);
        }
      } else if (it.phase === 'wind') {
        it.t -= dt;
        if (it.t <= 0) {
          it.phase = 'grab'; it.t = MQC.grabTime; mqPush(q, 'grab', it.zone.id);
          var z = it.zone;
          if (q.x >= z.x0 - MQC.itchReachX && q.x <= z.x1 + MQC.itchReachX && q.y > z.y - MQC.itchReachY) mqKill(q, 'itch', z.id);
        }
      } else if (it.phase === 'grab') {
        it.t -= dt; if (it.t <= 0) { it.phase = 'none'; it.cd = MQC.itchCd; }
      }
      var rl = q.roll;
      rl.t -= dt;
      if (rl.phase === 'wait' && rl.t <= 0) { rl.phase = 'warn'; rl.t = MQC.rollWarn; mqPush(q, 'rollWarn'); }
      else if (rl.phase === 'warn' && rl.t <= 0) { rl.phase = 'sweep'; rl.t = MQC.rollSweep; mqPush(q, 'roll'); }
      else if (rl.phase === 'sweep') {
        if (q.y > MQC.rollSafeY) mqKill(q, 'roll', 'roll');
        else if (rl.t <= 0) { rl.phase = 'wait'; rl.t = MQC.rollGapMin + q.rng() * (MQC.rollGapMax - MQC.rollGapMin); }
      }
    } else {
      q.light.t -= dt;
      if (q.light.t <= 0) mqKill(q, 'light', 'light');
    }
  }
// ---- drawing ----
  var FONT = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',system-ui,sans-serif";
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(s, x, y, size, color, align, stroke) {
    g.font = '700 ' + size + 'px ' + FONT; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = Math.max(3, size / 7); g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = color; g.fillText(s, x, y);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bloodColor(p) { var r = Math.round(lerp(255, 160, p)), gg = Math.round(lerp(170, 8, p)), b = Math.round(lerp(170, 28, p)); return 'rgb(' + r + ',' + gg + ',' + b + ')'; }
  var SKIN = '#e9bf98', SKIN_D = '#c99a74';

  function drawRoom(alertP, lightOn) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#15152a'); gr.addColorStop(1, '#241d33');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // moon glow from window
    var mg = g.createRadialGradient(20, 100, 10, 20, 100, 260); mg.addColorStop(0, 'rgba(150,170,255,0.28)'); mg.addColorStop(1, 'rgba(150,170,255,0)');
    g.fillStyle = mg; g.fillRect(0, 0, W, 420);
    // window with torn screen
    g.fillStyle = '#0c1024'; g.fillRect(0, 40, 70, 130);
    g.fillStyle = '#7f94d8'; g.beginPath(); g.arc(30, 70, 11, 0, 6.3); g.fill();
    g.strokeStyle = 'rgba(210,220,255,0.35)'; g.lineWidth = 1;
    for (var i = 0; i <= 70; i += 7) { g.beginPath(); g.moveTo(i, 40); g.lineTo(i, 170); g.stroke(); }
    for (var j = 40; j <= 170; j += 7) { g.beginPath(); g.moveTo(0, j); g.lineTo(70, j); g.stroke(); }
    var hg = g.createRadialGradient(10, 96, 4, 10, 96, 38); hg.addColorStop(0, '#9fb4ff'); hg.addColorStop(1, '#2a3a7a'); g.fillStyle = hg; g.beginPath(); g.arc(12, 96, 34, -1.5, 1.5); g.lineTo(0, 130); g.lineTo(0, 62); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.arc(12, 96, 34, -1.5, 1.5); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#7f94d8'; g.beginPath(); g.arc(30, 70, 11, 0, 6.3); g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = '#3a3f66'; g.lineWidth = 5; g.strokeRect(0, 40, 70, 130);
    // bed base
    g.fillStyle = '#2a2236'; g.fillRect(0, 600, W, 120);
    g.fillStyle = '#3a3050'; g.fillRect(0, 604, W, 22);
    g.fillStyle = '#1b1626'; g.fillRect(0, 690, W, 30);
  }

  function drawHuman(q, tt) {
    var rl = q.roll, bulge = 0, breathe = Math.sin(tt * 1.7) * 2;
    if (rl.phase === 'warn') bulge = (1 - rl.t / MQC.rollWarn) * 26 + Math.sin(tt * 14) * 2;
    // pillow
    g.fillStyle = '#cfd3ea'; rr(18, 572, 150, 50, 18); g.fill();
    // head
    var al = q.alert / 100;
    g.fillStyle = SKIN; g.beginPath(); g.arc(110, 598, 42, 0, 6.3); g.fill();
    g.fillStyle = '#2a2230'; g.beginPath(); g.arc(110, 590, 43, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    var eyesOpen = q.light.on;
    if (eyesOpen) {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(94, 598, 7, 0, 6.3); g.arc(126, 598, 7, 0, 6.3); g.fill();
      g.strokeStyle = '#d33'; g.lineWidth = 1; for (var ei = 0; ei < 6; ei++) { g.beginPath(); g.moveTo(94 + Math.cos(ei) * 7, 598 + Math.sin(ei) * 7); g.lineTo(94 + Math.cos(ei) * 3, 598 + Math.sin(ei) * 3); g.moveTo(126 + Math.cos(ei) * 7, 598 + Math.sin(ei) * 7); g.lineTo(126 + Math.cos(ei) * 3, 598 + Math.sin(ei) * 3); g.stroke(); }
      g.fillStyle = '#300'; g.beginPath(); g.arc(95, 599, 3, 0, 6.3); g.arc(125, 599, 3, 0, 6.3); g.fill();
    } else {
      g.strokeStyle = '#4a3a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(87, 599); g.quadraticCurveTo(94, 603, 101, 599); g.moveTo(119, 599); g.quadraticCurveTo(126, 603, 133, 599); g.stroke();
    }
    // brows: frown with alertness
    g.strokeStyle = '#3a2a2a'; g.lineWidth = 3; var tilt = 2 + al * 9;
    g.beginPath(); g.moveTo(86, 588 - tilt * 0.2); g.lineTo(102, 588 + tilt * 0.6); g.moveTo(134, 588 - tilt * 0.2); g.lineTo(118, 588 + tilt * 0.6); g.stroke();
    g.strokeStyle = '#8a5a50'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(100, 620 - al * 2); g.quadraticCurveTo(110, 616 + al * 5, 120, 620 - al * 2); g.stroke();
    // blanket
    var by = 592 - bulge;
    g.fillStyle = '#566494'; g.beginPath(); g.moveTo(150, 626); g.lineTo(150, by + 16); g.quadraticCurveTo(152, by, 170, by + breathe * 0.3); g.lineTo(462, by + 2 + breathe * 0.3); g.lineTo(480, by + 10); g.lineTo(480, 626); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,20,50,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(190, by + 16); g.quadraticCurveTo(230, by + 40, 280, by + 20); g.moveTo(345, by + 12); g.quadraticCurveTo(390, by + 40, 430, by + 18); g.stroke();
    // arm & foot
    g.fillStyle = SKIN; rr(250, 572, 90, 34, 16); g.fill();
    g.fillStyle = SKIN_D; g.beginPath(); g.arc(255, 590, 3, 0, 6.3); g.fill();
    g.fillStyle = SKIN; rr(420, 582, 46, 26, 12); g.fill();
    g.fillStyle = SKIN_D; for (var f = 0; f < 4; f++) { g.beginPath(); g.arc(428 + f * 10, 584, 3, 0, 6.3); g.fill(); }
    // itch ripple & hand
    var it = q.itch;
    if (it.phase === 'wind' && it.zone) {
      var z = it.zone, cx = (z.x0 + z.x1) / 2, p = 1 - it.t / MQC.itchWind;
      for (var k = 0; k < 3; k++) { var rr0 = ((p * 2 + k / 3) % 1) * 34 + 6; g.strokeStyle = 'rgba(255,60,60,' + (0.8 - rr0 / 50) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, z.y + 3, rr0 * 1.6, rr0 * 0.6, 0, 0, 6.3); g.stroke(); }
      text('嗯…', cx, z.y - 150 + Math.sin(tt * 10) * 3, 20, '#ffd0d0', 'center', '#300');
    }
    if (it.phase === 'grab' && it.zone) {
      var zz = it.zone, hx = (zz.x0 + zz.x1) / 2, hp = 1 - it.t / MQC.grabTime, hy = lerp(zz.y - 260, zz.y - 70, Math.min(1, hp * 2.2));
      g.fillStyle = SKIN; rr(hx - 52, hy - 10, 104, 80, 28); g.fill();
      for (var fi = 0; fi < 4; fi++) { rr(hx - 48 + fi * 25, hy + 50, 20, 52, 10); g.fill(); }
      g.fillStyle = SKIN_D; rr(hx - 24, hy - 180, 48, 180, 14); g.fill();
    }
    // roll sweep
    if (rl.phase === 'sweep') {
      var pr = 1 - rl.t / MQC.rollSweep; var topY = lerp(592, 250, Math.min(1, pr * 1.6));
      g.fillStyle = 'rgba(66,54,100,0.92)'; g.beginPath(); g.moveTo(150, 640); g.lineTo(150, topY + 60); g.quadraticCurveTo(300, topY - 40, 480, topY + 40); g.lineTo(480, 640); g.closePath(); g.fill();
    }
  }

  function drawMosquito(q, tt) {
    var x = q.x, y = q.y, d = q.dir; if (q.light.on) d = -1;
    var p = q.blood / 100;
    g.save(); g.translate(x, y);
    var tilt = q.mode === 'suck' ? 0.9 : Math.max(-0.5, Math.min(0.6, q.vy / 380));
    g.scale(d * 1.6, 1.6); g.rotate(tilt);
    // legs
    g.strokeStyle = '#222'; g.lineWidth = 1.2;
    for (var l = -1; l <= 1; l++) { g.beginPath(); g.moveTo(l * 3, 2); g.lineTo(l * 5 - 2, 9 + Math.sin(tt * 20 + l) * 1); g.stroke(); }
    // belly
    var br = 4.5 + p * 8; g.fillStyle = bloodColor(p); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(-8 - p * 3, 1, br + 3, br, 0, 0, 6.3); g.fill(); g.stroke();
    // thorax + head
    g.fillStyle = '#2b2b33'; g.beginPath(); g.ellipse(2, 0, 6, 4, 0, 0, 6.3); g.fill();
    g.beginPath(); g.arc(8, 0, 3.2, 0, 6.3); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(10, 1); g.lineTo(q.mode === 'suck' ? 17 : 15, 5); g.stroke();
    g.fillStyle = q.mode === 'stun' ? '#fff' : '#f55'; g.beginPath(); g.arc(9, -1, 1.2, 0, 6.3); g.fill();
    // wings
    var flap = q.mode === 'suck' ? 0 : Math.sin(tt * 55);
    var wl = (q.pressed && q.mode !== 'suck') ? 3 : 11;
    g.fillStyle = 'rgba(210,225,255,0.55)';
    g.beginPath(); g.ellipse(0, -4 - Math.abs(flap) * 2, wl, 3.5, -0.4 + flap * 0.5, 0, 6.3); g.fill();
    g.restore();
    if (q.mode === 'stun') { for (var s = 0; s < 3; s++) { var a = tt * 8 + s * 2.1; text('★', x + Math.cos(a) * 14, y - 12 + Math.sin(a) * 4, 10, '#ffe066'); } }
  }

  function drawSwatter(q) {
    var lt = MQC.lightTime - q.light.t; var p = Math.max(0, Math.min(1, (lt - 0.5) / (MQC.lightTime - 0.5)));
    var sx = lerp(300, q.x, p), sy = lerp(-120, q.y - 30, p * p);
    g.save(); g.translate(sx, sy); g.rotate(0.3);
    g.fillStyle = '#c33'; rr(-22, 0, 44, 70, 6); g.fill();
    g.strokeStyle = '#611'; g.lineWidth = 1; for (var i = -18; i <= 18; i += 6) { g.beginPath(); g.moveTo(i, 4); g.lineTo(i, 66); g.stroke(); }
    g.fillStyle = '#333'; g.fillRect(-4, -120, 8, 124);
    g.restore();
  }

  function drawBar(x, y, w, h, p, color, bg) { g.fillStyle = bg || 'rgba(255,255,255,0.12)'; rr(x, y, w, h, h / 2); g.fill(); if (p > 0) { g.fillStyle = color; rr(x, y, Math.max(h, w * p), h, h / 2); g.fill(); } }

  function drawHUD(q, tt) {
    var p = q.blood / 100, a = q.alert / 100;
    text('吸血', 16, 22, 15, '#ffd6d6', 'left');
    drawBar(60, 14, 404, 16, p, bloodColor(Math.max(0.35, p)));
    text(q.blood.toFixed(1) + '%', 468, 22, 13, '#fff', 'right');
    text('警覺', 16, 46, 15, '#ffe9b0', 'left');
    var col = a > 0.7 ? '#ff4040' : a > 0.4 ? '#ff9f2e' : '#ffd23f';
    drawBar(60, 38, 404, 16, a, col);
    if (a > 0.7 && Math.floor(tt * 6) % 2 === 0) { g.strokeStyle = '#ff4040'; g.lineWidth = 2; rr(60, 38, 404, 16, 8); g.stroke(); }
    if (hintText) text(hintText, 240, 78, 18, '#fff', 'center', 'rgba(0,0,0,0.75)');
  }

  function computeHint(q) {
    if (q.light.on) return '開燈了！衝向左邊的破洞！';
    if (q.itch.phase === 'wind') return '發癢！快放開飛走！';
    if (q.roll.phase === 'warn') return '要翻身了！快往上飛！';
    if (q.blood >= 100) return '吸飽了！飛出窗戶的破洞！';
    if (q.mode === 'suck') return '按住繼續吸 · 放開起飛';
    if (q.t < 6) return '放開＝上升　按住＝俯衝　落在皮膚上按住吸血';
    return '';
  }

let st='ready',mo=mqNew(Math.random),tt=0,last=0,overT=0,rec=false,shake=0,flash=0,hintText='',splat=[],result=null;
const CAUSE={face:'死因：被抓癢的手拍扁（臉頰）',arm:'死因：被抓癢的手拍扁（手臂）',foot:'死因：被抓癢的手拍扁（腳）',roll:'死因：被翻身壓死',light:'死因：燈亮後被電蚊拍打中'};
const ptrs=new Set();let keyHeld=false;
const held=()=>ptrs.size>0||keyHeld;
const releaseInput=()=>{ptrs.clear();keyHeld=false};
function say(text,kind){$('mq-msg').textContent=text;$('mq-msg').className='msg'+(kind?' '+kind:'')}
mqSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('mq-blood',mo.blood.toFixed(1)+'%');setText('mq-alert',Math.floor(mo.alert)+'%');setText('mq-best',best.toFixed(1)+'%');
 $('mq-amount').disabled=mqBusy;$('mq-go').disabled=live;setText('mq-go',live?'出動中 · 放開上升、按住下降':st==='over'?'再來一隻':'開始吸血');
}
function pay(n){
 earned+=n;paidCount++;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:1,step:paidCount,score:Math.round(mo.blood),bonus_points:n,total_bonus_points:earned});
}
function checkMilestones(){
 for(let i=0;i<MQ_REWARDS.length;i++){
  if(!paid[i]&&mo.blood>=MQ_REWARDS[i][0]){paid[i]=true;pay(MQ_REWARDS[i][1]);say('吸血達 '+MQ_REWARDS[i][0]+'% 里程碑，+'+MQ_REWARDS[i][1]+' 點已入帳。','win')}}
}
function finish(kind){
 if(st!=='run')return;
 st='over';overT=0;releaseInput();
 const r=mo.result||{blood:mo.blood};
 result={kind:kind,blood:r.blood,cause:r.cause||'',part:r.part||'',time:r.time||mo.t};
 rec=result.blood>best;
 if(rec){best=Math.round(result.blood*10)/10;try{localStorage.setItem('deep-sea-mosquito-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:Math.round(result.blood),step:paidCount,stage:1});mqBusy=false;save();renderAll();
 const pct=result.blood.toFixed(1);
 if(kind==='won')say('吸飽了！成功飛出窗戶，本局共入帳 '+fmt(earned)+' 點。','win');
 else if(kind==='escaped'){if(earned)say('死裡逃生！只吸到 '+pct+'%，沒有過關，本局共入帳 '+fmt(earned)+' 點。','win');else say('死裡逃生！只吸到 '+pct+'%，沒有過關，這一局沒有額外成就獎勵。','lose')}
 else{if(earned)say('被拍扁了。吸飽度 '+pct+'%，本局共入帳 '+fmt(earned)+' 點。','win');else say('被拍扁了。吸飽度 '+pct+'%，這一局沒有額外成就獎勵。','lose')}
 ui();
}
function handleEvents(){
 const evs=mo.events.slice();mo.events.length=0;
 for(const e of evs){
  if(e.type==='crash'&&!reduceMotion)shake=.25;
  else if(e.type==='grab'&&!reduceMotion)shake=.3;
  else if(e.type==='roll'&&!reduceMotion)shake=.5;
  else if(e.type==='light'&&!reduceMotion)flash=1;
  else if(e.type==='dead'){
   if(!reduceMotion)shake=.4;
   for(let k=0;k<14;k++)splat.push({x:mo.x+(Math.random()-.5)*20,y:mo.y+(Math.random()-.5)*20,r:2+Math.random()*6,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160});
   finish('dead')}
  else if(e.type==='win'){if(!winPaid){winPaid=true;pay(MQ_WIN_REWARD)}finish('won')}
  else if(e.type==='escape')finish('escaped');
 }
}
function tick(dt){
 tt+=dt;
 if(shake>0)shake=Math.max(0,shake-dt*1.5);if(flash>0)flash=Math.max(0,flash-dt*2.5);
 if(st==='run'){mqStep(mo,dt,held());checkMilestones();handleEvents();hintText=st==='run'?computeHint(mo):''}
 else if(st==='over'){
  overT+=dt;
  for(const s of splat){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=400*dt;s.vx*=.96}
 }
}
function drawOverlay(){
 if(st==='ready'){
  g.fillStyle='rgba(8,8,16,.72)';g.fillRect(0,0,W,H);
  text('血壓上升',240,130,54,'#ff5a5a','center','#200');text('深夜蚊子大作戰',240,184,26,'#ffd6d6','center','#200');
  const ins=['放開：蚊子往上飄','按住：往下俯衝','降落在皮膚上，按住就吸血','吸越多越重、越飛不動','吸滿 100% 才能從窗戶破洞逃出去','別把他吵醒，被拍扁是你太貪心'];
  for(let i=0;i<ins.length;i++)text(ins[i],240,250+i*30,18,'#e8e8f4');
  text('到操作區開始',240,560,24,'#ffd23f','center','#000');
  return}
 if(st!=='over'||!result)return;
 const r=result;
 if(r.kind==='dead'){
  g.fillStyle='rgba(30,0,0,'+Math.min(.7,overT*3)+')';g.fillRect(0,0,W,H);
  text('被拍扁了',240,250,32,'#ffd6d6','center','#200');
  text('吸飽度 '+r.blood.toFixed(1)+'%',240,330,52,'#ff2a2a','center','#200');
  text(r.blood>=95?'就差一點點……你太貪心了':r.blood>=80?'再多活一秒就能吸飽':'連一半都沒吸到',240,388,20,'#ffd6d6');
  text(CAUSE[r.cause==='itch'?r.part:r.cause],240,426,18,'#ffb0b0');
 }else if(r.kind==='won'){
  g.fillStyle='rgba(0,20,10,.6)';g.fillRect(0,0,W,H);
  text('吸飽了！',240,270,52,'#7dffb0','center','#031');
  text('成功飛出窗戶　用時 '+r.time.toFixed(1)+' 秒',240,340,20,'#d8ffe8');
 }else{
  g.fillStyle='rgba(10,10,30,.6)';g.fillRect(0,0,W,H);
  text('死裡逃生',240,270,48,'#9ec3ff','center','#012');
  text('但你只吸到 '+r.blood.toFixed(1)+'%，餓著肚子逃走',240,340,20,'#dce8ff');
 }
 text(earned>0?'本局入帳 '+fmt(earned)+' 點':'這一局沒有額外成就獎勵',240,468,22,earned>0?'#ffd23f':'#fff1c1');
 if(rec)text('新紀錄！',240,502,20,'#ffd23f');
 text('到操作區再玩一次',240,560,20,'#fff1c1');
}
function draw(){
 const sx=shake>0?(Math.random()-.5)*20*shake:0,sy=shake>0?(Math.random()-.5)*20*shake:0;
 g.save();g.translate(sx,sy);
 drawRoom(mo.alert/100,mo.light.on);
 drawHuman(mo,tt);
 const showMq=st!=='ready'&&!(st==='over'&&result&&result.kind==='dead')&&mo.state!=='escaped';
 if(st==='ready')drawMosquito({x:240+Math.sin(tt)*140,y:300+Math.sin(tt*1.7)*50,dir:Math.cos(tt)>0?1:-1,blood:0,mode:'fly',pressed:false,vy:0,light:{on:false}},tt);
 else if(showMq&&!mo.light.on)drawMosquito(mo,tt);
 if(mo.light.on&&st!=='ready'){g.fillStyle='rgba(255,255,245,'+(.5+Math.sin(tt*30)*.06)+')';g.fillRect(0,0,W,H);if(mo.state==='play'||mo.state==='dead')drawSwatter(mo);if(showMq)drawMosquito(mo,tt)}
 for(const s of splat){g.fillStyle='#b00020';g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill()}
 if(st==='run')drawHUD(mo,tt);
 g.restore();
 if(flash>0){g.fillStyle='rgba(255,255,255,'+flash*.6+')';g.fillRect(0,0,W,H)}
 drawOverlay();
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 analytics=AN.start('mosquito',amount);mqStake=amount;mqBusy=true;save();renderAll();
 mo=mqNew(Math.random);earned=0;paid=[false,false,false];winPaid=false;paidCount=0;rec=false;result=null;splat=[];shake=0;flash=0;hintText='';releaseInput();
 st='run';last=performance.now();say('出動！放開上升、按住下降，降落在皮膚上按住吸血。');ui();cv.focus();
}
const shown=()=>!$('view-mosquito').hidden&&!document.hidden;
$('mq-go').addEventListener('click',start);
cv.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'這一局已結算。按「再來一隻」開始新的一局。':'先按「開始吸血」。');return}
 if(!shown())return;e.preventDefault();cv.focus();try{cv.setPointerCapture(e.pointerId)}catch(_){}
 ptrs.add(e.pointerId)});
const endPointer=e=>{ptrs.delete(e.pointerId)};
cv.addEventListener('pointerup',endPointer);cv.addEventListener('pointercancel',endPointer);cv.addEventListener('lostpointercapture',endPointer);
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key===' '){e.preventDefault();keyHeld=true}});
addEventListener('keyup',e=>{if(e.key===' ')keyHeld=false});
addEventListener('blur',()=>{releaseInput();last=performance.now()});
document.addEventListener('visibilitychange',()=>{releaseInput();last=performance.now()});
window.addEventListener('hashchange',()=>{releaseInput();last=performance.now()});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){tick(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
