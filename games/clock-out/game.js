  /* ---------- Clock Out: office backpack tower defence; 8 waves, fixed BONUS at wave 5 and at clear ---------- */
  var clockBusy=false,clockStake=0,clockSay=function(){};
  (function(){
'use strict';
var WV=['','第 1 波','第 2 波','第 3 波','第 4 波','第 5 波','第 6 波','第 7 波','第 8 波'];
var CLOCK_BONUS=[{wave:5,pts:3},{wave:8,pts:7}];
var analytics=null,earned=0,paid={};
var $v=$('view-clock-out');
function coShown(){return !$v.hidden&&!document.hidden;}
function say(t,kind){var m=$('co-msg');m.textContent=t;m.className='msg'+(kind?' '+kind:'');}
clockSay=say;
function setText(id,v){var e=$(id);if(e.textContent!==v)e.textContent=v;}
function ui(){
  var live=clockBusy;
  setText('co-wave',live||G.state==='WIN'||G.state==='GAMEOVER'?Math.min(G.wi+1,8)+' / 8':'— / 8');
  setText('co-san',live?G.san+' / '+CONFIG.maxSan:'—');
  setText('co-best',best+' 分');
  var b=$('co-go');b.disabled=live;
  setText('co-go',live?'上班中 · 守住座位':'免費開始上班');
}
function pay(n,label,wave){
  if(paid[wave])return;paid[wave]=true;
  earned+=n;S.balance+=n;save();renderAll();
  if(analytics)AN.progress(analytics,{stage:wave,step:wave,score:G.killScore+G.waveScoreTotal,bonus_points:n,total_bonus_points:earned});
  say(label,'win');
}
function clockWaveDone(n){
  if(!clockBusy)return;
  if(n===5)pay(3,'撐過第 5 波，BONUS +3 點已入帳。',5);
}
function clockFinish(res){
  if(!clockBusy)return;
  if(res==='win')pay(7,'17:00 打卡下班，BONUS +7 點已入帳。',8);
  clockBusy=false;
  var result=earned>0?'complete':'loss';
  AN.end(analytics,earned,result,{score:G.score,step:G.wi+1,stage:G.wi+1});analytics=null;
  save();renderAll();
  if(res==='win')say('通關！本局共入帳 '+fmt(earned)+' 點。','win');
  else say(earned>0?'加班到天亮。'+WV[G.wi+1]+'倒下，本局共入帳 '+fmt(earned)+' 點。':'加班到天亮。'+WV[G.wi+1]+'倒下，這一局沒有額外成就獎勵。','lose');
  ui();
}
function begin(){
  if(clockBusy)return;
  if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return;}
  analytics=AN.start('clock-out',ENTRY_FEE);clockStake=ENTRY_FEE;clockBusy=true;earned=0;paid={};
  save();renderAll();
  resetGame();startGame();
  say('開工！第 5 波完成 +3 點，通關再 +7 點。');ui();$('co-canvas').focus();
}
/* ============================================================
   CONFIG：所有數值集中在這裡（規格 v0.1）
   ============================================================ */
var CONFIG = {
  W:400, H:560,
  startMoney:150, maxSan:20, healAfterWave:2, waveBonus:30, rerollCost:10,
  grid:6, cell:40, ox:80, oy:110,
  path:[[50,80],[350,80],[350,380],[50,380]],
  slowFactor:0.7,
  heroDmg:2, heroCd:0.5, heroReach:48,
  meetingReach:100, meetingLock:3.0,
  bandChainReach:60, bandChains:2,
  coffeeCap:0.75, hlCap:0.6,
  lvDmg:[1,1.7,3.0], lvRng:[1,1.08,1.16],
  coffeeBonus:[0.25,0.35,0.50], hlBonus:[0.20,0.30,0.40],
  bossSummonEvery:4.0, bossSummonCount:2,
  waveScore:100, winScore:500, sanScore:30
};

var TOOLS = {
  band:       {id:'band',       name:'橡皮筋', ch:'RB', cost:30, rng:85,  dmg:3,  iv:0.8, atk:true,  w:20, shape:[[0,0]],                       fill:'#fbc02d', stroke:'#f57f17', tag:'剋：電郵', desc:'橡皮筋：連彈 3 隻，剋電子郵件'},
  coffee:     {id:'coffee',     name:'咖啡杯', ch:'CM', cost:35, rng:0,   dmg:0,  iv:0,   atk:false, w:15, shape:[[0,0]],                       fill:'#d7ccc8', stroke:'#4e342e', tag:'輔助',     desc:'咖啡杯：貼著的工具射速變快'},
  stapler:    {id:'stapler',    name:'釘書機', ch:'ST', cost:40, rng:95,  dmg:4,  iv:0.5, atk:true,  w:18, shape:[[0,0],[1,0]],                 fill:'#546e7a', stroke:'#263238', tag:'剋：緊急', desc:'釘書機：快速單體，剋緊急任務'},
  highlighter:{id:'highlighter',name:'螢光筆', ch:'HL', cost:45, rng:0,   dmg:0,  iv:0,   atk:false, w:10, shape:[[0,0],[1,0],[2,0]],           fill:'#c6ff00', stroke:'#76a300', tag:'輔助',     desc:'螢光筆：貼著的工具射程變遠'},
  headphones: {id:'headphones', name:'耳機',   ch:'HP', cost:60, rng:100, dmg:3,  iv:1.2, atk:true,  w:12, shape:[[0,0],[0,1],[1,1]],           fill:'#7e57c2', stroke:'#4527a0', tag:'剋：會議', desc:'耳機：範圍減速並擋會議邀請，剋會議'},
  stamp:      {id:'stamp',      name:'印章',   ch:'SP', cost:70, rng:120, dmg:40, iv:2.0, atk:true,  w:13, shape:[[0,0],[0,1]],                 fill:'#e53935', stroke:'#8e1c1a', tag:'剋：報表', desc:'印章：慢但重擊，剋報表與老闆'},
  shredder:   {id:'shredder',   name:'碎紙機', ch:'SH', cost:80, rng:85,  dmg:8,  iv:1.4, atk:true,  w:12, shape:[[0,0],[1,0],[0,1],[1,1]],     fill:'#26a69a', stroke:'#00695c', tag:'剋：紙本', desc:'碎紙機：範圍傷害，剋紙本文件'}
};
var TOOL_ORDER = ['band','coffee','stapler','highlighter','headphones','stamp','shredder'];

// hp, speed, leak(理智), reward(便利貼), score, 名稱
var ENEMIES = {
  email:  {name:'電子郵件', hp:15,   sp:70,  leak:1,  reward:4,   score:4,   barW:26, noSlow:false, hint:'橡皮筋'},
  paper:  {name:'紙本文件', hp:50,   sp:40,  leak:2,  reward:8,   score:8,   barW:28, noSlow:false, hint:'碎紙機'},
  meeting:{name:'會議邀請', hp:65,   sp:50,  leak:2,  reward:10,  score:10,  barW:28, noSlow:false, hint:'耳機'},
  report: {name:'報表',     hp:200,  sp:30,  leak:4,  reward:18,  score:18,  barW:36, noSlow:false, hint:'印章'},
  urgent: {name:'緊急任務', hp:38,   sp:110, leak:3,  reward:12,  score:12,  barW:26, noSlow:true,  hint:'釘書機'},
  boss:   {name:'老闆',     hp:1250, sp:25,  leak:99, reward:100, score:100, barW:60, noSlow:true,  hint:'印章'}
};

var MULT = {
  band:      {email:2.0,paper:1.0,meeting:1.0,report:0.5,urgent:1.0,boss:1.0},
  stapler:   {email:1.0,paper:1.0,meeting:1.0,report:0.5,urgent:2.0,boss:1.0},
  headphones:{email:1.0,paper:1.0,meeting:2.0,report:1.0,urgent:1.0,boss:1.0},
  stamp:     {email:0.5,paper:1.0,meeting:1.0,report:2.0,urgent:1.0,boss:1.5},
  shredder:  {email:1.0,paper:2.0,meeting:1.0,report:1.0,urgent:0.5,boss:1.0}
};

// 出場組：[類型, 隻數, 間隔, 延遲]
var WAVES = [
  [['email',8,1.3,0]],
  [['email',10,1.0,0],['paper',5,2.0,12]],
  [['paper',8,1.8,0],['email',12,0.8,6],['report',1,1.0,14]],
  [['meeting',5,2.4,0],['email',13,0.7,3]],
  [['report',3,4.5,0],['paper',9,1.4,4],['urgent',4,2.7,10]],
  [['urgent',9,1.4,0],['meeting',7,1.8,4],['email',18,0.55,8]],
  [['report',6,3.5,0],['paper',13,1.1,2],['meeting',8,1.7,6],['urgent',8,1.7,10]],
  [['boss',1,1.0,5],['email',28,0.45,0],['report',5,4.0,3],['meeting',8,1.7,8],['urgent',11,1.3,12]]
];
var CLOCK = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

/* ============================================================
   基本工具
   ============================================================ */
var canvas = $('co-canvas');
var ctx = canvas.getContext('2d');
var W = CONFIG.W, H = CONFIG.H;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function dist(ax,ay,bx,by){var dx=ax-bx,dy=ay-by;return Math.sqrt(dx*dx+dy*dy);}
function rrect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function text(str,x,y,size,color,align,bold,stroke){
  ctx.font=(bold?'bold ':'')+size+'px sans-serif';
  ctx.textAlign=align||'left';ctx.textBaseline='middle';
  if(stroke){ctx.lineWidth=3;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(str,x,y);}
  ctx.fillStyle=color;ctx.fillText(str,x,y);
}

// 走道
var SEG=[],PATH_LEN=0;
(function(){
  var p=CONFIG.path;
  for(var i=0;i<p.length-1;i++){
    var l=dist(p[i][0],p[i][1],p[i+1][0],p[i+1][1]);
    SEG.push(l);PATH_LEN+=l;
  }
})();
function pathPos(s){
  var p=CONFIG.path;
  for(var i=0;i<SEG.length;i++){
    if(s<=SEG[i]||i===SEG.length-1){
      var t=clamp(s/SEG[i],0,1);
      return [p[i][0]+(p[i+1][0]-p[i][0])*t, p[i][1]+(p[i+1][1]-p[i][1])*t];
    }
    s-=SEG[i];
  }
  return [p[p.length-1][0],p[p.length-1][1]];
}

// 形狀
function normShape(sh){
  var mx=1e9,my=1e9,i;
  for(i=0;i<sh.length;i++){mx=Math.min(mx,sh[i][0]);my=Math.min(my,sh[i][1]);}
  var out=[];
  for(i=0;i<sh.length;i++)out.push([sh[i][0]-mx,sh[i][1]-my]);
  return out;
}
function rotateShape(sh){ // 順時針 90°：(x,y)->(-y,x)
  var r=[];
  for(var i=0;i<sh.length;i++)r.push([-sh[i][1],sh[i][0]]);
  return normShape(r);
}
function shapeRot(sh,n){var s=normShape(sh);for(var i=0;i<(n%4);i++)s=rotateShape(s);return s;}
function shapeSize(sh){
  var w=0,h=0;
  for(var i=0;i<sh.length;i++){w=Math.max(w,sh[i][0]+1);h=Math.max(h,sh[i][1]+1);}
  return [w,h];
}
function cellCenter(c,r){return [CONFIG.ox+(c+0.5)*CONFIG.cell, CONFIG.oy+(r+0.5)*CONFIG.cell];}
function itemCenter(it){
  var sx=0,sy=0;
  for(var i=0;i<it.cells.length;i++){var cc=cellCenter(it.cells[i][0],it.cells[i][1]);sx+=cc[0];sy+=cc[1];}
  return [sx/it.cells.length, sy/it.cells.length];
}

/* ============================================================
   遊戲狀態
   ============================================================ */
var G = {};
var best = 0;
try{ best = parseInt(localStorage.getItem('deep-sea-clock-out-best'),10)||0; }catch(e){ best=0; }
function saveBest(){ try{ localStorage.setItem('deep-sea-clock-out-best', String(best)); }catch(e){} }

function resetGame(){
  G.state='TITLE';
  G.san=CONFIG.maxSan; G.money=CONFIG.startMoney;
  G.wi=0; G.buildCount=0; G.fast=false;
  G.score=0; G.killScore=0; G.waveScoreTotal=0;
  G.items=[]; G.enemies=[]; G.effects=[]; G.floats=[];
  G.cards=[]; G.selCard=-1; G.ghost=null; G.selItem=null;
  G.T=0; G.spawns=[]; G.spawnIdx=0; G.spawnTotal=0;
  G.heroCd=0; G.topFlash=0; G.headRed=0;
  G.banner=null; G.bannerView='build';
  G.endTimer=0; G.endReason=''; G.newBest=false;
  G.toast=null; G.shake=0; G.bossWarn=0; G.bossSeen=false;
  G.time=0; G.hintShown1=false;
}
resetGame();

/* ---------- 抽卡（規格 10.2） ---------- */
function pickTool(attackOnly){
  var list=[],tot=0,i;
  for(i=0;i<TOOL_ORDER.length;i++){
    var t=TOOLS[TOOL_ORDER[i]];
    if(attackOnly && !t.atk) continue;
    list.push(t);tot+=t.w;
  }
  var r=Math.random()*tot;
  for(i=0;i<list.length;i++){ r-=list[i].w; if(r<=0) return list[i].id; }
  return list[list.length-1].id;
}
function drawCards(){
  var cards;
  if(G.buildCount<=2){
    cards=[pickTool(true),pickTool(true),pickTool(true)];
  }else{
    do{ cards=[pickTool(false),pickTool(false),pickTool(false)]; }
    while(!(TOOLS[cards[0]].atk||TOOLS[cards[1]].atk||TOOLS[cards[2]].atk));
  }
  G.cards=cards.map(function(id){return {t:id,rot:0};});
  G.selCard=-1; G.ghost=null;
}
function enterBuild(){
  G.state='BUILD'; G.selItem=null; G.selCard=-1; G.ghost=null;
  drawCards();
}

/* ---------- 抽屜 ---------- */
function occupied(ignore){
  var occ={};
  for(var i=0;i<G.items.length;i++){
    if(G.items[i]===ignore) continue;
    var cs=G.items[i].cells;
    for(var j=0;j<cs.length;j++) occ[cs[j][0]+','+cs[j][1]]=G.items[i];
  }
  return occ;
}
function itemAt(c,r){
  for(var i=0;i<G.items.length;i++){
    var cs=G.items[i].cells;
    for(var j=0;j<cs.length;j++) if(cs[j][0]===c&&cs[j][1]===r) return G.items[i];
  }
  return null;
}
function canPlace(cells,ignore){
  var occ=occupied(ignore),n=CONFIG.grid;
  for(var i=0;i<cells.length;i++){
    var c=cells[i][0],r=cells[i][1];
    if(c<0||c>=n||r<0||r>=n) return false;
    if(occ[c+','+r]) return false;
  }
  return true;
}
function areAdjacent(a,b){
  for(var i=0;i<a.cells.length;i++){
    for(var j=0;j<b.cells.length;j++){
      if(Math.abs(a.cells[i][0]-b.cells[j][0])+Math.abs(a.cells[i][1]-b.cells[j][1])===1) return true;
    }
  }
  return false;
}
// 規格 6.5：相鄰加成
function bonusesFor(it,others){
  var cof=0,hl=0;
  for(var i=0;i<others.length;i++){
    var o=others[i];
    if(o===it) continue;
    if(o.t!=='coffee'&&o.t!=='highlighter') continue;
    if(!areAdjacent(it,o)) continue;
    if(o.t==='coffee') cof+=CONFIG.coffeeBonus[o.lv-1];
    else hl+=CONFIG.hlBonus[o.lv-1];
  }
  return {rate:Math.min(CONFIG.coffeeCap,cof), rng:Math.min(CONFIG.hlCap,hl)};
}
function recalc(){
  for(var i=0;i<G.items.length;i++){
    var it=G.items[i],d=TOOLS[it.t];
    var b=bonusesFor(it,G.items);
    it.rateBonus=b.rate; it.rngBonus=b.rng;
    it.range=d.rng*CONFIG.lvRng[it.lv-1]*(1+b.rng);
    it.interval=d.iv>0 ? d.iv/(1+b.rate) : 0;
    it.dmgBase=d.dmg*CONFIG.lvDmg[it.lv-1];
  }
}
function newItem(t,cells){
  var it={t:t,cells:cells,lv:1,cd:0,locked:0,flash:0,rateBonus:0,rngBonus:0,range:0,interval:0,dmgBase:0};
  return it;
}

/* ---------- 浮字／特效 ---------- */
function addFloat(x,y,str,color,dur,rise,size){
  G.floats.push({x:x,y:y,str:str,color:color,t:0,dur:dur||0.5,rise:rise||30,size:size||14});
}
function addFx(o){o.t=0;G.effects.push(o);}
function toast(x,y,str,color){addFloat(x,y,str,color||'#ff5252',0.8,30,14);}

/* ============================================================
   版面座標
   ============================================================ */
var CARD_RECTS=[[12,408,112,90],[134,408,112,90],[256,408,112,90]];
var BTN={
  rotate:[12,518,70,36], recycle:[88,518,70,36], reroll:[164,518,96,36], go:[266,518,122,36],
  fast:[300,408,88,32]
};
function inRect(x,y,r){return x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];}

