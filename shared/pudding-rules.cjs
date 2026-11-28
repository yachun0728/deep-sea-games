const puddingRules=(()=>{
const rulesVersion=1,inputCount=4039;
function createGame(random=Math.random,callbacks={}){
const W=400,H=560;const say=(...a)=>callbacks.say?.(...a),ui=()=>{},label=id=>callbacks.label?.(id)||id;
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
const SHAPES=[{c:[[0,0]],w:2},{c:[[0,0],[1,0]],w:3},{c:[[0,0],[1,0],[2,0]],w:3},{c:[[0,0],[0,1],[1,1]],w:3},{c:[[0,0],[1,0],[0,1],[1,1]],w:2},{c:[[0,0],[1,0],[2,0],[3,0]],w:1},{c:[[0,0],[0,1],[0,2],[1,2]],w:2},{c:[[0,0],[1,0],[2,0],[1,1]],w:2}];
const GX=112,GY=108,GC=44,FS=358,CY=408,CH=86,BY=500;   // forge layout on the canvas: grid, stat lines, piece cards, buttons
let earned=0;
const rnd=(a,b)=>a+random()*(b-a);
function wpick(ws){let t=0;for(const w of ws)t+=w;let r=random()*t;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<0)return i}return ws.length-1}
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
const fl=(s,x,y,col)=>floats.push({s,x,y,col,t:0});
function end(reason){
 if(st!=='run')return;
 st='over';why=reason;clearInput();
 if(reason==='win'){winBonus=WIN_SCORE;calmBonus=Math.floor(calm)*CALM_SCORE;score+=winBonus+calmBonus;earned+=WIN_REWARD}
 callbacks.end?.(reason);
}
// ---- forge (camp) ----
function enterForge(){
 ph='forge';forgeCount++;stats=computeStats(grid);
 const order=seg>=SHIELD_FROM?['b','m','d']:['b','m'];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
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
 else{hurtT=.2;redT=.1;if(!callbacks.reduceMotion?.())shakeT=.2;fl('-'+amt,px,PY-50,'#ff5252')}
}
function kill(e){
 const sc=KILL[e.t];score+=sc;killScore+=sc;fl('+'+sc,e.x,e.y,'#ffe082');dying.push({x:e.x,y:e.y,t:e.t,life:.15});
 if(!callbacks.reduceMotion?.())shakeT=Math.max(shakeT,.06);e.dead=true;streak++;
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
 earned+=SEG_REWARD;callbacks.segment?.(seg);
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
 for(const a of arrows)for(const cl of cells)if(cl.t==='d'&&Math.abs(a.x-cl.cx)<3+CELL/2&&Math.abs(a.y-cl.cy)<15+CELL/2){a.dead=true;fl(label('pudding.msg.010'),a.x,a.y,'#fdd835');break}
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
  else if(fPhase==='banner'){fT-=dt;if(fT<=0){ph='run';resetRun();say(label('pudding.msg.011'))}}
  return}
 updateRun(dt);
}

