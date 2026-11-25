  /* ---------- 偷水果的貓: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var thiefBusy=false,thiefStake=0,thiefSay=function(){};
  (function(){
const c=$('thief-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,OL='#4a2c1d',G={};c.width=W*DPR;c.height=H*DPR;
const MILESTONES=[150, 400, 800],BONUS=5,KEY='deep-sea-thief-best',SKEY='deep-sea-thief-skin';
let analytics=null,paid=0,awarded=new Set(),bpop=[];
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w)};
const E=(x,y,rx,ry,f,w)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);O(f,w)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw)};
const P=(a,f,w)=>{g.beginPath();a.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();O(f,w)};
const L2=(x1,y1,x2,y2,w,col)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=col||OL;g.lineWidth=w||3;g.lineCap='round';g.stroke()};
// Game type: Lilita One for headlines, Baloo 2 for everything else, heavy Noto Sans TC for Chinese.
// The page's Google Fonts link loads them; ask for them up front so canvas text never swaps mid-round.
const FB='"Baloo 2",Nunito,ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif',FH='"Lilita One","Baloo 2",Nunito,ui-rounded,system-ui,sans-serif',FC='"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const FNT=FB;
try{document.fonts&&['20px "Lilita One"','800 20px "Baloo 2"','700 20px "Baloo 2"','900 20px "Noto Sans TC"'].forEach(f=>document.fonts.load(f))}catch(e){}
const CJK=/[\u3400-\u9fff\uff00-\uffef]/;
// Sets the canvas font for this exact string (after translation) and returns the string to draw.
function font(s,sz,head){s=localText(String(s));const cjk=CJK.test(s);g.font=head?(cjk?'900 '+Math.round(sz*.92)+'px '+FC:Math.round(sz)+'px '+FH):(cjk?'700 '+Math.round(sz*.92)+'px '+FC:'800 '+Math.round(sz)+'px '+FB);return s}
const eob=t=>{t=cl(t,0,1);const k=1.70158;return 1+(k+1)*Math.pow(t-1,3)+k*Math.pow(t-1,2)};
function tx(s,x,y,sz,col,al){sz*=.9;s=font(s,sz,1);g.textAlign=al||'center';g.lineJoin='round';g.strokeStyle='#fffaf0';g.lineWidth=sz/3;g.strokeText(s,x,y,W-30);g.strokeStyle=OL;g.lineWidth=sz/7;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
// Pop-in: overshoots slightly, then settles. age is seconds since the text appeared.
function ptx(s,x,y,sz,col,age,rot){const k=eob(age/.3);g.save();g.translate(x,y);if(rot)g.rotate(rot);g.scale(k,k);tx(s,0,0,sz,col);g.restore()}
// Letters bob one after another; falls back to plain text when the line is too wide.
function waveTx(s,x,y,sz,col){
 sz*=.9;s=font(s,sz,1);const ch=Array.from(s),tw=g.measureText(s).width;
 if(tw>W-40){tx(s,x,y,sz/.9,col);return}
 // Place each letter by the width of the text before it, so kerning (won't, AV) stays intact.
 let pre='';const at=ch.map((q,i)=>{const l=g.measureText(pre).width,o={q,x:x-tw/2+l,y:y-Math.max(0,Math.sin(tt*6-i*.45))*4};pre+=q;return o});
 g.textAlign='left';
 g.lineJoin='round';
 // Outline every letter first, then fill, so neighbouring outlines never cover a letter.
 [['#fffaf0',sz/3],[OL,sz/7]].forEach(([s2,lw])=>{g.strokeStyle=s2;g.lineWidth=lw;at.forEach(o=>g.strokeText(o.q,o.x,o.y))});
 g.fillStyle=col;at.forEach(o=>g.fillText(o.q,o.x,o.y))}
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else if(a===4)E(0,-8,13,4,'#ffe27a',3);
else if(a===5)spr('apple',0,4,26);
else if(a===6){g.rotate(-.25);spr('fish',0,6,22)}
else if(a===7){g.rotate(.2);spr('slip',0,4,20)}
else if(a===8)spr('basket',0,6,22);
else if(a===9){spr('orange',-8,6,17);spr('green',8,6,17);spr('apple',0,-6,17)}
else if(a===10){const pts=[];for(let i=0;i<10;i++){const r=i%2?7:16,q=-Math.PI/2+i*Math.PI/5;pts.push([Math.cos(q)*r,-12+Math.sin(q)*r])}P(pts,'#ffd23f',3)}
else if(a===11){P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);g.rotate(-.2);spr('fish',2,-14,14)}
g.restore()}
G.I={bs:'{{t:thief.msg.059}}',title:"{{t:thief.msg.001}}",tag:"{{t:thief.msg.002}}",tip:"{{t:thief.msg.003}}",caught:"{{t:thief.msg.004}}",fr:n=>localText('{{t:thief.msg.026}}').replace('{n}',n),
 mt:'{{t:thief.msg.027}}',alldone:'{{t:thief.msg.028}}',close:'{{t:thief.msg.029}}',mdone:'{{t:thief.msg.030}}',newskin:'{{t:thief.msg.031}}',lockM:'{{t:thief.msg.032}}',lockS:'{{t:thief.msg.033}}',lockL:'{{t:thief.msg.058}}',
 space:'{{t:thief.msg.046}}',lvup:'{{t:thief.msg.054}}',lvprog:'{{t:thief.msg.055}}',mile:'{{t:thief.msg.060}}',bonusSay:'{{t:thief.msg.061}}',caughtSay:'{{t:thief.msg.062}}',bonusTot:'{{t:thief.msg.063}}',light:'{{t:thief.msg.064}}',chap:['{{t:thief.msg.065}}','{{t:thief.msg.066}}','{{t:thief.msg.067}}'],chapSub:'{{t:thief.msg.068}}',
 hookStory:'{{t:thief.msg.079}}',hookBest:'{{t:thief.msg.080}}',hookMission:'{{t:thief.msg.081}}',hookZone:'{{t:thief.msg.082}}',zSunset:'{{t:thief.msg.083}}',zNight:'{{t:thief.msg.084}}',zoomies:'{{t:thief.msg.085}}',zoomSub:'{{t:thief.msg.086}}',fury:'{{t:thief.msg.088}}',furySub:'{{t:thief.msg.091}}',furyOk:'{{t:thief.msg.089}}',deliver:'{{t:thief.msg.090}}',
 newSticker:'{{t:thief.msg.132}}',album:'{{t:thief.msg.133}}',albumTip:'{{t:thief.msg.134}}',closeTip:'{{t:thief.msg.135}}',home:'{{t:thief.msg.136}}',homeProg:'{{t:thief.msg.137}}',homeMax:'{{t:thief.msg.138}}',homeNext:'{{t:thief.msg.139}}',homeTip:'{{t:thief.msg.140}}',homeSign:'{{t:thief.msg.141}}',
 homeItems:['{{t:thief.msg.142}}','{{t:thief.msg.143}}','{{t:thief.msg.144}}','{{t:thief.msg.145}}','{{t:thief.msg.146}}'],
 dGoalSay:'{{t:thief.msg.147}}',dLine:'{{t:thief.msg.148}}',dCleared:'{{t:thief.msg.149}}',dWin:'{{t:thief.msg.150}}',dStreak:'{{t:thief.msg.151}}',
 sh:['{{t:thief.msg.005}}','{{t:thief.msg.006}}','{{t:thief.msg.007}}']};
G.skins=[{need:0,n:'{{t:thief.msg.008}}',c:['#ff9f1c','#e36414'],a:0},{need:150,n:'{{t:thief.msg.009}}',c:['#f1faee','#a8dadc'],a:1},{need:400,n:'{{t:thief.msg.010}}',c:['#5e548e','#231942'],a:3},{need:800,n:'{{t:thief.msg.011}}',c:['#ffd23f','#e76f51'],a:2},
 {m:'apple',n:'{{t:thief.msg.040}}',c:['#e63946','#9d0208'],a:5},{m:'fish',n:'{{t:thief.msg.041}}',c:['#8ecae6','#219ebc'],a:6},{m:'dodge',n:'{{t:thief.msg.042}}',c:['#90be6d','#43aa8b'],a:7},
 {m:'jump',n:'{{t:thief.msg.043}}',c:['#c08552','#895737'],a:8},{m:'carry',n:'{{t:thief.msg.044}}',c:['#ffafcc','#ff70a6'],a:9},{m:'clean',n:'{{t:thief.msg.045}}',c:['#adb5bd','#6c757d'],a:4},
 {lv:2,n:'{{t:thief.msg.056}}',c:['#f4a261','#e76f51'],a:10},{lv:3,n:'{{t:thief.msg.057}}',c:['#9b5de5','#5a189a'],a:11}];
// Missions only count what the shared rules report; rewards are skins, never points.
// Level 1 gives a skin per mission; finishing every mission of level 2 or 3 gives that level's skin.
// sum: progress adds up across runs; otherwise the best single run counts. Targets were set from simulated runs.
const MISSIONS=[
 {id:'apple',lv:1,stat:'apples',n:5,sum:1,t:'{{t:thief.msg.034}}'},{id:'fish',lv:1,stat:'fish',n:5,sum:1,t:'{{t:thief.msg.035}}'},{id:'dodge',lv:1,stat:'dodges',n:5,sum:1,t:'{{t:thief.msg.036}}'},
 {id:'jump',lv:1,stat:'jumps',n:10,sum:1,t:'{{t:thief.msg.037}}'},{id:'carry',lv:1,stat:'maxCarry',n:5,t:'{{t:thief.msg.038}}'},{id:'clean',lv:1,stat:'bestClean',n:30,t:'{{t:thief.msg.039}}'},
 {id:'orange15',lv:2,stat:'oranges',n:15,sum:1,t:'{{t:thief.msg.047}}'},{id:'fish3r',lv:2,stat:'fish',n:3,t:'{{t:thief.msg.049}}'},{id:'dodge3r',lv:2,stat:'dodges',n:3,t:'{{t:thief.msg.048}}'},
 {id:'jump30',lv:2,stat:'jumps',n:30,sum:1,t:'{{t:thief.msg.037}}'},{id:'score250',lv:2,stat:'score',n:250,t:'{{t:thief.msg.050}}'},{id:'clean45',lv:2,stat:'bestClean',n:45,t:'{{t:thief.msg.039}}'},
 {id:'fruit15r',lv:3,stat:'fruits',n:15,t:'{{t:thief.msg.051}}'},{id:'dodge5r',lv:3,stat:'dodges',n:5,t:'{{t:thief.msg.048}}'},{id:'green30',lv:3,stat:'greens',n:30,sum:1,t:'{{t:thief.msg.052}}'},
 {id:'jump15r',lv:3,stat:'jumps',n:15,t:'{{t:thief.msg.053}}'},{id:'score450',lv:3,stat:'score',n:450,t:'{{t:thief.msg.050}}'},{id:'clean60',lv:3,stat:'bestClean',n:60,t:'{{t:thief.msg.039}}'}];
const LX=[105,200,295],CYT=430,fc=['#e63946','#ff9f1c','#7bd88f'];
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,stats,streak=0,zoom=0,rage=null;
let model=thiefRules.create(),heldBy;
const rank=timedLeaderboard('thief','thief',5,ui);
// Screen shake is started by events() on a real hit; the rules' own shake flag never resets, so it is not read here.
function syncModel(){({dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,stats,streak,zoom,rage}=model.snapshot());streak=streak||0;zoom=zoom||0;}
function control(code){if(!thiefRules.input(model,code))return;if(!dailyRun)rank.record(code);const ln=lane;syncModel();if(lane!==ln)sfx('lane');}
G.reset=()=>{model=thiefRules.create();syncModel();};
G.score=()=>model.score();
G.extra=()=>T('fr')(fruits);
let gest=null;
G.down=p=>{
 const code=Math.hypot(p.x-340,p.y-505)<50?2:p.x<133?0:p.x>267?2:1;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{thiefRules.advance(model,dt);syncModel();events();if(model.dead)die(model.dead);};
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
/* ---------- Zones: the market moves from morning to sunset to night as the score climbs (look and sound only) ---------- */
const ZONES=[
 {at:0,s0:'#7ccbf2',s1:'#d9f2fb',grass:'#8cc152',tint:'#ffffff',glow:0,stars:0,sun:0},
 {at:150,s0:'#6c5b9e',s1:'#ffb27a',grass:'#9fb45a',tint:'#ffd6bd',glow:.4,stars:.12,sun:1},
 {at:400,s0:'#0e1433',s1:'#35427e',grass:'#2f5a3a',tint:'#7076b8',glow:1,stars:1,sun:0}];
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),toHex=a=>'#'+a.map(v=>Math.round(cl(v,0,255)).toString(16).padStart(2,'0')).join('');
function mixZ(a,b,t){const o={};for(const k in b)o[k]=typeof b[k]==='string'?toHex(hexRGB(a[k]).map((v,i)=>v+(hexRGB(b[k])[i]-v)*t)):a[k]+(b[k]-a[k])*t;return o}
let zCur=0,zFrom=ZONES[0],zT=1,PZ=ZONES[0],banner=null,decoLast=[];
const STARS=Array.from({length:22},()=>[rnd(0,W),rnd(46,HZ-16),rnd(.6,1.6),rnd(0,6)]);
function zoneOf(sc0){return sc0>=ZONES[2].at?2:sc0>=ZONES[1].at?1:0}
function bg(){
 const P=PZ,sky=g.createLinearGradient(0,0,0,HZ+20);sky.addColorStop(0,P.s0);sky.addColorStop(1,P.s1);g.fillStyle=sky;g.fillRect(-20,0,W+40,HZ+20);
 if(P.stars>0){STARS.forEach(([x,y,r,ph])=>{g.globalAlpha=P.stars*(.55+.45*Math.sin(tt*2+ph));g.fillStyle='#fff8dc';g.beginPath();g.arc(x,y,r,0,7);g.fill()});
  g.globalAlpha=P.stars;g.fillStyle='#fff3c4';g.beginPath();g.arc(336,60,13,0,7);g.fill();g.fillStyle=P.s0;g.beginPath();g.arc(343,55,11,0,7);g.fill();g.globalAlpha=1}
 if(P.sun>0){const gr=g.createRadialGradient(270,HZ-4,4,270,HZ-4,70);gr.addColorStop(0,'rgba(255,214,120,'+.9*P.sun+')');gr.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gr;g.fillRect(180,HZ-80,180,90);
  g.globalAlpha=P.sun;g.fillStyle='#ffd27a';g.beginPath();g.arc(270,HZ+2,24,Math.PI,0);g.fill();g.globalAlpha=1}
 g.globalAlpha=1-P.stars*.6;spr('cloud',wrap(70+tt*6,480)-40,HZ-34,34);spr('cloud',wrap(300+tt*4,480)-40,HZ-52,26);g.globalAlpha=1;
 g.fillStyle=P.grass;g.fillRect(-20,HZ,W+40,H-HZ+20);
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
 deco.sort((p,q)=>p[0]-q[0]).forEach(d=>spr(d[1],d[2],d[0]+2,d[3]));decoLast=deco;
 spr('bush',18,HZ+14,58);spr('bush',382,HZ+14,58);spr('bunting',110,HZ-6,26);spr('bunting',290,HZ-6,26)}
