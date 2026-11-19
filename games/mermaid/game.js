  /* ---------- Mermaid Spider: Spider Solitaire with mermaid cards; every finished K→A run is a pearl worth a fixed +1 point ---------- */
  var mmBusy=false,mmStake=0,mmSay=function(){};
  (function(){
const BEST_KEY='deep-sea-mermaid-best';
const RUN_POINTS=1,CLEAR_BONUS=2,TOTAL_RUNS=8;
const MODES={1:{suits:[3]},2:{suits:[3,2]},4:{suits:[0,1,2,3]}};
const RANK=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BACK_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><defs><pattern id="s" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 10a7 7 0 0 1 14 0M-7 5a7 7 0 0 1 14 0M7 5a7 7 0 0 1 14 0" fill="none" stroke="#34568a" stroke-width="1.2"/></pattern></defs><rect width="100" height="140" rx="6" fill="#f3e9d0"/><rect x="5" y="5" width="90" height="130" rx="3" fill="#1f3556"/><rect x="5" y="5" width="90" height="130" rx="3" fill="url(#s)"/><rect x="9" y="9" width="82" height="122" rx="2" fill="none" stroke="#f3e9d0" stroke-width="1"/><ellipse cx="50" cy="70" rx="27" ry="40" fill="#f3e9d0"/><ellipse cx="50" cy="70" rx="23" ry="36" fill="none" stroke="#1f3556" stroke-width="1.4"/><path d="M50 38c-9 8-12 19-8 33 2 7 5 11 8 14 3-3 6-7 8-14 4-14 1-25-8-33z" fill="#c4473a"/><path d="M50 85c-8 2-14 8-16 16 7-1 12-4 16-8 4 4 9 7 16 8-2-8-8-14-16-16z" fill="#1f3556"/><path d="M44 52q6 3 12 0M43.5 60q6.500 3 13 0M44 68q6 3 12 0M45 76q5 2.600 10 0" stroke="#f3e9d0" stroke-width="1.100" fill="none" stroke-linecap="round"/><path d="M50 18l3 4-3 4-3-4zM50 114l3 4-3 4-3-4zM16 70l3 4-3 4-3-4zM84 70l3 4-3 4-3-4z" fill="#d9a21a"/></svg>';
// ===== 牌局邏輯（不碰畫面）=====
const {shuffle,createGame,snap,pushHistory,undo,flipTop,runStart,canDrop,completeRun,sweep,move,canDeal,deal,allMoves,chainLen,scoreMove,findHint}=mermaidRules;
// ===== 畫面與點數 =====
let rankLast=0;
const rank=timedLeaderboard('mermaid','mm',mermaidRules.inputCount,ui);
let G=null,st='idle',mode=1,analytics=null,earned=0,maxDone=0,bonusPaid=false,sel=null,hint=null,hintTimer=0,drag=null,lockUntil=0,quitArm=false,quitTimer=0,lastResult=null;
const store={best:{},mode:1};
try{const s=JSON.parse(localStorage.getItem(BEST_KEY)||'null');if(s&&typeof s==='object'){if(s.best&&typeof s.best==='object')store.best=s.best;if(MODES[s.mode])store.mode=Number(s.mode)}}catch(e){}
mode=store.mode;
function saveStore(){try{localStorage.setItem(BEST_KEY,JSON.stringify(store))}catch(e){}}
const bestFor=m=>Number(store.best[m])||0;
const board=$('mm-board'),stage=$('mm-stage'),cover=$('mm-cover'),stockBtn=$('mm-stock'),slotsEl=$('mm-slots');
const slots=slotsEl.querySelectorAll('.mm-slot');
const els=new Map();let placedNow=new Set();
const backUrl='url("data:image/svg+xml,'+encodeURIComponent(BACK_SVG)+'")';
stage.style.setProperty('--mm-back',backUrl);
let M={ok:false,cw:34,ch:48,gap:3,offX:0,dDown:10,dUp:17,maxH:400};
function say(text,kind){$('mm-msg').textContent=text;$('mm-msg').className='msg'+(kind?' '+kind:'');$('mm-bubble').textContent=text}
mmSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function metrics(){
 const W=board.clientWidth;if(!(W>=50)){M.ok=false;return false}
 const gap=Math.max(2,Math.round(W*.009)),cw=Math.min(66,(W-gap*9)/10),ch=Math.round(cw*1.42);
 M={ok:true,W:W,cw:cw,ch:ch,gap:gap,offX:(W-(cw*10+gap*9))/2,dDown:ch*.2,dUp:ch*.36,maxH:ch*8.4};
 stage.style.setProperty('--cw',cw+'px');stage.style.setProperty('--ch',ch+'px');return true}
const colX=c=>M.offX+c*(M.cw+M.gap);
function colY(col){
 const n=col.cards.length,h=col.hidden,ys=[];let dd=M.dDown,du=M.dUp;
 const need=()=>h*dd+Math.max(0,n-h-1)*du+M.ch;
 if(need()>M.maxH){
  const room=M.maxH-M.ch-h*dd,k=Math.max(.4,Math.min(1,room/(Math.max(1,n-h-1)*du)));du*=k;
  if(need()>M.maxH)dd=Math.max(M.ch*.08,(M.maxH-M.ch-Math.max(0,n-h-1)*du)/Math.max(1,h))}
 let y=0;for(let i=0;i<n;i++){ys.push(y);y+=i<h?dd:du}
 return{ys:ys,height:n?ys[n-1]+M.ch:0}}
function relPos(el){const b=board.getBoundingClientRect(),r=el.getBoundingClientRect();return{x:r.left-b.left+(r.width-M.cw)/2,y:r.top-b.top}}
function cardEl(card){
 let el=els.get(card.id);
 if(!el){
  const face=card.rank>10;
  el=document.createElement('div');el.className='mm-card s'+card.suit;el.dataset.id=String(card.id);
  el.innerHTML='<span class="r">'+RANK[card.rank]+'</span><svg class="su" viewBox="0 0 24 24"><use href="#mm-su'+card.suit+'"/></svg><svg class="big'+(face?' face':'')+'" viewBox="'+(face?'0 0 40 52':'0 0 24 24')+'"><use href="#'+(face?'mm-art-'+'jqk'.charAt(card.rank-11):'mm-su'+card.suit)+'"/></svg>';
  board.appendChild(el);els.set(card.id,el);el._new=true}
 return el}
function render(){
 if(!G||!metrics())return;
 const placed=new Set(),origin=relPos(stockBtn),selIds=new Set(),hintIds=new Set();let maxH=M.ch*6.2,k=0;
 if(sel){const cs=G.cols[sel.from].cards;for(let i=sel.idx;i<cs.length;i++)selIds.add(cs[i].id)}
 if(hint&&G.cols[hint.from]){const cs=G.cols[hint.from].cards;for(let i=hint.idx;i<cs.length;i++)hintIds.add(cs[i].id)}
 const okCols=new Set();
 if(sel)for(let t=0;t<10;t++)if(canDrop(G,sel.from,sel.idx,t))okCols.add(t);
 if(hint)okCols.add(hint.to);
 for(let c=0;c<10;c++){
  const col=G.cols[c],pos=colY(col);maxH=Math.max(maxH,pos.height);
  col.cards.forEach((card,i)=>{
   const el=cardEl(card);placed.add(card.id);
   if(el._new){el.style.transition='none';el.style.left=origin.x+'px';el.style.top=origin.y+'px';el.style.opacity='1';void el.offsetWidth;el.style.transition='';el.style.transitionDelay=(k++*14)+'ms';el._new=false}
   else if(!el.classList.contains('dragging'))el.style.transitionDelay='';
   el.hidden=false;el.style.opacity='';
   el.style.left=colX(c)+'px';el.style.top=pos.ys[i]+'px';el.style.zIndex=String(i+1);el.style.transform='';
   const top=i===col.cards.length-1;
   el.className='mm-card s'+card.suit+(i>=col.hidden?' up':' down')+(selIds.has(card.id)?' sel':'')+(hintIds.has(card.id)?' hint':'')+(hint&&hint.to===c&&top?' dst':'')+(sel&&okCols.has(c)&&top?' dst':'')});
  const strip=board.querySelector('.mm-col[data-c="'+c+'"]');
  if(strip){strip.style.left=colX(c)+'px';strip.className='mm-col'+(col.cards.length?'':' empty')+(okCols.has(c)?' ok':'')}}
 els.forEach((el,id)=>{if(!placed.has(id)&&!el.classList.contains('fly')){el.style.transitionDelay='';el.style.left=origin.x+'px';el.style.top=origin.y+'px';el.style.opacity='0'}});
 placedNow=placed;
 clearTimeout(render.t);render.t=setTimeout(()=>{els.forEach((el,id)=>{if(!placedNow.has(id)&&!el.classList.contains('fly'))el.hidden=true})},360);
 board.style.height=Math.min(maxH,M.maxH)+'px';
 if(k)lockUntil=performance.now()+k*14+220;
 stockBtn.classList.toggle('hint',!!(hint&&hint.deal));
 updateSlots()}
function updateSlots(){
 slots.forEach((s,i)=>{const full=G&&i<G.done;s.classList.toggle('full',!!full);const u=s.querySelector('use');if(u)u.setAttribute('href',full?'#mm-su'+G.doneSuits[i]:'');s.className='mm-slot'+(full?' full s'+G.doneSuits[i]:'')})}
function buildBoard(){
 board.textContent='';els.forEach(el=>el.remove());els.clear();
 for(let c=0;c<10;c++){const d=document.createElement('div');d.className='mm-col empty';d.dataset.c=String(c);board.appendChild(d)}}
function runFx(f){
 const slot=slots[f.n-1],b=board.getBoundingClientRect(),sr=slot?slot.getBoundingClientRect():null;
 f.cards.forEach((card,i)=>{
  const el=cardEl(card);
  if(el._new){el.style.transition='none';el.style.left=colX(f.col)+'px';el.style.top=(M.ch*.5)+'px';el.style.opacity='1';el.hidden=false;void el.offsetWidth;el.style.transition='';el._new=false}
  el.hidden=false;el.classList.remove('sel','hint','dst');el.classList.add('fly');el.style.transitionDelay=(i*28)+'ms';
  if(sr){el.style.left=(sr.left-b.left+sr.width/2-M.cw/2)+'px';el.style.top=(sr.top-b.top+sr.height/2-M.ch/2)+'px'}
  el.style.transform='scale(.18)';el.style.opacity='0';el.style.zIndex='500';
  setTimeout(()=>{el.classList.remove('fly');el.style.transitionDelay='';if(!placedNow.has(card.id))el.hidden=true},900)});}
function ui(){
 const live=st==='run';
 setText('mm-pearls',(G?G.done:0)+' / '+TOTAL_RUNS);setText('mm-score',G?String(G.score):'—');setText('mm-best',bestFor(mode)+' 分');
 const go=$('mm-go');go.disabled=live||rank.busy();setText('mm-go',live?'牌局進行中':st==='over'?'再玩一次':'發牌');
 const q=$('mm-quit');q.hidden=!live;setText('mm-quit',quitArm?'再按一次確認放棄':'放棄本局');
 $('mm-undo').disabled=!live||!G||!G.history.length;$('mm-hint').disabled=!live;
 stockBtn.disabled=!live||!G||!G.stock.length;setText('mm-stock-count',String(G?Math.ceil(G.stock.length/10):5));
 stockBtn.style.visibility=G&&!G.stock.length?'hidden':'';
 setText('mm-info',live&&G?G.score+' · '+G.moves:'');
 document.querySelectorAll('.mm-mode').forEach(b=>{b.setAttribute('aria-pressed',String(Number(b.dataset.diff)===mode));b.disabled=live});
 cover.hidden=live;
 if(st==='over'&&lastResult){setText('mm-cover-title',lastResult.win?'全部珍珠收集完成！':'本局結束');
  setText('mm-cover-text',lastResult.win?'人魚為你唱歌。本局共入帳 '+earned+' 點。':'收集了 '+lastResult.done+' 顆珍珠，本局共入帳 '+earned+' 點。')}
 else{setText('mm-cover-title','人魚接龍');setText('mm-cover-text','把牌排成 K 到 A 的同花色序列，收集 8 顆珍珠。');
 }}
function pay(n){
 earned+=n;S.balance+=n;save();renderAll();
 AN.progress(analytics,{stage:G.done,step:earned,score:G.score,bonus_points:n})}
function clearHint(){hint=null;clearTimeout(hintTimer)}
function afterAction(newIds){
 const fx=G.fx.splice(0);sel=null;clearHint();
 render();
 for(const f of fx)runFx(f);
 if(G.done>maxDone){
  const n=G.done-maxDone;maxDone=G.done;pay(n*RUN_POINTS);
  say('完成第 '+G.done+' 組！珍珠入袋，+'+(n*RUN_POINTS)+' 點已入帳。','win')}
 if(G.done>=TOTAL_RUNS){
  if(G.mode!==1&&!bonusPaid){bonusPaid=true;pay(CLEAR_BONUS)}
  end(true);return}
 if(!allMoves(G).length&&!canDeal(G)&&!G.stock.length)say('沒有可以走的步了。悔棋換個走法，或放棄本局。','lose');
 ui()}
function end(win){
 if(st!=='run')return;
 if(!win)rank.record(2);
 rank.finish(G.score,true);
 st='over';mmBusy=false;sel=null;clearHint();quitArm=false;clearTimeout(quitTimer);drag=null;
 const rec=G.done>0&&G.score>bestFor(mode);if(rec){store.best[mode]=G.score;saveStore()}
 lastResult={win:win,done:G.done};
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:G.score,step:G.done,stage:G.done});
 save();renderAll();render();
 if(win)say('通關！8 顆珍珠全部收集完成，本局共入帳 '+earned+' 點。','win');
 else say('本局結束，共入帳 '+earned+' 點。','lose');
 ui()}
