  /* ---------- 寶寶逃洗澡: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var babyBusy=false,babyStake=0,babySay=function(){};
  (function(){
const c=$('baby-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[200, 500, 900],BONUS=5,KEY='deep-sea-baby-best',SKEY='deep-sea-baby-skin',UNIT=' m';
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
G.I={bs:n=>'最高 '+n,tap:'',title:"寶寶逃洗澡！",s1:"媽媽拿著浴巾，寶寶只穿了一件尿布！",s2:"跳過玩具、鑽過櫃子，大哭攔住媽媽。",caught:"被媽媽抱去洗澡了！",bt:n=>'已喝奶瓶：'+n,sh:['來洗澡！','別跑！','水很溫暖！']};
G.skins=[{need:0,n:'藍尿布寶寶',c:['#a0c4ff','#ffd6a5'],a:0},{need:200,n:'兔耳寶寶',c:['#ffc8dd','#ffafcc'],a:1},{need:500,n:'生日寶寶',c:['#b7e4c7','#74c69d'],a:3},{need:1000,n:'搗蛋之王',c:['#ffd23f','#ff9f1c'],a:2}];
const GY=440,PXL=170;
let dist,v,gap,py,vy,on,crawl,cid,obs,nextAt,stun,fx,charge,mstun,bots,rings;
G.reset=()=>{dist=0;v=260;gap=150;py=GY;vy=0;on=true;crawl=false;obs=[];nextAt=450;stun=0;fx=[];charge=0;mstun=0;bots=0;rings=[]};
G.score=()=>Math.floor(dist/60);
G.extra=()=>T('bt')(bots);
function wail(){if(charge<=0||mstun>0)return;charge--;mstun=2.2;gap=Math.min(220,gap+50);shake=reduceMotion?0:.3;rings.push({t:0})}
G.down=p=>{if(Math.hypot(p.x-340,p.y-505)<50)wail();else if(p.x<200){if(on){vy=-600;on=false}}else{crawl=true;cid=p.id}};
G.up=p=>{if(p.id===cid)crawl=false};
function spawn(){
const t=['l','c','s'][(Math.random()*3)|0];
obs.push({t,x:W+40});
if(Math.random()<.45)obs.push({t:'b',x:W+40+(t==='s'?40:6),hi:t!=='s'});
nextAt=dist+rnd(320,460)-Math.min(110,dist*.01)}
G.update=dt=>{
v=Math.min(430,260+dist*.01);dist+=v*dt;
if(mstun>0){mstun-=dt;gap=Math.min(220,gap+v*.5*dt)}else gap-=(6+dist*.003)*dt;
if(stun>0)stun-=dt;
rings.forEach(r=>r.t+=dt);rings=rings.filter(r=>r.t<.7);
if(dist>=nextAt)spawn();
vy+=2300*dt;py+=vy*dt;if(py>=GY){py=GY;vy=0;on=true}else on=false;
const cr=crawl&&on,top=py-(cr?24:46);
for(const o of obs){
o.x-=(o.t==='c'?v+120:v)*dt;
if(o.t==='b'){const iy=o.hi?GY-70:GY-16;if(!o.g&&Math.hypot(o.x-PXL,iy-(py-(cr?12:23)))<28){o.g=1;bots++;charge=Math.min(3,charge+1);fx.push({s:'+',x:PXL,y:py-80,t:0})}}
else if(stun<=0){
const r=o.t==='l'?[o.x,GY-30,o.x+30,GY]:o.t==='c'?[o.x,GY-28,o.x+42,GY]:[o.x,GY-100,o.x+80,GY-34];
if(PXL+10>r[0]&&PXL-10<r[2]&&py>r[1]&&top<r[3]){gap-=60;stun=.9;shake=reduceMotion?0:.25}}}
obs=obs.filter(o=>o.x>-120&&!o.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(gap<=0)die('caught')};
function bg(){
g.fillStyle='#ffc8dd';g.fillRect(-20,0,W+40,GY);
for(let i=0;i<12;i++)for(let j=0;j<5;j++){const x=((i*50-dist*.3)%600+600)%600-50;F(x+(j%2)*25,30+j*70,6,'#ffafcc')}
for(let i=0;i<3;i++){const x=((i*260-dist*.2)%780+780)%780-140;RR(x,70,110,120,8,'#bde0fe',3);L2(x+55,70,x+55,190,3);L2(x,130,x+110,130,3);RR(x-14,64,22,136,6,'#ffd6a5',3)}
for(let i=0;i<4;i++){const x=((i*190-dist*.45)%760+760)%760-120;RR(x,GY-90,90,90,8,'#cdb4db',3);RR(x+8,GY-80,34,34,4,'#ffd23f',2.5);RR(x+48,GY-80,34,34,4,'#ff5d8f',2.5)}
g.fillStyle='#c08552';g.fillRect(-20,GY,W+40,H-GY);
for(let i=0;i<10;i++){const x=((i*70-dist)%700+700)%700-70;L2(x,GY,x-30,H,2,'#8d5524')}
L2(-20,GY,W+20,GY,4)}
function drawObs(o){
const x=o.x;
if(o.t==='l'){RR(x,GY-30,30,30,4,'#e63946',3);C(x+8,GY-32,4,'#e63946',2.5);C(x+22,GY-32,4,'#e63946',2.5)}
else if(o.t==='c'){RR(x,GY-26,42,16,6,'#2ec4b6',3);RR(x+10,GY-38,22,14,5,'#8ecae6',2.5);C(x+9,GY-6,7,'#333',2.5);C(x+33,GY-6,7,'#333',2.5)}
else if(o.t==='s'){L2(x+8,GY-100,x+8,GY,6);L2(x+72,GY-100,x+72,GY,6);RR(x,GY-100,80,66,6,'#ffd23f',3);RR(x+8,GY-90,28,22,3,'#ff8fab',2);RR(x+44,GY-90,28,22,3,'#a0c4ff',2)}
else{const y=o.hi?GY-70:GY-16;RR(x-7,y-12,14,22,5,'#fff',2.5);RR(x-4,y-18,8,8,2,'#ff8fab',2.5);L2(x-4,y-4,x+4,y-4,2,'#8ecae6')}}
function mom(){
const cx=PXL-gap-70,y=GY,run=mstun>0?0:Math.sin(tt*14)*10;
L2(cx-14,y-50,cx-14+run,y,14,'#5e548e');L2(cx+14,y-50,cx+14-run,y,14,'#5e548e');
E(cx,y-96,48,48,'#ff6b9a',4);E(cx,y-86,26,32,'#fff1c1',3);
if(mstun>0){L2(cx-34,y-106,cx-18,y-148,11,'#f5cba7');L2(cx+34,y-106,cx+20,y-148,11,'#f5cba7')}
else{L2(cx+34,y-110,cx+70,y-130,11,'#f5cba7');RR(cx+50,y-166,34,48,6,'#8ecae6',3)}
C(cx,y-156,26,'#f5cba7',4);
[-14,0,14].forEach(d=>RR(cx+d-4,y-190,8,22,4,'#2ec4b6',2.5));
if(mstun>0){L2(cx-14,y-160,cx-6,y-157,3);L2(cx+14,y-160,cx+6,y-157,3);E(cx,y-142,8,5,'#7a1c1c',2.5);tx('*',cx-26,y-182,24,'#ffd23f');tx('*',cx+26,y-182,24,'#ffd23f')}
else{C(cx-9,y-158,5.5,'#fff',2);C(cx+9,y-158,5.5,'#fff',2);F(cx-7,y-158,2.2,OL);F(cx+11,y-158,2.2,OL);L2(cx-16,y-168,cx-4,y-163,3.5);L2(cx+16,y-168,cx+4,y-163,3.5);E(cx,y-142,9,6,'#7a1c1c',2.5)}}
function baby(){
if(stun>0&&Math.floor(tt*20)%2)return;
const k=SK(),cr=crawl&&on,sw=on?Math.sin(tt*20)*7:0;
g.save();g.translate(PXL,py);if(cr){g.rotate(1.15);g.translate(4,-2)}
L2(-6,-14,-6+(on?sw:-5),0,8,'#f5cba7');L2(6,-14,6+(on?-sw:6),0,8,'#f5cba7');
RR(-12,-34,24,22,8,k.c[0],3);RR(-12,-20,24,10,5,'#fff',2.5);
C(0,-48,17,'#f5cba7',3);g.beginPath();g.arc(0,-53,8,Math.PI,0);O(k.c[1],2.5);
C(6,-48,3.2,'#fff',1.5);F(7,-48,1.6,OL);E(8,-41,4,2.5,'#ff8fab',1.5);
acc(k.a,0,-64,.9);g.restore()}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();obs.forEach(drawObs);mom();baby();
rings.forEach(r=>{g.globalAlpha=1-r.t/.7;g.strokeStyle='#ff5d8f';g.lineWidth=5;g.beginPath();g.arc(PXL,py-30,20+r.t*300,0,7);g.stroke();g.globalAlpha=1});
g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
tx(String(G.score())+' m',16,42,32,'#fff','left');tx(T('bs')(best),16,66,14,'#ffd23f','left');
RR(16,78,W-32,10,5,'rgba(255,255,255,.3)',2);const r=cl(1-gap/220,0,1);if(r>0)RR(16,78,Math.max(10,(W-32)*r),10,5,r>.7?'#e63946':'#6cf0a8',2);
if(st==='run'&&gap<110&&mstun<=0)tx(T('sh')[Math.floor(tt/1.4)%3],120,290,22,'#ff7a7a');
C(340,505,44,'#fff1c1',4);for(let i=0;i<3;i++)C(318+i*22,545,6,i<charge?'#ff5d8f':'#ced4da',2);
E(340,503,20,14,'#ff8fab',3);F(332,500,3,OL);F(348,500,3,OL);E(340,512,8,5,'#7a1c1c',2.5)};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-baby');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){crawl=false;}
function say(text,kind){$('baby-msg').textContent=text;$('baby-msg').className='msg'+(kind?' '+kind:'')}
babySay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('baby-score',G.score()+UNIT);setText('baby-best',best+UNIT);setText('baby-pay',fmt(paid)+' 點');
 setText('baby-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('baby-amount').disabled=babyBusy;$('baby-go').disabled=live;setText('baby-go',live?'逃跑中 · 跳躍／爬行':st==='over'?'再逃一次':'開始逃跑');
 document.querySelectorAll('[data-baby-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-baby-tier')))?'step':'false'));
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
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});babyBusy=false;renderAll();
 say('被媽媽抓去洗澡了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'這一局沒有 BONUS。'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('baby',amount);babyStake=amount;babyBusy=true;save();renderAll();
 G.reset();paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('開始！點畫面跳躍，越過障礙。');ui();c.focus();
}
function overlay(){
g.fillStyle='rgba(27,27,47,.6)';g.fillRect(0,0,W,H);
if(st==='ready'){tx(T('title'),W/2,170,32,'#ffd23f');tx(T('s1'),W/2,218,17,'#fff');tx(T('s2'),W/2,244,17,'#fff');tx('右側開始',W/2,312,24,'#ffd23f')}
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
  say(st==='over'?'這一局已結束。按「再逃一次」開始新的一局。':'先按「開始逃跑」。');return}
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
$('baby-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run'){G.update(dt);if(st==='run')awardBonus()}
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
