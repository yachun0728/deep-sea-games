  /* ---------- Don't Peek: wind the music box while spirits strike; lean away, cover the screen, hold still ---------- */
  var peekBusy=false,peekStake=0,peekSay=function(){};
  (function(){
const c=$('peek-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#120d0a';
const WIND_RATE=3;                         // % of the music-box spring wound per second while cranking
const WIND_MAX_TILT=.35;                   // cranking only works while the box is nearly level
const MILE_EVENTS=2,MILE_REWARD=2,WIN_REWARD=5; // fixed BONUS: survive 2 spirits +2, reach the exit and open the box +5, each once per round
const FIRST_GAP=9;                         // safe seconds before the first spirit
const GAP_NEAR=7,GAP_FAR=4,BREATH_EVERY=3,BREATH_EXTRA=3; // gap between spirits shrinks from 7s to 4s by 80% progress; every 3rd dodge earns a longer breather
const UNLOCK_TWINS=2,UNLOCK_WALKER=3;     // spirits unlock by dodges this round: eye first, then giggles, then the night watchman
const EASY_EYES=2,EYE_EASY_WARN=3.5;      // the first two red eyes give a longer warning
const SOUND_LEAD=.4;                       // the sound cue comes this many seconds before the picture
const DIRECTOR_AT=85,DIRECTOR_P=.75;       // once per round, past 85% a spirit may strike within 3 seconds
const TILT_SPEED=6;                        // keyboard / button lean speed per second
const EYE={warn:2.5,judge:3,away:.5,grace:.35};   // lean away from the red beam for 3s, 0.35s of slack
const TWIN={warn:2.5,judge:1.5,away:.6,toward:.3}; // lean away from the giggle side; leaning toward it is fatal
const WALK={warn:6,judge:4,still:.3};      // cover before the light goes out, stay covered and still
const TYPES=['eye','twins','walker'];
const CAUSES={eye:'死因 #1 對視：紅光鎖定你時，你沒有往反方向躲',twins:'死因 #2 回頭：笑聲在哪邊，你就往哪邊看',walkerLate:'死因 #3 慢半拍：燈滅的時候你還沒蓋住螢幕',walkerMove:'死因 #4 手賤：腳步聲還沒走遠你就動了'};
const BTN=[[8,492,90,56,'靠左'],[106,492,90,56,'靠右'],[204,492,90,56,'蓋住'],[302,492,90,56,'奔跑']];
let best=0,deaths={};try{best=+localStorage.getItem('deep-sea-peek-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-peek-deaths')||'{}')||{}}catch(e){deaths={}}
let analytics=null,earned=0,dodgesTotal=0,run=0,ph=0,toast=0,eyeSeen=0;try{dodgesTotal=+localStorage.getItem('deep-sea-peek-dodges')||0}catch(e){}
const ptrT=new Map();
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-24);g.fillStyle=col;g.fillText(s,x,y,W-24)}
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(f){g.fillStyle=f;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}};
let st='ready',prog,tilt,gapT,ev,survived,lastType,directorUsed,score,why,rec,flash,shake,tt=0,last=0,fxs=[],lampOut=0;
let keys={l:0,r:0,cover:0,wind:0},btn=[0,0,0,0],ptrs=new Map(),gyro={on:false,tilt:0,down:false};
function reset(){eyeSeen=0;run=0;ph=0;toast=0;prog=0;tilt=0;gapT=FIRST_GAP;ev=null;survived=0;lastType='';directorUsed=false;score=0;why='';rec=false;flash=0;shake=0;fxs=[];lampOut=0}
reset();
/* ---- audio: stereo cues, so headphones help; silent if the browser has no Web Audio ---- */
let ac=null;
function audioInit(){if(ac){try{ac.resume()}catch(e){}return}try{const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}catch(e){ac=null}}
function tone(f,d,vol,pan,type,slide){
 if(!ac)return;
 try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(slide,t+d);
  gn.gain.setValueAtTime(vol||.05,t);gn.gain.linearRampToValueAtTime(.0001,t+d);o.connect(gn);
  if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan||0;gn.connect(p);p.connect(ac.destination)}else gn.connect(ac.destination);
  o.start(t);o.stop(t+d+.02)}catch(e){}}
