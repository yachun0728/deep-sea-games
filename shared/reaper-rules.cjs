const reaperRules = (() => {
  const level = state => 1 + Math.floor(state.good / 10);
  const score = state => state.total;
  function difficulty(state) {
    const shift = level(state);
    state.speed = Math.min(300,110+12*shift);
    state.zone = Math.max(15,29-.9*(shift-1));
  }
  function create() {
    const state = {lives:3,total:0,good:0,resolved:0,spawned:0,ghosts:[],gap:.6,cd:0,dead:false};
    difficulty(state);
    return state;
  }
  function good(state, event) {
    state.good++;
    difficulty(state);
    return {kind:event,good:state.good,total:state.total,lives:state.lives};
  }
  function strike(state, reason) {
    state.lives--;
    state.dead = state.lives <= 0;
    return {kind:reason,lives:state.lives};
  }
  function input(state, _action, emit = () => {}) {
    if (state.dead || state.cd > 0) return false;
    state.cd = .35;
    let target = null;
    for (const ghost of state.ghosts) {
      const distance = Math.abs(ghost.x-200);
      if (!ghost.m && distance <= state.zone && (!target || distance < Math.abs(target.x-200))) {
        target = ghost;
      }
    }
    if (!target) return true;
    state.resolved++;
    state.ghosts = state.ghosts.filter(ghost => ghost !== target);
    if (target.d) emit(strike(state,'permit'));
    else {
      state.total++;
      emit({...good(state,'capture'),x:target.x});
    }
    return true;
  }
  function advance(state, dt, random, emit = () => {}) {
    state.cd = Math.max(0,state.cd-dt);
    state.gap -= dt;
    if (state.gap <= 0) {
      const shift = level(state);
      state.ghosts.push({x:-30,d:state.spawned>0&&random()<Math.min(.5,.18+shift*.012),m:false});
      state.spawned++;
      state.gap = Math.max(.5,1.1+random()*(1.7-1.1)-(shift-1)*.065);
    }
    for (const ghost of state.ghosts) {
      ghost.x += state.speed*dt;
      if (!ghost.m && ghost.x > 200+state.zone+10) {
        ghost.m = true;
        state.resolved++;
        emit(ghost.d ? good(state,'pass') : strike(state,'miss'));
        if (state.dead) return;
      }
    }
    state.ghosts = state.ghosts.filter(ghost => ghost.x<440);
  }
  return {inputCount:1, create, advance, input, level, score};
})();
if (typeof module !== 'undefined') module.exports = reaperRules;
