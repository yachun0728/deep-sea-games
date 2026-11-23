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
  ground(g, 1056, 1000, 8);
  const cell = 140; OL = 6.5;
  road(g, [[-80, 610], [230, 610], [390, 570], [520, 500], [780, 500]], cell);
  OL = 4.5; drawTree(g, 960, 905, 110, '#5FB55A'); drawBush(g, 120, 890, 96); drawFlowers(g, 560, 220, 70); drawGrassClump(g, 470, 140, 64); drawTree(g, 980, 200, 96, '#5FB55A');
  OL = 245 * 0.03; drawCastle(g, 772, 480, 245, 0.6, 0.45);
  const units = [['rats', 120, 610, 120], ['shield', 265, 612, 175], ['sapper', 470, 560, 380]];
  for (const [type, x, y, s] of units) { OL = s * 0.05; if (type === 'rats') drawRatSquad(g, x, y - s * 0.1, s); else drawUnit(g, type, x, y - s * 0.12, s, { face: 1 }); }
  title(g, ['Critter', 'Crashers'], 528, 772, 150, 128);
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
