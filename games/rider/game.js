  /* ---------- 外送員大戰惡犬: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var riderBusy=false,riderStake=0,riderSay=function(){};
  (function(){
const c=$('rider-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[300, 700, 1300],BONUS=5,KEY='deep-sea-rider-best',SKEY='deep-sea-rider-skin',UNIT=' 分';
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
G.I={bs:n=>'最高 '+n,tap:'',title:"外送員大戰惡犬！",s1:"熱騰騰的訂單快涼了，巷子裡還有狗在追！",s2:"準時送達，閃開坑洞，按喇叭嚇跑狗。",cold:"餐涼了，被打一星！",dl:n=>'已送達 '+n+' 單',bip:"嗶嗶！",bom:"沒送到！"};
G.skins=[{need:0,n:'菜鳥外送員',c:['#2ec4b6','#ff9f1c'],a:0},{need:300,n:'西瓜安全帽',c:['#7bd88f','#e63946'],a:1},{need:800,n:'派對外送員',c:['#ff5d8f','#ffd23f'],a:3},{need:1600,n:'外送之王',c:['#ffd23f','#e63946'],a:2}];
const GY=440,PXL=130;
let dist,v,hot,py,vy,on,gas,hold,hid,hcool,obs,nextAt,nextHouse,stun,fx,deliv,boosting;
let model=riderRules.create(),heldBy;
const rank=timedLeaderboard('rider','rider',5,ui);
function syncModel(){({dist,v,hot,py,vy,on,gas,hold,hid,hcool,obs,nextAt,nextHouse,stun,fx,deliv,boosting}=model.snapshot());const next=model.snapshot().shake;if(next)shake=next;}
function control(code){if(!riderRules.input(model,code))return;rank.record(code);syncModel();}
G.reset=()=>{model=riderRules.create();syncModel();};
G.score=()=>model.score();
G.extra=()=>T('dl')(deliv);
G.down=p=>{
 const code=Math.hypot(p.x-340,p.y-505)<50?2:p.x<200?0:1;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{riderRules.advance(model,dt);syncModel();if(model.dead)die(model.dead);};
function bg(){
const sg=g.createLinearGradient(0,0,0,GY);sg.addColorStop(0,'#6a4c93');sg.addColorStop(1,'#ff9a8b');g.fillStyle=sg;g.fillRect(-20,0,W+40,GY);
for(let i=0;i<8;i++){const x=((i*90-dist*.15)%720+720)%720-100,h=120+(i*53)%90;g.fillStyle='#3d2c5e';g.fillRect(x,GY-h,70,h);g.fillStyle='#ffd166';for(let r=0;r<3;r++)g.fillRect(x+12,GY-h+14+r*30,10,14),g.fillRect(x+42,GY-h+14+r*30,10,14)}
for(let i=0;i<4;i++){const x=((i*200-dist*.6)%800+800)%800-80;L2(x,GY,x,GY-130,5);C(x,GY-136,9,'#ffe8a3',3)}
g.fillStyle='#3a3a52';g.fillRect(-20,GY,W+40,H-GY);g.fillStyle='#5c5c7a';g.fillRect(-20,GY,W+40,12);
for(let i=0;i<8;i++){const x=((i*90-dist)%720+720)%720-80;g.fillStyle='#fff1c1';g.fillRect(x,GY+80,46,6)}
L2(-20,GY,W+20,GY,4)}
function wheel(x,y){C(x,y,14,'#333',3);const a=dist*.05;L2(x-10*Math.cos(a),y-10*Math.sin(a),x+10*Math.cos(a),y+10*Math.sin(a),2,'#aaa');L2(x+10*Math.sin(a),y-10*Math.cos(a),x-10*Math.sin(a),y+10*Math.cos(a),2,'#aaa')}
function bike(){
if(stun>0&&Math.floor(tt*20)%2)return;
const k=SK();
g.save();g.translate(PXL,py);g.rotate((py<GY-2?-.35:0)+(stun>0?Math.sin(tt*40)*.08:0));
wheel(-26,-14);wheel(26,-14);
P([[-26,-14],[-10,-34],[16,-34],[26,-14],[8,-14]],'#ffd166',3);
RR(-48,-66,38,34,7,'#e63946',3);C(-29,-49,6,'#fff',2);F(-31,-51,1.4,OL);F(-27,-51,1.4,OL);
RR(-10,-70,20,34,7,k.c[0],3);L2(8,-58,26,-44,6,k.c[0]);
C(2,-80,13,'#f5cba7',3);g.beginPath();g.arc(2,-82,15,Math.PI,0);O(k.c[1],3);F(8,-80,2.2,OL);
acc(k.a,2,-96,.9);
if(boosting){P([[-52,-20],[-84,-26],[-52,-32]],'#ff9f1c',2);P([[-52,-14],[-70,-18],[-52,-22]],'#ffd23f',2)}
g.restore()}
function dog(o){
g.save();g.translate(o.x,GY);if(o.fl)g.scale(-1,1);
const s=Math.sin(tt*20)*6;
L2(-10,-14,-10+s,0,6,'#8d5524');L2(10,-14,10-s,0,6,'#8d5524');
E(0,-22,22,13,'#c08552',3);L2(20,-26,32,-36,5,'#c08552');
C(-24,-32,12,'#c08552',3);E(-30,-24,10,7,'#f1d3a0',2.5);F(-38,-27,3,OL);E(-16,-44,5,10,'#8d5524',2.5);F(-22,-35,2.2,OL);
if(!o.fl){E(-30,-17,3,6,'#ff5d8f',1.5);tx('!',-46,-50,16,'#fff')}
g.restore()}
function house(o){
const x=o.x;
RR(x-50,GY-170,100,170,6,'#ffd6a5',3);P([[x-60,GY-170],[x,GY-212],[x+60,GY-170]],'#e63946',3);
RR(x-14,GY-76,28,76,4,'#8d5524',3);RR(x-38,GY-130,22,24,3,'#a0c4ff',2.5);RR(x+16,GY-130,22,24,3,'#a0c4ff',2.5);
tx(String(10+Math.floor(o.x*0+17)),x,GY-90,14,'#fff');
if(!o.dn){g.fillStyle='rgba(108,240,168,.35)';g.fillRect(x-100,GY+2,200,40);g.strokeStyle='#6cf0a8';g.lineWidth=3;g.strokeRect(x-100,GY+2,200,40)}
if(o.tm>0&&!o.dn){RR(x-30,GY+16,60,10,5,'rgba(255,255,255,.4)',2);RR(x-30,GY+16,60*cl(o.tm/.45,0,1),10,5,'#6cf0a8',2)}
C(x+66,GY-24,9,'#f5cba7',3);RR(x+58,GY-18,16,20,5,'#ff5d8f',3)}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();obs.forEach(o=>{if(o.t==='h')house(o)});
obs.forEach(o=>{if(o.t==='p'){E(o.x+28,GY+6,30,7,'#1b1b2f',2);L2(o.x+10,GY+4,o.x+2,GY+12,2,'#555')}else if(o.t==='dog')dog(o)});
bike();g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
tx(String(G.score()),16,42,32,'#fff','left');tx(T('bs')(best),16,66,14,'#ffd23f','left');
const h=cl(hot/100,0,1);RR(16,78,W-32,12,6,'rgba(255,255,255,.3)',2);if(h>0)RR(16,78,Math.max(12,(W-32)*h),12,6,h>.4?'#ff9f1c':'#8ecae6',2);
RR(16,96,120,8,4,'rgba(255,255,255,.3)',2);if(gas>3)RR(16,96,120*gas/100,8,4,'#ffd23f',2);
C(340,505,44,'#fff1c1',4);P([[322,498],[338,498],[356,488],[356,522],[338,512],[322,512]],'#ff9f1c',3);
if(hcool>0){g.strokeStyle='#ff5d8f';g.lineWidth=5;g.beginPath();g.arc(340,505,51,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-hcool));g.stroke()}};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-rider');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){if(st==='run')control(4);heldBy=undefined;}
function say(text,kind){$('rider-msg').textContent=text;$('rider-msg').className='msg'+(kind?' '+kind:'')}
riderSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('rider-score',G.score()+UNIT);setText('rider-best',best+UNIT);setText('rider-pay',fmt(paid)+' 點');
 setText('rider-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('rider-amount').disabled=riderBusy;$('rider-go').disabled=live||rank.busy();setText('rider-go',live?'送餐中 · 跳躍／加速':st==='over'?'再送一次':'開始送餐');
 document.querySelectorAll('[data-rider-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-rider-tier')))?'step':'false'));
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
 const s=G.score();rank.finish(s);rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});riderBusy=false;renderAll();
 say('訂單涼掉了，這一局結束了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'這一局沒有 BONUS。'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('rider',amount);riderStake=amount;riderBusy=true;save();renderAll();
 model=riderRules.create(random||Math.random);syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('開始！點畫面跳躍，越過障礙。');ui();c.focus();
 },ui);
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
  say(st==='over'?'這一局已結束。按「再送一次」開始新的一局。':'先按「開始送餐」。');return}
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
$('rider-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
