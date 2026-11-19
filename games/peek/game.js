  /* ---------- Don't Peek: wind the music box while spirits strike; lean away, cover the screen, hold still ---------- */
  var peekBusy=false,peekStake=0,peekSay=function(){};
  (function(){
const FB='"Alegreya Sans","Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif',FD='Cinzel,"Alegreya Sans","Noto Sans TC","PingFang TC",serif',MINSZ=14;
try{[['Cinzel',700,'cinzel-latin-700'],['Cinzel',800,'cinzel-latin-800'],['Alegreya Sans',500,'alegreya-sans-latin-500'],['Alegreya Sans',700,'alegreya-sans-latin-700'],['Alegreya Sans',800,'alegreya-sans-latin-800']].forEach(f=>{const ff=new FontFace(f[0],'url(games/peek/assets/fonts/'+f[2]+'.woff2)',{weight:String(f[1])});document.fonts.add(ff);ff.load().catch(()=>{})})}catch(e){}
const c=$('peek-canvas'),g=c.getContext('2d'),W=800,H=450,CX=400,OL='#120d0a';
const BASE_RATE=2;                         // % of the corridor covered per second: the runner keeps jogging by itself
const MILE_EVENTS=2,MILE_REWARD=2,WIN_REWARD=5; // fixed BONUS: survive 2 spirits +2, reach the exit and open the box +5, each once per round
const FIRST_GAP=6;                         // safe seconds before the first spirit
const GAP_NEAR=7,GAP_FAR=4,BREATH_EVERY=3,BREATH_EXTRA=3; // gap between spirits shrinks from 7s to 4s by 80% progress; every 3rd dodge earns a longer breather
const UNLOCK_TWINS=2,UNLOCK_WALKER=3;     // spirits unlock by dodges this round: eye first, then giggles, then the night watchman
const EASY_EYES=2,EYE_EASY_WARN=3.5;      // the first two red eyes give a longer warning
const SOUND_LEAD=.4;                       // the sound cue comes this many seconds before the picture
const DIRECTOR_AT=85,DIRECTOR_P=.75;       // once per round, past 85% a spirit may strike within 3 seconds
const TILT_SPEED=6;                        // keyboard / button lean speed per second
const EYE={warn:2.5,judge:3,away:.5,grace:.35};   // lean away from the red beam for 3s, 0.35s of slack
const TWIN={warn:2.5,judge:1.5,away:.6,toward:.3}; // lean away from the giggle side; leaning toward it is fatal
const REACH={warn:2.5,judge:2,away:.5,grace:.35};   // Reacher: lean away from the bulging ground and hold 2s
const BELL={warn:2.7,judge:3,grace:.8};  // Bellkeeper: after the third bell keep your head down (swipe down) until it has passed
const BOG={warn:2.4,judge:2.2},CRAWL={warn:2.6,judge:1.2},HOWL={warn:2.8,judge:3},FLICKG={warn:2.6,judge:2.4},NEWG=['bog','flick','howl','crawl','white','magma'];
const needOf=(ty,sd)=>ty==='eye'||ty==='twins'||ty==='reach'||ty==='magma'||ty==='flick'?-sd:ty==='gale'||ty==='white'?sd:0;   // which side's hiding spot answers the attack
const passesOf=(ty,boss)=>L&&L.kind!=='learn'&&!boss&&L.l>=8&&(ty==='twins'||ty==='gale'||ty==='magma'||ty==='white')?(L.l>=50?3:2):1;
const WALK={warn:6,judge:2.5,still:.3},ITEM_OF={hush:'item-lantern',hollow:'item-talisman',glass:'item-hammer',ash:'item-bucket'},ITEM_SHOW=3.5;      // cover before the light goes out, stay covered and still
const TYPES=['eye','twins','walker'];
const WORLDS=['forest','graveyard','swamp','snow','volcano'];   // one painted backdrop per 20% of the run
const ART={};
const art=k=>{if(typeof Image!=='function')return null;let i=ART[k];if(!i){i=ART[k]=new Image();i.src='games/peek/assets/'+k+'.webp'}return i.complete&&i.naturalWidth>0?i:null};
const SIDE=230,PICK_AT=.3,DROP_EVERY=[7,11],CAMP_EVERY=20,CAMP_REST=3,CAMP_WIN=3,CAMP_PICK_MAX=8;   // props sit SIDE px off centre; items can be grabbed once nearer than 30% depth; a campfire every 20%
const CARD_W=170,CARD_H=198,CARD_Y=146,CARDS_X=[CX-285,CX-85,CX+115];
const CAMP_CARDS=['torch','charm','scroll'];
const ITEM_NAME={torch:'火把',charm:'護身符',scroll:'舊卷軸',nib:'Nib',chest:'寶箱',rook:'旅人 Rook'};
const ITEM_DESC={torch:'下次襲擊多 0.6 秒並標出方向',charm:'擋下一次致命失誤',scroll:'每集滿 3 卷 +1 命（上限 5），並掛上骷髏燈籠',nib:'無害的小傢伙，偷偷塞給你一卷軸',chest:'火把 +1、護身符 +1',rook:'旅人分你一樣：火把或護身符'};
const FLICK_TIPS=['小螢：腳邊的落葉聚成一堆，就躲進另一側。','小螢：鳥群突然飛走，是有東西在敲樹枝。','小螢：蟲鳴停了。左右各有一件道具，點牠怕的那一件。','小螢：不同的鬼怕不同的道具：燈籠、符紙、鐵鎚、水桶。','小螢：風向反了。拖行聲從哪邊來，就躲進那一邊。','小螢：首領怕符紙，點符紙那一側。','小螢：首領怕符紙，點符紙那一側。','小螢：土面鼓起的那邊會伸出手，躲進另一邊。','小螢：鐘響三下。第三下之後往下滑低頭，一直低著頭，直到鐘聲散去。','小螢：躲太久會被發現。視野變暗就快憋不住了，鬼過去就出來。','小螢：水冒泡了。快速連點兩下！','小螢：冰在裂開。裂縫到腳邊的那一刻，點一下。','小螢：煙在哪邊，就躲進另一邊。','小螢：那些螢火是假的。點下方的火把，沒火把就躲進另一側。','小螢：記住嚎叫的節奏，等牠停了再點。','小螢：哪邊閃光，就躲進哪邊的雪洞。','小螢：起霧了，有張臉貼過來。點鐵鎚。','小螢：天暗了，鴉群在拍翅。點水桶。'];
const CAUSES={eye:'死因 #1 葉下客：落葉聚在哪一邊，你沒有躲進另一側',twins:'死因 #2 敲枝者：敲擊聲在哪一邊，你就躲進哪一邊',walkerLate:'死因 #3 靜林鬼：你沒有及時點起道具',walkerMove:'死因 #4 靜林鬼：你點錯了道具',gale:'死因 #5 逆風客：風反著吹的時候，你沒有躲進風來的那一側',hollowLate:'死因 #6 空殼：你沒有及時點起道具',hollowMove:'死因 #7 空殼：你點錯了道具',reach:'死因 #8 墳手：土面鼓起的那一邊，你沒有躲進另一側',bell:'死因 #9 守墓鐘：第三下鐘響之後，你沒有一直低著頭',breath:'死因 #10 Dread 追上了：你躲太久，牠從背後找到你了',bog:'死因 #11 泥沼拖行者：水面冒泡時，你沒有連點兩下',crawl:'死因 #12 冰縫行者：裂縫爬到腳邊時，你沒有點一下',magma:'死因 #13 熔岩蟲：冒煙的那一邊，你沒有躲進另一側',flick:'死因 #14 螢火騙子：假螢火飄來時，你沒有點亮火把',howl:'死因 #15 雪嚎者：嚎叫的節奏，你沒有照著點對',white:'死因 #16 白幕：雪洞閃光的那一側，你沒有躲進去',glass:'死因 #17 玻璃臉：你沒有及時點鐵鎚，或點錯了道具',ash:'死因 #18 灰燼鴉群：你沒有及時點水桶，或點錯了道具',colossus:'死因 #19 巨像：最後一步踩在哪一邊，你沒有躲進另一側',tail:'死因 #20 Dread：它從背後追上來，你沒有連點拉開距離，或沒有躲開撲擊'};
const TIPS={tail:'下次：聽到背後的腳步，連點螢幕（或按 F／Enter）拉開距離；它撲來時躲進另一側。',colossus:'下次：腳步左右交替，只看最後一步，躲進另一側。',eye:'下次：落葉聚在哪邊，就躲進另一邊，撐滿 3 秒。',twins:'下次：鳥群飛走、敲擊聲響起時，躲進敲擊的另一側。',walkerLate:'下次：左右各出現一件道具，要在牠逼近前點對的那一件（靜林鬼怕燈籠）。',walkerMove:'下次：看清楚兩件道具，牠怕的是燈籠（第一次遇到只會出現一件）。',gale:'下次：風向反了、拖行聲靠近時，躲進風來的那一側。',hollowLate:'下次：空殼怕符紙，牠逼近前點符紙那一側。',hollowMove:'下次：空殼怕符紙，不是燈籠。',reach:'下次：泥水冒泡、土面鼓起時，躲進另一邊並撐住 2 秒。',bell:'下次：鐘響三下，第三下之後往下滑低頭，低著頭直到鐘聲散去。',breath:'下次：躲著的時候背後的腳步會越來越近，在 Dread 追上來之前出來。',bog:'下次：水面冒泡、長條陰影浮起時，連點畫面兩下。',crawl:'下次：冰面裂縫延伸、咯吱聲變急時，在裂縫到腳邊的那一刻點一下畫面。',magma:'下次：地面發紅、一側冒煙時，躲進沒冒煙的那一側。',flick:'下次：很多螢火飄過來時，點畫面下方的火把；沒有火把就躲進另一側。',howl:'下次：聽清楚嚎叫的節奏，等牠停了，照同樣的間隔點畫面。',white:'下次：畫面一片白、一側閃光時，躲進閃光的那一側（雪洞）。',glass:'下次：畫面起霧、一張臉貼近時，點鐵鎚那一側。',ash:'下次：天色變暗、鴉群飛過、有拍翅聲時，點水桶那一側。'};
const SWIPE_PX=40,COVER_MS=250,TAP_MS=260,BREATH=4.5,BREATH_BACK=2;   // gestures: swipe = hide into a spot, hold = close your eyes, tap = pick up / come out
let best=0,deaths={};try{best=+localStorage.getItem('deep-sea-peek-best')||0}catch(e){}
try{deaths=JSON.parse(localStorage.getItem('deep-sea-peek-deaths')||'{}')||{}}catch(e){deaths={}}
let analytics=null,earned=0,dodgesTotal=0,run=0,ph=0,eyeSeen=0;try{dodgesTotal=+localStorage.getItem('deep-sea-peek-dodges')||0}catch(e){}
const ptrT=new Map();
let wx=0,lastWx=-1,prevWxT=-1,evK='',R=()=>Math.random(),L=null,lvl=0,lives=3,ck=1,maxLvl=1,noDrop=0,healTen=-1,lvDeaths={},seen={},runTop=1,daily=false,seed=0,seedCode='',rB=BASE_RATE,practice='',nextPractice='',forceLvl=null,dex=false,dexSel=0,assistHid=0,deathEv=null,guarantee=false,dropped=false,scared=false,nibT=0,lostAll=false,captions=false,AMB=.6;
try{const o=JSON.parse(localStorage.getItem('deep-sea-peek-save')||'{}');maxLvl=o.m||1;ck=1;lives=o.l||3;noDrop=o.n||0;healTen=o.h==null?-1:o.h;lvDeaths=o.d||{};seen=o.s||{};runTop=o.r||maxLvl}catch(e){}
const rnd=(a,b)=>a+R()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tx(s,x,y,sz,col,al){sz=Math.max(sz,MINSZ);g.font='800 '+sz+'px '+(sz>=26&&!/\d/.test(s)?FD:FB);g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-24);g.fillStyle=col;g.fillText(s,x,y,W-24)}
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(f){g.fillStyle=f;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=OL;g.stroke()}};
let shieldFx=0,st='ready',prog,tilt,gapT,ev,survived,lastType,directorUsed,score,why,rec,flash,shake,tt=0,last=0,fxs=[],lampOut=0;
let keys={l:0,r:0,cover:0,pick:0},gs=new Map(),hideWant=0,tapPick=0,dbl=0,tapT=-9,touchT=-9,lt=0,breath=1,spots={'-1':[],'1':[]},spotsAll=false,pendType=null,pendSide=1,itemTap=0,headDown=false,torchTap=0,chainN=0,lastTap=-9,tapQ=[],pendWait=0,breathOff=false,tutDone=false,gyro={on:false,tilt:0,down:false};
let introP=0,introBtns=[],scareT=0,scareMax=1,tut=null,bag,drops,dropT,camp,campNext,openFx,pickHeld=0,sc=0,scrolls=0,audioOk=false,assist=false,lowScare=false,MASTER=.7,chirpT=0,hk=0,hkSd=1,scareSnap=null,bT=0,hbT=0,stT=0;
try{scrolls=+localStorage.getItem('deep-sea-peek-scrolls')||0}catch(e){}
try{tutDone=localStorage.getItem('deep-sea-peek-tut2')==='1'}catch(e){}
try{const o=JSON.parse(localStorage.getItem('deep-sea-peek-opts')||'{}');assist=!!o.a;lowScare=!!o.l;captions=!!o.c;if(typeof o.m==='number')AMB=clamp(o.m,0,1);if(typeof o.v==='number')MASTER=clamp(o.v,0,1)}catch(e){}
/* ---- levels: 100 levels in 5 worlds, a ten-level sawtooth with buffer levels and a boss every tenth (v0.5 section 5) ---- */
const WORLD_BASE=[1,1.15,1.3,1.45,1.6],WORLD_NAME=['森林','墓地','沼澤','雪原','火山'];
const WORLD_RULE=['霧天視野會變窄。','雨聲會蓋住方向，聲音從哪邊來比較難分。','沼澤讓聲音變悶，要聽仔細。','雪地讓腳步沉重，躲進去比較慢。','熱浪讓畫面晃動，灰燼蓋住聲音。'];
const RHYTHM=[0,.65,.8,.85,.9,.65,.95,1,1.05,1.2,1];   // multiplier by level number inside a ten
const LEARN={4:'eye',8:'twins',12:'walker',16:'gale',22:'reach',23:'bell',30:'glass',42:'bog',43:'flick',62:'howl',63:'crawl',64:'white',74:'tail',82:'magma',83:'ash'};   // the level that teaches each ghost
/* ---- level table (docs: 100 關關卡表 v0.6). Worlds 2-5 reuse the four forest ghosts until their own ghosts exist. ---- */
// kind, weather pool (indices into WX), event flags: c chest, r traveler 30%, n Nib
const LVT=[0,['safe',[0],''],['safe',[2,0],''],['safe',[3,1],'n'],['learn',[0,1],''],['safe',[0,2],''],['mix',[3,1],''],['mix',[3,0],''],['learn',[4,1],''],['peak',[0,1],''],['boss',[3,2],''],['safe',[1,3],''],['learn',[1,0],''],['normal',[1,3],'c'],['normal',[1,4],''],['review',[0,4],''],['learn',[1,4],''],['mix',[1,4],''],['mix',[2,4],''],['peak',[1,4],''],['boss',[1,4],''],['safe',[1,3],''],['learn',[2,3],''],['learn',[1,2],'c'],['normal',[3,1],''],['safe',[2,3],''],['mix',[4,1],''],['mix',[2,4],'r'],['mix',[4,2],''],['peak',[4,3],''],['boss',[4,3],''],['safe',[4,2],''],['normal',[1,3],''],['normal',[3,2],'c'],['normal',[4,2],''],['review',[4,3],''],['mix',[2,4],''],['mix',[1,3],'r'],['mix',[1,4],''],['peak',[2,3],''],['boss',[2,4],''],['safe',[3,2],''],['learn',[3,5],''],['learn',[3,4],'c'],['normal',[2,4],''],['safe',[2,4],''],['mix',[2,3],''],['mix',[5,2],'r'],['mix',[2,3],''],['peak',[5,3],''],['boss',[5,4],''],['safe',[2,4],''],['normal',[2,5],''],['normal',[2,3],'c'],['normal',[5,3],''],['review',[2,3],''],['mix',[3,5],''],['mix',[3,2],'r'],['mix',[2,3],''],['peak',[3,2],''],['boss',[5,4],''],['safe',[1,6],''],['learn',[7,2],''],['learn',[2,7],'c'],['learn',[1,2],''],['safe',[1,6],''],['mix',[6,2],''],['mix',[6,7],'r'],['mix',[2,6],''],['peak',[7,2],''],['boss',[7,2],''],['safe',[1,6],''],['normal',[7,1],''],['normal',[2,6],'c'],['normal',[6,7],''],['review',[2,6],''],['mix',[1,2],''],['mix',[7,2],'r'],['mix',[1,7],''],['peak',[2,7],''],['boss',[2,7],''],['safe',[9,2],''],['learn',[2,8],''],['learn',[9,1],'c'],['normal',[2,1],''],['safe',[9,2],''],['mix',[2,8],''],['mix',[9,2],'r'],['mix',[1,8],''],['peak',[1,9],''],['boss',[8,2],''],['safe',[1,9],''],['normal',[1,2],''],['normal',[1,9],'c'],['normal',[1,2],''],['review',[2,1],''],['mix',[8,2],''],['mix',[1,2],'r'],['mix',[1,2],''],['peak',[1,9],''],['boss',[1,2],'']];
LVT[74]=['learn',[3,1],''];LVT[75]=['boss',[3,1],''];
const KIND_NAME={safe:'安全緩衝',review:'低壓複習',learn:'學新鬼',normal:'一般',mix:'混合',peak:'高峰',boss:'首領'};
const TAIL={warn:3,chase:6,lunge:1.6,gain:.09,decay:.22,d0:.5};   // Tail: it runs you down from behind; keep tapping to stay ahead, then hide from its lunge
const WARN_FLOOR={tail:2,bog:1.6,flick:1.8,howl:2.2,crawl:1.8,white:1.6,magma:1.6,eye:1.6,twins:1.4,walker:3.5,gale:1.6,reach:1.6,bell:2.4};   // no knob may push a clue below these
const GALE={warn:2.5,judge:2,toward:.5,grace:.35};            // lean toward the side the reversed wind comes from
const GHOST_OF={bog:'bog',crawl:'crawl',magma:'magma',flick:'flick',howl:'howl',white:'white',eye:'eye',twins:'twins',walkerLate:'walker',walkerMove:'walker',gale:'gale',reach:'reach',bell:'bell',hollowLate:'hollow',hollowMove:'hollow',glass:'glass',ash:'ash',colossus:'colossus',tail:'tail'};
const mulberry=a=>()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const deathsOf=ty=>Object.keys(GHOST_OF).filter(k=>GHOST_OF[k]===ty).reduce((a,k)=>a+(deaths[k]||0),0);
function levelCfg(l,ease){
 const wi=Math.min(4,((l-1)/20)|0),inW=(l-1)%20,k=inW%10+1,T=LVT[l]||['normal',[0],''];
 const D=WORLD_BASE[wi]*RHYTHM[k]*(1+(inW>=10?.1:0)),t=clamp((D-.65)/1.45,0,1);
 const pool=['eye','twins','walker','gale','reach','bell','glass','bog','flick','howl','crawl','white','magma','ash','tail'].filter(ty=>l>=+Object.keys(LEARN).find(n=>LEARN[n]===ty));
 let kind=T[0]==='learn'&&!LEARN[l]?'normal':T[0];
 const BP={30:['reach','bell','walker','glass'],40:['reach','bell','reach','glass'],50:['flick','bog','flick'],60:['bog','bog','flick'],70:['howl','howl','crawl','howl'],80:['white','howl','crawl','white'],90:['magma','ash','magma','ash'],75:['howl','tail','crawl','tail'],100:['magma','bell','bog','colossus']};
 let n=kind==='safe'?0:kind==='review'?1:kind==='boss'?(BP[l]?BP[l].length:pool.length+1):kind==='learn'?3:Math.round(2+6*t);
 if(ease&&n>1)n--;
 const gap=8-5*t,dur=Math.max(30,8+n*(gap+4.5)),free=kind==='normal'||kind==='mix'||kind==='peak';
 return{l,wi,k,kind,D,t,left:n,gap,rate:100/dur,wmul:1.25-.65*t,ease:!!ease,fixed:k===1||k===10,wxp:T[1],evf:T[2],
  pool:kind==='learn'?[LEARN[l]]:pool,plan:kind==='boss'?(BP[l]?BP[l].slice():pool.concat('hollow')):null,
  fakeP:l>=15&&free?.15*t:0,chainP:l===40||l===100?1:l>=25&&free?.35*t:0}}
