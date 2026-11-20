  /* ---------- The Last Hair: slide the neck to lean into the wind, hold to press the hair down; reach the interview with at least one hair ---------- */
  var hairBusy=false,hairStake=0,hairSay=function(){};
  (function(){
// ===== 全部數值集中在 CONFIG =====
const {CONFIG,clamp,createGame,rankOf}=hairRules;
const c=$('lh-canvas'),ctx=c.getContext('2d'),W=400,H=720,SCENE_H=482,PX=18;
const DPR=Math.min(2,Math.max(1,window.devicePixelRatio||1));
c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);
const FONT='"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
const REWARDS=[[100,1],[250,2],[400,3],[500,4]];   // 固定里程碑：抵達該公尺立即入帳；共 10 點，與入場費、頭髮根數、結局無關
const RANK_ORDER=['C','BEARD','B','A','S'];
const RANKS={
 S:{big:'S',title:'{{t:last-hair.msg.001}}',desc:'{{t:last-hair.msg.002}}',col:'#ffd54f'},
 A:{big:'A',title:'{{t:last-hair.msg.003}}',desc:'{{t:last-hair.msg.004}}',col:'#9ccc65'},
 BEARD:{big:'?',title:'{{t:last-hair.msg.005}}',desc:'{{t:last-hair.msg.006}}',col:'#ba68c8'},
 B:{big:'B',title:'{{t:last-hair.msg.007}}',desc:'{{t:last-hair.msg.008}}',col:'#4fc3f7'},
 C:{big:'C',title:'{{t:last-hair.msg.009}}',desc:'{{t:last-hair.msg.010}}',col:'#ff8a65'}};
const CAUSE={vortex:'{{t:last-hair.msg.011}}',drip:'{{t:last-hair.msg.012}}',cramp:'{{t:last-hair.msg.013}}',flyer:'{{t:last-hair.msg.014}}',updraft:'{{t:last-hair.msg.015}}'};
const WIN_MSG=['','{{t:last-hair.msg.016}}','{{t:last-hair.msg.017}}','{{t:last-hair.msg.018}}'];
const HAIR_LEFT=['{{t:last-hair.msg.019}}','{{t:last-hair.msg.020}}','{{t:last-hair.msg.021}}','{{t:last-hair.msg.022}}'];
const TIPS=['{{t:last-hair.msg.023}}','{{t:last-hair.msg.024}}','{{t:last-hair.msg.025}}','{{t:last-hair.msg.026}}'];
let best=0,deaths=[],swap=false,soundOn=true;
try{best=+localStorage.getItem('deep-sea-last-hair-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-last-hair-deaths')||'[]');if(!Array.isArray(deaths))deaths=[]}catch(e){deaths=[]}
try{swap=localStorage.getItem('deep-sea-last-hair-swap')==='1';soundOn=localStorage.getItem('deep-sea-last-hair-sound')!=='0'}catch(e){}
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const rank=timedLeaderboard('last-hair','lh',hairRules.inputCount,ui);
let analytics=null,earned=0,rewarded=0,st='ready',paused=false,game=createGame(),g=game.state,idle=createGame(function(){return .5}).state,rec=false,time=0,last=0,tipT=0,tipText='',flapAcc=0,endAt=0,causeText='';
const idleG=idle;
const input={tilt:0,press:false},ptrs=new Map(),floats=[],flyHairs=[],streaks=[],ups=[],hs=[{},{},{}];
let kbL=false,kbR=false,kbPress=false;
for(let i=0;i<30;i++)streaks.push({x:Math.random()*W,y:90+Math.random()*380,l:20+Math.random()*40,v:.6+Math.random()*.8});
for(let i=0;i<18;i++)ups.push({x:Math.random()*W,y:Math.random()*SCENE_H,l:14+Math.random()*26,v:.6+Math.random()});
const lerp=(a,b,t)=>a+(b-a)*t;
function hash(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
const padBox=()=>({cx:swap?300:100,r:78}),btnBox=()=>({cx:swap?100:300,cy:612,r:76});
function say(text,kind){$('lh-msg').textContent=text;$('lh-msg').className='msg'+(kind?' '+kind:'')}
hairSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function aliveN(){return g.hairs.filter(h=>h.alive).length}
function ui(){
 const live=st==='run';
 setText('lh-dist',Math.floor(live||st==='over'?g.dist:0)+' m');setText('lh-hairs',(live||st==='over'?aliveN():3)+' / 3');setText('lh-best',best.toFixed(0)+' m');
 $('lh-amount').disabled=hairBusy;$('lh-go').disabled=live||rank.busy();setText('lh-go',live?'{{t:last-hair.msg.027}}':st==='over'?'{{t:last-hair.msg.028}}':'{{t:last-hair.msg.029}}');
}
// ---- audio / haptics ----
let ac=null;
function audioInit(){if(!soundOn)return;try{if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){ac=null}}
function tone(f1,f2,dur,type,vol,delay){if(!ac||!soundOn)return;try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime+(delay||0);o.type=type||'sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);gn.gain.setValueAtTime(vol||.12,t);gn.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(gn);gn.connect(ac.destination);o.start(t);o.stop(t+dur+.03)}catch(e){}}
function vib(p){try{if(navigator.vibrate&&!reduceMotion)navigator.vibrate(p)}catch(e){}}
const SFX={pop(){tone(700,90,.28,'sine',.2);tone(300,60,.18,'triangle',.1,.05)},cramp(){tone(900,700,.04,'square',.1);tone(500,300,.05,'square',.1,.07)},drip(){tone(1200,500,.12,'sine',.12)},ok(){tone(520,520,.09,'triangle',.12);tone(780,780,.12,'triangle',.12,.09)},bad(){tone(220,120,.25,'sawtooth',.08)},warn(){tone(880,880,.08,'square',.06)},flap(){tone(60+Math.random()*50,40,.05,'square',.035)},win(){[523,659,784,1047].forEach((f,i)=>tone(f,f,.18,'triangle',.14,i*.12))},lose(){[440,370,311,220].forEach((f,i)=>tone(f,f*.9,.3,'sawtooth',.09,i*.18))},coin(){tone(988,1319,.12,'triangle',.12)}};
function addFloat(text,x,y,col,size,dur){floats.push({text,x,y,col:col||'#fff',size:size||20,t:dur||1.4,d:dur||1.4})}
// ---- 結算 ----
function end(won){
 if(st!=='run')return;
 st='over';endAt=time;clearInput();
 if(won){rec=best<500;if(rec){best=500;lsSet('deep-sea-last-hair-best',String(best))}}
 else{
  const parts=g.cause.split('|'),zn=game.config.zones[+parts[1]].name;
  causeText=parts[0]==='wind'?zn+'{{t:last-hair.msg.030}}':(CAUSE[parts[0]]||'{{t:last-hair.msg.031}}');
  rec=g.deathDist>best;if(rec){best=g.deathDist;lsSet('deep-sea-last-hair-best',best.toFixed(1))}
  deaths.push({d:+g.deathDist.toFixed(1),c:causeText});if(deaths.length>12)deaths.shift();lsSet('deep-sea-last-hair-deaths',JSON.stringify(deaths));
 }
 rank.finish(Math.floor(g.dist));
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:Math.floor(g.dist),step:earned,stage:Math.min(4,rewarded+1)});hairBusy=false;save();renderAll();
 if(won)say(WIN_MSG[aliveN()]+' '+fmt(earned)+' 點。','win');
 else if(earned)say('頭髮掉光了。倒在 '+Math.floor(g.deathDist)+' 公尺，本局共入帳 '+fmt(earned)+' 點。','win');
 else say('頭髮掉光了。倒在 '+Math.floor(g.deathDist)+' 公尺，這一局沒有額外成就獎勵。','lose');
 ui();
}
function milestones(){
 while(rewarded<REWARDS.length&&g.dist>=REWARDS[rewarded][0]){
  const pts=REWARDS[rewarded][1];rewarded++;earned+=pts;S.balance+=pts;save();renderAll();
  AN.progress(analytics,{stage:rewarded,step:earned,score:Math.floor(g.dist),bonus_points:pts,total_bonus_points:earned});
  addFloat('+'+pts+' 點',200,215,'#ffd54f',26,1.4);SFX.coin();
  say('抵達 '+REWARDS[rewarded-1][0]+' 公尺！+'+pts+' 點已入帳。','win');
 }
}
function handleEvents(){
 const evs=g.events.splice(0),hx=200;
 for(const e of evs){
  switch(e.type){
   case'hairLost':SFX.pop();vib([70,40,70]);addFloat('{{t:last-hair.msg.032}}',hx+(e.i-1)*24,200,'#ff5252',30,1.3);flyHairs.push({x:hx+(e.i-1)*24,y:232,vx:(Math.random()<.5?-1:1)*(120+Math.random()*80),vy:-180,r:0,t:2});break;
   case'cramp':SFX.cramp();vib(40);addFloat('{{t:last-hair.msg.033}}',200,170,'#ffab40',30,1.2);break;
   case'drip':SFX.drip();vib(20);addFloat(e.shielded?'{{t:last-hair.msg.034}}':'{{t:last-hair.msg.035}}',200,190,e.shielded?'#80cbc4':'#4fc3f7',22,1.3);break;
   case'greetOk':SFX.ok();addFloat('{{t:last-hair.msg.036}}',200,190,'#9ccc65',24,1.1);break;
   case'greetFail':SFX.bad();vib(30);addFloat('{{t:last-hair.msg.037}}',200,190,'#ff8a80',24,1.3);break;
   case'embarrassed':SFX.bad();vib([30,30,30]);addFloat('{{t:last-hair.msg.038}}',200,190,'#ff8a80',26,1.6);break;
   case'greetStart':case'flyerTele':case'dripTele':case'vortexTele':case'lookTele':SFX.warn();break;
   case'calm':addFloat('{{t:last-hair.msg.039}}',200,272,'#a5d6a7',18,2.2);break;
   case'zone':tipText=TIPS[e.zone];tipT=4.5;addFloat(game.config.zones[e.zone].name,200,222,'#fff',22,2);break;
   case'finish':SFX.win();end(true);break;
   case'dead':SFX.lose();end(false);break;
  }
 }
}
// ---- drawing ----
function txt(s,x,y,size,col,align,bold,stroke,mw){ctx.font=(bold===false?'':'bold ')+size+'px '+FONT;ctx.textAlign=align||'center';ctx.textBaseline='middle';if(stroke){ctx.lineWidth=4;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(s,x,y,mw)}ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y,mw)}
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,v,col,back){ctx.fillStyle=back||'rgba(0,0,0,.35)';rrect(x,y,w,h,h/2);ctx.fill();if(v>0){ctx.fillStyle=col;rrect(x,y,Math.max(h,w*clamp(v,0,1)),h,h/2);ctx.fill()}}
function mix(c1,c2,t){return c1.map((v,i)=>Math.round(lerp(v,c2[i],t)))}
const SKY=[[[196,224,245],[236,245,250]],[[245,214,170],[252,236,205]],[[150,165,185],[196,204,214]],[[96,110,135],[150,162,180]]];
function skyAt(d){const k=clamp(d/125,0,3),i=Math.min(2,Math.floor(k)),t=clamp((k-i)*1.6-.3,0,1);return[mix(SKY[i][0],SKY[i+1][0],t),mix(SKY[i][1],SKY[i+1][1],t)]}
const rgb=c=>'rgb('+c.join(',')+')';
function layer(dist,speed,bw,hmin,hmax,col,base,win){
 const off=dist*PX*speed,i0=Math.floor(off/bw),sh=off-i0*bw;
 for(let i=-1;i<W/bw+2;i++){const idx=i0+i,h=hmin+hash(idx*3.7)*(hmax-hmin),x=i*bw-sh;ctx.fillStyle=col;ctx.fillRect(x,base-h,bw-3,h);
  if(win){ctx.fillStyle='rgba(255,240,180,.35)';for(let wy=base-h+8;wy<base-10;wy+=16)for(let wx=x+6;wx<x+bw-12;wx+=14)if(hash(idx*9+wy+wx)>.55)ctx.fillRect(wx,wy,6,8)}}
}
function drawScene(){
 const d=g.dist,sky=skyAt(d),grd=ctx.createLinearGradient(0,0,0,400);
 grd.addColorStop(0,rgb(sky[0]));grd.addColorStop(1,rgb(sky[1]));ctx.fillStyle=grd;ctx.fillRect(0,0,W,SCENE_H);
 const dark=clamp((d-250)/150,0,1);
 layer(d,.15,64,60,170,rgb(mix([170,185,200],[90,100,120],dark)),392,false);
 layer(d,.4,52,40,120,rgb(mix([140,152,170],[70,80,100],dark)),398,true);
 if(d>250&&d<420){const ox=-((d*PX*.9)%140);ctx.fillStyle='rgba(60,66,80,.9)';ctx.fillRect(0,70,W,16);ctx.fillStyle='rgba(60,66,80,.7)';for(let x=ox;x<W+140;x+=140)ctx.fillRect(x,86,14,312)}
 ctx.fillStyle='#9aa0a8';ctx.fillRect(0,392,W,SCENE_H-392);ctx.fillStyle='#868c94';ctx.fillRect(0,392,W,8);
 const off=d*PX,tw=70;ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=2;
 for(let x=-(off%tw);x<W;x+=tw){ctx.beginPath();ctx.moveTo(x,400);ctx.lineTo(x-20,SCENE_H);ctx.stroke()}
 const dens=[.12,.75,.15,.35][g.zoneIdx],pw=96,pi0=Math.floor(off/pw),psh=off-pi0*pw;
 for(let i=-1;i<W/pw+2;i++){
  const idx=pi0+i;if(hash(idx*5.3)>dens)continue;
  const x=i*pw-psh+hash(idx)*40,hgt=70+hash(idx*2)*22,col=['#6d7a8c','#a1887f','#7e9c7a','#b0768a','#8c8f9e'][Math.floor(hash(idx*7)*5)];
  if(Math.abs(x-200)<70||(d>395&&x>215&&x<350))continue;
  ctx.fillStyle=col;rrect(x-14,432-hgt,28,hgt,12);ctx.fill();ctx.fillStyle='#e3c3a5';ctx.beginPath();ctx.arc(x,432-hgt-12,12,0,7);ctx.fill();
  if(g.sideEye>30){ctx.fillStyle='#fff';ctx.fillRect(x-9,432-hgt-16,7,6);ctx.fillRect(x+2,432-hgt-16,7,6);ctx.fillStyle='#222';ctx.fillRect(x-5,432-hgt-15,3,4);ctx.fillRect(x+6,432-hgt-15,3,4)}
 }
 if(st!=='ready')for(const t of deaths){const x=200+(t.d-d)*PX+70;if(x<-30||x>W+30||t.d>d+40)continue;ctx.fillStyle='#6f7680';rrect(x-13,418,26,36,10);ctx.fill();ctx.fillStyle='#4b5159';ctx.fillRect(x-2,424,4,14);ctx.fillRect(x-7,429,14,4);txt(t.d.toFixed(0)+'m',x,464,11,'#33383f','center',true)}
 if(d>400){
  const gx=200+(500-d)*PX+120,hgt=520;ctx.fillStyle='#4a5568';ctx.fillRect(gx-90,392-hgt,360,hgt+90);
  ctx.fillStyle='rgba(180,215,240,.5)';for(let y=392-hgt+14;y<380;y+=26)for(let x=gx-80;x<gx+260;x+=28)ctx.fillRect(x,y,18,16);
  ctx.fillStyle='#263238';ctx.fillRect(gx-40,336,90,120);ctx.fillStyle='rgba(160,200,230,.55)';ctx.fillRect(gx-34,342,38,108);ctx.fillRect(gx+8,342,36,108);
  txt('{{t:last-hair.msg.040}}',gx+5,318,16,'#fff','center',true);
  const look=g.ev.look&&g.ev.look.tele<=0,ix=285,iy=440;
  ctx.fillStyle='#37474f';rrect(ix-15,iy-62,30,62,10);ctx.fill();ctx.fillStyle='#e3c3a5';ctx.beginPath();ctx.arc(ix,iy-74,13,0,7);ctx.fill();
  if(look){ctx.fillStyle='#222';ctx.fillRect(ix-8,iy-77,4,4);ctx.fillRect(ix+4,iy-77,4,4);ctx.fillRect(ix-6,iy-68,12,2);txt('！',ix,iy-104,26,'#ff5252','center',true,'#000')}
  else{ctx.fillStyle='#3b2f2a';ctx.beginPath();ctx.arc(ix,iy-77,12,Math.PI,0);ctx.fill()}
 }
}
function drawStreaks(dt){
 const w=g.wind,a=clamp(Math.abs(w),0,1);ctx.strokeStyle='rgba(255,255,255,'+(.15+a*.45)+')';ctx.lineWidth=2;ctx.lineCap='round';
 for(const s of streaks){s.x-=Math.sign(w)*a*700*s.v*dt;if(s.x<-60)s.x=W+20;if(s.x>W+60)s.x=-20;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.sign(w)*s.l*(.4+a),s.y);ctx.stroke()}
 if(g.zoneIdx===3)for(const s of ups){s.y-=340*s.v*dt;if(s.y<0){s.y=SCENE_H;s.x=Math.random()*W}ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x,s.y+s.l);ctx.stroke()}
}
const SKIN='#f1c9a0';
function drawHair(i,pressing,dtr){
 const h=g.hairs[i];if(!h.alive)return;
 const rx=(i-1)*24,ry=-Math.sqrt(44*44-rx*rx)+3,L=72;
 const lift=1-h.glue/100,s=Math.sign(g.wind)||1,vis=clamp(g.E*h.k*1.25,0,1.2),ph=i*2.1;
 const a=.2+.6*Math.sin(time*(9+i*2)+ph)*clamp(vis,0,1);
 let wtx=-s*L*Math.cos(a),wty=-L*Math.sin(a)-8;
 if(g.zoneIdx===3){wtx*=.35;wty=wty*.35-L*.65}
 const m=clamp(vis*1.7,0,1);
 let tx=lerp(-.3*L,wtx,m),ty=lerp(.55*L,wty,m);
 tx=lerp(-36,tx,lift);ty=lerp(9,ty,lift);
 if(pressing){tx=-36;ty=12}
 const sh=hs[i];if(!sh.init){sh.tx=tx;sh.ty=ty;sh.init=true}
 const k=Math.min(1,dtr*16);sh.tx+=(tx-sh.tx)*k;sh.ty+=(ty-sh.ty)*k;
 const wob=Math.sin(time*22+ph)*9*clamp(vis,0,1)*lift;
 ctx.beginPath();ctx.moveTo(rx,ry);ctx.quadraticCurveTo(rx+sh.tx*.5+wob,ry+sh.ty*.5-lift*12-wob*.6,rx+sh.tx,ry+sh.ty);
 ctx.strokeStyle='#1d1610';ctx.lineWidth=3.2;ctx.lineCap='round';ctx.stroke();
 if(h.glue>55){ctx.strokeStyle='rgba(255,235,150,.65)';ctx.lineWidth=1;ctx.stroke()}
}
function drawMan(dtr,opt){
 opt=opt||{};const lost=opt.lost,pressing=!lost&&g.pressing;
 const tilt=g.tilt,bob=lost?0:Math.sin(g.dist*2.4)*3,px=200,py=(lost?405:352)+bob,ang=lost?.5:tilt*.4;
 const alive=aliveN(),sw=g.dist*2.4,ls=lost?0:Math.sin(sw)*16;
 ctx.fillStyle='#232b3e';
 rrect(px-28+ls*.4,py+92,22,56+(lost?-14:0),8);ctx.fill();rrect(px+6-ls*.4,py+92,22,56+(lost?-14:0),8);ctx.fill();
 ctx.fillStyle='#111';rrect(px-32+ls*.4,py+140+(lost?-14:0),30,12,6);ctx.fill();rrect(px+4-ls*.4,py+140+(lost?-14:0),30,12,6);ctx.fill();
 ctx.fillStyle='#2f3b57';rrect(px-44,py-2,88,104,22);ctx.fill();
 ctx.fillStyle='#f5f5f5';ctx.beginPath();ctx.moveTo(px-14,py-2);ctx.lineTo(px+14,py-2);ctx.lineTo(px,py+38);ctx.closePath();ctx.fill();
 ctx.fillStyle='#c62828';ctx.beginPath();ctx.moveTo(px-5,py+6);ctx.lineTo(px+5,py+6);ctx.lineTo(px+7,py+56);ctx.lineTo(px,py+64);ctx.lineTo(px-7,py+56);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#2f3b57';ctx.lineWidth=20;ctx.lineCap='round';
 if(!lost){ctx.beginPath();ctx.moveTo(px-42,py+16);ctx.lineTo(px-52-ls*.2,py+86);ctx.stroke();ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(px-52-ls*.2,py+94,10,0,7);ctx.fill()}
 ctx.save();ctx.translate(px,py);ctx.rotate(ang);ctx.translate(0,-56);
 ctx.fillStyle='#e6b88e';ctx.beginPath();ctx.arc(-44,2,8,0,7);ctx.arc(44,2,8,0,7);ctx.fill();
 ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(0,0,44,0,7);ctx.fill();
 if(alive<3){ctx.fillStyle='rgba(255,255,255,'+(alive===1?.5:.28)+')';ctx.beginPath();ctx.ellipse(-8,-30,18,7,-.3,0,7);ctx.fill()}
 const cr=g.crampLocked,sad=alive<=1||lost,emb=g.slowT>0;
 ctx.fillStyle='#222';ctx.strokeStyle='#222';ctx.lineWidth=3;
 if(cr||lost){[-15,15].forEach(x=>{ctx.beginPath();ctx.moveTo(x-5,-7);ctx.lineTo(x+5,3);ctx.moveTo(x+5,-7);ctx.lineTo(x-5,3);ctx.stroke()})}
 else{[-15,15].forEach(x=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,-2,8,0,7);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x+clamp(g.wind,-1,1)*-2,alive===1?1:-1,alive===1?2.6:3.6,0,7);ctx.fill()})}
 ctx.beginPath();ctx.moveTo(-24,alive<3||sad?-14:-16);ctx.lineTo(-8,alive<3?-17:-14);ctx.moveTo(24,alive<3||sad?-14:-16);ctx.lineTo(8,alive<3?-17:-14);ctx.stroke();
 ctx.beginPath();if(cr||sad){ctx.moveTo(-10,24);ctx.quadraticCurveTo(0,15,10,24)}else if(emb){ctx.moveTo(-9,21);ctx.lineTo(-3,24);ctx.lineTo(3,20);ctx.lineTo(9,23)}else if(alive===3){ctx.moveTo(-11,17);ctx.quadraticCurveTo(0,27,11,17)}else{ctx.moveTo(-9,21);ctx.lineTo(9,21)}ctx.stroke();
 if(emb){ctx.fillStyle='rgba(255,90,90,.35)';ctx.beginPath();ctx.arc(-26,10,9,0,7);ctx.arc(26,10,9,0,7);ctx.fill()}
 if(g.sweat>.3){ctx.fillStyle='#4fc3f7';for(let i=0;i<3;i++){const y=-30+((time*40+i*20)%50);ctx.beginPath();ctx.arc(-34+i*34,y,3+g.sweat*2,0,7);ctx.fill()}}
 if(opt.beard){ctx.strokeStyle='#1d1610';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-30+i*6,14);ctx.quadraticCurveTo(-8,34+i*4,30-i*6,14+i*3);ctx.stroke()}}
 for(let i=0;i<3;i++)drawHair(i,pressing,dtr);
 ctx.restore();
 ctx.strokeStyle='#2f3b57';ctx.lineWidth=20;ctx.lineCap='round';ctx.fillStyle=SKIN;
 const sx=px+42,sy=py+16;
 if(lost){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(px+24,py-36);ctx.stroke();ctx.beginPath();ctx.moveTo(px-42,sy);ctx.lineTo(px-24,py-36);ctx.stroke();ctx.beginPath();ctx.arc(px-22,py-44,14,0,7);ctx.arc(px+22,py-44,14,0,7);ctx.fill()}
 else if(pressing){const hx=px+100*Math.sin(ang),hy=py-100*Math.cos(ang)+4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(hx+28,hy+22);ctx.stroke();ctx.beginPath();ctx.arc(hx,hy,24,0,7);ctx.fill();ctx.strokeStyle='#d9a97c';ctx.lineWidth=2;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(hx+i*9-4,hy-20);ctx.lineTo(hx+i*9-4,hy-4);ctx.stroke()}if(g.sweat>.5){ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(hx-8,hy-10,8,4,-.4,0,7);ctx.fill()}}
 else if(g.ev.greet){const wy=py-60+Math.sin(time*14)*12;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(px+82,wy+20);ctx.stroke();ctx.beginPath();ctx.arc(px+84,wy,14,0,7);ctx.fill()}
 else if(g.ev.flyer&&g.ev.flyer.tele<=0){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(px+66,py+36);ctx.stroke();ctx.beginPath();ctx.arc(px+68,py+40,10,0,7);ctx.fill();ctx.fillStyle='#fff59d';ctx.save();ctx.translate(px+74,py+28);ctx.rotate(.3);ctx.fillRect(-12,-16,26,34);ctx.restore()}
 else{ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(px+52+ls*.2,py+86);ctx.stroke();ctx.beginPath();ctx.arc(px+52+ls*.2,py+94,10,0,7);ctx.fill()}
}
function drawEventsWorld(){
 const e=g.ev,C=game.config;
 if(e.flyer){const t=e.flyer.tele>0?1-e.flyer.tele/C.flyer.tele:1,x=lerp(430,318,t);ctx.fillStyle='#ef6c00';rrect(x-16,372,32,70,12);ctx.fill();ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,358,13,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-10,350,20,4)}
 if(e.drip&&e.drip.tele>0){const t=1-e.drip.tele/C.drip.tele,y=lerp(10,215,t*t);ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(200,232,20*t+6,5,0,0,7);ctx.fill();ctx.fillStyle='#4fc3f7';ctx.beginPath();ctx.moveTo(200,y-14);ctx.quadraticCurveTo(212,y+6,200,y+10);ctx.quadraticCurveTo(188,y+6,200,y-14);ctx.fill()}
 if(e.vortex){const n=7,t=e.vortex.started?time:time*.7;ctx.fillStyle='rgba(40,40,50,.85)';for(let i=0;i<n;i++){const x=((t*160+i*71)%520)-60,y=120+(i%4)*28+Math.sin(t*8+i)*10,f=Math.sin(t*24+i)*6;ctx.beginPath();ctx.moveTo(x-12,y);ctx.quadraticCurveTo(x,y-8-f,x+12,y);ctx.quadraticCurveTo(x,y+2+f*.5,x-12,y);ctx.fill()}}
 for(const f of flyHairs){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.r);ctx.strokeStyle='#1d1610';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,0);ctx.quadraticCurveTo(0,-12,30,4);ctx.stroke();ctx.restore()}
}
function bannerList(){
 const b=[],e=g.ev,c=game.config;
 if(g.crampLocked)b.push(['脖子抽筋！僵直 '+Math.max(0,g.crampLock).toFixed(1)+'s','#ff7043']);
 else if(g.cramp>=c.cramp.warn)b.push(['{{t:last-hair.msg.041}}','#ffb74d']);
 if(e.greet)b.push(['打招呼！放開手揮一揮 '+(e.greet.wave/c.greet.need*100|0)+'%','#aed581']);
 if(e.flyer)b.push([e.flyer.tele>0?'{{t:last-hair.msg.042}}':'傳單！手被佔住 '+Math.max(0,e.flyer.t).toFixed(1)+'s','#ffd54f']);
 if(e.drip)b.push(['{{t:last-hair.msg.043}}','#4fc3f7']);
 if(e.vortex)b.push([e.vortex.started?'{{t:last-hair.msg.044}}':'{{t:last-hair.msg.045}}','#90a4ae']);
 if(e.look)b.push([e.look.tele>0?'{{t:last-hair.msg.046}}':'{{t:last-hair.msg.047}}','#ff8a80']);
 if(g.slowT>0)b.push(['{{t:last-hair.msg.048}}','#ff8a80']);
 return b.slice(0,2);
}
function drawHUD(){
 ctx.fillStyle='rgba(0,0,0,.35)';rrect(14,12,372,14,7);ctx.fill();
 ctx.fillStyle='#ffd54f';rrect(14,12,Math.max(14,372*g.dist/500),14,7);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.7)';[100,250,400].forEach(m=>ctx.fillRect(14+372*m/500-1,12,2,14));
 txt(g.dist.toFixed(0)+' / 500m',200,40,13,'#fff','center',true,'rgba(0,0,0,.5)');
 for(let i=0;i<3;i++){
  const h=g.hairs[i],x=14+i*58;
  ctx.strokeStyle=h.alive?'#1d1610':'#777';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();
  if(h.alive){ctx.moveTo(x,62);ctx.quadraticCurveTo(x+10,50,x+26,60);ctx.stroke();bar(x,68,50,5,h.glue/100,'#ffd54f');bar(x,76,50,5,h.root/100,'#ef5350')}
  else{ctx.moveTo(x+6,52);ctx.lineTo(x+24,66);ctx.moveTo(x+24,52);ctx.lineTo(x+6,66);ctx.stroke()}
 }
 txt('{{t:last-hair.msg.049}}',14,92,10,'rgba(255,255,255,.75)','left',false,'rgba(0,0,0,.35)');
 txt('{{t:last-hair.msg.050}}',258,62,12,'#fff','right',true,'rgba(0,0,0,.4)');bar(264,56,122,10,g.sideEye/100,g.sideEye>70?'#ff5252':'#ff9800');
 txt('{{t:last-hair.msg.051}}',258,82,12,'#fff','right',true,'rgba(0,0,0,.4)');bar(264,76,122,10,g.sweat,g.sweat>.6?'#29b6f6':'#80deea');
 const w=g.wind,a=clamp(Math.abs(w),0,1.2),dir=-Math.sign(w)||-1,len=22+54*a,cx=200,cy=112;
 ctx.save();ctx.translate(cx,cy);ctx.scale(dir,1);ctx.fillStyle='rgba(255,213,79,'+(.5+a*.5)+')';ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(len-26,-22);ctx.lineTo(len-26,-9);ctx.lineTo(-len,-9);ctx.lineTo(-len,9);ctx.lineTo(len-26,9);ctx.lineTo(len-26,22);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
 if(g.tele){if(Math.floor(time*8)%2){const side=g.tele.dir>0?1:-1;ctx.save();ctx.translate(200+side*150,112);ctx.scale(-side,1);ctx.fillStyle='#ff8a65';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-6,-16);ctx.lineTo(-6,16);ctx.closePath();ctx.fill();ctx.restore();txt('{{t:last-hair.msg.052}}',200+side*150,138,13,'#ff8a65','center',true,'rgba(0,0,0,.5)')}}
 const bl=bannerList();
 if(tipT>0&&!bl.length){ctx.globalAlpha=clamp(tipT,0,1);ctx.fillStyle='rgba(0,0,0,.5)';rrect(20,160,360,30,15);ctx.fill();txt(tipText,200,175,14,'#fff','center',true,null,340);ctx.globalAlpha=1}
 bl.forEach((it,i)=>{ctx.fillStyle='rgba(0,0,0,.62)';rrect(30,158+i*36,340,30,15);ctx.fill();txt(it[0],200,173+i*36,16,it[1],'center',true,null,320)});
}
function drawControls(){
 ctx.fillStyle='#242a38';ctx.fillRect(0,SCENE_H,W,H-SCENE_H);ctx.fillStyle='#10131b';ctx.fillRect(0,SCENE_H,W,3);
 const pd=padBox(),b=btnBox(),y=612;
 ctx.fillStyle='rgba(255,255,255,.07)';rrect(pd.cx-pd.r-14,y-70,pd.r*2+28,140,22);ctx.fill();
 txt('{{t:last-hair.msg.053}}',pd.cx-52,y-50,14,'rgba(255,255,255,.7)');
 {const v=g.crampLocked?1:g.cramp/game.config.cramp.trigger;bar(pd.cx-24,y-56,76,10,v,v>.66?'#ff5252':'#ffb74d')}
 if(st==='run'){
  const s=Math.sign(g.wind)||1,pulse=.6+.4*Math.sin(time*8);
  if(Math.abs(g.wind)>.2){ctx.strokeStyle='rgba(105,240,174,'+pulse+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(pd.cx+s*.8*pd.r,y,28,0,7);ctx.stroke();txt('▼',pd.cx+s*.8*pd.r,y-36,14,'#69f0ae')}
  if(g.tele&&Math.floor(time*8)%2){ctx.strokeStyle='rgba(255,138,101,.9)';ctx.setLineDash([6,6]);ctx.lineWidth=4;ctx.beginPath();ctx.arc(pd.cx+(g.tele.dir>0?1:-1)*.8*pd.r,y,28,0,7);ctx.stroke();ctx.setLineDash([])}
 }
 ctx.fillStyle='#3b4358';rrect(pd.cx-pd.r,y-7,pd.r*2,14,7);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(pd.cx-1,y-12,2,24);
 const lim=game.config.cramp.limit*pd.r;ctx.fillStyle='rgba(255,112,67,.5)';ctx.fillRect(pd.cx-pd.r,y-7,pd.r-lim,14);ctx.fillRect(pd.cx+lim,y-7,pd.r-lim,14);
 const kx=pd.cx+input.tilt*pd.r;ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(kx,y,22,0,7);ctx.fill();ctx.strokeStyle='#8d6e00';ctx.lineWidth=3;ctx.stroke();
 txt('{{t:last-hair.msg.054}}',pd.cx-pd.r+8,y+46,13,'rgba(255,255,255,.7)','left');txt('{{t:last-hair.msg.055}}',pd.cx+pd.r-8,y+46,13,'rgba(255,255,255,.7)','right');
 const locked=g.pressLock>0,on=g.pressing;
 ctx.fillStyle=locked?'#4a4f5c':(on?'#ff8f00':'#e65100');ctx.beginPath();ctx.arc(b.cx,b.cy,b.r,0,7);ctx.fill();
 ctx.lineWidth=6;ctx.strokeStyle=on?'#ffe0b2':'rgba(0,0,0,.35)';ctx.stroke();
 if(g.sweat>.05){ctx.strokeStyle='#4fc3f7';ctx.lineWidth=7;ctx.beginPath();ctx.arc(b.cx,b.cy,b.r+8,-Math.PI/2,-Math.PI/2+Math.PI*2*g.sweat);ctx.stroke()}
 txt(locked?'{{t:last-hair.msg.056}}':'{{t:last-hair.msg.057}}',b.cx,b.cy-6,20,'#fff');if(!locked)txt('{{t:last-hair.msg.058}}',b.cx,b.cy+20,13,'rgba(255,255,255,.8)','center',false);
}
function wrapC(s,x,y,w,lh,size,col,align){
 // Translate the whole sentence first so English wraps on words instead of on Chinese characters.
 const T=window.deepSeaI18n&&window.deepSeaI18n.text,str=T?String(T(s)):s,words=/[\u3400-\u9fff]/.test(str)?Array.from(str):str.split(' '),sep=/[\u3400-\u9fff]/.test(str)?'':' ';
 ctx.font='bold '+size+'px '+FONT;let line='',yy=y;
 for(const word of words){const next=line?line+sep+word:word;if(line&&ctx.measureText(next).width>w){txt(line,x,yy,size,col,align);line=word;yy+=lh}else line=next}
 txt(line,x,yy,size,col,align);
}
const TOGGLES=()=>[[24,swap?'{{t:last-hair.msg.059}}':'{{t:last-hair.msg.060}}'],[204,soundOn?'{{t:last-hair.msg.061}}':'{{t:last-hair.msg.062}}']];
function drawReady(){
 const keep=g;g=idleG;idleG.E=.05;idleG.wind=Math.sin(time*1.5)*.15;
 drawScene();drawMan(.016,{});g=keep;
 ctx.fillStyle='rgba(16,19,27,.72)';ctx.fillRect(0,0,W,190);
 txt('{{t:last-hair.msg.063}}',200,54,44,'#ffd54f','center',true,'#000');txt('{{t:last-hair.msg.064}}',200,100,22,'#fff','center',true);
 txt('{{t:last-hair.msg.065}}',200,140,15,'rgba(255,255,255,.85)','center',false);
 ctx.fillStyle='rgba(16,19,27,.92)';ctx.fillRect(0,SCENE_H,W,H-SCENE_H);
 ['{{t:last-hair.msg.023}}','{{t:last-hair.msg.066}}','{{t:last-hair.msg.067}}'].forEach((s,i)=>txt(s,200,556+i*22,14,'rgba(255,255,255,.88)','center',false,null,370));
 ctx.globalAlpha=.6+.4*Math.sin(time*4);txt('{{t:last-hair.msg.068}}',200,624,20,'#ffd54f');ctx.globalAlpha=1;
 TOGGLES().forEach(it=>{ctx.fillStyle='#3b4358';rrect(it[0],642,172,42,14);ctx.fill();txt(it[1],it[0]+86,663,16,'#fff','center',true,null,160)});
 txt('最遠紀錄 '+best.toFixed(0)+' m',200,704,14,'rgba(255,255,255,.7)','center',false);
}
function drawOver(){
 const won=g.won;
 drawScene();drawStreaks(0);drawMan(.016,{lost:!won,beard:won&&g.rankKey==='BEARD'});drawEventsWorld();
 if(!won){ctx.save();ctx.globalCompositeOperation='saturation';ctx.fillStyle='#808080';ctx.fillRect(0,0,W,SCENE_H);ctx.restore();ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,SCENE_H)}
 ctx.fillStyle='rgba(16,19,27,.96)';ctx.fillRect(0,SCENE_H,W,H-SCENE_H);ctx.fillStyle='#10131b';ctx.fillRect(0,SCENE_H,W,3);
 if(won){
  const r=RANKS[g.rankKey];txt('{{t:last-hair.msg.069}}',200,552,15,'rgba(255,255,255,.8)');
  txt(r.big,64,622,76,r.col,'center',true,'#000');txt(r.title,124,582,24,r.col,'left',true,null,270);
  wrapC(r.desc,124,606,272,18,13,'rgba(255,255,255,.92)','left');
  txt(HAIR_LEFT[aliveN()],130,682,14,'rgba(255,255,255,.65)','center',false);txt('用時 '+g.t.toFixed(0)+' 秒',270,682,14,'rgba(255,255,255,.65)','center',false);
 }else{
  txt('{{t:last-hair.msg.070}}',200,556,28,'#eceff1','center',true);txt('{{t:last-hair.msg.071}}',200,584,17,'#eceff1','center',true,null,370);
  txt('死於 '+g.deathDist.toFixed(1)+'m',200,612,20,'#ffcc80');wrapC('— '+causeText,200,636,340,20,15,'#eceff1');
  txt('最遠紀錄 '+best.toFixed(0)+' m',200,676,14,'rgba(255,255,255,.65)','center',false);
 }
 if(time-endAt>.8){ctx.globalAlpha=.6+.4*Math.sin(time*4);txt('{{t:last-hair.msg.072}}',200,704,18,'#ffd54f');ctx.globalAlpha=1}
}
function draw(dt){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
 if(st==='ready'){drawReady();return}
 if(st==='over'){drawOver();return}
 ctx.save();if(g.crampLocked)ctx.translate((Math.random()-.5)*4,(Math.random()-.5)*3);
 drawScene();drawStreaks(dt);drawMan(dt);drawEventsWorld();ctx.restore();
 drawHUD();drawControls();
 for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t-=dt;if(f.t<=0){floats.splice(i,1);continue}ctx.globalAlpha=clamp(f.t/(f.d*.5),0,1);txt(f.text,f.x,f.y-(1-f.t/f.d)*36,f.size,f.col,'center',true,'rgba(0,0,0,.6)');ctx.globalAlpha=1}
 for(let i=flyHairs.length-1;i>=0;i--){const f=flyHairs[i];f.t-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=120*dt;f.r+=5*dt;if(f.t<=0)flyHairs.splice(i,1)}
 if(paused){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,W,H);txt('{{t:last-hair.msg.073}}',200,320,36,'#fff');txt('{{t:last-hair.msg.074}}',200,380,22,'#ffd54f')}
}
// ---- input ----
const shown=()=>!$('view-last-hair').hidden&&!document.hidden;
const toLocal=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}};
const clampT=v=>Math.max(-1,Math.min(1,v));
function recomputePress(){let n=0;ptrs.forEach(v=>{if(v==='press')n++});input.press=n>0}
function clearInput(){ptrs.clear();input.press=false;input.tilt=0;kbL=kbR=kbPress=false}
function pauseNow(){if(st==='run'&&!paused){paused=true;clearInput()}last=performance.now()}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('last-hair',amount);hairBusy=true;hairStake=amount;save();renderAll();
 game=hairRules.create(random||Math.random);g=game.state;earned=0;rewarded=0;rec=false;floats.length=0;flyHairs.length=0;hs.forEach(h=>{h.init=false});clearInput();paused=false;
 tipText=TIPS[0];tipT=4.5;st='run';last=performance.now();say('{{t:last-hair.msg.075}}');ui();c.focus();
 },ui);
}
$('lh-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(!shown())return;
 audioInit();const p=toLocal(e);
 if(st!=='run'){
  e.preventDefault();
  if(st==='ready'){
   if(p.y>642&&p.y<684){
    if(p.x>24&&p.x<196){swap=!swap;lsSet('deep-sea-last-hair-swap',swap?'1':'0')}
    else if(p.x>204&&p.x<376){soundOn=!soundOn;lsSet('deep-sea-last-hair-sound',soundOn?'1':'0');if(soundOn)audioInit()}
    else say('{{t:last-hair.msg.076}}');
   }else say('{{t:last-hair.msg.076}}');
  }else say('{{t:last-hair.msg.077}}');
  return;
 }
 e.preventDefault();c.focus();
 if(paused){paused=false;last=performance.now();return}
 try{c.setPointerCapture(e.pointerId)}catch(_){}
 const role=e.pointerType==='mouse'?'press':((p.x<W/2)!==swap?'tilt':'press');
 ptrs.set(e.pointerId,role);
 if(role==='tilt'){const pd=padBox();input.tilt=clampT((p.x-pd.cx)/pd.r)}
 recomputePress();
});
c.addEventListener('pointermove',e=>{
 if(st!=='run'||paused||!shown())return;const p=toLocal(e);
 if(e.pointerType==='mouse'){input.tilt=clampT((p.x-W/2)/170);return}
 if(ptrs.get(e.pointerId)==='tilt'){const pd=padBox();input.tilt=clampT((p.x-pd.cx)/pd.r)}
});
const endPointer=e=>{ptrs.delete(e.pointerId);recomputePress()};
c.addEventListener('pointerup',endPointer);c.addEventListener('pointercancel',endPointer);c.addEventListener('lostpointercapture',endPointer);
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();kbL=true;input.tilt=-1}
 else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();kbR=true;input.tilt=1}
 else if(e.key===' '||e.key==='j'||e.key==='J'||e.key==='ArrowDown'){e.preventDefault();kbPress=true}
});
addEventListener('keyup',e=>{
 if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){kbL=false;if(!kbR)input.tilt=0}
 else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){kbR=false;if(!kbL)input.tilt=0}
 else if(e.key===' '||e.key==='j'||e.key==='J'||e.key==='ArrowDown')kbPress=false;
});
addEventListener('blur',pauseNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseNow();else last=performance.now()});
window.addEventListener('hashchange',pauseNow);
let flapT=0;
function loop(t){
 const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;
 if(shown()){
  time+=dt;
  if(st==='run'&&!paused){
   tipT=Math.max(0,tipT-dt);
   const code=(Math.round(clamp(input.tilt,-1,1)*100)+100)*2+Number(input.press||kbPress);
   if(game.control!==code){hairRules.input(game,code);rank.record(code);}
   rank.update(dt*1000,()=>st==='run'&&!paused,step=>{hairRules.advance(game,step);
   if(!g.over||g.won)milestones();
   handleEvents();});
   if(!g.over)milestones();else if(g.won)milestones();
   if(g.E>.35){flapT+=dt;if(flapT>.16){flapT=0;SFX.flap()}}
   handleEvents();
  }
  ui();draw(dt);
 }
 requestAnimationFrame(loop);
}
ui();draw(0);requestAnimationFrame(loop);
  })();
