  /* ---------- Sneak Out: original office scene, shared-wallet stages ---------- */
  var sneakBusy=false,sneakStake=0;
  (function(){
const c=$('sk-canvas'),g=c.getContext('2d'),W=400,H=600,MAX_LEVEL=10,MULT=[0,.6,1.1,1.8,2.8,4.5,6.5,9,12,16,21];
let best=0;try{const n=Number(localStorage.getItem('sneak'));if(Number.isFinite(n))best=Math.min(MAX_LEVEL,Math.max(0,n))}catch(e){}
const texts={lv:n=>'第 '+n+' / 10 關',bs:n=>'最佳 '+n+' 關',title:'偷偷下班',tap:'到操作區扣點開始',caught:'被抓住了！',reach:n=>'離大門只差 '+n+'%',done:n=>'本局通過 '+n+' 關',rec:'新紀錄！',again:'到操作區重新開始',ok:'溜走了！'};const T=k=>texts[k];
const quotes=['「你這是要去哪裡？」','「報告寫完了嗎就想走？」','「坐下，還有工作呢。」'];
let sneakAnalytics=null;
let st='ready',pr=0,lv=1,score=0,ph='away',pt=2,fk=false,grace=0,flash=0,shake=0,hold=false,walk=0,last=0,rec=false,qi=0;
let mouseHold=false,keyHold=false;
const rnd=(a,b)=>a+Math.random()*(b-a);
function pay(){return Math.floor(sneakStake*MULT[score])}
function saySneak(text,kind=''){$('sk-msg').textContent=text;$('sk-msg').className='msg'+(kind?' '+kind:'')}
function remember(){if(score>best){best=score;try{localStorage.setItem('sneak',best)}catch(e){}}}
function release(){mouseHold=false;keyHold=false;hold=false}
function ui(){
 $('sk-stage').textContent=lv+' / '+MAX_LEVEL;$('sk-progress').textContent=Math.floor(pr)+'%';$('sk-best').textContent=best+' 關';
 $('sk-amount').disabled=sneakBusy;
 $('sk-go').disabled=st==='run';$('sk-go').textContent=st==='passed'?'挑戰下一關':st==='run'?'潛行中 · 按住前進':'扣點開始下班';
 $('sk-cash').disabled=st!=='passed';$('sk-cash').textContent=st==='passed'?'收手領回':'過關後可領回';$('sk-hold').disabled=st!=='run';
 var signal=st!=='run'?(st==='passed'?'過關成功，可領回或繼續':st==='dead'?'本局被抓住了':st==='cashed'?'本局已結算':'等待開始'):ph==='look'?'老闆回頭了！立刻放開':ph==='warn'?'老闆有動靜，小心回頭':'老闆忙著工作';
 if($('sk-signal').textContent!==signal)$('sk-signal').textContent=signal;$('sk-signal').dataset.state=ph;
 $('sk-difficulty').textContent='需移動約 '+(6+(lv-1)*2)+' 秒 · '+(lv>=4?'可能直接回頭':'回頭前會先警示');
}
function awayT(){return rnd(Math.max(.65,2.4-lv*.24),Math.max(1.2,3.8-lv*.32))}
function nextPhase(){
 if(ph==='away'){
  const direct=lv>=4&&Math.random()<(lv===4?.2:Math.min(.65,.4+(lv-5)*.05));
  if(direct){ph='look';pt=rnd(.9,1.5);grace=.18;}
  else{ph='warn';fk=lv>=3&&Math.random()<.3;pt=Math.max(.25,.75-lv*.09);grace=0;}
 }else if(ph==='warn'){
  if(fk){ph='away';pt=awayT();grace=0;}else{ph='look';pt=rnd(.8,1.3+lv*.06);grace=.1;}
 }else{ph='away';pt=awayT();grace=0;}
}
function die(){if(st!=='run')return;AN.end(sneakAnalytics,0,'loss',{stage:lv,progress_percent:Math.floor(pr)});st='dead';sneakBusy=false;release();shake=reduceMotion?0:.4;qi=Math.floor(Math.random()*quotes.length);saySneak('被老闆發現！失去本局 '+sneakStake+' 點與未領回獎勵。','lose');ui()}
function cash(){if(st!=='passed')return;const amount=pay(),net=amount-sneakStake;AN.end(sneakAnalytics,amount,'cashout',{stage:lv,multiplier:MULT[score]});st='cashed';sneakBusy=false;release();S.balance+=amount;save();renderAll();saySneak((score===MAX_LEVEL?'十關全部溜走！':'已收手。')+'領回 '+amount+' 點。','win');ui()}
function win(){score++;AN.progress(sneakAnalytics,{stage:lv,multiplier:MULT[score]},true);st='passed';release();remember();saySneak('第 '+lv+' 關下班成功！可以領回，或繼續冒險。','win');if(score===MAX_LEVEL)cash();else ui()}
// Split at phase boundaries, grace expiration and the exit; slow frames cannot skip detection.
function update(dt){
 if(st!=='run')return;
 while(dt>1e-8&&st==='run'){
  if(hold&&ph==='look'&&grace<=1e-8){die();return;}
  const speed=100/(6+(lv-1)*2);
  let step=Math.min(dt,pt);if(grace>1e-8)step=Math.min(step,grace);if(hold)step=Math.min(step,(100-pr)/speed);
  if(hold){pr=Math.min(100,pr+speed*step);walk+=step*12;}
  pt-=step;grace=Math.max(0,grace-step);dt-=step;
  if(pt<=1e-8)nextPhase();
  if(hold&&ph==='look'&&grace<=1e-8){die();return;}
  if(pr>=100-1e-8){pr=100;win();return;}
 }
}
function sync(now){const dt=Math.max(0,(now-last)/1000);last=now;if(!$('view-sneak').hidden&&!document.hidden)update(dt)}
function round(){AN.resume(sneakAnalytics,{stage:lv});pr=0;ph='away';pt=awayT();fk=false;grace=0;flash=0;shake=0;walk=0;release();st='run';last=performance.now();saySneak('按住畫面或前進按鈕移動，放開就假裝工作。老闆回頭時不要動。');ui();c.focus()}
function start(){
 if(st==='run')return;
 if(st==='passed'){lv++;round();return;}
 const amount=ENTRY_FEE;
 if(amount>S.balance){saySneak(LOW_MSG,'lose');return;}
 sneakAnalytics=AN.start('sneak',amount);sneakStake=amount;sneakBusy=true;S.balance-=amount;save();renderAll();score=0;lv=1;rec=false;round();
}
function draw(){
const ox=shake>0?(Math.random()-.5)*14:0;
g.save();g.translate(ox,0);
g.fillStyle='#2e3350';g.fillRect(-20,0,W+40,470);
g.fillStyle='#1d2036';g.fillRect(-20,470,W+40,H-470);
g.strokeStyle='#e8e4d8';g.lineWidth=3;g.beginPath();g.arc(80,100,30,0,7);g.stroke();
g.beginPath();g.moveTo(80,100);g.lineTo(80,78);g.moveTo(80,100);g.lineTo(93,118);g.stroke();
g.fillStyle='#5a4636';g.fillRect(230,338,140,34);
const bx=300,hy=372-76*1.4,hr=17;
g.fillStyle='#8c3b36';g.fillRect(bx-17,372-62*1.4,34,56);
g.fillStyle=ph==='away'?'#2b2118':'#f5d0a9';g.beginPath();g.arc(bx,hy,hr,0,7);g.fill();
if(ph==='warn'){g.fillStyle='#2b2118';g.beginPath();g.arc(bx,hy,hr,Math.PI*.5,Math.PI*1.5);g.fill();g.fillStyle='#f2c14e';g.font='700 34px system-ui,sans-serif';g.textAlign='center';g.fillText('!',bx,hy-28)}
if(ph==='look'){g.fillStyle='#fff';g.beginPath();g.arc(bx-6,hy-2,4,0,7);g.arc(bx+6,hy-2,4,0,7);g.fill();g.fillStyle='#000';g.beginPath();g.arc(bx-7,hy-2,2,0,7);g.arc(bx+5,hy-2,2,0,7);g.fill();g.strokeStyle='#2b2118';g.lineWidth=2.5;g.beginPath();g.moveTo(bx-11,hy-10);g.lineTo(bx-2,hy-6);g.moveTo(bx+11,hy-10);g.lineTo(bx+2,hy-6);g.stroke()}
g.fillStyle='#7a5a3a';g.fillRect(352,320,44,220);
g.fillStyle='#e8e4d8';g.font='600 12px system-ui,sans-serif';g.textAlign='center';g.fillText('EXIT',374,342);
g.fillStyle='#f2c14e';g.beginPath();g.arc(360,440,3,0,7);g.fill();
const x=34+pr/100*300,y=540,sw=hold&&st==='run'?Math.sin(walk)*9:0;
g.strokeStyle='#f2c14e';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(x,y-28);g.lineTo(x-sw,y);g.moveTo(x,y-28);g.lineTo(x+sw,y);g.stroke();
g.fillStyle='#f2c14e';g.fillRect(x-11,y-66,22,40);
g.fillStyle='#f5d0a9';g.beginPath();g.arc(x,y-78,12,0,7);g.fill();
g.restore();
if(ph==='look'&&st==='run'){g.fillStyle='rgba(226,75,74,.2)';g.fillRect(0,0,W,H)}
g.fillStyle='#fff';g.font='600 20px system-ui,sans-serif';g.textAlign='left';g.fillText(T('lv')(lv),16,32);
g.textAlign='right';g.fillText(T('bs')(best),W-16,32);
g.fillStyle='rgba(255,255,255,.2)';g.fillRect(16,44,W-32,6);g.fillStyle='#f2c14e';g.fillRect(16,44,(W-32)*Math.min(1,pr/100),6);
if(flash>0&&st==='run'){g.textAlign='center';g.fillStyle='#fff';g.font='600 28px system-ui,sans-serif';g.fillText(T('ok'),W/2,120)}
if(st!=='run'){
g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#fff';
if(st==='passed'||st==='cashed'){g.font='600 30px system-ui,sans-serif';g.fillText(st==='passed'?'成功溜走了！':'已領回 '+pay()+' 點',W/2,250);g.font='18px system-ui,sans-serif';g.fillText(st==='passed'?'領回點數，或繼續下一關':'到操作區開始新一局',W/2,292)}
else if(st==='ready'){g.font='600 32px system-ui,sans-serif';g.fillText(T('title'),W/2,270);g.font='18px system-ui,sans-serif';g.fillText(T('tap'),W/2,310)}
else{g.font='600 34px system-ui,sans-serif';g.fillText(T('caught'),W/2,215);
g.font='18px system-ui,sans-serif';g.fillText(quotes[qi],W/2,252);
g.fillText(T('reach')(100-Math.floor(pr)),W/2,296);
g.font='600 22px system-ui,sans-serif';g.fillText(T('done')(score),W/2,336);
if(rec){g.fillStyle='#f2c14e';g.font='18px system-ui,sans-serif';g.fillText(T('rec'),W/2,368)}
g.fillStyle='#fff';g.font='18px system-ui,sans-serif';g.fillText(T('again'),W/2,420)}}}

$('sk-go').addEventListener('click',start);$('sk-cash').addEventListener('click',cash);
function press(e){if(e.button!==undefined&&e.button!==0)return;if(st!=='run'||$('view-sneak').hidden||document.hidden)return;e.preventDefault();sync(performance.now());if(st!=='run')return;c.focus();mouseHold=true;hold=true;try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}ui()}
function lift(){sync(performance.now());mouseHold=false;hold=keyHold}
[c,$('sk-hold')].forEach(el=>{el.addEventListener('pointerdown',press);['pointerup','pointercancel','lostpointercapture'].forEach(type=>el.addEventListener(type,lift))});
addEventListener('keydown',e=>{if($('view-sneak').hidden||document.hidden||st!=='run'||e.repeat||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if([' ','ArrowRight','d'].includes(e.key)){e.preventDefault();sync(performance.now());if(st==='run'){keyHold=true;hold=true;}}});
addEventListener('keyup',e=>{if([' ','ArrowRight','d'].includes(e.key)){if(!$('view-sneak').hidden)e.preventDefault();sync(performance.now());keyHold=false;hold=mouseHold}});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
function loop(t){sync(t);if(!$('view-sneak').hidden&&!document.hidden){if(shake>0)shake=Math.max(0,shake-.016);ui();draw();}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();

