import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
function fixture(storage={}){
 const elements={},events=[];let day='2026-11-17';
 function element(){return {style:{},dataset:{},children:[],disabled:false,textContent:'',innerHTML:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){},appendChild(b){this.children.push(b);}};}
 const timers=new Map();let timerId=0;
 const c={setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},$:id=>elements[id]??=element(),window:{addEventListener(){}},navigator:{},setInterval(){},document:{createElement:element,addEventListener(){},hidden:false},S:{balance:Number(storage.wallet??500)},STORE:'wallet',ENTRY_FEE:10,LOW_MSG:'不足',fmt:String,elBal:element(),save(){storage.wallet=String(c.S.balance);},renderGo(){},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},AN:{start:(...a)=>{events.push(['start',...a]);return events.length;},progress:(...a)=>events.push(['progress',...a]),resume:(...a)=>events.push(['resume',...a]),end:(...a)=>events.push(['end',...a])}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('shared/mines-rules.cjs',root),'utf8'),c);for(const game of ['mines','keno'])vm.runInContext(fs.readFileSync(new URL(`games/${game}/game.js`,root),'utf8'),c);
 c.keDay=()=>day;c.buildBoard();c.renderMines();c.keBuild();c.keUI();return {c,storage,events,elements,timers,setDay:d=>day=d};
}
const f=fixture(),{c,events,storage}=f;
c.S.balance=0;c.$('mines-difficulty').value='low';c.startMines();c.startMines();assert.equal(c.S.balance,0);assert.equal(events.filter(e=>e[0]==='start').length,1);
assert.equal(c.M.layout.filter(Boolean).length,3);const safe=Array.from({length:c.N},(_,i)=>i).find(i=>!c.M.layout[i]);c.mineFlag(safe);c.pick(safe);assert.equal(c.M.picks,0);c.mineFlag(safe);c.pick(safe);
for(let i=0;i<c.N;i++)if(!c.M.layout[i])c.pick(i);
assert.equal(c.M.active,false);assert.equal(events.at(-1)[3],'complete');
const ends=events.filter(e=>e[0]==='end').length;c.mineFinish(true);c.pick(0);assert.equal(events.filter(e=>e[0]==='end').length,ends);
for(const [mode,size,bombs] of [['medium',8,10],['high',10,20]]){
 c.$('mines-difficulty').value=mode;c.startMines();assert.equal(c.N,size*size);assert.equal(c.M.mines,bombs);assert.equal(c.M.layout.filter(Boolean).length,bombs);const bomb=c.M.layout.findIndex(Boolean);c.pick(bomb);assert.equal(events.at(-1)[3],'loss');
}
c.$('mines-difficulty').value='custom';
for(const [size,bombs] of [[2,3],[10,99]]){
 c.$('mines-size').value=size;c.$('mines-bombs').value=bombs;c.startMines();assert.equal(c.N,size*size);const safe=Array.from({length:c.N},(_,i)=>i).find(i=>!c.M.layout[i]);c.pick(safe);assert.equal(c.M.active,false);assert.equal(c.M.picks,1);assert.equal(events.at(-1)[3],'complete');assert.equal(c.M.layout.filter(Boolean).length,bombs);
}
for(const [size,bombs] of [[1,1],[11,1],[5,25],[5,0],[5,1.5],[2.5,1],['',1]]){
 const before=events.length;c.$('mines-size').value=size;c.$('mines-bombs').value=bombs;c.startMines();assert.equal(c.M.active,false);assert.equal(events.length,before);
}
assert.equal(c.S.balance,0);
// Mining is free even at zero balance and zero-score runs still consume a free visit.
const g=fixture(),gc=g.c;gc.S.balance=0;g.storage.wallet='0';gc.kePlay();gc.kePlay();assert.equal(gc.KE.daily.plays,1);assert.equal(gc.S.balance,0);
let d=JSON.parse(g.storage[gc.KE_DAILY_KEY]);d.round.layout=Array(36).fill(0);d.round.layout[0]=1;d.round.layout[1]=3;g.storage[gc.KE_DAILY_KEY]=JSON.stringify(d);
gc.keDig(0);assert.equal(gc.S.balance,2);gc.keDig(0);assert.equal(gc.S.balance,2);assert.equal(gc.KE.digs,1);
// Reload resumes remaining digs without consuming an extra visit or repeating rewards.
const re=fixture(g.storage);assert.equal(re.c.KE.active,true);assert.equal(re.c.KE.digs,1);assert.equal(re.c.KE.daily.plays,1);
re.c.keDig(0);assert.equal(re.c.S.balance,2);re.c.keDig(1);assert.equal(re.c.S.balance,7);
for(let i=2;i<5;i++)re.c.keDig(i);assert.equal(re.c.KE.active,false);assert.equal(re.c.KE.daily.earned,7);assert.equal(re.events.at(-1)[2],5); // only this resumed session's credited amount
for(let n=0;n<2;n++){re.c.kePlay();let record=JSON.parse(re.storage[re.c.KE_DAILY_KEY]);record.round.layout=Array(36).fill(0);re.storage[re.c.KE_DAILY_KEY]=JSON.stringify(record);for(let i=0;i<5;i++)re.c.keDig(i);}
assert.equal(re.c.KE.daily.plays,3);re.c.kePlay();assert.equal(re.c.KE.active,false);
re.setDay('2026-11-18');re.c.kePlay();assert.equal(re.c.KE.daily.plays,1);assert.equal(re.c.KE.daily.earned,0);
// Daily cap awards exactly the remainder, ends the visit, and prevents more starts.
d=JSON.parse(re.storage[re.c.KE_DAILY_KEY]);d.earned=29;d.round.layout[0]=3;re.storage[re.c.KE_DAILY_KEY]=JSON.stringify(d);const balance=re.c.S.balance;re.c.keDig(0);assert.equal(re.c.S.balance,balance+1);assert.equal(re.c.KE.daily.earned,30);assert.equal(re.c.KE.active,false);re.c.kePlay();assert.equal(re.c.KE.active,false);
// Another open tab cannot re-credit an already consumed cell.
const t=fixture(),t2=fixture(t.storage);t.c.kePlay();d=JSON.parse(t.storage[t.c.KE_DAILY_KEY]);d.round.layout[0]=3;t.storage[t.c.KE_DAILY_KEY]=JSON.stringify(d);t.c.keDig(0);t2.c.keDig(0);assert.equal(Number(t.storage.wallet),505);
// Storage failure fails closed, without starting or paying.
const bad=fixture();bad.c.localStorage.setItem=()=>{throw Error('blocked');};bad.c.kePlay();assert.equal(bad.c.KE.active,false);assert.equal(bad.c.S.balance,500);

