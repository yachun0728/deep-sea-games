  /* ---------- 偷水果的貓: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var thiefBusy=false,thiefStake=0,thiefSay=function(){};
  (function(){
const c=$('thief-canvas'),W=400,H=560,DPR=2,OL='#4a2c1d',G={};c.width=W*DPR;c.height=H*DPR;
// `g` is the drawing target; it is swapped briefly to build cached layers (see shelfCache).
let g=c.getContext('2d');const g0=g;
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
// Game type: Grandstander for all English text (2026-11-26: the user wanted round, bouncy bubble lettering like the cover's sign):
// weight 900 for headlines, 800 for text. Fredoka is only the fallback while it loads.
// Chinese falls back to heavy Noto Sans TC. The page's Google Fonts link loads them; ask up front so canvas text never swaps mid-round.
const FB='Grandstander,Fredoka,ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif',FH=FB,FC='"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const FNT=FB;
try{document.fonts&&['900 20px Grandstander','800 20px Grandstander','900 20px "Noto Sans TC"'].forEach(f=>document.fonts.load(f))}catch(e){}
const CJK=/[\u3400-\u9fff\uff00-\uffef]/;
// Sets the canvas font for this exact string (after translation) and returns the string to draw.
function font(s,sz,head){s=localText(String(s));const cjk=CJK.test(s);g.font=head?(cjk?'900 '+Math.round(sz*.92)+'px '+FC:'900 '+Math.round(sz)+'px '+FH):(cjk?'700 '+Math.round(sz*.92)+'px '+FC:'800 '+Math.round(sz)+'px '+FB);return s}
const eob=t=>{t=cl(t,0,1);const k=1.70158;return 1+(k+1)*Math.pow(t-1,3)+k*Math.pow(t-1,2)};
function tx(s,x,y,sz,col,al){sz*=.9;s=font(s,sz,1);g.textAlign=al||'center';g.lineJoin='round';g.strokeStyle='#fffaf0';g.lineWidth=sz/3;g.strokeText(s,x,y,W-30);g.strokeStyle=OL;g.lineWidth=sz/7;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
// Pop-in: overshoots slightly, then settles. age is seconds since the text appeared.
function ptx(s,x,y,sz,col,age,rot){const k=eob(age/.3);g.save();g.translate(x,y);if(rot)g.rotate(rot);g.scale(k,k);tx(s,0,0,sz,col);g.restore()}
// Per-letter text: place(i,n) gives each letter an offset, scale and tilt. Lines wider than the canvas are scaled to fit.
// With reduced motion every letter sits still. Outlines are drawn for all letters before any fill.
function lettersTx(s,x,y,sz,col,place){
 sz*=.9;s=font(s,sz,1);const ch=Array.from(s),tw=g.measureText(s).width,fit=Math.min(1,(W-36)/Math.max(1,tw));
 let pre='';const at=ch.map((q,i)=>{const l=g.measureText(pre).width,w=g.measureText(q).width,o=RM()?{dx:0,dy:0,k:1,r:0}:place(i,ch.length);pre+=q;return{q,cx:-tw/2+l+w/2,...o}});
 g.save();g.translate(x,y);g.scale(fit,fit);g.textAlign='center';g.lineJoin='round';
 const each=f=>at.forEach(o=>{if(o.k<=.01)return;g.save();g.translate(o.cx+o.dx,o.dy);g.rotate(o.r);g.scale(o.k,o.k);f(o.q);g.restore()});
 g.strokeStyle='#fffaf0';g.lineWidth=sz/3;each(q=>g.strokeText(q,0,0));g.strokeStyle=OL;g.lineWidth=sz/7;each(q=>g.strokeText(q,0,0));g.fillStyle=col;each(q=>g.fillText(q,0,0));
 g.restore()}
// Pop: letters spring up one after another with a little tilt, then float.
function popTx(s,x,y,sz,col,age){lettersTx(s,x,y,sz,col,(i)=>{const t=age-i*.035,k=t<=0?0:eob(Math.min(1,t/.24));return{dx:0,dy:(1-k)*12-Math.max(0,Math.sin(age*7-i*.6))*1.5,k,r:(i%2?1:-1)*.22*(1-k)}})}
// Slam: letters drop in from above one by one, land with a bounce, then keep a gentle wave going.
function slamTx(s,x,y,sz,col,age){lettersTx(s,x,y,sz,col,(i)=>{const t=age-i*.045,k=t<=0?0:Math.min(1,t/.32),e=k<1?eob(k):1;return{dx:0,dy:-(1-e)*46-(k>=1?Math.max(0,Math.sin(tt*5-i*.5))*2.5:0),k:t<=0?0:.6+.4*e,r:(1-e)*(i%2?.35:-.35)}})}
// Shake: every letter jitters on its own, for shouting.
function shakeTx(s,x,y,sz,col){lettersTx(s,x,y,sz,col,(i)=>({dx:Math.sin(tt*41+i*2.3)*1.3,dy:Math.cos(tt*37+i*1.7)*1.6,k:1+.06*Math.sin(tt*18+i),r:Math.sin(tt*23+i*3.1)*.09}))}
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
else if(a===12){g.rotate(-.3);P([[0,-26],[5,-16],[13,-19],[9,-9],[16,-4],[4,-3],[0,4],[-4,-3],[-16,-4],[-9,-9],[-13,-19],[-5,-16]],'#e76f51',2.5);L2(0,4,0,10,2.5,'#7a4a24')}
else if(a===13){g.beginPath();g.arc(0,0,14,Math.PI,0);O('#e63946',3);RR(-15,-4,30,7,3,'#fff6e6',2.5);C(0,-16,5,'#fff6e6',2.5)}
else if(a===14){for(let k=0;k<5;k++){const q=k*Math.PI*2/5;C(Math.cos(q)*7,-10+Math.sin(q)*7,5.5,'#ffafcc',2)}C(0,-10,4.5,'#ffd23f',2)}
else if(a===15){E(0,-2,20,6,'#e9c46a',2.5);g.beginPath();g.arc(0,-4,11,Math.PI,0);O('#e9c46a',2.5);RR(-11,-8,22,4,2,'#e63946',0)}
else if(a===16){g.beginPath();g.moveTo(0,-2);g.bezierCurveTo(-16,-14,-8,-28,0,-18);g.bezierCurveTo(8,-28,16,-14,0,-2);O('#ff4d6d',2.5)}
g.restore()}
G.I={bs:'{{t:thief.msg.059}}',title:"{{t:thief.msg.001}}",tag:"{{t:thief.msg.002}}",tip:"{{t:thief.msg.003}}",caught:"{{t:thief.msg.004}}",fr:n=>localText('{{t:thief.msg.026}}').replace('{n}',n),
 mt:'{{t:thief.msg.027}}',alldone:'{{t:thief.msg.028}}',close:'{{t:thief.msg.029}}',mdone:'{{t:thief.msg.030}}',newskin:'{{t:thief.msg.031}}',lockM:'{{t:thief.msg.032}}',lockS:'{{t:thief.msg.033}}',lockL:'{{t:thief.msg.058}}',
 space:'{{t:thief.msg.046}}',lvup:'{{t:thief.msg.054}}',lvprog:'{{t:thief.msg.055}}',mile:'{{t:thief.msg.060}}',bonusSay:'{{t:thief.msg.061}}',caughtSay:'{{t:thief.msg.062}}',bonusTot:'{{t:thief.msg.063}}',light:'{{t:thief.msg.064}}',chap:['{{t:thief.msg.065}}','{{t:thief.msg.066}}','{{t:thief.msg.067}}','{{t:thief.msg.175}}','{{t:thief.msg.152}}'],zWinter:'{{t:thief.msg.174}}',zNames:['','{{t:thief.msg.083}}','{{t:thief.msg.084}}','{{t:thief.msg.174}}'],epiNew:'{{t:thief.msg.156}}',evLine:'{{t:thief.msg.161}}',evDoneLine:'{{t:thief.msg.162}}',lockE:'{{t:thief.msg.168}}',lockEpi:'{{t:thief.msg.169}}',evWin:'{{t:thief.msg.170}}',newFeat:'{{t:thief.msg.179}}',lbl:{story:'{{t:thief.msg.187}}',album:'{{t:thief.msg.188}}',home:'{{t:thief.msg.189}}',daily:'{{t:thief.msg.190}}',settings:'{{t:thief.msg.185}}'},paused:'{{t:thief.msg.180}}',resume:'{{t:thief.msg.181}}',optMusic:'{{t:thief.msg.182}}',optSfx:'{{t:thief.msg.183}}',optMotion:'{{t:thief.msg.184}}',settings:'{{t:thief.msg.185}}',done:'{{t:thief.msg.186}}',chapSub:'{{t:thief.msg.068}}',
 hookStory:'{{t:thief.msg.079}}',hookBest:'{{t:thief.msg.080}}',hookMission:'{{t:thief.msg.081}}',hookZone:'{{t:thief.msg.082}}',zSunset:'{{t:thief.msg.083}}',zNight:'{{t:thief.msg.084}}',zoomies:'{{t:thief.msg.085}}',zoomSub:'{{t:thief.msg.086}}',fury:'{{t:thief.msg.088}}',furySub:'{{t:thief.msg.091}}',furyOk:'{{t:thief.msg.089}}',deliver:'{{t:thief.msg.090}}',
 newSticker:'{{t:thief.msg.132}}',album:'{{t:thief.msg.133}}',albumTip:'{{t:thief.msg.134}}',closeTip:'{{t:thief.msg.135}}',home:'{{t:thief.msg.136}}',homeProg:'{{t:thief.msg.137}}',homeMax:'{{t:thief.msg.138}}',homeNext:'{{t:thief.msg.139}}',homeTip:'{{t:thief.msg.140}}',homeSign:'{{t:thief.msg.141}}',
 homeItems:['{{t:thief.msg.142}}','{{t:thief.msg.143}}','{{t:thief.msg.144}}','{{t:thief.msg.145}}','{{t:thief.msg.146}}'],
 dGoalSay:'{{t:thief.msg.147}}',dLine:'{{t:thief.msg.148}}',dCleared:'{{t:thief.msg.149}}',dWin:'{{t:thief.msg.150}}',dStreak:'{{t:thief.msg.151}}',
 sh:['{{t:thief.msg.005}}','{{t:thief.msg.006}}','{{t:thief.msg.007}}']};
G.skins=[{need:0,n:'{{t:thief.msg.008}}',c:['#ff9f1c','#e36414'],a:0},{need:150,n:'{{t:thief.msg.009}}',c:['#f1faee','#a8dadc'],a:1},{need:400,n:'{{t:thief.msg.010}}',c:['#5e548e','#231942'],a:3},{need:800,n:'{{t:thief.msg.011}}',c:['#ffd23f','#e76f51'],a:2},
 {m:'apple',n:'{{t:thief.msg.040}}',c:['#e63946','#9d0208'],a:5},{m:'fish',n:'{{t:thief.msg.041}}',c:['#8ecae6','#219ebc'],a:6},{m:'dodge',n:'{{t:thief.msg.042}}',c:['#90be6d','#43aa8b'],a:7},
 {m:'jump',n:'{{t:thief.msg.043}}',c:['#c08552','#895737'],a:8},{m:'carry',n:'{{t:thief.msg.044}}',c:['#ffafcc','#ff70a6'],a:9},{m:'clean',n:'{{t:thief.msg.045}}',c:['#adb5bd','#6c757d'],a:4},
 {lv:2,n:'{{t:thief.msg.056}}',c:['#f4a261','#e76f51'],a:10},{lv:3,n:'{{t:thief.msg.057}}',c:['#9b5de5','#5a189a'],a:11},
 {ev:'autumn',n:'{{t:thief.msg.163}}',c:['#d97706','#9a3412'],a:12},{ev:'winter',n:'{{t:thief.msg.164}}',c:['#bde0fe','#5390d9'],a:13},{ev:'spring',n:'{{t:thief.msg.165}}',c:['#ffc8dd','#ff8fab'],a:14},{ev:'summer',n:'{{t:thief.msg.166}}',c:['#ffd166','#f4a261'],a:15},
 {epi:1,n:'{{t:thief.msg.167}}',c:['#ff8fab','#c9184a'],a:16}];
// Seasonal events follow the player's calendar (inclusive dates, may wrap the new year); 5 runs in the window earn its skin.
const EVENTS=[{id:'autumn',a:1101,b:1130,fx:'leaf',n:'{{t:thief.msg.157}}'},{id:'winter',a:1201,b:110,fx:'snow',n:'{{t:thief.msg.158}}'},{id:'spring',a:201,b:415,fx:'petal',n:'{{t:thief.msg.159}}'},{id:'summer',a:615,b:831,fx:'fly',n:'{{t:thief.msg.160}}'}],EV_RUNS=5;
function activeEvent(){const d=new Date(),v=(d.getMonth()+1)*100+d.getDate();return EVENTS.find(e=>e.a<=e.b?v>=e.a&&v<=e.b:v>=e.a||v<=e.b)||null}
let EVNOW=activeEvent();
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
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,stats,streak=0,zoom=0,rage=null,dash=0;
// Points per fruit come from the rules version (version 4 counts 3, older versions 5); only used for the pop-up numbers.
const FP=thiefRules.rulesVersion>=4?3:5;
let model=thiefRules.create(),heldBy;
const rank=timedLeaderboard('thief','thief',5,ui);
// Screen shake is started by events() on a real hit; the rules' own shake flag never resets, so it is not read here.
function syncModel(){({dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,stats,streak,zoom,rage,dash}=model.snapshot());streak=streak||0;zoom=zoom||0;dash=dash||0;}
function control(code){if(!thiefRules.input(model,code))return;if(!dailyRun)rank.record(code);const ln=lane;syncModel();if(lane!==ln)sfx('lane');}
G.reset=()=>{model=thiefRules.create();syncModel();};
G.score=()=>model.score();
G.extra=()=>T('fr')(fruits);
let gest=null,lastTapEdge=-1;
G.down=p=>{
 const code=Math.hypot(p.x-340,p.y-505)<50?2:p.x<133?0:p.x>267?2:1;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{thiefRules.advance(model,dt);syncModel();events();if(model.dead)die(model.dead);};
// File names carry a hash of their contents: re-packing the sheet must produce a new name, otherwise a browser
// holding the old image would cut it with the new coordinates in A2 and draw the wrong pieces.
// sprites-<hash>.webp: the 2026-11-25 art set cut from design/09-art-set-v1.png and design/10-back-views-v1.webp; cat and shopkeeper frames from design/11–13 (2026-11-26) (see design/README.md).
const SPR2=new Image();SPR2.src='games/thief/art/sprites-30dd257c.webp';const LOGO=new Image();LOGO.src='games/thief/art/logo-c93056b3.webp';
const A2={"gt":[0,0,180,280],"g3":[182,0,236,274],"gc":[420,0,234,268],"g2":[656,0,205,262],"g0":[863,0,164,259],"g1":[1029,0,186,259],"cj":[1217,0,252,223],"c3":[0,282,160,218],"c0":[162,282,184,216],"c2":[348,282,186,216],"c1":[536,282,168,212],"gF":[706,282,168,197],"cf":[876,282,132,172],"stall1":[1010,282,191,171],"treeP":[1203,282,150,169],"treeG":[1355,282,154,168],"treeW":[0,502,99,168],"stall3":[101,502,179,167],"catF":[282,502,150,167],"gS":[434,502,118,163],"stall2":[554,502,168,162],"treeA":[724,502,151,162],"cd":[877,502,209,155],"stall4":[1088,502,183,154],"pot3":[1273,502,92,139],"catL":[1367,502,89,130],"catW":[1458,502,107,123],"pot1":[0,672,80,113],"lamp":[82,672,51,110],"pot2":[135,672,80,109],"k5":[217,672,87,109],"bgWi":[306,672,374,108],"bgSp":[682,672,373,107],"bgSu":[1057,672,374,107],"bgAu":[0,787,365,107],"k1":[367,787,79,106],"k4":[448,787,90,105],"warn":[540,787,112,104],"barrel":[654,787,88,104],"spill":[744,787,155,103],"cart":[901,787,152,102],"k2":[1055,787,74,100],"fbox":[1131,787,118,94],"k3":[1251,787,76,94],"basket":[1329,787,99,90],"fence":[0,896,180,83],"slip":[182,896,114,78],"goldA":[298,896,67,76],"apple":[367,896,66,75],"green":[435,896,71,75],"orange":[508,896,69,71],"fish":[579,896,107,62]};
const sheetOk=im=>im.complete&&im.naturalWidth>0,sprOk=()=>sheetOk(SPR2),FK=['apple','orange','green'],CATF=['c0','c1','c2','c3','cj','cd','cf'];
function spr(k,x,y,h,src,rot){const a=A2[k],sheet=SPR2;if(!a)return;const img=src&&src[k];if(!img&&!sheetOk(sheet))return;const w=a[2]*h/a[3];g.save();g.translate(x,y);if(rot){g.rotate(rot);g.drawImage(img||sheet,img?0:a[0],img?0:a[1],a[2],a[3],-w/2,-h/2,w,h)}else g.drawImage(img||sheet,img?0:a[0],img?0:a[1],a[2],a[3],-w/2,-h,w,h);g.restore()}
const tints={};
function tint(i){
 if(!i||!sprOk())return null;if(tints[i]!==undefined)return tints[i];
 const hex=G.skins[i].c[0],[th,ts,tl]=hsl(...[1,3,5].map(j=>parseInt(hex.slice(j,j+2),16))),out={};
 try{CATF.forEach(k=>{const a=A2[k],cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const x=cv.getContext('2d');x.drawImage(SPR2,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);
  const d=x.getImageData(0,0,a[2],a[3]),p=d.data;
  for(let j=0;j<p.length;j+=4){if(!p[j+3])continue;const [h,s0,l]=hsl(p[j],p[j+1],p[j+2]);
   if(s0>.28&&h>.03&&h<.14){const nl=cl(l+(tl-.5)*.75,0,1),ns=ts<.12?ts*.5:Math.min(1,ts*1.05),[r,gg,b]=rgb(th,ns,nl);p[j]=r;p[j+1]=gg;p[j+2]=b}}
  x.putImageData(d,0,0);out[k]=cv});tints[i]=out}catch(e){tints[i]=null}
 return tints[i]}
function hsl(r,g0,b){r/=255;g0/=255;b/=255;const mx=Math.max(r,g0,b),mn=Math.min(r,g0,b),l=(mx+mn)/2;if(mx===mn)return[0,0,l];const d=mx-mn,s0=l>.5?d/(2-mx-mn):d/(mx+mn);let h=mx===r?(g0-b)/d+(g0<b?6:0):mx===g0?(b-r)/d+2:(r-g0)/d+4;return[h/6,s0,l]}
function rgb(h,s0,l){if(!s0){const v=Math.round(l*255);return[v,v,v]}const q=l<.5?l*(1+s0):l+s0-l*s0,p0=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p0+(q-p0)*6*t:t<.5?q:t<2/3?p0+(q-p0)*(2/3-t)*6:p0};return[f(h+1/3),f(h),f(h-1/3)].map(v=>Math.round(v*255))}
// The horizon sits higher than it used to (112) so the street runs further into the distance; the road keeps the same
// slope because hw() is measured from the old horizon line.
const HZ=84;
const pj=y=>HZ+(H-HZ)*Math.pow(Math.max(0,(y+40)/(H+40)),1.45);
const hw=Y=>55+123*(Y-112)/448,sc=Y=>hw(Y)/142,px=(x,Y)=>200+(x-200)*sc(Y);
const wrap=(v,m)=>((v%m)+m)%m;
const SIDE=[['stall1',150],['pot1',56],['fbox',40],['stall3',150],['lamp',112],['barrel',46]],SIDE2=[['stall2',150],['cart',60],['pot2',50],['stall4',150],['pot3',62],['fence',38]];
function poly(pts,fill,line,lw){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();if(line){g.strokeStyle=line;g.lineWidth=lw||3;g.lineJoin='round';g.stroke()}}
/* ---------- Zones: the market moves from morning to sunset to night as the score climbs (look and sound only) ---------- */
/* Seasons: spring, summer, autumn and winter arrive as the score climbs (look and sound only). */
const ZONES=[
 {at:0,s0:'#8fd3f4',s1:'#e6f7ff',grass:'#8cc152',tint:'#ffffff',glow:0,stars:0,sun:0,fx:'petal',road:'#e98e62',rim:'#f3e4cb',brick:'#b05834',hill:'#9ad06a',hill2:'#c7e6b0'},
 {at:150,s0:'#4fb3f0',s1:'#c9eeff',grass:'#6dbb3c',tint:'#ffffff',glow:0,stars:0,sun:1,fx:'spark',road:'#f0a26c',rim:'#fff1d6',brick:'#b8643a',hill:'#4f9e3a',hill2:'#8fc96a'},
 {at:400,s0:'#f9b97a',s1:'#ffe8c7',grass:'#c9a24a',tint:'#fff4e6',glow:0,stars:0,sun:0,fx:'leaf',road:'#d9875a',rim:'#f1d9b5',brick:'#9a4a26',hill:'#d9822b',hill2:'#efb87a'},
 {at:700,s0:'#a9c9ef',s1:'#eef5ff',grass:'#eef4fa',tint:'#f4f7ff',glow:.5,stars:0,sun:0,fx:'snow',road:'#c9d4e3',rim:'#ffffff',brick:'#7d8fa8',hill:'#f7fbff',hill2:'#d4e2f2'}];
