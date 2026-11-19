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
function tx(s,x,y,sz,col){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
const CW=[26,34,44];
let st='ready',bird=birdRules.create(),hid=-1,fxs=[],tt=0,shake=0,rec=false,last=0;
const birdRank=timedLeaderboard('bird','pb',birdRules.inputCount,ui);
const score=()=>birdRules.score(bird);
function say(text,kind){$('pb-msg').textContent=text;$('pb-msg').className='msg'+(kind?' '+kind:'')}
birdSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const s=score(),live=st==='run';
 setText('pb-score',s+' m');setText('pb-boss',bird.eggs+' 隻');setText('pb-best',best+' m');
 $('pb-amount').disabled=birdBusy;$('pb-go').disabled=live||birdRank.busy();setText('pb-go',live?'奔跑中 · 點畫面跳躍':st==='over'?'再跑一次':'開始奔跑');
}
function die(){
 if(st!=='run')return;
 st='over';shake=reduceMotion?0:.35;const s=score();rec=s>best;
 if(rec){best=s;try{localStorage.setItem('deep-sea-bird-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:s,bosses:bird.eggs});birdBusy=false;save();renderAll();
 if(!earned)say('跑了 '+s+' 公尺，這一局沒有額外成就獎勵。','lose');
 else say('跑了 '+s+' 公尺、擊退 '+bird.eggs+' 隻狼王，本局共入帳 '+fmt(earned)+' 點。','win');
 birdRank.finish(s);
 ui();
}
function update(dt){
 tt+=dt;if(shake>0)shake-=dt;
 fxs.forEach(f=>{f.t+=dt});fxs=fxs.filter(f=>f.t<.8);
 if(st!=='run')return;
 bird.advance(dt);
 if(bird.dead)die();
}
function birdEvent(event,alpha){
 if(event==='alpha'){AN.progress(analytics,{stage:bird.eggs+1,step:score(),phase:'alpha'});return}
 if(event==='hit'){shake=reduceMotion?0:.12;fxs.push({x:alpha.x,y:alpha.y-90,t:0,s:'啪！'});return}
 earned+=BOSS_REWARD;S.balance+=BOSS_REWARD;save();renderAll();
 AN.progress(analytics,{step:score(),score:score(),bosses:bird.eggs,bonus_points:BOSS_REWARD});
 fxs.push({x:W/2,y:200,t:0,s:'救回一顆蛋！ +'+BOSS_REWARD+' 點'});
 say('擊退狼王！救回第 '+bird.eggs+' 顆蛋，+'+BOSS_REWARD+' 點已入帳。','win');
}
function drawPoop(x,y,s,rot){
g.save();g.translate(x,y);if(rot)g.rotate(rot);g.scale(s,s);const w=4/s;
g.beginPath();g.ellipse(0,-12,34,18,0,0,7);O('#8d5524',w);
g.beginPath();g.ellipse(0,-34,26,15,0,0,7);O('#8d5524',w);
g.beginPath();g.ellipse(0,-52,17,12,0,0,7);O('#8d5524',w);
g.beginPath();g.moveTo(-6,-60);g.quadraticCurveTo(0,-82,8,-62);g.closePath();O('#8d5524',w);
C(-9,-34,5.5,'#fff',2/s);C(9,-34,5.5,'#fff',2/s);F(-8,-34,2.6,OL);F(10,-34,2.6,OL);
g.strokeStyle=OL;g.lineWidth=2.5/s;g.beginPath();g.arc(0,-28,6,.2,Math.PI-.2);g.stroke();
g.restore()}
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
if(al){g.beginPath();g.moveTo(-4,-54);g.lineTo(-2,-70);g.lineTo(4,-61);g.lineTo(8,-74);g.lineTo(12,-61);g.lineTo(18,-70);g.lineTo(20,-54);g.closePath();O('#ffd23f',3);g.strokeStyle='#d00000';g.lineWidth=2.5;g.beginPath();g.moveTo(1,-52);g.lineTo(11,-38);g.stroke()}}
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
function draw(){
const ox=shake>0?(Math.random()-.5)*12:0;
g.save();g.translate(ox,0);
g.fillStyle='#ffb703';g.fillRect(-20,0,W+40,H);
C(300,130,56,'#fb5607',4);C(300,130,32,'#ffd166',3);
g.fillStyle='#f48c06';
for(let i=0;i<6;i++){const x=((i*170-bird.dist*.2)%1020+1020)%1020-200;g.beginPath();g.ellipse(x+100,GY,140,80,0,Math.PI,0);g.fill()}
g.fillStyle='#7209b7';g.fillRect(-20,GY,W+40,H-GY);
g.fillStyle='#f72585';g.fillRect(-20,GY,W+40,16);
g.strokeStyle=OL;g.lineWidth=4;g.beginPath();g.moveTo(-20,GY);g.lineTo(W+20,GY);g.stroke();
g.fillStyle='#9d4edd';
for(let i=0;i<8;i++){const x=((i*70-bird.dist)%560+560)%560-80;g.fillRect(x,GY+44+(i%3)*22,26,8)}
for(const o of bird.obs){
if(o.k==='c'){drawCactus(o);label(o.x+CW[o.s]/2,GY-o.h,o.s,0)}
else{
g.save();g.translate(o.x+(o.hit>0&&!reduceMotion?Math.random()*8-4:0),o.y);g.scale(o.sc,o.sc);
if(o.dead){g.translate(30,-30);g.rotate(o.a);g.translate(-30,30)}
drawWolf(tt,o.k==='a'?'#8d99ae':'#adb5bd',o.k==='a');g.restore();
if(!o.dead){
if(o.k==='w')label(o.x+27*o.sc,o.y-80*o.sc,o.s,0);
else{label(o.x+60,o.y-200,0,1);for(let i=0;i<3;i++)C(o.x+30+i*28,o.y-218,8,i<o.hp?'#e63946':'#fff1c1',3)}}}}
bird.proj.forEach(p=>drawPoop(p.x,p.y+14,.4,tt*10));
g.save();g.translate(BX,bird.by);g.scale(1+bird.sq*.4,1-bird.sq*.4);drawBird(!bird.on);g.restore();
fxs.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,24,'#ffd23f');g.globalAlpha=1});
g.restore();
const s=score();
tx(s+' m',W/2,62,40,'#fff1c1');
drawEgg(24,40);tx('x'+bird.eggs,56,48,20,'#fff1c1');
tx('最佳 '+best+' m',W-70,34,16,'#fff1c1');
if(bird.warnT>0&&st==='run')tx('狼王來了！快丟便便',W/2,150,26,'#ff5d8f');
C(PB.x,PB.y,PB.r,bird.pcd>0?'#d9c9a3':'#fff1c1',4);drawPoop(PB.x,PB.y+20,.5);
if(bird.pcd>0){g.strokeStyle='#ff5d8f';g.lineWidth=5;g.beginPath();g.arc(PB.x,PB.y,PB.r+7,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-bird.pcd/.3));g.stroke()}
if(st!=='run'){
g.fillStyle='rgba(27,27,47,.55)';g.fillRect(0,0,W,H);
if(st==='ready'){tx('便便鳥大戰狼群',W/2,200,32,'#ffd23f');tx('狼群偷走了你的蛋！',W/2,252,19,'#fff1c1');tx('躲開障礙，再賞狼王一坨！',W/2,282,19,'#fff1c1');tx('到操作區開始',W/2,340,24,'#ffd23f')}
else{tx('哎喲！被撞到了',W/2,180,32,'#ff5d8f');tx(s+' m',W/2,244,50,'#fff1c1');tx('擊退狼王：'+bird.eggs+' 隻',W/2,284,20,'#fff1c1');tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'沒打贏狼王，沒有點數',W/2,320,22,earned>0?'#ffd23f':'#fff1c1');if(rec)tx('新紀錄！',W/2,352,20,'#ffd23f');tx('到操作區再跑一次',W/2,396,20,'#fff1c1')}}}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 birdRank.start(random=>{
  bird=birdRules.create(random||Math.random,birdEvent);
  analytics=AN.start('bird',amount);birdStake=amount;birdBusy=true;save();renderAll();
  earned=0;fxs=[];shake=0;rec=false;hid=-1;st='run';last=performance.now();say('出發！看障礙上方的標記決定點幾下，狼王出現就丟便便。');ui();c.focus();
 });
}
function pos(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function input(action){if(st==='run'&&bird.input(action)){birdRank.record(action);return true}return false}
function down(id){if(st!=='run'||$('view-bird').hidden||document.hidden)return false;hid=id;return input(0)}
function release(){input(1)}
function shoot(){input(2)}
$('pb-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
if(e.button!==undefined&&e.button!==0)return;
if(st!=='run'){say(st==='over'?'這一局已結算。按「再跑一次」開始新的一局。':'先按「開始奔跑」。');return}
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

