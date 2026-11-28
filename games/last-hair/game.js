  /* ---------- The Last Hair: slide the neck to lean into the wind, hold to press the hair down; reach the interview with at least one hair ---------- */
  var hairBusy=false,hairStake=0,hairSay=function(){};
  (function(){
// ===== 全部數值集中在 CONFIG =====
const {CONFIG,clamp,createGame,rankOf}=hairRules;
const c=$('lh-canvas'),ctx=c.getContext('2d'),W=400,H=720,SCENE_H=482,PX=18;
const DPR=Math.min(2,Math.max(1,window.devicePixelRatio||1));
c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);
const FONT='"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
// Reference-derived production artwork, not a code approximation of the approved character.
const art={};let artFailed=false;
if(typeof Image!=='undefined'){
 for(const [key,path] of Object.entries({city:'city-v2.webp',walk:'character-v2/hair_walk.webp',protect:'character-v2/hair_protect.webp',lost:'character-v2/hair_lost.webp'})){
  const image=new Image();image.onerror=()=>{artFailed=true};image.src='games/last-hair/art/'+path;art[key]=image;
 }
}
const artReady=()=>typeof Image==='undefined'||Object.values(art).every(image=>image.complete&&image.naturalWidth>0);
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
 $('lh-amount').disabled=hairBusy;$('lh-go').disabled=live||rank.busy()||!artReady();setText('lh-go',live?'{{t:last-hair.msg.027}}':st==='over'?'{{t:last-hair.msg.028}}':'{{t:last-hair.msg.029}}');
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
// Approved direction v2: generated with the approved board as an image reference.
const INK='#263b42',PAPER='#ffedca';
function inkBox(x,y,w,h,r,fill,line=INK){ctx.fillStyle=fill;rrect(x,y,w,h,r);ctx.fill();if(line){ctx.strokeStyle=line;ctx.lineWidth=2;ctx.stroke()}}
function drawScene(){
 const d=g.dist;
 if(art.city&&art.city.complete&&art.city.naturalWidth){
  // Slow, bounded camera travel avoids stretching or a visible repeating seam.
  const zoom=1.07,drift=Math.sin(d/100)*10;
  ctx.drawImage(art.city,-14+drift,-26,W*zoom,SCENE_H*zoom);
 }else{ctx.fillStyle='#284f5a';ctx.fillRect(0,0,W,SCENE_H)}
 const shade=ctx.createLinearGradient(0,0,0,200);shade.addColorStop(0,'rgba(24,51,62,.85)');shade.addColorStop(1,'rgba(24,51,62,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,200);
 // Decorative leaves remain animated independently of the painted scene.
 ctx.fillStyle='#bb9852';
 for(let i=0;i<5;i++){const x=((i*103-d*32)%460+460)%460-30,y=242+(i*53)%210;ctx.save();ctx.translate(x,y+Math.sin(time*2+i)*12);ctx.rotate(time+i);ctx.beginPath();ctx.ellipse(0,0,6,2,0,0,7);ctx.fill();ctx.restore()}
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
 let tx=lerp(-18,wtx,m),ty=lerp(-60,wty,m);
 tx=lerp(-16,tx,lift);ty=lerp(-55,ty,lift);
 if(pressing){tx=-18;ty=-42}
 const sh=hs[i];if(!sh.init){sh.tx=tx;sh.ty=ty;sh.init=true}
 const k=Math.min(1,dtr*16);sh.tx+=(tx-sh.tx)*k;sh.ty+=(ty-sh.ty)*k;
 const wob=Math.sin(time*22+ph)*9*clamp(vis,0,1)*lift;
 ctx.beginPath();ctx.moveTo(rx,ry);ctx.quadraticCurveTo(rx+sh.tx*.5+wob,ry+sh.ty*.5-lift*12-wob*.6,rx+sh.tx,ry+sh.ty);
 ctx.strokeStyle='#1d1610';ctx.lineWidth=3.2;ctx.lineCap='round';ctx.stroke();
 if(h.glue>55){ctx.strokeStyle='rgba(255,235,150,.65)';ctx.lineWidth=1;ctx.stroke()}
}
function drawMan(dtr,opt){
 opt=opt||{};
 const pose=opt.lost?'lost':g.pressing?'protect':'walk',image=art[pose];
 if(!image||!image.complete||!image.naturalWidth)return;
 const bob=opt.lost?0:Math.sin(g.dist*2.4)*2,scale=.54,px=57,py=174+bob;
 ctx.save();ctx.translate(200,455);ctx.rotate(opt.lost?0:g.tilt*.085);ctx.translate(-200,-455);
 ctx.fillStyle='rgba(25,39,43,.2)';ctx.beginPath();ctx.ellipse(203,467,88,9,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(image,px,py,512*scale,560*scale);
 // The crown hairs remain individual live entities. They are not baked into the artwork.
 // Anchors measured on the sliced 512×560 pose images; pose scale is shared by sprite-gen.
 if(!opt.lost){
  const crown=pose==='protect'?{x:323,y:99}:{x:320,y:96};
  ctx.save();ctx.translate(px+crown.x*scale,py+crown.y*scale);ctx.scale(scale*1.2,scale);
  for(let i=0;i<3;i++)drawHair(i,g.pressing,dtr);
  ctx.restore();
 }
 // Added sweat follows the gameplay state, beyond the painted expression.
 if(g.sweat>.3){ctx.fillStyle='#83d2dd';for(let i=0;i<2;i++){const x=px+390*scale+i*8,y=py+100*scale+((time*28+i*15)%25);ctx.beginPath();ctx.ellipse(x,y,2,4,0,0,7);ctx.fill()}}
 if(opt.beard){ctx.strokeStyle=INK;ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(250+i*4,300);ctx.quadraticCurveTo(266,317,278+i*3,298);ctx.stroke()}}
 ctx.restore();
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
 inkBox(12,8,376,32,14,'rgba(27,51,61,.86)');
 txt(g.dist.toFixed(0)+' / 500m',200,23,17,PAPER);
 bar(20,42,360,4,g.dist/500,'#edbc4a','rgba(255,237,202,.2)');
 for(let i=0;i<3;i++){
  const h=g.hairs[i],x=12+i*127;
  inkBox(x,53,122,48,12,'rgba(255,237,202,.96)');
  ctx.strokeStyle=h.alive?INK:'#9b9484';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();
  if(h.alive){ctx.moveTo(x+17,89);ctx.quadraticCurveTo(x+17,68,x+32,61)}
  else{ctx.moveTo(x+14,66);ctx.lineTo(x+31,87);ctx.moveTo(x+31,66);ctx.lineTo(x+14,87)}ctx.stroke();
  txt(String(i+1),x+44,64,10,INK,'left');
  bar(x+44,72,67,7,h.alive?h.glue/100:0,'#edbd4b','#d4c4a7');
  bar(x+44,84,67,7,h.alive?h.root/100:0,'#dd725a','#d4c4a7');
 }
 txt('{{t:last-hair.msg.049}}',200,108,9,PAPER);
 inkBox(12,117,183,31,12,'rgba(28,53,61,.9)');inkBox(205,117,183,31,12,'rgba(28,53,61,.9)');
 txt('{{t:last-hair.msg.050}}',22,132,12,PAPER,'left');bar(61,128,121,8,g.sideEye/100,g.sideEye>70?'#ec775b':'#edbd4b','#576c6d');
 txt('{{t:last-hair.msg.051}}',215,132,12,PAPER,'left');bar(254,128,121,8,g.sweat,'#7dd1df','#576c6d');
 const w=g.wind,a=clamp(Math.abs(w),0,1.2),dir=-Math.sign(w)||-1,len=22+40*a,cx=200,cy=171;
 ctx.save();ctx.translate(cx,cy);ctx.scale(dir,1);ctx.fillStyle='#f0c35d';ctx.strokeStyle=INK;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(len-20,-15);ctx.lineTo(len-20,-6);ctx.lineTo(-len,-6);ctx.lineTo(-len,6);ctx.lineTo(len-20,6);ctx.lineTo(len-20,15);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
 if(g.tele){const side=g.tele.dir>0?1:-1;ctx.save();ctx.translate(200+side*150,171);ctx.scale(-side,1);ctx.fillStyle='#f0a06d';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-6,-13);ctx.lineTo(-6,13);ctx.closePath();ctx.fill();ctx.restore();txt('{{t:last-hair.msg.052}}',200+side*145,193,12,PAPER,'center',true,INK)}
 const bl=bannerList();
 if(tipT>0&&!bl.length){inkBox(20,439,360,29,12,'rgba(28,53,61,.94)');txt(tipText,200,453,12,PAPER,'center',true,null,338)}
 bl.forEach((it,i)=>{inkBox(20,398+i*36,360,30,12,'rgba(28,53,61,.94)');txt(it[0],200,413+i*36,14,it[1],'center',true,null,338)});
}
function drawControls(){
 ctx.fillStyle=PAPER;ctx.fillRect(0,SCENE_H,W,H-SCENE_H);ctx.fillStyle='#a9916d';ctx.fillRect(0,SCENE_H,W,3);txt('THE LAST HAIR',200,510,14,INK);
 const pd=padBox(),b=btnBox(),y=612;
 ctx.fillStyle='rgba(139,108,65,.09)';rrect(pd.cx-pd.r-14,y-70,pd.r*2+28,140,22);ctx.fill();
 txt('{{t:last-hair.msg.053}}',pd.cx-52,y-50,14,INK);
 {const v=g.crampLocked?1:g.cramp/game.config.cramp.trigger;bar(pd.cx-24,y-56,76,10,v,v>.66?'#ff5252':'#ffb74d')}
 if(st==='run'){
  const s=Math.sign(g.wind)||1,pulse=.6+.4*Math.sin(time*8);
  if(Math.abs(g.wind)>.2){ctx.strokeStyle='rgba(105,240,174,'+pulse+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(pd.cx+s*.8*pd.r,y,28,0,7);ctx.stroke();txt('▼',pd.cx+s*.8*pd.r,y-36,14,'#69f0ae')}
  if(g.tele&&Math.floor(time*8)%2){ctx.strokeStyle='rgba(255,138,101,.9)';ctx.setLineDash([6,6]);ctx.lineWidth=4;ctx.beginPath();ctx.arc(pd.cx+(g.tele.dir>0?1:-1)*.8*pd.r,y,28,0,7);ctx.stroke();ctx.setLineDash([])}
 }
 ctx.fillStyle='#6f6e5d';rrect(pd.cx-pd.r,y-7,pd.r*2,14,7);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(pd.cx-1,y-12,2,24);
 const lim=game.config.cramp.limit*pd.r;ctx.fillStyle='rgba(255,112,67,.5)';ctx.fillRect(pd.cx-pd.r,y-7,pd.r-lim,14);ctx.fillRect(pd.cx+lim,y-7,pd.r-lim,14);
 const kx=pd.cx+input.tilt*pd.r;ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(kx,y,22,0,7);ctx.fill();ctx.strokeStyle='#8d6e00';ctx.lineWidth=3;ctx.stroke();
 txt('{{t:last-hair.msg.054}}',pd.cx-pd.r+8,y+46,13,INK,'left');txt('{{t:last-hair.msg.055}}',pd.cx+pd.r-8,y+46,13,INK,'right');
 const locked=g.pressLock>0,on=g.pressing;
 ctx.fillStyle=locked?'#7e8175':(on?'#e98b32':'#e36d37');ctx.beginPath();ctx.arc(b.cx,b.cy,b.r,0,7);ctx.fill();
 ctx.lineWidth=6;ctx.strokeStyle=on?'#ffe0b2':'rgba(0,0,0,.35)';ctx.stroke();
 if(g.sweat>.05){ctx.strokeStyle='#4fc3f7';ctx.lineWidth=7;ctx.beginPath();ctx.arc(b.cx,b.cy,b.r+8,-Math.PI/2,-Math.PI/2+Math.PI*2*g.sweat);ctx.stroke()}
 if(art.protect&&art.protect.complete&&art.protect.naturalWidth)ctx.drawImage(art.protect,270,34,220,190,b.cx-35,b.cy-60,70,60);
 txt(locked?'{{t:last-hair.msg.056}}':'{{t:last-hair.msg.057}}',b.cx,b.cy+12,18,'#fff');if(!locked)txt('{{t:last-hair.msg.058}}',b.cx,b.cy+38,12,'#fff1d5','center',false);
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
 ctx.fillStyle='rgba(30,62,72,.94)';ctx.fillRect(0,0,W,190);txt('THE LAST HAIR',200,24,16,PAPER);
 txt('{{t:last-hair.msg.063}}',200,66,38,'#ffd54f','center',true,'#000');txt('{{t:last-hair.msg.064}}',200,100,22,'#fff','center',true);
 txt('{{t:last-hair.msg.065}}',200,140,15,'rgba(255,255,255,.85)','center',false);
 ctx.fillStyle=PAPER;ctx.fillRect(0,SCENE_H,W,H-SCENE_H);txt('THE LAST HAIR',200,510,18,INK);
 ['{{t:last-hair.msg.023}}','{{t:last-hair.msg.066}}','{{t:last-hair.msg.067}}'].forEach((s,i)=>txt(s,200,542+i*25,13,INK,'center',false,null,370));
 txt('{{t:last-hair.msg.068}}',200,624,17,'#795f36');
 TOGGLES().forEach(it=>{ctx.fillStyle='#365a63';rrect(it[0],642,172,42,14);ctx.fill();txt(it[1],it[0]+86,663,16,'#fff','center',true,null,160)});
 txt('最遠紀錄 '+best.toFixed(0)+' m',200,704,14,INK,'center',false);
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
 if(time-endAt>.8){txt('{{t:last-hair.msg.072}}',200,704,18,'#ffd54f')}
}
function draw(dt){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
 if(st==='ready'){drawReady();if(!artReady()){inkBox(20,402,360,56,14,'#ffedca');wrapC(artFailed?'{{t:last-hair.art.error}}':'{{t:last-hair.art.loading}}',200,420,330,18,14,INK)}return}
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
 if(!artReady())return;
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
