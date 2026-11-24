  /* ---------- Sneak Out: retro office comic, endless levels with milestone bonuses credited when reached ---------- */
  var sneakBusy=false,sneakStake=0;
  (function(){
const c=$('sk-canvas'),g=c.getContext('2d'),W=400;
const sneakConsole=c.closest('.sneak-console');
// Milestones count completed levels; calibrated with a reaction-time simulation (see GAME_RULES.md).
const MILESTONES=[[9,3],[11,7],[13,15],[16,30]],ENDLESS_FROM=16,ENDLESS_STEP=3,ENDLESS_BONUS=40;
function bonusAt(n){for(const m of MILESTONES)if(m[0]===n)return m[1];return n>ENDLESS_FROM&&(n-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0}
function nextMilestone(n){for(const m of MILESTONES)if(m[0]>n)return m;return [ENDLESS_FROM+(Math.floor((n-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]}
let best=0;try{const n=Number(localStorage.getItem('sneak'));if(Number.isFinite(n))best=Math.max(0,Math.floor(n))}catch(e){}
const texts={title:'{{t:sneak.msg.001}}',tap:'{{t:sneak.msg.002}}',caught:'{{t:sneak.msg.003}}',reach:n=>'離大門只差 '+n+'%',done:n=>'本局通過 '+n+' 關',rec:'{{t:sneak.msg.004}}',ok:'{{t:sneak.msg.006}}'};const T=k=>texts[k];
const quotes=['{{t:sneak.msg.007}}','{{t:sneak.msg.008}}','{{t:sneak.msg.009}}'];
let sneakAnalytics=null;
let prevBest=0,earned=0,pops=[],st='ready',sneaking=sneakRules.create(),flash=0,shake=0,last=0,rec=false,qi=0;
let mouseHold=false,keyHold=false,sneakRandom=Math.random;
const sneakRank=timedLeaderboard('sneak','sk',sneakRules.inputCount,ui);
function saySneak(text,kind=''){$('sk-msg').textContent=text;$('sk-msg').className='msg'+(kind?' '+kind:'')}
function remember(){if(sneaking.score>best){best=sneaking.score;try{localStorage.setItem('sneak',best)}catch(e){}}}
function setHold(value){
 if(st==='run'&&sneakRules.input(sneaking,value?0:1))sneakRank.record(value?0:1);
}
function release(){mouseHold=false;keyHold=false;setHold(false)}
function ui(){
 sneakConsole.dataset.phase=st;
 const progress=sneakRules.routeProgress(sneaking);
 sneakConsole.style.setProperty('--sk-progress',Math.min(1,progress/100));
 const nx=nextMilestone(sneaking.score);
 $('sk-stage').textContent=sneaking.lv;$('sk-progress').textContent=Math.floor(progress)+'%';$('sk-best').textContent=best;$('sk-next').textContent='完成 '+nx[0]+' 關 · +'+nx[1];
 $('sk-amount').disabled=sneakBusy;
 $('sk-go').disabled=st==='run'||sneakRank.busy();$('sk-go').textContent=st==='run'?'{{t:sneak.msg.010}}':'{{t:sneak.msg.011}}';$('sk-hold').disabled=st!=='run';
 const patrol=sneakRules.guard(sneaking);
 const sheltered=sneakRules.inCover(sneaking);
 const visitorAlert=sneakRules.visitorApproaching(sneaking);
 const visitorWatching=sneakRules.visitorWatching(sneaking);
 const hallway=sneakRules.inHallway(sneaking);
 const bossLooking=sneaking.ph==='look'&&!sheltered;
 const danger=visitorWatching||patrol?.watching||bossLooking;
 const caution=visitorAlert||patrol?.near||(sneaking.ph==='warn'&&!sheltered);
 const signal=st!=='run'?(st==='dead'?'{{t:sneak.msg.012}}':'{{t:sneak.msg.013}}')
   :hallway?'{{t:sneak.msg.029}}'
   :visitorWatching?'{{t:sneak.msg.023}}'
   :patrol?.watching?'{{t:sneak.msg.026}}'
   :bossLooking?'{{t:sneak.msg.014}}'
   :visitorAlert?'{{t:sneak.msg.022}}'
   :patrol?.near?'{{t:sneak.msg.025}}'
   :sheltered?'{{t:sneak.msg.027}}'
   :sneaking.ph==='return'?'{{t:sneak.msg.030}}'
   :sneaking.ph==='leave'?'{{t:sneak.msg.031}}'
   :caution?'{{t:sneak.msg.015}}':'{{t:sneak.msg.016}}';
 if($('sk-signal').textContent!==signal)$('sk-signal').textContent=signal;
 $('sk-signal').dataset.state=danger?'look':caution?'warn':'away';
 $('sk-difficulty').textContent='需移動約 '+Math.round(sneakRules.fullTravelTime(sneaking))+' 秒 · '+(sneaking.lv>=4?'{{t:sneak.msg.017}}':'{{t:sneak.msg.018}}');
}
function die(){
 if(st!=='run')return;
 AN.end(sneakAnalytics,earned,earned>0?'complete':'loss',{stage:sneaking.lv,progress_percent:Math.floor(sneakRules.routeProgress(sneaking))});
 st='dead';sneakBusy=false;release();rec=sneaking.score>0&&sneaking.score>=best&&sneaking.score>prevBest;
 shake=reduceMotion?0:.4;qi=Math.floor(Math.random()*quotes.length);
 saySneak((sneaking.caughtBy==='visitor'?'{{t:sneak.msg.024}}':sneaking.caughtBy==='guard'?'{{t:sneak.msg.028}}':'被老闆發現！')+'共通過 '+sneaking.score+' 關，'+(earned>0?'本局入帳 '+fmt(earned)+' 點。':'{{t:sneak.msg.019}}'),earned>0?'win':'lose');
 sneakRank.finish(sneaking.score);
 ui();
}
function award(n,b){earned+=b;S.balance+=b;save();renderAll();AN.progress(sneakAnalytics,{stage:n,bonus_points:b});pops.push({n:n,b:b,age:0});if(pops.length>3)pops.shift();saySneak('完成 '+n+' 關！獎勵 +'+b+' 點已入帳，本局累計 +'+earned+' 點。','win')}
function nextStage(done){
 remember();AN.progress(sneakAnalytics,{stage:done},true);
 const bonus=bonusAt(sneaking.score);
 if(bonus)award(sneaking.score,bonus);
 else saySneak('第 '+done+' 關溜走了！下一關馬上開始。','win');
 flash=.8;shake=0;release();
 AN.resume(sneakAnalytics,{stage:sneaking.lv});
 ui();c.focus();
}
function update(dt){
 if(st!=='run')return;
 const event=sneakRules.advance(sneaking,dt,sneakRandom);
 if(event==='caught')die();
 else if(event)nextStage(event);
}
function sync(now){
 const ms=Math.max(0,now-last);last=now;
 if(!$('view-sneak').hidden&&!document.hidden)sneakRank.update(ms,()=>st==='run',update);
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){saySneak(LOW_MSG,'lose');return;}
 sneakRank.start(random=>{
  sneakRandom=random||Math.random;sneaking=sneakRules.create(sneakRandom);
  sneakAnalytics=AN.start('sneak',amount);sneakStake=amount;sneakBusy=true;save();renderAll();
  rec=false;earned=0;pops=[];prevBest=best;flash=0;shake=0;release();
  AN.resume(sneakAnalytics,{stage:sneaking.lv});
  saySneak('{{t:sneak.msg.020}}');
  st='run';last=performance.now();ui();c.focus();
 }, undefined, {rulesVersion:sneakRules.rulesVersion});
}
const art={};
const bossSteps=['boss-walk-a','boss-walk-b','boss-walk-c','boss-walk-d'];
for(const name of [...bossSteps,'boss-turn','boss-sit','rainy-office','hallway','step-a','step-shoe','walk-cycle','work','away','warn','look','visitor-teal','visitor-rust']){
 const image=new Image();
 image.src='games/sneak/art/'+name+'.webp';
 art[name]=image;
}
function sprite(name,x,y,height){
 const image=art[name];
 if(!image.naturalWidth)return;
 const width=height*image.naturalWidth/image.naturalHeight;
 g.drawImage(image,x-width/2,y-height,width,height);
}
// Positions are in the original walking sprite's 300 px coordinate space.
const sneakStepLength=46;
function drawSneakLeg(phase,hipX,far){
 const planted=phase<.5, t=(phase%.5)*2;
 const swing=(1-Math.cos(t*Math.PI))/2;
 const ankleX=94+sneakStepLength*(planted?.5-t:swing-.5);
 const lift=planted?0:Math.sin(t*Math.PI)**2*19;
 const roll=.36+.30*(planted?(1-Math.cos(t*Math.PI))/2:(1+Math.cos(t*Math.PI))/2);
 const ankleY=298-lift-(27*Math.sin(roll)-12*Math.cos(roll)+6);
 const kneeX=(hipX+ankleX)/2+8+lift*.45,kneeY=(168+ankleY)/2-3-lift*.3;
 g.lineJoin='round';
 g.beginPath();
 g.moveTo(hipX-17,142);g.quadraticCurveTo(hipX+6,140,hipX+15,168);
 g.lineTo(kneeX+15,kneeY-5);g.quadraticCurveTo(kneeX+19,kneeY+4,kneeX+12,kneeY+13);
 g.lineTo(ankleX+8,ankleY-2);g.quadraticCurveTo(ankleX,ankleY+3,ankleX-9,ankleY-2);
 g.lineTo(kneeX-12,kneeY+8);g.quadraticCurveTo(kneeX-17,kneeY+1,kneeX-14,kneeY-6);
 g.lineTo(hipX-20,184);g.closePath();
 g.fillStyle=far?'#423b35':'#655b4d';g.fill();
 g.strokeStyle='#171618';g.lineWidth=5;g.stroke();
 g.beginPath();g.moveTo(hipX+4,179);g.lineTo(kneeX+4,kneeY-1);g.lineTo(kneeX-5,kneeY+8);
 g.moveTo(kneeX+1,kneeY+17);g.lineTo(ankleX+3,ankleY-9);
 g.strokeStyle=far?'#332b28':'#443b34';g.lineWidth=3;g.stroke();

 const shoe=art['step-shoe'];
 if(shoe.naturalWidth){
  g.save();g.translate(ankleX,ankleY);g.rotate(roll);
  if(far)g.filter='brightness(.77)';
  g.drawImage(shoe,-13,-18,44,36);g.restore();
  g.beginPath();g.moveTo(ankleX-5,ankleY-6);g.lineTo(ankleX+5,ankleY-6);
  g.lineTo(ankleX+5,ankleY+1);g.quadraticCurveTo(ankleX,ankleY+4,ankleX-5,ankleY+1);
  g.closePath();g.fillStyle=far?'#454039':'#6c6051';g.fill();
  g.strokeStyle='#25201d';g.lineWidth=2;g.stroke();
 }
}
// walk-cycle.webp: 8 frames of 256x384 (sprite-gen run, design/walk-cycle-v1.png); feet rest on row 348, body centre near x 138.
const walkFrames=8,walkCellW=256,walkCellH=384,walkFootY=348,walkCenterX=138,walkBodyH=270;
function drawWalkCycle(x,y,height,distance){
 const sheet=art['walk-cycle'];
 const scale=height/walkBodyH;
 const phase=reduceMotion?.3:(distance/(height*.45))%1;
 const frame=Math.floor(phase*walkFrames)%walkFrames;
 g.drawImage(sheet,frame*walkCellW,0,walkCellW,walkCellH,
   x-walkCenterX*scale,y-walkFootY*scale,walkCellW*scale,walkCellH*scale);
}
function drawSneakingPlayer(x,y,height,walking,distance){
 if(!walking){sprite('work',x,y,height);return}
 if(art['walk-cycle'].naturalWidth){drawWalkCycle(x,y,height,distance);return}
 const torso=art['step-a'];
 if(!torso.naturalWidth)return;
 const scale=height/300;
 const phase=reduceMotion?.16:(distance/(2*sneakStepLength*scale))%1;
 // The body is lowest when both feet are on the floor (phase 0 and .5) and rocks slightly with each stride.
 const dip=reduceMotion?0:Math.cos(phase*Math.PI*2)**2*4;
 const rock=reduceMotion?0:Math.sin(phase*Math.PI*2)*.03;
 g.save();g.translate(x-torso.naturalWidth/2*scale,y-height);g.scale(scale,scale);
 drawSneakLeg((phase+.5)%1,91,true);
 drawSneakLeg(phase,101,false);
 g.translate(0,dip);g.translate(100,150);g.rotate(rock);g.translate(-100,-150);
 // Preserve the original inked torso and bag, clipping away the old stride.
 g.beginPath();g.moveTo(0,0);g.lineTo(torso.naturalWidth,0);g.lineTo(torso.naturalWidth,147);
 g.lineTo(102,147);g.lineTo(92,151);g.lineTo(80,160);g.lineTo(73,184);g.lineTo(0,184);
 g.closePath();g.clip();g.drawImage(torso,0,0);
 g.restore();
}
function drawCoworker(floorY,roomHeight){
 const v=sneaking.visitor;
 if(!v||st==='ready')return;
 const fraction=v.age/sneakRules.visitorDuration;
 const x=32+v.checkpoint*3.4+94-fraction*155;
 const y=floorY-18;
 g.save();
 g.globalAlpha=Math.min(1,fraction*8,(1-fraction)*8);
 g.fillStyle='#0b1425a0';
 g.beginPath();g.ellipse(x,y-2,17,3,0,0,Math.PI*2);g.fill();
 const name=(sneaking.lv+v.index)%2===0?'visitor-teal':'visitor-rust';
 const bob=reduceMotion?0:Math.abs(Math.sin(v.age*10))*2;
 sprite(name,x,y-bob,roomHeight*.20);
 const watching=sneakRules.visitorWatching(sneaking);
 if(watching||sneakRules.visitorApproaching(sneaking)){
  g.textAlign='center';g.textBaseline='middle';g.font='900 24px system-ui,sans-serif';
  g.lineWidth=5;g.strokeStyle='#101521';g.fillStyle=watching?'#ff7462':'#ffbd55';
  g.strokeText('!',x,y-roomHeight*.23);g.fillText('!',x,y-roomHeight*.23);
 }
 g.restore();
}
const routeX=progress=>32+progress*3.4;
function drawCover(floorY,roomHeight,foreground){
 const layout=sneakRules.stageLayout(sneaking);
 for(const [start,end] of layout.cover){
  const x=routeX(start),width=routeX(end)-x,high=roomHeight*.183;
  const hiding=sneaking.pr>=start&&sneaking.pr<=end;
  if(hiding!==foreground)continue;
  g.save();g.globalAlpha=hiding?.74:1;
  const top=floorY-high;
  g.fillStyle='#354543';g.fillRect(x,top,width,high);
  g.fillStyle='#7b876f';g.fillRect(x+3,top+3,width-6,high-8);
  g.strokeStyle='#141e20';g.lineWidth=3;g.strokeRect(x,top,width,high);
  for(let i=0;i<3;i++){
   const y=top+5+i*(high-10)/3;
   g.strokeRect(x+4,y,width-8,(high-10)/3);
   g.fillStyle='#b4a482';g.fillRect(x+width/2-4,y+5,8,2);
  }
  g.restore();
 }
}
function drawGuard(patrol,floorY,roomHeight){
 if(!patrol)return;
 const x=routeX(patrol.x),direction=patrol.direction;
 const base=floorY-28;
 const length=routeX(15)-routeX(0);
 g.save();g.translate(x,base);g.scale(direction,1);
 if(patrol.active){
  const light=g.createLinearGradient(5,0,length,0);
  light.addColorStop(0,'#ffc16a70');light.addColorStop(1,'#ffc16a12');
  g.beginPath();g.moveTo(22*roomHeight/440,-12*roomHeight/440);
  g.lineTo(length,1);g.lineTo(length,24);g.closePath();
  g.fillStyle=light;g.fill();
  g.strokeStyle=patrol.watching?'#ff7462':'#e6b873';g.lineWidth=1.5;g.stroke();
 }
 g.scale(roomHeight/440,roomHeight/440);
 const stride=reduceMotion?4:Math.sin(sneaking.clock*11)*8;
 g.lineCap='round';g.lineJoin='round';
 g.beginPath();g.moveTo(-4,-23);g.lineTo(-4-stride,-3);g.lineTo(1-stride,-2);
 g.moveTo(5,-23);g.lineTo(5+stride,-3);g.lineTo(11+stride,-2);
 g.strokeStyle='#101922';g.lineWidth=9;g.stroke();
 g.strokeStyle='#34495c';g.lineWidth=5;g.stroke();
 g.beginPath();g.moveTo(-11,-22);g.lineTo(-9,-45);g.quadraticCurveTo(1,-52,10,-44);
 g.lineTo(12,-21);g.closePath();g.fillStyle='#455e71';g.fill();g.strokeStyle='#111a22';g.lineWidth=3;g.stroke();
 g.beginPath();g.ellipse(2,-54,8,10,0,0,Math.PI*2);
 g.fillStyle='#d9ad7f';g.fill();g.stroke();
 g.beginPath();g.moveTo(-8,-58);g.lineTo(-5,-66);g.lineTo(8,-66);g.lineTo(11,-59);g.lineTo(15,-57);g.lineTo(-8,-57);g.closePath();
 g.fillStyle='#34495c';g.fill();g.stroke();
 g.fillStyle='#e6bf74';g.fillRect(3,-43,4,5);
 g.beginPath();g.moveTo(3,-39);g.lineTo(13,-27);g.lineTo(16,-14);
 g.strokeStyle='#141e24';g.lineWidth=8;g.stroke();g.strokeStyle='#587282';g.lineWidth=5;g.stroke();
 g.fillStyle='#14202a';g.fillRect(12,-16,11,7);
 g.fillStyle='#ffe2a1';g.fillRect(21,-15,3,5);
 g.restore();
}
function drawBoss(deskX,deskY,floorY,roomTop,roomHeight,room){
 const walk=sneakRules.bossWalk(sneaking);
 if(!walk){sprite(sneaking.ph,deskX,deskY,roomHeight*.15);return}

 // The boss walks in the aisle, turns around the desk corner, then sits behind it.
 const progress=walk.leaving?1-walk.progress:walk.progress;
 const aisle=Math.min(1,progress/.49);
 const corner=Math.max(0,Math.min(1,(progress-.49)/.21));
 const behind=Math.max(0,Math.min(1,(progress-.70)/.17));
 const x=deskX-102+aisle*42+corner*19+behind*41;
 const feet=floorY-roomHeight*(.012+.069*corner);
 const pose=progress>=.87?'boss-sit'
   :progress>=.49&&progress<.70?'boss-turn'
   :bossSteps[reduceMotion?1:Math.floor(walk.progress*12)%bossSteps.length];
 const sitting=Math.max(0,Math.min(1,(progress-.92)/.08));
 g.save();
 g.globalAlpha=1-sitting;
 if(walk.leaving&&bossSteps.includes(pose)){
  g.translate(x,0);g.scale(-1,1);sprite(pose,0,feet,roomHeight*.275);
 }else sprite(pose,x,feet,roomHeight*.275);
 g.restore();

 // Restore the desk front over the legs as the boss moves behind it.
 if(room.naturalWidth){
  const left=226,width=126,top=.643,height=.134;
  g.drawImage(room,left/W*room.naturalWidth,top*room.naturalHeight,
    width/W*room.naturalWidth,height*room.naturalHeight,
    left,roomTop+top*roomHeight,width,height*roomHeight);
 }
 if(sitting>0){
  g.save();g.globalAlpha=sitting;sprite('away',deskX,deskY,roomHeight*.15);g.restore();
 }
}
// hallway.webp: a GPT-drawn corridor (design/hallway-v1-raw.png) with no desks, tiled in one direction so rain never flips.
const hallTileWidth=342;
function drawHallway(room,top,height,left){
 const hall=art.hallway;
 if(left>=0||!hall.naturalWidth)return;
 for(let i=Math.ceil(-left/hallTileWidth);i>0;i--)g.drawImage(hall,-i*hallTileWidth,top,hallTileWidth+1,height);
}
function draw(){
 const cssWidth=c.clientWidth||W,cssHeight=c.clientHeight||600;
 const height=cssHeight*W/cssWidth;
 const scale=Math.min(2,window.devicePixelRatio||1);
 const pixelsWide=Math.round(cssWidth*scale),pixelsHigh=Math.round(cssHeight*scale);
 if(c.width!==pixelsWide)c.width=pixelsWide;
 if(c.height!==pixelsHigh)c.height=pixelsHigh;
 g.setTransform(pixelsWide/W,0,0,pixelsHigh/height,0,0);
 g.fillStyle='#0c1e2e';
 g.fillRect(0,0,W,height);

 const roomHeight=Math.min(570,height*.67);
 const roomTop=Math.max(112,height*.72-roomHeight*.82);
 const deskY=roomTop+roomHeight*.644, floorY=roomTop+roomHeight*.82;
 const hallway=sneakRules.inHallway(sneaking);
 const warning=!hallway&&sneaking.ph==='warn', looking=!hallway&&sneaking.ph==='look';
 const room=art['rainy-office'];
 const bossX=W*.709;
 const entryLength=sneakRules.entryDistance(sneaking);
 const distance=sneaking.entry+sneaking.pr*3.4;
 const playerX=32-entryLength+distance;
 const camera=Math.min(0,Math.max(-entryLength,playerX-120));
 const walking=st==='run'&&sneaking.hold;

 g.save();
 if(shake>0)g.translate((Math.random()-.5)*8,0);
 g.translate(-camera,0);
 drawHallway(room,roomTop,roomHeight,camera);
 if(room.naturalWidth)g.drawImage(room,0,roomTop,W,roomHeight);
 else{
  g.fillStyle='#233a51';g.fillRect(camera,roomTop,W-camera,roomHeight*.77);
  g.fillStyle='#a46e3c';g.fillRect(235,deskY,110,floorY-deskY);
  g.fillStyle='#edbc65';g.fillRect(358,deskY-65,34,floorY-deskY+65);
 }
 if(!hallway)drawBoss(bossX,deskY,floorY,roomTop,roomHeight,room);
 drawGuard(sneakRules.guard(sneaking),floorY,roomHeight);
 drawCoworker(floorY,roomHeight);
 drawCover(floorY,roomHeight,false);
 g.fillStyle='#0b1425a0';
 g.beginPath();g.ellipse(playerX,floorY-1,19,4,0,0,Math.PI*2);g.fill();
 drawSneakingPlayer(playerX,floorY,roomHeight*(walking?.21:.225),walking,distance);
 drawCover(floorY,roomHeight,true);

 if(warning||looking){
  const markY=deskY-roomHeight*.165;
  g.textAlign='center';g.textBaseline='middle';
  g.font='italic 900 38px system-ui,sans-serif';
  g.lineWidth=6;g.strokeStyle='#101521';
  g.fillStyle=warning?'#ffbd55':'#ff7462';
  g.strokeText(looking?'!!':'!',bossX+39,markY);
  g.fillText(looking?'!!':'!',bossX+39,markY);
 }
 g.restore();

 if(st==='run'){
  g.textAlign='center';g.textBaseline='middle';
  if(flash>0){
   g.fillStyle='#081521ed';g.fillRect(90,roomTop+18,220,38);
   g.fillStyle='#ffedc5';g.font='800 20px system-ui,sans-serif';
   g.fillText(T('ok'),W/2,roomTop+37,204);
  }
  pops.forEach((p,index)=>{
   g.globalAlpha=Math.max(0,1-p.age/2.2);
   const y=floorY+24+index*24-(reduceMotion?0:Math.min(1,p.age*3)*16);
   g.fillStyle='#091725';g.fillRect(78,y-11,244,22);
   g.fillStyle='#ffbe55';g.font='800 16px system-ui,sans-serif';
   g.fillText('{{t:sneak.msg.021}}'+p.b,W/2,y,224);
  });
  g.globalAlpha=1;
  return;
 }

 g.fillStyle='#090e19a8';g.fillRect(0,0,W,height);
 const center=height*.43;
 g.save();
 g.translate(W/2,center);
 g.rotate(reduceMotion?0:-.035);
 g.fillStyle='#ffedc5';g.strokeStyle='#121a24';g.lineWidth=4;
 g.fillRect(-162,-45,324,st==='ready'?94:134);
 g.strokeRect(-162,-45,324,st==='ready'?94:134);
 g.textAlign='center';g.textBaseline='middle';
 g.font='900 30px system-ui,sans-serif';g.fillStyle=st==='ready'?'#101b27':'#942d25';
 g.fillText(st==='ready'?T('title'):T('caught'),0,-15,295);
 g.font='700 15px system-ui,sans-serif';g.fillStyle='#1a2431';
 if(st==='ready')g.fillText(T('tap'),0,19,290);
 else{
  g.fillText(quotes[qi],0,14,290);
  g.fillText(T('reach')(100-Math.floor(sneakRules.routeProgress(sneaking))),0,37,290);
  g.fillText(T('done')(sneaking.score)+(earned>0?' · +'+earned:''),0,60,290);
  if(rec)g.fillText(T('rec'),0,78,290);
 }
 g.restore();
}

$('sk-go').addEventListener('click',start);
function press(e){if(e.button!==undefined&&e.button!==0)return;if(st!=='run'||$('view-sneak').hidden||document.hidden)return;e.preventDefault();sync(performance.now());if(st!=='run')return;c.focus();mouseHold=true;setHold(true);try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}ui()}
function lift(){sync(performance.now());mouseHold=false;setHold(keyHold)}
[c,$('sk-hold')].forEach(el=>{el.addEventListener('pointerdown',press);['pointerup','pointercancel','lostpointercapture'].forEach(type=>el.addEventListener(type,lift))});
addEventListener('keydown',e=>{if($('view-sneak').hidden||document.hidden||st!=='run'||e.repeat||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if([' ','ArrowRight','d'].includes(e.key)){e.preventDefault();sync(performance.now());if(st==='run'){keyHold=true;setHold(true);}}});
addEventListener('keyup',e=>{if([' ','ArrowRight','d'].includes(e.key)){if(!$('view-sneak').hidden)e.preventDefault();sync(performance.now());keyHold=false;setHold(mouseHold)}});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
function loop(t){sync(t);if(!$('view-sneak').hidden&&!document.hidden){if(shake>0)shake=Math.max(0,shake-.016);if(flash>0)flash=Math.max(0,flash-.016);pops.forEach(p=>p.age+=.016);pops=pops.filter(p=>p.age<2.2);ui();draw();}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();