// Every season stays bright: the tints are pale so the road, cat and obstacles keep full contrast.
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),toHex=a=>'#'+a.map(v=>Math.round(cl(v,0,255)).toString(16).padStart(2,'0')).join('');
function mixZ(a,b,t){const o={};for(const k in b)o[k]=k==='fx'?b[k]:typeof b[k]==='string'?toHex(hexRGB(a[k]).map((v,i)=>v+(hexRGB(b[k])[i]-v)*t)):a[k]+(b[k]-a[k])*t;return o}
let zCur=0,zGoal=0,gate=null,flash=0,zFrom=ZONES[0],zT=1,PZ=ZONES[0],banner=null,decoLast=[];
function passGate(z){zFrom=PZ;zCur=z;zT=0;flash=.18;banner={z,age:0};sfx('zone');if(z>SS.r){SS.r=z;saveSS()}if(z>LS.maxZone){LS.maxZone=z;checkStickers()}}
// The gate spans the road in perspective: two posts, a garland and a sign with the season's name.
function drawGate(){
 if(!gate)return;const Y=pj(gate.y);if(Y<HZ+2)return;const s=sc(Y),half=hw(Y)*1.08,top=Y-160*s,lw=Math.max(1.5,3*s),fx=ZONES[gate.z].fx;
 const post=fx==='snow'?'#9fb3cc':'#8a5a3b';[-1,1].forEach(sd=>{RR(200+sd*half-7*s,top,14*s,Y-top,4*s,post,lw);if(fx==='snow')snowCap(200+sd*half,top,22*s,8*s)});
 g.beginPath();g.moveTo(200-half,top+14*s);g.quadraticCurveTo(200,top-30*s,200+half,top+14*s);g.lineWidth=12*s;g.strokeStyle=OL;g.stroke();g.lineWidth=8*s;g.strokeStyle=fx==='petal'?'#ffafcc':fx==='spark'?'#ffd23f':fx==='leaf'?'#e76f51':'#e8f1ff';g.stroke();
 for(let k=1;k<10;k++){const t=k/10,gx=200-half+2*half*t,gy=(1-t)*(1-t)*(top+14*s)+2*(1-t)*t*(top-30*s)+t*t*(top+14*s);
  if(fx==='petal')blob(gx,gy,4*s,k%2?'#ff8fab':'#fff',lw*.5);else if(fx==='spark')P([[gx-5*s,gy],[gx+5*s,gy],[gx,gy+10*s]],k%3?'#e63946':'#2a9d8f',lw*.5);else if(fx==='leaf')blob(gx,gy,4*s,k%2?'#f4a261':'#d65a31',lw*.5);else blob(gx,gy,3.2*s,k%3?'#ff4d6d':'#ffd166',lw*.5)}
 const bw=150*s,bh=30*s;RR(200-bw/2,top-bh*.3,bw,bh,8*s,'#fff6e6',lw);g.save();g.translate(200,top+bh*.48);tx(localText(T('zNames')[gate.z]),0,0,Math.max(8,18*s),'#ff8a3d');g.restore()}
const STARS=Array.from({length:22},()=>[rnd(0,W),rnd(46,HZ-16),rnd(.6,1.6),rnd(0,6)]);
function zoneOf(sc0){let z=0;ZONES.forEach((q,i)=>{if(sc0>=q.at)z=i});return z}
function bg(){
 const P=PZ,sky=g.createLinearGradient(0,0,0,HZ+20);sky.addColorStop(0,P.s0);sky.addColorStop(1,P.s1);g.fillStyle=sky;g.fillRect(-20,0,W+40,HZ+20);
 // Painted skyline for the season (cross-fades while the season changes); the grass below hides its street.
 const bgk={petal:'bgSp',spark:'bgSu',leaf:'bgAu',snow:'bgWi'};
 if(zT<1&&zFrom.fx&&zFrom.fx!==ZONES[zCur].fx)skyline(bgk[zFrom.fx],1);skyline(bgk[ZONES[zCur].fx],zT<1?zT:1);
 g.fillStyle=P.grass;g.fillRect(-20,HZ,W+40,H-HZ+20);
 const Yb=H+40,sw=1.2;
 // Only the side edges get an outline: a line across the far end made the street look cut off.
 const edges=(k,c,lw)=>{g.strokeStyle=c;g.lineWidth=lw;g.lineCap='round';[-1,1].forEach(d=>{g.beginPath();g.moveTo(200+d*hw(HZ)*k,HZ);g.lineTo(200+d*hw(Yb)*k,Yb);g.stroke()})};
 poly([[200-hw(HZ)*sw,HZ],[200+hw(HZ)*sw,HZ],[200+hw(Yb)*sw,Yb],[200-hw(Yb)*sw,Yb]],P.rim);edges(sw,'#7a4a24',2);
 poly([[200-hw(HZ),HZ],[200+hw(HZ),HZ],[200+hw(Yb),Yb],[200-hw(Yb),Yb]],P.road);edges(1,'#8a4a2c',3);
 g.save();g.beginPath();g.moveTo(200-hw(HZ),HZ);g.lineTo(200+hw(HZ),HZ);g.lineTo(200+hw(Yb),Yb);g.lineTo(200-hw(Yb),Yb);g.closePath();g.clip();
 for(let k=0;k<18;k++){const y=wrap(k*36+dist,648)-40,Y=pj(y),s=sc(Y);
  g.strokeStyle=P.brick+'73';g.lineWidth=1.4*s;g.beginPath();g.moveTo(200-hw(Y),Y);g.lineTo(200+hw(Y),Y);g.stroke();
  const Y2=pj(y+36),off=k%2?0:.5;g.fillStyle=P.rim+'40';
  for(let b=-2;b<=2;b++){const xl=200+(b+off-.45)*hw(Y)*.42,xr=200+(b+off-.05)*hw(Y)*.42;if(((k*7+b*3)%5+5)%5<2)g.fillRect(xl,Y+1,xr-xl,Math.max(1,Y2-Y-2))}}
 // Lane dashes stretch as the cat speeds up (and during Zoomies or a fish dash), so speed reads on the road itself.
 const dl=34+44*cl((v-260)/200,0,1)+(zoom>0||dash>0?18:0);
 [152,248].forEach(bx=>{for(let k=0;k<9;k++){const y0=wrap(k*80+dist,720)-40,Y0=pj(y0),Y1=pj(y0+dl);g.strokeStyle='#fbe9cf';g.lineWidth=4.5*sc(Y1);g.lineCap='round';g.beginPath();g.moveTo(px(bx,Y0),Y0);g.lineTo(px(bx,Y1),Y1);g.stroke()}});
 g.restore();
 horizon();
 const deco=[];
 // A row of seasonal trees further out than the stalls, staggered between them.
 [-1,1].forEach((side,si)=>{for(let i=0;i<4;i++){const y=wrap(i*180+90+si*45+dist,720)-40,Y=pj(y);if(Y<HZ+2)continue;const s=sc(Y);deco.push([Y,'tree',200+side*(hw(Y)*1.95+30*s),170*s,i+si])}});
 [[SIDE,-1,0],[SIDE2,1,60]].forEach(([list,side,o])=>list.forEach(([k,h],i)=>{const y=wrap(i*120+o+dist*1,720)-40,Y=pj(y);if(Y<HZ+2)return;const s=sc(Y),a=A2[k],w=a[2]*h*s/a[3];deco.push([Y,k,200+side*(hw(Y)*1.2+w*.42),h*s,i])}));
 const sea=ZONES[zCur].fx;
 deco.sort((p,q)=>p[0]-q[0]).forEach(d=>{if(d[1]==='tree')drawTree(sea,d[2],d[0]+2,d[3],d[4]);else{spr(d[1],d[2],d[0]+2,d[3]);dress(sea,d[1],d[2],d[0]+2,d[3],d[4])}});decoLast=deco;
 }
/* ---------- Seasonal props drawn in the sprite sheet's style: chunky shapes with a dark brown outline ---------- */
function blob(x,y,r,f,lw){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=f;g.fill();g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}
function snowCap(x,y,w,h){g.beginPath();g.moveTo(x-w/2,y+h*.4);g.quadraticCurveTo(x-w/2,y-h*.6,x-w*.2,y-h*.5);g.quadraticCurveTo(x,y-h*.9,x+w*.2,y-h*.5);g.quadraticCurveTo(x+w/2,y-h*.6,x+w/2,y+h*.4);
 for(let k=3;k>=-3;k--)g.lineTo(x+k*w/7,y+h*(k%2?.4:.85));g.closePath();g.fillStyle='#ffffff';g.fill();g.lineWidth=Math.max(1,h*.18);g.strokeStyle='#9fb3cc';g.stroke()}
function pumpkin(x,y,r){const lw=Math.max(1,r*.18);E(x,y-r*.8,r*1.15,r*.85,'#f28c28',lw);g.strokeStyle='rgba(74,44,29,.5)';g.lineWidth=lw*.8;[-.45,0,.45].forEach(k=>{g.beginPath();g.ellipse(x+k*r,y-r*.8,r*.35,r*.8,0,0,7);g.stroke()});RR(x-r*.12,y-r*1.85,r*.24,r*.4,r*.1,'#5a8f29',lw)}
// Where the street meets the town: a hedge of small seasonal trees hides the seam between grass and skyline,
// and a haze band fades the far street and grass toward the sky colour so the road runs off into the distance.
const HEDGE=Array.from({length:19},(_,i)=>[-10+i*23+((i*37)%11),15+((i*53)%13),(i*29)%3]);
function horizon(){const sea=ZONES[zCur].fx,tk={petal:['treeP','treeG','treeP'],spark:['treeG','treeG','treeP'],leaf:['treeA','treeG','treeA'],snow:['treeW','treeW','treeW']}[sea]||['treeG','treeG','treeG'];
 const gap=hw(HZ)*1.25;HEDGE.forEach(([x,h,v])=>{if(Math.abs(x-200)<gap+h*.25)return;spr(tk[v],x,HZ+3+(v%2),h)});
 const hz=g.createLinearGradient(0,HZ-8,0,HZ+56);hz.addColorStop(0,PZ.s1+'00');hz.addColorStop(.15,PZ.s1+'73');hz.addColorStop(.35,PZ.s1+'4d');hz.addColorStop(1,PZ.s1+'00');g.fillStyle=hz;g.fillRect(-20,HZ-8,W+40,64)}
