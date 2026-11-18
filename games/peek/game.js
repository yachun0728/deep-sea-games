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
const ITEM_NAME={torch:'火把',charm:'護身符',scroll:'舊卷軸',nib:'Nib'};
const ITEM_DESC={torch:'下次襲擊多 0.6 秒並標出方向',charm:'擋下一次致命失誤',scroll:'收藏品，集滿 3 卷營火旁會掛上骷髏燈籠',nib:'無害的小傢伙，偷偷塞給你一卷軸'};
const FLICK_TIPS=['小螢：腳邊的落葉聚成一堆，就往反方向靠。','小螢：鳥群突然飛走，是有東西在敲樹枝。','小螢：蟲鳴停了、路燈在閃，趁燈滅前蓋住螢幕。','小螢：蓋住螢幕之後別動，牠走遠了才放開。','小螢：風向反了。拖行聲從哪邊來，就往那邊靠。','小螢：首領會一直站著。蓋住螢幕，多等一下。','小螢：首領會一直站著。蓋住螢幕，多等一下。'];
const CAUSES={eye:'死因 #1 葉下客：落葉聚在哪一邊，你沒有往反方向躲',twins:'死因 #2 敲枝者：敲擊聲在哪一邊，你就往哪一邊靠',walkerLate:'死因 #3 靜林鬼：燈滅的時候你還沒蓋住螢幕',walkerMove:'死因 #4 靜林鬼：牠還沒走遠你就動了',gale:'死因 #5 逆風客：風反著吹的時候，你沒有迎著風來的方向靠',hollowLate:'死因 #6 空殼：燈滅的時候你還沒蓋住螢幕',hollowMove:'死因 #7 空殼：牠還沒離開你就動了'};
const TIPS={eye:'下次：落葉聚在哪邊，就往另一邊靠，撐滿 3 秒。',twins:'下次：鳥群飛走、敲擊聲響起時，往敲擊的反方向靠。',walkerLate:'下次：路燈開始閃就要準備，燈滅前蓋住螢幕。',walkerMove:'下次：蓋住之後別動，等牠走遠才放開。',gale:'下次：風向反了、拖行聲靠近時，往風來的那一邊靠。',hollowLate:'下次：首領前一定先放開衝刺，燈一滅就蓋住螢幕。',hollowMove:'下次：空殼停留很久，蓋住螢幕後再等一下。'};
const BTN=[[16,388,120,52,'靠左'],[146,388,120,52,'靠右'],[534,388,120,52,'蓋住'],[664,388,120,52,'衝刺'],[340,388,120,52,'撿']];   // landscape: lean + cover bottom-left/right, pick up in the middle
let best=0,deaths={};try{best=+localStorage.getItem('deep-sea-peek-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-peek-deaths')||'{}')||{}}catch(e){deaths={}}
let analytics=null,earned=0,dodgesTotal=0,run=0,ph=0,eyeSeen=0;try{dodgesTotal=+localStorage.getItem('deep-sea-peek-dodges')||0}catch(e){}
const ptrT=new Map();
let R=()=>Math.random(),L=null,lvl=0,lives=3,ck=1,maxLvl=1,noDrop=0,healTen=-1,lvDeaths={},seen={},runTop=1,daily=false,seed=0,seedCode='',rB=BASE_RATE,rW=WIND_RATE,practice='',nextPractice='',forceLvl=null,dex=false,dexSel=0,assistHid=0,deathEv=null,guarantee=false,dropped=false,scared=false,nibT=0,lostAll=false,captions=false,AMB=.6;
try{const o=JSON.parse(localStorage.getItem('deep-sea-peek-save')||'{}');maxLvl=o.m||1;ck=1;lives=o.l||3;noDrop=o.n||0;healTen=o.h==null?-1:o.h;lvDeaths=o.d||{};seen=o.s||{};runTop=o.r||maxLvl}catch(e){}
const rnd=(a,b)=>a+R()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-24);g.fillStyle=col;g.fillText(s,x,y,W-24)}
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(f){g.fillStyle=f;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}};
let st='ready',prog,tilt,gapT,ev,survived,lastType,directorUsed,score,why,rec,flash,shake,tt=0,last=0,fxs=[],lampOut=0;
let keys={l:0,r:0,cover:0,wind:0,pick:0},btn=[0,0,0,0,0],ptrs=new Map(),gyro={on:false,tilt:0,down:false};
let bag,drops,dropT,camp,campNext,openFx,pickHeld=0,shake1=0,sc=0,scrolls=0,audioOk=false,assist=false,lowScare=false,MASTER=.7,chirpT=0,lastShake=0;
try{scrolls=+localStorage.getItem('deep-sea-peek-scrolls')||0}catch(e){}
try{const o=JSON.parse(localStorage.getItem('deep-sea-peek-opts')||'{}');assist=!!o.a;lowScare=!!o.l;captions=!!o.c;if(typeof o.m==='number')AMB=clamp(o.m,0,1);if(typeof o.v==='number')MASTER=clamp(o.v,0,1)}catch(e){}
/* ---- levels: 100 levels in 5 worlds, a ten-level sawtooth with buffer levels and a boss every tenth (v0.5 section 5) ---- */
const WORLD_BASE=[1,1.15,1.3,1.45,1.6],WORLD_NAME=['森林','墓地','沼澤','雪原','火山'];
const WORLD_RULE=['','濃霧讓視野變窄。','沼澤讓聲音變悶，要聽仔細。','雪地讓腳步沉重，靠邊比較慢。','熱浪讓畫面微微晃動。'];
const RHYTHM=[0,.65,.8,.85,.9,.65,.95,1,1.05,1.2,1];   // multiplier by level number inside a ten
const LEARN={2:'eye',3:'twins',4:'walker',12:'gale'};   // the level that teaches each ghost
const KIND_NAME={safe:'安全緩衝',review:'低壓複習',learn:'學新鬼',normal:'一般',mix:'混合',peak:'高峰',boss:'首領'};
const WARN_FLOOR={eye:1.6,twins:1.4,walker:3.5,gale:1.6};   // no knob may push a clue below these
const GALE={warn:2.5,judge:2,toward:.5,grace:.35};            // lean toward the side the reversed wind comes from
const GHOST_OF={eye:'eye',twins:'twins',walkerLate:'walker',walkerMove:'walker',gale:'gale',hollowLate:'hollow',hollowMove:'hollow'};
const mulberry=a=>()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const deathsOf=ty=>Object.keys(GHOST_OF).filter(k=>GHOST_OF[k]===ty).reduce((a,k)=>a+(deaths[k]||0),0);
function levelCfg(l,ease){
 const wi=Math.min(4,((l-1)/20)|0),inW=(l-1)%20,k=inW%10+1,ten=((l-1)/10)|0;
 const D=WORLD_BASE[wi]*RHYTHM[k]*(1+(inW>=10?.1:0)),t=clamp((D-.65)/1.45,0,1);
 const pool=['eye','twins','walker','gale'].filter(ty=>l>=+Object.keys(LEARN).find(n=>LEARN[n]===ty));
 const kind=k===1?'safe':k===5?(ten%2?'review':'safe'):k===10?'boss':LEARN[l]?'learn':k>=9?'peak':k>=6?'mix':'normal';
 let n=kind==='safe'?0:kind==='review'?1:kind==='boss'?pool.length+1:kind==='learn'?3:Math.round(2+6*t);
 if(ease&&n>1)n--;
 const gap=8-5*t,dur=Math.max(30,8+n*(gap+4.5)),free=kind==='normal'||kind==='mix'||kind==='peak';
 return{l,wi,k,kind,D,t,left:n,gap,rate:100/dur,wmul:1.25-.65*t,ease:!!ease,fixed:k===1||k===10,
  pool:kind==='learn'?[LEARN[l]]:pool,plan:kind==='boss'?pool.concat('hollow'):null,
  fakeP:l>=15&&free?.15*t:0,chainP:l>=25&&free?.35*t:0}}
