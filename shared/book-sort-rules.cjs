const CAP=5;
const BOOKS={
 crimson:{name:'酒紅文學',bg:'linear-gradient(180deg,#c94646,#9e2b2b)',icon:'★',code:'LIT-01'},
 navy:{name:'海軍天文',bg:'linear-gradient(180deg,#356394,#204269)',icon:'☽',code:'AST-02'},
 forest:{name:'森林植物',bg:'linear-gradient(180deg,#438555,#2c613b)',icon:'♣',code:'BOT-03'},
 mustard:{name:'芥末藝術',bg:'linear-gradient(180deg,#e0a334,#bd811c)',icon:'☀',code:'ART-04'},
 lavender:{name:'薰衣草魔法',bg:'linear-gradient(180deg,#8663a6,#61427d)',icon:'♦',code:'MAG-05'},
 caramel:{name:'焦糖烘焙',bg:'linear-gradient(180deg,#db7539,#b3551e)',icon:'♥',code:'COK-06'},
 teal:{name:'湖水博物',bg:'linear-gradient(180deg,#2e9499,#1d6d73)',icon:'♛',code:'HIS-07'},
 sakura:{name:'櫻花詩集',bg:'linear-gradient(180deg,#de6f8c,#b84b68)',icon:'✿',code:'POE-08'},
 plum:{name:'紫梅歷史',bg:'linear-gradient(180deg,#975576,#703650)',icon:'▲',code:'CHR-09'},
 slate:{name:'石墨建築',bg:'linear-gradient(180deg,#637685,#41505d)',icon:'■',code:'ARC-10'},
 olive:{name:'橄欖遊記',bg:'linear-gradient(180deg,#8a8b46,#62672c)',icon:'✚',code:'TRV-11'}};
const COLORS=Object.keys(BOOKS);
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
// Numbered stages use repeatable boards so a saved score always refers to the same puzzle.
const TIERS=[
 {stage:36,colors:11,empty:1,mix:41,fallback:'26520 a8495 43256 58712 27440 a0171 69a38 7a91 3a06 8309 3458 7196'},
 {stage:21,colors:11,empty:2,mix:41,fallback:'08926 86184 21839 29771 29547 a7a13 45266 4a41a 7856a 35090 30305'},
 {stage:11,colors:10,empty:2,mix:37,fallback:'06346 15489 75739 37132 63050 75822 16415 18979 02408 86429'},
 {stage:6,colors:9,empty:2,mix:33,fallback:'27386 64202 88624 01547 65856 57143 74030 07211 31835'}
];
function shuffle(items,rnd){
 for(let i=items.length-1;i>0;i--){
  const j=Math.floor(rnd()*(i+1));
  [items[i],items[j]]=[items[j],items[i]];
 }
 return items
}
function campaignLevel(number){
 if(number<=LEVELS.length){
  const preset=LEVELS[number-1];
  return {boxes:preset.map(b=>b.slice()),par:(preset.length-2)*3+4}
 }
 const tier=TIERS.find(t=>number>=t.stage);
 let seed=(number^Math.floor(number/4294967296))>>>0;
 const rnd=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296
 };
 const colors=shuffle(COLORS.slice(0,tier.colors),rnd);
 const template=tier.fallback.split(' ');
 const empty=Array.from({length:tier.empty},()=>[]);
 for(let attempt=0;attempt<12;attempt++){
  const books=shuffle(colors.flatMap(color=>Array(CAP).fill(color)),rnd);
  const state=template.map(stack=>books.splice(0,stack.length)).concat(empty);
  const changes=state.reduce((sum,box)=>sum+box.filter((color,i)=>i>0&&color!==box[i-1]).length,0);
  if(changes<tier.mix||state.some(isFull))continue;
  const path=solve(state,4000);
  if(path)return {boxes:state,par:path.length};
 }
 const fallback=template.map(stack=>Array.from(stack,key=>colors[parseInt(key,16)])).concat(empty);
 return {boxes:fallback,par:solve(fallback,4000).length}
}
function rate(moves,par){return moves<=par?3:moves<=par+8?2:1}

function rankedBookMinimumMs(actions){
 const moves=actions.filter(move=>Array.isArray(move)&&move.length===2).length;
 return Math.max(0,moves-2)*240
}

// The browser includes these rules inside its game closure. The Worker imports the same source.
if (typeof module === 'object' && module.exports) {
 module.exports={BOOKS,COLORS,LEVELS,TIERS,CAP,isFull,topCount,canMove,applyMove,solved,solve,randomLevel,campaignLevel,legalMoves,rankedBookMinimumMs};
}