/* ============================================================
   輸入
   ============================================================ */
function toLogical(ev){
  var rect=canvas.getBoundingClientRect();
  return [(ev.clientX-rect.left)*W/rect.width, (ev.clientY-rect.top)*H/rect.height];
}
canvas.addEventListener('pointerdown',function(ev){
  ev.preventDefault();
  var p=toLogical(ev);
  handleTap(p[0],p[1]);
},{passive:false});
canvas.addEventListener('touchstart',function(e){e.preventDefault();},{passive:false});
canvas.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
window.addEventListener('keydown',function(ev){
  var k=ev.key;
  if(!coShown()||ev.metaKey||ev.altKey||ev.ctrlKey) return;
  if(['INPUT','BUTTON','A','SUMMARY'].indexOf(ev.target.tagName)>=0) return;
  if(G.state==='BUILD'){
    if(k==='r'||k==='R'){doRotate();ev.preventDefault();}
    else if(k==='Delete'||k==='Backspace'){doRecycle();ev.preventDefault();}
    else if(k==='Enter'){doGo();ev.preventDefault();}
  }
});

function handleTap(x,y){
  if(G.state==='TITLE'){ say('先按右側「免費開始上班」。'); return; }
  if(G.state==='WIN'||G.state==='GAMEOVER'){
    if(G.endTimer>=0.6){ resetGame(); ui(); }
    return;
  }
  if(G.state==='WAVE'){
    if(inRect(x,y,BTN.fast)){ G.fast=!G.fast; return; }
    if(y<400) heroThrow(x,y);
    return;
  }
  if(G.state==='BUILD'){ buildTap(x,y); return; }
}