function item(r){
 const Y=pj(r.y),s=sc(Y),x=px(LX[r.l],Y);
 g.fillStyle='rgba(90,40,20,.18)';g.beginPath();g.ellipse(x,Y+12*s,20*s,6*s,0,0,7);g.fill();
 if(r.t==='b'){
  const h0=hitAt.get(r);
  if(h0===undefined)spr('basket',x,Y+16*s,50*s);
  else{const q=tt-h0,a=Math.min(1,q/.22),d=r.l<1?-1:1;
   // Knocked basket: tips over on its side and spills three fruits that skid and bounce away.
   for(let i=0;i<3;i++){const k=Math.min(1,q/.6),fx0=x+d*(14+i*13+k*(18+i*10))*s,fy=Y+12*s-Math.abs(Math.sin(Math.min(q*9,Math.PI*2)+i))*10*s*(1-k*.6);spr(FK[(r.c+i)%3],fx0,fy,(18-i*2)*s)}
   g.save();g.translate(x+d*6*s*a,Y+16*s);g.rotate(d*a*1.3);spr('basket',0,0,50*s);g.restore()}}
 else if(r.t==='f')spr(FK[r.c%3],x,Y+12*s-Math.abs(Math.sin(tt*5+r.l))*4*s,32*s);
 else if(r.t==='g'){const by=Y+12*s-Math.abs(Math.sin(tt*5))*6*s;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,by-16*s,0,x,by-16*s,34*s);gr.addColorStop(0,'rgba(255,214,80,.75)');gr.addColorStop(1,'rgba(255,200,60,0)');g.fillStyle=gr;g.fillRect(x-34*s,by-50*s,68*s,68*s);g.globalCompositeOperation='source-over';
  spr('apple',x,by,36*s,goldApple());for(let i=0;i<3;i++){const q=tt*3+i*2.1;star(x+Math.cos(q)*20*s,by-18*s+Math.sin(q)*14*s,3.5*s,'#fff6c2')}}
 else spr('fish',x,Y+12*s-Math.abs(Math.sin(tt*6))*5*s,34*s)}
// The golden apple is the normal apple recoloured once into gold.
let goldImg=null;function goldApple(){if(goldImg!==null||!sprOk())return goldImg||null;try{const a=A.apple,cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const x=cv.getContext('2d');x.drawImage(SPR,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(255,196,40,.72)';x.fillRect(0,0,a[2],a[3]);goldImg={apple:cv}}catch(e){goldImg=false}return goldImg||null}
function star(x,y,r,col){const pts=[];for(let k=0;k<10;k++){const rr=k%2?r*.45:r,q=-Math.PI/2+k*Math.PI/5;pts.push([x+Math.cos(q)*rr,y+Math.sin(q)*rr])}g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=col;g.fill()}
// The jump's airtime comes from the shared rules (0.55 s); only its look is exaggerated here:
// a high arc, stretch on take-off, squash on landing, dust puffs and wind streaks.
function cat(){
 const k=SK(),p=jt>0?1-jt/.55:0,j=jt>0?Math.sin(Math.PI*p):0,Y=pj(CYT),s=sc(Y),x=px(cx,Y),Yf=Y+34*s,lift=j*78*s,z=1+j*.18,src=tint(skin);
 const sq=landT>0?Math.sin(landT/.16*Math.PI):0,sy=jt>0?(p<.35?1.12:p>.8?.95:1):1-sq*.22,sx=jt>0?(p<.35?.9:1.04):1+sq*.2;
 g.fillStyle='rgba(90,40,20,'+(.25-j*.13)+')';g.beginPath();g.ellipse(x,Yf-2,(24-j*12)*s,(8-j*4)*s,0,0,7);g.fill();
 dust.forEach(d=>{g.globalAlpha=Math.max(0,.6*(1-d.age/.45));g.fillStyle='#f7e3c4';g.beginPath();g.arc(x+d.dx*s+d.vx*d.age*s,Yf-4*s-d.age*18*s,(5+d.age*16)*s,0,7);g.fill()});g.globalAlpha=1;
 if(jt>0&&p<.75){g.strokeStyle='rgba(255,255,255,.75)';g.lineCap='round';g.lineWidth=2.5*s;for(let i=-1;i<=1;i++){const y0=Yf-lift+6*s+Math.abs(i)*4*s,len=(14+10*(1-p))*s;g.beginPath();g.moveTo(x+i*11*s,y0);g.lineTo(x+i*13*s,y0+len);g.stroke()}}
 if(stun>0)g.globalAlpha=Math.floor(tt*16)%2?.55:1;
 const f=stun>0?'cd':jt>0?'cj':'c'+(Math.floor(tt*(5+v/45))%4),h=(f==='cd'?62:f==='cj'?80:76)*s*z;
 // Tripped over a basket: topple sideways, lie a beat, scramble back up. Slipper: a quick bonk squash.
 let rot=0,drop=0,bsx=1,bsy=1;const hq=tt-hitT;
 if(hitKind==='b'&&hq<.8){const q=hq/.8,f0=q<.25?eob(q/.25):q<.55?1:1-(q-.55)/.45;rot=hitDir*1.35*f0;drop=10*s*f0}
 else if(hitKind==='s'&&hq<.3){const f0=Math.sin(hq/.3*Math.PI);bsx=1+.25*f0;bsy=1-.25*f0}
 if(zoom>0){g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,Yf-lift-h*.45,0,x,Yf-lift-h*.45,h*.9);gr.addColorStop(0,'rgba(255,210,70,'+(.35+.15*Math.sin(tt*20))+')');gr.addColorStop(1,'rgba(255,190,50,0)');g.fillStyle=gr;g.fillRect(x-h,Yf-lift-h*1.4,h*2,h*2);g.globalCompositeOperation='source-over';
  for(let k=3;k>=1;k--){g.globalAlpha=.16*(4-k)/3;spr(f,x,Yf-lift+k*13*s,h,src)}g.globalAlpha=1}
 g.save();g.translate(x,Yf-lift+drop);g.rotate(rot);g.scale(sx*bsx,sy*bsy);
 spr(f,0,0,h,src);
 for(let i=0;i<L;i++)spr(FK[i%3],(i%2?9:-9)*s,-26*s-i*8*s-j*i*3*s,17*s);
 acc(k.a,0,-h*.86,.85*s);
 g.restore();g.globalAlpha=1;
 if(stun>0){for(let i=0;i<3;i++){const q=tt*7+i*2.1,sx0=x+Math.cos(q)*20*s,sy0=Yf-lift+drop-h*1.02+Math.sin(q)*6*s;g.save();g.translate(sx0,sy0);g.rotate(q);const pts=[];for(let k2=0;k2<10;k2++){const rr=k2%2?3*s:7*s,qq=-Math.PI/2+k2*Math.PI/5;pts.push([Math.cos(qq)*rr,Math.sin(qq)*rr])}P(pts,'#ffd23f',1.5);g.restore()}}}
function granny(){
 const r=cl(1-gb/170,0,1),Yf=H+112-r*96,x=200+(px(cx,pj(CYT))-200)*.55;
 const f=st==='over'&&G.msg==='caught'?'gc':warn.length?'gt':'g'+(Math.floor(tt*7)%4);
 g.fillStyle='rgba(90,40,20,.25)';g.beginPath();g.ellipse(x,Yf-4,40,10,0,0,7);g.fill();
 spr(f,x,Yf,f==='g0'||f==='g1'||f==='g2'||f==='g3'?124:136);return Yf}
function sign(x,y,w,h){RR(x,y,w,h,Math.min(12,h/2),'#f4c983',2.5);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+10,y+4,w-20,2.5);[[x+5,y+5],[x+w-5,y+5]].forEach(p=>{g.save();g.translate(p[0],p[1]);g.rotate(p[0]>200?.6:-.6);E(0,0,6,3.5,'#7cbf4a',1.8);g.restore()})}
function wt(s,x,y,sz,col,al,mw){sz*=.92;s=font(s,sz,sz>=26);g.textAlign=al||'center';g.fillStyle=col||OL;g.fillText(s,x,y,mw||W-40)}
function card(x,y,w,h){g.fillStyle='rgba(74,44,29,.25)';g.beginPath();g.roundRect?g.roundRect(x+3,y+5,w,h,18):g.rect(x+3,y+5,w,h);g.fill();RR(x,y,w,h,18,'#fff6e6',3);g.strokeStyle='rgba(122,74,36,.25)';g.lineWidth=1.5;g.setLineDash([5,5]);g.beginPath();g.moveTo(x+14,y+h-12);g.lineTo(x+w-14,y+h-12);g.stroke();g.setLineDash([])}
// Compact wooden HUD: score, best, then the fruit stack and how close the shopkeeper is.
function hud(){
 sign(8,8,84,32);
 const k=1+.28*hudBump;g.save();g.translate(50,32);g.scale(k,k);wt(fmt(G.score()),0,0,21,OL);g.restore();
 sign(98,8,104,32);wt(localText(T('bs')).replace('{n}',fmt(best)),150,29,12,'#7a4a24',0,92);
 sign(208,8,184,32);
 for(let i=0;i<5;i++){const x=224+i*17;if(i<L)spr(FK[i%3],x,31,14);else{g.beginPath();g.arc(x,24,5.5,0,7);g.strokeStyle='rgba(122,74,36,.45)';g.lineWidth=1.8;g.stroke()}}
 if(zoom>0){RR(216,43,168,7,3.5,'#fff4dc',1.5);RR(216,43,Math.max(7,168*zoom/5),7,3.5,'#ffd23f',1.5)}
 else if(st==='run'){for(let i=0;i<10;i++){g.beginPath();g.arc(222+i*17,47,3.2,0,7);g.fillStyle=i<streak?'#ffb703':'rgba(255,246,230,.55)';g.fill();g.lineWidth=1.2;g.strokeStyle=OL;g.stroke()}}
 const r=cl(1-gb/170,0,1);RR(312,19,70,10,5,'#fff4dc',1.8);if(r>0)RR(312,19,Math.max(10,70*r),10,5,r>.7?'#e63946':'#7cbf4a',1.8);
 }
// Speed streaks along both sides; fixed lanes so they never flicker.
const STREAK=Array.from({length:14},(_,i)=>({x:i%2?rnd(4,86):rnd(314,396),o:rnd(0,560),len:rnd(26,60),w:rnd(1.5,3)}));
function streaks(){
 const sp=cl((v-230)/200,0,1);if(reduceMotion)return;
 g.save();g.lineCap='round';
 STREAK.forEach((q,i)=>{const y=wrap(q.o+tt*(700+sp*900),H+80)-40,a=(.12+.38*sp)*(i<6||sp>.4?1:0);if(!a)return;g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=q.w;g.beginPath();g.moveTo(q.x,y);g.lineTo(q.x+(q.x<200?-1:1)*q.len*.12,y+q.len*(.6+sp*.8));g.stroke()});
 g.restore()}
// Multiply the world toward the zone's light (the sky above the horizon is left alone), then add warm lights at dusk and night.
function zoneFx(){
 const P=PZ;
 if(P.tint!=='#ffffff'){g.globalCompositeOperation='multiply';const gr=g.createLinearGradient(0,HZ-24,0,HZ+24);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,P.tint);g.fillStyle=gr;g.fillRect(-30,0,W+60,H);g.globalCompositeOperation='source-over'}
 if(P.glow<.02)return;
 g.globalCompositeOperation='lighter';
 decoLast.forEach(d=>{if(!/^stall|^lamp/.test(d[1]))return;const r=d[3]*.7,cx0=d[2],cy0=d[0]-d[3]*.55,gr=g.createRadialGradient(cx0,cy0,0,cx0,cy0,r);gr.addColorStop(0,'rgba(255,190,90,'+.32*P.glow+')');gr.addColorStop(1,'rgba(255,150,60,0)');g.fillStyle=gr;g.fillRect(cx0-r,cy0-r,r*2,r*2)});
 const Y=pj(CYT),x0=px(cx,Y),cg=g.createRadialGradient(x0,Y,0,x0,Y,70);cg.addColorStop(0,'rgba(255,230,180,'+.22*P.glow+')');cg.addColorStop(1,'rgba(255,230,180,0)');g.fillStyle=cg;g.fillRect(x0-70,Y-70,140,140);
 g.globalCompositeOperation='source-over';
 // Strings of paper lanterns over both sides of the street.
 [-1,1].forEach(sd=>{const xa=200+sd*30,xb=200+sd*196,ya=HZ+4,yb=HZ+34;g.strokeStyle='rgba(60,30,20,'+.7*P.glow+')';g.lineWidth=1.2;g.beginPath();g.moveTo(xa,ya);g.quadraticCurveTo((xa+xb)/2,yb+16,xb,yb);g.stroke();
  for(let i=1;i<6;i++){const t=i/6,lx=xa+(xb-xa)*t,ly=(1-t)*(1-t)*ya+2*(1-t)*t*(yb+16)+t*t*yb+6,sw=Math.sin(tt*2+i)*1.5,r=4+t*3;
   g.globalAlpha=P.glow;const lg=g.createRadialGradient(lx+sw,ly,0,lx+sw,ly,r*3.2);lg.addColorStop(0,'rgba(255,120,80,.55)');lg.addColorStop(1,'rgba(255,120,80,0)');g.fillStyle=lg;g.fillRect(lx+sw-r*3.2,ly-r*3.2,r*6.4,r*6.4);
   g.fillStyle='#e63946';g.beginPath();g.ellipse(lx+sw,ly,r*.85,r,0,0,7);g.fill();g.fillStyle='#ffd166';g.fillRect(lx+sw-r*.5,ly-r-1,r,2);g.globalAlpha=1}})}
