  /* ---------- 鯉魚躍龍門: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var carpBusy=false,carpStake=0,carpSay=function(){};
  (function(){
const c=$('carp-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[10, 20, 35],BONUS=5,KEY='deep-sea-carp-best',SKEY='deep-sea-carp-skin',UNIT=' 道';
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
G.I={bs:n=>'最高 '+n,tap:'',title:"鯉魚躍龍門",s1:"鯉魚逆流而上，要變成龍！",s2:"按住蓄力，放開起跳。別撞到石頭和魚鉤。",hit:"撞到石頭了！",hook:"被魚鉤鉤住了！",cl:n=>'已越過 '+n+' 道瀑布'};
G.skins=[{need:0,n:'紅鯉魚',c:['#ff6b35','#d00000'],a:0},{need:15,n:'派對鯉魚',c:['#ff9f1c','#e36414'],a:3},{need:40,n:'金鯉魚',c:['#ffd23f','#f77f00'],a:4},{need:80,n:'化龍鯉魚',c:['#2ec4b6','#7209b7'],a:2}];
const GY=430,PXL=110,WW=54;
let dist,v,py,vy,on,hold,hid,ch,obs,nextAt,cleared,fx;
G.reset=()=>{dist=0;v=280;py=GY;vy=0;on=true;hold=false;ch=0;obs=[];nextAt=420;cleared=0;fx=[]};
G.score=()=>cleared;
G.extra=()=>T('cl')(cleared);
G.down=p=>{if(on&&!hold){hold=true;hid=p.id;ch=0}};
G.up=p=>{if(hold&&p.id===hid){hold=false;vy=-Math.sqrt(2*2200*(40+170*ch));on=false}};
function spawn(){
const h=(cleared<4?[60,110]:[60,110,160])[(Math.random()*(cleared<4?2:3))|0];
obs.push({x:W+50,h,hb:h+130-Math.min(40,cleared*2),d:0});
nextAt=dist+rnd(400,500)}
G.update=dt=>{
v=280+Math.min(120,cleared*3);dist+=v*dt;
if(dist>=nextAt)spawn();
if(hold)ch=Math.min(1,ch+dt/.9);
vy+=2200*dt;py+=vy*dt;if(py>=GY){if(!on)fx.push({s:'~',x:PXL,y:GY-10,t:0});py=GY;vy=0;on=true}else on=false;
for(const o of obs){o.x-=v*dt;
if(PXL+14>o.x&&PXL-14<o.x+WW&&py>GY-o.h){die('hit');return}
if(Math.abs(PXL-(o.x+WW/2))<22&&py-28<GY-o.hb){die('hook');return}
if(!o.d&&o.x+WW<PXL-14){o.d=1;cleared++;fx.push({s:'+1',x:PXL,y:py-50,t:0})}}
obs=obs.filter(o=>o.x>-90);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8)};
function bg(){
const sg=g.createLinearGradient(0,0,0,GY);sg.addColorStop(0,'#8ecae6');sg.addColorStop(1,'#ffe8d6');g.fillStyle=sg;g.fillRect(-20,0,W+40,GY);
g.fillStyle='#4d908e';for(let i=0;i<4;i++){const x=((i*200-dist*.08)%800+800)%800-200;P([[x,GY],[x+120,GY-250],[x+260,GY]],'#4d908e',3)}
for(let i=0;i<6;i++){const x=((i*110-dist*.25)%660+660)%660-60;g.fillStyle='rgba(255,255,255,.75)';g.fillRect(x,GY-330+(i%3)*30,12,260)}
g.fillStyle='#219ebc';g.fillRect(-20,GY,W+40,H-GY);g.fillStyle='#48cae4';g.fillRect(-20,GY,W+40,14);
for(let i=0;i<10;i++){const x=((i*70-dist)%700+700)%700-60;g.strokeStyle='#bde0fe';g.lineWidth=3;g.beginPath();g.arc(x,GY+10,12,Math.PI,0);g.stroke()}
L2(-20,GY,W+20,GY,4)}
function wall(o){
RR(o.x,GY-o.h,WW,o.h+130,7,'#8d6e63',3);RR(o.x-3,GY-o.h-8,WW+6,16,6,'#52b788',3);
L2(o.x+12,GY-o.h+20,o.x+22,GY-o.h+40,2.5);L2(o.x+36,GY-o.h+30,o.x+30,GY-o.h+56,2.5);
g.fillStyle='rgba(255,255,255,.75)';g.fillRect(o.x+WW,GY-o.h,9,o.h);
const cx=o.x+WW/2;
L2(cx,0,cx,GY-o.hb-16,3,'#fff');g.beginPath();g.arc(cx-7,GY-o.hb-8,9,Math.PI*1.9,Math.PI*1.1,true);g.strokeStyle=OL;g.lineWidth=4;g.stroke();F(cx+3,GY-o.hb-18,3,'#ff8fab')}
function carp(){
const k=SK(),r=cl(vy/900,-.6,.6),sq=on&&hold?1-ch*.15:1;
g.save();g.translate(PXL,py-16);g.rotate(r);g.scale(1,sq);
P([[-18,0],[-42,-14],[-36,0],[-42,14]],k.c[1],3);
E(0,0,24,15,k.c[0],3);E(2,5,15,7,'#ffe8d6',2);
P([[-6,-13],[6,-13],[-2,-26]],k.c[1],3);
[-8,2,12].forEach(x=>{g.strokeStyle=k.c[1];g.lineWidth=2;g.beginPath();g.arc(x,-2,6,.4,2.7);g.stroke()});
C(14,-4,6,'#fff',2);F(16,-4,2.6,OL);
g.strokeStyle=OL;g.lineWidth=2.5;g.beginPath();g.moveTo(24,2);g.quadraticCurveTo(36,0,38,10);g.moveTo(24,5);g.quadraticCurveTo(34,10,32,18);g.stroke();
acc(k.a,6,-20,.8);g.restore()}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();obs.forEach(wall);carp();g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
RR(28,GY-170,16,170,6,'rgba(255,255,255,.35)',2.5);
const nx=obs.find(o=>o.x+WW>PXL-14);
if(nx){const a=cl((nx.h+8-40)/170,0,1),b=cl((nx.hb-30-40)/170,0,1);g.fillStyle='rgba(108,240,168,.85)';g.fillRect(29,GY-170*b,14,170*(b-a))}
if(ch>0){g.fillStyle='#ffd23f';g.fillRect(29,GY-170*ch,14,170*ch)}
tx(String(G.score()),16,42,32,'#fff','left');tx(T('bs')(best),16,66,14,'#ffd23f','left')};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-carp');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){hold=false;ch=0;}
function say(text,kind){$('carp-msg').textContent=text;$('carp-msg').className='msg'+(kind?' '+kind:'')}
carpSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('carp-score',G.score()+UNIT);setText('carp-best',best+UNIT);setText('carp-pay',fmt(paid)+' 點');
 setText('carp-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('carp-amount').disabled=carpBusy;$('carp-go').disabled=live;setText('carp-go',live?'挑戰中 · 按住蓄力':st==='over'?'扣點再躍一次':'扣點開始躍龍門');
 document.querySelectorAll('[data-carp-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-carp-tier')))?'step':'false'));
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
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});carpBusy=false;renderAll();
 say('鯉魚撞上障礙，這一局結束了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'這一局沒有 BONUS。'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('carp',amount);carpStake=amount;carpBusy=true;S.balance-=amount;save();renderAll();
 G.reset();paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('開始！點畫面跳躍，越過障礙。');ui();c.focus();
}
function overlay(){
g.fillStyle='rgba(27,27,47,.6)';g.fillRect(0,0,W,H);
if(st==='ready'){tx(T('title'),W/2,170,32,'#ffd23f');tx(T('s1'),W/2,218,17,'#fff');tx(T('s2'),W/2,244,17,'#fff');tx('右側扣點開始',W/2,312,24,'#ffd23f')}
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
  say(st==='over'?'這一局已結束。按「扣點再躍一次」開始新的一局。':'先按「扣點開始躍龍門」。');return}
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
$('carp-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run'){G.update(dt);if(st==='run')awardBonus()}
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
