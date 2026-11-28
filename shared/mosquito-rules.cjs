const mosquitoRules=(()=>{
  var MQC = {
    W: 480, H: 720, R: 7, wallL: 22, wallR: 458, ceiling: 34,
    vx: 120, panicVx: 220, steer: 7,
    riseBase: 200, riseWeight: 0.5, diveBase: 235, diveHeavy: 0.5, safeSpeed: 190,
    stunTime: 1.0, stunFall: 150,
    flyAlert: 2.8, nearHeadMult: 1.8, highY: 250, highMult: 1.3, headX: 190, headY: 430,
    lateBlood: 90, lateMult: 0.5,
    itchBase: 0.30, itchAlert: 0.012, itchWind: 1.2, grabTime: 0.3, itchCd: 2.5, itchReachX: 20, itchReachY: 80,
    rollFirst: 8, rollGapMin: 9, rollGapMax: 13, rollWarn: 1.8, rollSweep: 0.6, rollSafeY: 400,
    lightTime: 4.5, panicRise: 1.15,
    winY0: 62, winY1: 130, deadLock: 0.25
  };
  // v2 (2026-11-28): zones moved onto the skin of the redrawn sleeper. Rates and alert values are unchanged.
  var MQZ = [
    { id: 'face', x0: 60, x1: 132, y: 485, rate: 16, alert: 3.8 },
    { id: 'arm',  x0: 152, x1: 248, y: 572, rate: 12, alert: 2.1},
    { id: 'foot', x0: 416, x1: 458, y: 544, rate: 9,  alert: 1.4}
  ];
  var BLANKET_Y = 578;

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

function create(random) {const s=mqNew(random);s.held=false;Object.defineProperty(s,'dead',{get:()=>s.state!=='play'});return s;}
function input(s,code){if(s.dead||(code!==0&&code!==1)||s.held===(code===0))return false;s.held=code===0;return true;}
return {rulesVersion:2,create,input,inputCount:2,advance:(s,dt)=>mqStep(s,dt,s.held),score:s=>Math.round(s.blood),MQC,MQZ,BLANKET_Y,mqNew,mqStep,mqSurface,mqInWin};

})();
if(typeof module!=="undefined")module.exports=mosquitoRules;