function wpick(pool){   // weighted: the newest ghost x2, the one that killed you most x1.5
 const dm=Math.max(0,...pool.map(deathsOf)),w=pool.map((ty,i)=>(i===pool.length-1&&pool.length>1?2:1)*(dm>0&&deathsOf(ty)===dm?1.5:1));
 let r=R()*w.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i]}return pool[pool.length-1]}
const lvUI=$('peek-level'),hasLv=!!(lvUI&&lvUI.dataset&&lvUI.dataset.lv==='1');
const dailyOn=()=>{const d=hasLv?$('peek-daily'):null;return !!(d&&d.checked)};
function dailyLvl(){const d=new Date(),n=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);let l=(n*37)%100+1;while([1,5,10].includes((l-1)%10+1))l=l%100+1;return l}   // same level for everyone on the same date; never a safe or boss level
function wantLevel(){
 if(forceLvl!==null)return forceLvl;
 if(!hasLv)return 0;
 const v=lvUI.value===''||isNaN(+lvUI.value)?ck:Math.floor(+lvUI.value);return clamp(v,0,Math.max(ck,runTop))}
function sv(){try{localStorage.setItem('deep-sea-peek-save',JSON.stringify({m:maxLvl,r:runTop,c:ck,l:lives,n:noDrop,h:healTen,d:lvDeaths,s:seen}))}catch(e){}}
function mark(id){if(!seen[id]){seen[id]=1;sv()}}
function applyLevel(){
 R=()=>Math.random();rB=BASE_RATE;rW=WIND_RATE;seedCode='';
 if(!L){campNext=practice?999:CAMP_EVERY;if(practice)gapT=2;return}
 const sEl=hasLv?$('peek-seed'):null,dEl=hasLv?$('peek-daily'):null,sIn=sEl?String(sEl.value||'').trim():'';
 if(L.fixed)seed=L.l*7919+101;
 else if(sIn)seed=parseInt(sIn,36)||1;
 else if(daily){const d=new Date();seed=(d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())*131+L.l}
 else seed=(Math.random()*1e9)|0;
 R=mulberry(seed);seedCode=seed.toString(36).toUpperCase();
 rB=L.rate;rW=L.rate*2;gapT=L.kind==='learn'?FIRST_GAP:6;
 campNext=L.k===5?50:999;
 guarantee=noDrop>=3;dropT=L.kind==='safe'?rnd(3,5):rnd(5,8);
 nibT=R()<.02?rnd(8,25):0;
 assistHid=L.ease?1:0;
 say('第 '+lvl+' 關・'+WORLD_NAME[L.wi]+'：'+KIND_NAME[L.kind]+(L.fixed?'（固定種子）':'')+'。'+WORLD_RULE[L.wi]+(L.ease?'小螢多給你 0.3 秒預警，少來一次襲擊。':''))}
function reset(){eyeSeen=0;run=0;ph=0;prog=0;tilt=0;gapT=FIRST_GAP;ev=null;survived=0;lastType='';directorUsed=false;score=0;why='';rec=false;flash=0;shake=0;fxs=[];lampOut=0;bag={charm:0,torch:0};drops=[];dropT=rnd(5,8);camp=null;campNext=CAMP_EVERY;openFx=null;pickHeld=0;shake1=0;sc=0;rB=BASE_RATE;rW=WIND_RATE;scared=false;dropped=false;nibT=0;lostAll=false}
reset();
/* ---- audio: stereo cues, so headphones help; silent if the browser has no Web Audio ---- */
let ac=null;
function audioInit(){if(ac){try{ac.resume()}catch(e){}return}try{const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}catch(e){ac=null}}
function tone(f,d,vol,pan,type,slide,amb){
 if(!ac)return;
 try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(slide,t+d);
  gn.gain.setValueAtTime((vol||.05)*(amb?AMB:MASTER*(L&&L.wi===2?.7:1))*1.4,t);gn.gain.linearRampToValueAtTime(.0001,t+d);o.connect(gn);
  if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan||0;gn.connect(p);p.connect(ac.destination)}else gn.connect(ac.destination);
  o.start(t);o.stop(t+d+.02)}catch(e){}}
function say(text,kind){$('peek-msg').textContent=text;$('peek-msg').className='msg'+(kind?' '+kind:'')}
peekSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('peek-prog',Math.floor(prog)+'%');setText('peek-spirits',survived+' 次襲擊');setText('peek-best',best+'%');setText('peek-codex',Object.keys(CAUSES).filter(k=>deaths[k]>0).length+' / '+Object.keys(CAUSES).length);setText('peek-dodges',dodgesTotal+' 次');
 setText('peek-lvl',L?lvl+' / 100':'自由跑');setText('peek-lives',L?String(lives):'—');
 const lv=wantLevel();
 $('peek-amount').disabled=peekBusy;$('peek-go').disabled=live;setText('peek-go',live?'逃跑中 · 別回頭':(st==='ready'?'免費開始':'免費再開')+(lv?'第 '+lv+' 關':'自由跑'));
}
function fx(s,x,y,col){fxs.push({s,x,y,col,t:0})}
function end(kind,reason){
 if(st!=='run')return;
 if(kind==='dead'&&bag.charm>0){bag.charm--;fx('護身符碎了，擋下一次！',CX,150,'#7fe8ff');ev=null;gapT=Math.max(nextGap(),4);flash=lowScare?.1:.3;return}
 deathEv=ev?{type:ev.type,side:ev.side,boss:!!ev.boss}:null;
 st=kind==='won'?'won':'over';why=reason||'';lostAll=false;
 const p=Math.floor(prog);rec=!L&&!practice&&p>best;
 if(rec){best=p;try{localStorage.setItem('deep-sea-peek-best',best)}catch(e){}}
 if(kind==='dead'){
  flash=lowScare?.15:.5;shake=lowScare?0:.5;
  if(!practice&&!daily){deaths[reason]=(deaths[reason]||0)+1;try{localStorage.setItem('deep-sea-peek-deaths',JSON.stringify(deaths))}catch(e){}mark('flick');
   if(L){lvDeaths[lvl]=(lvDeaths[lvl]||0)+1;lives--;if(lives<=0){lostAll=true;lives=3;lvDeaths={};runTop=ck}sv();if(lostAll&&hasLv)lvUI.value=ck}}}
 if(kind==='won'&&L&&!practice&&!daily){
  if(L.kind==='boss')lives=Math.min(5,lives+1)
  maxLvl=Math.min(100,Math.max(maxLvl,lvl+1));runTop=Math.max(runTop,Math.min(100,lvl+1));noDrop=dropped?0:noDrop+1;delete lvDeaths[lvl];sv();if(hasLv)lvUI.value=Math.min(100,lvl+1)}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:score,step:survived,stage:p,level:lvl,seed:seedCode,retry_assist:assistHid});peekBusy=false;save();renderAll();
 if(kind==='won')say((L?'第 '+lvl+' 關通關。':'衝出出口，盒子打開了。別看裡面。')+(earned>0?'本局共入帳 '+fmt(earned)+' 點。':''),'win');
 else if(!earned)say(CAUSES[reason]+'。'+(L?(lostAll?'生命用完，整輪重來，回到第 1 關。':'剩下 '+lives+' 條命。'):'這一局沒有額外成就獎勵。'),'lose');
 else say(CAUSES[reason]+'。本局共入帳 '+fmt(earned)+' 點。','win');
 ui();
}
function pay(n,text){
 if(practice||daily||(L&&lvl<maxLvl)){say(text+'。','win');return}   // practice and replays of cleared levels pay nothing
 earned+=n;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:Math.floor(prog),step:survived,score:score,bonus_points:n});
 say(text+' +'+n+' 點已入帳。','win')}
