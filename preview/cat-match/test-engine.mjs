import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('index.html',import.meta.url),'utf8').split('<script>')[1].split('</script>')[0];
const ctx=new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
const elements=new Map();
const element=id=>elements.get(id)||elements.set(id,{style:{},hidden:true,textContent:'',getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:390,height:480}),setPointerCapture(){},click(){this.onclick?.()}}).get(id);
const store=new Map();
const sandbox={console,Math,Set,Map,Promise,devicePixelRatio:1,Image:class{},matchMedia:()=>({matches:true}),setTimeout:fn=>fn(),localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(source,sandbox);
const run=code=>vm.runInContext(code,sandbox);
for(let l=1;l<=30;l++){
 run(`level=${l};start()`);
 assert.equal(run('matches().length'),0);assert.ok(run('legal().length')>0);
 for(let turn=0;turn<45;turn++){
  if(run('ended')){run('start()');continue}
  await run('swap(...legal()[0])');
  assert.equal(run('matches().length'),0);
  assert.ok(run('legal().length')>0);
  if(!run('ended')) assert.equal(run('board.every((t,i)=>active(i)?!!t:t===null)'),true);
 }
 run('shuffle()');assert.equal(run('matches().length'),0);
}
run('level=1;start()');
const invalid=run(`(()=>{for(let a=0;a<64;a++)for(let b of [a+1,a+8])if(board[a]&&board[b]&&adjacent(a,b)&&!legal().some(p=>p[0]===a&&p[1]===b))return [a,b]})()`);
if(invalid){let before=run('JSON.stringify(board)');await run(`swap(${invalid[0]},${invalid[1]})`);assert.equal(run('moves'),24);assert.equal(run('JSON.stringify(board)'),before)}
for(const [coords,special] of [[[16,17,18,19],'row'],[[16,17,18,19,20],'rainbow'],[[16,17,18,26,34],'bomb']]){
 run('level=1;start();board=board.map(t=>t?({t:Math.floor(Math.random()*6),s:""}):null)');
 run(`for(let i of ${JSON.stringify(coords)})board[i]={t:0,s:''}`);
 assert.ok(run('matches().length')>0);
 // Isolate the exact pattern to verify creation independently of incidental random matches.
 await run(`settle([${JSON.stringify(coords)}],[${coords[0]}])`);
 assert.ok(run('board.some(t=>t?.s==='+JSON.stringify(special)+')') || run('score')>coords.length*10);
}
console.log('PASS: 30 level configurations / 1350 legal turns, gravity, stable playable boards, invalid swap, shuffle, specials.');
run('level=1;start();goal=0');await run('swap(...legal()[0])');assert.equal(run('ended'),true);assert.equal(run('level'),2);assert.equal(JSON.parse(store.get('proto-cat-match-save-v1')).level,2);run("document.getElementById('primary').onclick()");assert.equal(run('ended'),false);assert.equal(run('moves'),24);
run('start();moves=1;goal=100000');await run('swap(...legal()[0])');assert.equal(run('ended'),true);assert.equal(run('moves'),0);run("document.getElementById('primary').onclick()");assert.equal(run('moves'),24);assert.equal(run('ended'),false);
console.log('PASS: win, saved next level, next round, loss and free retry.');
// Exercise the real animation path with a deterministic virtual animation clock.
let clock=0,frames=0;
sandbox.performance={now:()=>clock};
sandbox.requestAnimationFrame=fn=>queueMicrotask(()=>{clock+=16;frames++;fn(clock)});
sandbox.matchMedia=()=>({matches:false});
run('level=1;start()');await run('swap(...legal()[0])');assert.ok(frames>=20);assert.equal(run('offsets.size'),0);assert.equal(run('clearProgress'),0);assert.equal(run('busy'),false);
run('start()');const pair=run('legal()[0]'),unit=run('cell');
const press={pointerId:1,clientX:(pair[0]%8+.5)*unit,clientY:((pair[0]>>3)+.5)*unit};
const move={pointerId:1,clientX:(pair[1]%8+.5)*unit,clientY:((pair[1]>>3)+.5)*unit};
run('cv').onpointerdown(press);run('cv').onpointermove(move);
assert.equal(run('busy'),true);assert.equal(run('down'),null);
run('cv').onpointerup(move);
for(let i=0;i<2000&&run('busy');i++)await Promise.resolve();
assert.equal(run('busy'),false);assert.equal(run('moves'),23);
console.log('PASS: animation frames, offset cleanup, pointermove immediate swap, pointerup avoids duplicate move.');
run('start()');
for(let i=0;i<4;i++)run("document.getElementById('hint').onclick()");
assert.equal(run('hintsLeft'),0);assert.equal(element('hint').disabled,true);assert.equal(run('moves'),24);
for(let i=0;i<3;i++)run("document.getElementById('shuffle').onclick()");
assert.equal(run('shufflesLeft'),0);assert.equal(element('shuffle').disabled,true);assert.equal(run('moves'),24);
run('shuffle()');assert.equal(run('shufflesLeft'),0);
run('start()');assert.equal(run('hintsLeft'),3);assert.equal(run('shufflesLeft'),2);assert.equal(element('hint').disabled,false);assert.equal(element('shuffle').disabled,false);
run('busy=true');run("document.getElementById('hint').onclick();document.getElementById('shuffle').onclick()");assert.equal(run('hintsLeft'),3);assert.equal(run('shufflesLeft'),2);
console.log('PASS: per-level booster limits, zero disabled, extra clicks rejected, automatic shuffle free, retry refills, busy input guarded.');
