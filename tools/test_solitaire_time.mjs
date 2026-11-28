import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import S from '../shared/solitaire-rules.cjs';
import M from '../shared/mermaid-rules.cjs';
import T from '../shared/solitaire-time.cjs';
import replay from '../shared/timed-replay.cjs';
import worker from '../backend/src/index.mjs';

function orderedRandom(){
 const desired=Array.from({length:52},(_,i)=>i).sort((a,b)=>S.rank(b)-S.rank(a)||S.suit(a)-S.suit(b)),a=Array.from({length:52},(_,i)=>i),values=[];
 for(let i=51;i>0;i--){const j=a.indexOf(desired[i]);assert(j<=i);values.push((j+.25)/(i+1));[a[i],a[j]]=[a[j],a[i]];}
 return ()=>values.shift();
}
function solveFixture(kind){
 const g=S.create(kind,orderedRandom()),actions=[];
 for(let steps=0;steps<300&&!g.won;steps++){
  let code=null;
  for(let f=0;f<17&&code===null;f++){const p=S.pile(g,f);if(!p?.length)continue;for(let t=12;t<16;t++)if(S.canMove(g,f,p.length-1,t)){code=S.encode(f,p.length-1,t);break;}}
  if(code===null&&kind==='classic')code=0;
  assert(code!==null&&S.input(g,code),'controlled deck is solvable using real legal moves');actions.push(code);
  assert.equal(new Set([...g.cols.flat(),...g.stock,...g.waste,...g.cells.filter(c=>c!==null),...g.found.flat()]).size,52);
 }
 assert(g.won);return actions;
}
const proofs={classic:solveFixture('classic'),freecell:solveFixture('freecell')};
for(const kind of ['classic','freecell']){
 const g=S.create(kind,replay.seeded(7));assert.equal(g.cols.length,kind==='classic'?7:8);assert.equal(g.cols.flat().length+g.stock.length,52);assert.equal(new Set([...g.cols.flat(),...g.stock]).size,52);
 assert.deepEqual(g.hidden,kind==='classic'?[0,1,2,3,4,5,6]:Array(8).fill(0));
 assert(S.replay(kind,orderedRandom(),proofs[kind]));assert.equal(S.replay(kind,orderedRandom(),proofs[kind].slice(0,-1)),null);
 assert.equal(S.replay(kind,orderedRandom(),[...proofs[kind],1]),null,'cannot undo after terminal completion');
 assert(!S.input(g,NaN));assert(!S.input(g,-1));assert(!S.input(g,S.INPUT_COUNT));
}
const cell=S.create('freecell');cell.cols=[[6,18,4],[20],[0],[1],[2],[3],[7],[8]];cell.hidden=Array(8).fill(0);cell.cells=[9,10,11,12];
assert(!S.canMove(cell,0,0,1),'no free cells or columns permits only a single card');
cell.cells=[null,null,null,12];assert(S.canMove(cell,0,0,1),'three empty cells allow a four-card sequence');
cell.cells=[null,10,11,12];cell.cols[1]=[];assert(!S.canMove(cell,0,0,1),'destination empty column cannot count as workspace');
cell.cols[2]=[];assert(S.canMove(cell,0,0,1),'another empty column doubles move capacity');
const kl=S.create('classic');kl.cols=[[11],[12],[],[],[],[],[]];kl.hidden=Array(7).fill(0);assert(!S.canMove(kl,0,0,2),'only Kings fill empty Klondike columns');assert(S.canMove(kl,1,0,2));
const undo=S.create('classic',replay.seeded(7)),stock=undo.stock.slice();assert(S.draw(undo));assert(S.undo(undo));assert.deepEqual(undo.stock,stock);assert.equal(undo.moves,2,'undo increments moves and never affects clock');
console.log('PASS rules: 52-card deals, hidden cards, colors/ranks, complete legal fixture proofs, no partial/post-win proofs, FreeCell supermove capacity, empty-column rules, undo');