function wpick(pool){   // weighted: the newest ghost x2, the one that killed you most x1.5
 const dm=Math.max(0,...pool.map(deathsOf)),wOf=ty=>Math.floor((+Object.keys(LEARN).find(n=>LEARN[n]===ty)-1)/20),w=pool.map((ty,i)=>(i===pool.length-1&&pool.length>1?2:1)*(dm>0&&deathsOf(ty)===dm?1.5:1)*(L&&wOf(ty)<L.wi?.35:1));
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
let terr=null;
const TERR_TINT=[[null,'rgba(40,70,110,.2)','rgba(130,80,30,.15)','rgba(20,60,40,.18)'],[null,'rgba(70,40,110,.18)','rgba(90,110,120,.15)','rgba(120,40,40,.12)'],[null,'rgba(20,90,70,.2)','rgba(110,100,30,.14)','rgba(30,50,40,.2)'],[null,'rgba(60,100,160,.18)','rgba(150,170,200,.14)','rgba(40,50,90,.2)'],[null,'rgba(160,50,20,.18)','rgba(90,30,40,.18)','rgba(160,100,30,.14)']];
function terrOf(c){   // no new art: each level crops, mirrors, tints and fogs its world's backdrop differently (same level = same look)
 const r=mulberry((c.l*2654435761+7)>>>0),T={flip:r()<.5,z:1.12+r()*.2,fx:r()*2-1,fy:r()*2-1,tint:TERR_TINT[c.wi][(r()*4)|0],fog:r()*.8};
 if(c.kind==='safe'){T.tint=null;T.fog*=.3}else if(c.kind==='boss'||c.kind==='peak'){T.fog=Math.max(T.fog,.5);T.tint=T.tint||'rgba(80,20,20,.14)'}
 return T}
function applyLevel(){
 R=()=>Math.random();rB=BASE_RATE;seedCode='';
 terr=L?terrOf(L):null;
 if(!L){wx=0;lastWx=-1;genSpots(Math.random);campNext=practice?999:CAMP_EVERY;if(practice)gapT=2;return}
 const sEl=hasLv?$('peek-seed'):null,dEl=hasLv?$('peek-daily'):null,sIn=sEl?String(sEl.value||'').trim():'';
 if(L.fixed)seed=L.l*7919+101;
 else if(sIn)seed=parseInt(sIn,36)||1;
 else if(daily){const d=new Date();seed=(d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())*131+L.l}
 else seed=(Math.random()*1e9)|0;
 R=mulberry(seed);seedCode=seed.toString(36).toUpperCase();genSpots(mulberry(seed^977));
 rB=L.rate;gapT=L.kind==='learn'?FIRST_GAP:6;
 campNext=L.k===5&&L.kind!=='boss'?50:999;
 guarantee=noDrop>=3||L.l===41||L.l===42;dropT=L.kind==='safe'?rnd(3,5):rnd(5,8);
 evK=L.evf==='n'?'nib':L.evf==='c'?'chest':L.evf==='r'&&R()<.3?'rook':'';nibT=evK?rnd(8,22):0;
 wx=L.wxp[(R()*L.wxp.length)|0];if(L.wxp.length>1&&wx===lastWx)wx=L.wxp.find(x=>x!==lastWx);lastWx=wx;
 assistHid=L.ease?1:0;
 say('第 '+lvl+' 關・'+WORLD_NAME[L.wi]+'：'+KIND_NAME[L.kind]+(L.fixed?'（固定種子）':'')+'。'+WORLD_RULE[L.wi]+(L.ease?'小螢多給你 0.3 秒預警，少來一次襲擊。':''))}
function reset(){shieldFx=0;torchTap=0;tapQ=[];headDown=false;itemTap=0;pendType=null;hideWant=0;tapPick=0;lt=0;breath=1;hk=0;scareSnap=null;gs.clear();eyeSeen=0;run=0;ph=0;prog=0;tilt=0;gapT=FIRST_GAP;ev=null;survived=0;lastType='';directorUsed=false;score=0;why='';rec=false;flash=0;shake=0;fxs=[];lampOut=0;bag={charm:0,torch:0};drops=[];dropT=rnd(5,8);camp=null;campNext=CAMP_EVERY;openFx=null;pickHeld=0;sc=0;rB=BASE_RATE;scared=false;dropped=false;nibT=0;lostAll=false}
reset();
/* ---- audio: stereo cues, so headphones help; silent if the browser has no Web Audio ---- */
let ac=null;
function audioInit(){if(ac){try{ac.resume()}catch(e){}return}try{const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}catch(e){ac=null}}
function tone(f,d,vol,pan,type,slide,amb){
 if(!ac)return;
 try{const o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(slide,t+d);
  gn.gain.setValueAtTime((vol||.05)*(amb?AMB:MASTER*(L&&L.wi===2?.7:1)*(wx===8||wx===9?.8:1))*1.4,t);gn.gain.linearRampToValueAtTime(.0001,t+d);o.connect(gn);
  if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=(pan||0)*(wx===3&&L&&L.wi===1?.5:1);gn.connect(p);p.connect(ac.destination)}else gn.connect(ac.destination);
  o.start(t);o.stop(t+d+.02)}catch(e){}}
let nbuf=null,rainN=null,thCyc=-1;
function noiseBuf(){if(!nbuf){nbuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return nbuf}
function weatherAudio(){   // thunderstorm: a steady rain bed, plus a rumble that follows each lightning flash
 if(!ac)return;
 try{const on=st==='run'&&!introP&&wx===3&&!camp;
  if(on&&!rainN){const src=ac.createBufferSource(),hp=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),gn=ac.createGain();src.buffer=noiseBuf();src.loop=true;hp.type='highpass';hp.frequency.value=700;lp.type='lowpass';lp.frequency.value=6500;gn.gain.value=0;src.connect(hp);hp.connect(lp);lp.connect(gn);gn.connect(ac.destination);src.start();rainN={src,gn}}
  if(rainN)rainN.gn.gain.setTargetAtTime(on?.16*AMB*1.6:0,ac.currentTime,.4);
  if(on){const cyc=Math.floor(tt/11),q=tt%11;if(q<.2&&thCyc!==cyc){thCyc=cyc;const t=ac.currentTime+.45+Math.random()*.5,src=ac.createBufferSource(),lp=ac.createBiquadFilter(),gn=ac.createGain();src.buffer=noiseBuf();lp.type='lowpass';lp.frequency.setValueAtTime(260,t);lp.frequency.exponentialRampToValueAtTime(60,t+2.4);gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.9*MASTER,t+.08);gn.gain.exponentialRampToValueAtTime(.0001,t+2.6);src.connect(lp);lp.connect(gn);gn.connect(ac.destination);src.start(t,Math.random());src.stop(t+2.7)}}}catch(e){}}
function nburst(f0,f1,d,vol,lpf,q){   // one breath of band-passed noise
 if(!ac)return;
 try{const t=ac.currentTime,src=ac.createBufferSource(),bp=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),gn=ac.createGain();src.buffer=noiseBuf();bp.type='bandpass';bp.Q.value=q||1.2;bp.frequency.setValueAtTime(f0,t);bp.frequency.linearRampToValueAtTime(f1,t+d);lp.type='lowpass';lp.frequency.value=lpf||4000;gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(vol*MASTER,t+d*.35);gn.gain.linearRampToValueAtTime(.0001,t+d);src.connect(bp);bp.connect(lp);lp.connect(gn);gn.connect(ac.destination);src.start(t,Math.random()*1.5);src.stop(t+d+.02)}catch(e){}}
function breathSfx(dt){   // you are always panting; inside a hiding spot it gets loud and tight, a heartbeat starts, and footsteps close in behind you as the air runs out
 if(!ac||st!=='run'||introP||camp||typeof setTimeout!=='function')return;
 const hid=hk>.6,strain=hid?1-breath:0;
 bT-=dt;
 if(bT<=0){const per=hid?1.25-.75*strain:.58,vol=hid?.2+.14*strain:.065;bT=per;
  nburst(hid?500:1000,hid?800:1500,per*.38,vol,hid?900:3800,1.4);
  setTimeout(()=>nburst(hid?700:1300,hid?350:700,per*.42,vol*.8,hid?800:3000,1.2),per*400)}
 if(hid){hbT-=dt;const hp=.95-.55*strain;if(hbT<=0){hbT=hp;tone(52,.14,.3,0,'sine',38);setTimeout(()=>tone(46,.16,.22,0,'sine',34),hp*230)}
  stT-=dt;if(strain>.35){const sp=.9-.56*((strain-.35)/.65);if(stT<=0){stT=sp;tone(64,.09,.09+.14*strain,0,'sine',40)}}}}
function say(text,kind){$('peek-msg').textContent=text;$('peek-msg').className='msg'+(kind?' '+kind:'')}
peekSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('peek-prog',L?'第 '+lvl+' 關':Math.floor(prog)+'%');setText('peek-spirits',survived+' 次襲擊');setText('peek-best',best+'%');setText('peek-codex',Object.keys(CAUSES).filter(k=>deaths[k]>0).length+' / '+Object.keys(CAUSES).length);setText('peek-dodges',dodgesTotal+' 次');
 setText('peek-lvl',L?lvl+' / 100':'自由跑');setText('peek-lives',L?String(lives):'—');
 const lv=wantLevel();
 $('peek-amount').disabled=peekBusy;$('peek-go').disabled=live;setText('peek-go',live?'逃跑中 · 別回頭':(st==='ready'?'開始 ':'再試 ')+(lv?'第 '+lv+' 關':'自由跑'));
}
function fx(s,x,y,col){fxs.push({s,x,y,col,t:0})}
function end(kind,reason){
 if(st!=='run')return;
 if(tut&&kind==='dead'){tutFail();return}
 if(kind==='dead'&&bag.charm>0){bag.charm--;shieldFx=1;fx('護身符擋下了這一次',CX,118,'#9fe8ff');ev=null;gapT=Math.max(nextGap(),4);flash=lowScare?.1:.3;return}
 deathEv=ev?{type:ev.col?'colossus':ev.type,side:ev.side,boss:!!ev.boss}:null;
 st=kind==='won'?'won':'over';try{window.__gp&&window.__gp(false)}catch(e){}why=reason||'';lostAll=false;
 const p=Math.floor(prog);rec=!L&&!practice&&p>best;
 if(rec){best=p;try{localStorage.setItem('deep-sea-peek-best',best)}catch(e){}}
 if(kind==='dead'){
  scareSnap=null;if(!lowScare&&(reason==='breath'||reason==='tail')&&typeof setTimeout==='function'){try{const sn=document.createElement('canvas');sn.width=W;sn.height=H;sn.getContext('2d').drawImage(c,0,0,W,H);scareSnap=sn}catch(e){}}   // Dread catches you: the view whips around 180 degrees onto its face
  scareMax=scareT=lowScare?.45:scareSnap?1.7:1.05;
  const boom=()=>{flash=lowScare?.15:.5;shake=lowScare?0:.5;if(!lowScare){tone(62,.7,.55,0,'sawtooth',28);tone(1900,.3,.22,0,'square',240);tone(420,.5,.18,0,'sawtooth',90)}else tone(120,.3,.15,0,'sine',60)};
  if(scareSnap){nburst(300,1800,.45,.5,6000,.8);tone(90,.5,.2,0,'sine',40);setTimeout(()=>{if(st==='over')boom()},650)}else boom();
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
const TUT=[
 {ty:'eye',k:['←','→'],kt:'按住躲藏',g:'swipe',gt:'左右滑並按住',t:'落葉堆在一側，等紅光亮起。',tj:'現在！往另一側滑（或按住 ← →）躲進去，撐滿 3 秒。',t2:'躲太久會喘不過氣，只在紅光亮時躲。'},
 {ty:'walker',k:['←','→'],kt:'選燈籠那一側',g:'tap',gt:'點燈籠那一側',t:'鬼來了。點燈籠那一側（或按 ← →）。',t2:'牠怕光。點錯道具就會被抓到。'},
 {ty:'pick',k:['F'],kt:'撿起',g:'tap',gt:'點一下道具',t:'路邊有東西，點一下（或按 F）撿起來。',t2:''},
 {ty:'eye',k:['←','→'],kt:'按住躲藏',g:'swipe',gt:'左右滑並按住',t:'換你了。聽聲音，自己判斷。',t2:'落葉在哪邊就躲另一邊，紅光亮時才躲。',solo:1}];
const tutHelp=()=>!!(tut&&!TUT[tut.i].solo);
function tutFail(){ev=null;pendType=null;tilt=0;hideWant=0;breath=1;clearInput();tut.fails++;gapT=1.8;flash=0;fx('沒關係，再來一次。',CX,118,'#9fe8ff')}
function tutOk(){fx('很好！',CX,118,'#9fe8ff');ev=null;pendType=null;tut.i++;clearInput();
 if(tut.i>=TUT.length){tutEnd();return}
 gapT=TUT[tut.i].ty==='pick'?99:1.2;
 if(TUT[tut.i].ty==='pick'){tut.n=bag.torch;drops.length=0}}
function tutEnd(){tut=null;tutDone=true;try{localStorage.setItem('deep-sea-peek-tut2','1')}catch(e){}st='ready';ev=null;fxs=[];clearInput();start()}
function tutTick(){dropT=999;nibT=0;campNext=999;prog=Math.min(prog,40);
 if(TUT[tut.i].ty==='pick'&&!ev){if(bag.torch>tut.n){tutOk();return true}
  if(!drops.some(d=>d.z>=0)){drops.push({k:'torch',side:R()<.5?-1:1,z:.6})}}
 return false}
function keyCap(x,y,w,lab,down){const dy=down?3:0;RR(x,y+4,w,30,7,'#5a3d18',0);RR(x,y+dy,w,30,7,down?'#ffd98a':'#f4ead0',2);txp(lab,x+w/2,y+dy+22,17,'#2a1a0c',w-6)}
function drawControls(s,yy){
 const x0=CX-300,y0=yy||H-130,w=600,h=76;RR(x0,y0,w,h,12,'rgba(18,13,10,.86)',2);
 g.save();g.strokeStyle='rgba(232,198,117,.35)';g.lineWidth=1;g.beginPath();g.moveTo(CX,y0+10);g.lineTo(CX,y0+h-10);g.stroke();g.restore();
 g.textAlign='left';tx('電腦鍵盤',x0+16,y0+20,14,'#e8c675','left');
 const kd={'←':keys.l,'→':keys.r,'F':keys.pick};let kx=x0+16;s.k.forEach(k=>{keyCap(kx,y0+30,36,k,!!kd[k]);kx+=44});
 tx(s.kt,kx+6,y0+53,16,'#f1d9a6','left');
 const gx=CX+22;tx('手機觸控',gx,y0+20,14,'#e8c675','left');
 const cx=gx+34,cy=y0+50;g.save();g.fillStyle='rgba(255,255,255,.9)';
 if(s.g==='swipe'){const dx=Math.sin(tt*3)*22;g.strokeStyle='#ffd98a';g.lineWidth=3;g.beginPath();g.moveTo(cx-32,cy);g.lineTo(cx+32,cy);g.stroke();[[-1,cx-32],[1,cx+32]].forEach(a=>{g.fillStyle='#ffd98a';g.beginPath();g.moveTo(a[1],cy);g.lineTo(a[1]-a[0]*10,cy-8);g.lineTo(a[1]-a[0]*10,cy+8);g.fill()});g.fillStyle='rgba(255,255,255,.92)';g.beginPath();g.arc(cx+dx,cy,10,0,7);g.fill()}
 else{const r=(tt*1.6)%1;g.strokeStyle='rgba(255,217,138,'+(1-r)+')';g.lineWidth=3;g.beginPath();g.arc(cx,cy,8+r*22,0,7);g.stroke();g.beginPath();g.arc(cx,cy,10,0,7);g.fill()}
 g.restore();tx(s.gt,cx+46,y0+53,16,'#f1d9a6','left')}
const INTRO=[
 {t:'怎麼玩：躲起來',b:'鬼來襲時，往遠離牠的另一側躲進樹或棺材，撐到牠離開。躲太久會喘不過氣，所以只在需要時躲。',k:['←','→'],kt:'按住躲藏',g:'swipe',gt:'左右滑並按住'},
 {t:'有些鬼怕道具',b:'左右會各出現一件道具。點牠怕的那一側，點錯就會被抓到。第一隻怕燈籠。',k:['←','→'],kt:'選燈籠那一側',g:'tap',gt:'點燈籠那一側'},
 {t:'撿東西、聽聲音',b:'路邊的東西可以撿，有些能救命。聲音會告訴你方向，戴耳機更容易聽出左右。',k:['F','T'],kt:'撿起 / 火把',g:'tap',gt:'點一下道具'}];
function introNext(){introP++;if(introP>INTRO.length){introP=0;last=performance.now()}}
function introClick(e){const p=cxy(e);for(const b of introBtns)if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3]){if(b[4]==='skip'){introP=0;tutEnd()}else introNext();return}}
function drawIntro(){
 const d=INTRO[introP-1];g.fillStyle='#0c0806';g.fillRect(0,0,W,H);
 const bn=art('ui-banner');if(bn)g.drawImage(bn,CX-210,14,420,82);txp(d.t,CX+25,64,24,'#3a2812');
 txd(d.b,CX,134,19,'#f1d9a6',620,3);
 drawControls(d,H-190);
 for(let i=0;i<INTRO.length;i++){g.fillStyle=i===introP-1?'#fff':'rgba(255,255,255,.3)';g.beginPath();g.arc(CX-18+i*18,H-92,4,0,7);g.fill()}
 introBtns=[[CX-80,H-82,160,40,'next'],[W-150,H-46,132,32,'skip']];
 btnImg(CX-80,H-82,160,40,introP<INTRO.length?'下一頁':'開始練習',false,18);btnImg(W-150,H-46,132,32,'跳過教學',false,15)}
