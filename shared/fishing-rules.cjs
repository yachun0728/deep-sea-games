const fishingRules = (() => {
  function create(random = Math.random, event = () => {}, state = {landed:0, clock:0}) {
    const hardness = () => Math.min(state.number, 20);
    const rand = (min, max) => min + random() * (max - min);
    function reset() {
      state.number = state.landed + 1;
      state.distance = state.start = 18 + hardness() * 2;
      state.tension = 45;
      state.slack = 0;
      state.mode = 'calm';
      state.timer = rand(2.1, 3.2);
      state.hold = state.dead = false;
    }
    function fiNextMode(){
      if(state.mode==='calm'){state.mode=random()<.18?'tired':'warn';state.timer=state.mode==='tired'?rand(1.4,2):Math.max(.28,.65-hardness()*.035);}
      else if(state.mode==='warn'){state.mode='struggle';state.timer=rand(.85,1.4)+hardness()*.045;}
      else if(state.mode==='struggle'){state.mode='tired';state.timer=rand(1.2,2.1);}
      else{state.mode='calm';state.timer=Math.max(.8,rand(1.8,3.1)-hardness()*.07);}
    }
    function fiStep(dt){
      // Small time slices preserve line-break and slack detection on delayed frames.
      while(dt>1e-8&&!state.dead){
        var step=Math.min(dt,.02,Math.max(0,state.timer));
        if(step<=1e-8){fiNextMode();continue;}
        var hard=hardness(),rate,drift;
        if(state.hold){rate=state.mode==='struggle'?34+hard*2:state.mode==='warn'?13+hard*.5:state.mode==='tired'?4+hard*.15:9+hard*.6;
          drift=state.mode==='struggle'?.5+hard*.05:state.mode==='warn'?-1.2:state.mode==='tired'?-3.1:-(2.2-hard*.025);
        }else{rate=state.mode==='struggle'?-8:state.mode==='tired'?-13:-11;drift=state.mode==='struggle'?1.45+hard*.07:state.mode==='tired'?.45:.75+hard*.06;}
        state.tension=Math.max(0,state.tension+rate*step);state.distance=Math.max(0,Math.min(state.start*1.8,state.distance+drift*step));state.clock+=step;state.timer-=step;dt-=step;
        state.slack=state.tension<=8?state.slack+step:0;
        if(state.tension>=100-1e-8){state.tension=100;state.dead=true;event('break');return;}
        if(state.slack>=1.2-1e-8){state.dead=true;event('slack');return;}
        if(state.distance<=1e-8){state.landed++;event('land');reset();event('next');return;}
        if(state.timer<=1e-8)fiNextMode();
      }
    }

    reset();
    state.advance = fiStep;
    return state;
  }
  function input(state, action) {
    if (state.dead || (action !== 0 && action !== 1) || state.hold === (action === 0)) return false;
    state.hold = action === 0;
    return true;
  }
  return {inputCount:2, create, input, advance:(state, dt) => state.advance(dt), score:state => state.landed};
})();
if (typeof module !== 'undefined') module.exports = fishingRules;