function say(text,kind){$('peek-msg').textContent=text;$('peek-msg').className='msg'+(kind?' '+kind:'')}
peekSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('peek-prog',Math.floor(prog)+'%');setText('peek-spirits',survived+' 次襲擊');setText('peek-best',best+'%');setText('peek-codex',Object.keys(CAUSES).filter(k=>deaths[k]>0).length+' / '+Object.keys(CAUSES).length);setText('peek-dodges',dodgesTotal+' 次');
 $('peek-amount').disabled=peekBusy;$('peek-go').disabled=live;setText('peek-go',live?'逃跑中 · 別回頭':st==='ready'?'免費開始逃跑':'免費再開一次');
}
function fx(s,x,y,col){fxs.push({s,x,y,col,t:0})}
function end(kind,reason){
 if(st!=='run')return;
 st=kind==='won'?'won':'over';why=reason||'';
 const p=Math.floor(prog);rec=p>best;
 if(rec){best=p;try{localStorage.setItem('deep-sea-peek-best',best)}catch(e){}}
 if(kind==='dead'){deaths[reason]=(deaths[reason]||0)+1;try{localStorage.setItem('deep-sea-peek-deaths',JSON.stringify(deaths))}catch(e){}flash=.5;shake=.5}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p});peekBusy=false;save();renderAll();
 if(kind==='won')say('衝出出口，盒子打開了。別看裡面。本局共入帳 '+fmt(earned)+' 點。','win');
 else if(!earned)say(CAUSES[reason]+'。這一局沒有額外成就獎勵。','lose');
 else say(CAUSES[reason]+'。本局共入帳 '+fmt(earned)+' 點。','win');
 ui();
}
function pay(n,text){
 earned+=n;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});
 say(text+' +'+n+' 點已入帳。','win')}
function pickPool(){
 const open=['eye'];if(survived>=UNLOCK_TWINS)open.push('twins');if(survived>=UNLOCK_WALKER)open.push('walker');
 const pool=open.filter(t=>t!==lastType);return pool.length?pool:open}
function startEvent(){
 const pool=pickPool(),type=pool[(Math.random()*pool.length)|0];
 const warn=type==='eye'?(eyeSeen<EASY_EYES?EYE_EASY_WARN:EYE.warn):type==='twins'?TWIN.warn:WALK.warn;
 if(type==='eye')eyeSeen++;
 ev={type,side:Math.random()<.5?-1:1,phase:'warn',t:warn,warn,el:0,bad:0,ok:false,snd:0};
 lastType=type}
function nextGap(){
 let g=GAP_NEAR+(GAP_FAR-GAP_NEAR)*clamp(prog/80,0,1)+rnd(-1,1);
 if(survived>0&&survived%BREATH_EVERY===0)g+=BREATH_EXTRA;
 return Math.max(3,g)}
function survive(){
 survived++;dodgesTotal++;try{localStorage.setItem('deep-sea-peek-dodges',dodgesTotal)}catch(e){}
 score+=100;lastType=ev.type;ev=null;gapT=nextGap();fx('躲過了！',200,200,'#ffd98a');
 if(survived===MILE_EVENTS)pay(MILE_REWARD,'躲過 '+MILE_EVENTS+' 次襲擊！')}
function inputs(){
 const tIn=gyro.on?gyro.tilt:clamp(keys.r-keys.l+(btn[1]?1:0)-(btn[0]?1:0),-1,1);
 return{tilt:tIn,cover:!!(keys.cover||btn[2]||gyro.down),wind:!!(keys.wind||btn[3])}}