function pickPool(){
 const open=['eye'];if(survived>=UNLOCK_TWINS)open.push('twins');if(survived>=UNLOCK_WALKER)open.push('walker');
 const pool=open.filter(t=>t!==lastType);return pool.length?pool:open}
function startEvent(){
 if(L&&L.left<=0&&!L.forceFake){gapT=99;return}
 let type;
 if(practice)type=practice;
 else if(L&&L.plan&&L.plan.length)type=L.plan.shift();
 else if(L){const p=L.pool.filter(t=>t!==lastType);type=wpick(p.length?p:L.pool)}
 else{const pool=pickPool();type=pool[(R()*pool.length)|0]}
 const boss=type==='hollow';if(boss)type='walker';
 let fake=false;if(L&&L.forceFake){fake=true;L.forceFake=false}else if(L&&!boss&&L.fakeP&&R()<L.fakeP)fake=true;
 const eyeBase=eyeSeen<EASY_EYES&&(!L||L.kind==='learn')?EYE_EASY_WARN:EYE.warn;
 const base=type==='eye'?eyeBase:type==='twins'?TWIN.warn:type==='gale'?GALE.warn:WALK.warn;
 let warn=base;if(L&&!boss)warn=Math.max(WARN_FLOOR[type],base*L.wmul)+(L.kind==='learn'?.6:0)+(assistHid?.3:0);
 if(type==='eye')eyeSeen++;
 ev={type,side:R()<.5?-1:1,phase:'warn',t:warn,warn,el:0,bad:0,ok:false,snd:0,fake,boss};
 if(L&&!fake)L.left--;
 lastType=type;mark(boss?'hollow':type==='eye'?'leafling':type==='twins'?'knocker':type==='walker'?'hush':'gale');
 if(bag.torch>0&&!fake){bag.torch--;ev.warn+=.6;ev.t+=.6;ev.torch=true}}   // a torch buys 0.6s of extra warning and lights the side it comes from
function nextGap(){
 if(L)return Math.max(2.5,L.gap+rnd(-1,1));
 let g=GAP_NEAR+(GAP_FAR-GAP_NEAR)*clamp(prog/80,0,1)+rnd(-1,1);
 if(survived>0&&survived%BREATH_EVERY===0)g+=BREATH_EXTRA;
 return Math.max(3,g)}
function survive(){
 survived++;if(!practice){dodgesTotal++;try{localStorage.setItem('deep-sea-peek-dodges',dodgesTotal)}catch(e){}}
 score+=100;lastType=ev.type;ev=null;gapT=nextGap();fx('躲過了！',CX,170,'#ffd98a');
 if(L&&L.chainP&&L.left>0&&R()<L.chainP)gapT=1.4;   // chained attack: the next one follows right away (never under 1.2s)

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
 if(gyro.on)tilt=aim;else tilt+=clamp(aim-tilt,-TILT_SPEED*dt*(L&&L.wi===3?.7:1),TILT_SPEED*dt*(L&&L.wi===3?.7:1));
 const pk=(keys.pick||btn[4]||shake1)&&!pickHeld;pickHeld=!!(keys.pick||btn[4]);shake1=0;
 if(camp){updateCamp(dt);ph+=dt*2;return}
 chirpT-=dt;if(chirpT<=0){chirpT=rnd(.3,.8);if(!(ev&&ev.type==='walker')&&!covered)tone(3000+Math.random()*700,.04,.012,rnd(-.8,.8),'sine',0,true)}   // crickets: they go quiet before Hush
 if(!covered){prog=Math.min(L&&(L.left>0||ev)?97:100,prog+(sprint?rW:rB)*dt);run+=dt*(sprint?2.6:1.5)}
 ph+=dt*(covered?2.5:sprint?15:9);
 if(prog>=100){score+=500;pay(WIN_REWARD,'盒子打開了！');end('won');return}
 while(campNext<100&&prog>=campNext+CAMP_WIN)campNext+=CAMP_EVERY;
 if(!ev&&prog>=campNext&&campNext<100){startCamp();return}
 updateDrops(dt,covered,sprint,pk);
 if(!L&&!directorUsed&&prog>=DIRECTOR_AT){directorUsed=true;if(!ev&&R()<DIRECTOR_P)gapT=Math.min(gapT,rnd(1,3))}
 if(!ev&&L&&L.kind==='safe'&&!scared&&prog>=45&&L.pool.length){scared=true;L.forceFake=true;gapT=0}   // buffer levels only get harmless scares
 if(!ev){gapT-=dt*(sprint?SPRINT_GAP:1);if(gapT<=0)startEvent();return}
 ev.t-=dt;ev.el=(ev.el||0)+dt;
 if(ev.fake&&ev.t<=0){ev=null;gapT=nextGap();fx('虛驚一場',CX,170,'#cfd8e6');return}   // a false cue: it fades without an attack
 const away=tilt*-ev.side;   // positive when leaning away from the spirit's side
 if(ev.type==='eye'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(90+Math.random()*30,.12,.05,ev.side*.7,'sawtooth')}if(ev.t<=0){ev.phase='judge';ev.t=EYE.judge;tone(520,.3,.07,ev.side*.7,'square',380)}}
  else{if(away<EYE.away)ev.bad+=dt;if(ev.bad>EYE.grace){end('dead','eye');return}if(ev.t<=0)survive()}}
 else if(ev.type==='twins'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.38;tone(150+Math.random()*25,.07,.1,ev.side,'square',90)}if(ev.t<=0){ev.phase='judge';ev.t=TWIN.judge}}
  else{if(tilt*ev.side>TWIN.toward){end('dead','twins');return}if(away>=TWIN.away)ev.ok=true;if(ev.t<=0){if(ev.ok)survive();else{end('dead','twins');return}}}}
 else if(ev.type==='gale'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(260,.35,.06,ev.side*.8,'sawtooth',120)}if(ev.t<=0){ev.phase='judge';ev.t=GALE.judge;tone(110,.5,.09,ev.side,'square',70)}}
  else{if(tilt*ev.side<GALE.toward)ev.bad+=dt;if(ev.bad>GALE.grace){end('dead','gale');return}if(ev.t<=0)survive()}}
 else{
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.6;tone(70,.08,.02+.1*(1-ev.t/WALK.warn),0,'sine')}
   if(ev.t<=0){if(!covered){end('dead',ev.boss?'hollowLate':'walkerLate');return}ev.phase='judge';ev.t=WALK.judge*(ev.boss?1.6:1)}}
  else{if(!covered||Math.abs(tilt)>WALK.still){end('dead',ev.boss?'hollowMove':'walkerMove');return}if(ev.t<=0)survive()}}
}
/* ---- drawing ---- */
function lampLevel(){
 if(!ev||ev.type!=='walker')return 1;
 if(ev.phase==='judge')return 0;
 const r=ev.t;if(r<1.5){return Math.floor((1.5-r)*4)%2?.15:1}   // flickers three times just before it goes out
 return 1}
