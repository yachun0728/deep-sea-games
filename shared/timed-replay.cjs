const timedReplay = (() => {
  const STEP_MS = 10, MAX_TICKS = 60000, MAX_INPUTS = 6000;
  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function accepts(action, inputCount) {
    if (!Array.isArray(action) || !Number.isInteger(action[0]) || action[0] < 1 ||
        action[0] > MAX_TICKS || action.length > MAX_INPUTS + 1) return false;
    let prior = -1;
    for (const code of action.slice(1)) {
      const tick = Math.floor(code / inputCount);
      if (!Number.isSafeInteger(code) || code < 0 || tick < prior || tick >= action[0]) return false;
      prior = tick;
    }
    return true;
  }
  function verify(engine, seed, [ticks, ...moves]) {
    const random = seeded(seed), state = engine.create(random);
    let cursor = 0;
    for (let tick = 0; tick < ticks; tick++) {
      while (Math.floor(moves[cursor] / engine.inputCount) === tick) {
        if (!engine.input(state, moves[cursor++] % engine.inputCount)) return null;
        if (state.dead) return tick + 1 === ticks && cursor === moves.length ? engine.score(state) : null;
      }
      engine.advance(state, STEP_MS / 1000, random);
      if (state.dead) return tick + 1 === ticks ? engine.score(state) : null;
    }
    return null;
  }
  return {STEP_MS, MAX_TICKS, MAX_INPUTS, seeded, accepts, verify};
})();
if (typeof module !== 'undefined') module.exports = timedReplay;