function startGame(){
  var keepBest=best;
  resetGame(); best=keepBest;
  G.wi=0; G.buildCount=0;
  enterBuild();
}

/* ---------- BUILD 操作 ---------- */
function cardCells(card){return shapeRot(TOOLS[card.t].shape,card.rot);}
function clampGhost(cx,cy,shape){
  var s=shapeSize(shape);
  return [Math.min(cx,CONFIG.grid-s[0]), Math.min(cy,CONFIG.grid-s[1])];
}
function ghostCells(){
  if(G.selCard<0||!G.ghost) return null;
  var sh=cardCells(G.cards[G.selCard]),out=[];
  for(var i=0;i<sh.length;i++) out.push([G.ghost[0]+sh[i][0],G.ghost[1]+sh[i][1]]);
  return out;
}
function buildTap(x,y){
  var i;
  // 按鈕
  if(inRect(x,y,BTN.rotate)){doRotate();return;}
  if(inRect(x,y,BTN.recycle)){doRecycle();return;}
  if(inRect(x,y,BTN.reroll)){doReroll();return;}
  if(inRect(x,y,BTN.go)){doGo();return;}
  // 卡片
  for(i=0;i<3;i++){
    if(inRect(x,y,CARD_RECTS[i])){
      if(G.cards[i]){ G.selCard=i; G.selItem=null; G.ghost=null; }
      return;
    }
  }
  // 抽屜
  var cx=Math.floor((x-CONFIG.ox)/CONFIG.cell), cy=Math.floor((y-CONFIG.oy)/CONFIG.cell);
  if(cx<0||cx>=CONFIG.grid||cy<0||cy>=CONFIG.grid) return;
  if(G.selCard>=0){
    var sh=cardCells(G.cards[G.selCard]);
    var gc=ghostCells();
    if(gc){
      for(i=0;i<gc.length;i++){
        if(gc[i][0]===cx&&gc[i][1]===cy){ confirmBuy(); return; }
      }
    }
    G.ghost=clampGhost(cx,cy,sh);
    return;
  }
  var hit=itemAt(cx,cy);
  if(G.selItem){
    if(hit===G.selItem){ G.selItem=null; return; }
    if(hit){
      if(hit.t===G.selItem.t&&hit.lv===G.selItem.lv&&hit.lv<3){
        hit.lv++; hit.flash=0.3;
        G.items.splice(G.items.indexOf(G.selItem),1);
        G.selItem=hit; recalc();
      }else{
        var c0=itemCenter(hit); toast(c0[0],c0[1],'不能合併');
      }
      return;
    }
    // 移動
    var it=G.selItem;
    var shp=normShape(it.cells);
    var g=clampGhost(cx,cy,shp);
    var nc=[];
    for(i=0;i<shp.length;i++) nc.push([g[0]+shp[i][0],g[1]+shp[i][1]]);
    if(canPlace(nc,it)){ it.cells=nc; it.flash=0.3; recalc(); }
    else { var cc=cellCenter(cx,cy); toast(cc[0],cc[1],'放不下'); }
    return;
  }
  if(hit){ G.selItem=hit; }
}
function confirmBuy(){
  var card=G.cards[G.selCard]; if(!card) return;
  var d=TOOLS[card.t], gc=ghostCells();
  var c0=cellCenter(G.ghost[0],G.ghost[1]);
  if(!canPlace(gc,null)){ G.ghostShake=0.2; toast(c0[0],c0[1],'放不下'); return; }
  if(G.money<d.cost){ toast(c0[0],c0[1],'便利貼不夠'); return; }
  G.money-=d.cost;
  var it=newItem(card.t,gc); it.flash=0.3;
  G.items.push(it);
  recalc();
  drawCards();
}
function doRotate(){
  var i;
  if(G.selCard>=0){
    var c=G.cards[G.selCard]; c.rot=(c.rot+1)%4;
    if(G.ghost){ G.ghost=clampGhost(G.ghost[0],G.ghost[1],cardCells(c)); }
    return;
  }
  if(G.selItem){
    var it=G.selItem, sh=normShape(it.cells);
    var minx=1e9,miny=1e9;
    for(i=0;i<it.cells.length;i++){minx=Math.min(minx,it.cells[i][0]);miny=Math.min(miny,it.cells[i][1]);}
    var rs=rotateShape(sh), sz=shapeSize(rs);
    var ox=Math.min(minx,CONFIG.grid-sz[0]), oy=Math.min(miny,CONFIG.grid-sz[1]);
    var nc=[];
    for(i=0;i<rs.length;i++) nc.push([ox+rs[i][0],oy+rs[i][1]]);
    if(canPlace(nc,it)){ it.cells=nc; recalc(); }
    else { var cc=itemCenter(it); toast(cc[0],cc[1],'放不下'); }
  }
}
function doRecycle(){
  if(!G.selItem) return;
  var it=G.selItem, d=TOOLS[it.t];
  var refund=Math.floor(0.5*d.cost*Math.pow(2,it.lv-1));
  G.money+=refund;
  var c=itemCenter(it); addFloat(c[0],c[1],'+'+refund,'#ffd54f',0.8,30,14);
  G.items.splice(G.items.indexOf(it),1);
  G.selItem=null; recalc();
}
function doReroll(){
  if(G.money<CONFIG.rerollCost) return;
  G.money-=CONFIG.rerollCost;
  drawCards();
}
function doGo(){
  recalc();
  G.state='BANNER';
  G.bannerView='build';
  G.banner={text:CLOCK[G.wi]+' 開工！',t:0,dur:0.8,next:startWave};
  G.selCard=-1;G.ghost=null;G.selItem=null;
}

