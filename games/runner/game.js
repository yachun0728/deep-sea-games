  /* ---------- Dodge Run: endless lane dodging; milestone bonuses are credited to the shared wallet when reached ---------- */
  (function(){
const c=$('rn-canvas'),g=c.getContext('2d'),W=400,LW=118,F=16;
const fullScreen=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
// Difficulty: speed climbs slowly, while the time between two rows (the window to change lanes) shrinks to a floor.
// Milestones are far apart; the curve and distances were calibrated with a noisy-player simulation (see GAME_RULES.md).
const MILESTONES=[[3500,3],[4500,7],[5500,15],[6500,30]],ENDLESS_FROM=6500,ENDLESS_STEP=1000,ENDLESS_BONUS=40;
const bonusAt=m=>{for(const t of MILESTONES)if(t[0]===m)return t[1];return m>ENDLESS_FROM&&(m-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0};
const nextMilestone=d=>{for(const t of MILESTONES)if(t[0]>d)return t;return [ENDLESS_FROM+(Math.floor((d-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]};
const prevMilestone=d=>{let p=0;for(const t of MILESTONES)if(t[0]<=d)p=t[0];if(d>=ENDLESS_FROM)p=ENDLESS_FROM+Math.floor((d-ENDLESS_FROM)/ENDLESS_STEP)*ENDLESS_STEP;return p};
let best=0;try{const n=Number(localStorage.getItem('chayne'));if(Number.isFinite(n))best=Math.max(0,n)}catch(e){}
const texts={best:'{{t:runner.msg.001}}',near:'{{t:runner.msg.002}}',title:'{{t:runner.msg.003}}',tap:'{{t:runner.msg.004}}',crash:'{{t:runner.msg.005}}',rec:'{{t:runner.msg.006}}',left:n=>'距離紀錄還差 '+n+' m'};const T=k=>texts[k];
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
 $('rn-go').disabled=st==='run'||runStarting||runSending;$('rn-go').textContent=st==='run'?'{{t:runner.msg.007}}':'{{t:runner.msg.008}}';
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
 note('{{t:runner.msg.009}}');runnerUI();c.focus();
}
async function start(){
 if(st==='run'||runStarting||runSending)return;
 if(S.balance<ENTRY_FEE){note(LOW_MSG,'lose');return;}
 runPending=null;
 if(typeof location==='undefined'||location.protocol==='file:'){beginRun(null);return}
 runStarting=true;
 runStatus('{{t:runner.msg.010}}');
 runnerUI();
 let ranked=null;
 try{
  const api=await import('./frontend/services/api.mjs');
  ranked=await api.startBoardRound('runner',AbortSignal.timeout(4000));
 }catch{}
 runStarting=false;
 if($('view-runner').hidden){runStatus('');runnerUI();return}
 runStatus(ranked?'{{t:runner.msg.011}}':'{{t:runner.msg.012}}');
 beginRun(ranked);
}
async function sendRun(){
 if(!runPending||runSending)return;
 runSending=true;
 runStatus('{{t:runner.msg.013}}');
 runnerUI();
 try{
  const api=await import('./frontend/services/api.mjs');
  const result=await api.moveBoardRound(runRank.token,runPending,AbortSignal.timeout(10000));
  runPending=null;
  runStatus(result.state.distance===lastD?'{{t:runner.msg.014}}':'{{t:runner.msg.015}}');
 }catch(error){
  if(error.retryable===false)runPending=null;
  runStatus('{{t:runner.msg.015}}',!!runPending);
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
const artFiles={
 road:'postal-road.webp',
 idle:'otter-idle.webp',
 left:'otter-stride-left.webp',
 right:'otter-stride-right.webp',
 buoy:'signal-buoy.webp',
 propeller:'ship-propeller.webp'
};
let art;
function loadArt(){
 return Object.fromEntries(Object.entries(artFiles).map(([name,file])=>{
  const image=new Image();
  image.src='./games/runner/art/'+file;
  return [name,image];
 }));
}
function drawSprite(image,x,y,height){
 if(!image.naturalWidth)return;
 const width=height*image.naturalWidth/image.naturalHeight;
 g.save();
 g.translate(x,y);
 g.drawImage(image,-width/2,-height,width,height);
 g.restore();
}
function drawRunner(x,y,height){
 const moving=st==='run'&&!reduceMotion;
 const phase=moving?run.dist/3:0;
 const left=Math.floor(phase)%2===0;
 g.save();
 g.translate(x,y);
 g.fillStyle='rgba(12,37,52,.42)';
 g.beginPath();g.ellipse(0,0,height*.23,height*.046,0,0,Math.PI*2);g.fill();
 g.rotate(moving?(run.tl-run.px)*.16:0);
 const pose=moving?(left?art.left:art.right):art.idle;
 drawSprite(pose.naturalWidth?pose:art.idle,0,moving?-Math.abs(Math.sin(phase*Math.PI))*4:0,height);
 g.restore();
}
function draw(){
 const mobile=fullScreen.matches;
 const H=mobile&&c.clientWidth?Math.max(430,Math.round(W*c.clientHeight/c.clientWidth)):600;
 const density=c.clientWidth?Math.min(2.5,devicePixelRatio*c.clientWidth/W):1;
 const pixelsWide=Math.round(W*density),pixelsHigh=Math.round(H*density);
 if(c.width!==pixelsWide)c.width=pixelsWide;
 if(c.height!==pixelsHigh)c.height=pixelsHigh;
 g.setTransform(pixelsWide/W,0,0,pixelsHigh/H,0,0);
 // The runtime also initializes on the lobby, but the artwork is only needed in this view.
 if($('view-runner').hidden)return;
 art??=loadArt();

 const horizon=H*.31,feet=H*.952,collisionY=feet-5;
 const ox=shake>0?(Math.random()-.5)*14:0;
 const X=(lane,z)=>W/2+lane*LW*perspective(z)**.47;
 const Y=z=>horizon+(collisionY-horizon)*perspective(z);
 g.fillStyle='#17627a';
 g.fillRect(0,0,W,H);
 if(art.road.naturalWidth)g.drawImage(art.road,0,0,W,H);
 g.save();
 g.translate(ox,0);
 // Road studs supply forward motion and mark the two boundaries of the three lanes.
 const spacing=3.8,offset=run.dist%spacing;
 for(let i=58;i>=0;i--){
  const z=i*spacing-offset;
  if(z<-1.4)continue;
  const scale=perspective(z);
  const y=Y(z);
  g.globalAlpha=Math.min(1,scale*6);
  for(const side of [-.5,.5]){
   const x=X(side,z);
   g.fillStyle='#207b7d';
   g.beginPath();g.ellipse(x,y,11*scale,5.5*scale,0,0,Math.PI*2);g.fill();
   g.fillStyle='#b2f4cf';
   g.beginPath();g.ellipse(x,y-1.1*scale,8.5*scale,3.5*scale,0,0,Math.PI*2);g.fill();
  }
 }
 g.globalAlpha=1;
 const bestDepth=best-run.dist;
 if(best>0&&bestDepth>=0&&bestDepth<95){
  const y=Y(bestDepth);
  g.strokeStyle='#ffd185';g.lineWidth=2;
  g.beginPath();g.moveTo(X(-1.45,bestDepth),y);g.lineTo(X(1.45,bestDepth),y);g.stroke();
 }
 for(const obstacle of run.obs.slice().sort((a,b)=>b.z-a.z)){
  if(obstacle.z< -1.5)continue;
  const scale=perspective(obstacle.z);
  const image=obstacle.l===1?art.propeller:art.buoy;
  const maxWidth=LW*.94*scale**.55;
  const maxHeight=Math.min(W*.48,H*.25)*Math.sqrt(scale);
  const x=X(obstacle.l,obstacle.z),y=Y(obstacle.z);
  g.globalAlpha=Math.max(0,Math.min(1,(76-obstacle.z)/22));
  if(image.naturalWidth){
   const height=Math.min(maxHeight,maxWidth*image.naturalHeight/image.naturalWidth);
   drawSprite(image,x,y,height);
  }else{
   // Keep incoming obstacles visible while their illustrations load.
   g.fillStyle='#f37860';
   g.beginPath();
   g.moveTo(x-maxWidth*.45,y);
   g.lineTo(x-maxWidth*.21,y-maxHeight*.7);
   g.lineTo(x+maxWidth*.21,y-maxHeight*.7);
   g.lineTo(x+maxWidth*.45,y);
   g.closePath();g.fill();
  }
 }
 g.restore();

 const d=Math.floor(run.dist),nx=nextMilestone(d),pv=prevMilestone(d);
 const progress=Math.max(0,Math.min(1,(run.dist-pv)/(nx[0]-pv)));
 const hudY=mobile?61*H/Math.max(1,c.clientHeight):44;
 if(!mobile){
  g.fillStyle='#fff1cb';g.font='700 22px Georgia,serif';g.textAlign='left';g.fillText(d+' m',16,32);
  g.textAlign='right';g.fillText(T('best')+' '+best+' m',W-16,32);
 }
 const meterWidth=mobile?152:W-32,meterX=(W-meterWidth)/2;
 g.fillStyle='rgba(190,238,225,.24)';
 g.beginPath();g.roundRect(meterX,hudY,meterWidth,5,3);g.fill();
 if(progress>0){
  g.fillStyle='#9df4c5';
  g.beginPath();g.roundRect(meterX,hudY,meterWidth*progress,5,3);g.fill();
 }
 if(earned>0){
  g.textAlign='center';g.fillStyle='#ffd185';g.font='600 14px system-ui,sans-serif';
  g.fillText('{{t:runner.msg.016}}'+earned+' 點',W/2,hudY+24);
 }
if(flash>0&&st==='run'){g.textAlign='center';g.fillStyle='#e4f2f3';g.font='600 26px system-ui,sans-serif';g.fillText(T('near'),W/2,hudY+71)}
pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/2.2);const y=190-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#ffb638';g.font='700 38px system-ui,sans-serif';g.fillText('+'+p.b+' 點',W/2,y);g.fillStyle='#e4f2f3';g.font='600 17px system-ui,sans-serif';g.fillText(p.m+' 公尺里程碑',W/2,y+28);g.globalAlpha=1});
if(st!=='run'){
const center=H*.45;
g.fillStyle='rgba(9,26,46,.64)';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#fff1cb';
if(st==='ready'){g.font='600 34px system-ui,sans-serif';g.fillText(T('title'),W/2,center);g.font='18px system-ui,sans-serif';g.fillText(T('tap'),W/2,center+36)}
else{g.font='600 34px system-ui,sans-serif';g.fillText(T('crash'),W/2,center-45);
g.font='600 24px system-ui,sans-serif';g.fillText(lastD+' m',W/2,center-8);
g.font='600 20px system-ui,sans-serif';g.fillStyle=earned>0?'#ffb638':'#e4f2f3';g.fillText(earned>0?'{{t:runner.msg.017}}'+earned+' 點':'{{t:runner.msg.018}}',W/2,center+25);
g.font='18px system-ui,sans-serif';
g.fillStyle=rec?'#ffb638':'#e4f2f3';
g.fillText(rec?T('rec'):T('left')(best-lastD),W/2,center+55);
if(!mobile){g.fillStyle='#e4f2f3';g.fillText('{{t:runner.msg.019}}',W/2,center+92)}}}
drawRunner(X(run.px,0)+ox,feet,Math.min(H*.285,W*.67));
}


function changeLane(direction){
 const target=Math.max(-1,Math.min(1,run.tl+direction));
 if(target===run.tl)return;
 run.tl=target;
 if(!runRank)return;
 const input=runTicks*3+target+1;
 if(Math.floor(runMoves[runMoves.length-1]/3)===runTicks)runMoves[runMoves.length-1]=input;
 else runMoves.push(input);
 if(runMoves.length>6000){runRank=null;runStatus('{{t:runner.msg.012}}')}
}
const L=()=>changeLane(-1),R=()=>changeLane(1);
$('rn-rank-retry').addEventListener('click',sendRun);
$('rn-go').addEventListener('click',start);
addEventListener('keydown',e=>{if($('view-runner').hidden||document.hidden||st!=='run'||e.metaKey||e.ctrlKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a')L();else R();}});
['dblclick','gesturestart','contextmenu'].forEach(n=>c.parentNode.parentNode.addEventListener(n,e=>e.preventDefault()));
c.parentNode.parentNode.addEventListener('pointerdown',e=>{if(st!=='run'||$('view-runner').hidden||document.hidden||e.target.closest('button,a,summary,input'))return;e.preventDefault();c.focus();const r=c.getBoundingClientRect();if(e.clientX<r.left+r.width/2)L();else R();});
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
     runStatus('{{t:runner.msg.012}}');
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
