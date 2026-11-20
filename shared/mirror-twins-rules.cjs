const mirrorTwinsRules = (() => {
const LEVELS = [
  { name: '照鏡子|Mirror Image', rows: ['#########', '#a..#..b#', '#...#...#', '#...#...#', '#A..#..B#', '#########'] },
  { name: '靠牆|Against the Wall', rows: ['#########', '#..a#b..#', '#...#...#', '#...#...#', '#A..#B..#', '#########'] },
  { name: '雷射地雷|Laser Mines', rows: ['########', '#.^#...#', '#.^..#a#', '#.##.b##', '###...^#', '#.^.AB.#', '########'] },
  { name: '同一個房間|Same Room', rows: ['########', '#.B.a.^#', '##..#..#', '#b...A.#', '###....#', '###.##.#', '########'] },
  { name: '繞路|Detour', rows: ['########', '#.^....#', '##A...^#', '#b#.a..#', '#.#.^#.#', '#.B#...#', '########'] },
  { name: '卡位|Blocking', rows: ['#########', '###^.#^a#', '#.BA#...#', '#....##.#', '#b......#', '#..^.^###', '##..#.###', '#########'] },
  { name: '迷宮|Maze', rows: ['#########', '#A#.^#..#', '#...^.#.#', '#.^#^...#', '#..#..#.#', '#b.#..aB#', '#.....#.#', '#########'] },
  { name: '刺叢|Thicket', rows: ['#########', '#B#.A.^.#', '#.^..####', '#..b....#', '#.......#', '##.##.^.#', '#.^..^.a#', '#########'] },
  { name: '分道揚鑣|Parting Ways', rows: ['##########', '#^#...####', '#.A##.^#.#', '#^.##....#', '#.a.##.^b#', '###....^.#', '#..B#^#..#', '##########'] },
  { name: '最後的鏡子|The Last Mirror', rows: ['##########', '#...##...#', '#.^#.^##.#', '#^.^^....#', '#B...A.b##', '#.^......#', '#.......a#', '##########'] },
];

// ---------- 規則（同一份邏輯也拿來算最少步數） ----------
function parse(rows) {
  const h = rows.length, w = rows[0].length, L = { w, h, g: [] };
  for (let y = 0; y < h; y++) {
    L.g.push([]);
    for (let x = 0; x < w; x++) {
      let c = rows[y][x];
      if (c === 'A') { L.A = [x, y]; c = '.'; }
      if (c === 'B') { L.B = [x, y]; c = '.'; }
      if (c === 'a') L.ga = [x, y];
      if (c === 'b') L.gb = [x, y];
      L.g[y].push(c);
    }
  }
  return L;
}
const tile = (L, x, y) => (y < 0 || y >= L.h || x < 0 || x >= L.w) ? '#' : L.g[y][x];
const eq = (p, q) => p[0] === q[0] && p[1] === q[1];
const mv = (L, p, dx, dy) => { const n = [p[0] + dx, p[1] + dy]; return tile(L, n[0], n[1]) === '#' ? p : n; };
function step(L, a, b, dx, dy) {
  let na = mv(L, a, dx, dy), nb = mv(L, b, -dx, dy);
  if (eq(na, nb)) { na = a; nb = b; }                 // 搶同一格：都不動
  else if (eq(na, b) && eq(nb, a)) { na = a; nb = b; } // 互換位置：都不動
  else if (eq(na, b) && eq(nb, b)) { na = a; }         // 對方沒動，被擋住
  else if (eq(nb, a) && eq(na, a)) { nb = b; }
  const dead = tile(L, na[0], na[1]) === '^' || tile(L, nb[0], nb[1]) === '^';
  const win = !dead && eq(na, L.ga) && eq(nb, L.gb);
  return { a: na, b: nb, dead, win };
}
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function solve(L) {
  const key = (a, b) => a + '|' + b;
  const seen = new Set([key(L.A, L.B)]);
  let q = [[L.A, L.B]], depth = 0;
  while (q.length) {
    depth++; const nq = [];
    for (const [a, b] of q) for (const [dx, dy] of DIRS) {
      const r = step(L, a, b, dx, dy);
      if (r.dead) continue;
      const k = key(r.a, r.b); if (seen.has(k)) continue; seen.add(k);
      if (r.win) return depth;
      nq.push([r.a, r.b]);
    }
    q = nq;
  }
  return Infinity;
}


function verify([level, ...actions]) {
  if (!Number.isInteger(level) || level < 1 || level > LEVELS.length || !actions.length || actions.length > 4096) return false;
  const board = parse(LEVELS[level - 1].rows);
  let a = board.A, b = board.B;
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    if (!Number.isInteger(action) || action < 0 || action > 3) return false;
    const result = step(board, a, b, ...DIRS[action]);
    if (result.dead || result.win && index !== actions.length - 1) return false;
    a = result.a; b = result.b;
    if (result.win) return true;
  }
  return false;
}
return { verify, LEVELS, parse, step, DIRS };
})();
if (typeof module !== 'undefined') module.exports = mirrorTwinsRules;