function drawTutUI(){
 const s=TUT[tut.i];g.save();
 const main=(ev&&ev.phase==='judge'&&s.tj)?s.tj:s.t;RR(CX-350,142,700,s.t2?70:52,12,'rgba(18,13,10,.84)',2);tx(main,CX,172,18,'#ffd98a');if(s.t2)tx(s.t2,CX,198,13,'#cfcfcf');
 {const dy=s.t2?226:214;for(let i=0;i<TUT.length;i++){g.fillStyle=i<tut.i?'#e8c675':i===tut.i?'#fff':'rgba(255,255,255,.25)';g.beginPath();g.arc(CX-((TUT.length-1)*9)+i*18,dy,4,0,7);g.fill()}}
 RR(CX-80,H-34,160,12,6,'rgba(255,255,255,.15)');if(breath>.01)RR(CX-80,H-34,160*breath,12,6,Math.abs(tilt)>.5?'#ffb347':'#9fe8ff');tx('身後',CX,H-40,12,'#cfcfcf');
 if(!s.solo){g.strokeStyle='#ffd98a';g.lineWidth=4;g.globalAlpha=.9;
  if(s.ty==='eye'&&ev&&!ev.fake&&ev.phase==='judge'){const safe=-ev.side,x=CX+safe*150;tx(safe<0?'◀◀':'▶▶',x+safe*Math.abs(Math.sin(tt*5))*14,275,46,'#ffd98a')}
  else if(s.ty==='walker'&&itemsUp()){const f=ev.phase==='judge'?1:clamp((ITEM_SHOW-ev.t)/1.2,0,1);[-1,1].forEach(sd=>{if(ev.items[sd]===ITEM_OF.hush){g.beginPath();g.arc(CX+sd*(540-300*f),310,60+7*Math.sin(tt*6),0,7);g.stroke()}})}
  else if(s.ty==='pick')drops.forEach(d=>{if(d.z<0)return;const q=1-d.z;g.beginPath();g.arc(CX+d.side*(90+(SIDE+30-90)*q),300+95*q,40+90*q*.4+6*Math.sin(tt*6),0,7);g.stroke()})}
 drawControls(s);btnImg(W-150,H-46,132,32,'跳過教學',false,15);
 g.restore()}
function startEvent(){
 if(L&&L.left<=0&&!L.forceFake){gapT=99;return}
 if(!pendType){
  if(tut)pendType=TUT[tut.i].ty;
  else if(practice)pendType=practice;
  else if(L&&L.plan&&L.plan.length)pendType=L.plan.shift();
  else if(L){const p=L.pool.filter(t=>t!==lastType);pendType=wpick(p.length?p:L.pool)}
  else{const pool=pickPool();pendType=pool[(R()*pool.length)|0]}
  pendSide=R()<.5?-1:1;pendWait=0}
 let type=pendType;const col=type==='colossus';if(col)type='twins';   // the Colossus is a Knocker-style hide, but the footsteps alternate and only the last one counts
 const tl=type==='tail',gh=type==='walker'?'hush':col?'colossus':type,boss=type==='hollow'||type==='glass'||col||tl;if((boss&&!col&&!tl)||type==='ash')type='walker';
 let fake=false;if(L&&L.forceFake){fake=true;L.forceFake=false}else if(L&&!boss&&L.fakeP&&R()<L.fakeP)fake=true;
 const eyeBase=eyeSeen<EASY_EYES&&(!L||L.kind==='learn')?EYE_EASY_WARN:EYE.warn;
 const base=type==='bog'?BOG.warn:type==='flick'?FLICKG.warn:type==='howl'?HOWL.warn:type==='crawl'?CRAWL.warn:type==='white'?GALE.warn:type==='magma'?REACH.warn:type==='eye'?eyeBase:type==='twins'?TWIN.warn:type==='gale'?GALE.warn:type==='reach'?REACH.warn:type==='bell'?BELL.warn:type==='tail'?TAIL.warn:WALK.warn;
 let warn=base;if(L&&!boss)warn=Math.max(WARN_FLOOR[type],base*L.wmul)+(L.kind==='learn'?.6:0)+(assistHid?.3:0);
 let side=pendSide;
 {const sol=sd=>needOf(type,sd),dur=({eye:3,twins:1.5,gale:2,reach:2,magma:2,white:2,flick:2.4}[type]||0)+2.2*(passesOf(type,boss)-1)+1;
  if(!spotsAll&&sol(1)){const okS=sd=>spots[sol(sd)].some(w=>w[0]<=lt+1&&w[1]>=lt+warn+dur);
   if(!okS(side)&&okS(-side))side=-side;
   if(!okS(side)){if(pendWait<7){pendWait+=.5;gapT=.5;return}
    ensureSpot(sol(side),lt+APPROACH+.1,lt+APPROACH+.1+warn+dur+2);gapT=APPROACH+.2;pendWait=0;return}}}
 pendType=null;
 if(type==='eye')eyeSeen++;
 ev={type,side,gh,phase:'warn',t:warn,warn,el:0,bad:0,rung:0,ok:false,snd:0,fake,boss,col,first:tl&&!seen.tail};
 if(col||tl)[-1,1].forEach(sd=>ensureSpot(sd,lt+.6,lt+16));
 if(!col){ev.passes=passesOf(type,boss);ev.pass=1}else{ev.passes=2;ev.pass=1;colPlan()}if(L&&L.l>=15&&L.kind!=='learn'&&!boss){const d0=R()*.4;ev.warn+=d0;ev.t+=d0}   // the omen sometimes comes a beat before the ghost
 {const need=needOf(type,ev.side);if(need&&spotsAll)ensureSpot(need,lt+.6,lt+warn+({eye:3,twins:1.5,gale:2,reach:2}[type]||0)+2.2*(ev.passes-1)+1)}
 if(L&&!fake)L.left--;
 if(type==='walker'&&!fake){const keys0=Object.keys(ITEM_OF).filter(k=>k!==gh),firstTime=!!tut||!seen[({hush:'hush',hollow:'hollow',glass:'glassface',ash:'ash'})[gh]];ev.items={};ev.items[side]=ITEM_OF[gh];ev.items[-side]=firstTime?null:ITEM_OF[keys0[(R()*keys0.length)|0]]}
 lastType=type;mark(gh==='glass'?'glassface':gh==='ash'?'ash':col?'colossus':tl?'tail':boss?'hollow':type==='eye'?'leafling':type==='twins'?'knocker':type==='walker'?'hush':type==='reach'?'reacher':type==='bell'?'bellkeeper':type==='bog'?'bog':type==='flick'?'flickghost':type==='howl'?'howler':type==='crawl'?'crawler':type==='white'?'whiteout':type==='magma'?'magma':'gale');
 if(bag.torch>0&&!fake&&!tut){bag.torch--;ev.warn+=.6;ev.t+=.6;ev.torch=true;fx('火把：多 0.6 秒預警',CX,118,'#ffb347')}}   // a torch buys 0.6s of extra warning and lights the side it comes from
function nextGap(){
 if(L)return Math.max(2.5,L.gap+rnd(-1,1));
 let g=GAP_NEAR+(GAP_FAR-GAP_NEAR)*clamp(prog/80,0,1)+rnd(-1,1);
 if(survived>0&&survived%BREATH_EVERY===0)g+=BREATH_EXTRA;
 return Math.max(3,g)}
function survive(){
 if(tut){tutOk();return}
 if(ev.passes>1)allClear();
 survived++;if(!practice){dodgesTotal++;try{localStorage.setItem('deep-sea-peek-dodges',dodgesTotal)}catch(e){}}
 score+=100;lastType=ev.type;ev=null;gapT=nextGap();
 if(L&&L.chainP&&L.left>0){const pc=chainN===0?L.chainP:(L.l>=60&&chainN===1?L.chainP*.5:0);if(R()<pc){gapT=1.4;chainN++}else chainN=0}else chainN=0;   // chained attack: the next one follows right away (never under 1.2s)

 if(survived===MILE_EVENTS)pay(MILE_REWARD,'躲過 '+MILE_EVENTS+' 次襲擊！')}
function inputs(){
 const kt=gyro.on?gyro.tilt:clamp(keys.r-keys.l,-1,1);
 return{tilt:kt||hideWant,cover:!!(keys.cover||gyro.down||gestCover())}}
const gestCover=()=>{const n=performance.now();for(const q of gs.values())if(!q.sw&&n-q.t>=COVER_MS)return true;return false};
const spotAt=sd=>spots[sd].some(w=>lt>=w[0]&&lt<=w[1]);
const hideOK=v=>!v?0:(spotsAll||spotAt(v<0?-1:1))?v:0;
function genSpots(rf){spots={'-1':[],'1':[]};[-1,1].forEach(sd=>{let t=2+rf()*3;while(t<420){const len=5.5+rf()*2.5;spots[sd].push([t,t+len]);t+=len+5+rf()*4}})}   // about one hiding spot per side every 12-15 s of road
function ensureSpot(sd,a,b){if(spots[sd].some(w=>w[0]<=a+.2&&w[1]>=b))return;spots[sd]=spots[sd].filter(w=>w[1]<a-.5||w[0]>b+.5).concat([[a,b]]).sort((x,y)=>x[0]-y[0])}   // every attack gets a usable spot on its safe side
function swipe(d){if(hideWant===-d){hideWant=0;return}if(!spotsAll&&!spotAt(d))return;hideWant=d}
const wkWhy=k=>ev.gh==='glass'?'glass':ev.gh==='ash'?'ash':(ev.boss?'hollow':'walker')+k;
function itemsUp(){return !!(ev&&ev.type==='walker'&&ev.items&&(ev.phase==='judge'||(ev.phase==='warn'&&ev.t<=ITEM_SHOW)))}
function setHead(v){headDown=!!v&&!!ev&&ev.type==='bell'&&!ev.fake}
function tailPush(){if(ev&&ev.type==='tail'&&ev.phase==='chase'){ev.d=Math.min(1,ev.d+TAIL.gain);tone(170,.04,.05,0,'square',110)}}
function tap(x,y){tailPush();const n=performance.now();lastTap=tt;tapQ.push(tt);if(tapQ.length>8)tapQ.shift();if(n-tapT<350&&tapT>=0){dbl=1;tapT=-9}else tapT=n;if(ev&&ev.type==='flick'&&ev.phase==='judge'&&bag.torch>0&&(y==null?false:y>320)){torchTap=1;return}if(headDown){headDown=false;return}if(itemsUp()&&x!=null){itemTap=x<CX?-1:1;return}if(canPick()){tapPick=1;return}if(hideWant){hideWant=0;return}}
function colPlan(){   // footsteps alternate left/right; the last one lands on ev.side. Round 2 has one more step
 const n=ev.pass===1?4:5,last=ev.side;ev.steps=[];ev.si=0;for(let i=0;i<n;i++)ev.steps.push([.6+i*.85,(n-1-i)%2?-last:last]);ev.warn=ev.t=.6+n*.85+.5;ev.el=0}