function start(){
 if(st==='run'||rank.busy())return;
 if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('mermaid',ENTRY_FEE);mmStake=ENTRY_FEE;mmBusy=true;save();renderAll();
 buildBoard();G=mermaidRules.create(random||Math.random);if(mode!==1){const code=mode===2?3:4;mermaidRules.input(G,code);rank.record(code);}rankLast=performance.now();earned=0;maxDone=0;bonusPaid=false;sel=null;clearHint();drag=null;lastResult=null;quitArm=false;
 st='run';ui();render();
 say('發牌囉！把牌從大排到小，同花色排滿 K 到 A 就收成珍珠。');
 },ui);}
function locked(){return performance.now()<lockUntil}
// 操作
function doMove(from,idx,to){
 if(!move(G,from,idx,to))return false;
 rank.record(5+from*1040+idx*10+to);
 afterAction();return true}
function tapColumn(c,idx){
 if(sel){
  if(c===sel.from&&idx===sel.idx){sel=null;render();return}
  if(canDrop(G,sel.from,sel.idx,c)){doMove(sel.from,sel.idx,c);return}}
 if(idx!==null&&runStart(G.cols[c],idx)){sel={from:c,idx:idx};clearHint();render();return}
 if(sel){sel=null;say('這裡放不下：要放在比它大 1 的牌上面。','lose');render();return}
 if(idx!==null)say('這張牌現在不能搬：要同花色、由大到小連續的牌才能一起搬。');
 render()}
