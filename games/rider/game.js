  /* ---------- 外送員大戰惡犬: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var riderBusy=false,riderStake=0,riderSay=function(){};
  (function(){
const c=$('rider-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,OL='#13283d',G={};c.width=W*DPR;c.height=H*DPR;
const FNT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';
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
function tx(s,x,y,sz,col,al,mw){mw=mw||W-80;g.font='900 '+sz+'px '+FNT;g.textAlign=al||'center';g.lineJoin='round';g.fillStyle='rgba(5,15,30,.45)';g.fillText(s,x,y+Math.max(2,sz/12),mw);g.strokeStyle=OL;g.lineWidth=sz/5;g.strokeText(s,x,y,mw);g.fillStyle=col;g.fillText(s,x,y,mw)}
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else E(0,-8,13,4,'#ffe27a',3);
g.restore()}
G.I={bs:n=>'最高 '+n,tap:'',title:"{{t:rider.msg.001}}",s1:"{{t:rider.msg.002}}",s2:"{{t:rider.msg.003}}",cold:"{{t:rider.msg.004}}",dl:n=>'已送達 '+n+' 份訂單',bip:"{{t:rider.msg.005}}",bom:"{{t:rider.msg.006}}"};
G.skins=[{need:0,n:'{{t:rider.msg.007}}',c:['#2ec4b6','#ff9f1c'],a:0},{need:300,n:'{{t:rider.msg.008}}',c:['#7bd88f','#e63946'],a:1},{need:800,n:'{{t:rider.msg.009}}',c:['#ff5d8f','#ffd23f'],a:3},{need:1600,n:'{{t:rider.msg.010}}',c:['#ffd23f','#e63946'],a:2}];
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
 const code=Math.hypot(p.x-200,p.y-503)<40?2:p.x<200?0:1;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{riderRules.advance(model,dt);syncModel();if(model.dead)die(model.dead);};
const SPR=new Image();SPR.src='games/rider/art/sprites.webp';const LAY=new Image();LAY.src='games/rider/art/layers.webp';
const A={"rb":[0,0,225,230],"rh":[227,0,224,230],"rj":[453,0,230,229],"rl":[685,0,230,226],"r2":[0,232,190,211],"r3":[192,232,197,211],"r1":[391,232,196,210],"r0":[589,232,198,209],"door":[789,232,230,201],"d2b":[0,445,190,161],"d1b":[192,445,200,155],"v0":[394,445,90,150],"d1s":[486,445,200,146],"d1c":[688,445,200,143],"d0b":[0,608,190,142],"d2c":[192,608,190,142],"d2s":[384,608,190,140],"hn":[576,608,137,140],"hnP":[715,608,140,140],"d0c":[0,752,190,127],"d0s":[192,752,190,125],"bJ":[384,752,250,123],"bB":[636,752,250,116],"bJp":[0,881,250,105],"bBp":[252,881,250,102],"pot":[504,881,150,86],"scoot":[656,881,96,72],"tHot":[754,881,64,70],"tCold":[820,881,64,70],"moon":[886,881,67,70],"cloud":[0,988,170,60],"crown":[172,988,80,60],"tWarm":[254,988,70,58],"cloud2":[326,988,140,51],"star":[468,988,26,30]};
const LA={"near":[0,0,1252,185],"mid":[0,187,1329,142],"far":[0,331,1421,150]};
const ok=i=>i.complete&&i.naturalWidth>0,RF=['r0','r1','r2','r3','rj','rb','rh','rl','v0'],DOGS=[['d0',54],['d1',64],['d2',58]],dogType=new WeakMap();
const wrap=(v,m)=>((v%m)+m)%m,GS=400;
function spr(k,x,y,h,src,flip){const a=A[k];if(!a)return;const img=src&&src[k];if(!img&&!ok(SPR))return;const w=a[2]*h/a[3];g.save();g.translate(x,y);if(flip)g.scale(-1,1);g.drawImage(img||SPR,img?0:a[0],img?0:a[1],a[2],a[3],-w/2,-h,w,h);g.restore()}
const tints={};
function tint(i){
 if(!i||!ok(SPR))return null;if(tints[i]!==undefined)return tints[i];
 const hex=G.skins[i].c[0],R=parseInt(hex.slice(1,3),16),Gc=parseInt(hex.slice(3,5),16),B=parseInt(hex.slice(5,7),16),out={};
 try{RF.forEach(k=>{const a=A[k],cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const x=cv.getContext('2d');x.drawImage(SPR,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);
  const d=x.getImageData(0,0,a[2],a[3]),p=d.data;
  for(let j=0;j<p.length;j+=4){const r=p[j],gg=p[j+1],b=p[j+2],hi=Math.max(gg,b);
   if(r>90&&hi<r*.6&&Math.abs(gg-b)<70){const k2=(r-hi)/255;p[j]=Math.min(255,hi+k2*R);p[j+1]=Math.min(255,hi+k2*Gc);p[j+2]=Math.min(255,hi+k2*B)}}
  x.putImageData(d,0,0);out[k]=cv});tints[i]=out}catch(e){tints[i]=null}
 return tints[i]}
function layer(k,h,bottom,par){if(!ok(LAY))return;const a=LA[k],w=a[2]*h/a[3];for(let x=-wrap(dist*par,w);x<W;x+=w-1)g.drawImage(LAY,a[0],a[1],a[2],a[3],x,bottom-h,w,h)}
function shadow(x,w){g.fillStyle='rgba(30,20,60,.28)';g.beginPath();g.ellipse(x,GS+3,w,6,0,0,7);g.fill()}
function bg(){
const sg=g.createLinearGradient(0,0,0,330);sg.addColorStop(0,'#4b3a9e');sg.addColorStop(.55,'#a66bc9');sg.addColorStop(1,'#ffb48f');g.fillStyle=sg;g.fillRect(-20,0,W+40,330);
spr('moon',318,110,40);spr('star',70,96,12);spr('star',250,70,9);
spr('cloud',wrap(60-dist*.03+tt*3,W+220)-110,104,32);spr('cloud2',wrap(300-dist*.05+tt*5,W+200)-100,150,26);
layer('far',80,264,.08);layer('mid',94,302,.22);layer('near',145,316,.55);
g.fillStyle='#cdb9dc';g.fillRect(-20,312,W+40,30);g.fillStyle='#e3d3ea';g.fillRect(-20,312,W+40,4);
g.strokeStyle='rgba(120,95,150,.35)';g.lineWidth=1.5;for(let x=-wrap(dist,44);x<W;x+=44){g.beginPath();g.moveTo(x,317);g.lineTo(x-6,341);g.stroke()}
g.fillStyle='#8f78ad';g.fillRect(-20,341,W+40,11);
const rg=g.createLinearGradient(0,352,0,446);rg.addColorStop(0,'#4f4370');rg.addColorStop(1,'#5f5284');g.fillStyle=rg;g.fillRect(-20,352,W+40,94);
g.fillStyle='rgba(0,0,0,.18)';g.fillRect(-20,352,W+40,5);
g.fillStyle='#f6dfe8';for(let x=-wrap(dist,110);x<W;x+=110){g.beginPath();g.roundRect?g.roundRect(x,424,48,7,3.5):g.rect(x,424,48,7);g.fill()}}
function house(o){
const x=o.x;spr('door',x,342,104);
if(!o.dn){g.fillStyle='rgba(255,210,63,.35)';g.beginPath();g.ellipse(x,GS-4,100,16,0,0,7);g.fill();g.strokeStyle='#ffd23f';g.lineWidth=3;g.setLineDash([10,7]);g.stroke();g.setLineDash([])}
else{g.fillStyle='rgba(108,240,168,.3)';g.beginPath();g.ellipse(x,GS-4,100,16,0,0,7);g.fill();tx('✓',x,256,30,'#6cf0a8')}
if(o.tm>0&&!o.dn){RR(x-34,246,68,12,6,'rgba(255,255,255,.5)',2);RR(x-34,246,Math.max(12,68*cl(o.tm/.45,0,1)),12,6,'#6cf0a8',2)}}
function dog(o){
let t=dogType.get(o);if(t===undefined){t=Math.floor(Math.random()*3);dogType.set(o,t)}
const d=DOGS[t],run=Math.abs(Math.sin(tt*14+t)),bob=run*5;
shadow(o.x,d[1]*.5);
if(o.fl)spr(d[0]+'s',o.x,GS-bob,d[1]);
else spr(d[0]+(o.x>PXL&&o.x-PXL<170&&!o.h?'b':'c'),o.x,GS-bob,d[1],null,1)}
function bike(){
const y=GS-(GY-py),air=py<GY-2;
shadow(PXL,air?28:40);
const src=tint(skin);
const f=stun>0?'rl':air?'rj':hcool>.6?'rh':boosting?'rb':'r0';
if(boosting){g.lineCap='round';[[0,'#5ab8ff'],[1,'#a6dcff'],[2,'#5ab8ff']].forEach(([i,c2])=>{const l=40+((tt*300+i*37)%30);g.strokeStyle=c2;g.lineWidth=5;g.beginPath();g.moveTo(PXL-48,y-28-i*16);g.lineTo(PXL-48-l,y-28-i*16);g.stroke()})}
const bh=96,bo=0;
spr(f,PXL,y-bo,bh,src);
acc(SK().a,PXL+4,y-bo-bh+6,.85)}
function pill(x,y,w){g.fillStyle='rgba(10,25,40,.35)';g.beginPath();g.roundRect?g.roundRect(x+1,y+4,w,38,14):g.rect(x+1,y+4,w,38);g.fill();g.beginPath();g.moveTo(x+14,y);g.arcTo(x+w,y,x+w,y+38,14);g.arcTo(x+w,y+38,x,y+38,14);g.arcTo(x,y+38,x,y,14);g.arcTo(x,y,x+w,y,14);g.closePath();g.fillStyle='#173b4f';g.fill();g.lineWidth=2.5;g.strokeStyle='#4f8fa8';g.stroke()}
function wt(s,x,y,sz,col,al,mw){g.font='900 '+sz+'px '+FNT;g.textAlign=al||'center';g.fillStyle=col;g.fillText(s,x,y,mw||W-88)}
function hud(){
const L=OY>0?58:10,sw=OY>0?108:126,bw2=OY>0?94:104;
pill(L,10,sw);spr('scoot',L+26,43,24);wt(String(G.score()),L+sw-10,38,22,'#fff','right',sw-50);
const bx=L+sw+6;pill(bx,10,bw2);spr('crown',bx+22,42,24);wt(String(best),bx+bw2-10,38,22,'#fff','right',bw2-44);
const hx=bx+bw2+6,hw=W-10-hx;pill(hx,10,hw);const h=cl(hot/100,0,1);spr(h>.6?'tHot':h>.3?'tWarm':'tCold',hx+22,44,28);
const tx0=hx+42,tw=hw-52;
g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.roundRect?g.roundRect(tx0,22,tw,14,7):g.rect(tx0,22,tw,14);g.fill();
if(h>0){const hg=g.createLinearGradient(tx0,0,tx0+tw,0);hg.addColorStop(0,'#5ab8ff');hg.addColorStop(.45,'#ffd23f');hg.addColorStop(1,'#ff5a3c');g.save();g.beginPath();g.roundRect?g.roundRect(tx0,22,Math.max(14,tw*h),14,7):g.rect(tx0,22,tw*h,14);g.clip();g.fillStyle=hg;g.fillRect(tx0,22,tw,14);g.restore()}
if(OY>0){const next=MILESTONES.find(x=>!awarded.has(x));g.fillStyle='rgba(10,25,40,.35)';g.beginPath();g.roundRect?g.roundRect(11,59,W-20,28,14):g.rect(11,59,W-20,28);g.fill();g.beginPath();g.roundRect?g.roundRect(10,56,W-20,28,14):g.rect(10,56,W-20,28);g.fillStyle='#173b4f';g.fill();g.lineWidth=2;g.strokeStyle='#4f8fa8';g.stroke();
 g.textBaseline='middle';wt('{{t:rider.view.04}} '+fmt(paid)+' 點',22,71,12,'#ffd23f','left',170);wt(next?'{{t:rider.view.06}} '+fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:rider.msg.011}}',W-22,71,12,'#bfe6f2','right',190);g.textBaseline='alphabetic'}}
function controls(){
g.fillStyle='#12304a';g.fillRect(0,446,W,H-446);g.fillStyle='#1d4866';g.fillRect(0,446,W,4);
const run=st==='run';
spr(run&&!on?'bJp':'bJ',85,534,run&&!on?51:61);
spr(run&&boosting?'bBp':'bB',315,534,run&&boosting?51:58);
g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.roundRect?g.roundRect(268,542,94,6,3):g.rect(268,542,94,6);g.fill();
if(gas>3){g.fillStyle=gas>25?'#ffd23f':'#ff7a5c';g.beginPath();g.roundRect?g.roundRect(268,542,Math.max(6,94*gas/100),6,3):g.rect(268,542,94*gas/100,6);g.fill()}
spr(run&&hcool>.8?'hnP':'hn',200,537,66);
if(hcool>0){g.fillStyle='rgba(18,48,74,.55)';g.beginPath();g.moveTo(200,504);g.arc(200,504,31,-Math.PI/2,-Math.PI/2+Math.PI*2*hcool);g.closePath();g.fill()}}
// Phone full screen: the canvas grows to the screen's height; play (400x560, controls at its bottom) sits at the bottom
// and the extra night sky above holds the HUD and the BONUS row.
let VH=H,OY=0;const MOBILE=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
function fit(){const p=c.parentElement;let vh=H;if(MOBILE.matches&&p&&p.clientWidth>0&&p.clientHeight>0)vh=Math.max(H,Math.round(W*p.clientHeight/p.clientWidth));if(vh!==VH){VH=vh;c.height=Math.round(VH*DPR)}OY=VH-H}
const OVY=()=>Math.max(0,VH-616);   // ready/over screens sit higher so the start button below never covers them
function topBand(){if(OY<=0)return;const sg=g.createLinearGradient(0,0,0,OY+2);sg.addColorStop(0,'#1d1650');sg.addColorStop(1,'#4b3a9e');g.fillStyle=sg;g.fillRect(0,0,W,OY+2);
 [[40,130],[120,100],[210,170],[300,120],[360,200],[80,220],[250,110],[170,260],[330,280],[30,300]].forEach(([x,y],i)=>{if(y<OY-10)spr('star',x,y,6+(i%3)*3)});
 if(OY>180){spr('cloud',wrap(110-dist*.02+tt*2,W+220)-110,OY*.55,30);spr('cloud2',wrap(290-dist*.03+tt*3,W+200)-100,OY*.8,24)}}
G.draw=()=>{
fit();
g.setTransform(DPR,0,0,DPR,0,0);
topBand();
g.save();g.translate(0,OY);
bg();obs.forEach(o=>{if(o.t==='h')house(o)});
obs.forEach(o=>{if(o.t==='p')spr('pot',o.x+28,GS+16,30)});
obs.forEach(o=>{if(o.t==='dog')dog(o)});
bike();
fx.forEach(f=>{const label=typeof f.s==='function'?T(f.x>PXL?'bip':'bom'):f.s;g.globalAlpha=Math.max(0,1-f.t/.8);tx(label,f.x,f.y-40-f.t*50,26,'#ffd23f');g.globalAlpha=1});
if(OY<=0)hud();controls();g.restore();if(OY>0)hud()};
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
 setText('rider-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:rider.msg.011}}');
 $('rider-amount').disabled=riderBusy;$('rider-go').disabled=live||rank.busy();setText('rider-go',live?'{{t:rider.msg.012}}':st==='over'?'{{t:rider.msg.013}}':'{{t:rider.msg.014}}');
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
 say('訂單涼掉了，這一局結束了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'{{t:rider.msg.015}}'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('rider',amount);riderStake=amount;riderBusy=true;save();renderAll();
 model=riderRules.create(random||Math.random);syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('{{t:rider.msg.016}}');ui();c.focus();
 },ui);
}
function card(x,y,w,h){g.fillStyle='rgba(5,15,30,.35)';g.beginPath();g.roundRect?g.roundRect(x+2,y+6,w,h,20):g.rect(x+2,y+6,w,h);g.fill();g.beginPath();g.roundRect?g.roundRect(x,y,w,h,20):g.rect(x,y,w,h);g.fillStyle='#173b4f';g.fill();g.lineWidth=3;g.strokeStyle='#6fb3cc';g.stroke()}
const PADX=40,PADY=22,TW=328-PADX*2;
function wrapT(s,sz,mw){
 const t=window.deepSeaI18n?deepSeaI18n.text(String(s)):String(s);g.font='900 '+sz+'px '+FNT;
 const parts=/\s/.test(t)?t.split(/(\s+)/):[...t],out=[];let cur='';
 parts.forEach(p=>{const nx=cur+p;if(cur.trim()&&g.measureText(nx).width>mw&&!/^\s+$/.test(p)&&!/^[，。！？、：；）」』]$/.test(p)){out.push(cur.trim());cur=p.trimStart()}else cur=nx});
 if(cur.trim())out.push(cur.trim());return out}
function block(items,cy){
 const rows=[];items.forEach(it=>wrapT(it[0],it[1],TW).forEach(l=>rows.push([l,it[1],it[2],it[3],it[4]])));
 const lh=r=>Math.round(r[1]*1.35),tot=rows.reduce((a,r)=>a+lh(r),0)+PADY*2,top=Math.round(cy-tot/2);
 card(36,top,328,tot);let y=top+PADY;
 rows.forEach(r=>{const h=lh(r),by=y+h*.76+(r[4]?Math.sin(tt*4)*2:0);(r[3]?tx:wt)(r[0],W/2,by,r[1],r[2],0,TW);y+=h});return top+tot}
function overlay(){
g.fillStyle='rgba(12,22,48,.5)';g.fillRect(0,0,W,VH);g.save();g.translate(0,OVY());
if(st==='ready'){tx(T('title'),W/2,146,32,'#ffd23f',0,W-48);const b=block([[T('s1'),15,'#fff'],[T('s2'),15,'#bfe6f2']],228);tx('{{t:rider.msg.017}}',W/2,Math.max(330,b+40)+Math.sin(tt*4)*2,22,'#ffbf1f',0,W-48)}
else{const R=[[T(G.msg),21,'#ff9b8a',1],[String(G.score()),46,'#fff',1]];
if(G.extra)R.push([G.extra(),16,'#bfe6f2']);
if(rec)R.push(['{{t:rider.msg.018}}',18,'#ffd23f',1]);
if(unl.length)R.push(['{{t:rider.msg.019}}'+unl.map(k=>k.n).join('、'),15,'#6cf0a8']);
R.push([paid>0?'{{t:rider.msg.020}}'+paid+' 點':'{{t:rider.msg.021}}',17,paid>0?'#ffd23f':'#fff',1]);
R.push(['{{t:rider.msg.022}}',16,'#ffbf1f',1,1]);
block(R,226)}
card(36,396,328,120);
const n=G.skins.length;
G.skins.forEach((k,i)=>{const x=W/2+(i-(n-1)/2)*72,lk=best<k.need;
g.beginPath();g.arc(x,CHY,25,0,7);g.fillStyle=lk?'#4a5a68':'#2a6c8c';g.fill();
if(!lk){g.save();g.beginPath();g.arc(x,CHY,25,0,7);g.clip();spr('v0',x,CHY+52,76,tint(i));acc(k.a,x+1,CHY-23,.5);g.restore()}else tx(String(k.need),x,CHY+7,16,'#fff');
g.lineWidth=i===skin&&!lk?4:2.5;g.strokeStyle=i===skin&&!lk?'#ffd23f':'#6fb3cc';g.beginPath();g.arc(x,CHY,i===skin&&!lk?29:25,0,7);g.stroke()});
tx(SK().n,W/2,CHY+56,16,'#ffd23f');g.restore()}
function bonusDraw(){g.save();g.translate(0,OY);bpop.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/1.8);tx('BONUS +'+BONUS+' 點',W/2,170-Math.min(1,p.age*3)*20,34,'#ffd23f');tx(fmt(p.m)+UNIT+' 里程碑',W/2,198-Math.min(1,p.age*3)*20,16,'#fff');g.globalAlpha=1});g.restore()}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*VH/r.height-(st==='run'?OY:OVY()),id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);
 if(st!=='run'){
  const n=G.skins.length;
  if(Math.abs(p.y-CHY)<32){for(let i=0;i<n;i++)if(Math.abs(p.x-(W/2+(i-(n-1)/2)*72))<32){if(best>=G.skins[i].need)pick(i);return}}
  say(st==='over'?'{{t:rider.msg.023}}':'{{t:rider.msg.024}}');return}
 e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 G.down(p)});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,e=>{if(st==='run'&&G.up)G.up({id:e.pointerId})}));
c.addEventListener('contextmenu',e=>e.preventDefault());
const KM={' ':[190,300],ArrowUp:[190,300],ArrowLeft:[40,300],ArrowRight:[360,300],ArrowDown:[200,503],x:[200,503]};
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