function skyline(k,a){const r=A2[k];if(!r||!sheetOk(SPR2)||a<=0)return;const sh=r[3]*.6,w=W+24,h=w*sh/r[2],y=HZ+3-h;g.globalAlpha=a;g.drawImage(SPR2,r[0],r[1],r[2],sh,-12,y,w,h);
 // Distance haze: the far town fades toward the sky colour near the horizon so it sits behind the street.
 const hz=g.createLinearGradient(0,y+h*.35,0,HZ+3);hz.addColorStop(0,'rgba(255,255,255,0)');hz.addColorStop(1,'rgba(236,244,250,.55)');g.fillStyle=hz;g.fillRect(-12,y,w,h+3);
 const gr=g.createLinearGradient(0,y,0,y+22);gr.addColorStop(0,PZ.s0);gr.addColorStop(1,PZ.s0+'00');g.fillStyle=gr;g.fillRect(-12,y,w,22);g.globalAlpha=1}
function drawTree(sea,x,y,h,v){spr({petal:'treeP',spark:'treeG',leaf:'treeA',snow:'treeW'}[sea]||'treeG',x,y,h);return;
 const lw=Math.max(1.2,h/60),tw=h*.1;RR(x-tw/2,y-h*.42,tw,h*.42,tw*.3,'#8a5a3b',lw);
 if(sea==='snow'){[[.9,.5],[.68,.4],[.45,.3]].forEach(([yy,ww],k)=>{const ty=y-h*yy+h*.06;P([[x-h*ww,ty+h*.22],[x,ty-h*.2],[x+h*ww,ty+h*.22]],'#2d6a4f',lw);snowCap(x,ty-h*.12,h*ww*.95,h*.1)})}
 else{const pal=sea==='petal'?['#ffb3c7','#ffc8dd','#ff8fab']:sea==='leaf'?(v%2?['#e76f51','#f4a261','#d65a31']:['#f4a261','#ffb703','#e76f51']):['#5fb34a','#7cc95c','#4a9a3a'],cy=y-h*.62,r=h*.2;
  [[-.9,.2],[.9,.2],[0,-.55],[-.45,-.25],[.45,-.25],[0,.25]].forEach(([dx,dy],k)=>blob(x+dx*r,cy+dy*r,r*(k>4?.95:.8),pal[k%3],lw));
  if(sea==='petal')for(let k=0;k<6;k++){g.fillStyle='#fff';g.beginPath();g.arc(x+Math.cos(k*1.7+v)*r*1.1,cy+Math.sin(k*2.3+v)*r*.8,r*.09,0,7);g.fill()}
  if(sea==='spark'){g.fillStyle='#e63946';for(let k=0;k<4;k++){g.beginPath();g.arc(x+Math.cos(k*1.9+v)*r,cy+Math.sin(k*1.3+v)*r*.7,r*.11,0,7);g.fill()}}}}
// Seasonal dressing on top of the market props: blossoms, watermelons, pumpkins, snow and icicles.
function dress(sea,k,x,y,h,i){if(sea!=='snow')return;
 const a=A2[k];if(!a)return;const w=a[2]*h/a[3],stall=/^stall/.test(k);
 if(sea==='snow'){if(stall){snowCap(x,y-h*.93,w*.95,h*.1);g.fillStyle='#d4ecff';for(let n=-3;n<=3;n++){g.beginPath();g.moveTo(x+n*w*.12-h*.015,y-h*.6);g.lineTo(x+n*w*.12+h*.015,y-h*.6);g.lineTo(x+n*w*.12,y-h*.6+h*(n%2?.06:.1));g.fill()}}else snowCap(x,y-h*.92,w*.8,h*.16)}
 else if(sea==='leaf'&&stall){pumpkin(x-w*.42,y,h*.09);pumpkin(x+w*.4,y,h*.07)}
 else if(sea==='petal'&&stall){for(let n=-3;n<=3;n++){blob(x+n*w*.14,y-h*.62,h*.028,n%2?'#ff8fab':'#fff0f5',Math.max(.8,h/150))}}
 else if(sea==='spark'&&stall&&i%2===0){const r=h*.07;g.beginPath();g.arc(x+w*.42,y-r*.2,r,Math.PI,0);O('#e63946',Math.max(1,h/120));g.beginPath();g.arc(x+w*.42,y-r*.2,r*.75,Math.PI,0);g.fillStyle='#ffadad';g.fill();g.fillStyle='#2a9d8f';g.fillRect(x+w*.42-r,y-r*.25,r*2,r*.2)}}
// Things lying on the road surface, scrolling with the run.
function roadDecals(){
 const sea=ZONES[zCur].fx;if(!sea)return;
 for(let k=0;k<16;k++){const y=wrap(k*47+dist,640)-40,Y=pj(y);if(Y<HZ+4)continue;const s=sc(Y),x=200+(((k*37)%9)-4)/4.4*hw(Y)*.85;
  if(sea==='petal'){g.fillStyle=k%2?'#ffc8dd':'#ffafcc';g.beginPath();g.ellipse(x,Y,5*s,2.6*s,k,0,7);g.fill()}
  else if(sea==='leaf'){g.fillStyle=k%3?'#e76f51':'#f4a261';g.beginPath();g.ellipse(x,Y,7*s,3.4*s,k,0,7);g.fill()}
  else if(sea==='snow'){g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(x,Y,16*s,4*s,0,0,7);g.fill()}
  else if(k%4===0){g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(x,Y,10*s,2.5*s,0,0,7);g.fill()}}
 if(sea==='snow'){g.strokeStyle='rgba(125,143,168,.35)';g.lineWidth=2;[-.35,.35].forEach(o=>{g.beginPath();g.moveTo(200+o*hw(HZ),HZ);g.lineTo(200+o*hw(H+40),H+40);g.stroke()})}}
function item(r){
 const Y=pj(r.y),s=sc(Y),x=px(LX[r.l],Y);
 g.fillStyle='rgba(90,40,20,.18)';g.beginPath();g.ellipse(x,Y+12*s,20*s,6*s,0,0,7);g.fill();
 if(r.t==='b'){
  const h0=hitAt.get(r);
  if(h0===undefined)spr('basket',x,Y+16*s,50*s);
  else{const q=tt-h0,a=eob(Math.min(1,q/.3)),d=r.l<1?-1:1;g.save();g.translate(x+d*10*s*a,Y+16*s);if(d>0)g.scale(-1,1);spr('spill',0,0,46*s);g.restore()}}
 else if(r.t==='f')spr(FK[r.c%3],x,Y+12*s-Math.abs(Math.sin(tt*5+r.l))*4*s,32*s);
 else if(r.t==='g'){const by=Y+12*s-Math.abs(Math.sin(tt*5))*6*s;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,by-16*s,0,x,by-16*s,34*s);gr.addColorStop(0,'rgba(255,214,80,.75)');gr.addColorStop(1,'rgba(255,200,60,0)');g.fillStyle=gr;g.fillRect(x-34*s,by-50*s,68*s,68*s);g.globalCompositeOperation='source-over';
  spr('goldA',x,by,36*s);for(let i=0;i<3;i++){const q=tt*3+i*2.1;star(x+Math.cos(q)*20*s,by-18*s+Math.sin(q)*14*s,3.5*s,'#fff6c2')}}
 else spr('fish',x,Y+12*s-Math.abs(Math.sin(tt*6))*5*s,26*s)}
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
 const f=stun>0?'cd':jt>0?'cj':'c'+(Math.floor(tt*(5+v/45))%4),h=(f==='cd'?70:f==='cj'?92:88)*s*z;
 // Tripped over a basket: topple sideways, lie a beat, scramble back up. Slipper: a quick bonk squash.
 let rot=0,drop=0,bsx=1,bsy=1;const hq=tt-hitT;
 if(hitKind==='b'&&hq<.8){const q=hq/.8,f0=q<.25?eob(q/.25):q<.55?1:1-(q-.55)/.45;rot=hitDir*1.35*f0;drop=10*s*f0}
 else if(hitKind==='s'&&hq<.3){const f0=Math.sin(hq/.3*Math.PI);bsx=1+.25*f0;bsy=1-.25*f0}
 if(dash>0&&!(zoom>0)&&!RM()){for(let k=2;k>=1;k--){g.globalAlpha=.14*(3-k)/2;spr(f,x,Yf-lift+k*12*s,h,src)}g.globalAlpha=1}
 if(zoom>0){g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,Yf-lift-h*.45,0,x,Yf-lift-h*.45,h*.9);gr.addColorStop(0,'rgba(255,210,70,'+(.35+.15*Math.sin(tt*20))+')');gr.addColorStop(1,'rgba(255,190,50,0)');g.fillStyle=gr;g.fillRect(x-h,Yf-lift-h*1.4,h*2,h*2);g.globalCompositeOperation='source-over';
  for(let k=3;k>=1;k--){g.globalAlpha=.16*(4-k)/3;spr(f,x,Yf-lift+k*13*s,h,src)}g.globalAlpha=1}
 g.save();g.translate(x,Yf-lift+drop);g.rotate(rot);g.scale(sx*bsx,sy*bsy);
 spr(f,0,0,h,src);
 for(let i=0;i<L;i++)spr(FK[i%3],(i%2?9:-9)*s,-26*s-i*8*s-j*i*3*s,17*s);
 g.restore();g.globalAlpha=1;
 if(stun>0){for(let i=0;i<3;i++){const q=tt*7+i*2.1,sx0=x+Math.cos(q)*20*s,sy0=Yf-lift+drop-h*1.02+Math.sin(q)*6*s;g.save();g.translate(sx0,sy0);g.rotate(q);const pts=[];for(let k2=0;k2<10;k2++){const rr=k2%2?3*s:7*s,qq=-Math.PI/2+k2*Math.PI/5;pts.push([Math.cos(qq)*rr,Math.sin(qq)*rr])}P(pts,'#ffd23f',1.5);g.restore()}}}
function granny(){
 const r=cl(1-gb/170,0,1),Yf=H+96-r*100,x=200+(px(cx,pj(CYT))-200)*.55;
 const f=st==='over'&&G.msg==='caught'?'gc':warn.length?'gt':'g'+(Math.floor(tt*7)%4);
 g.fillStyle='rgba(90,40,20,.25)';g.beginPath();g.ellipse(x,Yf-4,40,10,0,0,7);g.fill();
 spr(f,x,Yf,f==='g0'||f==='g1'||f==='g2'||f==='g3'?160:170);return Yf}
// How close the shopkeeper is, right above the cat once she gets near: green, then orange, then a pulsing red.
function chaseGauge(){const r=cl(1-gb/170,0,1);if(r<.4)return;const Y=pj(CYT),s=sc(Y),x=px(cx,Y),y=Y+34*s-(jt>0?0:0)-112*s,w=46,a=Math.min(1,(r-.4)*6);
 const col=r>.75?'#e63946':r>.58?'#ff9f1c':'#7cbf4a',pul=r>.75?1+.08*Math.sin(tt*14):1;g.save();g.globalAlpha=a;g.translate(x,y);g.scale(pul,pul);
 RR(-w/2,-4,w,8,4,'#fff4dc',1.6);RR(-w/2,-4,Math.max(8,w*r),8,4,col,1.6);if(r>.75){g.font='900 12px '+FB;g.textAlign='center';g.lineWidth=3;g.strokeStyle='#fff';g.strokeText('!',w/2+8,5);g.fillStyle='#e63946';g.fillText('!',w/2+8,5)}
 g.restore();g.globalAlpha=1}
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
 const sp=cl((v-230)/200,0,1);if(RM())return;
 g.save();g.lineCap='round';
 STREAK.forEach((q,i)=>{const y=wrap(q.o+tt*(700+sp*900),H+80)-40,a=(.12+.38*sp)*(i<6||sp>.4?1:0);if(!a)return;g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=q.w;g.beginPath();g.moveTo(q.x,y);g.lineTo(q.x+(q.x<200?-1:1)*q.len*.12,y+q.len*(.6+sp*.8));g.stroke()});
 g.restore()}
// Multiply the world toward the zone's light (the sky above the horizon is left alone), then add warm lights at dusk and night.
// One soft white glow, built once and drawn tinted-by-alpha with 'lighter': much cheaper than a new radial gradient per light per frame.
const GLOWS={};
function glowImg(rgb){if(GLOWS[rgb])return GLOWS[rgb];const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba('+rgb+',1)');gr.addColorStop(1,'rgba('+rgb+',0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return GLOWS[rgb]=cv}
function glow(x,y,r,rgb,a){if(a<=0)return;g.globalAlpha=a;g.drawImage(glowImg(rgb),x-r,y-r,r*2,r*2);g.globalAlpha=1}
function zoneFx(){
 const P=PZ;
 if(P.tint!=='#ffffff'){g.globalCompositeOperation='multiply';const gr=g.createLinearGradient(0,HZ-24,0,HZ+24);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,P.tint);g.fillStyle=gr;g.fillRect(-30,0,W+60,H);g.globalCompositeOperation='source-over'}
 if(P.glow<.02)return;
 g.globalCompositeOperation='lighter';
 const Y=pj(CYT),x0=px(cx,Y);glow(x0,Y,70,'255,230,180',.22*P.glow);
 g.globalCompositeOperation='source-over';
 // Strings of paper lanterns over both sides of the street.
 [-1,1].forEach(sd=>{const xa=200+sd*30,xb=200+sd*196,ya=HZ+4,yb=HZ+34;g.strokeStyle='rgba(60,30,20,'+.7*P.glow+')';g.lineWidth=1.2;g.beginPath();g.moveTo(xa,ya);g.quadraticCurveTo((xa+xb)/2,yb+16,xb,yb);g.stroke();
  for(let i=1;i<6;i++){const t=i/6,lx=xa+(xb-xa)*t,ly=(1-t)*(1-t)*ya+2*(1-t)*t*(yb+16)+t*t*yb+6,sw=Math.sin(tt*2+i)*1.5,r=4+t*3;
   g.globalCompositeOperation='lighter';glow(lx+sw,ly,r*3.2,'255,120,80',.55*P.glow);g.globalCompositeOperation='source-over';g.globalAlpha=P.glow;
   g.fillStyle='#e63946';g.beginPath();g.ellipse(lx+sw,ly,r*.85,r,0,0,7);g.fill();g.fillStyle='#ffd166';g.fillRect(lx+sw-r*.5,ly-r-1,r,2);g.globalAlpha=1}})}
const SEASON=Array.from({length:18},()=>({x:rnd(0,W),y:rnd(0,H),sp:rnd(30,70),f:rnd(.6,1.6),r:rnd(0,6),s:rnd(.7,1.3)}));
function seasonFx(){
 const fx=ZONES[zCur].fx;if(!fx||RM())return;const a0=Math.min(1,zT*1.5);
 SEASON.forEach(q=>{const fall=fx!=='spark',x=wrap(q.x+Math.sin(tt*q.f+q.r)*24+(fx==='leaf'?tt*12:0),W+20)-10,y=fall?wrap(q.y+tt*q.sp*(fx==='snow'?.8:fx==='petal'?.6:1),H+20)-10:q.y*.8+Math.sin(tt*q.f+q.r)*10;
  g.save();g.globalAlpha=a0;g.translate(x,y);g.rotate(tt*q.f+q.r);g.scale(q.s,q.s);
  if(fx==='leaf'){g.fillStyle=q.r>3?'#e76f51':'#f4a261';g.beginPath();g.ellipse(0,0,6,3.2,0,0,7);g.fill()}
  else if(fx==='snow'){g.fillStyle='#ffffff';g.strokeStyle='rgba(120,150,190,.5)';g.lineWidth=.8;g.beginPath();g.arc(0,0,2.8,0,7);g.fill();g.stroke()}
  else if(fx==='petal'){g.fillStyle='#ffafcc';g.beginPath();g.ellipse(0,0,4.5,2.6,0,0,7);g.fill()}
  else{const tw=.3+.7*Math.max(0,Math.sin(tt*3+q.r*2));g.globalAlpha=a0*tw;star(0,0,4,'#fffbe0')}
  g.restore()})}
