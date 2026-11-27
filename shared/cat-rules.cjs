const catRules = (() => {
  const WIDTH = 400, HEIGHT = 560, X = 110, COYOTE = .14;
  // Rules v2 (2026-11-27): faster run, rooftop obstacles, tin roofs that collapse, pigeons, signs to slide
  // under, taller height changes and dried fish. Version 1 is kept exactly as it was (no extra random draws),
  // so rounds started on an older client still replay and verify on the server.
  // Inputs: 0 press jump, 1 release jump, 2 slide (v2 only; v1 replays with two inputs).
  const rulesVersion = 2;
  const SLOW = .6, STUMBLE = .6, TRIP_WINDOW = 4, CRUMBLE = .45, SLIDE = .55;
  const score = state => Math.floor(state.dist / 60);

  // ---- v2 content: obstacles and fish, generated with the same seeded random as the roofs ----
  // low  : clutter on the roof (AC unit, crate, planter). Touching it trips the cat.
  // step : a solid block (water tank, shed). The cat can land on it; running into its side ends the run.
  // line : laundry hung across the roof. Passing through it (on the way up or down) trips the cat.
  // sign : a shop sign hanging low in a frame. Slide under it (or clear it with a big jump); touching it trips.
  // bird : a pigeon flying at jump height. Touching it trips the cat.
  // tin  : a short rusty tin roof. It collapses CRUMBLE seconds after the cat lands on it.
  // Tripping twice within TRIP_WINDOW seconds ends the run.
  function fishAt(state, x, y) { state.fish.push({x, y, taken: false}); }
  function decorate(state, prev, roof, random) {
    const between = (a, b) => a + random() * (b - a), m = score(state), v = state.v;
    // A fish arc over the gap, roughly along a short hop from the edge (from 20 m).
    if (m >= 20 && random() < .45) {
      const ex = prev.x + prev.w, sx = roof.x, base = Math.min(prev.y, roof.y);
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        fishAt(state, ex - 12 + (sx - ex + 24) * t, base - 26 - 66 * Math.sin(Math.PI * t));
      }
    }
    // A short tin roof that collapses soon after landing (from 60 m). It carries nothing else.
    if (m >= 60 && random() < Math.min(.3, .1 + m * .0004)) {
      roof.tin = true;
      roof.w = between(80, 120);
      roof.crumble = -1;
      return;
    }
    // Room to land before the first obstacle, and to land and jump again after the last one.
    // A higher roof means a longer jump and a later landing, so the landing room grows with the climb.
    const lead = Math.max(60, v * .6) + Math.max(0, prev.y - roof.y) * 1.5, tail = Math.max(90, v * .5), apart = Math.max(120, v * .6);
    let placed = 0;
    if (m >= 30) {
      const mixed = m >= 150, chance = Math.min(.75, .25 + m * .001), count = m >= 300 ? 2 : 1, list = [];
      for (let i = 0; i < count; i++) {
        if (random() > chance) continue;
        const r = random(), kind = !mixed || r < .45 ? 'low' : r < .65 ? 'step' : r < .8 ? 'line' : 'sign';
        const w = kind === 'low' ? between(26, 40) : kind === 'step' ? between(50, 84) : kind === 'line' ? between(70, 110) : between(34, 50);
        const h = kind === 'low' ? between(16, 22) : kind === 'step' ? between(30, 42) : 0;
        list.push({kind, w, h});
      }
      if (list.length) {
        // Roofs get narrower with distance, so a roof chosen to carry obstacles is widened to fit them.
        const need = lead + tail + list.reduce((sum, o) => sum + o.w, 0) + apart * (list.length - 1);
        if (roof.w < need) roof.w = need;
        let slack = roof.w - need, x = roof.x + lead;
        for (const {kind, w, h} of list) {
          const s = random() * slack;
          slack -= s;
          x += s;
          state.obs.push({kind, x, w, h, base: roof.y, hit: false, roof: roof.id});
          if (kind === 'step') { fishAt(state, x + w * .3, roof.y - h - 24); fishAt(state, x + w * .7, roof.y - h - 24); }
          x += w + apart;
          placed++;
        }
      }
    }
    // A pigeon flying toward the cat at jump height (from 120 m). It is placed so that it reaches the cat over
    // the middle of this roof, away from its edges and obstacles: there the player only has to hold off jumping.
    if (m >= 120 && random() < Math.min(.6, .15 + m * .0008)) {
      const vx = between(40, 90), y = roof.y - between(58, 100), lo = Math.max(roof.w * .25, 60), hi = roof.w - Math.max(60, v * .25);
      const meet = hi > lo ? between(lo, hi) : -1, clear = Math.max(50, v * .3);
      if (meet >= 0 && !state.obs.some(o => o.roof === roof.id && o.x - roof.x < meet + clear && o.x + o.w - roof.x > meet - clear)) {
        // Relative to the roof the bird moves back at vx while the cat moves forward at v; solve for the start.
        const c0 = X - roof.x, d0 = (meet * (v + vx) - vx * c0) / v;
        state.birds.push({kind: 'bird', x: roof.x + d0, y, vx, hit: false});
      }
    }
    // A short line of fish along an empty roof.
    if (!placed && m >= 10 && roof.w >= 150 && random() < .4) {
      for (let i = 0; i < 4; i++) fishAt(state, roof.x + lead + i * 26, roof.y - 22);
    }
  }

  function fill(state, random) {
    const between = (a, b) => a + random() * (b - a);
    for (;;) {
      const roof = state.roofs[state.roofs.length - 1];
      if (roof.x + roof.w > WIDTH + 260) return;
      // v2 has taller height changes (up to 115 down; climbs capped below) and roofs as high as y 300.
      const v2 = state.version >= 2, distance = score(state);
      const heightRange = v2 ? Math.min(70, distance * .12) : Math.min(20, distance * .04);
      const gap = between(45, 40 + state.v * .34);
      const w = between(Math.max(105, 170 - distance * .12), Math.max(180, 300 - distance * .3));
      let dy = between(-55 - heightRange, 45 + heightRange);
      // v2: a climb must stay reachable when jumping late at the edge: smaller over a short gap, and small
      // after a tin roof (the cat has to leave it quickly).
      // Two big climbs in a row are not allowed either.
      if (v2 && dy < 0) dy = Math.max(dy, -(roof.tin ? 50 : roof.rise > 60 ? 50 : 40 + gap * .5));
      const next = {x: roof.x + roof.w + gap, w, y: Math.max(v2 ? 300 : 340, Math.min(470, roof.y + dy)), id: state.nid++};
      if (v2) next.rise = roof.y - next.y;
      state.roofs.push(next);
      if (state.version >= 2) decorate(state, roof, next, random);
    }
  }

  function create(random = Math.random, version = rulesVersion) {
    const state = {roofs:[{x:-60,w:400,y:430,id:0}],nid:1,cy:430,vy:0,on:true,offT:0,
      buf:0,hold:false,dist:0,v:190,sq:0,dead:false};
    if (version >= 2) Object.assign(state, {version, v: 230, obs: [], fish: [], birds: [], fishN: 0, stumbleT: 0, tripWin: 0,
      trips: 0, trippedBy: null, slideT: 0, slideBuf: 0, upT: 9, jumpY: 430});
    fill(state, random);
    return state;
  }

  function input(state, action) {
    if (action === 2) {
      if (!(state.version >= 2)) return false;
      // Slide on the ground. Right after a take-off (a touch that turned into a swipe down) the hop is cancelled
      // and the cat slides from where it left; otherwise in the air it drops faster and slides on landing.
      if (state.on) state.slideT = SLIDE;
      else if (state.upT < .15 && state.vy < 0) {
        Object.assign(state, {cy: state.jumpY, vy: 0, on: true, offT: 0, hold: false, buf: 0, sq: 0, slideT: SLIDE});
      }
      else { state.vy = Math.max(state.vy, 450); state.slideBuf = .2; }
      return true;
    }
    if (action === 1) {
      if (!state.hold) return false;
      state.hold = false;
      return true;
    }
    state.hold = true;
    if (state.version >= 2) { state.slideT = 0; state.slideBuf = 0; }
    if (state.on || state.offT < COYOTE) {
      if (state.version >= 2) { state.upT = 0; state.jumpY = state.cy; }
      state.vy = -600;
      state.on = false;
      state.offT = 1;
      state.sq = -.25;
    } else state.buf = .12;
    return true;
  }

  function trip(state, o) {
    o.hit = true;
    state.trippedBy = o.kind;
    if (state.tripWin > 0) { state.trips++; state.dead = true; return; }
    state.trips++;
    state.stumbleT = STUMBLE;
    state.tripWin = TRIP_WINDOW;
  }

  function advance(state, dt, random) {
    const v2 = state.version >= 2;
    state.sq *= .86;
    state.v = v2 ? Math.min(430, 230 + state.dist * .00476) : Math.min(400, 190 + state.dist * .0035);
    const move = v2 && state.stumbleT > 0 ? state.v * SLOW : state.v;
    state.dist += move * dt;
    for (const roof of state.roofs) roof.x -= move * dt;
    state.roofs = state.roofs.filter(roof => roof.x + roof.w > -80);
    if (v2) {
      if (state.stumbleT > 0) state.stumbleT -= dt;
      if (state.tripWin > 0) state.tripWin -= dt;
      if (state.slideT > 0) state.slideT -= dt;
      if (state.slideBuf > 0) state.slideBuf -= dt;
      if (!state.on) state.upT += dt;
      for (const o of state.obs) o.x -= move * dt;
      for (const f of state.fish) f.x -= move * dt;
      for (const b of state.birds) b.x -= (move + b.vx) * dt;
      for (const roof of state.roofs) {
        if (!roof.tin) continue;
        if (roof.crumble > 0 && (roof.crumble -= dt) <= 0) roof.gone = true;
        if (roof.gone) roof.fall = (roof.fall || 0) + 420 * dt;
      }
      state.obs = state.obs.filter(o => o.x + o.w > -80);
      state.fish = state.fish.filter(f => f.x > -80 && !f.taken);
      state.birds = state.birds.filter(b => b.x > -80);
    }
    fill(state, random);
    if (state.buf > 0) state.buf -= dt;
    const before = state.cy;
    state.vy += (state.hold && state.vy < 0 ? 1000 : 2100) * dt;
    state.cy += state.vy * dt;
    if (!state.on) state.offT += dt;
    let land = false;
    // Surfaces the cat can stand on: roofs, plus (v2) the tops of step blocks.
    const surfaces = v2 ? state.roofs.filter(roof => !roof.gone).concat(state.obs.filter(o => o.kind === 'step').map(o => ({x: o.x, w: o.w, y: o.base - o.h}))) : state.roofs;
    for (const roof of surfaces) {
      if (X + 12 <= roof.x || X - 12 >= roof.x + roof.w) continue;
      if (state.vy >= 0 && before <= roof.y + 14 && state.cy >= roof.y) {
        state.cy = roof.y;
        state.vy = 0;
        land = true;
        if (roof.tin && roof.crumble < 0) roof.crumble = CRUMBLE;
      } else if (state.cy > roof.y + 14) {
        state.dead = true;
        return;
      }
    }
    if (!land) state.on = false;
    else if (state.buf > 0) {
      if (v2) { state.upT = 0; state.jumpY = state.cy; }
      state.vy = -600;
      state.buf = 0;
      state.sq = -.25;
      state.on = false;
      state.offT = 1;
    } else {
      if (!state.on) state.sq = .25;
      state.on = true;
      state.offT = 0;
      if (v2 && state.slideBuf > 0) { state.slideT = SLIDE; state.slideBuf = 0; }
    }
    if (v2) {
      // The cat's body spans 4 to 38 above its paws, or 4 to 18 while sliding.
      const top = state.cy - (state.slideT > 0 ? 18 : 38), bottom = state.cy - 4;
      for (const o of state.obs) {
        if (o.hit || o.kind === 'step' || X + 12 <= o.x || X - 12 >= o.x + o.w) continue;
        const hitLow = o.kind === 'low' && state.cy > o.base - o.h + 3;
        // Laundry hangs between 54 and 76 above the roof.
        const hitLine = o.kind === 'line' && top < o.base - 54 && bottom > o.base - 76;
        // A sign hangs between 26 and 110 above the roof.
        const hitSign = o.kind === 'sign' && top < o.base - 26 && bottom > o.base - 110;
        if (hitLow || hitLine || hitSign) { trip(state, o); if (state.dead) return; }
      }
      for (const b of state.birds) {
        if (b.hit || Math.abs(b.x - X) >= 18 || b.y + 8 <= top || b.y - 8 >= bottom) continue;
        trip(state, b);
        if (state.dead) return;
      }
      for (const f of state.fish) {
        if (!f.taken && Math.abs(f.x - X) < 16 && Math.abs(f.y - (state.cy - 20)) < 22) { f.taken = true; state.fishN++; }
      }
    }
    if (state.cy > HEIGHT + 60) state.dead = true;
  }
  return {inputCount:3, rulesVersion, create, input, advance, score};
})();
if (typeof module !== 'undefined') module.exports = catRules;
