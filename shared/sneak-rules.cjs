const sneakRules = (() => {
  const levelCap = state => Math.min(state.lv, 10);
  const score = state => state.score;
  const between = (random, a, b) => a + random() * (b - a);
  const awayTime = (state, random) => between(random, Math.max(.65,2.4-state.lv*.24),
    Math.max(1.2,3.8-state.lv*.32));

  function resetStage(state, random) {
    Object.assign(state,{pr:0,ph:'away',pt:awayTime(state,random),fk:false,grace:0,hold:false,walk:0});
  }
  function create(random = Math.random) {
    const state = {lv:1,score:0,dead:false};
    resetStage(state,random);
    return state;
  }
  function input(state, action) {
    const hold = action === 0;
    if (hold === state.hold) return false;
    state.hold = hold;
    return true;
  }
  function nextPhase(state, random) {
    const level = state.lv;
    if (state.ph === 'away') {
      const direct = level >= 4 && random() < (level === 4 ? .15 : Math.min(.5,.3+(level-5)*.03));
      if (direct) {
        state.ph = 'look';
        state.pt = between(random,.9,1.5);
        state.grace = Math.max(.22,.34-.01*(level-4));
      } else {
        state.ph = 'warn';
        state.fk = level >= 3 && random() < .3;
        state.pt = Math.max(.25,.75-level*.09);
        state.grace = 0;
      }
    } else if (state.ph === 'warn' && !state.fk) {
      state.ph = 'look';
      state.pt = between(random,.8,1.3+level*.06);
      state.grace = Math.max(.12,.16-.003*level);
    } else {
      state.ph = 'away'; state.pt = awayTime(state,random); state.grace = 0;
    }
  }
  function advance(state, dt, random) {
    const caught = () => state.hold && state.ph === 'look' && state.grace <= 1e-8;
    while (dt > 1e-8 && !state.dead) {
      if (caught()) { state.dead = true; return 'caught'; }
      const speed = 100/(6+(levelCap(state)-1)*2);
      let step = Math.min(dt,state.pt);
      if (state.grace > 1e-8) step = Math.min(step,state.grace);
      if (state.hold) {
        step = Math.min(step,(100-state.pr)/speed);
        state.pr = Math.min(100,state.pr+speed*step);
        state.walk += step*12;
      }
      state.pt -= step; state.grace = Math.max(0,state.grace-step); dt -= step;
      if (state.pt <= 1e-8) nextPhase(state,random);
      if (caught()) { state.dead = true; return 'caught'; }
      if (state.pr >= 100-1e-8) {
        const completed = state.lv++;
        state.score++;
        resetStage(state,random);
        return completed;
      }
    }
  }
  return {inputCount:2, create, input, advance, levelCap, score};
})();
if (typeof module !== 'undefined') module.exports = sneakRules;