/* ============================================================
   戰鬥
   ============================================================ */
function startWave(){
  G.state='WAVE';
  G.T=0; G.enemies=[]; G.effects=[]; G.floats=[];
  G.heroCd=0;
  G.spawns=[];
  var g=WAVES[G.wi],i,k;
  for(i=0;i<g.length;i++){
    for(k=0;k<g[i][1];k++) G.spawns.push({t:g[i][3]+k*g[i][2], type:g[i][0]});
  }
  G.spawns.sort(function(a,b){return a.t-b.t;});
  G.spawnIdx=0; G.spawnTotal=G.spawns.length;
  for(i=0;i<G.items.length;i++){G.items[i].cd=0;G.items[i].locked=0;}
  recalc();
  G.bossSeen=false;
}
function makeEnemy(type,s){
  var d=ENEMIES[type];
  return {type:type,s:s,hp:d.hp,maxHp:d.hp,slow:0,used:false,bt:0,flash:0,fcd:0,dying:0};
}
function enemyPos(e){return pathPos(e.s);}

function heroThrow(x,y){
  if(G.heroCd>0) return;
  var best_=null,bd=1e9;
  for(var i=0;i<G.enemies.length;i++){
    var e=G.enemies[i]; if(e.hp<=0) continue;
    var p=enemyPos(e),d=dist(x,y,p[0],p[1]);
    if(d<bd){bd=d;best_=e;}
  }
  if(!best_||bd>CONFIG.heroReach) return;
  G.heroCd=CONFIG.heroCd;
  best_.hp-=CONFIG.heroDmg; best_.flash=0.08;
  var p2=enemyPos(best_);
  addFx({kind:'line',x1:50,y1:380,x2:p2[0],y2:p2[1],color:'#ffd54f',dur:0.1,w:2});
}

function damage(e,amount,toolId){
  e.hp-=amount; e.flash=0.08;
  var m=MULT[toolId]?MULT[toolId][e.type]:1;
  if(e.fcd<=0){
    var p=enemyPos(e);
    if(m>=2){ addFloat(p[0],p[1]-18,Math.round(amount)+'!','#ff9800',0.5,30,14); e.fcd=0.25; }
    else if(m<=0.5){ addFloat(p[0],p[1]-18,'無效','#9e9e9e',0.5,30,12); e.fcd=0.25; }
  }
}

function fireTool(it){
  var d=TOOLS[it.t],c=itemCenter(it),R=it.range,i;
  var inr=[];
  for(i=0;i<G.enemies.length;i++){
    var e=G.enemies[i]; if(e.hp<=0) continue;
    var p=enemyPos(e);
    if(dist(c[0],c[1],p[0],p[1])<=R) inr.push(e);
  }
  if(!inr.length) return;
  it.cd=it.interval;
  it.flash=0.08;
  var front=inr[0];
  for(i=1;i<inr.length;i++) if(inr[i].s>front.s) front=inr[i];
  var dmg,m,tg;
  if(it.t==='stapler'||it.t==='stamp'){
    dmg=it.dmgBase*MULT[it.t][front.type];
    damage(front,dmg,it.t);
    var fp=enemyPos(front);
    if(it.t==='stapler') addFx({kind:'line',x1:c[0],y1:c[1],x2:fp[0],y2:fp[1],color:'#eceff1',dur:0.1,w:2});
    else addFx({kind:'stamp',x:fp[0],y:fp[1],dur:0.2});
  }else if(it.t==='band'){
    var hit=[front],last=front;
    for(var k=0;k<CONFIG.bandChains;k++){
      var lp=enemyPos(last),bestE=null,bd=1e9;
      for(i=0;i<G.enemies.length;i++){
        var o=G.enemies[i]; if(o.hp<=0||hit.indexOf(o)>=0) continue;
        var op=enemyPos(o),dd=dist(lp[0],lp[1],op[0],op[1]);
        if(dd<=CONFIG.bandChainReach&&dd<bd){bd=dd;bestE=o;}
      }
      if(!bestE) break;
      hit.push(bestE); last=bestE;
    }
    var pts=[c];
    for(i=0;i<hit.length;i++){
      var e2=hit[i];
      damage(e2,it.dmgBase*MULT.band[e2.type],'band');
      if(!ENEMIES[e2.type].noSlow) e2.slow=1.0;
      pts.push(enemyPos(e2));
    }
    addFx({kind:'chain',pts:pts,color:'#fbc02d',dur:0.15});
  }else if(it.t==='headphones'){
    for(i=0;i<inr.length;i++){
      damage(inr[i],it.dmgBase*MULT.headphones[inr[i].type],'headphones');
      if(!ENEMIES[inr[i].type].noSlow) inr[i].slow=1.5;
    }
    addFx({kind:'ring',x:c[0],y:c[1],r:R,color:'#4fc3f7',dur:0.25});
  }else if(it.t==='shredder'){
    for(i=0;i<inr.length;i++){
      damage(inr[i],it.dmgBase*MULT.shredder[inr[i].type],'shredder');
    }
    addFx({kind:'ring',x:c[0],y:c[1],r:R,color:'#26a69a',dur:0.25});
  }
}

