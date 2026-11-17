// Optional behavior checks: node tools/test_blaster.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('games/blaster/game.js',root),'utf8');
const results=[];
function fixture(balance=1000){
  let now=1000;
  const elements=new Map(),storage=new Map(),events=[],drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'20',textContent:'',className:'',dataset:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,width:400}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const document={hidden:false,hasFocus:()=>true,addEventListener(){}};
  const sandbox={document,window:{addEventListener(){}},Number,Math,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},$:el,MIN_BET:10,reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fx:n=>n.toFixed(2),AN:{start:(...args)=>{events.push(['start',...args]);return 'round';},resume:(...args)=>events.push(['resume',...args]),progress:(...args)=>events.push(['progress',...args]),end:(...args)=>events.push(['end',...args])}};
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  return {ctx,el,events,storage,run:s=>vm.runInContext(s,ctx),state:ctx.BL,wallet:sandbox.S,document,advance(ms){now+=ms;vm.runInContext('blSync(performance.now())',ctx);}};
}
function check(name,fn){fn();results.push(name);}
check('Entry deducts once; insufficient, fractional and unsafe amounts rejected',()=>{
  const f=fixture();f.run('blStart();blStart()');assert.equal(f.wallet.balance,980);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.storage.get('crush-depth-balance'),'980');
  for(const value of ['9','20.5','9007199254740992','NaN']){const g=fixture();g.el('bl-amount').value=value;g.run('blStart()');assert.equal(g.wallet.balance,1000);assert.equal(g.state.active,false);}
  const g=fixture(19);g.run('blStart()');assert.equal(g.wallet.balance,19);assert.equal(g.state.active,false);
});
check('First checkpoint pays 12 for stake 20, exactly once; mid-combat cashout blocked',()=>{
  const f=fixture();f.run('blStart();blCash()');assert.equal(f.wallet.balance,980);f.run('blClear();blCash();blCash()');assert.equal(f.wallet.balance,992);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[2],12);assert.equal(f.storage.get('deep-sea-blaster-best'),'1');
});
check('Continue preserves weapon/lives and does not charge; stage ten pays 400 once',()=>{
  const f=fixture();f.run('blStart();BL.weapon=7;BL.lives=2;blClear();blStart();blStart()');assert.equal(f.state.stage,2);assert.equal(f.state.weapon,7);assert.equal(f.state.lives,2);assert.equal(f.wallet.balance,980);
  f.run('blClear()');for(let stage=3;stage<=10;stage++)f.run('blStart();blClear()');assert.equal(f.wallet.balance,1380);assert.equal(f.state.phase,'cashed');f.run('blCash();blClear()');assert.equal(f.wallet.balance,1380);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,1);
});
check('Three hits lose the entire round with one loss event',()=>{
  const f=fixture();f.run('blStart();blHurt();blHurt();blHurt();blHurt();blCash()');assert.equal(f.wallet.balance,980);assert.equal(f.state.lives,0);assert.equal(f.state.active,false);assert.equal(f.events.filter(e=>e[0]==='end').length,1);assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');
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
check('Generated scripts compile and existing JSON child document still decodes',()=>{
  const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}
});
export {results};
console.log(`PASS: ${results.length} Reef Blaster behavior checks`);