function colAtX(clientX){
 const b=board.getBoundingClientRect();return Math.floor((clientX-b.left-M.offX+M.gap/2)/(M.cw+M.gap))}
board.addEventListener('pointerdown',e=>{
 if(st!=='run'||locked()||(e.button!==undefined&&e.button>0))return;
 e.preventDefault();
 const cardNode=e.target.closest?e.target.closest('.mm-card'):null;
 let c=-1,idx=null;
 if(cardNode){const id=Number(cardNode.dataset.id);for(let k=0;k<10&&c<0;k++){const i=G.cols[k].cards.findIndex(x=>x.id===id);if(i>=0){c=k;idx=i}}}
 else c=colAtX(e.clientX);
 if(c<0||c>9)return;
 drag={c:c,idx:idx,x0:e.clientX,y0:e.clientY,started:false,id:e.pointerId,els:[]}});
board.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
 if(!drag.started){
  if(Math.hypot(dx,dy)<8)return;
  if(drag.idx===null||!runStart(G.cols[drag.c],drag.idx)){drag=null;return}
  drag.started=true;try{board.setPointerCapture(e.pointerId)}catch(_){}
  const cs=G.cols[drag.c].cards;for(let i=drag.idx;i<cs.length;i++){const el=els.get(cs[i].id);el.classList.add('dragging');drag.els.push(el)}}
 drag.els.forEach(el=>{el.style.transform='translate('+dx+'px,'+dy+'px)'})});