function update(dt){
 tt+=dt;
 if(flash>0)flash-=dt;if(shake>0)shake-=dt;fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.9);
 if(st!=='run')return;
 if(toast>0)toast-=dt;
 const I=inputs();
 if(gyro.on)tilt=I.tilt;else tilt+=clamp(I.tilt-tilt,-TILT_SPEED*dt,TILT_SPEED*dt);
 const covered=I.cover;
 const running=I.wind&&!covered&&Math.abs(tilt)<=WIND_MAX_TILT;
 if(running){prog=Math.min(100,prog+WIND_RATE*dt);run+=dt*1.6}
 ph+=dt*(running?13:2.5);
 if(prog>=100){score+=500;pay(WIN_REWARD,'盒子打開了！');end('won');return}
 if(!directorUsed&&prog>=DIRECTOR_AT){directorUsed=true;if(!ev&&Math.random()<DIRECTOR_P)gapT=Math.min(gapT,rnd(1,3))}
 if(!ev){gapT-=dt;if(gapT<=0)startEvent();return}
 ev.t-=dt;ev.el=(ev.el||0)+dt;
 const away=tilt*-ev.side;   // positive when leaning away from the spirit's side
 if(ev.type==='eye'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(90+Math.random()*30,.12,.05,ev.side*.7,'sawtooth')}if(ev.t<=0){ev.phase='judge';ev.t=EYE.judge;tone(520,.3,.07,ev.side*.7,'square',380)}}
  else{if(away<EYE.away)ev.bad+=dt;if(ev.bad>EYE.grace){end('dead','eye');return}if(ev.t<=0)survive()}}
 else if(ev.type==='twins'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.45;tone(900+Math.random()*200,.09,.06,ev.side,'triangle')}if(ev.t<=0){ev.phase='judge';ev.t=TWIN.judge}}
  else{if(tilt*ev.side>TWIN.toward){end('dead','twins');return}if(away>=TWIN.away)ev.ok=true;if(ev.t<=0){if(ev.ok)survive();else{end('dead','twins');return}}}}
 else{
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.6;tone(70,.08,.02+.1*(1-ev.t/WALK.warn),0,'sine')}
   if(ev.t<=0){if(!covered){end('dead','walkerLate');return}ev.phase='judge';ev.t=WALK.judge}}
  else{if(!covered||Math.abs(tilt)>WALK.still){end('dead','walkerMove');return}if(ev.t<=0)survive()}}
}
/* ---- drawing ---- */
function lampLevel(){
 if(!ev||ev.type!=='walker')return 1;
 if(ev.phase==='judge')return 0;
 const r=ev.t;if(r<1.5){return Math.floor((1.5-r)*4)%2?.15:1}   // flickers three times just before it goes out
 return 1}
/* ---- scene: back view of a night corridor; the exit door grows as you run ---- */
const VPY=210,HW=170;
const frm=s=>({l:200-HW*s,r:200+HW*s,t:VPY-190*s,b:VPY+270*s});
const wallY=(s,h)=>VPY-190*s+460*s*h;           // h: 0 ceiling .. 1 floor
const depthS=d=>1/(1+Math.max(d,-.5)*.55);
function poly(pts,fill){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fillStyle=fill;g.fill()}
const shade=(r,gg,b,k)=>'rgb('+((r*k)|0)+','+((gg*k)|0)+','+((b*k)|0)+')';
function drawCorridor(lamp){
 const n=10,fr=run%1,base=Math.floor(run);
 g.fillStyle='#0b0705';g.fillRect(-20,0,W+40,H);
 for(let i=n;i>=1;i--){
  const sf=depthS(i-fr),sn=depthS(i-1-fr),a=(base+i)&1,f=frm(sf),m=frm(sn),k=clamp(lamp*(.18+.95*sn),0,1);
  poly([[f.l,f.b],[f.r,f.b],[m.r,m.b],[m.l,m.b]],shade(a?64:52,a?44:36,a?28:22,k));
  poly([[f.l,f.t],[f.r,f.t],[m.r,m.t],[m.l,m.t]],shade(34,24,17,k));
  poly([[f.l,f.t],[f.l,f.b],[m.l,m.b],[m.l,m.t]],shade(a?92:80,a?66:56,a?40:34,k));
  poly([[f.r,f.t],[f.r,f.b],[m.r,m.b],[m.r,m.t]],shade(a?92:80,a?66:56,a?40:34,k));
  if((base+i)%4===0){for(const sd of [-1,1]){const xf=200+sd*HW*sf,xm=200+sd*HW*sn;poly([[xf,wallY(sf,.22)],[xf,wallY(sf,.55)],[xm,wallY(sn,.55)],[xm,wallY(sn,.22)]],shade(40,28,18,k))}}
  if((base+i)%3===0){g.fillStyle='rgba(255,214,140,'+(.85*lamp)+')';g.fillRect(200-26*sn,m.t+4*sn,52*sn,6*sn)}}
 const door=.17+.8*Math.pow(prog/100,1.6),d=frm(door);
 g.fillStyle=shade(60,42,26,lamp);g.fillRect(d.l,d.t,d.r-d.l,d.b-d.t);
 const dw=(d.r-d.l)*.5,dx=200-dw/2,dy=d.t+(d.b-d.t)*.12;
 const gl=g.createLinearGradient(0,dy,0,d.b);gl.addColorStop(0,'rgba(255,240,190,'+lamp+')');gl.addColorStop(1,'rgba(255,196,110,'+lamp+')');
 g.fillStyle=gl;g.fillRect(dx,dy,dw,d.b-dy);
 g.fillStyle='rgba(255,230,160,'+(.18*lamp)+')';g.fillRect(dx-dw*.3,dy-dw*.1,dw*1.6,d.b-dy+dw*.1)}
