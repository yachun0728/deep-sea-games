  /* ---------- Pudding Dash: forge a weapon from puzzle pieces, then run; the weapon grid is the real hitbox ---------- */
  var puddingBusy=false,puddingStake=0,puddingSay=function(){};
  (function(){
const c=$('pd-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,OL='#2a1a12',FONT='Nunito,"Zen Maru Gothic","M PLUS Rounded 1c",ui-rounded,"Arial Rounded MT Bold","Noto Sans TC",system-ui,sans-serif';c.width=W*DPR;c.height=H*DPR;
const PY=440,XMIN=60,XMAX=340,KEY_SPEED=230,PTR_SPEED=280;   // hero row, walking range, keyboard and press-and-hold speeds (px/s)
const CELL=20,WTOP=332,EW=54,EH=40;                          // weapon cell size, weapon top edge, enemy size
const SEGS=8,SEG_TIME=16,SPAWN_STOP=13,FIRST_SPAWN=.8,CAV_WARN=.6,ARROW_SPEED=420;
const SPEED_MUL={inf:1,cav:1.7,shield:.7},HURT={inf:10,cav:15,shield:12,arrow:8,pass:3},KILL={inf:10,cav:15,shield:20};
const SEG_SCORE=100,WIN_SCORE=500,CALM_SCORE=5,STREAK_STEP=8,STREAK_HEAL=5,SEG_HEAL=10;
const SEG_REWARD=1,WIN_REWARD=2;      // fixed rewards: one per cleared segment, plus two for clearing all eight (maximum 10)
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
const RR=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
function tx(s,x,y,sz,col,al,mw){mw=mw||W-40;g.font='900 '+sz+'px '+FONT;g.textAlign=al||'center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=Math.max(3,sz/4);g.strokeStyle=OL;g.strokeText(s,x,y,mw);g.fillStyle=col;g.fillText(s,x,y,mw)}
const cardX=i=>20+(3-cards.length)*62+124*i;
const inRect=(x,y,rx,ry,w,h)=>x>=rx&&x<rx+w&&y>=ry&&y<ry+h;
const RULE_LABELS={'pudding.msg.010':'{{t:pudding.msg.010}}','pudding.msg.011':'{{t:pudding.msg.011}}'};
let G;let st,ph,why,tt,forgeCount,grid,stats,calm,score,killScore,segScore,calmBonus,winBonus,seg,cards,sel,ghost,flashCells,flashT,fPhase,fT,rt,spawnT,enemies,warns,archers,arrows,dying,floats,lastX,streak,px,hurtT,worryT,happyT,redT,shakeT,scroll,sub,subT,banner,kL,kR,ptr;let rec=false,last=0;
function syncSimulation(){({st,ph,why,tt,forgeCount,grid,stats,calm,score,killScore,segScore,calmBonus,winBonus,seg,cards,sel,ghost,flashCells,flashT,fPhase,fT,rt,spawnT,enemies,warns,archers,arrows,dying,floats,lastX,streak,px,hurtT,worryT,happyT,redT,shakeT,scroll,sub,subT,banner,kL,kR,ptr}=G);}
function reset(random){G=puddingRules.createGame(random||Math.random,{
 label:id=>RULE_LABELS[id]||id,reduceMotion:()=>reduceMotion,say,
 segment:()=>{syncSimulation();earned+=SEG_REWARD;S.balance+=SEG_REWARD;save();renderAll();AN.progress(analytics,{stage:seg,step:seg,score,bonus_points:SEG_REWARD});},
 end:reason=>{syncSimulation();settle(reason);}});syncSimulation();}
function computeStats(...args){const result=G.computeStats(...args);syncSimulation();return result;}
function previewGrid(...args){const result=G.previewGrid(...args);syncSimulation();return result;}
function weaponCells(...args){const result=G.weaponCells(...args);syncSimulation();return result;}
function dims(...args){const result=G.dims(...args);syncSimulation();return result;}
function update(...args){const result=G.update(...args);syncSimulation();return result;}
const rank=timedLeaderboard('pudding','pd',puddingRules.inputCount,ui,
 ()=>window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:'pudding'}})),{canvas:'pd-canvas',maxInputs:4000});