function passEnd(){if(ev.pass<ev.passes){ev.pass++;ev.phase='gap';ev.t=1;ev.ok=false;ev.bad=0;ev.snd=0}else if(L&&L.l>=41&&!ev.fakeBack&&R()<.25){ev.fakeBack=true;ev.phase='gap';ev.t=1.6;ev.snd=0}else survive()}
function allClear(){[0,110,220,330].forEach(d=>later(()=>tone(3100+Math.random()*500,.05,.03,0,'sine'),d))}   // after a multi-pass attack the crickets burst back: it is really over
function update(dt){
 tt+=dt;weatherAudio();
 if(introP)return;
 if(openFx){openFx.t-=dt;if(openFx.t<=0)openFx=null}
 if(shieldFx>0)shieldFx=Math.max(0,shieldFx-dt*1.4);if(flash>0)flash-=dt;if(shake>0)shake-=dt;if(scareT>0)scareT-=dt;fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.9);
 if(st!=='run')return;
 const I=inputs();
 const covered=I.cover,aim=hideOK(I.tilt);
 if(gyro.on)tilt=aim;else tilt+=clamp(aim-tilt,-TILT_SPEED*dt*(L&&L.wi===3?.7:1),TILT_SPEED*dt*(L&&L.wi===3?.7:1));
 const pk=(keys.pick||tapPick)&&!pickHeld;pickHeld=!!keys.pick;tapPick=0;
 if(camp){updateCamp(dt);ph+=dt*2;return}
 lt+=dt;if(hideWant&&!spotsAll&&!spotAt(hideWant))hideWant=0;
 if(Math.abs(tilt)>.5&&!breathOff){breath-=dt/BREATH;if(breath<=0){breath=0;end('dead','breath');return}}else breath=Math.min(1,breath+dt/BREATH_BACK);   // hiding costs breath; out of breath means found
 hk+=clamp((Math.abs(tilt)>.5?1:0)-hk,-dt*2.2,dt*3.2);if(Math.abs(tilt)>.05)hkSd=tilt<0?-1:1;breathSfx(dt);
 chirpT-=dt;if(chirpT<=0){chirpT=rnd(.3,.8);if(!(ev&&(ev.type==='walker'))&&!covered)tone(3000+Math.random()*700,.04,.012,rnd(-.8,.8),'sine',0,true)}   // crickets: they go quiet before Hush
 if(tut&&tutTick())return;
 if(!covered){prog=Math.min(L&&(L.left>0||ev)?97:100,prog+rB*dt);run+=dt*1.5}
 ph+=dt*(covered?2.5:9);
 if(prog>=100){score+=500;pay(WIN_REWARD,'盒子打開了！');end('won');return}
 while(campNext<100&&prog>=campNext+CAMP_WIN)campNext+=CAMP_EVERY;
 if(!ev&&prog>=campNext&&campNext<100){startCamp();return}
 updateDrops(dt,covered,pk);
 if(!L&&!directorUsed&&prog>=DIRECTOR_AT){directorUsed=true;if(!ev&&R()<DIRECTOR_P)gapT=Math.min(gapT,rnd(1,3))}
 if(!ev&&L&&L.kind==='safe'&&!scared&&prog>=45&&L.pool.length){scared=true;L.forceFake=true;gapT=0}   // buffer levels only get harmless scares
 if(!ev){gapT-=dt;if(gapT<=0)startEvent();return}
 ev.t-=dt;ev.el=(ev.el||0)+dt;
 if(ev.fake&&ev.t<=0){ev=null;gapT=nextGap();return}   // a false cue: it fades without an attack
 const away=tilt*-ev.side;   // positive when leaning away from the spirit's side
 if(ev.phase==='gap'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(70,.25,.03,-ev.side*.6,'sine')}if(ev.t<=0){if(ev.fakeBack){survive();return}ev.phase='warn';ev.t=.8;ev.warn=.8;ev.el=0;if(ev.col)colPlan();else tone(ev.type==='gale'?260:150,.2,.08,ev.side*.8,'square',90)}}
 else if(ev.type==='eye'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(90+Math.random()*30,.12,.05,ev.side*.7,'sawtooth')}if(ev.t<=0){ev.phase='judge';ev.t=EYE.judge;tone(520,.3,.07,ev.side*.7,'square',380)}}
  else{if(away<EYE.away)ev.bad+=dt;if(ev.bad>EYE.grace){end('dead','eye');return}if(ev.t<=0)survive()}}
 else if(ev.type==='tail'){
  if(ev.phase==='warn'){if(!ev.hint&&ev.first){ev.hint=1;fx('背後有東西追上來！連點螢幕（或按 F／Enter）拉開距離。',CX,160,'#ffd98a')}
   ev.snd-=dt;const f=clamp(ev.el/ev.warn,0,1);if(ev.snd<=0){ev.snd=.55-.25*f;tone(64,.08,.08+.1*f,0,'sine',44)}if(ev.t<=0){ev.phase='chase';ev.t=TAIL.chase;ev.d=TAIL.d0;ev.snd=0}}
  else if(ev.phase==='chase'){ev.d-=TAIL.decay*dt;ev.snd-=dt;if(ev.snd<=0){ev.snd=.17+.3*ev.d;tone(58+34*(1-ev.d),.07,.1+.22*(1-ev.d),0,'sine',40);if(!lowScare&&ev.d<.3)shake=Math.max(shake,.08)}
   if(ev.d<=0){end('dead','tail');return}
   if(ev.t<=0){ev.phase='judge';ev.t=TAIL.lunge;tone(220,.35,.22,ev.side,'sawtooth',60);if(!lowScare)shake=Math.max(shake,.2)}}
  else{if(tilt*ev.side>TWIN.toward){end('dead','tail');return}if(away>=TWIN.away)ev.ok=true;if(ev.t<=0){if(ev.ok)survive();else{end('dead','tail');return}}}}
 else if(ev.type==='twins'){
  if(ev.phase==='warn'){if(ev.col){while(ev.si<ev.steps.length&&ev.el>=ev.steps[ev.si][0]){const sd=ev.steps[ev.si++][1];tone(46,.4,.26,sd,'sine',28);tone(140,.1,.12,sd,'square',60);if(!lowScare)shake=Math.max(shake,.1)}}
   else{ev.snd-=dt;if(ev.snd<=0){ev.snd=.38;tone(150+Math.random()*25,.07,.1,ev.side,'square',90)}}
   if(ev.t<=0){ev.phase='judge';ev.t=ev.col?2:TWIN.judge}}
  else{const why2=ev.col?'colossus':'twins';if(tilt*ev.side>TWIN.toward){end('dead',why2);return}if(away>=TWIN.away)ev.ok=true;if(ev.t<=0){if(ev.ok)passEnd();else{end('dead',why2);return}}}}
 else if(ev.type==='gale'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(260,.35,.06,ev.side*.8,'sawtooth',120)}if(ev.t<=0){ev.phase='judge';ev.t=GALE.judge;tone(110,.5,.09,ev.side,'square',70)}}
  else{if(tilt*ev.side<GALE.toward)ev.bad+=dt;if(ev.bad>GALE.grace){end('dead','gale');return}if(ev.t<=0)passEnd()}}
 else if(ev.type==='reach'){
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.45;tone(55+Math.random()*25,.16,.07,ev.side*.7,'sine',40)}if(ev.t<=0){ev.phase='judge';ev.t=REACH.judge;tone(210,.4,.08,ev.side*.7,'square',90)}}
  else{if(away<REACH.away)ev.bad+=dt;if(ev.bad>REACH.grace){end('dead','reach');return}if(ev.t<=0)survive()}}
 else if(ev.type==='magma'){      // Magma: the ground glows red and one side smokes; hide on the other side
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.4;tone(60+Math.random()*30,.18,.08,ev.side*.6,'sawtooth',45)}if(ev.t<=0){ev.phase='judge';ev.t=REACH.judge;tone(180,.45,.09,ev.side*.6,'square',70)}}
  else{if(away<REACH.away)ev.bad+=dt;if(ev.bad>REACH.grace){end('dead','magma');return}if(ev.t<=0)passEnd()}}
 else if(ev.type==='white'){      // Whiteout: everything goes white, one side flashes: the snow cave is on that side
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.5;tone(300+Math.random()*80,.4,.05,ev.side*.8,'sawtooth',150)}if(ev.t<=0){ev.phase='judge';ev.t=GALE.judge;tone(120,.5,.09,ev.side,'square',70)}}
  else{if(tilt*ev.side<GALE.toward)ev.bad+=dt;if(ev.bad>GALE.grace){end('dead','white');return}if(ev.t<=0)passEnd()}}
 else if(ev.type==='bog'){        // Bog: bubbles, a long shadow under the water, then it grabs: double-tap to break free
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.28;tone(140+Math.random()*60,.08,.07,0,'sine',70)}if(ev.t<=0){ev.phase='judge';ev.t=BOG.judge;dbl=0;tone(70,.5,.12,0,'sawtooth',40)}}
  else{if(dbl){dbl=0;survive();return}if(ev.t<=0){end('dead','bog');return}}}
 else if(ev.type==='crawl'){      // Crawler: a crack runs across the ice toward your feet; tap once as it arrives
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=Math.max(.12,.5*ev.t/CRAWL.warn);tone(900+Math.random()*500,.03,.06,0,'square')}if(ev.t<=0){ev.phase='judge';ev.t=CRAWL.judge;ev.js=tt;tone(220,.3,.1,0,'square',90)}}
  else{if(lastTap>ev.js){survive();return}if(ev.t<=0){end('dead','crawl');return}}}
 else if(ev.type==='howl'){       // Howler: a rhythm howled twice or thrice; repeat the same gaps with taps
  if(!ev.pat){ev.pat=R()<.5?[0,.5+R()*.2]:[0,.45,.45+.5+R()*.4];ev.pi=0;ev.pel=0}
  if(ev.phase==='warn'){ev.pel+=dt;while(ev.pi<ev.pat.length&&ev.pel>=ev.pat[ev.pi]+.4){tone(200,.28,.1,0,'sawtooth',120);ev.pi++}if(ev.t<=0&&ev.pi>=ev.pat.length){ev.phase='judge';ev.t=HOWL.judge;ev.js=tt;tapQ=[]}else if(ev.t<=0)ev.t=.05}
  else{const q=tapQ.filter(x=>x>=ev.js);if(q.length>=ev.pat.length){let ok=true;for(let i=1;i<ev.pat.length;i++)if(Math.abs((q[i]-q[i-1])-(ev.pat[i]-ev.pat[i-1]))>.25)ok=false;if(ok){survive();return}end('dead','howl');return}if(ev.t<=0){end('dead','howl');return}}}
 else if(ev.type==='flick'){      // Flick: a swarm of false lights; light your torch (bottom of the screen) or hide on the other side
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){ev.snd=.3;tone(1200+Math.random()*900,.06,.04,rnd(-.8,.8),'sine')}if(ev.t<=0){ev.phase='judge';ev.t=FLICKG.judge;tone(400,.4,.08,0,'triangle',900)}}
  else{if(torchTap&&bag.torch>0){torchTap=0;bag.torch--;survive();return}if(away<REACH.away)ev.bad+=dt;if(ev.bad>REACH.grace&&!(bag.torch>0&&ev.t>.6)){end('dead','flick');return}if(ev.t<=0){if(away>=REACH.away||ev.ok){survive();return}end('dead','flick');return}}}
 else if(ev.type==='bell'){
  if(ev.phase==='warn'){
   if(ev.rung<2&&ev.t<=1.8-.9*ev.rung){ev.rung++;ev.ring=tt;tone(330,.9,.1,ev.side*.5,'sine');tone(662,.7,.04,ev.side*.5,'sine')}
   if(ev.t<=0){ev.phase='judge';ev.t=BELL.judge;ev.js=tt;ev.down=headDown;ev.ring=tt;tone(330,1.1,.12,ev.side*.5,'sine');tone(662,.9,.05,ev.side*.5,'sine')}}
  else{if(headDown)ev.down=true;if(ev.down&&!headDown){headDown=false;end('dead','bell');return}if(BELL.judge-ev.t>BELL.grace&&!headDown){end('dead','bell');return}if(ev.t<=0){headDown=false;survive()}}}
 else{
  if(itemTap){const sd=itemTap;itemTap=0;if(itemsUp()&&ev.items[sd]!==undefined&&(sd===ev.side||ev.items[sd])){if(sd===ev.side){survive();return}end('dead',wkWhy('Move'));return}}
  if(ev.phase==='warn'){ev.snd-=dt;if(ev.snd<=0){if(ev.gh==='glass'){ev.snd=.45;tone(2300+Math.random()*700,.05,.04+.05*(1-ev.t/WALK.warn),rnd(-.6,.6),'sine')}else if(ev.gh==='ash'){ev.snd=.13;tone(200+Math.random()*90,.06,.03+.06*(1-ev.t/WALK.warn),rnd(-.9,.9),'sawtooth',110)}else{ev.snd=.6;tone(70,.08,.02+.1*(1-ev.t/WALK.warn),0,'sine')}}
   if(ev.t<=0){ev.phase='judge';ev.t=WALK.judge*(ev.boss?1.2:1);if(ev.gh==='hush'){tone(95,.5,.22,0,'sawtooth',35);tone(1400,.3,.08,0,'square',300);shake=.5}else if(ev.gh==='glass'){tone(3200,.35,.1,0,'square',700)}else if(ev.gh==='ash'){tone(160,.5,.12,0,'sawtooth',60)}}}
  else if(ev.t<=0){if(ev.fake){survive();return}end('dead',wkWhy('Late'));return}}
}
/* ---- drawing ---- */
function lampLevel(){return 1}
/* ---- items, campfire, options (landscape 800x450, first person) ---- */
const stageEl=c.parentNode||{};
const isRot=()=>!!(stageEl.classList&&stageEl.classList.contains('peek-rot'));
const cxy=e=>{const r=c.getBoundingClientRect();
 if(isRot())return[(e.clientY-r.top)*W/(r.height||W),(r.left+r.width-e.clientX)*H/(r.width||H)];   // stage turned 90deg for portrait phones
 return[(e.clientX-r.left)*W/(r.width||W),(e.clientY-r.top)*H/(r.height||H)]};
function giveItem(k){
 if(k==='torch'){bag.torch=Math.min(3,bag.torch+1);fx('img:item-torch',CX,150)}
 else if(k==='charm'){bag.charm=Math.min(2,bag.charm+1);fx('img:item-charm',CX,150)}
 else if(k==='chest'){giveItem('torch');giveItem('charm');return}
 else if(k==='rook'){giveItem(R()<.5?'torch':'charm');return}
 else{scrolls++;try{localStorage.setItem('deep-sea-peek-scrolls',scrolls)}catch(e){}fx(k==='nib'?'Nib 塞給你一卷軸':'撿到舊卷軸',CX,150,'#e8c675');
  if(scrolls%3===0){if(L&&!practice&&!daily){lives=Math.min(5,lives+1);sv();fx('三卷湊齊：+1 命',CX,118,'#ffd98a')}else{bag.charm=Math.min(2,bag.charm+1);fx('三卷湊齊：+1 護身符',CX,118,'#ffd98a')}}
  else fx('卷軸 '+scrolls%3+'/3',CX,118,'#e8c675')}
 mark(k==='nib'?'nib':k)}
function spawnDrop(kind){const r=R();dropped=true;drops.push({k:kind||(r<.4?'torch':r<.7?'charm':'scroll'),side:R()<.5?-1:1,z:1});mark(kind==='rook'?'rook':kind==='chest'?'chest':'flick')}
function collect(d){d.z=-1;giveItem(d.k);say('撿到'+ITEM_NAME[d.k]+'：'+ITEM_DESC[d.k]+'。','win')}
function updateDrops(dt,covered,pk){
 if(!covered){
  if(!ev){dropT-=dt;if(dropT<=0){if(drops.length<2)spawnDrop();dropT=rnd(DROP_EVERY[0],DROP_EVERY[1])}}
  if(guarantee&&!dropped&&prog>=8&&!ev&&drops.length<2)spawnDrop(L&&L.l>=41&&L.l<=43&&bag.torch<1?'torch':noDrop>=6?'charm':R()<.5?'torch':'scroll');   // pity: three levels without a drop guarantees one
  if(nibT>0){nibT-=dt;if(nibT<=0){drops.push({k:evK||'nib',side:R()<.5?-1:1,z:1});mark(evK||'nib')}}
  const sp=.11*dt;drops.forEach(d=>d.z-=sp)}
 if(pk){let b=null;drops.forEach(d=>{if(d.z>=0&&d.z<PICK_AT&&(!b||d.z<b.z))b=d});if(b)collect(b)}
 drops=drops.filter(d=>d.z>-.05&&d.z>=0)}
const canPick=()=>drops.some(d=>d.z>=0&&d.z<PICK_AT);
function startCamp(){camp={state:'pick',t:0,choice:-1,rest:0};ev=null;clearInput();mark('rook');if(scrolls>=3)mark('lantern');say('營火到了。選一樣帶走。')}
function updateCamp(dt){
 camp.t+=dt;
 if(camp.state==='pick'){
  if(camp.choice<0&&camp.t>CAMP_PICK_MAX)camp.choice=1;
  if(camp.choice>=0){giveItem(CAMP_CARDS[camp.choice]);camp.state='rest';camp.rest=CAMP_REST;camp.t=0}}
 else{camp.rest-=dt;if(camp.rest<=0){if(L&&!practice&&!daily&&lives<3&&healTen!==((lvl-1)/10|0)){lives++;healTen=((lvl-1)/10|0);sv();fx('img:env-campfire',CX,150)}camp=null;campNext=L?999:campNext+CAMP_EVERY;gapT=Math.max(gapT,4)}}}
function campTap(e){
 if(!camp||camp.state!=='pick')return;
 const p=cxy(e);CARDS_X.forEach((x,i)=>{if(p[0]>=x&&p[0]<=x+CARD_W&&p[1]>=CARD_Y&&p[1]<=CARD_Y+CARD_H)camp.choice=i})}
const optSave=()=>{try{localStorage.setItem('deep-sea-peek-opts',JSON.stringify({a:assist,l:lowScare,v:MASTER,c:captions,m:AMB}))}catch(e){}};
{const a=$('peek-assist'),l=$('peek-lowscare'),v=$('peek-vol');
 if(a&&a.addEventListener){a.checked=assist;a.addEventListener('change',()=>{assist=!!a.checked;optSave()})}
 if(l&&l.addEventListener){l.checked=lowScare;l.addEventListener('change',()=>{lowScare=!!l.checked;optSave()})}
 {const cp=$('peek-caps'),am=$('peek-vol-amb'),dx=$('peek-dex'),sh=$('peek-share');
  if(cp&&cp.addEventListener){cp.checked=captions;cp.addEventListener('change',()=>{captions=!!cp.checked;optSave()})}
  if(am&&am.addEventListener){am.value=Math.round(AMB*100);am.addEventListener('input',()=>{AMB=clamp((+am.value||0)/100,0,1);optSave()})}
  if(dx&&dx.addEventListener)dx.addEventListener('click',()=>{if(st==='run'){say('逃跑中不能翻圖鑑。');return}dex=true;dexPg=0;dexSel=0});
  if(sh&&sh.addEventListener)sh.addEventListener('click',()=>{if(st==='ready'||st==='run'){say('先玩一局再分享結果。');return}share()})}
 if(v&&v.addEventListener){v.value=Math.round(MASTER*100);v.addEventListener('input',()=>{MASTER=clamp((+v.value||0)/100,0,1);optSave()})}}
