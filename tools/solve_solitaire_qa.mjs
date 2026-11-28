// QA-only search. Produces legal inputs for an unmodified, normally seeded deal.
// It neither changes the game rules nor manufactures a terminal state or elapsed time.
import S from '../shared/solitaire-rules.cjs';
import M from '../shared/mermaid-rules.cjs';
import RNG from '../shared/timed-replay.cjs';
import {writeFileSync} from 'node:fs';
const kind=process.argv[2]||'freecell',seed=Number(process.argv[3]||7),limit=Number(process.argv[4]||200000),out=process.argv[5];
const mode=Number(process.argv[6]||1),isSpider=kind==='spider',rank=c=>c%13+1,suit=c=>Math.floor(c/13),red=c=>[1,2].includes(suit(c));
class Heap{a=[];push(n){let i=this.a.length;this.a.push(n);while(i){const p=(i-1)>>1;if(this.a[p].priority>=n.priority)break;this.a[i]=this.a[p];i=p;}this.a[i]=n;}pop(){const a=this.a,top=a[0],end=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&a[c+1].priority>a[c].priority)c++;if(a[c].priority<=end.priority)break;a[i]=a[c];i=c;}a[i]=end;}return top;}}
function clone(g){return {kind:g.kind,cols:g.cols.map(c=>c.slice()),hidden:g.hidden.slice(),stock:g.stock.slice(),waste:g.waste?.slice()||[],cells:g.cells?.slice()||[null,null,null,null],found:g.found?.map(p=>p.slice())||[[],[],[],[]],done:g.done||0,won:false};}
function apply(g,code){
 const n=clone(g);
 if(isSpider){
  const flip=f=>{if(n.hidden[f]>=n.cols[f].length)n.hidden[f]=Math.max(0,n.cols[f].length-1);};
  const sweep=f=>{const p=n.cols[f];while(p.length>=13&&p.length-13>=n.hidden[f]){const a=p.slice(-13);if(rank(a[0])!==13||a.some((c,i)=>rank(c)!==13-i||suit(c)!==suit(a[0])))break;p.splice(-13);n.done++;flip(f);}};
  if(code===0){for(let f=0;f<10;f++)n.cols[f].push(n.stock.pop());for(let f=0;f<10;f++)sweep(f);}
  else{const x=code-5,f=Math.floor(x/1040),i=Math.floor(x%1040/10),t=x%10;n.cols[t].push(...n.cols[f].splice(i));flip(f);sweep(t);}
  n.won=n.done===8;return n;
 }
 if(code===0){if(n.stock.length)n.waste.push(n.stock.pop());else{n.stock=n.waste.reverse();n.waste=[];}return n;}
 const x=code-2,f=Math.floor(x/832),i=Math.floor(x%832/16),t=x%16,p=S.pile(n,f),cards=p.slice(i);
 if(f<8){n.cols[f].splice(i);n.hidden[f]=Math.max(0,Math.min(n.hidden[f],n.cols[f].length-1));}else if(f<12)n.cells[f-8]=null;else if(f<16)n.found[f-12].pop();else n.waste.pop();
 if(t<8)n.cols[t].push(...cards);else if(t<12)n.cells[t-8]=cards[0];else n.found[t-12].push(cards[0]);
 n.won=n.found.every(p=>p.length===13);return n;
}
function auto(g){const moves=[];if(isSpider)return {g,moves};let again=true;
 while(again){again=false;for(const f of [...g.cols.keys(),8,9,10,11,16]){const p=S.pile(g,f);if(!p?.length)continue;const c=p.at(-1),r=rank(c),u=suit(c),opps=[0,1,2,3].filter(x=>red(x*13)!==red(c)),same=[0,1,2,3].find(x=>x!==u&&red(x*13)===red(c));
  if(!(r<=2||opps.every(x=>g.found[x].length>=r-1)&&g.found[same].length>=r-2))continue;
  const code=S.encode(f,p.length-1,12+u);if(S.canMove(g,f,p.length-1,12+u)){g=apply(g,code);moves.push(code);again=true;if(g.won)return {g,moves};break;}
 }}return {g,moves};}
