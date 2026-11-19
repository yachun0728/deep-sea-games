const dreamRules = (() => {
  const STEP_MS = 10, MAX_TICKS = 12000;
  const TURN = Math.PI * 2, WARNING = .5, GUARD = .25;
  const distance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  function difficulty(stage) {
    const n = stage - 1 - Math.min(3, Math.max(0, stage - 11)) - Math.min(3, Math.max(0, stage - 21));
    return {
      width: Math.max(24, 80 - Math.min(n, 4) * 5 - Math.max(0, Math.min(n - 4, 10)) * 2.5 - Math.max(0, n - 14)) * Math.PI / 180,
      speed: Math.min(2.4, 1.6 + n * .035),
    };
  }

  function start(stage, random) {
    const target = random() * TURN;
    return {
      ...difficulty(stage), target, angle: (target + Math.PI) % TURN, direction: 1,
      elapsed: 0, reversals: 0, reverseLimit: stage >= 21 ? 2 : stage >= 11 ? 1 : 0,
      reverseAt: 1.5 + random(), warning: 0,
    };
  }

  function advance(state, dt, random) {
    state.elapsed += dt;
    state.angle = ((state.angle + state.direction * state.speed * dt) % TURN + TURN) % TURN;
    const delta = distance(state.angle, state.target);
    if (state.warning > 0) {
      if (delta <= state.width / 2 + state.speed * GUARD) {
        state.warning = 0;
        state.reverseAt = state.elapsed + .3;
      } else {
        state.warning -= dt;
        if (state.warning <= 0) {
          state.warning = 0;
          state.direction *= -1;
          state.reversals++;
          state.reverseAt = state.elapsed + 1.5 + random();
          return 'reverse';
        }
      }
    } else if (state.reversals < state.reverseLimit && state.elapsed >= state.reverseAt &&
        delta > state.width / 2 + state.speed * (WARNING + GUARD)) {
      state.warning = WARNING;
      return 'warning';
    }
  }

  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  const hit = state => distance(state.angle, state.target) <= state.width / 2;
  function adjudicate(stage, seed, ticks) {
    const random = seeded(seed);
    const state = start(stage, random);
    for (let i = 0; i < ticks; i++) advance(state, STEP_MS / 1000, random);
    return hit(state);
  }
  return { STEP_MS, MAX_TICKS, distance, difficulty, start, advance, seeded, hit, adjudicate };
})();
if (typeof module !== 'undefined') module.exports = dreamRules;
