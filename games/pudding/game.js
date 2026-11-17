  /* ---------- Pudding Dash: forge a weapon from puzzle pieces, then run; the weapon grid is the real hitbox ---------- */
  var puddingBusy=false,puddingStake=0,puddingSay=function(){};
  (function(){
const c=$('pd-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#1b1b2f',FONT='"Noto Sans TC",system-ui,sans-serif';
const PY=440,XMIN=60,XMAX=340,KEY_SPEED=230,PTR_SPEED=280;   // hero row, walking range, keyboard and press-and-hold speeds (px/s)
const CELL=20,WTOP=332,EW=54,EH=40;                          // weapon cell size, weapon top edge, enemy size
const SEGS=8,SEG_TIME=16,SPAWN_STOP=13,FIRST_SPAWN=.8,CAV_WARN=.6,ARROW_SPEED=420;
const SPEED_MUL={inf:1,cav:1.7,shield:.7},HURT={inf:10,cav:15,shield:12,arrow:8,pass:3},KILL={inf:10,cav:15,shield:20};
const SEG_SCORE=100,WIN_SCORE=500,CALM_SCORE=5,STREAK_STEP=8,STREAK_HEAL=5,SEG_HEAL=10;
const SEG_REWARD=1,WIN_REWARD=2;      // fixed points credited for each cleared segment, and once more for clearing all eight (8+2 = the 10-point entry fee)
const BLADE_DPS=4,SPEAR_BURST=3,SPEAR_CD=.5,SPEAR_KNOCK=22,BLADE_SLOW=.5,GUARD_PER=.05,GUARD_MAX=.6;
const SPAWN_X=[80,320],START_CELLS={b:[[1,3],[1,2]],m:[[2,3],[2,2]],d:[]};
// Per segment (1-8): spawn interval [min,max] s, base speed px/s, HP of infantry / cavalry / shield, spawn weights [infantry,cavalry,shield,archer].
const LV=[
 {iv:[.85,1.28],base:90,hp:{inf:5,cav:5,shield:10},w:[100,0,0,0]},
 {iv:[.77,1.19],base:100,hp:{inf:6,cav:5,shield:13},w:[80,20,0,0]},
 {iv:[.72,1.11],base:110,hp:{inf:8,cav:6,shield:16},w:[60,20,20,0]},
 {iv:[.68,1.02],base:120,hp:{inf:10,cav:8,shield:19},w:[40,20,20,20]},
 {iv:[.64,.98],base:130,hp:{inf:13,cav:10,shield:24},w:[35,20,20,25]},
 {iv:[.6,.94],base:140,hp:{inf:16,cav:13,shield:29},w:[30,25,20,25]},
 {iv:[.55,.89],base:150,hp:{inf:19,cav:16,shield:35},w:[30,25,25,20]},
 {iv:[.51,.85],base:160,hp:{inf:22,cav:19,shield:42},w:[25,25,30,20]}];
const TYPES={b:{n:'刃',f:'#e53935',d:'#8e1c1a'},m:{n:'矛',f:'#1e88e5',d:'#0d47a1'},d:{n:'盾',f:'#fdd835',d:'#a58b00'}};
// Puzzle pieces: cell offsets [x,y], weight in the random draw.
const SHAPES=[{c:[[0,0]],w:2},{c:[[0,0],[1,0]],w:3},{c:[[0,0],[1,0],[2,0]],w:3},{c:[[0,0],[0,1],[1,1]],w:3},{c:[[0,0],[1,0],[0,1],[1,1]],w:2},{c:[[0,0],[1,0],[2,0],[3,0]],w:1},{c:[[0,0],[0,1],[0,2],[1,2]],w:2},{c:[[0,0],[1,0],[2,0],[1,1]],w:2}];
const GX=96,GY=100,GC=52;           // forge grid on the canvas
let best=0;try{best=+localStorage.getItem('deep-sea-pudding-best')||0}catch(e){}
let analytics=null,earned=0;
const rnd=(a,b)=>a+Math.random()*(b-a);
function wpick(ws){let t=0;for(const w of ws)t+=w;let r=Math.random()*t;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<0)return i}return ws.length-1}
const RR=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
function tx(s,x,y,sz,col,al,plain){g.font=(plain?'600 ':'800 ')+sz+'px '+FONT;g.textAlign=al||'center';g.textBaseline='middle';g.lineJoin='round';if(!plain){g.lineWidth=sz/5;g.strokeStyle=OL;g.strokeText(s,x,y,W-30)}g.fillStyle=col;g.fillText(s,x,y,W-30)}
const inRect=(x,y,rx,ry,w,h)=>x>=rx&&x<rx+w&&y>=ry&&y<ry+h;
// ---- weapon grid ----
const emptyGrid=()=>[0,1,2,3].map(()=>[null,null,null,null]);
function startGrid(){const gr=emptyGrid();for(const t of['b','m','d'])for(const[cx,cy]of START_CELLS[t])gr[cy][cx]=t;return gr}
function computeStats(gr){
 const E={b:0,m:0,d:0},cs=emptyGrid().map(r=>r.map(()=>0)),cw=emptyGrid().map(r=>r.map(()=>0)),seen=emptyGrid().map(r=>r.map(()=>false));
 for(let r=0;r<4;r++)for(let q=0;q<4;q++){
  const t=gr[r][q];if(!t||seen[r][q])continue;
  const stack=[[q,r]],cells=[];seen[r][q]=true;
  while(stack.length){const[x,y]=stack.pop();cells.push([x,y]);
   for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<4&&ny>=0&&ny<4&&!seen[ny][nx]&&gr[ny][nx]===t){seen[ny][nx]=true;stack.push([nx,ny])}}}
  const s=cells.length,eff=s+Math.max(0,s-2);E[t]+=eff;   // a group of s cells counts as s + max(0, s-2) effective cells
  for(const[x,y]of cells){cs[y][x]=s;cw[y][x]=eff/s}}
 const cols=new Set(),rows=new Set();
 for(let r=0;r<4;r++)for(let q=0;q<4;q++)if(gr[r][q]){cols.add(q);rows.add(r)}
 return{E,cs,cw,bladeDps:BLADE_DPS*E.b,spear:SPEAR_BURST*E.m,guard:Math.min(GUARD_MAX,GUARD_PER*E.d),width:cols.size,length:rows.size}}