function drawBanner(){
 if(!banner)return;const q=banner.age,a=Math.max(0,Math.min(1,q*5,(2.6-q)*3));if(a<=0)return;
 if(banner.kind){const fury=banner.kind==='fury',k=eob(q/.3),wob=fury?Math.sin(q*30)*.04*Math.max(0,1-q):0;g.globalAlpha=a;g.save();g.translate(W/2,140);g.rotate(wob);g.scale(k,k);
  RR(-150,-26,300,50,14,fury?'#ffe0dc':'#fff1c2',3);if(fury)shakeTx(T('fury'),0,0,20,'#e0503f');else slamTx(T('zoomies'),0,0,24,'#ffb703',q);wt(T(fury?'furySub':'zoomSub'),0,17,12,'#8a5a3b');g.restore();g.globalAlpha=1;return}
 g.globalAlpha=a;const k=eob(q/.35);g.save();g.translate(W/2,150);g.scale(k,k);
 RR(-160,-30,320,58,16,'#fff1c2',3);[-1,1].forEach(sd=>P([[sd*160,-18],[sd*186,-4],[sd*174,4],[sd*186,14],[sd*160,18]],'#ff8a3d',3));
 slamTx(T('chap')[banner.z],0,-4,21,'#ff8a3d',q);wt(T('chapSub'),0,18,12,'#8a5a3b');g.restore();g.globalAlpha=1}
// Red edges that throb with the heartbeat as the shopkeeper closes in.
function danger(){
 const r=cl(1-gb/170,0,1),dz=st==='run'?cl((r-.55)/.45,0,1):0;if(dz<=0)return;
 const a=dz*(.32+.28*hbPulse),gr=g.createRadialGradient(W/2,H*.55,H*.32,W/2,H*.55,H*.78);
 gr.addColorStop(0,'rgba(230,57,70,0)');gr.addColorStop(1,'rgba(200,20,40,'+a+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
G.draw=()=>{
g.setTransform(DPR,0,0,DPR,0,0);
// A short, small nudge that fades out; never a sustained shake.
const ox=shake>0&&!RM()?Math.sin(shake*90)*shake*(st==='over'?14:16):0;g.save();g.translate(ox,0);
// Caught: punch-in on the cat for a dramatic beat before the result card drops.
if(st==='over'&&!RM()){const z=1+.22*eob(Math.min(1,overT/.25))*(overT<HOLD()?1:Math.max(0,1-(overT-HOLD())/.3)),Y=pj(CYT),fx0=px(cx,Y);g.translate(fx0,Y);g.scale(z,z);g.translate(-fx0,-Y)}
bg();rows.slice().sort((p,q)=>p.y-q.y).forEach(item);
warn.forEach(w=>{if(Math.floor(tt*12)%2){const Y=pj(H-34),s=sc(Y);spr('warn',px(LX[w.l],Y),Y+14*s,40*s)}});
slips.forEach(o=>{const Y=pj(o.y),s=sc(Y);spr('slip',px(LX[o.l],Y),Y,30*s,null,tt*14)});
if(gate&&gate.y<CYT)drawGate();cat();if(gate&&gate.y>=CYT)drawGate();const gy=granny();zoneFx();if(st==='run'&&tut)hint();
if(st==='run'&&gb<75){const i=Math.floor(tt/1.4)%3,q=tt%1.4,k=eob(Math.min(1,q/.25));g.save();g.translate(200,Math.min(H-150,gy-140));g.scale(k,k);shakeTx(T('sh')[i],0,0,21,'#e0503f');g.restore()}
g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,px(f.x,pj(CYT)),f.y-f.t*50,26,'#ff6b5a');g.globalAlpha=1});
drawFlying();
pops.forEach(q=>{g.globalAlpha=Math.max(0,1-q.age/q.life);const X=cl(px(q.x,pj(CYT)),70,330),Y0=pj(CYT)-q.dy-q.age*46;if(q.rot){g.save();g.translate(X,Y0);g.rotate(q.rot);popTx(q.s,0,0,q.sz,q.col,q.age);g.restore()}else popTx(q.s,X,Y0,q.sz,q.col,q.age);g.globalAlpha=1});
danger();drawBanner();
// A short red flash on a hit, so it is obvious the cat was struck (skipped with reduced motion).
if(st==='run'&&tt-hitT<.22&&!RM()){g.fillStyle='rgba(230,57,70,'+(.26*(1-(tt-hitT)/.22))+')';g.fillRect(0,0,W,H)}
if(st==='run')chaseGauge();
if(flash>0){g.fillStyle='rgba(255,255,255,'+flash/.18*.6+')';g.fillRect(0,0,W,H)}
if(st==='over'&&overT<.18){g.fillStyle='rgba(255,255,255,'+(1-overT/.18)*.85+')';g.fillRect(0,0,W,H)}
hud()};
let motionOff=false,paused=false,panel=null;const RM=()=>reduceMotion||motionOff,HOLD=()=>RM()?0:.7;
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0,overT=0,hudBump=0,landT=0,dust=[],hitKind=null,hitT=-9,hitDir=1,hbNext=0,hbPulse=0;
const hitAt=new WeakMap();
const SK=()=>G.skins[skin],V=$('view-thief');
const T=k=>G.I[k];
function localText(text){return window.deepSeaI18n?.text(text)??text;}
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
motionOff=ST('deep-sea-thief-motion')==='1';
const MKEY='deep-sea-thief-missions',SNDKEY='deep-sea-thief-sound',TKEY='deep-sea-thief-tutorial',SWIPE=22,SBX=378,SBY=64,SKY0=406;
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
function isOpen(i){const k=G.skins[i];return k.m?MS.done.includes(k.m):k.lv?lvDone(k.lv)===lvAll(k.lv):k.ev?LS.evDone.includes(k.ev):k.epi?!!LS.epi:best>=k.need}
function skinAt(i){return{x:W/2+((i%6)-2.5)*54,y:SKY0+Math.floor(i/6)*42}}
function mLabel(m){return localText(m.t).replace('{n}',fmt(m.n))}
function lockText(i){const k=G.skins[i];
 if(k.m)return localText(T('lockM')).replace('{m}',mLabel(MISSIONS.find(x=>x.id===k.m)));
 if(k.lv)return localText(T('lockL')).replace('{lv}',k.lv);
 if(k.ev)return localText(T('lockE')).replace('{n}',EV_RUNS).replace('{e}',localText(EVENTS.find(e=>e.id===k.ev).n));
 if(k.epi)return localText(T('lockEpi'));
 return localText(T('lockS')).replace('{n}',fmt(k.need))}
function listMissions(){const lv=curLevel();shownM=MISSIONS.filter(m=>justDone.has(m.id)).concat(MISSIONS.filter(m=>m.lv===lv&&!MS.done.includes(m.id))).slice(0,3)}
function puff(n){if(RM())return;for(let i=0;i<n;i++)dust.push({dx:rnd(-16,16),vx:rnd(-40,40),age:rnd(0,.06)})}
// Delivered fruit arcs up to the kittens' hideout in the top-left corner.
let flying=[];function deliver(n){const Y=pj(CYT),x0=px(cx,Y);for(let i=0;i<n;i++)flying.push({x0,y0:Y-40,k:FK[i%3],age:-i*.07})}
function drawFlying(){flying.forEach(f=>{if(f.age<0)return;const t=Math.min(1,f.age/.7),x=f.x0+(36-f.x0)*t,y=f.y0+(70-f.y0)*t-Math.sin(t*Math.PI)*110;g.globalAlpha=1-Math.max(0,t-.85)/.15;spr(f.k,x,y,20*(1-t*.4));g.globalAlpha=1});
 if(flying.length){const a=Math.min(1,flying[0].age*4);g.globalAlpha=Math.max(0,a);C(36,66,15,'#fff6e6',2.5);spr('k3',36,80,24);g.globalAlpha=1}}
function burst(x,y,n,cols){if(RM())return;for(let i=0;i<n;i++){const q=rnd(0,Math.PI*2),sp=rnd(120,320);parts.push({x,y,vx:Math.cos(q)*sp,vy:Math.sin(q)*sp-160,col:cols[i%cols.length],r:rnd(0,6),vr:rnd(-9,9),age:0})}}
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
 const e={streak,fr:stats.apples+stats.oranges+stats.greens,fish:stats.fish,j:stats.jumps,d:stats.dodges,stun,jt,w:warn.length,s:slips.length,L,zoom,gold:stats.golds||0,rage:!!rage,rages:stats.rages||0},p=prevEv;
 prevEv=e;if(!p)return;
 if(e.jt>p.jt+.1){sfx('jump');puff(4)}
 if(p.jt>0&&e.jt<=0){landT=.16;puff(5);sfx('land')}
 if(e.stun>p.stun+.1){
  const b=rows.find(r=>r.t==='b'&&r.h&&!hitAt.has(r));
  if(b){hitAt.set(b,tt);hitKind='b';hitDir=b.l<1?-1:b.l>1?1:(Math.random()<.5?-1:1);sfx('trip')}else{hitKind='s';sfx('hit')}
  hitT=tt;shake=.15;try{navigator.vibrate&&navigator.userActivation?.hasBeenActive!==false&&navigator.vibrate(hitKind==='b'?[40,40,60]:80)}catch(_){}}
 if(e.fr>p.fr){sfx('fruit');hudBump=1;if(!(e.zoom>0)){pops.push({s:'+'+FP,x:cx,dy:70,sz:22,col:'#ffd23f',age:0,life:.7,rot:0});
  // Fruit streak toward Zoomies: from 3 in a row a big counter pops up with a rising note; 10 starts Zoomies.
  if(e.streak>=3&&e.streak>p.streak){pops.push({s:'x'+e.streak,x:cx,dy:128,sz:22+e.streak*2.2,col:e.streak>=8?'#ff6b4a':'#ffb703',age:0,life:.6,rot:(e.streak%2?-1:1)*.08});tone(520+e.streak*70,520+e.streak*70,.09,'triangle',.05,.06)}}}
 if(e.fish>p.fish){sfx('fish');if(p.L>0){LS.delivered+=p.L;LS.maxDeliver=Math.max(LS.maxDeliver,p.L);checkStickers();checkEpilogue()}
  // Fish = delivery: the fruit on the cat's back flies off to the kittens' hideout, which is why the load disappears.
  if(p.L>0){deliver(p.L);pops.push({s:localText(T('deliver')),x:cx,dy:82,sz:17,col:'#7bd88f',age:0,life:1.1,rot:-.05})}
  else pops.push({s:localText(T('light')),x:cx,dy:78,sz:17,col:'#8ecae6',age:0,life:.9,rot:0})}
 if(e.gold>p.gold){sfx('gold');burst(px(cx,pj(CYT)),pj(CYT)-60,30,['#ffd23f','#fff6c2','#ffb703']);pops.push({s:'+15',x:cx,dy:96,sz:24,col:'#ffd23f',age:0,life:.8,rot:0})}
 if(e.zoom>0&&p.zoom<=0){sfx('zoom');banner={kind:'zoom',age:0}}
 if(e.zoom>0&&e.fr>p.fr)pops.push({s:'+'+(FP+5),x:cx,dy:96,sz:22,col:'#ffb703',age:0,life:.7,rot:0});
 if(e.rage&&!p.rage){sfx('fury');banner={kind:'fury',age:0}}
 if(e.rages>p.rages){sfx('phew');burst(W/2,190,22,['#7bd88f','#ffd23f','#fff6e6']);pops.push({s:localText(T('furyOk')).replace('{n}',20),x:cx,dy:104,sz:20,col:'#7bd88f',age:0,life:1.3,rot:0})}
 if(e.w>p.w)sfx('warn');
 if(e.s>p.s)sfx('whoosh');
 if(e.d>p.d){sfx('close');pops.push({s:localText(T('close')),x:cx,dy:96,sz:26,col:'#7bd88f',age:0,life:1.1,rot:-.08});burst(px(cx,pj(CYT)),pj(CYT)-70,14,['#7bd88f','#fff6e6','#b8f2c4']);if(tut)tut.d+=e.d-p.d}
 if(e.j>p.j&&tut)tut.j+=e.j-p.j;
 if(tut&&(tut.j>=2&&tut.d>=1)){tut=null;saveTut()}
 const z=zoneOf(G.score());
 // A new season arrives as a gate at the far end of the street; the scene changes when the cat runs through it.
 if(z>zGoal&&!gate){zGoal=Math.min(z,zCur+1);gate={z:zGoal,y:-60,hit:0}}
 trackMissions();
}

/* ---------- Sound: everything is synthesized with Web Audio, so there are no audio files to load ---------- */
let musicOn=ST(SNDKEY)!=='0'&&ST('deep-sea-thief-music')!=='0',sfxOn=ST(SNDKEY)!=='0'&&ST('deep-sea-thief-sfx')!=='0',soundOn=musicOn||sfxOn,ac=null,master=null,musBus=null,sfxBus=null,noiseBuf=null,windSrc=null,windF=null,windG=null,musT=0,musI=0;
function audioInit(){
 if(!soundOn)return;
 try{
  if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();
   const comp=ac.createDynamicsCompressor();master=ac.createGain();master.gain.value=.9;master.connect(comp);comp.connect(ac.destination);
   musBus=ac.createGain();musBus.gain.value=musicOn?.55:0;musBus.connect(master);sfxBus=ac.createGain();sfxBus.gain.value=sfxOn?1:0;sfxBus.connect(master);
   noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(ac.state==='suspended')ac.resume()}catch(e){ac=null}}
