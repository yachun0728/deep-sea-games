  /* ---------- Nap Master: hold to sleep while the boss patrols; let go when "!" appears; thrown trash can knock the boss out ---------- */
  var napBusy=false,napStake=0,napSay=function(){};
  (function(){
// ===== 全部數值集中在這裡 =====
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

const c=$('np-canvas'),ctx=c.getContext('2d'),W=400,H=560;
const NAP_REWARD=1;                       // points credited each time a level is cleared (fixed milestone, no multiplier)
const BTN_SLEEP={x:10,y:482,w:250,h:68},BTN_THROW={x:270,y:482,w:120,h:68};
const FONT='"Noto Sans TC",system-ui,sans-serif';
let best=0;try{best=+localStorage.getItem('deep-sea-nap-best')||0}catch(e){}
let analytics=null,earned=0,st='ready',G=createGame(),why='',rec=false,tt=0,last=0;
const floats=[],pointers=new Map(),keys=new Set();
let throwEdge=false,shake=0,flashRed=0,flashWhite=0;
const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const sleepHeld=()=>{if(keys.has('sleep'))return true;for(const v of pointers.values())if(v==='sleep')return true;return false};
const clearInput=()=>{keys.clear();pointers.clear();throwEdge=false};
function say(text,kind){$('np-msg').textContent=text;$('np-msg').className='msg'+(kind?' '+kind:'')}
napSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 let hearts='';for(let i=0;i<G.cfg.hearts;i++)hearts+=i<G.hearts?'♥':'♡';
 setText('np-level','第 '+G.level+' 關');setText('np-hearts',hearts);setText('np-best',best+' 分');
 $('np-amount').disabled=napBusy;$('np-go').disabled=live;setText('np-go',live?'偷睡中 · 按住睡覺':st==='over'?'再玩一次':'開始偷睡');
}
function addFloat(x,y,text,color,size,life){floats.push({x:x,y:y,text:text,color:color,size:size||18,life:life||.9,max:life||.9})}
function end(win){
 if(st!=='run')return;
 st='over';why=win?'win':'fired';clearInput();
 const score=G.score;rec=score>best;
 if(rec){best=score;try{localStorage.setItem('deep-sea-nap-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:earned,stage:G.level});napBusy=false;save();renderAll();
 if(win)say('10 關全部睡過，主管毫不知情！本局共入帳 '+fmt(earned)+' 點。','win');
 else if(earned)say('被炒魷魚了。撐到第 '+G.level+' 關，本局共入帳 '+fmt(earned)+' 點。','win');
 else say('被炒魷魚了。第 1 關沒睡飽，這一局沒有額外成就獎勵。','lose');
 ui();
}
function handleEvents(){
 const ev=G.events.splice(0);
 for(const e of ev){
  switch(e.type){
   case 'fake':addFloat(G.boss.x,150,'…虛驚一場','#cfd8dc',14,1);break;
   case 'hit':addFloat(e.x,170,'-1','#ffeb3b',24,.7);break;
   case 'wasted':addFloat(e.x,170,'浪費了','#90a4ae',14,.8);break;
   case 'ko':addFloat(e.x,160,'暈倒！快睡！','#ffeb3b',22,1.2);if(!reduceMotion)flashWhite=.15;break;
   case 'recover':addFloat(G.boss.x,160,'主管醒了','#ef9a9a',16,1);break;
   case 'caught':addFloat(200,270,'被抓到！考績 -1','#ff5252',24,1.2);if(!reduceMotion){shake=.35;flashRed=.25}if(G.hearts>0)say('被抓到了！還剩 '+G.hearts+' 顆考績，睡意被扣掉一些。','lose');break;
   case 'heal':addFloat(200,100,'考績 +1','#80cbc4',18,1.2);break;
   case 'clear':
    earned+=NAP_REWARD;S.balance+=NAP_REWARD;save();renderAll();
    AN.progress(analytics,{stage:G.level,step:earned,score:G.score,bonus_points:NAP_REWARD});
    addFloat(200,200,'睡飽了！ +'+e.bonus,'#b39ddb',26,1.3);
    say('第 '+G.level+' 關睡飽了！+'+NAP_REWARD+' 點已入帳。','win');break;
   case 'intro':if(G.level>1)say('第 '+G.level+' 關：主管更難纏了。');break;
   case 'over':end(false);break;
   case 'win':end(true);break;
  }
 }
}
// ---- drawing helpers ----
function rrect(x,y,w,h,r,fill,stroke,lw){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||2;ctx.stroke()}}
function circ(x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||2;ctx.stroke()}}
function line(x1,y1,x2,y2,color,lw){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=lw||2;ctx.lineCap='round';ctx.stroke()}
function tx(s,x,y,size,color,align,bold,stroke){
 ctx.font=(bold?'800 ':'')+size+'px '+FONT;ctx.textAlign=align||'center';ctx.textBaseline='middle';
 if(stroke){ctx.lineWidth=3;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(s,x,y,W-20)}
 ctx.fillStyle=color;ctx.fillText(s,x,y,W-20)}
function drawBackground(){
  ctx.fillStyle='#cfd8dc'; ctx.fillRect(0,0,W,150);
  for(let i=0;i<3;i++){ const wx=28+i*128; rrect(wx,30,92,72,4,'#90caf9','#78909c',3); line(wx+46,30,wx+46,102,'#78909c',2); line(wx,66,wx+92,66,'#78909c',2); }
  ctx.fillStyle='#8d9aa6'; ctx.fillRect(0,150,W,340);
  ctx.fillStyle='rgba(0,0,0,0.06)'; for(let y=160;y<336;y+=22) ctx.fillRect(0,y,W,3);
  ctx.fillStyle='#78909c'; ctx.fillRect(0,146,W,6);
}
function drawBoss(t){
  const b=G.boss, st=b.state;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x,312,28,6,0,0,Math.PI*2); ctx.fill();
  ctx.translate(b.x,300);
  if(st==='STUN') ctx.rotate((b.dir>=0?1:-1)*Math.PI/2);
  const walking=(st==='PATROL'); const sw=walking?Math.sin(t*9):0; const bob=walking?-Math.abs(Math.sin(t*9))*2:0;
  ctx.translate(0,bob);
  rrect(-14+sw*5,-20,10,20,3,'#263238'); rrect(4-sw*5,-20,10,20,3,'#263238');
  rrect(-22,-82,44,64,8,'#37474f');
  rrect(-3,-78,6,34,2,'#d32f2f');
  line(-22,-72,-30,-44,'#37474f',8); line(22,-72,30,-44,'#37474f',8);
  circ(0,-100,17,(st==='WATCH'||(st==='WARN'&&b.angry))?'#f4a98a':'#f1c9a0','#c9966b',1.5);
  ctx.beginPath(); ctx.arc(0,-104,17,Math.PI,Math.PI*2); ctx.fillStyle='#3e2723'; ctx.fill();
  if(st==='PATROL'){
    circ(-6+b.dir*3,-100,3,'#fff'); circ(6+b.dir*3,-100,3,'#fff'); circ(-6+b.dir*5,-100,1.6,'#222'); circ(6+b.dir*5,-100,1.6,'#222');
    line(-5,-90,5,-90,'#6d4c41',2);
  } else if(st==='WARN'){
    circ(-6,-100,4.5,'#fff','#444',1); circ(6,-100,4.5,'#fff','#444',1); circ(-6,-98.5,2,'#222'); circ(6,-98.5,2,'#222');
    circ(0,-90,3,'#6d4c41');
    const sh=Math.sin(t*40)*1.5;
    tx(b.angry?'!!':'!',sh,-134,34,'#ff1744','center',true,'#fff');
  } else if(st==='WATCH'){
    circ(-6,-100,4.5,'#fff','#444',1); circ(6,-100,4.5,'#fff','#444',1); circ(-6,-98.5,2.2,'#b71c1c'); circ(6,-98.5,2.2,'#b71c1c');
    line(-12,-110,-3,-105,'#3e2723',3); line(12,-110,3,-105,'#3e2723',3);
    ctx.beginPath(); ctx.arc(0,-84,5,Math.PI*1.1,Math.PI*1.9); ctx.strokeStyle='#6d4c41'; ctx.lineWidth=2; ctx.stroke();
    circ(-6,-100,8,null,'#222',1.5); circ(6,-100,8,null,'#222',1.5);
  } else if(st==='STUN'){
    line(-9,-103,-3,-97,'#222',2); line(-3,-103,-9,-97,'#222',2); line(3,-103,9,-97,'#222',2); line(9,-103,3,-97,'#222',2);
    line(-4,-89,4,-89,'#6d4c41',2);
    for(let i=0;i<3;i++){ const a=t*5+i*2.09; tx('★',Math.cos(a)*18,-126+Math.sin(a)*5,14,'#ffeb3b','center',true); }
  }
  ctx.restore();
  // 血條與倒數
  if(st==='STUN'){
    tx('暈倒 '+Math.max(0,b.timer).toFixed(1)+'s',b.x,262,14,'#ffeb3b','center',true,'#000');
  } else {
    rrect(b.x-26,134,52,8,3,'#263238');
    if(b.hp>0) rrect(b.x-26,134,52*(b.hp/b.hpMax),8,3,'#ef5350');
    ctx.strokeStyle='#000'; ctx.lineWidth=1; ctx.strokeRect(b.x-26,134,52,8);
  }
}
function drawDesk(t){
  rrect(18,336,364,18,4,'#a1887f'); ctx.fillStyle='#8d6e63'; ctx.fillRect(22,354,356,116); ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(22,354,356,6);
  rrect(160,344,80,8,2,'#cfd8dc','#90a4ae',1);
  // 螢幕
  rrect(252,290,76,48,4,'#263238'); rrect(256,294,68,38,2,G.pose==='SLEEP'?'#37474f':'#4dd0e1');
  if(G.pose!=='SLEEP'){ for(let i=0;i<4;i++) line(260,300+i*8,260+40+((i*17)%20),300+i*8,'#e0f7fa',2); }
  else tx('Zzz',290,313,12,'#90a4ae','center',true);
  rrect(284,338,12,6,2,'#455a64');
  // 咖啡杯
  rrect(110,322,16,16,3,'#fff','#90a4ae',1); line(126,328,131,328,'#90a4ae',2);
  // 垃圾堆（彈藥）
  for(let i=0;i<G.ammo;i++){ const bx=44+(i%3)*17, by=332-Math.floor(i/3)*15; circ(bx,by,8,'#fafafa','#b0bec5',1.5); line(bx-4,by-2,bx+3,by+3,'#cfd8dc',1); }
}
function drawPlayer(t){
  const cx=200, p=G.pose, hot=(G.boss.state==='WARN'||G.boss.state==='WATCH');
  rrect(cx-34,300,68,40,12,'#455a64');                        // 椅背
  rrect(cx-30,316,60,30,10,'#5c6bc0');                         // 上半身
  if(p==='SLEEP'){
    rrect(cx-42,334,84,16,7,'#5c6bc0');
    circ(cx+6,328,19,'#f1c9a0','#c9966b',1.5);
    ctx.beginPath(); ctx.arc(cx+6,325,19,Math.PI*0.95,Math.PI*2.05); ctx.fillStyle='#3e2723'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx+0,331,4,0.1*Math.PI,0.9*Math.PI); ctx.strokeStyle='#4e342e'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+13,331,4,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
    circ(cx+8,342+Math.sin(t*3)*1,2.5,'#81d4fa');
    const d=G.depth; const zy=Math.sin(t*3);
    tx('Z',cx+30,306+zy*2,14+8*d,'#b39ddb','center',true,'#37474f');
    if(d>0.35) tx('z',cx+46,288-zy*2,12+6*d,'#b39ddb','center',true,'#37474f');
    if(d>0.7) tx('Z',cx+58,268+zy*2,18+8*d,'#ce93d8','center',true,'#37474f');
  } else {
    let hy=298;
    if(p==='WAKING'){ const k=1-Math.max(0,G.wakeTimer)/G.wakeTotal; hy=330-32*k; }
    circ(cx,hy,19,G.caughtLock>0?'#ef9a9a':'#f1c9a0','#c9966b',1.5);
    ctx.beginPath(); ctx.arc(cx,hy-3,19,Math.PI,Math.PI*2); ctx.fillStyle='#3e2723'; ctx.fill();
    if(p==='WAKING'){ line(cx-9,hy,cx-3,hy,'#4e342e',2); line(cx+3,hy,cx+9,hy,'#4e342e',2); circ(cx+14,hy+8,2.5,'#81d4fa'); }
    else { circ(cx-6,hy,3,'#fff','#444',1); circ(cx+6,hy,3,'#fff','#444',1); circ(cx-6,hy+1,1.4,'#222'); circ(cx+6,hy+1,1.4,'#222'); }
    if(hot&&p!=='WAKING') circ(cx+17,hy-8,2.5,'#81d4fa');
    ctx.beginPath(); ctx.arc(cx,hy+8,4,0.15*Math.PI,0.85*Math.PI); ctx.strokeStyle='#4e342e'; ctx.lineWidth=2; ctx.stroke();
    if(p==='THROW'){ line(cx+22,326,cx+44,296,'#5c6bc0',9); circ(cx+46,292,7,'#fafafa','#b0bec5',1.5); }
    else { const bt=Math.sin(t*14)*2; circ(cx-14,346+bt,5,'#f1c9a0'); circ(cx+14,346-bt,5,'#f1c9a0'); }
  }
}
function drawProjectiles(){
  const b=G.boss;
  for(const pr of G.projectiles){
    const u=Math.min(1,pr.t/G.cfg.trash.flight);
    const sx=246,sy=292, ex=b.x, ey=b.state==='STUN'?290:200;
    const x=sx+(ex-sx)*u, y=sy+(ey-sy)*u-46*Math.sin(Math.PI*u);
    circ(x,y,7,'#fafafa','#b0bec5',1.5);
  }
}
function drawHUD(){
  rrect(14,12,372,22,8,'#263238','#000',2);
  const k=Math.min(1,G.sleepVal/G.L.goal);
  if(k>0) rrect(14,12,Math.max(16,372*k),22,8,'#7e57c2');
  tx('睡意 '+Math.floor(G.sleepVal)+' / '+G.L.goal,200,23,13,'#fff','center',true,'#000');
  tx('考績',16,52,12,'#cfd8dc','left',true,'#000');
  for(let i=0;i<G.cfg.hearts;i++) tx('♥',62+i*22,52,22,i<G.hearts?'#ef5350':'#546e7a','center',true,'#000');
  tx('第 '+G.level+' 關',386,52,16,'#fff','right',true,'#000');
  tx('分數 '+G.score,200,52,12,'#cfd8dc','center',false,'#000');
}
function drawButtons(){
  const holding=sleepHeld();
  const sleepable=G.caughtLock<=0;
  rrect(BTN_SLEEP.x,BTN_SLEEP.y,BTN_SLEEP.w,BTN_SLEEP.h,16,sleepable?(holding?'#7e57c2':'#5e35b1'):'#455a64','#000',3);
  tx(sleepable?(holding?'睡著了… Zzz':'按住睡覺'):'被抓！冷靜中',BTN_SLEEP.x+BTN_SLEEP.w/2,BTN_SLEEP.y+30,24,'#fff','center',true);
  tx('空白鍵',BTN_SLEEP.x+BTN_SLEEP.w/2,BTN_SLEEP.y+54,11,'#d1c4e9');
  const can=G.ammo>0&&G.boss.state!=='STUN'&&G.caughtLock<=0;
  rrect(BTN_THROW.x,BTN_THROW.y,BTN_THROW.w,BTN_THROW.h,16,can?'#f9a825':'#6d5b4b','#000',3);
  tx('丟垃圾',BTN_THROW.x+BTN_THROW.w/2,BTN_THROW.y+26,22,can?'#3e2723':'#bcaaa4','center',true);
  for(let i=0;i<G.cfg.trash.max;i++) circ(BTN_THROW.x+18+i*21,BTN_THROW.y+52,7,i<G.ammo?'#fafafa':'#4e342e','#3e2723',1.5);
}
function tipFor(level){
  const tips={
    1:['按住「睡覺」累積睡意，睡越久睡越深、越快，但醒得也越慢','主管頭上冒出「!」就立刻放開，否則被抓','丟垃圾砸主管，血歸零會暈倒，暈倒時可以安心睡'],
    2:['主管走得更快了'],
    3:['小心：有時候「!」只是虛驚一場'],
    4:['垃圾丟太多次，主管會提早回頭'],
    5:['小心：看完一次，他可能又回頭瞪第二次（回馬槍）'],
    6:['垃圾補得更慢，丟之前先想清楚'],
    7:['主管幾乎不停走動了'],
    8:['預警越來越短，睡淺一點比較好逃'],
    9:['只剩一點點反應時間'],
    10:['最後一關。祝你好運。']
  };
  return tips[level]||[];
}
function drawOverlay(){
 if(st==='ready'){
  ctx.fillStyle='rgba(10,10,20,0.78)';ctx.fillRect(0,0,W,H);
  tx('偷睡大師',200,150,40,'#fff','center',true,'#5e35b1');
  tx('主管在巡邏，你只想睡一下',200,196,16,'#d1c4e9');
  tx('按住：睡覺（睡越久睡越深）',200,252,15,'#fff');
  tx('主管頭上冒出「!」：立刻放開！',200,278,15,'#ffeb3b');
  tx('丟垃圾：砸主管，血歸零就暈倒',200,304,15,'#fff');
  tx('睡意滿了就過關，共 10 關',200,330,15,'#fff');
  tx('空白鍵＝睡　J＝丟垃圾',200,366,13,'#90a4ae');
  tx('到操作區開始',200,430,22,'#ffd54f','center',true,'#000');
 }else if(st==='over'){
  ctx.fillStyle='rgba(10,10,20,0.82)';ctx.fillRect(0,0,W,H);
  if(why==='win'){tx('升職加薪！',200,140,38,'#ffd54f','center',true,'#000');tx('你睡過了 10 關，主管還是不知道。',200,190,15,'#fff')}
  else{tx('被炒魷魚',200,140,40,'#ff5252','center',true,'#000');tx('考績歸零，今天的午覺到此為止。',200,190,15,'#fff')}
  tx('撐到第 '+G.level+' 關',200,250,22,'#fff','center',true);
  tx('分數 '+G.score,200,288,22,'#ffd54f','center',true);
  tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'沒睡飽任何一關，沒有點數',200,322,18,earned>0?'#ffd54f':'#fff','center',true);
  if(rec)tx('新紀錄！',200,352,18,'#80cbc4','center',true);
  tx('到操作區再玩一次',200,430,20,'#ffd54f','center',true,'#000');
 }else if(G.state==='INTRO'){
  ctx.fillStyle='rgba(10,10,20,0.7)';ctx.fillRect(0,0,W,H);
  tx('第 '+G.level+' 關',200,170,44,'#fff','center',true,'#5e35b1');
  tx('睡意目標 '+G.L.goal,200,216,16,'#d1c4e9');
  const tp=tipFor(G.level);
  for(let i=0;i<tp.length;i++)tx(tp[i],200,276+i*28,i===0&&G.level>1?17:14,i===0?'#ffeb3b':'#fff');
 }else if(G.state==='CLEAR'){
  ctx.fillStyle='rgba(60,30,100,0.35)';ctx.fillRect(0,0,W,H);
  tx('睡飽了！ +'+NAP_REWARD+' 點',200,160,34,'#fff','center',true,'#5e35b1');
 }
}
function draw(dt){
 ctx.save();
 if(shake>0)ctx.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
 ctx.fillStyle='#37474f';ctx.fillRect(0,0,W,H);
 drawBackground();drawBoss(tt);drawProjectiles();drawDesk(tt);drawPlayer(tt);
 ctx.fillStyle='#37474f';ctx.fillRect(0,470,W,90);
 drawHUD();drawButtons();
 for(let i=floats.length-1;i>=0;i--){
  const f=floats[i];f.life-=dt;if(f.life<=0){floats.splice(i,1);continue}
  ctx.globalAlpha=Math.min(1,f.life/(f.max*.5));tx(f.text,f.x,f.y-(1-f.life/f.max)*30,f.size,f.color,'center',true,'#000');ctx.globalAlpha=1}
 ctx.restore();
 if(flashRed>0){ctx.fillStyle='rgba(255,0,0,'+(flashRed*1.6)+')';ctx.fillRect(0,0,W,H)}
 if(flashWhite>0){ctx.fillStyle='rgba(255,255,255,'+(flashWhite*3)+')';ctx.fillRect(0,0,W,H)}
 drawOverlay();
 shake=Math.max(0,shake-dt);flashRed=Math.max(0,flashRed-dt);flashWhite=Math.max(0,flashWhite-dt);
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('nap',amount);napStake=amount;napBusy=true;save();renderAll();
 G=createGame();G.startRun();earned=0;rec=false;why='';floats.length=0;clearInput();shake=0;flashRed=0;flashWhite=0;
 st='run';last=performance.now();say('開始偷睡！按住睡覺鍵累積睡意，看到「!」立刻放開。');ui();c.focus();
}
const shown=()=>!$('view-nap').hidden&&!document.hidden;
const toLocal=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}};
$('np-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'這一局已結算。按「再玩一次」開始新的一局。':'先按「開始偷睡」。');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 const p=toLocal(e);
 if(inRect(p,BTN_SLEEP))pointers.set(e.pointerId,'sleep');
 else if(inRect(p,BTN_THROW)){pointers.set(e.pointerId,'throw');throwEdge=true}
 else pointers.set(e.pointerId,'other')});
const endPointer=e=>{pointers.delete(e.pointerId)};
c.addEventListener('pointerup',endPointer);c.addEventListener('pointercancel',endPointer);c.addEventListener('lostpointercapture',endPointer);
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key===' '||e.key==='ArrowDown'){e.preventDefault();keys.add('sleep')}
 else if(e.key==='j'||e.key==='J'||e.key==='x'||e.key==='X'){e.preventDefault();if(!e.repeat)throwEdge=true}});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowDown')keys.delete('sleep')});
addEventListener('blur',()=>{clearInput();last=performance.now()});
document.addEventListener('visibilitychange',()=>{clearInput();last=performance.now()});
window.addEventListener('hashchange',()=>{clearInput();last=performance.now()});
function loop(t){
 const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;
 if(shown()){
  tt+=dt;
  if(st==='run'){const input={sleep:sleepHeld(),throwEdge:throwEdge};throwEdge=false;G.update(dt,input);handleEvents()}
  ui();draw(dt)}
 requestAnimationFrame(loop)}
ui();draw(0);requestAnimationFrame(loop);
  })();