function drawRunner(){
 const x=200+clamp(tilt,-1,1)*105,y=470,run1=st==='run'&&(keys.wind||btn[3]||ptrs.size>0),bob=Math.abs(Math.sin(ph))*(run1?5:1);
 g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x,y+4,34,9,0,0,7);g.fill();
 const sw=Math.sin(ph)*(run1?15:3);
 RR(x-21,y-46+(sw>0?-Math.abs(sw)*.6:0),16,46,6,'#35405a',3);RR(x+5,y-46+(sw<0?-Math.abs(sw)*.6:0),16,46,6,'#35405a',3);
 RR(x-24,y-104-bob,48,62,12,'#6b8fb8',3);
 g.strokeStyle=OL;g.lineWidth=11;g.lineCap='round';g.beginPath();g.moveTo(x-22,y-92-bob);g.lineTo(x-30,y-62-bob+sw*.5);g.stroke();g.beginPath();g.moveTo(x+22,y-92-bob);g.lineTo(x+30,y-62-bob-sw*.5);g.stroke();
 g.strokeStyle='#6b8fb8';g.lineWidth=6;g.beginPath();g.moveTo(x-22,y-92-bob);g.lineTo(x-30,y-62-bob+sw*.5);g.stroke();g.beginPath();g.moveTo(x+22,y-92-bob);g.lineTo(x+30,y-62-bob-sw*.5);g.stroke();
 RR(x-44,y-72-bob+sw*.4,30,20,5,'#d6a24e',3);
 g.fillStyle=OL;g.beginPath();g.arc(x,y-124-bob,22,0,7);g.fill();g.fillStyle='#3a2616';g.beginPath();g.arc(x,y-124-bob,19,0,7);g.fill();
 g.fillStyle='#4b3220';g.beginPath();g.arc(x-6,y-130-bob,9,0,7);g.fill()}
function drawSpirits(){
 if(!ev)return;
 const el=ev.el||0,vis=Math.max(0,el-SOUND_LEAD),w=ev.warn||(ev.type==='eye'?EYE.warn:TWIN.warn);
 if(ev.type==='eye'){
  const s=.42,ex=200+ev.side*HW*s,ey=wallY(s,.34),open=ev.phase==='judge'?1:clamp(vis/Math.max(.1,w-SOUND_LEAD),0,1);
  g.fillStyle='#2a0505';g.beginPath();g.ellipse(ex,ey,20*s*2.2,(8+26*open)*s*1.6,0,0,7);g.fill();
  if(open>.15){g.fillStyle='#ff2a2a';g.beginPath();g.arc(ex-ev.side*3,ey,9*open,0,7);g.fill()}
  if(ev.phase==='judge'){
   const away=tilt*-ev.side,safe=away>=EYE.away,tx2=safe?200+ev.side*150:200+clamp(tilt,-1,1)*105,ty=safe?440:360;
   g.save();g.globalAlpha=safe?.18:.55;g.fillStyle='#ff3030';g.beginPath();g.moveTo(ex,ey-5);g.lineTo(tx2-45,ty+60);g.lineTo(tx2+45,ty+60);g.lineTo(ex,ey+5);g.closePath();g.fill();g.restore()}}
 else if(ev.type==='twins'){
  const a=ev.phase==='judge'?.92:clamp(vis/Math.max(.1,w-SOUND_LEAD),0,1)*.7;
  if(a>0){g.save();g.globalAlpha=a;g.fillStyle='#dfe6ff';
   for(let i=0;i<3;i++){const s=.75-i*.17,hx=200+ev.side*HW*s,hy=wallY(s,.3+i*.12),r=22*s;g.beginPath();g.arc(hx,hy,r,0,7);g.fill();for(let f=0;f<4;f++){g.beginPath();g.arc(hx+(f-1.5)*r*.5,hy-r*1.1,r*.22,0,7);g.fill()}}
   if(ev.phase==='judge'){const s=.5,hx=200+ev.side*HW*s,hy=wallY(s,.4);g.fillStyle='#fff';g.beginPath();g.arc(hx,hy,26,0,7);g.fill();g.fillStyle=OL;g.fillRect(hx-12,hy-4,7,8);g.fillRect(hx+5,hy-4,7,8)}
   g.restore()}}
 else if(ev.type==='walker'){
  const p=ev.phase==='judge'?1:clamp(1-ev.t/WALK.warn,0,1),s=.12+.5*p,fy=VPY+270*s,hgt=240*s,wd=70*s;
  g.fillStyle='rgba(8,6,10,.9)';g.fillRect(200-wd/2,fy-hgt,wd,hgt);g.fillRect(200-wd*.85,fy-hgt*.92,wd*.25,hgt*.55);g.fillRect(200+wd*.6,fy-hgt*.92,wd*.25,hgt*.55);
  g.fillStyle='rgba(140,160,200,.35)';g.beginPath();g.arc(200,fy-hgt-6*s,8*s,0,7);g.fill()}}
