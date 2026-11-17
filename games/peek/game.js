  /* ---------- Don't Peek: wind the music box while spirits strike; lean away, cover the screen, hold still ---------- */
  var peekBusy=false,peekStake=0,peekSay=function(){};
  (function(){
const c=$('peek-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#120d0a';
const WIND_RATE=3;                         // % of the music-box spring wound per second while cranking
const WIND_MAX_TILT=.35;                   // cranking only works while the box is nearly level
const MILE_EVENTS=3,MILE_REWARD=2,WIN_REWARD=5; // fixed BONUS: survive 3 spirits +2, open the box +5, each once per round
const FIRST_GAP=4,GAP_MIN=4,GAP_MAX=7;     // seconds before the first spirit and between spirits
const DIRECTOR_AT=85,DIRECTOR_P=.75;       // once per round, past 85% a spirit may strike within 3 seconds
const TILT_SPEED=6;                        // keyboard / button lean speed per second
const EYE={warn:2.5,judge:3,away:.5,grace:.35};   // lean away from the red beam for 3s, 0.35s of slack
const TWIN={warn:2.5,judge:1.5,away:.6,toward:.3}; // lean away from the giggle side; leaning toward it is fatal
const WALK={warn:6,judge:4,still:.3};      // cover before the light goes out, stay covered and still
const TYPES=['eye','twins','walker'];
const CAUSES={eye:'死因 #1 對視：紅光鎖定你時，你沒有往反方向躲',twins:'死因 #2 回頭：笑聲在哪邊，你就往哪邊看',walkerLate:'死因 #3 慢半拍：燈滅的時候你還沒蓋住螢幕',walkerMove:'死因 #4 手賤：腳步聲還沒走遠你就動了'};
const BTN=[[8,492,90,56,'傾左'],[106,492,90,56,'傾右'],[204,492,90,56,'蓋住'],[302,492,90,56,'發條']];
let best=0,deaths={};try{best=+localStorage.getItem('deep-sea-peek-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-peek-deaths')||'{}')||{}}catch(e){deaths={}}
let analytics=null,earned=0;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-24);g.fillStyle=col;g.fillText(s,x,y,W-24)}
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(f){g.fillStyle=f;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}};
let st='ready',prog,tilt,gapT,ev,survived,lastType,directorUsed,score,why,rec,flash,shake,tt=0,last=0,fxs=[],lampOut=0;
let keys={l:0,r:0,cover:0,wind:0},btn=[0,0,0,0],ptrs=new Map(),gyro={on:false,tilt:0,down:false};
function reset(){prog=0;tilt=0;gapT=FIRST_GAP;ev=null;survived=0;lastType='';directorUsed=false;score=0;why='';rec=false;flash=0;shake=0;fxs=[];lampOut=0}
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
 setText('peek-prog',Math.floor(prog)+'%');setText('peek-spirits',survived+' 次襲擊');setText('peek-best',best+'%');
 $('peek-amount').disabled=peekBusy;$('peek-go').disabled=live;setText('peek-go',live?'上弦中 · 別看裡面':st==='ready'?'扣點開始上弦':'扣點再開一次');
}
function fx(s,x,y,col){fxs.push({s,x,y,col,t:0})}
function end(kind,reason){
 if(st!=='run')return;
 st=kind==='won'?'won':'over';why=reason||'';
 const p=Math.floor(prog);rec=p>best;
 if(rec){best=p;try{localStorage.setItem('deep-sea-peek-best',best)}catch(e){}}
 if(kind==='dead'){deaths[reason]=(deaths[reason]||0)+1;try{localStorage.setItem('deep-sea-peek-deaths',JSON.stringify(deaths))}catch(e){}flash=.5;shake=.5}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p});peekBusy=false;save();renderAll();
 if(kind==='won')say('盒子打開了。別看裡面。本局共入帳 '+fmt(earned)+' 點。','win');
 else if(!earned)say(CAUSES[reason]+'。這一局沒有點數。','lose');
 else say(CAUSES[reason]+'。本局共入帳 '+fmt(earned)+' 點。','win');
 ui();
}
function pay(n,text){
 earned+=n;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});
 say(text+' +'+n+' 點已入帳。','win')}
function startEvent(){
 const pool=TYPES.filter(t=>t!==lastType),type=pool[(Math.random()*pool.length)|0];
 ev={type,side:Math.random()<.5?-1:1,phase:'warn',t:type==='eye'?EYE.warn:type==='twins'?TWIN.warn:WALK.warn,bad:0,ok:false,snd:0};
 lastType=type}
function survive(){
 survived++;score+=100;lastType=ev.type;ev=null;gapT=rnd(GAP_MIN,GAP_MAX);fx('躲過了！',200,200,'#ffd98a');
 if(survived===MILE_EVENTS)pay(MILE_REWARD,'躲過 '+MILE_EVENTS+' 次襲擊！')}
