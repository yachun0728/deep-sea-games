const runnerRules = (() => {
  const STEP_MS = 10, MAX_TICKS = 60000;
  const V0 = 20, VMAX = 60, D1 = 1500;
  const lanes = [-1, 0, 1];

  function create() {
    return {dist: 0, px: 0, tl: 0, v: V0, obs: [], lastGap: 0, nextAt: 10, dead: false, near: false};
  }

  function step(state, dt, random) {
    state.v = Math.min(VMAX, V0 + state.dist * (1 / 250));
    const distance = state.v * dt;
    state.dist += distance;
    state.px += (state.tl - state.px) * Math.min(1, dt * 16);
    state.near = false;
    if (state.dist >= state.nextAt) {
      const gaps = lanes.filter(lane => lane !== state.lastGap);
      const gap = gaps[Math.floor(random() * gaps.length)];
      state.lastGap = gap;
      for (const lane of lanes) if (lane !== gap) state.obs.push({l: lane, t: 'block', z: 70, p: 0});
      const window = state.dist < D1 ? 2 - (2 - .7) * state.dist / D1
        : Math.max(.28, .7 - (state.dist - D1) * (.42 / 6000));
      state.nextAt = state.dist + window * state.v;
    }
    for (const obstacle of state.obs) {
      const before = obstacle.z;
      obstacle.z -= distance;
      const gap = Math.abs(state.px - obstacle.l);
      if (!obstacle.p && before >= -1.5 && obstacle.z <= 1.5 && gap < .62) {
        state.dead = true;
        return;
      }
      if (!obstacle.p && obstacle.z < -.5) {
        obstacle.p = 1;
        if (gap >= .62 && gap < 1.1) state.near = true;
      }
    }
    state.obs = state.obs.filter(obstacle => obstacle.z > -3);
  }

  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function accepts(action) {
    if (!Array.isArray(action) || !Number.isInteger(action[0]) || action[0] <= 0 ||
        action[0] > MAX_TICKS || action.length > 6001) return false;
    let previous = -1;
    for (const encoded of action.slice(1)) {
      const tick = Math.floor(encoded / 3);
      if (!Number.isSafeInteger(encoded) || tick <= previous || tick >= action[0]) return false;
      previous = tick;
    }
    return true;
  }

  function replay(seed, [ticks, ...moves]) {
    const state = create(), random = seeded(seed);
    let cursor = 0;
    for (let tick = 0; tick < ticks; tick++) {
      if (Math.floor(moves[cursor] / 3) === tick) state.tl = moves[cursor++] % 3 - 1;
      step(state, STEP_MS / 1000, random);
      if (state.dead) return tick + 1 === ticks ? Math.floor(state.dist) : null;
    }
    return null;
  }
  return {STEP_MS, MAX_TICKS, create, step, seeded, accepts, replay};
})();
if (typeof module !== 'undefined') module.exports = runnerRules;
