import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../backend/src/index.mjs';
import R from '../shared/meow-link-rules.cjs';
const sql=new DatabaseSync(':memory:');
for(const f of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+f,import.meta.url),'utf8'));
const DB={prepare(q){const s=sql.prepare(q);const bind=(...a)=>({first:async()=>s.get(...a)??null,run:async()=>s.run(...a),all:async()=>({results:s.all(...a)})});return {...bind(),bind};}};
async function req(path,body,token){const res=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:token?{Authorization:'Bearer '+token}:{},body:body?JSON.stringify(body):undefined}),{DB});return {status:res.status,body:await res.json()};}
const start='/api/v1/boards/rounds',move=start+'/move';
const guest=await req('/api/v1/players',{}),other=await req('/api/v1/players',{});
assert.equal(guest.status,201);
assert.deepEqual((await req('/api/v1/leaderboard?gameId=meow-link')).body.entries,[]);
async function play(player,stages){let ticket=await req(start,{gameId:'meow-link'},player.body.token);assert.equal(ticket.status,201);for(let level=1;level<=stages;level++){
 const deal=R.meowLinkRankedLevel(level,ticket.body.state.seed);assert.equal(new Set(deal.board.filter(x=>x>0)).size,12);
 const action=deal.moves.map(([a,b])=>a*80+b);assert.equal(action.length,24);assert(R.verifyMeowLinkLevel(level,ticket.body.state.seed,action));
 const proof={gameId:'meow-link',id:ticket.body.id,revision:ticket.body.revision,action};
 if(level===1){assert.equal((await req(move,proof,other.body.token)).status,404);const bad=await req(move,{...proof,action:Array(24).fill(0)},player.body.token);assert.equal(bad.body.revision,0);assert.equal((await req(move,{...proof,action:[-1]},player.body.token)).status,400);}
 const next=await req(move,proof,player.body.token);assert.equal(next.status,200);assert.equal(next.body.revision,proof.revision+1);assert.equal(next.body.state.completed,level);assert.deepEqual(await req(move,proof,player.body.token),next,'duplicate proof is idempotent');ticket=next;
}return ticket;}
await play(guest,10);await play(guest,1);
const third=await req('/api/v1/players',{});await play(third,10);
const board=(await req('/api/v1/leaderboard?gameId=meow-link&lang=en')).body;assert.equal(board.gameName,'Meow Link');assert.deepEqual(board.entries.map(e=>e.score),[10,10]);assert.equal(board.entries[0].playerId,guest.body.id,'first tie wins and lower score cannot replace best');
assert.equal(sql.prepare("SELECT score FROM game_leaderboard WHERE game_id='meow-link' AND player_id=?").get(guest.body.id).score,10);
assert(!JSON.stringify((await req('/api/v1/leaderboard/feed')).body).includes('meow-link'),'legacy count records do not enter timed feed');
assert.equal(sql.prepare("SELECT count(*) n FROM game_leaderboard WHERE game_id='ocean-link'").get().n,0);
console.log('PASS Meow Link: real Worker + SQLite migrations, ten stages, 12-symbol pool, illegal proof, owner, duplicate, lower score, tie order, API/feed, isolated Ocean Link records');sql.close();
