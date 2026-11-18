  /* ---------- Don't Peek: wind the music box while spirits strike; lean away, cover the screen, hold still ---------- */
  var peekBusy=false,peekStake=0,peekSay=function(){};
  (function(){
const c=$('peek-canvas'),g=c.getContext('2d'),W=800,H=450,CX=400,OL='#120d0a';
const SPRINT_GAP=2;                        // while sprinting the next attack comes this many times sooner, so speed is paid for with pressure
const BASE_RATE=2,WIND_RATE=4;             // % of the corridor covered per second: the runner keeps jogging by itself, holding Sprint doubles it
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
const WORLDS=['forest','graveyard','swamp','snow','volcano'];   // one painted backdrop per 20% of the run
const ART={};
const art=k=>{if(typeof Image!=='function')return null;let i=ART[k];if(!i){i=ART[k]=new Image();i.src='games/peek/assets/'+k+'.webp'}return i.complete&&i.naturalWidth>0?i:null};
const SIDE=230,PICK_AT=.3,DROP_EVERY=[7,11],CAMP_EVERY=20,CAMP_REST=3,CAMP_WIN=3,CAMP_PICK_MAX=8;   // props sit SIDE px off centre; items can be grabbed once nearer than 30% depth; a campfire every 20%
const CARD_W=170,CARD_H=198,CARD_Y=146,CARDS_X=[CX-285,CX-85,CX+115];
const CAMP_CARDS=['torch','charm','scroll'];
const ITEM_NAME={torch:'火把',charm:'護身符',scroll:'舊卷軸'};
const ITEM_DESC={torch:'下次襲擊多 0.6 秒並標出方向',charm:'擋下一次致命失誤',scroll:'收藏品，之後圖鑑會用到'};
const FLICK_TIPS=['小螢：腳邊的落葉聚成一堆，就往反方向靠。','小螢：鳥群突然飛走，是有東西在敲樹枝。','小螢：蟲鳴停了、路燈在閃，趁燈滅前蓋住螢幕。'];
const CAUSES={eye:'死因 #1 葉下客：落葉聚在哪一邊，你沒有往反方向躲',twins:'死因 #2 敲枝者：敲擊聲在哪一邊，你就往哪一邊靠',walkerLate:'死因 #3 靜林鬼：燈滅的時候你還沒蓋住螢幕',walkerMove:'死因 #4 靜林鬼：牠還沒走遠你就動了'};
const TIPS={eye:'下次：落葉聚在哪邊，就往另一邊靠，撐滿 3 秒。',twins:'下次：鳥群飛走、敲擊聲響起時，往敲擊的反方向靠。',walkerLate:'下次：路燈開始閃就要準備，燈滅前蓋住螢幕。',walkerMove:'下次：蓋住之後別動，等牠走遠才放開。'};
const BTN=[[16,388,120,52,'靠左'],[146,388,120,52,'靠右'],[534,388,120,52,'蓋住'],[664,388,120,52,'衝刺'],[340,388,120,52,'撿']];   // landscape: lean + cover bottom-left/right, pick up in the middle
let best=0,deaths={};try{best=+localStorage.getItem('deep-sea-peek-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-peek-deaths')||'{}')||{}}catch(e){deaths={}}
let analytics=null,earned=0,dodgesTotal=0,run=0,ph=0,eyeSeen=0;try{dodgesTotal=+localStorage.getItem('deep-sea-peek-dodges')||0}catch(e){}
const ptrT=new Map();
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-24);g.fillStyle=col;g.fillText(s,x,y,W-24)}
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(f){g.fillStyle=f;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}};
let st='ready',prog,tilt,gapT,ev,survived,lastType,directorUsed,score,why,rec,flash,shake,tt=0,last=0,fxs=[],lampOut=0;
let keys={l:0,r:0,cover:0,wind:0,pick:0},btn=[0,0,0,0,0],ptrs=new Map(),gyro={on:false,tilt:0,down:false};
let bag,drops,dropT,camp,campNext,openFx,pickHeld=0,shake1=0,sc=0,scrolls=0,audioOk=false,assist=false,lowScare=false,MASTER=.7,chirpT=0,lastShake=0;
try{scrolls=+localStorage.getItem('deep-sea-peek-scrolls')||0}catch(e){}
try{const o=JSON.parse(localStorage.getItem('deep-sea-peek-opts')||'{}');assist=!!o.a;lowScare=!!o.l;if(typeof o.v==='number')MASTER=clamp(o.v,0,1)}catch(e){}
function reset(){eyeSeen=0;run=0;ph=0;prog=0;tilt=0;gapT=FIRST_GAP;ev=null;survived=0;lastType='';directorUsed=false;score=0;why='';rec=false;flash=0;shake=0;fxs=[];lampOut=0;bag={charm:0,torch:0};drops=[];dropT=rnd(5,8);camp=null;campNext=CAMP_EVERY;openFx=null;pickHeld=0;shake1=0;sc=0}
reset();
/* ---- audio: stereo cues, so headphones help; silent if the browser has no Web Audio ---- */
let ac=null;
function audioInit(){if(ac){try{ac.resume()}catch(e){}return}try{const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}catch(e){ac=null}}
function tone(f,d,vol,pan,type,slide){
 if(!ac)return;
 try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(slide,t+d);
  gn.gain.setValueAtTime((vol||.05)*MASTER*1.4,t);gn.gain.linearRampToValueAtTime(.0001,t+d);o.connect(gn);
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
 if(kind==='dead'&&bag.charm>0){bag.charm--;fx('護身符碎了，擋下一次！',CX,150,'#7fe8ff');ev=null;gapT=Math.max(nextGap(),4);flash=lowScare?.1:.3;return}
 st=kind==='won'?'won':'over';why=reason||'';
 const p=Math.floor(prog);rec=p>best;
 if(rec){best=p;try{localStorage.setItem('deep-sea-peek-best',best)}catch(e){}}
 if(kind==='dead'){deaths[reason]=(deaths[reason]||0)+1;try{localStorage.setItem('deep-sea-peek-deaths',JSON.stringify(deaths))}catch(e){}flash=lowScare?.15:.5;shake=lowScare?0:.5}
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
 lastType=type;
 if(bag.torch>0){bag.torch--;ev.warn+=.6;ev.t+=.6;ev.torch=true}}   // a torch buys 0.6s of extra warning and lights the side it comes from
