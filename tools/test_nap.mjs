// Optional behavior checks: node tools/test_nap.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/nap/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw(0);requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__nap={start,update:dt=>{const input={sleep:sleepHeld(),throwEdge:false};G.update(dt,input);handleEvents()},ev:code=>eval(code)};'+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-nap-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__nap;
  return {F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('napBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},
    count:type=>events.filter(e=>e[0]===type).length};
}

function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Not enough points: nothing is deducted and no round starts',()=>{
  const f=fixture(fee-1);f.F.start();assert.equal(f.wallet.balance,fee-1);assert.equal(f.busy(),false);assert.equal(f.count('start'),0);
});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.deepEqual(f.events[0].slice(1),['nap',fee]);
});
check('Clearing a level credits exactly 1 point once',()=>{
  const f=fixture();f.F.start();f.F.update(2);f.ev('G.sleepVal=G.L.goal');f.F.update(.016);
  assert.equal(f.wallet.balance,500-fee+1);assert.equal(f.count('progress'),1);f.F.update(.016);assert.equal(f.wallet.balance,500-fee+1);assert.equal(f.count('progress'),1);
});
check('Getting caught three times ends the round once, with no refund',()=>{
  const f=fixture();f.F.start();f.F.update(2);
  for(let i=0;i<3;i++){f.ev("G.boss.state='WATCH';G.boss.timer=2;G.boss.caught=false;G.pose='SLEEP';G.caughtLock=0");f.ev("G.update(.016,{sleep:true,throwEdge:false});handleEvents()")}
  f.F.update(.05);assert.equal(f.count('end'),1);assert.equal(f.wallet.balance,500-fee);assert.equal(f.busy(),false);
  assert.deepEqual(f.events.find(e=>e[0]==='end').slice(2,4),[0,'loss']);
});
check('Clearing all 10 levels credits 10 points and ends once as complete',()=>{
  const f=fixture();f.F.start();
  for(let lv=1;lv<=10;lv++){f.F.update(2);f.ev('G.sleepVal=G.L.goal');f.F.update(.016);for(let i=0;i<40;i++)f.F.update(.05)}
  assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.count('end'),1);assert.equal(f.events.find(e=>e[0]==='end')[3],'complete');assert.equal(f.busy(),false);
});
check('Best score is stored under its own key',()=>{
  const f=fixture(500,0);f.F.start();f.F.update(2);f.ev('G.sleepVal=G.L.goal');f.F.update(.016);for(let i=0;i<80;i++)f.F.update(.05);
  f.ev("G.hearts=1;G.boss.state='WATCH';G.boss.timer=2;G.boss.caught=false;G.pose='SLEEP';G.caughtLock=0;G.update(.016,{sleep:true,throwEdge:false});handleEvents()");
  assert.ok(Number(f.storage.get('deep-sea-nap-best'))>0);
});
check('Space only works while the nap view is shown and a round is running',()=>{
  const f=fixture();const e=()=>({key:' ',repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true}});
  let k=e();f.key(k);assert.equal(k.done,undefined);
  f.F.start();f.el('view-nap').hidden=true;k=e();f.key(k);assert.equal(k.done,undefined);
  f.el('view-nap').hidden=false;k=e();f.key(k);assert.equal(k.done,true);
});
console.log(results.length+' nap checks passed');
}
