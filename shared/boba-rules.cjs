// Boba Straw (插珍奶) rules, shared by the embedded game and the ranked-board Worker.
// The whole round is a fixed-step state machine: inputs are press / release / cancel / ad / end.
// Cup layout and the shaky-hands jitter come from one seeded stream, so replaying the recorded
// inputs from the Worker's seed gives the same cups. Rendering, sound and particles stay in the page.
const bobaRules = (() => {
  const CONFIG = {
    startStraws: 3, maxStraws: 5, perfectStreakReward: 3,
    sweetZoneStart: 0.30, sweetZoneShrink: 0.015, sweetZoneMin: 0.08,
    barCycleStart: 1.2, barCycleSpeedUp: 0.04, barCycleMin: 0.45,
    difficultyStepFrom: 5, difficultyStepEvery: 5, perfectToleranceRatio: 0.15,
    specialCupFromLevel: 5, specialCupChance: 0.30,
    fakeAdSeconds: 5, fakeAdPerGame: 1,
  };
  // Input codes. 0 press, 1 release (stab), 2 cancel the charge, 3 start the revive ad, 4 end the round.
  const PRESS = 0, RELEASE = 1, CANCEL = 2, AD = 3, END = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Difficulty: each of the first 5 cups is harder; after that one level per 5 cups.
  function difficultyLevel(n) {
    const from = CONFIG.difficultyStepFrom, every = CONFIG.difficultyStepEvery;
    return n <= from ? n : from + Math.ceil((n - from) / every);
  }
  function makeCup(n, random) {
    const d = difficultyLevel(n);
    const w = Math.max(CONFIG.sweetZoneMin, CONFIG.sweetZoneStart - (d - 1) * CONFIG.sweetZoneShrink);
    const T = Math.max(CONFIG.barCycleMin, CONFIG.barCycleStart - (d - 1) * CONFIG.barCycleSpeedUp);
    const lo = n <= 3 ? clamp(0.55 + (0.30 - w) / 2, 0.10, 0.95 - w) : 0.10 + random() * (0.95 - w - 0.10);
    let special = null;
    if (n >= CONFIG.specialCupFromLevel && random() < CONFIG.specialCupChance) special = ['thick', 'shaky', 'big'][Math.floor(random() * 3)];
    return { N: n, w, T, lo, baseLo: lo, special, hits: 0, hinted: false };
  }

  function setState(state, name) { state.state = name; state.st = 0; }
  function enterCup(state) {
    if (state.cup.special && !state.cup.hinted) { state.cup.hinted = true; setState(state, 'hint'); }
    else setState(state, 'ready');
  }
  function newCup(state, n, random) {
    state.cup = makeCup(n, random);
    state.events.push({ type: 'cup' });
  }

  // `state` may be an object the page already owns (it keeps its drawing fields on it).
  function create(random, state = {}) {
    Object.assign(state, {
      cups: 0, straws: CONFIG.startStraws, streak: 0, bursts: 0, perfects: 0, adsUsed: 0,
      state: 'idle', st: 0, power: 0, phase: 0, jitter: 0, jitterTarget: 0, jitterT: 0, chargeT: 0,
      lastResult: null, slideSwapped: false, ad: false, adT: 0, dead: false, events: [], cup: null,
    });
    newCup(state, 1, random);
    setState(state, 'popin');
    return state;
  }

  function resolveStab(state) {
    const c = state.cup, p = state.power;
    const lo = c.lo, hi = c.lo + c.w, center = lo + c.w / 2, tol = c.w * CONFIG.perfectToleranceRatio;
    const result = p < lo ? 'bend' : p > hi ? 'burst' : Math.abs(p - center) <= tol ? 'perfect' : 'success';
    state.lastResult = result;
    const event = { type: 'stab', result, power: p, lo, hi, level: c.N, special: c.special, reward: 0, cupDone: false };
    if (result === 'bend' || result === 'burst') {
      state.straws = Math.max(0, state.straws - 1); state.streak = 0; c.hits = 0;
      if (result === 'burst') state.bursts++;
      setState(state, result);
    } else {
      c.hits++;
      if (result === 'perfect') {
        state.perfects++; state.streak++;
        if (state.streak % CONFIG.perfectStreakReward === 0) {
          if (state.straws < CONFIG.maxStraws) { state.straws++; event.reward = 1; } else event.reward = 2;
        }
      } else state.streak = 0;
      if (c.hits >= (c.special === 'thick' ? 2 : 1)) { state.cups++; event.cupDone = true; }
      setState(state, 'success');
    }
    state.events.push(event);
  }

  function afterFail(state) {
    if (state.straws <= 0) { state.state = 'out'; state.st = 0; state.adT = 0; state.events.push({ type: 'out' }); }
    else setState(state, state.lastResult === 'burst' ? 'popin' : 'reload');
  }

  function input(state, code) {
    if (state.dead) return false;
    switch (code) {
      case PRESS:
        if (state.state !== 'ready') return false;
        state.state = 'charging'; state.st = 0; state.phase = 0; state.power = 0;
        return true;
      case RELEASE:
        if (state.state !== 'charging') return false;
        setState(state, 'stab');
        return true;
      case CANCEL:
        if (state.state !== 'charging') return false;
        setState(state, 'ready'); state.power = 0;
        return true;
      case AD:
        if (state.state !== 'out' || state.ad || state.adsUsed >= CONFIG.fakeAdPerGame) return false;
        state.ad = true; state.adT = 0;
        return true;
      case END:
        state.dead = true;
        return true;
      default:
        return false;
    }
  }

  function advance(state, dt, random) {
    if (state.dead) return;
    state.st += dt;
    const c = state.cup;
    if (state.state === 'charging' && c) {
      state.chargeT += dt;
      state.phase += dt / c.T;
      const x = state.phase % 2;
      let p = x <= 1 ? x : 2 - x;
      if (c.special === 'shaky') {
        state.jitterT -= dt;
        if (state.jitterT <= 0) { state.jitterT = 0.04 + random() * 0.08; state.jitterTarget = -0.05 + random() * 0.10; }
        state.jitter = lerp(state.jitter, state.jitterTarget, clamp(dt * 25, 0, 1));
        p += state.jitter;
      }
      if (c.special === 'big') c.lo = clamp(c.baseLo + 0.14 * Math.sin(state.chargeT * 2.3), 0.10, 0.95 - c.w);
      state.power = clamp(p, 0, 1);
    }
    switch (state.state) {
      case 'hint': if (state.st >= 1.0) setState(state, 'ready'); break;
      case 'stab': if (state.st >= 0.08) resolveStab(state); break;
      case 'bend': if (state.st >= 1.0) afterFail(state); break;
      case 'burst': if (state.st >= 0.9) afterFail(state); break;
      case 'success':
        if (state.st >= 0.7) {
          if (c.hits >= (c.special === 'thick' ? 2 : 1)) { state.slideSwapped = false; setState(state, 'slide'); }
          else setState(state, 'reload');
        }
        break;
      case 'slide':
        if (state.st >= 0.25 && !state.slideSwapped) { state.slideSwapped = true; newCup(state, state.cups + 1, random); state.chargeT = 0; }
        if (state.st >= 0.5) enterCup(state);
        break;
      case 'reload': if (state.st >= 0.35) setState(state, 'ready'); break;
      case 'popin': if (state.st >= 0.4) enterCup(state); break;
      case 'out':
        if (state.ad) {
          state.adT += dt;
          if (state.adT >= CONFIG.fakeAdSeconds) {
            state.ad = false; state.adsUsed++; state.straws = Math.min(CONFIG.maxStraws, state.straws + 1);
            state.events.push({ type: 'ad-done' });
            setState(state, state.lastResult === 'burst' ? 'popin' : 'reload');
          }
        }
        break;
    }
  }

  const score = state => state.cups;
  return { inputCount: 5, PRESS, RELEASE, CANCEL, AD, END, CONFIG, difficultyLevel, makeCup, create, input, advance, score };
})();
if (typeof module !== 'undefined') module.exports = bobaRules;
