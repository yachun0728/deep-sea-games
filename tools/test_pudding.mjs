// Optional behavior checks: node tools/test_pudding.mjs (Node.js, no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/pudding/game.js',root),'utf8');
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='ui();draw();requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const hook=`globalThis.__pd={update,start,draw,ev:code=>{const v=eval(code);return v&&typeof v==="object"?"@@"+JSON.stringify(v):v;}};`;
const source=raw.replace(hookAt,()=>hook+hookAt);
const results=[];
export function fixture(balance=500,savedBest=null,random=Math.random){
  let now=1000;
  const elements=new Map(),storage=new Map(savedBest===null?[]:[['deep-sea-pudding-best',String(savedBest)]]),events=[];
  const drawing=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
  function el(id){if(!elements.has(id))elements.set(id,{hidden:false,value:'10',textContent:'',className:'',dataset:{},style:{},disabled:false,handlers:{},focus(){},setPointerCapture(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:400,height:560}),addEventListener(type,fn){this.handlers[type]=fn;}});return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const sandbox={document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',reduceMotion:true,S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const raw_ev=sandbox.__pd.ev,F={update:sandbox.__pd.update,start:sandbox.__pd.start,draw:sandbox.__pd.draw,ev:c=>{const v=raw_ev(c);return typeof v==='string'&&v.startsWith('@@')?JSON.parse(v.slice(2)):v;}};
  const fire=(type,e)=>{for(const fn of listeners[type]||[])fn(e);};
  return {F,el,events,storage,wallet:sandbox.S,ev:F.ev,busy:()=>vm.runInContext('puddingBusy',ctx),key:e=>fire('keydown',e),keyup:e=>fire('keyup',e),
    tap:(x,y)=>el('pd-canvas').handlers.pointerdown({button:0,clientX:x,clientY:y,pointerId:1,preventDefault(){}}),
    up:()=>el('pd-canvas').handlers.pointerup({}),
    step(n,dt=.05){for(let i=0;i<n;i++)F.update(dt);},
    // Pick the first card, drop it on the grid at (gx,gy) and confirm; then wait out the camp banner into the run.
    forgeAndGo(gx=0,gy=0){F.ev('sel=0;ghost={x:'+gx+',y:'+gy+'};clampGhost();forgeConfirm()');this.step(30);},
    skipAndGo(){F.ev('forgeSkip()');this.step(30);},
    // Finish the current segment with nothing on the field.
    clearSeg(){F.ev('enemies=[];warns=[];archers=[];arrows=[];rt=SEG_TIME-.01;spawnT=99');F.update(.05);},
    count:type=>events.filter(e=>e[0]===type).length};
}
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Free entry: a zero balance can start a round and nothing is deducted',()=>{
  const f=fixture(0);f.F.start();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts the entry fee once even when clicked twice, then opens the camp',()=>{
  const f=fixture();f.F.start();f.F.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);
  assert.deepEqual(f.events[0],['start','pudding',fee]);assert.equal(f.ev('ph'),'forge');assert.equal(f.ev('seg'),1);
});
check('Camps 1-2 offer only blade and spear pieces; shield pieces appear from segment 3',()=>{
  const f=fixture();f.F.start();assert.deepEqual(f.F.ev('cards.map(c=>c.type).sort()'),['b','m']);
  f.skipAndGo();f.clearSeg();f.step(20);assert.equal(f.F.ev('seg'),2);assert.deepEqual(f.F.ev('cards.map(c=>c.type).sort()'),['b','m']);
  f.skipAndGo();f.clearSeg();f.step(20);assert.equal(f.F.ev('seg'),3);assert.deepEqual(f.F.ev('cards.map(c=>c.type).sort()'),['b','d','m']);
});
check('Counters: shield soldiers resist blades and break on spears; cavalry is barely slowed and knocked back further',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('spawnT=99;px=200');
  const hit=(t,kind)=>{f.F.ev("const c=weaponCells(200).find(c=>c.t==='"+kind+"');enemies=[{t:'"+t+"',x:c.cx,y:c.cy,hp:100,maxHp:100,speed:0,flash:0,slow:false,spearCd:"+(kind==='m'?0:99)+"}]");
    const y0=f.F.ev('enemies[0].y');f.step(1);return {dmg:100-f.F.ev('enemies[0].hp'),moved:y0-f.F.ev('enemies[0].y')}};
  const inf=hit('inf','m'),sh=hit('shield','m'),cav=hit('cav','m');
  assert.ok(sh.dmg>inf.dmg,'spear breaks shield soldiers');assert.ok(cav.moved>inf.moved,'spear knocks cavalry back further');
  const ib=hit('inf','b'),sb=hit('shield','b');assert.ok(sb.dmg<ib.dmg*.6,'blades are weak against shield soldiers');
  f.F.ev("const c=weaponCells(200).find(c=>c.t==='b');enemies=[{t:'cav',x:c.cx,y:c.cy,hp:100,maxHp:100,speed:100,flash:0,slow:false,spearCd:99},{t:'inf',x:c.cx,y:c.cy,hp:100,maxHp:100,speed:100,flash:0,slow:false,spearCd:99}]");
  f.step(1);   // the first frame sets the slow flag, the second frame moves slowed
  const yc=f.F.ev('enemies[0].y'),yi=f.F.ev('enemies[1].y');f.step(1);
  assert.ok((f.F.ev('enemies[0].y')-yc)>(f.F.ev('enemies[1].y')-yi)*1.4,'blades slow infantry more than cavalry');
});
check('Starting weapon: blade 8/s, spear 6, no guard; clusters of 3+ count extra',()=>{
  const f=fixture();assert.equal(f.ev('stats.bladeDps'),8);assert.equal(f.ev('stats.spear'),6);assert.equal(f.ev('stats.guard'),0);
  assert.equal(f.ev("computeStats([['b','b','b',null],[null,null,null,null],[null,null,null,null],[null,null,null,null]]).E.b"),4);
  assert.equal(f.ev("computeStats([['d','d','d','d'],['d','d','d','d'],[null,null,null,null],[null,null,null,null]]).guard"),.6);
});
check('A piece dropped at the edge is clamped inside the grid and overwrites what is there',()=>{
  const f=fixture();f.F.start();
  f.F.ev("cards[0]={type:'d',cells:[[0,0],[1,0],[2,0],[3,0]]};sel=0");
  f.tap(300,300);assert.deepEqual(f.ev('ghost'),{x:0,y:3});
  f.tap(75,515);assert.equal(f.ev('dims(cards[0].cells).h'),4);assert.equal(f.ev('ghost.x'),0);f.tap(300,300);assert.deepEqual(f.ev('ghost'),{x:3,y:0});
  f.tap(200,515);assert.equal(f.ev("grid[3][3]"),'d');assert.equal(f.ev("grid[0][3]"),'d');assert.equal(f.ev("fPhase"),'delay');
  assert.equal(f.ev('grid[2][1]'),'b');   // untouched cell keeps its blade
});
check('Confirm does nothing without a selected piece and preview; skip always works',()=>{
  const f=fixture();f.F.start();f.tap(200,515);assert.equal(f.ev('fPhase'),'edit');f.tap(325,515);assert.equal(f.ev('fPhase'),'banner');
  f.step(30);assert.equal(f.ev('ph'),'run');
});
check('Rotating four times restores the piece',()=>{
  const f=fixture();const r=f.ev("(()=>{let c=[[0,0],[0,1],[0,2],[1,2]];const o=JSON.stringify(c.slice().sort());for(let i=0;i<4;i++)c=rotateCells(c);return JSON.stringify(c.slice().sort())===o})()");assert.equal(r,true);
});
check('Hold keys walk the hero, release stops, edges clamp, other views ignore keys',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('spawnT=99');
  const e=k=>({key:k,repeat:false,target:{tagName:'CANVAS'},preventDefault(){this.done=true;}});
  let k=e('ArrowRight');f.key(k);assert.equal(k.done,true);const x0=f.ev('px');f.step(10,.05);assert.ok(Math.abs(f.ev('px')-x0-115)<1e-6);
  f.keyup({key:'ArrowRight'});const x1=f.ev('px');f.step(5);assert.equal(f.ev('px'),x1);
  f.key(e('d'));f.step(100);assert.equal(f.ev('px'),340);f.keyup({key:'d'});f.key(e('a'));f.step(200);assert.equal(f.ev('px'),60);f.keyup({key:'a'});
  f.el('view-pudding').hidden=true;k=e('ArrowRight');f.key(k);assert.equal(k.done,undefined);f.keyup({key:'ArrowRight'});
});
check('Press-and-hold walks toward the pointer and stops on release',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('spawnT=99');f.tap(300,300);f.step(40);assert.equal(f.ev('px'),300);f.up();f.tap(100,300);f.up();f.step(20);assert.equal(f.ev('px'),300);
});
check('Blades cut and slow, spears stab once with knock-back, both score on a kill',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('spawnT=99;px=200');
  f.F.ev("const b=weaponCells(200).find(c=>c.t==='b');enemies=[{t:'inf',x:b.cx,y:b.cy,hp:100,maxHp:100,speed:0,flash:0,slow:false,spearCd:99}]");
  f.step(1);const hp=f.ev('enemies[0].hp');assert.ok(hp<100&&hp>99.5,'blade dps per frame');assert.equal(f.ev('enemies[0].slow'),true);
  f.F.ev("const m=weaponCells(200).find(c=>c.t==='m');enemies=[{t:'inf',x:m.cx,y:m.cy,hp:100,maxHp:100,speed:0,flash:0,slow:false,spearCd:0}]");
  const y0=f.ev('enemies[0].y');f.step(1);const h1=f.ev('enemies[0].hp');assert.ok(h1<=94&&h1>93,'spear burst 6 plus a little blade');assert.equal(y0-f.ev('enemies[0].y'),14);
  f.step(1);assert.ok(f.ev('enemies[0].hp')>h1-1,'stab is on cooldown');   // only blade time-damage after the stab
  f.F.ev("const b=weaponCells(200).find(c=>c.t==='b');enemies=[{t:'inf',x:b.cx,y:b.cy,hp:.01,maxHp:5,speed:0,flash:0,slow:false,spearCd:99}]");
  f.step(1);assert.equal(f.ev('enemies.length'),0);assert.equal(f.ev('score'),10);assert.equal(f.ev('streak'),1);
});
check('Shield cells stop arrows; unshielded arrows hurt, reduced by guard',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev("spawnT=99;px=200;grid[0][1]='d';stats=computeStats(grid)");
  const c=f.ev("weaponCells(200).find(c=>c.t==='d')");
  f.F.ev('arrows=[{x:'+c.cx+',y:'+c.cy+'}]');f.step(1);assert.equal(f.ev('arrows.length'),0);assert.equal(f.ev('calm'),100);
  f.F.ev("grid[0][1]=null;stats=computeStats(grid);arrows=[{x:200,y:425}]");f.step(1);assert.equal(f.ev('calm'),92);
  f.F.ev("calm=100;grid[0][0]='d';grid[0][1]='d';grid[0][2]='d';grid[0][3]='d';stats=computeStats(grid);arrows=[{x:200,y:425}]");f.step(1);assert.equal(f.ev('calm'),100-Math.round(8*(1-f.ev('stats.guard'))*10)/10);
});
check('Contact costs calm by type; slipping past costs 3; both reset the streak',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev("spawnT=99;px=200;streak=5;enemies=[{t:'cav',x:200,y:440,hp:99,maxHp:99,speed:0,flash:0,slow:false,spearCd:99}]");
  f.step(1);assert.equal(f.ev('calm'),85);assert.equal(f.ev('streak'),0);
  f.F.ev("calm=100;px=60;streak=4;enemies=[{t:'inf',x:340,y:468,hp:5,maxHp:5,speed:100,flash:0,slow:false,spearCd:99}]");
  f.step(1);assert.equal(f.ev('calm'),97);assert.equal(f.ev('streak'),0);
});
check('Eight kills in a row heal 5 calm once; the heal never exceeds 100',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('spawnT=99;calm=60');
  for(let i=0;i<8;i++)f.F.ev("kill({t:'inf',x:200,y:100,dead:false})");
  assert.equal(f.ev('calm'),65);f.F.ev('calm=98;streak=7');f.F.ev("kill({t:'inf',x:200,y:100})");assert.equal(f.ev('calm'),100);
});
check('Each cleared segment pays 1 point once, then the next camp opens with +10 calm',()=>{
  const f=fixture();f.F.start();f.skipAndGo();f.F.ev('calm=50');f.clearSeg();
  assert.equal(f.wallet.balance,500-fee+1);assert.equal(f.ev('earned'),1);assert.equal(f.count('progress'),1);assert.equal(f.ev('sub'),'clear');
  f.F.update(.05);assert.equal(f.wallet.balance,500-fee+1);f.step(20);
  assert.equal(f.ev('seg'),2);assert.equal(f.ev('ph'),'forge');assert.equal(f.ev('calm'),60);assert.equal(f.ev('segScore'),100);
});
check('Clearing all eight segments ends once as complete: 8+2 points, score adds up',()=>{
  const f=fixture();f.F.start();
  for(let s=1;s<=8;s++){f.skipAndGo();f.F.ev('calm=100');f.clearSeg();if(s<8)f.step(20);}
  assert.equal(f.ev('st'),'over');assert.equal(f.ev('why'),'win');assert.equal(f.wallet.balance,500-fee+10);assert.equal(f.count('end'),1);
  const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],10);assert.equal(end[3],'complete');
  assert.equal(f.ev('score'),f.ev('killScore')+f.ev('segScore')+f.ev('winBonus')+f.ev('calmBonus'));assert.equal(f.ev('score'),800+500+500);
  assert.equal(f.busy(),false);f.step(10);assert.equal(f.count('end'),1);
});
check('Calm reaching zero ends the round once with the points already earned, and saves the best score',()=>{
  const f=fixture(500,100);f.F.start();f.skipAndGo();f.clearSeg();f.step(20);f.skipAndGo();
  f.F.ev("spawnT=99;px=200;calm=5;enemies=[{t:'inf',x:200,y:440,hp:99,maxHp:99,speed:0,flash:0,slow:false,spearCd:99}]");f.step(1);
  assert.equal(f.ev('st'),'over');assert.equal(f.ev('why'),'calm');assert.equal(f.count('end'),1);const end=f.events.find(e=>e[0]==='end');assert.equal(end[2],1);assert.equal(end[3],'complete');
  assert.equal(f.wallet.balance,500-fee+1);assert.equal(f.storage.get('deep-sea-pudding-best'),'100');   // 100 segment points is not above the saved 100
  f.step(10);assert.equal(f.count('end'),1);
});
check('A round with no points earned ends as a loss; the best record only goes up',()=>{
  const f=fixture(500,30);f.F.start();f.skipAndGo();f.F.ev("spawnT=99;px=200;calm=5;score=50;enemies=[{t:'inf',x:200,y:440,hp:99,maxHp:99,speed:0,flash:0,slow:false,spearCd:99}]");f.step(1);
  assert.equal(f.events.find(e=>e[0]==='end')[3],'loss');assert.equal(f.storage.get('deep-sea-pudding-best'),'50');
  f.F.start();assert.equal(f.ev('seg'),1);assert.equal(f.ev('calm'),100);assert.equal(f.ev('score'),0);assert.equal(f.wallet.balance,500-fee*2);assert.equal(f.count('start'),2);
});
check('No new enemies spawn after second 13, and the segment end clears the field without penalty',()=>{
  const f=fixture(500,null,()=>.4);f.F.start();f.skipAndGo();f.F.ev('rt=13.01;spawnT=0;calm=100');const n=f.ev('enemies.length+warns.length+archers.length');f.step(3);
  assert.ok(f.ev('enemies.length+warns.length+archers.length')<=n);
  f.F.ev("enemies=[{t:'inf',x:60,y:300,hp:5,maxHp:5,speed:0,flash:0,slow:false,spearCd:9}];rt=15.99");f.step(1);assert.equal(f.ev('enemies.length'),0);assert.equal(f.ev('calm'),100);
});
check('Drawing runs in every state without throwing',()=>{
  const f=fixture();f.F.draw();f.F.start();f.F.draw();f.F.ev("sel=0;ghost={x:1,y:1}");f.F.draw();f.skipAndGo();
  f.F.ev("enemies=[{t:'inf',x:100,y:200,hp:3,maxHp:5,speed:0,flash:.1,slow:false,spearCd:0},{t:'cav',x:200,y:200,hp:3,maxHp:5,speed:0,flash:0,slow:false,spearCd:0},{t:'shield',x:300,y:200,hp:3,maxHp:5,speed:0,flash:0,slow:false,spearCd:0}];warns=[{x:120,t:.3}];archers=[{x:240,t:.5}];arrows=[{x:280,y:300}];dying=[{x:50,y:50,t:'inf',life:.1}];floats=[{s:'+10',x:100,y:100,col:'#fff',t:.1}];streak=9;hurtT=.1;redT=.1");f.F.draw();
  f.clearSeg();f.F.draw();f.F.ev('calm=1');f.F.ev("enemies=[{t:'inf',x:px,y:440,hp:9,maxHp:9,speed:0,flash:0,slow:false,spearCd:9}]");f.step(30);f.F.draw();
});
console.log(results.length+' pudding checks passed');
}
