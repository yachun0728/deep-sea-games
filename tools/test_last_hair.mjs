// Optional behavior checks: node tools/test_last_hair.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/last-hair/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw(0);requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const hook=`globalThis.__lh={loop,start,ev:code=>{const v=eval(code);return v&&typeof v==="object"?"@@"+JSON.stringify(v):v;}};`;
const source=fs.readFileSync(new URL('shared/last-hair-rules.cjs',root),'utf8')+'\n'+raw.replace(hookAt,()=>hook+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-last-hair-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,width:0,height:0,handlers:{},focus(){},setPointerCapture(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:720}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const sandbox={timedLeaderboard:()=>({busy:()=>false,start:callback=>callback(null),record(){},finish(){},update:(ms,active,step)=>step(ms/1000)}),document:{hidden:false,addEventListener(){}},window:{devicePixelRatio:1,addEventListener(){}},navigator:{},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math,String,JSON,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(`var hairBusy=false,hairStake=0,hairSay=function(){};`,ctx);vm.runInContext(source,ctx);
  const rawEv=sandbox.__lh.ev,ev=c=>{const v=rawEv(c);return typeof v==='string'&&v.startsWith('@@')?JSON.parse(v.slice(2)):v;};
  const fire=(type,e)=>{for(const fn of listeners[type]||[])fn(e);};
  const f={sandbox,el,events,storage,wallet:sandbox.S,ev,start:sandbox.__lh.start,busy:()=>vm.runInContext('hairBusy',ctx),key:e=>fire('keydown',e),keyup:e=>fire('keyup',e),
    ptr:(type,x,y,id=1,pointerType='touch')=>el('lh-canvas').handlers[type]({button:0,clientX:x,clientY:y,pointerId:id,pointerType,preventDefault(){}}),
    // Advance the real loop by n frames of dt seconds.
    step(n,dt=.05){for(let i=0;i<n;i++){now+=dt*1000;sandbox.__lh.loop(now);}},
    count:type=>events.filter(e=>e[0]===type).length};
  return f;
}
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Free entry: a zero balance can start a round and nothing is deducted',()=>{
  const f=fixture(0);f.start();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts the fixed entry fee once even when clicked twice',()=>{
  const f=fixture();f.start();f.start();assert.equal(fee,0);assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);
  assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.deepEqual(f.events[0],['start','last-hair',fee]);assert.equal(f.ev('st'),'run');
});
check('Each milestone credits once: 100/250/400/500 m pay 1/2/3/4 points, total 10 (break-even)',()=>{
  const f=fixture();f.start();f.ev('g.timeScale=1');
  const want=[[100,1],[250,2],[400,3],[500,4]];let total=0;
  for(const [m,p] of want){f.ev('g.dist='+(m-.01));f.step(2);total+=p;assert.equal(f.wallet.balance,500-fee+total,'balance after '+m);}
  assert.equal(f.count('progress'),4);assert.equal(f.ev('earned'),10);
  const bonus=f.events.filter(e=>e[0]==='progress').map(e=>e[2].bonus_points);assert.deepEqual(bonus,[1,2,3,4]);
});
check('Passing the same milestone again never pays twice; ending once keeps the points',()=>{
  const f=fixture();f.start();f.ev('g.dist=99.99');f.step(3);const b=f.wallet.balance;assert.equal(b,500-fee+1);f.step(20);assert.equal(f.wallet.balance,b);
  f.ev('g.hairs.forEach(h=>{h.glue=0;h.root=0})');f.step(60);
  assert.equal(f.ev('st'),'over');assert.equal(f.count('end'),1);const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],1);assert.equal(end[3],'complete');
  assert.equal(f.wallet.balance,b);assert.equal(f.busy(),false);f.step(20);assert.equal(f.count('end'),1);
});
check('Losing every hair before any milestone ends as a loss with no points and saves the best distance',()=>{
  const f=fixture(500,10);f.start();f.ev('g.dist=40');f.ev('g.hairs.forEach(h=>{h.glue=0;h.root=0})');f.step(60);
  assert.equal(f.ev('st'),'over');assert.equal(f.count('end'),1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
  assert.equal(f.wallet.balance,500-fee);assert.ok(Number(f.storage.get('deep-sea-last-hair-best'))>=40);assert.equal(f.busy(),false);
});
check('Reaching 500 m ends once as a win, pays all 10 points whatever the hair count',()=>{
  const f=fixture();f.start();f.ev('g.dist=499.99');f.step(5);
  assert.equal(f.ev('st'),'over');assert.equal(f.count('end'),1);assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.events.find(e=>e[0]==='end')[2],10);
  assert.equal(f.storage.get('deep-sea-last-hair-best'),'500');f.step(20);assert.equal(f.count('end'),1);
});
check('Two-thumb touch: left half tilts, right half presses, release clears; swap flips roles',()=>{
  const f=fixture();f.start();f.ptr('pointerdown',100,600,1);f.ptr('pointerdown',300,612,2);
  assert.equal(f.ev('input.press'),true);assert.ok(f.ev('input.tilt')===0);f.ptr('pointermove',150,600,1);assert.ok(f.ev('input.tilt')>0);
  f.ptr('pointerup',0,0,2);assert.equal(f.ev('input.press'),false);
  f.ptr('pointermove',-100,600,1);assert.equal(f.ev('input.tilt'),-1);
  const g=fixture();g.start();g.ev('swap=true');g.ptr('pointerdown',100,612,1);assert.equal(g.ev('input.press'),true);
});
check('Keys only work while the view is shown and a round runs',()=>{
  const f=fixture();const e=k=>({key:k,target:{tagName:'CANVAS'},preventDefault(){this.done=true}});
  let k=e('ArrowRight');f.key(k);assert.equal(k.done,undefined);f.start();k=e('ArrowRight');f.key(k);assert.equal(k.done,true);assert.equal(f.ev('input.tilt'),1);
  f.keyup({key:'ArrowRight'});assert.equal(f.ev('input.tilt'),0);
  f.el('view-last-hair').hidden=true;k=e('ArrowLeft');f.key(k);assert.equal(k.done,undefined);
});
check('Pausing stops the run without paying or ending, and a tap resumes',()=>{
  const f=fixture();f.start();f.step(4);const d=f.ev('g.dist');f.sandbox.__lh.ev('pauseNow()');assert.equal(f.ev('paused'),true);f.step(10);assert.equal(f.ev('g.dist'),d);assert.equal(f.count('end'),0);
  f.ptr('pointerdown',100,300,1);assert.equal(f.ev('paused'),false);
});
check('Hair loss after a distance pays nothing extra and the tap while over does not restart',()=>{
  const f=fixture();f.start();f.ev('g.hairs.forEach(h=>{h.glue=0;h.root=0})');f.step(60);const b=f.wallet.balance;f.ptr('pointerdown',200,300,1);assert.equal(f.ev('st'),'over');assert.equal(f.wallet.balance,b);assert.equal(f.count('start'),1);
});
check('Another round after the end deducts again and resets earned',()=>{
  const f=fixture();f.start();f.ev('g.hairs.forEach(h=>{h.glue=0;h.root=0})');f.step(60);f.ev("st='over'");f.start();
  assert.equal(f.wallet.balance,500-fee*2);assert.equal(f.count('start'),2);assert.equal(f.ev('earned'),0);assert.equal(f.ev('rewarded'),0);assert.equal(f.busy(),true);
});
check('Calm window: 250-266 m lowers the wind and schedules no new events, then normal wind returns',()=>{
  const f=fixture();f.start();f.ev('g.dist=252');f.step(2);assert.equal(f.ev('g.calmOn'),true);assert.ok(Math.abs(f.ev('g.wind'))<=0.31,'wind capped in calm');
  f.ev('g.dist=270');f.step(2);assert.equal(f.ev('g.calmOn'),false);
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.step(3);f.start();f.step(30);f.ev('paused=true');f.step(3);f.ev('paused=false');f.ev('g.hairs.forEach(h=>{h.glue=0;h.root=0})');f.step(80);
});
console.log('last-hair: '+results.length+' checks passed');
for(const r of results)console.log(' ✓ '+r);
}