/* ---- items, campfire, options (landscape 800x450, first person) ---- */
const stageEl=c.parentNode||{};
const isRot=()=>!!(stageEl.classList&&stageEl.classList.contains('peek-rot'));
const cxy=e=>{const r=c.getBoundingClientRect();
 if(isRot())return[(e.clientY-r.top)*W/(r.height||W),(r.left+r.width-e.clientX)*H/(r.width||H)];   // stage turned 90deg for portrait phones
 return[(e.clientX-r.left)*W/(r.width||W),(e.clientY-r.top)*H/(r.height||H)]};
function giveItem(k){
 if(k==='torch'){bag.torch=Math.min(3,bag.torch+1);fx('火把 +1',CX,150,'#ffb347')}
 else if(k==='charm'){bag.charm=Math.min(2,bag.charm+1);fx('護身符 +1',CX,150,'#7fe8ff')}
 else{scrolls++;try{localStorage.setItem('deep-sea-peek-scrolls',scrolls)}catch(e){}fx(k==='nib'?'Nib 塞給你一卷軸':'撿到舊卷軸',CX,150,'#e8c675')}
 mark(k==='nib'?'nib':k)}
function spawnDrop(kind){const r=R();dropped=true;drops.push({k:kind||(r<.4?'torch':r<.7?'charm':'scroll'),side:R()<.5?-1:1,z:1});mark('rook'===kind?'rook':'flick')}
function collect(d){d.z=-1;giveItem(d.k);say('撿到'+ITEM_NAME[d.k]+'：'+ITEM_DESC[d.k]+'。','win')}
function updateDrops(dt,covered,sprint,pk){
 if(!covered){
  if(!ev){dropT-=dt;if(dropT<=0){if(drops.length<2)spawnDrop();dropT=rnd(DROP_EVERY[0],DROP_EVERY[1])}}
  if(guarantee&&!dropped&&prog>=8&&!ev&&drops.length<2)spawnDrop(noDrop>=6?'charm':R()<.5?'torch':'scroll');   // pity: three levels without a drop guarantees one
  if(nibT>0){nibT-=dt;if(nibT<=0){drops.push({k:'nib',side:R()<.5?-1:1,z:1});mark('nib')}}
  const sp=(sprint?.2:.11)*dt;drops.forEach(d=>d.z-=sp)}
 if(pk){let b=null;drops.forEach(d=>{if(d.z>=0&&d.z<PICK_AT&&(!b||d.z<b.z))b=d});if(b)collect(b)}
 drops=drops.filter(d=>d.z>-.05&&d.z>=0)}
const canPick=()=>drops.some(d=>d.z>=0&&d.z<PICK_AT);
function startCamp(){camp={state:'pick',t:0,choice:-1,rest:0};ev=null;clearInput();mark('rook');if(scrolls>=3)mark('lantern');say('營火到了。選一樣帶走。')}
function updateCamp(dt){
 camp.t+=dt;
 if(camp.state==='pick'){
  if(camp.choice<0&&camp.t>CAMP_PICK_MAX)camp.choice=1;
  if(camp.choice>=0){giveItem(CAMP_CARDS[camp.choice]);camp.state='rest';camp.rest=CAMP_REST;camp.t=0}}
 else{camp.rest-=dt;if(camp.rest<=0){if(L&&!practice&&!daily&&lives<3&&healTen!==((lvl-1)/10|0)){lives++;healTen=((lvl-1)/10|0);sv();fx('生命 +1',CX,150,'#7fe8ff')}camp=null;campNext=L?999:campNext+CAMP_EVERY;gapT=Math.max(gapT,4)}}}
function campTap(e){
 if(!camp||camp.state!=='pick')return;
 const p=cxy(e);CARDS_X.forEach((x,i)=>{if(p[0]>=x&&p[0]<=x+CARD_W&&p[1]>=CARD_Y&&p[1]<=CARD_Y+CARD_H)camp.choice=i})}
function onMotion(e){
 const a=e.accelerationIncludingGravity;if(!a)return;
 const m=Math.sqrt((a.x||0)*(a.x||0)+(a.y||0)*(a.y||0)+(a.z||0)*(a.z||0)),now=performance.now();
 if(m>24&&now-lastShake>600){lastShake=now;shake1=1}}
const optSave=()=>{try{localStorage.setItem('deep-sea-peek-opts',JSON.stringify({a:assist,l:lowScare,v:MASTER,c:captions,m:AMB}))}catch(e){}};
{const a=$('peek-assist'),l=$('peek-lowscare'),v=$('peek-vol');
 if(a&&a.addEventListener){a.checked=assist;a.addEventListener('change',()=>{assist=!!a.checked;optSave()})}
 if(l&&l.addEventListener){l.checked=lowScare;l.addEventListener('change',()=>{lowScare=!!l.checked;optSave()})}
 {const cp=$('peek-caps'),am=$('peek-vol-amb'),dx=$('peek-dex'),sh=$('peek-share');
  if(cp&&cp.addEventListener){cp.checked=captions;cp.addEventListener('change',()=>{captions=!!cp.checked;optSave()})}
  if(am&&am.addEventListener){am.value=Math.round(AMB*100);am.addEventListener('input',()=>{AMB=clamp((+am.value||0)/100,0,1);optSave()})}
  if(dx&&dx.addEventListener)dx.addEventListener('click',()=>{if(st==='run'){say('逃跑中不能翻圖鑑。');return}dex=true});
  if(sh&&sh.addEventListener)sh.addEventListener('click',()=>{if(st==='ready'||st==='run'){say('先玩一局再分享結果。');return}share()})}
 if(v&&v.addEventListener){v.value=Math.round(MASTER*100);v.addEventListener('input',()=>{MASTER=clamp((+v.value||0)/100,0,1);optSave()})}}
/* ---- scene: painted background per world, parallax by lean, first-person bob ---- */
function drawWorld(lamp){
 const wi=L?L.wi:clamp(Math.floor(prog/20),0,4),nx=Math.min(4,wi+1),into=L?0:(prog%20)/20,a=art('bg-'+WORLDS[wi]);
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
 else if(ev.type==='gale'){        // Gale: leaves turn against the wind, then something drags in from that side
  const sw=art('env-leaf-swirl'),im=art('ghost-gale');
  if(sw){g.save();g.translate(sx,300);g.rotate(-tt*1.6*ev.side);floatImg(sw,0,0,200,judge?.5:Math.min(1,open*1.3));g.restore()}
  if(im)sprite(im,sx+ev.side*(judge?0:40*(1-open)),by,330,judge?.95:Math.pow(open,1.5)*.6);else blob(sx,by-60,40,open*.7,'#7f9a8a')}
 else{                           // Hush: the crickets stop, the lamp flickers, fog rolls in and something walks toward you
  const lp=art('env-lamp'),fg=art('env-fog'),im=art(ev.boss?'ghost-hollow':'ghost-wraith'),p=judge?1:clamp(1-ev.t/WALK.warn,0,1),lampA=ev.t<1.5||judge?.45+.55*lampLevel():1;
  if(lp)sprite(lp,sx,by,330,lampA);
  if(fg){g.save();g.globalAlpha=.15+.55*p;g.drawImage(fg,-40,H-250,W+80,250);g.restore()}
  if(im)sprite(im,CX,by-8,(ev.boss?110:90)+(ev.boss?360:300)*p,clamp(.2+p*1.1,0,1));else blob(CX,by-60,20+60*p,.3+p*.6,'#08060a')}}