function drawBanner(){
 if(!banner)return;const q=banner.age,a=Math.max(0,Math.min(1,q*5,(2.6-q)*3));if(a<=0)return;
 if(banner.kind){const fury=banner.kind==='fury',k=eob(q/.3),wob=fury?Math.sin(q*30)*.04*Math.max(0,1-q):0;g.globalAlpha=a;g.save();g.translate(W/2,140);g.rotate(wob);g.scale(k,k);
  RR(-150,-26,300,50,14,fury?'#ffe0dc':'#fff1c2',3);tx(T(fury?'fury':'zoomies'),0,0,fury?20:24,fury?'#e0503f':'#ffb703');wt(T(fury?'furySub':'zoomSub'),0,17,12,'#8a5a3b');g.restore();g.globalAlpha=1;return}
 g.globalAlpha=a;const k=eob(q/.35);g.save();g.translate(W/2,150);g.scale(k,k);
 RR(-160,-30,320,58,16,'#fff1c2',3);[-1,1].forEach(sd=>P([[sd*160,-18],[sd*186,-4],[sd*174,4],[sd*186,14],[sd*160,18]],'#ff8a3d',3));
 tx(T('chap')[banner.z],0,-4,21,'#ff8a3d');wt(T('chapSub'),0,18,12,'#8a5a3b');g.restore();g.globalAlpha=1}
// Red edges that throb with the heartbeat as the shopkeeper closes in.
function danger(){
 const r=cl(1-gb/170,0,1),dz=st==='run'?cl((r-.55)/.45,0,1):0;if(dz<=0)return;
 const a=dz*(.32+.28*hbPulse),gr=g.createRadialGradient(W/2,H*.55,H*.32,W/2,H*.55,H*.78);
 gr.addColorStop(0,'rgba(230,57,70,0)');gr.addColorStop(1,'rgba(200,20,40,'+a+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
G.draw=()=>{
g.setTransform(DPR,0,0,DPR,0,0);
// A short, small nudge that fades out; never a sustained shake.
const ox=shake>0&&!reduceMotion?Math.sin(shake*90)*shake*(st==='over'?14:16):0;g.save();g.translate(ox,0);
// Caught: punch-in on the cat for a dramatic beat before the result card drops.
if(st==='over'&&!reduceMotion){const z=1+.22*eob(Math.min(1,overT/.25))*(overT<CAUGHT_HOLD?1:Math.max(0,1-(overT-CAUGHT_HOLD)/.3)),Y=pj(CYT),fx0=px(cx,Y);g.translate(fx0,Y);g.scale(z,z);g.translate(-fx0,-Y)}
bg();if(st==='run')streaks();rows.slice().sort((p,q)=>p.y-q.y).forEach(item);
warn.forEach(w=>{if(Math.floor(tt*12)%2){const Y=pj(H-34),s=sc(Y);spr('warn',px(LX[w.l],Y),Y+14*s,40*s)}});
slips.forEach(o=>{const Y=pj(o.y),s=sc(Y);spr('slip',px(LX[o.l],Y),Y,30*s,null,tt*14)});
cat();const gy=granny();zoneFx();if(st==='run'&&tut)hint();
if(st==='run'&&gb<75){const i=Math.floor(tt/1.4)%3;ptx(T('sh')[i],200,Math.min(H-150,gy-140),21,'#e0503f',tt%1.4,Math.sin(tt*9)*.04)}
g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,px(f.x,pj(CYT)),f.y-f.t*50,26,'#ff6b5a');g.globalAlpha=1});
drawFlying();
pops.forEach(q=>{g.globalAlpha=Math.max(0,1-q.age/q.life);ptx(q.s,cl(px(q.x,pj(CYT)),70,330),pj(CYT)-q.dy-q.age*46,q.sz,q.col,q.age,q.rot);g.globalAlpha=1});
danger();drawBanner();
if(st==='over'&&overT<.18){g.fillStyle='rgba(255,255,255,'+(1-overT/.18)*.85+')';g.fillRect(0,0,W,H)}
hud()};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0,overT=0,hudBump=0,landT=0,dust=[],hitKind=null,hitT=-9,hitDir=1,hbNext=0,hbPulse=0;
const hitAt=new WeakMap(),CAUGHT_HOLD=reduceMotion?0:.7;
const SK=()=>G.skins[skin],V=$('view-thief');
const T=k=>G.I[k];
function localText(text){return window.deepSeaI18n?.text(text)??text;}
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const MKEY='deep-sea-thief-missions',SNDKEY='deep-sea-thief-sound',TKEY='deep-sea-thief-tutorial',SWIPE=22,SBX=380,SBY=64,SKY0=414;
let MS={p:{},done:[]};
try{const o=JSON.parse(ST(MKEY)||'null');if(o&&typeof o==='object'){if(o.p&&typeof o.p==='object')MS.p=o.p;if(Array.isArray(o.done))MS.done=o.done.filter(id=>MISSIONS.some(m=>m.id===id))}}catch(e){}
function saveMS(){try{localStorage.setItem(MKEY,JSON.stringify(MS))}catch(e){}}
let mBase={},justDone=new Set(),shownM=[],toasts=[],pops=[],parts=[],prevEv=null,lastInput=window.matchMedia&&matchMedia('(pointer:coarse)').matches?'touch':'key';
// Contextual hints: at most one every 7 seconds, and gone after 2 hopped baskets, 1 dodged slipper or 3 runs.
let tut=null,hs={kind:null,until:0,next:0};
if(ST(TKEY)!=='1'){try{const o=JSON.parse(ST(TKEY)||'{}');tut={j:+o.j||0,d:+o.d||0,r:+o.r||0}}catch(e){tut={j:0,d:0,r:0}}}
function saveTut(){try{localStorage.setItem(TKEY,tut?JSON.stringify(tut):'1')}catch(e){}}
const lvDone=lv=>MISSIONS.filter(m=>m.lv===lv&&MS.done.includes(m.id)).length;
const lvAll=lv=>MISSIONS.filter(m=>m.lv===lv).length;
function curLevel(){for(const lv of [1,2,3])if(lvDone(lv)<lvAll(lv))return lv;return 0}
function isOpen(i){const k=G.skins[i];return k.m?MS.done.includes(k.m):k.lv?lvDone(k.lv)===lvAll(k.lv):best>=k.need}
function skinAt(i){return{x:W/2+((i%6)-2.5)*54,y:i<6?SKY0:SKY0+48}}
function mLabel(m){return localText(m.t).replace('{n}',fmt(m.n))}
function lockText(i){const k=G.skins[i];
 if(k.m)return localText(T('lockM')).replace('{m}',mLabel(MISSIONS.find(x=>x.id===k.m)));
 if(k.lv)return localText(T('lockL')).replace('{lv}',k.lv);
 return localText(T('lockS')).replace('{n}',fmt(k.need))}
function listMissions(){const lv=curLevel();shownM=MISSIONS.filter(m=>justDone.has(m.id)).concat(MISSIONS.filter(m=>m.lv===lv&&!MS.done.includes(m.id))).slice(0,3)}
function puff(n){if(reduceMotion)return;for(let i=0;i<n;i++)dust.push({dx:rnd(-16,16),vx:rnd(-40,40),age:rnd(0,.06)})}
// Delivered fruit arcs up to the kittens' hideout in the top-left corner.
let flying=[];function deliver(n){const Y=pj(CYT),x0=px(cx,Y);for(let i=0;i<n;i++)flying.push({x0,y0:Y-40,k:FK[i%3],age:-i*.07})}
function drawFlying(){flying.forEach(f=>{if(f.age<0)return;const t=Math.min(1,f.age/.7),x=f.x0+(36-f.x0)*t,y=f.y0+(70-f.y0)*t-Math.sin(t*Math.PI)*110;g.globalAlpha=1-Math.max(0,t-.85)/.15;spr(f.k,x,y,20*(1-t*.4));g.globalAlpha=1});
 if(flying.length){const a=Math.min(1,flying[0].age*4);g.globalAlpha=Math.max(0,a);C(36,66,15,'#fff6e6',2.5);spr('c0',36,78,22,tint(1));g.globalAlpha=1}}