function key(g){
 if(isSpider){const cols=g.cols.map((p,f)=>{const future=[];for(let i=g.stock.length-1-f;i>=0;i-=10)future.push(g.stock[i]);return future.join('.')+':'+g.hidden[f]+'/'+p.join('.');}).sort();return g.done+'|'+cols.join('|');}
 return g.cols.map((p,i)=>g.hidden[i]+'/'+p.join('.')).sort().join('|')+';'+g.cells.filter(c=>c!==null).sort((a,b)=>a-b).join('.')+';'+g.found.map(p=>p.length).join('.')+';'+g.stock.join('.')+';'+g.waste.join('.');
}
function value(g){let hidden=g.hidden.reduce((a,b)=>a+b,0),pairs=0,breaks=0,empty=g.cols.filter(p=>!p.length).length;
 for(let f=0;f<g.cols.length;f++){const p=g.cols[f];for(let i=g.hidden[f]+1;i<p.length;i++){if(rank(p[i-1])===rank(p[i])+1&&(isSpider?suit(p[i-1])===suit(p[i]):red(p[i-1])!==red(p[i])))pairs++;else breaks++;}}
 if(isSpider)return g.done*150+(44-hidden)*18+pairs*4+empty*18-g.stock.length*.8-breaks*2;
 let buried=0;for(let u=0;u<4;u++){const need=u*13+g.found[u].length;if(g.found[u].length===13)continue;let best=30;for(const p of g.cols){const i=p.indexOf(need);if(i>=0)best=p.length-i-1;}if(g.cells.includes(need)||g.waste.at(-1)===need)best=0;else if(g.stock.includes(need))best=3;buried+=best;}
 const home=g.found.reduce((n,p)=>n+p.length,0);return home*35-hidden*35+empty*(kind==='freecell'?45:12)+g.cells.filter(c=>c===null).length*12+pairs*7-buried*8-breaks*.5;
}
function choices(g){const codes=[];
 if(isSpider){for(let f=0;f<10;f++){const p=g.cols[f];let lo=p.length-1;while(lo>g.hidden[f]&&rank(p[lo-1])===rank(p[lo])+1&&suit(p[lo-1])===suit(p[lo]))lo--;
  for(let i=Math.max(0,lo);i<p.length;i++){let emptySeen=false;for(let t=0;t<10;t++){if(f===t)continue;const d=g.cols[t];if(!d.length){if(emptySeen||i===0&&g.hidden[f]===0)continue;emptySeen=true;}else if(rank(d.at(-1))!==rank(p[i])+1)continue;codes.push(5+f*1040+i*10+t);}}}
  if(g.stock.length&&g.cols.every(p=>p.length))codes.push(0);return codes;
 }
 for(const f of [...g.cols.keys(),8,9,10,11,16]){const p=S.pile(g,f);if(!p?.length)continue;
  for(let i=f<8?g.hidden[f]:p.length-1;i<p.length;i++){
   if(!S.run(g,f,i))continue;let emptySeen=false;
   for(let t=0;t<g.cols.length;t++){if(!g.cols[t].length){if(emptySeen||f<8&&i===0&&g.hidden[f]===0)continue;emptySeen=true;}
    if(S.canMove(g,f,i,t))codes.push(S.encode(f,i,t));}
   if(i===p.length-1){const t=12+suit(p[i]);if(S.canMove(g,f,i,t))codes.push(S.encode(f,i,t));
    if(kind==='freecell'&&f<8){const cell=g.cells.indexOf(null);if(cell>=0&&S.canMove(g,f,i,8+cell))codes.push(S.encode(f,i,8+cell));}}
  }
 }
 if(kind==='classic'&&(g.stock.length||g.waste.length))codes.push(0);return codes;
}
let prefix=[],original;
if(isSpider){const m=M.create(RNG.seeded(seed));if(mode!==1){M.input(m,mode===2?3:4);prefix.push(mode===2?3:4);}original={kind:'spider',cols:m.cols.map(c=>c.cards.map(x=>x.suit*13+x.rank-1)),hidden:m.cols.map(c=>c.hidden),stock:m.stock.map(x=>x.suit*13+x.rank-1),done:0};}
else original=S.create(kind,RNG.seeded(seed));
const began=Date.now(),q=new Heap(),visited=new Set(),first=auto(original);let nodes=0,best=-1e9,goal=null;
q.push({g:first.g,prev:null,codes:[...prefix,...first.moves],depth:first.moves.length,priority:value(first.g)});visited.add(key(first.g));
while(q.a.length&&nodes<limit){const n=q.pop();nodes++;if(n.g.won){goal=n;break;}if(n.depth>850)continue;
 const v=value(n.g);if(v>best){best=v;if(nodes%5000===0)process.stderr.write(JSON.stringify({kind,seed,nodes,best,depth:n.depth,queue:q.a.length,ms:Date.now()-began})+'\n');}
 for(const code of choices(n.g)){const result=auto(apply(n.g,code)),g=result.g,k=key(g);if(visited.has(k))continue;visited.add(k);const depth=n.depth+1+result.moves.length;q.push({g,prev:n,codes:[code,...result.moves],depth,priority:value(g)-depth*.07});}
 if(q.a.length>70000){q.a.sort((a,b)=>b.priority-a.priority);q.a.length=12000;const a=q.a;q.a=[];for(const n of a)q.push(n);}
}
let actions=[];if(goal){const chunks=[];for(let n=goal;n;n=n.prev)chunks.push(n.codes);actions=chunks.reverse().flat();
 if(isSpider){const g=M.create(RNG.seeded(seed));for(const code of actions)if(!M.input(g,code))throw Error('Invalid Spider search proof');if(g.done!==8)throw Error('Incomplete Spider proof');}
 else if(!S.replay(kind,RNG.seeded(seed),actions))throw Error('Invalid solitaire search proof');
 if(actions.length>4096)throw Error('Proof exceeds ranked limit');}
const result={kind,seed,mode,solved:!!goal,nodes,searchMs:Date.now()-began,actions};if(out)writeFileSync(out,JSON.stringify(result));console.log(JSON.stringify({...result,actions:undefined,moves:actions.length}));
if(!goal)process.exitCode=2;
