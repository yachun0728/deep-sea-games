const sneakRules = (() => {
  const levelCap = state => Math.min(state.lv, 10);
  const score = state => state.score;
  const rulesVersion = 5;
  const entrySpeed = 64;
  const entryDistance = state => state.version < 4 ? 0
    : state.version === 4 ? 180+(state.lv-1)*14
    : state.lv === 1 ? 0 : 180+(state.lv-2)*18;
  const bossWalkTime = state => Math.max(1.15,1.85-(state.lv-3)*.045);
  function bossWalk(state) {
    if (state.ph !== 'leave' && state.ph !== 'return') return null;
    const progress = Math.min(1, Math.max(0, 1-state.pt/bossWalkTime(state)));
    return {progress, leaving:state.ph === 'leave'};
  }
  const inHallway = state => state.entry < entryDistance(state);
  const routeProgress = state => 100*(state.entry+state.pr*3.4)/(entryDistance(state)+340);
  const WALK_CHECKPOINTS = [[], [35], [28, 66], [22, 49, 75], [18, 46, 79], [27, 53, 82]];
  const PATROLS = [
    {cover:[[43,54]], patrol:[35,81], period:9},
    {cover:[[18,30],[64,76]], patrol:[24,87], period:10},
    {cover:[[30,42],[72,86]], patrol:[52,92], period:7},
  ];
  const EMPTY_ROUTE = {cover:[],patrol:null};
  const COVER_ROUTE = {cover:[[30,42],[63,75]],patrol:null};
  const stageLayout = state => state.version < 3 || state.lv < 5 ? EMPTY_ROUTE
    : state.lv < 8 ? COVER_ROUTE
    : state.lv < 12 ? PATROLS[1]
    : PATROLS[(state.lv-12)%PATROLS.length];
  const inCover = state => stageLayout(state).cover.some(([left,right]) => state.pr >= left && state.pr <= right);
  function guard(state) {
    const layout = stageLayout(state);
    if (!layout.patrol || inHallway(state)) return null;
    const leg = state.clock % layout.period / (layout.period/2);
    const direction = leg < 1 ? 1 : -1;
    const phase = leg % 1;
    const [left,right] = layout.patrol;
    const x = left+(right-left)*(direction === 1 ? phase : 1-phase);
    const distance = (state.pr-x)*direction;
    const active = phase >= .12;
    return {x,direction,active,near:distance >= -3 && distance <= 28,
      watching:active && distance >= -1 && distance <= 15};
  }
  const APPROACH = .95, PASSING = .65, LEAVING = .55;
  const visitorDuration = APPROACH + PASSING + LEAVING;
  const travelTime = state => state.version === 1 ? 6 + (levelCap(state)-1)*2
    : state.lv === 1 ? 6 : 11 + Math.min(5,state.lv-2)*4 + Math.max(0,state.lv-7);
  const fullTravelTime = state => travelTime(state)+entryDistance(state)/entrySpeed;
  const checkpoints = state => {
    if (state.version === 1) return WALK_CHECKPOINTS[0];
    if (state.version >= 3 && state.lv >= 12 && (state.lv-12)%3 === 1) return [18,39,60,83];
    const index = state.lv < 4 ? state.lv-1 : 3+(state.lv-4)%3;
    return WALK_CHECKPOINTS[index];
  };
  const visitorApproaching = state => state.visitor !== null && state.visitor.age < APPROACH;
  const visitorWatching = state => state.visitor !== null && state.visitor.age >= APPROACH && state.visitor.age < APPROACH+PASSING;
  const between = (random, a, b) => a + random() * (b - a);
  const awayTime = (state, random) => between(random, Math.max(.65,2.4-state.lv*.24),
    Math.max(1.2,3.8-state.lv*.32));

  function resetStage(state, random) {
    Object.assign(state,{pr:0,ph:'away',pt:awayTime(state,random),fk:false,grace:0,hold:false,walk:0,visitor:null,visitorIndex:0,caughtBy:null,clock:0,entry:0,bossLooks:0});
    if (state.version >= 5 && state.lv >= 3) {
      state.ph = 'return';
      state.pt = bossWalkTime(state);
    }
  }
  function create(random = Math.random, version = rulesVersion, startLevel = 1) {
    const state = {lv:startLevel,score:0,dead:false,version};
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
    if (state.ph === 'leave') {
      state.ph = 'return';
      state.pt = bossWalkTime(state);
    } else if (state.ph === 'return') {
      state.ph = 'warn';
      state.pt = Math.max(.5,.8-level*.035);
      state.fk = false;
    } else if (state.ph === 'away') {
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
    } else if (state.version >= 5 && level >= 5 && state.ph === 'look' && ++state.bossLooks % 2 === 0) {
      state.ph = 'leave';
      state.pt = bossWalkTime(state);
      state.grace = 0;
    } else {
      state.ph = 'away'; state.pt = awayTime(state,random); state.grace = 0;
    }
  }
  function advance(state, dt, random) {
    if (!state.dead && inHallway(state)) {
      if (!state.hold) return;
      const distance = entryDistance(state);
      const travel = Math.min(dt, (distance-state.entry)/entrySpeed);
      state.entry = Math.min(distance,state.entry+travel*entrySpeed);
      if (distance-state.entry < 1e-8) state.entry = distance;
      dt -= travel;
      if (dt <= 1e-8) return;
    }
    const caught = () => {
      if (!state.hold) return false;
      if (visitorWatching(state)) state.caughtBy = 'visitor';
      else if (guard(state)?.watching) state.caughtBy = 'guard';
      else if (state.ph === 'look' && state.grace <= 1e-8 && !inCover(state)) state.caughtBy = 'boss';
      return state.caughtBy !== null;
    };
    const route = checkpoints(state);
    while (dt > 1e-8 && !state.dead) {
      if (caught()) { state.dead = true; return 'caught'; }
      const speed = 100/travelTime(state);
      const checkpoint = route[state.visitorIndex];
      if (!state.visitor && state.pr >= checkpoint-1e-8) {
        state.visitor = {checkpoint,age:0,index:state.visitorIndex++};
      }
      const visitor = state.visitor;
      const boundary = visitor && (visitor.age < APPROACH ? APPROACH :
        visitor.age < APPROACH+PASSING ? APPROACH+PASSING : visitorDuration);
      let step = Math.min(dt,state.pt);
      if (visitor) step = Math.min(step,boundary-visitor.age);
      else if (state.hold && checkpoint !== undefined) step = Math.min(step,(checkpoint-state.pr)/speed);
      if (state.grace > 1e-8) step = Math.min(step,state.grace);
      if (state.hold) {
        step = Math.min(step,(100-state.pr)/speed);
        state.pr = Math.min(100,state.pr+speed*step);
        state.walk += step*12;
      }
      if (visitor) {
        visitor.age = Math.min(boundary,visitor.age+step);
        if (boundary-visitor.age < 1e-8) visitor.age = boundary;
        if (visitor.age === visitorDuration) state.visitor = null;
      }
      state.clock += step;
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
  return {rulesVersion, inputCount:2, create, input, advance, levelCap, score, travelTime, visitorApproaching, visitorWatching, visitorDuration, stageLayout, inCover, guard, entryDistance, inHallway, routeProgress, fullTravelTime, bossWalk};
})();
if (typeof module !== 'undefined') module.exports = sneakRules;