function nextGap(){
 let g=GAP_NEAR+(GAP_FAR-GAP_NEAR)*clamp(prog/80,0,1)+rnd(-1,1);
 if(survived>0&&survived%BREATH_EVERY===0)g+=BREATH_EXTRA;
 return Math.max(3,g)}
function survive(){
 survived++;dodgesTotal++;try{localStorage.setItem('deep-sea-peek-dodges',dodgesTotal)}catch(e){}
 score+=100;lastType=ev.type;ev=null;gapT=nextGap();fx('躲過了！',CX,170,'#ffd98a');
 if(survived===MILE_EVENTS)pay(MILE_REWARD,'躲過 '+MILE_EVENTS+' 次襲擊！')}
function inputs(){
 const tIn=gyro.on?gyro.tilt:clamp(keys.r-keys.l+(btn[1]?1:0)-(btn[0]?1:0),-1,1);
 return{tilt:tIn,cover:!!(keys.cover||btn[2]||gyro.down),wind:!!(keys.wind||btn[3])}}
function update(dt){
 tt+=dt;
 if(openFx){openFx.t-=dt;if(openFx.t<=0)openFx=null}
 if(flash>0)flash-=dt;if(shake>0)shake-=dt;fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.9);
 if(st!=='run')return;
 const I=inputs();
 const covered=I.cover,sprint=I.wind&&!covered,aim=sprint?0:I.tilt;   // sprinting pins you to the middle: you cannot lean while sprinting
 if(gyro.on)tilt=aim;else tilt+=clamp(aim-tilt,-TILT_SPEED*dt,TILT_SPEED*dt);
 const pk=(keys.pick||btn[4]||shake1)&&!pickHeld;pickHeld=!!(keys.pick||btn[4]);shake1=0;
 if(camp){updateCamp(dt);ph+=dt*2;return}
 chirpT-=dt;if(chirpT<=0){chirpT=rnd(.3,.8);if(!(ev&&ev.type==='walker')&&!covered)tone(3000+Math.random()*700,.04,.012,rnd(-.8,.8),'sine')}   // crickets: they go quiet before Hush
 if(!covered){prog=Math.min(100,prog+(sprint?WIND_RATE:BASE_RATE)*dt);run+=dt*(sprint?2.6:1.5)}
 ph+=dt*(covered?2.5:sprint?15:9);
 if(prog>=100){score+=500;pay(WIN_REWARD,'盒子打開了！');end('won');return}
 while(campNext<100&&prog>=campNext+CAMP_WIN)campNext+=CAMP_EVERY;
 if(!ev&&prog>=campNext&&campNext<100){startCamp();return}
 updateDrops(dt,covered,sprint,pk);
 if(!directorUsed&&prog>=DIRECTOR_AT){directorUsed=true;if(!ev&&Math.random()<DIRECTOR_P)gapT=Math.min(gapT,rnd(1,3))}
 if(!ev){gapT-=dt*(sprint?SPRINT_GAP:1);if(gapT<=0)startEvent();return}
 ev.t-=dt;ev.el=(ev.el||0)+dt;
 const away=tilt*-ev.side;   // positive when leaning away from the spirit's side
 if(ev.type==='eye'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(90+Math.random()*30,.12,.05,ev.side*.7,'sawtooth')}if(ev.t<=0){ev.phase='judge';ev.t=EYE.judge;tone(520,.3,.07,ev.side*.7,'square',380)}}
  else{if(away<EYE.away)ev.bad+=dt;if(ev.bad>EYE.grace){end('dead','eye');return}if(ev.t<=0)survive()}}
 else if(ev.type==='twins'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.38;tone(150+Math.random()*25,.07,.1,ev.side,'square',90)}if(ev.t<=0){ev.phase='judge';ev.t=TWIN.judge}}
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
/* ---- items, campfire, options (landscape 800x450, first person) ---- */
const cxy=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*W/(r.width||W),(e.clientY-r.top)*H/(r.height||H)]};
function giveItem(k){
 if(k==='torch'){bag.torch=Math.min(3,bag.torch+1);fx('火把 +1',CX,150,'#ffb347')}
 else if(k==='charm'){bag.charm=Math.min(2,bag.charm+1);fx('護身符 +1',CX,150,'#7fe8ff')}
 else{scrolls++;try{localStorage.setItem('deep-sea-peek-scrolls',scrolls)}catch(e){}fx('撿到舊卷軸',CX,150,'#e8c675')}}