function updateWave(dt){
  var i,e;
  G.T+=dt;
  // 出場
  while(G.spawnIdx<G.spawns.length && G.spawns[G.spawnIdx].t<=G.T){
    var type=G.spawns[G.spawnIdx].type;
    G.enemies.push(makeEnemy(type,0));
    if(type==='boss'&&!G.bossSeen){G.bossSeen=true;G.bossWarn=1.2;}
    G.spawnIdx++;
  }
  // 老闆召喚
  for(i=0;i<G.enemies.length;i++){
    e=G.enemies[i];
    if(e.type==='boss'&&e.hp>0){
      e.bt+=dt;
      if(e.bt>=CONFIG.bossSummonEvery){
        e.bt=0;
        for(var k=0;k<CONFIG.bossSummonCount;k++) G.enemies.push(makeEnemy('email',Math.max(0,e.s-5)));
      }
    }
  }
  // 移動
  for(i=0;i<G.enemies.length;i++){
    e=G.enemies[i]; if(e.hp<=0) continue;
    var sp=ENEMIES[e.type].sp*(e.slow>0?CONFIG.slowFactor:1);
    e.s+=sp*dt;
    e.slow=Math.max(0,e.slow-dt);
    e.flash=Math.max(0,e.flash-dt);
    e.fcd=Math.max(0,e.fcd-dt);
  }
  // 到達座位
  for(i=G.enemies.length-1;i>=0;i--){
    e=G.enemies[i];
    if(e.hp>0&&e.s>=PATH_LEN){
      var leak=ENEMIES[e.type].leak;
      G.enemies.splice(i,1);
      G.topFlash=0.1; G.headRed=0.3;
      if(e.type==='boss'){
        addFloat(50,350,'-99','#ff5252',0.8,30,16);
        gameOver('boss'); return;
      }
      G.san=Math.max(0,G.san-leak);
      addFloat(50,350,'-'+leak,'#ff5252',0.8,30,16);
      if(G.san<=0){ gameOver('san'); return; }
    }
  }
  // 會議邀請
  var atk=[];
  for(i=0;i<G.items.length;i++) if(TOOLS[G.items[i].t].atk) atk.push(G.items[i]);
  if(atk.length){
    for(i=0;i<G.enemies.length;i++){
      e=G.enemies[i];
      if(e.type!=='meeting'||e.used||e.hp<=0) continue;
      var ep=enemyPos(e),bi=null,bdd=1e9;
      for(var a=0;a<atk.length;a++){
        var ac=itemCenter(atk[a]),dd=dist(ac[0],ac[1],ep[0],ep[1]);
        if(dd<bdd){bdd=dd;bi=atk[a];}
      }
      if(bi&&bdd<=CONFIG.meetingReach){
        e.used=true;
        var bc=itemCenter(bi),shielded=false;
        for(var h=0;h<G.items.length;h++){
          var hi=G.items[h];
          if(hi.t==='headphones'&&hi.locked<=0){
            var hc=itemCenter(hi);
            if(dist(hc[0],hc[1],bc[0],bc[1])<=CONFIG.meetingReach){shielded=true;break;}
          }
        }
        if(shielded) addFloat(ep[0],ep[1]-18,'婉拒','#4fc3f7',0.8,30,14);
        else { bi.locked=CONFIG.meetingLock; addFloat(bc[0],bc[1]-14,'開會中','#ff5252',0.8,30,14); }
      }
    }
  }
  // 工具
  for(i=0;i<G.items.length;i++){
    var it=G.items[i];
    it.flash=Math.max(0,it.flash-dt);
    if(it.locked>0){ it.locked=Math.max(0,it.locked-dt); continue; }
    if(!TOOLS[it.t].atk) continue;
    it.cd-=dt;
    if(it.cd<=0) fireTool(it);
  }
  // 主角冷卻
  G.heroCd=Math.max(0,G.heroCd-dt);
  // 擊倒
  for(i=G.enemies.length-1;i>=0;i--){
    e=G.enemies[i];
    if(e.hp<=0){
      var d=ENEMIES[e.type],p=enemyPos(e);
      G.money+=d.reward; G.killScore+=d.score;
      addFloat(p[0],p[1]-14,'+'+d.reward,'#ffd54f',0.5,30,14);
      addFx({kind:'pop',x:p[0],y:p[1],type:e.type,dur:0.15});
      G.enemies.splice(i,1);
    }
  }
  // 波次完成
  if(G.spawnIdx>=G.spawns.length && G.enemies.length===0){
    waveClear();
  }
}

function waveClear(){
  clockWaveDone(G.wi+1);
  G.money+=CONFIG.waveBonus;
  addFloat(200,200,'+'+CONFIG.waveBonus,'#ffd54f',0.8,30,18);
  G.waveScoreTotal+=CONFIG.waveScore;
  G.san=Math.min(CONFIG.maxSan,G.san+CONFIG.healAfterWave);
  var last=(G.wi===WAVES.length-1);
  if(last){ winGame(); return; }
  var n=G.wi+1;
  G.state='BANNER'; G.bannerView='wave';
  G.banner={text:WV[n]+'完成！',t:0,dur:0.8,next:function(){
    G.wi++; G.buildCount++; G.enemies=[]; G.effects=[];
    enterBuild();
  }};
}
function totalScore(){return G.killScore+G.waveScoreTotal;}
function winGame(){
  G.state='WIN'; G.endTimer=0;
  G.winBonus=CONFIG.winScore; G.sanBonus=G.san*CONFIG.sanScore;
  G.score=G.killScore+G.waveScoreTotal+G.winBonus+G.sanBonus;
  G.newBest=G.score>best; if(G.newBest){best=G.score;saveBest();}
  clockFinish('win');
}
function gameOver(reason){
  G.state='GAMEOVER'; G.endTimer=0; G.endReason=reason;
  G.score=G.killScore+G.waveScoreTotal;
  G.newBest=G.score>best; if(G.newBest){best=G.score;saveBest();}
  clockFinish('lose');
}

/* ============================================================
   主更新
   ============================================================ */
function updateFx(dt){
  var i;
  for(i=G.effects.length-1;i>=0;i--){G.effects[i].t+=dt;if(G.effects[i].t>=G.effects[i].dur)G.effects.splice(i,1);}
  for(i=G.floats.length-1;i>=0;i--){G.floats[i].t+=dt;if(G.floats[i].t>=G.floats[i].dur)G.floats.splice(i,1);}
  G.topFlash=Math.max(0,G.topFlash-dt);
  G.headRed=Math.max(0,G.headRed-dt);
  G.bossWarn=Math.max(0,G.bossWarn-dt);
  if(G.ghostShake>0)G.ghostShake=Math.max(0,G.ghostShake-dt);
  for(i=0;i<G.items.length;i++) if(G.state!=='WAVE') G.items[i].flash=Math.max(0,G.items[i].flash-dt);
}
function update(dt){
  G.time+=dt;
  if(G.state==='WAVE'){ updateWave(dt*(G.fast?2:1)); }
  else if(G.state==='BANNER'){
    G.banner.t+=dt;
    if(G.banner.t>=G.banner.dur){ var n=G.banner.next; G.banner=null; n(); }
  }
  else if(G.state==='WIN'||G.state==='GAMEOVER'){ G.endTimer+=dt; }
  updateFx(dt);
}

/* ============================================================
   繪圖
   ============================================================ */
