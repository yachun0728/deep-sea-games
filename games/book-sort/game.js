  /* ---------- Cat Book Stack: free sorting puzzle. No wallet access; every level is checked for a solution. ---------- */
  (function(){
const CAP=5,BEST_KEY='deep-sea-book-sort-best',GAME_ID='book-sort';
const BOOKS={
 crimson:{name:'酒紅文學',bg:'linear-gradient(180deg,#c94646,#9e2b2b)',icon:'★',code:'LIT-01'},
 navy:{name:'海軍天文',bg:'linear-gradient(180deg,#356394,#204269)',icon:'☽',code:'AST-02'},
 forest:{name:'森林植物',bg:'linear-gradient(180deg,#438555,#2c613b)',icon:'♣',code:'BOT-03'},
 mustard:{name:'芥末藝術',bg:'linear-gradient(180deg,#e0a334,#bd811c)',icon:'☀',code:'ART-04'},
 lavender:{name:'薰衣草魔法',bg:'linear-gradient(180deg,#8663a6,#61427d)',icon:'♦',code:'MAG-05'},
 caramel:{name:'焦糖烘焙',bg:'linear-gradient(180deg,#db7539,#b3551e)',icon:'♥',code:'COK-06'},
 teal:{name:'湖水博物',bg:'linear-gradient(180deg,#2e9499,#1d6d73)',icon:'♛',code:'HIS-07'},
 sakura:{name:'櫻花詩集',bg:'linear-gradient(180deg,#de6f8c,#b84b68)',icon:'✿',code:'POE-08'}};
const COLORS=Object.keys(BOOKS);
const CATS=['🐱','😺','😸','🐈','😻'];
const QUOTES=['「喵嗚～整整齊齊的書箱，這下店長可以安心睡午覺了！」','「不愧是金牌整理師！每本書的書脊都排得像藝術品一樣美～」','「封箱膠帶貼得筆直又漂亮，店長決定頒發肉球印章給你！」','「書架大掃除順利完成，空出來的紙箱正好讓我進去打個盹～」'];
const LEVELS=[
 [['crimson','forest','navy','crimson','forest'],['navy','crimson','forest','navy','crimson'],['forest','navy','crimson','forest','navy'],[],[]],
 [['mustard','crimson','navy','forest','mustard'],['forest','mustard','crimson','navy','crimson'],['navy','forest','mustard','crimson','forest'],['crimson','navy','forest','mustard','navy'],[],[]],
 [['lavender','crimson','mustard','navy','forest'],['forest','lavender','crimson','mustard','navy'],['navy','forest','lavender','crimson','mustard'],['mustard','navy','forest','lavender','crimson'],['crimson','mustard','navy','forest','lavender'],[],[]],
 [['caramel','lavender','navy','crimson','mustard'],['mustard','forest','caramel','lavender','navy'],['crimson','navy','mustard','forest','caramel'],['lavender','caramel','forest','navy','crimson'],['forest','crimson','lavender','caramel','mustard'],['navy','mustard','crimson','forest','lavender'],[],[]],
 [['sakura','teal','caramel','lavender','crimson'],['mustard','forest','navy','sakura','teal'],['caramel','lavender','crimson','mustard','forest'],['navy','sakura','teal','caramel','lavender'],['crimson','mustard','forest','navy','sakura'],['teal','caramel','lavender','crimson','mustard'],['forest','navy','sakura','teal','caramel'],['lavender','crimson','mustard','forest','navy'],[],[]]];
// ===== 規則與解題（不碰畫面）=====
const isFull=b=>b.length===CAP&&b.every(c=>c===b[0]);
const topCount=b=>{if(!b.length)return 0;let n=0;for(let i=b.length-1;i>=0&&b[i]===b[b.length-1];i--)n++;return n};
const canMove=(boxes,from,to)=>{
 if(from===to)return false;const s=boxes[from],d=boxes[to];
 if(!s.length||isFull(s)||d.length>=CAP)return false;
 return !d.length||d[d.length-1]===s[s.length-1]};
const moveCountOf=(boxes,from,to)=>Math.min(topCount(boxes[from]),CAP-boxes[to].length);
function applyMove(boxes,from,to){
 const n=moveCountOf(boxes,from,to),out=boxes.map(b=>b.slice());
 for(let i=0;i<n;i++)out[to].push(out[from].pop());return out}
const solved=boxes=>boxes.every(b=>!b.length||isFull(b));
function legalMoves(boxes){
 const out=[];
 for(let f=0;f<boxes.length;f++){
  const s=boxes[f];if(!s.length||isFull(s))continue;
  const cnt=topCount(s);let usedEmpty=false;
  for(let t=0;t<boxes.length;t++){
   if(!canMove(boxes,f,t))continue;
   const d=boxes[t];
   if(!d.length){if(usedEmpty||cnt===s.length)continue;usedEmpty=true}
   const n=moveCountOf(boxes,f,t);
   let score=n*10;
   if(d.length&&d.length+n===CAP)score+=100;
   if(d.length)score+=25;
   if(n===cnt&&s.length>cnt)score+=15;
   out.push({from:f,to:t,score:score})}}
 return out.sort((a,b)=>b.score-a.score)}
const keyOf=boxes=>boxes.map(b=>b.join(',')).sort().join('|');
function solve(boxes,limit){
 const seen=new Set();let nodes=0;const path=[];
 function dfs(state){
  if(solved(state))return true;
  const k=keyOf(state);if(seen.has(k))return false;seen.add(k);
  if(++nodes>limit)return false;
  for(const m of legalMoves(state)){
   path.push({from:m.from,to:m.to});
   if(dfs(applyMove(state,m.from,m.to)))return true;
   path.pop();if(nodes>limit)return false}
  return false}
 return dfs(boxes)?path.slice():null}
function scramble(numColors,rnd){
 const keys=COLORS.slice(0,numColors),st=keys.map(c=>new Array(CAP).fill(c));st.push([],[]);
 for(let step=0;step<200;step++){
  const from=st.map((b,i)=>i).filter(i=>st[i].length),to=st.map((b,i)=>i).filter(i=>st[i].length<CAP);
  if(!from.length||!to.length)break;
  const f=from[Math.floor(rnd()*from.length)],opts=to.filter(i=>i!==f);
  if(!opts.length)continue;
  st[opts[Math.floor(rnd()*opts.length)]].push(st[f].pop())}
 return st}
function randomLevel(numColors,rnd){
 rnd=rnd||Math.random;
 for(let tries=0;tries<40;tries++){
  const st=scramble(numColors,rnd);
  if(st.some(isFull)||st.filter(b=>!b.length).length<1)continue;
  if(solve(st,30000))return st}
 return LEVELS[Math.min(4,numColors-3)].map(b=>b.slice())}
function rate(moves,colors){const par=colors*3;return moves<=par+4?3:moves<=par+12?2:1}
/*bs-test-hook*/
// ===== 畫面與流程 =====
const g=id=>document.getElementById(id);
const I=()=>window.deepSeaI18n;
const T=s=>I()?String(I().text(s)):s;
const tr=function(s){const v=Array.prototype.slice.call(arguments,1);return T(s).replace(/\{(\d+)\}/g,(_,i)=>v[i])};
const stage=g('bs-stage'),boxesEl=g('bs-boxes');
let quoteIdx=0,level=1,random=false,initial=[],boxes=[],sel=null,hint=null,moves=0,history=[],extraUsed=false,busy=false,round=null,winTimer=0,lastSay=null,landed=null;
let store={};try{store=JSON.parse(localStorage.getItem(BEST_KEY)||'{}')||{}}catch(_){store={}}
const saveStore=()=>{try{localStorage.setItem(BEST_KEY,JSON.stringify(store))}catch(_){}};
// 音效（Web Audio 合成，沒有外部檔案）
const sfx={ctx:null,on:true,
 init(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;try{this.ctx=new A()}catch(_){return false}}if(this.ctx.state==='suspended')this.ctx.resume();return true},
 tone(f0,f1,dur,type,vol,delay){if(!this.on||!this.init())return;const t=this.ctx.currentTime+(delay||0),o=this.ctx.createOscillator(),v=this.ctx.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  v.gain.setValueAtTime(vol||.15,t);v.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(v);v.connect(this.ctx.destination);o.start(t);o.stop(t+dur+.02)},
 pick(){this.tone(340,540,.09,'sine',.14)},
 place(n){for(let i=0;i<(n||1);i++)this.tone(220+i*32,88,.09,'triangle',.22,i*.042)},
 bad(){this.tone(155,120,.14,'sine',.14)},
 seal(){[523.25,659.25,783.99].forEach((f,i)=>this.tone(f,0,.32,'sine',.12,.2+i*.04));this.tone(680,920,.28,'triangle',.09,.45)},
 win(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,0,.42,'triangle',.17,i*.11))}};
