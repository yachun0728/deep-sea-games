  /* ---------- 偷水果的貓: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var thiefBusy=false,thiefStake=0,thiefSay=function(){};
  (function(){
const c=$('thief-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,OL='#4a2c1d',G={};c.width=W*DPR;c.height=H*DPR;
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
const FNT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px '+FNT;g.textAlign=al||'center';g.lineJoin='round';g.strokeStyle='#fffaf0';g.lineWidth=sz/3;g.strokeText(s,x,y,W-30);g.strokeStyle=OL;g.lineWidth=sz/7;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else E(0,-8,13,4,'#ffe27a',3);
g.restore()}
G.I={bs:n=>'最高 '+n,tap:'',title:"{{t:thief.msg.001}}",s1:"{{t:thief.msg.002}}",s2:"{{t:thief.msg.003}}",caught:"{{t:thief.msg.004}}",fr:n=>'已偷 '+n+' 個水果',sh:['{{t:thief.msg.005}}','{{t:thief.msg.006}}','{{t:thief.msg.007}}']};
G.skins=[{need:0,n:'{{t:thief.msg.008}}',c:['#ff9f1c','#e36414'],a:0},{need:150,n:'{{t:thief.msg.009}}',c:['#f1faee','#a8dadc'],a:1},{need:400,n:'{{t:thief.msg.010}}',c:['#5e548e','#231942'],a:3},{need:800,n:'{{t:thief.msg.011}}',c:['#ffd23f','#e76f51'],a:2}];
const LX=[105,200,295],CYT=430,fc=['#e63946','#ff9f1c','#7bd88f'];
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx;
let model=thiefRules.create(),heldBy;
const rank=timedLeaderboard('thief','thief',5,ui);
function syncModel(){({dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx}=model.snapshot());const next=model.snapshot().shake;if(next)shake=next;}
function control(code){if(!thiefRules.input(model,code))return;rank.record(code);syncModel();}
G.reset=()=>{model=thiefRules.create();syncModel();};
G.score=()=>model.score();
G.extra=()=>T('fr')(fruits);
G.down=p=>{
 const code=Math.hypot(p.x-340,p.y-505)<50?2:p.x<133?0:p.x>267?2:1;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{thiefRules.advance(model,dt);syncModel();if(model.dead)die(model.dead);};
const SPR=new Image();SPR.src='games/thief/art/sprites.webp';const LOGO=new Image();LOGO.src='games/thief/art/logo.webp';
const A={"gt":[0,0,205,230],"gc":[207,0,204,230],"stallR":[413,0,211,230],"stallY":[626,0,213,230],"g0":[841,0,151,200],"g1":[0,232,144,200],"g2":[146,232,146,200],"g3":[294,232,146,200],"lamp":[442,232,78,170],"cd":[522,232,170,164],"cj":[694,232,117,160],"c0":[813,232,125,150],"c1":[0,434,118,150],"c2":[120,434,122,150],"c3":[244,434,118,150],"cf":[364,434,125,150],"basket":[491,434,150,124],"plant1":[643,434,112,120],"fish":[757,434,130,107],"plant2":[889,434,110,103],"plant3":[0,586,100,99],"apple":[102,586,79,96],"orange":[183,586,84,96],"green":[269,586,85,96],"warn":[356,586,120,96],"crate3":[478,586,100,93],"crate1":[580,586,100,91],"crate2":[682,586,100,88],"slip":[784,586,100,86],"cloud":[0,687,170,85],"bush":[172,687,150,85],"bunting":[324,687,209,63]};
const sprOk=()=>SPR.complete&&SPR.naturalWidth>0,FK=['apple','orange','green'],CATF=['c0','c1','c2','c3','cj','cd','cf'];
function spr(k,x,y,h,src,rot){const a=A[k];if(!a)return;const img=src&&src[k];if(!img&&!sprOk())return;const w=a[2]*h/a[3];g.save();g.translate(x,y);if(rot){g.rotate(rot);g.drawImage(img||SPR,img?0:a[0],img?0:a[1],a[2],a[3],-w/2,-h/2,w,h)}else g.drawImage(img||SPR,img?0:a[0],img?0:a[1],a[2],a[3],-w/2,-h,w,h);g.restore()}
const tints={};
function tint(i){
 if(!i||!sprOk())return null;if(tints[i]!==undefined)return tints[i];
 const hex=G.skins[i].c[0],R=parseInt(hex.slice(1,3),16),Gc=parseInt(hex.slice(3,5),16),B=parseInt(hex.slice(5,7),16),out={};
 try{CATF.forEach(k=>{const a=A[k],cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const x=cv.getContext('2d');x.drawImage(SPR,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);
  const d=x.getImageData(0,0,a[2],a[3]),p=d.data;
  for(let j=0;j<p.length;j+=4){const r=p[j],gg=p[j+1],b=p[j+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),l=(r+gg+b)/3;
   if(mx-mn<30&&l>70&&l<222){const f=Math.min(1.25,l/165);p[j]=Math.min(255,R*f);p[j+1]=Math.min(255,Gc*f);p[j+2]=Math.min(255,B*f)}}
  x.putImageData(d,0,0);out[k]=cv});tints[i]=out}catch(e){tints[i]=null}
 return tints[i]}
const HZ=112;
const pj=y=>HZ+(H-HZ)*Math.pow(Math.max(0,(y+40)/(H+40)),1.45);
const hw=Y=>55+123*(Y-HZ)/(H-HZ),sc=Y=>hw(Y)/142,px=(x,Y)=>200+(x-200)*sc(Y);
const wrap=(v,m)=>((v%m)+m)%m;
const SIDE=[['stallR',150],['plant1',58],['crate1',44],['stallY',150],['lamp',118],['plant2',52]],SIDE2=[['stallY',150],['crate3',44],['plant3',54],['stallR',150],['plant1',58],['crate2',44]];
function poly(pts,fill,line,lw){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();if(line){g.strokeStyle=line;g.lineWidth=lw||3;g.lineJoin='round';g.stroke()}}
function bg(){
 const sky=g.createLinearGradient(0,0,0,HZ+20);sky.addColorStop(0,'#7ccbf2');sky.addColorStop(1,'#d9f2fb');g.fillStyle=sky;g.fillRect(-20,0,W+40,HZ+20);
 spr('cloud',wrap(70+tt*6,480)-40,HZ-34,34);spr('cloud',wrap(300+tt*4,480)-40,HZ-52,26);
 g.fillStyle='#8cc152';g.fillRect(-20,HZ,W+40,H-HZ+20);
 const Yb=H+40,sw=1.2;
 poly([[200-hw(HZ)*sw,HZ],[200+hw(HZ)*sw,HZ],[200+hw(Yb)*sw,Yb],[200-hw(Yb)*sw,Yb]],'#f3e4cb','#7a4a24',2);
 poly([[200-hw(HZ),HZ],[200+hw(HZ),HZ],[200+hw(Yb),Yb],[200-hw(Yb),Yb]],'#e98e62','#8a4a2c',3);
 g.save();g.beginPath();g.moveTo(200-hw(HZ),HZ);g.lineTo(200+hw(HZ),HZ);g.lineTo(200+hw(Yb),Yb);g.lineTo(200-hw(Yb),Yb);g.closePath();g.clip();
 for(let k=0;k<18;k++){const y=wrap(k*36+dist,648)-40,Y=pj(y),s=sc(Y);
  g.strokeStyle='rgba(176,88,52,.45)';g.lineWidth=1.4*s;g.beginPath();g.moveTo(200-hw(Y),Y);g.lineTo(200+hw(Y),Y);g.stroke();
  const Y2=pj(y+36),off=k%2?0:.5;g.fillStyle='rgba(255,196,160,.22)';
  for(let b=-2;b<=2;b++){const xl=200+(b+off-.45)*hw(Y)*.42,xr=200+(b+off-.05)*hw(Y)*.42;if(((k*7+b*3)%5+5)%5<2)g.fillRect(xl,Y+1,xr-xl,Math.max(1,Y2-Y-2))}}
 [152,248].forEach(bx=>{for(let k=0;k<9;k++){const y0=wrap(k*80+dist,720)-40,Y0=pj(y0),Y1=pj(y0+34);g.strokeStyle='#fbe9cf';g.lineWidth=4.5*sc(Y1);g.lineCap='round';g.beginPath();g.moveTo(px(bx,Y0),Y0);g.lineTo(px(bx,Y1),Y1);g.stroke()}});
 g.restore();
 const deco=[];
 [[SIDE,-1,0],[SIDE2,1,60]].forEach(([list,side,o])=>list.forEach(([k,h],i)=>{const y=wrap(i*120+o+dist*1,720)-40,Y=pj(y);if(Y<HZ+2)return;const s=sc(Y),a=A[k],w=a[2]*h*s/a[3];deco.push([Y,k,200+side*(hw(Y)*1.2+w*.42),h*s])}));
 deco.sort((p,q)=>p[0]-q[0]).forEach(d=>spr(d[1],d[2],d[0]+2,d[3]));
 spr('bush',18,HZ+14,58);spr('bush',382,HZ+14,58);spr('bunting',110,HZ-6,26);spr('bunting',290,HZ-6,26)}
function item(r){
 const Y=pj(r.y),s=sc(Y),x=px(LX[r.l],Y);
 g.fillStyle='rgba(90,40,20,.18)';g.beginPath();g.ellipse(x,Y+12*s,20*s,6*s,0,0,7);g.fill();
 if(r.t==='b')spr('basket',x,Y+16*s,50*s);
 else if(r.t==='f')spr(FK[r.c%3],x,Y+12*s-Math.abs(Math.sin(tt*5+r.l))*4*s,32*s);
 else spr('fish',x,Y+12*s-Math.abs(Math.sin(tt*6))*5*s,34*s)}
function cat(){
 const k=SK(),j=jt>0?Math.sin(Math.PI*(1-jt/.55)):0,Y=pj(CYT),s=sc(Y),x=px(cx,Y),Yf=Y+34*s,lift=j*30*s,z=1+j*.16,src=tint(skin);
 g.fillStyle='rgba(90,40,20,.25)';g.beginPath();g.ellipse(x,Yf-2,(24-j*6)*s,(8-j*2)*s,0,0,7);g.fill();
 if(stun>0)g.globalAlpha=Math.floor(tt*16)%2?.55:1;
 const f=stun>0?'cd':jt>0?'cj':'c'+(Math.floor(tt*(5+v/45))%4),h=(f==='cd'?62:f==='cj'?80:76)*s*z;
 spr(f,x,Yf-lift,h,src);
 for(let i=0;i<L;i++)spr(FK[i%3],x+(i%2?9:-9)*s,Yf-lift-26*s-i*8*s,17*s);
 acc(k.a,x,Yf-lift-h*.86,.85*s);
 g.globalAlpha=1}
function granny(){
 const r=cl(1-gb/170,0,1),Yf=H+112-r*96,x=200+(px(cx,pj(CYT))-200)*.55;
 const f=st==='over'&&G.msg==='caught'?'gc':warn.length?'gt':'g'+(Math.floor(tt*7)%4);
 g.fillStyle='rgba(90,40,20,.25)';g.beginPath();g.ellipse(x,Yf-4,40,10,0,0,7);g.fill();
 spr(f,x,Yf,f==='g0'||f==='g1'||f==='g2'||f==='g3'?124:136);return Yf}
function sign(x,y,w,h){RR(x,y,w,h,12,'#f4c983',3);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+10,y+5,w-20,3);[[x+6,y+6],[x+w-6,y+6]].forEach(p=>{g.save();g.translate(p[0],p[1]);g.rotate(p[0]>200?.6:-.6);E(0,0,7,4,'#7cbf4a',2);g.restore()})}
function wt(s,x,y,sz,col,al,mw){g.font='800 '+sz+'px '+FNT;g.textAlign=al||'center';g.fillStyle=col||OL;g.fillText(s,x,y,mw||W-40)}
function card(x,y,w,h){g.fillStyle='rgba(74,44,29,.25)';g.beginPath();g.roundRect?g.roundRect(x+3,y+5,w,h,18):g.rect(x+3,y+5,w,h);g.fill();RR(x,y,w,h,18,'#fff6e6',3);g.strokeStyle='rgba(122,74,36,.25)';g.lineWidth=1.5;g.setLineDash([5,5]);g.beginPath();g.moveTo(x+14,y+h-12);g.lineTo(x+w-14,y+h-12);g.stroke();g.setLineDash([])}
G.draw=()=>{
g.setTransform(DPR,0,0,DPR,0,0);
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();rows.slice().sort((p,q)=>p.y-q.y).forEach(item);
warn.forEach(w=>{if(Math.floor(tt*12)%2){const Y=pj(H-34),s=sc(Y);spr('warn',px(LX[w.l],Y),Y+14*s,40*s)}});
slips.forEach(o=>{const Y=pj(o.y),s=sc(Y);spr('slip',px(LX[o.l],Y),Y,30*s,null,tt*14)});
cat();const gy=granny();
if(st==='run'&&gb<75)tx(T('sh')[Math.floor(tt/1.4)%3],200,Math.min(H-150,gy-140),22,'#e0503f');
g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,px(f.x,pj(CYT)),f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
sign(8,8,116,52);wt(String(G.score()),66,46,30);
sign(130,8,110,52);wt(T('bs')(best),185,40,15);
sign(246,8,146,52);
for(let i=0;i<5;i++){const x=268+i*25;if(i<L)spr(FK[i%3],x,34,19);else{g.beginPath();g.arc(x,26,7,0,7);g.strokeStyle='rgba(122,74,36,.45)';g.lineWidth=2;g.stroke()}}
const r=cl(1-gb/170,0,1);RR(258,41,122,10,5,'#fff4dc',2);if(r>0)RR(258,41,Math.max(10,122*r),10,5,r>.7?'#e63946':'#7cbf4a',2)};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=440,V=$('view-thief');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){if(st==='run')control(4);heldBy=undefined;}
function say(text,kind){$('thief-msg').textContent=text;$('thief-msg').className='msg'+(kind?' '+kind:'')}
thiefSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('thief-score',G.score()+UNIT);setText('thief-best',best+UNIT);setText('thief-pay',fmt(paid)+' 點');
 setText('thief-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:thief.msg.012}}');
 $('thief-amount').disabled=thiefBusy;$('thief-go').disabled=live||rank.busy();setText('thief-go',live?'{{t:thief.msg.013}}':st==='over'?'{{t:thief.msg.014}}':'{{t:thief.msg.015}}');
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
 const s=G.score();rank.finish(s);rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});thiefBusy=false;renderAll();
 say('被老闆娘抓住了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'{{t:thief.msg.016}}'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('thief',amount);thiefStake=amount;thiefBusy=true;save();renderAll();
 model=thiefRules.create(random||Math.random);syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('{{t:thief.msg.017}}');ui();c.focus();
 },ui);
}
function overlay(){
g.fillStyle='rgba(74,44,29,.38)';g.fillRect(0,0,W,H);
if(st==='ready'){
 if(LOGO.complete&&LOGO.naturalWidth)g.drawImage(LOGO,50,70,300,300*LOGO.naturalHeight/LOGO.naturalWidth);else tx(T('title'),W/2,150,32,'#ffd23f');
 card(40,196,320,96);wt(T('s1'),W/2,236,15,OL,0,296);wt(T('s2'),W/2,264,15,'#8a5a3b',0,296);
 tx('{{t:thief.msg.018}}',W/2,338+Math.sin(tt*4)*2,22,'#ff8a3d')}
else{
 card(36,80,328,282);
 wt(T(G.msg),W/2,122,24,'#e0503f',0,300);
 wt(String(G.score()),W/2,184,54,OL);
 if(G.extra)wt(G.extra(),W/2,212,15,'#8a5a3b');
 if(rec){g.font='800 15px '+FNT;const w=g.measureText('{{t:thief.msg.019}}').width+30;RR(W/2-w/2,226,w,28,14,'#ffd23f',2.5);wt('{{t:thief.msg.019}}',W/2,245,15,OL)}
 if(unl.length)wt('{{t:thief.msg.020}}'+unl.map(k=>k.n).join('、'),W/2,276,14,'#4f9a2f',0,300);
 wt(paid>0?'{{t:thief.msg.021}}'+paid+' 點':'{{t:thief.msg.022}}',W/2,304,16,paid>0?'#d9822b':'#8a5a3b',0,300);
 wt('{{t:thief.msg.023}}',W/2,340,15,'#d9822b',0,300)}
RR(36,392,328,124,16,'#f4c983',3);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(52,398,296,3);
const n=G.skins.length;
G.skins.forEach((k,i)=>{const x=W/2+(i-(n-1)/2)*72,lk=best<k.need;
C(x,CHY,24,lk?'#cbb89a':'#fff6e6',3);
if(!lk){g.save();g.beginPath();g.arc(x,CHY,22,0,7);g.clip();spr('c0',x,CHY+30,52,tint(i));g.restore();acc(k.a,x,CHY-16,.5)}
else{g.fillStyle='#8a6a4a';RR(x-7,CHY-6,14,11,3,'#8a6a4a',0);g.beginPath();g.arc(x,CHY-6,5,Math.PI,0);g.strokeStyle='#8a6a4a';g.lineWidth=2.5;g.stroke();wt(String(k.need),x,CHY+20,12,OL)}
if(i===skin&&!lk){g.strokeStyle='#ff8a3d';g.lineWidth=4;g.beginPath();g.arc(x,CHY,29,0,7);g.stroke()}});
wt(SK().n,W/2,CHY+56,15,OL)}
function bonusDraw(){bpop.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/1.8);tx('BONUS +'+BONUS+' 點',W/2,170-Math.min(1,p.age*3)*20,34,'#ffd23f');tx(fmt(p.m)+UNIT+' 里程碑',W/2,198-Math.min(1,p.age*3)*20,16,'#fff');g.globalAlpha=1})}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);
 if(st!=='run'){
  const n=G.skins.length;
  if(Math.abs(p.y-CHY)<32){for(let i=0;i<n;i++)if(Math.abs(p.x-(W/2+(i-(n-1)/2)*72))<32){if(best>=G.skins[i].need)pick(i);return}}
  say(st==='over'?'{{t:thief.msg.024}}':'{{t:thief.msg.025}}');return}
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
  if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
