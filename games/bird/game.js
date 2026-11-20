  /* ---------- Poop Bird vs Wolves: original desert scene; distance plus alpha wolves beaten decide the return ---------- */
  var birdBusy=false,birdStake=0,birdSay=function(){};
  (function(){
const c=$('pb-canvas'),g=c.getContext('2d'),W=400,H=560,GY=440,BX=90,OL='#1b1b2f',PB={x:335,y:505,r:44};
const BOSS_REWARD=1;   // points credited the moment an alpha wolf is beaten; distance pays nothing
let best=0;try{best=+localStorage.getItem('deep-sea-bird-best')||0}catch(e){}
let analytics=null,earned=0;
const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||4;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw||3)};
const displayFont='"Nunito","Noto Sans TC","PingFang TC",system-ui,sans-serif';
function tx(s,x,y,sz,col){
 g.save();g.font='900 '+sz+'px '+displayFont;g.textAlign='center';g.lineJoin='round';
 g.lineWidth=Math.max(2,sz*.115);g.strokeStyle='#42241d';
 g.strokeText(s,x,y+1,W-32);
 g.fillStyle=col;g.fillText(s,x,y,W-32);g.restore();
}
const CW=[26,34,44];
/* Art from the approved boards (games/bird/design/); the old canvas drawing stays as fallback until every file has loaded. */
const ART_NAMES=['hero-run-v2','hero-jump-v2','hero-hit-v2','hero-idle-v2','wolf-runner','wolf-bruiser','wolf-leaper','alpha-normal','alpha-enraged','alpha-exhausted','alpha-hit','alpha-fall','cactus','barrel-cactus','bg-a','bg-b','bg-c','ground-a','ground-b','ground-c'];
const art={};ART_NAMES.forEach(n=>{const i=new Image();i.src='./games/bird/art/'+n+'.webp';art[n]=i});
let artOk=false;
const artReady=()=>artOk||(artOk=ART_NAMES.every(n=>art[n].complete&&art[n].naturalWidth>0));
function spr(n,cx,by,h,w,flip){const i=art[n],ww=w||h*i.naturalWidth/i.naturalHeight;if(!h)h=ww*i.naturalHeight/i.naturalWidth;g.save();g.translate(cx,by);if(flip)g.scale(-1,1);g.drawImage(i,-ww/2,-h,ww,h);g.restore()}
let biome=0,prevBiome=0,bfade=1,lastLv=0,streak=0;
/* Phone full screen: the canvas is taller than 560 so it fills the screen; the world stays bottom-aligned, extra rows are sky. */
const LIFT=90;let VH=H,fs=false;const fsq=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
function fit(){
 const width=c.clientWidth,height=c.clientHeight;
 if(!width||!height)return;
 fs=fsq.matches;VH=fs?Math.max(H,Math.round(W*height/width)):H;PB.y=VH-55;
 const dpr=Math.min(window.devicePixelRatio||1,3);
 const pixelsWide=Math.round(width*dpr),pixelsHigh=Math.round(height*dpr);
 if(c.width!==pixelsWide)c.width=pixelsWide;
 if(c.height!==pixelsHigh)c.height=pixelsHigh;
 g.setTransform(c.width/W,0,0,c.height/VH,0,0);
 g.imageSmoothingQuality='high';
}
// Distance drives the gait so a planted foot travels with the track.
const STRIDE=84,DUST_LIFE=.34;
let gait=0,dust=[];
let st='ready',bird=birdRules.create(),hid=-1,fxs=[],tt=0,shake=0,rec=false,last=0;
const birdRank=timedLeaderboard('bird','pb',birdRules.inputCount,ui,null,{canvas:'pb-canvas'});
const score=()=>birdRules.score(bird);
function say(text,kind){$('pb-msg').textContent=text;$('pb-msg').className='msg'+(kind?' '+kind:'')}
birdSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const s=score(),live=st==='run';
 setText('pb-score',s+' m');setText('pb-boss',bird.eggs+' 隻');setText('pb-best',best+' m');
 $('pb-amount').disabled=birdBusy;$('pb-go').disabled=live||birdRank.busy();setText('pb-go',live?'{{t:bird.msg.001}}':st==='over'?'{{t:bird.msg.002}}':'{{t:bird.msg.003}}');
}
function die(){
 if(st!=='run')return;
 draw(); // final running frame, so the share card snapshot matches the result
 st='over';shake=reduceMotion?0:.35;const s=score();rec=s>best;
 if(rec){best=s;try{localStorage.setItem('deep-sea-bird-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:s,bosses:bird.eggs});birdBusy=false;save();renderAll();
 if(!earned)say('跑了 '+s+' 公尺，這一局沒有額外成就獎勵。','lose');
 else say('跑了 '+s+' 公尺、擊退 '+bird.eggs+' 隻狼王，本局共入帳 '+fmt(earned)+' 點。','win');
 birdRank.finish(s);
 ui();
}
function update(dt){
 tt+=dt;if(shake>0)shake-=dt;if(bfade<1)bfade=Math.min(1,bfade+dt/1.2);
 fxs.forEach(f=>{f.t+=dt});fxs=fxs.filter(f=>f.t<.8);
 if(st!=='run')return;
 const before=bird.dist,wasGrounded=bird.on;
 bird.advance(dt);
 if(!reduceMotion)updateRunEffects(dt,bird.dist-before,wasGrounded);
 if(bird.level!==lastLv){lastLv=bird.level;streak=1}
 if(streak>0)streak=Math.max(0,streak-dt/1.2);
 if(bird.dead)die();
}
function birdEvent(event,alpha){
 if(event==='alpha'){AN.progress(analytics,{stage:bird.eggs+1,step:score(),phase:'alpha'});return}
 if(event==='hit'){shake=reduceMotion?0:.12;fxs.push({x:alpha.x,y:alpha.y-90,t:0,s:'{{t:bird.msg.004}}'});return}
 earned+=BOSS_REWARD;S.balance+=BOSS_REWARD;save();renderAll();
 AN.progress(analytics,{step:score(),score:score(),bosses:bird.eggs,bonus_points:BOSS_REWARD});
 fxs.push({x:W/2,y:200,t:0,s:'{{t:bird.msg.005}}'+BOSS_REWARD+' 點'});
 say('擊退狼王！救回第 '+bird.eggs+' 顆蛋，+'+BOSS_REWARD+' 點已入帳。','win');
}
function drawPoop(x,y,s,rot=0){
 g.save();g.translate(x,y);g.rotate(rot);g.scale(s,s);
 const glaze=g.createLinearGradient(0,-65,0,0);
 glaze.addColorStop(0,'#f6bb72');glaze.addColorStop(.5,'#a65b2b');glaze.addColorStop(1,'#66301e');
 g.beginPath();g.moveTo(-24,-3);
 g.bezierCurveTo(-42,-7,-38,-24,-23,-27);
 g.bezierCurveTo(-30,-37,-21,-46,-12,-46);
 g.bezierCurveTo(-16,-56,0,-57,3,-69);
 g.bezierCurveTo(12,-68,17,-57,11,-50);
 g.bezierCurveTo(27,-47,29,-34,21,-28);
 g.bezierCurveTo(40,-23,42,-7,25,-3);
 g.quadraticCurveTo(0,2,-24,-3);g.closePath();
 g.fillStyle=glaze;g.fill();g.strokeStyle='#492316';g.lineWidth=4;g.lineJoin='round';g.stroke();
 g.beginPath();g.moveTo(-22,-20);g.quadraticCurveTo(-13,-28,6,-23);
 g.moveTo(-12,-38);g.quadraticCurveTo(-4,-43,6,-41);
 g.strokeStyle='#ffc786';g.lineWidth=3.5;g.lineCap='round';g.stroke();g.restore();
}
function drawAttackButton(){
 const {x,y,r}=PB;
 const plate=g.createLinearGradient(x,y-r,x,y+r);
 const cooling=bird.pcd>0;
 plate.addColorStop(0,cooling?'#77574b':'#ffd27e');
 plate.addColorStop(.16,cooling?'#634239':'#c78245');
 plate.addColorStop(1,'#52281f');
 g.save();
 F(x,y+4,r+1,'rgba(57,26,19,.55)');
 F(x,y,r,plate);
 g.strokeStyle='#4a261c';g.lineWidth=3;g.stroke();
 g.beginPath();g.arc(x,y,r-5,0,Math.PI*2);
 g.strokeStyle=cooling?'#947560':'#ffca7c';g.lineWidth=2;g.stroke();
 for(const side of [-1,1])F(x+side*(r-10),y,2.2,'#f2b477');
 drawPoop(x,y+22,.64);
 if(cooling){
  g.beginPath();g.arc(x,y,r-4,-Math.PI/2,-Math.PI/2+Math.PI*2*cl(1-bird.pcd/.3,0,1));
  g.strokeStyle='#ffe0a0';g.lineWidth=4;g.lineCap='round';g.stroke();
 }
 g.restore();
}
function drawBird(air){
const sw=air?0:Math.sin(tt*18)*7;g.lineCap='round';
const leg=(lx,d)=>{g.beginPath();g.moveTo(lx,-8);g.lineTo(lx+d,0);g.strokeStyle=OL;g.lineWidth=9;g.stroke();g.strokeStyle='#ff9f1c';g.lineWidth=4;g.stroke()};
leg(-5,air?-6:sw);leg(7,air?6:-sw);
g.beginPath();g.moveTo(-18,-28);g.lineTo(-40,-40);g.lineTo(-36,-20);g.closePath();O('#00b4d8');
g.beginPath();g.arc(0,-28,22,0,7);O('#4cc9f0');
g.fillStyle='#caf0f8';g.beginPath();g.ellipse(4,-20,13,11,0,0,7);g.fill();
g.save();g.translate(-4,-28);g.rotate(air?-.8+Math.sin(tt*22)*.4:Math.sin(tt*18)*.25);g.beginPath();g.ellipse(-4,4,12,7,0,0,7);O('#00b4d8');g.restore();
C(-2,-52,4,'#f72585');C(6,-54,4,'#f72585');C(13,-50,4,'#f72585');
C(10,-34,7,'#fff',2.5);F(12,-34,3.2,OL);
g.beginPath();g.moveTo(18,-31);g.lineTo(37,-26);g.lineTo(18,-21);g.closePath();O('#ffbe0b');
g.globalAlpha=.6;F(6,-24,4,'#ff4d8d');g.globalAlpha=1}
function drawWolf(t,col,al){
const sw=Math.sin(t*14)*6;g.lineCap='round';
[10,22,40,52].forEach((lx,i)=>{g.beginPath();g.moveTo(lx,-14);g.lineTo(lx+(i%2?sw:-sw),0);g.strokeStyle=OL;g.lineWidth=10;g.stroke();g.strokeStyle=col;g.lineWidth=5;g.stroke()});
g.beginPath();g.moveTo(58,-30);g.quadraticCurveTo(82,-40,76,-64);g.quadraticCurveTo(66,-44,56,-22);g.closePath();O(col);
g.beginPath();g.ellipse(34,-28,28,17,0,0,7);O(col);
g.fillStyle='#e9ecef';g.beginPath();g.ellipse(30,-22,16,8,0,0,7);g.fill();
g.beginPath();g.moveTo(-2,-56);g.lineTo(2,-80);g.lineTo(15,-60);g.closePath();O(col);
g.beginPath();g.moveTo(14,-60);g.lineTo(26,-80);g.lineTo(30,-56);g.closePath();O(col);
C(8,-40,16,col);
g.beginPath();g.ellipse(-8,-34,10,7,0,0,7);O('#e9ecef');F(-16,-38,3.5,OL);F(-8,-27,3,'#ff4d6d');
C(6,-45,5,'#fff',2);F(4,-45,2.5,'#d00000');
g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(-3,-55);g.lineTo(13,-49);g.stroke();
if(al){g.beginPath();g.moveTo(-4,-54);g.lineTo(-2,-70);g.lineTo(4,-61);g.lineTo(8,-74);g.lineTo(12,-61);g.lineTo(18,-70);g.lineTo(20,-54);g.closePath();O('#ffcb64',3);g.strokeStyle='#d00000';g.lineWidth=2.5;g.beginPath();g.moveTo(1,-52);g.lineTo(11,-38);g.stroke()}}
function drawCactus(o){
const x=o.x,h=o.h,w=CW[o.s];
RR(x,GY-h,w,h,w/2,'#06d6a0');
RR(x-14,GY-h*.55,16,10,5,'#06d6a0');RR(x-14,GY-h*.55-16,10,24,5,'#06d6a0');
if(o.s>0){RR(x+w-2,GY-h*.7,16,10,5,'#06d6a0');RR(x+w+4,GY-h*.7-16,10,24,5,'#06d6a0')}
C(x+w/2,GY-h-3,6,'#ff4d8d',3);
C(x+w/2-5,GY-h+20,3.5,'#fff',2);C(x+w/2+5,GY-h+20,3.5,'#fff',2);F(x+w/2-4,GY-h+20,1.6,OL);F(x+w/2+6,GY-h+20,1.6,OL)}
function label(x,top,tier,poop){
if(x<20||x>W-20)return;
const y=Math.max(100,top-34),w=poop?46:tier===0?36:58;
RR(x-w/2,y-18,w,32,14,'#fff1c1',3);
if(poop)drawPoop(x,y+8,.4);
else{if(tier===0)F(x,y-4,4.5,OL);else{F(x-10,y-4,4.5,OL);F(x+10,y-4,4.5,OL)}
if(tier===2){g.fillStyle=OL;g.fillRect(x-16,y+4,32,4)}}}
function drawEgg(x,y){g.beginPath();g.ellipse(x,y,9,12,0,0,7);O('#fff1c1',3);F(x-3,y-2,1.8,'#ff9f1c');F(x+3,y+4,1.8,'#4cc9f0')}
function drawWorld(){
 const lv=bird.eggs%3;if(lv!==biome){prevBiome=biome;biome=lv;bfade=0}
 const layer=(b,al)=>{const bg=art['bg-'+'abc'[b]],gr=art['ground-'+'abc'[b]],bw=bg.naturalWidth,gw=gr.naturalWidth;
  g.globalAlpha=al;
  const k=Math.min(1.5,VH/H),bh=bg.naturalHeight,bx=-20/k-((bird.dist*.22)%bw),gx=-20-(bird.dist%gw);
  g.save();g.translate(0,GY);g.scale(k,k);
  g.drawImage(bg,bx,-bh);g.drawImage(bg,bx+bw,-bh);
  if(VH>H){const e=VH/k+2;g.drawImage(bg,0,0,bw,1,bx,-bh-e,bw,e);g.drawImage(bg,0,0,bw,1,bx+bw,-bh-e,bw,e)}
  g.restore();
  g.drawImage(gr,gx,GY-12,gw,H-GY+12);g.drawImage(gr,gx+gw,GY-12,gw,H-GY+12);
  if(fs){const e=LIFT+6,sy=gr.naturalHeight-1;g.drawImage(gr,0,sy,gw,1,gx,H-1,gw,e);g.drawImage(gr,0,sy,gw,1,gx+gw,H-1,gw,e)}
  g.globalAlpha=1};
 if(bfade<1)layer(prevBiome,1);
 layer(biome,bfade<1?bfade:1)}
function updateRunEffects(dt,distance,wasGrounded){
 for(const puff of dust)puff.age+=dt;
 dust=dust.filter(puff=>puff.age<DUST_LIFE);
 if(!bird.on)return;
 // On landing, start at contact and let subsequent steps alternate.
 const previous=gait;
 gait=wasGrounded?gait+distance:0;
 if(!wasGrounded||Math.floor(gait/(STRIDE/2))!==Math.floor(previous/(STRIDE/2))){
  dust.push({worldX:bird.dist+BX+(wasGrounded?24:0),age:0,landing:!wasGrounded});
 }
}
function drawRunDust(){
 const shades=['#ffd59a','#efb4b5','#ffc395'];
 for(const puff of dust){
  const life=puff.age/DUST_LIFE,x=puff.worldX-bird.dist;
  const size=(puff.landing?1.35:1)*(0.65+life*.85);
  g.globalAlpha=.46*(1-life)**2;
  for(let i=0;i<3;i++){
   F(x-i*(5+life*6),GY-3-life*(5+i*2),size*(3+i*1.8),shades[biome]);
  }
 }
 g.globalAlpha=1;
}
function drawRunningLeg(phase,hipX,hipY,far){
 // First half: plant and sweep backward. Second half: lift and swing forward.
 const planted=phase<.5,t=planted?phase*2:(phase-.5)*2;
 const ankleX=(planted?1-2*t:-Math.cos(t*Math.PI))*STRIDE/4;
 const ankleY=-4-(planted?0:Math.sin(t*Math.PI)*14);
 const kneeX=(hipX+ankleX)/2+5,kneeY=(hipY+ankleY)/2-2;
 g.save();g.lineCap='round';g.lineJoin='round';
 g.beginPath();g.moveTo(hipX,hipY);g.lineTo(kneeX,kneeY);g.lineTo(ankleX,ankleY);
 g.strokeStyle='#773018';g.lineWidth=7;g.stroke();
 g.strokeStyle=far?'#d36520':'#ff9c2d';g.lineWidth=4.2;g.stroke();
 g.translate(ankleX,ankleY);
 if(!planted)g.rotate(-Math.sin(t*Math.PI)*.62);
 // Narrow ankle, a short rear toe and two forward toes readable at game scale.
 g.beginPath();g.moveTo(-2,-4);g.quadraticCurveTo(1,-5,2,-3);
 g.quadraticCurveTo(3,-1,6,-2);g.quadraticCurveTo(10,-5,12,-3);
 g.quadraticCurveTo(14,-1,9,1);
 g.quadraticCurveTo(15,-1,15,2);g.quadraticCurveTo(14,4,10,4);
 g.lineTo(3,4);g.quadraticCurveTo(0,4,-1,2);
 g.quadraticCurveTo(-5,5,-7,3);g.quadraticCurveTo(-8,1,-4,0);
 g.quadraticCurveTo(-2,-1,-2,-4);g.closePath();
 const toe=g.createLinearGradient(0,-4,0,4);
 toe.addColorStop(0,far?'#e28127':'#ffc453');toe.addColorStop(1,far?'#a94113':'#da6a1c');
 g.fillStyle=toe;g.fill();g.strokeStyle='#773018';g.lineWidth=1.25;g.stroke();
 g.beginPath();g.moveTo(5,1);g.quadraticCurveTo(7,1,9,0);
 g.strokeStyle=far?'#9a411b':'#bf5c20';g.lineWidth=.9;g.stroke();
 g.restore();
}
function drawHero(){
 if(st==='run'&&bird.on){
  const phase=reduceMotion?.17:gait%STRIDE/STRIDE;
  const bob=reduceMotion?0:-Math.abs(Math.sin(phase*Math.PI*2))*2.5;
  drawRunningLeg((phase+.5)%1,-1,-19+bob,true);
  drawRunningLeg(phase,8,-18+bob,false);
  spr('hero-run-v2',-2,-13+bob,54);
  return;
 }
 if(st==='run')spr('hero-jump-v2',0,0,80);
 else if(st==='over')spr('hero-hit-v2',0,0,72);
 else spr('hero-idle-v2',0,0,92);
}
function drawWolfArt(o){
 const bob=reduceMotion?0:-Math.abs(Math.sin(tt*13+o.x*.05))*3;
 if(o.k==='a'){
  const n=o.dead?'alpha-fall':o.hit>0?'alpha-hit':o.hp>=3?'alpha-normal':o.hp===2?'alpha-enraged':'alpha-exhausted';
  if(n==='alpha-hit')spr(n,27,bob,62,null,true);else spr(n,27,o.dead?0:bob,0,90,true);return}
 if(o.dead)spr('wolf-leaper',27,0,60,null,true);
 else if(o.s===0)spr('wolf-runner',27,bob,64,103,true);
 else spr('wolf-bruiser',27,bob,72,null,true)}
function drawCactusArt(o){
 const cx=o.x+CW[o.s]/2;
 if(o.s===0)spr('barrel-cactus',cx,GY+2,44);
 else if(o.s===1)spr('cactus',cx,GY+2,o.h);
 else spr('cactus',cx,GY+2,o.h,74)}
function draw(){
fit();const ex=VH-H-(fs?LIFT:0);
const ox=shake>0?(Math.random()-.5)*12:0;
g.save();g.translate(ox,ex);
g.fillStyle='#ffb703';g.fillRect(-20,-ex,W+40,VH);
const A=artReady();
if(A)drawWorld();else{
C(300,130,56,'#fb5607',4);C(300,130,32,'#ffd166',3);
g.fillStyle='#f48c06';
for(let i=0;i<6;i++){const x=((i*170-bird.dist*.2)%1020+1020)%1020-200;g.beginPath();g.ellipse(x+100,GY,140,80,0,Math.PI,0);g.fill()}
g.fillStyle='#7209b7';g.fillRect(-20,GY,W+40,H-GY);
g.fillStyle='#f72585';g.fillRect(-20,GY,W+40,16);
g.strokeStyle=OL;g.lineWidth=4;g.beginPath();g.moveTo(-20,GY);g.lineTo(W+20,GY);g.stroke();
g.fillStyle='#9d4edd';
for(let i=0;i<8;i++){const x=((i*70-bird.dist)%560+560)%560-80;g.fillRect(x,GY+44+(i%3)*22,26,8)}
}
for(const o of bird.obs){
if(o.k==='c'){if(A)drawCactusArt(o);else drawCactus(o);label(o.x+CW[o.s]/2,GY-o.h,o.s,0)}
else{
g.save();g.translate(o.x+(o.hit>0&&!reduceMotion?Math.random()*8-4:0),o.y);g.scale(o.sc,o.sc);
if(o.dead){g.translate(30,-30);g.rotate(o.a);g.translate(-30,30)}
if(A)drawWolfArt(o);else drawWolf(tt,o.k==='a'?'#8d99ae':'#adb5bd',o.k==='a');g.restore();
if(!o.dead){
if(o.k==='w')label(o.x+27*o.sc,o.y-80*o.sc,o.s,0);
else{label(o.x+60,o.y-200,0,1);for(let i=0;i<3;i++)C(o.x+30+i*28,o.y-218,8,i<o.hp?'#e63946':'#fff1c1',3)}}}}
drawRunDust();
bird.proj.forEach(p=>drawPoop(p.x,p.y+14,.4,tt*10));
g.save();g.translate(BX,bird.by);g.scale(1+bird.sq*.4,1-bird.sq*.4);if(A)drawHero();else drawBird(!bird.on);g.restore();
fxs.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,24,'#ffcb64');g.globalAlpha=1});
if(streak>0&&!reduceMotion){g.globalAlpha=.55*Math.min(1,streak*2);g.strokeStyle='#fff';g.lineWidth=2;g.lineCap='round';
for(let i=0;i<9;i++){const y=-ex+((i*97+tt*700)%(VH-60))+20,x=((i*151-tt*1500)%520+520)%520-60;g.beginPath();g.moveTo(x,y);g.lineTo(x+70+i%3*30,y);g.stroke()}g.globalAlpha=1}
g.restore();
const s=score();
if(!fs){tx(s+' m',W/2,62,40,'#fff1c1');
drawEgg(24,40);tx('x'+bird.eggs,56,48,20,'#fff1c1');
tx('最佳 '+best+' m',W-70,34,16,'#fff1c1')}
if(bird.warnT>0&&st==='run')tx('{{t:bird.msg.006}}',W/2,fs?ex+170:150,26,'#ff886a');
if(st==='run')drawAttackButton();
if(st!=='run'){
g.fillStyle='rgba(44,26,36,.56)';g.fillRect(0,0,W,VH);
if(st==='ready'){tx('{{t:bird.msg.007}}',W/2,200,32,'#ffcb64');tx('{{t:bird.msg.008}}',W/2,252,19,'#fff1c1');tx('{{t:bird.msg.009}}',W/2,282,19,'#fff1c1');tx('{{t:bird.msg.010}}',W/2,340,24,'#ffcb64')}
else{tx('{{t:bird.msg.011}}',W/2,180,32,'#ff886a');tx(s+' m',W/2,244,50,'#fff1c1');tx('{{t:bird.msg.012}}'+bird.eggs+' 隻',W/2,284,20,'#fff1c1');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'{{t:bird.msg.013}}',W/2,320,22,earned>0?'#ffcb64':'#fff1c1');if(rec)tx('{{t:bird.msg.014}}',W/2,352,20,'#ffcb64');tx('{{t:bird.msg.015}}',W/2,396,20,'#fff1c1')}}}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 birdRank.start(random=>{
  bird=birdRules.create(random||Math.random,birdEvent);
  analytics=AN.start('bird',amount);birdStake=amount;birdBusy=true;save();renderAll();
  earned=0;fxs=[];dust=[];gait=0;shake=0;rec=false;hid=-1;biome=0;prevBiome=0;bfade=1;lastLv=0;streak=0;st='run';last=performance.now();say('{{t:bird.msg.016}}');ui();c.focus();
 });
}
function pos(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*VH/r.height}}
function input(action){if(st==='run'&&bird.input(action)){birdRank.record(action);return true}return false}
function down(id){if(st!=='run'||$('view-bird').hidden||document.hidden)return false;hid=id;return input(0)}
function release(){input(1)}
function shoot(){input(2)}
$('pb-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
if(e.button!==undefined&&e.button!==0)return;
if(st!=='run'){say(st==='over'?'{{t:bird.msg.017}}':'{{t:bird.msg.018}}');return}
if($('view-bird').hidden||document.hidden)return;e.preventDefault();c.focus();
const p=pos(e);
if(Math.hypot(p.x-PB.x,p.y-PB.y)<PB.r+10){shoot();return}
down(e.pointerId)});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,e=>{if(e.pointerId===hid)release()}));
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
if($('view-bird').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)down(-2)}
else if(e.key==='x'||e.key==='X'||e.key==='ArrowDown'||e.key==='p'||e.key==='P'){e.preventDefault();shoot()}});
addEventListener('keyup',e=>{if((e.key===' '||e.key==='ArrowUp')&&hid===-2)release()});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
function loop(t){
 const ms=Math.min(.05,Math.max(0,(t-last)/1000||0))*1000;last=t;
 if(!$('view-bird').hidden&&!document.hidden){birdRank.update(ms,()=>st==='run',update);ui();draw()}
 requestAnimationFrame(loop);
}
ui();draw();requestAnimationFrame(loop);
  })();

