// Optional behavior checks: node tools/test_pet_walk.mjs (Node.js, no packages).
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=readSource('games/pet-walk/game.js',root);
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='G.mode=\'TITLE\';ui();render();requestAnimationFrame(frame);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__pw={begin,update,render,press,release,G,CONFIG,EVT,EVENT_IDS,startTrip,ev:code=>eval(code)};'+hookAt);
const HAN=/[㐀-鿿]/;
const KEY='deep-sea-pet-walk-save';
const results=[];
function fixture(balance=500,{saved=null,lang='zh'}={}){
  const elements=new Map(),storage=new Map(saved===null?[]:[[KEY,saved]]),events=[],drawn=[];
  const rec=name=>(text)=>{drawn.push(String(text));};
  const drawing=new Proxy({},{get:(t,k)=>k==='fillText'||k==='strokeText'?rec(k):k==='measureText'?(x=>({width:String(x).length*7})):(k in t?t[k]:()=>({})),set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(name,fn){(listeners[name]??=[]).push(fn);},devicePixelRatio:1,deepSeaI18n:{getLanguage:()=>lang}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math,String,parseInt,JSON,Object,Array,Date,performance:{now:()=>1000},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const C=sandbox.__pw;
  return {C,G:C.G,el,events,storage,drawn,wallet:sandbox.S,ev:C.ev,busy:()=>vm.runInContext('petBusy',ctx),key:e=>{for(const fn of listeners.keydown||[])fn(e);},
    count:t=>events.filter(e=>e[0]===t).length,
    // Play one tick like a player would: tap to walk, tap to dismiss events, tap to stop the wheel.
    tick(){
      const G=C.G;
      if(G.mode==='WALK'){C.press(null);C.update(0.2);C.release();}
      else if(G.mode==='EVENT'){C.update(0.5);C.press(null);}
      else if(G.mode==='WHEEL'){C.update(0.5);if(G.wheel&&G.wheel.phase==='spin')C.press(null);}
      return G.mode;
    },
    drive(until,cap=20000){let n=0;while(!until()){if(++n>cap)throw new Error('drive cap');const m=this.tick();if(m==='DIARY'||m==='TITLE')break;}}};
}
function check(name,fn){fn();results.push(name);}
const reseed=(f,n)=>f.ev('rng=mulberry32('+n+')');

check('Free entry: a zero balance can start a trip and nothing is deducted',()=>{
  const f=fixture(0);f.C.begin();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts exactly once, calls AN.start once, and repeat clicks do nothing',()=>{
  const f=fixture(500);f.C.begin();f.C.begin();f.C.begin();
  assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.busy(),true);assert.equal(f.G.mode,'WALK');
});
check('Tapping the canvas or pressing Space on the title screen never starts a trip or spends points',()=>{
  const f=fixture(500);f.C.press(null);f.C.press({x:200,y:330});f.C.press({x:200,y:10});
  assert.equal(f.G.mode,'TITLE');assert.equal(f.busy(),false);assert.equal(f.wallet.balance,500);assert.equal(f.count('start'),0);
  const k={code:'Space',key:' ',target:{tagName:'CANVAS'},preventDefault(){this.stopped=true;}};f.key(k);
  assert.equal(f.G.mode,'TITLE');assert.equal(f.wallet.balance,500);
});
check('BONUS: +1 point at steps 20, 40 and 60, each exactly once; whole trip nets -7',()=>{
  const f=fixture(500);reseed(f,11);f.C.begin();
  const seen=[];
  f.drive(()=>{const s=f.G.trip.steps;if(s>0&&s%20===0&&!seen.includes(s)){seen.push(s);assert.equal(f.wallet.balance,500-fee+s/20,'balance at step '+s);assert.equal(f.count('progress'),s/20);}return false;});
  assert.deepEqual(seen,[20,40,60]);
  assert.deepEqual(f.events.filter(e=>e[0]==='progress').map(e=>e[2].stage),[1,2,3]);
  assert.equal(f.wallet.balance,500-fee+3);assert.equal(f.count('progress'),3);assert.equal(f.count('end'),1);
  assert.equal(f.events.find(e=>e[0]==='end')[2],3,'payout is the BONUS total');
  assert.equal(f.busy(),false);assert.equal(f.G.mode,'DIARY');
});
check('Wheel, loot and score never change the wallet: 25 seeded trips each end at exactly start - fee + 3',()=>{
  for(let seed=1;seed<=25;seed++){
    const f=fixture(500);reseed(f,seed*7919);f.C.begin();f.drive(()=>false);
    assert.equal(f.wallet.balance,500-fee+3,'seed '+seed);assert.equal(f.count('start'),1);assert.equal(f.count('end'),1);assert.equal(f.G.save.trips,1);
  }
});
check('Wheel AI shard and rainbow boost give items only, not points',()=>{
  const f=fixture(500);f.C.begin();const before=f.wallet.balance;
  f.ev("G.force='E01';triggerEvent()");f.C.update(0.5);f.C.press(null);assert.equal(f.G.mode,'WHEEL');
  f.ev("G.wheel.phase='spin';G.wheel.t=0.6;G.rainbow=3;G.wheel.boosted=true");f.ev("G.rng_cell=7");
  f.ev("(function(){G.wheel.cell=7;applyWheelCell(G.wheel);finishWheel();})()");
  assert.equal(f.wallet.balance,before);assert.ok((f.G.save.inv.itm_ai_word||0)>=1);
});
check('Choice events: Space or 8 s idle picks the free default option, so keyboard-only play cannot get stuck',()=>{
  for(const id of['E03','E04','E07']){
    const f=fixture(500);f.C.begin();f.ev("G.force='"+id+"';triggerEvent()");assert.equal(f.G.ev.phase,'choice',id);
    f.C.update(0.5);f.C.press(null);assert.notEqual(f.G.ev.phase,'choice',id+' Space');
    const g=fixture(500);g.C.begin();g.ev("G.force='"+id+"';triggerEvent()");
    for(let i=0;i<200&&g.G.ev&&g.G.ev.phase==='choice';i++)g.C.update(0.05);
    assert.ok(!g.G.ev||g.G.ev.phase!=='choice',id+' idle');
  }
});
check('Disabled choices cannot be picked (rope pry without rope, can feed without can)',()=>{
  const f=fixture(500);f.C.begin();f.ev("G.force='E03';triggerEvent()");f.C.update(0.5);
  f.C.press({x:210,y:200});assert.equal(f.G.ev.phase,'choice');
  assert.equal(f.G.save.inv.itm_rope||0,0);
  const g=fixture(500);g.C.begin();g.ev("G.force='E04';triggerEvent()");g.C.update(0.5);g.C.press({x:40,y:200});assert.equal(g.G.ev.phase,'choice');
});
check('Finale: after step 60 a last wheel appears before the diary, gives no points, and the trip ends once',()=>{
  const f=fixture(500);reseed(f,5);f.C.begin();let sawFinale=false;
  f.drive(()=>{if(f.G.ev&&f.G.ev.finale)sawFinale=true;return false;});
  assert.equal(sawFinale,true);assert.equal(f.G.mode,'DIARY');assert.equal(f.count('end'),1);assert.equal(f.wallet.balance,500-fee+3);
});
check('3 AI shards turn into next-trip wheel luck, never into points',()=>{
  const f=fixture(500,{saved:JSON.stringify({version:3,best:0,trips:1,inv:{itm_ai_word:4},dexEvents:{},dexItems:{},lastEvent:null})});
  f.C.begin();assert.equal(f.G.save.inv.itm_ai_word,1);assert.equal(f.G.rainbow,3);assert.equal(f.wallet.balance,500-fee);
  const g=fixture(500,{saved:JSON.stringify({version:3,best:0,trips:1,inv:{itm_ai_word:2},dexEvents:{},dexItems:{},lastEvent:null})});
  g.C.begin();assert.equal(g.G.save.inv.itm_ai_word,2);assert.equal(g.G.rainbow,0);
});
check('Finish settles only once even if called again',()=>{
  const f=fixture(500);f.C.begin();f.ev('finishTrip(5)');f.ev('finishTrip(5)');assert.equal(f.count('end'),1);assert.equal(f.busy(),false);
});
check('Save: bad JSON, wrong version and negative or fractional numbers fall back safely; valid data loads',()=>{
  assert.equal(fixture(500,{saved:'{bad'}).G.save.best,0);
  assert.equal(fixture(500,{saved:JSON.stringify({version:2,best:99})}).G.save.best,0);
  assert.equal(fixture(500,{saved:JSON.stringify({version:3,best:-5,trips:'x'})}).G.save.best,0);
  assert.equal(fixture(500,{saved:JSON.stringify({version:3,best:12.7})}).G.save.best,12);
  const f=fixture(500,{saved:JSON.stringify({version:3,best:40,trips:2,inv:{itm_can:3},dexEvents:{},dexItems:{},lastEvent:'E02'})});
  assert.equal(f.G.save.best,40);assert.equal(f.G.save.inv.itm_can,3);
  const g=fixture(500);g.C.begin();g.drive(()=>false);assert.ok(JSON.parse(g.storage.get(KEY)).trips===1,'trip count saved');
});
check('Keys only work while the pet-walk view is shown, and not on buttons or inputs',()=>{
  const f=fixture();f.C.begin();
  const e=(tag)=>({code:'Space',key:' ',target:{tagName:tag},preventDefault(){this.done=true;}});
  f.el('view-pet-walk').hidden=true;let k=e('CANVAS');f.key(k);assert.equal(k.done,undefined);
  f.el('view-pet-walk').hidden=false;k=e('BUTTON');f.key(k);assert.equal(k.done,undefined);
  k=e('INPUT');f.key(k);assert.equal(k.done,undefined);
  k=e('CANVAS');f.key(k);assert.equal(k.done,true);
});
check('Wallet snapshot and analytics name include pet-walk',()=>{
  const read=p=>fs.readFileSync(new URL(p,root),'utf8');
  assert.ok(read('js/bootstrap.js').includes('(petBusy ? petStake : 0)'));
  assert.ok(read('js/analytics.js').includes("'pet-walk':'小灰出門'"));
  assert.ok(read('games/catalog.json').includes('"id": "pet-walk"'));
});
check('Every element id in the Pet Walkies view is unique across all game views and templates',()=>{
  const ids=new Map(),files=[...fs.readdirSync(new URL('games/',root)).filter(d=>fs.existsSync(new URL('games/'+d+'/view.html',root))).map(d=>'games/'+d+'/view.html'),'templates/index.html','templates/lobby.html'];
  for(const file of files){const text=fs.readFileSync(new URL(file,root),'utf8');for(const m of text.matchAll(/\sid="([^"]+)"/g))ids.set(m[1],(ids.get(m[1])||[]).concat(file));}
  const mine=[...fs.readFileSync(new URL('games/pet-walk/view.html',root),'utf8').matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(mine.length>=7);
  for(const id of mine)assert.deepEqual(ids.get(id),['games/pet-walk/view.html'],'id '+id+' is also used in '+ids.get(id));
});
function sweep(f){
  // Render every screen: title, each event (normal and rare, all choices), wheel phases, diary, collection.
  const C=f.C;C.render();
  for(const id of C.EVENT_IDS)for(const rare of[false,true]){
    C.begin?0:0;
    f.ev("(function(){if(!petBusy){}G.force='"+id+"';G.forceRare="+rare+";triggerEvent();})()");C.render();
    for(let i=0;i<60&&f.G.mode!=='WALK';i++){C.update(0.3);C.render();if(f.G.mode==='EVENT')C.press(null);if(f.G.mode==='WHEEL'&&f.G.wheel&&f.G.wheel.phase==='spin')C.press(null);}
  }
  f.drive(()=>false);C.render();
  f.G.mode='DEX';C.render();for(const id of C.EVENT_IDS){f.G.save.dexEvents[id]={n:1,r:1};f.G.dexSelected=id;C.render();}
  f.G.dexSelected=null;f.G.mode='DIARY';C.render();
}
check('Drawing runs in every state without throwing (Chinese)',()=>{
  const f=fixture(5000);f.C.begin();reseed(f,3);sweep(f);assert.ok(f.drawn.some(t=>HAN.test(t)),'Chinese mode draws Chinese');
});
check('English mode draws no Chinese character on any screen',()=>{
  const f=fixture(5000,{lang:'en'});f.C.begin();reseed(f,3);sweep(f);
  const bad=[...new Set(f.drawn.filter(t=>HAN.test(t)))];assert.deepEqual(bad,[]);assert.ok(f.drawn.length>100);
});
console.log(results.length+' pet-walk checks passed');
