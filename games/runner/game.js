  /* ---------- Dodge Run: endless lane dodging; milestone bonuses are credited to the shared wallet when reached ---------- */
  (function(){
const c=$('rn-canvas'),g=c.getContext('2d'),W=400,H=600,HOR=230,LW=130,F=5;
// Difficulty: speed climbs slowly, while the time between two rows (the window to change lanes) shrinks to a floor.
// Milestones are far apart; the curve and distances were calibrated with a noisy-player simulation (see GAME_RULES.md).
const MILESTONES=[[3500,3],[4500,7],[5500,15],[6500,30]],ENDLESS_FROM=6500,ENDLESS_STEP=1000,ENDLESS_BONUS=40;
const bonusAt=m=>{for(const t of MILESTONES)if(t[0]===m)return t[1];return m>ENDLESS_FROM&&(m-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0};
const nextMilestone=d=>{for(const t of MILESTONES)if(t[0]>d)return t;return [ENDLESS_FROM+(Math.floor((d-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]};
const prevMilestone=d=>{let p=0;for(const t of MILESTONES)if(t[0]<=d)p=t[0];if(d>=ENDLESS_FROM)p=ENDLESS_FROM+Math.floor((d-ENDLESS_FROM)/ENDLESS_STEP)*ENDLESS_STEP;return p};
let best=0;try{const n=Number(localStorage.getItem('chayne'));if(Number.isFinite(n))best=Math.max(0,n)}catch(e){}
const texts={best:'最佳',near:'擦身而過！',title:'深海潛行',tap:'開始挑戰',crash:'撞上障礙',rec:'新紀錄！',left:n=>'距離紀錄還差 '+n+' m'};const T=k=>texts[k];
let runnerAnalytics=null,earned=0,awarded=0,pops=[];
let st='ready',run=runnerRules.create(),flash=0,shake=0,last=0,lastD=0,rec=false;
let runRank=null, runPending=null, runStarting=false, runSending=false, runRandom=Math.random;
let runTicks=0, runCarry=0, runMoves=[];
function runStatus(text,retry){
 const status=$('rn-rank-status');
 status.hidden=!text;status.textContent=text;
 $('rn-rank-retry').hidden=!retry;
}
const perspective=z=>F/(F+z);
function note(text,kind=''){$('rn-msg').textContent=text;$('rn-msg').className='msg'+(kind?' '+kind:'')}
function remember(){lastD=Math.floor(run.dist);rec=lastD>best;if(rec){best=lastD;try{localStorage.setItem('chayne',best)}catch(e){}}}
function runnerUI(){
 const d=Math.floor(run.dist),nx=nextMilestone(d);
 $('rn-distance').textContent=d+' m';$('rn-best').textContent=best+' m';$('rn-next').textContent=nx[0]+' m · +'+nx[1];$('rn-speed').textContent=(run.v/20).toFixed(1)+'×';
 $('rn-go').disabled=st==='run'||runStarting||runSending;$('rn-go').textContent=st==='run'?'潛行中 · 只需左右換道':'開始潛行';
 document.querySelectorAll('[data-run]').forEach(b=>b.disabled=st!=='run');
}
function award(m,b){
 earned+=b;S.balance+=b;save();renderAll();
 AN.progress(runnerAnalytics,{step:m,distance:m,bonus_points:b});
 pops.push({m:m,b:b,age:0});if(pops.length>3)pops.shift();
 note('到達 '+m+' 公尺！獎勵 +'+b+' 點已入帳，本局累計 +'+earned+' 點。','win');
}
function beginRun(ranked){
 runRank=ranked;run=runnerRules.create();runRandom=ranked?runnerRules.seeded(ranked.state.seed):Math.random;
 runTicks=0;runCarry=0;runMoves=[];
 runnerAnalytics=AN.start('runner',ENTRY_FEE);save();renderAll();
 flash=0;shake=0;earned=0;awarded=0;pops=[];rec=false;st='run';runnerBusy=true;last=performance.now();
 note('出發！左右換道避開障礙，沒有終點，越跑越快。');runnerUI();c.focus();
}
async function start(){
 if(st==='run'||runStarting||runSending)return;
 if(S.balance<ENTRY_FEE){note(LOW_MSG,'lose');return;}
 runPending=null;
 if(typeof location==='undefined'||location.protocol==='file:'){beginRun(null);return}
 runStarting=true;
 runStatus('正在準備訪客排行…');
 runnerUI();
 let ranked=null;
 try{
  const api=await import('./frontend/services/api.mjs');
  ranked=await api.startBoardRound('runner',AbortSignal.timeout(4000));
 }catch{}
 runStarting=false;
 if($('view-runner').hidden){runStatus('');runnerUI();return}
 runStatus(ranked?'本局將列入訪客排行。':'這一局可在本機遊玩。');
 beginRun(ranked);
}
async function sendRun(){
 if(!runPending||runSending)return;
 runSending=true;
 runStatus('正在驗證排行榜成績…');
 runnerUI();
 try{
  const api=await import('./frontend/services/api.mjs');
  const result=await api.moveBoardRound(runRank.token,runPending,AbortSignal.timeout(10000));
  runPending=null;
  runStatus(result.state.distance===lastD?'成績已送到排行榜。':'排行榜成績未能送出。');
 }catch(error){
  if(error.retryable===false)runPending=null;
  runStatus('排行榜成績未能送出。',!!runPending);
 }finally{
  runSending=false;
  runnerUI();
 }
}
function die(){
 if(st!=='run')return;
 AN.end(runnerAnalytics,earned,earned>0?'complete':'loss',{distance:Math.floor(run.dist)});
 st='dead';runnerBusy=false;shake=reduceMotion?0:.4;remember();save();renderAll();
 if(!earned)note('撞上障礙，跑了 '+lastD+' 公尺，這一局沒有獎勵。','lose');
 else note('撞上障礙，跑了 '+lastD+' 公尺，本局共入帳 '+fmt(earned)+' 點。','win');
 if(runRank){
  runPending={id:runRank.id,gameId:'runner',revision:runRank.revision,action:[runTicks,...runMoves]};
  sendRun();
 }
 runnerUI();
}
function update(dt){
 pops.forEach(p=>{p.age+=dt});pops=pops.filter(p=>p.age<2.2);
 if($('view-runner').hidden||document.hidden||st!=='run')return;
 runnerRules.step(run,dt,runRandom);
 flash-=dt;if(run.near)flash=.8;
 const reached=Math.floor(run.dist);
 while(awarded<reached){awarded++;const b=bonusAt(awarded);if(b)award(awarded,b)}
 if(run.dead)die();
}
function draw(){
const camH=0,ox=shake>0?(Math.random()-.5)*14:0;
const X=(l,z)=>W/2+(l-run.px)*LW*perspective(z),Y=z=>HOR+(220+camH)*perspective(z);
const quad=(a,b,l0,l1,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(X(l0,a),Y(a));g.lineTo(X(l1,a),Y(a));g.lineTo(X(l1,b),Y(b));g.lineTo(X(l0,b),Y(b));g.closePath();g.fill()};
g.save();g.translate(ox,0);
g.fillStyle='#0a2a3b';g.fillRect(-20,0,W+40,HOR);
g.fillStyle='#051620';g.fillRect(-20,HOR,W+40,H-HOR);
const off=run.dist%16;
for(let i=13;i>=-1;i--){
let z0=i*8-off,z1=z0+8;if(z1<=-2)continue;if(z0<-2)z0=-2;
const wd=run.dist+z0,gold=best>0&&Math.abs(wd+4-best)<5;
quad(z0,z1,-1.5,1.5,gold?'#ffb638':(Math.floor(wd/8)%2?'#113041':'#0c2230'));
if(!gold&&Math.floor(wd/8)%2){quad(z0,z1,-.53,-.47,'#214658');quad(z0,z1,.47,.53,'#214658')}}
quad(-2,100,-1.58,-1.5,'#62e6d2');quad(-2,100,1.5,1.58,'#62e6d2');
const cols={block:'#ff6f61',low:'#ffb638',high:'#62e6d2'};
run.obs.slice().sort((a,b)=>b.z-a.z).forEach(o=>{
if(o.z<-1.5)return;
const s=perspective(o.z),cx=X(o.l,o.z),by=Y(o.z),w=112*s;
g.globalAlpha=Math.max(0,Math.min(1,(95-o.z)/40));
g.fillStyle=cols[o.t];
if(o.t==='block')g.fillRect(cx-w/2,by-130*s,w,130*s);
else if(o.t==='low')g.fillRect(cx-w/2,by-38*s,w,38*s);
else g.fillRect(cx-w/2,by-110*s,w,50*s);
g.globalAlpha=1});
g.restore();
const d=Math.floor(run.dist),nx=nextMilestone(d),pv=prevMilestone(d);
g.fillStyle='#e4f2f3';g.font='600 20px system-ui,sans-serif';g.textAlign='left';g.fillText(d+' m',16,32);
g.textAlign='right';g.fillText(T('best')+' '+best+' m',W-16,32);
g.fillStyle='#214658';g.fillRect(16,44,W-32,6);g.fillStyle='#62e6d2';g.fillRect(16,44,(W-32)*Math.max(0,Math.min(1,(run.dist-pv)/(nx[0]-pv))),6);
if(st==='run'){g.textAlign='center';g.fillStyle='#8db0b9';g.font='13px system-ui,sans-serif';g.fillText('下一個獎勵 '+nx[0]+' m · +'+nx[1]+' 點',W/2,70)}
g.textAlign='left';g.fillStyle=earned>0?'#ffb638':'#8db0b9';g.font='600 14px system-ui,sans-serif';g.fillText('本局 +'+earned+' 點',16,70);
if(flash>0&&st==='run'){g.textAlign='center';g.fillStyle='#e4f2f3';g.font='600 26px system-ui,sans-serif';g.fillText(T('near'),W/2,118)}
pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/2.2);const y=190-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#ffb638';g.font='700 38px system-ui,sans-serif';g.fillText('+'+p.b+' 點',W/2,y);g.fillStyle='#e4f2f3';g.font='600 17px system-ui,sans-serif';g.fillText(p.m+' 公尺里程碑',W/2,y+28);g.globalAlpha=1});
if(st!=='run'){
g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#e4f2f3';
if(st==='ready'){g.font='600 34px system-ui,sans-serif';g.fillText(T('title'),W/2,270);g.font='18px system-ui,sans-serif';g.fillText(T('tap'),W/2,310)}
else{g.font='600 34px system-ui,sans-serif';g.fillText(T('crash'),W/2,235);
g.font='600 24px system-ui,sans-serif';g.fillText(lastD+' m',W/2,277);
g.font='600 20px system-ui,sans-serif';g.fillStyle=earned>0?'#ffb638':'#e4f2f3';g.fillText(earned>0?'本局獎勵 +'+earned+' 點':'這一局沒有獎勵',W/2,312);
g.font='18px system-ui,sans-serif';
g.fillStyle=rec?'#ffb638':'#e4f2f3';
g.fillText(rec?T('rec'):T('left')(best-lastD),W/2,348);
g.fillStyle='#e4f2f3';g.fillText('可到操作區再跑一次',W/2,392)}}}

function changeLane(direction){
 const target=Math.max(-1,Math.min(1,run.tl+direction));
 if(target===run.tl)return;
 run.tl=target;
 if(!runRank)return;
 const input=runTicks*3+target+1;
 if(Math.floor(runMoves[runMoves.length-1]/3)===runTicks)runMoves[runMoves.length-1]=input;
 else runMoves.push(input);
 if(runMoves.length>6000){runRank=null;runStatus('這一局可在本機遊玩。')}
}
const L=()=>changeLane(-1),R=()=>changeLane(1);
$('rn-rank-retry').addEventListener('click',sendRun);
$('rn-go').addEventListener('click',start);
addEventListener('keydown',e=>{if($('view-runner').hidden||document.hidden||st!=='run'||e.metaKey||e.ctrlKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a')L();else R();}});
c.addEventListener('pointerdown',e=>{if(st!=='run'||$('view-runner').hidden||document.hidden)return;e.preventDefault();c.focus();const r=c.getBoundingClientRect();if(e.clientX<r.left+r.width/2)L();else R();});
document.querySelectorAll('[data-run]').forEach(b=>b.addEventListener('click',()=>{if(st!=='run')return;({left:L,right:R})[b.dataset.run]();c.focus()}));
function loop(t){
 const ms=Math.min(50,Math.max(0,t-last)||0);last=t;
 if(!$('view-runner').hidden&&!document.hidden){
  if(runRank&&st==='run'){
   runCarry+=ms;
   while(runCarry>=runnerRules.STEP_MS&&st==='run'){
    runCarry-=runnerRules.STEP_MS;
    runTicks++;
    update(runnerRules.STEP_MS/1000);
    if(runTicks>=runnerRules.MAX_TICKS&&st==='run'){
     runRank=null;
     runStatus('這一局可在本機遊玩。');
     break;
    }
   }
  }else update(ms/1000);
  if(shake>0)shake-=ms/1000;
  draw();runnerUI();
 }
 requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{last=performance.now()});window.addEventListener('hashchange',()=>{last=performance.now()});
runnerUI();draw();requestAnimationFrame(loop);
  })();