function tone(f1,f2,dur,type,vol,delay,bus){if(!ac)return;vol*=VK;try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type=type||'sine';o.frequency.setValueAtTime(f1,t);if(f2!==f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol||.1,t+.006);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(bus||sfxBus);o.start(t);o.stop(t+dur+.03)}catch(e){}}
function noise(dur,vol,type,f1,f2,delay,bus,q){if(!ac)return;vol*=VK;try{const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);s.buffer=noiseBuf;fl.type=type;fl.Q.value=q||1;fl.frequency.setValueAtTime(f1,t);if(f2&&f2!==f1)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(gn);gn.connect(bus||sfxBus);s.start(t,Math.random()*.5);s.stop(t+dur+.03)}catch(e){}}
// Brassy note: sawtooth through a low-pass, optional pitch fall and wobble for the "wah-wah" when caught.
function brass(f,dur,vol,delay,fall,vib){if(!ac)return;vol*=VK;try{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='sawtooth';o.frequency.setValueAtTime(f,t);if(fall)o.frequency.exponentialRampToValueAtTime(f*fall,t+dur);
 if(vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.5;lg.gain.value=vib;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05)}
 fl.type='lowpass';fl.frequency.setValueAtTime(900,t);fl.frequency.linearRampToValueAtTime(2200,t+.06);fl.frequency.linearRampToValueAtTime(1100,t+dur);
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.03);gn.gain.setValueAtTime(vol,t+dur*.75);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl);fl.connect(gn);gn.connect(sfxBus);o.start(t);o.stop(t+dur+.05)}catch(e){}}
// Chiptune square wave through a resonant low-pass whose cutoff opens and closes: the cartoon "wah".
function wah(f,dur,vol,delay,fall,vib){if(!ac)return;vol*=VK;try{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='square';o.frequency.setValueAtTime(f,t);if(fall)o.frequency.setValueAtTime(f,t+dur*.55),o.frequency.exponentialRampToValueAtTime(f*fall,t+dur);
 fl.type='lowpass';fl.Q.value=7;fl.frequency.setValueAtTime(260,t);fl.frequency.exponentialRampToValueAtTime(2600,t+.09);fl.frequency.exponentialRampToValueAtTime(420,t+Math.min(dur,.3));
 if(vib){const l=ac.createOscillator(),lg=ac.createGain(),l2=ac.createOscillator(),lg2=ac.createGain();l.frequency.value=6;lg.gain.value=vib;l.connect(lg);lg.connect(o.frequency);l2.frequency.value=4;lg2.gain.value=700;l2.connect(lg2);lg2.connect(fl.frequency);fl.frequency.setValueAtTime(1100,t+.3);l.start(t);l2.start(t);l.stop(t+dur+.05);l2.stop(t+dur+.05)}
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.02);gn.gain.setValueAtTime(vol,t+dur*.7);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl);fl.connect(gn);gn.connect(sfxBus);o.start(t);o.stop(t+dur+.05)}catch(e){}}
// Slide whistle: a pure tone gliding with a fast wobble.
function slide(f1,f2,dur,vol,delay){if(!ac)return;vol*=VK;try{const o=ac.createOscillator(),l=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type='sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);l.frequency.value=9;lg.gain.value=f1*.025;l.connect(lg);lg.connect(o.frequency);
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.03);gn.gain.setValueAtTime(vol,t+dur*.8);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(sfxBus);o.start(t);l.start(t);o.stop(t+dur+.05);l.stop(t+dur+.05)}catch(e){}}
// A sad little "mew": a buzzy voice bent up then down, shaped by two vowel-like band-pass formants.
function meow(delay,vol,sad){if(!ac)return;vol*=VK;try{const t=ac.currentTime+(delay||0),o=ac.createOscillator(),gn=ac.createGain();o.type='sawtooth';
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
// Loudness trims per effect (measured offline as short-term peak RMS) so pickups, hits and fanfares sit at even levels.
// Targets: small cues -34 dB, pickups and actions -28, hits and fanfares -24, caught -20, the repeating heartbeat -30.
let VK=1;const SFXV={jump:1.16,land:0.57,lane:6,fruit:1.41,fish:1.35,trip:0.57,heart:0.3,hit:0.56,warn:1.74,whoosh:5.31,close:2.02,gold:0.88,zoom:2.11,fury:1.1,phew:2.66,zone:1.26,mission:0.99,levelup:0.94,bonus:1.86,record:2.14,caught:0.39,start:1.15};
function sfx(k){if(sfxOn&&ac&&SFX[k]){VK=SFXV[k]||1;try{SFX[k]()}finally{VK=1}}}
function windOn(){if(!ac||windSrc)return;try{windSrc=ac.createBufferSource();windSrc.buffer=noiseBuf;windSrc.loop=true;windF=ac.createBiquadFilter();windF.type='bandpass';windF.Q.value=.8;windF.frequency.value=500;windG=ac.createGain();windG.gain.value=.0001;windSrc.connect(windF);windF.connect(windG);windG.connect(musBus);windSrc.start()}catch(e){windSrc=null}}
function windOff(){if(!windSrc)return;try{const t=ac.currentTime;windG.gain.cancelScheduledValues(t);windG.gain.setValueAtTime(windG.gain.value,t);windG.gain.exponentialRampToValueAtTime(.0001,t+.4);windSrc.stop(t+.45)}catch(e){}windSrc=null}
function syncAudio(){soundOn=musicOn||sfxOn;if(soundOn)audioInit();if(master)master.gain.value=soundOn?.9:0;if(musBus)musBus.gain.value=musicOn?.55:0;if(sfxBus)sfxBus.gain.value=sfxOn?1:0;if(!musicOn)windOff();musT=0;
 try{localStorage.setItem(SNDKEY,soundOn?'1':'0');localStorage.setItem('deep-sea-thief-music',musicOn?'1':'0');localStorage.setItem('deep-sea-thief-sfx',sfxOn?'1':'0')}catch(e){}}
function toggleSound(){const on=!(musicOn||sfxOn);musicOn=sfxOn=on;syncAudio();if(on)sfx('fruit')}
/* ---------- Chase music: 172 BPM and climbing, driving octave bass, high arpeggio hook, offbeat stabs,
   snare fills and a riser every four bars. Each chapter shifts key and mood; danger and Zoomies add layers. ---------- */
const SEMI=n=>Math.pow(2,n/12);
// Spring: I-V-vi-IV in C; summer: the same a tone higher; autumn: driving A minor (vi-IV-I-V); winter: that a tone higher with sleigh bells.
const PROG=[[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],[[2,6,9],[9,13,16],[11,14,18],[7,11,14]],[[9,12,16],[5,9,12],[0,4,7],[7,11,14]]];
const HOOK=[[2,1,0,1,2,3,2,1,0,1,2,3,4,3,2,1],[0,2,1,3,2,4,3,2,1,2,3,4,3,2,1,0],[2,1,0,1,2,3,2,1,0,-1,2,-1,3,-1,4,-1],[4,3,2,3,4,5,4,3,2,3,4,5,6,-1,6,-1]];
// Filtered synth voice for bass and lead: an oscillator through a low-pass with a short pluck envelope.
function syn(f,dur,type,vol,delay,cut){if(!ac)return;try{const o=ac.createOscillator(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type=type;o.frequency.setValueAtTime(f,t);fl.type='lowpass';fl.frequency.setValueAtTime(cut*2,t);fl.frequency.exponentialRampToValueAtTime(cut,t+dur*.6);fl.Q.value=3;
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol,t+.005);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl);fl.connect(gn);gn.connect(musBus);o.start(t);o.stop(t+dur+.03)}catch(e){}}
function music(){
 if(st!=='run'||paused||V.hidden||document.hidden||!musicOn||!ac||ac.state!=='running'){musT=0;if(windSrc)windOff();return}
 windOn();
 const now=ac.currentTime,sp=(v-260)/170;
 if(windSrc){windF.frequency.setTargetAtTime(420+sp*900+Math.sin(tt*.8)*160,now,.2);windG.gain.setTargetAtTime(.04+sp*.045+(Math.sin(tt*.53)+1)*.01,now,.3)}
 // A sixteenth note: 172 BPM at the start, up to about 186 BPM deep into a run, a quarter faster in Zoomies.
 const step=(60/(172+Math.min(14,dist/2500))/4)*(zoom>0?.8:1),danger=cl((1-gb/170-.55)/.45,0,1);
 if(musT<now)musT=now+.05;
 while(musT<now+.22){
  const i=musI%16,bar=(musI>>4)%4,d=musT-now,z=zCur,ch=PROG[z>=2?2:0][bar],base=SEMI(z%2?2:0),hot=G.score()>=150||zoom>0;
  const note=(deg,oct)=>{const k=ch[deg%3]+12*(Math.floor(deg/3)+oct);return 261.63*base*SEMI(k)};
  // Drums: four-on-the-floor plus a push on the last sixteenth, clap on 2 and 4, sixteenth hats with offbeat accents.
  if(i%4===0||(i===14&&bar%2)){tone(165,40,.16,'sine',.42,d,musBus);noise(.015,.06,'highpass',4000,4000,d,musBus)}
  if(i===4||i===12){noise(.14,.16,'bandpass',1900,1100,d,musBus,.8);noise(.05,.08,'highpass',5000,5000,d+.012,musBus);tone(200,150,.07,'triangle',.06,d,musBus)}
  noise(i%4===2?.07:.025,i%4===2?.045:i%2?.022:.03,'highpass',i%4===2?6500:8500,i%4===2?6500:8500,d,musBus);
  // Snare roll into the next loop, with a rising noise sweep.
  if(bar===3&&i>=12)noise(.06,.05+(i-12)*.025,'bandpass',2200,1600,d,musBus,.8);
  if(bar===3&&i===8)noise(step*8,.06,'bandpass',500,6000,d,musBus,1.2);
  if(bar===0&&i===0)noise(1.1,.07,'highpass',4500,4500,d,musBus);
  // Galloping octave bass on eighths; a sixteenth pickup when it gets hot.
  if(i%2===0||hot&&i%4===3){const f=note(0,-2)*(i%4===2?2:1);syn(f,step*1.8,'sawtooth',.11,d,700+sp*500)}
  // Offbeat chord stabs give the drive.
  if(i%4===2)[0,1,2].forEach(k=>syn(note(k,0),step*.9,'square',.018,d,2400));
  // High arpeggio hook (sixth octave) with a soft echo three sixteenths later.
  const h=HOOK[bar][i];if(h>=0){const f=note(h,1);syn(f,step*1.1,'square',.032,d,4200);syn(f,step*1.1,'triangle',.014,d+step*3,3000)}
  // Danger: an urgent high tick on every sixteenth, getting louder as the shopkeeper closes in.
  if(danger>0&&i%2===1)tone(2100,2100,.025,'square',.012+.02*danger,d,musBus);
  if(zoom>0&&i%2===0)syn(note(h<0?2:h,2),step*.8,'triangle',.02,d,5000);
  if(z===3){if(i%2===0)noise(.06,.03,'highpass',8500,8500,d,musBus,2);if(i%4===0&&h>=0)tone(note(h,2),note(h,2),.3,'sine',.03,d,musBus)}
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
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin])skin=0;
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
 for(const z of [1,2,3]){const at=ZONES[z].at;if(s<at&&s>=at*.72)return L0('hookZone').replace('{n}',fmt(at-s)).replace('{z}',L0(ZNAME[z]))}
 return ''}
