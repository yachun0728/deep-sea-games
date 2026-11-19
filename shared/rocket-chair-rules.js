const rocketChairRules=(()=>{
const CONFIG = {
  // 時間
  meetingSeconds: 60,          // 主管會議倒數
  startClock: '16:30',
  offClock: '18:00',

  // 吼聲
  ambientMargin: 1.3,          // 環境噪音乘上多少當作 0
  quietModeScale: 0.4,         // 小聲模式的最大聲基準 = 校準最大聲 × 這個數
  roarCurve: 0.5,              // 音量換算吼聲值的曲線（0.5 = 開根號，小聲的人比較好飛）
  smoothing: 0.2,
  levelFall: 0.15,
  levelHover: 0.35,
  levelFast: 0.7,

  // 推力
  gravity: 500,
  thrustMax: 900,
  drag: 1.6,                   // 空氣阻力（決定最高速度）
  burstJumpFrom: 0.3,
  burstJumpTo: 0.8,
  burstWindow: 0.15,           // 秒
  burstImpulse: 650,
  burstDuration: 0.6,          // 衝刺時不受重力／阻力影響的秒數
  burstCooldown: 1.5,

  // 天花板
  ceilingBreakSpeed: 600,      // 速度超過多少才撞得破（衝刺才達得到）
  ceilingBounce: 200,
  breakExitSpeed: 220,         // 撞破天花板後的速度上限

  // 障礙
  grabSeconds: 1,
  grabClockPenalty: 3,         // 分鐘
  grabPull: 120,
  handInterval: 1.5,           // 左右輪流伸手的間隔
  handLaneGap: 3.0,            // 同一排兩次伸手至少隔幾秒
  paperWaveInterval: 2.6,
  paperFallDistance: 320,      // 報帳單從天花板掉多遠就散開
  paperKnock: 300,
  meetingSecondsStuck: 2,
  beamPeriod: 4.4,             // 投影機光束來回一趟幾秒
  beamSweep: 240,              // 光束左右掃多遠
  beamHalfWidth: 50,           // 光斑半寬
  meetingClockPenalty: 5,
  gossipStickSeconds: 1,
  gossipInterval: 1.25,
  sprinklerThrustRatio: 0.5,
  hitInvuln: 1.4,

  // 備案
  touchHoldLevel: 0.6,
  touchIdleLevel: 0.2,         // 用按的玩：放手時慢慢下降
  doubleTapSeconds: 0.32,

  // 麥克風
  micCheckSeconds: 1.5,

  // 點數／續命
  entryFee: 0,
  adExtendSeconds: 20,
  adContinuePerGame: 1,
  fakeAdSeconds: 5,
  adFreeMinutes: 30,
  coffeeCost: 5,
  coffeeExtendSeconds: 15,
  coffeeBoostSeconds: 10,
};

const VW = 400, FH = 820, SLAB = 34, FLOORS = 5, CH = 146, CHW = 34;
const LANES = [[290, 470, 640], [], [300, 560], [230, 420, 610], [250, 520]];

function create(random=Math.random,event=()=>{}){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+random()*(b-a);
const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
let inputMode='voice',appState='play',raw=0,steps=0,finished=false;
const INK='#1d1b1a',particles=[],FLOOR_INFO=[{name:'1F 業務部'},{name:'2F 財務部'},{name:'3F 會議室'},{name:'4F 茶水間'},{name:'5F 頂樓前'}];
const Snd=new Proxy({},{get:(_,key)=>(...args)=>event('sound',{key,args})});
const track=(name,data)=>event('track',{name,data}),vibrate=()=>{},shake=(...args)=>event('shake',args),floatText=(...args)=>event('float',args);
const Roar={smooth:0,hist:[]};
let G;
function clockMin(str) { const [h, m] = str.split(':').map(Number); return h * 60 + m; }
function newGame() {
  return {
    y: 0, v: 0, floor: 0, ft: 0, elapsed: 0, penalty: 0, meetingTotal: CONFIG.meetingSeconds,
    stuck: null, invuln: 0, burstLeft: 0, cooldown: 0, coffeeLeft: 0, mist: false,
    bounces: [0, 0, 0, 0, 0], broken: 0, bursts: 0, roarSec: 0, peakRms: 0,
    beamHit: false, paperHits: 0, adUsed: 0, coffeeCount: 0, extraSpent: 0,
    obs: null, hintShown: false, hintT: 0, startHintT: 3.5, cleared: false, done: false,
    face: 'normal', arms: 'down', paid: 0, quiet: inputMode === 'voice_quiet', mode: inputMode,
  };
}
function initFloorObs(k) {
  const O = { k, t: 0, list: [], next: 0.6, side: 0, lastLane: -1 };
  if (k === 2) O.beams = LANES[2].map((y, i) => ({ y: k * FH + y, phase: i * 1.9, period: CONFIG.beamPeriod + i * 0.6 }));
  if (k === 4) O.zones = LANES[4].map((y, i) => ({ y: k * FH + y, h: 130, period: 3.6, on: 2.0, phase: i * 1.7 }));
  return O;
}
function tryBurst() {
  if (!G || appState !== 'play' || G.stuck || G.cooldown > 0) return false;
  G.v = Math.max(G.v, 0) + CONFIG.burstImpulse; G.burstLeft = CONFIG.burstDuration; G.cooldown = CONFIG.burstCooldown;
  G.bursts++; shake(0.35, 5); Snd.burst(); vibrate(40);
  track('burst', { floor: G.floor + 1 });
  event('burstParticles');
  return true;
}
function hitObstacle(kind, ref) {
  if (G.invuln > 0 || G.stuck) return;
  track('obstacle_hit', { floor: G.floor + 1, kind });
  vibrate(60);
  if (kind === 'hand') {
    if (ref && G.obs) { G.obs.used = G.obs.used || {}; G.obs.used[ref.y] = true; }
    G.stuck = { kind, t: 0, dur: CONFIG.grabSeconds, ref }; G.penalty += CONFIG.grabClockPenalty; G.v = 0;
    floatText('+' + CONFIG.grabClockPenalty + ' 分鐘', VW / 2 + 60, G.y + 140); floatText('欸你有空嗎？', VW / 2, G.y + 175, INK, 18);
    Snd.grab();
  } else if (kind === 'paper') {
    G.paperHits++; G.v = -CONFIG.paperKnock; G.y = Math.max(G.floor * FH, G.y - 30); G.burstLeft = 0;
    G.stuck = { kind, t: 0, dur: 0.35 }; floatText('啪！', VW / 2 + 50, G.y + 130); shake(0.25, 4); Snd.paper();
    event('paperParticles');

  } else if (kind === 'beam') {
    G.beamHit = true; G.stuck = { kind, t: 0, dur: CONFIG.meetingSecondsStuck, ref }; G.penalty += CONFIG.meetingClockPenalty; G.v = 0;
    floatText('+' + CONFIG.meetingClockPenalty + ' 分鐘', VW / 2 + 60, G.y + 140); floatText('被拉進會議……', VW / 2, G.y + 175, INK, 18);
    Snd.meeting();
  } else if (kind === 'gossip') {
    G.stuck = { kind, t: 0, dur: CONFIG.gossipStickSeconds, ref }; G.v = 0;
    if (ref) ref.stuck = true;
    floatText('欸你知道嗎……', VW / 2, G.y + 170, INK, 18); Snd.pop();
  }
  G.invuln = G.stuck.dur + CONFIG.hitInvuln;
  G.burstLeft = 0;
}
function thrustFor(l) {
  const pts = [[0, 0], [CONFIG.levelFall, 380], [CONFIG.levelHover, 520], [CONFIG.levelFast, 800], [1, CONFIG.thrustMax]];
  if (l >= 1) return CONFIG.thrustMax;
  for (let i = 1; i < pts.length; i++) if (l <= pts[i][0]) { const [a, fa] = pts[i - 1], [b, fb] = pts[i]; return lerp(fa, fb, (l - a) / (b - a)); }
  return CONFIG.thrustMax;
}
function updatePlay(dt) {
  const level = inputLevel(dt);
  if (appState !== 'play') return;
  G.elapsed += dt; G.ft += dt;
  if (level > CONFIG.levelHover) G.roarSec += dt;
  G.invuln = Math.max(0, G.invuln - dt); G.cooldown = Math.max(0, G.cooldown - dt);
  G.coffeeLeft = Math.max(0, G.coffeeLeft - dt); G.hintT = Math.max(0, G.hintT - dt); G.startHintT = Math.max(0, G.startHintT - dt);
  const base = G.floor * FH, ceilY = (G.floor + 1) * FH - SLAB;

  updateObstacles(dt);

  if (G.stuck) {
    const s = G.stuck; s.t += dt;
    if (s.kind === 'hand') G.y = Math.max(base, G.y - CONFIG.grabPull * dt / s.dur);
    else if (s.kind === 'paper') { G.v -= CONFIG.gravity * dt; G.y = Math.max(base, G.y + G.v * dt); }
    else if (s.kind === 'beam') G.y = Math.max(base, G.y - 20 * dt);
    if (s.t >= s.dur) { if (s.ref) s.ref.dead = true; G.stuck = null; G.v = Math.min(G.v, 0); }
  } else {
    let thrust = thrustFor(level);
    if (G.coffeeLeft > 0 && thrust > CONFIG.gravity) thrust = CONFIG.gravity + (thrust - CONFIG.gravity) * 2;
    if (G.mist) thrust *= CONFIG.sprinklerThrustRatio;
    if (G.burstLeft > 0) { G.burstLeft -= dt; }
    else G.v += (thrust - CONFIG.gravity - CONFIG.drag * G.v) * dt;
    G.y += G.v * dt;
  }
  if (G.y < base) { G.y = base; if (G.v < 0) G.v = 0; }

  // 天花板
  if (G.y + CH > ceilY) {
    if (G.v >= CONFIG.ceilingBreakSpeed) breakCeiling();
    else {
      G.y = ceilY - CH; G.v = -CONFIG.ceilingBounce; G.burstLeft = 0;
      G.bounces[G.floor]++; Snd.bonk(); shake(0.15, 3); floatText('咚！', VW / 2 - 60, ceilY - 20, INK, 24);
      track('ceiling', { floor: G.floor + 1, result: 'bounce' });
      if (!G.hintShown) { G.hintShown = true; G.hintT = 3.2; }
    }
  }

  // 表情
  G.arms = 'down';
  if (G.stuck) G.face = { hand: 'scared', paper: 'ouch', beam: 'daze', gossip: 'awk' }[G.stuck.kind];
  else if (G.burstLeft > 0) G.face = 'yell';
  else if (G.mist) G.face = 'wet';
  else if (G.meetingTotal - G.elapsed < 10) G.face = 'panic';
  else G.face = 'normal';

  if (G.meetingTotal - G.elapsed <= 0) timeUp();
}
function breakCeiling() {
  const ceilY = (G.floor + 1) * FH - SLAB;
  track('ceiling', { floor: G.floor + 1, result: 'break' });
  G.broken++; Snd.crash(); shake(0.45, 9); vibrate(80);event('ceilingParticles',ceilY);

  G.floor++; G.ft = 0;
  G.burstLeft = 0; G.v = Math.min(G.v, CONFIG.breakExitSpeed);   // 撞破樓板會被卡一下，不會直接飛過整層
  if (G.floor >= FLOORS) { levelClear(); return; }
  G.obs = initFloorObs(G.floor);
  floatText(FLOOR_INFO[G.floor].name, VW / 2, G.y + 200, INK, 26);
}
function chairOverlap(y1, y2, halfW, cx) {
  return y2 > G.y + 6 && y1 < G.y + CH - 4 && Math.abs(cx - VW / 2) < halfW + CHW;
}
function updateObstacles(dt) {
  const O = G.obs; if (!O) return; O.t += dt;
  const k = G.floor, base = k * FH, ceilY = (k + 1) * FH - SLAB;
  if (k === 0) {            // 1F：「欸你有空嗎？」的手
    O.next -= dt;
    if (O.next <= 0) {
      O.next = CONFIG.handInterval;
      // 只從火箭椅前方、還沒抓過人的那一排伸手
      // 同一排至少隔 handLaneGap 秒才再伸，留空檔讓玩家通過
      O.used = O.used || {}; O.laneT = O.laneT || {};
      const lane = LANES[0].map(v => base + v).find(ly => ly - 16 > G.y + CH - 40 && !O.used[ly]);
      if (lane !== undefined && O.t - (O.laneT[lane] ?? -99) >= CONFIG.handLaneGap) { O.list.push({ side: O.side, y: lane, t: 0 }); O.laneT[lane] = O.t; }
      O.side ^= 1;
    }
    for (const h of O.list) {
      if (!(G.stuck && G.stuck.ref === h)) h.t += dt;
      h.reach = h.t < 0.35 ? h.t / 0.35 * 0.12 : h.t < 0.6 ? lerp(0.12, 1, easeOut((h.t - 0.35) / 0.25)) : h.t < 1.0 ? 1 : lerp(1, 0, (h.t - 1.0) / 0.3);
      if (h.reach > 0.6 && !h.dead) {
        const tipX = h.side === 0 ? 14 + h.reach * 226 : VW - 14 - h.reach * 226;
        const touching = h.side === 0 ? tipX > VW / 2 - CHW : tipX < VW / 2 + CHW;
        if (touching && chairOverlap(h.y - 16, h.y + 16, 0, VW / 2)) hitObstacle('hand', h);
      }
    }
    O.list = O.list.filter(h => h.t < 1.3);
  } else if (k === 1) {     // 2F：報帳單雪崩
    O.next -= dt;
    if (O.next <= 0) {
      O.next = CONFIG.paperWaveInterval;
      const n = 3;
      for (let i = 0; i < n; i++) {
        const delay = i * 0.22;
        O.list.push({ x: VW / 2 + rand(-18, 18), y: ceilY - 14, vy: -60, warn: 0.6 + delay, endY: ceilY - CONFIG.paperFallDistance, rot: rand(-.2, .2) });
      }
      O.list.push({ x: rand(60, 110), y: ceilY - 14, vy: -60, warn: 0.6, endY: ceilY - CONFIG.paperFallDistance, rot: rand(-.3, .3), deco: true });
      O.list.push({ x: rand(290, 340), y: ceilY - 14, vy: -60, warn: 0.8, endY: ceilY - CONFIG.paperFallDistance, rot: rand(-.3, .3), deco: true });
    }
    for (const p of O.list) {
      if (p.warn > 0) { p.warn -= dt; continue; }
      p.vy -= 1300 * dt; p.y += p.vy * dt;
      if (!p.deco && !p.dead && chairOverlap(p.y - 18, p.y + 18, 36, p.x)) { p.dead = true; hitObstacle('paper'); }
      if (p.y < p.endY && !p.dead) {
        p.dead = true;event('sheetParticles',{x:p.x,y:p.y});

      }
    }
    O.list = O.list.filter(p => !p.dead);
  } else if (k === 2) {     // 3F：投影機光束
    for (const b of O.beams) {
      b.x = VW / 2 + CONFIG.beamSweep * Math.sin((O.t + b.phase) * Math.PI * 2 / b.period);
      if (!G.stuck && chairOverlap(b.y - 28, b.y + 28, CONFIG.beamHalfWidth, b.x)) hitObstacle('beam', null);
    }
  } else if (k === 3) {     // 4F：八卦對話泡泡
    O.next -= dt;
    if (O.next <= 0) {
      O.next = CONFIG.gossipInterval;
      let li = Math.floor(random() * 3); if (li === O.lastLane) li = (li + 1) % 3; O.lastLane = li;
      const side = random() < .5 ? 0 : 1;
      const lines = ['欸你知道嗎', '聽說……', '他們兩個……', '我跟你講喔', '不要說是我說的'];
      O.list.push({ y: base + LANES[3][li], x: side === 0 ? -70 : VW + 70, vx: (side === 0 ? 1 : -1) * rand(70, 105), text: lines[Math.floor(random() * lines.length)], wob: rand(0, 6) });
    }
    for (const b of O.list) {
      if (b.stuck) { b.x = lerp(b.x, VW / 2 + 40, dt * 8); b.y = lerp(b.y, G.y + 140, dt * 8); continue; }
      b.x += b.vx * dt;
      if (!b.dead && chairOverlap(b.y - 26, b.y + 26, 56, b.x)) hitObstacle('gossip', b);
    }
    O.list = O.list.filter(b => !b.dead && b.x > -120 && b.x < VW + 120);
  } else if (k === 4) {     // 5F：消防灑水器
    G.mist = false;
    for (const z of O.zones) {
      const ph = (O.t + z.phase) % z.period;
      z.state = ph < z.on ? 'on' : ph > z.period - 0.5 ? 'warn' : 'off';
      const cy = G.y + CH / 2;
      if (z.state === 'on' && cy > z.y - z.h / 2 && cy < z.y + z.h / 2) {
        if (!z.wasIn) { z.wasIn = true; track('obstacle_hit', { floor: 5, kind: 'sprinkler' }); Snd.splash(); floatText('推力減半！', VW / 2, G.y + 170, INK, 18); }
        G.mist = true;
      } else if (!(cy > z.y - z.h / 2 && cy < z.y + z.h / 2)) z.wasIn = false;
    }
  }
}
function inputLevel(dt){
 const level=Math.min(raw,1.2);
 const smoothing=G.mode==='touch'?.35:CONFIG.smoothing;
 Roar.smooth+=(level-Roar.smooth)*(1-Math.pow(1-smoothing,dt*60));
 if(G.mode!=='touch'){
  Roar.hist.push({t:G.elapsed,v:level});
  while(Roar.hist.length&&Roar.hist[0].t<G.elapsed-CONFIG.burstWindow)Roar.hist.shift();
  if(level>=CONFIG.burstJumpTo&&Roar.hist.some(h=>h.v<CONFIG.burstJumpFrom)&&tryBurst())Roar.hist=[];
 }
 return Roar.smooth;
}
function levelClear(){
 if(G.done)return;
 G.done=true;G.cleared=true;G.early=Math.max(0,clockMin(CONFIG.offClock)-clockMin(CONFIG.startClock)-(Math.floor(G.elapsed)+G.penalty));
 event('clear');
}
function timeUp(){if(G.done)return;G.done=true;G.early=0;event('timeout');}
G=newGame();G.obs=initFloorObs(0);
return {game:G,input(code){
 if(finished||!Number.isInteger(code)||code<0||code>126)return false;
 if(code===126){finished=true;if(!G.cleared)G.early=0;return true;}
 if(code===124||code===125){
  if(!G.done||G.cleared)return false;
  if(code===124){if(G.adUsed>=CONFIG.adContinuePerGame)return false;G.adUsed++;G.meetingTotal+=CONFIG.adExtendSeconds;}
  else{G.coffeeCount++;G.meetingTotal+=CONFIG.coffeeExtendSeconds;G.coffeeLeft=CONFIG.coffeeBoostSeconds;}
  G.done=false;G.stuck=null;G.invuln=1.2;G.v=0;return true;
 }
 if(G.done)return false;
 if(code===122||code===123){if(steps)return false;G.mode=code===122?'touch':'voice';G.quiet=code===123;return true;}
 if(code===121)return tryBurst();
 raw=code/100;return true;
},advance(dt){if(!G.done){steps++;updatePlay(dt)}},get level(){return Roar.smooth},get dead(){return finished},get score(){return G.early||0}};
}
return {CONFIG,create,inputCount:127,input:(s,c)=>s.input(c),advance:(s,dt)=>s.advance(dt),score:s=>s.score};
})();
if(typeof module!=='undefined')module.exports=rocketChairRules;
