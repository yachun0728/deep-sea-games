  /* ---------- Sky Builder: crane-stacking tower; fixed skill milestones award bonus points immediately ---------- */
  var sbBusy=false,sbStake=0,sbSay=function(){};
  (function(){
const c=$('sb-canvas'),g=c.getContext('2d'),W=400,H=560,BASE=480,BW=92,BH=62,PX=200,PY=60,L=140,OL='#2b2d42';
const MILESTONES=[10,20,30],BONUS=5;
let best=0;try{best=+localStorage.getItem('deep-sea-skybuilder-best')||0}catch(e){}
let analytics=null,paid=0,awarded=new Set();

const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw)};
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
const PAL=[['#ffb4a2','#e5989b','#b5838d'],['#a8dadc','#74b9c2','#457b9d'],['#ffe28a','#f2c14e','#c99a2e'],['#cdb4db','#a98bc4','#7a5c99'],['#b7e4c7','#74c69d','#40916c']];
const COL={Perfect:'#ffd23f',Great:'#6cf0a8',Good:'#6cc4ff',Average:'#ffffff',Poor:'#ffa062',Fail:'#ff5d5d'};
const PTS={Perfect:100,Great:70,Good:50,Average:30,Poor:10};
const rate=a=>a<=4?'Perfect':a<=12?'Great':a<=24?'Good':a<=38?'Average':a<=56?'Poor':'Fail';
let st='ready',ph='swing',blocks,tilt,td,cam,phs=0,t=0,sc,combo,drop,fall,wait,pops,parts,msg,over,shake=0,rec=false,last=0;
function reset(){blocks=[{lx:0}];tilt=0;td=0;cam=0;sc=0;combo=0;drop=null;fall=null;wait=0;ph='swing';pops=[];parts=[];msg='';over=0;shake=0}
reset();
const Ht=()=>blocks.length*BH;
const floors=()=>blocks.length-1;
function hook(){const n=blocks.length,th=Math.min(.82,.5+n*.02)*Math.sin(phs);return{x:PX+L*Math.sin(th),y:PY+L*Math.cos(th)}}
function burst(x,y,col,n){for(let i=0;i<n;i++)parts.push({x,y,vx:rnd(-160,160),vy:rnd(-260,-40),l:1,c:col,r:rnd(2,5)})}
function say(text,kind){$('sb-msg').textContent=text;$('sb-msg').className='msg'+(kind?' '+kind:'')}
sbSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const n=floors(),live=st==='run',next=MILESTONES.find(x=>!awarded.has(x));
 setText('sb-floors',n+' 層');setText('sb-score',String(sc));setText('sb-best',best+' 層');setText('sb-pay',fmt(paid)+' 點');
 setText('sb-next',next?next+' 層 · +'+BONUS+' 點':'本局 BONUS 全數達成');
 $('sb-amount').disabled=sbBusy;$('sb-go').disabled=live;setText('sb-go',live?'蓋樓中 · 點畫面放下樓層':st==='over'?'免費再蓋一次':'免費開始蓋樓');
 document.querySelectorAll('[data-sb-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.dataset.sbTier))?'step':'false'));
}
function end(){
 if(st!=='run')return;
 st='over';const n=floors();rec=n>best;
 if(rec){best=n;try{localStorage.setItem('deep-sea-skybuilder-best',best)}catch(e){}}
 AN.end(analytics,paid,'loss',{score:sc,floors:n,total_bonus_points:paid});sbBusy=false;renderAll();
 const why=msg==='collapse'?'大樓倒塌了':'樓層沒有蓋上去';
 say(why+'，本局 '+n+' 層、'+sc+' 分。BONUS 共 '+paid+' 點已入帳。',paid?'win':'');
 ui();
}
function awardBonus(){
 if(st!=='run')return;
 const n=floors();
 for(const milestone of MILESTONES){
  if(n<milestone||awarded.has(milestone))continue;
  awarded.add(milestone);paid+=BONUS;S.balance+=BONUS;save();renderAll();
  AN.progress(analytics,{step:n,score:sc,floors:n,milestone,bonus_points:BONUS,total_bonus_points:paid});
  pops.push({s:'BONUS +'+BONUS,x:W/2,y:210,t:0,c:'#ffd23f'});
  say('達成 '+milestone+' 層！BONUS +'+BONUS+' 點已入帳。','win');
 }
}
function land(topX,topH,topY,sn,cs){
const d=drop.x-topX,a=Math.abs(d),r=rate(a),bx=drop.x;
pops.push({s:r,x:bx,y:topY-24,t:0});
if(r==='Fail'){fall={x:bx,y:topY-BH,vx:(d>0?1:-1)*170,vy:-140,rot:0,sg:d>0?1:-1,i:blocks.length};ph='fail';msg='fail';combo=0;over=1.1;shake=reduceMotion?0:.3;burst(bx,topY,'#ffffff',10);drop=null;return}
blocks.push({lx:(bx-PX)*cs-topH*sn});
if(r==='Perfect'){tilt-=Math.sign(tilt)*Math.min(Math.abs(tilt),4);combo++;burst(bx,topY,'#ffd23f',22);if(combo>1)pops.push({s:'x'+combo,x:bx,y:topY+8,t:0,c:'#ffd23f'})}
else{tilt+=d*.34;if(r==='Great')tilt-=Math.sign(tilt)*Math.min(Math.abs(tilt),1.5);combo=0;burst(bx,topY,'#e9e2d0',8)}
sc+=PTS[r]+(r==='Perfect'?25*Math.max(0,combo-1):0);
shake=reduceMotion?0:.12;drop=null;
if(Math.abs(tilt)>45){tilt=Math.sign(tilt)*115;ph='collapse';msg='collapse';over=1.7;shake=reduceMotion?0:.5;burst(PX,BASE+cam,'#d9c9a3',26)}
else{awardBonus();ph='wait';wait=.4}}
function update(dt){
t+=dt;if(shake>0)shake-=dt;
if(st==='run')phs+=Math.min(3.3,1.6+blocks.length*.07)*dt;
cam+=(Math.max(0,Ht()-150)-cam)*Math.min(1,dt*4);
td+=(tilt-td)*Math.min(1,dt*(ph==='collapse'?2.2:5));
parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=700*dt;p.l-=dt*1.6});parts=parts.filter(p=>p.l>0);
pops.forEach(p=>p.t+=dt);pops=pops.filter(p=>p.t<1);
if(st!=='run')return;
if(ph==='wait'){wait-=dt;if(wait<=0)ph='swing'}
if(ph==='drop'){
drop.vy+=3200*dt;drop.y+=drop.vy*dt;
const tp=blocks[blocks.length-1],r=td*Math.PI/180,sn=Math.sin(r),cs=Math.cos(r),h=Ht();
const topX=PX+tp.lx*cs+h*sn,topH=h*cs-tp.lx*sn,topY=BASE+cam-topH;
if(drop.y+BH>=topY)land(topX,topH,topY,sn,cs)}
if(ph==='fail'){fall.vy+=2600*dt;fall.x+=fall.vx*dt;fall.y+=fall.vy*dt;fall.rot+=fall.sg*5*dt;over-=dt;if(over<=0)end()}
if(ph==='collapse'){over-=dt;if(over<=0)end()}}
function floor(lx,y,i){
const x=lx-BW/2,p=PAL[i%PAL.length],gr=g.createLinearGradient(0,y,0,y+BH);gr.addColorStop(0,p[0]);gr.addColorStop(1,p[1]);
RR(x,y,BW,BH,6,gr,3);
g.fillStyle=p[2];g.fillRect(x+3,y+3,BW-6,7);
g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x+4,y+12,4,BH-18);
if(i===0){RR(lx-11,y+BH-36,22,36,4,'#8d5524',2.5);g.fillStyle='#ffd23f';g.beginPath();g.arc(lx+6,y+BH-18,2,0,7);g.fill();[x+10,x+BW-28].forEach(wx=>RR(wx,y+22,18,20,3,'#ffe27a',2.5));return}
const k=i%3;
[x+14,x+BW-36].forEach(wx=>{
if(k===1){g.beginPath();g.moveTo(wx,y+46);g.lineTo(wx,y+28);g.arc(wx+11,y+28,11,Math.PI,0);g.lineTo(wx+22,y+46);g.closePath();O('#ffe27a',2.5)}
else if(k===2)C(wx+11,y+32,12,'#ffe27a',2.5);
else RR(wx,y+20,22,26,3,'#ffe27a',2.5);
g.strokeStyle=OL;g.lineWidth=1.5;g.beginPath();g.moveTo(wx+11,y+20);g.lineTo(wx+11,y+46);g.moveTo(wx,y+33);g.lineTo(wx+22,y+33);g.stroke();
RR(wx-2,y+46,26,8,2,'#e76f51',2)})}
function roof(lx,y){RR(lx+16,y-34,12,20,2,'#b5838d',2.5);g.beginPath();g.moveTo(lx-BW/2-8,y);g.lineTo(lx,y-36);g.lineTo(lx+BW/2+8,y);g.closePath();O('#e63946',3)}
function crane(h){
g.fillStyle='#ffb703';g.fillRect(366,38,22,H);g.strokeStyle=OL;g.lineWidth=2;g.strokeRect(366,38,22,H);
g.beginPath();for(let y=46;y<H;y+=26){g.moveTo(366,y);g.lineTo(388,y+26);g.moveTo(388,y);g.lineTo(366,y+26)}g.stroke();
g.beginPath();for(let x=36;x<350;x+=24){g.moveTo(x,44);g.lineTo(x+12,62);g.lineTo(x+24,44)}g.stroke();
RR(20,32,360,12,3,'#ffb703',2.5);RR(30,60,330,5,2,'#ffb703',2);
RR(24,44,26,22,3,'#6c757d',2.5);RR(334,12,32,26,5,'#e63946',2.5);RR(340,18,14,10,2,'#bfe9ff',2);
RR(PX-11,44,22,16,3,OL,2);
g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(PX,60);g.lineTo(h.x,h.y);g.stroke();
C(h.x,h.y,5,'#ffd23f',2.5)}
function draw(){
const k=cl(Ht()/1600,0,1),a=mix([143,211,255],[43,45,110],k),b=mix([255,233,208],[120,90,170],k);
const sg=g.createLinearGradient(0,0,0,H);sg.addColorStop(0,'rgb('+a+')');sg.addColorStop(1,'rgb('+b+')');
const ox=shake>0?(Math.random()-.5)*10:0;
g.save();g.translate(ox,0);
g.fillStyle=sg;g.fillRect(-20,0,W+40,H);
if(k>.2){for(let i=0;i<40;i++){g.globalAlpha=k*(.5+.5*Math.sin(t*2+i));g.fillStyle='#fff';g.beginPath();g.arc((i*97)%400,(i*53)%330,1.5,0,7);g.fill()}g.globalAlpha=1}
g.fillStyle='rgba(255,255,255,.85)';
for(let i=0;i<5;i++){const x=((i*150+t*10)%560)-80,y=((i*95+80+cam*.2*(1+i%2))%420)+30;g.beginPath();g.arc(x,y,18,0,7);g.arc(x+22,y-8,22,0,7);g.arc(x+46,y,16,0,7);g.fill()}
const gy=BASE+cam;
if(gy<H+80){
g.fillStyle='#4a6fa5';for(let i=0;i<10;i++){const bh=40+((i*37)%70);g.fillRect(i*46-10,gy-bh,38,bh)}
g.fillStyle='#7bd88f';g.fillRect(-20,gy,W+40,16);g.fillStyle='#8a5a44';g.fillRect(-20,gy+16,W+40,H);g.fillStyle='#7a4c38';for(let i=0;i<8;i++)g.fillRect(i*60-20,gy+40+(i%3)*30,36,8);
g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(-20,gy);g.lineTo(W+20,gy);g.stroke()}
g.save();g.translate(PX,gy);g.rotate(td*Math.PI/180+(reduceMotion?0:Math.sin(t*2.4)*(Math.abs(td)/45)*.03));
blocks.forEach((bk,i)=>floor(bk.lx,-(i+1)*BH,i));
const tp=blocks[blocks.length-1];roof(tp.lx,-blocks.length*BH);
g.restore();
if(fall){g.save();g.translate(fall.x,fall.y+BH/2);g.rotate(fall.rot);floor(0,-BH/2,fall.i);g.restore()}
const h=hook();crane(h);
if(ph==='swing'){g.strokeStyle=OL;g.lineWidth=2.5;g.beginPath();g.moveTo(h.x,h.y);g.lineTo(h.x-BW/2+6,h.y+12);g.moveTo(h.x,h.y);g.lineTo(h.x+BW/2-6,h.y+12);g.stroke();floor(h.x,h.y+10,blocks.length)}
if(drop)floor(drop.x,drop.y,drop.sp);
parts.forEach(p=>{g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()});g.globalAlpha=1;
g.restore();
pops.forEach(p=>{g.globalAlpha=1-p.t;tx(p.s,p.x,p.y-p.t*60,p.c?22:30,p.c||COL[p.s]);g.globalAlpha=1});
tx(String(sc),16,112,38,'#fff','left');tx(floors()+' 層 · BONUS +'+paid,16,138,16,'#fff','left');tx('最佳 '+best+' 層',16,160,14,'#ffd23f','left');
if(st!=='run'){
g.fillStyle='rgba(27,27,47,.5)';g.fillRect(0,0,W,H);
if(st==='ready'){tx('蓋樓大師',W/2,250,34,'#ffd23f');tx('到操作區免費開始',W/2,300,22,'#fff')}
else{tx(msg==='collapse'?'大樓倒塌了！':'沒蓋上去！',W/2,215,28,'#ff7a7a');tx(floors()+' 層',W/2,278,52,'#fff');tx('分數 '+sc,W/2,312,20,'#fff');tx('BONUS 已入帳 '+fmt(paid)+' 點',W/2,346,22,paid>0?'#ffd23f':'#fff');if(rec)tx('新紀錄！',W/2,376,20,'#ffd23f');tx('到操作區再蓋一次',W/2,412,20,'#fff')}}}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 analytics=AN.start('skybuilder',amount);sbStake=amount;sbBusy=true;save();renderAll();
 reset();paid=0;awarded.clear();rec=false;st='run';last=performance.now();say('開工！點畫面放下樓層，越準越穩。');ui();c.focus();
}
function act(){
 if(st!=='run'||ph!=='swing'||$('view-skybuilder').hidden||document.hidden)return false;
 const h=hook();drop={x:h.x,y:h.y+10,vy:80,sp:blocks.length};ph='drop';return true}
$('sb-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(st==='run'){e.preventDefault();c.focus();act()}else say(st==='over'?'這一局已結算。按「免費再蓋一次」開始新的一局。':'先按「免費開始蓋樓」。')});
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('view-skybuilder').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(e.key===' '||e.key==='ArrowDown'){e.preventDefault();if(!e.repeat)act()}});
addEventListener('blur',()=>{last=performance.now()});
document.addEventListener('visibilitychange',()=>{last=performance.now()});
window.addEventListener('pagehide',e=>{if(!e.persisted&&st==='run'){AN.end(analytics,paid,'abandoned',{score:sc,floors:floors(),total_bonus_points:paid});analytics=null;st='over';sbBusy=false;}},{capture:true});
window.addEventListener('hashchange',()=>{last=performance.now()});
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;if(!$('view-skybuilder').hidden&&!document.hidden){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