const sql=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+file,import.meta.url),'utf8'));
const DB={prepare(q){const st=sql.prepare(q),bind=(...a)=>({first:async()=>st.get(...a)??null,run:async()=>st.run(...a),all:async()=>({results:st.all(...a)})});return {...bind(),bind};}};
let now=Date.now();const realNow=Date.now;Date.now=()=>now;
async function req(path,body,token){const r=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:token?{Authorization:'Bearer '+token}:{},body:body?JSON.stringify(body):undefined}),{DB});return {status:r.status,body:await r.json()};}
const realCreate=S.create,realMermaidCreate=M.create;
// Controlled fixture decks isolate the real replay/clock/API/SQL contracts from puzzle search.
// They are not a claim of human playthroughs of arbitrary shuffled deals.
let fixtureMode=1;
S.create=kind=>realCreate(kind,orderedRandom());
M.create=rng=>{const g=realMermaidCreate(rng);g.cols=Array.from({length:10},()=>({cards:[],hidden:0}));g.cols[0].cards=Array.from({length:12},(_,i)=>({id:i,suit:3,rank:13-i}));g.cols[1].cards=[{id:12,suit:3,rank:1}];g.stock=[];g.mode=fixtureMode;g.done=7;g.doneSuits=fixtureMode===4?[0,0,1,1,2,2,3]:fixtureMode===2?[2,2,2,2,3,3,3]:Array(7).fill(3);return g;};
try{
 const p=(await req('/api/v1/players',{})).body,q=(await req('/api/v1/players',{})).body,start='/api/v1/boards/rounds',move=start+'/move';
 async function run(gameId,player,ms,proof){
  const r=await req(start,{gameId,rulesVersion:1},player.token);assert.equal(r.status,201,r.body.error);const cmd={gameId,id:r.body.id,revision:0,action:proof};
  assert.equal((await req(move,cmd,player.id===p.id?q.token:p.token)).status,404);
  const bad=await req(move,{...cmd,action:[999999]},player.token);assert.equal(bad.status,400);
  assert.equal((await req(move,{...cmd,elapsedMs:1},player.token)).status,400,'client elapsed time is not accepted');
  now+=ms;const done=await req(move,cmd,player.token);assert.equal(done.status,200);assert.equal(done.body.revision,1,JSON.stringify(done.body));assert.equal(done.body.state.elapsedMs,ms);assert.equal(done.body.state.score,T.LIMIT_MS-ms);
  now+=1000;assert.deepEqual(await req(move,cmd,player.token),done,'retries do not add time or duplicate scores');return done;
 }
 for(const [id,config] of Object.entries(T.IDS)){
  fixtureMode=config.mode||1;const proof=config.base==='mermaid'?[1045]:proofs[config.kind];
  await run(id,p,50000,proof);await run(id,p,60000,proof);
  let board=(await req('/api/v1/leaderboard?gameId='+id+'&lang=en')).body;assert.equal(board.entries[0].elapsedMs,50000,'slower cannot replace personal best');
  await run(id,p,40000,proof);await run(id,q,40000,proof);board=(await req('/api/v1/leaderboard?gameId='+id+'&lang=en')).body;
  assert.deepEqual(board.entries.map(e=>e.elapsedMs),[40000,40000]);assert.equal(board.entries[0].playerId,p.id,'earliest tie ranks first');assert.equal(board.entries[0].time,'00:40.000');assert(board.gameName);
  const r=await req(start,{gameId:id},p.token);now+=1000;
  const partial=await req(move,{gameId:id,id:r.body.id,revision:0,action:config.base==='mermaid'?[2]:proof.slice(0,-1)},p.token);assert.equal(partial.body.revision,0,'incomplete proof never ranks');
  now+=T.LIMIT_MS;assert.equal((await req(move,{gameId:id,id:r.body.id,revision:0,action:proof},p.token)).status,410);
 }
 fixtureMode=1;const wrong=await req(start,{gameId:'mermaid-time-4'},p.token);now+=5000;assert.equal((await req(move,{gameId:'mermaid-time-4',id:wrong.body.id,revision:0,action:[1045]},p.token)).body.revision,0,'suit-count boards cannot mix');
 const old=await req(start,{gameId:'mermaid'},p.token);assert.equal(old.status,201,'legacy score board still accepts old clients');
 const feed=(await req('/api/v1/leaderboard/feed')).body.games;assert.equal(feed.filter(g=>T.IDS[g.gameId]).length,5);
 console.log('PASS five time boards through real Worker+SQLite: server-only time, full completion, ownership, invalid proofs, mode separation, retries, expiry, faster personal best, stable ties, localized API/feed, legacy round compatibility');
}finally{S.create=realCreate;M.create=realMermaidCreate;Date.now=realNow;sql.close();}