function burst(x,y,n,cols){if(reduceMotion)return;for(let i=0;i<n;i++){const q=rnd(0,Math.PI*2),sp=rnd(120,320);parts.push({x,y,vx:Math.cos(q)*sp,vy:Math.sin(q)*sp-160,col:cols[i%cols.length],r:rnd(0,6),vr:rnd(-9,9),age:0})}}
function trackMissions(){
 const R={...stats,fruits:stats.apples+stats.oranges+stats.greens,score:G.score()};
 for(const m of shownM){
  if(MS.done.includes(m.id))continue;
  const v=m.sum?(mBase[m.id]||0)+R[m.stat]:Math.max(MS.p[m.id]||0,Math.floor(R[m.stat]));
  if(v===MS.p[m.id])continue;
  MS.p[m.id]=Math.min(v,m.n);
  if(v<m.n)continue;
  MS.done.push(m.id);justDone.add(m.id);saveMS();
  const i=G.skins.findIndex(k=>k.m===m.id),full=lvDone(m.lv)===lvAll(m.lv),li=G.skins.findIndex(k=>k.lv===m.lv);
  let b=i>=0?localText(T('newskin')).replace('{name}',localText(G.skins[i].n)):localText(T('lvprog')).replace('{lv}',m.lv).replace('{d}',lvDone(m.lv)).replace('{all}',lvAll(m.lv));
  toasts.push({h:T('mdone'),a:'✓ '+mLabel(m),b,age:0});
  if(i>=0)unl.push(G.skins[i]);
  if(full){const nb=li>=0?localText(T('newskin')).replace('{name}',localText(G.skins[li].n)):'';if(li>=0)unl.push(G.skins[li]);
   if(m.lv<3)toasts.push({h:localText(T('lvup')).replace('{lv}',m.lv+1),a:nb||'★★★',b:'',age:0,big:1});else toasts.push({h:T('alldone'),a:nb,b:'',age:0,big:1})}
  sfx(full?'levelup':'mission');burst(W/2,70,full?40:26,['#ffd23f','#7bd88f','#ff8a3d','#8ecae6','#ff70a6']);
 }
}
function events(){
 const e={fr:stats.apples+stats.oranges+stats.greens,fish:stats.fish,j:stats.jumps,d:stats.dodges,stun,jt,w:warn.length,s:slips.length,L,zoom,gold:stats.golds||0,rage:!!rage,rages:stats.rages||0},p=prevEv;
 prevEv=e;if(!p)return;
 if(e.jt>p.jt+.1){sfx('jump');puff(4)}
 if(p.jt>0&&e.jt<=0){landT=.16;puff(5);sfx('land')}
 if(e.stun>p.stun+.1){
  const b=rows.find(r=>r.t==='b'&&r.h&&!hitAt.has(r));
  if(b){hitAt.set(b,tt);hitKind='b';hitDir=b.l<1?-1:b.l>1?1:(Math.random()<.5?-1:1);sfx('trip')}else{hitKind='s';sfx('hit')}
  hitT=tt;shake=.15;try{navigator.vibrate&&navigator.vibrate(hitKind==='b'?[40,40,60]:80)}catch(_){}}
 if(e.fr>p.fr){sfx('fruit');hudBump=1;if(!(e.zoom>0))pops.push({s:'+5',x:cx,dy:70,sz:22,col:'#ffd23f',age:0,life:.7,rot:0})}
 if(e.fish>p.fish){sfx('fish');if(p.L>0){LS.delivered+=p.L;LS.maxDeliver=Math.max(LS.maxDeliver,p.L);checkStickers()}
  // Fish = delivery: the fruit on the cat's back flies off to the kittens' hideout, which is why the load disappears.
  if(p.L>0){deliver(p.L);pops.push({s:localText(T('deliver')),x:cx,dy:82,sz:17,col:'#7bd88f',age:0,life:1.1,rot:-.05})}
  else pops.push({s:localText(T('light')),x:cx,dy:78,sz:17,col:'#8ecae6',age:0,life:.9,rot:0})}
 if(e.gold>p.gold){sfx('gold');burst(px(cx,pj(CYT)),pj(CYT)-60,30,['#ffd23f','#fff6c2','#ffb703']);pops.push({s:'+15',x:cx,dy:96,sz:24,col:'#ffd23f',age:0,life:.8,rot:0})}
 if(e.zoom>0&&p.zoom<=0){sfx('zoom');banner={kind:'zoom',age:0}}
 if(e.zoom>0&&e.fr>p.fr)pops.push({s:'+10',x:cx,dy:96,sz:22,col:'#ffb703',age:0,life:.7,rot:0});
 if(e.rage&&!p.rage){sfx('fury');banner={kind:'fury',age:0}}
 if(e.rages>p.rages){sfx('phew');burst(W/2,190,22,['#7bd88f','#ffd23f','#fff6e6']);pops.push({s:localText(T('furyOk')).replace('{n}',20),x:cx,dy:104,sz:20,col:'#7bd88f',age:0,life:1.3,rot:0})}
 if(e.w>p.w)sfx('warn');
 if(e.s>p.s)sfx('whoosh');
 if(e.d>p.d){sfx('close');pops.push({s:localText(T('close')),x:cx,dy:84,sz:20,col:'#7bd88f',age:0,life:1,rot:-.08});if(tut)tut.d+=e.d-p.d}
 if(e.j>p.j&&tut)tut.j+=e.j-p.j;
 if(tut&&(tut.j>=2&&tut.d>=1)){tut=null;saveTut()}
 const z=zoneOf(G.score());
 if(z>zCur){zFrom=PZ;zCur=z;zT=0;banner={z,age:0};sfx('zone');if(z>SS.r){SS.r=z;saveSS()}if(z>LS.maxZone){LS.maxZone=z;checkStickers()}}
 trackMissions();
}

/* ---------- Sound: everything is synthesized with Web Audio, so there are no audio files to load ---------- */
let soundOn=ST(SNDKEY)!=='0',ac=null,master=null,musBus=null,sfxBus=null,noiseBuf=null,windSrc=null,windF=null,windG=null,musT=0,musI=0;
function audioInit(){
 if(!soundOn)return;
 try{
  if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();
   const comp=ac.createDynamicsCompressor();master=ac.createGain();master.gain.value=.9;master.connect(comp);comp.connect(ac.destination);
   musBus=ac.createGain();musBus.gain.value=.55;musBus.connect(master);sfxBus=ac.createGain();sfxBus.gain.value=1;sfxBus.connect(master);
   noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(ac.state==='suspended')ac.resume()}catch(e){ac=null}}
function tone(f1,f2,dur,type,vol,delay,bus){if(!ac)return;try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type=type||'sine';o.frequency.setValueAtTime(f1,t);if(f2!==f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol||.1,t+.006);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(bus||sfxBus);o.start(t);o.stop(t+dur+.03)}catch(e){}}
function noise(dur,vol,type,f1,f2,delay,bus,q){if(!ac)return;try{const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);s.buffer=noiseBuf;fl.type=type;fl.Q.value=q||1;fl.frequency.setValueAtTime(f1,t);if(f2&&f2!==f1)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(gn);gn.connect(bus||sfxBus);s.start(t,Math.random()*.5);s.stop(t+dur+.03)}catch(e){}}
// Brassy note: sawtooth through a low-pass, optional pitch fall and wobble for the "wah-wah" when caught.
function brass(f,dur,vol,delay,fall,vib){if(!ac)return;try{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='sawtooth';o.frequency.setValueAtTime(f,t);if(fall)o.frequency.exponentialRampToValueAtTime(f*fall,t+dur);
 if(vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.5;lg.gain.value=vib;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05)}
 fl.type='lowpass';fl.frequency.setValueAtTime(900,t);fl.frequency.linearRampToValueAtTime(2200,t+.06);fl.frequency.linearRampToValueAtTime(1100,t+dur);
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.03);gn.gain.setValueAtTime(vol,t+dur*.75);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl);fl.connect(gn);gn.connect(sfxBus);o.start(t);o.stop(t+dur+.05)}catch(e){}}
// Chiptune square wave through a resonant low-pass whose cutoff opens and closes: the cartoon "wah".
function wah(f,dur,vol,delay,fall,vib){if(!ac)return;try{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='square';o.frequency.setValueAtTime(f,t);if(fall)o.frequency.setValueAtTime(f,t+dur*.55),o.frequency.exponentialRampToValueAtTime(f*fall,t+dur);
 fl.type='lowpass';fl.Q.value=7;fl.frequency.setValueAtTime(260,t);fl.frequency.exponentialRampToValueAtTime(2600,t+.09);fl.frequency.exponentialRampToValueAtTime(420,t+Math.min(dur,.3));
 if(vib){const l=ac.createOscillator(),lg=ac.createGain(),l2=ac.createOscillator(),lg2=ac.createGain();l.frequency.value=6;lg.gain.value=vib;l.connect(lg);lg.connect(o.frequency);l2.frequency.value=4;lg2.gain.value=700;l2.connect(lg2);lg2.connect(fl.frequency);fl.frequency.setValueAtTime(1100,t+.3);l.start(t);l2.start(t);l.stop(t+dur+.05);l2.stop(t+dur+.05)}
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.02);gn.gain.setValueAtTime(vol,t+dur*.7);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl);fl.connect(gn);gn.connect(sfxBus);o.start(t);o.stop(t+dur+.05)}catch(e){}}
// Slide whistle: a pure tone gliding with a fast wobble.
function slide(f1,f2,dur,vol,delay){if(!ac)return;try{const o=ac.createOscillator(),l=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);l.frequency.value=9;lg.gain.value=f1*.025;l.connect(lg);lg.connect(o.frequency);
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.03);gn.gain.setValueAtTime(vol,t+dur*.8);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(sfxBus);o.start(t);l.start(t);o.stop(t+dur+.05);l.stop(t+dur+.05)}catch(e){}}
// A sad little "mew": a buzzy voice bent up then down, shaped by two vowel-like band-pass formants.
function meow(delay,vol,sad){if(!ac)return;try{const t=ac.currentTime+(delay||0),o=ac.createOscillator(),gn=ac.createGain();o.type='sawtooth';
 const a=sad?560:620,b=sad?760:980,c=sad?380:640,d=sad?.75:.45;o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d*.3);o.frequency.exponentialRampToValueAtTime(c,t+d);
 const f1=ac.createBiquadFilter(),f2=ac.createBiquadFilter();f1.type=f2.type='bandpass';f1.Q.value=4;f2.Q.value=6;f1.frequency.setValueAtTime(900,t);f1.frequency.linearRampToValueAtTime(1400,t+d*.3);f1.frequency.linearRampToValueAtTime(700,t+d);f2.frequency.setValueAtTime(2600,t);
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.05);gn.gain.setValueAtTime(vol,t+d*.6);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(f1);o.connect(f2);f1.connect(gn);f2.connect(gn);gn.connect(sfxBus);o.start(t);o.stop(t+d+.05)}catch(e){}}
const SFX={
 jump:()=>{tone(260,1100,.2,'square',.05);tone(300,900,.18,'triangle',.1);noise(.1,.04,'highpass',3000)},
 land:()=>{tone(140,70,.09,'sine',.14);noise(.06,.05,'lowpass',900)},
 lane:()=>noise(.1,.06,'bandpass',900,2600,0,0,1.4),
 // Pickups are tiny victories: a bright two-step "ka-ching" with a sparkle on top.
 fruit:()=>{tone(988,988,.07,'square',.055);tone(1319,1319,.2,'square',.055,.07);tone(2637,2637,.16,'sine',.035,.07);tone(3951,3951,.1,'sine',.02,.12)},
 fish:()=>{tone(300,900,.12,'sine',.1);[784,1047,1319,1568].forEach((f,i)=>tone(f,f,.12,'triangle',.07,.08+i*.055));tone(3136,3136,.14,'sine',.025,.3)},
 trip:()=>{noise(.12,.12,'bandpass',700,300,0,0,1);tone(200,60,.22,'sine',.3);[0,.07,.15].forEach((d,i)=>tone(900+i*220,600+i*150,.06,'triangle',.05,.12+d));noise(.25,.06,'bandpass',2000,800,.12,0,2)},
 heart:()=>{tone(75,40,.13,'sine',.4);tone(65,38,.12,'sine',.3,.17)},
 hit:()=>{tone(170,45,.28,'sine',.28);noise(.13,.2,'bandpass',1100,500,0,0,.8);tone(420,180,.16,'square',.035)},
 warn:()=>{tone(1400,1400,.06,'square',.04);tone(1050,1050,.07,'square',.04,.09)},
 whoosh:()=>noise(.38,.08,'bandpass',500,2600,0,0,2),
 close:()=>{noise(.3,.05,'bandpass',1800,500,0,0,1);tone(880,1760,.16,'triangle',.07,.06);tone(1760,1760,.12,'sine',.03,.2)},
 gold:()=>{[1319,1568,2093,2637,3136].forEach((f,i)=>tone(f,f,.25,'sine',.06,i*.05));[523,659,784].forEach(f=>tone(f,f,.6,'triangle',.04,.05));noise(.6,.04,'highpass',7000,7000,.05)},
 zoom:()=>{[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,f,.09,'square',.045,i*.045));tone(400,1600,.35,'sawtooth',.03);noise(.4,.05,'bandpass',800,4000,0,0,1.5)},
 fury:()=>{[0,.18,.36].forEach(d=>{brass(196,.14,.09,d);brass(185,.14,.06,d)});tone(110,90,.5,'sawtooth',.05,.5)},
 phew:()=>{noise(.35,.06,'bandpass',1600,500,0,0,1);[784,988,1175,1568].forEach((f,i)=>tone(f,f,.12,'triangle',.06,.15+i*.06))},
 zone:()=>{[392,523,659,784].forEach((f,i)=>brass(f,.12,.08,i*.09));brass(1047,.7,.09,.36);noise(.9,.06,'highpass',5000,5000,.36)},
 mission:()=>{[392,523,659].forEach((f,i)=>brass(f,.13,.09,i*.11));brass(784,.55,.1,.33);brass(523,.55,.06,.33);noise(.7,.05,'highpass',6000,6000,.33)},
 levelup:()=>{[523,659,784,1047].forEach((f,i)=>brass(f,.12,.09,i*.1));brass(1047,.8,.1,.4);brass(659,.8,.06,.4);brass(784,.8,.05,.4);noise(1,.06,'highpass',5500,5500,.4)},
 bonus:()=>{[1047,1319,1568,2093].forEach((f,i)=>tone(f,f,.1,'square',.05,i*.06));noise(.5,.05,'highpass',6000,6000,.24)},
 record:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.14,'triangle',.07,4.7+i*.07)),
 // Caught: the classic deflated "wah, wah, wah, waaaah" ending in a long wobbly fall, then a tired sigh.
 // Caught: record scratch, orchestra hit with timpani and crash on the freeze-frame, slide whistle falling,
 // chiptune "wah wah wah waaah", then a sad mew.
 caught:()=>{noise(.11,.22,'bandpass',3200,500,0,0,3);noise(.09,.18,'bandpass',600,2800,.11,0,3);
  [131,156,196,262].forEach(f=>brass(f,.6,.07,.2,.97));tone(95,50,.8,'sine',.45,.2);tone(190,95,.25,'triangle',.12,.2);noise(1.3,.12,'highpass',3500,3500,.2);
  slide(1500,320,.6,.07,.95);
  [392,370,349].forEach((f,i)=>wah(f,.27,.075,1.6+i*.29));wah(330,1.25,.085,2.47,.78,9);
  meow(3.85,.09,1)},
 start:()=>{tone(2100,2700,.12,'sine',.06);tone(2700,2700,.22,'sine',.06,.12);meow(.4,.07,0);brass(523,.12,.06,.85);brass(784,.22,.07,.97)}};
