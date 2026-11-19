const mergeRules = (() => {
  const directions = ['left', 'right', 'up', 'down'];
  function spawn(state, random) {
    const empty = state.grid.flatMap((tile, i) => tile ? [] : [i]);
    if (!empty.length) return;
    const i = empty[Math.floor(random() * empty.length)];
    state.grid[i] = random() < .9 ? 2 : 4;
    state.fresh[i] = 1;
  }
  function create(random = Math.random) {
    const state = { grid: Array(16).fill(0), score: 0, fresh: {}, over: false };
    spawn(state, random);
    spawn(state, random);
    return state;
  }
  function canMove(grid) {
    return grid.some((tile, i) => !tile ||
      (i % 4 < 3 && tile === grid[i + 1]) || (i < 12 && tile === grid[i + 4]));
  }
  function move(state, direction, random = Math.random) {
    if (state.over || !directions.includes(direction)) return false;
    let moved = false;
    state.fresh = {};
    for (let line = 0; line < 4; line++) {
      const indexes = Array.from({length:4}, (_, i) => {
        if (direction === 'left') return line * 4 + i;
        if (direction === 'right') return line * 4 + 3 - i;
        if (direction === 'up') return i * 4 + line;
        return (3 - i) * 4 + line;
      });
      const values = indexes.map(i => state.grid[i]).filter(Boolean);
      const result = [];
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value === values[i + 1]) {
          state.score += value * 2;
          state.fresh[indexes[result.length]] = 1;
          result.push(value * 2);
          i++;
        } else result.push(value);
      }
      indexes.forEach((cell, i) => {
        const tile = result[i] ?? 0;
        if (tile !== state.grid[cell]) moved = true;
        state.grid[cell] = tile;
      });
    }
    if (!moved) return false;
    spawn(state, random);
    state.over = !canMove(state.grid);
    return true;
  }
  return { directions, create, move };
})();
if (typeof module !== 'undefined') module.exports = mergeRules;
