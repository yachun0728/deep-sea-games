  /* ---------- Rooftop Cat: endless rooftop run; milestone bonuses are credited to the shared wallet when reached ---------- */
  var catBusy=false,catStake=0,catSay=function(){};
  (function(){
const c=$('ct-canvas'),g=c.getContext('2d'),W=400,H=560,CX=110,OL='#1b1b2f';
// Milestones are deliberately far apart. Distances were calibrated by simulating noisy players (see GAME_RULES.md):
// ~35% of average players reach 150 m, ~7% reach 300 m (break-even: 3+7 = 10), and 1,000 m is for the best players only.
const MILESTONES=[[150,3],[300,7],[500,15],[750,30],[1000,60]],ENDLESS_FROM=1000,ENDLESS_STEP=250,ENDLESS_BONUS=40,LADDER=[150,300,500,750,1000,1250];
const bonusAt=m=>{for(const t of MILESTONES)if(t[0]===m)return t[1];return m>ENDLESS_FROM&&(m-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0};
const nextMilestone=s=>{for(const t of MILESTONES)if(t[0]>s)return t;return [ENDLESS_FROM+(Math.floor((s-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]};
let best=0;try{best=+localStorage.getItem('deep-sea-cat-best')||0}catch(e){}
let analytics=null,earned=0,awarded=0,pops=[];
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||4;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
function tx(s,x,y,sz,col){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
let st='ready',catRandom=Math.random,cat=catRules.create(),tt=0,shake=0,rec=false,last=0;
const catRank=timedLeaderboard('cat','ct',catRules.inputCount,ui);
const score=()=>catRules.score(cat);
function say(text,kind){$('ct-msg').textContent=text;$('ct-msg').className='msg'+(kind?' '+kind:'')}
catSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function award(m,b){
 earned+=b;S.balance+=b;save();renderAll();
 AN.progress(analytics,{step:m,score:m,bonus_points:b});
 pops.push({m:m,b:b,age:0});if(pops.length>3)pops.shift();
 say('到達 '+m+' 公尺！獎勵 +'+b+' 點已入帳，本局累計 +'+earned+' 點。','win');
}
function ui(){
 const s=score(),nx=nextMilestone(s),live=st==='run';
 setText('ct-score',s+' m');setText('ct-best',best+' m');setText('ct-next',nx[0]+' m · +'+nx[1]);
 $('ct-amount').disabled=catBusy;$('ct-go').disabled=live||catRank.busy();setText('ct-go',live?'{{t:cat.msg.001}}':st==='over'?'{{t:cat.msg.002}}':'{{t:cat.msg.003}}');
 let tier=0;LADDER.forEach(m=>{if(s>=m)tier=m});
 document.querySelectorAll('[data-ct-tier]').forEach(el=>el.setAttribute('aria-current',st!=='ready'&&tier>0&&Number(el.dataset.ctTier)===tier?'step':'false'));
}
function die(){
 if(st!=='run')return;
 st='over';cat.hold=false;shake=reduceMotion?0:.35;const s=score();rec=s>best;
 if(rec){best=s;try{localStorage.setItem('deep-sea-cat-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:s});catBusy=false;save();renderAll();
 if(!earned)say('跑了 '+s+' 公尺，這一局沒有獎勵。','lose');
 else say('跑了 '+s+' 公尺，本局共入帳 '+fmt(earned)+' 點。','win');
 catRank.finish(s);
 ui();
}
function update(dt){
 tt+=dt;if(shake>0)shake-=dt;
 pops.forEach(p=>{p.age+=dt});pops=pops.filter(p=>p.age<2.2);
 if(st!=='run'){cat.sq*=.86;return}
 catRules.advance(cat,dt,catRandom);
 const reached=score();
 while(awarded<reached){awarded++;const b=bonusAt(awarded);if(b)award(awarded,b)}
 if(cat.dead)die();
}
function drawCat(air){
const sw=air?0:Math.sin(tt*16)*7;g.lineCap='round';
const leg=(lx,d)=>{g.beginPath();g.moveTo(lx,-12);g.lineTo(lx+d,0);g.strokeStyle=OL;g.lineWidth=10;g.stroke();g.strokeStyle='#ff9f1c';g.lineWidth=5;g.stroke()};
leg(-9,air?-7:sw);leg(9,air?8:-sw);
const tw=Math.sin(tt*8)*6;
g.beginPath();g.moveTo(-15,-22);g.quadraticCurveTo(-36,-26+tw,-30,-50+tw);g.strokeStyle=OL;g.lineWidth=11;g.stroke();g.strokeStyle='#ff9f1c';g.lineWidth=6;g.stroke();
g.beginPath();g.ellipse(0,-22,19,14,0,0,7);O('#ff9f1c');
g.strokeStyle='#e36414';g.lineWidth=3;g.beginPath();[-6,2,10].forEach(x=>{g.moveTo(x,-34);g.lineTo(x,-27)});g.stroke();
g.beginPath();g.moveTo(4,-46);g.lineTo(6,-64);g.lineTo(18,-49);g.closePath();O('#ff9f1c');
g.beginPath();g.moveTo(20,-49);g.lineTo(29,-64);g.lineTo(31,-44);g.closePath();O('#ff9f1c');
C(15,-36,15,'#ff9f1c');
C(10,-38,5.5,'#fff',2);C(23,-38,5.5,'#fff',2);F(12,-38,2.8,OL);F(25,-38,2.8,OL);
F(29,-31,3.2,'#ff5d8f');g.globalAlpha=.55;F(6,-31,4,'#ff5d8f');g.globalAlpha=1;
g.strokeStyle=OL;g.lineWidth=2;g.beginPath();g.moveTo(28,-30);g.lineTo(41,-34);g.moveTo(28,-28);g.lineTo(41,-27);g.stroke()}
function draw(){
const ox=shake>0?(Math.random()-.5)*12:0;
g.save();g.translate(ox,0);
g.fillStyle='#2ec4b6';g.fillRect(-20,0,W+40,H);
C(300,120,48,'#fff1c1',4);F(286,108,8,'#ffe08a');F(312,134,5,'#ffe08a');
g.fillStyle='#1f9d93';
for(let i=0;i<8;i++){const x=((i*90-cat.dist*.15)%720+720)%720-100,h=110+(i*37)%70;g.beginPath();g.roundRect?g.roundRect(x,420-h,64,h+160,10):g.rect(x,420-h,64,h+160);g.fill()}
for(const r of cat.roofs){
g.beginPath();g.rect(r.x,r.y,r.w,H-r.y+10);O('#ff5d8f');
for(let wx=r.x+24;wx<r.x+r.w-30;wx+=56){g.beginPath();g.rect(wx,r.y+44,24,30);O('#ffd23f',3)}
if(r.w>170&&r.id%2){g.beginPath();g.rect(r.x+r.w-56,r.y-32,22,34);O('#fff1c1',3)}
g.beginPath();g.rect(r.x-8,r.y-4,r.w+16,16);O('#7b2cbf')}
g.save();g.translate(CX,cat.cy);g.scale(1+cat.sq*.4,1-cat.sq*.4);drawCat(!cat.on);g.restore();
g.restore();
const s=score(),nx=nextMilestone(s);
tx(s+' m',W/2,62,40,'#fff1c1');
if(st==='run')tx('下一個獎勵 '+nx[0]+' m · +'+nx[1]+' 點',W/2,92,15,'#9bfff0');
tx('最佳 '+best+' m',W-70,34,16,'#ffd23f');
tx('{{t:cat.msg.004}}'+earned+' 點',70,34,16,earned>0?'#ffd23f':'#fff1c1');
pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/2.2);const y=175-(reduceMotion?0:Math.min(1,p.age*3)*22);tx('+'+p.b+' 點',W/2,y,38,'#ffd23f');tx(p.m+' 公尺里程碑',W/2,y+28,17,'#fff1c1');g.globalAlpha=1});
if(st!=='run'){
g.fillStyle='rgba(27,27,47,.5)';g.fillRect(0,0,W,H);
if(st==='ready'){tx('{{t:cat.msg.005}}',W/2,240,36,'#ffd23f');tx('{{t:cat.msg.006}}',W/2,290,22,'#fff1c1')}
else{tx('{{t:cat.msg.007}}',W/2,205,34,'#ff5d8f');tx(s+' m',W/2,270,50,'#fff1c1');tx(earned>0?'{{t:cat.msg.008}}'+earned+' 點':'沒到 '+MILESTONES[0][0]+' 公尺，沒有獎勵',W/2,314,22,earned>0?'#ffd23f':'#fff1c1');if(rec)tx('{{t:cat.msg.009}}',W/2,348,20,'#ffd23f');tx('{{t:cat.msg.010}}',W/2,392,20,'#fff1c1')}}}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 catRank.start(random=>{
  catRandom=random||Math.random;cat=catRules.create(catRandom);
  analytics=AN.start('cat',amount);catStake=amount;catBusy=true;save();renderAll();
  shake=0;earned=0;awarded=0;pops=[];rec=false;st='run';last=performance.now();
  say('{{t:cat.msg.011}}');ui();c.focus();
 });
}
function down(){
 if(st!=='run'||$('view-cat').hidden||document.hidden)return false;
 catRules.input(cat,0);catRank.record(0);return true;
}
function release(){if(st==='run'&&catRules.input(cat,1))catRank.record(1)}
$('ct-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(down()){e.preventDefault();c.focus()}else if(st!=='run')say(st==='over'?'{{t:cat.msg.012}}':'{{t:cat.msg.013}}')});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,release));
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('view-cat').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)down()}});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')release()});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
function loop(t){
 const ms=Math.min(50,Math.max(0,t-last)||0);last=t;
 if(!$('view-cat').hidden&&!document.hidden){catRank.update(ms,()=>st==='run',update);ui();draw()}
 requestAnimationFrame(loop);
}
ui();draw();requestAnimationFrame(loop);
  })();

