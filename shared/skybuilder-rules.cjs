const skybuilderRules = (() => {
  const BH = 62, PX = 200, PY = 60, L = 140, BASE = 480;
  const points = {Perfect:100, Great:70, Good:50, Average:30, Poor:10};
  const rate = a => a<=4?'Perfect':a<=12?'Great':a<=24?'Good':a<=38?'Average':a<=56?'Poor':'Fail';
  const score = state => state.blocks.length - 1;
  const height = state => state.blocks.length * BH;
  function create() {
    return {blocks:[{lx:0}],tilt:0,td:0,cam:0,phs:0,sc:0,combo:0,drop:null,fall:null,
      wait:0,ph:'swing',msg:'',over:0,dead:false};
  }
  function hook(state) {
    const angle = Math.min(.82, .5 + state.blocks.length * .02) * Math.sin(state.phs);
    return {x:PX + L * Math.sin(angle), y:PY + L * Math.cos(angle)};
  }
  function input(state) {
    if (state.ph !== 'swing' || state.dead) return false;
    const position = hook(state);
    state.drop = {x:position.x,y:position.y+10,vy:80,sp:state.blocks.length};
    state.ph = 'drop';
    return true;
  }
  function land(state, topX, topH, topY, sin, cos) {
    const x = state.drop.x, delta = x - topX, result = rate(Math.abs(delta));
    state.drop = null;
    if (result === 'Fail') {
      const sign = delta > 0 ? 1 : -1;
      state.fall = {x,y:topY-BH,vx:sign*170,vy:-140,rot:0,sg:sign,i:state.blocks.length};
      state.ph = 'fail'; state.msg = 'fail'; state.combo = 0; state.over = 1.1;
    } else {
      state.blocks.push({lx:(x-PX)*cos-topH*sin});
      if (result === 'Perfect') {
        state.tilt -= Math.sign(state.tilt) * Math.min(Math.abs(state.tilt),4);
        state.combo++;
      } else {
        state.tilt += delta * .34;
        if (result === 'Great') state.tilt -= Math.sign(state.tilt) * Math.min(Math.abs(state.tilt),1.5);
        state.combo = 0;
      }
      state.sc += points[result] + (result === 'Perfect' ? 25 * Math.max(0,state.combo-1) : 0);
      if (Math.abs(state.tilt) > 45) {
        state.tilt = Math.sign(state.tilt) * 115;
        state.ph = 'collapse'; state.msg = 'collapse'; state.over = 1.7;
      } else {
        state.ph = 'wait'; state.wait = .4;
      }
    }
    return {x,y:topY,result};
  }
  function advance(state, dt, _random, active = true) {
    if (active) state.phs += Math.min(3.3,1.6+state.blocks.length*.07)*dt;
    state.cam += (Math.max(0,height(state)-150)-state.cam)*Math.min(1,dt*4);
    state.td += (state.tilt-state.td)*Math.min(1,dt*(state.ph==='collapse'?2.2:5));
    if (!active) return;
    if (state.ph === 'wait') {
      state.wait -= dt;
      if (state.wait <= 0) state.ph = 'swing';
    }
    let event;
    if (state.ph === 'drop') {
      state.drop.vy += 3200*dt;
      state.drop.y += state.drop.vy*dt;
      const top = state.blocks[state.blocks.length-1], radians = state.td*Math.PI/180;
      const sin = Math.sin(radians), cos = Math.cos(radians), h = height(state);
      const x = PX+top.lx*cos+h*sin, topH = h*cos-top.lx*sin, y = BASE+state.cam-topH;
      if (state.drop.y+BH >= y) event = land(state,x,topH,y,sin,cos);
    }
    if (state.ph === 'fail') {
      state.fall.vy += 2600*dt; state.fall.x += state.fall.vx*dt;
      state.fall.y += state.fall.vy*dt; state.fall.rot += state.fall.sg*5*dt;
    }
    if (state.ph === 'fail' || state.ph === 'collapse') {
      state.over -= dt;
      if (state.over <= 0) state.dead = true;
    }
    return event;
  }
  return {inputCount:1, create, input, advance, score, height, hook};
})();
if (typeof module !== 'undefined') module.exports = skybuilderRules;
