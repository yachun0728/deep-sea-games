// Optional behavior checks: node tools/test_mermaid.mjs (Node.js, no packages).
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=readSource('games/mermaid/game.js',root);
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();layoutIdle();';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__mm={start:start,ev:code=>{const r=eval(code);return r===undefined?undefined:JSON.parse(JSON.stringify(r))}};'+hookAt);
function seeded(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
export function fixture(balance=500,seed=7){
  const elements=new Map(),storage=new Map(),events=[];
  function stub(id){return{id,hidden:false,textContent:'',className:'',innerHTML:'',dataset:{},style:{setProperty(){}},clientWidth:358,disabled:false,value:'',offsetWidth:1,children:[],handlers:{},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(c){return c},remove(){},addEventListener(t,f){this.handlers[t]=f},setAttribute(){},getAttribute(){return null},
    querySelector(){return stub('q')},querySelectorAll(){return id==='mm-slots'?Array.from({length:8},()=>stub('slot')):[]},getBoundingClientRect(){return{left:0,top:0,width:44,height:58}},setPointerCapture(){},closest(){return null}}}
  const el=id=>{if(!elements.has(id))elements.set(id,stub(id));return elements.get(id)};
  const math=Object.create(Math);math.random=seeded(seed);
  const sandbox={document:{hidden:false,createElement:()=>stub('new'),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},addEventListener(){},Number,Math:math,String,JSON,Set,Map,Array,Object,encodeURIComponent,
    performance:{now:()=>1e9},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
    $:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',S:{balance},save(){},renderAll(){},fmt:n=>String(n),
    AN:{start:(...a)=>{events.push(['start',...a]);return 'round'},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__mm;
  return{F,el,events,wallet:sandbox.S,storage,ev:F.ev,busy:()=>vm.runInContext('mmBusy',ctx),count:t=>events.filter(e=>e[0]===t).length};
}
const card=(id,suit,rank)=>`{id:${id},suit:${suit},rank:${rank}}`;
// Replace the table with: column 0 holds K..2 of suit 3 (face up), column 1 holds the ace; every other column has one filler card.
function setupRun(f,{done=0}={}){
  const K=Array.from({length:12},(_,i)=>card(100+i,3,13-i)).join(',');
  f.ev(`G.cols=[{cards:[${K}],hidden:0},{cards:[${card(120,3,1)}],hidden:0}].concat(Array.from({length:8},(_,i)=>({cards:[${card(200,2,5)}],hidden:0})));G.stock=[];G.done=${done};G.doneSuits=Array(${done}).fill(3);maxDone=${done};`);
}
const results=[];
function check(name,fn){fn();results.push(name)}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Not enough points: nothing is deducted and no round starts',()=>{
  const f=fixture(fee-1);f.F.start();assert.equal(f.wallet.balance,fee-1);assert.equal(f.busy(),false);assert.equal(f.count('start'),0)});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.busy(),true);assert.deepEqual(f.events[0].slice(1),['mermaid',fee])});
check('Deal setup: 104 cards, 54 on the table, 50 in the deck, only top cards face up',()=>{
  for(const mode of [1,2,4]){const f=fixture();f.ev(`mode=${mode}`);f.F.start();
    assert.equal(f.ev('G.cols.reduce((n,c)=>n+c.cards.length,0)'),54);assert.equal(f.ev('G.stock.length'),50);
    assert.deepEqual(f.ev('G.cols.map(c=>c.cards.length)'),[6,6,6,6,5,5,5,5,5,5]);
    assert.ok(f.ev('G.cols.every(c=>c.hidden===c.cards.length-1)'));
    const suits=new Set(f.ev('G.cols.concat([{cards:G.stock}]).flatMap(c=>c.cards.map(x=>x.suit))'));assert.equal(suits.size,mode);
    assert.equal(f.ev('new Set(G.cols.concat([{cards:G.stock}]).flatMap(c=>c.cards.map(x=>x.id))).size'),104)}});
check('Move rules: needs rank+1 on the target; only same-suit descending runs move together',()=>{
  const f=fixture();f.F.start();
  f.ev(`G.cols[0]={cards:[${card(1,0,9)},${card(2,0,8)},${card(3,1,7)}],hidden:0};G.cols[1]={cards:[${card(4,2,10)}],hidden:0};G.cols[2]={cards:[${card(5,2,9)}],hidden:0}`);
  assert.equal(f.ev('canDrop(G,0,2,1)'),false,'7 cannot go onto 10');assert.equal(f.ev('canDrop(G,0,1,1)'),false,'8,7 are mixed suits so they cannot move together');
  assert.equal(f.ev('canDrop(G,0,0,1)'),false);assert.equal(f.ev('canDrop(G,2,0,1)'),true,'9 goes onto 10');assert.equal(f.ev('canDrop(G,0,2,2)'),false,'7 cannot go onto 9')});
