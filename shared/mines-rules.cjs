const minesRules = (() => {
  function neighbors(size, cell) {
    const result = [];
    const row = Math.floor(cell / size), col = cell % size;
    for (let y = Math.max(0, row - 1); y <= Math.min(size - 1, row + 1); y++) {
      for (let x = Math.max(0, col - 1); x <= Math.min(size - 1, col + 1); x++) {
        const next = y * size + x;
        if (next !== cell) result.push(next);
      }
    }
    return result;
  }

  function number(state, cell) {
    return neighbors(state.size, cell).filter(next => state.layout[next]).length;
  }

  function create(size, mines, random = Math.random) {
    const pool = Array.from({ length: size * size }, (_, cell) => cell);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const layout = Array(size * size).fill(false);
    for (const cell of pool.slice(0, mines)) layout[cell] = true;
    return { size, mines, layout, open: [], flags: [], picks: 0, result: null };
  }

  function move(state, action, cell) {
    const { size, mines, layout, open, flags } = state;
    if (state.result || !Number.isInteger(cell) || cell < 0 || cell >= size * size) return false;
    if (action === 'flag') {
      if (open[cell]) return false;
      if (!flags[cell] && flags.filter(Boolean).length >= mines) return 'flag-limit';
      flags[cell] = !flags[cell];
      return true;
    }
    if (action !== 'open' || flags[cell]) return false;

    let queue = [cell];
    if (open[cell]) {
      const adjacent = neighbors(size, cell), count = number(state, cell);
      if (!count || adjacent.filter(next => flags[next]).length !== count) return false;
      queue = adjacent.filter(next => !open[next] && !flags[next]);
      if (!queue.length) return false;
    }
    const bomb = queue.find(next => layout[next]);
    if (bomb !== undefined) {
      open[bomb] = true;
      state.result = 'loss';
      return true;
    }
    while (queue.length) {
      const next = queue.pop();
      if (open[next] || flags[next] || layout[next]) continue;
      open[next] = true;
      state.picks++;
      if (!number(state, next)) queue.push(...neighbors(size, next));
    }
    if (state.picks === size * size - mines) state.result = 'win';
    return true;
  }
  return { create, move, number };
})();
if (typeof module !== 'undefined') module.exports = minesRules;