function drawScene(lamp){drawCorridor(lamp);drawSpirits();drawRunner()}
function drawButtons(){
 const I=inputs();const on=[I.tilt<-.05&&!gyro.on,I.tilt>.05&&!gyro.on,I.cover,I.wind];
 BTN.forEach((b,i)=>{RR(b[0],b[1],b[2],b[3],12,on[i]?'#d6a24e':'#3a2c1c',3);tx(b[4],b[0]+b[2]/2,b[1]+36,20,on[i]?'#1b1208':'#f1d9a6')})}
function draw(){
 const I=inputs(),lamp=st==='run'?lampLevel():1,cov=st==='run'&&I.cover;
 const ox=shake>0?(Math.random()-.5)*14:0;
 g.save();g.translate(ox,0);
 drawScene(lamp);
 if(ev&&ev.type==='walker'&&ev.phase==='warn'&&ev.t<3.5){g.fillStyle='rgba(200,230,255,'+(.05+.18*(1-ev.t/3.5))+')';g.fillRect(0,0,W,H)}
 fxs.forEach(f=>{g.globalAlpha=1-f.t/.9;tx(f.s,f.x,f.y-f.t*40,22,f.col);g.globalAlpha=1});
 g.restore();
 /* HUD */
 g.fillStyle='rgba(255,255,255,.12)';RR(16,14,W-32,16,8,'rgba(255,255,255,.12)');
 if(prog>0)RR(16,14,Math.max(16,(W-32)*prog/100),16,8,prog>=85?'#ff6a4d':'#e8c675');
 tx('距離出口',16,50,15,'#f1d9a6','left');tx(Math.floor(prog)+'%',W-16,50,15,'#f1d9a6','right');
 let hint='';
 if(st==='run'){
  if(ev&&ev.type==='eye')hint=ev.phase==='warn'?'牆上有東西在轉動眼珠……':'往反方向靠牆！躲開紅光！';
  else if(ev&&ev.type==='twins')hint=ev.phase==='warn'?'有笑聲貼著耳朵……不要往聲音那邊靠':'往笑聲的反方向靠牆！';
  else if(ev&&ev.type==='walker')hint=ev.phase==='warn'?'走廊盡頭有腳步聲。燈滅前蓋住螢幕！':'蓋住不要動，等腳步聲遠去……';
  else if(prog<25&&!I.wind)hint='用手指「按住」下方「奔跑」（點一下沒用）';
  if(toast>0&&!hint)hint='要「按住不放」才會跑！';if(hint)tx(hint,200,80,17,'#ffd98a')}
 if(st==='run')drawButtons();
 if(cov){g.fillStyle='rgba(0,0,0,.96)';g.fillRect(0,0,W,H);tx('（螢幕蓋住了）',200,280,18,'#4a3a2a');drawButtons()}
 else if(st==='run'&&lamp<=0){g.fillStyle='rgba(0,0,0,.93)';g.fillRect(0,0,W,H);tx('燈滅了。有什麼東西走過來了……',200,280,18,'#6a4a3a')}
 if(flash>0){g.fillStyle='rgba(200,20,20,'+flash*1.2+')';g.fillRect(0,0,W,H)}
 if(st!=='run'){
  g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);
  if(st==='ready'){tx('別看',200,150,52,'#e8c675');tx('禁忌寶盒・夜逃',200,190,22,'#f1d9a6');
   tx('按住「奔跑」，抱著八音盒衝向出口',200,250,18,'#f1d9a6');tx('紅光來了：往反方向靠牆',200,284,18,'#f1d9a6');tx('笑聲來了：往笑聲的反方向靠牆',200,314,18,'#f1d9a6');tx('燈要滅了：蓋住螢幕，不要動',200,344,18,'#f1d9a6');tx('建議戴耳機。到操作區免費開始',200,420,20,'#ffd98a')}
  else if(st==='won'){tx('衝出去了',200,190,40,'#ffd98a');tx('別看裡面。',200,250,28,'#ff6a4d');tx('躲過 '+survived+' 次襲擊',200,310,20,'#f1d9a6');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'',200,350,22,'#ffd98a');tx('到操作區再開一次',200,420,20,'#f1d9a6')}
  else{tx('你死了',200,160,40,'#ff6a4d');tx(CAUSES[why]||'',200,215,15,'#f1d9a6');tx(Math.floor(prog)+'%',200,290,60,'#ffd98a');tx('躲過 '+survived+' 次襲擊',200,330,20,'#f1d9a6');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'躲過 '+MILE_EVENTS+' 次才有點數',200,368,20,earned>0?'#ffd98a':'#f1d9a6');if(rec)tx('新紀錄！',200,402,20,'#ffd98a');tx('到操作區再開一次',200,450,20,'#f1d9a6')}}
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 audioInit();
 analytics=AN.start('peek',amount);peekStake=amount;peekBusy=true;save();renderAll();
 reset();earned=0;st='run';last=performance.now();say('開始逃跑。別回頭。');ui();c.focus();
}
const shown=()=>!$('view-peek').hidden&&!document.hidden;
function region(e){
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*W/(r.width||W),y=(e.clientY-r.top)*H/(r.height||H);
 for(let i=0;i<BTN.length;i++){const b=BTN[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return i}
 return y<480?3:-1}
function syncPtrs(){btn=[0,0,0,0];ptrs.forEach(i=>{if(i>=0)btn[i]=1})}
$('peek-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='ready'?'先按「免費開始逃跑」。':'這一局已結算。按「免費再開一次」開始新的一局。');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(x){}
 ptrs.set(e.pointerId,region(e));ptrT.set(e.pointerId,performance.now());syncPtrs()});
