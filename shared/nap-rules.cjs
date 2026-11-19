const napRules = (() => {
const CONFIG = {
W:400, H:560,
hearts:3, heartRestore:[4,7],           // 考績（命）；第 4、7 關開始時回 1 顆
sleep:{ base:8, max:20, depthTime:3.0, wakeBase:0.15, wakeDepth:0.15 },
stunSleepMult:1.5,                       // 主管暈倒時睡意再 ×1.5
catchPenaltyFrac:0.25, catchLock:1.0, catchWatchLeft:0.8,
trash:{ max:5, startAmmo:2, cooldown:0.4, flight:0.3, pose:0.3, dmg:1 },
hitHurry:0.8, hitHurryMin:0.35,          // 每被砸中一次，主管提早 0.8 秒回頭（下限 0.35 秒）
doubleWarnMul:0.7, doubleWarnMin:0.4,    // 回馬槍的預警時間
introTime:1.8, clearTime:1.4, firstPatrolGrace:2.0, endLock:0.6,
bossX:{min:60,max:340},
score:{ perLevel:100, perHeart:50, timeBase:90, perSec:5 },
levels:[
  {goal:100,warn:1.10,watch:[0.9,1.3],walk:[3.5,5.5],speed:45, hp:2,stun:5.0,fake:0,   dbl:0,   regen:2.0},
  {goal:110,warn:1.00,watch:[1.0,1.4],walk:[3.0,5.0],speed:55, hp:2,stun:5.0,fake:0,   dbl:0,   regen:2.0},
  {goal:120,warn:0.92,watch:[1.0,1.5],walk:[2.8,4.6],speed:65, hp:3,stun:4.8,fake:0.2, dbl:0,   regen:2.2},
  {goal:130,warn:0.85,watch:[1.1,1.6],walk:[2.6,4.2],speed:75, hp:3,stun:4.6,fake:0.2, dbl:0,   regen:2.2},
  {goal:140,warn:0.78,watch:[1.1,1.7],walk:[2.4,4.0],speed:85, hp:3,stun:4.4,fake:0.25,dbl:0.2, regen:2.4},
  {goal:150,warn:0.72,watch:[1.2,1.8],walk:[2.2,3.6],speed:95, hp:4,stun:4.2,fake:0.25,dbl:0.2, regen:2.4},
  {goal:160,warn:0.67,watch:[1.2,1.9],walk:[2.0,3.4],speed:105,hp:4,stun:4.0,fake:0.3, dbl:0.25,regen:2.6},
  {goal:170,warn:0.62,watch:[1.3,2.0],walk:[1.8,3.0],speed:115,hp:4,stun:3.8,fake:0.3, dbl:0.25,regen:2.6},
  {goal:180,warn:0.58,watch:[1.3,2.1],walk:[1.6,2.8],speed:125,hp:5,stun:3.6,fake:0.35,dbl:0.3, regen:2.8},
  {goal:190,warn:0.55,watch:[1.4,2.2],walk:[1.4,2.6],speed:135,hp:5,stun:3.4,fake:0.35,dbl:0.3, regen:3.0}
]
};

function createGame(rng){
rng = rng || Math.random;
const C = CONFIG;
const rnd = (a)=> a[0] + rng()*(a[1]-a[0]);
const g = {
  cfg:C, state:'TITLE', lock:0, stateTimer:0, level:1, L:C.levels[0], score:0, best:0, newBest:false,
  hearts:C.hearts, sleepVal:0, depth:0, pose:'WORK', wakeTimer:0, wakeTotal:0.001, throwTimer:0, caughtLock:0,
  ammo:0, ammoTimer:0, throwCd:0, projectiles:[], events:[], levelTime:0, caughtTotal:0, endReason:'',
  boss:{x:200,dir:1,state:'PATROL',timer:0,hp:1,hpMax:1,isFake:false,angry:false,caught:false,doubleDone:false}
};
const emit = (type,o)=>{ const e=o||{}; e.type=type; g.events.push(e); };
const guilty = ()=> g.pose==='SLEEP' || g.pose==='WAKING' || g.pose==='THROW';

g.startRun = function(){
  g.level=1; g.hearts=C.hearts; g.score=0; g.newBest=false; g.caughtTotal=0; g.endReason='';
  beginLevel();
};
function beginLevel(){
  g.L = C.levels[g.level-1];
  g.sleepVal=0; g.depth=0; g.pose='WORK'; g.wakeTimer=0; g.throwTimer=0; g.caughtLock=0;
  g.ammo=C.trash.startAmmo; g.ammoTimer=0; g.throwCd=0; g.projectiles=[]; g.levelTime=0;
  const b=g.boss;
  b.x=200; b.dir=1; b.state='PATROL'; b.hp=b.hpMax=g.L.hp; b.isFake=false; b.angry=false; b.caught=false; b.doubleDone=false;
  b.timer=C.firstPatrolGrace+rnd(g.L.walk);
  if(C.heartRestore.indexOf(g.level)>=0 && g.hearts<C.hearts){ g.hearts++; emit('heal'); }
  g.state='INTRO'; g.stateTimer=C.introTime;
  emit('intro',{level:g.level});
}
function finish(win){
  g.state = win?'WIN':'OVER'; g.lock=C.endLock;
  if(g.score>g.best){ g.best=g.score; g.newBest=true; }
  emit(win?'win':'over');
}
g.canTap = ()=> g.lock<=0;

function startWarn(angry, dur, noFake){
  const b=g.boss; b.state='WARN'; b.angry=angry; b.timer=dur;
  b.isFake = (!angry && !noFake && rng()<g.L.fake);
  b.caught=false; emit('warn',{angry:angry});
}
function startWatch(){
  const b=g.boss; b.state='WATCH'; b.timer=rnd(g.L.watch); b.caught=false; emit('watch');
}
function backToPatrol(){
  const b=g.boss; b.state='PATROL'; b.timer=rnd(g.L.walk); b.angry=false; b.isFake=false;
}
function updateBoss(dt){
  const b=g.boss, L=g.L;
  if(b.state==='PATROL'){
    b.x += b.dir*L.speed*dt;
    if(b.x>C.bossX.max){ b.x=C.bossX.max; b.dir=-1; }
    if(b.x<C.bossX.min){ b.x=C.bossX.min; b.dir=1; }
    b.timer-=dt;
    if(b.timer<=0) startWarn(false, L.warn, false);
  } else if(b.state==='WARN'){
    b.timer-=dt;
    if(b.timer<=0){
      if(b.isFake){ emit('fake'); backToPatrol(); }
      else startWatch();
    }
  } else if(b.state==='WATCH'){
    b.timer-=dt;
    if(b.timer<=0){
      if(!b.doubleDone && rng()<L.dbl){
        b.doubleDone=true;
        startWarn(false, Math.max(C.doubleWarnMin, L.warn*C.doubleWarnMul), true);
      } else { b.doubleDone=false; backToPatrol(); }
    }
  } else if(b.state==='STUN'){
    b.timer-=dt;
    if(b.timer<=0){ b.hp=b.hpMax; backToPatrol(); emit('recover'); }
  }
}
function hitBoss(){
  const b=g.boss;
  if(b.state==='STUN'){ emit('wasted',{x:b.x}); return; }
  b.hp-=C.trash.dmg; emit('hit',{x:b.x,hp:b.hp});
  if(b.hp<=0){ b.hp=0; b.state='STUN'; b.timer=g.L.stun; b.isFake=false; b.angry=false; emit('ko',{x:b.x}); }
  else if(b.state==='PATROL'){ b.timer=Math.max(C.hitHurryMin, b.timer-C.hitHurry); }
}
function tryThrow(){
  const b=g.boss;
  if(b.state==='STUN' || g.ammo<1 || g.throwCd>0 || g.caughtLock>0) return;
  g.ammo--; g.throwCd=C.trash.cooldown; g.throwTimer=C.trash.pose; g.pose='THROW'; g.depth=0; g.wakeTimer=0;
  g.projectiles.push({t:0}); emit('throw');
}
function caught(){
  const b=g.boss;
  b.caught=true; g.hearts--; g.caughtTotal++;
  g.sleepVal=Math.max(0, g.sleepVal - g.L.goal*C.catchPenaltyFrac);
  g.caughtLock=C.catchLock; g.pose='WORK'; g.depth=0; g.wakeTimer=0; g.throwTimer=0;
  b.timer=Math.min(b.timer, C.catchWatchLeft);
  emit('caught',{hearts:g.hearts});
  if(g.hearts<=0){ g.endReason='fired'; finish(false); }
}
function step(dt,input){
  const T=C.trash, S=C.sleep, b=g.boss;
  g.levelTime+=dt;
  g.throwCd-=dt; g.caughtLock-=dt; g.throwTimer-=dt; g.wakeTimer-=dt;
  if(g.ammo<T.max){ g.ammoTimer+=dt; if(g.ammoTimer>=g.L.regen){ g.ammo++; g.ammoTimer=0; } } else g.ammoTimer=0;
  if(input.throwEdge) tryThrow();
  // 姿勢
  if(g.caughtLock>0){ g.pose='WORK'; g.depth=0; }
  else if(g.throwTimer>0){ g.pose='THROW'; g.depth=0; }
  else if(input.sleep){ g.pose='SLEEP'; g.depth=Math.min(1,g.depth+dt/S.depthTime); }
  else if(g.pose==='SLEEP'){ g.wakeTotal=S.wakeBase+S.wakeDepth*g.depth; g.wakeTimer=g.wakeTotal; g.pose='WAKING'; g.depth=0; }
  else if(g.pose==='THROW'){ g.pose='WORK'; }
  else if(g.pose==='WAKING' && g.wakeTimer<=0){ g.pose='WORK'; }
  // 睡意
  if(g.pose==='SLEEP'){
    const rate=(S.base+(S.max-S.base)*g.depth)*(b.state==='STUN'?C.stunSleepMult:1);
    g.sleepVal+=rate*dt;
  }
  updateBoss(dt);
  for(let i=g.projectiles.length-1;i>=0;i--){
    const p=g.projectiles[i]; p.t+=dt;
    if(p.t>=T.flight){ g.projectiles.splice(i,1); hitBoss(); }
  }
  if(b.state==='WATCH' && !b.caught && guilty()) caught();
  if(g.state!=='PLAY') return;
  if(g.sleepVal>=g.L.goal){
    g.sleepVal=g.L.goal;
    const sc=C.score;
    const bonus=sc.perLevel*g.level + sc.perHeart*g.hearts + Math.max(0,Math.floor(sc.timeBase-g.levelTime))*sc.perSec;
    g.score+=bonus; g.state='CLEAR'; g.stateTimer=C.clearTime; emit('clear',{bonus:bonus});
  }
}
g.update = function(dt,input){
  input=input||{};
  if(g.lock>0) g.lock-=dt;
  if(g.state==='INTRO'){ g.stateTimer-=dt; if(g.stateTimer<=0) g.state='PLAY'; }
  else if(g.state==='PLAY'){ step(dt,input); }
  else if(g.state==='CLEAR'){
    g.stateTimer-=dt;
    if(g.stateTimer<=0){
      if(g.level>=C.levels.length) finish(true);
      else { g.level++; beginLevel(); }
    }
  }
};
return g;
}


function create(random) {
  const state=createGame(random);
  state.startRun();
  state.held=false;
  state.throwPending=false;
  Object.defineProperty(state,'dead',{get:()=>state.state==='WIN'||state.state==='OVER'});
  return state;
}
function input(state,code) {
  if(state.dead)return false;
  if(code===2){if(state.throwPending)return false;state.throwPending=true;return true;}
  if(code!==0&&code!==1||state.held===(code===0))return false;
  state.held=code===0;
  return true;
}
function advance(state,dt) {
  state.update(dt,{sleep:state.held,throwEdge:state.throwPending});
  state.throwPending=false;
}
return {createGame,create,input,advance,inputCount:3,score:state=>state.score};
})();
if(typeof module!=='undefined')module.exports=napRules;