function inputs(){
 const tIn=gyro.on?gyro.tilt:clamp(keys.r-keys.l+(btn[1]?1:0)-(btn[0]?1:0),-1,1);
 return{tilt:tIn,cover:!!(keys.cover||btn[2]||gyro.down),wind:!!(keys.wind||btn[3])}}
function update(dt){
 tt+=dt;
 if(flash>0)flash-=dt;if(shake>0)shake-=dt;fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.9);
 if(st!=='run')return;
 const I=inputs();
 if(gyro.on)tilt=I.tilt;else tilt+=clamp(I.tilt-tilt,-TILT_SPEED*dt,TILT_SPEED*dt);
 const covered=I.cover;
 if(I.wind&&!covered&&Math.abs(tilt)<=WIND_MAX_TILT)prog=Math.min(100,prog+WIND_RATE*dt);
 if(prog>=100){score+=500;pay(WIN_REWARD,'盒子打開了！');end('won');return}
 if(!directorUsed&&prog>=DIRECTOR_AT){directorUsed=true;if(!ev&&Math.random()<DIRECTOR_P)gapT=Math.min(gapT,rnd(1,3))}
 if(!ev){gapT-=dt;if(gapT<=0)startEvent();return}
 ev.t-=dt;
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
function drawBox(){
 g.save();g.translate(200,300);g.rotate(tilt*.32);
 RR(-96,-46,192,92,10,'#b8863b',4);RR(-96,-62,192,26,8,'#d6a24e',4);
 g.fillStyle='#8a6226';for(let i=0;i<4;i++){g.beginPath();g.arc(-66+i*44,6,10,0,7);g.fill()}
 g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(-96,-36);g.lineTo(96,-36);g.stroke();
 g.save();g.translate(96,0);g.rotate(prog*.25);g.strokeStyle='#e8c675';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(34,0);g.stroke();g.fillStyle='#e8c675';g.beginPath();g.arc(34,0,8,0,7);g.fill();g.restore();
 if(ev&&ev.type==='eye'){
  const ex=ev.side*96,open=ev.phase==='judge'?1:clamp(1-ev.t/EYE.warn,0,1);
  g.fillStyle='#2a0505';g.beginPath();g.ellipse(ex,0,10,6+12*open,0,0,7);g.fill();
  if(open>.2){g.fillStyle='#ff2a2a';g.beginPath();g.arc(ex+ev.side*2,0,5*open,0,7);g.fill()}}
 g.restore()}
function drawBeam(){
 if(!ev||ev.type!=='eye'||ev.phase!=='judge')return;
 const away=tilt*-ev.side,safe=away>=EYE.away,ex=200+ev.side*96,tx2=safe?200+ev.side*360:200;
 g.save();g.globalAlpha=safe?.2:.55;g.fillStyle='#ff3030';g.beginPath();g.moveTo(ex,300);g.lineTo(tx2-60,470);g.lineTo(tx2+60,470);g.closePath();g.fill();g.restore()}
function drawTwins(){
 if(!ev||ev.type!=='twins')return;
 const x=ev.side<0?26:374,a=ev.phase==='judge'?.9:clamp(1-ev.t/TWIN.warn,0,1)*.7;
 g.save();g.globalAlpha=a;g.fillStyle='#dfe6ff';
 for(let i=0;i<3;i++){g.beginPath();g.arc(x,190+i*54+(i%2)*10,12+i*2,0,7);g.fill();for(let f=0;f<4;f++){g.beginPath();g.arc(x+(f-1.5)*7,190+i*54+(i%2)*10-15,3.5,0,7);g.fill()}}
 if(ev.phase==='judge'){g.fillStyle='#fff';g.beginPath();g.arc(x,330,18,0,7);g.fill();g.fillStyle=OL;g.fillRect(x-9,326,5,5);g.fillRect(x+4,326,5,5)}
 g.restore()}
function drawButtons(){
 const I=inputs();const on=[I.tilt<-.05&&!gyro.on,I.tilt>.05&&!gyro.on,I.cover,I.wind];
 BTN.forEach((b,i)=>{RR(b[0],b[1],b[2],b[3],12,on[i]?'#d6a24e':'#3a2c1c',3);tx(b[4],b[0]+b[2]/2,b[1]+36,20,on[i]?'#1b1208':'#f1d9a6')})}
