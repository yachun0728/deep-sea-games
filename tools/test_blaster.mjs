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
  const ctx=vm.createContext(sandbox);vm.runInContext(source+'\nfunction blGo(){blStart();if(BL.phase===\'pick\'){var starter=BL.stage===1&&BL.wave===0&&BL.weapon===1;blChoose(0);if(starter)BL.form=\'pulse\';}}',ctx);
  return {ctx,el,events,storage,drawCalls,emitWindow:(name,e)=>{for(const fn of windowListeners[name]||[])fn(e);},run:s=>vm.runInContext(s,ctx),state:ctx.BL,wallet:sandbox.S,document,advance(ms){now+=ms;vm.runInContext('blSync(performance.now())',ctx);}};
}
const failures=[];
function check(name,fn){try{fn();results.push(name);}catch(error){failures.push(name);console.error('FAIL: '+name+'\n  '+String(error.message).split('\n').slice(0,3).join(' | ')+' @ '+(String(error.stack).match(/test_blaster\.mjs:(\d+)/)||[])[1]);}}
check('Entry deducts once; insufficient, fractional and unsafe amounts rejected',()=>{
  const f=fixture();f.run('blGo();blGo()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.storage.get('crush-depth-balance'),String(1000-fee));
  for(const value of (flatFee?[]:['9','20.5','9007199254740992','NaN'])){const g=fixture();g.el('bl-amount').value=value;g.run('blGo()');assert.equal(g.wallet.balance,1000);assert.equal(g.state.active,false);}
  const g=fixture(fee-1);g.run('blGo()');assert.equal(g.wallet.balance,fee-1);assert.equal(g.state.active,false);
});
check('Early checkpoints and voluntary exit award zero; mid-combat exit blocked',()=>{
  const f=fixture();f.run('blGo();blCash()');assert.equal(f.wallet.balance,1000-fee);f.run('blClear();blCash();blCash()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],0);assert.equal(f.storage.get('deep-sea-blaster-best'),'1');
});
check('Continue preserves weapon/lives and does not charge; the tenth checkpoint awards one point without ending the game',()=>{
  const f=fixture();f.run('blGo();BL.weapon=7;BL.lives=2;blClear();blGo();blGo()');assert.equal(f.state.stage,2);assert.equal(f.state.weapon,8);assert.equal(f.state.lives,2);assert.equal(f.wallet.balance,1000-fee);
  f.run('blClear()');for(let stage=3;stage<=10;stage++)f.run('blGo();blClear()');assert.equal(f.wallet.balance,1000-fee+1);assert.equal(f.state.phase,'cleared');f.run('blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+1);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,1);
});
check('Clearing nine stages then losing or exiting never awards partial points',()=>{
  for(const exit of ['blCash()','blGo();blHurt();blHurt();blHurt()']){const f=fixture();f.run('blGo()');for(let stage=1;stage<=9;stage++){f.run('blClear()');assert.equal(f.wallet.balance,1000-fee);if(stage<9)f.run('blGo()');}f.run(exit);assert.equal(f.wallet.balance,1000-fee);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],0);}
});
check('Milestone rewards are not paid twice on exit and a new paid round resets progress',()=>{
  const f=fixture();f.run('blGo()');for(let stage=1;stage<=10;stage++){f.run('blClear()');if(stage<10)f.run('blGo()');}
  assert.equal(f.events.filter(e=>e[0]==='end').length,0);f.run('blCash()');const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],1);assert.equal(end[3],'complete');assert.equal(end[4].multiplier,undefined);assert.equal(f.storage.get('crush-depth-balance'),String(1000-fee+1));f.run('blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+1);f.run('blGo();blHurt();blHurt();blHurt()');assert.equal(f.wallet.balance,1000-fee*2+1);assert.equal(f.state.cleared,0);
});
check('Three hits lose the entire round with one loss event',()=>{
  const f=fixture();f.run('blGo();blHurt();blHurt();blHurt();blHurt();blCash()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.lives,0);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
});
check('Auto-fire damages and kills; a leaking monster only costs one heart',()=>{
  const f=fixture();f.run('blGo();BL.enemies=[{x:200,y:490,hp:1,max:1,speed:0,id:1}];blStep(.016)');assert.equal(f.state.kills,1);assert.equal(f.state.enemies.length,0);
  f.run('BL.enemies=[{x:80,y:586,hp:999,max:999,speed:0,id:2}];blStep(.016);blStep(.1)');assert.equal(f.state.lives,2);assert.equal(f.state.enemies.length,0);
});
check('Firepower level scales damage and pellets follow the weapon form, not the level',()=>{
  const f=fixture();f.run('blGo()');assert.equal(f.state.weapon,1);assert.equal(f.run('blWeapon().pellets'),1);
  f.run("BL.weapon=4;BL.form='twin'");assert.equal(f.run('blWeapon().pellets'),2);f.run('BL.weapon=10');assert.equal(f.run('blWeapon().pellets'),2);
  f.run("BL.form='plasma';BL.weapon=60");assert.equal(f.run('blWeapon().damage'),21);f.run('BL.bullets=[];blBurst()');assert.equal(f.state.bullets.length,3);
});
check('Free movement: nudges, held keys and drag set the target within bounds; hidden, background and unfocused games pause',()=>{
  const f=fixture();f.run('blGo();blMove(-1)');assert.equal(f.state.target,120);for(let i=0;i<10;i++)f.run('blMove(-1)');assert.equal(f.state.target,28);for(let i=0;i<10;i++)f.run('blMove(1)');assert.equal(f.state.target,372);
  f.run('BL.target=200;BL.x=200;BL.keys.l=true');f.advance(400);assert(f.state.x<200&&f.state.target<200);f.run('BL.keys.l=false;BL.keys.r=true');for(let i=0;i<60;i++)f.advance(50);assert.equal(f.state.target,372);assert(f.state.x>360);f.run('BL.keys.r=false');
  const canvas=f.el('bl-canvas');canvas.handlers.pointerdown({clientX:60,pointerId:1,preventDefault(){}});assert.equal(f.state.target,60);canvas.handlers.pointermove({clientX:340});assert.equal(f.state.target,340);canvas.handlers.pointerup({});canvas.handlers.pointermove({clientX:100});assert.equal(f.state.target,340);
  for(let i=0;i<30;i++)f.advance(50);assert(Math.abs(f.state.x-340)<2);f.run('BL.keys.l=true');f.emitWindow('blur',{});assert.equal(f.state.keys.l,false);
  for(const pause of ['hidden','background','focus']){f.el('view-blaster').hidden=pause==='hidden';f.document.hidden=pause==='background';f.state.focused=pause!=='focus';const before=f.state.clock;f.advance(1000);assert.equal(f.state.clock,before);}
  f.el('view-blaster').hidden=false;f.document.hidden=false;f.state.focused=true;f.advance(16);assert(f.state.clock>0);assert(f.events.some(e=>e[0]==='progress'&&e[3]===true));
});
check('Clear waits for all waves and enemies; later enemies are stronger and faster',()=>{
  const f=fixture();f.run('blGo();blSpawn()');assert(f.state.enemies.length>=1);const hp=f.run("blEnemy(1,100,'octo',blHealth()).hp"),speed=f.run("blEnemy(1,100,'octo',1).speed");
  f.run('BL.wave=BL.waves;BL.enemies=[blEnemy(1,100,"octo",50)];blStep(.016)');assert.equal(f.state.phase,'run');f.run('BL.enemies=[];blStep(.016)');assert.equal(f.state.phase,'cleared');
  f.run('blGo();BL.stage=10');assert(f.run("blEnemy(1,100,'octo',blHealth()).hp")>hp);assert(f.run("blEnemy(1,100,'octo',1).speed")>speed);
});
check('Seven weapon forms have unique colors and shot mechanics',()=>{
  const f=fixture();const kinds=[],colors=[];
  for(const form of ['pulse','twin','rail','rocket','plasma','frost','chain']){f.run(`BL.form='${form}';BL.bullets=[];blBurst()`);kinds.push(f.run('blWeapon().kind'));colors.push(f.run('blWeapon().color'));assert.equal(kinds.at(-1),form);assert(f.state.bullets.every(b=>b.kind===form));}
  assert.equal(new Set(kinds).size,7);assert.equal(new Set(colors).size,7);
});
check('Piercing rail hits three enemies once each without repeated damage',()=>{
  const f=fixture();f.run("blGo();BL.form='rail';BL.weapon=13;BL.enemies=[440,380,320].map((y,i)=>({x:200,y,hp:100,max:100,speed:0,id:i+100}));BL.bullets=[];blBurst();var testBeam=BL.bullets[0]");
  for(let i=0;i<30;i++)f.run('if(testBeam.pierce>0)blAdvanceBullet(testBeam,.02)');
  assert.equal(f.run('testBeam.hits.length'),3);assert.equal(f.run('testBeam.pierce'),0);for(const e of f.state.enemies)assert.equal(e.hp,91.9);
});
check('Rockets steer toward targets and damage nearby enemies on explosion',()=>{
  const f=fixture();f.run('blGo();BL.form="rocket";BL.weapon=18;BL.enemies=[{x:320,y:160,hp:100,max:100,speed:0,id:100},{x:365,y:160,hp:100,max:100,speed:0,id:101}];BL.bullets=[];blBurst();var testRocket=BL.bullets[0]');
  const initial=f.run('testRocket.x');for(let i=0;i<20;i++)f.run('blAdvanceBullet(testRocket,.016)');assert(f.run('testRocket.x')>initial);
  for(let i=0;i<60;i++)f.run('if(testRocket.pierce>0)blAdvanceBullet(testRocket,.016)');assert(f.state.enemies[0].hp<100);assert(f.state.enemies[1].hp<100);
});
check('Plasma combines piercing and area damage; turtle shields absorb damage before health',()=>{
  const f=fixture();f.run('blGo();BL.form="plasma";BL.weapon=24;BL.enemies=[{x:200,y:485,hp:100,max:100,speed:0,id:100},{x:245,y:485,hp:100,max:100,speed:0,id:101}];BL.bullets=[];blBurst();blAdvanceBullet(BL.bullets[1],.016)');assert(f.state.enemies[0].hp<100);assert(f.state.enemies[1].hp<100);assert.equal(f.state.bullets[1].pierce,1);
  f.run("var shieldTest=blEnemy(1,200,'turtle',20);blDamage(shieldTest,10)");assert.equal(f.run('shieldTest.hp'),20);assert.equal(f.run('shieldTest.shield'),5);f.run('blDamage(shieldTest,10)');assert.equal(f.run('shieldTest.shield'),0);assert.equal(f.run('shieldTest.hp'),15);
});
check('Eels telegraph before moving lanes, rays sprint, and jellyfish split only once',()=>{
  const f=fixture();f.run("blGo();var eelTest=blEnemy(1,100,'eel',20);eelTest.age=2;blAdvanceEnemy(eelTest,.01)");assert.notEqual(f.run('eelTest.targetLane'),null);assert.equal(f.run('eelTest.x'),128);f.run('blAdvanceEnemy(eelTest,.3)');assert.equal(f.run('eelTest.x'),128);f.run('blAdvanceEnemy(eelTest,.36)');assert.notEqual(f.run('eelTest.x'),128);
  assert(f.run("blEnemy(1,100,'ray',20).speed>blEnemy(1,100,'octo',20).speed"));
  f.run("BL.stage=5;var jellyTest=blEnemy(1,200,'jelly',20);BL.enemies=[jellyTest];blDamage(jellyTest,1000)");assert.equal(f.state.enemies.filter(e=>e.type==='mini').length,2);f.run('blDamage(jellyTest,1000)');assert.equal(f.state.enemies.length,3);f.run('BL.enemies.slice().filter(e=>e.type==="mini").forEach(e=>blDamage(e,1000))');assert.equal(f.state.enemies.length,3);
});
check('Stages grow, bosses shorten the wave count, and travel/spawning accelerate',()=>{
  const f=fixture();let previousSpeed=0,previousInterval=9;
  for(let stage=1;stage<=10;stage++){const c=f.run(`blStageConfig(${stage})`);const base=Math.min(180,54+12*(stage-1));assert.equal(c.waves,stage%5===0?Math.ceil(base*.6):base);assert(c.speed>previousSpeed);assert(c.interval<=previousInterval);previousSpeed=c.speed;previousInterval=c.interval;}
  assert.equal(f.run('blBossStage(5)'),true);assert.equal(f.run('blBossStage(4)'),false);assert(f.run('blStageConfig(60).interval')>=.7);
  f.run('blGo();BL.wave=0');const slow=f.run('blPace()');f.run('BL.wave=BL.waves');assert(f.run('blPace()')>slow);
});
check('Seven weapon silhouettes differ and every monster renderer executes',()=>{
  const f=fixture(),signatures=new Set();
  for(const form of ['pulse','twin','rail','rocket','plasma','frost','chain']){f.run(`BL.form='${form}'`);f.drawCalls.length=0;f.run('blDrawPlayer()');signatures.add(JSON.stringify(f.drawCalls));}
  assert.equal(signatures.size,7);
  for(const type of ['octo','crab','ray','eel','turtle','jelly','mini','mine','rock','squid'])f.run(`blDrawMonster(blEnemy(1,200,'${type}',20))`);
  f.run("BL.bossSpawned=true;blBossSpawn();BL.ink=[{x:80,y:300,vy:300,r:13,beam:false},{x:200,y:300,vy:300,r:30,beam:true}];blDraw()");
});
check('Retries are free at every stage; replay keeps the current stage and weapon with three hearts',()=>{
  const f=fixture();f.run('blGo();BL.stage=7;BL.cleared=6;BL.weapon=18;BL.wave=20;BL.enemies=[blEnemy(1,400,"octo",20)];blHurt();blHurt();blHurt()');
  assert.equal(f.el('bl-go').hidden,true);assert.equal(f.el('bl-retry').hidden,false);assert.match(f.el('bl-retry').textContent,/重玩第 7 關/);const before=f.wallet.balance;f.run('blGo()');assert.equal(f.state.stage,7);assert.equal(f.wallet.balance,before);f.run('blRetry();blRetry()');assert.equal(f.wallet.balance,before);assert.equal(f.state.stage,7);assert.equal(f.state.cleared,6);assert.equal(f.state.weapon,18);assert.equal(f.state.lives,3);assert.equal(f.state.wave,0);assert.equal(f.state.enemies.length,0);assert.equal(f.state.bullets.length,0);assert.equal(f.state.retries,1);assert.equal(f.el('bl-retry').hidden,true);assert.equal(f.events.filter(e=>e[0]==='start').length,2);assert.equal(f.events.filter(e=>e[0]==='start')[1][3].stage,7);
  for(let stage=1;stage<=10;stage++)assert.equal(f.run(`BL.stage=${stage};blRetryFee()`),0);
});
check('Zero-balance retry preserves stage and weapon',()=>{
  const f=fixture();f.run('blGo();BL.stage=10;BL.weapon=25;blHurt();blHurt();blHurt()');f.wallet.balance=0;f.run('blRetry()');assert.equal(f.wallet.balance,0);assert.equal(f.state.phase,'run');assert.equal(f.state.stage,10);assert.equal(f.state.weapon,25);assert.equal(f.events.filter(e=>e[0]==='start').length,2);
});
check('Replaying stage ten awards only one point and cannot farm rewards after completion',()=>{
  const f=fixture();f.run('blGo();BL.stage=10;BL.cleared=9;blHurt();blHurt();blHurt();blRetry();blClear();blRetry();blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+1);assert.equal(f.state.phase,'cashed');const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,2);assert.equal(ends[0][2],0);assert.equal(ends[1][2],1);assert.equal(ends[1][3],'complete');assert.equal(ends[1][4].multiplier,undefined);
});
check('Endless progression crosses stages 10 and 20, immediately awards each milestone once',()=>{
  const f=fixture();f.run('blGo()');
  for(let stage=1;stage<=25;stage++){assert.equal(f.state.stage,stage);f.run('blClear();blClear()');assert.equal(f.state.phase,'cleared');assert.equal(f.wallet.balance,1000-fee+Math.floor(stage/10));if(stage<25)f.run('blGo()');}
  assert.equal(f.state.earned,2);assert.equal(f.events.filter(e=>e[0]==='end').length,0);assert.equal(f.events.filter(e=>e[0]==='progress'&&e[2]?.bonus_points>0).length,2);f.run('blCash();blCash()');assert.equal(f.wallet.balance,1000-fee+2);assert.equal(f.events.find(e=>e[0]==='end')[2],2);
});
check('Death and free replay beyond stage ten preserve earned rewards and only report new attempt rewards',()=>{
  const f=fixture();f.run('blGo()');for(let stage=1;stage<=20;stage++){f.run('blClear();blGo()');}
  assert.equal(f.state.stage,21);f.run('BL.weapon=45;blHurt();blHurt();blHurt()');assert.equal(f.wallet.balance,1000-fee+2);assert.equal(f.el('bl-pay').textContent,'2 點');assert.match(f.el('bl-retry').textContent,/重玩第 21 關/);assert.equal(f.events.find(e=>e[0]==='end')[2],2);
  f.run('blRetry();blRetry()');assert.equal(f.wallet.balance,1000-fee+2);assert.equal(f.state.stage,21);assert.equal(f.state.weapon,45);assert.equal(f.state.lives,3);assert.equal(f.state.earned,2);assert.equal(f.state.attemptEarned,0);
  for(let stage=21;stage<=30;stage++){f.run('blClear()');if(stage<30)f.run('blGo()');}
  assert.equal(f.wallet.balance,1000-fee+3);assert.equal(f.state.earned,3);f.run('blCash()');const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,2);assert.equal(ends[1][2],1);
});
check('High-stage replay is always free, waves stay bounded and difficulty keeps increasing',()=>{
  const f=fixture();let speed=0,health=0;
  for(const stage of [10,11,20,100,1000]){f.state.stage=stage;const config=f.run('blStageConfig(BL.stage)');assert.equal(f.run('blRetryFee()'),0);assert(config.waves<=180);assert(config.speed>speed);speed=config.speed;const hp=f.run('blHealth()');assert(hp>health);health=hp;assert(Number.isFinite(config.speed)&&Number.isFinite(hp));}
  f.run('blUI()');assert.equal(f.el('bl-stage').textContent,'第 1000 關');
});
check('Best stage values above ten remain compatible with the existing storage key',()=>{
  const f=fixture(1000,47);assert.equal(f.state.best,47);f.run('blGo()');assert.equal(f.state.earned,0);f.run('BL.stage=48;blClear()');assert.equal(f.storage.get('deep-sea-blaster-best'),'48');
});
check('Normal page exit reports credited rewards once while BFCache preserves the active round',()=>{
  const f=fixture();f.run('blGo()');for(let stage=1;stage<=10;stage++){f.run('blClear()');if(stage<10)f.run('blGo()');}
  f.emitWindow('pagehide',{persisted:true});assert.equal(f.state.active,true);assert.equal(f.events.filter(e=>e[0]==='end').length,0);
  const balance=f.wallet.balance;f.emitWindow('pagehide',{persisted:false});f.emitWindow('pagehide',{persisted:false});assert.equal(f.wallet.balance,balance);const ends=f.events.filter(e=>e[0]==='end');assert.equal(ends.length,1);assert.equal(ends[0][2],1);assert.equal(ends[0][3],'abandoned');
});
check('Generated scripts compile and existing JSON child document still decodes',()=>{
  const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}
});
export {results};
check('Shotgun stays removed and picks decide the weapon form, not the level',()=>{
 const f=fixture();f.run('blGo()');
 assert.equal(f.state.spreadLeft,undefined);assert.equal(f.run("BL_GUNS.some(function(g){return g.kind==='spread'})"),false);assert.equal(f.run('BL_GUNS.length'),7);
 for(const level of [1,4,8,13,24]){f.run(`BL.weapon=${level}`);assert.equal(f.run('blWeapon().kind'),'pulse');}
 f.run('BL.weapon=8;blHurt();blHurt();blHurt();blRetry()');assert.equal(f.state.weapon,8);assert.equal(f.run('blWeapon().kind'),'pulse');
});
check('Pacing: stage 1 speed 164, wave gap 1.3, in-stage boost 35%',()=>{
 const f=fixture();assert.equal(f.run('blStageConfig(1).speed'),164);assert.equal(f.run('blStageConfig(1).interval'),1.3);assert.equal(f.run('blStageConfig(10).speed'),290);
 f.run('blGo();BL.wave=BL.waves');assert(Math.abs(f.run('blPace()')-1.35)<1e-9);
});
check('Starter can kill a first-stage octopus within four hits; no weapon crates fall any more',()=>{
 const f=fixture();f.run('blGo();var starter=blWeapon();var hp=blHealth()');assert(Math.ceil(f.run('hp/(starter.damage*starter.scale)'))<=4);
 assert.equal(f.state.pickups,undefined);f.run('blSpawn()');assert.equal(f.state.pickups,undefined);
});