function spawnDrop(){const r=Math.random();drops.push({k:r<.4?'torch':r<.7?'charm':'scroll',side:Math.random()<.5?-1:1,z:1})}
function collect(d){d.z=-1;giveItem(d.k);say('撿到'+ITEM_NAME[d.k]+'：'+ITEM_DESC[d.k]+'。','win')}
function updateDrops(dt,covered,sprint,pk){
 if(!covered){
  if(!ev){dropT-=dt;if(dropT<=0){if(drops.length<2)spawnDrop();dropT=rnd(DROP_EVERY[0],DROP_EVERY[1])}}
  const sp=(sprint?.2:.11)*dt;drops.forEach(d=>d.z-=sp)}
 if(pk){let b=null;drops.forEach(d=>{if(d.z>=0&&d.z<PICK_AT&&(!b||d.z<b.z))b=d});if(b)collect(b)}
 drops=drops.filter(d=>d.z>-.05&&d.z>=0)}
const canPick=()=>drops.some(d=>d.z>=0&&d.z<PICK_AT);
function startCamp(){camp={state:'pick',t:0,choice:-1,rest:0};ev=null;clearInput();say('營火到了。選一樣帶走。')}
function updateCamp(dt){
 camp.t+=dt;
 if(camp.state==='pick'){
  if(camp.choice<0&&camp.t>CAMP_PICK_MAX)camp.choice=1;
  if(camp.choice>=0){giveItem(CAMP_CARDS[camp.choice]);camp.state='rest';camp.rest=CAMP_REST;camp.t=0}}
 else{camp.rest-=dt;if(camp.rest<=0){camp=null;campNext+=CAMP_EVERY;gapT=Math.max(gapT,4)}}}
function campTap(e){
 if(!camp||camp.state!=='pick')return;
 const p=cxy(e);CARDS_X.forEach((x,i)=>{if(p[0]>=x&&p[0]<=x+CARD_W&&p[1]>=CARD_Y&&p[1]<=CARD_Y+CARD_H)camp.choice=i})}
function onMotion(e){
 const a=e.accelerationIncludingGravity;if(!a)return;
 const m=Math.sqrt((a.x||0)*(a.x||0)+(a.y||0)*(a.y||0)+(a.z||0)*(a.z||0)),now=performance.now();
 if(m>24&&now-lastShake>600){lastShake=now;shake1=1}}
const optSave=()=>{try{localStorage.setItem('deep-sea-peek-opts',JSON.stringify({a:assist,l:lowScare,v:MASTER}))}catch(e){}};
{const a=$('peek-assist'),l=$('peek-lowscare'),v=$('peek-vol');
 if(a&&a.addEventListener){a.checked=assist;a.addEventListener('change',()=>{assist=!!a.checked;optSave()})}
 if(l&&l.addEventListener){l.checked=lowScare;l.addEventListener('change',()=>{lowScare=!!l.checked;optSave()})}
 if(v&&v.addEventListener){v.value=Math.round(MASTER*100);v.addEventListener('input',()=>{MASTER=clamp((+v.value||0)/100,0,1);optSave()})}}
