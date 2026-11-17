  /* ---------- Rooftop Cat: original rooftop scene; distance at the fall decides the shared-wallet return ---------- */
  var catBusy=false,catStake=0,catSay=function(){};
  (function(){
const c=$('ct-canvas'),g=c.getContext('2d'),W=400,H=560,CX=110,OL='#1b1b2f';
const TIERS=[[300,5],[220,3.2],[150,2.2],[100,1.5],[60,1],[30,.5]];
let best=0;try{best=+localStorage.getItem('deep-sea-cat-best')||0}catch(e){}
let analytics=null,paid=0;
const mult=s=>{for(const t of TIERS)if(s>=t[0])return t[1];return 0};
const rnd=(a,b)=>a+Math.random()*(b-a);
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||4;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
function tx(s,x,y,sz,col){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
let st='ready',roofs,nid,cy,vy,on,offT,buf,hold=false,dist,v,tt=0,sq=0,shake=0,rec=false,last=0;
function reset(){roofs=[{x:-60,w:400,y:430,id:0}];nid=1;cy=430;vy=0;on=true;offT=0;buf=0;dist=0;v=230;sq=0;shake=0;fill()}
function fill(){while(true){const l=roofs[roofs.length-1];if(l.x+l.w>W+260)break;roofs.push({x:l.x+l.w+rnd(45,40+v*.42),w:rnd(120,240),y:Math.max(340,Math.min(470,l.y+rnd(-55,45))),id:nid++})}}
reset();
const score=()=>Math.floor(dist/60);
function say(text,kind){$('ct-msg').textContent=text;$('ct-msg').className='msg'+(kind?' '+kind:'')}
catSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const s=score(),m=mult(s),live=st==='run',pay=st==='over'?paid:Math.floor(catStake*m),net=pay-catStake;
 setText('ct-score',s+' m');setText('ct-best',best+' m');setText('ct-mult',fx(m)+'×');setText('ct-pay',fmt(pay)+' 點');
 setText('ct-net',catStake&&st!=='ready'?(net>0?'+':'')+fmt(net)+' 點':'—');$('ct-net').style.color=!catStake||st==='ready'?'':net>0?'var(--glow)':net<0?'var(--crush)':'var(--muted)';
 $('ct-amount').disabled=catBusy;$('ct-go').disabled=live;setText('ct-go',live?'奔跑中 · 點畫面跳躍':st==='over'?'扣點再跑一次':'扣點開始奔跑');
 let tier=0;TIERS.forEach(t=>{if(!tier&&s>=t[0])tier=t[0]});
 document.querySelectorAll('[data-ct-tier]').forEach(el=>el.setAttribute('aria-current',st!=='ready'&&Number(el.dataset.ctTier)===tier?'step':'false'));
}
function die(){
 if(st!=='run')return;
 st='over';hold=false;shake=reduceMotion?0:.35;const s=score(),m=mult(s);paid=Math.floor(catStake*m);rec=s>best;
 if(rec){best=s;try{localStorage.setItem('deep-sea-cat-best',best)}catch(e){}}
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,multiplier:m});catBusy=false;S.balance+=paid;save();renderAll();
 const net=paid-catStake;
 if(!paid)say('跑了 '+s+' 公尺，未滿 30 公尺，這一局領不到點數，失去 '+fmt(catStake)+' 點。','lose');
 else say('跑了 '+s+' 公尺，倍率 '+fx(m)+'×，領回 '+fmt(paid)+' 點，本局'+(net>=0?'淨賺 ':'淨損 ')+fmt(Math.abs(net))+' 點。',net>0?'win':'');
 ui();
}
function jump(){if(on||offT<.1){vy=-600;on=false;offT=1;sq=-.25}else buf=.12}
function update(dt){
tt+=dt;sq*=.86;if(shake>0)shake-=dt;
if(st!=='run')return;
v=Math.min(420,230+dist*.012);dist+=v*dt;
roofs.forEach(r=>r.x-=v*dt);roofs=roofs.filter(r=>r.x+r.w>-80);fill();
if(buf>0)buf-=dt;
const py=cy;vy+=(hold&&vy<0?1000:2100)*dt;cy+=vy*dt;
if(!on)offT+=dt;
let land=false;
for(const r of roofs){
if(CX+12>r.x&&CX-12<r.x+r.w){
if(vy>=0&&py<=r.y+14&&cy>=r.y){cy=r.y;vy=0;land=true}
else if(cy>r.y+14){die();return}}}
if(land){if(buf>0){vy=-600;buf=0;sq=-.25;on=false;offT=1}else{if(!on)sq=.25;on=true;offT=0}}else on=false;
if(cy>H+60)die()}
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
for(let i=0;i<8;i++){const x=((i*90-dist*.15)%720+720)%720-100,h=110+(i*37)%70;g.beginPath();g.roundRect?g.roundRect(x,420-h,64,h+160,10):g.rect(x,420-h,64,h+160);g.fill()}
for(const r of roofs){
g.beginPath();g.rect(r.x,r.y,r.w,H-r.y+10);O('#ff5d8f');
for(let wx=r.x+24;wx<r.x+r.w-30;wx+=56){g.beginPath();g.rect(wx,r.y+44,24,30);O('#ffd23f',3)}
if(r.w>170&&r.id%2){g.beginPath();g.rect(r.x+r.w-56,r.y-32,22,34);O('#fff1c1',3)}
g.beginPath();g.rect(r.x-8,r.y-4,r.w+16,16);O('#7b2cbf')}
g.save();g.translate(CX,cy);g.scale(1+sq*.4,1-sq*.4);drawCat(!on);g.restore();
g.restore();
const s=score();
tx(s+' m',W/2,62,40,'#fff1c1');
if(st==='run')tx(fx(mult(s))+'×',W/2,92,18,mult(s)>=1?'#ffd23f':'#fff1c1');
tx('最佳 '+best+' m',W-70,34,16,'#ffd23f');
if(st!=='run'){
g.fillStyle='rgba(27,27,47,.5)';g.fillRect(0,0,W,H);
if(st==='ready'){tx('屋頂貓貓',W/2,240,36,'#ffd23f');tx('右側扣點開始',W/2,290,22,'#fff1c1')}
else{tx('喵…摔下去了！',W/2,205,34,'#ff5d8f');tx(s+' m',W/2,270,50,'#fff1c1');tx(paid>0?'領回 '+fmt(paid)+' 點':'距離不夠，沒有點數',W/2,314,22,paid>0?'#ffd23f':'#fff1c1');if(rec)tx('新紀錄！',W/2,348,20,'#ffd23f');tx('右側可以再跑一次',W/2,392,20,'#fff1c1')}}}
function start(){
 if(st==='run')return;
 const amount=Number($('ct-amount').value);
 if(!Number.isSafeInteger(amount)||amount<MIN_BET){say('請輸入至少 '+MIN_BET+' 點的整數入場點數。','lose');return;}
 if(amount>S.balance){say('餘額不足，請降低入場點數。','lose');return;}
 analytics=AN.start('cat',amount);catStake=amount;catBusy=true;S.balance-=amount;save();renderAll();
 reset();paid=0;rec=false;hold=false;st='run';last=performance.now();say('出發！點畫面跳躍，按越久跳越高。');ui();c.focus();
}
function down(){if(st!=='run'||$('view-cat').hidden||document.hidden)return false;hold=true;jump();return true}
$('ct-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(down()){e.preventDefault();c.focus()}else if(st!=='run')say(st==='over'?'這一局已結算。按「扣點再跑一次」開始新的一局。':'先按「扣點開始奔跑」。')});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,()=>{hold=false}));
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('view-cat').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)down()}});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')hold=false});
addEventListener('blur',()=>{hold=false;last=performance.now()});
document.addEventListener('visibilitychange',()=>{hold=false;last=performance.now()});
window.addEventListener('hashchange',()=>{hold=false;last=performance.now()});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(!$('view-cat').hidden&&!document.hidden){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();