/* ---- scene: painted background per world, parallax by lean, first-person bob ---- */
function drawWorld(lamp){
 const wi=L?L.wi:clamp(Math.floor(prog/20),0,4),nx=Math.min(4,wi+1),into=L?0:(prog%20)/20,a=art('bg-'+WORLDS[wi]);
 g.fillStyle='#0b0f12';g.fillRect(-20,0,W+40,H);
 if(!a)return;
 const V=L?terr:null,one=(im,al)=>{const z=(V?V.z:1.12)+.015*Math.sin(run*6.28),h=H*z,w=im.naturalWidth*h/im.naturalHeight,sx=Math.max(0,(w-W)/2-40),sy=Math.max(0,(h-H)/2-8),tl=clamp(tilt,-1,1)*34*(V&&V.flip?-1:1),x=CX-w/2-tl+Math.sin(run*3.1)*5+(V?V.fx*sx*.6:0),y=(H-h)/2-Math.abs(Math.sin(ph))*(st==='run'?6:2)+(V?V.fy*sy*.7:0);g.save();g.globalAlpha=al;if(V&&V.flip){g.translate(CX,0);g.scale(-1,1);g.translate(-CX,0)}g.drawImage(im,x,y,w,h);g.restore()};
 one(a,1);
 if(wi<4&&into>.92){const b=art('bg-'+WORLDS[nx]);if(b)one(b,(into-.92)/.08)}
 if(V&&V.tint){g.fillStyle=V.tint;g.fillRect(0,0,W,H)}
 if(V&&V.fog>.05){const fgm=art('env-fog');if(fgm){g.save();g.globalAlpha=V.fog*.3;[0,1].forEach(i=>g.drawImage(fgm,((tt*9+i*W)%(2*W))-W,H-330,W+40,330));g.restore()}}
 if(L&&st!=='ready')drawExit(wi);
 const fg=g.createLinearGradient(0,280,0,H);fg.addColorStop(0,'rgba(8,10,14,0)');fg.addColorStop(1,'rgba(8,10,14,.6)');g.fillStyle=fg;g.fillRect(0,280,W,H-280);
 const vg=g.createRadialGradient(CX,240,150,CX,240,520);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(lamp<1){g.fillStyle='rgba(0,0,0,'+(1-lamp)*.85+')';g.fillRect(0,0,W,H)}}
function drawExit(wi){   // no door: the way out is a soft light at the end of the road that swells as you close in
 const f=clamp(prog/100,0,1),h=14+170*Math.pow(f,1.6),x=CX-clamp(tilt,-1,1)*10,by=262,col=['255,225,150','170,150,255','150,255,200','200,230,255','255,150,70'][wi]||'255,225,150',pulse=1+.06*Math.sin(tt*2.2);
 g.save();const gl=g.createRadialGradient(x,by-h*.45,h*.05,x,by-h*.45,h*1.5*pulse);gl.addColorStop(0,'rgba('+col+',.8)');gl.addColorStop(.35,'rgba('+col+',.35)');gl.addColorStop(1,'rgba('+col+',0)');
 g.fillStyle=gl;g.fillRect(x-h*1.6,by-h*2.1,h*3.2,h*2.6);g.restore()}
function sprite(im,cx,by,h,al){const w=im.naturalWidth*h/im.naturalHeight;g.save();g.globalAlpha=clamp(al,0,1)*.4;g.fillStyle='#000';g.beginPath();g.ellipse(cx,by,w*.32,7,0,0,7);g.fill();g.globalAlpha=clamp(al,0,1);g.drawImage(im,cx-w/2,by-h,w,h);g.restore();return w}
function floatImg(im,cx,cy,sz,al){const w=im.naturalWidth*sz/Math.max(im.naturalWidth,im.naturalHeight),h=im.naturalHeight*sz/Math.max(im.naturalWidth,im.naturalHeight);g.save();g.globalAlpha=clamp(al==null?1:al,0,1);g.drawImage(im,cx-w/2,cy-h/2,w,h);g.restore()}
function blob(x,y,r,al,col){g.save();g.globalAlpha=clamp(al,0,1);g.fillStyle=col||'#1a0f14';g.beginPath();g.ellipse(x,y,r,r*1.5,0,0,7);g.fill();g.restore()}
function drawSpirits(){
 if(!ev)return;
 const el=ev.el||0,vis=Math.max(0,el-SOUND_LEAD),w=ev.warn||(ev.type==='eye'?EYE.warn:TWIN.warn),open=ev.phase==='judge'?1:ev.phase==='gap'?.1:clamp(vis/Math.max(.1,w-SOUND_LEAD),0,1);
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
 else if(ev.type==='tail'){   // a long shadow creeps up from behind; the bar shows how far ahead you are; it lunges in from one side
  const f=ev.phase==='warn'?clamp(ev.el/ev.warn,0,1)*.3:ev.phase==='chase'?.3+.7*(1-ev.d):1;
  g.save();g.fillStyle='rgba(0,0,0,'+(.25+.5*f)+')';g.beginPath();g.ellipse(CX,H+30,110+330*f,26+130*f,0,0,7);g.fill();
  if(f>.45){g.fillStyle='rgba(255,90,40,'+(.3+.6*f)+')';[-1,1].forEach(q=>{g.beginPath();g.ellipse(CX+q*(26+20*f),H-20-70*f,5+4*f,3+3*f,0,0,7);g.fill()})}
  g.restore();
  if(ev.phase==='chase'){RR(CX-100,H-70,200,12,6,'rgba(255,255,255,.18)');RR(CX-100,H-70,Math.max(5,200*ev.d),12,6,ev.d<.3?'#ff6a4d':'#9fe8ff');tx('連點！拉開距離',CX,H-78,16,'#ffd98a')}
  if(judge){const lim=art('ghost-dread');if(lim)sprite(lim,sx+Math.sin(tt*30)*3,by,360,.95);else blob(sx,by-40,70,.9,'#0a0508')}}
 else if(ev.type==='twins'){     // crows scatter off the branch, then Knocker raps on the wood from that side
  const cr=ev.col?null:art('env-crows'),im=art(ev.col?'ghost-colossus':'ghost-thorn');
  if(ev.col){const nowSide=ev.phase==='warn'&&ev.si>0?ev.steps[ev.si-1][1]:ev.side,cx2=CX+nowSide*SIDE*.8;if(im)sprite(im,cx2+(judge?Math.sin(tt*26)*3:0),by+30,judge?430:150+260*Math.pow(open,1.3),judge?.95:Math.pow(open,1.2)*.8)}
  else if(cr){g.save();g.shadowColor='rgba(200,220,255,.95)';g.shadowBlur=16;floatImg(cr,sx,190-open*130,250,(1-open)*.95+.05);g.restore()}
  else if(im)sprite(im,sx+(judge?Math.sin(tt*30)*3:0),by,300*(.9+.1*open),judge?.95:Math.pow(open,1.4)*.7);else blob(sx,by-60,40,judge?.9:open*.6,'#d0d8ff');}
 else if(ev.type==='gale'){        // Gale: leaves turn against the wind, then something drags in from that side
  const sw=art('env-leaf-swirl'),im=art('ghost-gale');
  if(sw){g.save();g.translate(sx,300);g.rotate(-tt*1.6*ev.side);floatImg(sw,0,0,200,judge?.5:Math.min(1,open*1.3));g.restore()}
  if(im)sprite(im,sx+ev.side*(judge?0:40*(1-open)),by,330,judge?.95:Math.pow(open,1.5)*.6);else blob(sx,by-60,40,open*.7,'#7f9a8a')}
 else if(ev.type==='reach'){     // Reacher: the soil bulges and mud bubbles on one side, then a hand claws out
  const im=art('ghost-reacher'),bx=sx;
  g.save();g.fillStyle='rgba(40,30,22,'+(.25+.45*open)+')';g.beginPath();g.ellipse(bx,by+4,30+50*open,6+9*open,0,0,7);g.fill();
  {const bb=art('fx-bubbles');if(bb)floatImg(bb,bx,by-50*open,40+120*open,.85*open)}g.restore();
  if(im)sprite(im,bx+(judge?Math.sin(tt*30)*3:0),by,(judge?290:180)*(.5+.5*open),judge?.95:Math.pow(open,1.6)*.75);else blob(bx,by-40,30,open*.7,'#8a7a62')}
 else if(ev.type==='magma'){     // Magma: the ground glows red, one side smokes, something burns up out of the smoke
  const im=art('ghost-magma');g.save();g.fillStyle='rgba(255,70,20,'+(.05+.06*open)+')';g.fillRect(0,0,W,H);
  {const lv=art('fx-lava');if(lv)floatImg(lv,sx,by-40,150+250*open,.95*open)}g.restore();
  if(im)sprite(im,sx+(judge?Math.sin(tt*30)*3:0),by,(judge?300:190)*(.5+.5*open),judge?.95:Math.pow(open,1.6)*.75);else blob(sx,by-40,34,open*.7,'#a33')}
 else if(ev.type==='white'){     // Whiteout: the world goes white, one side flashes with the mouth of a snow cave
  const im=art('ghost-whiteout');g.save();g.fillStyle='rgba(240,246,255,'+(.55*open)+')';g.fillRect(0,0,W,H);
  const gl=g.createRadialGradient(sx,330,10,sx,330,150);gl.addColorStop(0,'rgba(255,255,255,'+(.4+.5*Math.abs(Math.sin(tt*6)))+')');gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(sx-160,170,320,300);g.restore();{const cv2=art('fx-snowcave');if(cv2)sprite(cv2,sx,by+14,60+150*open,.5+.45*Math.abs(Math.sin(tt*5))*open)}
  if(im&&judge)sprite(im,CX-ev.side*60,by,300,.6)}
 else if(ev.type==='bog'){       // Bog: bubbles, a long shadow under the water, then it rises and grabs
  const im=art('ghost-bog'),bx=CX;g.save();g.fillStyle='rgba(16,30,26,'+(.3+.4*open)+')';g.beginPath();g.ellipse(bx,by+6,50+90*open,8+14*open,0,0,7);g.fill();
  {const bb=art('fx-bubbles');if(bb)floatImg(bb,bx,by-60*open,60+180*open,.85*open)}g.restore();
  if(im)sprite(im,bx,by,(judge?340:200)*(.5+.5*open),judge?.95:Math.pow(open,1.6)*.7);else blob(bx,by-40,40,open*.7,'#1d2d28')}
 else if(ev.type==='crawl'){     // Crawler: a crack runs across the ice toward your feet
  const im=art('ghost-crawler'),pr=judge?1:open;{const cr=art('fx-crack');if(cr)floatImg(cr,CX+ev.side*220*(1-pr),250+pr*140,60+340*pr,.3+.6*pr)}
  if(im&&judge)sprite(im,CX,by+10,300,.9)}
 else if(ev.type==='howl'){      // Howler: a far shape in the blizzard; rings pulse with each howl
  const im=art('ghost-howler');for(let i=0;i<(ev.pi||0);i++){const age=Math.max(0,(ev.pel||0)-(ev.pat[i]+.4));if(age<.8){g.save();g.strokeStyle='rgba(220,235,255,'+(.5*(1-age/.8))+')';g.lineWidth=3;g.beginPath();g.arc(CX,230,40+age*260,0,7);g.stroke();g.restore()}}
  if(im)sprite(im,CX,by-30,judge?280:(120+130*open),judge?.8:Math.pow(open,1.4)*.6)}
 else if(ev.type==='flick'){     // Flick: a swarm of false lights drifts toward you; the real answer is a torch
  const im=art('guide-flick'),ti=art('item-torch');g.save();for(let i=0;i<14;i++){const p2=(tt*.35+i*.071)%1,z=judge?1:open,x=CX+Math.sin(i*2.3+tt)*(60+300*p2*z),y=240+p2*z*150+Math.sin(tt*2+i)*8;g.fillStyle='rgba(120,255,200,'+(.7*(1-p2*.4)*Math.max(.2,z))+')';g.shadowColor='#7fffd4';g.shadowBlur=12;g.beginPath();g.arc(x,y,3+p2*7*z,0,7);g.fill()}g.restore();
  if(im&&judge)sprite(im,CX,by-20,220,.85);
  if(ti&&bag.torch>0&&(judge||ev.t<1.2)){g.save();g.shadowColor='#ffb347';g.shadowBlur=20;sprite(ti,CX,445,100,.95);g.restore()}}
 else if(ev.type==='bell'){      // Bellkeeper: a bell tolls three times in the dark, then it stands over you
  const im=art('ghost-bellkeeper'),since=tt-(ev.ring||-9),flashA=clamp(1-since/.6,0,1);
  if(flashA>0){g.save();g.fillStyle='rgba(255,230,160,'+(.12*flashA)+')';g.fillRect(0,0,W,H);g.restore()}
  if(im)sprite(im,sx+ev.side*-60*(1-open),by,judge?330:240*(.7+.3*open),judge?.9:Math.pow(open,1.5)*.55);else blob(sx,by-60,40,open*.7,'#2a2a2a');}
 else{                           // Hush: the crickets stop, the lamp flickers, fog rolls in and something walks toward you
  const fg=art('env-fog'),im=ev.gh==='hush'?art('ghost-wraith'):art(ev.gh==='hollow'?'ghost-hollow':ev.gh==='ash'?'ghost-ash':'ghost-glassface'),p=judge?1:clamp(1-ev.t/WALK.warn,0,1);
  if(ev.gh==='glass'){g.save();const fr=g.createRadialGradient(CX,240,170,CX,240,520);fr.addColorStop(0,'rgba(210,235,255,0)');fr.addColorStop(1,'rgba(210,235,255,'+(.62*p)+')');g.fillStyle=fr;g.fillRect(0,0,W,H);g.restore()}   // Glassface: frost creeps in from the edges
  if(ev.gh==='ash'){g.save();g.fillStyle='rgba(30,14,8,'+(.4*p)+')';g.fillRect(0,0,W,H);const cr=art('env-crows');if(cr){g.shadowColor='rgba(255,120,40,.6)';g.shadowBlur=12;floatImg(cr,((tt*150)%(W+500))-250,120+20*Math.sin(tt*2),230,.25+.7*p);floatImg(cr,W+250-((tt*110+300)%(W+500)),170,170,.2+.5*p)}g.restore()}   // Ash: the sky darkens and crows wheel overhead
  if(fg){g.save();g.globalAlpha=.15+.55*p;g.drawImage(fg,-40,H-250,W+80,250);g.restore()}
  if(ev.gh==='hush'){if(judge&&im){g.save();g.fillStyle='rgba(255,255,255,'+clamp(.35-(ev.t<WALK.judge?(WALK.judge-ev.t)*.6:0),0,.35)+')';g.fillRect(0,0,W,H);g.restore();sprite(im,CX+Math.sin(tt*60)*5,by+30,440,1)}}   // Hush: nothing visible while it comes, then it is simply there
  else if(im)sprite(im,CX,by-8,(ev.boss?110:90)+(ev.boss?360:300)*p,clamp(.2+p*1.1,0,1));else blob(CX,by-60,20+60*p,.3+p*.6,'#08060a')}}
function drawEvItems(){   // the two props on the road: one is the ghost's weakness (tap that side), the other is a decoy (or empty the first time you meet the ghost)
 if(!itemsUp())return;
 const f=ev.phase==='judge'?1:clamp((ITEM_SHOW-ev.t)/1.2,0,1);
 [-1,1].forEach(sd=>{const k=ev.items[sd];if(!k)return;const im=art(k);if(!im)return;const x=CX+sd*(540-300*f),h=k==='item-hammer'?110:k==='item-lantern'?190:150,bob=Math.sin(tt*3+sd)*4;
  g.save();g.shadowColor='#ffd98a';g.shadowBlur=14*f;sprite(im,x,392+bob,h*(.6+.4*f),f);g.restore()})}
function drawDrops(){
 drops.forEach(d=>{
  const s=1-d.z,x=CX+d.side*(90+(SIDE+30-90)*s),y=300+95*s+Math.sin(tt*3+d.side)*3,sz=44+70*s,im=d.k==='nib'?art('npc-nib'):art(d.k==='scroll'||d.k==='chest'?'item-chest':d.k==='rook'?'npc-rook':'item-'+d.k),near=d.z<PICK_AT;
  g.save();if(near){g.shadowColor='#ffd98a';g.shadowBlur=18}
  if(d.k==='nib'&&!im){g.fillStyle='#6b4a32';g.beginPath();g.ellipse(x,y,sz*.3,sz*.22,0,0,7);g.fill();g.fillStyle='#e8d8b8';g.beginPath();g.arc(x-sz*.1,y-sz*.05,3,0,7);g.arc(x+sz*.1,y-sz*.05,3,0,7);g.fill()}
  else if(im)floatImg(im,x,y,sz,1);else{g.fillStyle=d.k==='torch'?'#ffb347':d.k==='charm'?'#7fe8ff':'#e8c675';g.beginPath();g.arc(x,y,sz*.3,0,7);g.fill()}
  g.restore();
  })}
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
function wrapLines(s,sz,wd){const I=typeof window!=='undefined'&&window.deepSeaI18n;if(I&&I.getLanguage&&I.getLanguage()==='en'){const per=Math.max(6,Math.floor(wd/(sz*.52))),o=[];let cur='';I.text(s).split(' ').forEach(w=>{if(cur&&(cur+' '+w).length>per){o.push(cur);cur=w}else cur=cur?cur+' '+w:w});if(cur)o.push(cur);return o.slice(0,12)}const n=Math.max(2,Math.floor(wd/sz)),o=[];for(let i=0;i<s.length&&o.length<12;i+=n)o.push(s.slice(i,i+n));return o}
function txp(s,x,y,sz,col,mw){sz=Math.max(sz,MINSZ);g.font='800 '+sz+'px '+FB;g.textAlign='center';g.fillStyle=col;g.fillText(s,x,y,mw||W-24)}   // plain text for parchment
function txd(s,x,y,sz,col,wd,maxL){sz=Math.max(sz,MINSZ);g.font='700 '+sz+'px '+FB;g.textAlign='center';g.fillStyle=col;wrapLines(s,sz,wd).slice(0,maxL||12).forEach((ln,i)=>g.fillText(ln,x,y+i*(sz+4)))}
/* ---- headphone check card (first screen) ---- */
const HP={x:CX-220,y:56,w:440};
function hpRect(k){
 const h=HP.w*432/578,f=k==='spk'?[.25,.78,.22,.1]:[.53,.78,.23,.1];
 return[HP.x+HP.w*f[0],HP.y+h*f[1],HP.w*f[2],h*f[3]]}
