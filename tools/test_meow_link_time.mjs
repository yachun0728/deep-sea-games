import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../backend/src/index.mjs';
import R from '../shared/meow-link-rules.cjs';
const sql=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+f,import.meta.url),'utf8'));
const DB={prepare(q){const s=sql.prepare(q);const bind=(...a)=>({first:async()=>s.get(...a)??null,run:async()=>s.run(...a),all:async()=>({results:s.all(...a)})});return {...bind(),bind};}};
let now=Date.now();const oldNow=Date.now;Date.now=()=>now;
async function req(path,body,token){const res=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:token?{Authorization:'Bearer '+token}:{},body:body?JSON.stringify(body):undefined}),{DB});return {status:res.status,body:await res.json()};}
const start='/api/v1/boards/rounds',move=start+'/move';
const player=(await req('/api/v1/players',{})).body,other=(await req('/api/v1/players',{})).body;
async function play(p,mode,ms,pause=0,through=10){
 const gameId='meow-link-'+mode;let t=await req(start,{gameId,rulesVersion:2},p.token);assert.equal(t.status,201);
 for(let level=1;level<=through;level++){
  const plan=R.meowLinkTimedLevel(level,t.body.state.seed,mode);const proof=plan.moves.map(([a,b])=>a*1000+b);
  assert(R.verifyMeowLinkTimedLevel(level,t.body.state.seed,mode,proof));assert(!R.verifyMeowLinkTimedLevel(level,t.body.state.seed,mode,proof.slice(1)));
  let command={gameId,id:t.body.id,revision:t.body.revision,action:proof};
  assert.equal((await req(move,command,p.token)).body.revision,t.body.revision,'cannot finish before clock starts');
  now+=pause;command.action=[-1];const running=await req(move,command,p.token);assert.equal(running.body.revision,command.revision+1);assert.deepEqual(await req(move,command,p.token),running,'resume retry does not restart clock');
  now+=ms;command={...command,revision:running.body.revision,action:proof};
  assert.equal((await req(move,command,(p.id===other.id?player:other).token)).status,404);
  assert.equal((await req(move,{...command,action:Array(proof.length).fill(0)},p.token)).body.revision,command.revision);
  t=await req(move,command,p.token);assert.equal(t.status,200);assert.equal(t.body.state.elapsedMs,level*ms);assert.equal(t.body.state.completed,level);
  now+=100;assert.deepEqual(await req(move,command,p.token),t,'finish retry does not add time');
  const row=sql.prepare('SELECT score,checkpoint_score FROM ranked_boards WHERE id=?').get(t.body.id);assert.equal(row.checkpoint_score,null);assert.equal(row.score,level===10?R.MEOW_TIME_LIMIT_MS-level*ms:null,'only all ten stages can rank');
 }
 return t;
}
try{
 for(const mode of ['easy','normal','hard']){
  await play(player,mode,5000,10000);
  const board=(await req('/api/v1/leaderboard?gameId=meow-link-'+mode+'&lang=en')).body;
  assert.equal(board.entries[0].elapsedMs,50000);assert.equal(board.entries[0].time,'00:50.000');assert(board.gameName.includes('Meow Link'));
 }
 await play(player,'easy',6000);assert.equal((await req('/api/v1/leaderboard?gameId=meow-link-easy')).body.entries[0].elapsedMs,50000,'slower record cannot replace best');
 await play(player,'easy',4000);await play(other,'easy',4000);
 const entries=(await req('/api/v1/leaderboard?gameId=meow-link-easy')).body.entries;assert.deepEqual(entries.map(e=>e.elapsedMs),[40000,40000]);assert.equal(entries[0].playerId,player.id,'earlier tie wins');
 const solo=(await req('/api/v1/players',{})).body;await play(solo,'normal',4000,0,9);assert.equal(sql.prepare("SELECT count(*) n FROM game_leaderboard WHERE game_id='meow-link-normal'").get().n,1,'nine stages never rank');
 const feed=(await req('/api/v1/leaderboard/feed')).body.games;assert.equal(feed.filter(g=>g.gameId.startsWith('meow-link-')).length,3);assert(!feed.some(g=>g.gameId==='meow-link'));
 console.log('PASS: three timed boards, all 30 levels/obstacles/slides, server clock, excluded intermissions, legal proof, owner, exact once/retry, ten-stage qualification, faster best and stable ties, localized time API/feed');
}finally{Date.now=oldNow;sql.close();}
