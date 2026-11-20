  /* ---------- Nap Master: hold to sleep while the boss patrols; let go when "!" appears; thrown trash can knock the boss out ---------- */
  var napBusy=false,napStake=0,napSay=function(){};
  (function(){
// ===== 全部數值集中在這裡 =====
const createGame=napRules.createGame;
const c=$('np-canvas'),ctx=c.getContext('2d'),W=400,H=560;
const NAP_REWARD=1;                       // points credited each time a level is cleared (fixed milestone, no multiplier)
const BTN_SLEEP={x:10,y:482,w:250,h:68},BTN_THROW={x:270,y:482,w:120,h:68};
const FONT='"Noto Sans TC",system-ui,sans-serif';
let best=0;try{best=+localStorage.getItem('deep-sea-nap-best')||0}catch(e){}
let analytics=null,earned=0,st='ready',G=createGame(),why='',rec=false,tt=0,last=0;
const rank=timedLeaderboard('nap','np',napRules.inputCount,ui);
const floats=[],pointers=new Map(),keys=new Set();
let throwEdge=false,shake=0,flashRed=0,flashWhite=0;
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
function tx(s,x,y,size,color,align,bold,stroke){
 ctx.font=(bold?'800 ':'')+size+'px '+FONT;ctx.textAlign=align||'center';ctx.textBaseline='middle';
 if(stroke){ctx.lineWidth=3;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(s,x,y,W-20)}
 ctx.fillStyle=color;ctx.fillText(s,x,y,W-20)}
function drawBackground(){
  ctx.fillStyle='#cfd8dc'; ctx.fillRect(0,0,W,150);
  for(let i=0;i<3;i++){ const wx=28+i*128; rrect(wx,30,92,72,4,'#90caf9','#78909c',3); line(wx+46,30,wx+46,102,'#78909c',2); line(wx,66,wx+92,66,'#78909c',2); }
  ctx.fillStyle='#8d9aa6'; ctx.fillRect(0,150,W,340);
  ctx.fillStyle='rgba(0,0,0,0.06)'; for(let y=160;y<336;y+=22) ctx.fillRect(0,y,W,3);
  ctx.fillStyle='#78909c'; ctx.fillRect(0,146,W,6);
}
function drawBoss(t){
  const b=G.boss, st=b.state;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x,312,28,6,0,0,Math.PI*2); ctx.fill();
  ctx.translate(b.x,300);
  if(st==='STUN') ctx.rotate((b.dir>=0?1:-1)*Math.PI/2);
  const walking=(st==='PATROL'); const sw=walking?Math.sin(t*9):0; const bob=walking?-Math.abs(Math.sin(t*9))*2:0;
  ctx.translate(0,bob);
  rrect(-14+sw*5,-20,10,20,3,'#263238'); rrect(4-sw*5,-20,10,20,3,'#263238');
  rrect(-22,-82,44,64,8,'#37474f');
  rrect(-3,-78,6,34,2,'#d32f2f');
  line(-22,-72,-30,-44,'#37474f',8); line(22,-72,30,-44,'#37474f',8);
  circ(0,-100,17,(st==='WATCH'||(st==='WARN'&&b.angry))?'#f4a98a':'#f1c9a0','#c9966b',1.5);
  ctx.beginPath(); ctx.arc(0,-104,17,Math.PI,Math.PI*2); ctx.fillStyle='#3e2723'; ctx.fill();
  if(st==='PATROL'){
    circ(-6+b.dir*3,-100,3,'#fff'); circ(6+b.dir*3,-100,3,'#fff'); circ(-6+b.dir*5,-100,1.6,'#222'); circ(6+b.dir*5,-100,1.6,'#222');
    line(-5,-90,5,-90,'#6d4c41',2);
  } else if(st==='WARN'){
    circ(-6,-100,4.5,'#fff','#444',1); circ(6,-100,4.5,'#fff','#444',1); circ(-6,-98.5,2,'#222'); circ(6,-98.5,2,'#222');
    circ(0,-90,3,'#6d4c41');
    const sh=Math.sin(t*40)*1.5;
    tx(b.angry?'!!':'!',sh,-134,34,'#ff1744','center',true,'#fff');
  } else if(st==='WATCH'){
    circ(-6,-100,4.5,'#fff','#444',1); circ(6,-100,4.5,'#fff','#444',1); circ(-6,-98.5,2.2,'#b71c1c'); circ(6,-98.5,2.2,'#b71c1c');
    line(-12,-110,-3,-105,'#3e2723',3); line(12,-110,3,-105,'#3e2723',3);
    ctx.beginPath(); ctx.arc(0,-84,5,Math.PI*1.1,Math.PI*1.9); ctx.strokeStyle='#6d4c41'; ctx.lineWidth=2; ctx.stroke();
    circ(-6,-100,8,null,'#222',1.5); circ(6,-100,8,null,'#222',1.5);
  } else if(st==='STUN'){
    line(-9,-103,-3,-97,'#222',2); line(-3,-103,-9,-97,'#222',2); line(3,-103,9,-97,'#222',2); line(9,-103,3,-97,'#222',2);
    line(-4,-89,4,-89,'#6d4c41',2);
    for(let i=0;i<3;i++){ const a=t*5+i*2.09; tx('★',Math.cos(a)*18,-126+Math.sin(a)*5,14,'#ffeb3b','center',true); }
  }
  ctx.restore();
  // 血條與倒數
  if(st==='STUN'){
    tx('暈倒 '+Math.max(0,b.timer).toFixed(1)+'s',b.x,262,14,'#ffeb3b','center',true,'#000');
  } else {
    rrect(b.x-26,134,52,8,3,'#263238');
    if(b.hp>0) rrect(b.x-26,134,52*(b.hp/b.hpMax),8,3,'#ef5350');
    ctx.strokeStyle='#000'; ctx.lineWidth=1; ctx.strokeRect(b.x-26,134,52,8);
  }
}
function drawDesk(t){
  rrect(18,336,364,18,4,'#a1887f'); ctx.fillStyle='#8d6e63'; ctx.fillRect(22,354,356,116); ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(22,354,356,6);
  rrect(160,344,80,8,2,'#cfd8dc','#90a4ae',1);
  // 螢幕
  rrect(252,290,76,48,4,'#263238'); rrect(256,294,68,38,2,G.pose==='SLEEP'?'#37474f':'#4dd0e1');
  if(G.pose!=='SLEEP'){ for(let i=0;i<4;i++) line(260,300+i*8,260+40+((i*17)%20),300+i*8,'#e0f7fa',2); }
  else tx('Zzz',290,313,12,'#90a4ae','center',true);
  rrect(284,338,12,6,2,'#455a64');
  // 咖啡杯
  rrect(110,322,16,16,3,'#fff','#90a4ae',1); line(126,328,131,328,'#90a4ae',2);
  // 垃圾堆（彈藥）
  for(let i=0;i<G.ammo;i++){ const bx=44+(i%3)*17, by=332-Math.floor(i/3)*15; circ(bx,by,8,'#fafafa','#b0bec5',1.5); line(bx-4,by-2,bx+3,by+3,'#cfd8dc',1); }
}
function drawPlayer(t){
  const cx=200, p=G.pose, hot=(G.boss.state==='WARN'||G.boss.state==='WATCH');
  rrect(cx-34,300,68,40,12,'#455a64');                        // 椅背
  rrect(cx-30,316,60,30,10,'#5c6bc0');                         // 上半身
  if(p==='SLEEP'){
    rrect(cx-42,334,84,16,7,'#5c6bc0');
    circ(cx+6,328,19,'#f1c9a0','#c9966b',1.5);
    ctx.beginPath(); ctx.arc(cx+6,325,19,Math.PI*0.95,Math.PI*2.05); ctx.fillStyle='#3e2723'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx+0,331,4,0.1*Math.PI,0.9*Math.PI); ctx.strokeStyle='#4e342e'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+13,331,4,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
    circ(cx+8,342+Math.sin(t*3)*1,2.5,'#81d4fa');
    const d=G.depth; const zy=Math.sin(t*3);
    tx('Z',cx+30,306+zy*2,14+8*d,'#b39ddb','center',true,'#37474f');
    if(d>0.35) tx('z',cx+46,288-zy*2,12+6*d,'#b39ddb','center',true,'#37474f');
    if(d>0.7) tx('Z',cx+58,268+zy*2,18+8*d,'#ce93d8','center',true,'#37474f');
  } else {
    let hy=298;
    if(p==='WAKING'){ const k=1-Math.max(0,G.wakeTimer)/G.wakeTotal; hy=330-32*k; }
    circ(cx,hy,19,G.caughtLock>0?'#ef9a9a':'#f1c9a0','#c9966b',1.5);
    ctx.beginPath(); ctx.arc(cx,hy-3,19,Math.PI,Math.PI*2); ctx.fillStyle='#3e2723'; ctx.fill();
    if(p==='WAKING'){ line(cx-9,hy,cx-3,hy,'#4e342e',2); line(cx+3,hy,cx+9,hy,'#4e342e',2); circ(cx+14,hy+8,2.5,'#81d4fa'); }
    else { circ(cx-6,hy,3,'#fff','#444',1); circ(cx+6,hy,3,'#fff','#444',1); circ(cx-6,hy+1,1.4,'#222'); circ(cx+6,hy+1,1.4,'#222'); }
    if(hot&&p!=='WAKING') circ(cx+17,hy-8,2.5,'#81d4fa');
    ctx.beginPath(); ctx.arc(cx,hy+8,4,0.15*Math.PI,0.85*Math.PI); ctx.strokeStyle='#4e342e'; ctx.lineWidth=2; ctx.stroke();
    if(p==='THROW'){ line(cx+22,326,cx+44,296,'#5c6bc0',9); circ(cx+46,292,7,'#fafafa','#b0bec5',1.5); }
    else { const bt=Math.sin(t*14)*2; circ(cx-14,346+bt,5,'#f1c9a0'); circ(cx+14,346-bt,5,'#f1c9a0'); }
  }
}
function drawProjectiles(){
  const b=G.boss;
  for(const pr of G.projectiles){
    const u=Math.min(1,pr.t/G.cfg.trash.flight);
    const sx=246,sy=292, ex=b.x, ey=b.state==='STUN'?290:200;
    const x=sx+(ex-sx)*u, y=sy+(ey-sy)*u-46*Math.sin(Math.PI*u);
    circ(x,y,7,'#fafafa','#b0bec5',1.5);
  }
}
function drawHUD(){
  rrect(14,12,372,22,8,'#263238','#000',2);
  const k=Math.min(1,G.sleepVal/G.L.goal);
  if(k>0) rrect(14,12,Math.max(16,372*k),22,8,'#7e57c2');
  tx('睡意 '+Math.floor(G.sleepVal)+' / '+G.L.goal,200,23,13,'#fff','center',true,'#000');
  tx('{{t:nap.msg.012}}',16,52,12,'#cfd8dc','left',true,'#000');
  for(let i=0;i<G.cfg.hearts;i++) tx('♥',62+i*22,52,22,i<G.hearts?'#ef5350':'#546e7a','center',true,'#000');
  tx('第 '+G.level+' 關',386,52,16,'#fff','right',true,'#000');
  tx('分數 '+G.score,200,52,12,'#cfd8dc','center',false,'#000');
}
function drawButtons(){
  const holding=sleepHeld();
  const sleepable=G.caughtLock<=0;
  rrect(BTN_SLEEP.x,BTN_SLEEP.y,BTN_SLEEP.w,BTN_SLEEP.h,16,sleepable?(holding?'#7e57c2':'#5e35b1'):'#455a64','#000',3);
  tx(sleepable?(holding?'{{t:nap.msg.013}}':'{{t:nap.msg.014}}'):'{{t:nap.msg.015}}',BTN_SLEEP.x+BTN_SLEEP.w/2,BTN_SLEEP.y+30,24,'#fff','center',true);
  tx('{{t:nap.msg.016}}',BTN_SLEEP.x+BTN_SLEEP.w/2,BTN_SLEEP.y+54,11,'#d1c4e9');
  const can=G.ammo>0&&G.boss.state!=='STUN'&&G.caughtLock<=0;
  rrect(BTN_THROW.x,BTN_THROW.y,BTN_THROW.w,BTN_THROW.h,16,can?'#f9a825':'#6d5b4b','#000',3);
  tx('{{t:nap.msg.017}}',BTN_THROW.x+BTN_THROW.w/2,BTN_THROW.y+26,22,can?'#3e2723':'#bcaaa4','center',true);
  for(let i=0;i<G.cfg.trash.max;i++) circ(BTN_THROW.x+18+i*21,BTN_THROW.y+52,7,i<G.ammo?'#fafafa':'#4e342e','#3e2723',1.5);
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
function drawOverlay(){
 if(st==='ready'){
  ctx.fillStyle='rgba(10,10,20,0.78)';ctx.fillRect(0,0,W,H);
  tx('{{t:nap.msg.030}}',200,150,40,'#fff','center',true,'#5e35b1');
  tx('{{t:nap.msg.031}}',200,196,16,'#d1c4e9');
  tx('{{t:nap.msg.032}}',200,252,15,'#fff');
  tx('{{t:nap.msg.033}}',200,278,15,'#ffeb3b');
  tx('{{t:nap.msg.034}}',200,304,15,'#fff');
  tx('{{t:nap.msg.035}}',200,330,15,'#fff');
  tx('{{t:nap.msg.036}}',200,366,13,'#90a4ae');
  tx('{{t:nap.msg.037}}',200,430,22,'#ffd54f','center',true,'#000');
 }else if(st==='over'){
  ctx.fillStyle='rgba(10,10,20,0.82)';ctx.fillRect(0,0,W,H);
  if(why==='win'){tx('{{t:nap.msg.038}}',200,140,38,'#ffd54f','center',true,'#000');tx('{{t:nap.msg.039}}',200,190,15,'#fff')}
  else{tx('{{t:nap.msg.040}}',200,140,40,'#ff5252','center',true,'#000');tx('{{t:nap.msg.041}}',200,190,15,'#fff')}
  tx('撐到第 '+G.level+' 關',200,250,22,'#fff','center',true);
  tx('分數 '+G.score,200,288,22,'#ffd54f','center',true);
  tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'{{t:nap.msg.042}}',200,322,18,earned>0?'#ffd54f':'#fff','center',true);
  if(rec)tx('{{t:nap.msg.043}}',200,352,18,'#80cbc4','center',true);
  tx('{{t:nap.msg.044}}',200,430,20,'#ffd54f','center',true,'#000');
 }else if(G.state==='INTRO'){
  ctx.fillStyle='rgba(10,10,20,0.7)';ctx.fillRect(0,0,W,H);
  tx('第 '+G.level+' 關',200,170,44,'#fff','center',true,'#5e35b1');
  tx('睡意目標 '+G.L.goal,200,216,16,'#d1c4e9');
  const tp=tipFor(G.level);
  for(let i=0;i<tp.length;i++)tx(tp[i],200,276+i*28,i===0&&G.level>1?17:14,i===0?'#ffeb3b':'#fff');
 }else if(G.state==='CLEAR'){
  ctx.fillStyle='rgba(60,30,100,0.35)';ctx.fillRect(0,0,W,H);
  tx('{{t:nap.msg.011}}'+NAP_REWARD+' 點',200,160,34,'#fff','center',true,'#5e35b1');
 }
}
function draw(dt){
 ctx.save();
 if(shake>0)ctx.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
 ctx.fillStyle='#37474f';ctx.fillRect(0,0,W,H);
 drawBackground();drawBoss(tt);drawProjectiles();drawDesk(tt);drawPlayer(tt);
 ctx.fillStyle='#37474f';ctx.fillRect(0,470,W,90);
 drawHUD();drawButtons();
 for(let i=floats.length-1;i>=0;i--){
  const f=floats[i];f.life-=dt;if(f.life<=0){floats.splice(i,1);continue}
  ctx.globalAlpha=Math.min(1,f.life/(f.max*.5));tx(f.text,f.x,f.y-(1-f.life/f.max)*30,f.size,f.color,'center',true,'#000');ctx.globalAlpha=1}
 ctx.restore();
 if(flashRed>0){ctx.fillStyle='rgba(255,0,0,'+(flashRed*1.6)+')';ctx.fillRect(0,0,W,H)}
 if(flashWhite>0){ctx.fillStyle='rgba(255,255,255,'+(flashWhite*3)+')';ctx.fillRect(0,0,W,H)}
 drawOverlay();
 shake=Math.max(0,shake-dt);flashRed=Math.max(0,flashRed-dt);flashWhite=Math.max(0,flashWhite-dt);
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
const toLocal=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}};
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
   if(throwEdge&&napRules.input(G,2))rank.record(2);
   throwEdge=false;
   rank.update(dt*1000,()=>st==='run',step=>{napRules.advance(G,step);handleEvents()});
  }
  ui();draw(dt)}
 requestAnimationFrame(loop)}
ui();draw(0);requestAnimationFrame(loop);
  })();