function hpClick(e){
 const p=cxy(e),inR=r=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];
 if(inR(hpRect('spk'))){audioInit();tone(660,.18,.08,-1,'sine');setTimeout(()=>tone(660,.18,.08,1,'sine'),320);say('先左耳、再右耳各一聲。聽得到就按勾勾。');return true}
 if(inR(hpRect('ok'))){audioInit();audioOk=true;if(!tutDone){start();return true}say('耳機確認完成。按「開始逃跑」。');return true}
 return false}
function drawHeadphone(){
 const im=art('ui-headphone'),h=HP.w*432/578;
 if(im)g.drawImage(im,HP.x,HP.y,HP.w,h);else RR(HP.x,HP.y,HP.w,h,14,'#3a2c1c',3);
 const en=typeof window!=='undefined'&&window.deepSeaI18n&&window.deepSeaI18n.getLanguage&&window.deepSeaI18n.getLanguage()==='en';
 txp('戴上耳機更容易躲',CX,HP.y+h*.40,en?19:26,'#3a2812',HP.w*.6);
 txd('開聲音、戴耳機更容易聽出方向。按喇叭試聽左右各一聲，再按勾勾開始。',CX,HP.y+h*.47,en?13:16,'#3a2812',HP.w*.6,en?7:4);
 for(const k of ['spk','ok']){const r=hpRect(k);if(!im){RR(r[0],r[1],r[2],r[3],8,'#5a4228',2);tx(k==='spk'?'聲音':'確認',r[0]+r[2]/2,r[1]+r[3]*.7,16,'#f1d9a6')}}}
const CAPS={eye:['（左邊的落葉沙沙作響）','（右邊的落葉沙沙作響）'],twins:['（左邊傳來敲擊聲）','（右邊傳來敲擊聲）'],walker:['（蟲鳴停了……左右出現了道具）','（蟲鳴停了……左右出現了道具）'],gale:['（風向反了，拖行聲從左邊靠近）','（風向反了，拖行聲從右邊靠近）'],reach:['（左邊的泥水在冒泡）','（右邊的泥水在冒泡）'],bell:['（遠處傳來鐘聲）','（遠處傳來鐘聲）'],bog:['（水面冒著泡）','（水面冒著泡）'],crawl:['（冰面咯吱作響）','（冰面咯吱作響）'],magma:['（左邊冒著煙）','（右邊冒著煙）'],white:['（左邊閃著白光）','（右邊閃著白光）'],flick:['（螢火飄過來了）','（螢火飄過來了）'],howl:['（遠處傳來嚎叫）','（遠處傳來嚎叫）']};
const capText=d=>(CAPS[d.type]||['',''])[d.side<0?0:1];
function hud(I,lamp){
 const bn=art('ui-banner'),bw=420,bh=82,title=(L?'第 '+lvl+' 關':(tut?'教學':practice?'練習':'自由跑　'+Math.floor(prog)+'%')),bar=!L&&!tut;
 if(bn){g.drawImage(bn,10,8,bw,bh);
  const x0=10+bw*.2,wd=bw*.73;if(bar)RR(x0,8+bh*.32,wd,bh*.34,6,'rgba(60,40,20,.35)');if(bar&&prog>0)RR(x0,8+bh*.32,Math.max(12,wd*prog/100),bh*.34,6,prog>=85?'#c4472f':'#b98a2c');
  tx(title,x0+wd/2,8+bh*.6,17,'#f6e7c0')}
 else{if(bar)RR(16,14,W-32,14,7,'rgba(255,255,255,.12)');if(bar&&prog>0)RR(16,14,Math.max(16,(W-32)*prog/100),14,7,prog>=85?'#ff6a4d':'#e8c675');tx(title,16,50,15,'#f1d9a6','left')}
 const lv=art('ui-lives');
 if(lv){const lw=300,k=lw/578,sy=112,sh=190,lx=W-lw-10,ly=14;g.drawImage(lv,0,sy,578,sh,lx,ly,lw,sh*k);
  const oy=ly+(.49*432-sy)*k+4,fr=[.42,.61,.805];
  if(L){fr.forEach((f,i)=>{if(lives<=i){g.fillStyle='rgba(10,12,16,.78)';g.beginPath();g.arc(lx+lw*f,oy-4,19,0,7);g.fill()}});
   tx('生命'+(lives>3?' +'+(lives-3):''),lx+lw*.61,ly+sh*k+12,12,'#f1d9a6')}
  else{const vals=[bag.torch,bag.charm,scrolls%3+'/3'];fr.forEach((f,i)=>tx(String(vals[i]),lx+lw*f,oy,i===2?13:16,(i===2?scrolls%3:vals[i])?'#fff':'#789'));
   tx('火把',lx+lw*.42,ly+sh*k+12,12,'#f1d9a6');tx('護身符',lx+lw*.61,ly+sh*k+12,12,'#f1d9a6');tx('卷軸',lx+lw*.805,ly+sh*k+12,12,'#f1d9a6')}}
 else tx(L?'生命 '+lives:'火把'+bag.torch+' 護身符'+bag.charm+' 卷軸'+scrolls%3+'/3',W-16,50,15,'#f1d9a6','right');
 if(L)tx('火把 '+bag.torch+'　護身符 '+bag.charm+'　卷軸 '+scrolls%3+'/3',16,108,13,'#f1d9a6','left');
 if((captions||tutHelp())&&ev&&!ev.fake)tx(capText(ev),CX,176,16,'#cfe8ff');
 if(ev&&(assist||ev.torch||tutHelp())){   // assist mode / torch: mark the dangerous side and the safe side
  if(ev.torch&&!ev.fake){g.save();g.fillStyle='rgba(255,170,70,'+(.05+.025*Math.sin(tt*7))+')';g.fillRect(0,0,W,H);g.restore()}   // torchlight: a warm flicker over the whole scene
  const dg=ev.type==='walker'||ev.type==='bell'?0:ev.type==='gale'?-ev.side:ev.side,col=ev.torch?'#ffb347':'#ffd98a';
  if(dg){const dx=CX+dg*340;g.save();g.fillStyle='#ff5a4d';g.globalAlpha=.8;g.beginPath();g.moveTo(dx+dg*22,170);g.lineTo(dx-dg*10,150);g.lineTo(dx-dg*10,190);g.closePath();g.fill();g.restore();
   const sxm=CX-dg*340;g.save();g.fillStyle=col;g.globalAlpha=.8;g.beginPath();g.moveTo(sxm-dg*22,170);g.lineTo(sxm+dg*10,150);g.lineTo(sxm+dg*10,190);g.closePath();g.fill();g.restore();
   if(assist){const sp=art('env-stump');if(sp)sprite(sp,sxm+(-dg)*10,300,110,.55)}}
}
 if(assist){const cp=art('ui-compass');if(cp)floatImg(cp,CX,300,70,.85)}
 if(L&&seedCode)tx('種子 '+seedCode,W-10,H-6,11,'rgba(241,217,166,.6)','right')}
/* ---- end-of-round buttons (retry / listen again / codex / later) ---- */
let endBtns=[];
function btnImg(x,y,w,h,label,dis,sz){const fb=art('ui-frame-btn');g.save();if(dis)g.globalAlpha=.4;const pad=Math.min(8,h*.14);if(fb)g.drawImage(fb,x-pad,y-pad,w+pad*2,h+pad*2);else RR(x,y,w,h,8,'#5a4228',2);txp(label,x+w/2,y+h/2+(sz||16)*.35,sz||16,'#f6dfa8',w-14);g.restore()}
function btnRow(items){
 endBtns=[];const w=156,h=58,gap=2,n=items.length,x0=CX-(n*w+(n-1)*gap)/2,y=H-72,fb=art('ui-frame-btn');
 items.forEach((it,i)=>{const x=x0+i*(w+gap);endBtns.push([x+8,y+8,w-16,h-16,it[1]]);if(fb)g.drawImage(fb,x,y,w,h);else RR(x,y,w,h,10,'#5a4228',3);txp(it[0],x+w/2,y+h/2+6,17,'#f6dfa8',w-34)})}
function deathClick(e){
 if(st==='over'&&scareT>0)return true;
 const p=cxy(e);
 for(const b of endBtns)if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3]){doAct(b[4]);return true}
 return false}
function doAct(a){
 if(a==='retry'||a==='next')start();
 else if(a==='listen')playCue(deathEv);
 else if(a==='dex'){dex=true;dexPg=0;dexSel=0}
 else if(a==='later'){st='ready';reset();endBtns=[];say('慢慢來。選好關卡再按「開始」。')}
 else if(a==='assist'){assist=true;optSave();const el=$('peek-assist');if(el)el.checked=true;say('已開啟輔助標記。','win')}
 else if(a==='share')share()}
const later=(f,ms)=>{try{setTimeout(f,ms)}catch(e){f()}};
function playCue(d){
 if(!d)return;audioInit();const s=d.side||1;
 const seq=d.type==='eye'?[[0,100,.12,.05,s*.7,'sawtooth'],[.5,100,.12,.05,s*.7,'sawtooth'],[1,100,.12,.05,s*.7,'sawtooth'],[1.5,520,.3,.07,s*.7,'square',380]]
  :d.type==='tail'?[[0,64,.08,.1,0,'sine',44],[.5,64,.08,.1,0,'sine',44],[.9,64,.08,.12,0,'sine',44],[1.2,64,.08,.14,0,'sine',44],[1.4,64,.08,.16,0,'sine',44],[1.55,64,.08,.18,0,'sine',44],[1.8,220,.35,.22,s,'sawtooth',60]]
  :d.type==='colossus'?[[0,46,.4,.26,-s,'sine',28],[.85,46,.4,.26,s,'sine',28],[1.7,46,.4,.26,-s,'sine',28],[2.55,46,.4,.26,s,'sine',28]]
  :d.type==='twins'?[[0,150,.07,.1,s,'square',90],[.38,150,.07,.1,s,'square',90],[.76,150,.07,.1,s,'square',90]]
  :d.type==='reach'?[[0,55,.16,.07,s*.7,'sine',40],[.45,55,.16,.07,s*.7,'sine',40],[.9,55,.16,.07,s*.7,'sine',40],[1.4,210,.4,.08,s*.7,'square',90]]
  :d.type==='bell'?[[0,330,.9,.1,s*.5,'sine'],[.9,330,.9,.1,s*.5,'sine'],[1.8,330,1.1,.12,s*.5,'sine']]
  :d.type==='gale'?[[0,260,.35,.06,s*.8,'sawtooth',120],[.5,260,.35,.06,s*.8,'sawtooth',120],[1,260,.35,.06,s*.8,'sawtooth',120],[1.6,110,.5,.09,s,'square',70]]
  :d.type==='bog'?[[0,140,.08,.07,0,'sine',70],[.28,160,.08,.07,0,'sine',70],[.56,150,.08,.07,0,'sine',70],[1,70,.5,.12,0,'sawtooth',40]]
  :d.type==='crawl'?[[0,900,.03,.06,0,'square'],[.4,1100,.03,.06,0,'square'],[.7,1000,.03,.06,0,'square'],[.9,1200,.03,.06,0,'square'],[1.1,220,.3,.1,0,'square',90]]
  :d.type==='magma'?[[0,60,.18,.08,s*.6,'sawtooth',45],[.4,60,.18,.08,s*.6,'sawtooth',45],[.8,60,.18,.08,s*.6,'sawtooth',45],[1.3,180,.45,.09,s*.6,'square',70]]
  :d.type==='white'?[[0,300,.4,.05,s*.8,'sawtooth',150],[.5,300,.4,.05,s*.8,'sawtooth',150],[1.1,120,.5,.09,s,'square',70]]
  :d.type==='flick'?[[0,1200,.06,.04,-.5,'sine'],[.3,1500,.06,.04,.5,'sine'],[.6,1300,.06,.04,0,'sine'],[1,400,.4,.08,0,'triangle',900]]
  :d.type==='howl'?[[0,200,.28,.1,0,'sawtooth',120],[.5,200,.28,.1,0,'sawtooth',120],[1.05,200,.28,.1,0,'sawtooth',120]]
  :[[0,70,.08,.1,0,'sine'],[.6,70,.08,.1,0,'sine'],[1.2,70,.08,.1,0,'sine']];
 seq.forEach(q=>later(()=>tone(q[1],q[2],q[3],q[4],q[5],q[6]),q[0]*1000));
 say('再聽一次：'+capText(d)+(d.type==='eye'?'　然後紅光射出。':d.type==='twins'?'　之後要躲進另一側。':d.type==='gale'?'　要躲進風來的那一側。':d.type==='reach'?'　要躲進另一側。':d.type==='bell'?'　第三下之後要低頭，直到鐘聲散去。':d.type==='bog'?'　要連點兩下。':d.type==='crawl'?'　要在裂縫到腳邊時點一下。':d.type==='magma'?'　要躲進沒冒煙的一側。':d.type==='white'?'　要躲進閃光的一側。':d.type==='flick'?'　要點亮火把，或躲進另一側。':d.type==='howl'?'　要照牠的節奏點。':'　要點對牠怕的道具。'))}
const causeText=k=>{const I=typeof window!=='undefined'&&window.deepSeaI18n;let t=CAUSES[k]||'';if(I&&I.text)t=I.text(t);return t.replace(/^(死因|Cause) #\d+:? ?/,'')};   // translate the whole line first, then drop the numbering
const shareText=()=>'《別看 Don\'t Peek》'+(L?'第 '+lvl+' 關':'自由跑')+(seedCode?'・種子 '+seedCode:'')+'：躲過 '+survived+' 次襲擊，'+(st==='won'?'衝出去了！':causeText(why)+'。');
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
 x.textAlign='left';x.fillStyle='#e8c675';x.font='800 64px '+FB;x.fillText('別看 Don\'t Peek',60,110);
 x.fillStyle='#f1d9a6';x.font='700 34px '+FB;
 wrapLines(t.replace(/^《[^》]*》/,''),34,720).forEach((ln,i)=>x.fillText(ln,60,200+i*48));
 x.fillStyle='rgba(241,217,166,.7)';x.font='600 24px '+FB;x.fillText('yachun0728.github.io 的深海遊戲廳',60,590);
 cv.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='dont-peek-'+(seedCode||'free')+'.png';a.click()})}
