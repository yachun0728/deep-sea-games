import assert from 'node:assert/strict';
import R from '../shared/cat-match-rules.js';
let wins=0,losses=0,specials=0;
for(let level=1;level<=36;level++)for(let seed=1;seed<=20;seed++){
 const g=R.create(seed,level),again=R.create(seed,level);assert.deepEqual(g,again);assert.equal(g.board.filter(Boolean).length,R.MASKS[(level-1)%3].split('').filter(x=>x==='1').length);assert.equal(R.matches(g.board).length,0);let plan=[];
 for(let turn=0;turn<24&&!g.over;turn++){
  if(turn===0){assert.equal(R.act(g,R.HINT),true);plan.push(R.HINT)}
  if(turn===2){assert.equal(R.act(g,R.SHUFFLE),true);plan.push(R.SHUFFLE)}
  const moves=R.legal(g);assert.ok(moves.length);const [a,b]=moves[(seed+turn)%moves.length],frames=[];assert.equal(R.act(g,a*64+b,frames),true);plan.push(a*64+b);assert.equal(R.matches(g.board).length,0);assert.ok(R.legal(g).length);assert.ok(g.board.every((t,i)=>R.active(level,i)?t!==null:t===null));specials+=frames.filter(f=>f.special).length;
 }
 assert.ok(g.over);g.won?wins++:losses++;assert.deepEqual(R.replay(seed,level,plan),g);assert.equal(R.replay(seed,level,[...plan,0]),null);assert.equal(R.replay(seed,level,plan.slice(0,-1)),null);
}
const g=R.create(18);for(let n=0;n<3;n++)assert.ok(R.act(g,R.HINT));assert.equal(R.act(g,R.HINT),false);for(let n=0;n<2;n++)assert.ok(R.act(g,R.SHUFFLE));assert.equal(R.act(g,R.SHUFFLE),false);assert.equal(g.moves,24);const before=structuredClone(g);assert.equal(R.act(g,0),false);assert.deepEqual(g,before);
assert.equal(R.accepts(Array(30).fill(4096)),false);assert.equal(R.accepts([NaN]),false);assert.throws(()=>R.create(1,0));assert.throws(()=>R.create(1,1000001));assert.ok(specials>100);assert.ok(wins&&losses);
console.log(`Cat Match: 720 seeded rounds, ${wins} wins / ${losses} losses, ${specials} special cascades; replay, limits, stable boards, tampering passed.`);
