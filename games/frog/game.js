  /* ---------- Frog Snack: timing game; the aim bobs over the bottom bug, eat it when centred, never while it is red ---------- */
  var frogBusy=false,frogStake=0,frogSay=function(){};
  (function(){
const c=$('fg-canvas'),g=c.getContext('2d'),W=400,H=560,GY=500,DPR=2,OL='#2b3a5c';c.width=W*DPR;c.height=H*DPR;
const FNT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';
const BW=100,BH=44,TX=280,AIM_X=180,FX=88,FY=462;
const {STEP_MS,MAX_TICKS,REWARD_EVERY,SLOTS,TY,HIT,HEARTS,FULL}=frogRules;
const FROG_REWARD=1;
let best=0;try{best=+localStorage.getItem('deep-sea-frog-best')||0}catch(e){}
let analytics=null,earned=0;
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw||3)};
function tx(s,x,y,sz,col,al,mw){mw=mw||W-40;g.font='900 '+sz+'px '+FNT;g.textAlign=al||'center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=Math.max(4,sz/3.5);g.strokeStyle=OL;g.strokeText(s,x,y,mw);g.fillStyle=col;g.fillText(s,x,y,mw)}
let st='ready',state=frogRules.create(),tongueT,tongueY,dropT,wob,shake,flash,dizzy,sq,lvlT,perfT=0,fxs=[],tt=0,rec=false,last=0,why='';
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
 dropT=.1;sq=.3;perfT=outcome.perfect?.45:0;
 fx((outcome.perfect?'PERFECT +':'+')+outcome.gain,TX,TY-30,outcome.perfect?'#ffd23f':'#fff1c1');
 if(outcome.milestone){
  earned+=FROG_REWARD;S.balance+=FROG_REWARD;save();renderAll();lvlT=.8;
  AN.progress(analytics,{stage:level(),step:state.eaten,score:state.pts,bonus_points:FROG_REWARD});
  say('吃滿 '+state.eaten+' 隻！+'+FROG_REWARD+' 點已入帳，飽食回復一些，蟲子變得更兇了。','win');
 }
}
function update(dt){
 tt+=dt;sq*=.8;
 if(tongueT>0)tongueT-=dt;if(dropT>0)dropT-=dt;if(wob>0)wob-=dt;if(shake>0)shake-=dt;if(flash>0)flash-=dt;if(dizzy>0)dizzy-=dt;if(lvlT>0)lvlT-=dt;if(perfT>0)perfT-=dt;
 fxs.forEach(f=>f.t+=dt);fxs=fxs.filter(f=>f.t<.6);
 if(st!=='run')return;
 frogRules.step(state,dt);
 if(state.reason)end(state.reason);
}
const SPR=new Image();SPR.src='games/frog/art/sprites.webp';const SCN=new Image();SCN.src='games/frog/art/scene.webp';
const A={"fStung":[0,0,150,141],"fDizzy":[152,0,150,140],"fTongue":[304,0,260,136],"fOpen":[566,0,150,135],"fChew":[718,0,150,135],"aWarn":[0,143,170,134],"f0":[172,143,150,132],"f1":[324,143,150,131],"aCalm":[476,143,170,131],"fChew2":[648,143,150,130],"fPerfect":[800,143,150,130],"bB":[0,279,170,130],"bG":[172,279,170,128],"bO":[344,279,170,128],"bP":[516,279,170,124],"aAtk":[688,279,180,124],"perfect":[0,411,220,122],"cattail":[222,411,97,110],"fHungry":[321,411,150,108],"x2":[473,411,110,108],"miss":[585,411,180,95],"pad":[767,411,170,92],"puff":[0,535,110,90],"cloud":[112,535,150,88],"spark":[264,535,110,84],"barE":[376,535,300,75],"pill":[678,535,300,72],"cloud2":[0,627,110,67],"barF":[112,627,220,57],"rock":[334,627,100,54],"arrow":[436,627,70,51],"hOn":[508,627,60,50],"hOff":[570,627,60,50],"flW":[632,627,60,49],"flP":[694,627,60,47],"tongue":[756,627,240,30]};
const ok=i=>i.complete&&i.naturalWidth>0,BUGK={'#8bc34a':'bG','#ffb74d':'bO','#64b5f6':'bB','#ba68c8':'bP'};
function spr(k,x,y,h,alpha){const a=A[k];if(!a||!ok(SPR))return;const w=a[2]*h/a[3];if(alpha!==undefined){g.save();g.globalAlpha=alpha}g.drawImage(SPR,a[0],a[1],a[2],a[3],x-w/2,y-h,w,h);if(alpha!==undefined)g.restore()}
function sprW(k,x,y,w){const a=A[k];if(!a)return 0;const h=a[3]*w/a[2];spr(k,x,y,h);return h}
function sprBox(k,x,y,w,h){const a=A[k];if(!a||!ok(SPR))return;g.drawImage(SPR,a[0],a[1],a[2],a[3],x,y,w,h)}
function pill(x,y,w,h){g.fillStyle='rgba(40,70,110,.18)';g.beginPath();g.roundRect?g.roundRect(x,y+4,w,h,h/2):g.rect(x,y+4,w,h);g.fill();g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(x,y,w,h,h/2):g.rect(x,y,w,h);g.fill()}
function wt(s,x,y,sz,col,al,mw){g.font='900 '+sz+'px '+FNT;g.textAlign=al||'center';g.textBaseline='middle';g.fillStyle=col;g.fillText(s,x,y,mw||W-60)}
function drawBug(b,x,y){
 const atk=b.state==='attack',warn=b.state==='warn';
 const jx=warn&&!reduceMotion?Math.sin(tt*30)*1.5:0;
 const k=!b.angry?(BUGK[b.col]||'bG'):atk?'aAtk':warn?'aWarn':'aCalm';
 sprW(k,x+jx,y+BH/2+8,atk?92:86);
}
function drawFrog(){
 let k;
 if(st==='over')k=why==='hunger'?'fHungry':'fDizzy';
 else if(dizzy>0)k='fStung';
 else if(tongueT>0)k='fOpen';
 else if(sq>.05)k=perfT>0?'fPerfect':'fChew';
 else if(perfT>0)k='fPerfect';
 else if(st==='run'&&state.food<25)k='fHungry';
 else k=Math.floor(tt/.6)%2?'f1':'f0';
 spr(k,FX,FY+50,112);
}
function draw(){
 g.setTransform(DPR,0,0,DPR,0,0);
 g.fillStyle='#4fb7f5';g.fillRect(0,0,W,H);
 if(ok(SCN)){const h=SCN.naturalHeight*W/SCN.naturalWidth;g.drawImage(SCN,0,H-h,W,h)}
 spr('cloud',90+Math.sin(tt*.2)*6,206,46);spr('cloud2',330+Math.sin(tt*.25+1)*6,172,34);
 spr('pad',TX+4,GY+30,52);
 const slide=dropT>0?BH*(dropT/.1):0;
 for(let i=SLOTS-1;i>=0;i--)drawBug(state.bugs[i],TX,TY-BH*i-slide);
 g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=2.5;g.setLineDash([6,6]);g.beginPath();g.moveTo(AIM_X+14,state.aimY);g.lineTo(TX-BW/2+6,state.aimY);g.stroke();g.setLineDash([]);
 g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(TX+BW/2+8,TY-HIT);g.lineTo(TX+BW/2+16,TY-HIT);g.lineTo(TX+BW/2+16,TY+HIT);g.lineTo(TX+BW/2+8,TY+HIT);g.stroke();
 if(tongueT>0){const a=A.tongue,x0=FX+30,y0=FY-23,x1=TX-BW/2+16,y1=tongueY,len=Math.hypot(x1-x0,y1-y0),th=a?a[3]*len/a[2]:12;g.save();g.translate(x0,y0);g.rotate(Math.atan2(y1-y0,x1-x0));if(a&&ok(SPR))g.drawImage(SPR,a[0],a[1],a[2],a[3],0,-th/2,len,th);g.restore()}
 drawFrog();

 spr('arrow',AIM_X,state.aimY+11,22);
 fxs.forEach(f=>{const al=Math.max(0,1-f.t/.6),y=f.y-f.t*60;if(f.s==='MISS')spr('miss',f.x,y+18,40,al);else if(f.s.indexOf('PERFECT')===0){spr('perfect',150,y-34,50,al);g.globalAlpha=al;tx(f.s.slice(7).trim(),232,y-52,20,'#ffd23f');g.globalAlpha=1}else{g.globalAlpha=al;tx(f.s,f.x,y,22,f.col);g.globalAlpha=1}});
 if(state.combo>=2&&st==='run'){spr('x2',FX-6,FY-36,56);wt('x'+state.combo,FX-4,FY-62,22,state.combo>=15?'#ff4f7a':state.combo>=5?'#e08a00':'#3b2a4f')}
 pill(12,10,108,40);for(let i=0;i<HEARTS;i++)spr(i<state.hearts?'hOn':'hOff',36+i*30,42,23);
 pill(128,10,144,40);wt(String(state.pts),200,31,24,'#3b2a4f','center',136);
 pill(280,10,108,40);wt('Lv.'+level(),334,31,20,'#3b2a4f','center',96);
 const bx=60,by=58,bw=W-120,bh=26;sprBox('barE',bx,by,bw,bh);
 if(state.food>0){const low=state.food<20,v=state.food/FULL;g.save();g.beginPath();g.rect(bx+5,by,(bw-10)*v,bh);g.clip();if(low){g.filter='hue-rotate(-90deg) saturate(1.4)'}sprBox('barF',bx+5,by+5,bw-10,bh-10);g.restore()}
 g.font='900 12px '+FNT;g.textAlign='right';g.textBaseline='middle';g.fillStyle='#fff';g.strokeStyle='rgba(30,60,100,.6)';g.lineWidth=3;g.lineJoin='round';g.strokeText('{{t:frog.msg.007}}',bx-6,by+bh/2);g.fillText('{{t:frog.msg.007}}',bx-6,by+bh/2);
 if(lvlT>0&&st==='run')tx('LEVEL UP  +'+FROG_REWARD+' 點',W/2,140,26,'#ffd23f');
 if(flash>0){const v=g.createRadialGradient(200,300,140,200,300,380);v.addColorStop(0,'rgba(255,80,110,0)');v.addColorStop(1,'rgba(255,80,110,'+Math.min(.45,flash*3)+')');g.fillStyle=v;g.fillRect(0,0,W,H)}
 if(st!=='run'){
  g.fillStyle='rgba(30,60,110,.38)';g.fillRect(0,0,W,H);
  const PADX=36,PADY=22,CW=W-72,TW=CW-PADX*2;
  const wrapT=(t,sz)=>{t=window.deepSeaI18n?deepSeaI18n.text(String(t)):String(t);g.font='900 '+sz+'px '+FNT;const parts=/\s/.test(t)?t.split(/(\s+)/):[...t],out=[];let cur='';parts.forEach(p=>{const nx=cur+p;if(cur.trim()&&g.measureText(nx).width>TW&&!/^\s+$/.test(p)&&!/^[，。！？、：；）」』]$/.test(p)){out.push(cur.trim());cur=p.trimStart()}else cur=nx});if(cur.trim())out.push(cur.trim());return out};
  const block=(items,top)=>{const rows=[];items.forEach(it=>wrapT(it[0],it[1]).forEach(l=>rows.push([l,it[1],it[2]])));const lh=r=>Math.round(r[1]*1.4),tot=rows.reduce((a,r)=>a+lh(r),0)+PADY*2;
   g.fillStyle='rgba(30,60,100,.2)';g.beginPath();g.roundRect?g.roundRect(38,top+6,CW,tot,24):g.rect(38,top+6,CW,tot);g.fill();g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(36,top,CW,tot,24):g.rect(36,top,CW,tot);g.fill();
   let y=top+PADY;rows.forEach(r=>{const h=lh(r);wt(r[0],W/2,y+h/2,r[1],r[2],'center',TW);y+=h});return top+tot};
  if(st==='ready'){tx('{{t:frog.msg.008}}',W/2,128,38,'#7ed957');const b=block([['{{t:frog.msg.009}}',15,'#3b2a4f'],['{{t:frog.msg.010}}',15,'#3b2a4f'],['{{t:frog.msg.011}}',15,'#e5486e']],156);tx('{{t:frog.msg.012}}',W/2,b+38+Math.sin(tt*4)*2,22,'#ffd23f')}
  else{tx(why==='hunger'?'{{t:frog.msg.013}}':'{{t:frog.msg.014}}',W/2,120,32,'#ff7a9a');const it=[[state.eaten+' 隻',40,'#3b2a4f'],['分數 '+state.pts+'　到達 Lv.'+level(),16,'#5c4a70'],[earned>0?'本局入帳 '+fmt(earned)+' 點':'沒吃滿 '+REWARD_EVERY+' 隻，沒有點數',17,earned>0?'#e08a00':'#5c4a70']];if(rec)it.push(['{{t:frog.msg.015}}',17,'#e5486e']);const b=block(it,146);tx('{{t:frog.msg.016}}',W/2,b+36+Math.sin(tt*4)*2,19,'#ffd23f')}}
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
