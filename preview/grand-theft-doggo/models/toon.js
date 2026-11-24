// Shared toon toolkit for the Vice Paw city models. Needs global THREE (r128).
(function () {
  const steps = new Uint8Array([95, 175, 255]);
  const gradient = new THREE.DataTexture(steps, 3, 1, THREE.LuminanceFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.generateMipmaps = false; gradient.needsUpdate = true;
  const mats = {}, glow = {};
  // lit, 3-step cartoon shading; materials are cached by colour so a whole city shares them
  function toon(color) { const k = String(color); return mats[k] || (mats[k] = new THREE.MeshToonMaterial({ color, gradientMap: gradient })); }
  // unlit, always-bright colour: lit windows, neon, signs, headlights
  function bright(color) { const k = String(color); return glow[k] || (glow[k] = new THREE.MeshBasicMaterial({ color })); }
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1a1620, side: THREE.BackSide });
  // geometry pushed outwards along smoothed normals (shared positions share one normal, so the hull has no cracks)
  function hullGeometry(geo, t) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, sum = new Map(), key = i => Math.round(p.getX(i) * 500) + ',' + Math.round(p.getY(i) * 500) + ',' + Math.round(p.getZ(i) * 500);
    for (let i = 0; i < p.count; i++) { const k = key(i), s = sum.get(k) || [0, 0, 0]; s[0] += n.getX(i); s[1] += n.getY(i); s[2] += n.getZ(i); sum.set(k, s); }
    for (let i = 0; i < p.count; i++) { const s = sum.get(key(i)), l = Math.hypot(s[0], s[1], s[2]) || 1; p.setXYZ(i, p.getX(i) + s[0] / l * t, p.getY(i) + s[1] / l * t, p.getZ(i) + s[2] / l * t); }
    p.needsUpdate = true; return g;
  }
  // mesh(geometry, colour, { outline: true, t: 0.05, bright: false }) -> Mesh with a dark outline hull child
  function mesh(geo, color, o) {
    o = o || {}; const m = new THREE.Mesh(geo, o.bright ? bright(color) : toon(color));
    if (o.outline !== false) { const h = new THREE.Mesh(hullGeometry(geo, (o.t || 0.05) * 1.7), outlineMat); h.matrixAutoUpdate = false; m.add(h); }
    return m;
  }
  // easy placement: add(group, mesh, x, y, z, rx, ry, rz)
  function put(group, m, x, y, z, rx, ry, rz) { m.position.set(x || 0, y || 0, z || 0); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); group.add(m); return m; }
  // tiny canvas texture for signs / window grids, kept small
  function canvasTexture(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
  function lights(scene) {
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6f5f86, 0.62));
    const d = new THREE.DirectionalLight(0xffe7c4, 0.72); d.position.set(-20, 40, 25); scene.add(d);
  }
  window.Toon = { toon, bright, mesh, put, canvasTexture, lights, outlineMat, hullGeometry };
})();
