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
  // landmarks and scenery behind everything
  OL = 4; drawLandmark(g, 'windmill', 640, 120, 52);
  drawLandmark(g, 'pond', 150, 330, 46);
  drawLandmark(g, 'fairyring', 940, 730, 40);
  // road: from the left edge, winding up to the castle gate
  const cell = 120; OL = 6;
  road(g, [[-80, 470], [300, 470], [300, 330], [620, 330], [800, 330]], cell);
  // scenery, back to front
  const D = [
    ['tree', 760, 110, 90], ['bush', 540, 150, 64], ['pine', 1000, 120, 100], ['tree', 300, 160, 84], ['bush', 380, 230, 70],
    ['rock', 560, 220, 56], ['mush', 240, 400, 80], ['flowers', 430, 420, 64], ['grass', 520, 440, 56], ['stump', 690, 450, 60],
    ['tree', 1010, 520, 104], ['bush', 640, 560, 72], ['flowers', 990, 640, 60], ['rock', 560, 640, 52], ['grass', 980, 420, 56],
    ['tree', 60, 610, 110], ['bush', 150, 690, 80], ['tree', 80, 930, 110], ['bush', 170, 960, 80], ['tree', 990, 950, 110],
    ['bush', 900, 975, 80], ['flowers', 90, 790, 60], ['mush', 120, 520, 80], ['flowers', 700, 470, 60], ['bush', 450, 450, 64], ['tree', 180, 160, 70], ['grass', 470, 590, 50], ['bush', 520, 560, 70], ['flowers', 420, 610, 56], ['rock', 380, 560, 48],
  ];
  const DEC = { tree: (x, y, z) => drawTree(g, x, y, z, '#5FB55A'), pine: (x, y, z) => drawPine(g, x, y, z), bush: (x, y, z) => drawBush(g, x, y, z),
    flowers: (x, y, z) => drawFlowers(g, x, y, z), grass: (x, y, z) => drawGrassClump(g, x, y, z), rock: (x, y, z) => drawRock(g, x, y, z),
    mush: (x, y, z) => drawMushrooms(g, x, y, z), stump: (x, y, z) => drawStump(g, x, y, z) };
  for (const [k, x, y, z] of D.sort((p, q) => p[2] - q[2])) { OL = Math.max(3.5, z * 0.05); DEC[k](x, y, z); }
  // a cannon tower guarding the road, range ring included
  g.beginPath(); g.arc(485, 220, 150, 0, 6.3); g.fillStyle = 'rgba(208,69,58,.12)'; g.fill();
  g.setLineDash([18, 13]); g.lineWidth = 4; g.strokeStyle = 'rgba(208,69,58,.6)'; g.stroke(); g.setLineDash([]);
  OL = 130 * 0.045; drawTower(g, 'cannon', 485, 220, 130, Math.atan2(110, 55), true, 0);
  // castle at the end of the road
  OL = 220 * 0.03; drawCastle(g, 800, 340, 220, 0.6, 0.45);
  // the squad far down the road (small), the beaver up front (big)
  for (const [type, x, y, z, o] of [['rats', 200, 470, 90], ['shield', 380, 330, 105], ['peacock', 540, 330, 110, { fan: true }]]) {
    OL = z * 0.05; if (type === 'rats') drawRatSquad(g, x, y - z * 0.1, z); else drawUnit(g, type, x, y - z * 0.12, z, { face: 1, ...(o || {}) });
  }
  OL = 360 * 0.05; drawUnit(g, 'sapper', 760, 600, 360, { face: -1 });
  title(g, ['Critter', 'Crashers'], 528, 790, 150, 126);
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
