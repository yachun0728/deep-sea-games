// Optional behavior checks: node tools/test_blaster.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('games/blaster/game.js',root),'utf8');
const flatFee=/var stake=ENTRY_FEE/.test(source);
const fee=flatFee?Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]):20;
const results=[];
function fixture(balance=1000){
  let now=1000;
  const elements=new Map(),storage=new Map(),events=[],drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'20',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,width:400}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const document={hidden:false,hasFocus:()=>true,addEventListener(){}};
  const sandbox={document,window:{addEventListener(){}},Number,Math,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},$:el,MIN_BET:10,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fx:n=>n.toFixed(2),AN:{start:(...args)=>{events.push(['start',...args]);return 'round';},resume:(...args)=>events.push(['resume',...args]),progress:(...args)=>events.push(['progress',...args]),end:(...args)=>events.push(['end',...args])}};
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  return {ctx,el,events,storage,run:s=>vm.runInContext(s,ctx),state:ctx.BL,wallet:sandbox.S,document,advance(ms){now+=ms;vm.runInContext('blSync(performance.now())',ctx);}};
}
function check(name,fn){fn();results.push(name);}
check('Entry deducts once; insufficient, fractional and unsafe amounts rejected',()=>{
  const f=fixture();f.run('blStart();blStart()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.storage.get('crush-depth-balance'),String(1000-fee));
  for(const value of (flatFee?[]:['9','20.5','9007199254740992','NaN'])){const g=fixture();g.el('bl-amount').value=value;g.run('blStart()');assert.equal(g.wallet.balance,1000);assert.equal(g.state.active,false);}
  const g=fixture(fee-1);g.run('blStart()');assert.equal(g.wallet.balance,fee-1);assert.equal(g.state.active,false);
});
check('First checkpoint returns 0.6 times the entry once; mid-combat cashout blocked',()=>{
  const f=fixture();f.run('blStart();blCash()');assert.equal(f.wallet.balance,1000-fee);f.run('blClear();blCash();blCash()');assert.equal(f.wallet.balance,1000-fee+Math.floor(fee*.6));assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],Math.floor(fee*.6));assert.equal(f.storage.get('deep-sea-blaster-best'),'1');
});
check('Continue preserves weapon/lives and does not charge; stage ten pays 20 times the entry once',()=>{
  const f=fixture();f.run('blStart();BL.weapon=7;BL.lives=2;blClear();blStart();blStart()');assert.equal(f.state.stage,2);assert.equal(f.state.weapon,7);assert.equal(f.state.lives,2);assert.equal(f.wallet.balance,1000-fee);
  f.run('blClear()');for(let stage=3;stage<=10;stage++)f.run('blStart();blClear()');assert.equal(f.wallet.balance,1000-fee+fee*20);assert.equal(f.state.phase,'cashed');f.run('blCash();blClear()');assert.equal(f.wallet.balance,1000-fee+fee*20);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,1);
});
check('Three hits lose the entire round with one loss event',()=>{
  const f=fixture();f.run('blStart();blHurt();blHurt();blHurt();blHurt();blCash()');assert.equal(f.wallet.balance,1000-fee);assert.equal(f.state.lives,0);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
});
check('Auto-fire damages and kills; a leaking monster only costs one heart',()=>{
  const f=fixture();f.run('blStart();BL.enemies=[{x:200,y:490,hp:1,max:1,speed:0,id:1}];blStep(.016)');assert.equal(f.state.kills,1);assert.equal(f.state.enemies.length,0);
  f.run('BL.enemies=[{x:80,y:586,hp:999,max:999,speed:0,id:2}];blStep(.016);blStep(.1)');assert.equal(f.state.lives,2);assert.equal(f.state.enemies.length,0);
});
check('Collecting weapons unlocks two/three bullets, scales damage and caps at level 30',()=>{
  const f=fixture();f.run('blStart();BL.pickups=[{x:200,y:532,speed:0,boost:3}];blStep(.016)');assert.equal(f.state.weapon,4);assert.equal(f.run('blWeapon().pellets'),2);
  f.run('BL.pickups=[{x:200,y:532,speed:0,boost:6}];blStep(.016)');assert.equal(f.state.weapon,10);assert.equal(f.run('blWeapon().pellets'),3);
  f.run('BL.pickups=[{x:200,y:532,speed:0,boost:50}];blStep(.016)');assert.equal(f.state.weapon,30);assert.equal(f.run('blWeapon().damage'),10);f.run('BL.bullets=[];blBurst()');assert.equal(f.state.bullets.length,3);
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
check('Six weapon forms have unique colors and shot mechanics at their unlock levels',()=>{
  const f=fixture();const kinds=[],colors=[];
  for(const level of [1,4,8,13,18,24]){f.run(`BL.weapon=${level};BL.bullets=[];blBurst()`);kinds.push(f.run('blWeapon().kind'));colors.push(f.run('blWeapon().color'));assert(f.state.bullets.every(b=>b.kind===kinds.at(-1)));}
  assert.equal(new Set(kinds).size,6);assert.equal(new Set(colors).size,6);
  f.run('BL.weapon=8;BL.bullets=[];blBurst()');assert(f.state.bullets.some(b=>b.vx<0));assert(f.state.bullets.some(b=>b.vx>0));
});
check('Piercing rail hits three enemies once each without repeated damage',()=>{
  const f=fixture();f.run("blStart();BL.weapon=13;BL.enemies=[440,380,320].map((y,i)=>({x:200,y,hp:100,max:100,speed:0,id:i+100}));BL.bullets=[];blBurst();var testBeam=BL.bullets[0]");
  for(let i=0;i<30;i++)f.run('if(testBeam.pierce>0)blAdvanceBullet(testBeam,.02)');
  assert.equal(f.run('testBeam.hits.length'),3);assert.equal(f.run('testBeam.pierce'),0);for(const e of f.state.enemies)assert.equal(e.hp,93.25);
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
check('Generated scripts compile and existing JSON child document still decodes',()=>{
  const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}
});
export {results};
console.log(`PASS: ${results.length} Reef Blaster behavior checks`);
