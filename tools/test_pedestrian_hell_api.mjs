// Real Worker handlers and all D1 migrations, backed by in-memory SQLite.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
import worker from '../backend/src/index.mjs';
import R from '../shared/pedestrian-hell-rules.cjs';
import V1 from '../shared/pedestrian-hell-rules-v1.cjs';
import V2 from '../shared/pedestrian-hell-rules-v2.cjs';
import V3 from '../shared/pedestrian-hell-rules-v3.cjs';
import T from '../shared/timed-replay.cjs';
const sql=new DatabaseSync(':memory:');
for(const file of readdirSync(new URL('../backend/migrations/',import.meta.url)).sort())sql.exec(readFileSync(new URL('../backend/migrations/'+file,import.meta.url),'utf8'));
const DB={prepare(query){const stmt=sql.prepare(query);const bind=(...args)=>({first:async()=>stmt.get(...args)??null,run:async()=>stmt.run(...args),all:async()=>({results:stmt.all(...args)})});return {...bind(),bind};}};
const origin='http://127.0.0.1:18766';const env={DB,SITE_ORIGIN:origin,FRONTEND_ORIGIN:origin};
let now=Date.now();const nativeNow=Date.now;Date.now=()=>now;
async function req(path,body,token){const res=await worker.fetch(new Request('http://localhost'+path,{method:body?'POST':'GET',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}),env);return {status:res.status,body:await res.json()};}
function path(s){const q=[[s.P.c,s.P.r,null]],seen=new Set([s.P.c+','+s.P.r]);while(q.length){const [c,r,f]=q.shift();if(r>=R.GOAL)return f;R.DIRS.forEach(([dc,dr],code)=>{const x=c+dc,y=r+dr,k=x+','+y;if(x<0||x>4||y<0||!s.rows[y]||(s.rows[y][x]&&!s.rows[y][x].tight)||seen.has(k)||(dc&&(s.rows[y][x]?.tight||s.rows[r][c]?.tight)))return;seen.add(k);q.push([x,y,f??code]);});}return null;}
// careful player until it owns `target` cups, then walks without looking until the round ends
function play(seed,target,E=R){
  const random=T.seeded(seed),s=E.create(random),moves=[];let ticks=0,wait=0;
  const press=code=>{if(E.input(s,code))moves.push(ticks*E.inputCount+code);};
  while(!s.dead&&ticks<T.MAX_TICKS){
    wait-=.01;
    if(s.rest<=0&&s.P.k>=1&&wait<=0){
      const code=path(s);
      if(code!==null){
        if(E.SIDE_ON!==undefined){const [dc,dr]=R.DIRS[code],need=!!(s.rows[s.P.r+dr]?.[s.P.c+dc]?.tight);if(need!==!!s.side)press(need?E.SIDE_ON:E.SIDE_OFF);}
        if(s.cups>=target)press(code),wait=.13;
        else{
          const danger=(row,a,b)=>s.cars.some(v=>v.lane===4&&v.y-v.v*b<row+.75&&v.y-v.v*a+v.len>row+.2);
          const hit=(x,y)=>(x>=3&&s.cars.some(v=>v.lane===x&&v.y-v.v*.32<y+.75&&v.y+v.len>y+.2))||s.reversers.some(q=>q.state==='warn'&&q.c-1===x&&q.r===y);
          const beside=y=>s.rows[y]?.[3]?.kind==='parked';
          const [dc,dr]=R.DIRS[code],c=s.P.c+dc,r=s.P.r+dr;let open=true;
          if(c===4&&beside(r)&&!(s.P.c===4&&beside(s.P.r))){let y=r,n=0;for(;beside(y)||n===0;y++,n++)if(danger(y,Math.max(0,n*.22-.15),n*.22+.37))open=false;if(danger(y,n*.22,n*.22+.4))open=false;}
          if(open&&!hit(c,r)){press(code);wait=(c===4&&beside(r))||(s.P.c===4&&beside(s.P.r))?.22:.13;}
          else if(hit(s.P.c,s.P.r))for(const d of [0,3,2,1]){const x=s.P.c+R.DIRS[d][0],y=s.P.r+R.DIRS[d][1];if(x>=0&&x<5&&s.rows[y]&&!s.rows[y][x]&&!hit(x,y)){press(d);wait=.13;break;}}
        }
      }
    }
    E.advance(s,.01,random);s.events.length=0;ticks++;
  }
  assert.ok(s.dead,'round ends inside the replay limit');
  return {cups:s.cups,cause:s.cause,ticks,moves};
}
// the new page reports rulesVersion; a page still open from the first release sends none and must use the frozen rules
async function round(token,target,E=R){
  const ticket=await req('/api/v1/boards/rounds',E===V1?{gameId:'pedestrian-hell'}:{gameId:'pedestrian-hell',rulesVersion:E.rulesVersion},token);assert.equal(ticket.status,201);
  const run=play(ticket.body.state.seed,target,E),action=[run.ticks,...run.moves];
  assert.equal(T.verify(E,ticket.body.state.seed,action),run.cups);now+=run.ticks*10;
  return {...run,seed:ticket.body.state.seed,proof:{gameId:'pedestrian-hell',id:ticket.body.id,revision:0,action}};
}
const send=(p,token)=>req('/api/v1/boards/rounds/move',p,token);
try{
  assert.deepEqual((await req('/api/v1/leaderboard?gameId=pedestrian-hell')).body.entries,[]);
  const guest=await req('/api/v1/players',{}),other=await req('/api/v1/players',{}),third=await req('/api/v1/players',{});assert.equal(guest.status,201);
  const first=await round(guest.body.token,2);assert.ok(first.cups>=2,'collects cups across streets: '+first.cups);
  assert.equal((await send(first.proof,other.body.token)).status,404,'other guest cannot submit');
  const short=await send({...first.proof,action:[first.proof.action[0]-1,...first.proof.action.slice(1).filter(m=>Math.floor(m/R.inputCount)<first.proof.action[0]-1)]},guest.body.token);assert.equal(short.body.revision,0,'unfinished proof rejected');
  const saved=await send(first.proof,guest.body.token);assert.equal(saved.status,200);assert.equal(saved.body.state.score,first.cups);assert.equal(saved.body.revision,1);
  assert.deepEqual(await send(first.proof,guest.body.token),saved,'duplicate is idempotent');
  assert.equal((await send({...first.proof,action:[1]},guest.body.token)).status,409);
  const lower=await round(guest.body.token,0);await send(lower.proof,guest.body.token);
  const board=await req('/api/v1/leaderboard?gameId=pedestrian-hell&lang=en');assert.equal(board.body.gameName,'Just Want Boba');assert.equal(board.body.entries[0].score,first.cups,'lower score cannot replace best');
  const a=await round(other.body.token,0);await send(a.proof,other.body.token);const b=await round(third.body.token,0);await send(b.proof,third.body.token);
  const tied=(await req('/api/v1/leaderboard?gameId=pedestrian-hell')).body.entries.filter(e=>e.score===a.cups&&e.playerId!==guest.body.id);
  if(a.cups===b.cups)assert.deepEqual(tied.map(e=>e.playerId),[other.body.id,third.body.id],'earlier tied result stays first');
  assert.ok(JSON.stringify((await req('/api/v1/leaderboard/feed')).body).includes('pedestrian-hell'));
  assert.equal(sql.prepare("SELECT score FROM game_leaderboard WHERE game_id='pedestrian-hell' AND player_id=?").get(guest.body.id).score,first.cups);
  assert.equal((await send({...first.proof,action:[2,-1]},guest.body.token)).status,400);
  assert.equal((await req('/api/v1/boards/rounds',{gameId:'pedestrian-hell',rulesVersion:99},guest.body.token)).status,400,'unknown rules version');
  const older=[];
  for(const E of [V1,V2,V3]){
    const token=(await req('/api/v1/players',{})).body.token,old=await round(token,2,E);
    const done=await send(old.proof,token);assert.equal(done.status,200);assert.equal(done.body.state.score,old.cups,'older page still settles');
    assert.ok(old.cups>=2,'older round crossed streets: '+old.cups);older.push(old.cups);
  }
  assert.equal(R.rulesVersion,4);
  assert.equal(R.inputCount,6);
  // the longest possible round (until the shop closes) must still submit, and its replay cost is measured
  const long=await round((await req('/api/v1/players',{})).body.token,999);
  const t0=process.hrtime.bigint();T.verify(R,long.seed,long.proof.action);const ms=Number(process.hrtime.bigint()-t0)/1e6;
  console.log(`PASS Just Want Boba Worker + SQLite: ${first.cups} cups saved; empty board, owner, unfinished/illegal proof, single settlement, duplicate, stale command, lower score, tie order, localized API, feed, stored row, rules v4 plus v1, v2 and v3 pages (${older.join(', ')} cups)`);
  console.log(`longest round: ${long.cups} cups, ${long.ticks/100}s, ${long.moves.length} inputs, cause ${long.cause}, replay ${ms.toFixed(0)} ms on this Mac, body ${JSON.stringify(long.proof).length} bytes`);
}finally{Date.now=nativeNow;sql.close();}