check('Weapon cards appear only mid-fight (every 36 waves): no starter or stage-start pick, no charge, time frozen, one choice applies once',()=>{
  const f=fixture();f.run('blStart()');assert.equal(f.state.phase,'run');assert.equal(f.state.form,'pulse');assert.equal(f.state.picks.length,0);f.run('blClear();blStart()');assert.equal(f.state.phase,'run');assert.equal(f.state.stage,2);assert.equal(f.state.picks.length,0);
  f.run("BL.sinceCard=35;BL.enemies=[blEnemy(1,300,'octo',50)];BL.bullets=[{x:200,y:400,vx:0,speed:600,kind:'pulse',color:'#fff',pierce:1,radius:0,damage:1,hits:[]}];var waveBefore=BL.wave;blSpawn()");
  assert.equal(f.state.phase,'pick');assert.equal(f.state.picks.length,3);assert.equal(f.state.sinceCard,0);assert(f.state.enemies.length>=2);assert.equal(f.state.bullets.length,1);
  assert.equal(f.el('bl-picks').hidden,false);assert.equal(f.el('bl-go').hidden,true);assert.equal(f.events.filter(e=>e[0]==='start').length,1);
  assert.equal(new Set(f.state.picks.map(c=>c.kind)).size,3);assert(f.state.picks.every(c=>c.type==='weapon'&&c.kind!==f.state.form));
  const frozen=f.state.enemies.map(e=>e.y);f.advance(5000);assert.deepEqual(f.state.enemies.map(e=>e.y),frozen);
  const card=f.state.picks[1],level=f.state.weapon,balance=f.wallet.balance;f.run('blChoose(1);blChoose(0)');assert.equal(f.state.phase,'run');assert.equal(f.state.form,card.kind);assert.equal(f.state.weapon,level);assert.equal(f.wallet.balance,balance);assert.equal(f.el('bl-picks').hidden,true);
  f.advance(200);assert(f.state.enemies.some(e=>e.y>frozen[0]));
  for(let i=0;i<35;i++)f.run('blSpawn()');assert.equal(f.state.phase,'run');f.run('blSpawn()');assert.equal(f.state.phase,'pick');
  const g=fixture();g.run('blStart();BL.lives=1;BL.sinceCard=35;blSpawn()');assert(g.state.picks.some(c=>c.type==='repair'));const index=g.state.picks.findIndex(c=>c.type==='repair');g.run(`blChoose(${index})`);assert.equal(g.state.lives,2);assert.equal(g.state.form,'pulse');
  const h=fixture();h.run('blStart();BL.sinceCard=35;blSpawn()');h.emitWindow('pagehide',{persisted:false});assert.equal(h.events.filter(e=>e[0]==='end').length,1);assert.equal(h.events.find(e=>e[0]==='end')[3],'abandoned');
  const k=fixture();k.run('blStart();BL.wave=BL.waves=5;BL.sinceCard=99;blSpawn()');assert.equal(k.state.phase,'run');
});
check('Wave plans: quiet start (mostly one monster) ramping up to three or four per wave, unlocked types only, one rock at most, lone intro of each new type',()=>{
  const f=fixture();f.run('blGo()');const plan=(stage,wave)=>{f.run(`BL.stage=${stage}`);return f.run(`blWavePlan(${wave})`);};
  let total1=0;for(let i=0;i<300;i++){const q=plan(1,5);total1+=q.length;assert(q.length>=1&&q.length<=5);assert(q.every(e=>e.type==='octo'));assert.equal(new Set(q.map(e=>e.lane)).size,q.length);}assert(total1/300<1.5);
  const intro=plan(3,3);assert.equal(intro.length,1);assert.equal(intro[0].type,'mine');assert.equal(plan(4,3)[0].type,'turtle');assert.equal(plan(5,3)[0].type,'rock');assert.equal(plan(6,3)[0].type,'jelly');assert.equal(plan(7,3)[0].type,'squid');
  let total2=0,total8=0;
  for(let i=0;i<200;i++){const a=plan(2,5),b=plan(8,5);total2+=a.length;total8+=b.length;assert(a.every(e=>['octo','ray','crab'].includes(e.type)));assert(new Set(b.map(e=>e.lane)).size===b.length);assert(b.length<=5);assert(b.filter(e=>e.type==='rock').length<=1);}
  assert(total8/200>total1/300);assert(total8/200>=2.8);
  f.run('BL.stage=8;BL.wave=0;blSpawn()');assert(f.state.enemies.length>=1);assert(f.state.enemies.every(e=>e.hp>=1));
});
check('Empty screens call the next wave early',()=>{
  const f=fixture();f.run('blGo();BL.enemies=[];BL.nextWave=1.5;blStep(.016)');assert(f.state.nextWave<=.35);
  f.run('BL.enemies=[blEnemy(1,100,"octo",50)];BL.nextWave=1.5;blStep(.016)');assert(f.state.nextWave>1);
});
check('Mines chain-explode into neighbours and shrapnel hurts only when detonated near the player',()=>{
  const f=fixture();f.run("blGo();BL.stage=3;BL.enemies=[blEnemy(1,200,'mine',20),blEnemy(1,240,'octo',50)];var mineTest=BL.enemies[0];var neighbour=BL.enemies[1]");
  const hp=f.run('neighbour.hp');f.run('blDamage(mineTest,1000)');assert(f.run('neighbour.hp')<hp);assert.equal(f.state.lives,3);assert.equal(f.state.kills,1);
  f.run("BL.x=200;BL.enemies=[blEnemy(1,470,'mine',20)];blDamage(BL.enemies[0],1000)");assert.equal(f.state.lives,2);
  f.run("BL.enemies=[blEnemy(0,470,'mine',20)];blDamage(BL.enemies[0],1000)");assert.equal(f.state.lives,2);
});
check('Rocks block shots, pass harmlessly in other lanes, hurt on contact, and are not kills',()=>{
  const f=fixture();f.run("blGo();BL.stage=4;BL.enemies=[blEnemy(1,300,'rock',20),blEnemy(1,100,'octo',50)];var rockTest=BL.enemies[0],behind=BL.enemies[1];BL.bullets=[];BL.x=128;BL.target=128;blBurst()");
  const hp=f.run('behind.hp');for(let i=0;i<40;i++)f.run('BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');assert.equal(f.run('behind.hp'),hp);assert(f.run('rockTest.hp')<f.run('rockTest.max'));
  f.run("blDamage(rockTest,1e9)");assert.equal(f.state.kills,0);
  f.run("BL.x=56;BL.target=56;BL.enemies=[blEnemy(2,590,'rock',20)];blStep(.016)");assert.equal(f.state.lives,3);assert.equal(f.state.enemies.length,0);
  f.run("BL.enemies=[blEnemy(0,532,'rock',20)];blStep(.016)");assert.equal(f.state.lives,2);
});
check('Ink squid hovers, fires down the player lane, ink can be shot or hurts on contact',()=>{
  const f=fixture();f.run("blGo();BL.stage=6;BL.x=320;BL.target=320;BL.enemies=[blEnemy(1,160,'squid',50)];var squidTest=BL.enemies[0];squidTest.cd=.01");
  f.run('blAdvanceEnemy(squidTest,.02)');assert.equal(f.state.ink.length,1);assert.equal(f.state.ink[0].x,320);assert.equal(f.run('squidTest.y'),160);
  f.run('BL.ink[0].y=530;blStep(.016)');assert.equal(f.state.lives,2);assert.equal(f.state.ink.length,0);
  f.run('BL.ink=[{x:200,y:300,vy:300,r:13,beam:false}];BL.bullets=[{x:200,y:330,vx:0,speed:600,kind:"pulse",color:"#fff",pierce:1,radius:0,damage:1,hits:[]}];BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');assert.equal(f.state.ink.length,0);
  f.run('squidTest.hold=4;var y0=squidTest.y;blAdvanceEnemy(squidTest,.1)');assert(f.run('squidTest.y')>f.run('y0'));
});
check('Boss stage: boss appears after the wave rush, telegraphs lanes then sends tides; defeating it clears the stage and grants +1 firepower',()=>{
  const f=fixture();f.run('blGo();BL.stage=5;blRound();BL.wave=BL.waves;BL.enemies=[];BL.pickups=[];blStep(.016)');
  assert.equal(f.state.bossSpawned,true);assert.equal(f.state.phase,'run');const boss=f.run('BL.enemies[0]');assert.equal(boss.type,'boss');assert.equal(boss.max,f.run('blHealth()*28'));
  f.run('blStep(.016)');assert.equal(f.state.phase,'run');
  f.run('var bossTest=BL.enemies[0];bossTest.cd=.01;blAdvanceEnemy(bossTest,.02)');assert(f.run('bossTest.warn.length')>=1&&f.run('bossTest.warn.length')<=2);assert.equal(f.run('bossTest.y'),150);
  f.run('blAdvanceEnemy(bossTest,1)');assert.equal(f.run('bossTest.warn.length'),0);assert(f.state.ink.length>=1);assert(f.state.ink.every(i=>i.beam));
  f.run('BL.x=200;BL.target=200;BL.ink=[{x:200,y:530,vy:500,r:34,beam:true}];blStep(.016)');assert.equal(f.state.lives,2);
  f.run('BL.ink=[{x:80,y:530,vy:500,r:30,beam:true}];blStep(.016)');assert.equal(f.state.lives,2);
  f.run('BL.ink=[{x:200,y:300,vy:500,r:30,beam:true}];var level=BL.weapon;blDamage(bossTest,1e12)');assert.equal(f.state.weapon,f.run('level+1'));assert.equal(f.state.ink.length,0);assert.equal(f.state.kills,10);
  f.run('BL.enemies=BL.enemies.filter(e=>e.hp>0);blStep(.016)');assert.equal(f.state.phase,'cleared');assert.equal(f.state.cleared,5);
  const g=fixture();g.run('blGo();BL.stage=4;blRound();BL.wave=BL.waves;BL.enemies=[];blStep(.016)');assert.equal(g.state.phase,'cleared');assert.equal(g.state.bossSpawned,false);
});
check('Frost slows hit monsters; chain lightning hits two neighbours; bosses ignore slow',()=>{
  const f=fixture();f.run("blGo();BL.form='frost';BL.enemies=[blEnemy(2,300,'octo',50)];BL.bullets=[];BL.x=200;blBurst();var frostTarget=BL.enemies[0]");
  for(let i=0;i<30;i++)f.run('BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');assert(f.run('frostTarget.slow')>0);const y=f.run('frostTarget.y');f.run('blAdvanceEnemy(frostTarget,.1)');const slowed=f.run('frostTarget.y')-y;
  f.run('frostTarget.slow=0;var y2=frostTarget.y;blAdvanceEnemy(frostTarget,.1)');assert(f.run('frostTarget.y-y2')>slowed*1.5);
  const g=fixture();g.run("blGo();BL.form='chain';BL.enemies=[blEnemy(2,300,'octo',60),blEnemy(1,290,'octo',60),blEnemy(3,310,'octo',60),blEnemy(2,100,'octo',60)];BL.bullets=[];BL.x=200;blBurst()");
  for(let i=0;i<40;i++)g.run('BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');const hps=g.state.enemies.map(e=>e.hp);assert.equal(hps.filter(h=>h<60).length,3);assert.equal(hps[3],60);
});
if(failures.length){console.error(failures.length+' check(s) failed');process.exitCode=1;}
console.log(`PASS: ${results.length} Reef Blaster behavior checks`);
