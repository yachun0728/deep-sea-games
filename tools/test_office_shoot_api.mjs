// Real Worker handlers and all D1 migrations, backed by in-memory SQLite.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
import worker from '../backend/src/index.mjs';
import R from '../shared/office-shoot-rules.cjs';
import T from '../shared/timed-replay.cjs';
const sql=new DatabaseSync(':memory:');
for(const file of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+file,import.meta.url),'utf8'));
const DB={prepare(query){const stmt=sql.prepare(query);const bind=(...args)=>({first:async()=>stmt.get(...args)??null,run:async()=>stmt.run(...args),all:async()=>({results:stmt.all(...args)})});return {...bind(),bind};}};
const origin='http://127.0.0.1:18766';const env={DB,SITE_ORIGIN:origin,FRONTEND_ORIGIN:origin};
let now=Date.now();const nativeNow=Date.now;Date.now=()=>now;
async function req(path,body,token){const res=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}),env);return {status:res.status,body:await res.json()};}
async function round(token,collect){const ticket=await req('/api/v1/boards/rounds',{gameId:'office-shoot',rulesVersion:R.rulesVersion},token);assert.equal(ticket.status,201);const random=T.seeded(ticket.body.state.seed),s=R.create(random),actions=[];let ticks=0,prev=-1;while(!s.dead&&ticks<60000){const x=collect&&s.score<20?(s.enemies.find(e=>!e.dead)?.x??337.5):30,code=Math.round(x*10);if(code!==prev){R.input(s,code);actions.push(ticks*R.inputCount+code);prev=code;}R.advance(s,.01,random);ticks++;}assert.ok(s.dead);assert.equal(T.verify(R,ticket.body.state.seed,[ticks,...actions]),s.score);now+=ticks*10;return {score:s.score,proof:{gameId:'office-shoot',id:ticket.body.id,revision:0,action:[ticks,...actions]}};}
try{
 assert.deepEqual((await req('/api/v1/leaderboard?gameId=office-shoot')).body.entries,[]);
 const guest=await req('/api/v1/players',{}),other=await req('/api/v1/players',{});assert.equal(guest.status,201);
 assert.equal((await req('/api/v1/boards/rounds',{gameId:'office-shoot',rulesVersion:999},guest.body.token)).status,400);
 const {proof,score}=await round(guest.body.token,true);assert.ok(score>=20);
 assert.equal((await req('/api/v1/boards/rounds/move',proof,other.body.token)).status,404);
 const bad=await req('/api/v1/boards/rounds/move',{...proof,action:[proof.action[0]-1,...proof.action.slice(1)]},guest.body.token);assert.equal(bad.body.revision,0);
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,score:999999},guest.body.token)).status,400);
 const saved=await req('/api/v1/boards/rounds/move',proof,guest.body.token);assert.equal(saved.status,200);assert.equal(saved.body.state.score,score);assert.equal(saved.body.revision,1);
 assert.deepEqual(await req('/api/v1/boards/rounds/move',proof,guest.body.token),saved,'duplicate is idempotent');
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,action:[1]},guest.body.token)).status,409);
 const lower=await round(guest.body.token,false);await req('/api/v1/boards/rounds/move',lower.proof,guest.body.token);
 const board=await req('/api/v1/leaderboard?gameId=office-shoot&lang=en');assert.equal(board.body.entries[0].score,score,'lower score cannot replace best');
 const third=await req('/api/v1/players',{});
 for(const player of [other,third]){const r=await round(player.body.token,false);await req('/api/v1/boards/rounds/move',r.proof,player.body.token);}
 const tied=(await req('/api/v1/leaderboard?gameId=office-shoot')).body.entries.filter(e=>e.score===0);assert.deepEqual(tied.map(e=>e.playerId),[other.body.id,third.body.id],'earlier tied result stays first');
 const feed=await req('/api/v1/leaderboard/feed');assert.ok(JSON.stringify(feed.body).includes('office-shoot'));
 const row=sql.prepare("SELECT score FROM game_leaderboard WHERE game_id='office-shoot' AND player_id=?").get(guest.body.id);assert.equal(row.score,score);
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,action:[2,-1]},guest.body.token)).status,400);
 console.log(`PASS No Overtime Worker + SQLite: ${score} points; migrations, empty board, owner, unfinished/illegal proof, single settlement, duplicate, stale command, lower score, tie order, localized API, feed and stored row`);
}finally{Date.now=nativeNow;sql.close();}
