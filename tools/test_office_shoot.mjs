// Optional behavior checks: node tools/test_office_shoot.mjs (Node.js, no packages).
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=readSource('games/office-shoot/game.js',root);
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();render();requestAnimationFrame(frame);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const hook=`globalThis.__os={frame,begin,ev:code=>{const v=eval(code);syncSimulation();return v&&typeof v==="object"?"@@"+JSON.stringify(v):v;}};`;
const source=raw.replace(hookAt,()=>hook+hookAt);
const HAN=/[㐀-鿿]/;
const results=[];
function fixture(balance=500,{lang='zh-Hant',best=null}={}){
  let now=1000;
  const elements=new Map(),storage=new Map(best===null?[]:[['deep-sea-office-shoot-best',String(best)]]),events=[],drawn=[];
  const gradient={addColorStop(){}};
  const drawing=new Proxy({},{get:(t,k)=>{
    if(k==='measureText')return ()=>({width:10});
    if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>gradient;
    if(k==='fillText'||k==='strokeText')return s=>drawn.push(String(s));
    return k in t?t[k]:()=>{};
  },set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{id,hidden:false,textContent:'',className:'',dataset:{},style:{},disabled:false,width:0,height:0,handlers:{},focus(){},setPointerCapture(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:450,height:800}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={},on=(name,fn)=>{(listeners[name]??=[]).push(fn);};
  const i18n={language:lang,getLanguage(){return this.language;},text:s=>'EN:'+s};
  const sandbox={document:{hidden:false,addEventListener:on},window:{devicePixelRatio:1,addEventListener:on,deepSeaI18n:i18n},navigator:{},addEventListener:on,
    Number,Math,String,JSON,Set,Object,Array,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
    requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},
    AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(`var otBusy=false,otStake=0,otSay=function(){};`,ctx);for(const file of ['shared/timed-replay.cjs','shared/office-shoot-rules.cjs','js/timed-leaderboard.js'])vm.runInContext(readSource(file,root),ctx);vm.runInContext(source,ctx);
  const modelNames=new Set('state phase stage stageT phaseT score t overT kills p bullets enemies crates bosses hazards parts texts beams rings shake banner flash danger bossTotal curBoss spawnT crateT sinceWeapon modsTaken eliteT shotSfxT quipT critT overTitle overQuip keys ETYPES spawnEnemy spawnCrate spawnBoss damage gameOver'.split(' '));
  const rawEv=sandbox.__os.ev,ev=c=>{c=c.replace(/(?<![\w.])\b[A-Za-z_]\w*\b/g,n=>modelNames.has(n)?'G.'+n:n);const v=rawEv(c);return typeof v==='string'&&v.startsWith('@@')?JSON.parse(v.slice(2)):v;};
  const fire=(type,e)=>{for(const fn of listeners[type]||[])fn(e);};
  const f={sandbox,el,events,storage,drawn,i18n,wallet:sandbox.S,ev,fire,begin:sandbox.__os.begin,busy:()=>vm.runInContext('otBusy',ctx),
    key:e=>fire('keydown',e),keyup:e=>fire('keyup',e),
    ptr:(type,x,y,id=1,pointerType='touch')=>el('os-canvas').handlers[type]({button:0,clientX:x,clientY:y,pointerId:id,pointerType,preventDefault(){}}),
    // Advance the real loop by n frames of dt seconds.
    step(n,dt=.05){for(let i=0;i<n;i++){now+=dt*1000;sandbox.__os.frame(now);}},
    count:type=>events.filter(e=>e[0]===type).length,
    // Jump to the boss of the current day and defeat every real boss through the normal damage path.
    beatBoss(){ev("enemies=[];hazards=[];phase='boss';phaseT=0;spawnBoss();for(const b of bosses.slice())if(!b.fake&&!b.dead)damage(b,1e18,{x:b.x,y:b.y})");},
    nextDay(){f.beatBoss();f.step(60);},
    // A grunt placed on the clock-out line ends the shift on the next update (player moved away so auto-fire cannot kill it first).
    overtime(){ev("bullets=[];p.x=p.tx=30;spawnEnemy('grunt',W-30,LINE+1,true)");f.step(2);}};
  return f;
}
function check(name,fn){fn();results.push(name);}

check('Free entry: a zero balance can start a shift and nothing is deducted',()=>{
  const f=fixture(0);f.begin();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts the fixed entry fee once even when clicked twice',()=>{
  const f=fixture();f.begin();f.begin();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.deepEqual(f.events[0],['start','office-shoot',fee]);
  assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.equal(f.ev('state'),'play');
  f.step(2);assert.equal(f.el('os-go').disabled,true);assert.equal(f.el('os-go').textContent,'上班中');
});
check('Canvas taps and Space never start or pay for a shift',()=>{
  const f=fixture();f.ptr('pointerdown',200,400);f.key({key:' ',target:{tagName:'CANVAS'},preventDefault(){}});f.step(3);
  assert.equal(f.ev('state'),'menu');assert.equal(f.wallet.balance,500);assert.equal(f.count('start'),0);
});
check('Days 1-5 each pay +2 once when the boss falls; day 6 onwards pays nothing (max 10)',()=>{
  const f=fixture();f.begin();
  for(let day=1;day<=5;day++){
    assert.equal(f.ev('stage'),day);f.nextDay();assert.equal(f.wallet.balance,500-fee+2*day,'balance after day '+day);
  }
  assert.equal(f.ev('stage'),6);f.nextDay();f.nextDay();assert.equal(f.ev('stage'),8);
  assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.ev('earned'),10);assert.equal(f.count('progress'),5);
  const prog=f.events.filter(e=>e[0]==='progress').map(e=>e[2]);
  assert.deepEqual(prog.map(p=>p.bonus_points),[2,2,2,2,2]);assert.deepEqual(prog.map(p=>p.total_bonus_points),[2,4,6,8,10]);assert.deepEqual(prog.map(p=>p.stage),[1,2,3,4,5]);
  assert.equal(f.el('os-pay').textContent,'10 / 10');
});
check('The same day never pays twice even if the clear callback repeats',()=>{
  const f=fixture();f.begin();f.beatBoss();f.ev('dayCleared(1);dayCleared(1)');f.step(2);
  assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('progress'),1);
});
check('Mirror and split bosses pay only once the real boss(es) all fall',()=>{
  const f=fixture();f.begin();f.ev('stage=7');f.ev("phase='boss';spawnBoss()");assert.equal(f.ev('bosses.length'),2);
  f.ev('const fk=bosses.find(b=>b.fake);damage(fk,1e18,{x:fk.x,y:fk.y})');f.step(1);assert.equal(f.count('progress'),0);assert.equal(f.ev('phase'),'boss');
  const g=fixture();g.begin();g.ev("phase='boss';spawnBoss();const b=bosses[0];damage(b,b.max*.6,{x:b.x,y:b.y})");assert.equal(g.ev('bosses.filter(b=>!b.dead).length'),2);assert.equal(g.count('progress'),0);
  g.ev('for(const b of bosses.slice())if(!b.dead)damage(b,1e18,{x:b.x,y:b.y})');assert.equal(g.count('progress'),1);assert.equal(g.wallet.balance,500-fee+2);
});
check('Overtime before any boss ends once as a loss with no points and saves the best score',()=>{
  const f=fixture(500,{best:5});f.begin();f.ev('score=1234');f.overtime();
  assert.equal(f.ev('state'),'over');assert.equal(f.busy(),false);assert.equal(f.count('end'),1);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],0);assert.equal(end[3],'loss');assert.equal(end[4].stage,1);
  assert.equal(f.wallet.balance,500-fee);assert.equal(f.storage.get('deep-sea-office-shoot-best'),'1234');
  f.step(40);f.ev('gameOver(0,0)');f.ev('settle()');assert.equal(f.count('end'),1);
});
check('Overtime after BONUS keeps the credited points and reports them once as complete',()=>{
  const f=fixture();f.begin();f.nextDay();f.nextDay();const b=f.wallet.balance;assert.equal(b,500-fee+4);f.overtime();
  assert.equal(f.wallet.balance,b);const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],4);assert.equal(end[3],'complete');assert.equal(end[4].stage,3);
  assert.equal(f.el('os-go').textContent,'再上一次班');
});
check('Another shift after the end deducts again and resets BONUS eligibility',()=>{
  const f=fixture();f.begin();f.nextDay();f.overtime();f.begin();
  assert.equal(f.wallet.balance,500-fee*2+2);assert.equal(f.count('start'),2);assert.equal(f.ev('earned'),0);assert.equal(f.ev('stage'),1);assert.equal(f.busy(),true);
  f.nextDay();assert.equal(f.wallet.balance,500-fee*2+4);
});
check('Leaving the page reports abandoned with the credited points before the shared handler; BFCache keeps the shift',()=>{
  const f=fixture();f.begin();f.nextDay();f.fire('pagehide',{persisted:true});assert.equal(f.count('end'),0);assert.equal(f.busy(),true);
  f.fire('pagehide',{persisted:false});assert.equal(f.count('end'),1);const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],2);assert.equal(end[3],'abandoned');assert.equal(f.busy(),false);
  f.fire('pagehide',{persisted:false});assert.equal(f.count('end'),1);
});
check('Pausing (hidden view, blur, hash change) freezes the shift; a tap or Space resumes',()=>{
  const f=fixture();f.begin();f.step(10);const t=f.ev('stageT');f.fire('blur');assert.equal(f.ev('paused'),true);f.step(20);assert.equal(f.ev('stageT'),t);
  f.ptr('pointerdown',300,400);assert.equal(f.ev('paused'),false);f.step(4);assert.ok(f.ev('stageT')>t);
  f.fire('hashchange');assert.equal(f.ev('paused'),true);f.key({key:' ',target:{tagName:'CANVAS'},preventDefault(){}});assert.equal(f.ev('paused'),false);
  f.el('view-office-shoot').hidden=true;const t2=f.ev('stageT');f.step(20);assert.equal(f.ev('stageT'),t2);assert.equal(f.count('end'),0);
});
check('Keys only steer while the view is shown and a shift runs; buttons and inputs are left alone',()=>{
  const f=fixture();const k=(key,tagName='CANVAS')=>({key,target:{tagName},preventDefault(){this.done=true;}});
  let e=k('ArrowRight');f.key(e);assert.equal(e.done,undefined);
  f.begin();e=k('ArrowRight');f.key(e);assert.equal(e.done,true);assert.equal(f.ev('keys.right'),true);f.keyup({key:'ArrowRight'});assert.equal(f.ev('keys.right'),false);
  e=k('ArrowLeft','BUTTON');f.key(e);assert.equal(e.done,undefined);
  f.el('view-office-shoot').hidden=true;e=k('ArrowLeft');f.key(e);assert.equal(e.done,undefined);
});
check('Touch drag moves relative to the finger; mouse follows the pointer',()=>{
  const f=fixture();f.begin();const x0=f.ev('p.x');f.ptr('pointerdown',100,600);f.ptr('pointermove',160,600);assert.ok(Math.abs(f.ev('drawX(p.tx)')-f.ev('drawX('+x0+')')-60)<.11);
  f.ptr('pointerup',160,600);f.ptr('pointermove',10,600);assert.ok(Math.abs(f.ev('drawX(p.tx)')-f.ev('drawX('+x0+')')-60)<.11);
  f.ptr('pointermove',90,600,2,'mouse');assert.equal(f.ev('drawX(p.tx)'),90);
});
check('The camera preserves lane coordinates and pointer inversion at both lane boundaries',()=>{
  const f=fixture();for(const x of [0,22,90,112.5,174,190,225,300,428,450]){
    assert.ok(Math.abs(f.ev('worldX(drawX('+x+'))')-x)<1e-9);
  }
  assert.equal(f.ev('MID'),225);assert.equal(f.ev('drawX(MID)'),190);
});
check('Reset guard and message: otSay shows the shared note',()=>{
  const f=fixture();f.ev('otSay("這一局結束後才能重設點數。")');f.step(1);assert.equal(f.el('os-msg').textContent,'這一局結束後才能重設點數。');
  f.i18n.language='en';f.step(1);assert.equal(f.el('os-msg').textContent,'EN:這一局結束後才能重設點數。');
});
check('English mode draws no Chinese on the canvas in every state, and switching back restores Chinese',()=>{
  const f=fixture(500,{lang:'en'});f.step(2);f.begin();f.step(40);
  for(let day=1;day<=12;day++){f.ev('banner=null');f.ev("enemies=[];phase='waves';stageT=STAGE_LEN-.05");f.step(60);f.ev("for(const b of bosses.slice())if(!b.fake&&!b.dead)damage(b,1e18,{x:b.x,y:b.y})");f.step(30);}
  f.ev('for(const kind of Object.keys(ETYPES))spawnEnemy(kind,300,200,true);spawnCrate();spawnCrate();p.tier=6');f.step(5);f.ev('paused=true');f.step(2);f.ev('paused=false');f.overtime();f.step(40);
  const zh=f.drawn.filter(s=>HAN.test(s));assert.deepEqual([...new Set(zh)],[]);
  for(const id of ['os-day','os-pay','os-msg'])assert.ok(!HAN.test(f.el(id).textContent),id+' has Chinese: '+f.el(id).textContent);
  f.i18n.language='zh-Hant';f.drawn.length=0;f.step(2);assert.ok(f.drawn.some(s=>HAN.test(s)));assert.ok(HAN.test(f.el('os-msg').textContent));
});
check('Drawing runs in every state without throwing (menu, play, boss mechanics, pause, over)',()=>{
  const f=fixture();f.step(3);f.begin();
  for(let day=1;day<=16;day++){f.ev("phase='waves';stageT=STAGE_LEN-.05");f.step(70);f.step(30);f.ev("for(const b of bosses.slice())if(!b.fake&&!b.dead)damage(b,1e18,{x:b.x,y:b.y})");f.step(60);}
  assert.ok(f.ev('stage')>=10);f.overtime();f.step(40);assert.equal(f.count('end'),1);
});

console.log('office-shoot: '+results.length+' checks passed');
for(const r of results)console.log(' ✓ '+r);
