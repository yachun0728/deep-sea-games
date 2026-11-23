  /* ---------- Pudding Dash: forge a weapon from puzzle pieces, then run; the weapon grid is the real hitbox ---------- */
  var puddingBusy=false,puddingStake=0,puddingSay=function(){};
  (function(){
const c=$('pd-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,OL='#2a1a12',FONT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';c.width=W*DPR;c.height=H*DPR;
const PY=440,XMIN=60,XMAX=340,KEY_SPEED=230,PTR_SPEED=280;   // hero row, walking range, keyboard and press-and-hold speeds (px/s)
const CELL=20,WTOP=332,EW=54,EH=40;                          // weapon cell size, weapon top edge, enemy size
const SEGS=8,SEG_TIME=16,SPAWN_STOP=13,FIRST_SPAWN=.8,CAV_WARN=.6,ARROW_SPEED=420;
const SPEED_MUL={inf:1,cav:1.7,shield:.7},HURT={inf:10,cav:15,shield:12,arrow:8,pass:3},KILL={inf:10,cav:15,shield:20};
const SEG_SCORE=100,WIN_SCORE=500,CALM_SCORE=5,STREAK_STEP=8,STREAK_HEAL=5,SEG_HEAL=10;
const SEG_REWARD=1,WIN_REWARD=2;      // fixed points credited for each cleared segment, and once more for clearing all eight (8+2 = the 10-point entry fee)
const BLADE_DPS=4,SPEAR_BURST=3,SPEAR_CD=.5,SPEAR_KNOCK=14,BLADE_SLOW=.5,GUARD_PER=.05,GUARD_MAX=.6;
const CAV_SLOW=.8,SHIELD_BLADE=.5,SHIELD_SPEAR=1.3,CAV_KNOCK=1.5,SHIELD_FROM=3;   // counters: blades barely slow cavalry, shield soldiers resist blades and break on spears; shield pieces are offered from segment 3
const HP_MUL=1.2;   // global enemy HP multiplier, tuned with the bot simulation after the counters were added
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
const CARD_HINT={b:'{{t:pudding.msg.001}}',m:'{{t:pudding.msg.002}}',d:'{{t:pudding.msg.003}}'};
const TYPES={b:{n:'{{t:pudding.msg.004}}',f:'#e53935',d:'#8e1c1a'},m:{n:'{{t:pudding.msg.005}}',f:'#1e88e5',d:'#0d47a1'},d:{n:'{{t:pudding.msg.006}}',f:'#fdd835',d:'#a58b00'}};
// Puzzle pieces: cell offsets [x,y], weight in the random draw.
const SHAPES=[{c:[[0,0]],w:2},{c:[[0,0],[1,0]],w:3},{c:[[0,0],[1,0],[2,0]],w:3},{c:[[0,0],[0,1],[1,1]],w:3},{c:[[0,0],[1,0],[0,1],[1,1]],w:2},{c:[[0,0],[1,0],[2,0],[3,0]],w:1},{c:[[0,0],[0,1],[0,2],[1,2]],w:2},{c:[[0,0],[1,0],[2,0],[1,1]],w:2}];
const GX=112,GY=108,GC=44,FS=358,CY=408,CH=86,BY=500;   // forge layout on the canvas: grid, stat lines, piece cards, buttons
let best=0;try{best=+localStorage.getItem('deep-sea-pudding-best')||0}catch(e){}
let analytics=null,earned=0;
const rnd=(a,b)=>a+Math.random()*(b-a);
function wpick(ws){let t=0;for(const w of ws)t+=w;let r=Math.random()*t;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<0)return i}return ws.length-1}
const RR=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
function tx(s,x,y,sz,col,al,mw){mw=mw||W-40;g.font='900 '+sz+'px '+FONT;g.textAlign=al||'center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=Math.max(3,sz/4);g.strokeStyle=OL;g.strokeText(s,x,y,mw);g.fillStyle=col;g.fillText(s,x,y,mw)}
const cardX=i=>20+(3-cards.length)*62+124*i;
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
 $('pd-amount').disabled=puddingBusy;$('pd-go').disabled=live;setText('pd-go',live?'{{t:pudding.msg.007}}':st==='over'?'{{t:pudding.msg.008}}':'{{t:pudding.msg.009}}');
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
 else if(!earned)say('布丁哭了，撐到第 '+seg+' 段。這一局沒有額外成就獎勵。','lose');
 else say('布丁哭了，撐到第 '+seg+' 段，本局共入帳 '+fmt(earned)+' 點。','win');
 ui();
}
// ---- forge (camp) ----
function enterForge(){
 ph='forge';forgeCount++;stats=computeStats(grid);
 const order=seg>=SHIELD_FROM?['b','m','d']:['b','m'];for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
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
 for(let i=0;i<cards.length;i++)if(inRect(x,y,cardX(i),CY,112,CH)){sel=i;clampGhost();return}
 if(inRect(x,y,GX,GY,GC*4,GC*4)){if(sel<0)return;const d=dims(cards[sel].cells);ghost={x:Math.min(Math.floor((x-GX)/GC),4-d.w),y:Math.min(Math.floor((y-GY)/GC),4-d.h)};return}
 if(inRect(x,y,20,BY,110,50))forgeRotate();else if(inRect(x,y,145,BY,110,50))forgeConfirm();else if(inRect(x,y,270,BY,110,50))forgeSkip();
}
// ---- run ----
function weaponCells(x){const out=[];for(let r=0;r<4;r++)for(let q=0;q<4;q++)if(grid[r][q])out.push({t:grid[r][q],w:stats.cw[r][q],cx:x-2*CELL+q*CELL+CELL/2,cy:WTOP+r*CELL+CELL/2});return out}
const touches=(e,cl)=>Math.abs(e.x-cl.cx)<(EW+CELL)/2&&Math.abs(e.y-cl.cy)<(EH+CELL)/2;
function makeEnemy(kind,x,lv){const hp=Math.round(lv.hp[kind]*HP_MUL);return{t:kind,x,y:-30,hp,maxHp:hp,speed:lv.base*SPEED_MUL[kind],flash:0,slow:false,spearCd:0}}
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
 for(const e of enemies){e.y+=e.speed*(e.slow?(e.t==='cav'?CAV_SLOW:BLADE_SLOW):1)*dt;e.slow=false;if(e.spearCd>0)e.spearCd-=dt}
 for(const a of arrows)a.y+=ARROW_SPEED*dt;
 // weapon contact: blades cut over time and slow, spears stab once and knock back, shields stop arrows
 const cells=weaponCells(px);
 for(const e of enemies){
  let dps=0,burst=0;
  for(const cl of cells){if(cl.t==='d'||!touches(e,cl))continue;if(cl.t==='b')dps+=BLADE_DPS*cl.w;else if(e.spearCd<=0)burst+=SPEAR_BURST*cl.w}
  if(e.t==='shield'){dps*=SHIELD_BLADE;burst*=SHIELD_SPEAR}
  if(dps>0){e.hp-=dps*dt;e.flash=.08;e.slow=true}
  if(burst>0){e.hp-=burst;e.flash=.08;e.spearCd=SPEAR_CD;e.y-=SPEAR_KNOCK*(e.t==='cav'?CAV_KNOCK:1);fl('-'+Math.round(burst),e.x,e.y-20,'#fff')}
  if(e.hp<=0&&!e.dead)kill(e);
 }
 enemies=enemies.filter(e=>!e.dead);
 for(const a of arrows)for(const cl of cells)if(cl.t==='d'&&Math.abs(a.x-cl.cx)<3+CELL/2&&Math.abs(a.y-cl.cy)<15+CELL/2){a.dead=true;fl('{{t:pudding.msg.010}}',a.x,a.y,'#fdd835');break}
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
  else if(fPhase==='banner'){fT-=dt;if(fT<=0){ph='run';resetRun();say('{{t:pudding.msg.011}}')}}
  return}
 updateRun(dt);
}
// ---- drawing ----
const SPR=new Image();SPR.src='games/pudding/art/sprites.webp';const SCN=new Image();SCN.src='games/pudding/art/scene.webp';
const A={"board":[0,0,392,440],"bridge":[394,0,300,190],"hF":[696,0,147,170],"hB":[845,0,118,170],"win":[0,442,170,165],"tent":[172,442,200,160],"bForge":[374,442,220,157],"w0":[596,442,115,150],"w1":[713,442,110,150],"w2":[825,442,117,150],"w3":[0,609,109,150],"bSkip":[111,609,220,144],"hurt":[333,609,170,141],"cav0":[505,609,110,140],"cav1":[617,609,107,140],"bRot":[726,609,220,138],"inf0":[0,761,125,130],"inf1":[127,761,100,130],"shd0":[229,761,115,130],"shd1":[346,761,107,130],"arc0":[455,761,119,130],"arc1":[576,761,116,130],"tB":[694,761,100,110],"tM":[796,761,99,110],"tD":[897,761,100,110],"gB":[0,893,100,110],"gM":[102,893,101,110],"gD":[205,893,100,110],"fire":[307,893,90,110],"arcK":[399,893,130,108],"cavK":[531,893,140,101],"calm":[673,893,300,96],"shdK":[0,1005,130,93],"infK":[132,1005,130,92],"fWorry":[264,1005,84,90],"fHappy":[350,1005,90,80],"bush":[442,1005,100,80],"fCry":[544,1005,90,73],"warn":[636,1005,66,70],"flower":[704,1005,70,67],"rock":[776,1005,90,54],"arrow":[868,1005,90,30]};
const ok=i=>i.complete&&i.naturalWidth>0;
// sprite anchored at bottom-center (x, y = feet), h = drawn height
function spr(k,x,y,h,rot,alpha){const a=A[k];if(!a||!ok(SPR))return;const w=a[2]*h/a[3];g.save();if(alpha!==undefined)g.globalAlpha=alpha;g.translate(x,y);if(rot){g.rotate(rot);g.drawImage(SPR,a[0],a[1],a[2],a[3],-w/2,-h/2,w,h)}else g.drawImage(SPR,a[0],a[1],a[2],a[3],-w/2,-h,w,h);g.restore()}
function sprBox(k,x,y,w,h,alpha){const a=A[k];if(!a||!ok(SPR))return;if(alpha!==undefined){g.save();g.globalAlpha=alpha}g.drawImage(SPR,a[0],a[1],a[2],a[3],x,y,w,h);if(alpha!==undefined)g.restore()}
const TILE={b:'tB',m:'tM',d:'tD'},GLOW={b:'gB',m:'gM',d:'gD'};
function panel(x,y,w,h,r,fill,line){g.fillStyle='rgba(30,18,10,.35)';RR(x+2,y+5,w,h,r);g.fill();RR(x,y,w,h,r);g.fillStyle=fill||'#fff4dc';g.fill();g.lineWidth=3;g.strokeStyle=line||OL;g.stroke()}
function btn(x,y,w,h,top,dark,label,on){
 g.fillStyle=OL;RR(x,y+4,w,h,16);g.fill();
 RR(x,y,w,h,16);g.fillStyle=on?dark:'#8d8190';g.fill();
 RR(x+3,y+3,w-6,h-9,13);g.fillStyle=on?top:'#b3a9b6';g.fill();
 g.fillStyle='rgba(255,255,255,.35)';RR(x+9,y+6,w-18,7,3.5);g.fill();
 RR(x,y,w,h,16);g.lineWidth=3;g.strokeStyle=OL;g.stroke();
 tx(label,x+w/2,y+h/2,18,on?'#fff':'#ece6ee');
}
function drawRoad(sc){
 if(!ok(SCN)){g.fillStyle='#5f9e3f';g.fillRect(0,0,W,H);return}
 const th=SCN.naturalHeight*W/SCN.naturalWidth;
 for(let y=(sc%th)-th;y<H;y+=th-1)g.drawImage(SCN,0,y,W,th);
}
function mood(){return calm<30?'cry':happyT>0?'smile':worryT>0?'worry':calm>60?'smile':'worry'}
function drawHero(x,y,pose){
 g.fillStyle='rgba(30,40,20,.3)';g.beginPath();g.ellipse(x,y+33,24,7,0,0,7);g.fill();
 if(pose==='win')spr('win',x,y+36,92);
 else if(pose==='lose')spr('hurt',x,y+36,84);
 else spr(pose==='stand'?'w0':'w'+(Math.floor(tt/.14)%4),x,y+36,80);
}
function drawWeaponWorld(x){
 for(let r=0;r<4;r++)for(let q=0;q<4;q++){
  const t=grid[r][q];if(!t)continue;const x0=x-2*CELL+q*CELL,y0=WTOP+r*CELL;
  sprBox(stats.cs[r][q]>=3?GLOW[t]:TILE[t],x0-1,y0-1,CELL+2,CELL+2);
 }
}
const EK={inf:['inf0','inf1','infK',56],cav:['cav0','cav1','cavK',66],shield:['shd0','shd1','shdK',58]};
function drawEnemyBody(t,x,y,frame){const k=EK[t];spr(k[frame],x,y+28,k[3])}
function drawEnemy(e){
 g.fillStyle='rgba(30,40,20,.28)';g.beginPath();g.ellipse(e.x,e.y+26,22,6,0,0,7);g.fill();
 drawEnemyBody(e.t,e.x,e.y,Math.floor(tt/.18+e.x)%2);
 const bw=40,bx=e.x-bw/2,by=e.y-38;RR(bx-1,by-1,bw+2,7,3.5);g.fillStyle=OL;g.fill();
 g.fillStyle='#7cd65a';RR(bx+1,by+1,Math.max(0,(bw-2)*e.hp/e.maxHp),4,2);g.fill();
}
function drawArcher(a){spr(Math.floor(tt/.2)%2?'arc1':'arc0',a.x,96,56,0,Math.min(1,a.t/.2))}
function drawBar(y,h,compact){
 const x=compact?16:52,w=compact?W-32:W-72;
 RR(x,y,w,h,h/2);g.fillStyle='#3a2a20';g.fill();
 const col=calm>60?'#6ccf4c':calm>=30?'#ffc93c':'#ff5a4a',v=Math.max(0,Math.min(1,calm/100));
 if(v>0){RR(x+2,y+2,Math.max(h-4,(w-4)*v),h-4,(h-4)/2);g.fillStyle=col;g.fill();g.fillStyle='rgba(255,255,255,.3)';RR(x+5,y+3,Math.max(0,(w-10)*v),Math.max(2,h/4),1.5);g.fill()}
 RR(x,y,w,h,h/2);g.lineWidth=2.5;g.strokeStyle=OL;g.stroke();
 if(!compact){const m=mood();spr(m==='cry'?'fCry':m==='smile'?'fHappy':'fWorry',30,y+h/2+16,34);tx('{{t:pudding.msg.012}}',x+10,y+h/2+1,11,'#fff','left')}
}
function drawGrid(x0,y0,cs,gr,sc,flash){
 for(let r=0;r<4;r++)for(let q=0;q<4;q++){
  const t=gr[r][q],x=x0+q*cs,y=y0+r*cs;
  if(!t)continue;
  sprBox(sc&&sc[r][q]>=3?GLOW[t]:TILE[t],x+1,y+1,cs-2,cs-2);
  if(flash&&flash.indexOf(q+','+r)>=0){g.fillStyle='rgba(255,255,255,.55)';RR(x+3,y+3,cs-6,cs-6,8);g.fill()}
 }
}
function drawRun(){
 drawRoad(scroll);
 for(const a of archers)if(a.t>=.2&&a.t<1){g.fillStyle='rgba(255,60,40,.22)';g.fillRect(a.x-14,110,28,400);g.strokeStyle='rgba(255,60,40,.7)';g.lineWidth=2;g.setLineDash([8,6]);g.beginPath();g.moveTo(a.x,110);g.lineTo(a.x,500);g.stroke();g.setLineDash([])}
 for(const w of warns)spr('warn',w.x,128,34);
 for(const a of archers)drawArcher(a);
 for(const e of enemies){drawEnemy(e);if(e.t==='shield')tx('{{t:pudding.msg.013}}',e.x,e.y-48,11,'#ffd54f')}
 for(const a of arrows)spr('arrow',a.x,a.y,40,-Math.PI/2);
 for(const d of dying)drawEnemyBody(d.t,d.x,d.y,2);
 drawHero(px,PY,'run');drawWeaponWorld(px);
 for(const f of floats){g.globalAlpha=Math.max(0,1-f.t/.5);tx(f.s,f.x,f.y-40*(f.t/.5),18,f.col);g.globalAlpha=1}
 panel(8,6,W-16,74,16,'rgba(58,38,28,.88)');
 drawBar(14,18);
 tx('第 '+seg+'/'+SEGS+' 段',20,52,15,'#ffe9b0','left');tx(String(score),W/2,52,24,'#fff');
 if(streak>=2)tx('x'+streak,W-20,52,18,'#ffd23f','right');
 RR(20,66,W-40,7,3.5);g.fillStyle='#3a2a20';g.fill();RR(21,67,Math.max(5,(W-42)*Math.min(1,rt/SEG_TIME)),5,2.5);g.fillStyle='#ffc93c';g.fill();
 if(seg===1&&rt<4){panel(30,500,W-60,32,14,'rgba(58,38,28,.88)');tx('{{t:pudding.msg.014}}',W/2,516,13,'#fff')}
 else{g.globalAlpha=.75;tx('{{t:pudding.msg.015}}',W/2,540,12,'#fff');g.globalAlpha=1}
 if(sub==='clear'){g.fillStyle='rgba(20,12,30,.35)';g.fillRect(0,0,W,H);tx(banner,W/2,280,30,'#ffd23f')}
}
function drawForge(){
 drawRoad(0);g.fillStyle='rgba(28,18,30,.55)';g.fillRect(0,0,W,H);
 spr('fire',364,150,46);
 tx('第 '+seg+' 段　營帳',W/2,24,22,'#ffe9b0');drawBar(38,12,true);
 const pv=computeStats(previewGrid()),bw=GC*4/.719,bh=GC*4/.632;
 sprBox('board',GX-.138*bw,GY-.153*bh,bw,bh);
 drawGrid(GX,GY,GC,grid,stats.cs,flashT>0?flashCells:null);
 tx('{{t:pudding.msg.016}}',GX-22,GY+10,12,'#ffe9b0');tx('↑',GX-22,GY+28,15,'#ffe9b0');
 if(sel>=0&&ghost){const cd=cards[sel];for(const[dx,dy]of cd.cells){const cx=ghost.x+dx,cy=ghost.y+dy;sprBox(TILE[cd.type],GX+cx*GC+1,GY+cy*GC+1,GC-2,GC-2,.6);if(grid[cy][cx]){g.strokeStyle='#fff';g.lineWidth=3;RR(GX+cx*GC+3,GY+cy*GC+3,GC-6,GC-6,8);g.stroke()}}}
 const has=sel>=0&&!!ghost,cmp=(a,b)=>b>a?'#69f0ae':'#ff6e6e',TC={b:'#ff7a6e',m:'#6ab8ff',d:'#ffd54f'};
 function segs(y,list,size){
  g.font='800 '+size+'px '+FONT;let w=0;for(const s of list){s.w=g.measureText(s.t).width;w+=s.w}
  let x=W/2-w/2;g.textAlign='left';g.textBaseline='middle';g.lineJoin='round';for(const s of list){g.lineWidth=3;g.strokeStyle=OL;g.strokeText(s.t,x,y);g.fillStyle=s.c;g.fillText(s.t,x,y);x+=s.w}}
 const l1=[];
 for(const t of['b','m','d']){l1.push({t:TYPES[t].n+' '+stats.E[t],c:TC[t]});if(has&&pv.E[t]!==stats.E[t])l1.push({t:'('+pv.E[t]+')',c:cmp(stats.E[t],pv.E[t])});if(t!=='d')l1.push({t:'　',c:'#fff'})}
 segs(FS,l1,14);
 const line=(y,items)=>{const l=[];items.forEach((it,i)=>{l.push({t:it[0]+' '+it[1](stats),c:'#fff'});if(has&&Math.abs(pv[it[2]]-stats[it[2]])>1e-9)l.push({t:'('+it[1](pv)+')',c:cmp(stats[it[2]],pv[it[2]])});if(i<items.length-1)l.push({t:'　',c:'#fff'})});segs(y,l,12)};
 line(FS+18,[['{{t:pudding.msg.017}}',v=>String(v.bladeDps),'bladeDps'],['{{t:pudding.msg.018}}',v=>String(v.spear),'spear']]);
 line(FS+35,[['{{t:pudding.msg.019}}',v=>Math.round(v.guard*100)+'%','guard'],['{{t:pudding.msg.020}}',v=>v.width+'{{t:pudding.msg.021}}','width'],['{{t:pudding.msg.022}}',v=>v.length+'{{t:pudding.msg.021}}','length']]);
 for(let i=0;i<cards.length;i++){
  const cd=cards[i],cx=cardX(i);panel(cx,CY,112,CH,14,sel===i?'#fff1c4':'#f3e2c0',sel===i?'#c27a00':OL);
  if(sel===i){RR(cx-3,CY-3,118,CH+6,16);g.lineWidth=3;g.strokeStyle='#ffd23f';g.stroke()}
  const d=dims(cd.cells),cs=12,ox=cx+56-d.w*cs/2,oy=CY+29-d.h*cs/2;
  for(const[dx,dy]of cd.cells)sprBox(TILE[cd.type],ox+dx*cs,oy+dy*cs,cs,cs);
  tx(TYPES[cd.type].n,cx+56,CY+CH-25,14,TC[cd.type]);
  g.font='700 10px '+FONT;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#6b4a2e';g.fillText(CARD_HINT[cd.type],cx+56,CY+CH-11,104);
 }
 const can=fPhase==='edit'&&sel>=0&&!!ghost;
 btn(20,BY,110,46,'#a96cf0','#6b3fb8','{{t:pudding.msg.023}}',fPhase==='edit'&&sel>=0);
 btn(145,BY,110,46,'#ffc93c','#d98a00','{{t:pudding.msg.024}}',can);
 btn(270,BY,110,46,'#4fa8f5','#1f6dc0','{{t:pudding.msg.025}}',fPhase==='edit');
 if(forgeCount<=2){g.font='700 11px '+FONT;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffe9b0';g.fillText('{{t:pudding.msg.026}}',W/2,BY+56,W-20)}
 if(fPhase==='banner'){g.fillStyle='rgba(20,12,30,.5)';g.fillRect(0,0,W,H);tx('第 '+seg+' 段　出發！',W/2,280,30,'#ffd23f')}
}
function wrapLines(t,font,mw){t=window.deepSeaI18n?deepSeaI18n.text(String(t)):String(t);g.font=font;const parts=/\s/.test(t)?t.split(/(\s+)/):[...t],out=[];let cur='';parts.forEach(p=>{const nx=cur+p;if(cur.trim()&&g.measureText(nx).width>mw&&!/^\s+$/.test(p)&&!/^[，。！？、：；）」』]$/.test(p)){out.push(cur.trim());cur=p.trimStart()}else cur=nx});if(cur.trim())out.push(cur.trim());return out}
function rowsCard(items,top){
 const PX=30,TW=W-72-PX*2,rows=[];
 items.forEach(r=>{if(r[3]!==undefined)rows.push(r);else wrapLines(r[0],'900 '+r[1]+'px '+FONT,TW).forEach(l=>rows.push([l,r[1],r[2]]))});
 const lh=r=>Math.round(r[1]*1.45),tot=rows.reduce((a,r)=>a+lh(r),0)+40;panel(36,top,W-72,tot,18);let y=top+20;
 rows.forEach(r=>{const h=lh(r);g.textBaseline='middle';if(r[3]!==undefined){g.font='800 '+r[1]+'px '+FONT;g.textAlign='left';g.fillStyle=r[2];g.fillText(r[0],36+PX,y+h/2,TW*.68);g.textAlign='right';g.fillText(String(r[3]),W-36-PX,y+h/2,TW*.3)}else{g.font='900 '+r[1]+'px '+FONT;g.textAlign='center';g.fillStyle=r[2];g.fillText(r[0],W/2,y+h/2,TW)}y+=h});return top+tot}
function drawOver(){
 drawRoad(0);drawHero(px,PY,why==='win'?'win':'lose');
 g.fillStyle='rgba(28,18,30,.5)';g.fillRect(0,0,W,H);
 const B='#5a3a22',Y='#c27a00';let it;
 if(why==='win'){tx('{{t:pudding.msg.027}}',W/2,62,30,'#ffd23f');
  it=[['{{t:pudding.msg.028}}',15,B],['{{t:pudding.msg.029}}',15,B,killScore],['{{t:pudding.msg.030}}',15,B,segScore],['{{t:pudding.msg.031}}',15,B,winBonus],['{{t:pudding.msg.032}}',15,B,calmBonus],['{{t:pudding.msg.033}}',19,Y,score]]}
 else{tx('{{t:pudding.msg.034}}',W/2,62,32,'#ff8fae');spr('fCry',W/2,170,64);
  it=[['{{t:pudding.msg.035}}',15,B],['分數 '+score,26,'#3b2a1a'],['撐到第 '+seg+' 段',16,B]]}
 it.push([earned>0?'本局入帳 '+fmt(earned)+' 點':'{{t:pudding.msg.036}}',16,earned>0?Y:B]);
 if(rec)it.push(['{{t:pudding.msg.037}}',17,'#e0503f']);
 const b=rowsCard(it,why==='win'?92:180);
 tx('{{t:pudding.msg.038}}',W/2,Math.min(Math.max(b+30,PY-70),PY-60),17,'#ffe9b0');
}
function drawReady(){
 drawRoad(0);drawWeaponWorld(200);drawHero(200,PY,'stand');
 g.fillStyle='rgba(28,18,30,.35)';g.fillRect(0,0,W,H);
 tx('{{t:pudding.msg.039}}',W/2,86,40,'#ffd23f');tx('{{t:pudding.msg.040}}',W/2,124,17,'#fff');
 const b=rowsCard([['{{t:pudding.msg.041}}',15,'#5a3a22'],['{{t:pudding.msg.042}}',15,'#5a3a22'],['{{t:pudding.msg.043}}',15,'#5a3a22']],148);
 tx('{{t:pudding.msg.044}}',W/2,b+34,20,'#ffd23f');
}
function draw(){
 g.setTransform(DPR,0,0,DPR,0,0);
 if(st==='ready')drawReady();else if(st==='over')drawOver();else if(ph==='forge')drawForge();else drawRun();
}
// ---- start and input ----
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('pudding',amount);puddingStake=amount;puddingBusy=true;save();renderAll();
 reset();earned=0;st='run';last=performance.now();enterForge();say('{{t:pudding.msg.045}}');ui();c.focus();
}
const shown=()=>!$('view-pudding').hidden&&!document.hidden;
const ptX=e=>{const rc=c.getBoundingClientRect();return(e.clientX-rc.left)*W/(rc.width||W)},ptY=e=>{const rc=c.getBoundingClientRect();return(e.clientY-rc.top)*H/(rc.height||H)};
$('pd-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'{{t:pudding.msg.046}}':'{{t:pudding.msg.047}}');return}
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