function finishDrag(e,cancel){
 if(!drag||e.pointerId!==drag.id)return;
 const d=drag;drag=null;
 if(!d.started){if(!cancel)tapColumn(d.c,d.idx);return}
 d.els.forEach(el=>el.classList.remove('dragging'));
 if(cancel){render();return}
 const first=d.els[0],fr=first.getBoundingClientRect(),cx=fr.left+fr.width/2;
 let target=colAtX(cx);
 if(!(target>=0&&target<=9&&canDrop(G,d.c,d.idx,target))){const t2=colAtX(e.clientX);target=t2>=0&&t2<=9&&canDrop(G,d.c,d.idx,t2)?t2:-1}
 if(target>=0){doMove(d.c,d.idx,target)}
 else{say('這裡放不下：要放在比它大 1 的牌上面。','lose');render()}}
board.addEventListener('pointerup',e=>finishDrag(e,false));
board.addEventListener('pointercancel',e=>finishDrag(e,true));
board.addEventListener('contextmenu',e=>e.preventDefault());
stockBtn.addEventListener('click',()=>{
 if(st!=='run'||locked())return;
 if(!G.stock.length){say('牌堆已經發完了。','lose');return}
 if(!canDeal(G)){say('每一列都要有牌才能發牌，先把牌放進空列。','lose');return}
 const ids=deal(G);rank.record(0);afterAction(ids);
 if(st==='run')say('浪花湧來，每一列多了一張牌。')});
