  /* ---------- Nap Master: hold to sleep while the boss patrols; let go when "!" appears; thrown trash can knock the boss out ---------- */
  var napBusy=false,napStake=0,napSay=function(){};
  (function(){
// ===== 全部數值集中在這裡 =====
const createGame=napRules.createGame;
const c=$('np-canvas'),ctx=c.getContext('2d'),W=400,H=560,DPR=2;c.width=W*DPR;c.height=H*DPR;
const NAP_REWARD=1;                       // points credited each time a level is cleared (fixed milestone, no multiplier)
const BTN_SLEEP={x:14,y:476,w:232,h:70},BTN_THROW={x:258,y:476,w:128,h:70};
const FONT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';
let best=0;try{best=+localStorage.getItem('deep-sea-nap-best')||0}catch(e){}
let analytics=null,earned=0,st='ready',G=createGame(),why='',rec=false,tt=0,last=0;
const rank=timedLeaderboard('nap','np',napRules.inputCount,ui);
const floats=[],pointers=new Map(),keys=new Set();
let throwEdge=false,shake=0,flashRed=0,flashWhite=0,throwFx=0;
const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const sleepHeld=()=>{if(keys.has('sleep'))return true;for(const v of pointers.values())if(v==='sleep')return true;return false};
const clearInput=()=>{keys.clear();pointers.clear();throwEdge=false};
function say(text,kind){$('np-msg').textContent=text;$('np-msg').className='msg'+(kind?' '+kind:'')}
napSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 let hearts='';for(let i=0;i<G.cfg.hearts;i++)hearts+=i<G.hearts?'♥':'♡';
 setText('np-level','第 '+G.level+' 關');setText('np-hearts',hearts);setText('np-best',best+' 分');
 $('np-amount').disabled=napBusy;$('np-go').disabled=live||rank.busy();setText('np-go',live?'{{t:nap.msg.001}}':st==='over'?'{{t:nap.msg.002}}':'{{t:nap.msg.003}}');
}
function addFloat(x,y,text,color,size,life){floats.push({x:x,y:y,text:text,color:color,size:size||18,life:life||.9,max:life||.9})}
function end(win){
 if(st!=='run')return;
 st='over';why=win?'win':'fired';clearInput();
 const score=G.score;rank.finish(score);rec=score>best;
 if(rec){best=score;try{localStorage.setItem('deep-sea-nap-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:earned,stage:G.level});napBusy=false;save();renderAll();
 if(win)say('10 關全部睡過，主管毫不知情！本局共入帳 '+fmt(earned)+' 點。','win');
 else if(earned)say('被炒魷魚了。撐到第 '+G.level+' 關，本局共入帳 '+fmt(earned)+' 點。','win');
 else say('{{t:nap.msg.004}}','lose');
 ui();
}
function handleEvents(){
 const ev=G.events.splice(0);
 for(const e of ev){
  switch(e.type){
   case 'fake':addFloat(G.boss.x,150,'{{t:nap.msg.005}}','#cfd8dc',14,1);break;
   case 'hit':addFloat(e.x,170,'-1','#ffeb3b',24,.7);break;
   case 'wasted':addFloat(e.x,170,'{{t:nap.msg.006}}','#90a4ae',14,.8);break;
   case 'ko':addFloat(e.x,160,'{{t:nap.msg.007}}','#ffeb3b',22,1.2);if(!reduceMotion)flashWhite=.15;break;
   case 'recover':addFloat(G.boss.x,160,'{{t:nap.msg.008}}','#ef9a9a',16,1);break;
   case 'caught':addFloat(200,270,'{{t:nap.msg.009}}','#ff5252',24,1.2);if(!reduceMotion){shake=.35;flashRed=.25}if(G.hearts>0)say('被抓到了！還剩 '+G.hearts+' 顆考績，睡意被扣掉一些。','lose');break;
   case 'heal':addFloat(200,100,'{{t:nap.msg.010}}','#80cbc4',18,1.2);break;
   case 'clear':
    earned+=NAP_REWARD;S.balance+=NAP_REWARD;save();renderAll();
    AN.progress(analytics,{stage:G.level,step:earned,score:G.score,bonus_points:NAP_REWARD});
    addFloat(200,200,'{{t:nap.msg.011}}'+e.bonus,'#b39ddb',26,1.3);
    say('第 '+G.level+' 關睡飽了！+'+NAP_REWARD+' 點已入帳。','win');break;
   case 'intro':if(G.level>1)say('第 '+G.level+' 關：主管更難纏了。');break;
   case 'over':end(false);break;
   case 'win':end(true);break;
  }
 }
}
// ---- drawing helpers ----
function rrect(x,y,w,h,r,fill,stroke,lw){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||2;ctx.stroke()}}
function circ(x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||2;ctx.stroke()}}
function line(x1,y1,x2,y2,color,lw){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=lw||2;ctx.lineCap='round';ctx.stroke()}
function tx(s,x,y,size,color,align,bold,stroke,mw){mw=mw||W-20;
 ctx.font=(bold?'900 ':'700 ')+size+'px '+FONT;ctx.textAlign=align||'center';ctx.textBaseline='middle';
 if(stroke){ctx.lineWidth=Math.max(3,size/5);ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(s,x,y,mw)}
 ctx.fillStyle=color;ctx.fillText(s,x,y,mw)}
const SPR=new Image();SPR.src='games/nap/art/sprites.webp';const SCN=new Image();SCN.src='games/nap/art/scene.webp';
const A={"pThrow":[0,0,184,178],"pWake":[186,0,178,177],"p0":[366,0,177,176],"pHold":[545,0,159,175],"pS":[706,0,208,173],"pD1":[0,180,182,170],"bMoon":[184,180,170,170],"bThrow":[356,180,170,170],"bThrowP":[528,180,150,170],"p1":[680,180,179,169],"pCaught":[0,352,190,164],"bMoonP":[192,352,170,163],"pD2":[364,352,190,162],"bHit":[556,352,170,161],"bWarn":[728,352,123,160],"bWatch":[853,352,158,155],"bL0":[0,518,123,150],"bL1":[125,518,116,150],"bR0":[243,518,120,150],"bR1":[365,518,118,150],"lamp":[485,518,101,150],"bKO":[588,518,200,120],"plant":[790,518,89,100],"zzz":[881,518,93,73],"star":[0,670,70,68],"starE":[72,670,70,67],"warn":[144,670,80,65],"ball":[226,670,60,58],"barF":[288,670,400,56],"barE":[0,740,400,55],"dotOn":[402,740,40,40],"dotOff":[444,740,35,40]};
const ok=i=>i.complete&&i.naturalWidth>0;
function spr(k,x,y,h,alpha){const a=A[k];if(!a||!ok(SPR))return;const w=a[2]*h/a[3];if(alpha!==undefined){ctx.save();ctx.globalAlpha=alpha}ctx.drawImage(SPR,a[0],a[1],a[2],a[3],x-w/2,y-h,w,h);if(alpha!==undefined)ctx.restore()}
function sprBox(k,x,y,w,h){const a=A[k];if(!a||!ok(SPR))return;ctx.drawImage(SPR,a[0],a[1],a[2],a[3],x,y,w,h)}
function card(x,y,w,h){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x+2,y+6,w,h,20):ctx.rect(x+2,y+6,w,h);ctx.fill();rrect(x,y,w,h,20,'rgba(20,26,70,.92)','#7f8cff',2.5)}
const DESK=448;
function drawBackground(){
  const g0=ctx.createLinearGradient(0,0,0,H);g0.addColorStop(0,'#0d1236');g0.addColorStop(1,'#1b2257');ctx.fillStyle=g0;ctx.fillRect(0,0,W,H);
  if(ok(SCN)){const h=SCN.naturalHeight*W/SCN.naturalWidth;ctx.drawImage(SCN,0,0,W,h)}
  if(OY>0){const sf=ctx.createLinearGradient(0,0,0,70);sf.addColorStop(0,'#0d1236');sf.addColorStop(1,'rgba(13,18,54,0)');ctx.fillStyle=sf;ctx.fillRect(0,0,W,70)}
  if(OY<=0){const tp=ctx.createLinearGradient(0,0,0,96);tp.addColorStop(0,'rgba(8,10,34,.95)');tp.addColorStop(.75,'rgba(8,10,34,.7)');tp.addColorStop(1,'rgba(8,10,34,0)');ctx.fillStyle=tp;ctx.fillRect(0,0,W,96);}
  const fl=ctx.createLinearGradient(0,330,0,DESK);fl.addColorStop(0,'rgba(13,18,54,0)');fl.addColorStop(1,'rgba(13,18,54,.85)');ctx.fillStyle=fl;ctx.fillRect(0,330,W,DESK-330);
}
function drawBoss(t){
  const b=G.boss,s=b.state,fy=316;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(b.x,fy,30,7,0,0,Math.PI*2);ctx.fill();
  if(s==='STUN')spr('bKO',b.x,fy+6,62);
  else if(s==='WARN')spr('bWarn',b.x+6,fy+4,128);
  else if(s==='WATCH')spr('bWatch',b.x,fy+4,120);
  else{const f=Math.floor(t/.22)%2;spr((b.dir>=0?'bR':'bL')+f,b.x,fy+4,112)}
  if(s==='STUN'){tx('暈倒 '+Math.max(0,b.timer).toFixed(1)+'s',b.x,240,14,'#ffeb3b','center',true,'#0d1236')}
  else{const y=s==='WARN'?172:184;rrect(b.x-26,y,52,8,4,'rgba(13,18,54,.85)','#7f8cff',1.5);if(b.hp>0)rrect(b.x-25,y+1,50*(b.hp/b.hpMax),6,3,'#ff5a6a')}
}
function drawDesk(t){
  const gl=ctx.createRadialGradient(200,DESK-40,10,200,DESK-40,190);gl.addColorStop(0,'rgba(255,196,110,.42)');gl.addColorStop(1,'rgba(255,196,110,0)');ctx.fillStyle=gl;ctx.fillRect(0,250,W,DESK-250+30);
  const dg=ctx.createLinearGradient(0,DESK,0,DESK+26);dg.addColorStop(0,'#b0704a');dg.addColorStop(1,'#6e3f2b');ctx.fillStyle=dg;ctx.fillRect(0,DESK,W,26);
  ctx.fillStyle='rgba(255,220,170,.35)';ctx.fillRect(0,DESK,W,2);
  spr('lamp',52,DESK+6,104);spr('plant',352,DESK+4,74);
  for(let i=0;i<G.ammo;i++)spr('ball',112+(i%3)*15,DESK+4-Math.floor(i/3)*12,16);
}
function drawPlayer(t){
  const p=G.pose,d=G.depth;let k,h=150;
  if(G.caughtLock>0)k='pCaught';
  else if(p==='SLEEP'){k=d>.7?'pS':d>.35?'pD2':'pD1';if(k==='pS')h=158}
  else if(p==='WAKING')k='pWake';
  else if(p==='THROW'){k='pThrow';h=150}
  else k=Math.floor(t/.32)%2?'p1':'p0';
  spr(k,200,DESK+4,h);
  if(p==='SLEEP'&&d>.2&&d<=.7)spr('zzz',262,DESK-118,22+18*d,Math.min(1,d*2));
}
function drawProjectiles(){
  const b=G.boss;
  for(const pr of G.projectiles){
    const u=Math.min(1,pr.t/G.cfg.trash.flight);
    const sx=250,sy=DESK-110,ex=b.x,ey=b.state==='STUN'?300:220;
    spr('ball',sx+(ex-sx)*u,sy+(ey-sy)*u-46*Math.sin(Math.PI*u)+9,18);
  }
}
function drawHUD(){
  const L=OY>0?58:10;
  rrect(L,8,92,34,17,'rgba(20,26,70,.9)','#7f8cff',2);
  tx('Lv. '+G.level+'/10',L+46,25,16,'#fff','center',true,'#0d1236');
  tx('{{t:nap.msg.012}}',L+98,25,12,'#cfd6ff','left',true,'#0d1236',OY>0?50:62);ctx.font='900 12px '+FONT;const sx=Math.min(L+166,L+102+ctx.measureText(window.deepSeaI18n?deepSeaI18n.text('{{t:nap.msg.012}}'):'{{t:nap.msg.012}}').width)+18;for(let i=0;i<G.cfg.hearts;i++)spr(i<G.hearts?'star':'starE',sx+i*28,40,26);
  tx('分數 '+G.score,W-14,25,13,'#cfd6ff','right',true,'#0d1236',110);
  const k=Math.min(1,G.sleepVal/G.L.goal),bx=48,by=50,bw=W-62,bh=22;
  sprBox('barE',bx,by,bw,bh);
  if(k>0){ctx.save();ctx.beginPath();ctx.rect(bx,by,bw*k,bh);ctx.clip();sprBox('barF',bx,by,bw,bh);ctx.restore()}
  spr('zzz',28,by+bh+2,24);
  tx('睡意 '+Math.floor(G.sleepVal)+' / '+G.L.goal,bx+bw/2,by+bh/2,11,'#fff','center',true,'#0d1236');
}
function drawButtons(){
  ctx.fillStyle='#10163f';ctx.fillRect(0,DESK+26,W,H-DESK-26);
  const holding=sleepHeld(),sleepable=G.caughtLock<=0;
  rrect(BTN_SLEEP.x,BTN_SLEEP.y,BTN_SLEEP.w,BTN_SLEEP.h,18,'rgba(40,48,120,.6)','#5c68d8',2);
  const cy=BTN_SLEEP.y+BTN_SLEEP.h/2;ctx.save();if(!sleepable)ctx.globalAlpha=.45;spr(holding&&sleepable?'bMoonP':'bMoon',BTN_SLEEP.x+40,cy+34,holding?68:64);ctx.restore();
  tx(sleepable?(holding?'{{t:nap.msg.013}}':'{{t:nap.msg.014}}'):'{{t:nap.msg.015}}',BTN_SLEEP.x+80,cy-7,19,'#fff','left',true,'#0d1236');
  tx('{{t:nap.msg.016}}',BTN_SLEEP.x+80,cy+15,11,'#b8c0ff','left');
  const can=G.ammo>0&&G.boss.state!=='STUN'&&G.caughtLock<=0;
  rrect(BTN_THROW.x,BTN_THROW.y,BTN_THROW.w,BTN_THROW.h,18,'rgba(40,48,120,.6)','#5c68d8',2);
  ctx.save();if(!can)ctx.globalAlpha=.45;spr(throwFx>0?'bThrowP':'bThrow',BTN_THROW.x+30,BTN_THROW.y+52,48);ctx.restore();tx('{{t:nap.msg.017}}',BTN_THROW.x+90,BTN_THROW.y+28,15,can?'#fff':'#8a92c8','center',true,'#0d1236',70);
  const n=G.cfg.trash.max;for(let i=0;i<n;i++)spr(i<G.ammo?'dotOn':'dotOff',BTN_THROW.x+90+(i-(n-1)/2)*13,BTN_THROW.y+56,11);
}
function tipFor(level){
  const tips={
    1:['{{t:nap.msg.018}}','{{t:nap.msg.019}}','{{t:nap.msg.020}}'],
    2:['{{t:nap.msg.021}}'],
    3:['{{t:nap.msg.022}}'],
    4:['{{t:nap.msg.023}}'],
    5:['{{t:nap.msg.024}}'],
    6:['{{t:nap.msg.025}}'],
    7:['{{t:nap.msg.026}}'],
    8:['{{t:nap.msg.027}}'],
    9:['{{t:nap.msg.028}}'],
    10:['{{t:nap.msg.029}}']
  };
  return tips[level]||[];
}
function wrapLines(t,font,mw){t=window.deepSeaI18n?deepSeaI18n.text(String(t)):String(t);ctx.font=font;const parts=/\s/.test(t)?t.split(/(\s+)/):[...t],out=[];let cur='';parts.forEach(p=>{const nx=cur+p;if(cur.trim()&&ctx.measureText(nx).width>mw&&!/^\s+$/.test(p)&&!/^[，。！？、：；）」』]$/.test(p)){out.push(cur.trim());cur=p.trimStart()}else cur=nx});if(cur.trim())out.push(cur.trim());return out}
// card with ~12% side padding; every line wraps to the inner width and the card grows to fit
function block(items,top){const X=36,CW=328,PX=38,PY=20,TW=CW-PX*2,rows=[];
 items.forEach(it=>wrapLines(it[0],(it[3]===false?'700 ':'900 ')+it[1]+'px '+FONT,TW).forEach(l=>rows.push([l,it[1],it[2],it[3]])));
 const lh=r=>Math.round(r[1]*1.5),tot=rows.reduce((a,r)=>a+lh(r),0)+PY*2;card(X,top,CW,tot);
 let y=top+PY;rows.forEach(r=>{const h=lh(r);tx(r[0],200,y+h/2,r[1],r[2],'center',r[3]!==false,null,TW);y+=h});return top+tot}
function drawOverlay(){
 const dim=a=>{ctx.fillStyle='rgba(8,10,34,'+a+')';ctx.fillRect(0,0,W,VH)};ctx.save();ctx.translate(0,st==='run'?OY:OVY());
 if(st==='ready'){
  dim(.55);
  tx('{{t:nap.msg.030}}',200,108,40,'#ffd54f','center',true,'#1a1450');
  tx('{{t:nap.msg.031}}',200,146,15,'#e4e6ff','center',false,'#0d1236',W-60);
  const b=block([['{{t:nap.msg.032}}',14,'#fff'],['{{t:nap.msg.033}}',14,'#ffd54f'],['{{t:nap.msg.034}}',14,'#fff'],['{{t:nap.msg.035}}',14,'#fff'],['{{t:nap.msg.036}}',12,'#aab3ff',false]],168);
  tx('{{t:nap.msg.037}}',200,Math.min(b+36,440),20,'#ffd54f','center',true,'#1a1450',W-48);
 }else if(st==='over'){
  dim(.6);
  const win=why==='win';
  tx(win?'{{t:nap.msg.038}}':'{{t:nap.msg.040}}',200,112,36,win?'#ffd54f':'#ff6b7a','center',true,'#1a1450',W-48);
  tx(win?'{{t:nap.msg.039}}':'{{t:nap.msg.041}}',200,150,14,'#e4e6ff','center',false,'#0d1236',W-60);
  const it=[['撐到第 '+G.level+' 關',18,'#fff'],['分數 '+G.score,22,'#ffd54f'],[earned>0?'本局入帳 '+fmt(earned)+' 點':'{{t:nap.msg.042}}',15,earned>0?'#ffd54f':'#cfd6ff']];
  if(rec)it.push(['{{t:nap.msg.043}}',16,'#7ef0d0']);
  const b=block(it,174);
  tx('{{t:nap.msg.044}}',200,Math.min(b+34,440),18,'#ffd54f','center',true,'#1a1450',W-48);
 }else if(G.state==='INTRO'){
  dim(.5);
  tx('第 '+G.level+' 關',200,150,42,'#fff','center',true,'#1a1450');
  tx('睡意目標 '+G.L.goal,200,192,15,'#cfd6ff','center',false,'#0d1236');
  const tp=tipFor(G.level);
  if(tp.length)block(tp.map((t,i)=>[t,i===0&&G.level>1?16:14,i===0?'#ffd54f':'#fff']),214);
 }else if(G.state==='CLEAR'){
  dim(.3);
  tx('{{t:nap.msg.011}}'+NAP_REWARD+' 點',200,160,32,'#fff','center',true,'#5e35b1',W-48);
 }
 ctx.restore();
}
// Phone full screen: the canvas grows to the screen's height; play (400x560, desk and buttons at its bottom) sits at the
// bottom and the extra space above becomes the dark office ceiling, with the HUD pinned to the top of the screen.
let VH=H,OY=0;const MOBILE=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
function fit(){const p=c.parentElement;let vh=H;if(MOBILE.matches&&p&&p.clientWidth>0&&p.clientHeight>0)vh=Math.max(H,Math.round(W*p.clientHeight/p.clientWidth));if(vh!==VH){VH=vh;c.height=Math.round(VH*DPR)}OY=VH-H}
const OVY=()=>Math.max(0,VH-640);
function ceiling(){if(OY<=0)return;const g0=ctx.createLinearGradient(0,0,0,OY+40);g0.addColorStop(0,'#05071c');g0.addColorStop(1,'#0d1236');ctx.fillStyle=g0;ctx.fillRect(0,0,W,OY+40);
 ctx.fillStyle='rgba(60,70,140,.35)';for(let y=96;y<OY;y+=54)ctx.fillRect(0,y,W,3);
 [[90,.55],[310,.7]].forEach(([x,k])=>{const ly=Math.max(100,OY*k);ctx.strokeStyle='rgba(120,130,200,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ly-14);ctx.stroke();
  const gl=ctx.createRadialGradient(x,ly+6,4,x,ly+6,90);gl.addColorStop(0,'rgba(255,200,120,.35)');gl.addColorStop(1,'rgba(255,200,120,0)');ctx.fillStyle=gl;ctx.fillRect(x-90,ly-84,180,180);
  ctx.fillStyle='#2a2f63';ctx.beginPath();ctx.ellipse(x,ly-6,22,10,0,Math.PI,0);ctx.fill();ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.ellipse(x,ly-6,16,4,0,0,Math.PI*2);ctx.fill()})}
function draw(dt){
 fit();
 ctx.setTransform(DPR,0,0,DPR,0,0);
 ceiling();
 ctx.save();ctx.translate(0,OY);
 drawBackground();drawBoss(tt);drawProjectiles();drawDesk(tt);drawPlayer(tt);
 if(OY<=0)drawHUD();drawButtons();
 for(let i=floats.length-1;i>=0;i--){
  const f=floats[i];f.life-=dt;if(f.life<=0){floats.splice(i,1);continue}
  ctx.globalAlpha=Math.min(1,f.life/(f.max*.5));tx(f.text,f.x,f.y-(1-f.life/f.max)*30,f.size,f.color,'center',true,'#0d1236');ctx.globalAlpha=1}
 ctx.restore();
 if(OY>0)drawHUD();
 if(flashRed>0){const v=ctx.createRadialGradient(200,OY+280,120,200,OY+280,360+OY*.5);v.addColorStop(0,'rgba(255,40,60,0)');v.addColorStop(1,'rgba(255,40,60,'+Math.min(.55,flashRed*2)+')');ctx.fillStyle=v;ctx.fillRect(0,0,W,VH)}
 drawOverlay();
 shake=0;flashRed=Math.max(0,flashRed-dt);flashWhite=0;throwFx=Math.max(0,throwFx-dt);
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('nap',amount);napStake=amount;napBusy=true;save();renderAll();
 G=napRules.create(random||Math.random);earned=0;rec=false;why='';floats.length=0;clearInput();shake=0;flashRed=0;flashWhite=0;
 st='run';last=performance.now();say('{{t:nap.msg.045}}');ui();c.focus();
 },ui);
}
const shown=()=>!$('view-nap').hidden&&!document.hidden;
const toLocal=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*VH-OY}};
$('np-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'{{t:nap.msg.046}}':'{{t:nap.msg.047}}');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 const p=toLocal(e);
 if(inRect(p,BTN_SLEEP))pointers.set(e.pointerId,'sleep');
 else if(inRect(p,BTN_THROW)){pointers.set(e.pointerId,'throw');throwEdge=true}
 else pointers.set(e.pointerId,'other')});