/* ---- scene: painted background per world, parallax by lean, first-person bob ---- */
function drawWorld(lamp){
 const wi=clamp(Math.floor(prog/20),0,4),nx=Math.min(4,wi+1),into=(prog%20)/20,a=art('bg-'+WORLDS[wi]);
 g.fillStyle='#0b0f12';g.fillRect(-20,0,W+40,H);
 if(!a)return;
 const one=(im,al)=>{const z=1.12+.015*Math.sin(run*6.28),h=H*z,w=im.naturalWidth*h/im.naturalHeight,x=CX-w/2-clamp(tilt,-1,1)*34+Math.sin(run*3.1)*5,y=(H-h)/2-Math.abs(Math.sin(ph))*(st==='run'?6:2);g.globalAlpha=al;g.drawImage(im,x,y,w,h);g.globalAlpha=1};
 one(a,1);
 if(wi<4&&into>.92){const b=art('bg-'+WORLDS[nx]);if(b)one(b,(into-.92)/.08)}
 const fg=g.createLinearGradient(0,280,0,H);fg.addColorStop(0,'rgba(8,10,14,0)');fg.addColorStop(1,'rgba(8,10,14,.6)');g.fillStyle=fg;g.fillRect(0,280,W,H-280);
 const vg=g.createRadialGradient(CX,240,150,CX,240,520);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(lamp<1){g.fillStyle='rgba(0,0,0,'+(1-lamp)*.85+')';g.fillRect(0,0,W,H)}}
function sprite(im,cx,by,h,al){const w=im.naturalWidth*h/im.naturalHeight;g.save();g.globalAlpha=clamp(al,0,1)*.4;g.fillStyle='#000';g.beginPath();g.ellipse(cx,by,w*.32,7,0,0,7);g.fill();g.globalAlpha=clamp(al,0,1);g.drawImage(im,cx-w/2,by-h,w,h);g.restore();return w}
function floatImg(im,cx,cy,sz,al){const w=im.naturalWidth*sz/Math.max(im.naturalWidth,im.naturalHeight),h=im.naturalHeight*sz/Math.max(im.naturalWidth,im.naturalHeight);g.save();g.globalAlpha=clamp(al==null?1:al,0,1);g.drawImage(im,cx-w/2,cy-h/2,w,h);g.restore()}
function blob(x,y,r,al,col){g.save();g.globalAlpha=clamp(al,0,1);g.fillStyle=col||'#1a0f14';g.beginPath();g.ellipse(x,y,r,r*1.5,0,0,7);g.fill();g.restore()}
function drawSpirits(){
 if(!ev)return;
 const el=ev.el||0,vis=Math.max(0,el-SOUND_LEAD),w=ev.warn||(ev.type==='eye'?EYE.warn:TWIN.warn),open=ev.phase==='judge'?1:clamp(vis/Math.max(.1,w-SOUND_LEAD),0,1);
 const sx=CX+ev.side*SIDE,by=392,judge=ev.phase==='judge';
 if(ev.type==='eye'){            // Leafling: leaves swirl together on one side, then the pile opens its red eye
  const sw=art('env-leaf-swirl'),im=art('ghost-leafling'),h=150*(.85+.15*open);
  if(sw)sprite(sw,sx,by+6,150*(.6+.4*open),judge?.45:Math.min(1,open*1.4));
  if(im)sprite(im,sx+(judge?Math.sin(tt*38)*3:0),by,h,judge?.95:Math.pow(open,1.6)*.8);else blob(sx,by-30,40,open*.8);
  const ex=sx,ey=by-h*.5;
  if(open>.2){g.save();g.globalAlpha=Math.min(1,open*1.2);g.fillStyle='#ff2a2a';g.shadowColor='#ff2a2a';g.shadowBlur=14;g.beginPath();g.arc(ex,ey,5+4*open,0,7);g.fill();g.restore()}
  if(judge){
   const away=tilt*-ev.side,safe=away>=EYE.away,tx2=safe?CX+ev.side*-260:CX+clamp(tilt,-1,1)*150,ty=safe?400:340;
   g.save();g.globalAlpha=safe?.18:.55;g.fillStyle='#ff3030';g.beginPath();g.moveTo(ex,ey-5);g.lineTo(tx2-55,ty+60);g.lineTo(tx2+55,ty+60);g.lineTo(ex,ey+5);g.closePath();g.fill();g.restore()}}
 else if(ev.type==='twins'){     // crows scatter off the branch, then Knocker raps on the wood from that side
  const cr=art('env-crows'),im=art('ghost-thorn');
  if(cr){g.save();g.shadowColor='rgba(200,220,255,.95)';g.shadowBlur=16;floatImg(cr,sx,190-open*130,250,(1-open)*.95+.05);g.restore()}
  if(im)sprite(im,sx+(judge?Math.sin(tt*30)*3:0),by,300*(.9+.1*open),judge?.95:Math.pow(open,1.4)*.7);else blob(sx,by-60,40,judge?.9:open*.6,'#d0d8ff');}
 else{                           // Hush: the crickets stop, the lamp flickers, fog rolls in and something walks toward you
  const lp=art('env-lamp'),fg=art('env-fog'),im=art('ghost-wraith'),p=judge?1:clamp(1-ev.t/WALK.warn,0,1),lampA=ev.t<1.5||judge?.45+.55*lampLevel():1;
  if(lp)sprite(lp,sx,by,330,lampA);
  if(fg){g.save();g.globalAlpha=.15+.55*p;g.drawImage(fg,-40,H-250,W+80,250);g.restore()}
  if(im)sprite(im,CX,by-8,90+300*p,clamp(.2+p*1.1,0,1));else blob(CX,by-60,20+60*p,.3+p*.6,'#08060a')}}