const KILLER={breath:'ghost-dread',tail:'ghost-dread',colossus:'ghost-colossus',bog:'ghost-bog',crawl:'ghost-crawler',magma:'ghost-magma',flick:'guide-flick',howl:'ghost-howler',white:'ghost-whiteout',eye:'ghost-leafling',twins:'ghost-thorn',walkerLate:'ghost-wraith',walkerMove:'ghost-wraith',gale:'ghost-gale',hollowLate:'ghost-hollow',hollowMove:'ghost-hollow',reach:'ghost-reacher',bell:'ghost-bellkeeper',glass:'ghost-glassface',ash:'ghost-ash'};
const RULE_FULL={tail:'Dread從背後追來：腳步越來越急時連點螢幕（電腦按 F 或 Enter），讓距離條不要見底；最後它從一側撲來，躲進另一側。',colossus:'巨像的腳步左右交替。只看最後一步踩在哪一邊，躲進相反的另一側，撐住。共有兩輪，第二輪多一步。',eye:'落葉堆在哪一邊，那邊就有東西。紅光亮起時，躲進另一側並撐滿 3 秒。',twins:'鳥群飛走後，敲擊聲從一邊傳來。躲進敲擊的另一側；躲在敲擊那一側一定會死。',walkerLate:'蟲鳴停了，左右會各出現一件道具。靜林鬼怕燈籠：點燈籠那一側。',walkerMove:'點錯道具打不退牠。這類鬼各怕一件道具，要記住。',gale:'風向反了，拖行聲從一邊靠近。躲進風來的那一側，頂住 2 秒。',hollowLate:'首領空殼出現時左右各有一件道具，點符紙那一側。',hollowMove:'點錯道具打不退牠。空殼怕符紙。',reach:'土面鼓起、泥水冒泡的那一邊會伸出手。躲進另一側，撐住 2 秒。',bell:'鐘響三下。第三下之後要往下滑低頭，一直低著頭，直到鐘聲散去才抬頭。',breath:'Dread 一直在背後追你。躲藏時牠會越逼越近，腳步越來越急就快被找到了，鬼過去之後就出來。',bog:'水面冒泡，一道長條陰影浮上來。牠抓住你之前，連點畫面兩下掙脫。',crawl:'冰面裂縫一路延伸到腳邊。咯吱聲最急的那一刻，點一下畫面。',magma:'地面發紅，哪一邊冒煙，熔岩蟲就從那邊鑽出。躲進另一側，撐住 2 秒；牠可能折返。',flick:'成群的假螢火往你飄來。點畫面下方的火把，牠們就散了；沒有火把，躲進另一側。',howl:'風聲裡夾著 2 到 3 聲嚎叫。等牠停下，照同樣的間隔點畫面。',white:'暴雪蓋住畫面，哪一邊閃光，哪裡就是雪洞。躲進閃光那一側，撐住 2 秒；牠可能折返。',glass:'畫面起霧，一張臉貼近，左右各有一件道具。玻璃臉怕鐵鎚：點鐵鎚那一側。',ash:'天色變暗，鴉群飛過，翅膀聲拍動。左右各有一件道具，灰燼鴉群怕水桶：點水桶那一側。'};
function drawScare(){
 const behind=()=>{g.drawImage(scareSnap,0,140,W,H-210,0,140,W,H-210);const t=g.createLinearGradient(0,100,0,150);t.addColorStop(0,'#050403');t.addColorStop(1,'rgba(5,4,3,0)');g.fillStyle='#050403';g.fillRect(0,0,W,100);g.fillStyle=t;g.fillRect(0,100,W,50);const b=g.createLinearGradient(0,H-80,0,H);b.addColorStop(0,'rgba(5,4,3,0)');b.addColorStop(1,'#050403');g.fillStyle=b;g.fillRect(0,H-80,W,80)};   // the view behind you: the world mirrored, without the HUD
 const turn=!!scareSnap&&(why==='breath'||why==='tail'),T0=.42,p0=clamp(1-scareT/scareMax,0,1);
 if(turn&&p0<T0){const q=p0/T0,e=q*q*(3-2*q),x=e*W;g.fillStyle='#050403';g.fillRect(0,0,W,H);   // the whip-turn: the world slides away and the view behind you slides in, mirrored and dark
  [2,1,0].forEach(i=>{g.globalAlpha=i?.3:1;const d=i*16*(1-q*.3);g.drawImage(scareSnap,-x+d,0);g.save();g.translate(2*W-x+d,0);g.scale(-1,1);behind();g.restore()});g.globalAlpha=1;
  g.fillStyle='rgba(0,0,0,'+.5*q+')';g.fillRect(0,0,W,H);return}
 const p=turn?clamp((p0-T0)/(1-T0),0,1):p0,im=art(KILLER[why]||'ghost-wraith'),big=lowScare?.7:1;
 if(turn){g.save();g.translate(W,0);g.scale(-1,1);behind();g.restore();g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,W,H)}
 g.fillStyle='rgba(8,4,3,'+(.35+.55*p)+')';g.fillRect(0,0,W,H);
 if(im){const e=p*p,sz=(H*.55+H*1.15*e)*big,jx=lowScare?0:(Math.random()-.5)*26*e,jy=lowScare?0:(Math.random()-.5)*20*e;floatImg(im,CX+jx,H*.56+jy,sz,1)}
 const vg=g.createRadialGradient(CX,H/2,H*.25,CX,H/2,W*.62);vg.addColorStop(0,'rgba(120,0,0,0)');vg.addColorStop(1,'rgba(120,0,0,'+(.35+.5*p)+')');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(!lowScare&&p>.86){g.fillStyle='rgba(255,255,255,'+(.9*(1-(p-.86)/.14))+')';g.fillRect(0,0,W,H)}}
function drawDeath(){
 g.fillStyle='rgba(18,13,10,.8)';g.fillRect(0,0,W,H);
 const bn=art('ui-banner'),cd=art('ui-card'),n=deaths[why]||1;
 if(bn)g.drawImage(bn,CX-210,8,420,82);else RR(CX-210,8,420,82,10,'#3a2c1c',3);
 txp((lostAll?'生命用完　':'你死了　')+(L?'第 '+lvl+' 關':'停在 '+Math.floor(prog)+'%'),CX+25,58,24,'#3a2812');
 const kw=196,kh=246,ky=88,xs=[22,W-22-kw];
 for(let i=0;i<2;i++){
  const x=xs[i];if(cd)g.drawImage(cd,x,ky,kw,kh);else RR(x,ky,kw,kh,10,'#3a2c1c',3);
  const im=art(i?(why==='flick'?'item-torch':'guide-flick'):KILLER[why]||'ghost-wraith');if(im)floatImg(im,x+kw*.49,ky+kh*.28,kw*.33,1);
  const body=i?TIPS[why]||'':causeText(why);
  txd(body,x+kw/2,ky+kh*.6,14,'#2a1a0c',kw*.64,5)}
 tx('剩餘生命 '+(L?lives:'—'),CX,ky+34,20,'#ffd98a');
 tx('躲過 '+survived+' 次襲擊',CX,ky+66,16,'#f1d9a6');
 if(lostAll)txd('整輪重來：回到第 1 關',CX,ky+96,15,'#ffb347',200,2);
 else if(L&&L.ease)txd('小螢多給你 0.3 秒預警，少來一次襲擊。',CX,ky+96,13,'#cfe8ff',200,3);
 txd(n<=1?RULE_FULL[why]||'':FLICK_TIPS[['eye','twins','walkerLate','walkerMove','gale','hollowLate','hollowMove','reach','bell','breath','bog','crawl','magma','flick','howl','white','glass','ash'].indexOf(why)]||'',CX,ky+130,14,'#cfe8ff',236,5);
 if(rec)tx('新紀錄！',CX,ky+226,16,'#ffd98a');
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
 {id:'leafling',ghost:1,img:'ghost-leafling',name:'葉下客 Leafling',type:'eye',clue:'腳邊的落葉聚成一堆，聲音很弱。',judge:'低頭看：落葉堆在哪一邊？',act:'躲進另一側，撐滿 3 秒。'},
 {id:'knocker',ghost:1,img:'ghost-thorn',name:'敲枝者 Knocker',type:'twins',clue:'鳥群飛走，接著有固定節奏的敲擊從一邊傳來。',judge:'敲擊來自哪一邊？',act:'躲進敲擊的另一側；躲在敲擊那一側會死。'},
 {id:'hush',ghost:1,img:'ghost-wraith',name:'靜林鬼 Hush',type:'walker',clue:'蟲鳴停了，沒有形體的東西靠近，左右各出現一件道具。',judge:'牠怕燈籠。',act:'點燈籠所在的那一側。點錯就死。'},
 {id:'gale',ghost:1,img:'ghost-gale',name:'逆風客 Gale',type:'gale',clue:'風向反了，葉子逆風翻動，接著有拖行聲。',judge:'拖行聲從哪一邊靠近？',act:'躲進風來的那一側，頂住 2 秒。'},
 {id:'hollow',ghost:1,img:'ghost-hollow',name:'空殼 Hollow（首領）',type:'hollow',clue:'每個世界的第 10 關，先依序面對學過的鬼，最後是牠。',judge:'牠怕符紙。',act:'點符紙所在的那一側。點錯就死。'},
 {id:'reacher',ghost:1,img:'ghost-reacher',name:'墳手 Reacher',type:'reach',clue:'土面鼓起，泥水冒泡，一側地面隆起。',judge:'哪一邊的土在鼓起？',act:'躲進另一邊，撐住 2 秒。'},
 {id:'bellkeeper',ghost:1,img:'ghost-bellkeeper',name:'守墓鐘 Bellkeeper',type:'bell',clue:'遠處的鐘敲了三下。',judge:'第三下就是信號。',act:'第三下之後往下滑低頭，一直低著頭直到鐘聲散去。'},
 {id:'glassface',ghost:1,img:'ghost-glassface',name:'玻璃臉 Glassface',type:'glass',clue:'畫面起霧，一張臉貼近。',judge:'牠怕鐵鎚。',act:'點鐵鎚所在的那一側。'},
 {id:'ash',ghost:1,img:'ghost-ash',name:'灰燼鴉群 Ash',type:'ash',clue:'天空變暗，翅膀聲。',judge:'牠怕水桶。',act:'點水桶所在的那一側。'},
 {id:'colossus',ghost:1,img:'ghost-colossus',name:'巨像 Colossus（最終首領）',type:'colossus',clue:'地面一步一步震動，腳步聲左右交替靠近。',judge:'最後一步踩在哪一邊？',act:'躲進最後一步的另一側，撐住；共兩輪，第二輪多一步。'},
 {id:'tail',ghost:1,img:'ghost-dread',name:'Dread',type:'tail',clue:'背後傳來腳步聲，越來越急。',judge:'牠在追你。',act:'連點螢幕（電腦按 F 或 Enter）拉開距離，最後牠從一側撲來，躲進另一側。'},
 {id:'bog',ghost:1,img:'ghost-bog',name:'泥沼拖行者 Bog',type:'bog',clue:'水面冒泡，一道長條陰影浮上來。',judge:'牠抓住你之前。',act:'連點畫面兩下。'},
 {id:'flickghost',ghost:1,img:'guide-flick',name:'螢火騙子 Flick',type:'flick',clue:'成群的螢火往你飄來，但那些光是假的。',judge:'真正的光在你手上。',act:'點畫面下方的火把；沒有火把就躲進另一側。'},
 {id:'howler',ghost:1,img:'ghost-howler',name:'雪嚎者 Howler',type:'howl',clue:'風聲中夾著 2 到 3 聲有節奏的嚎叫。',judge:'牠在教你一段節奏。',act:'等牠停了，照同樣的間隔點畫面。'},
 {id:'crawler',ghost:1,img:'ghost-crawler',name:'冰縫行者 Crawler',type:'crawl',clue:'冰面裂縫延伸，咯吱聲越來越急。',judge:'裂縫到腳邊的那一刻。',act:'點一下畫面。'},
 {id:'whiteout',ghost:1,img:'ghost-whiteout',name:'白幕 Whiteout',type:'white',clue:'畫面一片白，一側閃光。',judge:'閃光的地方是雪洞。',act:'躲進閃光那一側，撐住 2 秒；牠可能折返。'},
 {id:'magma',ghost:1,img:'ghost-magma',name:'熔岩蟲 Magma',type:'magma',clue:'地面發紅，一側冒煙。',judge:'冒煙的地方牠會鑽出來。',act:'躲進沒冒煙的那一側；牠可能折返。'},
 {id:'flick',img:'guide-flick',name:'小螢 Flick',clue:'友方的螢火蟲，會在死亡後告訴你剛才漏掉了什麼。',judge:'牠不是鬼。',act:'多看牠的提示。'},
 {id:'rook',img:'npc-rook',name:'旅人 Rook',clue:'在營火旁出現。',judge:'牠不追你。',act:'營火邊三選一，帶走一樣東西。'},
 {id:'nib',img:'npc-nib',name:'Nib',clue:'偶爾跑過路邊的無害小傢伙，出現率約五十分之一。',judge:'牠不會傷害你。',act:'靠近時點一下撿起，牠會留點小禮物。'},
 {id:'torch',img:'item-torch',name:'火把 Torch',clue:'路邊或營火的道具。',judge:'',act:'下次襲擊多 0.6 秒預警並標出方向。'},
 {id:'charm',img:'item-charm',name:'護身符 Charm',clue:'路邊或營火的道具，掉落保底較低。',judge:'',act:'擋下一次致命失誤。'},
 {id:'scroll',img:'item-chest',name:'舊卷軸 Scroll',clue:'收藏品。',judge:'',act:'每集滿 3 卷 +1 命（上限 5）；自由跑改給 1 個護身符。'},
 {id:'lantern',img:'prop-skull-lantern',name:'骷髏燈籠',clue:'收集 3 卷舊卷軸後出現在營火旁。',judge:'',act:'三卷湊齊的紀念，營火旁的裝飾。'}];
const DEXF={x:14,y:5,h:440},DK=DEXF.h/578,DCX=[95,175,256,337],DCY=[190,273,355];
const dexPos=j=>[DEXF.x+DCX[j%4]*DK,DEXF.y+DCY[(j/4)|0]*DK];
const dexPages=()=>{const out=[],ch=a=>{for(let i=0;i<a.length;i+=12)out.push(a.slice(i,i+12))};ch(DEX.filter(d=>d.ghost));ch(DEX.filter(d=>!d.ghost));return out};   // 12 slots per page: ghosts first, then NPCs and items
let dexPg=0;
const dexGo=n=>{const pg=dexPages();dexPg=(dexPg+n+pg.length)%pg.length;dexSel=DEX.indexOf(pg[dexPg][0])};
const DEXB=[[372,392,118,38,'聽一次'],[500,392,118,38,'練習'],[628,392,118,38,'關閉']],DEXP=[[40,396,92,32,'上一頁'],[222,396,92,32,'下一頁']];
function txl(s,x,y,sz,col,wd,maxL){sz=Math.max(sz,MINSZ);g.font='700 '+sz+'px '+FB;g.textAlign='left';g.fillStyle=col;const ls=wrapLines(s,sz,wd).slice(0,maxL||12);ls.forEach((ln,i)=>g.fillText(ln,x,y+i*(sz+5)));return y+ls.length*(sz+5)}
function drawDex(){
 g.fillStyle='#06060a';g.fillRect(0,0,W,H);
 const fr=art('ui-codex');if(fr)g.drawImage(fr,DEXF.x,DEXF.y,432*DK,DEXF.h);
 const pgs=dexPages(),cur=pgs[dexPg]||pgs[0];
 txp((cur[0].ghost?'鬼圖鑑　':'道具與旅人　')+cur.filter(d=>seen[d.id]).length+' / '+cur.length,DEXF.x+216*DK,DEXF.y+105*DK,18,'#e8e0d0');
 txp('點圓圈看線索與解法',DEXF.x+220*DK,DEXF.y+462*DK,14,'#4a3a2a');
 cur.forEach((d,j)=>{
  const p=dexPos(j),im=d.img?art(d.img):null,got=!!seen[d.id];
  if(DEX.indexOf(d)===dexSel){g.strokeStyle='#ffd98a';g.lineWidth=3;g.beginPath();g.arc(p[0],p[1],27*DK*1.2+2,0,7);g.stroke()}
  if(got){if(im)floatImg(im,p[0],p[1],46,1);else txp(d.id==='nib'?'🐾':'?',p[0],p[1]+6,20,'#e8e0d0')}
  else txp('？',p[0],p[1]+7,22,'#5a5a66')});
 RR(366,10,424,430,12,'rgba(26,18,10,.96)',3);g.save();g.strokeStyle='#8a6428';g.lineWidth=2;g.beginPath();g.roundRect(370,14,416,422,10);g.stroke();g.restore();
 const d=DEX[dexSel],got=!!seen[d.id];
 if(got){const im=d.img?art(d.img):null;if(im)floatImg(im,430,80,96,1);
  txl(d.name,490,50,22,'#ffd98a',290,2);
  const n=d.type?deathsOf(d.type):0;if(d.type)txl('被牠打倒 '+n+' 次',490,84,14,'#cfe8ff',290,1);
  let y=150;y=txl('線索：'+d.clue,384,y,15,'#f1d9a6',390,3)+6;if(d.judge)y=txl('判斷：'+d.judge,384,y,15,'#f1d9a6',390,2)+6;txl('應對：'+d.act,384,y,15,'#ffd98a',390,3)}
 else{txl('？？？',490,60,24,'#8a8a96',290,1);txl('還沒遇見。繼續往前走，遇到之後這裡會記下線索和解法。',384,150,15,'#c9c0b0',390,3)}
 DEXP.forEach(b=>btnImg(b[0],b[1],b[2],b[3],b[4],false,15));tx((dexPg+1)+' / '+pgs.length,DEXF.x+216*DK,DEXF.y+413,14,'#e8e0d0');
 DEXB.forEach((b,i)=>{const dis=(i<2&&!(got&&d.type));btnImg(b[0],b[1],b[2],b[3],b[4],dis,17)})}
function dexClick(e){
 const p=cxy(e);
 const cur=dexPages()[dexPg]||[];
 for(let j=0;j<cur.length;j++){const q=dexPos(j);if(Math.hypot(p[0]-q[0],p[1]-q[1])<28){dexSel=DEX.indexOf(cur[j]);return}}
 DEXP.forEach((b,i)=>{if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3])dexGo(i?1:-1)});
 DEXB.forEach((b,i)=>{if(p[0]>=b[0]&&p[0]<=b[0]+b[2]&&p[1]>=b[1]&&p[1]<=b[1]+b[3]){
  const d=DEX[dexSel],ok=seen[d.id]&&d.type;
  if(i===2)dex=false;
  else if(i===0&&ok)playCue({type:d.type==='hollow'?'walker':d.type,side:1});
  else if(i===1&&ok&&st!=='run'){dex=false;practiceStart(d.type==='hollow'?'walker':d.type)}}})}