console.log('PASS: Mines difficulty presets, custom size and mine bounds, maximum-density wins, first-click mine loss, zero-balance free starts, daily free quotas, reload continuation, cross-tab duplicate prevention, daily reset, reward cap and storage failures.');

// Chord opened numbers only when adjacent flags match, including correct/wrong flags.
function chordFixture(){const f=fixture();const c=f.c;c.$('mines-difficulty').value='custom';c.$('mines-size').value=3;c.$('mines-bombs').value=1;c.startMines();c.M.layout=Array(9).fill(false);c.M.layout[0]=true;c.pick(4);return f;}
let chord=chordFixture();let cc=chord.c;const previous=cc.M.picks;cc.pick(4);assert.equal(cc.M.picks,previous);assert.equal(cc.M.active,true);assert.equal(chord.elements.board.children.at(-5).disabled,false);
cc.mineFlag(0);cc.pick(4);assert.equal(cc.M.active,false);assert.equal(cc.M.picks,8);assert.equal(chord.events.filter(e=>e[0]==='end').length,1);assert.equal(chord.events.at(-1)[3],'complete');cc.pick(4);assert.equal(chord.events.filter(e=>e[0]==='end').length,1);
chord=chordFixture();cc=chord.c;cc.mineFlag(1);cc.pick(4);assert.equal(cc.M.active,false);assert.equal(chord.events.at(-1)[3],'loss');assert.equal(cc.M.open[0],true);assert.equal(chord.events.filter(e=>e[0]==='end').length,1);
assert.equal(cc.S.balance,500);
console.log('PASS: chord flag-count guard, opened-number interaction, correct flags/flood/win, wrong flags/loss, single settlement and free balance');

// Preview follows presets/custom inputs without starting a round or touching the wallet.
const preview=fixture(); const pc=preview.c;
for(const [mode,size,bombs] of [['low',5,3],['medium',8,10],['high',10,20]]){
 pc.$('mines-difficulty').value=mode;pc.mineSettings();
 assert.equal(pc.M.size,size);assert.equal(pc.N,size*size);assert.equal(pc.M.mines,bombs);
 assert.equal(pc.$('mines-left').textContent,String(size*size-bombs));assert.equal(pc.M.active,false);
}
pc.$('mines-difficulty').value='custom';pc.$('mines-size').value=4;pc.$('mines-bombs').value=5;pc.mineSettings();assert.equal(pc.N,16);assert.equal(pc.M.mines,5);assert.equal(preview.events.length,0);
const input=fixture();const ic=input.c;ic.$('mines-difficulty').value='medium';ic.startMines();
let target=ic.tiles[0],actions=[];ic.mineFlag=n=>actions.push(['flag',n]);ic.pick=n=>actions.push(['open',n]);
const event={pointerType:'touch',button:0,isPrimary:true,pointerId:1,clientX:0,clientY:0,preventDefault(){}};
function fire(type,extra={}){target.listeners[type]({...event,...extra});}
function hold(){const pending=[...input.timers.values()];input.timers.clear();pending.forEach(fn=>fn());}
fire('pointerdown');fire('pointerup');fire('click');assert.deepEqual(actions,[['open',0]]);actions=[];
fire('pointerdown');hold();fire('pointerup');fire('click');assert.deepEqual(actions,[['flag',0]]);
fire('contextmenu');assert.equal(actions.length,1);actions=[];
fire('pointerdown');fire('pointermove',{clientX:20});hold();fire('click');assert.equal(actions.length,0);
fire('pointerdown');fire('pointercancel');hold();assert.equal(actions.length,0);
fire('pointerdown',{pointerType:'mouse',button:2});fire('contextmenu');assert.deepEqual(actions,[['flag',0]]);actions=[];
fire('keydown',{key:'f',repeat:false});assert.deepEqual(actions,[['flag',0]]);
console.log('PASS: difficulty preview, no preview round, short tap, long press without reveal, no duplicate context flag, scroll/cancel, right-click and keyboard flag');
