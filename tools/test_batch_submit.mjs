import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startRankedBoard, moveRankedBoard, readBoardCommand} from '../backend/src/services/ranked-boards.mjs';
import {startMinesRound, applyMinesMove, readMinesMove} from '../backend/src/services/mines.mjs';
const require=createRequire(import.meta.url);
const merge=require('../shared/merge-rules.cjs'), mines=require('../shared/mines-rules.cjs'), replay=require('../shared/timed-replay.cjs');

// Minimal in-memory D1 stand-in covering only the statements these services issue.
function fakeDb(){
 const boards=new Map(), rounds=new Map();
 return {boards,rounds,prepare(sql){return {bind(...a){return {
  async run(){
   if(sql.startsWith('INSERT INTO ranked_boards'))boards.set(a[0],{started_at:a[3],revision:0,last_action:null,state:a[4],score:null});
   else if(sql.startsWith('INSERT INTO mines_rounds'))rounds.set(a[0],{started_at:a[2],revision:0,last_move:null,board:a[3],score:null});
  },
  async first(){
   if(sql.startsWith('SELECT started_at, revision, last_action')){return boards.get(a[0])??null;}
   if(sql.startsWith('UPDATE ranked_boards')){const r=boards.get(a[4]);if(r.revision!==a[7]||r.score!==null)return null;Object.assign(r,{state:a[0],revision:r.revision+1,last_action:a[1],score:a[2]});return r;}
   if(sql.startsWith('SELECT started_at, revision, last_move')){return rounds.get(a[0])??null;}
   if(sql.startsWith('UPDATE mines_rounds')){const r=rounds.get(a[3]);if(r.revision!==a[5]||r.score!==null)return null;Object.assign(r,{board:a[0],revision:r.revision+1,last_move:a[1],score:a[2]});return r;}
  }};}};}};
}
const db=fakeDb();

// Merge: play locally from the seed, submit once at game over.
const round=await startRankedBoard(db,'p','merge');
const rng=replay.seeded(round.state.seed), game=merge.create(rng), acts=[];
const chooseMove=replay.seeded(2048);
for(let i=0;!game.over&&i<20000;i++){
 const directionIndex=Math.floor(chooseMove()*merge.directions.length);
 if(merge.move(game,merge.directions[directionIndex],rng))acts.push(directionIndex);
}
assert.ok(game.over,'local game ends');
assert.deepEqual(round.state.grid,merge.create(replay.seeded(round.state.seed)).grid,'client recreates the issued board');
assert.equal(await readBoardCommand(new Request('http://x',{method:'POST',body:JSON.stringify({gameId:'merge',id:'00000000-0000-4000-8000-000000000000',revision:0,action:acts})}),true)!==null,true);
const sent=await moveRankedBoard(db,'p',{gameId:'merge',id:round.id,revision:0,action:acts});
assert.equal(sent.revision,1);assert.equal(sent.state.score,game.score);
assert.equal((await moveRankedBoard(db,'p',{gameId:'merge',id:round.id,revision:0,action:acts})).revision,1,'retry is idempotent');
assert.equal((await moveRankedBoard(db,'p',{gameId:'merge',id:round.id,revision:0,action:[0]})).status,409);
const early=await startRankedBoard(db,'p','merge');
assert.equal((await moveRankedBoard(db,'p',{gameId:'merge',id:early.id,revision:0,action:acts.slice(0,5)})).revision,0,'unfinished game is not accepted');
assert.equal(db.boards.get(early.id).score,null);

// Mines: seed gives the same board locally; one submission at the end.
const mr=await startMinesRound(db,'p'), local=mines.create(5,3,replay.seeded(mr.seed)), codes=[];
for(let cell=0;cell<25;cell++)if(!local.layout[cell]&&!local.open[cell]&&mines.move(local,'open',cell)===true){codes.push(cell*2);if(local.result)break;}
assert.equal(local.result,'win');
assert.ok(await readMinesMove(new Request('http://x',{method:'POST',body:JSON.stringify({id:mr.id,revision:0,moves:codes})})));
const done=await applyMinesMove(db,'p',{id:mr.id,revision:0,moves:codes});
assert.equal(done.result,'win');assert.equal(done.revision,1);assert.equal(db.rounds.get(mr.id).score,local.picks);
assert.equal((await applyMinesMove(db,'p',{id:mr.id,revision:0,moves:codes})).revision,1,'retry is idempotent');
const mr2=await startMinesRound(db,'p'), board2=mines.create(5,3,replay.seeded(mr2.seed)), bomb=board2.layout.findIndex(Boolean);
const lost=await applyMinesMove(db,'p',{id:mr2.id,revision:0,moves:[bomb*2]});
assert.equal(lost.result,'loss');assert.equal(db.rounds.get(mr2.id).score,null);
const mr3=await startMinesRound(db,'p');
assert.equal((await applyMinesMove(db,'p',{id:mr3.id,revision:0,moves:[1]})).revision,0,'unfinished round is not accepted');
console.log('PASS: Merge and Mines send one batched submission at game end; replay, retry, stale and unfinished cases verified');
