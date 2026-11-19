const carpRules = (() => {
  const W = 400, GY = 430, PXL = 110, WW = 54;
  function create(random = Math.random) {
    return {random, dist:0, py:GY, vy:0, on:true, hold:false, ch:0, obs:[],
      nextAt:420, cleared:0, fx:[], dead:null};
  }
  function input(state, action) {
    if (state.dead) return false;
    if (action === 0 && state.on && !state.hold) {
      state.hold = true;
      state.ch = 0;
      return true;
    }
    if (!state.hold) return false;
    if (action === 1) {
      state.hold = false;
      state.vy = -Math.sqrt(2 * 2200 * (40 + 170 * state.ch));
      state.on = false;
      return true;
    }
    if (action === 2) {
      state.hold = false;
      state.ch = 0;
      return true;
    }
    return false;
  }
  function advance(s, dt) {
    const speed = 280 + Math.min(120, s.cleared * 3);
    s.dist += speed * dt;
    if (s.dist >= s.nextAt) {
      const heights = s.cleared < 4 ? [60, 110] : [60, 110, 160];
      const h = heights[Math.floor(s.random() * heights.length)];
      s.obs.push({x:W+50,h,hb:h+130-Math.min(40,s.cleared*2),d:0});
      s.nextAt = s.dist + 400 + s.random() * 100;
    }
    if (s.hold) s.ch = Math.min(1, s.ch + dt / .9);
    s.vy += 2200 * dt;
    s.py += s.vy * dt;
    if (s.py >= GY) {
      if (!s.on) s.fx.push({s:'~',x:PXL,y:GY-10,t:0});
      s.py = GY;
      s.vy = 0;
      s.on = true;
    } else {
      s.on = false;
    }
    for (const obstacle of s.obs) {
      obstacle.x -= speed * dt;
      if (PXL+14 > obstacle.x && PXL-14 < obstacle.x+WW && s.py > GY-obstacle.h) {
        s.dead = 'hit';
        return;
      }
      if (Math.abs(PXL-(obstacle.x+WW/2)) < 22 && s.py-28 < GY-obstacle.hb) {
        s.dead = 'hook';
        return;
      }
      if (!obstacle.d && obstacle.x+WW < PXL-14) {
        obstacle.d = 1;
        s.cleared++;
        s.fx.push({s:'+1',x:PXL,y:s.py-50,t:0});
      }
    }
    s.obs = s.obs.filter(obstacle => obstacle.x > -90);
    for (const effect of s.fx) effect.t += dt;
    s.fx = s.fx.filter(effect => effect.t < .8);
  }
  return {GY,PXL,WW,inputCount:3,create,input,advance,score: state => state.cleared};
})();
if (typeof module !== 'undefined') module.exports = carpRules;