function drawDrops(){
 drops.forEach(d=>{
  const s=1-d.z,x=CX+d.side*(90+(SIDE+30-90)*s),y=300+95*s+Math.sin(tt*3+d.side)*3,sz=44+70*s,im=d.k==='nib'?null:art(d.k==='scroll'?'item-chest':'item-'+d.k),near=d.z<PICK_AT;
  g.save();if(near){g.shadowColor='#ffd98a';g.shadowBlur=18}
  if(d.k==='nib'){g.fillStyle='#6b4a32';g.beginPath();g.ellipse(x,y,sz*.3,sz*.22,0,0,7);g.fill();g.fillStyle='#e8d8b8';g.beginPath();g.arc(x-sz*.1,y-sz*.05,3,0,7);g.arc(x+sz*.1,y-sz*.05,3,0,7);g.fill()}
  else if(im)floatImg(im,x,y,sz,1);else{g.fillStyle=d.k==='torch'?'#ffb347':d.k==='charm'?'#7fe8ff':'#e8c675';g.beginPath();g.arc(x,y,sz*.3,0,7);g.fill()}
  g.restore();
  if(near)tx('按「撿」',x,y-sz/2-6,15,'#ffd98a')})}
function drawCamp(){
 g.fillStyle='rgba(6,6,10,.55)';g.fillRect(0,0,W,H);
 const cf=art('env-campfire'),rk=art('npc-rook');
 if(cf)sprite(cf,CX,H-40,150,1);
 if(rk)sprite(rk,CX-300,H-30,250,1);
 if(scrolls>=3){const lt=art('prop-skull-lantern');if(lt)sprite(lt,CX+150,H-36,90,1)}
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
 txd('建議開啟聲音遊玩；戴耳機能更容易聽出森林裡的方向與細節。按喇叭試聽左右各一聲，再按勾勾。',CX,HP.y+h*.50,16,'#3a2812',HP.w*.58,4);
 for(const k of ['spk','ok']){const r=hpRect(k);if(!im){RR(r[0],r[1],r[2],r[3],8,'#5a4228',2);tx(k==='spk'?'聲音':'確認',r[0]+r[2]/2,r[1]+r[3]*.7,16,'#f1d9a6')}}}
const CAPS={eye:['（左邊的落葉沙沙作響）','（右邊的落葉沙沙作響）'],twins:['（左邊傳來敲擊聲）','（右邊傳來敲擊聲）'],walker:['（蟲鳴停了……腳步聲逼近）','（蟲鳴停了……腳步聲逼近）'],gale:['（風向反了，拖行聲從左邊靠近）','（風向反了，拖行聲從右邊靠近）']};
const capText=d=>(CAPS[d.type]||['',''])[d.side<0?0:1];
function hud(I,lamp){
 const bn=art('ui-banner'),bw=420,bh=82,title=(L?'第 '+lvl+' 關　':practice?'練習　':'自由跑　')+Math.floor(prog)+'%';
 if(bn){g.drawImage(bn,10,8,bw,bh);
  const x0=10+bw*.2,wd=bw*.73;RR(x0,8+bh*.32,wd,bh*.34,6,'rgba(60,40,20,.35)');if(prog>0)RR(x0,8+bh*.32,Math.max(12,wd*prog/100),bh*.34,6,prog>=85?'#c4472f':'#b98a2c');
  tx(title,x0+wd/2,8+bh*.6,17,'#f6e7c0')}
 else{RR(16,14,W-32,14,7,'rgba(255,255,255,.12)');if(prog>0)RR(16,14,Math.max(16,(W-32)*prog/100),14,7,prog>=85?'#ff6a4d':'#e8c675');tx(title,16,50,15,'#f1d9a6','left')}
 const lv=art('ui-lives');
 if(lv){const lw=300,k=lw/578,sy=112,sh=190,lx=W-lw-10,ly=14;g.drawImage(lv,0,sy,578,sh,lx,ly,lw,sh*k);
  const oy=ly+(.49*432-sy)*k+4,fr=[.42,.61,.805];
  if(L){fr.forEach((f,i)=>{if(lives<=i){g.fillStyle='rgba(10,12,16,.78)';g.beginPath();g.arc(lx+lw*f,oy-4,19,0,7);g.fill()}});
   tx('生命'+(lives>3?' +'+(lives-3):''),lx+lw*.61,ly+sh*k+12,12,'#f1d9a6')}
  else{const vals=[bag.torch,bag.charm,scrolls];fr.forEach((f,i)=>tx(String(vals[i]),lx+lw*f,oy,16,vals[i]?'#fff':'#789'));
   tx('火把',lx+lw*.42,ly+sh*k+12,12,'#f1d9a6');tx('護身符',lx+lw*.61,ly+sh*k+12,12,'#f1d9a6');tx('卷軸',lx+lw*.805,ly+sh*k+12,12,'#f1d9a6')}}
 else tx(L?'生命 '+lives:'火把'+bag.torch+' 護身符'+bag.charm+' 卷軸'+scrolls,W-16,50,15,'#f1d9a6','right');
 if(L)tx('火把 '+bag.torch+'　護身符 '+bag.charm+'　卷軸 '+scrolls,16,108,13,'#f1d9a6','left');
 let hint='';
 if(ev&&ev.type==='eye')hint=ev.phase==='warn'?'腳邊的落葉在聚集……放開「衝刺」！':'往落葉的反方向靠！躲開紅光！';
 else if(ev&&ev.type==='twins')hint=ev.phase==='warn'?'鳥群飛走了，有東西在敲樹枝……別往敲擊那邊靠':'往敲擊的反方向靠！';
 else if(ev&&ev.type==='gale')hint=ev.phase==='warn'?'風向反了，葉子逆風翻動……放開「衝刺」！':'迎著風來的方向靠，頂住！';
 else if(ev&&ev.type==='walker')hint=ev.phase==='warn'?(ev.boss?'空殼來了。燈一滅就蓋住螢幕！':'蟲鳴停了，路燈在閃。燈滅前蓋住螢幕！'):'蓋住不要動，等腳步聲遠去……';
 else if(canPick())hint='路邊有東西！靠近時按「撿」（F／搖手機）';
 else if(L&&L.l===1&&prog<30)hint='小螢：這是森林。先聽聽蟲鳴，這就是「平常」的聲音。';
 else if(L&&L.l===1&&prog<65)hint='小螢：路邊發亮的東西，靠近時按「撿」。';
 else if(L&&L.l===1)hint='小螢：林子越來越深了……下一關開始，會有東西靠近。';
 else if(L&&L.kind==='safe'&&L.l!==1)hint='安全緩衝：這一關沒有致命的鬼，放心撿東西、聽聲音。';
 else if(prog<25&&!I.wind)hint='自動奔跑中！按住「衝刺」跑更快（衝刺時不能靠邊）';
 if(hint)tx(hint,CX,150,17,'#ffd98a');
 if(captions&&ev&&!ev.fake)tx(capText(ev),CX,176,16,'#cfe8ff');
 if(ev&&(assist||ev.torch)){   // assist mode / torch: mark the dangerous side and the safe side
  const dg=ev.type==='walker'?0:ev.type==='gale'?-ev.side:ev.side,col=ev.torch?'#ffb347':'#ffd98a';
  if(dg){const dx=CX+dg*340;g.save();g.fillStyle='#ff5a4d';g.globalAlpha=.8;g.beginPath();g.moveTo(dx+dg*22,170);g.lineTo(dx-dg*10,150);g.lineTo(dx-dg*10,190);g.closePath();g.fill();g.restore();tx('危險',dx,215,14,'#ff9a8a');
   const sxm=CX-dg*340;g.save();g.fillStyle=col;g.globalAlpha=.8;g.beginPath();g.moveTo(sxm-dg*22,170);g.lineTo(sxm+dg*10,150);g.lineTo(sxm+dg*10,190);g.closePath();g.fill();g.restore();tx('往這邊靠',sxm,215,14,col);
   if(assist){const sp=art('env-stump');if(sp)sprite(sp,sxm+(-dg)*10,300,110,.55)}}
  else tx('蓋住螢幕',CX,160,18,col)}
 if(assist){const cp=art('ui-compass');if(cp)floatImg(cp,CX,300,70,.85)}
 if(L&&seedCode)tx('種子 '+seedCode,W-10,H-6,11,'rgba(241,217,166,.6)','right')}