const game={reset,resetRun,clearInput,computeStats,startGrid,emptyGrid,rotateCells,dims,enterForge,clampGhost,previewGrid,forgeRotate,forgeConfirm,forgeSkip,forgeTap,weaponCells,makeEnemy,spawn,hurt,kill,moveHero,endSegment,updateRun,update,end,PY,XMIN,XMAX,KEY_SPEED,PTR_SPEED,CELL,WTOP,EW,EH,SEGS,SEG_TIME,SPAWN_STOP,FIRST_SPAWN,CAV_WARN,ARROW_SPEED,SPEED_MUL,HURT,KILL,SEG_SCORE,WIN_SCORE,CALM_SCORE,STREAK_STEP,STREAK_HEAL,SEG_HEAL,SEG_REWARD,WIN_REWARD,BLADE_DPS,SPEAR_BURST,SPEAR_CD,SPEAR_KNOCK,BLADE_SLOW,GUARD_PER,GUARD_MAX,CAV_SLOW,SHIELD_BLADE,SHIELD_SPEAR,CAV_KNOCK,SHIELD_FROM,HP_MUL,SPAWN_X,START_CELLS,LV,SHAPES,GX,GY,GC,FS,CY,CH,BY,get dead(){return st==='over'}};
Object.defineProperty(game,'st',{enumerable:true,get:()=>st,set:v=>{st=v}});
Object.defineProperty(game,'ph',{enumerable:true,get:()=>ph,set:v=>{ph=v}});
Object.defineProperty(game,'why',{enumerable:true,get:()=>why,set:v=>{why=v}});
Object.defineProperty(game,'rec',{enumerable:true,get:()=>rec,set:v=>{rec=v}});
Object.defineProperty(game,'tt',{enumerable:true,get:()=>tt,set:v=>{tt=v}});
Object.defineProperty(game,'forgeCount',{enumerable:true,get:()=>forgeCount,set:v=>{forgeCount=v}});
Object.defineProperty(game,'grid',{enumerable:true,get:()=>grid,set:v=>{grid=v}});
Object.defineProperty(game,'stats',{enumerable:true,get:()=>stats,set:v=>{stats=v}});
Object.defineProperty(game,'calm',{enumerable:true,get:()=>calm,set:v=>{calm=v}});
Object.defineProperty(game,'score',{enumerable:true,get:()=>score,set:v=>{score=v}});
Object.defineProperty(game,'killScore',{enumerable:true,get:()=>killScore,set:v=>{killScore=v}});
Object.defineProperty(game,'segScore',{enumerable:true,get:()=>segScore,set:v=>{segScore=v}});
Object.defineProperty(game,'calmBonus',{enumerable:true,get:()=>calmBonus,set:v=>{calmBonus=v}});
Object.defineProperty(game,'winBonus',{enumerable:true,get:()=>winBonus,set:v=>{winBonus=v}});
Object.defineProperty(game,'seg',{enumerable:true,get:()=>seg,set:v=>{seg=v}});
Object.defineProperty(game,'cards',{enumerable:true,get:()=>cards,set:v=>{cards=v}});
Object.defineProperty(game,'sel',{enumerable:true,get:()=>sel,set:v=>{sel=v}});
Object.defineProperty(game,'ghost',{enumerable:true,get:()=>ghost,set:v=>{ghost=v}});
Object.defineProperty(game,'flashCells',{enumerable:true,get:()=>flashCells,set:v=>{flashCells=v}});
Object.defineProperty(game,'flashT',{enumerable:true,get:()=>flashT,set:v=>{flashT=v}});
Object.defineProperty(game,'fPhase',{enumerable:true,get:()=>fPhase,set:v=>{fPhase=v}});
Object.defineProperty(game,'fT',{enumerable:true,get:()=>fT,set:v=>{fT=v}});
Object.defineProperty(game,'rt',{enumerable:true,get:()=>rt,set:v=>{rt=v}});
Object.defineProperty(game,'spawnT',{enumerable:true,get:()=>spawnT,set:v=>{spawnT=v}});
Object.defineProperty(game,'enemies',{enumerable:true,get:()=>enemies,set:v=>{enemies=v}});
Object.defineProperty(game,'warns',{enumerable:true,get:()=>warns,set:v=>{warns=v}});
Object.defineProperty(game,'archers',{enumerable:true,get:()=>archers,set:v=>{archers=v}});
Object.defineProperty(game,'arrows',{enumerable:true,get:()=>arrows,set:v=>{arrows=v}});
Object.defineProperty(game,'dying',{enumerable:true,get:()=>dying,set:v=>{dying=v}});
Object.defineProperty(game,'floats',{enumerable:true,get:()=>floats,set:v=>{floats=v}});
Object.defineProperty(game,'lastX',{enumerable:true,get:()=>lastX,set:v=>{lastX=v}});
Object.defineProperty(game,'streak',{enumerable:true,get:()=>streak,set:v=>{streak=v}});
Object.defineProperty(game,'px',{enumerable:true,get:()=>px,set:v=>{px=v}});
Object.defineProperty(game,'hurtT',{enumerable:true,get:()=>hurtT,set:v=>{hurtT=v}});
Object.defineProperty(game,'worryT',{enumerable:true,get:()=>worryT,set:v=>{worryT=v}});
Object.defineProperty(game,'happyT',{enumerable:true,get:()=>happyT,set:v=>{happyT=v}});
Object.defineProperty(game,'redT',{enumerable:true,get:()=>redT,set:v=>{redT=v}});
Object.defineProperty(game,'shakeT',{enumerable:true,get:()=>shakeT,set:v=>{shakeT=v}});
Object.defineProperty(game,'scroll',{enumerable:true,get:()=>scroll,set:v=>{scroll=v}});
Object.defineProperty(game,'sub',{enumerable:true,get:()=>sub,set:v=>{sub=v}});
Object.defineProperty(game,'subT',{enumerable:true,get:()=>subT,set:v=>{subT=v}});
Object.defineProperty(game,'banner',{enumerable:true,get:()=>banner,set:v=>{banner=v}});
Object.defineProperty(game,'kL',{enumerable:true,get:()=>kL,set:v=>{kL=v}});
Object.defineProperty(game,'kR',{enumerable:true,get:()=>kR,set:v=>{kR=v}});
Object.defineProperty(game,'ptr',{enumerable:true,get:()=>ptr,set:v=>{ptr=v}});
Object.defineProperty(game,'earned',{enumerable:true,get:()=>earned,set:v=>{earned=v}});
return game;
}
function create(random){const g=createGame(random);g.st='run';g.enterForge();return g;}
function input(g,code){
 if(g.dead||!Number.isSafeInteger(code)||code<0||code>=inputCount)return false;
 if(code<=4000){if(g.ph==='run'&&g.sub==='play')g.ptr=code/10;}
 else if(code===4001)g.kL=true;else if(code===4002)g.kL=false;
 else if(code===4003)g.kR=true;else if(code===4004)g.kR=false;
 else if(code===4005)g.clearInput();else if(code===4006)g.ptr=null;
 else if(g.ph==='forge'&&g.fPhase==='edit'){
  if(code>=4010&&code<=4012&&code-4010<g.cards.length){g.sel=code-4010;g.clampGhost();}
  else if(code>=4020&&code<=4035&&g.sel>=0){const n=code-4020,d=g.dims(g.cards[g.sel].cells);g.ghost={x:Math.min(n%4,4-d.w),y:Math.min(Math.floor(n/4),4-d.h)};}
  else if(code===4036)g.forgeRotate();else if(code===4037)g.forgeConfirm();else if(code===4038)g.forgeSkip();
 }
 return true;
}
return {rulesVersion,inputCount,createGame,create,input,advance:(g,dt)=>g.update(dt),score:g=>g.score};
})();
if(typeof module!=='undefined')module.exports=puddingRules;