function sfx(k){if(soundOn&&ac&&SFX[k])SFX[k]()}
function windOn(){if(!ac||windSrc)return;try{windSrc=ac.createBufferSource();windSrc.buffer=noiseBuf;windSrc.loop=true;windF=ac.createBiquadFilter();windF.type='bandpass';windF.Q.value=.8;windF.frequency.value=500;windG=ac.createGain();windG.gain.value=.0001;windSrc.connect(windF);windF.connect(windG);windG.connect(musBus);windSrc.start()}catch(e){windSrc=null}}
function windOff(){if(!windSrc)return;try{const t=ac.currentTime;windG.gain.cancelScheduledValues(t);windG.gain.setValueAtTime(windG.gain.value,t);windG.gain.exponentialRampToValueAtTime(.0001,t+.4);windSrc.stop(t+.45)}catch(e){}windSrc=null}
function toggleSound(){soundOn=!soundOn;try{localStorage.setItem(SNDKEY,soundOn?'1':'0')}catch(e){}musT=0;if(soundOn){audioInit();if(master)master.gain.value=.9;sfx('fruit')}else{if(master)master.gain.value=0;windOff()}}
// 150 BPM chase loop in C major (C, Am, F, G): four-on-the-floor kick, offbeat hats, bouncy bass, chirpy lead.
const CH=[[523,659,784,1047],[440,523,659,880],[349,440,523,698],[392,494,587,784]],ROOT=[131,110,87,98];
const LEAD=[0,-1,2,-1,1,2,-1,3,-1,2,1,-1,0,-1,1,2],LEAD2=[3,-1,2,1,-1,2,-1,0,1,-1,2,3,-1,2,1,-1],BASSP=[1,0,0,1,0,0,2,0,1,0,2,0,1,0,2,0];
// Night switches to Am, F, C, G with a gong at the top of each loop; dusk adds a soft shaker.
const CHN=[[440,523,659,880],[349,440,523,698],[523,659,784,1047],[392,494,587,784]],ROOTN=[110,87,131,98];
function music(){
 if(st!=='run'||V.hidden||document.hidden||!soundOn||!ac||ac.state!=='running'){musT=0;if(windSrc&&(st!=='run'||!soundOn))windOff();return}
 windOn();
 const now=ac.currentTime,sp=(v-260)/170;
 if(windSrc){windF.frequency.setTargetAtTime(420+sp*900+Math.sin(tt*.8)*160,now,.2);windG.gain.setTargetAtTime(.05+sp*.05+(Math.sin(tt*.53)+1)*.012,now,.3)}
 const step=(.1-Math.min(.012,dist/500000))*(zoom>0?.8:1);
 if(musT<now)musT=now+.05;
 while(musT<now+.25){
  const i=musI%16,bar=(musI>>4)%4,d=musT-now,night=zCur===2,ch=(night?CHN:CH)[bar],root=(night?ROOTN:ROOT)[bar],hot=G.score()>=150;
  if(zCur>=1&&i%2)noise(.025,.012,'highpass',9500,9500,d,musBus);
  if(night&&i===0&&bar===0){tone(147,144,1.8,'sine',.08,d,musBus);tone(221,218,1.4,'sine',.035,d,musBus);noise(.6,.03,'bandpass',600,300,d,musBus,2)}
  if(i%4===0)tone(150,42,.14,'sine',.3,d,musBus);
  if(i===4||i===12){noise(.12,.11,'bandpass',1800,1200,d,musBus,.9);tone(220,160,.08,'triangle',.05,d,musBus)}
  if(i%2===0)noise(.035,.03,'highpass',7500,7500,d,musBus);else if(hot)noise(.03,.018,'highpass',9000,9000,d,musBus);
  if(i%4===2)noise(.09,.035,'highpass',6500,6500,d,musBus);
  if(BASSP[i])tone(root*(BASSP[i]===2?2:1),root*(BASSP[i]===2?2:1),.11,'triangle',.13,d,musBus);
  const li=(bar===3?LEAD2:LEAD)[i];if(li>=0){tone(ch[li],ch[li],.1,'square',.03,d,musBus);if(zoom>0)tone(ch[li]*2,ch[li]*2,.08,'triangle',.02,d,musBus)}
  if(hot&&i%8===6)tone(ch[3]*2,ch[3]*2,.08,'sine',.02,d,musBus);
  musT+=step;musI++}
}
function hint(){
 if(tt>=hs.until){hs.kind=null;
  if(tt>=hs.next){let kind=null,dir=0;
   if(jt<=0&&rows.some(r=>r.t==='b'&&r.l===lane&&!r.h&&r.y>250&&r.y<CYT-40))kind='jump';
   else if(warn.some(w=>w.l===lane)){kind='move';dir=lane===0?1:lane===2?-1:(warn.some(w=>w.l===0)?1:-1)}
   if(kind)hs={kind,dir,until:tt+1.5,next:tt+7}}}
 if(!hs.kind)return;
 const kind=hs.kind,dir=hs.dir,a=Math.min(1,(hs.until-tt)*4,(1.5-(hs.until-tt))*6),Y=pj(CYT),x=cl(px(cx,Y),60,340),y=Y-112;
 g.globalAlpha=Math.max(0,a);
 RR(x-34,y-28,68,54,14,'#fffaf0',3);
 if(lastInput==='key'){RR(x-26,y-15,52,28,7,'#f4e2c4',2.5);wt(kind==='jump'?T('space'):dir<0?'←':'→',x,y+5,kind==='jump'?12:18,OL,0,48)}
 else{const t=(tt*1.4)%1;
  if(kind==='jump'){L2(x,y+14,x,y-12,4,'#ff8a3d');P([[x-8,y-8],[x,y-19],[x+8,y-8]],'#ff8a3d',2);C(x,y+14-t*24,6,'rgba(255,255,255,.95)',2)}
  else{L2(x-18*dir,y,x+12*dir,y,4,'#ff8a3d');P([[x+8*dir,y-8],[x+19*dir,y],[x+8*dir,y+8]],'#ff8a3d',2);C(x-18*dir+t*30*dir,y,6,'rgba(255,255,255,.95)',2)}}
 g.globalAlpha=1}
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||!isOpen(skin))skin=0;
listMissions();
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){if(st==='run')control(4);heldBy=undefined;gest=null;}
function say(text,kind){$('thief-msg').textContent=text;$('thief-msg').className='msg'+(kind?' '+kind:'')}
thiefSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('thief-score',fmt(G.score()));setText('thief-best',fmt(best));setText('thief-pay',fmt(paid)+' 點');
 setText('thief-next',next?fmt(next)+' · +'+BONUS+' 點':'{{t:thief.msg.012}}');
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
  say(localText(T('bonusSay')).replace('{m}',fmt(m)).replace('{b}',BONUS).replace('{t}',paid),'win');sfx('bonus');burst(W/2,150,20,['#ffd23f','#ff8a3d','#fff6e6']);
 }
}
// One reason to go again, most motivating first: an unread chapter, a near record, a nearly finished mission, the next scene.
let hook='';
function nearMiss(s){
 const L0=k=>localText(T(k));
 if(unseen()>=0)return L0('hookStory');
 if(!(s>best)&&best>0&&best-s<=Math.max(15,Math.round(best*.12)))return L0('hookBest').replace('{n}',fmt(best-s+1));
 for(const m of shownM){if(MS.done.includes(m.id))continue;const left=m.n-Math.floor(MS.p[m.id]||0),near=m.n>=30?Math.max(3,Math.round(m.n*.1)):2;if(left>0&&left<=near)return L0('hookMission').replace('{m}',mLabel(m)).replace('{k}',fmt(left))}
 for(const z of [1,2]){const at=ZONES[z].at;if(s<at&&s>=at*.72)return L0('hookZone').replace('{n}',fmt(at-s)).replace('{z}',L0(z===1?'zSunset':'zNight'))}
 return ''}
