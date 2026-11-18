// Run with Node.js: no packages, browser, network or player storage needed.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const model={};vm.createContext(model);vm.runInContext(read('games/frontier/world.js'),model);
let checks=0;const ok=(test,message)=>{assert.ok(test,message);checks++;};
const {frontierWorld:create,frontierStep:step,frontierGoal:goal,frontierUpgrade:upgrade}=model;
function tick(w,seconds,input={x:0,y:0}){for(let i=0;i<Math.ceil(seconds/.05);i++)step(w,input,.05);}
function neutral(w){w.enemies.forEach(e=>e.hp=0);tick(w,.05);}
function build(w,k){let b=w.buildings.find(b=>b.kind===k);w.bank.wood=w.bank.stone=10000;w.p.x=b.x;w.p.y=b.y;tick(w,12);return b.built;}
for(let level=1;level<=50;level++){
 let w=create(level);ok(w.nodes.some(n=>n.x<530&&n.kind==='stone')&&w.nodes.some(n=>n.x<530&&n.kind==='wood'),`stage ${level}: accessible renewable supplies`);
 w.p.x=w.buildings[5].x;w.p.y=w.buildings[5].y;w.bank.wood=w.bank.stone=10000;w.p.inv=1000;tick(w,2);ok(!w.buildings[5].built,`stage ${level}: beacon gated`);
 neutral(w);ok(build(w,'bridge'),`stage ${level}: bridge builds`);
 if(w.cfg.mission==='rescue'){w.p.x=w.cages[0].x;w.p.y=w.cages[0].y;tick(w,.1);w.p.x=w.cages[1].x;w.p.y=w.cages[1].y;tick(w,.1);}
 if(w.cfg.mission==='defend'){build(w,'tower');for(let n=0;n<1900&&!goal(w);n++){neutral(w);tick(w,.05);}}
 ok(goal(w),`stage ${level}: objective completable`);ok(build(w,'beacon')&&w.phase==='clear',`stage ${level}: beacon completes stage`);
}
let w=create(1);w.nodes=[{x:100,y:320,kind:'stone',left:6,cool:0,respawn:0}];w.p.x=100;w.p.y=320;tick(w,5);ok(w.bag.stone===6,'finite harvesting yield');w.p.x=400;tick(w,16);ok(w.nodes[0].left===6,'resource regeneration');w.bag.wood=18;w.p.x=100;w.p.y=320;tick(w,8);ok(w.bag.wood+w.bag.stone===24,'pack limit');w.p.x=180;w.p.y=450;tick(w,.1);ok(!w.bag.wood&&!w.bag.stone&&w.bank.wood===18,'camp deposit');w.bank.wood=20;w.bank.stone=13;ok(upgrade(w,'blade')&&w.tech.blade===1&&w.bank.wood===0&&w.bank.stone===0,'exact upgrade payment');ok(!upgrade(w,'blade'),'unaffordable upgrade rejected');w.p.hp=30;tick(w,8);ok(Math.abs(w.p.hp-65)<.01&&w.heal===0,'camp healing capped');
w=create(50);w.buildings[3].built=true;w.p.x=900;w.p.y=450;tick(w,45);ok(w.phase==='dead'&&w.p.hp===0,'late-stage stationary play lethal');
w=create(1);w.enemies=[];w.time=10000;tick(w,.1);ok(w.phase==='play'&&w.threat===4,'bounded night pressure, no hidden timeout');
w=create(10);w.enemies=[w.enemies.find(e=>e.type==='boss')];w.buildings[3].built=true;w.p.x=1040;w.p.y=450;w.p.attack=100;tick(w,.5);ok(w.p.hp===100,'warning no early damage');tick(w,3);ok(w.p.hp<100,'boss strike causes damage');
w=create(10);w.enemies=[w.enemies.find(e=>e.type==='boss')];w.buildings[3].built=true;w.p.x=1040;w.p.y=450;w.p.attack=100;tick(w,.6);w.p.x=800;w.p.y=700;tick(w,1.5);ok(w.p.hp===100,'leaving warning avoids strike');
w=create(21);w.enemies=[];w.buildings[3].built=true;w.p.x=800;w.p.y=240;w.time=6;tick(w,1);ok(w.p.hp===100,'hazard telegraph harmless');tick(w,.4);ok(w.p.hp<100,'hazard activates after telegraph');
w=create(31);w.enemies=[];w.p.x=200;step(w,{x:1,y:0},.05);let iceX=w.p.x;w=create(31);w.enemies=[];w.p.x=200;w.buildings[2].built=true;step(w,{x:1,y:0},.05);ok(w.p.x>iceX,'forge removes frost slowdown');
w=create(1);w.p.x=548;w.p.y=200;tick(w,1,{x:1,y:0});ok(w.p.x<=552,'unbuilt river cannot cross');w.buildings[3].built=true;w.p.y=450;tick(w,1,{x:1,y:0});ok(w.p.x>678,'built bridge allows crossing');
w=create(1);let base=w.p.hp;step(w,{x:1,y:0,dash:true},.05);model.frontierDamage(w,100);ok(w.p.hp===base&&w.p.dash>0,'dash grants invulnerability');let cd=w.p.dash;step(w,{x:1,y:0,dash:true},.05);ok(w.p.dash<cd,'dash cannot retrigger during cooldown');
ok(model.frontierPlan(50).damage>model.frontierPlan(1).damage&&model.frontierPlan(50).windup<model.frontierPlan(1).windup,'difficulty escalates');
// UI/platform adapter, with disposable DOM and localStorage doubles.
function harness(seed={},balance=500){
 const elements=new Map(),events=[],listeners={},store=new Map(Object.entries(seed));let now=0,failWrite=false,frame;
 class Element{
  constructor(){this.textContent='';this.hidden=false;this.disabled=false;this.children=[];this.style={};this.dataset={};this.handlers={};this.attrs={};this.className='';}
  addEventListener(k,f){(this.handlers[k]||=[]).push(f);}
  click(){if(!this.disabled)(this.handlers.click||[]).forEach(f=>f.call(this,{}));}
  appendChild(e){this.children.push(e);}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k];}
  getContext(){return {};}
  focus(){}
  getBoundingClientRect(){return {width:0,height:0};}
  closest(){return null;}
 }
 function $(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}
 const document={hidden:false,addEventListener(k,f){(listeners[k]||=[]).push(f);},createElement(){return new Element();},fullscreenElement:null};
 const AN={};['start','end','progress','resume','interact'].forEach(k=>AN[k]=(...args)=>{events.push({k,args});return k==='start'?'round-'+events.length:undefined;});
 const window={deepSeaI18n:{sourceText:e=>e.textContent},addEventListener(k,f){(listeners[k]||=[]).push(f);}};
 const c={$ ,S:{balance},AN,ENTRY_FEE:0,LOW_MSG:'low',save(){},renderAll(){},window,document,performance:{now:()=>now},requestAnimationFrame:f=>frame=f,localStorage:{getItem:k=>store.get(k)||null,setItem(k,v){if(failWrite)throw Error('storage blocked');store.set(k,v);}}};
 let game=read('games/frontier/game.js').replace(/\{\{include:([^}]+)\}\}/g,(_,p)=>read(p));
 game=game.replace('var preview=frontierWorld(1);','window.test={world:()=>world,finish:finishStage,persist:persist,paused:()=>paused};var preview=frontierWorld(1);');
 vm.createContext(c);vm.runInContext(game,c);c.frontierRoute(true);
 return {c,$,events,store,get w(){return window.test.world();},test:window.test,emit(k,e={}){(listeners[k]||[]).forEach(f=>f(e));},run(ms=50){now+=ms;frame(now);},fail(){failWrite=true;}};
}
let h=harness();h.$('ft-go').click();h.$('ft-go').click();ok(h.c.S.balance===500,'double click starts free once');ok(h.events.filter(e=>e.k==='start').length===1,'single start');ok(h.$('ft-map').children.length===50,'50-stage map');let live=h.w;
h.c.frontierRoute(false);let frozen=live.time;h.run();ok(live.time===frozen&&h.test.paused(),'route exit pauses simulation');h.c.frontierRoute(true);h.run();ok(live.time===frozen,'return waits for manual resume');h.$('ft-go').click();h.run();ok(live.time>frozen&&h.c.S.balance===500,'resume without charge');h.emit('blur');ok(h.test.paused(),'blur pauses');h.$('ft-go').click();h.c.document.hidden=true;h.emit('visibilitychange');ok(h.test.paused(),'background pauses');h.c.document.hidden=false;h.$('ft-go').click();h.w.tech.blade=2;h.w.phase='dead';h.test.finish();h.test.finish();ok(h.events.filter(e=>e.k==='end').length===1,'failure ends once');h.$('ft-go').click();ok(h.w.tech.blade===2&&h.w.level===1&&h.c.S.balance===500,'free retry retains technology');h.w.phase='clear';h.test.finish();h.test.finish();h.$('ft-go').click();ok(h.w.level===2&&h.c.S.balance===500,'next stage free and unlocked');h.$('ft-pause').click();h.w.bank.wood=77;h.test.persist();let saved=Object.fromEntries(h.store);let re=harness(saved,490);ok(re.w.level===2&&re.w.bank.wood===77&&re.test.paused(),'reload restores exact progress paused');re.$('ft-go').click();ok(re.c.S.balance===490&&re.events.find(e=>e.k==='start').args[1]===0,'reload creates free round');re.emit('pagehide',{persisted:false});re.emit('pagehide',{persisted:false});ok(re.events.filter(e=>e.k==='end').length===1&&re.events.find(e=>e.k==='end').args[2]==='abandoned','normal pagehide ends once');
h=harness();h.$('ft-go').click();h.emit('pagehide',{persisted:true});ok(h.events.every(e=>e.k!=='end'),'BFCache pauses without ending');
h=harness({},0);h.$('ft-go').click();ok(h.w&&h.c.S.balance===0&&h.events.some(e=>e.k==='start'),'zero balance starts for free');
h=harness();h.fail();h.$('ft-go').click();ok(h.w&&h.c.S.balance===500,'blocked storage still permits free play');
h=harness({'deep-sea-frontier-v1':JSON.stringify({version:1,paid:true,cleared:7,world:{}})},99);ok(h.w.level===8,'incomplete snapshot keeps progress/access');h.$('ft-go').click();ok(h.c.S.balance===99,'recovered paid save does not charge');
h=harness({'deep-sea-frontier-v1':'{broken'},90);ok(!h.w&&h.c.S.balance===90,'malformed save does not mutate wallet');
ok(h.store.get('deep-sea-frontier-v1')==='{broken','malformed data not erased on load');
// Parse the shipped executable scripts; application/json is separately decoded.
const html=read('index.html');for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(match[1].includes('application/json'))JSON.parse(match[2]);else new vm.Script(match[2]);}ok(true,'compiled runtime and JSON syntax');
console.log(`PASS: ${checks} Frontier model and adapter assertions`);

export const frontierChecks=checks;
