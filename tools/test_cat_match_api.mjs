import assert from 'node:assert/strict';
import R from '../shared/cat-match-rules.cjs';
const origin=process.env.CAT_MATCH_API_ORIGIN||'http://127.0.0.1:8787';
async function request(path,body,token){const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:'http://127.0.0.1:8766',...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json()}}
const guest=await request('/api/v1/players',{});assert.equal(guest.status,201);const token=guest.body.token;
const other=await request('/api/v1/players',{});
async function start(){let r=await request('/api/v1/boards/rounds',{gameId:'cat-match',stage:1},token);assert.equal(r.status,201);return r.body}
const ticket=await start(),g=R.create(ticket.state.seed,1),actions=[];
while(!g.over){const [a,b]=R.legal(g)[g.moves%R.legal(g).length];const action=a*64+b;assert.ok(R.act(g,action));actions.push(action)}
const proof={gameId:'cat-match',id:ticket.id,revision:ticket.revision,action:actions};
let bad=await request('/api/v1/boards/rounds/move',{...proof,action:[4096,4096,4096,4096,...actions]},token);assert.equal(bad.body.revision,0);
let owner=await request('/api/v1/boards/rounds/move',proof,other.body.token);assert.equal(owner.status,404);
await new Promise(r=>setTimeout(r,actions.length*100+30));
const sent=await request('/api/v1/boards/rounds/move',proof,token);assert.equal(sent.status,200);assert.equal(sent.body.state.score,g.score);assert.equal(sent.body.revision,1);
const duplicate=await request('/api/v1/boards/rounds/move',proof,token);assert.deepEqual(duplicate,sent);
const altered=await request('/api/v1/boards/rounds/move',{...proof,action:[0]},token);assert.equal(altered.status,409);
const leaderboard=await request('/api/v1/leaderboard?gameId=cat-match');assert.equal(leaderboard.status,200);assert.equal(leaderboard.body.entries.find(e=>e.playerId===guest.body.id)?.score,g.score);
const feed=await request('/api/v1/leaderboard/feed');assert.ok(JSON.stringify(feed.body).includes('cat-match'));
const invalid=await request('/api/v1/boards/rounds',{gameId:'cat-match',stage:1000001},token);assert.equal(invalid.status,400);
console.log(`Cat Match API: score ${g.score}; D1-backed round, invalid boosters, ownership, replay, duplicate submit, stale command, leaderboard/feed verified.`);
