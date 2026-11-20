// Optional behavior checks: node tools/test_blaster.mjs (Node.js, no packages).
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';
import blasterEngine from '../shared/blaster-rules.cjs';
const root=new URL('../',import.meta.url);
const game=readSource('games/blaster/game.js',root);
const source=fs.readFileSync(new URL('shared/blaster-rules.cjs',root),'utf8')+'\n'+game;
const flatFee=/var stake=ENTRY_FEE/.test(source);
const fee=flatFee?Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]):20;
const results=[];
function fixture(balance=1000,savedBest=null){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-blaster-best',String(savedBest)]]),events=[],drawCalls=[],drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:(...args)=>drawCalls.push([k,...args])});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'20',classList:{toggle(){}},textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:600}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const document={hidden:false,hasFocus:()=>true,addEventListener(){}};const windowListeners={};
  const sandbox={document,timedLeaderboard:()=>({busy:()=>false,start:callback=>callback(null),record(){},finish(){},update:(ms,active,step)=>step(ms/1000)}),Image:class {naturalWidth=0;},window:{location:{hash:'#blaster'},addEventListener(name,fn){(windowListeners[name]??=[]).push(fn);}},Number,Math,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},$:el,MIN_BET:10,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fx:n=>n.toFixed(2),AN:{start:(...args)=>{events.push(['start',...args]);return 'round';},resume:(...args)=>events.push(['resume',...args]),progress:(...args)=>events.push(['progress',...args]),end:(...args)=>events.push(['end',...args])}};
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
check('Distance milestones award once, and defeat preserves the payout and best distance',()=>{
  const f=fixture();f.run('blGo();BL.distance=9999;BL.nextHazard=Infinity;BL.nextBoss=Infinity;blAdvanceDistance(9)');
  assert.equal(f.wallet.balance,1000-fee);
  f.run('blAdvanceDistance(2);blAdvanceDistance(0)');
  assert.equal(f.wallet.balance,1001-fee);
  assert.equal(f.state.earned,1);
  assert.equal(f.state.phase,'run');
  f.run('blChangeFleet(-3);blChangeFleet(-3)');
  assert.equal(f.storage.get('deep-sea-blaster-distance-best'),'10000');
  const ends=f.events.filter(e=>e[0]==='end');
  assert.equal(ends.length,1);assert.equal(ends[0][2],1);assert.equal(ends[0][4].distance_m,10000);
  f.run('blStart()');assert.equal(f.state.distance,0);assert.equal(f.state.earned,0);assert.equal(f.state.lives,3);
  assert.equal(f.wallet.balance,1001-fee*2);
});
check('A depleted fleet ends the attempt once',()=>{
  const f=fixture();f.run('blGo();blChangeFleet(-3);blHurt()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.lives,0);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
});
check('Auto-fire kills; an enemy that swims past does no damage',()=>{
  const f=fixture();f.run('blGo();BL.enemies=[{x:200,y:503,hp:1,max:1,speed:0,id:1}];blStep(.016)');assert.equal(f.state.kills,1);assert.equal(f.state.enemies.length,0);
  f.run('BL.enemies=[{x:80,y:621,hp:999,max:999,speed:0,id:2}];blStep(.016)');assert.equal(f.state.lives,3);assert.equal(f.state.enemies.length,0);
});
check('Firepower level scales damage and pellets follow the weapon form, not the level',()=>{
  const f=fixture();f.run('blGo()');assert.equal(f.state.weapon,1);assert.equal(f.run('blWeapon().pellets'),1);
  f.run("BL.weapon=4;BL.form='twin'");assert.equal(f.run('blWeapon().pellets'),2);f.run('BL.weapon=10');assert.equal(f.run('blWeapon().pellets'),2);
  f.run("BL.form='plasma';BL.weapon=60");assert.equal(f.run('blWeapon().damage'),21);f.run('BL.bullets=[];blBurst()');assert.equal(f.state.bullets.length,9);
});
check('Free movement: bounds, held keys and drag set the target within bounds; hidden, background and unfocused games pause',()=>{
  const f=fixture();f.run('blGo();blAim(0,532)');assert.equal(f.state.target,28);f.run('blAim(400,532)');assert.equal(f.state.target,372);
  f.run('BL.target=200;BL.x=200;BL.keys.l=true');f.advance(400);assert(f.state.x<200&&f.state.target<200);f.run('BL.keys.l=false;BL.keys.r=true');for(let i=0;i<60;i++)f.advance(50);assert.equal(f.state.target,372);assert(f.state.x>360);f.run('BL.keys.r=false');
  const canvas=f.el('bl-canvas');canvas.handlers.pointerdown({clientX:60,clientY:480,pointerId:1,preventDefault(){}});f.advance(16);assert.equal(f.state.target,60);canvas.handlers.pointermove({clientX:340,clientY:400,pointerId:1});f.advance(16);assert.equal(f.state.target,340);assert.equal(f.state.targetY,400);canvas.handlers.pointerup({pointerId:1});canvas.handlers.pointermove({clientX:100,clientY:300,pointerId:1});assert.equal(f.state.target,340);
  for(let i=0;i<30;i++)f.advance(50);assert(Math.abs(f.state.x-340)<2);f.run('BL.keys.l=true');f.emitWindow('blur',{});assert.equal(f.state.keys.l,false);
  for(const pause of ['hidden','background','focus']){f.el('view-blaster').hidden=pause==='hidden';f.document.hidden=pause==='background';f.state.focused=pause!=='focus';const before=f.state.clock;f.advance(1000);assert.equal(f.state.clock,before);}
  f.el('view-blaster').hidden=false;f.document.hidden=false;f.state.focused=true;f.advance(16);assert(f.state.clock>0);assert(f.events.some(e=>e[0]==='progress'&&e[3]===true));
});
check('Distance raises difficulty without resetting the fleet or wave counter',()=>{
  const f=fixture();f.run('blGo();BL.distance=999;BL.wave=53;BL.lives=7;blAdvanceDistance(20);blSpawn()');
  assert.equal(f.state.stage,2);assert.equal(f.state.weapon,2);assert.equal(f.state.wave,54);
  assert.equal(f.state.lives,7);assert.equal(f.state.phase,'run');
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
  const f=fixture();f.run('blGo();BL.form="plasma";BL.weapon=24;BL.enemies=[{x:200,y:497,hp:100,max:100,speed:0,id:100},{x:245,y:497,hp:100,max:100,speed:0,id:101}];BL.bullets=[];blBurst();blAdvanceBullet(BL.bullets[4],.016)');assert(f.state.enemies[0].hp<100);assert(f.state.enemies[1].hp<100);assert.equal(f.state.bullets[4].pierce,1);
  f.run("var shieldTest=blEnemy(1,200,'turtle',20);blDamage(shieldTest,10)");assert.equal(f.run('shieldTest.hp'),20);assert.equal(f.run('shieldTest.shield'),5);f.run('blDamage(shieldTest,10)');assert.equal(f.run('shieldTest.shield'),0);assert.equal(f.run('shieldTest.hp'),15);
});
check('Eels telegraph before moving lanes, rays sprint, and jellyfish split only once',()=>{
  const f=fixture();f.run("blGo();var eelTest=blEnemy(1,100,'eel',20);eelTest.age=2;blAdvanceEnemy(eelTest,.01)");assert.notEqual(f.run('eelTest.targetLane'),null);assert.equal(f.run('eelTest.x'),128);f.run('blAdvanceEnemy(eelTest,.3)');assert.equal(f.run('eelTest.x'),128);f.run('blAdvanceEnemy(eelTest,.36)');assert.notEqual(f.run('eelTest.x'),128);
  assert(f.run("blEnemy(1,100,'ray',20).speed>blEnemy(1,100,'octo',20).speed"));
  f.run("BL.stage=5;var jellyTest=blEnemy(1,200,'jelly',20);BL.enemies=[jellyTest];blDamage(jellyTest,1000)");assert.equal(f.state.enemies.filter(e=>e.type==='mini').length,2);f.run('blDamage(jellyTest,1000)');assert.equal(f.state.enemies.length,3);f.run('BL.enemies.slice().filter(e=>e.type==="mini").forEach(e=>blDamage(e,1000))');assert.equal(f.state.enemies.length,3);
});
check('Travel and spawning accelerate with distance',()=>{
  const f=fixture();
  for(let stage=2;stage<=10;stage++)assert(f.run(`blStageConfig(${stage}).speed>blStageConfig(${stage-1}).speed`));
  assert.equal(f.run('blStageConfig(60).interval'),.50);
});
check('Seven weapon silhouettes differ and every monster renderer executes',()=>{
  const f=fixture(),signatures=new Set();
  for(const form of ['pulse','twin','rail','rocket','plasma','frost','chain']){f.run(`BL.form='${form}'`);f.drawCalls.length=0;f.run('blDrawPlayer()');signatures.add(JSON.stringify(f.drawCalls));}
  assert.equal(signatures.size,7);
  for(const type of ['octo','crab','ray','eel','turtle','jelly','mini','mine','rock','squid'])f.run(`blDrawMonster(blEnemy(1,200,'${type}',20))`);
  f.run("BL.bossSpawned=true;blBossSpawn();BL.ink=[{x:80,y:300,vy:300,r:13,beam:false},{x:200,y:300,vy:300,r:30,beam:true}];blDraw()");
});
check('A free restart resets the run and keeps the old stage record intact',()=>{
  const f=fixture(0,47);assert.equal(f.state.best,0);
  f.run('blStart();BL.distance=231;BL.weapon=9;blChangeFleet(-3);blStart();blStart()');
  assert.equal(f.state.weapon,1);assert.equal(f.state.distance,0);assert.equal(f.state.wave,0);
  assert.equal(f.state.best,231);assert.equal(f.wallet.balance,0);
  assert.equal(f.storage.get('deep-sea-blaster-best'),'47');
  assert.equal(f.events.filter(e=>e[0]==='start').length,2);
});
check('Normal page exit reports credited rewards once while BFCache preserves the active round',()=>{
  const f=fixture();f.run('blGo();blAdvanceDistance(100001)');
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
 f.run('BL.weapon=8;blChangeFleet(-3);blStart()');assert.equal(f.state.weapon,1);assert.equal(f.run('blWeapon().kind'),'pulse');
});
check('Pacing: stage 1 speed 164, wave gap .84, in-stage boost 35%',()=>{
 const f=fixture();assert.equal(f.run('blStageConfig(1).speed'),164);assert.equal(f.run('blStageConfig(1).interval'),.84);assert.equal(f.run('blStageConfig(10).speed'),290);
 f.run('blGo();BL.distance=500');assert(Math.abs(f.run('blPace()')-1.175)<1e-9);
});
check('Starter can kill a first-stage octopus within four hits; no weapon crates fall any more',()=>{
 const f=fixture();f.run('blGo();var starter=blWeapon();var hp=blHealth()');assert(Math.ceil(f.run('hp/(starter.damage*starter.scale)'))<=4);
 assert.equal(f.state.pickups,undefined);f.run('blSpawn()');assert.equal(f.state.pickups,undefined);
});

check('Weapon cards appear only mid-fight (every 36 waves): no starter or stage-start pick, no charge, time frozen, one choice applies once',()=>{
  const f=fixture();f.run('blStart()');assert.equal(f.state.phase,'run');assert.equal(f.state.form,'pulse');assert.equal(f.state.picks.length,0);f.run('blAdvanceDistance(10000)');assert.equal(f.state.phase,'run');assert.equal(f.state.stage,2);assert.equal(f.state.picks.length,0);
  f.run("BL.sinceCard=35;BL.enemies=[blEnemy(1,300,'octo',50)];BL.bullets=[{x:200,y:400,vx:0,speed:600,kind:'pulse',color:'#fff',pierce:1,radius:0,damage:1,hits:[]}];var waveBefore=BL.wave;blSpawn()");
  assert.equal(f.state.phase,'pick');assert.equal(f.state.picks.length,3);assert.equal(f.state.sinceCard,0);assert(f.state.enemies.length>=2);assert.equal(f.state.bullets.length,1);
  assert.equal(f.el('bl-go').hidden,true);assert.equal(f.events.filter(e=>e[0]==='start').length,1);
  assert.equal(new Set(f.state.picks.map(c=>c.kind)).size,3);assert(f.state.picks.every(c=>c.type==='weapon'&&c.kind!==f.state.form));
  const frozen=f.state.enemies.map(e=>e.y);f.advance(5000);assert.deepEqual(f.state.enemies.map(e=>e.y),frozen);
  const card=f.state.picks[1],level=f.state.weapon,balance=f.wallet.balance;f.el('bl-canvas').handlers.pointerdown({clientX:200,clientY:220,pointerId:1,preventDefault(){}});f.run('blChoose(0)');assert.equal(f.state.phase,'run');assert.equal(f.state.form,card.kind);assert.equal(f.state.weapon,level);assert.equal(f.wallet.balance,balance);
  f.advance(200);assert(f.state.enemies.some(e=>e.y>frozen[0]));
  for(let i=0;i<35;i++)f.run('blSpawn()');assert.equal(f.state.phase,'run');f.run('blSpawn()');assert.equal(f.state.phase,'pick');
  const g=fixture();g.run('blStart();BL.lives=1;BL.sinceCard=35;blSpawn()');assert(g.state.picks.some(c=>c.type==='repair'));const index=g.state.picks.findIndex(c=>c.type==='repair');g.run(`blChoose(${index})`);assert.equal(g.state.lives,2);assert.equal(g.state.form,'pulse');
  const h=fixture();h.run('blStart();BL.sinceCard=35;blSpawn()');h.emitWindow('pagehide',{persisted:false});assert.equal(h.events.filter(e=>e[0]==='end').length,1);assert.equal(h.events.find(e=>e[0]==='end')[3],'abandoned');
});
check('Wave plans: quiet start (mostly one monster) ramping up to three or four per wave, unlocked types only, one rock at most',()=>{
  const f=fixture();f.run('blGo()');const plan=(stage,wave)=>{f.run(`BL.stage=${stage};BL.distance=(BL.stage-1)*1000`);return f.run(`blWavePlan(${wave})`);};
  let total1=0;for(let i=0;i<300;i++){const q=plan(1,5);total1+=q.length;assert(q.length>=1&&q.length<=5);assert(q.every(e=>e.type==='octo'));assert.equal(new Set(q.map(e=>e.lane)).size,q.length);}assert(total1/300<1.5);
  let total2=0,total8=0;
  for(let i=0;i<200;i++){const a=plan(2,5),b=plan(8,5);total2+=a.length;total8+=b.length;assert(a.every(e=>['octo','ray','crab'].includes(e.type)));assert(new Set(b.map(e=>e.lane)).size===b.length);assert(b.length<=5);assert(b.filter(e=>e.type==='rock').length<=1);}
  assert(total8/200>total1/300);assert(total8/200>=2.8);
  f.run('BL.stage=8;BL.wave=0;blSpawn()');assert(f.state.enemies.length>=1);assert(f.state.enemies.every(e=>e.hp>=1));
});
check('Empty screens call the next wave early',()=>{
  const f=fixture();f.run('blGo();BL.enemies=[];BL.nextWave=1.5;blStep(.016)');assert(f.state.nextWave<=.10);
  f.run('blStep(.11)');assert.equal(f.state.wave,1);assert(f.state.enemies.some(e=>e.y>=54));
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
  f.run("BL.x=56;BL.target=56;BL.enemies=[blEnemy(2,621,'rock',20)];blStep(.016)");assert.equal(f.state.lives,3);assert.equal(f.state.enemies.length,0);
  f.run("BL.enemies=[blEnemy(0,532,'rock',20)];blStep(.016)");assert.equal(f.state.lives,2);
});
check('Ink squid hovers, fires down the player lane, ink can be shot or hurts on contact',()=>{
  const f=fixture();f.run("blGo();BL.stage=6;BL.x=320;BL.target=320;BL.enemies=[blEnemy(1,160,'squid',50)];var squidTest=BL.enemies[0];squidTest.cd=.01");
  f.run('blAdvanceEnemy(squidTest,.02)');assert.equal(f.state.ink.length,1);assert.equal(f.state.ink[0].x,320);assert.equal(f.run('squidTest.y'),160);
  f.run('BL.ink[0].y=530;BL.shot=1;blStep(.016)');assert.equal(f.state.lives,2);assert.equal(f.state.ink.length,0);
  f.run('BL.ink=[{x:200,y:300,vy:300,r:13,beam:false}];BL.bullets=[{x:200,y:330,vx:0,speed:600,kind:"pulse",color:"#fff",pierce:1,radius:0,damage:1,hits:[]}];BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');assert.equal(f.state.ink.length,0);
  f.run('squidTest.hold=4;var y0=squidTest.y;blAdvanceEnemy(squidTest,.1)');assert(f.run('squidTest.y')>f.run('y0'));
});
check('Distance boss telegraphs attacks, boosts firepower on defeat, and withdraws',()=>{
  const f=fixture();f.run('blGo();BL.nextHazard=Infinity;blAdvanceDistance(50000)');
  assert.equal(f.state.phase,'run');const boss=f.run('BL.enemies[0]');assert.equal(boss.type,'boss');assert.equal(boss.max,f.run('blHealth()*28'));
  f.run('blStep(.016)');assert.equal(f.state.phase,'run');
  f.run('var bossTest=BL.enemies[0];bossTest.cd=.01;blAdvanceEnemy(bossTest,.02)');assert(f.run('bossTest.warn.length')>=1&&f.run('bossTest.warn.length')<=2);assert.equal(f.run('bossTest.y'),150);
  f.run('blAdvanceEnemy(bossTest,1)');assert.equal(f.run('bossTest.warn.length'),0);assert(f.state.ink.length>=1);assert(f.state.ink.every(i=>i.beam));
  f.run('BL.x=200;BL.target=200;BL.ink=[{x:200,y:530,vy:500,r:34,beam:true}];blStep(.016)');assert.equal(f.state.lives,2);
  f.run('BL.ink=[{x:80,y:530,vy:500,r:30,beam:true}];blStep(.016)');assert.equal(f.state.lives,2);
  f.run('BL.ink=[{x:200,y:300,vy:500,r:30,beam:true}];var level=BL.weapon;blDamage(bossTest,1e12)');assert.equal(f.state.weapon,f.run('level+1'));assert.equal(f.state.ink.length,0);assert.equal(f.state.kills,10);
  f.run('BL.enemies=BL.enemies.filter(e=>e.hp>0);blStep(.016)');assert.equal(f.state.phase,'run');
  const g=fixture();g.run('blGo();blBossSpawn();var bossTest=BL.enemies[0];bossTest.age=24;blAdvanceEnemy(bossTest,2)');assert.equal(g.run('bossTest.hp'),0);assert.equal(g.state.phase,'run');
});
check('Frost slows hit monsters; chain lightning hits two neighbours; bosses ignore slow',()=>{
  const f=fixture();f.run("blGo();BL.form='frost';BL.enemies=[blEnemy(2,300,'octo',50)];BL.bullets=[];BL.x=200;blBurst();var frostTarget=BL.enemies[0]");
  for(let i=0;i<30;i++)f.run('BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');assert(f.run('frostTarget.slow')>0);const y=f.run('frostTarget.y');f.run('blAdvanceEnemy(frostTarget,.1)');const slowed=f.run('frostTarget.y')-y;
  f.run('frostTarget.slow=0;var y2=frostTarget.y;blAdvanceEnemy(frostTarget,.1)');assert(f.run('frostTarget.y-y2')>slowed*1.5);
  const g=fixture();g.run("blGo();BL.form='chain';BL.enemies=[blEnemy(2,300,'octo',60),blEnemy(1,290,'octo',60),blEnemy(3,310,'octo',60),blEnemy(2,100,'octo',60)];BL.bullets=[];BL.x=200;blBurst()");
  for(let i=0;i<40;i++)g.run('BL.bullets.forEach(b=>blAdvanceBullet(b,.016))');const hps=g.state.enemies.map(e=>e.hp);assert.equal(hps.filter(h=>h<60).length,3);assert.equal(hps[3],60);
});
check('Dense fleet fires from every submarine and stays in bounds',()=>{
  const f=fixture();f.run('blGo();blChangeFleet(100);BL.x=blClampX(0);blBurst()');
  const ships=f.run('blFleet()');
  assert.equal(ships.length,35);
  assert(new Set(ships.map(s=>s.y)).size>5);
  assert.equal(ships.filter(s=>s.lead).length,1);
  assert(ships.every(s=>s.x>=9));
  assert.equal(new Set(f.state.bullets.map(b=>b.x+','+b.y)).size,35);
});
check('Bullets alter both gate signs once, and a monster in front can block the shot',()=>{
  const f=fixture();f.run('blGo();BL.gates=[{x:200,y:460,value:3,cap:5,hits:4},{x:260,y:460,value:-10}]');
  f.run('blBurst();var shot=BL.bullets[1];shot.y=480;blAdvanceBullet(shot,.04);blAdvanceBullet(shot,.04)');
  assert.equal(f.state.gates[0].value,4);assert.equal(f.state.lives,3);
  f.run('shot.x=260;shot.y=480;blAdvanceBullet(shot,.04)');assert.equal(f.state.gates[1].value,-11);
  f.run("shot.x=200;shot.y=510;BL.enemies=[{x:200,y:490,id:42,hp:10}];blAdvanceBullet(shot,.1)");
  assert.equal(f.state.gates[0].value,4);assert.equal(f.run('shot.pierce'),0);
});
check('Gate crossings apply once, skipped gates are harmless, and a fatal gate ends the attempt',()=>{
  const f=fixture();f.run('blGo();BL.gates=[{x:200,y:531,value:8},{x:280,y:531,value:-19}];blStep(.016);blStep(.016)');
  assert.equal(f.state.lives,11);assert.equal(f.state.gates.length,1);
  f.run('BL.gates[0].y=621;blStep(.016)');
  assert.equal(f.state.lives,11);assert.equal(f.state.gates.length,0);
  f.run('BL.gates=[{x:200,y:531,value:-20}];blStep(.016);blStep(.016)');
  assert.equal(f.state.lives,0);assert.equal(f.state.phase,'lost');
  assert.equal(f.events.filter(e=>e[0]==='end').length,1);
  f.run('blStart()');assert.equal(f.state.lives,3);assert.equal(f.state.gates.length,0);
});
check('Enemies approach, stop tracking near the fleet, and collisions grant brief protection',()=>{
  const f=fixture();
  f.run("blGo();var swimmer=blEnemy(1,300,'octo',100);blAdvanceEnemy(swimmer,.016)");
  assert(f.run('swimmer.x')>130);
  assert(f.run('swimmer.y')>302.9);
  f.run('swimmer.y=445;BL.x=330;var previousX=swimmer.x;blAdvanceEnemy(swimmer,.016)');
  assert.equal(f.run('swimmer.x'),f.run('previousX'));
  f.run('blHurt();blHurt()');assert.equal(f.state.lives,2);
  f.run('blStep(.31);blHurt()');assert.equal(f.state.lives,1);
});
check('The opening gate is clear, then swarms arrive in tight rows',()=>{
  const f=fixture();f.run('blGo();blSpawn()');
  assert.equal(f.state.gates[0].armor,undefined);
  assert.equal(f.state.gates[0].value,2);
  assert.equal(f.state.enemies.filter(e=>e.swarmOffset!==undefined).length,4);
  f.run('BL.enemies=[];BL.wave=12;blSpawn()');
  const swarm=f.state.enemies.filter(e=>e.swarmOffset!==undefined);
  assert.equal(swarm.length,6);
  assert.equal(new Set(swarm.map(e=>e.x)).size,4);
  assert(swarm.every(e=>e.hp<=f.run('blHealth()')));
});
check('A barricade absorbs shots before the positive value can grow',()=>{
  const f=fixture();f.run('blGo();blSpawnGates(1);var gate=BL.gates[0];gate.y=460;gate.armor=2;gate.hits=4');
  const before=f.state.gates[0].value;
  for(let shot=0;shot<3;shot++){
    f.run("var probe={x:gate.x,y:480,speed:660,pierce:3,kind:'rail',hits:[]};blAdvanceBullet(probe,.04)");
    assert.equal(f.run('probe.pierce'),shot<2?0:3);
    assert.equal(f.state.gates[0].value,before+(shot===2?1:0));
  }
  f.run('BL.x=gate.x;BL.target=gate.x;gate.y=531;gate.fallback.y=531;blStep(.016)');
  assert.equal(f.state.lives,3+before+1);
});
check('Later gates cover the whole board and a missed barricade uses the visible red penalty once',()=>{
  for(const pair of [1,2]){
    const f=fixture();f.run(`blGo();BL.lives=25;blSpawnGates(${pair});var gate=BL.gates[0],red=BL.gates[1]`);
    assert(f.run('Array.from({length:400},(_,x)=>x).every(x=>BL.gates.filter(g=>blGateContains(g,x)).length===1)'));
    assert(f.run('red.half>gate.half'));
    f.run('BL.x=gate.x;BL.target=gate.x;gate.y=531;red.y=531;blStep(.016);blStep(.016)');
    assert.equal(f.state.lives,25+f.run('red.value'));
  }
});
check('Vertical movement carries bullets and triggers a gate from the fleet position',()=>{
  const f=fixture();
  f.run('blGo();BL.nextWave=5;blAim(200,280);blStep(.40)');
  assert.equal(f.state.y,280);
  f.run('BL.bullets=[];blBurst()');
  assert.equal(f.state.bullets[1].y,272);
  f.run('BL.gates=[{x:200,y:230,value:2,cap:4,group:1},{x:280,y:230,value:-6,group:1}];blAim(200,130);blStep(.08)');
  assert.equal(f.state.lives,5);
  assert.equal(f.state.gates.length,0);
});
check('Positive gates take five shots per recruit and always respect their cap',()=>{
  const f=fixture();f.run("blGo();BL.gates=[{x:200,y:200,value:2,cap:4}];var gate=BL.gates[0];function fireGate(){blAdvanceBullet({x:200,y:220,speed:700,pierce:1,kind:'pulse',hits:[]},.04)}");
  f.run('for(var n=0;n<4;n++)fireGate()');assert.equal(f.state.gates[0].value,2);
  f.run('fireGate()');assert.equal(f.state.gates[0].value,3);
  f.run('for(var n=0;n<40;n++)fireGate()');assert.equal(f.state.gates[0].value,4);
});
check('Hard reefs spawn from 1,500 m, absorb piercing fire, and stay after contact',()=>{
  const f=fixture();f.run('blGo();BL.distance=1499;blAdvanceDistance(5)');assert.equal(f.state.enemies.length,0);
  f.run('blAdvanceDistance(5);var reef=BL.enemies[0];reef.y=400');
  assert.equal(f.run('reef.type'),'reef');
  f.run("var bolt={x:reef.x,y:470,speed:660,pierce:3,kind:'rail',hits:[]};blAdvanceBullet(bolt,.1);blDamage(reef,1e9)");
  assert.equal(f.run('bolt.pierce'),0);assert.equal(f.run('reef.hp'),1);
  f.run('reef.y=532;BL.x=BL.target=reef.x;blStep(.016)');
  assert.equal(f.state.lives,2);assert.equal(f.run('reef.hp'),1);
  f.run('BL.flash=0;blStep(.016)');assert.equal(f.state.lives,2);
});
check('In-board launch, replay and exit keep a single end event per attempt',()=>{
  const f=fixture(),launch=f.el('bl-go'),exit=f.el('bl-exit');
  assert.equal(launch.hidden,false);
  launch.handlers.click();assert.equal(f.state.phase,'run');assert.equal(launch.hidden,true);
  f.run('BL.distance=173;blChangeFleet(-3)');
  assert.equal(launch.textContent,'重新出擊');assert.equal(launch.hidden,false);
  launch.handlers.click();assert.equal(f.state.phase,'run');assert.equal(f.state.distance,0);
  f.run('BL.distance=220');exit.handlers.click();exit.handlers.click();
  assert.equal(f.ctx.window.location.hash,'lobby');assert.equal(f.state.phase,'ready');assert.equal(f.state.active,false);
  assert.equal(f.storage.get('deep-sea-blaster-distance-best'),'220');
  assert.deepEqual(f.events.filter(e=>e[0]==='end').map(e=>e[3]),['loss','abandoned']);
});
check('Guest proof replays a natural terminal run and ranks the integer distance',()=>{
  const seed=42, engine=blasterEngine, model=engine.create(replay.seeded(seed));
  const action=engine.aimCode(280,420);
  assert.equal(engine.input(model,action),true);
  let ticks=0;
  while(!model.dead&&ticks<700){engine.advance(model,.01);ticks++;}
  const distance=engine.score(model);
  assert(model.dead&&distance>0);
  assert(replay.accepts([ticks,action],engine.inputCount));
  assert.equal(replay.verify(engine,seed,[ticks,action]),distance);
  assert.equal(replay.verify(engine,seed,[ticks-1,action]),null);
});
check('Later recruitment barricades are tougher and old ranked rounds keep their armor',()=>{
  const engine=blasterEngine;
  const made=(version,distance,lives)=>{
    const model=engine.create(replay.seeded(42),version);
    model.BL.distance=distance;model.BL.lives=lives;model.blSpawnGates(1);
    return model.BL.gates[0];
  };
  assert.equal(made(1,0,3).armor,21);
  assert.equal(made(2,0,3).armor,30);
  assert.equal(made(2,0,7).armor,50);
  assert.equal(made(2,1500,7).armor,56);
  assert.equal(made(2,100000,7).armor,68);
  assert.equal(made(2,0,7).cap,5);
});
if(failures.length){console.error(failures.length+' check(s) failed');process.exitCode=1;}
console.log(`PASS: ${results.length} Reef Blaster behavior checks`);
