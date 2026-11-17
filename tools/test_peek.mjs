// Optional behavior checks: node tools/test_peek.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/peek/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw();requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__peek={update,start,draw,ev:code=>eval(code)};'+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-peek-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createRadialGradient'||k==='createLinearGradient')?()=>({addColorStop(){}}):()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,JSON,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__peek;
  const f={F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('peekBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},keyup:e=>{for(const fn of listeners.keyup||[])fn(e);},
    count:type=>events.filter(e=>e[0]===type).length,
    // Run the simulation for `sec` seconds in 0.05 s steps, stopping early once the round is no longer running.
    run(sec){for(let t=0;t<sec&&F.ev('st')==='run';t+=.05)F.update(.05);},
    // Put a spirit directly into play (no random choice) and keep the next random one far away.
    spirit(type,side,phase='warn'){F.ev(`ev={type:${JSON.stringify(type)},side:${side},phase:${JSON.stringify(phase)},t:${type==='walker'?6:2.5},bad:0,ok:false,snd:0};gapT=999`);},
    hold(k,v=1){F.ev(`keys.${k}=${v}`);}};
  return f;
}
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Not enough points: nothing is deducted and no round starts',()=>{
  const f=fixture(fee-1);f.F.start();assert.equal(f.wallet.balance,fee-1);assert.equal(f.busy(),false);assert.equal(f.count('start'),0);
});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.equal(f.events[0][1],'peek');
});
check('Winding needs a held crank; it fills 3% per second',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.run(2);assert.equal(f.ev('prog'),0);
  f.hold('wind');f.run(5);assert.ok(Math.abs(f.ev('prog')-5*f.ev('WIND_RATE'))<.3,'prog '+f.ev('prog'));assert.equal(f.ev('WIND_RATE'),3);
});
check('The crank does not turn while the box is tilted or the screen is covered',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.hold('wind');f.hold('l');f.run(1);const tilted=f.ev('prog');f.run(2);
  assert.ok(tilted<1&&f.ev('prog')-tilted<.001,'tilted prog '+f.ev('prog'));
  f.hold('l',0);f.hold('cover');f.F.ev('tilt=0');const before=f.ev('prog');f.run(2);assert.equal(f.ev('prog'),before);
});
check('Peeping Eye: leaning away for the 3 second beam survives',()=>{
  const f=fixture();f.F.start();f.spirit('eye',1);f.hold('l');f.run(7);
  assert.equal(f.ev('st'),'run');assert.equal(f.ev('survived'),1);assert.equal(f.ev('ev'),null);
});
check('Peeping Eye: standing still while the beam fires kills once with no payout',()=>{
  const f=fixture();f.F.start();f.spirit('eye',1);f.run(10);
  assert.equal(f.ev('st'),'over');assert.equal(f.ev('why'),'eye');assert.equal(f.busy(),false);assert.equal(f.count('end'),1);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],0);assert.equal(end[3],'loss');assert.equal(f.wallet.balance,500-fee);
  f.run(5);f.F.update(.05);assert.equal(f.count('end'),1);assert.equal(f.wallet.balance,500-fee);
});
check('Peeping Eye: leaning toward the beam side is fatal, leaning the other way is safe',()=>{
  const a=fixture();a.F.start();a.spirit('eye',-1);a.hold('l');a.run(10);assert.equal(a.ev('why'),'eye');
  const b=fixture();b.F.start();b.spirit('eye',-1);b.hold('r');b.run(7);assert.equal(b.ev('survived'),1);
});
check('Twin Spirits: leaning toward the giggle kills, away survives, standing still kills at the end',()=>{
  const toward=fixture();toward.F.start();toward.spirit('twins',1);toward.hold('r');toward.run(10);assert.equal(toward.ev('why'),'twins');
  const away=fixture();away.F.start();away.spirit('twins',1);away.hold('l');away.run(6);assert.equal(away.ev('survived'),1);assert.equal(away.ev('st'),'run');
  const still=fixture();still.F.start();still.spirit('twins',-1);still.run(6);assert.equal(still.ev('why'),'twins');assert.equal(still.ev('st'),'over');
});
check('Night Watchman: not covered when the light goes out kills',()=>{
  const f=fixture();f.F.start();f.spirit('walker',1);f.run(9);assert.equal(f.ev('why'),'walkerLate');assert.equal(f.count('end'),1);
});
check('Night Watchman: covered and still through the dark survives; moving or uncovering kills',()=>{
  const ok=fixture();ok.F.start();ok.spirit('walker',1);ok.hold('cover');ok.run(11);assert.equal(ok.ev('st'),'run');assert.equal(ok.ev('survived'),1);
  const move=fixture();move.F.start();move.spirit('walker',1);move.hold('cover');move.run(7);assert.equal(move.ev('ev.phase'),'judge');move.hold('r');move.run(2);assert.equal(move.ev('why'),'walkerMove');
  const peek=fixture();peek.F.start();peek.spirit('walker',1);peek.hold('cover');peek.run(7);peek.hold('cover',0);peek.run(1);assert.equal(peek.ev('why'),'walkerMove');
});
check('Spirits never repeat the type of the previous one',()=>{
  const f=fixture();f.F.start();let prev='';for(let i=0;i<60;i++){f.F.ev('ev=null');f.F.ev('startEvent()');const t=f.ev('ev.type');assert.notEqual(t,prev);prev=t;}
});
check('Dodging 3 spirits pays 2 points once; opening the box pays 5; the end reports the total without paying again',()=>{
  const f=fixture();f.F.start();
  for(let i=0;i<3;i++){f.spirit('eye',1);f.hold('l');f.run(7);f.hold('l',0);f.F.ev('tilt=0');}
  assert.equal(f.ev('survived'),3);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),1);
  const p=f.events.find(e=>e[0]==='progress');assert.equal(p[2].bonus_points,2);
  f.spirit('eye',1);f.hold('l');f.run(7);f.hold('l',0);f.F.ev('tilt=0');assert.equal(f.ev('survived'),4);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),1);
  f.F.ev('gapT=999;ev=null;prog=99.9');f.hold('wind');f.run(1);
  assert.equal(f.ev('st'),'won');assert.equal(f.wallet.balance,500-fee+7);assert.equal(f.count('progress'),2);assert.equal(f.events.filter(e=>e[0]==='progress')[1][2].bonus_points,5);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],7);assert.equal(end[3],'complete');assert.equal(f.count('end'),1);assert.equal(f.busy(),false);
  assert.equal(f.storage.get('deep-sea-peek-best'),'100');assert.equal(f.storage.get('crush-depth-balance'),String(500-fee+7));
  f.run(3);f.F.update(.05);assert.equal(f.wallet.balance,500-fee+7);assert.equal(f.count('end'),1);
});
check('Dying after the 3-spirit bonus keeps the bonus and reports it once',()=>{
  const f=fixture();f.F.start();for(let i=0;i<3;i++){f.spirit('twins',1);f.hold('l');f.run(6);f.hold('l',0);f.F.ev('tilt=0');}
  assert.equal(f.wallet.balance,500-fee+2);f.spirit('eye',1);f.run(10);assert.equal(f.ev('st'),'over');
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],2);assert.equal(end[3],'complete');assert.equal(f.wallet.balance,500-fee+2);
});
check('Best progress and cause counts are saved; a lower run does not overwrite the best',()=>{
  const f=fixture(500,60);f.F.start();f.F.ev('gapT=999;prog=70');f.spirit('eye',1);f.run(10);
  assert.equal(f.storage.get('deep-sea-peek-best'),'70');assert.deepEqual(JSON.parse(f.storage.get('deep-sea-peek-deaths')),{eye:1});
  const g=fixture(500,90);g.F.start();g.F.ev('prog=40');g.spirit('eye',1);g.run(10);assert.equal(g.storage.get('deep-sea-peek-best'),'90');
});
check('Once past 85% the director may add one early ambush, and only once per round',()=>{
  const f=fixture(500,null,()=>0);f.F.start();f.F.ev('gapT=30;prog=86');f.hold('wind');f.F.update(.05);assert.equal(f.ev('directorUsed'),true);assert.ok(f.ev('gapT')<=3);
  f.F.ev('gapT=30');f.F.update(.05);assert.ok(f.ev('gapT')>25);
});
check('Keys only work while the view is shown and a round is running',()=>{
  const f=fixture();const e=k=>({key:k,repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  let k=e(' ');f.key(k);assert.equal(k.done,undefined);assert.equal(f.ev('keys.cover'),0);
  f.F.start();f.el('view-peek').hidden=true;k=e(' ');f.key(k);assert.equal(f.ev('keys.cover'),0);assert.equal(k.done,undefined);
  f.el('view-peek').hidden=false;k=e(' ');f.key(k);assert.equal(f.ev('keys.cover'),1);assert.equal(k.done,true);
  f.keyup({key:' '});assert.equal(f.ev('keys.cover'),0);k=e('a');f.key(k);assert.equal(f.ev('keys.l'),1);k=e('d');f.key(k);assert.equal(f.ev('keys.r'),1);
});
check('Screen buttons and multi-touch map to tilt, cover and crank',()=>{
  const f=fixture();f.F.start();const c=f.el('peek-canvas');
  c.handlers.pointerdown({pointerId:1,clientX:50,clientY:520,button:0,preventDefault(){}});c.handlers.pointerdown({pointerId:2,clientX:340,clientY:520,button:0,preventDefault(){}});
  assert.equal(JSON.stringify(f.ev('btn')),JSON.stringify([1,0,0,1]));c.handlers.pointerup({pointerId:1});assert.equal(JSON.stringify(f.ev('btn')),JSON.stringify([0,0,0,1]));
  c.handlers.pointerdown({pointerId:3,clientX:250,clientY:520,button:0,preventDefault(){}});assert.equal(JSON.stringify(f.ev('btn')),JSON.stringify([0,0,1,1]));
  c.handlers.pointerdown({pointerId:4,clientX:200,clientY:200,button:0,preventDefault(){}});c.handlers.pointerup({pointerId:2});assert.equal(JSON.stringify(f.ev('btn')),JSON.stringify([0,0,1,1]));
});
check('Phone motion: leaning the phone sets the tilt and a face-down phone counts as covered',()=>{
  const f=fixture();f.F.start();f.F.ev('gyro.on=true;gyro.tilt=-.8;gyro.down=false');f.F.ev('gapT=999');f.F.update(.05);assert.equal(f.ev('tilt'),-.8);
  f.F.ev('gyro.down=true');assert.equal(f.ev('inputs().cover'),true);f.F.ev('gyro.down=false');assert.equal(f.ev('inputs().cover'),false);
});
check('Every element id in the Don’t Peek view is unique across all game views and templates (a clash made the start button dead)',()=>{
  const ids=new Map(),files=[...fs.readdirSync(new URL('games/',root)).filter(d=>fs.existsSync(new URL('games/'+d+'/view.html',root))).map(d=>'games/'+d+'/view.html'),'templates/index.html','templates/lobby.html'];
  for(const file of files){const text=fs.readFileSync(new URL(file,root),'utf8');for(const m of text.matchAll(/\sid="([^"]+)"/g))ids.set(m[1],(ids.get(m[1])||[]).concat(file));}
  const mine=[...fs.readFileSync(new URL('games/peek/view.html',root),'utf8').matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(mine.length>=8);
  for(const id of mine)assert.deepEqual(ids.get(id),['games/peek/view.html'],'id '+id+' is also used in '+ids.get(id));
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.F.draw();f.F.start();f.F.draw();
  for(const type of ['eye','twins','walker'])for(const phase of ['warn','judge']){f.spirit(type,1,phase);f.F.ev('ev.t=1');f.F.draw();f.hold('cover');f.F.draw();f.hold('cover',0);}
  f.F.ev('fxs.push({s:"x",x:1,y:1,col:"#fff",t:0})');f.F.draw();f.spirit('eye',1);f.run(10);f.F.draw();
  const w=fixture();w.F.start();w.F.ev('prog=99.9');w.hold('wind');w.run(1);w.F.draw();
});
console.log(results.length+' peek checks passed');
}
