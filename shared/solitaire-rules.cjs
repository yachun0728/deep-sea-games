/* Deterministic Klondike (draw one) and FreeCell. Browser/Worker share this engine. */
const solitaireRules=(()=>{
const rank=c=>c%13+1,suit=c=>Math.floor(c/13),red=c=>[1,2].includes(suit(c));
const INPUT_COUNT=14146;
function create(kind='classic',random=Math.random){
 if(!['classic','freecell'].includes(kind))throw Error('Unknown solitaire');
 const deck=Array.from({length:52},(_,i)=>i);
 for(let i=51;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 const s={kind,cols:[],hidden:[],stock:[],waste:[],cells:[null,null,null,null],found:[[],[],[],[]],moves:0,history:[],won:false};
 if(kind==='classic'){for(let i=0;i<7;i++){s.cols.push(deck.splice(0,i+1));s.hidden.push(i);}s.stock=deck;}
 else{for(let i=0;i<8;i++){s.cols.push([]);s.hidden.push(0);}deck.forEach((c,i)=>s.cols[i%8].push(c));}
 return s;
}
function snapshot(s){const {history,...rest}=s;return JSON.parse(JSON.stringify(rest));}
function remember(s){s.history.push(snapshot(s));if(s.history.length>400)s.history.shift();}
function pile(s,where){if(where<8)return s.cols[where];if(where<12)return s.cells[where-8]===null?[]:[s.cells[where-8]];if(where<16)return s.found[where-12];return where===16?s.waste:null;}
function run(s,from,index){const p=pile(s,from);if(!p||index<0||index>=p.length)return false;
 if(from>=8)return index===p.length-1;
 if(index<s.hidden[from])return false;
 for(let i=index;i<p.length-1;i++)if(rank(p[i])!==rank(p[i+1])+1||red(p[i])===red(p[i+1]))return false;
 return true;}
function canMove(s,from,index,to){
 if(s.won||from===to||!Number.isInteger(to)||to<0||to>=16||!run(s,from,index))return false;
 const source=pile(s,from),cards=source.slice(index),c=cards[0],target=pile(s,to);
 if(!target)return false;
 if(to>=12)return cards.length===1&&suit(c)===to-12&&rank(c)===target.length+1;
 if(to>=8)return s.kind==='freecell'&&cards.length===1&&s.cells[to-8]===null;
 if(!target.length){if(s.kind==='classic'&&rank(c)!==13)return false;}
 else if(rank(target[target.length-1])!==rank(c)+1||red(target[target.length-1])===red(c))return false;
 if(s.kind==='freecell'&&cards.length>1){
  const free=s.cells.filter(c=>c===null).length,empty=s.cols.filter((p,i)=>!p.length&&i!==to).length;
  if(cards.length>(free+1)*2**empty)return false;
 }
 return true;
}
function move(s,from,index,to){
 if(!canMove(s,from,index,to))return false;remember(s);
 const source=pile(s,from),cards=source.slice(index);
 if(from<8){s.cols[from].splice(index);s.hidden[from]=Math.max(0,Math.min(s.hidden[from],s.cols[from].length-1));}
 else if(from<12)s.cells[from-8]=null;
 else if(from<16)s.found[from-12].pop();else s.waste.pop();
 if(to<8)s.cols[to].push(...cards);else if(to<12)s.cells[to-8]=cards[0];else s.found[to-12].push(cards[0]);
 s.moves++;s.won=s.found.every(p=>p.length===13);return true;
}
function draw(s){
 if(s.kind!=='classic'||s.won||!s.stock.length&&!s.waste.length)return false;
 remember(s);if(s.stock.length)s.waste.push(s.stock.pop());else{s.stock=s.waste.reverse();s.waste=[];}s.moves++;return true;
}
function undo(s){if(s.won||!s.history.length)return false;const prior=s.history.pop(),moves=s.moves+1;Object.assign(s,prior);s.moves=moves;return true;}
function encode(from,index,to){return 2+from*52*16+index*16+to;}
function input(s,code){
 if(!Number.isInteger(code)||code<0||code>=INPUT_COUNT)return false;
 if(code===0)return draw(s);if(code===1)return undo(s);
 const n=code-2,from=Math.floor(n/832),index=Math.floor(n%832/16),to=n%16;return move(s,from,index,to);
}
function hint(s){
 for(let f=0;f<17;f++){const p=pile(s,f);if(!p)continue;
  for(let i=f<8?s.hidden[f]:p.length-1;i<p.length;i++)for(let t=12;t<16;t++)if(canMove(s,f,i,t))return {from:f,index:i,to:t};
 }
 for(let f=0;f<17;f++){const p=pile(s,f);if(!p)continue;
  for(let i=Math.max(0,f<8?s.hidden[f]:p.length-1);i<p.length;i++)for(let t=0;t<(s.kind==='freecell'?12:7);t++){
   if(f<8&&i===0&&!pile(s,t)?.length)continue;
   if(canMove(s,f,i,t))return {from:f,index:i,to:t};
  }
 }
 return s.kind==='classic'&&s.stock.length?{draw:true}:null;
}
function replay(kind,seededRandom,actions){const s=create(kind,seededRandom);for(const code of actions){if(s.won||!input(s,code))return null;}return s.won?s:null;}
return {create,rank,suit,red,pile,run,canMove,move,draw,undo,encode,input,hint,replay,INPUT_COUNT};
})();
if(typeof module!=='undefined')module.exports=solitaireRules;