const ZNAME=['','zSunset','zNight','zWinter'];
function die(m){
 if(st!=='run')return;
 st='over';G.msg=m;shake=RM()?0:.25;release();overT=0;
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
 zCur=0;zGoal=0;gate=null;flash=0;zFrom=ZONES[0];zT=1;PZ=ZONES[0];banner=null;hook='';closeStory();
 paused=false;panel=null;EVNOW=activeEvent();justDone.clear();mBase={...MS.p};listMissions();prevEv=null;toasts=[];pops=[];parts=[];hudBump=0;landT=0;dust=[];hitKind=null;hitT=-9;hbNext=0;hbPulse=0;flying=[];hs={kind:null,until:0,next:tt+2};
 if(tut){tut.r++;if(tut.r>3){tut=null;saveTut()}}
 st='run';last=performance.now();say(dailyRun?localText(T('dGoalSay')).replace('{n}',fmt(dailyGoal())):'{{t:thief.msg.017}}');sfx('start');ui();c.focus();
 };
 // The Daily Heist uses today's shared seed locally and is not sent to the leaderboard.
 if(daily)go(null);else rank.start(go,ui,{rulesVersion:thiefRules.rulesVersion});
}
/* ---------- Story: three comic panels per chapter, drawn from the game's own sprites ---------- */
const SKEY2='deep-sea-thief-story';
let SS={r:0,seen:[]};try{const o=JSON.parse(ST(SKEY2)||'null');if(o&&typeof o==='object'){SS.r=cl(+o.r||0,0,3);SS.seen=Array.isArray(o.seen)?o.seen.filter(n=>n>=0&&n<=4):[]}}catch(e){}
function saveSS(){try{localStorage.setItem(SKEY2,JSON.stringify(SS))}catch(e){}}
let story=null;
const unseen=()=>{for(let ch=0;ch<=SS.r;ch++)if(!SS.seen.includes(ch))return ch;return LS.epi&&!SS.seen.includes(4)?4:-1};
function openStory(ch){story={c:ch,age:0}}
function closeStory(){if(!story)return;if(!SS.seen.includes(story.c)){SS.seen.push(story.c);saveSS()}story=null}
const KIT=['k3','k1','k2','k4','k5'],kits=(x,y,h,n)=>{for(let k=0;k<n;k++)spr(KIT[k%5],x+(k-(n-1)/2)*h*.72,y-Math.abs(Math.sin(tt*4+k))*3,h*1.05)};
const PANELS=[
 [[ '#cdeefa',(x,y,w,h)=>{spr('basket',x+w/2,y+h-24,52);kits(x+w/2,y+h-58,36,5)},'{{t:thief.msg.069}}'],
  ['#d9f2fb',(x,y,w,h)=>{spr('stall1',x+92,y+h+2,104);spr('apple',x+152,y+44+Math.sin(tt*3)*3,24);spr('catF',x+w-80,y+h-24,92)},'{{t:thief.msg.070}}'],
  ['#ffe1d6',(x,y,w,h)=>{spr('gS',x+w/2-40,y+h+10,128);spr('slip',x+w/2+74,y+56,34,null,tt*8);spr('warn',x+w/2+28,y+40,30)},'{{t:thief.msg.071}}']],
 [['#ffe8a3',(x,y,w,h)=>{kits(x+w/2-50,y+h-32,40,3);spr('apple',x+w/2+50,y+h-32,28);spr('orange',x+w/2+78,y+h-32,28);spr('green',x+w/2+64,y+h-56,26)},'{{t:thief.msg.072}}'],
  ['#ffd27a',(x,y,w,h)=>{spr('gF',x+w/2-20,y+h+14,132);spr('slip',x+w/2+70,y+46,30,null,.5+Math.sin(tt*6)*.3)},'{{t:thief.msg.073}}'],
  ['#c9eeff',(x,y,w,h)=>{const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#4fb3f0');gr.addColorStop(1,'#c9eeff');g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='#ffe066';g.beginPath();g.arc(x+w-46,y+30,15,0,7);g.fill();spr('c1',x+w/2-60,y+h-26,66,tint(skin));spr('g1',x+w/2+70,y+h+8,92)},'{{t:thief.msg.074}}']],
 [['#ffe6cc',(x,y,w,h)=>{spr('stall3',x+90,y+h+2,104);for(let k=0;k<6;k++){g.fillStyle=k%2?'#e76f51':'#f4a261';g.beginPath();g.ellipse(x+150+k*28,y+20+((tt*30+k*23)%(h-40)),6,3,tt+k,0,7);g.fill()}spr('apple',x+w-70,y+h-32,28)},'{{t:thief.msg.075}}'],
  ['#f6d5b0',(x,y,w,h)=>{RR(x+w/2-34,y+18,68,h-22,6,'#8a5a3b',3);C(x+w/2+22,y+h/2+6,3.5,'#ffd166',1.5);spr('fish',x+w/2+62,y+h-30,30);tx('?',x+w/2+62,y+40+Math.sin(tt*4)*3,30,'#ffb703');g.globalAlpha=.85;spr('g2',x+62,y+h+12,96);g.globalAlpha=1},'{{t:thief.msg.076}}'],
  ['#ffe6cc',(x,y,w,h)=>{kits(x+w/2-20,y+h-32,44,3);spr('fish',x+w/2+66,y+h-32,32)},'{{t:thief.msg.171}}']],
 [['#e8f0ff',(x,y,w,h)=>{for(let k=0;k<14;k++){g.fillStyle='#fff';g.beginPath();g.arc(x+12+k*23,y+8+((tt*24+k*37)%(h-16)),2.6,0,7);g.fill()}spr('basket',x+w/2,y+h-24,50);kits(x+w/2,y+h-60,36,5)},'{{t:thief.msg.172}}'],
  ['#dbe7f7',(x,y,w,h)=>{for(let k=0;k<5;k++){const px0=x+40+k*44,py0=y+h-40-(k%2)*10;g.fillStyle='#9fb3cc';[[0,0,5],[-6,-7,2.5],[0,-9,2.5],[6,-7,2.5]].forEach(([dx,dy,r])=>{g.beginPath();g.arc(px0+dx,py0+dy,r,0,7);g.fill()})}spr('g0',x+w-74,y+h+12,110)},'{{t:thief.msg.173}}'],
  ['#e8f0ff',(x,y,w,h)=>{RR(x+w/2-46,y+18,92,62,8,'#ffe9a8',3);L2(x+w/2,y+18,x+w/2,y+80,3);L2(x+w/2-46,y+49,x+w/2+46,y+49,3);kits(x+w/2,y+h-30,30,3);g.fillStyle='#fff';g.fillRect(x,y+h-12,w,12)},'{{t:thief.msg.077}}']],
 [['#4a5a9a',(x,y,w,h)=>{RR(x+w/2-30,y+14,60,h-40,6,'#8a5a3b',3);C(x+w/2+20,y+h/2-6,3.5,'#ffd166',1.5);spr('g2',x+86,y+h-14,96);spr('fish',x+w/2+56,y+h-32,28);tx('!',x+w/2+56,y+40+Math.sin(tt*4)*3,26,'#ffd23f')},'{{t:thief.msg.153}}'],
  ['#ffd8a8',(x,y,w,h)=>{kits(x+92,y+h-32,36,3);spr('g0',x+w-86,y+h-6,112);spr('fish',x+w/2-6,y+h-32,26)},'{{t:thief.msg.154}}'],
  ['#ffe1d6',(x,y,w,h)=>{spr('catF',x+w/2-60,y+h-24,92);spr('gc',x+w/2+62,y+h-4,104);tx('♥',x+w/2,y+40+Math.sin(tt*3)*4,30,'#ff4d6d')},'{{t:thief.msg.155}}']]];
function drawStory(){
 const q=story.age;g.fillStyle='rgba(30,18,12,.88)';g.fillRect(0,0,W,H);
 slamTx(T('chap')[story.c],W/2,40,22,'#ffd23f',q);
 PANELS[story.c].forEach(([bgc,fn,cap],i)=>{
  const a=cl((q-.25-i*.45)/.3,0,1);if(a<=0)return;const x=36,y=58+i*142+(1-eob(a))*20,w=328,h=130;
  g.globalAlpha=a;RR(x,y,w,h,14,bgc,3);g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();fn(x,y,w,h);g.restore();
  RR(x+10,y+h-28,w-20,22,9,'rgba(255,246,230,.94)',0);wt(cap,W/2,y+h-12,13,OL,0,w-30);
  RR(x,y,w,h,14,'rgba(0,0,0,0)',3);g.globalAlpha=1});
 if(q>1.6)waveTx('{{t:thief.msg.078}}',W/2,516,15,'#fff6e6')}
/* ---------- Lifetime stats, sticker album, the kittens' hideout and the Daily Heist ---------- */
const LKEY='deep-sea-thief-life';
const LS0={menuSeen:[],ev:{},evDone:[],epi:0,runs:0,caught:0,apples:0,oranges:0,greens:0,fish:0,jumps:0,dodges:0,zooms:0,golds:0,rages:0,delivered:0,maxDeliver:0,maxZone:0,best:0,stickers:[],daily:{date:'',best:0,done:0},dailyLast:'',dailyStreak:0,dailyWins:0};
let LS={...LS0,daily:{...LS0.daily}};
try{const o=JSON.parse(ST(LKEY)||'null');if(o&&typeof o==='object'){for(const k in LS0)if(typeof o[k]===typeof LS0[k])LS[k]=o[k];if(!Array.isArray(LS.stickers))LS.stickers=[]}}catch(e){}
LS.best=Math.max(LS.best,best);if(!LS.ev||typeof LS.ev!=='object'||Array.isArray(LS.ev))LS.ev={};if(!Array.isArray(LS.evDone))LS.evDone=[];if(!Array.isArray(LS.menuSeen))LS.menuSeen=[];
function saveLS(){try{localStorage.setItem(LKEY,JSON.stringify(LS))}catch(e){}}
let sheet=null,hearts=[],dailyRun=false,stepAcc=0,newStickers=new Set();
// Five themed rows of four: basics, skill, delivery & seasons, power-ups, goals.
// [id, icon, unlocked?, name id, how-to [text id, n], row, progress [current, target] or null]
const STICKERS=[
 ['first','cat',q=>q.runs>=1,'msg.100',['msg.120'],0,null],['apple100','apple',q=>q.apples>=100,'msg.101',['msg.034',100],0,q=>[q.apples,100]],['orange50','orange',q=>q.oranges>=50,'msg.102',['msg.047',50],0,q=>[q.oranges,50]],['fish50','fish',q=>q.fish>=50,'msg.103',['msg.035',50],0,q=>[q.fish,50]],
 ['jump100','basket',q=>q.jumps>=100,'msg.104',['msg.037',100],1,q=>[q.jumps,100]],['dodge50','slipper',q=>q.dodges>=50,'msg.105',['msg.036',50],1,q=>[q.dodges,50]],['fury1','calm',q=>q.rages>=1,'msg.114',['msg.128'],1,null],['caught25','dizzy',q=>q.caught>=25,'msg.117',['msg.129',25],1,q=>[q.caught,25]],
 ['deliver5','crate',q=>q.maxDeliver>=5,'msg.106',['msg.121'],2,q=>[q.maxDeliver,5]],['deliver200','kitten',q=>q.delivered>=200,'msg.107',['msg.122',200],2,q=>[q.delivered,200]],['sunset','leaf',q=>q.maxZone>=2,'msg.108',['msg.123',2],2,null],['night','snow',q=>q.maxZone>=3,'msg.109',['msg.123',3],2,null],
 ['zoom1','bolt',q=>q.zooms>=1,'msg.110',['msg.124'],3,null],['zoom25','bolt2',q=>q.zooms>=25,'msg.111',['msg.125',25],3,q=>[q.zooms,25]],['gold1','gold',q=>q.golds>=1,'msg.112',['msg.126'],3,null],['gold20','gold3',q=>q.golds>=20,'msg.113',['msg.127',20],3,q=>[q.golds,20]],
 ['score400','star',q=>q.best>=400,'msg.115',['msg.050',400],4,q=>[q.best,400]],['score800','crown',q=>q.best>=800,'msg.116',['msg.050',800],4,q=>[q.best,800]],['daily1','cal1',q=>q.dailyWins>=1,'msg.118',['msg.130'],4,null],['daily7','cal7',q=>q.dailyStreak>=7,'msg.119',['msg.131',7],4,q=>[q.dailyStreak,7]]];
const ROWC=[['#ffd6a5','#f4a261'],['#bde0fe','#5390d9'],['#c7efcf','#52b788'],['#fff3b0','#e9b949'],['#e2d4ff','#8f6ad8']];
// Sticker names and how-to lines are looked up by id at build time; keep this list in step with the ids above.
const STXT={'msg.100':'{{t:thief.msg.100}}','msg.101':'{{t:thief.msg.101}}','msg.102':'{{t:thief.msg.102}}','msg.103':'{{t:thief.msg.103}}','msg.104':'{{t:thief.msg.104}}','msg.105':'{{t:thief.msg.105}}','msg.106':'{{t:thief.msg.106}}','msg.107':'{{t:thief.msg.107}}','msg.108':'{{t:thief.msg.108}}','msg.109':'{{t:thief.msg.109}}','msg.110':'{{t:thief.msg.110}}','msg.111':'{{t:thief.msg.111}}','msg.112':'{{t:thief.msg.112}}','msg.113':'{{t:thief.msg.113}}','msg.114':'{{t:thief.msg.114}}','msg.115':'{{t:thief.msg.115}}','msg.116':'{{t:thief.msg.116}}','msg.117':'{{t:thief.msg.117}}','msg.118':'{{t:thief.msg.118}}','msg.119':'{{t:thief.msg.119}}',
 'msg.120':'{{t:thief.msg.120}}','msg.121':'{{t:thief.msg.121}}','msg.122':'{{t:thief.msg.122}}','msg.123':'{{t:thief.msg.123}}','msg.124':'{{t:thief.msg.124}}','msg.125':'{{t:thief.msg.125}}','msg.126':'{{t:thief.msg.126}}','msg.127':'{{t:thief.msg.127}}','msg.128':'{{t:thief.msg.128}}','msg.129':'{{t:thief.msg.129}}','msg.130':'{{t:thief.msg.130}}','msg.131':'{{t:thief.msg.131}}',
 'msg.034':'{{t:thief.msg.034}}','msg.047':'{{t:thief.msg.047}}','msg.035':'{{t:thief.msg.035}}','msg.037':'{{t:thief.msg.037}}','msg.036':'{{t:thief.msg.036}}','msg.050':'{{t:thief.msg.050}}'};
function stName(st0){return localText(STXT[st0[3]])}
function stDesc(st0){const [id,n]=st0[4];let t=localText(STXT[id]);if(id==='msg.123')return t.replace('{z}',localText(T(ZNAME[n])));return t.replace('{n}',fmt(n||0))}
function checkStickers(){
 for(const st0 of STICKERS){if(LS.stickers.includes(st0[0])||!st0[2](LS))continue;
  LS.stickers.push(st0[0]);newStickers.add(st0[0]);saveLS();
  if(st==='run'||st==='over'){toasts.push({h:T('newSticker'),a:'★ '+stName(st0),b:stDesc(st0),age:0});sfx('mission')}}}
function recordRun(s){
 const q=stats;LS.runs++;LS.caught++;['apples','oranges','greens','fish','jumps','dodges','zooms','golds','rages'].forEach(k=>LS[k]+=q[k]||0);LS.best=Math.max(LS.best,s);
 if(dailyRun){const d=LS.daily,today=dayKey(0);if(d.date!==today){d.date=today;d.best=0;d.done=0}d.best=Math.max(d.best,s);
  if(!d.done&&s>=dailyGoal()){d.done=1;LS.dailyWins++;LS.dailyStreak=LS.dailyLast===dayKey(-1)?LS.dailyStreak+1:1;LS.dailyLast=today;toasts.push({h:T('dWin'),a:localText(T('dStreak')).replace('{s}',LS.dailyStreak),b:'',age:0,big:1});burst(W/2,110,36,['#ffd23f','#7bd88f','#ff8a3d'])}}
 if(EVNOW&&!LS.evDone.includes(EVNOW.id)){LS.ev[EVNOW.id]=(LS.ev[EVNOW.id]||0)+1;if(LS.ev[EVNOW.id]>=EV_RUNS){LS.evDone.push(EVNOW.id);const i=G.skins.findIndex(k=>k.ev===EVNOW.id);unl.push(G.skins[i]);toasts.push({h:T('evWin'),a:localText(T('newskin')).replace('{name}',localText(G.skins[i].n)),b:'',age:0,big:1});sfx('levelup')}}
 checkEpilogue();checkStickers();newFeatures();saveLS()}
// The epilogue (and its skin) opens once the hideout reaches level 5, i.e. 300 fruit delivered.
function checkEpilogue(){if(LS.epi||LS.delivered<300)return;LS.epi=1;saveLS();const i=G.skins.findIndex(k=>k.epi);unl.push(G.skins[i]);toasts.push({h:T('epiNew'),a:localText(T('chap')[4]),b:localText(T('newskin')).replace('{name}',localText(G.skins[i].n)),age:0,big:1});sfx('levelup')}
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
 if(sheet.kind==='album'){if(sheet.sel>=0){sheet.sel=-1;return}const i=albumAt(p);if(i>=0){sheet.sel=i;sheet.selAge=0;return}}
 else if(p.y>150&&p.y<350&&p.x>50&&p.x<350){meow(0,.08,0);hearts.push({x:p.x,y:p.y,age:0});return}
 closeSheet()}
const AX=[59,153,247,341],AY=0;
function albumAt(p){for(let i=0;i<STICKERS.length;i++){const x=AX[i%4],y=118+Math.floor(i/4)*86;if(Math.abs(p.x-x)<44&&Math.abs(p.y-y)<40)return i}return -1}
/* ---------- Sticker art: every icon is drawn as chunky vector shapes with the game's dark outline, on a die-cut sticker ---------- */
function stIcon(k,x,y,u){
 const o=Math.max(1.4,u*.11);g.save();g.translate(x,y);g.scale(u/16,u/16);const lw=o*16/u;
 const apple=(cx,cy,r,col)=>{g.beginPath();g.moveTo(cx,cy-r*.55);g.bezierCurveTo(cx-r*1.3,cy-r*1.2,cx-r*1.25,cy+r*.9,cx,cy+r);g.bezierCurveTo(cx+r*1.25,cy+r*.9,cx+r*1.3,cy-r*1.2,cx,cy-r*.55);O(col,lw);L2(cx,cy-r*.55,cx+r*.15,cy-r*1.05,lw,OL);E(cx+r*.45,cy-r*.95,r*.35,r*.18,'#7cbf4a',lw*.8);g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(cx-r*.45,cy-r*.15,r*.16,r*.3,.4,0,7);g.fill()};
 const cal=(n)=>{RR(-12,-10,24,22,4,'#fff',lw);RR(-12,-10,24,8,3,'#e63946',lw);RR(-7,-14,3,7,1.5,'#4a2c1d',0);RR(4,-14,3,7,1.5,'#4a2c1d',0);g.font='900 11px '+FB;g.textAlign='center';g.fillStyle=OL;g.fillText(n,0,9)};
 const face=(eyes)=>{P([[-12,-4],[-10,-15],[-3,-9]],'#c9ced6',lw);P([[12,-4],[10,-15],[3,-9]],'#c9ced6',lw);E(0,1,13,11,'#d8dce2',lw);eyes();E(0,4,1.8,1.2,'#ff8fab',0);};
 if(k==='cat'){face(()=>{RR(-12,-3,24,6,3,'#4a2c1d',0);g.fillStyle='#fff';[-5,5].forEach(ex=>{g.beginPath();g.arc(ex,0,1.6,0,7);g.fill()})});P([[-6,9],[6,9],[0,14]],'#e63946',lw*.8)}
 else if(k==='dizzy'){face(()=>{g.strokeStyle=OL;g.lineWidth=lw*.8;[-5,5].forEach(ex=>{g.beginPath();for(let t=0;t<9;t+=.4)g.lineTo(ex+Math.cos(t)*t*.32,-1+Math.sin(t)*t*.32);g.stroke()})});star(9,-13,4,'#ffd23f')}
 else if(k==='kitten'){face(()=>{g.fillStyle=OL;[-5,5].forEach(ex=>{g.beginPath();g.arc(ex,0,1.8,0,7);g.fill()})});g.beginPath();g.moveTo(10,-6);g.bezierCurveTo(6,-11,8,-16,11,-13);g.bezierCurveTo(14,-16,16,-11,12,-6);O('#ff4d6d',lw*.7)}
 else if(k==='apple')apple(0,1,11,'#e63946');
 else if(k==='orange'){C(0,2,11,'#f4a261',lw);E(3,-9,5,2.5,'#7cbf4a',lw*.8);g.fillStyle='rgba(122,74,36,.35)';[[-4,0],[3,4],[-1,7],[5,-2]].forEach(([a,b])=>{g.beginPath();g.arc(a,b,.9,0,7);g.fill()})}
 else if(k==='fish'){P([[8,0],[15,-7],[15,7]],'#5390d9',lw);E(-2,0,11,7,'#8ecae6',lw);g.fillStyle=OL;g.beginPath();g.arc(-7,-1.5,1.6,0,7);g.fill();L2(-1,-4,1,4,lw*.6,'rgba(74,44,29,.5)')}
 else if(k==='basket'){C(-5,-5,4.5,'#e63946',lw*.8);C(3,-6,4.5,'#f4a261',lw*.8);C(8,-2,4,'#7bd88f',lw*.8);g.beginPath();g.moveTo(-13,-2);g.lineTo(13,-2);g.lineTo(10,11);g.lineTo(-10,11);g.closePath();O('#c08552',lw);L2(-11,3,11,3,lw*.6,'rgba(74,44,29,.5)');L2(-10,7,10,7,lw*.6,'rgba(74,44,29,.5)')}
 else if(k==='slipper'||k==='calm'){g.save();g.rotate(-.5);RR(-6,-14,12,28,6,'#ff8fab',lw);RR(-7,-6,14,6,3,'#e63946',lw*.8);g.restore();if(k==='calm'){C(9,8,6,'#7bd88f',lw*.8);L2(6,8,8.5,10.5,lw*.8,'#fff');L2(8.5,10.5,12,6,lw*.8,'#fff')}else{[-1,1].forEach(sd=>L2(10,sd*3,15,sd*4,lw*.7,OL))}}
 else if(k==='crate'){[[-6,-6,'#7bd88f'],[0,-8,'#e63946'],[6,-6,'#7bd88f']].forEach(([a,b,c])=>C(a,b,4.5,c,lw*.8));RR(-12,-3,24,14,2,'#d9a066',lw);L2(-12,4,12,4,lw*.7,OL);L2(-4,-3,-4,11,lw*.6,'rgba(74,44,29,.5)');L2(4,-3,4,11,lw*.6,'rgba(74,44,29,.5)')}
 else if(k==='leaf'){g.rotate(-.25);P([[0,-14],[3,-7],[9,-9],[6,-3],[12,0],[3,1],[0,8],[-3,1],[-12,0],[-6,-3],[-9,-9],[-3,-7]],'#e76f51',lw);L2(0,8,0,13,lw,'#7a4a24');L2(0,-8,0,6,lw*.5,'rgba(74,44,29,.45)')}
 else if(k==='snow'){g.strokeStyle=OL;g.lineCap='round';[lw*3.2,lw*1.6].forEach((w0,j)=>{g.strokeStyle=j?'#fff':OL;g.lineWidth=w0;for(let q=0;q<3;q++){const an=q*Math.PI/3+Math.PI/2;g.beginPath();g.moveTo(-Math.cos(an)*12,-Math.sin(an)*12);g.lineTo(Math.cos(an)*12,Math.sin(an)*12);g.stroke()}});C(0,0,3,'#bde0fe',lw*.6)}
 else if(k==='bolt'||k==='bolt2'){const b0=(dx,sc0)=>{g.save();g.translate(dx,0);g.scale(sc0,sc0);P([[3,-14],[-8,2],[-1,2],[-4,14],[8,-3],[1,-3]],'#ffd23f',lw/sc0);g.restore()};if(k==='bolt2'){b0(-5,.8);b0(6,.8)}else b0(0,1)}
 else if(k==='gold')apple(0,1,11,'#ffc43d');
 else if(k==='gold3'){apple(-6,4,7,'#ffc43d');apple(6,4,7,'#ffc43d');apple(0,-5,7,'#ffd96a')}
 else if(k==='star'){star(0,1,14,OL);star(0,1,11.5,'#ffd23f');g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(-3,-3,2,0,7);g.fill()}
 else if(k==='crown'){P([[-13,8],[-14,-8],[-7,-1],[0,-12],[7,-1],[14,-8],[13,8]],'#ffd23f',lw);C(0,3,2.6,'#e63946',lw*.6);C(-7,4,2,'#5390d9',lw*.6);C(7,4,2,'#52b788',lw*.6)}
 else if(k==='cal1')cal('1');
 else if(k==='cal7'){cal('7');g.beginPath();g.moveTo(10,-6);g.quadraticCurveTo(17,-12,12,-19);g.quadraticCurveTo(10,-12,7,-14);g.quadraticCurveTo(5,-9,10,-6);O('#ff8a3d',lw*.7)}
 g.restore()}
// A die-cut sticker: white outline, coloured disc from its row, the icon and a glossy highlight. Locked ones are a stitched slot.
function sticker(st0,x,y,r,got){
 const [c0,c1]=ROWC[st0[5]];
 if(!got){g.fillStyle='rgba(74,44,29,.18)';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.setLineDash([4,3]);g.strokeStyle='rgba(122,74,36,.55)';g.lineWidth=2;g.beginPath();g.arc(x,y,r-2,0,7);g.stroke();g.setLineDash([]);
  g.globalAlpha=.32;stIcon(st0[1],x,y,r*.62);g.globalAlpha=1;RR(x-6,y+r*.35-5,12,10,3,'#8a6a4a',0);g.beginPath();g.arc(x,y+r*.35-5,4.2,Math.PI,0);g.strokeStyle='#8a6a4a';g.lineWidth=2.4;g.stroke();return}
 g.fillStyle='rgba(74,44,29,.3)';g.beginPath();g.arc(x+1.5,y+3,r,0,7);g.fill();
 C(x,y,r,'#ffffff',2.4);const gr=g.createRadialGradient(x-r*.3,y-r*.35,1,x,y,r*.82);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.beginPath();g.arc(x,y,r*.8,0,7);g.fillStyle=gr;g.fill();
 stIcon(st0[1],x,y+1,r*.6);
 g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.arc(x,y,r*.66,Math.PI*1.12,Math.PI*1.42);g.stroke()}
function stProg(st0){return st0[6]?st0[6](LS):null}
function drawAlbum(){
 const q=sheet.age;g.fillStyle='rgba(30,18,12,.86)';g.fillRect(0,0,W,H);
 // album page: cream paper with a stitched border
 RR(12,52,376,484,18,'#fff3df',3);g.setLineDash([5,4]);g.strokeStyle='rgba(122,74,36,.35)';g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(20,60,360,468,13):g.rect(20,60,360,468);g.stroke();g.setLineDash([]);
 // ribbon title
 RR(96,34,208,34,10,'#ff8a3d',3);[-1,1].forEach(sd=>P([[200+sd*104,40],[200+sd*124,46],[200+sd*114,52],[200+sd*124,60],[200+sd*104,62]],'#e76f51',3));
 tx(localText(T('album')).replace('{a}',LS.stickers.length).replace('{b}',STICKERS.length),W/2,58,17,'#fff6e6');
 STICKERS.forEach((st0,i)=>{const row=Math.floor(i/4),x=AX[i%4],y=118+row*86,got=LS.stickers.includes(st0[0]),a=eob(cl((q-i*.025)/.25,0,1));
  if(i%4===0){g.fillStyle=ROWC[row][0]+'66';g.beginPath();g.roundRect?g.roundRect(24,y-40,352,80,12):g.rect(24,y-40,352,80);g.fill()}
  g.save();g.translate(x,y-6);g.scale(a,a);sticker(st0,0,0,26,got);g.restore();
  wt(got?stName(st0):'???',x,y+36,10.5,got?OL:'#a08a72',0,86);
  const pr=stProg(st0);if(!got&&pr){const f=cl(pr[0]/pr[1],0,1);RR(x-24,y+21,48,5,2.5,'#ead9bf',0);if(f>0)RR(x-24,y+21,Math.max(5,48*f),5,2.5,ROWC[row][1],0)}
  if(newStickers.has(st0[0])&&got){C(x+20,y-28,5,'#e63946',1.4)}});
 wt(T('albumTip'),W/2,522,11.5,'#8a5a3b',0,330);
 if(q>.6)waveTx(T('closeTip'),W/2,552,14,'#fff6e6');
 if(sheet.sel>=0)stickerCard(STICKERS[sheet.sel])}
// Tapped sticker: a big card with the sticker, its name, how to earn it and progress.
function stickerCard(st0){
 const got=LS.stickers.includes(st0[0]),pr=stProg(st0),a=eob(cl(sheet.selAge/.25,0,1));
 g.fillStyle='rgba(30,18,12,.45)';g.fillRect(0,0,W,H);g.save();g.translate(W/2,300);g.scale(a,a);
 RR(-130,-112,260,224,18,'#fff6e6',3);sticker(st0,0,-50,44,got);
 tx(got?stName(st0):'???',0,22,19,got?'#ff8a3d':'#a08a72');wt(stDesc(st0),0,46,13,'#8a5a3b',0,230);
 if(pr){const f=cl(pr[0]/pr[1],0,1);RR(-90,62,180,12,6,'#ead9bf',1.5);if(f>0)RR(-90,62,Math.max(12,180*f),12,6,ROWC[st0[5]][1],1.5);wt(fmt(Math.min(pr[0],pr[1]))+' / '+fmt(pr[1]),0,94,12,OL)}
 else wt(got?'\u2713':'\u2014',0,86,16,got?'#4f9a2f':'#a08a72');
 g.restore()}
function drawHome(){
 const q=sheet.age,lv=homeLv(),x=36,y=64,w=328,h=290;g.fillStyle='rgba(30,18,12,.9)';g.fillRect(0,0,W,H);
 popTx(localText(T('home')).replace('{lv}',lv+1),W/2,40,20,'#ffd23f',q);
 RR(x,y,w,h,16,'#f6e2c0',3);g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();
 g.fillStyle='#d9b48a';g.fillRect(x,y+h*.62,w,h);g.fillStyle='rgba(122,74,36,.25)';for(let i=0;i<8;i++)g.fillRect(x+i*44,y+h*.62,2,h);
 // window with the night sky
 RR(x+w/2-50,y+24,100,74,8,'#35427e',3);g.fillStyle='#fff3c4';g.beginPath();g.arc(x+w/2+22,y+48,10,0,7);g.fill();L2(x+w/2,y+24,x+w/2,y+98,3);L2(x+w/2-50,y+61,x+w/2+50,y+61,3);
 if(lv>=3){[-1,1].forEach(sd=>{const lx=x+w/2+sd*92,ly=y+44+Math.sin(tt*2+sd)*2;g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(lx,ly,0,lx,ly,30);gr.addColorStop(0,'rgba(255,120,80,.5)');gr.addColorStop(1,'rgba(255,120,80,0)');g.fillStyle=gr;g.fillRect(lx-30,ly-30,60,60);g.globalCompositeOperation='source-over';E(lx,ly,9,12,'#e63946',2)})}
 if(lv>=5){RR(x+w/2-60,y+104,120,22,6,'#ffd23f',2.5);wt(T('homeSign'),x+w/2,y+120,11,OL,0,112)}
 if(lv>=1)RR(x+40,y+h-62,w-80,40,16,'#e98e62',3);
 if(lv>=4){E(x+70,y+h-40,26,12,'#8ecae6',2.5);E(x+w-70,y+h-40,26,12,'#ffafcc',2.5)}
 if(lv>=2){C(x+w-46,y+h-86,18,'rgba(142,202,230,.6)',2.5);spr('fish',x+w-46,y+h-78,16)}
 spr('basket',x+50,y+h-14,44);
 const kz=1+lv*.07;for(let k=0;k<5;k++){const kx=x+w/2+(k-2)*44,ky=y+h-34-Math.abs(Math.sin(tt*3+k))*4;spr(KIT[k],kx,ky,46*kz)}
 g.restore();RR(x,y,w,h,16,'rgba(0,0,0,0)',3);
 hearts.forEach(hh=>{g.globalAlpha=1-hh.age;tx('♥',hh.x,hh.y-hh.age*40,20,'#ff70a6');g.globalAlpha=1});
 const nx=HOME_AT[lv+1];
 wt(nx?localText(T('homeProg')).replace('{d}',fmt(LS.delivered)).replace('{n}',fmt(nx)):localText(T('homeMax')).replace('{d}',fmt(LS.delivered)),W/2,y+h+28,13,'#fff6e6',0,320);
 RR(60,y+h+38,280,10,5,'#5a4535',1.5);const pr=nx?cl((LS.delivered-HOME_AT[lv])/(nx-HOME_AT[lv]),0,1):1;if(pr>0)RR(60,y+h+38,Math.max(10,280*pr),10,5,'#7bd88f',1.5);
 if(nx)wt(localText(T('homeNext')).replace('{i}',localText(T('homeItems')[lv])),W/2,y+h+70,12,'#d8c7b0',0,320);
 wt(T('homeTip'),W/2,y+h+92,12,'#d8c7b0',0,320);
 if(q>.6)waveTx(T('closeTip'),W/2,532,14,'#fff6e6')}
/* ---------- Menu buttons: little wooden signs like the HUD boards (leaf, highlight, dark outline) with chunky icons ---------- */
const BX=22;
function woodBtn(x,y){
 g.fillStyle='rgba(74,44,29,.28)';g.beginPath();g.roundRect?g.roundRect(x-17,y-14,34,34,10):g.rect(x-17,y-14,34,34);g.fill();
 RR(x-17,y-18,34,34,10,'#f4c983',2.5);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(x-10,y-14.5,20,2.5);
 g.save();g.translate(x-13,y-15);g.rotate(-.6);E(0,0,5,3,'#7cbf4a',1.5);g.restore()}
function badgeDot(x,y){const k=1+.15*Math.sin(tt*6);g.save();g.translate(x+14,y-16);g.scale(k,k);C(0,0,6,'#e63946',1.6);wt('!',0,4,10,'#fff');g.restore()}
function iconBook(x,y){P([[x-13,y-4],[x,y-1],[x+13,y-4],[x+13,y+9],[x,y+12],[x-13,y+9]],'#e63946',1.8);P([[x-11,y-7],[x,y-4],[x,y+9],[x-11,y+6]],'#fff6e6',1.6);P([[x+11,y-7],[x,y-4],[x,y+9],[x+11,y+6]],'#fff6e6',1.6);
 L2(x-8,y-2,x-3,y-1,1.3,'#c9a27a');L2(x-8,y+2,x-3,y+3,1.3,'#c9a27a');g.beginPath();g.moveTo(x+6,y+5);g.bezierCurveTo(x+1,y+1,x+3,y-4,x+6,y-1);g.bezierCurveTo(x+9,y-4,x+11,y+1,x+6,y+5);g.fillStyle='#ff4d6d';g.fill()}
function iconAlbum(x,y){g.save();g.translate(x,y+1);g.rotate(-.12);RR(-10,-12,20,24,4,'#fff6e6',1.8);P([[4,12],[10,6],[10,12]],'#e8d5b5',1.4);g.restore();
 star(x-1,y-1,8.5,'#4a2c1d');star(x-1,y-1,6.8,'#ffd23f');C(x+5,y-8,3,'#7bd88f',1.2)}
function iconHome(x,y){RR(x-10,y-2,20,14,3,'#fff6e6',1.8);P([[x-14,y],[x,y-13],[x+14,y]],'#e63946',1.8);P([[x-6,y-8],[x-4,y-15],[x-1,y-10]],'#e63946',1.4);P([[x+1,y-10],[x+4,y-15],[x+6,y-8]],'#e63946',1.4);
 g.beginPath();g.moveTo(x-4,y+12);g.lineTo(x-4,y+6);g.arc(x,y+6,4,Math.PI,0);g.lineTo(x+4,y+12);g.closePath();g.fillStyle='#8a5a3b';g.fill()}
function iconDaily(x,y){RR(x-11,y-8,22,20,4,'#fff6e6',1.8);RR(x-11,y-8,22,7,3,'#e63946',1.8);RR(x-7,y-12,3,6,1.5,'#8a5a3b',1);RR(x+4,y-12,3,6,1.5,'#8a5a3b',1);wt(String(new Date().getDate()),x,y+10,10,OL)}
function iconSound(x,y){g.save();g.translate(x,y);g.beginPath();g.moveTo(-10,-4);g.lineTo(-5,-4);g.lineTo(1,-9);g.lineTo(1,9);g.lineTo(-5,4);g.lineTo(-10,4);g.closePath();g.fillStyle=OL;g.fill();
 if(soundOn){g.strokeStyle=OL;g.lineWidth=2.2;g.lineCap='round';[5,9].forEach(r=>{g.beginPath();g.arc(1,0,r,-.8,.8);g.stroke()})}else{L2(5,-5,11,5,2.6,'#e0503f');L2(11,-5,5,5,2.6,'#e0503f')}g.restore()}
// The menu grows with the player: story from the start, album after 2 runs, hideout after the first delivery, Daily Heist after 3 runs.
function menuItems(){const a=['story'];if(LS.runs>=2)a.push('album');if(LS.delivered>=1)a.push('home');if(LS.runs>=3)a.push('daily');return a.map((k,i)=>({k,y:SBY+i*52}))}
const FEAT={album:'{{t:thief.msg.176}}',home:'{{t:thief.msg.177}}',daily:'{{t:thief.msg.178}}'};
function newFeatures(){menuItems().forEach(m=>{if(m.k!=='story'&&!LS.menuSeen.includes('shown:'+m.k)){LS.menuSeen.push('shown:'+m.k);toasts.push({h:T('newFeat'),a:localText(FEAT[m.k]),b:'',age:0,big:1})}});saveLS()}
function btnLabel(x,y,k){const t=localText(T('lbl')[k]);g.font='800 9px '+FB;g.textAlign='center';g.lineJoin='round';g.strokeStyle='#4a2c1d';g.lineWidth=3;g.strokeText(t,x,y+28,48);g.fillStyle='#fff6e6';g.fillText(t,x,y+28,48)}
function sideBtn(y,kind,badge){woodBtn(BX,y);(kind==='album'?iconAlbum:kind==='home'?iconHome:iconDaily)(BX,y);btnLabel(BX,y,kind);if(badge)badgeDot(BX,y)}
function storyBtn(){woodBtn(BX,SBY);iconBook(BX,SBY);btnLabel(BX,SBY,'story');if(unseen()>=0)badgeDot(BX,SBY)}
function soundBtn(){woodBtn(SBX,SBY);iconSound(SBX,SBY);btnLabel(SBX,SBY,'settings')}
function missionCard(y){
 const x=50,w=300,lv=curLevel()||3;RR(x,y,w,92,14,'#fff6e6',3);
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
 if(LOGO.complete&&LOGO.naturalWidth)g.drawImage(LOGO,80,40+by,240,240*LOGO.naturalHeight/LOGO.naturalWidth);else tx(T('title'),W/2,120,32,'#ffd23f');
 waveTx(T('tag'),W/2,174,16,'#fff6e6');
 missionCard(186);
 waveTx('{{t:thief.msg.018}}',W/2,318,18,'#ff8a3d');
 if(EVNOW){const done=LS.evDone.includes(EVNOW.id),sk=G.skins.find(k=>k.ev===EVNOW.id);tx(localText(T(done?'evDoneLine':'evLine')).replace('{e}',localText(EVNOW.n)).replace('{r}',Math.min(EV_RUNS,LS.ev[EVNOW.id]||0)).replace('{n}',EV_RUNS).replace('{s}',localText(sk.n)),W/2,350,13,'#ffe08a')}
 else tx(T('tip'),W/2,350,13,'#fff6e6')}
else{
 const ot=overT-HOLD(),k=eob(ot/.45),dy=(1-k)*-50;g.save();g.translate(0,dy);
 card(50,52,300,218);
 slamTx(T(G.msg),W/2,84,24,'#e0503f',Math.max(0,ot));
 wt(fmt(Math.round(G.score()*cl(ot/.7,0,1))),W/2,134,46,OL);
 if(G.extra)wt(G.extra(),W/2,158,14,'#8a5a3b');
 if(rec){const s=font('{{t:thief.msg.019}}',14*.92,0),w=g.measureText(s).width+28,p=1+.06*Math.sin(tt*6);g.save();g.translate(W/2,180);g.scale(p,p);RR(-w/2,-12,w,24,12,'#ffd23f',2.5);wt(s,0,5,14,OL);g.restore()}
 if(unl.length)wt(localText('{{t:thief.msg.020}}')+unl.map(q=>localText(q.n)).join(' · '),W/2,212,13,'#4f9a2f',0,276);
 if(dailyRun){const d=LS.daily;wt(localText(T(d.done?'dCleared':'dLine')).replace('{n}',fmt(dailyGoal())).replace('{b}',fmt(d.best)).replace('{s}',LS.dailyStreak),W/2,232,13,d.done?'#4f9a2f':'#d9822b',0,276)}
 else wt(paid>0?localText('{{t:thief.msg.021}}')+paid+' '+localText('點'):'{{t:thief.msg.022}}',W/2,232,14,paid>0?'#d9822b':'#8a5a3b',0,276);
 wt(hook||'{{t:thief.msg.023}}',W/2,251,13,hook?'#e0503f':'#d9822b',0,276);
 g.restore();
 missionCard(280)}
if(LS.runs>0)drawShelf();
soundBtn();menuItems().forEach(m=>{if(m.k==='story')storyBtn();else sideBtn(m.y,m.k,m.k==='album'?newStickers.size>0||!LS.menuSeen.includes('album'):m.k==='home'?!LS.menuSeen.includes('home'):!dailyDoneToday())})}
/* ---------- Pause and settings: one card. During a run it pauses play; on menus the speaker button opens it as Settings ---------- */
const PB={x:378,y:82};
function toggleRow(y,label,on){wt(label,110,y+5,14,OL,'left',150);const x0=262;RR(x0,y-11,52,24,12,on?'#7bd88f':'#e0d3c2',2.2);C(on?x0+40:x0+12,y+1,9,'#fff',2)}
function drawPanel(){
 const a=eob(cl(panel.age/.25,0,1));g.fillStyle='rgba(30,18,12,.55)';g.fillRect(0,0,W,H);
 g.save();g.translate(W/2,290);g.scale(a,a);g.translate(-W/2,-290);
 RR(80,160,240,262,18,'#fff6e6',3);RR(130,142,140,34,10,'#ff8a3d',3);tx(T(panel.mode==='pause'?'paused':'settings'),W/2,166,17,'#fff6e6');
 toggleRow(214,localText(T('optMusic')),musicOn);toggleRow(262,localText(T('optSfx')),sfxOn);toggleRow(310,localText(T('optMotion')),!motionOff);
 RR(118,350,164,46,23,'#ff8a3d',3);tx(T(panel.mode==='pause'?'resume':'done'),W/2,380,17,'#fff6e6');
 g.restore()}
function panelTap(p){
 if(p.x>250&&p.x<320){if(Math.abs(p.y-214)<20){musicOn=!musicOn;syncAudio();return}if(Math.abs(p.y-262)<20){sfxOn=!sfxOn;syncAudio();sfx('fruit');return}if(Math.abs(p.y-310)<20){motionOff=!motionOff;try{localStorage.setItem('deep-sea-thief-motion',motionOff?'1':'0')}catch(e){}return}}
 if(p.y>340&&p.y<406&&p.x>110&&p.x<290||p.y<150||p.y>430){closePanel()}}
function openPanel(mode){panel={mode,age:0};if(mode==='pause'){paused=true;windOff()}}
function closePanel(){if(panel&&panel.mode==='pause'){paused=false;last=performance.now()}panel=null}
function pauseBtn(){woodBtn(PB.x,PB.y);RR(PB.x-6,PB.y-8,4.5,14,2,OL,0);RR(PB.x+1.5,PB.y-8,4.5,14,2,OL,0)}
// The skin shelf is static between changes, so it is drawn once into an offscreen canvas and reused.
let shelfCv=null,shelfKey='';
function drawShelf(){
 const key=[skin,sprOk(),document.fonts?document.fonts.status:'',G.skins.map((k,i)=>isOpen(i)?1:0).join('')].join('|');
 if(key!==shelfKey||!shelfCv){shelfKey=key;shelfCv=shelfCv||document.createElement('canvas');shelfCv.width=W*DPR;shelfCv.height=H*DPR;
  const sx=shelfCv.getContext('2d');sx.clearRect(0,0,shelfCv.width,shelfCv.height);sx.setTransform(DPR,0,0,DPR,0,0);g=sx;
  try{RR(36,382,328,174,16,'#f4c983',3);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(52,388,296,3);
G.skins.forEach((k,i)=>{const {x,y}=skinAt(i),lk=!isOpen(i);
 C(x,y,18,lk?'#cbb89a':'#fff6e6',3);
 if(!lk){g.save();g.beginPath();g.arc(x,y,16,0,7);g.clip();spr('c0',x,y+23,40,tint(i));g.restore()}
 else{RR(x-6,y-7,12,10,3,'#8a6a4a',0);g.beginPath();g.arc(x,y-7,4.5,Math.PI,0);g.strokeStyle='#8a6a4a';g.lineWidth=2.5;g.stroke();wt(k.need!==undefined?String(k.need):k.lv?'Lv'+k.lv:k.ev?'✿':k.epi?'♥':'★',x,y+14,k.m?10:9,OL)}
 if(i===skin&&!lk){g.strokeStyle='#ff8a3d';g.lineWidth=3;g.beginPath();g.arc(x,y,21,0,7);g.stroke()}});
wt(SK().n,W/2,544,13,OL)}finally{g=g0}}
 g.drawImage(shelfCv,30*DPR,376*DPR,340*DPR,184*DPR,30,376,340,184)}
function drawToasts(){
 const q=toasts[0];if(!q)return;
 const k=eob(q.age/.35),y=46+(1-Math.min(1,q.age/.35))*-30,h=q.b?72:56;
 g.globalAlpha=Math.max(0,Math.min(1,q.age*5,(2.6-q.age)*3));
 g.save();g.translate(W/2,y+h/2);g.scale(k,k);g.translate(-W/2,-(y+h/2));
 RR(50,y,300,h,16,q.big?'#fff1c2':'#fff6e6',3);
 (q.big?slamTx:popTx)(localText(q.h),W/2,y+22,q.big?18:16,q.big?'#ff8a3d':'#ffb703',q.age);
 wt(q.a,W/2,y+43,14,'#2f7a1f',0,276);if(q.b)wt(q.b,W/2,y+62,12,'#d9822b',0,276);
 g.restore();g.globalAlpha=1}
function drawParts(){parts.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/1.4);g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.col;g.fillRect(-4,-2.5,8,5);g.restore()});g.globalAlpha=1}
function bonusDraw(){bpop.forEach(p=>{g.globalAlpha=Math.max(0,Math.min(1,(1.8-p.age)*3));ptx('BONUS +'+BONUS+' '+localText('點'),W/2,150,32,'#ffd23f',p.age,Math.sin(p.age*10)*.05*Math.max(0,1-p.age));tx(localText(T('mile')).replace('{m}',fmt(p.m)),W/2,176,15,'#fff');g.globalAlpha=1})}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);
 if(panel){e.preventDefault();if(panel.age>.2)panelTap(p);return}
 if(st==='run'&&Math.hypot(p.x-PB.x,p.y-PB.y)<22){e.preventDefault();openPanel('pause');return}lastInput=e.pointerType==='mouse'?'key':'touch';audioInit();
 if(st!=='run'){
  if(story){if(story.age>.4)closeStory();return}
  if(sheet){sheetTap(p);return}
  for(const m of menuItems()){if(m.k!=='story'&&Math.hypot(p.x-BX,p.y-m.y)<20){if(!LS.menuSeen.includes(m.k))LS.menuSeen.push(m.k),saveLS();if(m.k==='daily')start(true);else openSheet(m.k);return}}
  if(Math.hypot(p.x-SBX,p.y-SBY)<22){openPanel('settings');return}
  for(let i=0;i<(LS.runs>0?G.skins.length:0);i++){const q=skinAt(i);if(Math.hypot(p.x-q.x,p.y-q.y)<22){if(isOpen(i)){pick(i);say(G.skins[i].n)}else say(lockText(i));return}}
  if(Math.hypot(p.x-BX,p.y-SBY)<22){const u=unseen();openStory(u>=0?u:LS.epi?4:SS.r);return}
  if(st==='ready'||overT>HOLD()+.5)start(st==='over'&&dailyRun);else say('{{t:thief.msg.024}}');return}
 e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 lastTapEdge=p.x<110?0:p.x>290?2:-1;
 if(lastTapEdge>=0){control(lastTapEdge);gest={id:e.pointerId,x:p.x,y:p.y,done:true};return}
 gest={id:e.pointerId,x:p.x,y:p.y,done:false}});