function drawDrops(){
 drops.forEach(d=>{
  const s=1-d.z,x=CX+d.side*(90+(SIDE+30-90)*s),y=300+95*s+Math.sin(tt*3+d.side)*3,sz=44+70*s,im=art(d.k==='scroll'?'item-chest':'item-'+d.k),near=d.z<PICK_AT;
  g.save();if(near){g.shadowColor='#ffd98a';g.shadowBlur=18}
  if(im)floatImg(im,x,y,sz,1);else{g.fillStyle=d.k==='torch'?'#ffb347':d.k==='charm'?'#7fe8ff':'#e8c675';g.beginPath();g.arc(x,y,sz*.3,0,7);g.fill()}
  g.restore();
  if(near)tx('按「撿」',x,y-sz/2-6,15,'#ffd98a')})}
function drawCamp(){
 g.fillStyle='rgba(6,6,10,.55)';g.fillRect(0,0,W,H);
 const cf=art('env-campfire'),rk=art('npc-rook');
 if(cf)sprite(cf,CX,H-40,150,1);
 if(rk)sprite(rk,CX-300,H-30,250,1);
 if(camp.state==='pick'){
  tx('營火歇腳：選一樣帶走',CX,128,24,'#ffd98a');
  const cd=art('ui-card');
  CARDS_X.forEach((x,i)=>{
   const k=CAMP_CARDS[i],im=art(k==='scroll'?'item-chest':'item-'+k),hot=camp.choice===i;
   if(cd)g.drawImage(cd,x,CARD_Y,CARD_W,CARD_H);else RR(x,CARD_Y,CARD_W,CARD_H,10,'#3a2c1c',3);
   if(im)floatImg(im,x+CARD_W*.49,CARD_Y+CARD_H*.34,CARD_W*.4,1);
   txp(ITEM_NAME[k],x+CARD_W/2,CARD_Y+CARD_H*.66,19,'#2a1a0c');
   txd(ITEM_DESC[k],x+CARD_W/2,CARD_Y+CARD_H*.76,13,'#3a2812',CARD_W*.62,2);
   if(hot){g.strokeStyle='#ffd98a';g.lineWidth=4;g.strokeRect(x+3,CARD_Y+3,CARD_W-6,CARD_H-6)}});
  tx('點卡片或按 1／2／3',CX,CARD_Y+CARD_H+30,16,'#f1d9a6')}
 else tx('歇一口氣……',CX,128,24,'#f1d9a6')}