/* ---- end-of-round buttons (retry / listen again / codex / later) ---- */
let endBtns=[];
function btnRow(items){
 endBtns=[];const w=148,gap=8,n=items.length,x0=CX-(n*w+(n-1)*gap)/2,y=H-62;
 items.forEach((it,i)=>{const x=x0+i*(w+gap);endBtns.push([x,y,w,40,it[1]]);RR(x,y,w,40,10,'#5a4228',3);tx(it[0],x+w/2,y+27,16,'#f1d9a6')})}
function deathClick(e){
 const p=cxy(e);
 for(const b of endBtns)if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3]){doAct(b[4]);return true}
 return false}
function doAct(a){
 if(a==='retry'||a==='next')start();
 else if(a==='listen')playCue(deathEv);
 else if(a==='dex'){dex=true;dexSel=0}
 else if(a==='later'){st='ready';reset();endBtns=[];say('慢慢來。選好關卡再按「免費開始」。')}
 else if(a==='assist'){assist=true;optSave();const el=$('peek-assist');if(el)el.checked=true;say('已開啟輔助標記。','win')}
 else if(a==='share')share()}
const later=(f,ms)=>{try{setTimeout(f,ms)}catch(e){f()}};
function playCue(d){
 if(!d)return;audioInit();const s=d.side||1;
 const seq=d.type==='eye'?[[0,100,.12,.05,s*.7,'sawtooth'],[.5,100,.12,.05,s*.7,'sawtooth'],[1,100,.12,.05,s*.7,'sawtooth'],[1.5,520,.3,.07,s*.7,'square',380]]
  :d.type==='twins'?[[0,150,.07,.1,s,'square',90],[.38,150,.07,.1,s,'square',90],[.76,150,.07,.1,s,'square',90]]
  :d.type==='gale'?[[0,260,.35,.06,s*.8,'sawtooth',120],[.5,260,.35,.06,s*.8,'sawtooth',120],[1,260,.35,.06,s*.8,'sawtooth',120],[1.6,110,.5,.09,s,'square',70]]
  :[[0,70,.08,.1,0,'sine'],[.6,70,.08,.1,0,'sine'],[1.2,70,.08,.1,0,'sine']];
 seq.forEach(q=>later(()=>tone(q[1],q[2],q[3],q[4],q[5],q[6]),q[0]*1000));
 say('再聽一次：'+capText(d)+(d.type==='eye'?'　然後紅光射出。':d.type==='twins'?'　之後要往反方向靠。':d.type==='gale'?'　要迎著風靠。':'　然後燈滅。'))}
const shareText=()=>'《別看 Don\'t Peek》'+(L?'第 '+lvl+' 關':'自由跑')+(seedCode?'・種子 '+seedCode:'')+'：躲過 '+survived+' 次襲擊，'+(st==='won'?'衝出去了！':(CAUSES[why]||'').replace(/^死因 #\d+ /,'')+'。');
function share(){
 const t=shareText();
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);say('已複製分享文字：'+t,'win')}else say(t,'win')}catch(e){say(t,'win')}
 try{shareCard(t)}catch(e){}}
function shareCard(t){
 const cv=document.createElement('canvas');cv.width=1200;cv.height=630;const x=cv.getContext('2d'),bg=art('bg-'+WORLDS[L?L.wi:0]),gh=art(KILLER[why]||'ghost-wraith');
 x.fillStyle='#0b0f12';x.fillRect(0,0,1200,630);
 if(bg){const h=630,w=bg.naturalWidth*h/bg.naturalHeight;x.drawImage(bg,600-w/2,0,w,h)}
 x.fillStyle='rgba(8,10,14,.62)';x.fillRect(0,0,1200,630);
 if(gh&&st!=='won'){const h=420,w=gh.naturalWidth*h/gh.naturalHeight;x.globalAlpha=.85;x.drawImage(gh,880-w/2,150,w,h);x.globalAlpha=1}
 x.textAlign='left';x.fillStyle='#e8c675';x.font='800 64px "Noto Sans TC",system-ui,sans-serif';x.fillText('別看 Don\'t Peek',60,110);
 x.fillStyle='#f1d9a6';x.font='700 34px "Noto Sans TC",system-ui,sans-serif';
 wrapLines(t.replace(/^《[^》]*》/,''),34,720).forEach((ln,i)=>x.fillText(ln,60,200+i*48));
 x.fillStyle='rgba(241,217,166,.7)';x.font='600 24px "Noto Sans TC",system-ui,sans-serif';x.fillText('yachun0728.github.io 的深海遊戲廳',60,590);
 cv.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='dont-peek-'+(seedCode||'free')+'.png';a.click()})}
