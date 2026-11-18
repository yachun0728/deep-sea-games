// Optional behavior checks: node tools/test_clock_out.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/clock-out/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='resetGame();ui();draw();requestAnimationFrame(frame);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__co={begin,update,draw,ui,handleTap,ev:code=>eval(code)};'+hookAt);
const results=[];
function fixture(balance=500,savedBest=null){
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-clock-out-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>({width:10}),set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math,String,parseInt,performance:{now:()=>1000},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const C=sandbox.__co;
  return {C,el,events,storage,wallet:sandbox.S,ev:C.ev,busy:()=>vm.runInContext('clockBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},
    count:t=>events.filter(e=>e[0]===t).length,
    // Jump to the moment a wave has just been cleared, then let the game run its own clear handler.
    clear(w){C.ev('G.wi='+(w-1)+";G.state='WAVE'");C.ev('waveClear()');}};
}
function check(name,fn){fn();results.push(name);}
check('Free entry: a zero balance can start a round and nothing is deducted',()=>{
  const f=fixture(0);f.C.begin();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.C.begin();f.C.begin();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.deepEqual(f.events[0].slice(1),['clock-out',fee]);assert.equal(f.ev('G.state'),'BUILD');
});
check('Tapping the title screen never starts a round or touches the wallet',()=>{
  const f=fixture();f.C.handleTap(200,300);assert.equal(f.ev('G.state'),'TITLE');assert.equal(f.wallet.balance,500);assert.equal(f.count('start'),0);
});
check('Wave 5 clear pays 3 immediately, once, and wave 8 clear pays 7 once',()=>{
  const f=fixture();f.C.begin();
  f.clear(4);assert.equal(f.wallet.balance,500-fee);
  f.clear(5);assert.equal(f.wallet.balance,500-fee+3);
  f.clear(5);assert.equal(f.wallet.balance,500-fee+3);
  const p=f.events.filter(e=>e[0]==='progress');assert.equal(p.length,1);assert.equal(p[0][2].bonus_points,3);assert.equal(p[0][2].total_bonus_points,3);
  assert.equal(f.count('end'),0);assert.equal(f.busy(),true);
  f.clear(8);assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.ev('G.state'),'WIN');assert.equal(f.count('end'),1);assert.equal(f.busy(),false);
  const e=f.events.find(x=>x[0]==='end');assert.equal(e[2],10);assert.equal(e[3],'complete');
});
check('Dying after wave 5 keeps the 3 points; dying before pays nothing; end fires once',()=>{
  let f=fixture();f.C.begin();f.clear(5);f.C.ev("gameOver('san')");f.C.ev("gameOver('san')");
  assert.equal(f.wallet.balance,500-fee+3);assert.equal(f.count('end'),1);assert.equal(f.events.find(x=>x[0]==='end')[2],3);assert.equal(f.busy(),false);
  f=fixture();f.C.begin();f.C.ev("gameOver('san')");assert.equal(f.wallet.balance,500-fee);assert.equal(f.events.find(x=>x[0]==='end')[3],'loss');
});
check('Boss reaching the desk ends the round as a loss',()=>{
  const f=fixture();f.C.begin();f.C.ev("gameOver('boss')");assert.equal(f.ev('G.state'),'GAMEOVER');assert.equal(f.ev('G.endReason'),'boss');assert.equal(f.wallet.balance,500-fee);
});
check('A cleared wave outside a paid round gives nothing',()=>{
  const f=fixture();f.clear(5);assert.equal(f.wallet.balance,500);assert.equal(f.count('progress'),0);
});
check('A second round pays its own BONUS again and is still free',()=>{
  const f=fixture();f.C.begin();f.clear(5);f.clear(8);f.C.ev('resetGame()');f.C.begin();
  assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.count('start'),2);f.clear(5);assert.equal(f.wallet.balance,500-fee+13);
});
check('Best score is saved only when beaten and never touches the wallet',()=>{
  const f=fixture(500,100);f.C.begin();f.C.ev('G.killScore=50;G.waveScoreTotal=30');f.C.ev("gameOver('san')");assert.equal(f.storage.get('deep-sea-clock-out-best'),'100');
  const g=fixture(500,10);g.C.begin();g.C.ev('G.killScore=50;G.waveScoreTotal=30');g.C.ev("gameOver('san')");assert.equal(g.storage.get('deep-sea-clock-out-best'),'80');
});
check('Keys only work while the clock-out view is shown',()=>{
  const f=fixture();f.C.begin();f.ev('G.state="BUILD"');
  const e=()=>({key:'Enter',target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  f.el('view-clock-out').hidden=true;let k=e();f.key(k);assert.equal(k.done,undefined);
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.C.draw();f.C.begin();f.C.draw();f.C.ev("G.state='WIN';G.endTimer=1");f.C.draw();f.C.ev("G.state='GAMEOVER';G.endTimer=1");f.C.draw();
});
console.log(results.length+' clock-out checks passed');