function say(tpl){lastSay={tpl:tpl,args:Array.prototype.slice.call(arguments,1)};paintSay()}
function paintSay(){if(!lastSay)return;const t=tr.apply(null,[lastSay.tpl].concat(lastSay.args));g('bs-tip').textContent=t;g('bs-msg').textContent=t}
function bestFor(l){return store[l]||0}
function trackEnd(result){
 if(!round)return;
 try{AN.end(round,0,result,{step:moves,stage:level})}catch(_){}
 round=null}
function load(value){
 trackEnd('abandoned');clearTimeout(winTimer);
 sel=null;hint=null;moves=0;history=[];extraUsed=false;busy=false;landed=null;
 if(value==='random'){random=true;initial=randomLevel(6)}
 else{random=false;level=Number(value)||1;initial=LEVELS[(level-1)%LEVELS.length].map(b=>b.slice())}
 boxes=initial.map(b=>b.slice());
 g('bs-level').value=random?'random':String(level);
 g('bs-modal').hidden=true;
 ui();render()}
function ui(){
 g('bs-moves').textContent=String(moves);
 g('bs-level-text').textContent=random?T('隨機關卡'):tr('第 {0} 關',level);
 g('bs-best').textContent=random||!bestFor(level)?'—':tr('{0} 步',bestFor(level));
 g('bs-undo').disabled=!history.length||busy;
 g('bs-add').disabled=extraUsed;
 g('bs-sound').textContent=T(sfx.on?'音效：開':'音效：關');g('bs-sound').setAttribute('aria-pressed',String(sfx.on))}
