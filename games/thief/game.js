  /* ---------- 偷水果的貓: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var thiefBusy=false,thiefStake=0,thiefSay=function(){};
  (function(){
const c=$('thief-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[150, 400, 800],BONUS=5,KEY='deep-sea-thief-best',SKEY='deep-sea-thief-skin',UNIT=' 分';
let analytics=null,paid=0,awarded=new Set(),bpop=[];
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w)};
const E=(x,y,rx,ry,f,w)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);O(f,w)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw)};
const P=(a,f,w)=>{g.beginPath();a.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();O(f,w)};
const L2=(x1,y1,x2,y2,w,col)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=col||OL;g.lineWidth=w||3;g.lineCap='round';g.stroke()};
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else E(0,-8,13,4,'#ffe27a',3);
g.restore()}
G.I={bs:n=>'最高 '+n,tap:'',title:"偷水果的貓",s1:"小貓偷了水果，老闆娘拿著拖鞋追來！",s2:"抱得越多得分越高，但跑得越慢。",caught:"被老闆娘抓住了！",fr:n=>'已偷 '+n+' 個水果',sh:['還給我！','偷東西的貓！','站住！']};
G.skins=[{need:0,n:'調皮橘貓',c:['#ff9f1c','#e36414'],a:0},{need:150,n:'白糰子',c:['#f1faee','#a8dadc'],a:1},{need:400,n:'忍者貓',c:['#5e548e','#231942'],a:3},{need:800,n:'市場貓王',c:['#ffd23f','#e76f51'],a:2}];
const LX=[105,200,295],CYT=430,fc=['#e63946','#ff9f1c','#7bd88f'];
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx;
G.reset=()=>{dist=0;v=280;L=0;fruits=0;gb=130;lane=1;cx=200;jt=0;stun=0;rows=[];slips=[];warn=[];nextRow=120;nextSlip=2.5;fx=[]};
G.score=()=>Math.floor(dist/50)+fruits*5;
G.extra=()=>T('fr')(fruits);
G.down=p=>{if(p.x<133)lane=Math.max(0,lane-1);else if(p.x>267)lane=Math.min(2,lane+1);else if(jt<=0)jt=.55};
function hurt(n){gb-=n;stun=.8;shake=reduceMotion?0:.25;L=Math.max(0,L-2);fx.push({s:'-'+n,x:cx,y:CYT-40,t:0})}
function spawnRow(){
const free=(Math.random()*3)|0;
for(let l=0;l<3;l++){
if(l===free){const r=Math.random();if(r<.65)rows.push({t:'f',l,y:-30,c:(Math.random()*3)|0});else if(L>=3||r<.75)rows.push({t:'x',l,y:-30})}
else if(Math.random()<(dist>400?.75:.45))rows.push({t:'b',l,y:-30,c:(Math.random()*3)|0})}}
G.update=dt=>{
v=Math.min(420,280+dist*.02)*(1-.07*L);dist+=v*dt;
gb=Math.min(170,gb-(4+L*5+dist*.002)*dt);
cx+=(LX[lane]-cx)*Math.min(1,dt*14);
if(jt>0)jt-=dt;if(stun>0)stun-=dt;
if(dist>=nextRow){nextRow=dist+rnd(190,250);spawnRow()}
nextSlip-=dt;if(nextSlip<=0){nextSlip=Math.max(1.8,rnd(3,5.5)-dist*.0005);warn.push({l:(Math.random()*3)|0,t:.8})}
warn.forEach(w=>{w.t-=dt;if(w.t<=0){w.d=1;slips.push({l:w.l,y:H+30})}});warn=warn.filter(w=>!w.d);
slips.forEach(s=>{s.y-=760*dt;if(!s.h&&stun<=0&&Math.abs(s.y-CYT)<22&&Math.abs(LX[s.l]-cx)<28){s.h=1;hurt(80)}});slips=slips.filter(s=>s.y>-40);
const air=jt>0;
for(const r of rows){r.y+=v*dt;
const near=Math.abs(r.y-CYT)<26&&Math.abs(LX[r.l]-cx)<30;
if(r.t==='b'){if(!air&&stun<=0&&!r.h&&near){r.h=1;hurt(50)}}
else if(!r.g&&!air&&near){r.g=1;if(r.t==='f'){if(L<5){L++;fruits++}}else{L=0;gb+=30}}}
rows=rows.filter(r=>r.y<H+40&&!r.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(gb<=0)die('caught')};
function bg(){
g.fillStyle='#f4a261';g.fillRect(-20,0,W+40,H);
for(let i=0;i<14;i++){const y=((i*50+dist)%700+700)%700-60;g.fillStyle='#e76f51';g.fillRect(50,y,300,3)}
for(let i=0;i<10;i++){const y=((i*70+dist)%700+700)%700-40;L2(152,y,152,y+30,3,'#fff1c1');L2(248,y,248,y+30,3,'#fff1c1')}
[0,350].forEach(x=>{for(let i=0;i<16;i++){const y=((i*56+dist*.9)%900+900)%900-60;g.fillStyle=i%2?'#e63946':'#fff';g.fillRect(x,y,50,28)}g.strokeStyle=OL;g.lineWidth=4;g.strokeRect(x,-4,50,H+8)})}
function item(r){
const x=LX[r.l],y=r.y;
if(r.t==='b'){RR(x-26,y-15,52,30,9,'#c08552',3);[-12,0,12].forEach((d,i)=>C(x+d,y-6,8,fc[(r.c+i)%3],2))}
else if(r.t==='f'){C(x,y,12,fc[r.c],3);F(x+4,y-12,4,'#2d6a4f')}
else{E(x,y,18,9,'#8ecae6',3);P([[x+16,y],[x+30,y-9],[x+30,y+9]],'#8ecae6',3);F(x-9,y-2,2.5,OL)}}
function cat(){
if(stun>0&&Math.floor(tt*20)%2)return;
const k=SK(),j=jt>0?Math.sin(Math.PI*(1-jt/.55)):0,s=1+j*.35;
g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(cx+j*8,CYT+6+j*12,17,24,0,0,7);g.fill();
g.save();g.translate(cx,CYT-j*16);g.scale(s,s);
g.beginPath();g.moveTo(0,28);g.quadraticCurveTo(24,40+Math.sin(tt*8)*8,20,62);g.strokeStyle=OL;g.lineWidth=10;g.lineCap='round';g.stroke();g.strokeStyle=k.c[0];g.lineWidth=5;g.stroke();
E(0,6,16,24,k.c[0],3);L2(-9,0,-3,0,3,k.c[1]);L2(9,0,3,0,3,k.c[1]);L2(-9,12,-3,12,3,k.c[1]);L2(9,12,3,12,3,k.c[1]);
for(let i=0;i<L;i++)C(i%2?5:-5,14-i*7,7,fc[i%3],2);
P([[-12,-30],[-9,-46],[-2,-33]],k.c[0],3);P([[12,-30],[9,-46],[2,-33]],k.c[0],3);
C(0,-22,13,k.c[0],3);L2(-8,-24,-3,-22,2.5);L2(8,-24,3,-22,2.5);F(0,-16,2.5,'#ff5d8f');
L2(-6,-15,-18,-18,2);L2(6,-15,18,-18,2);
acc(k.a,0,-34,1);g.restore()}
function granny(){
const cy=H+46-gb*.95,sc=1+(1-gb/170)*.2;
g.save();g.translate(200,cy);g.scale(sc,sc);
C(0,-66,22,'#ced4da',3);C(0,0,70,'#f5cba7',4);
g.beginPath();g.arc(0,-8,70,Math.PI*1.05,Math.PI*1.95);O('#ced4da',3);
C(-22,-18,9,'#fff',2.5);C(22,-18,9,'#fff',2.5);F(-20,-16,3.5,OL);F(24,-16,3.5,OL);
L2(-34,-34,-12,-26,5);L2(34,-34,12,-26,5);
E(0,18,20,11,'#7a1c1c',3);C(-86,-6,18,'#f5cba7',3);E(-86,-40,12,26,'#ff5d8f',3);
g.restore()}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();rows.forEach(item);
warn.forEach(w=>{if(Math.floor(tt*12)%2){const x=LX[w.l];P([[x-14,H-10],[x+14,H-10],[x,H-44]],'#ff5d5d',3);tx('!',x,H-16,20,'#fff')}});
slips.forEach(s=>{const x=LX[s.l];E(x,s.y,12,26,'#ff5d8f',3);L2(x-8,s.y-8,x,s.y-16,3);L2(x+8,s.y-8,x,s.y-16,3)});
cat();granny();
if(st==='run'&&gb<75)tx(T('sh')[Math.floor(tt/1.4)%3],200,H-150,22,'#ff7a7a');
g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
tx(String(G.score()),16,42,32,'#fff','left');tx(T('bs')(best),16,66,14,'#ffd23f','left');
for(let i=0;i<5;i++){g.beginPath();g.arc(W-24-i*22,34,8,0,7);if(i<L){O(fc[i%3],2.5)}else{g.strokeStyle='#fff';g.lineWidth=2;g.stroke()}}
RR(16,78,W-32,10,5,'rgba(255,255,255,.3)',2);const r=cl(1-gb/170,0,1);if(r>0)RR(16,78,Math.max(10,(W-32)*r),10,5,r>.7?'#e63946':'#6cf0a8',2)};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-thief');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){}
function say(text,kind){$('thief-msg').textContent=text;$('thief-msg').className='msg'+(kind?' '+kind:'')}
thiefSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('thief-score',G.score()+UNIT);setText('thief-best',best+UNIT);setText('thief-pay',fmt(paid)+' 點');
 setText('thief-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('thief-amount').disabled=thiefBusy;$('thief-go').disabled=live;setText('thief-go',live?'逃跑中 · 換道／跳躍':st==='over'?'免費再偷一次':'免費開始偷水果');
 document.querySelectorAll('[data-thief-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-thief-tier')))?'step':'false'));
}
function awardBonus(){
 const s=G.score();
 for(const m of MILESTONES){
  if(s<m||awarded.has(m))continue;
  awarded.add(m);paid+=BONUS;S.balance+=BONUS;save();renderAll();
  AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});
  bpop.push({age:0,m:m});if(bpop.length>3)bpop.shift();
  say('達成 '+fmt(m)+UNIT+'！BONUS +'+BONUS+' 點已入帳，本局累計 +'+paid+' 點。','win');
 }
}
function die(m){
 if(st!=='run')return;
 st='over';G.msg=m;shake=reduceMotion?0:.35;release();
 const s=G.score();rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});thiefBusy=false;renderAll();
 say('被老闆娘抓住了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'這一局沒有 BONUS。'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('thief',amount);thiefStake=amount;thiefBusy=true;save();renderAll();
 G.reset();paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('開始！點畫面跳躍，越過障礙。');ui();c.focus();
}
function overlay(){
g.fillStyle='rgba(27,27,47,.6)';g.fillRect(0,0,W,H);
if(st==='ready'){tx(T('title'),W/2,170,32,'#ffd23f');tx(T('s1'),W/2,218,17,'#fff');tx(T('s2'),W/2,244,17,'#fff');tx('右側免費開始',W/2,312,24,'#ffd23f')}
else{tx(T(G.msg),W/2,130,28,'#ff7a7a');tx(String(G.score()),W/2,205,52,'#fff');if(G.extra)tx(G.extra(),W/2,240,17,'#fff');if(rec)tx('新紀錄！',W/2,272,20,'#ffd23f');if(unl.length)tx('已解鎖：'+unl.map(k=>k.n).join('、'),W/2,300,17,'#6cf0a8');tx(paid>0?'BONUS 已入帳 +'+paid+' 點':'這一局沒有 BONUS',W/2,336,20,paid>0?'#ffd23f':'#fff');tx('右側可以再玩一次',W/2,382,18,'#fff')}
const n=G.skins.length;
G.skins.forEach((k,i)=>{const x=W/2+(i-(n-1)/2)*72,lk=best<k.need;
C(x,CHY,24,lk?'#6c757d':k.c[0],3);
if(!lk){g.fillStyle=k.c[1];g.beginPath();g.arc(x,CHY,21,.3,Math.PI-.3);g.fill();acc(k.a,x,CHY-14,.55)}else tx(String(k.need),x,CHY+7,17,'#fff');
if(i===skin&&!lk){g.strokeStyle='#ffd23f';g.lineWidth=4;g.beginPath();g.arc(x,CHY,30,0,7);g.stroke()}});
tx(SK().n,W/2,CHY+56,16,'#ffd23f')}
function bonusDraw(){bpop.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/1.8);tx('BONUS +'+BONUS+' 點',W/2,170-Math.min(1,p.age*3)*20,34,'#ffd23f');tx(fmt(p.m)+UNIT+' 里程碑',W/2,198-Math.min(1,p.age*3)*20,16,'#fff');g.globalAlpha=1})}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);
 if(st!=='run'){
  const n=G.skins.length;
  if(Math.abs(p.y-CHY)<32){for(let i=0;i<n;i++)if(Math.abs(p.x-(W/2+(i-(n-1)/2)*72))<32){if(best>=G.skins[i].need)pick(i);return}}
  say(st==='over'?'這一局已結束。按「免費再偷一次」開始新的一局。':'先按「免費開始偷水果」。');return}
 e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 G.down(p)});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,e=>{if(st==='run'&&G.up)G.up({id:e.pointerId})}));
c.addEventListener('contextmenu',e=>e.preventDefault());
const KM={' ':[190,300],ArrowUp:[190,300],ArrowLeft:[40,300],ArrowRight:[360,300],ArrowDown:[350,505],x:[350,505]};
addEventListener('keydown',e=>{const m=KM[e.key];if(!m||V.hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;e.preventDefault();if(e.repeat)return;G.down({x:m[0],y:m[1],id:'k'+e.key})});
addEventListener('keyup',e=>{if(KM[e.key]&&st==='run'&&G.up&&!V.hidden)G.up({id:'k'+e.key})});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
$('thief-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run'){G.update(dt);if(st==='run')awardBonus()}
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
