  /* ---------- Frog Snack: timing game; the aim bobs over the bottom bug, eat it when centred, never while it is red ---------- */
  var frogBusy=false,frogStake=0,frogSay=function(){};
  (function(){
const c=$('fg-canvas'),g=c.getContext('2d'),W=400,H=560,GY=500,OL='#1b1b2f';
const BW=100,BH=44,TX=280,AIM_X=180,FX=88,FY=462;
const {STEP_MS,MAX_TICKS,REWARD_EVERY,SLOTS,TY,HIT,HEARTS,FULL}=frogRules;
const FROG_REWARD=1;
let best=0;try{best=+localStorage.getItem('deep-sea-frog-best')||0}catch(e){}
let analytics=null,earned=0;
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw||3)};
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
let st='ready',state=frogRules.create(),tongueT,tongueY,dropT,wob,shake,flash,dizzy,sq,lvlT,fxs=[],tt=0,rec=false,last=0,why='';
let rankRound=null,rankProof=null,rankStarting=false,rankGeneration=0,tick=0,carry=0;
const level=()=>frogRules.level(state);
function reset(random){state=frogRules.create(random);carry=0;tick=0;tongueT=0;tongueY=TY;dropT=0;wob=0;shake=0;flash=0;dizzy=0;sq=0;lvlT=0;fxs=[];why=''}
reset();
function say(text,kind){$('fg-msg').textContent=text;$('fg-msg').className='msg'+(kind?' '+kind:'')}
frogSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('fg-eaten',state.eaten+' 隻');setText('fg-level','Lv.'+level());setText('fg-best',best+' 隻');
 $('fg-amount').disabled=frogBusy;$('fg-go').disabled=live||rankStarting;setText('fg-go',live?'{{t:frog.msg.001}}':st==='over'?'{{t:frog.msg.002}}':'{{t:frog.msg.003}}');
}
function fx(s,x,y,col){fxs.push({s,x,y,col,t:0})}
function end(reason){
 if(st!=='run')return;
 st='over';why=reason;rec=state.eaten>best;
 if(rec){best=state.eaten;try{localStorage.setItem('deep-sea-frog-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:state.pts,step:state.eaten,stage:level()});frogBusy=false;save();renderAll();
 const head=reason==='hunger'?'{{t:frog.msg.004}}':'{{t:frog.msg.005}}';
 if(!earned)say(head+'吃了 '+state.eaten+' 隻，這一局沒有額外成就獎勵。','lose');
 else say(head+'吃了 '+state.eaten+' 隻，本局共入帳 '+fmt(earned)+' 點。','win');
 if(rankRound){
  rankProof={...rankRound,ticks:tick};
  rankRound=null;
  uploadRank(rankProof);
 }
 ui();
}
function press(){
 if(st!=='run')return;
 const outcome=frogRules.press(state);
 if(!outcome)return;
 if(rankRound)rankRound.presses.push(tick);
 tongueT=.12;tongueY=state.aimY;
 if(outcome.kind==='miss'){wob=.2;fx('MISS',TX,state.aimY-10,'#cfd8dc');return}
 if(outcome.kind==='sting'){
  dizzy=.6;if(!reduceMotion){flash=.15;shake=.3}
  fx('{{t:frog.msg.006}}',TX,TY-30,'#ff5d8f');
  if(state.reason)end(state.reason);else say('紅色帶刺的蟲不能吃！還剩 '+state.hearts+' 顆愛心。','lose');
  return;
 }
 dropT=.1;sq=.3;
 fx((outcome.perfect?'PERFECT +':'+')+outcome.gain,TX,TY-30,outcome.perfect?'#ffd23f':'#fff1c1');
 if(outcome.milestone){
  earned+=FROG_REWARD;S.balance+=FROG_REWARD;save();renderAll();lvlT=.8;
  AN.progress(analytics,{stage:level(),step:state.eaten,score:state.pts,bonus_points:FROG_REWARD});
  say('吃滿 '+state.eaten+' 隻！+'+FROG_REWARD+' 點已入帳，飽食回復一些，蟲子變得更兇了。','win');
 }
}
function update(dt){
 tt+=dt;sq*=.8;
 if(tongueT>0)tongueT-=dt;if(dropT>0)dropT-=dt;if(wob>0)wob-=dt;if(shake>0)shake-=dt;if(flash>0)flash-=dt;if(dizzy>0)dizzy-=dt;if(lvlT>0)lvlT-=dt;
 fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.6);
 if(st!=='run')return;
 frogRules.step(state,dt);
 if(state.reason)end(state.reason);
}
function drawBug(b,x,y){
 const atk=b.state==='attack',warn=b.state==='warn';
 const jx=warn&&!reduceMotion?Math.sin(tt*60)*3:0,col=!b.angry?b.col:atk?'#d32f2f':warn?(Math.floor(tt*10)%2?'#ffeb3b':'#ef9a9a'):'#ef9a9a';
 g.save();g.translate(x+jx,y);
 if(atk){g.fillStyle='#fff';g.strokeStyle=OL;g.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4,px=Math.cos(a)*(BW/2-2),py=Math.sin(a)*(BH/2-2);g.beginPath();g.moveTo(px*.86-Math.sin(a)*5,py*.86+Math.cos(a)*5);g.lineTo(px*1.22,py*1.3);g.lineTo(px*.86+Math.sin(a)*5,py*.86-Math.cos(a)*5);g.closePath();g.fill();g.stroke()}}
 g.strokeStyle=OL;g.lineWidth=3;g.lineCap='round';
 g.beginPath();g.moveTo(-34,-14);g.lineTo(-44,-24);g.moveTo(-22,-17);g.lineTo(-26,-28);g.stroke();
 RR(-BW/2+4,-BH/2+3,BW-8,BH-6,17,col);
 g.strokeStyle='rgba(27,27,47,.25)';g.lineWidth=3;g.beginPath();g.moveTo(-4,-BH/2+6);g.lineTo(-4,BH/2-6);g.moveTo(20,-BH/2+6);g.lineTo(20,BH/2-6);g.stroke();
 C(-30,-3,6,'#fff',2);C(-16,-3,6,'#fff',2);F(-31,-3,2.6,atk?'#d00000':OL);F(-17,-3,2.6,atk?'#d00000':OL);
 if(b.angry){g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(-38,-13);g.lineTo(-26,-9);g.moveTo(-8,-13);g.lineTo(-20,-9);g.stroke()}
 if(warn){tx('!',0,-BH/2-4,26,'#ffeb3b')}
 g.restore()}
function drawFrog(){
 g.save();g.translate(FX,FY);
 if(st==='over'){g.translate(0,-10);g.scale(1,-1)}
 g.scale(1+sq*.25,1-sq*.25);
 g.beginPath();g.ellipse(-26,34,20,10,0,0,7);O('#2e7d32');g.beginPath();g.ellipse(26,34,20,10,0,0,7);O('#2e7d32');
 g.beginPath();g.ellipse(0,6,42,36,0,0,7);O('#4caf50',4);
 g.fillStyle='#c8e6c9';g.beginPath();g.ellipse(4,18,26,18,0,0,7);g.fill();
 C(-16,-28,14,'#4caf50');C(16,-28,14,'#4caf50');C(-16,-28,9,'#fff',2);C(16,-28,9,'#fff',2);
 if(dizzy>0||st==='over'){g.strokeStyle=OL;g.lineWidth=3;[-16,16].forEach(ex=>{g.beginPath();g.moveTo(ex-5,-33);g.lineTo(ex+5,-23);g.moveTo(ex+5,-33);g.lineTo(ex-5,-23);g.stroke()})}
 else{F(-13,-27,4,OL);F(19,-27,4,OL)}
 g.strokeStyle=OL;g.lineWidth=3;g.lineCap='round';g.beginPath();
 if(tongueT>0)g.ellipse(26,0,9,7,0,0,7);else g.arc(8,-4,24,.25,Math.PI-.6);
 g.stroke();
 g.restore()}
function draw(){
 const ox=shake>0?(Math.random()-.5)*12:0,wx=wob>0&&!reduceMotion?Math.sin(tt*70)*4:0;
 g.save();g.translate(ox,0);
 g.fillStyle='#bfe8f2';g.fillRect(-20,0,W+40,H);
 g.fillStyle='#e8f8fb';[[70,150,34],[110,160,26],[320,110,30],[352,118,22]].forEach(p=>{g.beginPath();g.arc(p[0],p[1],p[2],0,7);g.fill()});
 g.fillStyle='#5a8f3c';g.fillRect(-20,GY,W+40,H-GY);g.fillStyle='#7cb342';g.fillRect(-20,GY,W+40,10);
 g.strokeStyle=OL;g.lineWidth=4;g.beginPath();g.moveTo(-20,GY);g.lineTo(W+20,GY);g.stroke();
 g.beginPath();g.ellipse(FX,GY+6,62,12,0,0,7);O('#388e3c');
 const slide=dropT>0?BH*(dropT/.1):0;
 for(let i=SLOTS-1;i>=0;i--)drawBug(state.bugs[i],TX+wx*(1+i*.25),TY-BH*i-slide);
 g.strokeStyle='rgba(255,210,63,.55)';g.lineWidth=2;g.setLineDash([6,6]);g.beginPath();g.moveTo(AIM_X+12,state.aimY);g.lineTo(TX+BW/2+6,state.aimY);g.stroke();g.setLineDash([]);
 g.strokeStyle='rgba(27,27,47,.35)';g.lineWidth=2;g.beginPath();g.moveTo(TX+BW/2+10,TY-HIT);g.lineTo(TX+BW/2+18,TY-HIT);g.lineTo(TX+BW/2+18,TY+HIT);g.lineTo(TX+BW/2+10,TY+HIT);g.stroke();
 drawFrog();
 if(tongueT>0){g.lineCap='round';g.strokeStyle=OL;g.lineWidth=13;g.beginPath();g.moveTo(FX+30,FY);g.lineTo(TX-BW/2+12,tongueY);g.stroke();g.strokeStyle='#ff6f91';g.lineWidth=8;g.stroke()}
 g.beginPath();g.moveTo(AIM_X+12,state.aimY);g.lineTo(AIM_X-6,state.aimY-10);g.lineTo(AIM_X-6,state.aimY+10);g.closePath();O('#ffd23f',3);
 fxs.forEach(f=>{g.globalAlpha=1-f.t/.6;tx(f.s,f.x,f.y-f.t*60,22,f.col);g.globalAlpha=1});
 if(state.combo>=2&&st==='run')tx('x'+state.combo,FX,FY-62,24,state.combo>=15?'#ff5d8f':state.combo>=5?'#ffd23f':'#fff1c1');
 g.restore();
 for(let i=0;i<HEARTS;i++){const hx=24+i*28,on=i<state.hearts;g.beginPath();g.moveTo(hx,46);g.bezierCurveTo(hx-18,32,hx-8,18,hx,28);g.bezierCurveTo(hx+8,18,hx+18,32,hx,46);g.closePath();O(on?'#e63946':'#9aa0a6',3)}
 tx(String(state.pts),W/2,50,36,'#fff1c1');tx('Lv.'+level(),W-16,44,18,'#fff1c1','right');
 RR(16,62,W-32,14,7,'#333',3);
 if(state.food>0){const low=state.food<20,fc=state.food>50?'#7cb342':state.food>=20?'#ffd23f':'#e63946';if(!low||reduceMotion||Math.floor(tt*6)%2){g.fillStyle=fc;g.beginPath();g.rect(18,64,(W-36)*state.food/FULL,10);g.fill()}}
 tx('{{t:frog.msg.007}}',38,94,13,'#fff1c1');
 if(lvlT>0&&st==='run')tx('LEVEL UP  +'+FROG_REWARD+' 點',W/2,150,26,'#ffd23f');
 if(flash>0){g.fillStyle='rgba(230,57,70,.35)';g.fillRect(0,0,W,H)}
 if(st!=='run'){
  g.fillStyle='rgba(27,27,47,.6)';g.fillRect(0,0,W,H);
  if(st==='ready'){tx('{{t:frog.msg.008}}',W/2,190,36,'#ffd23f');tx('{{t:frog.msg.009}}',W/2,244,19,'#fff1c1');tx('{{t:frog.msg.010}}',W/2,274,19,'#fff1c1');tx('{{t:frog.msg.011}}',W/2,304,19,'#ff5d8f');tx('{{t:frog.msg.012}}',W/2,360,24,'#ffd23f')}
  else{tx(why==='hunger'?'{{t:frog.msg.013}}':'{{t:frog.msg.014}}',W/2,176,32,'#ff5d8f');tx(state.eaten+' 隻',W/2,240,50,'#fff1c1');tx('分數 '+state.pts+'　到達 Lv.'+level(),W/2,280,20,'#fff1c1');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'沒吃滿 '+REWARD_EVERY+' 隻，沒有點數',W/2,316,22,earned>0?'#ffd23f':'#fff1c1');if(rec)tx('{{t:frog.msg.015}}',W/2,350,20,'#ffd23f');tx('{{t:frog.msg.016}}',W/2,396,20,'#fff1c1')}}
}
function begin(round){
 const amount=ENTRY_FEE;
 rankRound=round;
 analytics=AN.start('frog',amount);frogStake=amount;frogBusy=true;save();renderAll();
 reset(round?frogRules.seededRandom(round.seed):undefined);earned=0;rec=false;st='run';last=performance.now();
 say('{{t:frog.msg.017}}');ui();c.focus();
}
function rankStatus(text,retry=false){
 const status=$('fg-rank-status');
 status.hidden=!text;
 status.textContent=text;
 $('fg-rank-retry').hidden=!retry;
}
async function start(){
 if(st==='run'||rankStarting)return;
 if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return}
 if(typeof location==='undefined'||location.protocol==='file:'){begin(null);return}
 rankStarting=true;
 const generation=++rankGeneration;
 rankProof=null;
 rankStatus('{{t:frog.msg.018}}');
 ui();
 let round=null;
 try{
  const api=await import('./frontend/services/api.mjs');
  round=await api.startFrogRound(AbortSignal.timeout(4000));
  round.presses=[];
 }catch(error){round=null}
 finally{rankStarting=false;ui()}
 if(generation!==rankGeneration||!shown()){rankStatus('');return}
 rankStatus(round?'{{t:frog.msg.019}}':'{{t:frog.msg.020}}');
 begin(round);
}
async function uploadRank(proof){
 rankStatus('{{t:frog.msg.021}}');
 try{
  const api=await import('./frontend/services/api.mjs');
  await api.finishFrogRound(proof,AbortSignal.timeout(10000));
  if(rankProof===proof){rankProof=null;rankStatus('{{t:frog.msg.022}}')}
 }catch(error){
  if(rankProof===proof)rankStatus('{{t:frog.msg.023}}',error.retryable!==false);
 }
}
$('fg-rank-retry').addEventListener('click',()=>{if(rankProof)uploadRank(rankProof)});
const shown=()=>!$('view-frog').hidden&&!document.hidden;
$('fg-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'{{t:frog.msg.024}}':'{{t:frog.msg.025}}');return}
 if(!shown())return;e.preventDefault();c.focus();press()});
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 if(e.key===' '){e.preventDefault();if(!e.repeat)press()}});
addEventListener('blur',()=>{last=performance.now()});
document.addEventListener('visibilitychange',()=>{last=performance.now()});
window.addEventListener('hashchange',()=>{last=performance.now();if(rankStarting&&location.hash!=='#frog'){rankGeneration++;rankStatus('')}});
function loop(t){
 const elapsed=Math.min(50,Math.max(0,t-last)||0);
 last=t;
 if(shown()){
  if(rankRound&&st==='run'){
   carry+=elapsed;
   while(carry>=STEP_MS&&st==='run'){
    carry-=STEP_MS;
    tick++;
    update(STEP_MS/1000);
    if(rankRound&&tick>=MAX_TICKS){
     rankRound=null;
     rankStatus('{{t:frog.msg.020}}');
    }
   }
  }else update(elapsed/1000);
  ui();draw();
 }
 requestAnimationFrame(loop);
}
ui();draw();requestAnimationFrame(loop);
  })();
