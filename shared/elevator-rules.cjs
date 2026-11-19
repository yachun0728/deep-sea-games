const elevatorRules = (() => {
  const count = state => Math.min(30,10+2*(state.stage-1));
  function create(random = Math.random, event = () => {}, EQ = {stage:1,total:0}) {
  function eqRand(a,b){return a+random()*(b-a);}
  function eqFactor(){return Math.max(.3,1-.1*(EQ.stage-1));}
  function eqRest(i){return Math.max(.8,(eqRand(3.5,7.5)-i*.12)*eqFactor());}
  function eqLookChance(){return Math.min(.95,.7+.02*(EQ.stage-1));}

    function reset() {
      EQ.passed = 0;
      EQ.phase = 'waiting';
      EQ.moving = 0;
      EQ.dead = false;
      EQ.people = Array.from({length:count(EQ)}, (_, index) => ({index,state:'safe',time:eqRand(1.2,6.5)}));
    }
    function input(action) {
      if (action !== 0 || EQ.dead || EQ.phase !== 'waiting') return false;
      if (EQ.people.slice(EQ.passed).some(person => person.state === 'look')) {
        EQ.dead = true;
        return true;
      }
      EQ.phase = 'moving';
      EQ.duration = EQ.moving = .4 + EQ.passed * .012;
      return true;
    }
    // Process every gaze change and movement end in time order, even on a slow frame.
    function eqStep(dt){
      while(dt>1e-8&&!EQ.dead){
        var ahead=EQ.people.slice(EQ.passed),slice=dt;
        ahead.forEach(function(p){slice=Math.min(slice,Math.max(0,p.time));});
        if(EQ.phase==='moving')slice=Math.min(slice,EQ.moving);
        ahead.forEach(function(p){p.time-=slice;});if(EQ.phase==='moving')EQ.moving-=slice;dt-=slice;
        ahead.forEach(function(p){if(p.time>1e-8)return;
          if(p.state==='safe'){p.state='warn';p.time=eqRand(.18,1.3);}
          else if(p.state==='warn'){if(random()<eqLookChance()){p.state='look';p.time=eqRand(.4,.8);}else{p.state='safe';p.time=eqRest(p.index);}}
          else{p.state='safe';p.time=eqRest(p.index);}
        });
        if(EQ.phase==='moving'&&ahead.some(function(p){return p.state==='look';})){EQ.dead=true;event('caught');return;}
        if(EQ.phase==='moving'&&EQ.moving<=1e-8) {
          EQ.passed++;
          EQ.total++;
          EQ.phase='waiting';
          EQ.moving=0;
          event('passed');
          if (EQ.passed===count(EQ)) {
            EQ.stage++;
            reset();
            event('next');
            return;
          }
        }
      }
    }

    reset();
    EQ.advance = eqStep;
    EQ.input = input;
    return EQ;
  }
  return {inputCount:1, count, create, input:(state, action) => state.input(action),
    advance:(state, dt) => state.advance(dt), score:state => state.total};
})();
if (typeof module !== 'undefined') module.exports = elevatorRules;