const endPointer=e=>{pointers.delete(e.pointerId)};
c.addEventListener('pointerup',endPointer);c.addEventListener('pointercancel',endPointer);c.addEventListener('lostpointercapture',endPointer);
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key===' '||e.key==='ArrowDown'){e.preventDefault();keys.add('sleep')}
 else if(e.key==='j'||e.key==='J'||e.key==='x'||e.key==='X'){e.preventDefault();if(!e.repeat)throwEdge=true}});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowDown')keys.delete('sleep')});
addEventListener('blur',()=>{clearInput();last=performance.now()});
document.addEventListener('visibilitychange',()=>{clearInput();last=performance.now()});
window.addEventListener('hashchange',()=>{clearInput();last=performance.now()});
function loop(t){
 const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;
 if(shown()){
  tt+=dt;
  if(st==='run'){
   const held=sleepHeld();
   if(G.held!==held){const code=held?0:1;napRules.input(G,code);rank.record(code);}
   if(throwEdge&&napRules.input(G,2)){rank.record(2);throwFx=.2}
   throwEdge=false;
   rank.update(dt*1000,()=>st==='run',step=>{napRules.advance(G,step);handleEvents()});
  }
  ui();draw(dt)}
 requestAnimationFrame(loop)}
ui();draw(0);requestAnimationFrame(loop);
  })();