function die(m){
 if(st!=='run')return;
 st='over';G.msg=m;shake=reduceMotion?0:.25;release();overT=0;
 const s=G.score();if(!dailyRun)rank.finish(s);rec=s>best;
 recordRun(s);unl=unl.concat(G.skins.filter(k=>k.need>best&&k.need<=s));
 hook=nearMiss(s);
 saveMS();if(tut)saveTut();listMissions();sfx('caught');windOff();if(rec&&s>0){sfx('record')}
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});thiefBusy=false;renderAll();
 say(localText(T('caughtSay')).replace('{s}',fmt(s))+' '+(paid?localText(T('bonusTot')).replace('{t}',paid):localText('{{t:thief.msg.016}}')),paid?'win':'lose');
 ui();
}
function start(daily){
 audioInit();
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 const go=random=>{
 dailyRun=!!daily;stepAcc=0;closeSheet();
 if(dailyRun)random=timedReplay.seeded(dailySeed());
 analytics=AN.start('thief',amount);thiefStake=amount;thiefBusy=true;save();renderAll();
 model=thiefRules.create(random||Math.random,thiefRules.rulesVersion);syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;
 zCur=0;zFrom=ZONES[0];zT=1;PZ=ZONES[0];banner=null;hook='';closeStory();
 justDone.clear();mBase={...MS.p};listMissions();prevEv=null;toasts=[];pops=[];parts=[];hudBump=0;landT=0;dust=[];hitKind=null;hitT=-9;hbNext=0;hbPulse=0;flying=[];hs={kind:null,until:0,next:tt+2};
 if(tut){tut.r++;if(tut.r>3){tut=null;saveTut()}}
 st='run';last=performance.now();say(dailyRun?localText(T('dGoalSay')).replace('{n}',fmt(dailyGoal())):'{{t:thief.msg.017}}');sfx('start');ui();c.focus();
 };
 // The Daily Heist uses today's shared seed locally and is not sent to the leaderboard.
 if(daily)go(null);else rank.start(go,ui,{rulesVersion:thiefRules.rulesVersion});
}
/* ---------- Story: three comic panels per chapter, drawn from the game's own sprites ---------- */
const SKEY2='deep-sea-thief-story';
let SS={r:0,seen:[]};try{const o=JSON.parse(ST(SKEY2)||'null');if(o&&typeof o==='object'){SS.r=cl(+o.r||0,0,2);SS.seen=Array.isArray(o.seen)?o.seen.filter(n=>n>=0&&n<=2):[]}}catch(e){}
function saveSS(){try{localStorage.setItem(SKEY2,JSON.stringify(SS))}catch(e){}}
let story=null;
const unseen=()=>{for(let ch=0;ch<=SS.r;ch++)if(!SS.seen.includes(ch))return ch;return -1};
function openStory(ch){story={c:ch,age:0}}
function closeStory(){if(!story)return;if(!SS.seen.includes(story.c)){SS.seen.push(story.c);saveSS()}story=null}
const kits=(x,y,h,n)=>{for(let k=0;k<n;k++)spr('c0',x+(k-(n-1)/2)*h*.62,y-Math.abs(Math.sin(tt*4+k))*3,h,tint(k+1))};
const PANELS=[
 [[ '#cdeefa',(x,y,w,h)=>{spr('crate1',x+w/2,y+h-26,60);kits(x+w/2,y+h-62,38,5)},'{{t:thief.msg.069}}'],
  ['#d9f2fb',(x,y,w,h)=>{spr('stallR',x+92,y+h+2,104);spr('apple',x+150,y+44+Math.sin(tt*3)*3,24);spr('c0',x+w-92,y+h-26,74,tint(skin))},'{{t:thief.msg.070}}'],
  ['#ffe1d6',(x,y,w,h)=>{spr('gt',x+w/2-50,y+h+14,128);spr('slip',x+w/2+74,y+56,34,null,tt*8);spr('warn',x+w/2+20,y+46,30)},'{{t:thief.msg.071}}']],
 [['#ffd8a8',(x,y,w,h)=>{kits(x+w/2-50,y+h-32,40,3);spr('apple',x+w/2+50,y+h-32,28);spr('orange',x+w/2+78,y+h-32,28);spr('green',x+w/2+64,y+h-56,26)},'{{t:thief.msg.072}}'],
  ['#ffb27a',(x,y,w,h)=>{spr('g0',x+w/2-20,y+h+14,128);spr('slip',x+w/2+70,y+46,30,null,.5+Math.sin(tt*6)*.3)},'{{t:thief.msg.073}}'],
  ['#ff9e7a',(x,y,w,h)=>{const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#6c5b9e');gr.addColorStop(1,'#ffb27a');g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='#ffd27a';g.beginPath();g.arc(x+w-70,y+h-18,26,Math.PI,0);g.fill();spr('c1',x+w/2-60,y+h-26,66,tint(skin));spr('g1',x+w/2+70,y+h+8,92)},'{{t:thief.msg.074}}']],
 [['#1b2450',(x,y,w,h)=>{STARS.slice(0,12).forEach(([sx,sy])=>{g.fillStyle='#fff8dc';g.fillRect(x+sx*.8,y+(sy-40)*.9,2,2)});spr('lamp',x+56,y+h+2,104);spr('stallY',x+w-96,y+h+2,104);g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x+56,y+30,0,x+56,y+30,60);gr.addColorStop(0,'rgba(255,190,90,.45)');gr.addColorStop(1,'rgba(255,190,90,0)');g.fillStyle=gr;g.fillRect(x,y,120,h);g.globalCompositeOperation='source-over'},'{{t:thief.msg.075}}'],
  ['#26305e',(x,y,w,h)=>{RR(x+w/2-34,y+18,68,h-22,6,'#8a5a3b',3);C(x+w/2+22,y+h/2+6,3.5,'#ffd166',1.5);spr('fish',x+w/2+62,y+h-30,30);tx('?',x+w/2+62,y+40+Math.sin(tt*4)*3,30,'#ffd23f');g.globalAlpha=.85;spr('g2',x+62,y+h+12,96);g.globalAlpha=1},'{{t:thief.msg.076}}'],
  ['#1b2450',(x,y,w,h)=>{g.fillStyle='#fff3c4';g.beginPath();g.arc(x+w-60,y+34,16,0,7);g.fill();g.fillStyle='#1b2450';g.beginPath();g.arc(x+w-52,y+29,14,0,7);g.fill();kits(x+w/2-20,y+h-32,40,3);spr('fish',x+w/2+62,y+h-32,32)},'{{t:thief.msg.077}}']]];
function drawStory(){
 const q=story.age;g.fillStyle='rgba(30,18,12,.88)';g.fillRect(0,0,W,H);
 ptx(T('chap')[story.c],W/2,40,22,'#ffd23f',q);
 PANELS[story.c].forEach(([bgc,fn,cap],i)=>{
  const a=cl((q-.25-i*.45)/.3,0,1);if(a<=0)return;const x=36,y=58+i*142+(1-eob(a))*20,w=328,h=130;
  g.globalAlpha=a;RR(x,y,w,h,14,bgc,3);g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();fn(x,y,w,h);g.restore();
  RR(x+10,y+h-28,w-20,22,9,'rgba(255,246,230,.94)',0);wt(cap,W/2,y+h-12,13,OL,0,w-30);
  RR(x,y,w,h,14,'rgba(0,0,0,0)',3);g.globalAlpha=1});
 if(q>1.6)waveTx('{{t:thief.msg.078}}',W/2,516,15,'#fff6e6')}
/* ---------- Lifetime stats, sticker album, the kittens' hideout and the Daily Heist ---------- */
const LKEY='deep-sea-thief-life';
const LS0={runs:0,caught:0,apples:0,oranges:0,greens:0,fish:0,jumps:0,dodges:0,zooms:0,golds:0,rages:0,delivered:0,maxDeliver:0,maxZone:0,best:0,stickers:[],daily:{date:'',best:0,done:0},dailyLast:'',dailyStreak:0,dailyWins:0};
let LS={...LS0,daily:{...LS0.daily}};
try{const o=JSON.parse(ST(LKEY)||'null');if(o&&typeof o==='object'){for(const k in LS0)if(typeof o[k]===typeof LS0[k])LS[k]=o[k];if(!Array.isArray(LS.stickers))LS.stickers=[]}}catch(e){}
LS.best=Math.max(LS.best,best);
function saveLS(){try{localStorage.setItem(LKEY,JSON.stringify(LS))}catch(e){}}
let sheet=null,hearts=[],dailyRun=false,stepAcc=0,newStickers=new Set();
const STICKERS=[
 ['first','c0',q=>q.runs>=1,'msg.100',['msg.120']],['apple100','apple',q=>q.apples>=100,'msg.101',['msg.034',100]],['orange50','orange',q=>q.oranges>=50,'msg.102',['msg.047',50]],['fish50','fish',q=>q.fish>=50,'msg.103',['msg.035',50]],
 ['jump100','basket',q=>q.jumps>=100,'msg.104',['msg.037',100]],['dodge50','slip',q=>q.dodges>=50,'msg.105',['msg.036',50]],['deliver5','crate1',q=>q.maxDeliver>=5,'msg.106',['msg.121']],['deliver200','c1',q=>q.delivered>=200,'msg.107',['msg.122',200]],
 ['sunset','sun',q=>q.maxZone>=1,'msg.108',['msg.123',1]],['night','moon',q=>q.maxZone>=2,'msg.109',['msg.123',2]],['zoom1','zoom',q=>q.zooms>=1,'msg.110',['msg.124']],['zoom25','zoom',q=>q.zooms>=25,'msg.111',['msg.125',25]],
 ['gold1','gold',q=>q.golds>=1,'msg.112',['msg.126']],['gold20','gold',q=>q.golds>=20,'msg.113',['msg.127',20]],['fury1','gt',q=>q.rages>=1,'msg.114',['msg.128']],['score400','star',q=>q.best>=400,'msg.115',['msg.050',400]],
 ['score800','crown',q=>q.best>=800,'msg.116',['msg.050',800]],['caught25','g0',q=>q.caught>=25,'msg.117',['msg.129',25]],['daily1','cal',q=>q.dailyWins>=1,'msg.118',['msg.130']],['daily7','cal',q=>q.dailyStreak>=7,'msg.119',['msg.131',7]]];
// Sticker names and how-to lines are looked up by id at build time; keep this list in step with the ids above.
const STXT={'msg.100':'{{t:thief.msg.100}}','msg.101':'{{t:thief.msg.101}}','msg.102':'{{t:thief.msg.102}}','msg.103':'{{t:thief.msg.103}}','msg.104':'{{t:thief.msg.104}}','msg.105':'{{t:thief.msg.105}}','msg.106':'{{t:thief.msg.106}}','msg.107':'{{t:thief.msg.107}}','msg.108':'{{t:thief.msg.108}}','msg.109':'{{t:thief.msg.109}}','msg.110':'{{t:thief.msg.110}}','msg.111':'{{t:thief.msg.111}}','msg.112':'{{t:thief.msg.112}}','msg.113':'{{t:thief.msg.113}}','msg.114':'{{t:thief.msg.114}}','msg.115':'{{t:thief.msg.115}}','msg.116':'{{t:thief.msg.116}}','msg.117':'{{t:thief.msg.117}}','msg.118':'{{t:thief.msg.118}}','msg.119':'{{t:thief.msg.119}}',
 'msg.120':'{{t:thief.msg.120}}','msg.121':'{{t:thief.msg.121}}','msg.122':'{{t:thief.msg.122}}','msg.123':'{{t:thief.msg.123}}','msg.124':'{{t:thief.msg.124}}','msg.125':'{{t:thief.msg.125}}','msg.126':'{{t:thief.msg.126}}','msg.127':'{{t:thief.msg.127}}','msg.128':'{{t:thief.msg.128}}','msg.129':'{{t:thief.msg.129}}','msg.130':'{{t:thief.msg.130}}','msg.131':'{{t:thief.msg.131}}',
 'msg.034':'{{t:thief.msg.034}}','msg.047':'{{t:thief.msg.047}}','msg.035':'{{t:thief.msg.035}}','msg.037':'{{t:thief.msg.037}}','msg.036':'{{t:thief.msg.036}}','msg.050':'{{t:thief.msg.050}}'};
function stName(st0){return localText(STXT[st0[3]])}
function stDesc(st0){const [id,n]=st0[4];let t=localText(STXT[id]);if(id==='msg.123')return t.replace('{z}',localText(T(n===1?'zSunset':'zNight')));return t.replace('{n}',fmt(n||0))}
function checkStickers(){
 for(const st0 of STICKERS){if(LS.stickers.includes(st0[0])||!st0[2](LS))continue;
  LS.stickers.push(st0[0]);newStickers.add(st0[0]);saveLS();
  if(st==='run'||st==='over'){toasts.push({h:T('newSticker'),a:'★ '+stName(st0),b:stDesc(st0),age:0});sfx('mission')}}}
function recordRun(s){
 const q=stats;LS.runs++;LS.caught++;['apples','oranges','greens','fish','jumps','dodges','zooms','golds','rages'].forEach(k=>LS[k]+=q[k]||0);LS.best=Math.max(LS.best,s);
 if(dailyRun){const d=LS.daily,today=dayKey(0);if(d.date!==today){d.date=today;d.best=0;d.done=0}d.best=Math.max(d.best,s);
  if(!d.done&&s>=dailyGoal()){d.done=1;LS.dailyWins++;LS.dailyStreak=LS.dailyLast===dayKey(-1)?LS.dailyStreak+1:1;LS.dailyLast=today;toasts.push({h:T('dWin'),a:localText(T('dStreak')).replace('{s}',LS.dailyStreak),b:'',age:0,big:1});burst(W/2,110,36,['#ffd23f','#7bd88f','#ff8a3d'])}}
 checkStickers();saveLS()}
// Days run on the player's local calendar; the seed is the same for everyone on the same date.
function dayKey(off){const d=new Date(Date.now()+off*864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dailySeed(){let h=2166136261;for(const ch of 'thief:'+dayKey(0)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h}
function dailyGoal(){const d=new Date();return 200+((d.getFullYear()*372+d.getMonth()*31+d.getDate())%4)*50}
const dailyDoneToday=()=>LS.daily.date===dayKey(0)&&LS.daily.done;
const HOME_AT=[0,20,60,150,300,600];
const homeLv=()=>{let l=0;HOME_AT.forEach((a,i)=>{if(LS.delivered>=a)l=i});return l};
function openSheet(kind){sheet={kind,age:0,sel:-1};if(kind==='album')newStickers.clear()}
function closeSheet(){sheet=null}
function sheetTap(p){
 if(sheet.age<.3)return;
 if(sheet.kind==='album'){const i=albumAt(p);if(i>=0){sheet.sel=i;return}}
 else if(p.y>150&&p.y<350&&p.x>50&&p.x<350){meow(0,.08,0);hearts.push({x:p.x,y:p.y,age:0});return}
 closeSheet()}
function albumAt(p){const c0=Math.floor((p.x-40)/80),r0=Math.floor((p.y-64)/78);if(p.x<40||c0>3||r0<0||r0>4)return -1;return r0*4+c0}
function badgeIcon(k,x,y,lock){
 if(lock)g.globalAlpha=.22;
 if(k==='sun'){g.fillStyle='#ffb703';g.beginPath();g.arc(x,y,11,0,7);g.fill()}
 else if(k==='moon'){g.fillStyle='#fff3c4';g.beginPath();g.arc(x,y,11,0,7);g.fill();g.fillStyle=lock?'#cbb89a':'#35427e';g.beginPath();g.arc(x+5,y-4,9,0,7);g.fill()}
 else if(k==='star'||k==='crown'||k==='cal'||k==='zoom'){if(k==='star')star(x,y,13,'#ffd23f');else if(k==='crown')P([[x-13,y+8],[x-14,y-8],[x-7,y],[x,y-12],[x+7,y],[x+14,y-8],[x+13,y+8]],'#ffd23f',2);else if(k==='zoom')P([[x+3,y-15],[x-9,y+2],[x-1,y+2],[x-4,y+15],[x+9,y-3],[x+1,y-3]],'#ffd23f',2);else{RR(x-12,y-11,24,22,4,'#fff',2);g.fillStyle='#e63946';g.fillRect(x-11,y-10,22,6);wt('1',x,y+9,11,OL)}}
 else if(k==='gold')spr('apple',x,y+12,26,goldApple());
 else if(k==='gt'||k==='g0')spr(k,x,y+18,40);
 else if(k==='c0'||k==='c1')spr(k,x,y+16,32,tint(1));
 else spr(k,x,y+12,k==='crate1'?24:26);
 g.globalAlpha=1}
function drawAlbum(){
 const q=sheet.age;g.fillStyle='rgba(30,18,12,.9)';g.fillRect(0,0,W,H);
 ptx(localText(T('album')).replace('{a}',LS.stickers.length).replace('{b}',STICKERS.length),W/2,40,20,'#ffd23f',q);
 STICKERS.forEach((st0,i)=>{const x=40+(i%4)*80+40,y=64+Math.floor(i/4)*78+30,got=LS.stickers.includes(st0[0]),a=cl((q-i*.02)/.2,0,1);
  g.globalAlpha=a;C(x,y,27,got?'#fff6e6':'#6b5545',2.5);if(got){g.strokeStyle='#ffd23f';g.lineWidth=2;g.setLineDash([3,3]);g.beginPath();g.arc(x,y,22,0,7);g.stroke();g.setLineDash([])}
  badgeIcon(st0[1],x,y,!got);if(i===sheet.sel){g.strokeStyle='#ff8a3d';g.lineWidth=3;g.beginPath();g.arc(x,y,31,0,7);g.stroke()}
  wt(got?stName(st0):'???',x,y+42,10,got?'#fff6e6':'#a89582',0,76);g.globalAlpha=1});
 if(sheet.sel>=0){const st0=STICKERS[sheet.sel],got=LS.stickers.includes(st0[0]);RR(36,456,328,52,12,'#fff6e6',2.5);wt(got?stName(st0):'???',W/2,476,14,OL,0,300);wt(stDesc(st0),W/2,497,12,got?'#4f9a2f':'#8a5a3b',0,300)}
 else wt(T('albumTip'),W/2,484,12,'#d8c7b0',0,320);
 if(q>.6)waveTx(T('closeTip'),W/2,532,14,'#fff6e6')}
function drawHome(){
 const q=sheet.age,lv=homeLv(),x=36,y=64,w=328,h=290;g.fillStyle='rgba(30,18,12,.9)';g.fillRect(0,0,W,H);
 ptx(localText(T('home')).replace('{lv}',lv+1),W/2,40,20,'#ffd23f',q);
 RR(x,y,w,h,16,'#f6e2c0',3);g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();
 g.fillStyle='#d9b48a';g.fillRect(x,y+h*.62,w,h);g.fillStyle='rgba(122,74,36,.25)';for(let i=0;i<8;i++)g.fillRect(x+i*44,y+h*.62,2,h);
 // window with the night sky
 RR(x+w/2-50,y+24,100,74,8,'#35427e',3);g.fillStyle='#fff3c4';g.beginPath();g.arc(x+w/2+22,y+48,10,0,7);g.fill();L2(x+w/2,y+24,x+w/2,y+98,3);L2(x+w/2-50,y+61,x+w/2+50,y+61,3);
 if(lv>=3){[-1,1].forEach(sd=>{const lx=x+w/2+sd*92,ly=y+44+Math.sin(tt*2+sd)*2;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(lx,ly,0,lx,ly,30);gr.addColorStop(0,'rgba(255,120,80,.5)');gr.addColorStop(1,'rgba(255,120,80,0)');g.fillStyle=gr;g.fillRect(lx-30,ly-30,60,60);g.globalCompositeOperation='source-over';E(lx,ly,9,12,'#e63946',2)})}
 if(lv>=5){RR(x+w/2-60,y+104,120,22,6,'#ffd23f',2.5);wt(T('homeSign'),x+w/2,y+120,11,OL,0,112)}
 if(lv>=1)RR(x+40,y+h-62,w-80,40,16,'#e98e62',3);
 if(lv>=4){E(x+70,y+h-40,26,12,'#8ecae6',2.5);E(x+w-70,y+h-40,26,12,'#ffafcc',2.5)}
 if(lv>=2){C(x+w-46,y+h-86,18,'rgba(142,202,230,.6)',2.5);spr('fish',x+w-46,y+h-78,16)}
 spr('crate1',x+50,y+h-16,46);
 const kz=1+lv*.07;for(let k=0;k<5;k++){const kx=x+w/2+(k-2)*44,ky=y+h-34-Math.abs(Math.sin(tt*3+k))*4;spr('c0',kx,ky,40*kz,tint(k+1))}
 g.restore();RR(x,y,w,h,16,'rgba(0,0,0,0)',3);
 hearts.forEach(hh=>{g.globalAlpha=1-hh.age;tx('♥',hh.x,hh.y-hh.age*40,20,'#ff70a6');g.globalAlpha=1});
 const nx=HOME_AT[lv+1];
 wt(nx?localText(T('homeProg')).replace('{d}',fmt(LS.delivered)).replace('{n}',fmt(nx)):localText(T('homeMax')).replace('{d}',fmt(LS.delivered)),W/2,y+h+28,13,'#fff6e6',0,320);
 RR(60,y+h+38,280,10,5,'#5a4535',1.5);const pr=nx?cl((LS.delivered-HOME_AT[lv])/(nx-HOME_AT[lv]),0,1):1;if(pr>0)RR(60,y+h+38,Math.max(10,280*pr),10,5,'#7bd88f',1.5);
 if(nx)wt(localText(T('homeNext')).replace('{i}',localText(T('homeItems')[lv])),W/2,y+h+70,12,'#d8c7b0',0,320);
 wt(T('homeTip'),W/2,y+h+92,12,'#d8c7b0',0,320);
 if(q>.6)waveTx(T('closeTip'),W/2,532,14,'#fff6e6')}
function sideBtn(y,kind,badge){
 const x=20;C(x,y,16,kind==='daily'?'#ffe1d6':'#fff6e6',2.5);
 if(kind==='album'){RR(x-9,y-10,18,20,3,'#ff8a3d',1.6);star(x,y,5,'#fff6e6')}
 else if(kind==='home'){P([[x-10,y-1],[x,y-10],[x+10,y-1]],'#e63946',1.6);RR(x-7,y-2,14,11,2,'#f4c983',1.6)}
 else{RR(x-9,y-8,18,17,3,'#fff',1.6);g.fillStyle='#e63946';g.fillRect(x-8,y-7,16,5);wt(String(new Date().getDate()),x,y+7,9,OL)}
 if(badge){const k=1+.15*Math.sin(tt*6);g.save();g.translate(x+12,y-12);g.scale(k,k);C(0,0,5.5,'#e63946',1.5);g.restore()}}
function storyBtn(){
 const x=20,y=SBY,nw=unseen()>=0;C(x,y,16,nw?'#ffd23f':'#fff6e6',2.5);
 g.save();g.translate(x,y);P([[-9,-7],[0,-5],[0,8],[-9,6]],'#fff',1.6);P([[9,-7],[0,-5],[0,8],[9,6]],'#fff',1.6);g.restore();
 if(nw){const k=1+.15*Math.sin(tt*6);g.save();g.translate(x+12,y-12);g.scale(k,k);C(0,0,6,'#e63946',1.5);wt('!',0,4,10,'#fff');g.restore()}}
function soundBtn(){
 C(SBX,SBY,16,'#fff6e6',2.5);g.save();g.translate(SBX,SBY);
 g.beginPath();g.moveTo(-9,-4);g.lineTo(-4,-4);g.lineTo(2,-9);g.lineTo(2,9);g.lineTo(-4,4);g.lineTo(-9,4);g.closePath();g.fillStyle=OL;g.fill();
 if(soundOn){g.strokeStyle=OL;g.lineWidth=2;g.lineCap='round';[5,9].forEach(r=>{g.beginPath();g.arc(2,0,r,-.8,.8);g.stroke()})}
 else{L2(6,-5,12,5,2.5,'#e0503f');L2(12,-5,6,5,2.5,'#e0503f')}
 g.restore()}
function missionCard(y){
 const x=36,w=328,lv=curLevel()||3;RR(x,y,w,92,14,'#fff6e6',3);
 wt(localText(T('mt')).replace('{lv}',lv),x+16,y+19,13,'#8a5a3b','left',w-76);
 for(let i=0;i<3;i++){const dx=x+w-40+i*12;g.font='900 11px '+FB;g.textAlign='center';g.fillStyle=i<lv?'#ffb703':'rgba(138,90,59,.3)';g.fillText('★',dx,y+19)}
 if(!shownM.length){wt(T('alldone'),W/2,y+58,15,'#4f9a2f',0,w-24);return}
 shownM.forEach((m,i)=>{
  const yy=y+42+i*21,done=MS.done.includes(m.id),v=done?m.n:Math.min(m.n,Math.floor(MS.p[m.id]||0)),bx=x+w-62;
  C(x+20,yy-4,7,done?'#7bd88f':'#fff4dc',2);if(done)wt('✓',x+20,yy,10,'#fff');
  wt(mLabel(m),x+34,yy,13,done?'#4f9a2f':OL,'left',bx-x-72);
  wt(fmt(v)+'/'+fmt(m.n),bx-6,yy,11,'#8a5a3b','right');
  RR(bx,yy-10,48,10,5,'#f4e2c4',1.5);if(v>0)RR(bx,yy-10,Math.max(10,48*v/m.n),10,5,done?'#7bd88f':'#ff9f1c',1.5)});
}
function overlay(){
if(story){drawStory();return}
if(sheet){sheet.kind==='album'?drawAlbum():drawHome();return}
g.fillStyle='rgba(74,44,29,.38)';g.fillRect(0,0,W,H);
if(st==='ready'){
 const by=Math.sin(tt*2.2)*3;
 if(LOGO.complete&&LOGO.naturalWidth)g.drawImage(LOGO,62,48+by,276,276*LOGO.naturalHeight/LOGO.naturalWidth);else tx(T('title'),W/2,120,32,'#ffd23f');
 tx(T('tag'),W/2,174,16,'#fff6e6');
 missionCard(186);
 waveTx('{{t:thief.msg.018}}',W/2,318,18,'#ff8a3d');
 tx(T('tip'),W/2,350,13,'#fff6e6')}
else{
 const ot=overT-CAUGHT_HOLD,k=eob(ot/.45),dy=(1-k)*-50;g.save();g.translate(0,dy);
 card(36,52,328,218);
 g.save();g.translate(W/2,84);g.rotate(Math.sin(ot*14)*.06*Math.max(0,1-ot));tx(T(G.msg),0,0,24,'#e0503f');g.restore();
 wt(fmt(Math.round(G.score()*cl(ot/.7,0,1))),W/2,134,46,OL);
 if(G.extra)wt(G.extra(),W/2,158,14,'#8a5a3b');
 if(rec){const s=font('{{t:thief.msg.019}}',14*.92,0),w=g.measureText(s).width+28,p=1+.06*Math.sin(tt*6);g.save();g.translate(W/2,180);g.scale(p,p);RR(-w/2,-12,w,24,12,'#ffd23f',2.5);wt(s,0,5,14,OL);g.restore()}
 if(unl.length)wt(localText('{{t:thief.msg.020}}')+unl.map(q=>localText(q.n)).join(' · '),W/2,212,13,'#4f9a2f',0,300);
 if(dailyRun){const d=LS.daily;wt(localText(T(d.done?'dCleared':'dLine')).replace('{n}',fmt(dailyGoal())).replace('{b}',fmt(d.best)).replace('{s}',LS.dailyStreak),W/2,232,13,d.done?'#4f9a2f':'#d9822b',0,300)}
 else wt(paid>0?localText('{{t:thief.msg.021}}')+paid+' '+localText('點'):'{{t:thief.msg.022}}',W/2,232,14,paid>0?'#d9822b':'#8a5a3b',0,300);
 wt(hook||'{{t:thief.msg.023}}',W/2,251,13,hook?'#e0503f':'#d9822b',0,300);
 g.restore();
 missionCard(280)}
RR(36,386,328,136,16,'#f4c983',3);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(52,392,296,3);
G.skins.forEach((k,i)=>{const {x,y}=skinAt(i),lk=!isOpen(i);
 C(x,y,20,lk?'#cbb89a':'#fff6e6',3);
 if(!lk){g.save();g.beginPath();g.arc(x,y,18,0,7);g.clip();spr('c0',x,y+26,44,tint(i));g.restore();acc(k.a,x,y-12,.5)}
 else{RR(x-6,y-7,12,10,3,'#8a6a4a',0);g.beginPath();g.arc(x,y-7,4.5,Math.PI,0);g.strokeStyle='#8a6a4a';g.lineWidth=2.5;g.stroke();wt(k.need!==undefined?String(k.need):k.lv?'Lv'+k.lv:'★',x,y+15,k.m?11:9,OL)}
 if(i===skin&&!lk){g.strokeStyle='#ff8a3d';g.lineWidth=3.5;g.beginPath();g.arc(x,y,24,0,7);g.stroke()}});
wt(SK().n,W/2,512,14,OL);
soundBtn();storyBtn();sideBtn(104,'album',newStickers.size>0);sideBtn(144,'home',0);sideBtn(184,'daily',!dailyDoneToday())}
function drawToasts(){
 const q=toasts[0];if(!q)return;
 const k=eob(q.age/.35),y=46+(1-Math.min(1,q.age/.35))*-30,h=q.b?72:56;
 g.globalAlpha=Math.max(0,Math.min(1,q.age*5,(2.6-q.age)*3));
 g.save();g.translate(W/2,y+h/2);g.scale(k,k);g.translate(-W/2,-(y+h/2));
 RR(36,y,328,h,16,q.big?'#fff1c2':'#fff6e6',3);
 tx(localText(q.h),W/2,y+22,q.big?18:16,q.big?'#ff8a3d':'#ffb703');
 wt(q.a,W/2,y+43,14,'#2f7a1f',0,300);if(q.b)wt(q.b,W/2,y+62,12,'#d9822b',0,300);
 g.restore();g.globalAlpha=1}
function drawParts(){parts.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/1.4);g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.col;g.fillRect(-4,-2.5,8,5);g.restore()});g.globalAlpha=1}
function bonusDraw(){bpop.forEach(p=>{g.globalAlpha=Math.max(0,Math.min(1,(1.8-p.age)*3));ptx('BONUS +'+BONUS+' '+localText('點'),W/2,150,32,'#ffd23f',p.age,Math.sin(p.age*10)*.05*Math.max(0,1-p.age));tx(localText(T('mile')).replace('{m}',fmt(p.m)),W/2,176,15,'#fff');g.globalAlpha=1})}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);lastInput=e.pointerType==='mouse'?'key':'touch';audioInit();
 if(st!=='run'){
  if(story){if(story.age>.4)closeStory();return}
  if(sheet){sheetTap(p);return}
  if(Math.hypot(p.x-20,p.y-104)<20){openSheet('album');return}
  if(Math.hypot(p.x-20,p.y-144)<20){openSheet('home');return}
  if(Math.hypot(p.x-20,p.y-184)<20){start(true);return}
  if(Math.hypot(p.x-SBX,p.y-SBY)<22){toggleSound();return}
  for(let i=0;i<G.skins.length;i++){const q=skinAt(i);if(Math.hypot(p.x-q.x,p.y-q.y)<25){if(isOpen(i)){pick(i);say(G.skins[i].n)}else say(lockText(i));return}}
  if(Math.hypot(p.x-20,p.y-SBY)<22){const u=unseen();openStory(u>=0?u:SS.r);return}
  if(st==='ready'||overT>CAUGHT_HOLD+.5)start(st==='over'&&dailyRun);else say('{{t:thief.msg.024}}');return}
 e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 gest={id:e.pointerId,x:p.x,y:p.y,done:false}});
