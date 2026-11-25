import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import R from '../shared/berry-trail-rules.cjs';
import T from '../shared/timed-replay.cjs';
const make=()=>R.create(T.seeded(42));
let s=make();assert.equal(s.snake.length,3);assert.equal(s.score,0);assert.ok(!s.snake.some(p=>p.x===s.food.x&&p.y===s.food.y));
assert.equal(R.input(s,3),false,'reverse rejected');assert.equal(R.input(s,1),false,'same heading rejected');assert.equal(R.input(s,0),true);assert.equal(R.input(s,3),false,'only one turn queued per step');
R.advance(s,.16,()=>0);assert.deepEqual(s.snake[0],{x:10,y:9});assert.equal(s.queued,false);
s=make();s.food={x:11,y:10};R.advance(s,.16,()=>0);assert.equal(s.score,10);assert.equal(s.snake.length,4);assert.deepEqual(s.food,{x:0,y:0});
s=make();s.snake=[{x:1,y:1},{x:1,y:2},{x:0,y:2},{x:0,y:1}];s.dir=3;s.next=3;s.food={x:5,y:5};R.advance(s,.16,()=>0);assert.equal(s.dead,false,'moving into vacated tail is legal');
s=make();s.snake=[{x:1,y:1},{x:1,y:2},{x:0,y:2},{x:0,y:1},{x:0,y:0}];s.dir=3;s.next=3;R.advance(s,.16,()=>0);assert.equal(s.dead,true,'body collision');
s=make();s.snake=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(x!==1||y!==0)s.snake.push({x,y});s.food={x:1,y:0};s.score=3960;R.advance(s,.16,()=>0);assert.equal(s.won,true);assert.equal(s.score,3970);assert.equal(s.food,null);
for(let seed=1;seed<=20;seed++){
 const random=T.seeded(seed),state=R.create(random);let ticks=0;
 while(!state.dead){R.advance(state,.01,random);ticks++;}
 assert.equal(T.verify(R,seed,[ticks]),state.score);
 assert.equal(T.verify(R,seed,[ticks+1]),null,'forged terminal rejected');
 assert.equal(T.verify(R,seed,[ticks-1]),null,'unfinished round rejected');
}
assert.equal(T.accepts([10,44],R.inputCount),false);assert.equal(T.accepts([10,8,4],R.inputCount),false);
// Bridge source validation and single analytics settlement, without wallet dependencies.
const nodes=new Map(),handlers={},events=[];const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,contentWindow:{},addEventListener(){}});return nodes.get(id);};
let callback;
const win={deepSeaI18n:{getLanguage:()=> 'en',text:s=>s},addEventListener:(t,f)=>handlers[t]=f};
const context={$:el,window:win,location:{hash:'berry-trail'},Math,berryTrailRules:R,timedLeaderboard:()=>({start:f=>{callback=f},busy:()=>false,update(){},record(){},finish:score=>events.push(['rank',score])}),AN:{start:()=>{events.push(['start']);return 'round'},end:(...a)=>events.push(['end',...a]),interact(){},progress(){},resume(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../games/berry-trail/game.js',import.meta.url),'utf8'),context);
const B=win.deepSeaBerry,source=el('bt-frame').contentWindow;
assert.equal(B.prepare({},()=>{}),false);assert.equal(B.prepare(source,()=>{}),true);callback(()=>0);B.finish({},100);assert.equal(events.length,1);B.finish(source,10);B.finish(source,999);assert.equal(events.filter(e=>e[0]==='end').length,1);assert.equal(events.find(e=>e[0]==='end')[2],0,'no points paid');assert.deepEqual(events.find(e=>e[0]==='rank'),['rank',10]);
console.log('PASS Berry Trail: growth, collisions, turn queue, win, 20 deterministic replays, forged terminal and iframe single-settlement checks');