function describe(i){
 const b=boxes[i];
 if(!b.length)return tr('紙箱 {0}：空箱',i+1);
 if(isFull(b))return tr('紙箱 {0}：已封箱，{1}',i+1,T(BOOKS[b[0]].name));
 return tr('紙箱 {0}：{1} 本書，頂部是{2}',i+1,b.length,T(BOOKS[b[b.length-1]].name))}
function render(){
 boxesEl.innerHTML='';
 boxesEl.style.maxWidth=boxes.length>=9?'780px':'';
 const lift=sel===null?0:topCount(boxes[sel]);
 boxes.forEach((b,i)=>{
  const sealed=isFull(b);
  const slot=document.createElement('div');
  slot.className='bs-slot'+(sealed?' sealed':'')+(hint&&hint.from===i?' hint-from':'')+(hint&&hint.to===i?' hint-to':'');
  slot.dataset.index=i;slot.tabIndex=0;slot.setAttribute('role','button');slot.setAttribute('aria-label',describe(i));
  slot.setAttribute('aria-pressed',String(sel===i));
  const cat=document.createElement('div');cat.className='bs-cat';cat.textContent=CATS[i%CATS.length];slot.appendChild(cat);
  const back=document.createElement('div');back.className='bs-back';back.innerHTML='<div class="bs-flap-l"></div><div class="bs-flap-r"></div>';slot.appendChild(back);
  if(!sealed){const l=document.createElement('div');l.className='bs-rim-l';const r=document.createElement('div');r.className='bs-rim-r';slot.appendChild(l);slot.appendChild(r)}
  const stack=document.createElement('div');stack.className='bs-stack';
  b.forEach((c,k)=>{
   const el=document.createElement('div'),info=BOOKS[c];
   el.className='bs-book'+(sel===i&&k>=b.length-lift?' selected':'')+(landed&&landed.box===i&&k>=b.length-landed.n?' landed':'');
   el.style.background=info.bg;
   el.innerHTML='<span class="bs-ridges"><i></i><i></i></span><span class="bs-badge"></span>';
   el.lastChild.textContent=info.icon;el.title=T(info.name);
   stack.appendChild(el)});
  slot.appendChild(stack);
  const front=document.createElement('div');front.className='bs-front';front.innerHTML='<span></span><span></span>';front.firstChild.textContent='BOX #'+(i+1);slot.appendChild(front);
  const tape=document.createElement('div');tape.className='bs-tape';slot.appendChild(tape);
  const stamp=document.createElement('div');stamp.className='bs-stamp';stamp.innerHTML='PACKED<br><small></small>';stamp.querySelector('small').textContent=T('已整理');slot.appendChild(stamp);
  const code=document.createElement('div');code.className='bs-code';code.textContent=(b.length?BOOKS[b[0]].code:'EMPTY')+' · 5';slot.appendChild(code);
  slot.addEventListener('click',()=>click(i));
  slot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click(i)}});
  boxesEl.appendChild(slot)})}
