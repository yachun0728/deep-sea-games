  /* ---------- Dodge Run: staged left/right challenge ---------- */
  (function(){
const c=$('rn-canvas'),g=c.getContext('2d'),W=400,H=600,HOR=230,LW=130,F=5,BASE_LENGTH=1200,MAX_STAGE=10;
let best=0;try{const n=Number(localStorage.getItem('chayne'));if(Number.isFinite(n))best=Math.max(0,n)}catch(e){}
const texts={best:'最佳',near:'擦身而過！',title:'深海潛行',tap:'扣 '+ENTRY_FEE+' 點開始挑戰',crash:'撞上障礙',rec:'新紀錄！',left:n=>'距離紀錄還差 '+n+' m',again:'本局下注與獎勵已失去'};const T=k=>texts[k];
let runnerAnalytics=null;
let st='ready',stage=1,wins=0,progress=0,dist=0,px=0,tl=0,v=20,obs=[],nextAt=15,lastGap=0,flash=0,shake=0,last=0,lastD=0,rec=false;
const perspective=z=>F/(F+z);
function stageLength(){return BASE_LENGTH+(stage-1)*160}
function reward(){return wins?Math.floor(ENTRY_FEE*(Math.round(Math.pow(1.35,wins)*100)/100)):0}
function note(text,kind=''){$('rn-msg').textContent=text;$('rn-msg').className='msg'+(kind?' '+kind:'')}
function remember(){lastD=Math.floor(dist);rec=lastD>best;if(rec){best=lastD;try{localStorage.setItem('chayne',best)}catch(e){}}}
function runnerUI(){
 $('rn-distance').textContent=Math.floor(progress)+' / '+stageLength()+' m';$('rn-best').textContent=best+' m';
 $('rn-stage').textContent=stage+' / '+MAX_STAGE;$('rn-speed').textContent=(v/20).toFixed(1)+'×';
 $('rn-go').disabled=st==='run';$('rn-go').textContent=st==='passed'?'挑戰下一關':st==='run'?'潛行中 · 只需左右換道':'扣 '+ENTRY_FEE+' 點，開始潛行';
 $('rn-finish').disabled=st!=='passed';$('rn-finish').textContent=st==='passed'?'收手領回':'過關後可領回';
 document.querySelectorAll('[data-run]').forEach(b=>b.disabled=st!=='run');
}
function round(){AN.resume(runnerAnalytics,{stage:stage});progress=0;px=0;tl=0;v=20+(stage-1)*4;obs=[];lastGap=0;nextAt=10;flash=0;shake=0;st='run';last=performance.now();note('第 '+stage+' 關：左右換道避開障礙，前進 '+stageLength()+' 公尺即可過關。');runnerUI();c.focus()}
function start(){
 if(st==='run')return;
 if(st==='passed'){stage++;round();return;}
 if(S.balance<ENTRY_FEE){note(LOW_MSG,'lose');return;}
 runnerAnalytics=AN.start('runner',ENTRY_FEE);S.balance-=ENTRY_FEE;save();renderAll();stage=1;wins=0;dist=0;runnerBusy=true;round();
}
function cash(){if(st!=='passed')return;const pay=reward();AN.end(runnerAnalytics,pay,'cashout',{stage:stage,distance:Math.floor(dist)});st='cashed';runnerBusy=false;S.balance+=pay;save();renderAll();note((stage===MAX_STAGE?'十關全部完成！':'已停止挑戰。')+'領回 '+pay+' 點。','win');runnerUI()}
function die(){if(st!=='run')return;AN.end(runnerAnalytics,0,'loss',{stage:stage,distance:Math.floor(dist)});st='dead';runnerBusy=false;shake=reduceMotion?0:.4;remember();note('撞上障礙，失去本局 '+ENTRY_FEE+' 點下注與尚未領回的獎勵。','lose');runnerUI()}
function spawn(){
 const lanes=[-1,0,1].filter(l=>l!==lastGap);
 const gap=lanes[Math.floor(Math.random()*lanes.length)];lastGap=gap;
 [-1,0,1].forEach(l=>{if(l!==gap)obs.push({l,t:'block',z:70,p:0})});
 nextAt=progress+Math.max(v*.8,40-(stage-1)*.7);
}
function update(dt){
 if($('view-runner').hidden||document.hidden||st!=='run')return;
 const step=Math.min(v*dt,stageLength()-progress);progress+=step;dist+=step;px+=(tl-px)*Math.min(1,dt*16);flash-=dt;
 if(progress>=nextAt&&progress<stageLength()-75)spawn();
 for(const o of obs){const before=o.z;o.z-=step;
  if(!o.p&&before>=-1.5&&o.z<=1.5&&Math.abs(px-o.l)<.62){die();return;}
  if(!o.p&&o.z<-.5){o.p=1;const d=Math.abs(px-o.l);if(d>=.62&&d<1.1)flash=.8;}
 }
 obs=obs.filter(o=>o.z>-3);
 if(progress>=stageLength()){remember();wins++;st='passed';AN.progress(runnerAnalytics,{stage:stage,distance:Math.floor(dist)},true);note('第 '+stage+' 關完成！可以領回，或挑戰速度更快的下一關；繼續失敗會失去整局。','win');if(stage===MAX_STAGE)cash();else runnerUI();}
}
function draw(){
const camH=0,ox=shake>0?(Math.random()-.5)*14:0;
const X=(l,z)=>W/2+(l-px)*LW*perspective(z),Y=z=>HOR+(220+camH)*perspective(z);
const quad=(a,b,l0,l1,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(X(l0,a),Y(a));g.lineTo(X(l1,a),Y(a));g.lineTo(X(l1,b),Y(b));g.lineTo(X(l0,b),Y(b));g.closePath();g.fill()};
g.save();g.translate(ox,0);
g.fillStyle='#0a2a3b';g.fillRect(-20,0,W+40,HOR);
g.fillStyle='#051620';g.fillRect(-20,HOR,W+40,H-HOR);
const off=dist%16;
for(let i=13;i>=-1;i--){
let z0=i*8-off,z1=z0+8;if(z1<=-2)continue;if(z0<-2)z0=-2;
const wd=dist+z0,gold=best>0&&Math.abs(wd+4-best)<5;
quad(z0,z1,-1.5,1.5,gold?'#ffb638':(Math.floor(wd/8)%2?'#113041':'#0c2230'));
if(!gold&&Math.floor(wd/8)%2){quad(z0,z1,-.53,-.47,'#214658');quad(z0,z1,.47,.53,'#214658')}}
quad(-2,100,-1.58,-1.5,'#62e6d2');quad(-2,100,1.5,1.58,'#62e6d2');
const cols={block:'#ff6f61',low:'#ffb638',high:'#62e6d2'};
obs.slice().sort((a,b)=>b.z-a.z).forEach(o=>{
if(o.z<-1.5)return;
const s=perspective(o.z),cx=X(o.l,o.z),by=Y(o.z),w=112*s;
g.globalAlpha=Math.max(0,Math.min(1,(95-o.z)/40));
g.fillStyle=cols[o.t];
if(o.t==='block')g.fillRect(cx-w/2,by-130*s,w,130*s);
else if(o.t==='low')g.fillRect(cx-w/2,by-38*s,w,38*s);
else g.fillRect(cx-w/2,by-110*s,w,50*s);
g.globalAlpha=1});
g.restore();
g.fillStyle='#e4f2f3';g.font='600 20px system-ui,sans-serif';g.textAlign='left';g.fillText('第 '+stage+' 關 · '+Math.floor(progress)+' / '+stageLength()+' m',16,32);
g.textAlign='right';g.fillText(T('best')+' '+best+' m',W-16,32);
g.fillStyle='#214658';g.fillRect(16,44,W-32,6);g.fillStyle='#62e6d2';g.fillRect(16,44,(W-32)*Math.min(1,progress/stageLength()),6);
if(flash>0&&st==='run'){g.textAlign='center';g.fillStyle='#e4f2f3';g.font='600 26px system-ui,sans-serif';g.fillText(T('near'),W/2,110)}
if(st!=='run'){
g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#e4f2f3';
if(st==='passed'||st==='cashed'){g.font='600 30px system-ui';g.fillText(st==='passed'?'第 '+stage+' 關完成！':'已領回 '+reward()+' 點',W/2,270);g.font='17px system-ui';g.fillText(st==='passed'?'領回點數，或挑戰更快的下一關':'可到操作區開始新一局',W/2,315)}
else if(st==='ready'){g.font='600 34px system-ui,sans-serif';g.fillText(T('title'),W/2,270);g.font='18px system-ui,sans-serif';g.fillText(T('tap'),W/2,310)}
else{g.font='600 34px system-ui,sans-serif';g.fillText(T('crash'),W/2,250);
g.font='600 24px system-ui,sans-serif';g.fillText(lastD+' m',W/2,292);
g.font='18px system-ui,sans-serif';
g.fillStyle=rec?'#ffb638':'#e4f2f3';
g.fillText(rec?T('rec'):T('left')(best-lastD),W/2,326);
g.fillStyle='#e4f2f3';g.fillText(T('again'),W/2,370)}}}

const L=()=>{tl=Math.max(-1,tl-1)},R=()=>{tl=Math.min(1,tl+1)};
$('rn-go').addEventListener('click',start);$('rn-finish').addEventListener('click',cash);
addEventListener('keydown',e=>{if($('view-runner').hidden||document.hidden||st!=='run'||e.metaKey||e.ctrlKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a')L();else R();}});
c.addEventListener('pointerdown',e=>{if(st!=='run'||$('view-runner').hidden||document.hidden)return;e.preventDefault();c.focus();const r=c.getBoundingClientRect();if(e.clientX<r.left+r.width/2)L();else R();});
document.querySelectorAll('[data-run]').forEach(b=>b.addEventListener('click',()=>{if(st!=='run')return;({left:L,right:R})[b.dataset.run]();c.focus()}));
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000||0));last=t;if(!$('view-runner').hidden&&!document.hidden){update(dt);if(shake>0)shake-=dt;draw();runnerUI();}requestAnimationFrame(loop)}
document.addEventListener('visibilitychange',()=>{last=performance.now()});window.addEventListener('hashchange',()=>{last=performance.now()});
runnerUI();draw();requestAnimationFrame(loop);
  })();