/* centred text with wrapping by character count (CJK is one em wide, so no measureText needed) */
function wrapLines(s,sz,wd){const n=Math.max(2,Math.floor(wd/sz)),o=[];for(let i=0;i<s.length&&o.length<12;i+=n)o.push(s.slice(i,i+n));return o}
function txp(s,x,y,sz,col){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.fillStyle=col;g.fillText(s,x,y,W-24)}   // plain text for parchment
function txd(s,x,y,sz,col,wd,maxL){g.font='700 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.fillStyle=col;wrapLines(s,sz,wd).slice(0,maxL||12).forEach((ln,i)=>g.fillText(ln,x,y+i*(sz+4)))}
function drawButtons(){
 const I=inputs(),pk=canPick();
 const on=[I.tilt<-.05&&!gyro.on,I.tilt>.05&&!gyro.on,I.cover,I.wind,btn[4]||keys.pick];
 BTN.forEach((b,i)=>{
  if(i===4&&!pk){RR(b[0],b[1],b[2],b[3],12,'rgba(58,44,28,.45)',2);tx(b[4],b[0]+b[2]/2,b[1]+34,19,'rgba(241,217,166,.45)');return}
  RR(b[0],b[1],b[2],b[3],12,on[i]?'#d6a24e':i===4?'#5a7a3a':'#3a2c1c',3);tx(b[4],b[0]+b[2]/2,b[1]+34,20,on[i]?'#1b1208':'#f1d9a6')})}
/* ---- headphone check card (first screen) ---- */
const HP={x:CX-220,y:56,w:440};
function hpRect(k){
 const h=HP.w*432/578,f=k==='spk'?[.25,.78,.22,.1]:[.53,.78,.23,.1];
 return[HP.x+HP.w*f[0],HP.y+h*f[1],HP.w*f[2],h*f[3]]}
function hpClick(e){
 const p=cxy(e),inR=r=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];
 if(inR(hpRect('spk'))){audioInit();tone(660,.18,.08,-1,'sine');setTimeout(()=>tone(660,.18,.08,1,'sine'),320);say('先左耳、再右耳各一聲。聽得到就按勾勾。');return true}
 if(inR(hpRect('ok'))){audioInit();audioOk=true;say('耳機確認完成。按「免費開始逃跑」。');return true}
 return false}
function drawHeadphone(){
 const im=art('ui-headphone'),h=HP.w*432/578;
 if(im)g.drawImage(im,HP.x,HP.y,HP.w,h);else RR(HP.x,HP.y,HP.w,h,14,'#3a2c1c',3);
 txp('戴上耳機更容易躲',CX,HP.y+h*.40,26,'#3a2812');
 txd('聲音會從左或右傳來。按喇叭聽左右各一聲，聽得到就按勾勾。',CX,HP.y+h*.50,17,'#3a2812',HP.w*.58,3);
 for(const k of ['spk','ok']){const r=hpRect(k);if(!im){RR(r[0],r[1],r[2],r[3],8,'#5a4228',2);tx(k==='spk'?'聲音':'確認',r[0]+r[2]/2,r[1]+r[3]*.7,16,'#f1d9a6')}}}
function hud(I,lamp){
 const bn=art('ui-banner'),bw=420,bh=82;
 if(bn){g.drawImage(bn,10,8,bw,bh);
  const x0=10+bw*.2,wd=bw*.73;RR(x0,8+bh*.32,wd,bh*.34,6,'rgba(60,40,20,.35)');if(prog>0)RR(x0,8+bh*.32,Math.max(12,wd*prog/100),bh*.34,6,prog>=85?'#c4472f':'#b98a2c');
  tx('距離出口 '+Math.floor(prog)+'%',x0+wd/2,8+bh*.6,17,'#f6e7c0')}
 else{RR(16,14,W-32,14,7,'rgba(255,255,255,.12)');if(prog>0)RR(16,14,Math.max(16,(W-32)*prog/100),14,7,prog>=85?'#ff6a4d':'#e8c675');tx('距離出口 '+Math.floor(prog)+'%',16,50,15,'#f1d9a6','left')}
 const lv=art('ui-lives');
 if(lv){const lw=300,k=lw/578,sy=112,sh=190,lx=W-lw-10,ly=14;g.drawImage(lv,0,sy,578,sh,lx,ly,lw,sh*k);
  const oy=ly+(.49*432-sy)*k+4,vals=[bag.torch,bag.charm,scrolls];[.42,.61,.805].forEach((f,i)=>{tx(String(vals[i]),lx+lw*f,oy,16,vals[i]?'#fff':'#789')});
  tx('火把',lx+lw*.42,ly+sh*k+12,12,'#f1d9a6');tx('護身符',lx+lw*.61,ly+sh*k+12,12,'#f1d9a6');tx('卷軸',lx+lw*.805,ly+sh*k+12,12,'#f1d9a6')}
 else tx('火把'+bag.torch+' 護身符'+bag.charm+' 卷軸'+scrolls,W-16,50,15,'#f1d9a6','right');
 let hint='';
 if(ev&&ev.type==='eye')hint=ev.phase==='warn'?'腳邊的落葉在聚集……放開「衝刺」！':'往落葉的反方向靠！躲開紅光！';
 else if(ev&&ev.type==='twins')hint=ev.phase==='warn'?'鳥群飛走了，有東西在敲樹枝……別往敲擊那邊靠':'往敲擊的反方向靠！';
 else if(ev&&ev.type==='walker')hint=ev.phase==='warn'?'蟲鳴停了，路燈在閃。燈滅前蓋住螢幕！':'蓋住不要動，等腳步聲遠去……';
 else if(canPick())hint='路邊有東西！靠近時按「撿」（F／搖手機）';
 else if(prog<25&&!I.wind)hint='自動奔跑中！按住「衝刺」跑更快（衝刺時不能靠邊）';
 if(hint)tx(hint,CX,150,17,'#ffd98a');
 if(ev&&(assist||ev.torch)){   // assist mode / torch: mark the dangerous side and the safe side
  const dg=ev.type==='walker'?0:ev.side,col=ev.torch?'#ffb347':'#ffd98a';
  if(dg){const dx=CX+dg*340;g.save();g.fillStyle='#ff5a4d';g.globalAlpha=.8;g.beginPath();g.moveTo(dx+dg*22,170);g.lineTo(dx-dg*10,150);g.lineTo(dx-dg*10,190);g.closePath();g.fill();g.restore();tx('危險',dx,215,14,'#ff9a8a');
   const sxm=CX-dg*340;g.save();g.fillStyle=col;g.globalAlpha=.8;g.beginPath();g.moveTo(sxm-dg*22,170);g.lineTo(sxm+dg*10,150);g.lineTo(sxm+dg*10,190);g.closePath();g.fill();g.restore();tx(ev.type==='eye'||ev.type==='twins'?'往這邊靠':'',sxm,215,14,col)}
  else tx('蓋住螢幕',CX,160,18,col)}
 if(assist){const cp=art('ui-compass');if(cp)floatImg(cp,CX,300,70,.85)}}
