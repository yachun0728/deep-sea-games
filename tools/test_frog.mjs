// Optional behavior checks: node tools/test_frog.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/frog/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw();requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__frog={press,update,start,draw,ev:code=>eval(code)};'+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-frog-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__frog;
  return {F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('frogBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},
    // Put the aim exactly on the bottom bug, clear the input lock, then press.
    eat(){F.ev('aimY=TY;lock=0');F.press();},
    count:type=>events.filter(e=>e[0]===type).length};
}
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Not enough points: nothing is deducted and no round starts',()=>{
  const f=fixture(fee-1);f.F.start();assert.equal(f.wallet.balance,fee-1);assert.equal(f.busy(),false);assert.equal(f.count('start'),0);
});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.deepEqual(f.events[0].slice(1),['frog',fee]);
});
check('Pressing before a round starts does nothing',()=>{
  const f=fixture();f.eat();assert.equal(f.ev('eaten'),0);assert.equal(f.wallet.balance,500);
});
check('A centred press eats the bottom bug; the stack stays at 8 and fullness is capped',()=>{
  const f=fixture();f.F.start();f.eat();assert.equal(f.ev('eaten'),1);assert.equal(f.ev('bugs.length'),8);assert.equal(f.ev('food'),100);assert.equal(f.ev('pts'),20);assert.equal(f.ev('combo'),1);
});
check('Edge of the hit window counts as a normal eat, one pixel further is a miss',()=>{
  const f=fixture();f.F.start();f.F.ev('aimY=TY+HIT;lock=0');f.F.press();assert.equal(f.ev('eaten'),1);assert.equal(f.ev('pts'),10);
  f.F.ev('aimY=TY-HIT-1;lock=0');f.F.press();assert.equal(f.ev('eaten'),1);assert.equal(f.ev('combo'),0);assert.equal(f.ev('hearts'),3);assert.equal(f.ev('lock'),.35);
});
check('Input is ignored while locked after a miss',()=>{
  const f=fixture();f.F.start();f.F.ev('aimY=AIM_TOP;lock=0');f.F.press();f.F.ev('aimY=TY');f.F.press();assert.equal(f.ev('eaten'),0);
});
check('Combo multiplier uses the combo before the eat: x2 from the 6th, x3 from the 16th',()=>{
  const f=fixture();f.F.start();let prev=0;const gains=[];for(let i=0;i<16;i++){f.F.ev('food=100');f.eat();gains.push(f.ev('pts')-prev);prev=f.ev('pts');}
  assert.equal(gains[4],20);assert.equal(gains[5],40);assert.equal(gains[14],40);assert.equal(gains[15],60);
});
check('Eating a red bug costs one heart, keeps the bug and calms it; a warning bug gives +5',()=>{
  const f=fixture();f.F.start();f.F.ev("bugs[0].angry=true;bugs[0].live=true;bugs[0].state='attack';bugs[0].t=1");f.eat();
  assert.equal(f.ev('hearts'),2);assert.equal(f.ev('eaten'),0);assert.equal(f.ev('bugs[0].state'),'calm');assert.equal(f.ev('lock'),.6);
  f.F.ev("bugs[0].state='warn';bugs[0].t=.5");f.eat();assert.equal(f.ev('eaten'),1);assert.equal(f.ev('pts'),25);
});
check('Three stings end the round once as a loss with no payout',()=>{
  const f=fixture();f.F.start();for(let i=0;i<5;i++){f.F.ev("bugs[0].angry=true;bugs[0].state='attack';bugs[0].t=1");f.eat();}
  assert.equal(f.ev('st'),'over');assert.equal(f.busy(),false);assert.equal(f.count('end'),1);const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],0);assert.equal(end[3],'loss');assert.equal(f.wallet.balance,500-fee);
});
check('Every 10 bugs pays 1 point once, and the end reports the total without paying again',()=>{
  const f=fixture();f.F.start();for(let i=0;i<25;i++){f.F.ev('food=100;for(const b of bugs){b.angry=false;b.state="calm"}');f.eat();}
  assert.equal(f.ev('eaten'),25);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),2);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee+2));
  assert.deepEqual({...f.events.find(e=>e[0]==='progress')[2]},{stage:2,step:10,score:f.events.find(e=>e[0]==='progress')[2].score,bonus_points:1});
  f.F.ev('food=.01');f.F.update(.05);assert.equal(f.ev('st'),'over');const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],2);assert.equal(end[3],'complete');assert.equal(end[4].step,25);
  f.eat();f.F.update(.05);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('end'),1);assert.equal(f.storage.get('deep-sea-frog-best'),'25');
});
check('Doing nothing starves the frog in 20 seconds at level 1',()=>{
  const f=fixture();f.F.start();let t=0;while(f.ev('st')==='run'&&t<60){f.F.update(.05);t+=.05;}
  assert.ok(Math.abs(t-20)<.2,'starved after '+t);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
});
check('The aim stays inside its track and reverses at both ends',()=>{
  const f=fixture();f.F.start();let lo=1e9,hi=-1e9;for(let i=0;i<200;i++){f.F.ev('food=100');f.F.update(.05);lo=Math.min(lo,f.ev('aimY'));hi=Math.max(hi,f.ev('aimY'));}
  assert.equal(lo,f.ev('AIM_TOP'));assert.equal(hi,f.ev('AIM_BOT'));
});
check('Level 1 never spawns angry bugs; later levels never spawn three in a row',()=>{
  const f=fixture();f.F.start();for(let i=0;i<9;i++){f.F.ev('food=100');f.eat();}assert.equal(f.ev('bugs.some(b=>b.angry)'),false);
  const g=fixture(500,null,()=>0);g.F.start();g.F.ev('eaten=95');for(let i=0;i<40;i++){g.F.ev('food=100;hearts=3;for(const b of bugs)b.state="calm"');g.eat();}
  const flags=g.ev('bugs.map(b=>b.angry?1:0).join("")');assert.ok(flags.includes('1'));assert.ok(!flags.includes('111'),flags);
});
check('An angry bug cycles calm, warning, attack, calm only in the bottom three slots',()=>{
  const f=fixture();f.F.start();f.F.ev('eaten=10;bugs[1].angry=true;bugs[5].angry=true');const seen=[];
  for(let i=0;i<200;i++){f.F.ev('food=100');f.F.update(.05);const s=f.ev('bugs[1].state');if(seen[seen.length-1]!==s)seen.push(s);}
  assert.deepEqual(seen.slice(0,4),['calm','warn','attack','calm']);assert.equal(f.ev('bugs[5].state'),'calm');assert.equal(f.ev('bugs[5].live'),false);
});
check('A new paid round resets progress; the best record only goes up',()=>{
  const f=fixture(500,30);f.F.start();for(let i=0;i<3;i++)f.eat();f.F.ev('food=.01');f.F.update(.05);assert.equal(f.storage.get('deep-sea-frog-best'),'30');
  f.F.start();assert.equal(f.ev('eaten'),0);assert.equal(f.ev('hearts'),3);assert.equal(f.wallet.balance,500-fee*2);assert.equal(f.count('start'),2);
});
check('Space only works while the frog view is shown and a round is running',()=>{
  const f=fixture();const e=()=>({key:' ',repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  let k=e();f.key(k);assert.equal(k.done,undefined);
  f.F.start();f.F.ev('aimY=TY;lock=0');f.el('view-frog').hidden=true;k=e();f.key(k);assert.equal(f.ev('eaten'),0);assert.equal(k.done,undefined);
  f.el('view-frog').hidden=false;k=e();f.key(k);assert.equal(f.ev('eaten'),1);assert.equal(k.done,true);
  f.F.ev('aimY=TY;lock=0');k=e();k.repeat=true;f.key(k);assert.equal(f.ev('eaten'),1);
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.F.draw();f.F.start();f.F.ev("eaten=10;bugs[0].angry=true;bugs[0].state='attack';bugs[1].angry=true;bugs[1].state='warn';tongueT=.1;lvlT=.5;combo=6");f.F.draw();f.F.ev('food=.01');f.F.update(.05);f.F.draw();
});
console.log(results.length+' frog checks passed');
}
