import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
function fixture() {
  const elements = {}, storage = {}, events = [];
  function element() { return {dataset:{},children:[],disabled:false,textContent:'',innerHTML:'',addEventListener(){},setAttribute(){},appendChild(b){this.children.push(b);}}; }
  const c = {$:id=>elements[id]??=element(),document:{createElement:element},S:{balance:500},ENTRY_FEE:10,LOW_MSG:'不足',fmt:String,elBal:element(),save(){storage.balance=c.S.balance;},renderGo(){},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},AN:{start:(...a)=>{events.push(['start',...a]);return events.length;},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  vm.createContext(c);
  for(const game of ['mines','keno']) vm.runInContext(fs.readFileSync(new URL(`games/${game}/game.js`,root),'utf8'),c);
  c.buildBoard();c.renderMines();c.keBuild();c.keUI();
  return {c,storage,events,elements};
}
const {c,storage,events}=fixture();
c.S.balance=9;c.startMines();c.kePlay();assert.equal(events.length,0);assert.equal(c.S.balance,9);
c.S.balance=500;c.startMines();c.startMines();assert.equal(c.S.balance,490);assert.equal(storage.balance,490);
c.mineFlag(12);c.pick(12);assert.equal(c.M.picks,0);c.mineFlag(12);c.pick(12);assert.ok(!c.M.layout[12]);assert.equal(c.M.layout.filter(Boolean).length,3);assert.ok(c.M.picks>0);
assert.deepEqual(Array.from(c.mineNeighbors(0)),[1,5,6]);
for(let i=0;i<25;i++)if(!c.M.layout[i])c.pick(i);
assert.equal(c.M.picks,22);assert.equal(c.M.active,false);assert.equal(c.M.best,22);assert.equal(storage['deep-sea-mines-best'],'22');assert.equal(c.S.balance,490);
const ends=events.filter(e=>e[0]==='end').length;c.pick(1);c.mineFinish(true);assert.equal(events.filter(e=>e[0]==='end').length,ends);
c.startMines();c.M.ready=true;c.M.layout=[true];c.pick(0);assert.equal(c.M.active,false);assert.equal(events.at(-1)[3],'loss');
c.kePlay();c.kePlay();assert.equal(c.S.balance,470);assert.equal(c.KE.layout.filter(x=>x===3).length,2);
c.KE.layout=[3,2,1,0,0];c.keDig(0);c.keDig(0);assert.equal(c.KE.digs,1);assert.equal(c.KE.score,60);
for(let i=1;i<5;i++)c.keDig(i);
assert.equal(c.KE.score,100);assert.equal(c.KE.active,false);assert.equal(storage['deep-sea-gold-best'],'100');assert.equal(events.at(-1)[3],'complete');assert.equal(events.at(-1)[2],0);assert.equal(c.S.balance,470);
c.keDig(5);assert.equal(c.KE.digs,5);assert.equal(c.KE.score,100);
c.kePlay();c.KE.layout=Array(40).fill(0);for(let i=0;i<5;i++)c.keDig(i);assert.equal(c.KE.score,0);assert.equal(events.at(-1)[3],'complete');
assert.ok(events.filter(e=>e[0]==='end').every(e=>e[2]===0));
const reloaded=fixture();reloaded.storage['deep-sea-mines-best']=storage['deep-sea-mines-best'];reloaded.storage['deep-sea-gold-best']=storage['deep-sea-gold-best'];
// Recreate initialization with persisted records; ongoing rounds remain inactive.
reloaded.c.buildBoard();reloaded.c.keBuild();assert.equal(reloaded.c.M.best,22);assert.equal(reloaded.c.KE.best,100);assert.equal(reloaded.c.M.active,false);assert.equal(reloaded.c.KE.active,false);
// Exercise many random first clicks, including all edges and corners.
for(let i=0;i<100;i++){const f=fixture();f.c.startMines();f.c.pick(i%25);assert.ok(!f.c.M.layout[i%25]);assert.equal(f.c.M.layout.filter(Boolean).length,3);}
console.log('PASS: insufficient balance, single charge, first-click safety, flood reveal, flags, win/loss, repeat clicks, five digs, score persistence and zero payouts.');
