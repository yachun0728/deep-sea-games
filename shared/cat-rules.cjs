const catRules = (() => {
  const WIDTH = 400, HEIGHT = 560, X = 110, COYOTE = .14;
  const score = state => Math.floor(state.dist / 60);

  function fill(state, random) {
    const between = (a, b) => a + random() * (b - a);
    for (;;) {
      const roof = state.roofs[state.roofs.length - 1];
      if (roof.x + roof.w > WIDTH + 260) return;
      const distance = score(state), heightRange = Math.min(20, distance * .04);
      state.roofs.push({
        x: roof.x + roof.w + between(45, 40 + state.v * .34),
        w: between(Math.max(105, 170 - distance * .12), Math.max(180, 300 - distance * .3)),
        y: Math.max(340, Math.min(470, roof.y + between(-55 - heightRange, 45 + heightRange))),
        id: state.nid++,
      });
    }
  }

  function create(random = Math.random) {
    const state = {roofs:[{x:-60,w:400,y:430,id:0}],nid:1,cy:430,vy:0,on:true,offT:0,
      buf:0,hold:false,dist:0,v:190,sq:0,dead:false};
    fill(state, random);
    return state;
  }

  function input(state, action) {
    if (action === 1) {
      if (!state.hold) return false;
      state.hold = false;
      return true;
    }
    state.hold = true;
    if (state.on || state.offT < COYOTE) {
      state.vy = -600;
      state.on = false;
      state.offT = 1;
      state.sq = -.25;
    } else state.buf = .12;
    return true;
  }

  function advance(state, dt, random) {
    state.sq *= .86;
    state.v = Math.min(400, 190 + state.dist * .0035);
    state.dist += state.v * dt;
    for (const roof of state.roofs) roof.x -= state.v * dt;
    state.roofs = state.roofs.filter(roof => roof.x + roof.w > -80);
    fill(state, random);
    if (state.buf > 0) state.buf -= dt;
    const before = state.cy;
    state.vy += (state.hold && state.vy < 0 ? 1000 : 2100) * dt;
    state.cy += state.vy * dt;
    if (!state.on) state.offT += dt;
    let land = false;
    for (const roof of state.roofs) {
      if (X + 12 <= roof.x || X - 12 >= roof.x + roof.w) continue;
      if (state.vy >= 0 && before <= roof.y + 14 && state.cy >= roof.y) {
        state.cy = roof.y;
        state.vy = 0;
        land = true;
      } else if (state.cy > roof.y + 14) {
        state.dead = true;
        return;
      }
    }
    if (!land) state.on = false;
    else if (state.buf > 0) {
      state.vy = -600;
      state.buf = 0;
      state.sq = -.25;
      state.on = false;
      state.offT = 1;
    } else {
      if (!state.on) state.sq = .25;
      state.on = true;
      state.offT = 0;
    }
    if (state.cy > HEIGHT + 60) state.dead = true;
  }
  return {inputCount:2, create, input, advance, score};
})();
if (typeof module !== 'undefined') module.exports = catRules;
