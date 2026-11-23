// TICATICA lobby cover (1056x1000) and leaderboard thumbnail (192x192), drawn with the game's own sprites.
(() => {
const size = new URLSearchParams(location.search).get('size') || '1056x1000';
const [OW, OH] = size.split('x').map(Number);
const R = { base: '#8FCF63', patch: '#9DD872', mark: '#79BB52', road: '#F2D08A', edge: '#E3BB72' };
function ground(g, DW, DH, n) {
  g.fillStyle = R.base; g.fillRect(0, 0, DW, DH);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = R.patch;
  for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(rnd() * DW, rnd() * DH, DW * (0.1 + rnd() * 0.15), DH * (0.05 + rnd() * 0.07), 0, 0, 6.3); g.fill(); }
  g.strokeStyle = R.mark; g.lineWidth = DW / 210; g.lineCap = 'round';
  for (let i = 0; i < n * 4; i++) { const x = rnd() * DW, y = rnd() * DH, k = DW / 1056; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5 * k, y - 14 * k); g.moveTo(x + 9 * k, y); g.lineTo(x + 12 * k, y - 12 * k); g.stroke(); }
}
function road(g, pts, cell) {
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.lineJoin = 'round'; g.lineCap = 'round';
  path(); g.strokeStyle = OUT; g.lineWidth = cell * 0.9 + OL * 2; g.stroke();
  path(); g.strokeStyle = R.edge; g.lineWidth = cell * 0.9; g.stroke();
  path(); g.strokeStyle = R.road; g.lineWidth = cell * 0.64; g.stroke();
}
function title(g, lines, x, y, size, lead) {
  g.font = `700 ${size}px Fredoka`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  lines.forEach((line, i) => {
    const ly = y + i * lead;
    g.lineWidth = size * 0.16; g.strokeStyle = OUT; g.fillStyle = OUT;
    g.strokeText(line, x, ly + size * 0.07); g.fillText(line, x, ly + size * 0.07);
    g.strokeText(line, x, ly);
    g.fillStyle = i === 0 ? '#FFF3D6' : '#FFD23F'; g.fillText(line, x, ly);
  });
}
function cover(g) {
  ground(g, 1056, 1000, 14);
  // background details stay at the edges; the middle belongs to the tower, the beaver and the castle
  OL = 4; drawLandmark(g, 'windmill', 560, 95, 40);
  drawLandmark(g, 'pond', 110, 250, 36);
  const D = [
    ['tree', 450, 120, 80], ['tree', 700, 110, 84], ['pine', 1000, 120, 96], ['tree', 880, 90, 70], ['bush', 640, 160, 56],
    ['tree', 40, 470, 100], ['bush', 110, 410, 64], ['mush', 60, 760, 70], ['flowers', 150, 700, 56], ['tree', 70, 940, 110], ['bush', 170, 975, 76],
    ['tree', 1010, 560, 100], ['flowers', 980, 660, 56], ['mush', 1000, 780, 70], ['tree', 990, 950, 110], ['bush', 890, 975, 76],
    ['rock', 400, 250, 44], ['bush', 950, 260, 60], ['flowers', 700, 250, 50], ['tree', 1000, 330, 80], ['mush', 860, 700, 64], ['grass', 780, 690, 50], ['grass', 290, 700, 50], ['flowers', 880, 620, 48],
  ];
  const DEC = { tree: (x, y, z) => drawTree(g, x, y, z, '#5FB55A'), pine: (x, y, z) => drawPine(g, x, y, z), bush: (x, y, z) => drawBush(g, x, y, z),
    flowers: (x, y, z) => drawFlowers(g, x, y, z), grass: (x, y, z) => drawGrassClump(g, x, y, z), rock: (x, y, z) => drawRock(g, x, y, z),
    mush: (x, y, z) => drawMushrooms(g, x, y, z), stump: (x, y, z) => drawStump(g, x, y, z) };
  for (const [k, x, y, z] of D.sort((p, q) => p[2] - q[2])) { OL = Math.max(3.5, z * 0.05); DEC[k](x, y, z); }
  // road through the middle, ending at the castle gate
  OL = 6; road(g, [[-80, 600], [240, 600], [380, 520], [780, 520]], 130);
  const beaver = { x: 490, y: 575 };
  // cannon tower (left), range ring reaching the road
  const T = { x: 255, y: 345 };
  g.beginPath(); g.arc(T.x, T.y, 215, 0, 6.3); g.fillStyle = 'rgba(208,69,58,.12)'; g.fill();
  g.setLineDash([20, 14]); g.lineWidth = 5; g.strokeStyle = 'rgba(208,69,58,.6)'; g.stroke(); g.setLineDash([]);
  OL = 190 * 0.045; drawTower(g, 'cannon', T.x, T.y, 190, Math.atan2(beaver.y - 60 - T.y, beaver.x - T.x), true, 0);
  // castle (right)
  OL = 255 * 0.03; drawCastle(g, 760, 520, 255, 0.6, 0.45);
  // the rest of the squad, small, further back on the road
  for (const [type, x, y, z] of [['rats', 70, 600, 80], ['shield', 200, 600, 105]]) {
    OL = z * 0.05; if (type === 'rats') drawRatSquad(g, x, y - z * 0.1, z); else drawUnit(g, type, x, y - z * 0.12, z, { face: 1 });
  }
  // the beaver, centre stage, heading for the gate
  OL = 430 * 0.05; drawUnit(g, 'sapper', beaver.x, beaver.y, 430, { face: 1 });
  title(g, ['Critter', 'Crashers'], 528, 800, 150, 124);
}
function badge(g) {
  ground(g, 192, 192, 3);
  OL = 290 * 0.045; drawUnit(g, 'sapper', 104, 116, 290, { face: 1 });
}
function go() {
  const cv = document.createElement('canvas'); cv.width = OW; cv.height = OH;
  cv.style.cssText = `position:fixed;left:0;top:0;width:${OW}px;height:${OH}px;z-index:10000`;
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  if (size === '192x192') badge(g); else cover(g);
  const out = document.createElement('textarea'); out.id = 'out';
  out.textContent = cv.toDataURL('image/png') + '\n' + [0.92, 0.88, 0.85, 0.8].map(q => cv.toDataURL('image/webp', q)).join('\n');
  document.body.appendChild(out);
}
document.fonts.load('700 100px Fredoka').then(go, go);
})();