const KILLER={eye:'ghost-leafling',twins:'ghost-thorn',walkerLate:'ghost-wraith',walkerMove:'ghost-wraith'};
function drawDeath(){
 g.fillStyle='rgba(18,13,10,.78)';g.fillRect(0,0,W,H);
 const bn=art('ui-banner'),cd=art('ui-card');
 if(bn)g.drawImage(bn,CX-250,14,500,97);else RR(CX-250,14,500,97,10,'#3a2c1c',3);
 txp('你死了　停在 '+Math.floor(prog)+'%',CX+30,76,30,'#3a2812');
 const xs=[CX-250,CX+70],kw=180,kh=210,ky=128;
 for(let i=0;i<2;i++){
  const x=xs[i];if(cd)g.drawImage(cd,x,ky,kw,kh);else RR(x,ky,kw,kh,10,'#3a2c1c',3);
  const im=art(i?'guide-flick':KILLER[why]||'ghost-wraith');if(im)floatImg(im,x+kw*.49,ky+kh*.34,kw*.38,1);
  txd(i?TIPS[why]||'':CAUSES[why]||'',x+kw/2,ky+kh*.63,14,'#2a1a0c',kw*.7,6)}
 tx(i0(),CX,ky+kh+34,18,'#ffd98a');
 tx('躲過 '+survived+' 次襲擊'+(earned>0?'　本局入帳 '+fmt(earned)+' 點':''),CX,ky+kh+62,18,'#f1d9a6');
 if(rec)tx('新紀錄！',CX,ky+kh+88,20,'#ffd98a');
 tx('到右邊操作區按「免費再開一次」',CX,H-14,16,'#f1d9a6')}
