const blockDropRules = (() => {
  const COLS = 10, ROWS = 20;
  const LOCK_MS = 500, MAX_RESETS = 15, CLEAR_MS = 220, DAS = 150, ARR = 40;
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]]
  };
  // SRS wall kicks, written as [dx, dy] with y pointing up; keys are "from" + "to" rotation.
  const KICK_JLSTZ = {
    '01': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '10': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '12': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '21': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '23': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '32': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '30': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '03': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
  };
  const KICK_I = {
    '01': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '10': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '12': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    '21': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '23': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '32': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '30': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '03': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
  };
  const POINTS = [0, 100, 300, 500, 800];


  const emptyBoard = () => Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const presses = ['left','right','down','cw','ccw','hard','hold'];
  const releases = ['left','right','down'];
  const inputCount = presses.length + releases.length;
  function createModel(random = Math.random, {onPreview = () => {}, onStats = () => {}, onClear = () => {}} = {}) {
    let board = emptyBoard(), cur = null, queue = [], holdType = null, canHold = true;
    let score = 0, lines = 0, level = 1, dead = false;
    let gT = 0, lockT = 0, lockResets = 0, lowestY = 0;
    let clearRows = null, clearT = 0;
    const held = {left:false,right:false,down:false};
    let dir = null, dasT = 0, arrT = 0;
    function endGame() { dead = true; cur = null; }
    function rot(m, d) {
      const n = m.length;
      return m.map((row, y) => row.map((_, x) => (d > 0 ? m[n - 1 - x][y] : m[x][n - 1 - y])));
    }
    function collide(m, px, py) {
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m.length; c++) {
          if (!m[r][c]) continue;
          const x = px + c, y = py + r;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && board[y][x]) return true;
        }
      }
      return false;
    }
    const grounded = () => collide(cur.m, cur.x, cur.y + 1);

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    function fillQueue() {
      while (queue.length < 7) queue.push(...shuffle(['I', 'O', 'T', 'S', 'Z', 'J', 'L']));
    }

    function spawn(type) {
      const m = SHAPES[type].map(r => r.slice());
      cur = { type, m, rot: 0, x: Math.floor((COLS - m.length) / 2), y: type === 'I' ? -1 : 0 };
      gT = 0; lockT = 0; lockResets = 0; lowestY = cur.y;
      if (collide(cur.m, cur.x, cur.y)) endGame();
    }
    function spawnNext() {
      fillQueue();
      spawn(queue.shift());
      fillQueue();
      onPreview();
    }

    function noteMoved() {
      if (cur.y > lowestY) { lowestY = cur.y; lockResets = 0; }
      if (grounded() && lockResets < MAX_RESETS) { lockT = 0; lockResets++; }
    }
    function tryMove(dx, dy) {
      if (!cur || collide(cur.m, cur.x + dx, cur.y + dy)) return false;
      cur.x += dx; cur.y += dy;
      noteMoved();
      return true;
    }
    function tryRotate(d) {
      if (!cur || cur.type === 'O') return false;
      const from = cur.rot, to = (from + d + 4) % 4;
      const m = rot(cur.m, d);
      const table = (cur.type === 'I' ? KICK_I : KICK_JLSTZ)[String(from) + String(to)];
      for (const [dx, dy] of table) {
        if (!collide(m, cur.x + dx, cur.y - dy)) {
          cur.m = m; cur.rot = to; cur.x += dx; cur.y -= dy;
          noteMoved();
          return true;
        }
      }
      return false;
    }
    function hardDrop() {
      if (!cur) return;
      let n = 0;
      while (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; }
      score += n * 2;
      lockPiece();
    }
    function doHold() {
      if (!cur || !canHold) return;
      canHold = false;
      const t = cur.type;
      if (holdType) { const h = holdType; holdType = t; spawn(h); onPreview(); }
      else { holdType = t; spawnNext(); }
    }

    function lockPiece() {
      let out = false;
      for (let r = 0; r < cur.m.length; r++) {
        for (let c = 0; c < cur.m.length; c++) {
          if (!cur.m[r][c]) continue;
          const y = cur.y + r, x = cur.x + c;
          if (y < 0) out = true; else board[y][x] = cur.type;
        }
      }
      canHold = true;
      if (out) { cur = null; endGame(); return; }
      const full = [];
      for (let y = 0; y < ROWS; y++) if (board[y].every(Boolean)) full.push(y);
      if (full.length) {
        score += POINTS[full.length] * level;
        lines += full.length;
        level = Math.floor(lines / 10) + 1;
        clearRows = full; clearT = 0; cur = null;
        onClear(full.length);
        onStats();
      } else {
        onStats();
        spawnNext();
      }
    }
    function finishClear() {
      board = board.filter((_, i) => !clearRows.includes(i));
      while (board.length < ROWS) board.unshift(new Array(COLS).fill(null));
      clearRows = null;
      spawnNext();
    }

    const gravityMs = lv => Math.max(1, Math.pow(0.8 - (Math.min(lv, 30) - 1) * 0.007, Math.min(lv, 30) - 1) * 1000);

    function advance(dt) {
      if (dead) return;
      if (clearRows) {
        clearT += dt;
        if (clearT >= CLEAR_MS) finishClear();
        return;
      }
      if (!cur) return;
      if (dir && held[dir]) {
        dasT += dt;
        if (dasT >= DAS) {
          arrT += dt;
          while (arrT >= ARR) {
            arrT -= ARR;
            if (!tryMove(dir === 'left' ? -1 : 1, 0)) { arrT = 0; break; }
          }
        }
      }
      const speed = gravityMs(level);
      const eff = held.down ? Math.max(1, Math.min(speed, 40)) : speed;
      gT += dt;
      while (gT >= eff) {
        gT -= eff;
        if (!tryMove(0, 1)) { gT = 0; break; }
        if (held.down) { score += 1; onStats(); }
      }
      if (grounded()) {
        lockT += dt;
        if (lockT >= LOCK_MS) lockPiece();
      } else {
        lockT = 0;
      }
    }


    function input(code) {
      if (dead || !Number.isInteger(code) || code < 0 || code >= inputCount) return false;
      if (code >= presses.length) {
        const action = releases[code - presses.length];
        if (!held[action]) return false;
        held[action] = false;
        if (action === dir) { dir = held.left ? 'left' : held.right ? 'right' : null; dasT = 0; arrT = 0; }
        return true;
      }
      const action = presses[code];
      if (action === 'left' || action === 'right') {
        held[action] = true; dir = action; dasT = 0; arrT = 0;
        tryMove(action === 'left' ? -1 : 1, 0);
      } else if (action === 'down') held.down = true;
      else if (action === 'cw') tryRotate(1);
      else if (action === 'ccw') tryRotate(-1);
      else if (action === 'hard') hardDrop();
      else if (action === 'hold') doHold();
      return true;
    }
    function start() { queue = []; spawnNext(); onStats(); }
    return {
      get board(){return board}, get cur(){return cur}, get queue(){return queue},
      get holdType(){return holdType}, get canHold(){return canHold}, get score(){return score},
      get lines(){return lines}, get level(){return level}, get dead(){return dead},
      get clearRows(){return clearRows}, get clearT(){return clearT},
      start, fillQueue, collide, input, advance,
    };
  }
  function create(random) {
    const model = createModel(random);
    model.start();
    return model;
  }
  return {
    COLS, ROWS, CLEAR_MS, SHAPES, emptyBoard, inputCount, createModel, create,
    pressCode: action => presses.indexOf(action),
    releaseCode: action => releases.includes(action) ? presses.length + releases.indexOf(action) : -1,
    input: (model, code) => model.input(code),
    advance: (model, dt) => model.advance(dt * 1000),
    score: model => model.score,
  };
})();
if (typeof module !== 'undefined') module.exports = blockDropRules;