function rotateCells(cells){const q=cells.map(([x,y])=>[-y,x]),mx=Math.min(...q.map(p=>p[0])),my=Math.min(...q.map(p=>p[1]));return q.map(([x,y])=>[x-mx,y-my])}
const dims=cells=>({w:Math.max(...cells.map(p=>p[0]))+1,h:Math.max(...cells.map(p=>p[1]))+1});
// ---- state ----
let st='ready',ph='forge',why='',rec=false,tt=0,last=0,forgeCount=0;
let grid=startGrid(),stats=computeStats(grid),calm=100,score=0,killScore=0,segScore=0,calmBonus=0,winBonus=0,seg=1;
let cards=[],sel=-1,ghost=null,flashCells=[],flashT=0,fPhase='edit',fT=0;
let rt=0,spawnT=0,enemies=[],warns=[],archers=[],arrows=[],dying=[],floats=[],lastX=-999,streak=0,px=200,hurtT=0,worryT=0,happyT=0,redT=0,shakeT=0,scroll=0,sub='play',subT=0,banner='';
let kL=false,kR=false,ptr=null;
function reset(){grid=startGrid();stats=computeStats(grid);calm=100;score=0;killScore=0;segScore=0;calmBonus=0;winBonus=0;seg=1;forgeCount=0;why='';rec=false;px=200;clearInput();resetRun();cards=[];sel=-1;ghost=null;fPhase='edit'}
function resetRun(){rt=0;spawnT=FIRST_SPAWN;enemies=[];warns=[];archers=[];arrows=[];dying=[];floats=[];lastX=-999;streak=0;hurtT=0;worryT=0;happyT=0;redT=0;shakeT=0;scroll=0;sub='play';subT=0;banner=''}
function clearInput(){kL=false;kR=false;ptr=null}
reset();
function say(text,kind){$('pd-msg').textContent=text;$('pd-msg').className='msg'+(kind?' '+kind:'')}
puddingSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';
 setText('pd-seg','第 '+seg+'/'+SEGS+' 段');setText('pd-score',String(score));setText('pd-best',best+' 分');
 $('pd-amount').disabled=puddingBusy;$('pd-go').disabled=live;setText('pd-go',live?'突圍中':st==='over'?'扣點再突圍一次':'扣點開始突圍');
}
const fl=(s,x,y,col)=>floats.push({s,x,y,col,t:0});
function end(reason){
 if(st!=='run')return;
 st='over';why=reason;clearInput();
 if(reason==='win'){winBonus=WIN_SCORE;calmBonus=Math.floor(calm)*CALM_SCORE;score+=winBonus+calmBonus;earned+=WIN_REWARD;S.balance+=WIN_REWARD}
 rec=score>best;
 if(rec){best=score;try{localStorage.setItem('deep-sea-pudding-best',best)}catch(e){}}
 AN.end(analytics,earned,reason==='win'||earned>0?'complete':'loss',{score:score,step:seg,stage:seg});puddingBusy=false;save();renderAll();
 if(reason==='win')say('成功護送布丁到援軍橋！本局共入帳 '+fmt(earned)+' 點。','win');
 else if(!earned)say('布丁哭了，撐到第 '+seg+' 段。這一局沒有點數。','lose');
 else say('布丁哭了，撐到第 '+seg+' 段，本局共入帳 '+fmt(earned)+' 點。','win');
 ui();
}
// ---- forge (camp) ----
function enterForge(){
 ph='forge';forgeCount++;stats=computeStats(grid);
 const order=['b','m','d'];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
 cards=order.map(t=>({type:t,cells:SHAPES[wpick(SHAPES.map(s=>s.w))].c.map(p=>p.slice())}));
 sel=-1;ghost=null;fPhase='edit';fT=0;flashCells=[];flashT=0;clearInput();
}
function clampGhost(){if(sel<0||!ghost)return;const d=dims(cards[sel].cells);ghost.x=Math.max(0,Math.min(ghost.x,4-d.w));ghost.y=Math.max(0,Math.min(ghost.y,4-d.h))}
function previewGrid(){const gr=grid.map(r=>r.slice());if(sel>=0&&ghost){const cd=cards[sel];for(const[dx,dy]of cd.cells)gr[ghost.y+dy][ghost.x+dx]=cd.type}return gr}
function forgeRotate(){if(fPhase!=='edit'||sel<0)return;cards[sel].cells=rotateCells(cards[sel].cells);clampGhost()}
function forgeConfirm(){
 if(fPhase!=='edit'||sel<0||!ghost)return;
 const cd=cards[sel];flashCells=[];
 for(const[dx,dy]of cd.cells){grid[ghost.y+dy][ghost.x+dx]=cd.type;flashCells.push((ghost.x+dx)+','+(ghost.y+dy))}
 flashT=.3;ghost=null;sel=-1;cards=[];stats=computeStats(grid);fPhase='delay';fT=.5;
}
function forgeSkip(){if(fPhase!=='edit')return;cards=[];sel=-1;ghost=null;fPhase='banner';fT=.8}
function forgeTap(x,y){
 if(fPhase!=='edit')return;
 for(let i=0;i<cards.length;i++)if(inRect(x,y,20+124*i,384,112,90)){sel=i;clampGhost();return}
 if(inRect(x,y,GX,GY,GC*4,GC*4)){if(sel<0)return;const d=dims(cards[sel].cells);ghost={x:Math.min(Math.floor((x-GX)/GC),4-d.w),y:Math.min(Math.floor((y-GY)/GC),4-d.h)};return}
 if(inRect(x,y,20,490,110,50))forgeRotate();else if(inRect(x,y,145,490,110,50))forgeConfirm();else if(inRect(x,y,270,490,110,50))forgeSkip();
}
// ---- run ----
function weaponCells(x){const out=[];for(let r=0;r<4;r++)for(let q=0;q<4;q++)if(grid[r][q])out.push({t:grid[r][q],w:stats.cw[r][q],cx:x-2*CELL+q*CELL+CELL/2,cy:WTOP+r*CELL+CELL/2});return out}
const touches=(e,cl)=>Math.abs(e.x-cl.cx)<(EW+CELL)/2&&Math.abs(e.y-cl.cy)<(EH+CELL)/2;
function makeEnemy(kind,x,lv){return{t:kind,x,y:-30,hp:lv.hp[kind],maxHp:lv.hp[kind],speed:lv.base*SPEED_MUL[kind],flash:0,slow:false,spearCd:0}}
function spawn(lv){
 const kind=['inf','cav','shield','archer'][wpick(lv.w)];
 let x=rnd(SPAWN_X[0],SPAWN_X[1]);if(Math.abs(x-lastX)<50)x=rnd(SPAWN_X[0],SPAWN_X[1]);lastX=x;
 if(kind==='cav')warns.push({x,t:CAV_WARN});else if(kind==='archer')archers.push({x,t:0,fired:false});else enemies.push(makeEnemy(kind,x,lv));
}
function hurt(base,kind){
 const amt=Math.round(base*(1-stats.guard)*10)/10;calm=Math.max(0,calm-amt);streak=0;
 if(kind==='pass'){worryT=.3;fl('-'+amt,px,PY+60,'#9e9e9e')}
 else{hurtT=.2;redT=.1;if(!reduceMotion)shakeT=.2;fl('-'+amt,px,PY-50,'#ff5252')}
}
function kill(e){
 const sc=KILL[e.t];score+=sc;killScore+=sc;fl('+'+sc,e.x,e.y,'#ffe082');dying.push({x:e.x,y:e.y,t:e.t,life:.15});
 if(!reduceMotion)shakeT=Math.max(shakeT,.06);e.dead=true;streak++;
 if(streak%STREAK_STEP===0){calm=Math.min(100,calm+STREAK_HEAL);happyT=.5;fl('+'+STREAK_HEAL,px+14,PY-52,'#69f0ae')}
}
function moveHero(dt){
 const dir=(kR?1:0)-(kL?1:0);
 if(dir!==0)px+=dir*KEY_SPEED*dt;
 else if(ptr!==null){const d=ptr-px,step=PTR_SPEED*dt;if(Math.abs(d)<=step)px=ptr;else px+=Math.sign(d)*step}
 px=Math.max(XMIN,Math.min(XMAX,px));
}
function endSegment(){
 enemies=[];warns=[];archers=[];arrows=[];
 score+=SEG_SCORE;segScore+=SEG_SCORE;
 earned+=SEG_REWARD;S.balance+=SEG_REWARD;save();renderAll();
 AN.progress(analytics,{stage:seg,step:seg,score:score,bonus_points:SEG_REWARD});
 if(seg>=SEGS){end('win');return}
 sub='clear';subT=.8;banner='第 '+seg+' 段突破！';
 say('第 '+seg+' 段突破！+'+SEG_REWARD+' 點已入帳。','win');
}
function updateRun(dt){
 const lv=LV[seg-1];
 if(sub==='clear'){subT-=dt;if(subT<=0){calm=Math.min(100,calm+SEG_HEAL);seg++;enterForge();resetRun();ph='forge';say('第 '+seg+' 段營帳：拼一塊碎片，再出發。')}return}
 rt+=dt;scroll+=120*dt;
 if(rt>=SEG_TIME){endSegment();return}
 if(rt<SPAWN_STOP){spawnT-=dt;if(spawnT<=0){spawn(lv);spawnT=rnd(lv.iv[0],lv.iv[1])}}
 for(const w of warns)w.t-=dt;
 for(const w of warns.filter(w=>w.t<=0))enemies.push(makeEnemy('cav',w.x,lv));
 warns=warns.filter(w=>w.t>0);
 for(const a of archers){a.t+=dt;if(!a.fired&&a.t>=1){a.fired=true;arrows.push({x:a.x,y:80})}}
 archers=archers.filter(a=>a.t<1.3);
 moveHero(dt);
 for(const e of enemies){e.y+=e.speed*(e.slow?BLADE_SLOW:1)*dt;e.slow=false;if(e.spearCd>0)e.spearCd-=dt}
 for(const a of arrows)a.y+=ARROW_SPEED*dt;
 // weapon contact: blades cut over time and slow, spears stab once and knock back, shields stop arrows
 const cells=weaponCells(px);
 for(const e of enemies){
  let dps=0,burst=0;
  for(const cl of cells){if(cl.t==='d'||!touches(e,cl))continue;if(cl.t==='b')dps+=BLADE_DPS*cl.w;else if(e.spearCd<=0)burst+=SPEAR_BURST*cl.w}
  if(dps>0){e.hp-=dps*dt;e.flash=.08;e.slow=true}
  if(burst>0){e.hp-=burst;e.flash=.08;e.spearCd=SPEAR_CD;e.y-=SPEAR_KNOCK;fl('-'+Math.round(burst),e.x,e.y-20,'#fff')}
  if(e.hp<=0&&!e.dead)kill(e);
 }
 enemies=enemies.filter(e=>!e.dead);
 for(const a of arrows)for(const cl of cells)if(cl.t==='d'&&Math.abs(a.x-cl.cx)<3+CELL/2&&Math.abs(a.y-cl.cy)<15+CELL/2){a.dead=true;fl('擋！',a.x,a.y,'#fdd835');break}
 // hits on the hero: contact, arrow, then enemies that slip past
 for(const e of enemies)if(Math.abs(e.x-px)<=38&&Math.abs(e.y-PY)<=30){e.dead=true;hurt(HURT[e.t],'hit')}
 enemies=enemies.filter(e=>!e.dead);
 for(const a of arrows)if(!a.dead&&Math.abs(a.x-px)<=20&&Math.abs(a.y-PY)<=20){a.dead=true;hurt(HURT.arrow,'hit')}
 arrows=arrows.filter(a=>!a.dead&&a.y<=520);
 for(const e of enemies)if(e.y>PY+30){e.dead=true;hurt(HURT.pass,'pass')}
 enemies=enemies.filter(e=>!e.dead);
 if(calm<=0){calm=0;end('calm')}
}
function update(dt){
 tt+=dt;
 if(flashT>0)flashT-=dt;
 if(hurtT>0)hurtT-=dt;if(worryT>0)worryT-=dt;if(happyT>0)happyT-=dt;if(redT>0)redT-=dt;if(shakeT>0)shakeT-=dt;
 for(const e of enemies)if(e.flash>0)e.flash-=dt;
 for(const d of dying)d.life-=dt;dying=dying.filter(d=>d.life>0);
 for(const f of floats)f.t+=dt;floats=floats.filter(f=>f.t<.5);
 if(st!=='run')return;
 if(ph==='forge'){
  if(fPhase==='delay'){fT-=dt;if(fT<=0){fPhase='banner';fT=.8}}
  else if(fPhase==='banner'){fT-=dt;if(fT<=0){ph='run';resetRun();say('出發！按住 ←→ / AD 或按住畫面，讓武器碰到敵人。')}}
  return}
 updateRun(dt);
}
// ---- drawing ----
function drawRoad(sc){
 g.fillStyle='#4f7a3a';g.fillRect(-20,0,W+40,H);g.fillStyle='#b79b6b';g.fillRect(50,0,300,H);g.fillStyle='#a88c5e';
 for(let y=(sc%80)-80;y<H;y+=80)g.fillRect(50,y,300,20);
}
function drawHero(x,y,rot,hurtFx){
 const mood=calm<30?'cry':happyT>0?'smile':worryT>0?'worry':calm>60?'smile':'worry';
 g.save();g.translate(x,y);if(rot)g.rotate(rot);
 const ph2=Math.floor(tt/.15)%2?3:-3;g.fillStyle='#5d4037';
 g.beginPath();g.arc(-8,28+ph2,6,0,7);g.fill();g.beginPath();g.arc(8,28-ph2,6,0,7);g.fill();
 g.fillStyle=hurtFx&&Math.floor(tt/.05)%2===0?'#ff8a80':'#eef2f8';RR(-18,-25,36,50,8);g.fill();
 g.fillStyle='#d32f2f';g.fillRect(-18,-22,36,8);
 g.fillStyle='#f1c9a0';g.beginPath();g.arc(0,-34,10,0,7);g.fill();
 g.fillStyle='#d32f2f';g.beginPath();g.moveTo(-4,-43);g.lineTo(4,-43);g.lineTo(0,-56);g.closePath();g.fill();
 g.fillStyle='#333';g.fillRect(-5,-36,2,3);g.fillRect(3,-36,2,3);
 g.strokeStyle='#d32f2f';g.lineWidth=4;g.beginPath();g.moveTo(-14,-18);g.lineTo(18,6);g.stroke();
 const ax=14,ay=-30;
 g.fillStyle='#ffe0bd';g.beginPath();g.arc(ax,ay,9,0,7);g.fill();g.fillStyle='#5d4037';g.beginPath();g.arc(ax,ay-10,3,0,7);g.fill();
 g.fillStyle='#333';g.strokeStyle='#333';g.lineWidth=1.5;
 if(mood==='cry'){
  g.beginPath();g.moveTo(ax-5,ay-2);g.lineTo(ax-2,ay-2);g.moveTo(ax+2,ay-2);g.lineTo(ax+5,ay-2);g.stroke();
  g.beginPath();g.ellipse(ax,ay+4,3,3.5,0,0,7);g.fill();g.fillStyle='#4fc3f7';
  const d=(tt*40)%12;g.fillRect(ax-6,ay+d*.6,2,4);g.fillRect(ax+4,ay+((d+6)%12)*.6,2,4);
 }else{
  g.beginPath();g.arc(ax-3,ay-1,1.3,0,7);g.arc(ax+3,ay-1,1.3,0,7);g.fill();g.beginPath();
  if(mood==='smile')g.arc(ax,ay+2,3.5,.2,Math.PI-.2);else{g.moveTo(ax-3,ay+5);g.lineTo(ax+3,ay+5)}
  g.stroke();
 }
 g.restore();
}
function drawWeaponWorld(x){
 for(let r=0;r<4;r++)for(let q=0;q<4;q++){
  const t=grid[r][q];if(!t)continue;const x0=x-2*CELL+q*CELL,y0=WTOP+r*CELL;
  g.fillStyle=TYPES[t].f;g.fillRect(x0,y0,CELL,CELL);g.strokeStyle=TYPES[t].d;g.lineWidth=2;g.strokeRect(x0+1,y0+1,CELL-2,CELL-2);
  if(stats.cs[r][q]>=3){g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=1;g.strokeRect(x0+4,y0+4,CELL-8,CELL-8)}
 }
}
function drawEnemyBody(t,x,y,scale){
 g.save();g.translate(x,y);if(scale)g.scale(scale,scale);g.translate(-x,-y);
 if(t==='inf'){
  g.fillStyle='#5c6b7a';RR(x-27,y-20,54,40,10);g.fill();g.fillStyle='#37474f';g.beginPath();g.arc(x,y-10,14,Math.PI,0);g.fill();
  g.strokeStyle='#cfd8dc';g.lineWidth=3;g.beginPath();g.moveTo(x+22,y+18);g.lineTo(x+22,y-28);g.stroke();
  g.fillStyle='#cfd8dc';g.beginPath();g.moveTo(x+18,y-28);g.lineTo(x+26,y-28);g.lineTo(x+22,y-38);g.fill();
 }else if(t==='cav'){
  g.fillStyle='#6d4c41';RR(x-27,y-20,54,40,10);g.fill();g.strokeStyle='#4e342e';g.lineWidth=4;
  g.beginPath();g.moveTo(x-15,y+20);g.lineTo(x-15,y+30);g.moveTo(x+15,y+20);g.lineTo(x+15,y+30);g.stroke();
  g.lineWidth=2;g.beginPath();g.moveTo(x+20,y-20);g.lineTo(x+20,y-38);g.stroke();
  g.fillStyle='#d32f2f';g.beginPath();g.moveTo(x+20,y-38);g.lineTo(x+34,y-33);g.lineTo(x+20,y-28);g.fill();
 }else{
  g.fillStyle='#455a64';RR(x-27,y-20,54,40,10);g.fill();g.fillStyle='#90a4ae';g.strokeStyle='#cfd8dc';g.lineWidth=2;g.beginPath();g.arc(x,y+4,15,0,7);g.fill();g.stroke();
 }
 g.fillStyle='#fff';g.beginPath();g.arc(x-8,y-4,3,0,7);g.arc(x+8,y-4,3,0,7);g.fill();
 g.fillStyle='#111';g.beginPath();g.arc(x-8,y-3,1.5,0,7);g.arc(x+8,y-3,1.5,0,7);g.fill();
 g.restore();
}
function drawEnemy(e){
 drawEnemyBody(e.t,e.x,e.y);
 if(e.flash>0){g.fillStyle='rgba(255,255,255,.7)';RR(e.x-27,e.y-20,54,40,10);g.fill()}
 g.fillStyle='#222';g.fillRect(e.x-20,e.y-32,40,4);g.fillStyle='#66bb6a';g.fillRect(e.x-20,e.y-32,40*Math.max(0,e.hp/e.maxHp),4);
}
function drawArcher(a){
 g.globalAlpha=Math.min(1,a.t/.2);
 g.fillStyle='#7b1fa2';g.beginPath();g.arc(a.x,70,14,0,7);g.fill();g.strokeStyle='#8d6e63';g.lineWidth=3;g.beginPath();g.arc(a.x+16,70,16,-1.2,1.2);g.stroke();
 g.fillStyle='#fff';g.beginPath();g.arc(a.x-4,68,2,0,7);g.arc(a.x+4,68,2,0,7);g.fill();g.globalAlpha=1;
}
function drawBar(y,h){
 g.fillStyle='#333';g.fillRect(16,y,W-32,h);
 let col=calm>60?'#66bb6a':calm>=30?'#fdd835':'#e53935';if(calm<30&&Math.floor(tt/.2)%2)col='#ff8a80';
 g.fillStyle=col;g.fillRect(16,y,(W-32)*calm/100,h);
 if(h>=16)tx('布丁安心',22,y+h/2+1,12,'#fff','left');
}
function drawGrid(x0,y0,cs,gr,sc,flash){
 for(let r=0;r<4;r++)for(let q=0;q<4;q++){
  const t=gr[r][q],x=x0+q*cs,y=y0+r*cs;
  if(!t){g.fillStyle='#3b3344';g.fillRect(x,y,cs,cs);g.strokeStyle='#5a4f66';g.lineWidth=1;g.strokeRect(x+.5,y+.5,cs-1,cs-1);continue}
  g.fillStyle=TYPES[t].f;g.fillRect(x,y,cs,cs);g.strokeStyle=TYPES[t].d;g.lineWidth=3;g.strokeRect(x+1,y+1,cs-2,cs-2);
  if(sc&&sc[r][q]>=3){g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(x+4,y+4,cs-8,cs-8)}
  if(flash&&flash.indexOf(q+','+r)>=0){g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x,y,cs,cs)}
 }
}
function drawRun(){
 const ox=shakeT>0?Math.sin(tt*90)*3:0,oy=shakeT>0?Math.cos(tt*70)*3:0;
 g.save();g.translate(ox,oy);drawRoad(scroll);
 for(const a of archers)if(a.t>=.2&&a.t<1){g.fillStyle='rgba(255,0,0,'+(Math.floor(tt/.1)%2?.45:.15)+')';g.fillRect(a.x-20,70,40,430)}
 for(const w of warns)tx('!',w.x,24,30,'#ff1744');
 for(const a of archers)drawArcher(a);
 for(const e of enemies)drawEnemy(e);
 for(const a of arrows){g.fillStyle='#ffeb3b';g.fillRect(a.x-3,a.y-15,6,24);g.beginPath();g.moveTo(a.x-6,a.y+9);g.lineTo(a.x+6,a.y+9);g.lineTo(a.x,a.y+20);g.fill()}
 for(const d of dying){const k=Math.max(0,d.life/.15);g.globalAlpha=k;drawEnemyBody(d.t,d.x,d.y,.4+.6*k);g.fillStyle='rgba(255,255,255,.8)';RR(d.x-27,d.y-20,54,40,10);g.fill();g.globalAlpha=1}
 const sh=hurtT>0?Math.sin(tt*80)*3:0;
 drawHero(px+sh,PY,0,hurtT>0);drawWeaponWorld(px+sh);
 for(const f of floats){g.globalAlpha=1-f.t/.5;tx(f.s,f.x,f.y-40*(f.t/.5),18,f.col);g.globalAlpha=1}
 g.restore();
 drawBar(16,16);
 tx('第 '+seg+'/'+SEGS+' 段',16,58,16,'#fff1c1','left');tx(String(score),W/2,58,28,'#fff1c1');
 g.fillStyle='#333';g.fillRect(16,80,W-32,6);g.fillStyle='#ffd54f';g.fillRect(16,80,(W-32)*Math.min(1,rt/SEG_TIME),6);
 if(streak>=2)tx('x'+streak,W-16,120,22,'#fff1c1','right');
 if(seg===1&&rt<4)tx('按住 ←→ / AD，或按住畫面，讓武器碰到敵人',W/2,520,13,'#fff','center');
 if(redT>0){g.fillStyle='rgba(255,0,0,.4)';g.fillRect(0,0,W,40)}
 if(sub==='clear'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,W,H);tx(banner,W/2,280,32,'#fff1c1')}
}
function drawForge(){
 g.fillStyle='#2a2330';g.fillRect(0,0,W,H);
 tx('第 '+seg+' 段　營帳',W/2,28,24,'#fff1c1');drawBar(52,12);
 const pv=computeStats(previewGrid());
 drawGrid(GX,GY,GC,grid,stats.cs,flashT>0?flashCells:null);
 tx('前',GX-18,GY+8,12,'#9e9e9e','center',true);tx('↑',GX-18,GY+24,14,'#9e9e9e','center',true);
 if(sel>=0&&ghost){const cd=cards[sel];for(const[dx,dy]of cd.cells){const cx=ghost.x+dx,cy=ghost.y+dy;g.globalAlpha=.6;g.fillStyle=TYPES[cd.type].f;g.fillRect(GX+cx*GC,GY+cy*GC,GC,GC);g.globalAlpha=1;if(grid[cy][cx]){g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(GX+cx*GC+2,GY+cy*GC+2,GC-4,GC-4)}}}
 const has=sel>=0&&!!ghost,cmp=(a,b)=>b>a?'#69f0ae':'#ff5252';
 function segs(y,list,size){
  g.font='600 '+size+'px '+FONT;let w=0;for(const s of list){s.w=g.measureText(s.t).width;w+=s.w}
  let x=W/2-w/2;g.textAlign='left';g.textBaseline='middle';for(const s of list){g.fillStyle=s.c;g.fillText(s.t,x,y);x+=s.w}}
 const l1=[];
 for(const t of['b','m','d']){l1.push({t:TYPES[t].n+' '+stats.E[t],c:TYPES[t].f});if(has&&pv.E[t]!==stats.E[t])l1.push({t:'('+pv.E[t]+')',c:cmp(stats.E[t],pv.E[t])});if(t!=='d')l1.push({t:'　',c:'#fff'})}
 segs(326,l1,14);
 const line=(y,items)=>{const l=[];items.forEach((it,i)=>{l.push({t:it[0]+' '+it[1](stats),c:'#fff'});if(has&&Math.abs(pv[it[2]]-stats[it[2]])>1e-9)l.push({t:'('+it[1](pv)+')',c:cmp(stats[it[2]],pv[it[2]])});if(i<items.length-1)l.push({t:'　',c:'#fff'})});segs(y,l,13)};
 line(345,[['刃每秒',v=>String(v.bladeDps),'bladeDps'],['矛突刺',v=>String(v.spear),'spear']]);
 line(363,[['減傷',v=>Math.round(v.guard*100)+'%','guard'],['寬',v=>v.width+'格','width'],['長',v=>v.length+'格','length']]);
 for(let i=0;i<cards.length;i++){
  const cd=cards[i],cx=20+124*i;g.fillStyle='#3b3344';RR(cx,384,112,90,12);g.fill();
  if(sel===i){g.strokeStyle='#ffd54f';g.lineWidth=4;RR(cx,384,112,90,12);g.stroke()}
  const d=dims(cd.cells),cs=16,ox=cx+56-d.w*cs/2,oy=422-d.h*cs/2;
  for(const[dx,dy]of cd.cells){g.fillStyle=TYPES[cd.type].f;g.fillRect(ox+dx*cs,oy+dy*cs,cs,cs);g.strokeStyle=TYPES[cd.type].d;g.lineWidth=2;g.strokeRect(ox+dx*cs+1,oy+dy*cs+1,cs-2,cs-2)}
  tx(TYPES[cd.type].n,cx+56,462,14,'#fff1c1');
 }
 const can=fPhase==='edit'&&sel>=0&&!!ghost;
 g.fillStyle='#4a5a78';RR(20,490,110,50,12);g.fill();tx('旋轉',75,515,20,'#fff');
 g.fillStyle=can?'#ffb300':'#555';RR(145,490,110,50,12);g.fill();tx('鍛造！',200,515,20,can?'#3e2723':'#999','center',true);
 g.fillStyle='#666';RR(270,490,110,50,12);g.fill();tx('跳過',325,515,20,'#fff');
 if(forgeCount===1)tx('選碎片 → 點格子放 → 按鍛造　（格子上方＝武器前方）',W/2,552,12,'#9e9e9e','center',true);
 if(fPhase==='banner'){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,0,W,H);tx('第 '+seg+' 段　出發！',W/2,280,32,'#fff1c1')}
}
function drawOver(){
 drawRoad(0);drawHero(px,PY,why==='win'?0:Math.PI/2,false);
 g.fillStyle='rgba(27,27,47,.7)';g.fillRect(0,0,W,H);
 if(why==='win'){
  tx('援軍橋到了！',W/2,90,34,'#ffd23f');tx('援軍接應，布丁平安。',W/2,130,18,'#fff1c1');
  [['擊殺分數',killScore],['段落分數',segScore],['通關獎勵',winBonus],['安心值獎勵',calmBonus]].forEach((rw,i)=>{tx(rw[0],100,190+i*32,18,'#fff1c1','left');tx(String(rw[1]),300,190+i*32,18,'#fff1c1','right')});
  tx('總分',100,330,24,'#ffd23f','left');tx(String(score),300,330,24,'#ffd23f','right');
 }else{
  tx('布丁大哭',W/2,110,38,'#ff5d8f');tx('追兵循聲追來……',W/2,155,18,'#fff1c1');
  tx('分數 '+score,W/2,230,30,'#fff1c1');tx('撐到第 '+seg+' 段',W/2,275,20,'#fff1c1');
 }
 tx(earned>0?'本局入帳 '+fmt(earned)+' 點':'這一局沒有點數',W/2,why==='win'?372:318,22,earned>0?'#ffd23f':'#fff1c1');
 if(rec)tx('新紀錄！',W/2,why==='win'?410:352,20,'#ffd23f');
 tx('到操作區再突圍一次',W/2,470,20,'#fff1c1');
}
function drawReady(){
 drawRoad(0);drawHero(200,PY,0,false);drawWeaponWorld(200);
 g.fillStyle='rgba(27,27,47,.6)';g.fillRect(0,0,W,H);
 tx('布丁突圍',W/2,150,42,'#ffd23f');tx('背著小王子殺出重圍',W/2,200,20,'#fff1c1');
 tx('每段先拼武器碎片，再往前衝',W/2,250,19,'#fff1c1');tx('武器的形狀就是打擊範圍',W/2,280,19,'#fff1c1');tx('按住 ←→ / AD 或按住畫面移動',W/2,310,19,'#fff1c1');
 tx('到操作區扣點開始',W/2,372,24,'#ffd23f');
}
function draw(){
 if(st==='ready')drawReady();else if(st==='over')drawOver();else if(ph==='forge')drawForge();else drawRun();
}
// ---- start and input ----
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('pudding',amount);puddingStake=amount;puddingBusy=true;S.balance-=amount;save();renderAll();
 reset();earned=0;st='run';last=performance.now();enterForge();say('第 1 段營帳：選一塊碎片拼進武器格子，再出發。');ui();c.focus();
}
const shown=()=>!$('view-pudding').hidden&&!document.hidden;
const ptX=e=>{const rc=c.getBoundingClientRect();return(e.clientX-rc.left)*W/(rc.width||W)},ptY=e=>{const rc=c.getBoundingClientRect();return(e.clientY-rc.top)*H/(rc.height||H)};
$('pd-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'這一局已結算。按「扣點再突圍一次」開始新的一局。':'先按「扣點開始突圍」。');return}
 if(!shown())return;e.preventDefault();c.focus();
 if(ph==='forge')forgeTap(ptX(e),ptY(e));
 else if(sub==='play'){ptr=ptX(e);try{c.setPointerCapture(e.pointerId)}catch(err){}}
});
c.addEventListener('pointermove',e=>{if(ptr!==null)ptr=ptX(e)});
const release=()=>{ptr=null};
c.addEventListener('pointerup',release);c.addEventListener('pointercancel',release);
c.addEventListener('contextmenu',e=>e.preventDefault());
const isL=k=>k==='ArrowLeft'||k==='a'||k==='A',isR=k=>k==='ArrowRight'||k==='d'||k==='D';
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 const k=e.key;
 if(ph==='run'){if(isL(k)){e.preventDefault();kL=true}else if(isR(k)){e.preventDefault();kR=true}}
 else if(!e.repeat){if(k==='r'||k==='R'){e.preventDefault();forgeRotate()}else if(k==='Enter'){e.preventDefault();forgeConfirm()}else if(k==='s'||k==='S'){e.preventDefault();forgeSkip()}}
});
addEventListener('keyup',e=>{if(isL(e.key))kL=false;else if(isR(e.key))kR=false});
addEventListener('blur',()=>{last=performance.now();clearInput()});
document.addEventListener('visibilitychange',()=>{last=performance.now();clearInput()});
window.addEventListener('hashchange',()=>{last=performance.now();clearInput()});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){update(dt);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
