const hairRules=(()=>{
const CONFIG = {
  goal: 500,
  baseSpeed: 6.0,                 // 公尺/秒
  speedByHair: [0, 0.5, 0.75, 1], // 剩幾根 → 速度倍率
  tiltEase: 7,                    // 脖子跟上手指的速度
  alignMax: 0.75,                 // 完美迎風歪頭可減少的受風比例
  updraftAlignMul: 0.4,           // 第 4 段歪頭效果打折
  updraft: 0.42,                  // 第 4 段垂直上吸的固定受風
  pressExposure: 0.25,            // 壓頭後受風倍率（抗風 +300%）
  deadzone: 0.12,                 // 低於此受風不傷頭髮
  hairK: [1.0, 1.2, 0.85],        // 三根頭髮各自的敏感度
  glueDrain: 24,                  // 黃條每秒流失（受風=1 時）
  rootDrain: 32,                  // 紅條每秒流失
  glueRegen: 16,                  // 壓頭時黃條每秒回復（乘 1−手汗）
  windEase: 3.5,
  firstGrace: 3.5,                // 開場風力緩升秒數
  cramp: { limit: 0.85, warn: 2.0, trigger: 3.0, lock: 2.0, decay: 1.5 },
  sweat: { up: 0.28, down: 0.3, boost: 0.6 },
  side: { press: 11, decay: 6, full: 100, reset: 55, slow: 3.0, slowMul: 0.6, shameLock: 1.5, greetFail: 45, lookRate: 70, finalMul: 2 },
  zones: [
    { from: 0,   to: 100, name: '住宅區小巷',   mag: 0.55, flip: [2.8, 3.2], crowd: 0.25, updraft: false },
    { from: 100, to: 250, name: '早高峰商店街', mag: 0.75, flip: [2.4, 3.0], crowd: 1.0,  updraft: false },
    { from: 250, to: 400, name: '高架橋風口',   mag: 0.90, flip: [2.0, 3.0], crowd: 0.35, updraft: false },
    { from: 400, to: 500, name: '帝國大廈廣場', mag: 0.80, flip: [2.2, 2.8], crowd: 0.6,  updraft: true  }
  ],
  calm:  { at: [250], len: 16, mag: 0.3 },   // 路段交界的喘息：風力降到 0.3、不排新事件（約 2.7 秒）
  greet: { win: 2.4, need: 1.2, every: [6.5, 8.5] },
  flyer: { tele: 0.8, lock: 2.0, every: [9, 12] },
  drip:  { tele: 0.9, hit: 40, shielded: 8, every: [6, 9] },
  vortex:{ tele: 1.0, dur: 2.4, flip: 0.6, mag: 1.0, every: [10, 13] },
  look:  { at: [455, 478], tele: 0.8, dur: 1.6 },
  slowmo:{ scale: 0.45, time: 0.6 }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function createGame(rng) {
  rng = rng || Math.random;
  const C = CONFIG;
  const rnd = rng;
  const rr = (r) => r[0] + rnd() * (r[1] - r[0]);

  const g = {
    t: 0, dist: 0, over: false, won: false, rankKey: null, cause: '', deathDist: 0,
    tilt: 0, cramp: 0, crampLock: 0, crampLocked: false,
    pressing: false, pressLock: 0,
    sweat: 0, sideEye: 0, slowT: 0, timeScale: 1, slowmoT: 0,
    wind: 0, windDir: 1, flipIn: C.firstGrace, tele: null, E: 0, zoneIdx: 0, calmOn: false,
    hairs: [0, 1, 2].map(i => ({ alive: true, glue: 100, root: 100, k: C.hairK[i] })),
    ev: { greet: null, flyer: null, drip: null, vortex: null, look: null },
    timers: { greet: rr(C.greet.every) * 0.6, flyer: rr(C.flyer.every) * 0.6, drip: rr(C.drip.every) * 0.5, vortex: rr(C.vortex.every) * 0.7 },
    looksDone: 0, lastDripT: -99, ctx: 'wind',
    events: [], stats: { greetOk: 0, greetFail: 0, drips: 0, cramps: 0, embarrassed: 0 }
  };

  const emit = (type, data) => g.events.push(Object.assign({ type }, data || {}));
  const aliveCount = () => g.hairs.filter(h => h.alive).length;
  const zoneAt = (d) => { for (let i = C.zones.length - 1; i >= 0; i--) if (d >= C.zones[i].from) return i; return 0; };
  const anyMajor = () => g.ev.greet || g.ev.flyer || g.ev.drip || g.ev.vortex || g.ev.look;

  function update(rawDt, input) {
    if (g.over) return;
    let dt = Math.min(rawDt, 0.05);
    if (g.slowmoT > 0) { g.slowmoT -= dt; dt *= C.slowmo.scale; }
    g.t += dt;

    // 1. 輸入與抽筋
    if (g.pressLock > 0) g.pressLock -= dt;
    g.pressing = !!input.press && g.pressLock <= 0;
    if (g.crampLock > 0) {
      g.crampLock -= dt; g.crampLocked = true;
    } else {
      g.crampLocked = false;
      const target = clamp(input.tilt || 0, -1, 1);
      g.tilt += (target - g.tilt) * Math.min(1, dt * C.tiltEase);
    }
    if (!g.crampLocked) {
      if (Math.abs(g.tilt) > C.cramp.limit) g.cramp += dt; else g.cramp = Math.max(0, g.cramp - C.cramp.decay * dt);
      if (g.cramp >= C.cramp.trigger) { g.crampLock = C.cramp.lock; g.cramp = 0; g.stats.cramps++; emit('cramp'); }
    }

    // 2. 區段與風
    const zi = zoneAt(g.dist); const zone = C.zones[zi];
    if (zi !== g.zoneIdx) { g.zoneIdx = zi; g.flipIn = Math.min(g.flipIn, 1.2); emit('zone', { zone: zi }); }
    const ramp = Math.min(1, g.t / C.firstGrace);
    const calm = C.calm.at.some(a => g.dist >= a && g.dist < a + C.calm.len);
    if (calm && !g.calmOn) emit('calm');
    g.calmOn = calm;
    let mag = zone.mag * ramp, vort = g.ev.vortex;
    if (calm) mag = Math.min(mag, C.calm.mag);
    g.flipIn -= dt;
    if (vort && vort.started) {
      mag = C.vortex.mag; vort.flipT -= dt;
      if (vort.flipT <= 0) { g.windDir = -g.windDir; vort.flipT = C.vortex.flip; }
    } else if (g.flipIn <= 0) {
      g.windDir = -g.windDir; g.flipIn = rr(zone.flip);
    }
    g.tele = (!vort && g.flipIn < 0.8) ? { dir: -g.windDir, t: g.flipIn } : null;
    g.wind += (g.windDir * mag - g.wind) * Math.min(1, dt * C.windEase);

    // 3. 事件排程
    const e = g.ev;
    if (!anyMajor() && !calm) {
      if (zi === 1) {
        g.timers.greet -= dt; g.timers.flyer -= dt;
        if (g.timers.greet <= 0) { e.greet = { t: C.greet.win, wave: 0 }; g.timers.greet = rr(C.greet.every); emit('greetStart'); }
        else if (g.timers.flyer <= 0) { e.flyer = { tele: C.flyer.tele, t: 0 }; g.timers.flyer = rr(C.flyer.every); emit('flyerTele'); }
      } else if (zi === 2) {
        g.timers.drip -= dt; g.timers.vortex -= dt;
        if (g.timers.vortex <= 0) { e.vortex = { tele: C.vortex.tele, t: C.vortex.dur, started: false, flipT: 0 }; g.timers.vortex = rr(C.vortex.every); emit('vortexTele'); }
        else if (g.timers.drip <= 0) { e.drip = { tele: C.drip.tele }; g.timers.drip = rr(C.drip.every); emit('dripTele'); }
      } else if (zi === 3 && g.looksDone < C.look.at.length && g.dist >= C.look.at[g.looksDone] - 6) {
        e.look = { tele: C.look.tele, t: C.look.dur }; g.looksDone++; emit('lookTele');
      }
    }
    if (e.greet) {
      e.greet.t -= dt;
      if (!g.pressing) e.greet.wave += dt; else e.greet.wave = 0;
      if (e.greet.wave >= C.greet.need) { g.stats.greetOk++; g.sideEye = Math.max(0, g.sideEye - 15); emit('greetOk'); e.greet = null; }
      else if (e.greet.t <= 0) { g.stats.greetFail++; g.sideEye += C.side.greetFail; emit('greetFail'); e.greet = null; }
    }
    if (e.flyer) {
      if (e.flyer.tele > 0) { e.flyer.tele -= dt; if (e.flyer.tele <= 0) { e.flyer.t = C.flyer.lock; g.pressLock = C.flyer.lock; g.pressing = false; emit('flyer'); } }
      else { e.flyer.t -= dt; g.pressing = false; if (e.flyer.t <= 0) e.flyer = null; }
    }
    if (e.drip) {
      e.drip.tele -= dt;
      if (e.drip.tele <= 0) {
        const loss = g.pressing ? C.drip.shielded : C.drip.hit;
        g.hairs.forEach(h => { if (h.alive) h.glue = Math.max(0, h.glue - loss); });
        g.stats.drips++; g.lastDripT = g.t; emit('drip', { shielded: g.pressing }); e.drip = null;
      }
    }
    if (e.vortex) {
      if (!e.vortex.started) { e.vortex.tele -= dt; if (e.vortex.tele <= 0) { e.vortex.started = true; e.vortex.flipT = C.vortex.flip; emit('vortex'); } }
      else { e.vortex.t -= dt; if (e.vortex.t <= 0) { e.vortex = null; g.flipIn = 1.4; } }
    }
    if (e.look) {
      if (e.look.tele > 0) { e.look.tele -= dt; if (e.look.tele <= 0) emit('look'); }
      else {
        e.look.t -= dt;
        if (g.pressing) g.sideEye += C.side.lookRate * dt;
        if (e.look.t <= 0) e.look = null;
      }
    }

    // 4. 受風與頭髮
    const s = Math.sign(g.wind), absW = Math.abs(g.wind);
    const align = Math.max(0, g.tilt * s);
    const am = C.alignMax * (zone.updraft ? C.updraftAlignMul : 1);
    let E = absW * (1 - am * align) + (zone.updraft ? C.updraft * ramp : 0);
    if (g.pressing) E *= C.pressExposure;
    g.E = E;
    g.ctx = e.vortex && e.vortex.started ? 'vortex' : (g.t - g.lastDripT < 2 ? 'drip' : (g.crampLocked ? 'cramp' : (g.pressLock > 0 ? 'flyer' : (zone.updraft ? 'updraft' : 'wind'))));
    const boost = 1 + g.sweat * C.sweat.boost;
    for (let i = 0; i < 3; i++) {
      const h = g.hairs[i]; if (!h.alive) continue;
      const eff = Math.max(0, E * h.k - C.deadzone);
      if (eff > 0) {
        if (h.glue > 0) h.glue = Math.max(0, h.glue - C.glueDrain * eff * boost * dt);
        else h.root -= C.rootDrain * eff * boost * dt;
      }
      if (g.pressing) h.glue = Math.min(100, h.glue + C.glueRegen * (1 - g.sweat) * dt);
      if (h.root <= 0) {
        h.alive = false; h.root = 0;
        emit('hairLost', { i }); g.slowmoT = C.slowmo.time;
        if (aliveCount() === 0) {
          g.over = true; g.won = false; g.deathDist = g.dist; g.cause = g.ctx + '|' + zi; emit('dead'); return;
        }
      }
    }

    // 5. 手汗與側目
    if (g.pressing) g.sweat = Math.min(1, g.sweat + C.sweat.up * dt); else g.sweat = Math.max(0, g.sweat - C.sweat.down * dt);
    const finalMul = g.dist >= 450 ? C.side.finalMul : 1;
    if (g.pressing) g.sideEye += C.side.press * zone.crowd * finalMul * dt; else g.sideEye = Math.max(0, g.sideEye - C.side.decay * dt);
    if (g.sideEye >= C.side.full) { g.sideEye = C.side.reset; g.slowT = C.side.slow; g.stats.embarrassed++; g.pressLock = Math.max(g.pressLock, C.side.shameLock); g.pressing = false; emit('embarrassed'); }
    if (g.slowT > 0) g.slowT -= dt;

    // 6. 前進與抵達
    const sp = C.baseSpeed * C.speedByHair[aliveCount()] * (g.slowT > 0 ? C.side.slowMul : 1);
    g.dist += sp * dt;
    if (g.dist >= C.goal) { g.dist = C.goal; g.over = true; g.won = true; g.rankKey = rankOf(g); emit('finish'); }
  }

  return { state: g, update, config: C };
}

function rankOf(g) {
  const alive = g.hairs.filter(h => h.alive);
  if (alive.length === 3) {
    if (alive.every(h => h.glue >= 10)) return 'S';
    if (alive.every(h => h.glue <= 0)) return 'BEARD';
    return 'A';
  }
  return alive.length === 2 ? 'B' : 'C';
}



function create(random){const s=createGame(random);s.control=200;Object.defineProperty(s,'dead',{get:()=>s.state.over});return s;}
function input(s,code){if(s.dead||!Number.isInteger(code)||code<0||code>=402||s.control===code)return false;s.control=code;return true;}
function advance(s,dt){s.update(dt,{tilt:(Math.floor(s.control/2)-100)/100,press:!!(s.control%2)});}
return {create,input,inputCount:402,advance,score:s=>Math.floor(s.state.dist),CONFIG,clamp,createGame,rankOf};

})();
if(typeof module!=="undefined")module.exports=hairRules;
