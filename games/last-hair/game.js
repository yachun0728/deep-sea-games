  /* ---------- The Last Hair: slide the neck to lean into the wind, hold to press the hair down; reach the interview with at least one hair ---------- */
  var hairBusy=false,hairStake=0,hairSay=function(){};
  (function(){
// ===== 全部數值集中在 CONFIG =====
const {CONFIG,clamp,createGame,rankOf}=hairRules;
const c=$('lh-canvas'),ctx=c.getContext('2d'),PX=18;
let W=400,H=720,SCENE_H=518;
let DPR=Math.min(2,Math.max(1,window.devicePixelRatio||1));
c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);
const FONT='"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
// Reference-derived production artwork, not a code approximation of the approved character.
const art={};let artFailed=false,typeReady=!document.fonts;
if(document.fonts)Promise.all([document.fonts.load('700 24px LastHairLatin'),document.fonts.load('700 24px LastHairHand')]).then(()=>{typeReady=true}).catch(()=>{typeReady=true});
if(typeof Image!=='undefined'){
 for(const [key,path] of Object.entries({city:'city-v2.webp',cityWide:'city-wide-v3.webp',paving:'walk-v4/paving.webp',walk:'character-v2/hair_walk.webp',protect:'character-v2/hair_protect.webp',lost:'character-v2/hair_lost.webp',walkCycle:'walk-v4/walk-cycle.webp',paper:'ui-v4/ui_paper.webp',hold:'ui-v4/hold-exact.webp',hudHair:'hud-v4/hud_hair.webp',hudGlue:'hud-v4/hud_glue.webp',hudRoot:'hud-v4/hud_root.webp',hudEye:'hud-v4/hud_eye.webp',hudSweat:'hud-v4/hud_sweat.webp',hudFlag:'hud-v4/hud_flag.webp',hudWind:'hud-v4/hud_wind.webp',hudDistance:'hud-v4/hud_distance.webp',hudCard:'hud-v4/hud_card.webp',hudMeter:'hud-v4/hud_meter.webp'})){
  const image=new Image();image.onerror=()=>{artFailed=true};image.src='games/last-hair/art/'+path;art[key]=image;
 }
}
const artReady=()=>typeof Image==='undefined'||typeReady&&Object.values(art).every(image=>image.complete&&image.naturalWidth>0);
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
const padBox=()=>({cx:W*(swap?.75:.25),r:Math.min(160,W*.225)}),btnBox=()=>({cx:W*(swap?.22:.78),cy:SCENE_H+99,r:76});
function say(text,kind){$('lh-msg').textContent=text;$('lh-msg').className='msg'+(kind?' '+kind:'')}
hairSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function aliveN(){return g.hairs.filter(h=>h.alive).length}
function ui(){
 const live=st==='run';
 setText('lh-dist',Math.floor(live||st==='over'?g.dist:0)+' m');setText('lh-hairs',(live||st==='over'?aliveN():3)+' / 3');setText('lh-best',best.toFixed(0)+' m');
 $('lh-pause').disabled=!live;$('lh-pause').dataset.paused=paused?'1':'0';setText('lh-pause',paused?'▶':'Ⅱ');
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
 const backdrop=W/SCENE_H>1.05?art.cityWide:art.city;
 if(backdrop&&backdrop.complete&&backdrop.naturalWidth){
  const cover=Math.max(W/backdrop.naturalWidth,SCENE_H/backdrop.naturalHeight),sw=W/cover,sh=SCENE_H/cover;
  const marginX=(backdrop.naturalWidth-sw)/2,sx=marginX+Math.sin(d/100)*Math.min(12,marginX),sy=(backdrop.naturalHeight-sh)*.6;
  ctx.drawImage(backdrop,sx,sy,sw,sh,0,0,W,SCENE_H);
 }else{ctx.fillStyle='#284f5a';ctx.fillRect(0,0,W,SCENE_H)}
 if(art.paving&&art.paving.complete&&art.paving.naturalWidth){
  const height=80,width=art.paving.naturalWidth*height/art.paving.naturalHeight,scale=Math.min(.86,(SCENE_H-206)/690),offset=(d*40*scale)%width;
  for(let x=-offset;x<W;x+=width)ctx.drawImage(art.paving,x,SCENE_H-height,width,height);
 }
 const shade=ctx.createLinearGradient(0,0,0,200);shade.addColorStop(0,'rgba(24,51,62,.2)');shade.addColorStop(1,'rgba(24,51,62,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,200);
 // Decorative leaves remain animated independently of the painted scene.
 ctx.fillStyle='#bb9852';
 for(let i=0;i<5;i++){const span=W+60,x=((i*103-d*32)%span+span)%span-30,y=242+(i*53)%210;ctx.save();ctx.translate(x,y+Math.sin(time*2+i)*12);ctx.rotate(time+i);ctx.beginPath();ctx.ellipse(0,0,6,2,0,0,7);ctx.fill();ctx.restore()}
 ctx.save();ctx.translate((W-400)/2,SCENE_H-482);
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
 ctx.restore();
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
// Full painted short-stocky poses. Upper body is always the approved original artwork.
const WALK_RECTS=[{"x":0,"y":0,"w":512,"h":560},{"x":512,"y":0,"w":512,"h":560},{"x":1024,"y":0,"w":512,"h":560},{"x":1536,"y":0,"w":512,"h":560},{"x":2048,"y":0,"w":512,"h":560},{"x":2560,"y":0,"w":512,"h":560}];
const WALK_WAIST=[368,379,382,375,370,371];
function walkFrameAt(distance){return Math.floor((((distance/6.8)%1)+1)%1*WALK_RECTS.length)}
function clipLegs(){ctx.beginPath();ctx.moveTo(183,342);ctx.lineTo(365,342);ctx.lineTo(365,417);ctx.lineTo(430,457);ctx.lineTo(471,485);ctx.lineTo(490,560);ctx.lineTo(68,560);ctx.lineTo(72,475);ctx.lineTo(128,429);ctx.lineTo(156,389);ctx.closePath();ctx.clip()}
function clipUpper(pressing){
 ctx.beginPath();ctx.rect(0,0,512,348);ctx.rect(196,340,179,38);
 ctx.moveTo(76,278);ctx.lineTo(205,283);ctx.lineTo(209,380);ctx.lineTo(103,384);ctx.closePath();
 // The case stays in its approved hand and size, covering the rear thigh naturally.
 ctx.moveTo(42,342);ctx.lineTo(214,373);ctx.lineTo(188,494);ctx.lineTo(18,450);ctx.closePath();
 if(!pressing){ctx.moveTo(385,342);ctx.lineTo(444,350);ctx.lineTo(459,391);ctx.lineTo(441,422);ctx.lineTo(386,418);ctx.lineTo(374,381);ctx.closePath()}
 ctx.clip();
}
function drawMan(dtr,opt){
 if(!artReady())return;opt=opt||{};
 const scale=Math.min(.9,(SCENE_H-226)/486),px=W/2-256*scale,py=SCENE_H-540*scale-10;
 if(opt.lost){const image=art.lost;if(image?.naturalWidth)ctx.drawImage(image,px,py,512*scale,560*scale);return}
 if(!art.walkCycle?.naturalWidth)return;
 const walking=st==='run'&&!g.over,phase=walking?g.dist/6.8:0,frame=walking?walkFrameAt(g.dist):0,r=WALK_RECTS[frame];
 ctx.fillStyle='rgba(25,39,43,.17)';ctx.beginPath();ctx.ellipse(W/2,SCENE_H-7,65*scale,7*scale,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(px,py);ctx.scale(scale,scale);
 ctx.save();clipLegs();
 // Register each painted waist to the approved belt while keeping its sole at y=540.
 // This is at most 9% vertical registration; width, head, torso and original leg span stay fixed.
 const sourceWaist=WALK_WAIST[frame],legScale=(540-368)/(540-sourceWaist);
 if(g.pressing&&frame===0)ctx.drawImage(art.protect,0,368,512,192,0,368,512,192);
 else ctx.drawImage(art.walkCycle,r.x,r.y+sourceWaist,r.w,560-sourceWaist,0,368,512,(560-sourceWaist)*legScale);
 ctx.restore();
 const bob=walking?Math.sin(phase*Math.PI*4)*2:0;
 ctx.save();ctx.translate(300,350+bob);ctx.rotate(g.tilt*.065+(walking?Math.sin(phase*Math.PI*2)*.009:0));ctx.translate(-300,-350);
 ctx.save();clipUpper(g.pressing);ctx.drawImage(g.pressing?art.protect:art.walk,0,0);ctx.restore();
 ctx.save();ctx.translate(320,96);ctx.scale(1.2,1);for(let i=0;i<3;i++)drawHair(i,g.pressing,dtr);ctx.restore();
 if(g.sweat>.3){ctx.fillStyle='#83d2dd';for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(392+i*9,135+((time*28+i*15)%25),3,6,0,0,7);ctx.fill()}}
 if(opt.beard){ctx.strokeStyle=INK;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(365+i*5,216);ctx.quadraticCurveTo(390,251,413+i*3,218);ctx.stroke()}}
 ctx.restore();ctx.restore();
}
const handFont=size=>'700 '+size+'px LastHairLatin,LastHairHand,'+FONT;
function paintedText(text,x,y,size,col,align='center',maxWidth,baseline='middle',angle=-.025){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font=handFont(size);ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillStyle=col;ctx.fillText(text,0,0,maxWidth);ctx.restore();
}
function drawPaper(y,height){
 ctx.fillStyle=PAPER;ctx.fillRect(0,y,W,height);
 if(!art.paper?.naturalWidth)return;
 const image=art.paper,sw=image.naturalWidth,sh=image.naturalHeight,edge=Math.min(64,sh/3),target=24;
 const sx=[0,edge,sw-edge,sw],sy=[0,edge,sh-edge,sh],dx=[0,target,W-target,W],dy=[y,y+target,y+height-target,y+height];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(image,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
}
function drawEventsWorld(){
 ctx.save();ctx.translate((W-400)/2,SCENE_H-482);
 const e=g.ev,C=game.config;
 if(e.flyer){const t=e.flyer.tele>0?1-e.flyer.tele/C.flyer.tele:1,x=lerp(430,318,t);ctx.fillStyle='#ef6c00';rrect(x-16,372,32,70,12);ctx.fill();ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,358,13,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-10,350,20,4)}
 if(e.drip&&e.drip.tele>0){const t=1-e.drip.tele/C.drip.tele,y=lerp(10,215,t*t);ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(200,232,20*t+6,5,0,0,7);ctx.fill();ctx.fillStyle='#4fc3f7';ctx.beginPath();ctx.moveTo(200,y-14);ctx.quadraticCurveTo(212,y+6,200,y+10);ctx.quadraticCurveTo(188,y+6,200,y-14);ctx.fill()}
 if(e.vortex){const n=7,t=e.vortex.started?time:time*.7;ctx.fillStyle='rgba(40,40,50,.85)';for(let i=0;i<n;i++){const x=((t*160+i*71)%520)-60,y=120+(i%4)*28+Math.sin(t*8+i)*10,f=Math.sin(t*24+i)*6;ctx.beginPath();ctx.moveTo(x-12,y);ctx.quadraticCurveTo(x,y-8-f,x+12,y);ctx.quadraticCurveTo(x,y+2+f*.5,x-12,y);ctx.fill()}}
 for(const f of flyHairs){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.r);ctx.strokeStyle='#1d1610';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,0);ctx.quadraticCurveTo(0,-12,30,4);ctx.stroke();ctx.restore()}
 ctx.restore();
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
function uiText(text){return window.deepSeaI18n?window.deepSeaI18n.text(text):text}
function paintPlate(image,x,y,width,height,radius=.36){
 if(!image?.naturalWidth)return;
 const sw=image.naturalWidth,sh=image.naturalHeight,edge=Math.min(sh*.46,sw/3),target=height*radius;
 const sx=[0,edge,sw-edge,sw],sy=[0,edge,sh-edge,sh],dx=[x,x+target,x+width-target,x+width],dy=[y,y+target,y+height-target,y+height];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(image,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
}
function hudIcon(image,x,y,width,height){
 if(!image?.naturalWidth)return;
 const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);
}
function paintedMeter(x,y,width,height,value,color){
 ctx.fillStyle='#253c40';rrect(x,y,width,height,height/2);ctx.fill();ctx.strokeStyle='#d8c7a4';ctx.lineWidth=1.4;ctx.stroke();
 if(value<=0)return;
 ctx.save();rrect(x+2,y+2,Math.max(height-4,(width-4)*clamp(value,0,1)),height-4,(height-4)/2);ctx.clip();
 const grad=ctx.createLinearGradient(0,y,0,y+height);grad.addColorStop(0,'#fff0be');grad.addColorStop(.3,color);grad.addColorStop(1,color);ctx.fillStyle=grad;ctx.fillRect(x+2,y+2,width-4,height-4);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+5,y+3,width-10,2);ctx.restore();
}
function distanceLayout(distance){
 ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';
 const text=Math.floor(distance)+' / 500 m',badgeWidth=Math.min(228,W-128),flagWidth=25,gap=9;
 let size=27;ctx.font=handFont(size);let metrics=ctx.measureText(text),textWidth=(metrics.actualBoundingBoxLeft||0)+(metrics.actualBoundingBoxRight||metrics.width);
 if(textWidth+flagWidth+gap>badgeWidth-22){size*= (badgeWidth-22-flagWidth-gap)/textWidth;ctx.font=handFont(size);metrics=ctx.measureText(text);textWidth=(metrics.actualBoundingBoxLeft||0)+(metrics.actualBoundingBoxRight||metrics.width)}
 const width=flagWidth+gap+textWidth,left=(W-width)/2;
 const textY=27.5+((metrics.actualBoundingBoxAscent||size*.75)-(metrics.actualBoundingBoxDescent||0))/2;
 const layout={text,size,badgeWidth,flagWidth,gap,width,left,textX:left+flagWidth+gap+(metrics.actualBoundingBoxLeft||0),textY,textWidth,center:left+width/2,inkCenterY:textY-((metrics.actualBoundingBoxAscent||size*.75)-(metrics.actualBoundingBoxDescent||0))/2};ctx.restore();return layout;
}
function drawHUD(){
 const distance=distanceLayout(g.dist);
 paintPlate(art.hudDistance,(W-distance.badgeWidth)/2,6,distance.badgeWidth,43,.49);
 hudIcon(art.hudFlag,distance.left,12,distance.flagWidth,31);
 paintedText(distance.text,distance.textX,distance.textY,distance.size,PAPER,'left',undefined,'alphabetic',0);
 const cardWidth=(W-32)/3,medallion=Math.min(62,cardWidth*.40),cardHeight=medallion+8,meterY=57+cardHeight+8;
 for(let i=0;i<3;i++){
  const hair=g.hairs[i],x=8+i*(cardWidth+8),y=57;
  paintPlate(art.hudCard,x,y,cardWidth,cardHeight,.3);
  ctx.save();ctx.globalAlpha=hair.alive?1:.3;hudIcon(art.hudHair,x+3,y+4,medallion,medallion);ctx.restore();
  if(!hair.alive){ctx.strokeStyle='#e19a77';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+12,y+14);ctx.lineTo(x+44,y+43);ctx.stroke()}
  const labelX=x+medallion+9,barX=labelX+10,barWidth=x+cardWidth-barX-10;
  paintedText(uiText('{{t:last-hair.hud.hair}}')+' '+(i+1),labelX,y+cardHeight*.21,Math.min(15,cardHeight*.23),PAPER,'left',cardWidth-medallion-14);
  hudIcon(art.hudGlue,labelX-2,y+cardHeight*.40,8,13);paintedMeter(barX,y+cardHeight*.47,barWidth,10,hair.alive?hair.glue/100:0,'#f1c45c');
  hudIcon(art.hudRoot,labelX-3,y+cardHeight*.72,11,11);paintedMeter(barX,y+cardHeight*.76,barWidth,10,hair.alive?hair.root/100:0,'#e97b5f');
 }
 const half=(W-24)/2;
 [{x:8,icon:art.hudEye,label:'{{t:last-hair.hud.suspicion}}',value:g.sideEye/100,color:'#f2c65f'},
  {x:W/2+4,icon:art.hudSweat,label:'{{t:last-hair.hud.sweat}}',value:g.sweat,color:'#72cfdf'}].forEach(item=>{
   paintPlate(art.hudMeter,item.x,meterY,half,40,.46);hudIcon(item.icon,item.x+6,meterY+3,36,34);paintedText(item.label,item.x+48,meterY+10,13,PAPER,'left',half-58);paintedMeter(item.x+48,meterY+23,half-62,11,item.value,item.color);
  });
 const sign=-Math.sign(g.wind)||-1,width=82+Math.min(1,Math.abs(g.wind))*16;
 ctx.save();ctx.translate(W/2-45,193);ctx.scale(sign,1);hudIcon(art.hudWind,-width/2,-21,width,42);ctx.restore();
 paintedText('{{t:last-hair.hud.wind}}',W/2-103,193,18,PAPER,'right',72);
 if(g.tele){paintedText('{{t:last-hair.msg.052}}',W/2,209,13,'#f7c58b');}
 const warnings=bannerList();warnings.forEach((item,i)=>{paintPlate(art.hudMeter,20,SCENE_H-80+i*34,W-40,28,.44);paintedText(item[0],W/2,SCENE_H-66+i*34,14,item[1],'center',W-60)});
}
function drawControls(){
 drawPaper(SCENE_H-5,H-SCENE_H+10);
 const pd=padBox(),button=btnBox(),railY=SCENE_H+82;
 // Same playful ink marks, warm paper, inset slot and golden knob as the approved drawing.
 paintedText('{{t:last-hair.control.balance}}',pd.cx,SCENE_H+28,23,INK,'center',pd.r*2-20);
 ctx.strokeStyle='#776c59';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*(swap?.44:.56),SCENE_H+24);ctx.quadraticCurveTo(W*(swap?.44:.56)+2,SCENE_H+93,W*(swap?.44:.56)-1,H-20);ctx.stroke();
 ctx.font=handFont(23);const titleWidth=ctx.measureText(uiText('{{t:last-hair.control.balance}}')).width,accent=Math.min(pd.r-10,titleWidth/2+18);
 ctx.strokeStyle=INK;ctx.lineWidth=3;[-1,1].forEach(side=>{ctx.beginPath();ctx.moveTo(pd.cx+side*accent,SCENE_H+22);ctx.lineTo(pd.cx+side*(accent-7),SCENE_H+14);ctx.stroke()});
 inkBox(pd.cx-pd.r,railY-13,pd.r*2,26,13,'#645946','#a18d6d');ctx.strokeStyle='#fff1cc';ctx.lineWidth=2;ctx.stroke();
 ctx.strokeStyle='#e6d3ad';ctx.lineWidth=2.5;for(let i=0;i<5;i++){const x=pd.cx-pd.r+14+(pd.r*2-28)*i/4;ctx.beginPath();ctx.moveTo(x,railY-5);ctx.lineTo(x,railY+5);ctx.stroke()}
 if(st==='run'&&Math.abs(g.wind)>.2){const x=pd.cx+(Math.sign(g.wind)||1)*pd.r*.8;ctx.strokeStyle='#9cc9a1';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,railY,25,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#81ba91';ctx.beginPath();ctx.moveTo(x,railY-27);ctx.lineTo(x-6,railY-36);ctx.lineTo(x+6,railY-36);ctx.fill()}
 const knobX=pd.cx+input.tilt*pd.r;ctx.fillStyle='#9d7527';ctx.beginPath();ctx.arc(knobX,railY+3,23,0,7);ctx.fill();ctx.fillStyle='#f4ca48';ctx.beginPath();ctx.arc(knobX,railY-1,22,0,7);ctx.fill();ctx.strokeStyle='#704f23';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#ffedac';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(knobX-1,railY-2,17,Math.PI*1.1,Math.PI*1.8);ctx.stroke();
 paintedText('{{t:last-hair.control.cramp}}',pd.cx-pd.r+2,SCENE_H+146,15,INK,'left',65);
 const value=g.crampLocked?1:g.cramp/game.config.cramp.trigger;bar(pd.cx-pd.r+67,SCENE_H+138,pd.r*2-68,15,value,'#ea7758','#363c38');ctx.strokeStyle='#8c7960';ctx.lineWidth=2;rrect(pd.cx-pd.r+64,SCENE_H+135,pd.r*2-62,21,10);ctx.stroke();
 const width=Math.min(W*.42,188),height=width*(art.hold?.naturalHeight||1)/(art.hold?.naturalWidth||1),left=button.cx-width/2,top=SCENE_H+10+(g.pressing?4:0);
 if(art.hold?.naturalWidth)ctx.drawImage(art.hold,left,top,width,height);
 paintedText(g.pressLock>0?'{{t:last-hair.msg.056}}':'{{t:last-hair.control.hold}}',button.cx,top+height*.79,Math.min(26,width*.15),'#fff2d3','center',width*.85);
 if(g.sweat>.05){ctx.strokeStyle='#6abec8';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(left+20,top+height+3);ctx.lineTo(left+20+(width-40)*g.sweat,top+height+3);ctx.stroke()}
 paintedText('{{t:last-hair.msg.058}}',button.cx,SCENE_H+187,12,INK,'center',width);
}
function wrapC(s,x,y,w,lh,size,col,align){
 // Translate the whole sentence first so English wraps on words instead of on Chinese characters.
 const T=window.deepSeaI18n&&window.deepSeaI18n.text,str=T?String(T(s)):s,words=/[\u3400-\u9fff]/.test(str)?Array.from(str):str.split(' '),sep=/[\u3400-\u9fff]/.test(str)?'':' ';
 ctx.font='bold '+size+'px '+FONT;let line='',yy=y;
 for(const word of words){const next=line?line+sep+word:word;if(line&&ctx.measureText(next).width>w){txt(line,x,yy,size,col,align);line=word;yy+=lh}else line=next}
 txt(line,x,yy,size,col,align);
}
const TOGGLES=()=>[[W/2-176,swap?'{{t:last-hair.msg.059}}':'{{t:last-hair.msg.060}}'],[W/2+4,soundOn?'{{t:last-hair.msg.061}}':'{{t:last-hair.msg.062}}']];
function drawReady(){
 const keep=g;g=idleG;idleG.E=.05;idleG.wind=Math.sin(time*1.5)*.15;
 drawScene();drawMan(.016,{});g=keep;
 ctx.fillStyle='rgba(30,62,72,.94)';ctx.fillRect(0,0,W,190);txt('THE LAST HAIR',W/2,24,16,PAPER);
 txt('{{t:last-hair.msg.063}}',W/2,66,38,'#ffd54f','center',true,'#000');txt('{{t:last-hair.msg.064}}',W/2,100,22,'#fff','center',true);
 txt('{{t:last-hair.msg.065}}',W/2,140,15,'rgba(255,255,255,.85)','center',false);
 drawPaper(SCENE_H-5,H-SCENE_H+10);txt('THE LAST HAIR',W/2,SCENE_H+18,18,INK);
 ['{{t:last-hair.msg.023}}','{{t:last-hair.msg.066}}','{{t:last-hair.msg.067}}'].forEach((s,i)=>txt(s,W/2,H-164+i*22,13,INK,'center',false,null,370));
 txt('{{t:last-hair.msg.068}}',W/2,H-96,17,'#795f36');
 TOGGLES().forEach(it=>{ctx.fillStyle='#365a63';rrect(it[0],H-78,172,42,14);ctx.fill();txt(it[1],it[0]+86,H-57,16,'#fff','center',true,null,160)});
 txt('最遠紀錄 '+best.toFixed(0)+' m',W/2,H-16,14,INK,'center',false);
}
function drawOver(){
 const won=g.won;
 drawScene();drawStreaks(0);drawMan(.016,{lost:!won,beard:won&&g.rankKey==='BEARD'});drawEventsWorld();
 if(!won){ctx.save();ctx.globalCompositeOperation='saturation';ctx.fillStyle='#808080';ctx.fillRect(0,0,W,SCENE_H);ctx.restore();ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,SCENE_H)}
 ctx.fillStyle='rgba(16,19,27,.96)';ctx.fillRect(0,SCENE_H,W,H-SCENE_H);ctx.fillStyle='#10131b';ctx.fillRect(0,SCENE_H,W,3);
 ctx.save();ctx.translate((W-400)/2,H-720);
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
 ctx.restore();
}
function draw(dt){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
 if(st==='ready'){drawReady();if(!artReady()){inkBox(20,SCENE_H-80,W-40,56,14,'#ffedca');wrapC(artFailed?'{{t:last-hair.art.error}}':'{{t:last-hair.art.loading}}',W/2,SCENE_H-62,W-70,18,14,INK)}return}
 if(st==='over'){drawOver();return}
 ctx.save();if(g.crampLocked)ctx.translate((Math.random()-.5)*4,(Math.random()-.5)*3);
 drawScene();drawStreaks(dt);drawMan(dt);drawEventsWorld();ctx.restore();
 drawHUD();drawControls();
 for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t-=dt;if(f.t<=0){floats.splice(i,1);continue}ctx.globalAlpha=clamp(f.t/(f.d*.5),0,1);txt(f.text,f.x+(W-400)/2,f.y+(SCENE_H-482)-(1-f.t/f.d)*36,f.size,f.col,'center',true,'rgba(0,0,0,.6)');ctx.globalAlpha=1}
 for(let i=flyHairs.length-1;i>=0;i--){const f=flyHairs[i];f.t-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=120*dt;f.r+=5*dt;if(f.t<=0)flyHairs.splice(i,1)}
 if(paused){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,W,H);txt('{{t:last-hair.msg.073}}',W/2,H*.45,36,'#fff');txt('{{t:last-hair.msg.074}}',W/2,H*.53,22,'#ffd54f')}
}
function fitViewport(){
 const rect=c.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const ratio=rect.width/rect.height,nextW=Math.max(400,720*ratio),nextH=Math.max(720,400/ratio);
 const nextDPR=Math.min(2,Math.max(.5,(window.devicePixelRatio||1)*Math.min(rect.width/nextW,rect.height/nextH)));
 if(Math.abs(nextW-W)<.5&&Math.abs(nextH-H)<.5&&Math.abs(nextDPR-DPR)<.01)return;
 W=nextW;H=nextH;SCENE_H=H-202;DPR=nextDPR;c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);
}
if(typeof ResizeObserver!=='undefined'){const resize=new ResizeObserver(fitViewport);resize.observe(c);}
window.addEventListener('resize',fitViewport);
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
$('lh-pause').addEventListener('click',()=>{if(st!=='run')return;if(paused){paused=false;clearInput();last=performance.now()}else pauseNow()});
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(!shown())return;
 audioInit();const p=toLocal(e);
 if(st!=='run'){
  e.preventDefault();
  if(st==='ready'){
   if(p.y>H-78&&p.y<H-36){
    if(p.x>W/2-176&&p.x<W/2-4){swap=!swap;lsSet('deep-sea-last-hair-swap',swap?'1':'0')}
    else if(p.x>W/2+4&&p.x<W/2+176){soundOn=!soundOn;lsSet('deep-sea-last-hair-sound',soundOn?'1':'0');if(soundOn)audioInit()}
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