function shake(i){const s=boxesEl.querySelector('.bs-slot[data-index="'+i+'"]');if(!s)return;s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake')}
function sparkles(el){
 const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/3,icons=['✨','🐾','⭐','💛'];
 for(let i=0;i<8;i++){const sp=document.createElement('div');sp.className='bs-sparkle';sp.textContent=icons[i%4];
  const a=Math.PI*2*i/8,d=42+Math.random()*32;sp.style.left=cx+'px';sp.style.top=cy+'px';
  sp.style.setProperty('--tx',Math.cos(a)*d+'px');sp.style.setProperty('--ty',(Math.sin(a)*d-20)+'px');
  document.body.appendChild(sp);setTimeout(()=>sp.remove(),700)}}
function click(i){
 if(busy||g('bs-modal').hidden===false)return;
 hint=null;
 if(isFull(boxes[i])){shake(i);say('這箱已經集滿 5 本並封箱囉，交給貓咪店長保管！');render();return}
 if(sel===null){
  if(!boxes[i].length){shake(i);sfx.bad();say('這個紙箱是空的喔，先點選有書的紙箱吧！');render();return}
  sel=i;sfx.pick();say('已拿起「{0}」，請點選要疊放的紙箱！',T(BOOKS[boxes[i][boxes[i].length-1]].name));render();return}
 if(sel===i){sel=null;sfx.place(1);say('已將書本放回原位。');render();return}
 if(!canMove(boxes,sel,i)){
  const full=boxes[i].length>=CAP;
  sel=null;shake(i);sfx.bad();
  say(full?'這個紙箱已經疊滿 5 本書囉，換個箱子試試！':'書本顏色不同喔！只能疊在同色書上方或空紙箱裡。');render();return}
 doMove(sel,i)}
function doMove(from,to){
 busy=true;
 history.push({boxes:boxes.map(b=>b.slice()),moves:moves,extra:extraUsed});
 const n=moveCountOf(boxes,from,to);
 const fromSlot=boxesEl.querySelector('.bs-slot[data-index="'+from+'"]'),toSlot=boxesEl.querySelector('.bs-slot[data-index="'+to+'"]');
 const els=Array.from(fromSlot.querySelectorAll('.bs-book.selected')).slice(-n);
 const stackRect=toSlot.querySelector('.bs-stack').getBoundingClientRect(),have=boxes[to].length;
 els.forEach((el,k)=>{
  const r=el.getBoundingClientRect(),c=el.cloneNode(true);
  c.classList.remove('selected');c.classList.add('bs-fly');
  c.style.left=r.left+'px';c.style.top=r.top+'px';c.style.width=r.width+'px';
  document.body.appendChild(c);el.style.opacity='0';
  const dx=stackRect.left-r.left,dy=stackRect.bottom-(have+k+1)*(r.height+2)-r.top;
  requestAnimationFrame(()=>{c.style.transform='translate('+dx+'px,'+dy+'px)'});
  setTimeout(()=>c.remove(),340)});
 setTimeout(()=>{
  if(!round){try{round=AN.start(GAME_ID,0,{stage:level})}catch(_){round=null}}
  boxes=applyMove(boxes,from,to);sel=null;moves++;busy=false;landed={box:to,n:n};
  sfx.place(n);
  const sealedNow=isFull(boxes[to]);
  if(sealedNow){sfx.seal();say('集滿 5 本同色書！自動升起擋板、貼上膠帶並蓋章封箱！')}
  else say('疊放成功！繼續整理剩下的精裝書吧～');
  ui();render();
  if(round){try{AN.progress(round,{stage:level,step:moves})}catch(_){}}
  if(sealedNow){const s=boxesEl.querySelector('.bs-slot[data-index="'+to+'"]');if(s)sparkles(s)}
  if(solved(boxes))winTimer=setTimeout(win,700)},320)}
function win(){
 if(!solved(boxes))return;
 sfx.win();
 const colors=boxes.filter(b=>b.length).length,stars=rate(moves,colors);
 if(!random&&(!bestFor(level)||moves<bestFor(level))){store[level]=moves;saveStore()}
 trackEnd('complete');
 g('bs-final-moves').textContent=String(moves);g('bs-final-rating').textContent='★★★'.slice(0,stars)+'☆☆☆'.slice(0,3-stars);
 quoteIdx=Math.floor(Math.random()*QUOTES.length);g('bs-modal-quote').textContent=T(QUOTES[quoteIdx]);
 g('bs-next').textContent=!random&&level<LEVELS.length?tr('前往第 {0} 關',level+1):T('挑戰隨機關卡');
 g('bs-modal').hidden=false;g('bs-next').focus({preventScroll:true});
 say('書本全部封箱完成！');ui()}
function findHint(){
 const sol=solve(boxes,30000);
 if(sol&&sol.length)return sol[0];
 const m=legalMoves(boxes)[0];return m?{from:m.from,to:m.to}:null}
g('bs-level').addEventListener('change',e=>{sfx.pick();load(e.target.value);say('新關卡準備完成！所有書本從底層到頂層都一清二楚囉～')});
g('bs-undo').addEventListener('click',()=>{
 if(!history.length||busy)return;
 clearTimeout(winTimer);const p=history.pop();boxes=p.boxes;moves=p.moves;extraUsed=p.extra;sel=null;hint=null;landed=null;
 sfx.pick();say('已撤銷上一步移動！');ui();render()});
g('bs-hint').addEventListener('click',()=>{
 if(busy||g('bs-modal').hidden===false)return;
 const h=findHint();
 if(!h){sfx.bad();say('目前沒有可以移動的書，試試「撤銷上一步」吧！');return}
 sel=null;hint=h;sfx.pick();
 say('店長提示：試著把 {0} 號箱頂部的書移到 {1} 號箱！',h.from+1,h.to+1);render()});
g('bs-restart').addEventListener('click',()=>{
 if(busy)return;
 trackEnd('abandoned');clearTimeout(winTimer);
 boxes=initial.map(b=>b.slice());sel=null;hint=null;moves=0;history=[];extraUsed=false;landed=null;g('bs-modal').hidden=true;
 sfx.pick();say('紙箱已恢復原狀，重新整理一次吧！');ui();render()});
g('bs-add').addEventListener('click',()=>{
 if(extraUsed||busy||g('bs-modal').hidden===false)return;
 history.push({boxes:boxes.map(b=>b.slice()),moves:moves,extra:extraUsed});
 extraUsed=true;sel=null;hint=null;boxes.push([]);sfx.place(1);
 say('店長搬來一個備用空紙箱了！好好利用它來周轉書本吧。');ui();render()});
g('bs-random').addEventListener('click',()=>{sfx.pick();load('random');say('已生成全新的隨機關卡，祝你整理愉快！')});
g('bs-next').addEventListener('click',()=>{sfx.pick();load(!random&&level<LEVELS.length?level+1:'random')});
g('bs-sound').addEventListener('click',()=>{sfx.on=!sfx.on;ui();if(sfx.on)sfx.pick()});
window.addEventListener('hashchange',()=>{if(location.hash!=='#'+GAME_ID)trackEnd('abandoned')});
window.addEventListener('arcade-languagechange',()=>{ui();render();paintSay();if(!g('bs-modal').hidden){g('bs-next').textContent=!random&&level<LEVELS.length?tr('前往第 {0} 關',level+1):T('挑戰隨機關卡');g('bs-modal-quote').textContent=T(QUOTES[quoteIdx])}});
load(1);
  })();
