// Shared by the classic browser runtime and the Worker replay verifier.
const frogRules = (() => {
  const STEP_MS = 10;
  const MAX_TICKS = 60000;
  const REWARD_EVERY = 10;
  const SLOTS = 8, AIM_TOP = 412, AIM_BOT = 500, TY = 478;
  const HIT = 16, HEARTS = 3, FULL = 100;
  // Aim speed, angry-bug chance, calm range, attack duration, hunger per second.
  const levels = [
    [141, 0, 0, 0, 0, 5], [157, .15, 2, 3, .8, 5.7],
    [173, .2, 1.8, 2.8, .9, 6.4], [189, .25, 1.6, 2.6, 1, 7.1],
    [204, .3, 1.4, 2.4, 1.1, 7.8], [220, .35, 1.2, 2.2, 1.2, 8.5],
    [236, .4, 1, 2, 1.3, 9.2], [251, .45, .9, 1.8, 1.4, 9.9],
    [267, .5, .8, 1.6, 1.5, 10.6], [283, .55, .7, 1.4, 1.6, 11.3],
  ];
  const colors = ['#8bc34a', '#ffb74d', '#64b5f6', '#ba68c8'];
  const level = state => Math.min(10, Math.floor(state.eaten / REWARD_EVERY) + 1);
  const config = state => levels[level(state) - 1];
  const bug = (angry, col) => ({ angry, col, state: 'calm', t: 0, live: false });

  function seededRandom(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(random = Math.random) {
    return {
      random, bugs: Array.from({ length: SLOTS }, (_, i) => bug(false, colors[i % colors.length])),
      aimY: AIM_TOP, aimDir: 1, hearts: HEARTS, food: FULL,
      eaten: 0, pts: 0, combo: 0, lock: 0, reason: '',
    };
  }

  function calm(state, target) {
    const [, , min, max] = config(state);
    target.state = 'calm';
    target.t = (min || 2) + state.random() * ((max || 3) - (min || 2));
  }

  function press(state) {
    if (state.reason || state.lock > 0) return;
    const distance = Math.abs(state.aimY - TY);
    const target = state.bugs[0];
    if (distance > HIT) {
      state.combo = 0;
      state.lock = .35;
      state.food = Math.max(0, state.food - (level(state) === 1 ? 2 : 4));
      return { kind: 'miss' };
    }
    if (target.state === 'attack') {
      state.hearts--;
      state.combo = 0;
      state.lock = .6;
      calm(state, target);
      if (state.hearts <= 0) state.reason = 'sting';
      return { kind: 'sting' };
    }

    const perfect = distance <= 6;
    const multiplier = state.combo >= 15 ? 3 : state.combo >= 5 ? 2 : 1;
    const gain = (perfect ? 20 : 10) * multiplier + (target.state === 'warn' ? 5 : 0);
    state.pts += gain;
    state.food = Math.min(FULL, state.food + (perfect ? 12 : 8));
    state.combo++;
    state.eaten++;
    state.bugs.shift();
    const twoAngry = state.bugs.slice(-2).every(item => item.angry);
    state.bugs.push(bug(!twoAngry && state.random() < config(state)[1],
      colors[Math.floor(state.random() * colors.length)]));
    state.lock = .1;
    const milestone = state.eaten % REWARD_EVERY === 0;
    if (milestone) state.food = Math.min(FULL, state.food + 10);
    return { kind: 'eat', gain, perfect, milestone };
  }

  function step(state, dt) {
    if (state.reason) return;
    if (state.lock > 0) state.lock -= dt;
    const [speed, , , , attack, hunger] = config(state);
    state.food -= hunger * dt;
    if (state.food <= 0) {
      state.food = 0;
      state.reason = 'hunger';
      return;
    }
    state.aimY += state.aimDir * speed * dt;
    if (state.aimY >= AIM_BOT) {
      state.aimY = AIM_BOT;
      state.aimDir = -1;
    } else if (state.aimY <= AIM_TOP) {
      state.aimY = AIM_TOP;
      state.aimDir = 1;
    }
    for (let i = 0; i < 3; i++) {
      const target = state.bugs[i];
      if (!target.angry) continue;
      if (!target.live) {
        target.live = true;
        calm(state, target);
        continue;
      }
      target.t -= dt;
      if (target.t > 0) continue;
      if (target.state === 'calm') {
        target.state = 'warn';
        target.t = .5;
      } else if (target.state === 'warn') {
        target.state = 'attack';
        target.t = attack || 1;
      } else calm(state, target);
    }
  }

  function replay(seed, ticks, presses) {
    if (!Number.isInteger(ticks) || ticks < 1 || ticks > MAX_TICKS ||
        !Array.isArray(presses) || presses.length > Math.ceil(MAX_TICKS / 10)) return null;
    const state = create(seededRandom(seed));
    let cursor = 0;
    for (let tick = 0; tick <= ticks; tick++) {
      if (presses[cursor] === tick) {
        if (!press(state)) return null;
        cursor++;
      }
      if (state.reason) {
        return tick === ticks && cursor === presses.length
          ? { score: state.pts, eaten: state.eaten } : null;
      }
      if (tick < ticks) step(state, STEP_MS / 1000);
    }
    return null;
  }

  return { STEP_MS, MAX_TICKS, REWARD_EVERY, SLOTS, AIM_TOP, AIM_BOT, TY, HIT,
    HEARTS, FULL, level, create, seededRandom, press, step, replay };
})();
if (typeof module !== 'undefined') module.exports = frogRules;