function draw(){
 const I=inputs(),lamp=st==='run'?lampLevel():1,cov=st==='run'&&I.cover;
 const ox=shake>0?(Math.random()-.5)*14:0;
 g.save();g.translate(ox,0);
 g.fillStyle='#120d0a';g.fillRect(-20,0,W+40,H);
 const gr=g.createRadialGradient(200,150,10,200,260,320);gr.addColorStop(0,'rgba(255,205,120,'+(.55*lamp)+')');gr.addColorStop(1,'rgba(255,205,120,0)');g.fillStyle=gr;g.fillRect(-20,0,W+40,H);
 g.fillStyle='#2b1d12';g.fillRect(-20,380,W+40,100);g.fillStyle='#3d2a19';g.fillRect(-20,380,W+40,8);
 g.strokeStyle='#b8863b';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(200,0);g.lineTo(200,70);g.stroke();g.fillStyle='#d6a24e';g.beginPath();g.moveTo(170,100);g.lineTo(230,100);g.lineTo(214,66);g.lineTo(186,66);g.closePath();g.fill();
 drawBox();drawBeam();drawTwins();
 if(ev&&ev.type==='walker'&&ev.phase==='warn'&&ev.t<3.5){g.fillStyle='rgba(200,230,255,'+(.05+.18*(1-ev.t/3.5))+')';g.fillRect(0,0,W,H)}
 fxs.forEach(f=>{g.globalAlpha=1-f.t/.9;tx(f.s,f.x,f.y-f.t*40,22,f.col);g.globalAlpha=1});
 g.restore();
 /* HUD */
 g.fillStyle='rgba(255,255,255,.12)';RR(16,14,W-32,16,8,'rgba(255,255,255,.12)');
 if(prog>0)RR(16,14,Math.max(16,(W-32)*prog/100),16,8,prog>=85?'#ff6a4d':'#e8c675');
 tx('發條',16,50,15,'#f1d9a6','left');tx(Math.floor(prog)+'%',W-16,50,15,'#f1d9a6','right');
 let hint='';
 if(st==='run'){
  if(ev&&ev.type==='eye')hint=ev.phase==='warn'?'盒子裡有東西在轉動眼珠……':'往反方向傾斜！躲開紅光！';
  else if(ev&&ev.type==='twins')hint=ev.phase==='warn'?'有笑聲貼著耳朵……不要往聲音那邊看':'往笑聲的反方向傾斜！';
  else if(ev&&ev.type==='walker')hint=ev.phase==='warn'?'腳步聲靠近了。燈滅前蓋住螢幕！':'蓋住不要動，等腳步聲遠去……';
  else if(prog<=0)hint='按住發條開始上弦';
  if(hint)tx(hint,200,80,17,'#ffd98a')}
 if(st==='run')drawButtons();
 if(cov){g.fillStyle='rgba(0,0,0,.96)';g.fillRect(0,0,W,H);tx('（螢幕蓋住了）',200,280,18,'#4a3a2a');drawButtons()}
 else if(st==='run'&&lamp<=0){g.fillStyle='rgba(0,0,0,.93)';g.fillRect(0,0,W,H);tx('燈滅了。有什麼東西走過來了……',200,280,18,'#6a4a3a')}
 if(flash>0){g.fillStyle='rgba(200,20,20,'+flash*1.2+')';g.fillRect(0,0,W,H)}
 if(st!=='run'){
  g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);
  if(st==='ready'){tx('別看',200,150,52,'#e8c675');tx('禁忌寶盒',200,190,22,'#f1d9a6');
   tx('按住發條，把八音盒轉到 100%',200,250,18,'#f1d9a6');tx('紅光來了：往反方向傾斜',200,284,18,'#f1d9a6');tx('笑聲來了：往笑聲的反方向傾斜',200,314,18,'#f1d9a6');tx('燈要滅了：蓋住螢幕，不要動',200,344,18,'#f1d9a6');tx('建議戴耳機。到操作區扣點開始',200,420,20,'#ffd98a')}
  else if(st==='won'){tx('盒子打開了',200,190,40,'#ffd98a');tx('別看裡面。',200,250,28,'#ff6a4d');tx('躲過 '+survived+' 次襲擊',200,310,20,'#f1d9a6');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'',200,350,22,'#ffd98a');tx('到操作區再開一次',200,420,20,'#f1d9a6')}
  else{tx('你死了',200,160,40,'#ff6a4d');tx(CAUSES[why]||'',200,215,15,'#f1d9a6');tx(Math.floor(prog)+'%',200,290,60,'#ffd98a');tx('躲過 '+survived+' 次襲擊',200,330,20,'#f1d9a6');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'躲過 '+MILE_EVENTS+' 次才有點數',200,368,20,earned>0?'#ffd98a':'#f1d9a6');if(rec)tx('新紀錄！',200,402,20,'#ffd98a');tx('到操作區再開一次',200,450,20,'#f1d9a6')}}
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 audioInit();
 analytics=AN.start('peek',amount);peekStake=amount;peekBusy=true;S.balance-=amount;save();renderAll();
 reset();earned=0;st='run';last=performance.now();say('開始上弦。盒子裡有東西……不要往裡面看。');ui();c.focus();
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
 if(st!=='run'){say(st==='ready'?'先按「扣點開始上弦」。':'這一局已結算。按「扣點再開一次」開始新的一局。');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(x){}
 ptrs.set(e.pointerId,region(e));syncPtrs()});
const upPtr=e=>{ptrs.delete(e.pointerId);syncPtrs()};
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