$('mm-undo').addEventListener('click',()=>{
 if(st!=='run'||locked()||!G.history.length)return;
 undo(G);rank.record(1);sel=null;clearHint();render();ui();say('時間倒流了一步。')});
$('mm-hint').addEventListener('click',()=>{
 if(st!=='run'||locked())return;
 const h=findHint(G);clearHint();sel=null;
 if(!h||h.s<5){
  if(canDeal(G)){hint={deal:true,from:-1,idx:0,to:-1};say('人魚低語：沒有好走的牌了，發牌試試。')}
  else if(h){hint=h;say('人魚低語：只剩小調整了，先整理牌列。')}
  else say('人魚低語：沒有可走的步了，悔棋換個走法吧。','lose')}
 else{hint=h;const mv=G.cols[h.from].cards[h.idx],d=G.cols[h.to].cards;
  say('試試把 '+RANK[mv.rank]+' 移到'+(d.length?' '+RANK[d[d.length-1].rank]:'空列'))}
 render();hintTimer=setTimeout(()=>{hint=null;render()},3200)});
$('mm-go').addEventListener('click',start);
$('mm-quit').addEventListener('click',()=>{
 if(st!=='run')return;
 if(!quitArm){quitArm=true;ui();clearTimeout(quitTimer);quitTimer=setTimeout(()=>{quitArm=false;ui()},3000);return}
 end(false)});
document.querySelectorAll('.mm-mode').forEach(b=>b.addEventListener('click',()=>{
 if(st==='run')return;mode=Number(b.dataset.diff);store.mode=mode;saveStore();ui()}));
if(window.ResizeObserver)new ResizeObserver(()=>{if(G)render()}).observe(board);
window.addEventListener('resize',()=>{if(G)render()});
window.addEventListener('hashchange',()=>{drag=null;if(G)requestAnimationFrame(render)});
function rankedClock(now){
 if(st==='run'&&!document.hidden&&!$('view-mermaid').hidden)rank.update(Math.max(0,now-rankLast),()=>st==='run',()=>{});
 rankLast=now;requestAnimationFrame(rankedClock);
}
requestAnimationFrame(rankedClock);
ui();layoutIdle();
function layoutIdle(){metrics()}
  })();