const KILLER={eye:'ghost-leafling',twins:'ghost-thorn',walkerLate:'ghost-wraith',walkerMove:'ghost-wraith',gale:'ghost-gale',hollowLate:'ghost-hollow',hollowMove:'ghost-hollow'};
const RULE_FULL={eye:'落葉堆在哪一邊，那邊就有東西。紅光亮起時，往反方向靠並撐滿 3 秒。',twins:'鳥群飛走後，敲擊聲從一邊傳來。往敲擊的反方向靠；往敲擊那邊靠一定會死。',walkerLate:'蟲鳴停了、燈閃三下就會熄滅。燈滅前一定要蓋住螢幕。',walkerMove:'蓋住螢幕之後別動，等腳步聲遠去才放開。',gale:'風向反了，拖行聲從一邊靠近。迎著風來的方向靠，頂住 2 秒。',hollowLate:'首領空殼的規則和靜林鬼一樣，但更久。燈滅前蓋住螢幕。',hollowMove:'空殼停留得很久。蓋住螢幕，保持不動，直到牠離開。'};
function drawDeath(){
 g.fillStyle='rgba(18,13,10,.8)';g.fillRect(0,0,W,H);
 const bn=art('ui-banner'),cd=art('ui-card'),n=deaths[why]||1;
 if(bn)g.drawImage(bn,CX-210,8,420,82);else RR(CX-210,8,420,82,10,'#3a2c1c',3);
 txp((lostAll?'生命用完　':'你死了　')+(L?'第 '+lvl+' 關':'停在 '+Math.floor(prog)+'%'),CX+25,58,24,'#3a2812');
 const xs=[CX-300,CX+130],kw=170,kh=198,ky=100;
 for(let i=0;i<2;i++){
  const x=xs[i];if(cd)g.drawImage(cd,x,ky,kw,kh);else RR(x,ky,kw,kh,10,'#3a2c1c',3);
  const im=art(i?'guide-flick':KILLER[why]||'ghost-wraith');if(im)floatImg(im,x+kw*.49,ky+kh*.34,kw*.38,1);
  const body=i?TIPS[why]||'':(CAUSES[why]||'').replace(/^死因 #\d+ /,'');
  txd(body,x+kw/2,ky+kh*.6,11,'#2a1a0c',kw*.6,5)}
 tx('剩餘生命 '+(L?lives:'—'),CX,ky+34,20,'#ffd98a');
 tx('躲過 '+survived+' 次襲擊',CX,ky+66,16,'#f1d9a6');
 if(lostAll)txd('整輪重來：回到第 1 關',CX,ky+96,15,'#ffb347',200,2);
 else if(L&&L.ease)txd('小螢多給你 0.3 秒預警，少來一次襲擊。',CX,ky+96,13,'#cfe8ff',200,3);
 txd(n<=1?RULE_FULL[why]||'':FLICK_TIPS[['eye','twins','walkerLate','walkerMove','gale','hollowLate','hollowMove'].indexOf(why)]||'',CX,ky+130,13,'#cfe8ff',210,5);
 if(rec)tx('新紀錄！',CX,ky+190,16,'#ffd98a');
 if(n>=3)tx('多次失敗：可以開輔助標記，或到圖鑑聽一次、練習。',CX,ky+kh+20,14,'#ffd98a');
 const row=[['立刻重試','retry'],['再聽一次','listen'],['看鬼圖鑑','dex'],['稍後再學','later']];if(n>=3&&!assist)row.splice(3,0,['開輔助標記','assist']);
 btnRow(row)}
function drawWon(){
 g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);
 tx('衝出去了',CX,110,48,'#ffd98a');tx('別看裡面。',CX,168,28,'#ff6a4d');
 tx((L?'第 '+lvl+' 關通關　':'')+'躲過 '+survived+' 次襲擊',CX,218,20,'#f1d9a6');
 if(earned>0)tx('本局入帳 '+fmt(earned)+' 點',CX,252,20,'#ffd98a');
 if(L&&L.kind==='boss')tx('首領倒下：生命 +1（現在 '+lives+'）',CX,292,18,'#7fe8ff');
 else if(L)tx('下一關：第 '+Math.min(100,lvl+1)+' 關',CX,292,18,'#f1d9a6');
 if(L&&lvl>=100)tx('你走出了整座森林。',CX,330,22,'#ffd98a');
 btnRow([[L&&lvl<100?'下一關':'再玩一次','next'],['分享結果卡','share'],['看鬼圖鑑','dex']])}
/* ---- ghost codex (12 slots): what you have met, the rule, listen again, practice ---- */
const DEX=[
 {id:'leafling',img:'ghost-leafling',name:'葉下客 Leafling',type:'eye',clue:'腳邊的落葉聚成一堆，聲音很弱。',judge:'低頭看：落葉堆在哪一邊？',act:'往反方向靠，撐滿 3 秒。'},
 {id:'knocker',img:'ghost-thorn',name:'敲枝者 Knocker',type:'twins',clue:'鳥群飛走，接著有固定節奏的敲擊從一邊傳來。',judge:'敲擊來自哪一邊？',act:'往敲擊的反方向靠；往敲擊那邊靠會死。'},
 {id:'hush',img:'ghost-wraith',name:'靜林鬼 Hush',type:'walker',clue:'蟲鳴停了，路燈閃三下。',judge:'靜默不是安全。',act:'燈滅前蓋住螢幕，保持不動，等牠走遠。'},
 {id:'gale',img:'ghost-gale',name:'逆風客 Gale',type:'gale',clue:'風向反了，葉子逆風翻動，接著有拖行聲。',judge:'拖行聲從哪一邊靠近？',act:'迎著風來的方向靠，頂住 2 秒。'},
 {id:'hollow',img:'ghost-hollow',name:'空殼 Hollow（首領）',type:'hollow',clue:'每個世界的第 10 關，先依序面對學過的鬼，最後是牠。',judge:'牠和靜林鬼同一套規則，但停留更久。',act:'蓋住螢幕，保持不動，直到牠離開。'},
 {id:'flick',img:'guide-flick',name:'小螢 Flick',clue:'友方的螢火蟲，會在死亡後告訴你剛才漏掉了什麼。',judge:'牠不是鬼。',act:'多看牠的提示。'},
 {id:'rook',img:'npc-rook',name:'旅人 Rook',clue:'在營火旁出現。',judge:'牠不追你。',act:'營火邊三選一，帶走一樣東西。'},
 {id:'nib',img:'',name:'Nib',clue:'偶爾跑過路邊的無害小傢伙，出現率約五十分之一。',judge:'牠不會傷害你。',act:'靠近時按「撿」，牠會留點小禮物。'},
 {id:'torch',img:'item-torch',name:'火把 Torch',clue:'路邊或營火的道具。',judge:'',act:'下次襲擊多 0.6 秒預警並標出方向。'},
 {id:'charm',img:'item-charm',name:'護身符 Charm',clue:'路邊或營火的道具，掉落保底較低。',judge:'',act:'擋下一次致命失誤。'},
 {id:'scroll',img:'item-chest',name:'舊卷軸 Scroll',clue:'收藏品。',judge:'',act:'集滿 3 卷，營火旁會掛上骷髏燈籠。'},
 {id:'lantern',img:'prop-skull-lantern',name:'骷髏燈籠',clue:'收集 3 卷舊卷軸後出現在營火旁。',judge:'',act:'只是裝飾，讓營火更有氣氛。'}];
const DEXF={x:14,y:5,h:440},DK=DEXF.h/578,DCX=[95,175,256,337],DCY=[190,273,355];
const dexPos=i=>[DEXF.x+DCX[i%4]*DK,DEXF.y+DCY[(i/4)|0]*DK];
const DEXB=[[372,392,118,38,'聽一次'],[500,392,118,38,'練習'],[628,392,118,38,'關閉']];
function txl(s,x,y,sz,col,wd,maxL){g.font='700 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='left';g.fillStyle=col;const ls=wrapLines(s,sz,wd).slice(0,maxL||12);ls.forEach((ln,i)=>g.fillText(ln,x,y+i*(sz+5)));return y+ls.length*(sz+5)}
function drawDex(){
 g.fillStyle='#06060a';g.fillRect(0,0,W,H);
 const fr=art('ui-codex');if(fr)g.drawImage(fr,DEXF.x,DEXF.y,432*DK,DEXF.h);
 txp('鬼圖鑑　'+Object.keys(seen).filter(k=>DEX.some(d=>d.id===k)).length+' / 12',DEXF.x+216*DK,DEXF.y+105*DK,18,'#e8e0d0');
 txp('點圓圈看線索與解法',DEXF.x+220*DK,DEXF.y+462*DK,14,'#4a3a2a');
 DEX.forEach((d,i)=>{
  const p=dexPos(i),im=d.img?art(d.img):null,got=!!seen[d.id];
  if(i===dexSel){g.strokeStyle='#ffd98a';g.lineWidth=3;g.beginPath();g.arc(p[0],p[1],27*DK*1.2+2,0,7);g.stroke()}
  if(got){if(im)floatImg(im,p[0],p[1],46,1);else txp(d.id==='nib'?'🐾':'?',p[0],p[1]+6,20,'#e8e0d0')}
  else txp('？',p[0],p[1]+7,22,'#5a5a66')});
 RR(366,10,424,430,12,'rgba(34,26,20,.96)',3);
 const d=DEX[dexSel],got=!!seen[d.id];
 if(got){const im=d.img?art(d.img):null;if(im)floatImg(im,430,80,96,1);
  txl(d.name,490,50,22,'#ffd98a',290,2);
  const n=d.type?deathsOf(d.type):0;if(d.type)txl('被牠打倒 '+n+' 次',490,84,14,'#cfe8ff',290,1);
  let y=150;y=txl('線索：'+d.clue,384,y,15,'#f1d9a6',390,3)+6;if(d.judge)y=txl('判斷：'+d.judge,384,y,15,'#f1d9a6',390,2)+6;txl('應對：'+d.act,384,y,15,'#ffd98a',390,3)}
 else{txl('？？？',490,60,24,'#8a8a96',290,1);txl('還沒遇見。繼續往前走，遇到之後這裡會記下線索和解法。',384,150,15,'#c9c0b0',390,3)}
 DEXB.forEach((b,i)=>{const dis=(i<2&&!(got&&d.type));RR(b[0],b[1],b[2],b[3],10,dis?'rgba(90,66,40,.35)':'#5a4228',3);tx(b[4],b[0]+b[2]/2,b[1]+26,16,dis?'rgba(241,217,166,.4)':'#f1d9a6')})}
function dexClick(e){
 const p=cxy(e);
 for(let i=0;i<12;i++){const q=dexPos(i);if(Math.hypot(p[0]-q[0],p[1]-q[1])<28){dexSel=i;return}}
 DEXB.forEach((b,i)=>{if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3]){
  const d=DEX[dexSel],ok=seen[d.id]&&d.type;
  if(i===2)dex=false;
  else if(i===0&&ok)playCue({type:d.type==='hollow'?'walker':d.type,side:1});
  else if(i===1&&ok&&st!=='run'){dex=false;practiceStart(d.type==='hollow'?'walker':d.type)}}})}
