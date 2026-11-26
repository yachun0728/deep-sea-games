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

// Real child controller: 8px swipe threshold, rapid corner buffering and unchanged replay rules.
{
 const listeners=new Map(),nodes=new Map(),records=[],endings=[];let ticks=0;
 const drawing=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,textContent:'',hidden:false,disabled:false,dataset:{},style:{},tagName:'BUTTON',open:false,setAttribute(){},getContext:()=>drawing,focus(){},setPointerCapture(){},replaceChildren(){},append(){},showModal(){this.open=true},close(){this.open=false},addEventListener(type,fn){listeners.set(id+':'+type,fn)}});return nodes.get(id);};
 const canvas=node('c');canvas.tagName='CANVAS';const pad=['0,-1','-1,0','0,1','1,0'].map((d,i)=>Object.assign(node('pad'+i),{dataset:{d}}));
 const bridge={rules:R,language:()=> 'zh-Hant',translate:(_,text)=>text,prepare:(_,ready)=>{ready(T.seeded(42));return true},record:(_,code)=>records.push(ticks*4+code),touch(){},pause(){},resume(){},finish:(_,score)=>endings.push(score)};
 const childWindow={addEventListener(){},deepSeaBerry:bridge};
 const ctx={parent:{deepSeaBerry:bridge},window:childWindow,document:{getElementById:node,querySelectorAll:()=>pad,documentElement:{lang:'',classList:{toggle(){}}},addEventListener(){},createElement:()=>node('new')},localStorage:{getItem:()=>null,setItem(){}},innerWidth:390,matchMedia:()=>({matches:true}),performance:{now:()=>0},requestAnimationFrame(){},Math,console};
 vm.createContext(ctx);
 const html=fs.readFileSync(new URL('../games/berry-trail/play.html',import.meta.url),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 vm.runInContext('start()',ctx);
 const event=(x,y)=>({target:canvas,clientX:x,clientY:y,pointerId:1,preventDefault(){}});
 listeners.get('board:pointerdown')(event(100,100));listeners.get('board:pointermove')(event(100,93));assert.equal(vm.runInContext('model.next',ctx),1,'7px jitter does not turn');
 listeners.get('board:pointermove')(event(100,92));assert.equal(vm.runInContext('model.next',ctx),0,'8px swipe turns immediately');
 listeners.get('board:pointermove')(event(92,92));assert.equal(vm.runInContext('bufferedTurn',ctx),3,'quick second corner kept');
 vm.runInContext('turn(0,1)',ctx);assert.equal(vm.runInContext('bufferedTurn',ctx),3,'reverse cannot replace buffered turn');
 for(let i=0;i<16;i++){ticks++;vm.runInContext('step(.01)',ctx);}
 assert.equal(vm.runInContext('model.dir',ctx),0);assert.equal(vm.runInContext('model.next',ctx),3,'buffer enters rules after first move');
 assert.deepEqual(records,[0,16*4+3]);
 while(vm.runInContext("state==='running'",ctx)&&ticks<1000){ticks++;vm.runInContext('step(.01)',ctx);}
 assert.equal(endings.length,1);assert.equal(T.verify(R,42,[ticks,...records]),endings[0],'buffered touch input verifies with unchanged Worker rules');
 vm.runInContext('start();turn(0,-1);turn(-1,0);pause()',ctx);assert.equal(vm.runInContext('bufferedTurn',ctx),null,'pause clears pending gestures');
 console.log('PASS real child: 7px jitter ignored, 8px swipe, fast corner buffer, reverse guard, pause clearing and Worker-compatible replay');
}