check('Deal needs every column filled, adds one card per column and takes one move',()=>{
  const f=fixture();f.F.start();f.ev('G.cols[3].cards=[];G.cols[3].hidden=0');assert.equal(f.ev('canDeal(G)'),false);
  const f2=fixture();f2.F.start();f2.ev('deal(G)');assert.equal(f2.ev('G.stock.length'),40);assert.equal(f2.ev('G.cols.reduce((n,c)=>n+c.cards.length,0)'),64);assert.equal(f2.ev('G.moves'),1)});
check('A finished K to A run is collected and pays exactly +1 point once',()=>{
  const f=fixture();f.F.start();setupRun(f);const before=f.wallet.balance;
  f.ev('doMove(1,0,0)');assert.equal(f.ev('G.done'),1);assert.equal(f.ev('G.cols[0].cards.length'),0);assert.equal(f.wallet.balance,before+1);assert.equal(f.count('progress'),1);
  assert.equal(f.events.find(e=>e[0]==='progress')[2].bonus_points,1)});
check('Undo then re-collecting the same pearl does not pay twice',()=>{
  const f=fixture();f.F.start();setupRun(f);f.ev('doMove(1,0,0)');const paid=f.wallet.balance;
  f.ev('undo(G)');assert.equal(f.ev('G.done'),0);f.ev('doMove(1,0,0)');assert.equal(f.ev('G.done'),1);assert.equal(f.wallet.balance,paid);assert.equal(f.count('progress'),1)});
check('Shallows win pays +1 for the last pearl and ends once as complete, no clear bonus',()=>{
  const f=fixture();f.ev('mode=1');f.F.start();setupRun(f,{done:7});const before=f.wallet.balance;
  f.ev('doMove(1,0,0)');assert.equal(f.wallet.balance,before+1);assert.equal(f.count('end'),1);assert.equal(f.events.find(e=>e[0]==='end')[3],'complete');assert.equal(f.busy(),false)});
check('Coral Reef and Deep Sea win add the +2 clear bonus once (total +3 for the last pearl)',()=>{
  for(const mode of [2,4]){const f=fixture();f.ev(`mode=${mode}`);f.F.start();setupRun(f,{done:7});const before=f.wallet.balance;
    f.ev('doMove(1,0,0)');assert.equal(f.wallet.balance,before+3);assert.equal(f.count('end'),1);assert.equal(f.count('progress'),2);
    f.ev('afterAction()');assert.equal(f.wallet.balance,before+3,'a second call must not pay again')}});
check('Giving up needs two presses, ends once with no refund and releases the busy flag',()=>{
  const f=fixture();f.F.start();const q=f.el('mm-quit');q.handlers.click();assert.equal(f.count('end'),0);q.handlers.click();q.handlers.click();
  assert.equal(f.count('end'),1);assert.equal(f.wallet.balance,500-fee);assert.equal(f.busy(),false);assert.deepEqual(f.events.find(e=>e[0]==='end').slice(2,4),[0,'loss'])});
check('Hint always suggests a legal move',()=>{
  for(let seed=1;seed<=30;seed++){const f=fixture(500,seed);f.ev('mode=2');f.F.start();const h=f.ev('findHint(G)');
    if(h)assert.equal(f.ev(`canDrop(G,${h.from},${h.idx},${h.to})`),true)}});
check('Random play never breaks invariants (104 cards, no negative balance, <=8 runs)',()=>{
  for(let seed=1;seed<=20;seed++){const f=fixture(500,seed);f.ev('mode=1');f.F.start();
    for(let step=0;step<300&&f.busy();step++){
      const mv=f.ev('allMoves(G)');
      if(f.ev('canDeal(G)')&&(!mv.length||step%7===0))f.ev('(function(){deal(G);afterAction()})()');
      else if(mv.length){const m=mv[step%mv.length];f.ev(`doMove(${m.from},${m.idx},${m.to})`)}else break;
      const total=f.ev('G.cols.reduce((n,c)=>n+c.cards.length,0)+G.stock.length+G.done*13');assert.equal(total,104);}
    assert.ok(f.wallet.balance>=0);assert.ok(f.ev('G.done')<=8)}});
console.log(results.map(r=>'ok - '+r).join('\n'));
}