// A swipe acts as soon as it travels far enough; a touch that never swipes acts as a tap on release.
c.addEventListener('pointermove',e=>{
 if(st!=='run'||!gest||gest.done||e.pointerId!==gest.id)return;
 const p=pos(e),dx=p.x-gest.x,dy=p.y-gest.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))<SWIPE)return;
 gest.done=true;
 if(Math.abs(dx)>Math.abs(dy))control(dx<0?0:2);else if(dy<0)control(1)});
c.addEventListener('pointerup',e=>{
 if(st!=='run'||!gest||e.pointerId!==gest.id)return;
 const g0=gest;gest=null;
 if(!g0.done){G.down({x:g0.x,y:g0.y,id:g0.id});G.up({id:g0.id})}});
c.addEventListener('pointercancel',e=>{if(gest&&e.pointerId===gest.id)gest=null});
c.addEventListener('contextmenu',e=>e.preventDefault());
// Physical key codes so WASD follows the key position on AZERTY and other layouts.
const KM={Space:[190,300],ArrowUp:[190,300],KeyW:[190,300],ArrowLeft:[40,300],KeyA:[40,300],ArrowRight:[360,300],KeyD:[360,300]};
addEventListener('keydown',e=>{if(e.code==='KeyM'&&!V.hidden&&!document.hidden&&!e.metaKey&&!e.altKey&&!e.ctrlKey&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){toggleSound();return}
 if(st!=='run'&&(e.code==='Space'||e.code==='Enter')&&!V.hidden&&!document.hidden&&!e.repeat&&!['INPUT','TEXTAREA','SELECT','BUTTON','A','SUMMARY'].includes(e.target.tagName)){
  e.preventDefault();audioInit();if(story){if(story.age>.4)closeStory()}else if(sheet){if(sheet.age>.3)closeSheet()}else if(st==='ready'||overT>CAUGHT_HOLD+.5)start(st==='over'&&dailyRun);return}
 const m=KM[e.code];if(m){lastInput='key';audioInit()}if(!(m||e.code==='ArrowDown')||V.hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;e.preventDefault();if(!m||e.repeat)return;G.down({x:m[0],y:m[1],id:'k'+e.code})});
addEventListener('keyup',e=>{if(KM[e.code]&&st==='run'&&G.up&&!V.hidden)G.up({id:'k'+e.code})});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now();if(document.hidden){saveMS();if(tut)saveTut();windOff()}});
window.addEventListener('hashchange',()=>{release();last=performance.now();if(V.hidden)windOff()});
$('thief-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;if(st==='over')overT+=dt;hudBump=Math.max(0,hudBump-dt*4);flying.forEach(f=>f.age+=dt);flying=flying.filter(f=>f.age<.75);landT=Math.max(0,landT-dt);dust.forEach(d=>d.age+=dt);dust=dust.filter(d=>d.age<.45);
  bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);pops.forEach(p=>p.age+=dt);pops=pops.filter(p=>p.age<p.life);
  parts.forEach(p=>{p.age+=dt;p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt});parts=parts.filter(p=>p.age<1.4);
  if(toasts.length&&(toasts[0].age+=dt)>2.6)toasts.shift();
  if(st==='run'&&dailyRun){stepAcc+=dt;while(stepAcc>=.01&&st==='run'){stepAcc-=.01;G.update(.01);if(st==='run')awardBonus()}}
  else if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  if(st==='run'){const r=cl(1-gb/170,0,1);if(r>.62){hbNext-=dt;if(hbNext<=0){sfx('heart');hbPulse=1;hbNext=.85-(r-.62)/.38*.42}}else hbNext=0}
  hbPulse=Math.max(0,hbPulse-dt*3);
  zT=Math.min(1,zT+dt/1.2);PZ=zT>=1?ZONES[zCur]:mixZ(zFrom,ZONES[zCur],zT*zT*(3-2*zT));if(banner&&(banner.age+=dt)>2.6)banner=null;if(story)story.age+=dt;if(sheet){sheet.age+=dt;hearts.forEach(h=>h.age+=dt);hearts=hearts.filter(h=>h.age<1)}
  G.draw();bonusDraw();if(story||st==='ready'||(st==='over'&&(overT>=CAUGHT_HOLD||reduceMotion)))overlay();drawParts();drawToasts();ui()}
 music();
 requestAnimationFrame(loop)}
checkStickers();
if(!SS.seen.includes(0))openStory(0);
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