function practiceStart(ty){nextPractice=ty;forceLvl=0;start();forceLvl=null}
const SPOT_ART=['spot-tree','spot-coffin','spot-tree','spot-tree','spot-coffin'],APPROACH=2.5;
function drawSpots(){
 const wi=L?L.wi:clamp(Math.floor(prog/20),0,4),col=['#1d2a16','#25232b','#1c2a24','#33414b','#2e1a14'][wi]||'#1d2a16',im=art(SPOT_ART[wi]||'spot-tree');
 [-1,1].forEach(sd=>spots[sd].forEach(w=>{
  const f=clamp((lt-(w[0]-APPROACH))/APPROACH,0,1),o=clamp((w[1]+.5-lt)/.5,0,1),a=Math.min(f,o);if(a<=0)return;
  const x=CX+sd*(520-220*f),sz=120+120*f;   // slides in from the edge and grows as you run up to it
  if(im)sprite(im,x,400,sz*1.6,a);
  else{g.save();g.globalAlpha=a;g.fillStyle=col;g.strokeStyle='rgba(255,217,138,.35)';g.lineWidth=2;g.beginPath();g.ellipse(x,392,sz*.6,sz*.38,0,Math.PI,0);g.fill();g.stroke();g.restore()}}))}
const HIDE_LEAVES=(()=>{const r=mulberry(31),a=[];for(let i=0;i<26;i++)a.push([r()*W,50+r()*(H-90),22+r()*44,8+r()*17,r()*Math.PI,r()*6]);return a})();
function drawHide(){   // first person inside the spot: a bush leaves only small leaf-shaped gaps, a coffin is pitch black; the cover slides in from the side you turned to
 const k=hk;if(k<.01)return;
 const e=k*k*(3-2*k),sd=hkSd,wi=L?L.wi:clamp(Math.floor(prog/20),0,4),coffin=wi===1||wi===4,sway=Math.sin(tt*1.7)*2*e+(breath<.5?Math.sin(tt*14)*(1-breath)*2:0);
 g.save();g.translate(sd*(1-e)*(W+80)+sway,0);
 if(coffin){g.fillStyle='#000';g.fillRect(-120,-120,W+240,H+240)}
 else{
  g.beginPath();g.rect(-120,-120,W+240,H+240);
  HIDE_LEAVES.forEach(([x,y,rx,ry,rot,ph])=>{const m=e*(1+.12*Math.sin(tt*1.4+ph)),a=rx*m,b=ry*m;g.moveTo(x+a*Math.cos(rot),y+a*Math.sin(rot));g.ellipse(x,y,a,b,rot,0,Math.PI*2)});
  g.fillStyle='rgba(3,8,3,.985)';g.fill('evenodd');
  g.strokeStyle='rgba(70,110,45,.35)';g.lineWidth=1.5;HIDE_LEAVES.forEach(([x,y,rx,ry,rot,ph])=>{const m=e*(1+.12*Math.sin(tt*1.4+ph));g.beginPath();g.ellipse(x,y,rx*m+1.5,ry*m+1.5,rot,0,Math.PI*2);g.stroke()})}   // the lit rim of each leaf gap
 g.restore();
 const sm=g.createLinearGradient(0,0,0,H);sm.addColorStop(0,'rgba(0,0,0,.55)');sm.addColorStop(.12,'rgba(0,0,0,0)');sm.addColorStop(.88,'rgba(0,0,0,0)');sm.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=sm;g.fillRect(0,0,W,H);
 if(breath<.999){const gr=g.createRadialGradient(CX,225,120,CX,225,520);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+(.9*(1-breath))+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}}
function howCards(y,w,al){   // three parchment cards: icon in the window, two short lines underneath
 const h=w*216/186,gap=w*.1,x0=CX-(3*w+2*gap)/2,bg=art('ui-card'),
  defs=[[['spot-tree'],'左右滑','躲進樹或棺材',1],[['item-lantern','item-hammer'],'鬼來了','點對的道具',0],[['item-torch'],'路邊有東西','點一下撿起',0]];
 g.save();g.globalAlpha=al;
 defs.forEach((d,i)=>{const x=x0+i*(w+gap);
  if(bg)g.drawImage(bg,x,y,w,h);else RR(x,y,w,h,10,'#d9c08a',2);
  const wx=x+w*.31,wy=y+h*.18,ww=w*.38,wh=h*.33,ims=d[0].map(art).filter(Boolean),slot=ww/Math.max(1,d[0].length);
  ims.forEach((im,k)=>{const sc=Math.min((slot-4)/im.naturalWidth,(wh-8)/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc;g.drawImage(im,wx+slot*k+(slot-iw)/2,wy+(wh-ih)/2,iw,ih)});
  if(d[3]){g.font='800 '+w*.14+'px '+FB;g.textAlign='center';g.fillStyle='#e8c675';g.fillText('◀',wx-w*.04,wy+wh*.62);g.fillText('▶',wx+ww+w*.04,wy+wh*.62)}
  txp(d[1],x+w/2,y+h*.67,w*.115,'#3a2812',w*.64);txp(d[2],x+w/2,y+h*.82,w*.09,'#3a2812',w*.64)});
 g.restore()}
function drawHead(){   // head down: the road rushes by under your feet and a long shadow slides over you
 g.save();g.fillStyle='rgba(6,5,4,.92)';g.fillRect(0,0,W,H);
 const sp=run*140;for(let i=0;i<14;i++){const y=140+((i*47+sp*(.4+i*.07))%310),w=60+i*14,x=(i*211+sp*.3)%W;g.fillStyle='rgba(70,60,50,'+(.12+i*.02)+')';g.fillRect(x,y,w,3)}
 const k=ev.phase==='judge'?clamp((BELL.judge-ev.t)/BELL.judge*1.2,0,1):0;g.fillStyle='rgba(0,0,0,'+(.3+.6*k)+')';g.beginPath();g.ellipse(CX,60+160*k,120+260*k,40+110*k,0,0,7);g.fill();
 const bt=art('fx-boots');if(bt)floatImg(bt,CX,H-90+Math.sin(run*14)*7,360,.95);g.restore()}
function drawWeather(){
 const w=wx;if(!w)return;
 const fade=clamp(lt/3,0,1);g.save();g.globalAlpha=fade;   // the weather rolls in over the first 3 seconds of a level
 const tint=[0,'rgba(150,70,20,.2)','rgba(4,8,30,.42)','rgba(20,30,50,.22)','rgba(190,200,205,.28)','rgba(10,14,28,.4)','rgba(200,215,235,.1)','rgba(235,240,250,.3)','rgba(60,50,45,.25)','rgba(255,120,30,.1)'][w];
 if(tint){g.fillStyle=tint;g.fillRect(0,0,W,H)}
 if(w===4||w===5){const fg=art('env-fog');if(fg){g.globalAlpha=fade*.22;[0,1].forEach(i=>g.drawImage(fg,((tt*14+i*W)%(2*W))-W,H-300,W+40,300));g.globalAlpha=fade}}   // drifting fog
 if(w===3){const q=tt%11,fl=q<.12?1-q/.12:(q>.3&&q<.4)?1-(q-.3)/.1:0;if(fl>0){g.fillStyle='rgba(220,230,255,'+(.4*fl)+')';g.fillRect(0,0,W,H)}}   // lightning
 if(w===9&&g.canvas&&g.canvas.width){const k=g.canvas.width/W;for(let y=190;y<H;y+=10){const dx=Math.sin(tt*3+y*.05)*(2+(y-190)/80);g.drawImage(g.canvas,0,y*k,g.canvas.width,10*k,dx,y,W,10)}}   // heat shimmer
 const vis=w===5||w===7?.6:w===4?.8:1;
 if(vis<1){const gr=g.createRadialGradient(CX,260,330*vis,CX,260,620*vis);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.85)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(w===3){const hs=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q)};   // every drop has its own depth, speed, length and landing spot; it splashes where it lands
  for(let i=0;i<150;i++){const z=hs(i+1),v=520+z*520,len=6+z*14,gy=200+z*230+hs(i+9)*30,fall=gy/v,per=fall+.28,off=hs(i+5)*per*9,cyc=Math.floor((tt+off)/per),t=(tt+off)%per,x=hs(i*7+cyc*13+2)*(W+60)-30;
   if(t<fall){const y=t*v,xs=x+y*.1;g.strokeStyle='rgba(190,208,228,'+(.12+z*.3)+')';g.lineWidth=.6+z*.9;g.beginPath();g.moveTo(xs,y);g.lineTo(xs-len*.1,y-len);g.stroke()}
   else{const p=(t-fall)/.28,xs=x+gy*.1,rx=2+z*9*p;g.strokeStyle='rgba(190,208,228,'+(.28*(1-p))*(.4+z)+')';g.lineWidth=1;g.beginPath();g.ellipse(xs,gy,rx,rx*.3,0,0,7);g.stroke()}}}   // thin, steep, layered rain
 const n=w===6?40:w===7?90:w===8?35:0;
 g.save();for(let i=0;i<n;i++){const sx=(i*97.3+tt*(w===3?260:w===7?340:40*(1+i%3)))%W,sy=(i*53.7+tt*(w===3?520:w===8?30:90))%H;
  if(w===3){g.strokeStyle='rgba(170,200,230,.45)';g.beginPath();g.moveTo(sx,sy);g.lineTo(sx-4,sy+14);g.stroke()}
  else{g.fillStyle=w===8?'rgba(150,140,130,.55)':'rgba(255,255,255,.7)';g.fillRect(sx,sy,w===7?3:2,w===7?3:2)}}g.restore();g.restore()}
function draw(){
 const I=inputs(),lamp=st==='run'?lampLevel():1,cov=st==='run'&&I.cover;
 const wi=L?L.wi:clamp(Math.floor(prog/20),0,4);
 const ox=(shake>0?(Math.random()-.5)*14:0)+(wi===4&&!lowScare?Math.sin(tt*5)*1.5:0);
 g.save();g.translate(ox,0);
 {const hs=Math.sin(hk*Math.PI);if(hs>.01&&st==='run'){g.translate(CX,H/2);g.rotate(hkSd*.09*hs);g.scale(1+.07*hs,1+.07*hs);g.translate(-CX,-H/2)}}   // ducking in and climbing out: the view rolls and dips
 drawWorld(lamp);
 if(wi===1){const fg=art('env-fog');if(fg){g.save();g.globalAlpha=.3;g.drawImage(fg,-40,H-260,W+80,260);g.restore()}g.fillStyle='rgba(20,26,30,.22)';g.fillRect(0,0,W,H)}   // graveyard: fog narrows the view
 if(st==='run'){drawSpots();drawSpirits();drawEvItems();drawDrops()}
 if(st==='run'&&L)drawWeather();
 if(st==='run'&&!camp)drawHide();
 if(ev&&ev.type==='walker'&&ev.phase==='warn'&&ev.t<3.5){g.fillStyle='rgba(200,230,255,'+(.05+.18*(1-ev.t/3.5))+')';g.fillRect(0,0,W,H)}
 fxs.forEach(f=>{if(f.s.startsWith('img:')){const im=art(f.s.slice(4));if(im)floatImg(im,f.x,f.y-f.t*40,80+24*f.t,1-f.t/.9)}else{g.globalAlpha=1-f.t/.9;tx(f.s,f.x,f.y-f.t*40,22,f.col);g.globalAlpha=1}});
 g.restore();
 if(st==='run'&&headDown&&ev&&ev.type==='bell')drawHead()
 if(st==='run'&&camp){drawCamp();hud(I,lamp)}
 else if(st==='run'){
  if(!(headDown&&ev&&ev.type==='bell'))hud(I,lamp);if(tut)drawTutUI()}
 if(shieldFx>0){const o=art('fx-orb');if(o)floatImg(o,CX,250,230+260*(1-shieldFx),Math.min(1,shieldFx*1.4))}
 if(flash>0){g.fillStyle='rgba(200,20,20,'+flash*1.2+')';g.fillRect(0,0,W,H)}
 if(introP)drawIntro();
 else if(st==='ready'){
  g.fillStyle='rgba(18,13,10,.72)';g.fillRect(0,0,W,H);
  if(!audioOk)drawHeadphone();
  else{const lv=wantLevel(),lc=lv?levelCfg(lv,(lvDeaths[lv]||0)>=2):null;
   tx('別看',CX,70,52,'#e8c675');tx('Don\'t Peek　禁忌寶盒・夜逃',CX,98,17,'#f1d9a6');
   tx(lc?'第 '+lv+' 關・'+WORLD_NAME[lc.wi]+'・'+KIND_NAME[lc.kind]+'　生命 '+lives:'自由跑（沒有關卡和生命）',CX,130,20,'#ffd98a');
   howCards(146,170,1);
   tx('選好關卡，按右邊的「開始」',CX,388,20,'#ffd98a');tx('電腦：← → 躲或選道具　F 撿　手機：左右滑、點一下',CX,414,14,'rgba(241,217,166,.75)')}}
 else if(st==='won')drawWon();
 else if(st==='over'){if(scareT>0)drawScare();else drawDeath()}
 if(dex)drawDex()}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 audioInit();audioOk=true;
 analytics=AN.start('peek',amount);peekStake=amount;peekBusy=true;save();renderAll();
 practice=nextPractice;nextPractice='';daily=forceLvl===null&&!practice&&dailyOn();lvl=practice?0:daily?dailyLvl():wantLevel();L=lvl>0?levelCfg(lvl,(lvDeaths[lvl]||0)>=2):null;
 tut=null;if(!tutDone&&!practice&&!daily&&lvl<=1&&forceLvl===null){tut={i:0,fails:0,n:0};introP=1;lvl=0;L=null}
 reset();earned=0;st='run';try{window.__gp&&window.__gp(true)}catch(e){}last=performance.now();applyLevel();if(L)mark('flick');dex=false;endBtns=[];
 if(!L)say(practice?'練習：不扣生命，也不發點。':'開始逃跑。別回頭。');ui();c.focus();
}
const shown=()=>!$('view-peek').hidden&&!document.hidden;
$('peek-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(dex){dexClick(e);return}
 if(introP){introClick(e);return}
 if(st!=='run'){if(st==='ready'&&!audioOk&&shown()&&hpClick(e))return;if(st!=='ready'&&shown()&&deathClick(e))return;say(st==='ready'?'先按「開始逃跑」。':'這一局已結算。按「再開一次」開始新的一局。');return}
 if(!shown())return;e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(x){}
 if(tut){const q=cxy(e);if(q[0]>W-150&&q[1]>H-46){tutEnd();return}}
 if(camp){campTap(e);return}
 const p=cxy(e);gs.set(e.pointerId,{x:p[0],y:p[1],t:performance.now(),sw:false});touchT=tt});
c.addEventListener('pointermove',e=>{const q=gs.get(e.pointerId);if(!q||q.sw||st!=='run'||camp)return;const p=cxy(e),dx=p[0]-q.x;touchT=tt;const dy=p[1]-q.y;if(Math.abs(dx)>SWIPE_PX&&Math.abs(dx)>Math.abs(dy)){q.sw=true;swipe(dx<0?-1:1)}else if(Math.abs(dy)>SWIPE_PX&&Math.abs(dy)>Math.abs(dx)){q.sw=true;setHead(dy>0)}});
const upPtr=e=>{const q=gs.get(e.pointerId);gs.delete(e.pointerId);if(q&&!q.sw&&st==='run'&&!camp&&performance.now()-q.t<TAP_MS){touchT=tt;tap(q.x,q.y)}};
c.addEventListener('pointerup',upPtr);c.addEventListener('pointercancel',upPtr);c.addEventListener('lostpointercapture',upPtr);
c.addEventListener('contextmenu',e=>e.preventDefault());
const KEYMAP={t:'torch',T:'torch',a:'l',A:'l',ArrowLeft:'l',d:'r',D:'r',ArrowRight:'r',' ':'cover',f:'pick',F:'pick',s:'down',S:'down',ArrowDown:'down',ArrowUp:'up'};
addEventListener('keydown',e=>{
 if(introP&&shown()){if(['Enter',' ','ArrowRight'].includes(e.key)){e.preventDefault();introNext()}return}
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(camp&&camp.state==='pick'&&'123'.includes(e.key)&&e.key){camp.choice=+e.key-1;e.preventDefault();return}
 if((e.key==='f'||e.key==='F'||e.key==='Enter')&&!e.repeat)tailPush();
 const k=KEYMAP[e.key];if(!k)return;e.preventDefault();touchT=tt;if(k==='torch'){if(ev&&ev.type==='flick'&&ev.phase==='judge'&&bag.torch>0)torchTap=1;return}if(k==='down'){setHead(true);return}if(k==='up'){headDown=false;return}keys[k]=1;if((k==='l'||k==='r')&&itemsUp())itemTap=k==='l'?-1:1});
addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(k)keys[k]=0});
function clearInput(){headDown=false;keys={l:0,r:0,cover:0,pick:0};gs.clear();hideWant=0}
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
 if(gyro.on){gyro.on=false;window.removeEventListener('deviceorientation',onOrient);gb.textContent='啟用體感（手機）';return}
 const go=()=>{gyro.on=true;window.addEventListener('deviceorientation',onOrient);gb.textContent='關閉體感'};
 try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')go();else say('沒有取得體感權限，改用按鈕操作。','lose')}).catch(()=>say('這個瀏覽器不能使用體感，改用按鈕操作。','lose'))}else go()}catch(e){say('這個瀏覽器不能使用體感，改用按鈕操作。','lose')}});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
