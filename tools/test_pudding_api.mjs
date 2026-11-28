// Real Worker handlers and all D1 migrations, backed by in-memory SQLite.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
import worker from '../backend/src/index.mjs';
import R from '../shared/pudding-rules.cjs';
import T from '../shared/timed-replay.cjs';
const sql=new DatabaseSync(':memory:');
for(const file of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+file,import.meta.url),'utf8'));
const DB={prepare(query){const stmt=sql.prepare(query);const bind=(...args)=>({first:async()=>stmt.get(...args)??null,run:async()=>stmt.run(...args),all:async()=>({results:stmt.all(...args)})});return {...bind(),bind};}};
const origin='http://127.0.0.1:18766';const env={DB,SITE_ORIGIN:origin,FRONTEND_ORIGIN:origin};
let now=Date.now();const nativeNow=Date.now;Date.now=()=>now;
async function req(path,body,token){const res=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}),env);return {status:res.status,body:await res.json()};}
function strategy(g){
 if(g.ph==='forge'&&g.fPhase==='edit'){
 let best=null;for(let i=0;i<g.cards.length;i++){let c=g.cards[i].cells;for(let r=0;r<4;r++){const d=g.dims(c);for(let y=0;y<=4-d.h;y++)for(let x=0;x<=4-d.w;x++){const grid=g.grid.map(a=>a.slice());for(const [dx,dy] of c)grid[y+dy][x+dx]=g.cards[i].type;const s=g.computeStats(grid),v=Math.sqrt(s.E.b)*2+Math.sqrt(s.E.m)*3+Math.sqrt(s.E.d)*1.4;if(!best||v>best.v)best={v,i,r,x,y};}c=g.rotateCells(c);}}
 return [4010+best.i,...Array(best.r).fill(4036),4020+best.x+best.y*4,4037];
 }
 if(g.ph==='run'&&g.sub==='play'){const e=g.enemies.filter(e=>e.y>150).sort((a,b)=>b.y-a.y)[0];return [Math.round((e?e.x:200)*10)];}return [];
}
async function round(token,collect){const ticket=await req('/api/v1/boards/rounds',{gameId:'pudding',rulesVersion:R.rulesVersion},token);assert.equal(ticket.status,201);
 // Stable fixture seeds make ties and lower scores reproducible; production tickets remain random.
 ticket.body.state.seed=42;sql.prepare("UPDATE ranked_boards SET state=json_set(state,'$.seed',42) WHERE id=?").run(ticket.body.id);
 const random=T.seeded(42),g=R.create(random),actions=[];let ticks=0,prev=-1;
 while(!g.dead&&ticks<60000){const codes=collect?strategy(g):(g.ph==='forge'&&g.fPhase==='edit'?[4038]:[]);for(const code of codes){if(code<=4000&&code===prev)continue;R.input(g,code);actions.push(ticks*R.inputCount+code);prev=code;}R.advance(g,.01,random);ticks++;}
 assert.ok(g.dead);assert.equal(T.verify(R,42,[ticks,...actions]),g.score);if(collect)assert.equal(g.why,'win');now+=ticks*10;return {score:g.score,proof:{gameId:'pudding',id:ticket.body.id,revision:0,action:[ticks,...actions]}};}
try{
 assert.deepEqual((await req('/api/v1/leaderboard?gameId=pudding')).body.entries,[]);
 const guest=await req('/api/v1/players',{}),other=await req('/api/v1/players',{});assert.equal(guest.status,201);
 assert.equal((await req('/api/v1/boards/rounds',{gameId:'pudding',rulesVersion:999},guest.body.token)).status,400);
 const {proof,score}=await round(guest.body.token,true);assert.ok(score>2000);
 assert.equal((await req('/api/v1/boards/rounds/move',proof,other.body.token)).status,404);
 const bad=await req('/api/v1/boards/rounds/move',{...proof,action:[proof.action[0]-1,...proof.action.slice(1)]},guest.body.token);assert.equal(bad.body.revision,0);
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,score:999999},guest.body.token)).status,400);
 const settledNow=now;now-=proof.action[0]*10;const fast=await req('/api/v1/boards/rounds/move',proof,guest.body.token);assert.equal(fast.body.revision,0,'too fast');now=settledNow;
 const saved=await req('/api/v1/boards/rounds/move',proof,guest.body.token);assert.equal(saved.status,200);assert.equal(saved.body.state.score,score);assert.equal(saved.body.revision,1);
 assert.deepEqual(await req('/api/v1/boards/rounds/move',proof,guest.body.token),saved,'duplicate is idempotent');
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,action:[1]},guest.body.token)).status,409);
 const lower=await round(guest.body.token,false);await req('/api/v1/boards/rounds/move',lower.proof,guest.body.token);
 const board=await req('/api/v1/leaderboard?gameId=pudding&lang=en');assert.equal(board.body.entries[0].score,score,'lower score cannot replace best');
 const third=await req('/api/v1/players',{});
 for(const player of [other,third]){const r=await round(player.body.token,false);await req('/api/v1/boards/rounds/move',r.proof,player.body.token);}
 const tied=(await req('/api/v1/leaderboard?gameId=pudding')).body.entries.filter(e=>e.score===lower.score);assert.deepEqual(tied.map(e=>e.playerId),[other.body.id,third.body.id],'earlier tied result stays first');
 const feed=await req('/api/v1/leaderboard/feed');assert.ok(JSON.stringify(feed.body).includes('pudding'));
 const row=sql.prepare("SELECT score FROM game_leaderboard WHERE game_id='pudding' AND player_id=?").get(guest.body.id);assert.equal(row.score,score);
 assert.equal((await req('/api/v1/boards/rounds/move',{...proof,action:[2,-1]},guest.body.token)).status,400);
 const expired=await round(guest.body.token,false);now+=2*60*60*1000+1;assert.equal((await req('/api/v1/boards/rounds/move',expired.proof,guest.body.token)).status,410);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM player_best_scores').get().n,0);
 console.log(`PASS Pudding Dash Worker + SQLite: ${score} points; migrations, empty board, owner, unfinished/illegal proof, single settlement, duplicate, stale command, lower score, tie order, localized API, feed and stored row`);
}finally{Date.now=nativeNow;sql.close();}