function input(code){if(st!=='run'||code===4001&&kL||code===4002&&!kL||code===4003&&kR||code===4004&&!kR)return;puddingRules.input(G,code);rank.record(code);syncSimulation();}
function clearInput(){if(st==='run')input(4005);else G?.clearInput();syncSimulation();}
function forgeRotate(){input(4036);}function forgeConfirm(){input(4037);}function forgeSkip(){input(4038);}
function forgeTap(x,y){if(fPhase!=='edit')return;
 for(let i=0;i<cards.length;i++)if(inRect(x,y,cardX(i),CY,112,CH)){input(4010+i);return;}
 if(inRect(x,y,GX,GY,GC*4,GC*4)){input(4020+Math.floor((x-GX)/GC)+Math.floor((y-GY)/GC)*4);return;}
 if(inRect(x,y,20,BY,110,50))forgeRotate();else if(inRect(x,y,145,BY,110,50))forgeConfirm();else if(inRect(x,y,270,BY,110,50))forgeSkip();}
function target(x){const n=Math.round(Math.max(0,Math.min(400,x))*10);if(ptr!==n/10)input(n);}
reset();
function say(text,kind){$('pd-msg').textContent=text;$('pd-msg').className='msg'+(kind?' '+kind:'')}
puddingSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const live=st==='run';$('view-pudding').dataset.round=st;
 setText('pd-seg','第 '+seg+'/'+SEGS+' 段');setText('pd-score',String(score));setText('pd-best',best+' 分');
 $('pd-amount').disabled=puddingBusy;$('pd-go').disabled=live||rank.busy();setText('pd-go',live?'{{t:pudding.msg.007}}':st==='over'?'{{t:pudding.msg.008}}':'{{t:pudding.msg.009}}');
}
const fl=(s,x,y,col)=>floats.push({s,x,y,col,t:0});
function settle(reason){
 if(reason==='win'){earned+=WIN_REWARD;S.balance+=WIN_REWARD}
 rec=score>best;
 if(rec){best=score;try{localStorage.setItem('deep-sea-pudding-best',best)}catch(e){}}
 AN.end(analytics,earned,reason==='win'||earned>0?'complete':'loss',{score:score,step:seg,stage:seg});puddingBusy=false;save();renderAll();
 if(reason==='win')say('成功護送布丁到援軍橋！本局共入帳 '+fmt(earned)+' 點。','win');
 else if(!earned)say('布丁哭了，撐到第 '+seg+' 段。這一局沒有額外成就獎勵。','lose');
 else say('布丁哭了，撐到第 '+seg+' 段，本局共入帳 '+fmt(earned)+' 點。','win');
 rank.finish(score);ui();
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
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('pudding',amount);puddingStake=amount;puddingBusy=true;save();renderAll();
 reset(random);earned=0;st=G.st='run';last=performance.now();G.enterForge();syncSimulation();say('{{t:pudding.msg.045}}');ui();c.focus();
 },undefined,{rulesVersion:puddingRules.rulesVersion});ui();
}
const shown=()=>!$('view-pudding').hidden&&!document.hidden;
const ptX=e=>{const rc=c.getBoundingClientRect();return(e.clientX-rc.left)*W/(rc.width||W)},ptY=e=>{const rc=c.getBoundingClientRect();return(e.clientY-rc.top)*H/(rc.height||H)};
$('pd-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(st!=='run'){say(st==='over'?'{{t:pudding.msg.046}}':'{{t:pudding.msg.047}}');return}
 if(!shown())return;e.preventDefault();c.focus();
 if(ph==='forge')forgeTap(ptX(e),ptY(e));
 else if(sub==='play'){target(ptX(e));try{c.setPointerCapture(e.pointerId)}catch(err){}}
});
c.addEventListener('pointermove',e=>{if(ptr!==null)target(ptX(e))});
const release=()=>{if(ptr!==null)input(4006)};
c.addEventListener('pointerup',release);c.addEventListener('pointercancel',release);
c.addEventListener('contextmenu',e=>e.preventDefault());
const isL=k=>k==='ArrowLeft'||k==='a'||k==='A',isR=k=>k==='ArrowRight'||k==='d'||k==='D';
addEventListener('keydown',e=>{
 if(!shown()||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;
 const k=e.key;
 if(ph==='run'){if(isL(k)){e.preventDefault();input(4001)}else if(isR(k)){e.preventDefault();input(4003)}}
 else if(!e.repeat){if(k==='r'||k==='R'){e.preventDefault();forgeRotate()}else if(k==='Enter'){e.preventDefault();forgeConfirm()}else if(k==='s'||k==='S'){e.preventDefault();forgeSkip()}}
});
addEventListener('keyup',e=>{if(isL(e.key))input(4002);else if(isR(e.key))input(4004)});
addEventListener('blur',()=>{last=performance.now();clearInput()});
document.addEventListener('visibilitychange',()=>{last=performance.now();clearInput()});
window.addEventListener('hashchange',()=>{last=performance.now();clearInput()});
function loop(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;if(shown()){rank.update(dt*1000,()=>st==='run',update);ui();draw()}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();
