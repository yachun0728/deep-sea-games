const outpostRules = (() => {
  const LANES = 3, COLS = 5, LENGTH = 6000, END = 18000, STAGE_COUNT = 30;
  const costs = [40, 25, 35, 30];
  const speeds = [6, 8, 4], health = [34, 22, 85], values = [40, 60, 120];
  const waves = [
    [[9,0,0],[12,2,0],[18,0,1],[23,1,0],[27,2,1],[31,0,0],[37,2,0],[42,1,2],[46,0,1]],
    [[60,2,2],[62,0,1],[64,1,0],[66,0,1],[72,2,0],[74,2,1],[81,0,2],[85,1,1],[89,2,2],[92,0,1],[96,1,0],[100,2,1]],
    [[116,0,2],[118,2,2],[121,1,1],[123,2,1],[125,0,1],[130,1,2],[134,0,2],[135,2,1],[139,1,0],[144,2,2],[145,0,1],[148,1,1],[151,0,2],[153,2,1],[156,1,2],[159,2,2],[160,0,2]],
  ];
  const stages = [
    {energy: 95, schedule: waves.flat()},
    {energy: 125, schedule: [
      [9,1,0],[12,0,0],[16,2,1],[24,1,1],[31,0,0],[36,2,2],[44,1,0],[49,1,1],
      [60,0,0],[61,0,1],[62,0,1],[69,2,2],[73,1,1],[78,2,2],[85,1,0],[92,0,2],[99,2,1],
      [116,2,2],[119,0,1],[121,0,1],[125,1,2],[135,1,2],[138,2,2],[143,0,1],
      [149,1,0],[153,0,2],[157,2,2],[160,1,2],
    ]},
    {energy: 145, schedule: [
      [9,0,0],[10,2,1],[16,1,0],[22,0,2],[24,2,1],[32,2,2],[36,1,1],[43,0,2],[45,2,1],
      [60,0,2],[62,2,1],[63,2,1],[67,1,2],[74,2,2],[75,0,1],[82,0,2],[86,1,1],[92,2,2],[94,0,1],[98,1,2],
      [116,0,2],[117,2,1],[118,2,1],[122,1,2],[127,2,2],[129,0,1],[135,0,2],[137,1,1],
      [140,2,2],[145,1,2],[147,0,1],[151,0,2],[155,2,2],[157,1,1],[160,1,2],
    ]},
  ];
  // Stages 4-30 are generated from a fixed seed so every client and test sees the same waves.
  // Difficulty rises with more and denser enemies, more armor and faster late stages.
  const windows = [[9, 50], [60, 106], [116, 162]];
  function generated(stage) {
    const d = (stage - 4) / 26;
    let seed = stage * 7919 + 13;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const schedule = [];
    windows.forEach(([from, to], w) => {
      const count = Math.round(11 + 12 * d + w);
      const gap = (to - from) / (count - 1);
      const armored = Math.round(count * (.1 + .2 * d + .05 * w)), fast = Math.round(count * (.3 + .1 * d));
      const types = Array.from({length: count}, (_, i) => i < armored ? 2 : i < armored + fast ? 1 : 0);
      const lanes = Array.from({length: count}, (_, i) => i % LANES);
      for (const list of [types, lanes]) {
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      let previous = from - 1;
      for (let i = 0; i < count; i++) {
        const time = Math.round((from + i * gap + (random() - .5) * gap * .5) * 2) / 2;
        previous = Math.max(previous + .5, Math.min(to, time));
        schedule.push([previous, lanes[i], types[i]]);
      }
    });
    return {energy: Math.round(150 + 2.5 * (stage - 4)), income: 5 + Math.floor(d * 3), hpScale: 1 + .9 * d,
      speedUp: stage >= 26 ? 1 : 0, schedule};
  }
  for (let stage = 4; stage <= STAGE_COUNT; stage++) stages.push(generated(stage));
  const upgradeCost = 25;
  const position = cell => (cell % COLS + 1) * 1000;
  const wave = state => state.tick >= 11600 ? 3 : state.tick >= 6000 ? 2 : 1;

  function createStage(stage) {
    return {stage, tick: 0, energy: stages[stage - 1].energy, hull: 5, kills: 0, diverted: 0, points: 0, spawn: 0,
      devices: Array(LANES * COLS).fill(null), enemies: [], dead: false, won: false};
  }

  function gateTargets(state, cell) {
    const lane = Math.floor(cell / COLS), x = position(cell);
    return state.enemies.filter(e => e.lane === lane && e.x >= x - 450 &&
      e.x <= x + 1300 && e.shiftReady <= state.tick);
  }

  // Five build codes per cell (including both gate directions), then one pulse code.
  function input(state, code) {
    if (state.dead || !Number.isInteger(code) || code < 0 || code >= LANES * COLS * 6) return false;
    const cell = Math.floor(code / 6), action = code % 6;
    const lane = Math.floor(cell / COLS), device = state.devices[cell];
    if (action === 5) {
      if (!device || device.type !== 3 || device.ready > state.tick) return false;
      const targets = gateTargets(state, cell);
      if (!targets.length) return false;
      for (const enemy of targets) {
        enemy.lane += device.direction;
        enemy.shiftReady = state.tick + 150;
        if (!enemy.diverted) state.diverted++;
        enemy.diverted = true;
      }
      device.ready = state.tick + 800;
      return true;
    }
    const type = Math.min(action, 3), direction = action === 3 ? -1 : 1;
    if (device || state.energy < costs[type] ||
        (type === 3 && (lane + direction < 0 || lane + direction >= LANES))) return false;
    state.energy -= costs[type];
    state.devices[cell] = {type, direction, ready: state.tick};
    return true;
  }

  function upgrade(state, cell) {
    const device = state.devices[cell];
    if (state.dead || state.stage === 1 || wave(state) < 2 || !device ||
        (device.type !== 0 && device.type !== 2) || device.upgraded || state.energy < upgradeCost) return false;
    state.energy -= upgradeCost;
    device.upgraded = true;
    return true;
  }

  function advance(state, onAttack) {
    if (state.dead) return;
    state.tick++;
    if (state.tick % 400 === 0) state.energy += stages[state.stage - 1].income || 5;
    const spawn = stages[state.stage - 1].schedule[state.spawn];
    if (spawn && state.tick === Math.round(spawn[0] * 100)) {
      const [, lane, type] = spawn, config = stages[state.stage - 1];
      const hp = Math.round(health[type] * (config.hpScale || 1));
      state.enemies.push({id: state.spawn++, lane, type, x: LENGTH, hp, maxHp: hp, shiftReady: 0, diverted: false, marked: 0});
    }
    // Sonar resolves first so marked targets take extra damage in the same tick.
    for (const type of [1, 0, 2]) {
      state.devices.forEach((device, cell) => {
        if (device?.type !== type || device.ready > state.tick) return;
        const lane = Math.floor(cell / COLS), x = position(cell);
        const targets = state.enemies.filter(e => e.hp > 0 && e.lane === lane && e.x >= x - 350 && e.x <= x + 3000);
        if (!targets.length) return;
        device.ready = state.tick + (type === 2 ? (device.upgraded ? 105 : 160) : 100);
        if (type === 1) {
          onAttack?.(type, lane, x, targets[0].x);
          for (const enemy of targets) enemy.marked = state.tick + 140;
          return;
        }
        const target = targets.reduce((nearest, enemy) => enemy.x < nearest.x ? enemy : nearest);
        onAttack?.(type, lane, x, target.x);
        for (const enemy of targets) {
          if (enemy !== target && (type === 2 || Math.abs(enemy.x - target.x) > (device.upgraded ? 1050 : 550))) continue;
          const damage = type === 2 ? 18 : enemy.type === 2 ? 3 : 10;
          enemy.hp -= damage + (enemy.marked > state.tick ? 6 : 0);
        }
      });
    }
    state.enemies = state.enemies.filter(enemy => {
      if (enemy.hp <= 0) {
        state.kills++;
        state.points += values[enemy.type] + (enemy.diverted ? 15 : 0);
        return false;
      }
      enemy.x -= speeds[enemy.type] + (stages[state.stage - 1].speedUp && enemy.type !== 2 ? 1 : 0);
      if (enemy.x > 0) return true;
      state.hull = Math.max(0, state.hull - 1);
      return false;
    });
    state.won = state.tick === END && state.hull > 0;
    state.dead = state.hull === 0 || state.won;
  }

  const score = state => state.points + (state.won ? 300 + state.hull * 100 : 0);
  return {LANES, COLS, LENGTH, END, costs, health, gateTargets, wave, create: () => createStage(1), createStage, stageCount: stages.length, enemyCount: stage => stages[stage - 1].schedule.length, upgradeCost, upgrade, input, advance: state => advance(state), advanceWithEffects: advance, score, inputCount: LANES * COLS * 6};
})();
if (typeof module !== 'undefined') module.exports = outpostRules;
