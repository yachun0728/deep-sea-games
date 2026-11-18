  /* ---------- 胖老闆追人: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var bossBusy=false,bossStake=0,bossSay=function(){};
  (function(){
const c=$('boss-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[200, 500, 900],BONUS=5,KEY='deep-sea-boss-best',SKEY='deep-sea-boss-skin',UNIT=' m';
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
G.I={bs:n=>'最高 '+n,tap:'',title:"胖老闆追人！",s1:"你遲到了，大肚子老闆滾著追來！",s2:"跳躍、滑行，再用甜甜圈引開他。",caught:"被老闆抓住了！",fat:n=>'老闆吃了 '+n+' 個甜甜圈',sh:['又遲到？！','扣薪水！','站住！']};
G.skins=[{need:0,n:'新進員工',c:['#4cc9f0','#1d3557'],a:0},{need:200,n:'IT 工程師',c:['#ffb703','#fb8500'],a:1},{need:500,n:'逃跑總監',c:['#e63946','#9d0208'],a:4},{need:1000,n:'截稿超人',c:['#ffd23f','#e76f51'],a:2}];
const GY=440,PXL=170;
let dist,v,gap,fat,py,vy,on,slide,sid,obs,nextAt,stun,fx;
G.reset=()=>{dist=0;v=300;gap=150;fat=0;py=GY;vy=0;on=true;slide=false;obs=[];nextAt=500;stun=0;fx=[]};
G.score=()=>Math.floor(dist/60);
G.extra=()=>T('fat')(fat);
G.down=p=>{if(Math.hypot(p.x-340,p.y-505)<50){slide=true;sid=p.id}else if(on){vy=-640;on=false}};
G.up=p=>{if(p.id===sid)slide=false};
function spawn(){
const t=['t','b','h'][(Math.random()*3)|0],x=W+40;
obs.push({t,x});
if(Math.random()<.5)obs.push(t==='h'?{t:'k',x:x+40}:{t:'d',x:x+8});
nextAt=dist+rnd(330,470)-Math.min(120,dist*.01)}
G.update=dt=>{
v=Math.min(470,300+dist*.012);dist+=v*dt;
gap=Math.min(220,gap-(5+fat*4+(v-300)*.03)*dt);
if(stun>0)stun-=dt;
if(dist>=nextAt)spawn();
vy+=2300*dt;py+=vy*dt;if(py>=GY){py=GY;vy=0;on=true}else on=false;
const ph=slide&&on?26:54,top=py-ph;
for(const o of obs){o.x-=v*dt;
if(o.t==='d'||o.t==='k'){const iy=o.t==='d'?GY-100:GY-18;
if(!o.g&&Math.hypot(o.x-PXL,iy-(py-ph/2))<28){o.g=1;if(o.t==='d'){fat++;gap+=45;fx.push({s:'+',x:PXL,y:py-80,t:0})}else gap+=80}}
else if(stun<=0){
const r=o.t==='t'?[o.x,GY-38,o.x+34,GY]:o.t==='b'?[o.x,GY-52,o.x+26,GY]:[o.x,GY-120,o.x+90,GY-40];
if(PXL+10>r[0]&&PXL-10<r[2]&&py>r[1]&&top<r[3]){gap-=60;stun=.9;shake=reduceMotion?0:.25}}}
obs=obs.filter(o=>o.x>-120&&!o.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(gap<=0)die('caught')};
function bg(){
g.fillStyle='#a0c4ff';g.fillRect(-20,0,W+40,GY);
for(let i=0;i<4;i++){const x=((i*170-dist*.12)%680+680)%680-120;RR(x,60,110,140,10,'#ffe8a3',3);L2(x+55,60,x+55,200,3);L2(x,130,x+110,130,3)}
for(let i=0;i<5;i++){const x=((i*140-dist*.4)%700+700)%700-100;RR(x,GY-110,110,110,8,'#bdb2ff',3);RR(x+20,GY-85,36,26,4,'#8ecae6',2.5)}
g.fillStyle='#6d597a';g.fillRect(-20,GY,W+40,H-GY);g.fillStyle='#b56576';g.fillRect(-20,GY,W+40,14);
for(let i=0;i<10;i++){const x=((i*60-dist)%600+600)%600-60;L2(x,GY+14,x-30,H,2,'#5a4a6a')}
L2(-20,GY,W+20,GY,4)}
function drawObs(o){
const x=o.x;
if(o.t==='t'){RR(x+4,GY-26,28,9,3,'#2ec4b6',2.5);RR(x+8,GY-40,10,18,3,'#2ec4b6',2.5);L2(x+18,GY-17,x+18,GY-6,3);L2(x+6,GY-5,x+30,GY-5,3);C(x+8,GY-4,3,'#333',1.5);C(x+28,GY-4,3,'#333',1.5)}
else if(o.t==='b'){RR(x,GY-50,26,50,5,'#adb5bd',3);C(x+13,GY-54,8,'#fff',2)}
else if(o.t==='h'){L2(x+10,0,x+10,GY-120,3);L2(x+80,0,x+80,GY-120,3);RR(x,GY-120,90,80,8,'#e63946',3);tx('DEADLINE',x+45,GY-74,15,'#fff')}
else if(o.t==='d'){C(x,GY-100,12,'#ff8fab',3);F(x,GY-100,4,'#a0c4ff');F(x-6,GY-105,1.6,'#ffd23f')}
else{RR(x-9,GY-26,18,20,4,'#fff',3);F(x,GY-24,6,'#6b4423');L2(x-3,GY-34,x-3,GY-28,2,'#fff')}}
function boss(){
const s=Math.min(1.8,1+fat*.1),cx=PXL-gap-62*s,y=GY,sw=Math.sin(tt*14)*10*s;
L2(cx-18*s,y-40*s,cx-18*s+sw,y,16*s,'#3d405b');L2(cx+18*s,y-40*s,cx+18*s-sw,y,16*s,'#3d405b');
E(cx,y-86*s,62*s,54*s,'#3d405b',4);E(cx+10*s,y-80*s,38*s,36*s,'#f1faee',3);
[-14,0,14].forEach(b=>F(cx+10*s,y-(80+b)*s,3*s,OL));
P([[cx+2*s,y-120*s],[cx+22*s,y-120*s],[cx+28*s,y-72*s],[cx+12*s,y-62*s],[cx-4*s,y-72*s]],'#e63946',3);
L2(cx+44*s,y-104*s,cx+74*s,y-134*s,12*s,'#3d405b');C(cx+78*s,y-138*s,9*s,'#f5cba7',3);
C(cx+16*s,y-150*s,28*s,'#f5cba7',4);
g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.arc(cx+16*s,y-160*s,17*s,Math.PI*1.1,Math.PI*1.9);g.stroke();
C(cx+26*s,y-152*s,6*s,'#fff',2);C(cx+8*s,y-152*s,6*s,'#fff',2);F(cx+28*s,y-152*s,2.5*s,OL);F(cx+10*s,y-152*s,2.5*s,OL);
L2(cx+20*s,y-162*s,cx+34*s,y-157*s,4);L2(cx+2*s,y-157*s,cx+14*s,y-162*s,4);
E(cx+22*s,y-135*s,10*s,7*s,'#7a1c1c',2.5);E(cx+52*s,y-158*s,3*s,5*s,'#8ecae6',1.5)}
function emp(){
if(stun>0&&Math.floor(tt*20)%2)return;
const k=SK(),sl=slide&&on,sw=on?Math.sin(tt*20)*8:0;
g.save();g.translate(PXL,py);if(sl){g.rotate(1.25);g.translate(8,-4)}
L2(-6,-16,-6+(on?sw:-6),0,9,k.c[1]);L2(6,-16,6+(on?-sw:8),0,9,k.c[1]);
RR(-12,-46,24,32,7,k.c[0],3);P([[-3,-44],[3,-44],[5,-26],[0,-22],[-5,-26]],'#e63946',2);
C(0,-58,15,'#f5cba7',3);g.beginPath();g.arc(0,-62,15,Math.PI,0);O(k.c[1],3);
C(6,-58,3,'#fff',1.5);F(7,-58,1.5,OL);
acc(k.a,0,-76,1);g.restore()}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();obs.forEach(drawObs);boss();emp();g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
tx(G.score()+' m',16,42,32,'#fff','left');tx(T('bs')(best),16,66,14,'#ffd23f','left');
RR(16,78,W-32,10,5,'rgba(255,255,255,.3)',2);const r=cl(1-gap/220,0,1);if(r>0)RR(16,78,Math.max(10,(W-32)*r),10,5,r>.7?'#e63946':'#6cf0a8',2);
if(st==='run'&&gap<120)tx(T('sh')[Math.floor(tt/1.4)%3],130,300,22,'#ff7a7a');
C(340,505,44,'#fff1c1',4);P([[324,494],[356,494],[340,520]],'#e63946',3)};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-boss');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){slide=false;}
function say(text,kind){$('boss-msg').textContent=text;$('boss-msg').className='msg'+(kind?' '+kind:'')}
bossSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('boss-score',G.score()+UNIT);setText('boss-best',best+UNIT);setText('boss-pay',fmt(paid)+' 點');
 setText('boss-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('boss-amount').disabled=bossBusy;$('boss-go').disabled=live;setText('boss-go',live?'逃跑中 · 跳躍／滑行':st==='over'?'免費再逃一次':'免費開始逃跑');
 document.querySelectorAll('[data-boss-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-boss-tier')))?'step':'false'));
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
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});bossBusy=false;renderAll();
 say('被老闆抓住了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'這一局沒有 BONUS。'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('boss',amount);bossStake=amount;bossBusy=true;save();renderAll();
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
  say(st==='over'?'這一局已結束。按「免費再逃一次」開始新的一局。':'先按「免費開始逃跑」。');return}
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
$('boss-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run'){G.update(dt);if(st==='run')awardBonus()}
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