const i0=()=>FLICK_TIPS[Math.max(0,['eye','twins','walkerLate','walkerMove'].indexOf(why))%3];
function draw(){
 const I=inputs(),lamp=st==='run'?lampLevel():1,cov=st==='run'&&I.cover;
 const ox=shake>0?(Math.random()-.5)*14:0;
 g.save();g.translate(ox,0);
 drawWorld(lamp);
 if(st==='run'||st==='won'||st==='over'){drawSpirits();drawDrops()}
 if(ev&&ev.type==='walker'&&ev.phase==='warn'&&ev.t<3.5){g.fillStyle='rgba(200,230,255,'+(.05+.18*(1-ev.t/3.5))+')';g.fillRect(0,0,W,H)}
 fxs.forEach(f=>{g.globalAlpha=1-f.t/.9;tx(f.s,f.x,f.y-f.t*40,22,f.col);g.globalAlpha=1});
 g.restore();
 if(st==='run'&&camp){drawCamp();hud(I,lamp)}
 else if(st==='run'){
  hud(I,lamp);drawButtons();
  if(cov){g.fillStyle='rgba(0,0,0,.96)';g.fillRect(0,0,W,H);tx('（螢幕蓋住了）',CX,230,20,'#4a3a2a');drawButtons()}
  else if(lamp<=0){g.fillStyle='rgba(0,0,0,.93)';g.fillRect(0,0,W,H);tx('燈滅了。有什麼東西走過來了……',CX,230,20,'#6a4a3a')}}
 if(flash>0){g.fillStyle='rgba(200,20,20,'+flash*1.2+')';g.fillRect(0,0,W,H)}
 if(st==='ready'){
  g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);
  if(!audioOk)drawHeadphone();
  else{tx('別看',CX,100,56,'#e8c675');tx('Don\'t Peek　禁忌寶盒・夜逃',CX,140,22,'#f1d9a6');
   tx('自動奔跑。落葉堆起來：往反方向靠。敲樹枝：往反方向靠。',CX,200,18,'#f1d9a6');tx('燈在閃：蓋住螢幕不要動。路邊的東西靠近時按「撿」。',CX,232,18,'#f1d9a6');
   tx('電腦：A／D 靠邊　空白鍵蓋住　W 衝刺　F 撿　手機：按鈕或「啟用體感」',CX,278,16,'#f1d9a6');tx('到右邊操作區按「免費開始逃跑」',CX,360,22,'#ffd98a')}}
 else if(st==='won'){g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);tx('衝出去了',CX,150,48,'#ffd98a');tx('別看裡面。',CX,210,30,'#ff6a4d');tx('躲過 '+survived+' 次襲擊',CX,270,22,'#f1d9a6');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'',CX,310,22,'#ffd98a');tx('到右邊操作區再開一次',CX,390,20,'#f1d9a6')}
 else if(st==='over')drawDeath()}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 audioInit();audioOk=true;
 analytics=AN.start('peek',amount);peekStake=amount;peekBusy=true;save();renderAll();
 reset();earned=0;st='run';last=performance.now();say('開始逃跑。別回頭。');ui();c.focus();
}
const shown=()=>!$('view-peek').hidden&&!document.hidden;
function region(e){
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*W/(r.width||W),y=(e.clientY-r.top)*H/(r.height||H);
 for(let i=0;i<BTN.length;i++){const b=BTN[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return i}
 return y<BTN[0][1]?3:-1}
function syncPtrs(){btn=[0,0,0,0,0];ptrs.forEach(i=>{if(i>=0)btn[i]=1})}
$('peek-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){if(st==='ready'&&!audioOk&&shown()&&hpClick(e))return;say(st==='ready'?'先按「免費開始逃跑」。':'這一局已結算。按「免費再開一次」開始新的一局。');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(x){}
 if(camp){campTap(e);return}
 ptrs.set(e.pointerId,region(e));ptrT.set(e.pointerId,performance.now());syncPtrs()});
const upPtr=e=>{ptrs.delete(e.pointerId);ptrT.delete(e.pointerId);syncPtrs()};
c.addEventListener('pointerup',upPtr);c.addEventListener('pointercancel',upPtr);c.addEventListener('lostpointercapture',upPtr);
c.addEventListener('contextmenu',e=>e.preventDefault());
const KEYMAP={a:'l',A:'l',ArrowLeft:'l',d:'r',D:'r',ArrowRight:'r',' ':'cover',f:'pick',F:'pick',w:'wind',W:'wind',ArrowUp:'wind'};
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(camp&&camp.state==='pick'&&'123'.includes(e.key)&&e.key){camp.choice=+e.key-1;e.preventDefault();return}
 const k=KEYMAP[e.key];if(!k)return;e.preventDefault();keys[k]=1});
addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(k)keys[k]=0});
function clearInput(){keys={l:0,r:0,cover:0,wind:0,pick:0};ptrs.clear();syncPtrs()}
addEventListener('blur',()=>{last=performance.now();clearInput()});
document.addEventListener('visibilitychange',()=>{last=performance.now();clearInput()});
window.addEventListener('hashchange',()=>{last=performance.now();clearInput()});
/* ---- optional phone motion: lean the phone, turn it face down to cover ---- */
function onOrient(e){if(e.gamma===null||e.gamma===undefined)return;gyro.tilt=clamp(e.gamma/30,-1,1);gyro.down=Math.abs(e.beta||0)>145}
const gb=$('peek-gyro');
if(gb)gb.addEventListener('click',()=>{
 if(gyro.on){gyro.on=false;window.removeEventListener('deviceorientation',onOrient);window.removeEventListener('devicemotion',onMotion);gb.textContent='啟用體感（手機）';return}
 const go=()=>{gyro.on=true;window.addEventListener('deviceorientation',onOrient);window.addEventListener('devicemotion',onMotion);gb.textContent='關閉體感'};
 try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')go();else say('沒有取得體感權限，改用按鈕操作。','lose')}).catch(()=>say('這個瀏覽器不能使用體感，改用按鈕操作。','lose'))}else go()}catch(e){say('這個瀏覽器不能使用體感，改用按鈕操作。','lose')}});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