const upPtr=e=>{if(st==='run'&&ptrs.get(e.pointerId)===3&&performance.now()-(ptrT.get(e.pointerId)||0)<250){toast=1.6;say('要「按住不放」才會跑，點一下沒用。')}ptrs.delete(e.pointerId);ptrT.delete(e.pointerId);syncPtrs()};
c.addEventListener('pointerup',upPtr);c.addEventListener('pointercancel',upPtr);c.addEventListener('lostpointercapture',upPtr);
c.addEventListener('contextmenu',e=>e.preventDefault());
const KEYMAP={a:'l',A:'l',ArrowLeft:'l',d:'r',D:'r',ArrowRight:'r',' ':'cover',w:'wind',W:'wind',ArrowUp:'wind'};
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 const k=KEYMAP[e.key];if(!k)return;e.preventDefault();keys[k]=1});
addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(k)keys[k]=0});
function clearInput(){keys={l:0,r:0,cover:0,wind:0};ptrs.clear();syncPtrs()}
addEventListener('blur',()=>{last=performance.now();clearInput()});
document.addEventListener('visibilitychange',()=>{last=performance.now();clearInput()});
window.addEventListener('hashchange',()=>{last=performance.now();clearInput()});
/* ---- optional phone motion: lean the phone, turn it face down to cover ---- */
function onOrient(e){if(e.gamma===null||e.gamma===undefined)return;gyro.tilt=clamp(e.gamma/30,-1,1);gyro.down=Math.abs(e.beta||0)>145}
const gb=$('peek-gyro');
if(gb)gb.addEventListener('click',()=>{
 if(gyro.on){gyro.on=false;window.removeEventListener('deviceorientation',onOrient);gb.textContent='啟用體感（手機）';return}
 const go=()=>{gyro.on=true;window.addEventListener('deviceorientation',onOrient);gb.textContent='關閉體感'};
 try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')go();else say('沒有取得體感權限，改用按鈕操作。','lose')}).catch(()=>say('這個瀏覽器不能使用體感，改用按鈕操作。','lose'))}else go()}catch(e){say('這個瀏覽器不能使用體感，改用按鈕操作。','lose')}});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
