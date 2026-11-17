// Optional behavior checks: node tools/test_blaster.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('games/blaster/game.js',root),'utf8');
const flatFee=/var stake=ENTRY_FEE/.test(source);
const fee=flatFee?Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]):20;
const results=[];
function fixture(balance=1000,savedBest=null){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-blaster-best',String(savedBest)]]),events=[],drawCalls=[],drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:(...args)=>drawCalls.push([k,...args])});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'20',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,width:400}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const document={hidden:false,hasFocus:()=>true,addEventListener(){}};const windowListeners={};
  const sandbox={document,window:{addEventListener(name,fn){(windowListeners[name]??=[]).push(fn);}},Number,Math,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},$:el,MIN_BET:10,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fx:n=>n.toFixed(2),AN:{start:(...args)=>{events.push(['start',...args]);return 'round';},resume:(...args)=>events.push(['resume',...args]),progress:(...args)=>events.push(['progress',...args]),end:(...args)=>events.push(['end',...args])}};
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  return {ctx,el,events,storage,drawCalls,emitWindow:(name,e)=>{for(const fn of windowListeners[name]||[])fn(e);},run:s=>vm.runInContext(s,ctx),state:ctx.BL,wallet:sandbox.S,document,advance(ms){now+=ms;vm.runInContext('blSync(performance.now())',ctx);}};
}
function check(name,fn){fn();results.push(name);}
check('Entry deducts once; insufficient, fractional and unsafe amounts rejected',()=>{
  const f=fixture();f.run('blStart();blStart()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.storage.get('crush-depth-balance'),String(1000-fee));
  for(const value of (flatFee?[]:['9','20.5','9007199254740992','NaN'])){const g=fixture();g.el('bl-amount').value=value;g.run('blStart()');assert.equal(g.wallet.balance,1000);assert.equal(g.state.active,false);}
  const g=fixture(fee-1);g.run('blStart()');assert.equal(g.wallet.balance,fee-1);assert.equal(g.state.active,false);
});
check('Early checkpoints and voluntary exit award zero; mid-combat exit blocked',()=>{
  const f=fixture();f.run('blStart();blCash()');assert.equal(f.wallet.balance,1000-fee);f.run('blClear();blCash();blCash()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],0);assert.equal(f.storage.get('deep-sea-blaster-best'),'1');
});
check('Continue preserves weapon/lives and does not charge; the tenth checkpoint awards one point without ending the game',()=>{
  const f=fixture();f.run('blStart();BL.weapon=7;BL.lives=2;blClear();blStart();blStart()');assert.equal(f.state.stage,2);assert.equal(f.state.weapon,7);assert.equal(f.state.lives,2);assert.equal(f.wallet.balance,1000-fee);
  f.run('blClear()');for(let stage=3;stage<=10;stage++)f.run('blStart();blClear()');assert.equal(f.wallet.balance,1000-fee+1);assert.equal(f.state.phase,'cleared');f.run('blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+1);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,1);
});
check('Clearing nine stages then losing or exiting never awards partial points',()=>{
  for(const exit of ['blCash()','blStart();blHurt();blHurt();blHurt()']){const f=fixture();f.run('blStart()');for(let stage=1;stage<=9;stage++){f.run('blClear()');assert.equal(f.wallet.balance,1000-fee);if(stage<9)f.run('blStart()');}f.run(exit);assert.equal(f.wallet.balance,1000-fee);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],0);}
});
check('Milestone rewards are not paid twice on exit and a new paid round resets progress',()=>{
  const f=fixture();f.run('blStart()');for(let stage=1;stage<=10;stage++){f.run('blClear()');if(stage<10)f.run('blStart()');}
  assert.equal(f.events.filter(e=>e[0]==='end').length,0);f.run('blCash()');const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],1);assert.equal(end[3],'cashout');assert.equal(end[4].multiplier,1/fee);assert.equal(f.storage.get('crush-depth-balance'),String(1000-fee+1));f.run('blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+1);f.run('blStart();blHurt();blHurt();blHurt()');assert.equal(f.wallet.balance,1000-fee*2+1);assert.equal(f.state.cleared,0);
});
check('Three hits lose the entire round with one loss event',()=>{
  const f=fixture();f.run('blStart();blHurt();blHurt();blHurt();blHurt();blCash()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.lives,0);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
});
check('Auto-fire damages and kills; a leaking monster only costs one heart',()=>{
  const f=fixture();f.run('blStart();BL.enemies=[{x:200,y:490,hp:1,max:1,speed:0,id:1}];blStep(.016)');assert.equal(f.state.kills,1);assert.equal(f.state.enemies.length,0);
  f.run('BL.enemies=[{x:80,y:586,hp:999,max:999,speed:0,id:2}];blStep(.016);blStep(.1)');assert.equal(f.state.lives,2);assert.equal(f.state.enemies.length,0);
});
check('Collecting weapons unlocks two/three bullets, scales damage beyond level 30',()=>{
  const f=fixture();f.run('blStart();BL.pickups=[{x:200,y:532,speed:0,boost:3}];blStep(.016)');assert.equal(f.state.weapon,4);assert.equal(f.run('blWeapon().pellets'),2);
  f.run('BL.pickups=[{x:200,y:532,speed:0,boost:6}];blStep(.016)');assert.equal(f.state.weapon,10);assert.equal(f.run('blWeapon().pellets'),2);
  f.run('BL.pickups=[{x:200,y:532,speed:0,boost:50}];blStep(.016)');assert.equal(f.state.weapon,60);assert.equal(f.run('blWeapon().damage'),21);f.run('BL.bullets=[];blBurst()');assert.equal(f.state.bullets.length,3);
});
check('Lane input stays within three lanes; hidden, background and unfocused games pause',()=>{
  const f=fixture();f.run('blStart();blMove(-1);blMove(-1);blMove(-1)');assert.equal(f.state.lane,0);f.run('blMove(1);blMove(1);blMove(1)');assert.equal(f.state.lane,2);
  for(const pause of ['hidden','background','focus']){f.el('view-blaster').hidden=pause==='hidden';f.document.hidden=pause==='background';f.state.focused=pause!=='focus';const before=f.state.clock;f.advance(1000);assert.equal(f.state.clock,before);}
  f.el('view-blaster').hidden=false;f.document.hidden=false;f.state.focused=true;f.advance(16);assert(f.state.clock>0);assert(f.events.some(e=>e[0]==='progress'&&e[3]===true));
});
check('Clear waits for all waves/enemies/pickups; later enemies are stronger, and crates are guaranteed',()=>{
  const f=fixture();f.run('blStart();blSpawn()');assert.equal(f.state.pickups.length,1);const hp=f.state.enemies[0].hp,speed=f.state.enemies[0].speed;
  f.run('BL.wave=BL.waves;BL.enemies=[];BL.pickups=[{x:80,y:10,speed:0,boost:1}];blStep(.016)');assert.equal(f.state.phase,'run');f.run('BL.pickups=[];blStep(.016)');assert.equal(f.state.phase,'cleared');
  f.run('blStart();BL.stage=10;BL.wave=0;blSpawn()');assert(f.state.enemies[0].hp>hp);assert(f.state.enemies[0].speed>speed);assert.equal(f.state.pickups.length,1);
});
check('Five weapon forms have unique colors and shot mechanics at their unlock levels',()=>{
  const f=fixture();const kinds=[],colors=[];
  for(const level of [1,4,13,18,24]){f.run(`BL.weapon=${level};BL.bullets=[];blBurst()`);kinds.push(f.run('blWeapon().kind'));colors.push(f.run('blWeapon().color'));assert(f.state.bullets.every(b=>b.kind===kinds.at(-1)));}
  assert.equal(new Set(kinds).size,5);assert.equal(new Set(colors).size,5);
});
check('Piercing rail hits three enemies once each without repeated damage',()=>{
  const f=fixture();f.run("blStart();BL.weapon=13;BL.enemies=[440,380,320].map((y,i)=>({x:200,y,hp:100,max:100,speed:0,id:i+100}));BL.bullets=[];blBurst();var testBeam=BL.bullets[0]");
  for(let i=0;i<30;i++)f.run('if(testBeam.pierce>0)blAdvanceBullet(testBeam,.02)');
  assert.equal(f.run('testBeam.hits.length'),3);assert.equal(f.run('testBeam.pierce'),0);for(const e of f.state.enemies)assert.equal(e.hp,91.9);
});
check('Rockets steer toward targets and damage nearby enemies on explosion',()=>{
  const f=fixture();f.run('blStart();BL.weapon=18;BL.enemies=[{x:320,y:160,hp:100,max:100,speed:0,id:100},{x:365,y:160,hp:100,max:100,speed:0,id:101}];BL.bullets=[];blBurst();var testRocket=BL.bullets[0]');
  const initial=f.run('testRocket.x');for(let i=0;i<20;i++)f.run('blAdvanceBullet(testRocket,.016)');assert(f.run('testRocket.x')>initial);
  for(let i=0;i<60;i++)f.run('if(testRocket.pierce>0)blAdvanceBullet(testRocket,.016)');assert(f.state.enemies[0].hp<100);assert(f.state.enemies[1].hp<100);
});
check('Plasma combines piercing and area damage; turtle shields absorb damage before health',()=>{
  const f=fixture();f.run('blStart();BL.weapon=24;BL.enemies=[{x:200,y:485,hp:100,max:100,speed:0,id:100},{x:245,y:485,hp:100,max:100,speed:0,id:101}];BL.bullets=[];blBurst();blAdvanceBullet(BL.bullets[1],.016)');assert(f.state.enemies[0].hp<100);assert(f.state.enemies[1].hp<100);assert.equal(f.state.bullets[1].pierce,1);
  f.run("var shieldTest=blEnemy(1,200,'turtle',20);blDamage(shieldTest,10)");assert.equal(f.run('shieldTest.hp'),20);assert.equal(f.run('shieldTest.shield'),5);f.run('blDamage(shieldTest,10)');assert.equal(f.run('shieldTest.shield'),0);assert.equal(f.run('shieldTest.hp'),15);
});
check('Eels telegraph before moving lanes, rays sprint, and jellyfish split only once',()=>{
  const f=fixture();f.run("blStart();var eelTest=blEnemy(1,100,'eel',20);eelTest.age=2;blAdvanceEnemy(eelTest,.01)");assert.notEqual(f.run('eelTest.targetLane'),null);assert.equal(f.run('eelTest.x'),200);f.run('blAdvanceEnemy(eelTest,.3)');assert.equal(f.run('eelTest.x'),200);f.run('blAdvanceEnemy(eelTest,.36)');assert.notEqual(f.run('eelTest.x'),200);
  assert(f.run("blEnemy(1,100,'ray',20).speed>blEnemy(1,100,'octo',20).speed"));
  f.run("BL.stage=5;var jellyTest=blEnemy(1,200,'jelly',20);BL.enemies=[jellyTest];blDamage(jellyTest,1000)");assert.equal(f.state.enemies.filter(e=>e.type==='mini').length,2);f.run('blDamage(jellyTest,1000)');assert.equal(f.state.enemies.length,3);f.run('BL.enemies.slice().filter(e=>e.type==="mini").forEach(e=>blDamage(e,1000))');assert.equal(f.state.enemies.length,3);
});
check('Stages are longer while later-stage and within-stage travel/spawning accelerate',()=>{
  const f=fixture();let previousSpeed=0;
  for(let stage=1;stage<=10;stage++){const c=f.run(`blStageConfig(${stage})`);assert.equal(c.waves,24+6*(stage-1));assert(c.speed>previousSpeed);previousSpeed=c.speed;
    const old=(12+2*(stage-1)-1)*Math.max(1.18,1.85-(stage-1)*.07);
    const duration=Array.from({length:c.waves-1},(_,i)=>c.interval*(1-.16*(i+1)/c.waves)).reduce((a,b)=>a+b,0);assert(duration>old*1.5);}
  f.run('blStart();BL.wave=0');const slow=f.run('blPace()');f.run('BL.wave=BL.waves');assert(f.run('blPace()')>slow);
  for(const [stage,type,wave] of [[2,'ray',2],[3,'eel',3],[4,'turtle',7],[5,'jelly',5]])assert.equal(f.run(`BL.stage=${stage};blMobType(${wave})`),type);
});
check('Five weapon silhouettes differ and every monster renderer executes',()=>{
  const f=fixture(),signatures=new Set();
  for(const level of [1,4,13,18,24]){f.state.weapon=level;f.drawCalls.length=0;f.run('blDrawPlayer()');signatures.add(JSON.stringify(f.drawCalls));}
  assert.equal(signatures.size,5);
  for(const type of ['octo','crab','ray','eel','turtle','jelly','mini'])f.run(`blDrawMonster(blEnemy(1,200,'${type}',20))`);
});
check('Retry fees scale from one to five; replay keeps the current stage and weapon with three hearts',()=>{
  const f=fixture();f.run('blStart();BL.stage=7;BL.cleared=6;BL.weapon=18;BL.wave=20;BL.enemies=[blEnemy(1,400,"octo",20)];blHurt();blHurt();blHurt()');
  assert.equal(f.el('bl-go').hidden,true);assert.equal(f.el('bl-retry').hidden,false);assert.match(f.el('bl-retry').textContent,/第 7 關.*4 點/);const before=f.wallet.balance;f.run('blStart()');assert.equal(f.state.stage,7);assert.equal(f.wallet.balance,before);f.run('blRetry();blRetry()');assert.equal(f.wallet.balance,before-4);assert.equal(f.state.stage,7);assert.equal(f.state.cleared,6);assert.equal(f.state.weapon,18);assert.equal(f.state.lives,3);assert.equal(f.state.wave,0);assert.equal(f.state.enemies.length,0);assert.equal(f.state.bullets.length,0);assert.equal(f.state.pickups.length,0);assert.equal(f.state.retries,1);assert.equal(f.el('bl-retry').hidden,true);assert.equal(f.events.filter(e=>e[0]==='start').length,2);assert.equal(f.events.filter(e=>e[0]==='start')[1][3].stage,7);
  for(let stage=1;stage<=10;stage++)assert.equal(f.run(`BL.stage=${stage};blRetryFee()`),Math.min(5,Math.ceil(stage/2)));
});
check('Insufficient retry funds do not alter failed state, weapon or wallet',()=>{
  const f=fixture();f.run('blStart();BL.stage=10;BL.weapon=25;blHurt();blHurt();blHurt()');f.wallet.balance=4;f.run('blRetry()');assert.equal(f.wallet.balance,4);assert.equal(f.state.phase,'lost');assert.equal(f.state.stage,10);assert.equal(f.state.weapon,25);assert.equal(f.events.filter(e=>e[0]==='start').length,1);
});
check('Replaying stage ten awards only one point and cannot farm rewards after completion',()=>{
  const f=fixture();f.run('blStart();BL.stage=10;BL.cleared=9;blHurt();blHurt();blHurt();blRetry();blClear();blRetry();blCash();blClear()');assert.equal(f.wallet.balance,1000-fee-5+1);assert.equal(f.state.phase,'cashed');const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,2);assert.equal(ends[0][2],0);assert.equal(ends[1][2],1);assert.equal(ends[1][3],'cashout');assert.equal(ends[1][4].multiplier,1/5);
});
check('Endless progression crosses stages 10 and 20, immediately awards each milestone once',()=>{
  const f=fixture();f.run('blStart()');
  for(let stage=1;stage<=25;stage++){assert.equal(f.state.stage,stage);f.run('blClear();blClear()');assert.equal(f.state.phase,'cleared');assert.equal(f.wallet.balance,1000-fee+Math.floor(stage/10));if(stage<25)f.run('blStart()');}
  assert.equal(f.state.earned,2);assert.equal(f.events.filter(e=>e[0]==='end').length,0);assert.equal(f.events.filter(e=>e[0]==='progress'&&e[2]?.bonus_points>0).length,2);f.run('blCash();blCash()');assert.equal(f.wallet.balance,1000-fee+2);assert.equal(f.events.find(e=>e[0]==='end')[2],2);
});
check('Death and paid replay beyond stage ten preserve earned rewards and only report new attempt rewards',()=>{
  const f=fixture();f.run('blStart()');for(let stage=1;stage<=20;stage++){f.run('blClear();blStart()');}
  assert.equal(f.state.stage,21);f.run('BL.weapon=45;blHurt();blHurt();blHurt()');assert.equal(f.wallet.balance,1000-fee+2);assert.equal(f.el('bl-pay').textContent,'2 點');assert.match(f.el('bl-retry').textContent,/第 21 關.*5 點/);assert.equal(f.events.find(e=>e[0]==='end')[2],2);
  f.run('blRetry();blRetry()');assert.equal(f.wallet.balance,1000-fee+2-5);assert.equal(f.state.stage,21);assert.equal(f.state.weapon,45);assert.equal(f.state.lives,3);assert.equal(f.state.earned,2);assert.equal(f.state.attemptEarned,0);
  for(let stage=21;stage<=30;stage++){f.run('blClear()');if(stage<30)f.run('blStart()');}
  assert.equal(f.wallet.balance,1000-fee+3-5);assert.equal(f.state.earned,3);f.run('blCash()');const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,2);assert.equal(ends[1][2],1);
});
check('High-stage replay is always five points, waves stay bounded and difficulty keeps increasing',()=>{
  const f=fixture();let speed=0,health=0;
  for(const stage of [10,11,20,100,1000]){f.state.stage=stage;const config=f.run('blStageConfig(BL.stage)');assert.equal(f.run('blRetryFee()'),5);assert(config.waves<=96);assert(config.speed>speed);speed=config.speed;const hp=f.run('blHealth()');assert(hp>health);health=hp;assert(Number.isFinite(config.speed)&&Number.isFinite(hp));}
  f.run('blUI()');assert.equal(f.el('bl-stage').textContent,'第 1000 關');
});
check('Best stage values above ten remain compatible with the existing storage key',()=>{
  const f=fixture(1000,47);assert.equal(f.state.best,47);f.run('blStart()');assert.equal(f.state.earned,0);f.run('BL.stage=48;blClear()');assert.equal(f.storage.get('deep-sea-blaster-best'),'48');
});
check('Normal page exit reports credited rewards once while BFCache preserves the active round',()=>{
  const f=fixture();f.run('blStart()');for(let stage=1;stage<=10;stage++){f.run('blClear()');if(stage<10)f.run('blStart()');}
  f.emitWindow('pagehide',{persisted:true});assert.equal(f.state.active,true);assert.equal(f.events.filter(e=>e[0]==='end').length,0);
  const balance=f.wallet.balance;f.emitWindow('pagehide',{persisted:false});f.emitWindow('pagehide',{persisted:false});assert.equal(f.wallet.balance,balance);const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,1);assert.equal(ends[0][2],1);assert.equal(ends[0][3],'abandoned');
});
check('Generated scripts compile and existing JSON child document still decodes',()=>{
  const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}
});
export {results};
check('Shotgun is removed: levels 4-12 stay twin, rail from 13, no timed power remains, retry keeps level',()=>{
 const f=fixture();f.run('blStart()');
 for(const level of [4,8,9,12]){f.run(`BL.weapon=${level}`);assert.equal(f.run('blWeapon().kind'),'twin');assert.equal(f.run('blWeapon().pellets'),2);}
 f.run('BL.weapon=12;BL.pickups=[{x:200,y:532,speed:0,boost:1}];blStep(.016)');assert.equal(f.run('blWeapon().kind'),'rail');
 assert.equal(f.state.spreadLeft,undefined);assert.equal(f.run("BL_GUNS.some(function(g){return g.kind==='spread'})"),false);
 f.run('BL.weapon=8;blHurt();blHurt();blHurt();blRetry()');assert.equal(f.state.weapon,8);assert.equal(f.run('blWeapon().kind'),'twin');
});
check('Pacing is faster than the old curve (stage 1 speed 120, wave gap 1.6, in-stage boost 35%)',()=>{
 const f=fixture();assert.equal(f.run('blStageConfig(1).speed'),120);assert.equal(f.run('blStageConfig(1).interval'),1.6);assert.equal(f.run('blStageConfig(10).speed'),255);
 assert(f.run('blStageConfig(40).interval')>=.62);f.run('blStart();BL.wave=BL.waves');assert(Math.abs(f.run('blPace()')-1.35)<1e-9);
});
check('Starter can kill a first-stage octopus within three hits; crates have wider pickup reach',()=>{
 const f=fixture();f.run('blStart();var starter=blWeapon();var hp=blHealth()');assert(Math.ceil(f.run('hp/(starter.damage*starter.scale)'))<=3);
 f.run('BL.pickups=[{x:250,y:532,speed:0,boost:1}];blStep(.016)');assert.equal(f.state.weapon,2);
 f.run('BL.pickups=[];BL.wave=4;blSpawn()');assert.equal(f.state.pickups.length,1);
});
console.log(`PASS: ${results.length} Reef Blaster behavior checks`);
