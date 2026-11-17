// Optional behavior checks: node tools/test_mosquito.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/mosquito/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw();requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__mq={start,tick,draw,ev:code=>eval(code)};'+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-mosquito-best',String(savedBest)]]),events=[];
  // Every canvas call returns the same chainable stub (gradients need addColorStop).
  const drawing=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>drawing,set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:480,height:720}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const F=sandbox.__mq;
  const fx={F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('mqBusy',ctx),
    key:(type,e)=>{for(const fn of listeners[type]||[])fn(e);},
    count:type=>events.filter(e=>e[0]===type).length,
    hold(v){F.ev('keyHeld='+(v?'true':'false'))},
    run(seconds,held){F.ev('keyHeld='+(held?'true':'false'));for(let t=0;t<seconds&&F.ev('st')==='run';t+=1/60)F.tick(1/60);},
    land(){F.ev("keyHeld=false");for(let i=0;i<240&&F.ev('st')==='run'&&F.ev('mo.mode')==='fly';i++){F.ev('keyHeld='+(F.ev('mo.vy')<120?'true':'false'));F.tick(1/60);}},
    // Hover directly above the arm, near the surface, ready to land.
    aboveArm(){F.ev("mo.x=300;mo.dir=1;mo.y=540;mo.vy=60;mo.mode='fly';mo.zone=null;mo.roll.t=99;mo.itch.cd=99")}};
  return fx;
}
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Not enough points: nothing is deducted and no round starts',()=>{
  const f=fixture(fee-1);f.F.start();assert.equal(f.wallet.balance,fee-1);assert.equal(f.busy(),false);assert.equal(f.count('start'),0);assert.equal(f.ev('st'),'ready');
});
check('Start deducts the entry fee once even when clicked twice',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.events[0][1],'mosquito');assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.equal(f.ev('st'),'run');
});
check('Releasing rises and holding dives; the mosquito never leaves the ceiling or walls',()=>{
  const f=fixture();f.F.start();f.ev('mo.roll.t=99');const y0=f.ev('mo.y');f.run(.6,true);const down=f.ev('mo.y');assert.ok(down>y0,'dive');f.run(1.5,false);assert.ok(f.ev('mo.y')<down,'rise');
  for(let i=0;i<600;i++){f.F.tick(1/60);assert.ok(f.ev('mo.x')>=22&&f.ev('mo.x')<=458);assert.ok(f.ev('mo.y')>=34);}
});
check('Landing slowly on the arm starts feeding; holding keeps feeding and letting go takes off',()=>{
  const f=fixture();f.F.start();f.aboveArm();f.land();assert.equal(f.ev('mo.mode'),'suck');assert.equal(f.ev('mo.zone.id'),'arm');
  const b=f.ev('mo.blood');f.run(.5,true);assert.ok(f.ev('mo.blood')>b+5,'blood rises at 12%/s');
  f.hold(false);f.F.tick(1/60);assert.equal(f.ev('mo.mode'),'fly');
});
check('Landing too fast on skin snaps the mouthpart: stun for 1 second and no feeding',()=>{
  const f=fixture();f.F.start();f.ev("mo.x=300;mo.dir=1;mo.y=565;mo.vy=400;mo.roll.t=99");f.run(1/60,false);assert.equal(f.ev('mo.mode'),'stun');assert.ok(f.ev('mo.stun')>.9);assert.equal(f.ev('mo.blood'),0);
  f.run(.5,true);assert.notEqual(f.ev('mo.mode'),'suck');
});
check('Heavier means slower to rise and faster to dive',()=>{
  const a=fixture(),b=fixture();for(const f of[a,b]){f.F.start();f.ev('mo.roll.t=99;mo.y=300;mo.vy=0;mo.x=300;mo.alert=0')}
  b.ev('mo.blood=100');a.run(.8,false);b.run(.8,false);assert.ok(b.ev('mo.y')>a.ev('mo.y'),'heavy rises less');
  const c=fixture(),d=fixture();for(const f of[c,d]){f.F.start();f.ev('mo.roll.t=99;mo.y=100;mo.vy=0;mo.x=200')}d.ev('mo.blood=100');c.run(.6,true);d.run(.6,true);assert.ok(d.ev('mo.y')>c.ev('mo.y'),'heavy dives more');
});
check('BONUS pays 1/2/3 points at 25/50/75% once each, and a win pays 4: 10 points in total, reported once at the end',()=>{
  const f=fixture();f.F.start();f.ev('mo.roll.t=99;mo.itch.cd=99;mo.alert=0');
  f.ev('mo.blood=24.9');f.F.tick(1/60);assert.equal(f.wallet.balance,500-fee);
  f.ev('mo.blood=25');f.F.tick(1/60);f.F.tick(1/60);f.F.tick(1/60);assert.equal(f.wallet.balance,500-fee+1);
  f.ev('mo.blood=50');f.F.tick(1/60);assert.equal(f.wallet.balance,500-fee+3);
  f.ev('mo.blood=80');f.F.tick(1/60);assert.equal(f.wallet.balance,500-fee+6);
  assert.equal(f.count('progress'),3);const p=f.events.filter(e=>e[0]==='progress');assert.deepEqual({...p[0][2]},{stage:1,step:1,score:25,bonus_points:1,total_bonus_points:1});assert.equal(p[2][2].total_bonus_points,6);
  f.ev('mo.blood=100;mo.x=23;mo.dir=-1;mo.y=96;mo.mode="fly";mo.zone=null');f.F.tick(1/60);f.F.tick(1/60);
  assert.equal(f.ev('st'),'over');assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.busy(),false);assert.equal(f.count('end'),1);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],10);assert.equal(end[3],'complete');assert.equal(end[4].step,4);
  f.F.tick(1/60);f.F.tick(1/60);assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.count('end'),1);assert.equal(f.storage.get('deep-sea-mosquito-best'),'100');assert.equal(f.storage.get('crush-depth-balance'),String(500-fee+10));
});
check('Scratching: the hand kills a mosquito still on that skin, but one that flew away lives',()=>{
  const f=fixture();f.F.start();f.aboveArm();f.land();assert.equal(f.ev('mo.mode'),'suck');
  f.ev('mo.itch.phase="wind";mo.itch.t=.02;mo.itch.zone=mo.zone;mo.itch.cd=0');f.run(.2,true);
  assert.equal(f.ev('st'),'over');assert.equal(f.ev('result.kind'),'dead');assert.equal(f.ev('result.part'),'arm');assert.equal(f.busy(),false);assert.equal(f.count('end'),1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');assert.equal(f.wallet.balance,500-fee);
  const g=fixture();g.F.start();g.aboveArm();g.land();g.ev('mo.itch.phase="wind";mo.itch.t=.02;mo.itch.zone=mo.zone;mo.itch.cd=0');g.ev('mo.y=300;mo.mode="fly";mo.zone=null;mo.vy=0');g.run(.2,true);assert.equal(g.ev('st'),'run');
});
check('Rolling over kills anything below the safe height, including a feeding mosquito, and spares one above it',()=>{
  const f=fixture();f.F.start();f.ev('mo.y=500;mo.roll.phase="sweep";mo.roll.t=.5;mo.itch.cd=99');f.F.tick(1/60);assert.equal(f.ev('st'),'over');assert.equal(f.ev('result.cause'),'roll');
  const g=fixture();g.F.start();g.ev('mo.y=300;mo.vy=0;mo.roll.phase="sweep";mo.roll.t=.5;mo.itch.cd=99');g.run(.3,false);assert.equal(g.ev('st'),'run');
});
check('The roll gives a warning first and repeats on a timer',()=>{
  const f=fixture();f.F.start();f.ev('mo.y=100;mo.alert=0;mo.roll.t=.01');f.run(.1,false);assert.equal(f.ev('mo.roll.phase'),'warn');f.ev('mo.alert=0');f.run(2,false);assert.equal(f.ev('mo.roll.phase'),'sweep'.length?f.ev('mo.roll.phase'):'');
  assert.ok(['sweep','wait'].includes(f.ev('mo.roll.phase')));
});
check('Full alertness turns the light on: reaching the hole in time survives but is not a clear; otherwise the swatter kills',()=>{
  const f=fixture();f.F.start();f.ev('mo.blood=40;mo.alert=99.99;mo.y=100;mo.x=200;mo.roll.t=99');f.F.tick(1/60);assert.equal(f.ev('mo.light.on'),true);
  for(let i=0;i<150&&f.ev('st')==='run';i++){f.hold(f.ev('mo.y')<96);f.F.tick(1/60)}
  assert.equal(f.ev('result.kind'),'escaped');assert.equal(f.wallet.balance,500-fee+1,'only the 25% milestone was paid earlier? none here');
});
check('Light with nobody reaching the window ends in a swatter death after 2 seconds',()=>{
  const f=fixture();f.F.start();f.ev('mo.blood=10;mo.alert=99.99;mo.y=600;mo.x=300;mo.roll.t=99');let t=0;while(f.ev('st')==='run'&&t<5){f.hold(true);f.F.tick(1/60);t+=1/60}
  assert.equal(f.ev('result.cause'),'light');assert.ok(Math.abs(t-2)<.1,'died after '+t);assert.equal(f.count('end'),1);
});
check('A full belly that reaches the hole while the light is on still counts as a win',()=>{
  const f=fixture();f.F.start();f.ev('mo.blood=100;mo.alert=99.99;mo.y=100;mo.x=200;mo.roll.t=99');
  for(let i=0;i<150&&f.ev('st')==='run';i++){f.hold(f.ev('mo.y')<96);f.F.tick(1/60)}
  assert.equal(f.ev('result.kind'),'won');
});
check('Escaping the closed window with an empty belly is blocked by the screen',()=>{
  const f=fixture();f.F.start();f.ev('mo.blood=60;mo.x=23;mo.dir=-1;mo.y=96;mo.roll.t=99;mo.alert=0;mo.itch.cd=99');f.F.tick(1/60);f.F.tick(1/60);assert.equal(f.ev('st'),'run');assert.equal(f.ev('mo.dir'),1);
});
check('Alertness rises faster in the air near his head, and halves once feeding passes 90%',()=>{
  const a=fixture(),b=fixture(),c=fixture();for(const f of[a,b,c]){f.F.start();f.ev('mo.roll.t=99;mo.alert=0;mo.vy=0')}
  a.ev('mo.x=300;mo.y=300');b.ev('mo.x=100;mo.y=500');c.ev('mo.x=300;mo.y=300;mo.blood=95');
  a.F.tick(.05);b.F.tick(.05);c.F.tick(.05);const A=a.ev('mo.alert'),B=b.ev('mo.alert'),Cc=c.ev('mo.alert');assert.ok(B>A*1.5,'near head louder');assert.ok(Cc<A*.7,'late feeding quieter');
});
check('A new paid round resets progress; the best record only goes up',()=>{
  const f=fixture(500,60);f.F.start();f.ev('mo.blood=30;mo.roll.phase="sweep";mo.roll.t=.5;mo.y=500;mo.itch.cd=99');f.F.tick(1/60);assert.equal(f.ev('st'),'over');assert.equal(f.storage.get('deep-sea-mosquito-best'),'60');
  f.F.start();assert.equal(f.ev('mo.blood'),0);assert.equal(f.ev('earned'),0);assert.equal(f.wallet.balance,500-fee*2+1);assert.equal(f.count('start'),2);
  const g=fixture(500,10);g.F.start();g.ev('mo.blood=33.33;mo.roll.phase="sweep";mo.roll.t=.5;mo.y=500;mo.itch.cd=99');g.F.tick(1/60);assert.equal(g.storage.get('deep-sea-mosquito-best'),'33.3');
});
check('Space only works while the mosquito view is shown and a round is running; letting go or losing focus releases it',()=>{
  const f=fixture();const e=()=>({key:' ',repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  let k=e();f.key('keydown',k);assert.equal(f.ev('keyHeld'),false);assert.equal(k.done,undefined);
  f.F.start();f.el('view-mosquito').hidden=true;k=e();f.key('keydown',k);assert.equal(f.ev('keyHeld'),false);assert.equal(k.done,undefined);
  f.el('view-mosquito').hidden=false;k=e();f.key('keydown',k);assert.equal(f.ev('keyHeld'),true);assert.equal(k.done,true);
  f.key('keyup',{key:' '});assert.equal(f.ev('keyHeld'),false);
  f.key('keydown',e());f.key('blur',{});assert.equal(f.ev('keyHeld'),false);
  k=e();k.target.tagName='BUTTON';f.key('keydown',k);assert.equal(f.ev('keyHeld'),false);
});
check('Pointer hold works like the key and is released when the pointer lifts',()=>{
  const f=fixture();const c=f.el('mq-canvas');const down=id=>({button:0,pointerId:id,preventDefault(){}});
  c.handlers.pointerdown(down(1));assert.equal(f.ev('held()'),false,'ignored before a round');
  f.F.start();c.handlers.pointerdown(down(1));assert.equal(f.ev('held()'),true);c.handlers.pointerdown(down(2));c.handlers.pointerup({pointerId:1});assert.equal(f.ev('held()'),true);c.handlers.pointerup({pointerId:2});assert.equal(f.ev('held()'),false);
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.F.draw();f.F.start();f.F.draw();
  f.ev("mo.itch={phase:'wind',t:.6,zone:MQZ[1],cd:0};mo.roll={phase:'warn',t:1};mo.blood=70;mo.alert=60");f.F.draw();
  f.ev("mo.itch={phase:'grab',t:.2,zone:MQZ[0],cd:0};mo.roll={phase:'sweep',t:.3}");f.F.draw();
  f.ev("mo.light.on=true;mo.light.t=1;mo.mode='stun'");f.F.draw();
  f.ev('mo.y=560;mo.roll.phase="sweep";mo.roll.t=.5');f.F.tick(1/60);f.F.draw();
  const g=fixture();g.F.start();g.ev('mo.blood=100;mo.x=23;mo.dir=-1;mo.y=96;mo.roll.t=99');g.F.tick(1/60);g.F.tick(1/60);g.F.draw();
  const h=fixture();h.F.start();h.ev('mo.blood=40;mo.alert=99.99;mo.y=100;mo.x=200;mo.roll.t=99');for(let i=0;i<150&&h.ev('st')==='run';i++){h.hold(h.ev('mo.y')<96);h.F.tick(1/60)}h.F.draw();
});
check('A scripted player that reacts in 0.3s clears the round a reasonable share of the time (difficulty sanity)',()=>{
  let seed=7;const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  let wins=0,deaths=0,n=40;
  for(let i=0;i<n;i++){const f=fixture(500,null,rnd);f.F.start();let t=0;
    while(f.ev('st')==='run'&&t<180){
      const press=f.ev(`(function(){
        const q=mo,P=.3;
        if(q.light.on)return q.y<96;
        if(q.mode==='suck'){if(q.blood>=100)return false;if(q.itch.phase==='grab'||(q.itch.phase==='wind'&&q.itch.t<MQC.itchWind-P))return false;
          if((q.roll.phase==='warn'&&q.roll.t<MQC.rollWarn-P)||q.roll.phase==='sweep')return false;if(q.roll.phase==='wait'&&q.roll.t<.3)return false;return true}
        if(q.blood>=100)return q.y<96;
        const danger=(q.roll.phase==='warn'&&q.roll.t<MQC.rollWarn-P)||q.roll.phase==='sweep'||(q.roll.phase==='wait'&&q.roll.t<.3);
        if(!danger&&q.itch.phase!=='grab'&&q.stun<=0){for(const z of MQZ){const T=Math.max(.1,(z.y-MQC.R-q.y)/170);let xf=q.x+q.dir*MQC.vx*T;if(xf>MQC.wallR)xf=2*MQC.wallR-xf;if(xf<MQC.wallL)xf=2*MQC.wallL-xf;if(xf>=z.x0+6&&xf<=z.x1-6)return q.vy<170}}
        return q.y<(danger?250:300)})()`);
      f.hold(press);f.F.tick(1/60);t+=1/60}
    if(f.ev('result.kind')==='won')wins++;if(f.ev('result.kind')==='dead')deaths++;}
  assert.ok(wins>=n*.15&&wins<=n*.85,'bot win rate '+wins+'/'+n);assert.ok(deaths>0,'swatting must be possible');
});
console.log(results.length+' mosquito checks passed');
}