// A swipe acts as soon as it travels far enough; a touch that never swipes acts as a tap on release.
c.addEventListener('pointermove',e=>{
 if(st!=='run'||paused||!gest||gest.done||e.pointerId!==gest.id)return;
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
addEventListener('keydown',e=>{
 if(!V.hidden&&!document.hidden&&!e.repeat&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){
  if(e.code==='KeyP'&&st==='run'){e.preventDefault();panel?closePanel():openPanel('pause');return}
  if(panel&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();closePanel();return}
  if(panel&&KM[e.code]){e.preventDefault();return}}
 if(e.code==='KeyM'&&!V.hidden&&!document.hidden&&!e.metaKey&&!e.altKey&&!e.ctrlKey&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){toggleSound();return}
 if(st!=='run'&&(e.code==='Space'||e.code==='Enter')&&!V.hidden&&!document.hidden&&!e.repeat&&!['INPUT','TEXTAREA','SELECT','BUTTON','A','SUMMARY'].includes(e.target.tagName)){
  e.preventDefault();audioInit();if(story){if(story.age>.4)closeStory()}else if(sheet){if(sheet.age>.3)closeSheet()}else if(st==='ready'||overT>HOLD()+.5)start(st==='over'&&dailyRun);return}
 const m=KM[e.code];if(m){lastInput='key';audioInit()}if(!(m||e.code==='ArrowDown')||V.hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;e.preventDefault();if(!m||e.repeat)return;G.down({x:m[0],y:m[1],id:'k'+e.code})});
addEventListener('keyup',e=>{if(KM[e.code]&&st==='run'&&G.up&&!V.hidden)G.up({id:'k'+e.code})});
addEventListener('blur',()=>{release();last=performance.now();if(st==='run'&&!panel&&!V.hidden)openPanel('pause')});
document.addEventListener('visibilitychange',()=>{release();last=performance.now();if(document.hidden&&st==='run'&&!panel)openPanel('pause');if(document.hidden){saveMS();if(tut)saveTut();windOff()}});
window.addEventListener('hashchange',()=>{release();last=performance.now();if(V.hidden)windOff()});
// The side button always starts a normal run; passing the click event would read as the Daily Heist flag.
$('thief-go').addEventListener('click',()=>start(false));
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;if(st==='over')overT+=dt;hudBump=Math.max(0,hudBump-dt*4);flying.forEach(f=>f.age+=dt);flying=flying.filter(f=>f.age<.75);landT=Math.max(0,landT-dt);dust.forEach(d=>d.age+=dt);dust=dust.filter(d=>d.age<.45);
  bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);pops.forEach(p=>p.age+=dt);pops=pops.filter(p=>p.age<p.life);
  parts.forEach(p=>{p.age+=dt;p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt});parts=parts.filter(p=>p.age<1.4);
  if(toasts.length&&(toasts[0].age+=dt)>2.6)toasts.shift();
  if(panel)panel.age+=dt;
  if(paused){}
  else if(st==='run'&&dailyRun){stepAcc+=dt;while(stepAcc>=.01&&st==='run'){stepAcc-=.01;G.update(.01);if(st==='run')awardBonus()}}
  else if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  if(st==='run'){const r=cl(1-gb/170,0,1);if(r>.62){hbNext-=dt;if(hbNext<=0){sfx('heart');hbPulse=1;hbNext=.85-(r-.62)/.38*.42}}else hbNext=0}
  hbPulse=Math.max(0,hbPulse-dt*3);
  if(st==='run'&&gate){gate.y+=v*dt;if(!gate.hit&&gate.y>=CYT+10){gate.hit=1;passGate(gate.z)}if(gate.y>H+120)gate=null}
  flash=Math.max(0,flash-dt);zT=Math.min(1,zT+dt/1.2);PZ=zT>=1?ZONES[zCur]:mixZ(zFrom,ZONES[zCur],zT*zT*(3-2*zT));if(banner&&(banner.age+=dt)>2.6)banner=null;if(story)story.age+=dt;if(sheet){sheet.age+=dt;sheet.selAge=(sheet.selAge||0)+dt;hearts.forEach(h=>h.age+=dt);hearts=hearts.filter(h=>h.age<1)}
  G.draw();bonusDraw();if(story||st==='ready'||(st==='over'&&(overT>=HOLD()||RM())))overlay();drawParts();drawToasts();if(st==='run'&&!panel)pauseBtn();if(panel)drawPanel();ui()}
 music();
 requestAnimationFrame(loop)}
checkEpilogue();if(!isOpen(skin))skin=0;
checkStickers();
// First visit lands on the play screen (one tap to run); chapter 1 waits behind the book button's "!".
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
