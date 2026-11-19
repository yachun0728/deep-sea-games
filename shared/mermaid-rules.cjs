const mermaidRules=(()=>{
const MODES={1:{suits:[3]},2:{suits:[3,2]},4:{suits:[0,1,2,3]}};
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
function createGame(mode,r){
 r=r||Math.random;const suits=MODES[mode].suits,copies=8/suits.length,deck=[];let id=0;
 for(const s of suits)for(let k=0;k<copies;k++)for(let n=1;n<=13;n++)deck.push({id:id++,suit:s,rank:n});
 shuffle(deck,r);
 const g={mode:mode,cols:[],stock:[],done:0,doneSuits:[],moves:0,score:500,history:[],fx:[]};
 let p=0;for(let c=0;c<10;c++){const n=c<4?6:5;g.cols.push({cards:deck.slice(p,p+n),hidden:n-1});p+=n}
 g.stock=deck.slice(p);return g}
function snap(g){return{cols:g.cols.map(c=>({cards:c.cards.slice(),hidden:c.hidden})),stock:g.stock.slice(),done:g.done,doneSuits:g.doneSuits.slice(),moves:g.moves,score:g.score}}
function pushHistory(g){g.history.push(snap(g));if(g.history.length>400)g.history.shift()}
function undo(g){const s=g.history.pop();if(!s)return false;g.cols=s.cols;g.stock=s.stock;g.done=s.done;g.doneSuits=s.doneSuits;g.moves=s.moves;g.score=Math.max(0,s.score-1);return true}
function flipTop(col){if(!col.cards.length)col.hidden=0;else if(col.hidden>=col.cards.length)col.hidden=col.cards.length-1}
function runStart(col,idx){
 const cs=col.cards;if(idx<col.hidden||idx<0||idx>=cs.length)return false;
 for(let i=idx;i<cs.length-1;i++)if(cs[i].suit!==cs[i+1].suit||cs[i].rank!==cs[i+1].rank+1)return false;
 return true}
function canDrop(g,from,idx,to){
 if(from===to||!g.cols[from]||!g.cols[to])return false;
 const src=g.cols[from];if(!runStart(src,idx))return false;
 const dst=g.cols[to];if(!dst.cards.length)return true;
 return dst.cards[dst.cards.length-1].rank===src.cards[idx].rank+1}
function completeRun(col){
 const cs=col.cards,n=cs.length;if(n<13||n-13<col.hidden||cs[n-1].rank!==1||cs[n-13].rank!==13)return false;
 for(let i=n-13;i<n-1;i++)if(cs[i].suit!==cs[i+1].suit||cs[i].rank!==cs[i+1].rank+1)return false;
 return true}
function sweep(g,c){
 const col=g.cols[c];
 while(completeRun(col)){
  const cards=col.cards.splice(col.cards.length-13);
  g.done++;g.doneSuits.push(cards[0].suit);g.score+=100;flipTop(col);
  g.fx.push({t:'run',col:c,n:g.done,suit:cards[0].suit,cards:cards})}}
function move(g,from,idx,to){
 if(!canDrop(g,from,idx,to))return false;
 pushHistory(g);
 const src=g.cols[from],dst=g.cols[to];
 const run=src.cards.splice(idx);for(const card of run)dst.cards.push(card);
 g.moves++;g.score=Math.max(0,g.score-1);
 flipTop(src);sweep(g,to);return true}
function canDeal(g){return g.stock.length>0&&g.cols.every(c=>c.cards.length>0)}
function deal(g){
 if(!canDeal(g))return false;
 pushHistory(g);
 const ids=[];
 for(let c=0;c<10;c++){const card=g.stock.pop();g.cols[c].cards.push(card);ids.push(card.id)}
 g.moves++;g.score=Math.max(0,g.score-1);
 for(let c=0;c<10;c++)sweep(g,c);
 return ids}
function allMoves(g){
 const out=[];
 for(let f=0;f<10;f++){
  const col=g.cols[f],cs=col.cards;if(!cs.length)continue;
  let lo=cs.length-1;while(lo-1>=col.hidden&&cs[lo-1].suit===cs[lo].suit&&cs[lo-1].rank===cs[lo].rank+1)lo--;
  for(let idx=lo;idx<cs.length;idx++)for(let t=0;t<10;t++)if(canDrop(g,f,idx,t))out.push({from:f,idx:idx,to:t})}
 return out}
function chainLen(col){
 const cs=col.cards;let n=0;
 for(let i=cs.length-1;i>=col.hidden;i--){n++;if(i-1<col.hidden||cs[i-1].suit!==cs[i].suit||cs[i-1].rank!==cs[i].rank+1)break}
 return n}
function scoreMove(g,m){
 const src=g.cols[m.from],dst=g.cols[m.to],cs=src.cards,mv=cs[m.idx],len=cs.length-m.idx,dtop=dst.cards[dst.cards.length-1];
 let s=len*.5;
 if(dtop){if(dtop.suit===mv.suit){s+=30;if(chainLen(dst)+len>=13&&cs[cs.length-1].rank===1)s+=200}else s+=4}else s-=12;
 if(m.idx===src.hidden)s+=src.hidden>0?25:(dtop?8:0);
 else{const under=cs[m.idx-1];if(under.suit===mv.suit&&under.rank===mv.rank+1)s-=35}
 return s}
function findHint(g){
 let best=null;
 for(const m of allMoves(g)){const s=scoreMove(g,m);if(!best||s>best.s)best={from:m.from,idx:m.idx,to:m.to,s:s}}
 return best}

function create(random=Math.random){
 const state=createGame(1,random);state.random=random;state.dead=false;return state;
}
function input(s,code){
 if(s.dead||!Number.isInteger(code)||code<0||code>=10406)return false;
 if(code===3||code===4){
  if(s.moves||s.mode!==1)return false;
  Object.assign(s,createGame(code===3?2:4,s.random));return true;
 }
 if(code===2){s.dead=true;return true;}
 let result;
 if(code===0)result=deal(s);
 else if(code===1)result=undo(s);
 else{
  const packed=code-5,from=Math.floor(packed/1040),idx=Math.floor(packed%1040/10),to=packed%10;
  result=move(s,from,idx,to);
 }
 if(s.done===8)s.dead=true;
 return !!result;
}
return {create,inputCount:10406,input,advance:()=>{},score:s=>s.score,
shuffle,createGame,snap,pushHistory,undo,flipTop,runStart,canDrop,completeRun,sweep,move,canDeal,deal,allMoves,chainLen,scoreMove,findHint};
})();
if(typeof module!=='undefined')module.exports=mermaidRules;
