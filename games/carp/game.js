  /* ---------- 鯉魚躍龍門: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var carpBusy=false,carpStake=0,carpSay=function(){};
  (function(){
const c=$('carp-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[10, 20, 35],BONUS=5,KEY='deep-sea-carp-best',SKEY='deep-sea-carp-skin',UNIT=' 道';
let analytics=null,paid=0,awarded=new Set(),bpop=[];
const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
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
G.I={bs:n=>'最高 '+n,tap:'',title:"{{t:carp.msg.001}}",s1:"{{t:carp.msg.002}}",s2:"{{t:carp.msg.003}}",hit:"{{t:carp.msg.004}}",hook:"{{t:carp.msg.005}}",cl:n=>'已越過 '+n+' 道瀑布'};
G.skins=[{need:0,n:'{{t:carp.msg.006}}',c:['#ff6b35','#d00000'],a:0},{need:15,n:'{{t:carp.msg.007}}',c:['#ff9f1c','#e36414'],a:3},{need:40,n:'{{t:carp.msg.008}}',c:['#ffd23f','#f77f00'],a:4},{need:80,n:'{{t:carp.msg.009}}',c:['#2ec4b6','#7209b7'],a:2}];
const {GY,PXL,WW}=carpRules;
let model=carpRules.create();
const rank=timedLeaderboard('carp','carp',carpRules.inputCount,ui);
let heldBy;
G.score=()=>model.cleared;
G.extra=()=>T('cl')(model.cleared);
function control(action){if(carpRules.input(model,action)){rank.record(action);return true}return false}
G.down=p=>{if(control(0))heldBy=p.id};
G.up=p=>{if(p.id===heldBy&&control(1))heldBy=undefined};
function bg(){
const {dist}=model,par=(n,rate,span)=>((n*span-dist*rate)%((span+80)*Math.ceil(W/span))+((span+80)*Math.ceil(W/span)))%((span+80)*Math.ceil(W/span))-80;
const sky=g.createLinearGradient(0,0,0,GY);sky.addColorStop(0,'#183b56');sky.addColorStop(.48,'#477f91');sky.addColorStop(1,'#f1bb83');g.fillStyle=sky;g.fillRect(-20,0,W+40,H);
// A warm sun and layered, ink-wash mountain ridges set the Japanese print mood.
g.globalAlpha=.82;F(316,94,43,'#f6c76b');g.globalAlpha=1;C(316,94,43,'#f6c76b',2);
for(let i=0;i<3;i++){const y=GY-150+i*43,shift=par(i,.08+i*.07,180);g.beginPath();g.moveTo(-20,GY);for(let x=-20;x<=W+40;x+=8){const ridge=y+Math.sin((x+shift+i*30)/67)*26+Math.sin((x+shift)/31)*7;g.lineTo(x,ridge)}g.lineTo(W+40,GY);g.closePath();g.fillStyle=['#305968','#28656c','#357c78'][i];g.fill();g.strokeStyle=['#e9c58c','#b8c995','#89bba0'][i];g.lineWidth=2;g.stroke()}
// Waterfall curtains, drawn as flowing ink strokes rather than flat rectangles.
for(let i=0;i<3;i++){const x=par(i,.24,135)+25,w=34+(i%2)*15;g.beginPath();g.moveTo(x,GY-315);g.bezierCurveTo(x-12,GY-220,x+w+12,GY-115,x+w,GY);g.strokeStyle='rgba(226,246,229,.42)';g.lineWidth=w;g.stroke();g.beginPath();g.moveTo(x,GY-300);g.bezierCurveTo(x+10,GY-210,x-4,GY-130,x+8,GY-28);g.strokeStyle='rgba(255,248,218,.55)';g.lineWidth=2;g.stroke()}
// Clouds and drifting sakura petals.
for(let i=0;i<3;i++){const x=par(i,.11,170)+30,y=48+(i%2)*48;g.globalAlpha=.72;E(x,y,36,9,'#f6dfbe',1.5);E(x+22,y-5,20,9,'#f6dfbe',1.5);g.globalAlpha=1}
for(let i=0;i<8;i++){const x=par(i,.36,58),y=42+(i*53+tt*13)%(GY-75),r=3+i%3;g.save();g.translate(x,y);g.rotate(tt*.55+i);for(let j=0;j<5;j++){g.rotate(Math.PI*2/5);E(0,-r,r*.48,r,'#f3a5a3',1)}g.restore()}
// Foaming current at the foot of the falls.
g.fillStyle='#164c64';g.fillRect(-20,GY,W+40,H-GY);g.fillStyle='#2d8290';g.fillRect(-20,GY,W+40,14);
for(let i=0;i<15;i++){const x=par(i,.9,34),y=GY+14+(i%3)*23+Math.sin(tt*2+i)*3;g.strokeStyle=i%2?'#a9d8c8':'#f2d9ac';g.lineWidth=2;g.beginPath();g.arc(x,y,8+(i%4)*2,Math.PI,Math.PI*2);g.stroke();L2(x-7,y+5,x+8,y+5,1.5,'rgba(242,217,172,.65)')}
L2(-20,GY,W+20,GY,4,'#f6dfbe')}
function wall(o){
const top=GY-o.h, rock=g.createLinearGradient(o.x,top,o.x+WW,top+90);rock.addColorStop(0,'#a77a5c');rock.addColorStop(.5,'#765849');rock.addColorStop(1,'#493f46');
RR(o.x,top,WW,o.h+130,12,rock,3);RR(o.x-5,top-10,WW+10,19,8,'#4e8b71',3);
for(let i=0;i<4;i++){const xx=o.x+9+i*13,yy=top+22+(i%2)*23;g.beginPath();g.moveTo(xx,yy);g.quadraticCurveTo(xx+7,yy+8,xx+3,yy+22);g.strokeStyle='rgba(238,203,157,.64)';g.lineWidth=2;g.stroke()}
for(let i=0;i<5;i++){const xx=o.x+5+i*10;E(xx,top-8,3,2,'#a8c68b',1)}
g.beginPath();g.moveTo(o.x+WW,top+5);g.quadraticCurveTo(o.x+WW+10,top+o.h*.45,o.x+WW+2,top+o.h);g.strokeStyle='rgba(255,241,202,.8)';g.lineWidth=3;g.stroke();
const cx=o.x+WW/2,hookY=GY-o.hb-10;g.beginPath();g.moveTo(cx,-8);g.bezierCurveTo(cx+9,70,cx-7,hookY-42,cx,hookY);g.strokeStyle='#34495a';g.lineWidth=2.5;g.stroke();g.beginPath();g.arc(cx-7,hookY+1,9,Math.PI*1.9,Math.PI*1.1,true);g.strokeStyle='#d7b26f';g.lineWidth=4;g.stroke();C(cx-7,hookY+1,3,'#e9c58c',1.5)}
function carp(){
const {vy,on,hold,ch,py}=model,k=SK(),leap=Math.sin(tt*13),r=cl(vy/900,-.6,.6),sq=on&&hold?1-ch*.1:1,fin=leap*5+(hold?ch*7:0);
g.save();g.translate(PXL,py-16);g.rotate(r);g.scale(1,sq);
// Long, animated fan tail with ivory edging and flowing inner rays.
g.beginPath();g.moveTo(-17,0);g.bezierCurveTo(-31,-8-fin,-41,-20-fin,-55,-18-fin);g.quadraticCurveTo(-49,-5,-44,0);g.quadraticCurveTo(-51,8,-57,19+fin);g.bezierCurveTo(-38,16+fin,-27,7, -17,3);g.closePath();g.fillStyle=k.c[1];g.fill();g.strokeStyle='#f7dfb0';g.lineWidth=2.5;g.stroke();
for(let i=0;i<4;i++){g.beginPath();g.moveTo(-20,1);g.quadraticCurveTo(-37,-7+i*5,-51,-15+i*9);g.strokeStyle='rgba(255,239,202,.78)';g.lineWidth=1.3;g.stroke()}
// Flowing pectoral and dorsal fins.
g.beginPath();g.moveTo(-4,3);g.quadraticCurveTo(-1,15+fin,13,23+fin);g.quadraticCurveTo(15,10,8,3);g.closePath();g.fillStyle=k.c[1];g.fill();g.strokeStyle='#f7dfb0';g.lineWidth=2;g.stroke();
g.beginPath();g.moveTo(-7,-10);g.quadraticCurveTo(0,-30-fin*.4,15,-23);g.quadraticCurveTo(11,-13,3,-9);g.closePath();g.fillStyle=k.c[1];g.fill();g.strokeStyle='#f7dfb0';g.lineWidth=2;g.stroke();
E(0,0,27,16,k.c[0],3);E(3,6,17,8,'#f5e7c5',2);
// Koi scale pattern and flowing red-white patches, clipped to the body.
g.save();g.beginPath();g.ellipse(0,0,25,14,0,0,Math.PI*2);g.clip();
for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=-19+col*8+(row%2)*4,y=-7+row*7;g.beginPath();g.arc(x,y,5.5,.12,Math.PI-.12);g.strokeStyle='rgba(255,245,218,.7)';g.lineWidth=1.15;g.stroke()}
g.beginPath();g.moveTo(-2,-15);g.bezierCurveTo(-10,-5,4,-1,-3,14);g.strokeStyle=k.c[1];g.lineWidth=5;g.stroke();g.restore();
// Gill, bright eye, small smile and whiskers.
g.beginPath();g.arc(9,-1,7,-1.1,1.15);g.strokeStyle='rgba(67,48,48,.75)';g.lineWidth=1.5;g.stroke();C(17,-5,5.4,'#fff4d8',1.5);F(19,-5,2.4,'#233746');F(20,-6,1,'#fff');
g.beginPath();g.moveTo(23,2);g.quadraticCurveTo(31,0,34,5);g.strokeStyle='#493f46';g.lineWidth=1.5;g.stroke();
g.beginPath();g.moveTo(23,5);g.quadraticCurveTo(36,5+fin*.25,40,11+fin*.25);g.moveTo(23,7);g.quadraticCurveTo(33,11,36,17);g.strokeStyle='#f5e7c5';g.lineWidth=1.4;g.stroke();
acc(k.a,3,-20,.7);g.restore()}
G.draw=()=>{
const {obs,fx,ch}=model;
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
function release(){if(st==='run')control(2);heldBy=undefined;}
function say(text,kind){$('carp-msg').textContent=text;$('carp-msg').className='msg'+(kind?' '+kind:'')}
carpSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('carp-score',G.score()+UNIT);setText('carp-best',best+UNIT);setText('carp-pay',fmt(paid)+' 點');
 setText('carp-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:carp.msg.010}}');
 $('carp-amount').disabled=carpBusy;$('carp-go').disabled=live||rank.busy();setText('carp-go',live?'{{t:carp.msg.011}}':st==='over'?'{{t:carp.msg.012}}':'{{t:carp.msg.013}}');
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
 const s=G.score();rank.finish(s);rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});carpBusy=false;renderAll();
 say('鯉魚撞上障礙，這一局結束了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'{{t:carp.msg.014}}'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('carp',amount);carpStake=amount;carpBusy=true;save();renderAll();
 model=carpRules.create(random||Math.random);heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('{{t:carp.msg.015}}');ui();c.focus();
 },ui);
}
function overlay(){
g.fillStyle='rgba(13,39,54,.34)';g.fillRect(0,0,W,H);
// Framed story card and a small vermilion seal make the ready/result screens
// feel like part of the same illustrated print as the play scene.
g.save();g.globalAlpha=.94;RR(21,91,W-42,310,18,'rgba(19,52,68,.84)',2.5);g.restore();
g.strokeStyle='#e9c58c';g.lineWidth=1.5;g.beginPath();g.moveTo(53,107);g.lineTo(113,107);g.moveTo(287,107);g.lineTo(347,107);g.stroke();
g.save();g.translate(337,124);g.rotate(-.12);RR(-13,-13,26,26,4,'#bb4b43',1.5);g.beginPath();g.moveTo(-7,1);g.quadraticCurveTo(0,-5,7,1);g.quadraticCurveTo(0,7,-7,1);g.moveTo(-8,-6);g.lineTo(-13,-10);g.moveTo(8,-6);g.lineTo(13,-10);g.strokeStyle='#fff2d4';g.lineWidth=1.5;g.stroke();g.restore();
if(st==='ready'){C(W/2,144,27,'rgba(246,199,107,.23)',1);tx(T('title'),W/2,176,32,'#ffe19a');tx(T('s1'),W/2,218,17,'#fff4df');tx(T('s2'),W/2,244,17,'#fff4df');L2(103,273,297,273,1.5,'#d4b77c');tx('{{t:carp.msg.016}}',W/2,316,24,'#ffe19a');g.beginPath();g.moveTo(169,355);g.quadraticCurveTo(184,344,200,355);g.quadraticCurveTo(216,366,231,355);g.strokeStyle='#9bc4b5';g.lineWidth=2;g.stroke()}
else{tx(T(G.msg),W/2,145,28,'#ffb4a5');tx(String(G.score()),W/2,211,52,'#fff4df');if(G.extra)tx(G.extra(),W/2,244,17,'#f4d9a8');if(rec)tx('{{t:carp.msg.017}}',W/2,277,20,'#ffe19a');if(unl.length)tx('{{t:carp.msg.018}}'+unl.map(k=>k.n).join('、'),W/2,306,17,'#bfe8c6');tx(paid>0?'{{t:carp.msg.019}}'+paid+' 點':'{{t:carp.msg.020}}',W/2,342,20,paid>0?'#ffe19a':'#fff4df');tx('{{t:carp.msg.021}}',W/2,378,18,'#fff4df')}
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
  say(st==='over'?'{{t:carp.msg.022}}':'{{t:carp.msg.023}}');return}
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
  if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{carpRules.advance(model,step);if(model.dead)die(model.dead);else awardBonus()})
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
