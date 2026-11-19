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
const source="'use strict';\n"+raw.replace(hookAt,'globalThis.__peek={update,start,draw,ev:code=>eval(code)};'+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random,newPlayer=false){
  let now=1000;
  const elements=new Map(),storage=new Map([...(savedBest===null?[]:[['deep-sea-peek-best',String(savedBest)]]),...(newPlayer?[]:[['deep-sea-peek-tut2','1']])]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createRadialGradient'||k==='createLinearGradient')?()=>({addColorStop(){}}):()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:800,height:450}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,JSON,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__peek;F.ev('spotsAll=true;breathOff=true');
  const start0=F.start;F.start=()=>{start0();if(F.ev('st')==='run'&&!F.noCampOff)F.ev('campNext=999')};   // most tests run past 20% without wanting the campfire
  const f={F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('peekBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},keyup:e=>{for(const fn of listeners.keyup||[])fn(e);},
    count:type=>events.filter(e=>e[0]===type).length,
    // Run the simulation for `sec` seconds in 0.05 s steps, stopping early once the round is no longer running.
    run(sec){for(let t=0;t<sec&&F.ev('st')==='run';t+=.05)F.update(.05);},
    // Put a spirit directly into play (no random choice) and keep the next random one far away.
    spirit(type,side,phase='warn'){F.ev(`ev={type:${JSON.stringify(type)},side:${side},phase:${JSON.stringify(phase)},t:${type==='walker'?6:2.5},bad:0,ok:false,snd:0${type==='walker'?`,warn:6,gh:'hush',items:{'${side}':'item-lantern','${-side}':'item-hammer'}`:''}};gapT=999`);},
    hold(k,v=1){F.ev(`keys.${k}=${v}`);},tick(ms){now+=ms;}};
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
check('The runner jogs by itself at 2% per second',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.run(5);assert.ok(Math.abs(f.ev('prog')-5*f.ev('BASE_RATE'))<.3,'prog '+f.ev('prog'));assert.equal(f.ev('BASE_RATE'),2);
});
check('Covering the screen stops the run',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.hold('l');f.run(1);assert.ok(f.ev('tilt')<-.5,'tilt '+f.ev('tilt'));
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
check('Glassface and Ash have their own death causes and draw their own omens',()=>{
  for(const [gh,boss,item,decoy] of [['glass',true,'item-hammer','item-lantern'],['ash',false,'item-bucket','item-talisman']]){
    const late=fixture();late.F.start();late.F.ev(`ev={type:'walker',side:1,phase:'warn',t:6,bad:0,ok:false,snd:0,warn:6,gh:'${gh}',boss:${boss},items:{'1':'${item}','-1':'${decoy}'}};gapT=999`);late.run(12);assert.equal(late.ev('why'),gh);
    const wrong=fixture();wrong.F.start();wrong.F.ev(`ev={type:'walker',side:1,phase:'judge',t:2.5,bad:0,ok:false,snd:0,warn:6,gh:'${gh}',boss:${boss},items:{'1':'${item}','-1':'${decoy}'}};gapT=999`);wrong.F.ev('itemTap=-1');wrong.run(1);assert.equal(wrong.ev('why'),gh);
    const good=fixture();good.F.start();good.F.ev(`ev={type:'walker',side:1,phase:'warn',t:2,bad:0,ok:false,snd:0,warn:6,gh:'${gh}',boss:${boss},items:{'1':'${item}','-1':'${decoy}'}};gapT=999`);good.F.ev('itemTap=1');good.run(1);assert.equal(good.ev('survived'),1);
    const draw=fixture();draw.F.start();draw.F.ev(`ev={type:'walker',side:1,phase:'warn',t:3,bad:0,ok:false,snd:0,warn:6,gh:'${gh}',boss:${boss},items:{'1':'${item}','-1':'${decoy}'}};gapT=999`);draw.F.draw();
  }
});
check('Hush: tapping the lantern side survives; the decoy side or nothing kills; items only appear late in the warning',()=>{
  const ok=fixture();ok.F.start();ok.spirit('walker',1);ok.run(1);assert.equal(ok.F.ev('itemsUp()'),false);ok.run(2);assert.equal(ok.F.ev('itemsUp()'),true);ok.F.ev('tap(600)');ok.run(.2);assert.equal(ok.ev('st'),'run');assert.equal(ok.ev('survived'),1);
  const bad=fixture();bad.F.start();bad.spirit('walker',1);bad.run(3);bad.F.ev('tap(200)');bad.run(.2);assert.equal(bad.ev('why'),'walkerMove');
  const early=fixture();early.F.start();early.spirit('walker',1);early.run(1);early.F.ev('tap(200)');early.run(.2);assert.equal(early.ev('st'),'run');   // nothing to tap yet
  const first=fixture();first.F.start();first.spirit('walker',1);first.F.ev('ev.items={"1":"item-lantern","-1":null}');first.run(3);first.F.ev('tap(200)');first.run(.2);assert.equal(first.ev('st'),'run');   // first meeting: only one prop, the empty side does nothing
});
check('Spirits never repeat the type of the previous one',()=>{
  const f=fixture();f.F.start();f.F.ev('survived=3');let prev='';for(let i=0;i<60;i++){f.F.ev('ev=null');f.F.ev('startEvent()');const t=f.ev('ev.type');assert.notEqual(t,prev);prev=t;}
});
check('Dodging 2 spirits pays 2 points once; opening the box pays 5; the end reports the total without paying again',()=>{
  const f=fixture();f.F.start();
  for(let i=0;i<2;i++){f.spirit('eye',1);f.hold('l');f.run(7);f.hold('l',0);f.F.ev('tilt=0');}
  assert.equal(f.ev('survived'),2);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),1);
  const p=f.events.find(e=>e[0]==='progress');assert.equal(p[2].bonus_points,2);
  f.spirit('eye',1);f.hold('l');f.run(7);f.hold('l',0);f.F.ev('tilt=0');assert.equal(f.ev('survived'),3);assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),1);
  f.F.ev('gapT=999;ev=null;prog=99.9');f.run(1);
  assert.equal(f.ev('st'),'won');assert.equal(f.wallet.balance,500-fee+7);assert.equal(f.count('progress'),2);assert.equal(f.events.filter(e=>e[0]==='progress')[1][2].bonus_points,5);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],7);assert.equal(end[3],'complete');assert.equal(f.count('end'),1);assert.equal(f.busy(),false);
  assert.equal(f.storage.get('deep-sea-peek-best'),'100');assert.equal(f.storage.get('crush-depth-balance'),String(500-fee+7));
  f.run(3);f.F.update(.05);assert.equal(f.wallet.balance,500-fee+7);assert.equal(f.count('end'),1);
});
check('Dying after the 2-spirit bonus keeps the bonus and reports it once',()=>{
  const f=fixture();f.F.start();for(let i=0;i<2;i++){f.spirit('twins',1);f.hold('l');f.run(6);f.hold('l',0);f.F.ev('tilt=0');}
  assert.equal(f.wallet.balance,500-fee+2);f.spirit('eye',1);f.run(10);assert.equal(f.ev('st'),'over');
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],2);assert.equal(end[3],'complete');assert.equal(f.wallet.balance,500-fee+2);
});
check('Best progress and cause counts are saved; a lower run does not overwrite the best',()=>{
  const f=fixture(500,60);f.F.start();f.F.ev('gapT=999;prog=70');f.spirit('eye',1);f.run(10);
  assert.equal(f.storage.get('deep-sea-peek-best'),String(Math.floor(f.ev('prog'))));assert.ok(f.ev('prog')>=70);assert.deepEqual(JSON.parse(f.storage.get('deep-sea-peek-deaths')),{eye:1});
  const g=fixture(500,90);g.F.start();g.F.ev('prog=40');g.spirit('eye',1);g.run(10);assert.equal(g.storage.get('deep-sea-peek-best'),'90');
});
check('Once past 85% the director may add one early ambush, and only once per round',()=>{
  const f=fixture(500,null,()=>0);f.F.start();f.F.ev('gapT=30;prog=86');f.F.update(.05);assert.equal(f.ev('directorUsed'),true);assert.ok(f.ev('gapT')<=3);
  f.F.ev('gapT=30');f.F.update(.05);assert.ok(f.ev('gapT')>25);
});
check('Keys only work while the view is shown and a round is running',()=>{
  const f=fixture();const e=k=>({key:k,repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  let k=e(' ');f.key(k);assert.equal(k.done,undefined);assert.equal(f.ev('keys.cover'),0);
  f.F.start();f.el('view-peek').hidden=true;k=e(' ');f.key(k);assert.equal(f.ev('keys.cover'),0);assert.equal(k.done,undefined);
  f.el('view-peek').hidden=false;k=e(' ');f.key(k);assert.equal(f.ev('keys.cover'),1);assert.equal(k.done,true);
  f.keyup({key:' '});assert.equal(f.ev('keys.cover'),0);k=e('a');f.key(k);assert.equal(f.ev('keys.l'),1);k=e('d');f.key(k);assert.equal(f.ev('keys.r'),1);
});
check('Gestures: swipe hides into a spot, tap comes out, hold closes the eyes, tap picks up',()=>{
  const f=fixture();f.F.start();f.F.ev('spotsAll=false;gapT=999;spots={"-1":[],"1":[]}');const c=f.el('peek-canvas'),pd=(id,x,y)=>c.handlers.pointerdown({pointerId:id,clientX:x,clientY:y,button:0,preventDefault(){}}),mv=(id,x,y)=>c.handlers.pointermove({pointerId:id,clientX:x,clientY:y}),up=id=>c.handlers.pointerup({pointerId:id});
  pd(1,400,200);mv(1,300,200);up(1);assert.equal(f.ev('hideWant'),0);   // no spot on that side: nothing happens
  f.F.ev('spots[-1]=[[0,99]]');pd(1,400,200);mv(1,300,200);up(1);assert.equal(f.ev('hideWant'),-1);
  pd(2,400,200);up(2);assert.equal(f.ev('hideWant'),0);   // a tap comes out
  pd(3,400,200);assert.equal(f.ev('inputs().cover'),false);f.tick(300);assert.equal(f.ev('inputs().cover'),true);up(3);assert.equal(f.ev('inputs().cover'),false);
  f.F.ev('drops=[{k:"torch",side:1,z:.2}]');pd(4,400,200);up(4);f.F.update(.05);assert.equal(f.ev('bag.torch'),1);
});
check('Hiding costs breath: too long in a spot is fatal, leaving refills it',()=>{
  const f=fixture();f.F.start();f.F.ev('breathOff=false;spotsAll=true;gapT=999;hideWant=1');f.run(3);assert.ok(f.ev('breath')<.6,'breath '+f.ev('breath'));
  f.F.ev('hideWant=0');f.run(3);assert.equal(f.ev('breath'),1);f.F.ev('hideWant=1');f.run(6);assert.equal(f.ev('why'),'breath');
});
check('Every attack gets a usable hiding spot on its safe side',()=>{
  for(const ty of ['eye','twins','gale','reach']){const f=fixture();f.F.ev('spotsAll=false;forceLvl=24;maxLvl=24;runTop=24');f.F.start();f.F.ev('spots={"-1":[],"1":[]};L.pool=["'+ty+'"];gapT=0;L.left=3');for(let i=0;i<400&&!f.ev('ev');i++)f.F.update(.05);assert.equal(!!f.ev('ev'),true,ty+' starts');   // the attack may wait a few seconds for a spot to run up
    const side=f.ev('ev.side'),need=ty==='gale'?side:-side;assert.equal(f.ev('spots['+need+'].some(w=>w[0]<=lt+1&&w[1]>=lt+3)'),true,ty)}
});
check('Knocker on later levels comes back for a second pass; surviving both counts once',()=>{
  const f=fixture();f.F.ev('forceLvl=9;maxLvl=9;runTop=9');f.F.start();
  f.F.ev("ev={type:'twins',side:1,phase:'judge',t:1.5,warn:2.5,el:3,bad:0,ok:false,snd:0,passes:2,pass:1};gapT=999");f.hold('l');f.run(1.6);assert.equal(f.ev('ev.phase'),'gap');assert.equal(f.ev('survived'),0);
  f.run(1.2);assert.equal(f.ev('ev.phase'),'warn');f.run(1);assert.equal(f.ev('ev.phase'),'judge');f.run(2);assert.equal(f.ev('survived'),1);
});
check('Phone motion: leaning the phone sets the tilt and a face-down phone counts as covered',()=>{
  const f=fixture();f.F.start();f.F.ev('gyro.on=true;gyro.tilt=-.8;gyro.down=false');f.F.ev('gapT=999');f.F.update(.05);assert.equal(f.ev('tilt'),-.8);
  f.F.ev('gyro.down=true');assert.equal(f.ev('inputs().cover'),true);f.F.ev('gyro.down=false');assert.equal(f.ev('inputs().cover'),false);
});
check('Spirits unlock by dodges this round: eye only, then giggles, then the night watchman',()=>{
  const f=fixture();f.F.start();const seen=n=>{const t=new Set();for(let i=0;i<200;i++){f.F.ev('ev=null;lastType=""');f.F.ev('survived='+n);f.F.ev('startEvent()');t.add(f.ev('ev.type'))}return [...t].sort().join()};
  assert.equal(seen(0),'eye');assert.equal(seen(1),'eye');assert.equal(seen(2),'eye,twins');assert.equal(seen(3),'eye,twins,walker');assert.equal(seen(4),'eye,twins,walker');
});
check('The first two red eyes warn for 3.5 s, later ones for 2.5 s; the safe start is 6 s',()=>{
  const f=fixture();f.F.start();assert.equal(f.ev('gapT'),6);
  f.F.ev('ev=null;lastType="";survived=0;eyeSeen=0;startEvent()');assert.equal(f.ev('ev.warn'),3.5);
  f.F.ev('ev=null;lastType="";startEvent()');assert.equal(f.ev('ev.warn'),3.5);
  f.F.ev('ev=null;lastType="";startEvent()');assert.equal(f.ev('ev.warn'),2.5);
});
check('Gap between spirits shrinks with progress and every third dodge gives a longer breather',()=>{
  const f=fixture(500,null,()=>.5);f.F.start();
  f.F.ev('prog=0;survived=1');assert.equal(f.ev('nextGap()'),7);f.F.ev('prog=80;survived=1');assert.equal(f.ev('nextGap()'),4);
  f.F.ev('prog=0;survived=3');assert.equal(f.ev('nextGap()'),10);f.F.ev('prog=80;survived=3');assert.equal(f.ev('nextGap()'),7);
});
check('Total dodges and the death codex are stored; the codex counts distinct causes',()=>{
  const f=fixture();f.F.start();f.spirit('eye',1);f.hold('l');f.run(7);assert.equal(f.storage.get('deep-sea-peek-dodges'),'1');
  f.F.ev('tilt=0');f.F.update(.05);f.F.ev('keys.l=0');f.spirit('eye',1);f.run(10);assert.equal(f.ev('why'),'eye');f.F.ev('ui()');assert.equal(f.el('peek-codex').textContent,'1 / 20');assert.equal(f.el('peek-dodges').textContent,'1 次');
});
check('The corridor scrolls by itself and stops while covered',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.run(1);const r0=f.ev('run');assert.ok(r0>1.3);f.run(1);const r1=f.ev('run');assert.ok(r1-r0>1.3);
  f.hold('cover');f.run(1);assert.equal(f.ev('run'),r1);
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
  const w=fixture();w.F.start();w.F.ev('prog=99.9');w.run(1);w.F.draw();
});
check('Campfire at 20% pauses the run, offers three cards, and gives the chosen item',()=>{
  const f=fixture();f.F.start();f.F.ev('campNext=20;gapT=999;prog=19.9');f.run(1);assert.ok(f.ev('camp')!==null&&f.ev('camp.state')==='pick');
  const p0=f.ev('prog');f.F.update(.5);assert.equal(f.ev('prog'),p0);
  f.F.ev('camp.choice=1');f.F.update(.05);assert.equal(f.ev('bag.charm'),1);assert.equal(f.ev('camp.state'),'rest');f.run(4);assert.equal(f.ev('camp'),null);assert.equal(f.ev('campNext'),40);
});
check('A charm absorbs one deadly mistake; a pickup needs the item to be near',()=>{
  const f=fixture();f.F.start();f.F.ev('bag.charm=1');f.spirit('eye',1);f.run(10);assert.equal(f.ev('st'),'run');assert.equal(f.ev('bag.charm'),0);
  f.F.ev('dropT=999;nibT=999;gapT=999;ev=null');f.F.ev('drops=[{k:"torch",side:1,z:.9}]');f.hold('pick');f.F.update(.05);assert.equal(f.ev('bag.torch'),0);
  f.hold('pick',0);f.F.update(.05);f.F.ev('drops[0].z=.2');f.hold('pick');f.F.update(.05);assert.equal(f.ev('bag.torch'),1);
});
check('Level table: buffer, learn, boss and difficulty ramp follow the ten-level sawtooth',()=>{
  const f=fixture(),c=n=>JSON.parse(f.ev(`JSON.stringify((({l,wi,k,kind,left,plan,pool,fixed,fakeP,chainP})=>({l,wi,k,kind,left,plan,pool,fixed,fakeP,chainP}))(levelCfg(${n})))`));
  assert.equal(c(1).kind,'safe');assert.equal(c(1).left,0);assert.equal(c(1).fixed,true);assert.equal(c(2).kind,'safe');assert.equal(c(3).kind,'safe');assert.equal(c(4).kind,'learn');assert.deepEqual(c(4).pool,['eye']);assert.deepEqual(c(8).pool,['twins']);assert.equal(c(30).kind,'boss');assert.equal(c(22).kind,'learn');assert.deepEqual(c(22).pool,['reach']);assert.deepEqual(c(23).pool,['bell']);assert.equal(c(24).kind,'normal');
  assert.equal(c(5).kind,'safe');assert.equal(c(15).kind,'review');assert.equal(c(15).left,1);assert.equal(c(12).kind,'learn');assert.deepEqual(c(12).pool,['walker']);assert.deepEqual(c(16).pool,['gale']);
  assert.equal(c(9).kind,'peak');assert.equal(c(10).kind,'boss');assert.deepEqual(c(10).plan,['eye','twins','hollow']);assert.deepEqual(c(30).plan,['reach','bell','walker','glass']);assert.equal(c(40).plan.at(-1),'glass');assert.equal(c(40).chainP,1);assert.deepEqual(c(50).plan,['flick','bog','flick']);assert.equal(c(20).plan.at(-1),'hollow');
  assert.equal(c(21).wi,1);assert.equal(c(100).wi,4);assert.equal(c(99).left,8);assert.ok(c(9).left<c(29).left&&c(29).left<c(89).left);
  assert.equal(c(14).fakeP,0);assert.ok(c(18).fakeP===0||c(18).fakeP>0);assert.equal(c(26).chainP>0,true);assert.equal(c(24).chainP,0);
});
check('Weather comes from the level pool and never repeats on consecutive levels; events follow the table',()=>{
  const f=fixture();
  for(let l=2;l<=100;l++){f.F.ev("st='over';forceLvl="+l+";maxLvl=100;runTop=100");f.F.start();assert.equal(f.ev('L.l'),l);const w=f.ev('wx'),pool=JSON.parse(f.ev('JSON.stringify(L.wxp)'));assert.ok(pool.includes(w),'level '+l+' weather');if(pool.length>1&&l>2)assert.notEqual(w,f.ev('prevWxT'),'repeat at '+l);f.F.ev('prevWxT=wx')}
  const ev=l=>{const g=fixture();g.F.ev('forceLvl='+l+';maxLvl=100;runTop=100');g.F.start();return g.ev('evK')};
  assert.equal(ev(3),'nib');assert.equal(ev(13),'chest');assert.equal(ev(14),'');
});
check('Reacher: lean away for 2 s survives; leaning toward the bulge or staying put is fatal',()=>{
  const f=fixture();f.F.ev('forceLvl=22;maxLvl=22;runTop=22');f.F.start();
  f.spirit('reach',1,'judge');f.F.ev('ev.t=2;tilt=-1');f.hold('l');f.run(3);assert.equal(f.ev('survived'),1);f.hold('l',0);
  f.spirit('reach',1,'judge');f.F.ev('ev.t=2;tilt=0');f.run(3);assert.equal(f.ev('why'),'reach');
});
check('Bellkeeper: three tolls, then keep your head down (swipe down) until it passes; late or raising early is fatal',()=>{
  const B="ev={type:'bell',side:1,phase:'warn',t:2.7,warn:2.7,el:0,bad:0,rung:0,fake:false};gapT=999";
  const f=fixture();f.F.ev('forceLvl=23;maxLvl=23;runTop=23');f.F.start();
  f.F.ev(B);f.run(2.9);assert.equal(f.ev('ev.phase'),'judge');assert.equal(f.ev('ev.rung'),2);f.run(2);assert.equal(f.ev('why'),'bell');   // never looked down
  const ok=fixture();ok.F.ev('forceLvl=23;maxLvl=23;runTop=23');ok.F.start();ok.F.ev(B);ok.run(2.5);ok.F.ev('setHead(true)');assert.equal(ok.ev('headDown'),true);ok.run(4);assert.equal(ok.ev('survived'),1);assert.equal(ok.ev('headDown'),false);assert.equal(ok.ev('st'),'run');
  const up=fixture();up.F.ev('forceLvl=23;maxLvl=23;runTop=23');up.F.start();up.F.ev(B);up.run(2.5);up.F.ev('setHead(true)');up.run(1.5);up.F.ev('tap(400)');up.run(.2);assert.equal(up.ev('why'),'bell');
  const late=fixture();late.F.ev('forceLvl=23;maxLvl=23;runTop=23');late.F.start();late.F.ev(B);late.run(4.5);late.F.ev('setHead(true)');late.run(.2);assert.equal(late.ev('why'),'bell');
  const off=fixture();off.F.start();off.F.ev('setHead(true)');assert.equal(off.ev('headDown'),false);   // only works during a Bellkeeper attack
  const g=fixture();g.F.ev('forceLvl=23;maxLvl=23;runTop=23');g.F.start();assert.ok(JSON.parse(g.ev('JSON.stringify(L.pool)')).includes('bell'));
});
check('New ghosts: Bog (double-tap), Crawler (one tap at the end), Magma and Whiteout (hide), Howler (repeat the rhythm), Flick (torch or hide)',()=>{
  const mk=(type,extra='',w=2.5)=>{const f=fixture();f.F.start();f.F.ev("ev={type:'"+type+"',side:1,phase:'warn',t:"+w+",warn:"+w+",el:0,bad:0,ok:false,snd:0,fake:false,passes:1,pass:1"+extra+"};gapT=999");return f};
  let f=mk('bog','',2.4);f.run(2.5);assert.equal(f.ev('ev.phase'),'judge');f.F.ev('tap(400,200)');f.tick(100);f.F.ev('tap(400,200)');f.run(.1);assert.equal(f.ev('survived'),1);
  f=mk('bog','',2.4);f.run(5);assert.equal(f.ev('why'),'bog');
  f=mk('crawl','',2.6);f.F.ev('tap(400,200)');f.run(2.7);assert.equal(f.ev('ev.phase'),'judge');assert.equal(f.ev('st'),'run');f.F.ev('tap(400,200)');f.run(.1);assert.equal(f.ev('survived'),1);   // an early tap does not count
  f=mk('crawl','',2.6);f.run(4.5);assert.equal(f.ev('why'),'crawl');
  f=mk('magma');f.hold('l');f.run(5);assert.equal(f.ev('survived'),1);f=mk('magma');f.run(5);assert.equal(f.ev('why'),'magma');
  f=mk('white');f.hold('r');f.run(5);assert.equal(f.ev('survived'),1);f=mk('white');f.run(5);assert.equal(f.ev('why'),'white');
  f=mk('howl','',2.8);f.F.ev('ev.pat=[0,.5];ev.pi=0;ev.pel=0');f.run(3);assert.equal(f.ev('ev.phase'),'judge');f.F.ev('tap(400,200)');f.run(.5);f.F.ev('tap(400,200)');f.run(.1);assert.equal(f.ev('survived'),1);
  f=mk('howl','',2.8);f.F.ev('ev.pat=[0,.5];ev.pi=0;ev.pel=0');f.run(3);f.F.ev('tap(400,200)');f.run(1.2);f.F.ev('tap(400,200)');f.run(.1);assert.equal(f.ev('why'),'howl');
  f=mk('flick','',2.6);f.F.ev('bag.torch=1');f.run(2.7);f.F.ev('tap(400,400)');f.run(.1);assert.equal(f.ev('survived'),1);assert.equal(f.ev('bag.torch'),0);
  f=mk('flick','',2.6);f.F.ev('bag.torch=0');f.run(6);assert.equal(f.ev('why'),'flick');
  f=mk('flick','',2.6);f.F.ev('bag.torch=0');f.hold('l');f.run(6);assert.equal(f.ev('survived'),1);
});
check('Late-world rules: earlier ghosts mix in lightly, level 40 chains, level 41-43 guarantee a torch, bosses 50-100 have fixed plans',()=>{
  const f=fixture();f.F.ev('forceLvl=70;maxLvl=70;runTop=70');f.F.start();const pool=JSON.parse(f.ev('JSON.stringify(L.pool)'));assert.ok(pool.includes('bog')&&pool.includes('howl')&&pool.includes('crawl')&&pool.includes('white'));assert.ok(!pool.includes('magma'));
  const c=n=>JSON.parse(f.F.ev('JSON.stringify(levelCfg('+n+'))'));assert.deepEqual(c(70).plan,['howl','howl','crawl','howl']);assert.equal(c(100).chainP,1);assert.equal(c(42).kind,'learn');
  let n=0;for(let i=0;i<400;i++){const t=f.F.ev('wpick(L.pool)');if(['eye','twins','walker','gale','reach','bell','glass'].includes(t))n++}assert.ok(n<200,'old ghosts '+n);
});
check('Codex pages: ghosts first (Reacher and Bellkeeper included), items on page 2, next/prev wraps',()=>{
  const f=fixture();f.F.ev('seen={reacher:1,bellkeeper:1};dex=true;dexPg=0;dexSel=0;draw()');
  const pages=JSON.parse(f.ev('JSON.stringify(dexPages().map(p=>p.map(d=>d.id)))'));
  assert.equal(pages.length,3);assert.ok(pages[0].includes('reacher')&&pages[0].includes('bellkeeper')&&pages[0].length<=12);assert.ok(pages[2].includes('torch'));
  f.F.ev('dexGo(2);draw()');assert.equal(f.ev('dexPg'),2);assert.equal(f.ev('DEX[dexSel].ghost||0'),0);f.F.ev('dexGo(1);draw()');assert.equal(f.ev('dexPg'),0);f.F.ev('dex=false');
});
check('A safe level has only harmless false cues; clearing it pays once and unlocks the next level',()=>{
  const f=fixture(500,null,()=>.3);f.F.ev('forceLvl=1');f.F.ev('maxLvl=1');f.F.start();assert.equal(f.ev('L.l'),1);f.run(200);
  assert.equal(f.ev('st'),'won');assert.equal(f.ev('lives'),3);assert.equal(f.ev('maxLvl'),2);assert.equal(f.wallet.balance,500+5);
  f.F.ev('forceLvl=1');f.F.start();f.run(200);assert.equal(f.ev('st'),'won');assert.equal(f.wallet.balance,505);   // replay: no second payout
});
check('The version tag matches on the lobby card, the side panel and in the game',()=>{
  const ver=raw.match(/PEEK_VER='([^']+)'/)[1];
  assert.ok(fs.readFileSync(new URL('games/peek/card.html',root),'utf8').includes(ver));
  assert.ok(fs.readFileSync(new URL('games/peek/view.html',root),'utf8').includes(ver));
  assert.ok(fs.readFileSync(new URL('games/peek/card.html',root),'utf8').includes('npc-nib'));
});
check('Dying is permanent: no lives, the whole run starts over from level 1',()=>{
  const f=fixture();f.F.ev('forceLvl=3;maxLvl=3;runTop=3;ck=1');f.F.start();
  f.spirit('twins',1,'judge');f.F.ev('ev.t=1.5;tilt=1');f.run(2);assert.equal(f.ev('st'),'over');
  assert.equal(f.ev('lostAll'),true);assert.equal(f.ev('runTop'),1);assert.equal(f.ev('lvDeaths[3]'),1);
});
check('Items are used by hand: torch adds warning only when tapped, scroll burns leaf/branch/hush ghosts, a chest is given to Flick or Nib',()=>{
  let f=fixture();f.F.start();f.F.ev('bag.torch=1;gapT=999');f.spirit('eye',1);assert.equal(f.ev('bag.torch'),1,'no automatic torch');
  f.F.ev('useItem(0)');assert.equal(f.ev('bag.torch'),0);assert.equal(f.ev('ev.torch'),true);
  f=fixture();f.F.start();f.F.ev('scrolls=2');f.spirit('eye',1,'judge');f.F.ev('tap(582+120,44)');assert.equal(f.ev('scrolls'),1);assert.equal(f.ev('survived'),1);
  f=fixture();f.F.start();f.F.ev('scrolls=2');f.spirit('gale',1,'judge');f.F.ev('useItem(2)');assert.equal(f.ev('scrolls'),2);assert.equal(f.ev('survived'),0);
  f=fixture();f.F.start();f.F.ev('scrolls=2');f.spirit('twins',1,'warn');f.F.ev('useItem(2)');assert.equal(f.ev('survived'),1);
  f=fixture();f.F.start();f.F.ev('bag.chest=1;scrolls=0');f.spirit('flick',1,'judge');f.F.ev('useItem(3)');assert.equal(f.ev('bag.chest'),0);assert.equal(f.ev('survived'),1);
  f=fixture();f.F.start();f.F.ev('bag.chest=1;scrolls=0;ev=null;gapT=999;drops=[{k:"nib",side:1,z:.3}]');f.F.ev('useItem(3)');assert.equal(f.ev('bag.chest'),0);assert.equal(f.ev('scrolls'),2);
  f=fixture();f.F.start();f.F.ev('gapT=999;ev=null;drops=[]');f.F.ev('giveItem("chest")');assert.equal(f.ev('bag.chest'),1);f.F.ev('giveItem("scroll")');assert.equal(f.ev('scrolls')>=1,true);
});
check('After two deaths on a level the next try gets 0.3 s more warning and one attack fewer, and says so',()=>{
  const f=fixture();f.F.ev('lvDeaths={7:2};forceLvl=7;maxLvl=7');f.F.start();assert.equal(f.ev('assistHid'),1);assert.equal(f.ev('L.ease'),true);
  const f2=fixture();f2.F.ev('lvDeaths={};forceLvl=7;maxLvl=7');f2.F.start();assert.equal(f.ev('L.left')+1,f2.ev('L.left'));
});
check('Gale must be met by leaning toward the reversed wind; boss Hollow is a long Hush',()=>{
  const f=fixture();f.F.ev('forceLvl=12;maxLvl=12');f.F.start();f.spirit('gale',1,'judge');f.F.ev('ev.t=2;tilt=1');f.hold('r');f.run(1);assert.equal(f.ev('st'),'run');f.run(2);f.hold('r',0);assert.equal(f.ev('survived'),1);
  f.spirit('gale',1,'judge');f.F.ev('ev.t=2;tilt=0');f.run(1);assert.equal(f.ev('why'),'gale');
  const h=fixture();h.F.ev('forceLvl=10;maxLvl=10');h.F.start();h.F.ev('ev={type:"walker",side:1,phase:"warn",t:6,warn:6,el:0,bad:0,ok:false,snd:0,fake:false,boss:true};gapT=999');
  h.run(10);assert.equal(h.ev('why'),'hollowLate');
});
check('Boss level runs its fixed plan, saves a checkpoint and adds a life',()=>{
  const f=fixture();f.F.ev('forceLvl=10;maxLvl=10;lives=3');f.F.start();assert.equal(f.ev('L.plan.length'),3);
  const seq=[];for(let i=0;i<3;i++){f.F.ev('ev=null;startEvent()');seq.push(f.ev('ev.boss?"hollow":ev.type'))}assert.deepEqual(seq,['eye','twins','hollow']);
  const g=fixture();g.F.ev('forceLvl=10;maxLvl=10;lives=3');g.F.start();g.F.ev('ev=null;gapT=999;prog=99.9;L.left=0');g.run(1);assert.equal(g.ev('st'),'won');assert.equal(g.ev('ck'),1);assert.equal(g.ev('lives'),3);assert.equal(g.ev('maxLvl'),11);
});
check('Fixed-seed levels repeat exactly; seed code is shown for the others',()=>{
  const run=()=>{const f=fixture(500,null,()=>.9);f.F.ev('forceLvl=10;maxLvl=10');f.F.start();return f.ev('seedCode')+'|'+[0,1,2].map(()=>{f.F.ev('ev=null;startEvent()');return f.ev('ev.side')}).join()};
  assert.equal(run(),run());
  const f=fixture();f.F.ev('forceLvl=6;maxLvl=6');f.F.start();assert.ok(f.ev('seedCode').length>0);
});
check('Pity drop: three levels without an item guarantees one early in the next',()=>{
  const f=fixture();f.F.ev('noDrop=3;forceLvl=6;maxLvl=6');f.F.start();assert.equal(f.ev('guarantee'),true);f.F.ev('gapT=999;prog=9;dropT=999');f.F.update(.05);f.F.update(.05);assert.equal(f.ev('drops.length'),1);
});
check('A false cue fades without an attack and does not count as a dodge',()=>{
  const f=fixture();f.F.ev('forceLvl=20;maxLvl=20');f.F.start();f.F.ev('L.fakeP=1;L.left=5;ev=null;lastType="";startEvent()');assert.equal(f.ev('ev.fake'),true);assert.equal(f.ev('L.left'),5);f.F.ev('gapT=999');f.run(8);assert.equal(f.ev('ev'),null);assert.equal(f.ev('survived'),0);assert.equal(f.ev('st'),'run');
});
check('Practice from the codex neither costs lives nor counts deaths or pays',()=>{
  const f=fixture();f.F.ev('lives=3;practiceStart("eye")');assert.equal(f.ev('L'),null);assert.equal(f.ev('practice'),'eye');f.F.ev('ev=null;startEvent()');assert.equal(f.ev('ev.type'),'eye');
  f.spirit('eye',1,'judge');f.F.ev('tilt=0');f.run(10);assert.equal(f.ev('st'),'over');assert.equal(f.ev('lives'),3);assert.equal(f.ev('deaths.eye||0'),0);
  f.F.ev('draw()');
});
check('Level cannot end before all its attacks are used; checkpoint and daily rules',()=>{
  const f=fixture();f.F.ev('forceLvl=10;maxLvl=10');f.F.start();f.F.ev('ev=null;gapT=999;prog=99.9');f.run(1);
  assert.equal(f.ev('st'),'run');assert.ok(f.ev('prog')<=97.01);
  const g=fixture();g.F.ev('forceLvl=3;maxLvl=9;runTop=9;ck=1;lives=1');g.F.start();g.spirit('twins',1,'judge');g.F.ev('ev.t=1.5;tilt=1');g.run(2);
  assert.equal(g.ev('lostAll'),true);assert.equal(g.ev('runTop'),1);
  const h=fixture();for(let i=0;i<40;i++){const l=h.F.ev('dailyLvl()');assert.ok(l>=1&&l<=100&&![1,5,10].includes((l-1)%10+1))}
  const d=fixture();d.F.ev('forceLvl=3;maxLvl=3;lives=3;daily=true');d.F.start();d.F.ev('daily=true');d.spirit('twins',1,'judge');d.F.ev('ev.t=1.5;tilt=1');d.run(2);
  assert.equal(d.ev('st'),'over');assert.equal(d.ev('lives'),3);
});
check('Every screen draws: ready, death with buttons, won, codex, share text',()=>{
  const f=fixture();f.F.ev('forceLvl=3;maxLvl=5;audioOk=true');f.F.draw();f.F.start();f.spirit('twins',-1,'judge');f.F.ev('ev.t=1.5;tilt=-1');f.run(2);f.F.draw();for(let i=0;i<30;i++)f.F.update(.05);f.F.draw();assert.ok(f.ev('endBtns.length')>=4);
  f.F.ev('dex=true;seen={leafling:1,knocker:1};draw()');f.F.ev('dexSel=1;draw();dex=false');assert.ok(f.ev('shareText()').includes('第 3 關'));
  f.F.ev('st="won";draw();st="ready";audioOk=false;draw()');
});
check('Tutorial: a new player is taught hide, item and pickup; mistakes cannot kill; it ends in stage 1; returning players skip it',()=>{
  const f=fixture(500,null,Math.random,true);f.F.start();
  assert.equal(f.ev('introP'),1);f.F.draw();f.run(3);assert.equal(f.ev('ev'),null,'nothing happens during the intro pages');f.F.ev('introNext()');f.F.draw();f.F.ev('introNext()');f.F.draw();f.F.ev('introNext()');assert.equal(f.ev('introP'),0);
  assert.equal(f.ev('st'),'run');assert.equal(f.ev('tut&&tut.i'),0);assert.equal(f.ev('L'),null);
  const upTo=(cond,sec)=>{for(let t=0;t<sec&&!f.ev(cond);t+=.05)f.F.update(.05)};
  f.F.ev('gapT=0');upTo('ev&&ev.phase==="judge"',8);assert.equal(f.ev('ev.type'),'eye');
  f.run(8);assert.equal(f.ev('st'),'run','a wrong move in the tutorial must not kill');assert.ok(f.ev('tut.fails')>=1);assert.equal(f.ev('tut.i'),0);
  f.F.ev('gapT=0');upTo('ev&&ev.phase==="warn"',4);f.F.ev('swipe(-ev.side)');f.run(10);assert.equal(f.ev('tut.i'),1,'hiding on the safe side advances to the item step');
  f.F.ev('gapT=0');upTo('itemsUp()',10);const lantern=f.ev('ev.items[-1]')==='item-lantern'?-1:1;f.F.ev(`tap(${lantern<0?200:600})`);f.run(3);assert.equal(f.ev('tut.i'),2,'tapping the lantern advances');
  upTo('drops.some(d=>d.z<PICK_AT&&d.z>=0)',8);f.F.ev('tapPick=1');f.run(.2);assert.equal(f.ev('tut.i'),3,'picking up the torch advances');
  f.F.ev('gapT=0');upTo('ev&&ev.phase==="warn"',4);f.F.ev('swipe(-ev.side)');f.run(10);
  assert.equal(f.ev('tut'),null);assert.equal(f.ev('tutDone'),true);assert.equal(f.ev('st'),'run');assert.equal(f.ev('lvl'),f.ev('wantLevel()'),'the tutorial hands over to the chosen stage');assert.equal(f.ev('survived'),0);
  assert.equal(f.storage.get('deep-sea-peek-tut2'),'1');
  const again=fixture();again.F.start();assert.equal(again.ev('tut'),null);
});
check('Dying plays a jump scare first; the death card cannot be clicked until it ends',()=>{
  const f=fixture();f.F.start();f.F.ev('gapT=999');f.spirit('eye',1);f.F.ev("end('dead','eye')");
  assert.equal(f.ev('st'),'over');assert.ok(f.ev('scareT')>.9,'scareT '+f.ev('scareT'));f.F.draw();
  for(let i=0;i<30;i++)f.F.update(.05);assert.ok(f.ev('scareT')<=0);f.F.draw();
});
check('Colossus (level 100): footsteps alternate and only the last one counts; hide opposite for two rounds; hiding on the last step dies',()=>{
  const mk=()=>{const f=fixture(500,null,()=>.3);f.F.ev('forceLvl=100;maxLvl=100;runTop=100');f.F.start();f.F.ev("gapT=999;ev=null;pendType='colossus';startEvent()");return f};
  const f=mk();assert.equal(f.ev('ev.col'),true);assert.equal(f.ev('ev.passes'),2);
  const steps=JSON.parse(f.ev('JSON.stringify(ev.steps)')),side=f.ev('ev.side');assert.equal(steps.length,4);assert.equal(steps[3][1],side);for(let i=1;i<steps.length;i++)assert.notEqual(steps[i][1],steps[i-1][1]);
  const key=side===1?'l':'r';   // hide opposite the final step
  f.hold(key);f.run(20);assert.equal(f.ev('survived'),1,'two rounds survived; why='+f.ev('why'));assert.equal(f.ev('st'),'run');
  const g2=mk();const bad=g2.ev('ev.side')===1?'r':'l';g2.hold(bad);g2.run(12);assert.equal(g2.ev('why'),'colossus');
  assert.ok(g2.ev("CAUSES.colossus").length>0);
});
check('Tail (boss from behind): mash to stay ahead, then hide away from the lunge; no mashing or wrong side dies',()=>{
  const mk=()=>{const f=fixture(500,null,()=>.3);f.F.ev('forceLvl=75;maxLvl=100;runTop=100');f.F.start();f.F.ev("gapT=999;ev=null;pendType='tail';startEvent()");return f};
  const f=mk();assert.equal(f.ev("ev.type"),'tail');const side=f.ev('ev.side'),key=side===1?'l':'r';
  f.run(3.2);assert.equal(f.ev("ev.phase"),'chase');for(let t=0;t<6.2&&f.ev("ev&&ev.phase==='chase'");t+=.05){if(Math.round(t*20)%7===0)f.F.ev('tailPush()');f.F.update(.05)}
  assert.equal(f.ev("ev.phase"),'judge','survived the chase, d='+f.ev('ev.d'));f.hold(key);f.run(3);assert.equal(f.ev('survived'),1,'why='+f.ev('why'));
  const g2=mk();g2.run(3.2);g2.run(6);assert.equal(g2.ev('why'),'tail','no mashing = caught');
  const g3=mk();const s3=g3.ev('ev.side');g3.run(3.2);for(let t=0;t<6.2&&g3.ev("ev&&ev.phase==='chase'");t+=.05){if(Math.round(t*20)%7===0)g3.F.ev('tailPush()');g3.F.update(.05)}g3.hold(s3===1?'r':'l');g3.run(3);assert.equal(g3.ev('why'),'tail','hiding on the lunge side dies');
});
console.log(results.length+' peek checks passed');
}