function practiceStart(ty){nextPractice=ty;forceLvl=0;start();forceLvl=null}
function draw(){
 const I=inputs(),lamp=st==='run'?lampLevel():1,cov=st==='run'&&I.cover;
 const wi=L?L.wi:clamp(Math.floor(prog/20),0,4);
 const ox=(shake>0?(Math.random()-.5)*14:0)+(wi===4&&!lowScare?Math.sin(tt*5)*1.5:0);
 g.save();g.translate(ox,0);
 drawWorld(lamp);
 if(wi===1){const fg=art('env-fog');if(fg){g.save();g.globalAlpha=.3;g.drawImage(fg,-40,H-260,W+80,260);g.restore()}g.fillStyle='rgba(20,26,30,.22)';g.fillRect(0,0,W,H)}   // graveyard: fog narrows the view
 if(st==='run'){drawSpirits();drawDrops()}
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
  else{const lv=wantLevel(),lc=lv?levelCfg(lv,(lvDeaths[lv]||0)>=2):null;
   tx('別看',CX,86,56,'#e8c675');tx('Don\'t Peek　禁忌寶盒・夜逃',CX,124,20,'#f1d9a6');
   tx(lc?'第 '+lv+' 關・'+WORLD_NAME[lc.wi]+'・'+KIND_NAME[lc.kind]+'　生命 '+lives:'自由跑（沒有關卡和生命）',CX,168,22,'#ffd98a');
   tx('自動奔跑。落葉堆起來、敲樹枝：往反方向靠。風向反了：迎著風靠。',CX,214,17,'#f1d9a6');tx('蟲鳴停了、燈在閃：蓋住螢幕不要動。路邊的東西靠近時按「撿」。',CX,244,17,'#f1d9a6');
   tx('電腦：A／D 靠邊　空白鍵蓋住　W 衝刺　F 撿　手機：按鈕或「啟用體感」',CX,290,15,'#f1d9a6');tx('到右邊操作區選關卡，按「免費開始」',CX,360,21,'#ffd98a')}}
 else if(st==='won')drawWon();
 else if(st==='over')drawDeath();
 if(dex)drawDex()}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 audioInit();audioOk=true;
 analytics=AN.start('peek',amount);peekStake=amount;peekBusy=true;save();renderAll();
 practice=nextPractice;nextPractice='';daily=forceLvl===null&&!practice&&dailyOn();lvl=practice?0:daily?dailyLvl():wantLevel();L=lvl>0?levelCfg(lvl,(lvDeaths[lvl]||0)>=2):null;
 reset();earned=0;st='run';last=performance.now();applyLevel();if(L)mark('flick');dex=false;endBtns=[];
 if(!L)say(practice?'練習：不扣生命，也不發點。':'開始逃跑。別回頭。');ui();c.focus();
}
const shown=()=>!$('view-peek').hidden&&!document.hidden;
function region(e){
 const p=cxy(e),x=p[0],y=p[1],by=BTN[0][1];
 for(let i=0;i<BTN.length;i++){const b=BTN[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return i}
 if(y>=by-34){let bi=-1,bd=1e9;BTN.forEach((b,i)=>{const d=Math.abs(x-(b[0]+b[2]/2));if(d<bd){bd=d;bi=i}});return bi}   // fat-finger band: the nearest button wins
 return y<by?3:-1}
function syncPtrs(){btn=[0,0,0,0,0];ptrs.forEach(i=>{if(i>=0)btn[i]=1})}
$('peek-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(dex){dexClick(e);return}
 if(st!=='run'){if(st==='ready'&&!audioOk&&shown()&&hpClick(e))return;if(st!=='ready'&&shown()&&deathClick(e))return;say(st==='ready'?'先按「免費開始逃跑」。':'這一局已結算。按「免費再開一次」開始新的一局。');return}
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
/* ---- landscape fullscreen for phones: real fullscreen where allowed, otherwise turn the stage 90deg ---- */
const fsB=$('peek-full'),fsX=$('peek-fsx');
function fsOff(){if(stageEl.classList){stageEl.classList.remove('peek-fs','peek-rot')}if(fsX)fsX.hidden=true;if(fsB)fsB.textContent='橫向全螢幕';try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen()}catch(x){}}
function fsOn(){
 if(!stageEl.classList)return;stageEl.classList.add('peek-fs');if(fsX)fsX.hidden=false;if(fsB)fsB.textContent='退出全螢幕';
 const portrait=window.innerHeight>window.innerWidth;let ok=false;
 try{if(stageEl.requestFullscreen){const p=stageEl.requestFullscreen();if(p&&p.catch)p.catch(()=>{});ok=true}}catch(x){}
 try{if(ok&&screen.orientation&&screen.orientation.lock){screen.orientation.lock('landscape').catch(()=>{portrait&&stageEl.classList.add('peek-rot')});return}}catch(x){}
 if(portrait)stageEl.classList.add('peek-rot')}
if(fsB)fsB.addEventListener('click',()=>{stageEl.classList&&stageEl.classList.contains('peek-fs')?fsOff():fsOn()});
if(fsX)fsX.addEventListener('click',fsOff);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&stageEl.classList&&stageEl.classList.contains('peek-fs')&&!stageEl.classList.contains('peek-rot'))fsOff()});
const gb=$('peek-gyro');
if(gb)gb.addEventListener('click',()=>{
 if(gyro.on){gyro.on=false;window.removeEventListener('deviceorientation',onOrient);window.removeEventListener('devicemotion',onMotion);gb.textContent='啟用體感（手機）';return}
 const go=()=>{gyro.on=true;window.addEventListener('deviceorientation',onOrient);window.addEventListener('devicemotion',onMotion);gb.textContent='關閉體感'};
 try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')go();else say('沒有取得體感權限，改用按鈕操作。','lose')}).catch(()=>say('這個瀏覽器不能使用體感，改用按鈕操作。','lose'))}else go()}catch(e){say('這個瀏覽器不能使用體感，改用按鈕操作。','lose')}});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
