// Deterministic Cat Match rules shared by the browser and ranked-round verifier.
const catMatchRules=(()=>{
 const VERSION=1,HINT=4096,SHUFFLE=4097;
 const MASKS=['0111111011111111111111111111111111111111111111111111111101111110','1100001111100111111111111111111111111111111111110111111000111100','0011110001111110111111111110011111100111111111110111111000111100'];
 const active=(level,i)=>i>=0&&i<64&&MASKS[(level-1)%3][i]==='1';
 const adjacent=(a,b)=>Math.abs((a>>3)-(b>>3))+Math.abs(a%8-b%8)===1;
 const copy=b=>b.map(t=>t?{...t}:null);
 function random(g){let t=g.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);g.rng>>>=0;return ((t^t>>>14)>>>0)/4294967296}
 // 目標圖案出現率約 4 成（其餘五種平分），避免目標太少見而過不了關
 const tile=g=>{const r=random(g);if(r<0.4)return{t:g.target,s:''};const o=Math.floor((r-0.4)/0.6*5);return{t:o>=g.target?o+1:o,s:''}};
 function matches(b){const groups=[];for(let i=0;i<64;i++){if(!b[i]||b[i].t===6)continue;for(let step of [1,8]){if(step===1&&i%8>=6||step===8&&i>=48)continue;let prev=i-step;if(prev>=0&&b[prev]?.t===b[i].t&&(step===8||(prev>>3)===(i>>3)))continue;let group=[i];for(let j=i+step;j<64&&b[j]?.t===b[i].t&&(step===8||(j>>3)===(i>>3));j+=step)group.push(j);if(group.length>=3)groups.push(group)}}return groups}
 function legal(g){let result=[];for(let a=0;a<64;a++)if(g.board[a])for(let b of [a+1,a+8]){if(!g.board[b]||!adjacent(a,b))continue;const x=g.board[a],y=g.board[b];[g.board[a],g.board[b]]=[y,x];let ok=x.s==='rainbow'||y.s==='rainbow'||x.s&&y.s||matches(g.board).length;[g.board[a],g.board[b]]=[x,y];if(ok)result.push([a,b])}return result}
 function fresh(g){for(let attempt=0;attempt<500;attempt++){g.board=Array.from({length:64},(_,i)=>active(g.level,i)?tile(g):null);for(let i=0;i<64;i++)if(g.board[i]){const forbidden=new Set();for(let step of [1,8])if((step===8?i>=16:i%8>=2)&&g.board[i-step]&&g.board[i-step*2]&&g.board[i-step].t===g.board[i-step*2].t)forbidden.add(g.board[i-step].t);while(forbidden.has(g.board[i].t))g.board[i]=tile(g)}if(legal(g).length)return}throw Error('cat-match generation failed')}
 function shuffle(g){const values=g.board.filter(Boolean);for(let attempt=0;attempt<300;attempt++){for(let i=values.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[values[i],values[j]]=[values[j],values[i]]}let n=0;g.board=g.board.map(t=>t?values[n++]:null);if(!matches(g.board).length&&legal(g).length)return}fresh(g)}
 function create(seed,level=1){if(!Number.isInteger(level)||level<1||level>1000000)throw Error('invalid stage');const g={version:VERSION,level,rng:seed>>>0,board:[],moves:24,score:0,collected:0,goal:level<=5?5+level:Math.min(30,10+Math.floor((level-5)*0.8)),target:(level+3)%6,hints:level>10?5:3,shuffles:level>10?4:2,over:false,won:false};fresh(g);return g}
 function resolve(g,preferred,forced,frames){let chain=0,groups=matches(g.board);while(groups.length||forced.length){if(++chain>128)throw Error('cascade bound');const clear=new Set(forced),creates=new Map(),merged=[];groups.forEach(a=>a.forEach(i=>clear.add(i)));
  for(const group of groups){let union=new Set(group);let hit;do{hit=merged.findIndex(h=>[...h].some(i=>union.has(i)));if(hit>=0){merged[hit].forEach(i=>union.add(i));merged.splice(hit,1)}}while(hit>=0);merged.push(union)}
  for(const group of merged){const ids=[...group],straight=ids.every(i=>(i>>3)===(ids[0]>>3))||ids.every(i=>i%8===ids[0]%8);const special=straight&&ids.length>=5?'rainbow':!straight?'bomb':ids.length===4?((ids[0]>>3)===(ids[1]>>3)?'row':'col'):'';if(special){const at=preferred.find(i=>group.has(i))??ids.find(i=>!g.board[i].s);if(at!==undefined&&!g.board[at].s)creates.set(at,special)}}
  const queue=[...clear];let special=creates.size>0;for(let n=0;n<queue.length;n++){const i=queue[n],t=g.board[i];if(!t?.s)continue;special=true;creates.delete(i);for(let j=0;j<64;j++)if(g.board[j]&&(t.s==='rainbow'||t.s==='row'&&(j>>3)===(i>>3)||t.s==='col'&&j%8===i%8||t.s==='bomb'&&Math.abs((j>>3)-(i>>3))<=1&&Math.abs(j%8-i%8)<=1)){if(!clear.has(j)){clear.add(j);queue.push(j)}}}
  const before=copy(g.board),removed=[...clear].filter(i=>!creates.has(i));for(const i of clear){if(g.board[i]?.t===g.target)g.collected++;g.score+=10*chain;g.board[i]=creates.has(i)?{t:creates.get(i)==='rainbow'?6:g.board[i].t,s:creates.get(i)}:null}
  const falling=[];for(let x=0;x<8;x++){const cells=[];for(let y=7;y>=0;y--)if(active(g.level,y*8+x))cells.push(y*8+x);const prior=cells.filter(i=>g.board[i]).map(i=>({t:g.board[i],row:i>>3}));let missing=cells.length-prior.length;cells.forEach((i,k)=>{const old=prior[k];g.board[i]=old?.t||tile(g);falling.push({i,from:old?old.row:(cells[cells.length-1]>>3)-missing+k-prior.length})})}
  if(frames)frames.push({before,removed,after:copy(g.board),falling,chain,special,score:g.score,collected:g.collected});preferred=[];forced=[];groups=matches(g.board)
 }
 if(!legal(g).length){shuffle(g);if(frames)frames.push({shuffle:true,after:copy(g.board)})}
 g.won=g.collected>=g.goal;g.over=g.won||g.moves===0;
 }
 function act(g,action,frames){if(g.over||!Number.isInteger(action)||action<0||action>SHUFFLE)return false;
  if(action===HINT){if(!g.hints)return false;g.hints--;return true}
  if(action===SHUFFLE){if(!g.shuffles)return false;g.shuffles--;shuffle(g);return true}
  const a=Math.floor(action/64),b=action%64;if(!g.board[a]||!g.board[b]||!adjacent(a,b))return false;let x=g.board[a],y=g.board[b];[g.board[a],g.board[b]]=[y,x];let forced=[];
  if(x.s==='rainbow'||y.s==='rainbow'){const color=x.s==='rainbow'?y.t:x.t;forced=[a,b,...g.board.flatMap((t,i)=>t&&(color===6||t.t===color)?[i]:[])];if(x.s==='rainbow')x.s='';if(y.s==='rainbow')y.s=''}else if(x.s&&y.s)forced=[a,b];
  if(!forced.length&&!matches(g.board).length){[g.board[a],g.board[b]]=[x,y];return false}
  g.moves--;resolve(g,[b,a],forced,frames);return true;
 }
 function accepts(actions){return Array.isArray(actions)&&actions.length>=1&&actions.length<=33&&actions.every(a=>Number.isInteger(a)&&a>=0&&a<=SHUFFLE)}
 function replay(seed,level,actions){if(!accepts(actions))return null;const g=create(seed,level);for(const a of actions)if(!act(g,a))return null;return g.over?g:null}
 return {VERSION,HINT,SHUFFLE,MASKS,active,adjacent,copy,create,legal,matches,act,accepts,replay};
})();
if(typeof module!=='undefined')module.exports=catMatchRules;