function drawField(){
  var i,j;
  var shakeOn=false;
  if(G.state==='WAVE'||G.state==='BANNER'){
    for(i=0;i<G.enemies.length;i++) if(G.enemies[i].type==='boss'){shakeOn=true;break;}
  }
  ctx.save();
  if(shakeOn){ var sh=(Math.floor(G.time/0.1)%2===0)?1:-1; ctx.translate(sh,0); }
  // 地板
  ctx.fillStyle='#e9e4d8'; ctx.fillRect(0,0,W,400);
  // 走道
  var p=CONFIG.path;
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle='#b9c4cf'; ctx.lineWidth=28;
  ctx.beginPath(); ctx.moveTo(p[0][0],p[0][1]);
  for(i=1;i<p.length;i++) ctx.lineTo(p[i][0],p[i][1]);
  ctx.stroke();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.setLineDash([8,8]);
  ctx.beginPath(); ctx.moveTo(p[0][0],p[0][1]);
  for(i=1;i<p.length;i++) ctx.lineTo(p[i][0],p[i][1]);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.lineCap='butt';
  // 收件匣
  rrect(28,68,44,24,5); ctx.fillStyle='#78909c'; ctx.fill();
  text('收件匣',50,80,11,'#fff','center');
  // 座位
  rrect(28,365,44,30,5); ctx.fillStyle='#8d6e63'; ctx.fill();
  ctx.beginPath(); ctx.arc(50,362,9,0,Math.PI*2); ctx.fillStyle=G.headRed>0?'#e57373':'#f1c9a0'; ctx.fill();
  text('座位',50,383,11,'#fff','center');
  // 抽屜外框與格子
  rrect(72,102,256,256,10); ctx.fillStyle='#5d4037'; ctx.fill();
  text('抽屜',200,95,11,'#bcaaa4','center');
  for(i=0;i<CONFIG.grid;i++){
    for(j=0;j<CONFIG.grid;j++){
      ctx.fillStyle='#8d6e63';
      ctx.fillRect(CONFIG.ox+i*CONFIG.cell,CONFIG.oy+j*CONFIG.cell,CONFIG.cell,CONFIG.cell);
      ctx.strokeStyle='#6d4c41'; ctx.lineWidth=1;
      ctx.strokeRect(CONFIG.ox+i*CONFIG.cell+0.5,CONFIG.oy+j*CONFIG.cell+0.5,CONFIG.cell-1,CONFIG.cell-1);
    }
  }
  // 工具
  for(i=0;i<G.items.length;i++) drawItem(G.items[i]);
  // 預覽
  drawGhost();
  // 選取外框與射程圈
  if(G.selItem && G.state==='BUILD'){
    drawSelBox(G.selItem.cells,'#ffffff',3);
    if(TOOLS[G.selItem.t].atk){
      var c=itemCenter(G.selItem);
      ctx.beginPath(); ctx.arc(c[0],c[1],G.selItem.range,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.5; ctx.stroke();
    }
  }
  // 敵人
  for(i=0;i<G.enemies.length;i++) drawEnemy(G.enemies[i]);
  // 特效
  for(i=0;i<G.effects.length;i++) drawFx(G.effects[i]);
  // 浮字
  for(i=0;i<G.floats.length;i++){
    var f=G.floats[i],k=f.t/f.dur;
    ctx.globalAlpha=1-k*k;
    text(f.str,f.x,f.y-f.rise*k,f.size,f.color,'center',true,'rgba(0,0,0,0.6)');
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
function drawSelBox(cells,color,w){
  ctx.strokeStyle=color; ctx.lineWidth=w;
  for(var i=0;i<cells.length;i++){
    var c=cells[i][0],r=cells[i][1],x=CONFIG.ox+c*CONFIG.cell,y=CONFIG.oy+r*CONFIG.cell;
    var has=function(cc,rr){for(var j=0;j<cells.length;j++)if(cells[j][0]===cc&&cells[j][1]===rr)return true;return false;};
    ctx.beginPath();
    if(!has(c,r-1)){ctx.moveTo(x,y);ctx.lineTo(x+CONFIG.cell,y);}
    if(!has(c,r+1)){ctx.moveTo(x,y+CONFIG.cell);ctx.lineTo(x+CONFIG.cell,y+CONFIG.cell);}
    if(!has(c-1,r)){ctx.moveTo(x,y);ctx.lineTo(x,y+CONFIG.cell);}
    if(!has(c+1,r)){ctx.moveTo(x+CONFIG.cell,y);ctx.lineTo(x+CONFIG.cell,y+CONFIG.cell);}
    ctx.stroke();
  }
}
function drawToolCells(cells,d,alpha){
  ctx.globalAlpha=alpha;
  for(var i=0;i<cells.length;i++){
    var x=CONFIG.ox+cells[i][0]*CONFIG.cell+2,y=CONFIG.oy+cells[i][1]*CONFIG.cell+2,s=CONFIG.cell-4;
    rrect(x,y,s,s,6); ctx.fillStyle=d.fill; ctx.fill();
    ctx.strokeStyle=d.stroke; ctx.lineWidth=2; ctx.stroke();
  }
  ctx.globalAlpha=1;
}
function drawItem(it){
  var d=TOOLS[it.t],i;
  drawToolCells(it.cells,d,1);
  var c=itemCenter(it);
  text(d.ch,c[0],c[1],16,'#fff','center',true,'#000');
  if(it.lv>=2){
    var tl=it.cells[0],mx=1e9,my=1e9;
    for(i=0;i<it.cells.length;i++){ if(it.cells[i][1]<my||(it.cells[i][1]===my&&it.cells[i][0]<mx)){mx=it.cells[i][0];my=it.cells[i][1];} }
    text(it.lv===2?'★':'★★',CONFIG.ox+mx*CONFIG.cell+3,CONFIG.oy+my*CONFIG.cell+9,12,'#ffd54f','left',true,'#000');
  }
  if(it.flash>0){
    ctx.globalAlpha=Math.min(1,it.flash/0.3)*0.7; ctx.fillStyle='#fff';
    for(i=0;i<it.cells.length;i++) ctx.fillRect(CONFIG.ox+it.cells[i][0]*CONFIG.cell+2,CONFIG.oy+it.cells[i][1]*CONFIG.cell+2,CONFIG.cell-4,CONFIG.cell-4);
    ctx.globalAlpha=1;
  }
  if(it.locked>0){
    ctx.globalAlpha=0.55; ctx.fillStyle='#555';
    for(i=0;i<it.cells.length;i++) ctx.fillRect(CONFIG.ox+it.cells[i][0]*CONFIG.cell+2,CONFIG.oy+it.cells[i][1]*CONFIG.cell+2,CONFIG.cell-4,CONFIG.cell-4);
    ctx.globalAlpha=1;
    ctx.fillStyle='#fff'; ctx.fillRect(c[0]-7,c[1]-9,14,14);
    ctx.fillStyle='#1e88e5'; ctx.fillRect(c[0]-7,c[1]-9,14,4);
    text(it.locked.toFixed(1),c[0],c[1]+12,11,'#fff','center',true,'#000');
  }
}
function drawGhost(){
  if(G.state!=='BUILD'||G.selCard<0||!G.ghost) return;
  var card=G.cards[G.selCard],d=TOOLS[card.t],gc=ghostCells();
  var ok=canPlace(gc,null);
  var off=(G.ghostShake>0)?Math.sin(G.time*80)*3:0;
  ctx.save(); ctx.translate(off,0);
  drawToolCells(gc,ok?d:{fill:'#e53935',stroke:'#8e1c1a'},0.6);
  if(d.atk){
    var tmp=newItem(card.t,gc), b=bonusesFor(tmp,G.items);
    var sx=0,sy=0;
    for(var i=0;i<gc.length;i++){var cc=cellCenter(gc[i][0],gc[i][1]);sx+=cc[0];sy+=cc[1];}
    ctx.beginPath(); ctx.arc(sx/gc.length,sy/gc.length,d.rng*(1+b.rng),0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.5; ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(e){
  var p=enemyPos(e),x=p[0],y=p[1],d=ENEMIES[e.type];
  var white=e.flash>0;
  ctx.save();
  ctx.translate(x,y);
  if(e.type==='email'){
    ctx.fillStyle=white?'#fff':'#fff'; ctx.fillRect(-13,-9,26,18);
    ctx.strokeStyle='#90a4ae'; ctx.lineWidth=1.5; ctx.strokeRect(-13,-9,26,18);
    ctx.strokeStyle='#e53935'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-13,-9);ctx.lineTo(0,2);ctx.lineTo(13,-9);ctx.stroke();
  }else if(e.type==='paper'){
    for(var k=0;k<3;k++){
      ctx.fillStyle='#f5f0e1'; ctx.fillRect(-11+k*3-3,-14+k*3-3,22,28);
      ctx.strokeStyle='#bdb7a2'; ctx.lineWidth=1; ctx.strokeRect(-11+k*3-3,-14+k*3-3,22,28);
    }
    ctx.strokeStyle='#9e9e9e'; ctx.beginPath();
    ctx.moveTo(-6,-5);ctx.lineTo(8,-5);ctx.moveTo(-6,1);ctx.lineTo(8,1);ctx.stroke();
  }else if(e.type==='meeting'){
    rrect(-14,-14,28,28,5); ctx.fillStyle='#1e88e5'; ctx.fill();
    ctx.fillStyle='#0d47a1'; ctx.fillRect(-14,-14,28,8);
    text('M',0,3,14,'#fff','center',true);
  }else if(e.type==='report'){
    rrect(-17,-20,34,40,5); ctx.fillStyle='#6a1b9a'; ctx.fill();
    ctx.fillStyle='#4a148c'; ctx.fillRect(-17,-20,6,40);
    ctx.fillStyle='#fff'; ctx.fillRect(-5,-6,18,10);
  }else if(e.type==='urgent'){
    for(var t=3;t>=1;t--){
      ctx.globalAlpha=0.25/t; ctx.beginPath(); ctx.arc(0,-t*8,13,0,Math.PI*2); ctx.fillStyle='#f4511e'; ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fillStyle='#f4511e'; ctx.fill();
    text('!',0,1,18,'#fff','center',true);
  }else if(e.type==='boss'){
    rrect(-22,-18,44,56,6); ctx.fillStyle='#37474f'; ctx.fill();
    ctx.fillStyle='#d32f2f'; ctx.fillRect(-3,-12,6,30);
    ctx.beginPath(); ctx.arc(0,-31,13,0,Math.PI*2); ctx.fillStyle='#f1c9a0'; ctx.fill();
    rrect(-35,-68,70,20,6); ctx.fillStyle='#fff'; ctx.fill();
    text('小事一件',0,-58,11,'#000','center');
  }
  if(white){
    ctx.globalAlpha=0.7; ctx.fillStyle='#fff';
    var r=(e.type==='report'?20:e.type==='boss'?24:14);
    ctx.fillRect(-r,-r,r*2,r*2); ctx.globalAlpha=1;
  }
  if(e.slow>0) text('~',0,18,12,'#4fc3f7','center',true);
  // 血條
  var bw=d.barW, by=(e.type==='report'?-28:-20);
  if(e.type==='boss') by=43;
  ctx.fillStyle='#333'; ctx.fillRect(-bw/2,by,bw,4);
  ctx.fillStyle='#43a047'; ctx.fillRect(-bw/2,by,bw*clamp(e.hp/e.maxHp,0,1),4);
  ctx.restore();
}
function drawFx(f){
  var k=f.t/f.dur,i;
  if(f.kind==='line'){
    ctx.globalAlpha=1-k; ctx.strokeStyle=f.color; ctx.lineWidth=f.w||2;
    ctx.beginPath(); ctx.moveTo(f.x1,f.y1); ctx.lineTo(f.x2,f.y2); ctx.stroke(); ctx.globalAlpha=1;
  }else if(f.kind==='chain'){
    ctx.globalAlpha=1-k; ctx.strokeStyle=f.color; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(f.pts[0][0],f.pts[0][1]);
    for(i=1;i<f.pts.length;i++) ctx.lineTo(f.pts[i][0],f.pts[i][1]);
    ctx.stroke(); ctx.globalAlpha=1;
  }else if(f.kind==='ring'){
    ctx.globalAlpha=(1-k)*0.8; ctx.strokeStyle=f.color; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(f.x,f.y,f.r*k,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
  }else if(f.kind==='stamp'){
    ctx.globalAlpha=1-k;
    ctx.beginPath(); ctx.arc(f.x,f.y,14,0,Math.PI*2); ctx.fillStyle='#e53935'; ctx.fill();
    text('OK',f.x,f.y,13,'#fff','center',true); ctx.globalAlpha=1;
  }else if(f.kind==='pop'){
    ctx.globalAlpha=1-k; ctx.beginPath(); ctx.arc(f.x,f.y,14*(1-k),0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); ctx.globalAlpha=1;
  }
}

function drawHud(){
  // 理智條
  ctx.fillStyle='#333'; ctx.fillRect(16,10,200,16);
  var col=G.san>10?'#43a047':(G.san>=5?'#fdd835':'#e53935');
  if(G.san<5 && Math.floor(G.time/0.2)%2===0) col='#7f1d1d';
  ctx.fillStyle=col; ctx.fillRect(16,10,200*clamp(G.san/CONFIG.maxSan,0,1),16);
  text('理智 '+G.san+'/'+CONFIG.maxSan,116,18,12,'#fff','center',true,'rgba(0,0,0,0.5)');
  text(CLOCK[G.wi],384,26,20,'#fff','right',true,'#000');
  text('便利貼 '+G.money,16,50,14,'#ffd54f','left',true,'#000');
  text(WV[G.wi+1]+' / 8',384,50,14,'#fff','right',false,'#000');
}

function drawMiniShape(shape,cx,cy,cell,d){
  var s=shapeSize(shape),x0=cx-s[0]*cell/2,y0=cy-s[1]*cell/2;
  for(var i=0;i<shape.length;i++){
    rrect(x0+shape[i][0]*cell+1,y0+shape[i][1]*cell+1,cell-2,cell-2,3);
    ctx.fillStyle=d.fill; ctx.fill(); ctx.strokeStyle=d.stroke; ctx.lineWidth=1.5; ctx.stroke();
  }
}
function drawButton(r,label,fill,txt,size){
  rrect(r[0],r[1],r[2],r[3],10); ctx.fillStyle=fill; ctx.fill();
  text(label,r[0]+r[2]/2,r[1]+r[3]/2,size||14,txt||'#fff','center',true);
}
function drawBenchBuild(){
  ctx.fillStyle='#3e2f28'; ctx.fillRect(0,400,W,160);
  for(var i=0;i<3;i++){
    var r=CARD_RECTS[i],c=G.cards[i]; if(!c) continue;
    var d=TOOLS[c.t],afford=G.money>=d.cost;
    ctx.globalAlpha=afford?1:0.5;
    rrect(r[0],r[1],r[2],r[3],12); ctx.fillStyle='#5a463b'; ctx.fill();
    if(G.selCard===i){ ctx.strokeStyle='#ffd54f'; ctx.lineWidth=3; ctx.stroke(); }
    text(d.name,r[0]+r[2]/2,r[1]+14,14,'#fff','center',true);
    var sh=cardCells(c);
    drawMiniShape(sh,r[0]+r[2]/2,r[1]+46,14,d);
    text('$'+d.cost,r[0]+10,r[1]+r[3]-11,12,'#ffd54f','left',true);
    text(d.tag,r[0]+r[2]-8,r[1]+r[3]-11,11,d.atk?'#81d4fa':'#a5d6a7','right');
    ctx.globalAlpha=1;
  }
  var hint='選卡 → 點抽屜格子放 → 再點一下確認';
  if(G.selItem) hint=TOOLS[G.selItem.t].desc+' Lv'+G.selItem.lv+'　點空格移動／點同款合併';
  text(hint,200,510,11,'#bdbdbd','center');
  var hasSel=(G.selCard>=0||G.selItem);
  drawButton(BTN.rotate,'旋轉',hasSel?'#4a5a78':'#555');
  drawButton(BTN.recycle,'回收',G.selItem?'#8d4a3a':'#555');
  drawButton(BTN.reroll,'換一批 −10',G.money>=CONFIG.rerollCost?'#666':'#4a4a4a',G.money>=CONFIG.rerollCost?'#fff':'#888',13);
  drawButton(BTN.go,'開工！','#ffb300','#000',16);
}
function drawBenchWave(){
  ctx.fillStyle='#3e2f28'; ctx.fillRect(0,400,W,160);
  text(CLOCK[G.wi]+' 來襲',16,424,16,'#fff','left',true);
  var g=WAVES[G.wi],y=448;
  for(var i=0;i<g.length&&i<4;i++){
    var type=g[i][0],n=g[i][1],d=ENEMIES[type];
    var done=false;
    // 該組已全部出場？
    var spawned=0;
    for(var j=0;j<G.spawnIdx;j++) if(G.spawns[j].type===type) spawned++;
    var total=0; for(var q=0;q<g.length;q++) if(g[q][0]===type) total+=g[q][1];
    done=(spawned>=total);
    ctx.globalAlpha=done?0.4:1;
    drawEnemyIcon(type,24,y);
    text(d.name+' ×'+n,40,y,13,'#fff','left');
    text('建議：'+d.hint,384,y,11,'#81d4fa','right');
    ctx.globalAlpha=1;
    y+=20;
  }
  ctx.fillStyle='#333'; ctx.fillRect(16,534,368,8);
  ctx.fillStyle='#ffd54f';
  var pr=G.spawnTotal?G.spawnIdx/G.spawnTotal:0;
  // 老闆召喚的不算：spawnIdx 只計 spawns 內
  ctx.fillRect(16,534,368*clamp(pr,0,1),8);
  var fr=BTN.fast; drawButton(fr,G.fast?'快轉中':'快轉 ▶▶',G.fast?'#ffb300':'#666',G.fast?'#000':'#fff',13);
  if(G.wi===0) text('點一下戰場，丟便利貼幫忙',200,552,11,'#bdbdbd','center');
}
function drawEnemyIcon(type,x,y){
  ctx.save(); ctx.translate(x,y); ctx.scale(0.5,0.5);
  if(type==='email'){ctx.fillStyle='#fff';ctx.fillRect(-13,-9,26,18);ctx.strokeStyle='#e53935';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,-9);ctx.lineTo(0,2);ctx.lineTo(13,-9);ctx.stroke();}
  else if(type==='paper'){ctx.fillStyle='#f5f0e1';ctx.fillRect(-11,-14,22,28);ctx.strokeStyle='#bdb7a2';ctx.strokeRect(-11,-14,22,28);}
  else if(type==='meeting'){ctx.fillStyle='#1e88e5';ctx.fillRect(-14,-14,28,28);ctx.fillStyle='#0d47a1';ctx.fillRect(-14,-14,28,8);}
  else if(type==='report'){ctx.fillStyle='#6a1b9a';ctx.fillRect(-17,-20,34,40);ctx.fillStyle='#fff';ctx.fillRect(-5,-6,18,10);}
  else if(type==='urgent'){ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fillStyle='#f4511e';ctx.fill();}
  else if(type==='boss'){ctx.fillStyle='#37474f';ctx.fillRect(-22,-18,44,56);ctx.beginPath();ctx.arc(0,-31,13,0,Math.PI*2);ctx.fillStyle='#f1c9a0';ctx.fill();}
  ctx.restore();
}

function drawOverlayText(title,lines,titleColor){
  ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
}

function draw(){
  var st=G.state;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#1b1b24'; ctx.fillRect(0,0,W,H);
  if(st==='TITLE'){
    drawField(); drawHud();
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
    text('下班保衛戰',200,200,32,'#fff','center',true,'#000');
    text('守住座位，撐到 17:00',200,236,16,'#fff','center');
    text('按「免費開始上班」',200,300,18,'#ffd54f','center',true);
    text('最高分 '+best,200,340,14,'#bdbdbd','center');
    return;
  }
  drawField(); drawHud();
  if(st==='BUILD'||(st==='BANNER'&&G.bannerView==='build')) drawBenchBuild();
  else drawBenchWave();
  if(G.topFlash>0){ ctx.globalAlpha=G.topFlash/0.1*0.5; ctx.fillStyle='#e53935'; ctx.fillRect(0,0,W,40); ctx.globalAlpha=1; }
  if(G.bossWarn>0){ ctx.globalAlpha=Math.min(1,G.bossWarn/0.3); text('老闆來了！',200,110,28,'#e53935','center',true,'#fff'); ctx.globalAlpha=1; }
  if(st==='BANNER'&&G.banner){
    text(G.banner.text,200,200,28,'#fff','center',true,'#000');
  }
  if(st==='WIN'||st==='GAMEOVER'){
    var k=Math.min(1,G.endTimer/0.3);
    ctx.fillStyle='rgba(0,0,0,'+(0.7*k)+')'; ctx.fillRect(0,0,W,H);
    if(st==='WIN'){
      text('17:00 打卡下班！',200,130,30,'#ffd54f','center',true);
      text('今天的工作都處理完了。',200,168,16,'#fff','center');
      var rows=[['擊倒分數',G.killScore],['波次分數',G.waveScoreTotal],['通關獎勵',G.winBonus],['理智獎勵',G.sanBonus]];
      for(var i=0;i<rows.length;i++){
        text(rows[i][0],90,222+i*26,15,'#fff','left');
        text(String(rows[i][1]),310,222+i*26,15,'#fff','right');
      }
      ctx.fillStyle='#fff'; ctx.fillRect(90,330,220,1);
      text('總分',90,350,18,'#ffd54f','left',true);
      text(String(G.score),310,350,18,'#ffd54f','right',true);
      if(G.newBest) text('NEW BEST!',200,390,20,'#ff9800','center',true);
      text('最高分 '+best,200,424,14,'#bdbdbd','center');
    }else{
      text('加班到天亮',200,150,32,'#e53935','center',true);
      text(G.endReason==='boss'?'老闆走到你桌前：「有個小事……」':'理智歸零……今晚又要加班。',200,190,15,'#fff','center');
      text('本局分數 '+G.score,200,250,20,'#fff','center',true);
      text('撐到'+WV[G.wi+1],200,284,16,'#fff','center');
      if(G.newBest) text('NEW BEST!',200,326,20,'#ff9800','center',true);
      text('最高分 '+best,200,360,14,'#bdbdbd','center');
    }
    if(G.endTimer>=0.6) text('點一下回到標題，再按「免費開始上班」',200,500,14,'#ffd54f','center');
  }
}

/* ============================================================
   縮放與主迴圈
   ============================================================ */

$('co-go').addEventListener('click',begin);
$('co-canvas').addEventListener('contextmenu',function(e){e.preventDefault();});
var lastT=null;
function resetClock(){lastT=null;}
addEventListener('blur',resetClock);
document.addEventListener('visibilitychange',resetClock);
window.addEventListener('hashchange',resetClock);
function frame(ts){
  if(lastT===null)lastT=ts;
  var dt=Math.min(0.05,Math.max(0,(ts-lastT)/1000)||0);lastT=ts;
  if(coShown()){update(dt);ui();draw();}else lastT=null;
  requestAnimationFrame(frame);
}
resetGame();ui();draw();requestAnimationFrame(frame);
  })();
