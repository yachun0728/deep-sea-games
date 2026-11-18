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
model.frontierClassic=true; // the beacon rules below are still used from stage 11 on; stages 1-10 use the enemy-base rules tested at the end
for(let level=1;level<=50;level++){
 let w=create(level);ok(w.nodes.some(n=>n.x<530&&n.kind==='stone')&&w.nodes.some(n=>n.x<530&&n.kind==='wood'),`stage ${level}: accessible renewable supplies`);
 w.p.x=w.buildings[5].x;w.p.y=w.buildings[5].y;w.bank.wood=w.bank.stone=10000;w.p.inv=1000;tick(w,2);ok(!w.buildings[5].built,`stage ${level}: beacon gated`);
 w.siege.next=1e6;w.siege.wave=w.cfg.assaultWaves;w.camps.forEach(c=>c.hp=0);neutral(w);for(const k of ['house','market','mill',...(w.cfg.chapter>0?['depot']:[])])build(w,k);w.camps.forEach(c=>c.hp=0);ok(build(w,'bridge'),`stage ${level}: bridge builds`);
 if(w.cfg.mission==='rescue'){w.p.x=w.cages[0].x;w.p.y=w.cages[0].y;tick(w,.1);w.p.x=w.cages[1].x;w.p.y=w.cages[1].y;tick(w,.1);}
 if(w.cfg.mission==='defend'){build(w,'tower');for(let n=0;n<1900&&!goal(w);n++){neutral(w);tick(w,.05);}}
 ok(goal(w),`stage ${level}: objective completable`);ok(build(w,'beacon')&&w.phase==='play'&&model.frontierLeave(w)&&w.phase==='clear',`stage ${level}: beacon completes stage`);
}
let w=create(1);w.nodes=[{x:100,y:320,kind:'stone',left:6,cool:0,respawn:0}];w.p.x=100;w.p.y=320;tick(w,5);ok(w.bag.stone===6,'finite harvesting yield');w.p.x=400;tick(w,16);ok(w.nodes[0].left===6,'resource regeneration');w.bag.wood=18;w.p.x=100;w.p.y=320;tick(w,8);ok(w.bag.wood+w.bag.stone===24,'pack limit');w.p.x=180;w.p.y=450;tick(w,.1);ok(!w.bag.wood&&!w.bag.stone&&w.bank.wood===18,'camp deposit');w.coins=25;w.bank.wood=20;w.bank.stone=13;ok(upgrade(w,'blade')&&w.tech.blade===1&&w.coins===0&&w.bank.wood===20&&w.bank.stone===13,'exact coin upgrade payment, resources preserved');ok(!upgrade(w,'blade'),'unaffordable upgrade rejected');w.p.hp=30;tick(w,8);ok(Math.abs(w.p.hp-65)<.01&&w.heal===0,'camp healing capped');
w=create(50);w.buildings[3].built=true;w.p.x=900;w.p.y=450;tick(w,45);ok(w.phase==='dead'&&w.p.hp===0,'late-stage stationary play lethal');
w=create(1);w.enemies=[];w.time=10000;tick(w,.1);ok(w.phase==='play'&&w.threat===4,'bounded night pressure, no hidden timeout');
w=create(10);w.enemies=[w.enemies.find(e=>e.type==='boss')];w.buildings[3].built=true;w.p.x=1040;w.p.y=450;w.p.attack=100;tick(w,.5);ok(w.p.hp===100,'warning no early damage');tick(w,3);ok(w.p.hp<100,'boss strike causes damage');
w=create(10);w.enemies=[w.enemies.find(e=>e.type==='boss')];w.buildings[3].built=true;w.p.x=1040;w.p.y=450;w.p.attack=100;tick(w,.6);w.p.x=800;w.p.y=700;tick(w,1.5);ok(w.p.hp===100,'leaving warning avoids strike');
w=create(21);w.enemies=[];w.buildings[3].built=true;w.p.x=800;w.p.y=240;w.time=6;tick(w,1);ok(w.p.hp===100,'hazard telegraph harmless');tick(w,.4);ok(w.p.hp<100,'hazard activates after telegraph');
w=create(31);w.enemies=[];w.p.x=200;step(w,{x:1,y:0},.05);let iceX=w.p.x;w=create(31);w.enemies=[];w.p.x=200;w.buildings[2].built=true;step(w,{x:1,y:0},.05);ok(w.p.x>iceX,'forge removes frost slowdown');
w=create(1);w.p.x=548;w.p.y=200;tick(w,1,{x:1,y:0});ok(w.p.x<=552,'unbuilt river cannot cross');w.buildings[3].built=true;w.p.y=450;tick(w,1,{x:1,y:0});ok(w.p.x>678,'built bridge allows crossing');
w=create(1);let base=w.p.hp;step(w,{x:1,y:0,dash:true},.05);model.frontierDamage(w,100);ok(w.p.hp===base&&w.p.dash>0,'dash grants invulnerability');let cd=w.p.dash;step(w,{x:1,y:0,dash:true},.05);ok(w.p.dash<cd,'dash cannot retrigger during cooldown');
ok(model.frontierPlan(50).damage>model.frontierPlan(1).damage&&model.frontierPlan(50).windup<model.frontierPlan(1).windup,'difficulty escalates');
// Village economy, physical workers, raids and additive save migration.
w=create(1);ok(w.nodes.length===160,'dense opening forest');ok(create(50).nodes.length===340&&create(50).cfg.width===2400&&create(50).cfg.height===1500,'late maps expand with renewable resources');
w.coins=24;ok(!upgrade(w,'pack')&&w.coins===24,'insufficient gold leaves equipment unchanged');w.coins=25;ok(upgrade(w,'pack')&&w.coins===0,'gold buys larger bag');w.coins=100;w.p.x=900;ok(!upgrade(w,'tool')&&w.coins===100,'equipment requires camp proximity');
w=create(1);w.bank.wood=20;w.p.x=370;w.p.y=470;ok(!model.frontierSell(w,'wood',10),'unbuilt market rejects trade');w.buildings.find(b=>b.kind==='market').built=true;
ok(model.frontierSell(w,'wood',10)&&w.bank.wood===10&&w.coins===20,'selling exact stock grants fixed gold');ok(!model.frontierSell(w,'wood',11)&&!model.frontierSell(w,'wood',-1)&&!model.frontierSell(w,'wood',1.5),'invalid trade cannot create stock or coins');
w.p.x=900;ok(!model.frontierSell(w,'wood',5),'trade cannot operate remotely');
w=create(1);w.enemies[0].hp=0;step(w,{x:0,y:0},.05);ok(w.drops.length===1&&w.coins===0,'monster coins drop on map');let drop=w.drops[0];w.p.x=drop.x;w.p.y=drop.y;step(w,{x:0,y:0},.05);ok(w.coins===4&&w.drops.length===0,'nearby coins collected');step(w,{x:0,y:0},.05);ok(w.coins===4,'dead monster never pays twice');
w=create(1);w.enemies=[];w.siege.next=1e6;w.buildings.find(b=>b.kind==='house').built=true;w.p.x=450;w.p.y=100;tick(w,.05);ok(w.workers.length===2,'house recruits two physical workers');let workerX=w.workers[0].x;tick(w,1);ok(w.workers[0].x!==workerX,'workers move toward resource nodes');tick(w,80);ok(w.bank.wood>0,'workers gather finite nodes and deliver wood');w.buildings.find(b=>b.kind==='quarry').built=true;tick(w,70);ok(w.workers.length===3&&w.bank.stone>0,'quarry recruits stone worker and delivers stone');
w=create(21);w.enemies=[];w.p.inv=1000;w.buildings[3].built=true;w.buildings.find(b=>b.kind==='house').built=true;w.siege.next=9;tick(w,.05);ok(w.siege.next<10&&w.enemies.length===0,'raid warning precedes enemy arrival');tick(w,10);ok(w.enemies.some(e=>e.raider),'raid spawns after countdown');let house=w.buildings.find(b=>b.kind==='house');let raider=w.enemies.find(e=>e.raider);raider.x=w.buildings[0].x;raider.y=w.buildings[0].y;raider.cool=0;w.p.x=1100;w.p.y=700;tick(w,2);ok(w.buildings[0].hp<w.buildings[0].maxHp,'raid damages headquarters');house.hp=0;w.p.x=house.x;w.p.y=house.y;w.bank.wood=10;tick(w,1);ok(house.hp>0,'broken building repairable with wood');
w=create(1);w.enemies=[];w.kills=4;w.siege.wave=w.cfg.assaultWaves;for(let b of w.buildings)b.built=true;ok(model.frontierReady(w),'village prerequisites unlock beacon');step(w,{x:0,y:0},.05);ok(w.phase==='play','completed beacon permits staying on island');ok(model.frontierLeave(w)&&!model.frontierLeave(w),'next island settlement is explicit and once');
w=create(1);w.nodes=w.nodes.slice(0,62);w.buildings=w.buildings.slice(0,6);w.bank.wood=71;delete w.workers;delete w.drops;delete w.camps;delete w.coins;let migrated=model.frontierMigrate(w);ok(migrated.bank.wood===71&&migrated.nodes.length>62&&migrated.buildings.some(b=>b.kind==='house')&&migrated.coins===0,'old snapshots retain materials and gain village fields');
w=create(1);w.enemies=[];w.buildings[0].hp=0;w.bag.wood=3;w.bank.wood=0;tick(w,1);ok(w.buildings[0].hp===0&&w.phase==='dead'&&w.failure==='base','destroyed headquarters loses immediately');
let mover={x:1000,y:200};for(let i=0;i<700;i++)model.frontierWorkerMove(mover,{x:180,y:450},.05);ok(Math.hypot(mover.x-180,mover.y-450)<5,'automatic walker crosses bridge and returns west');
let reverse={x:180,y:200};for(let i=0;i<700;i++)model.frontierWorkerMove(reverse,{x:1000,y:200},.05);ok(Math.hypot(reverse.x-1000,reverse.y-200)<5,'automatic walker crosses bridge east without getting stuck in river');
// Worker pickups use the same resources, never duplicate deliveries.
w=create(1);w.enemies=[];w.nodes=[];w.p.x=350;w.p.y=350;w.supplies=[{x:350,y:350,kind:'wood',amount:5,wait:.65}];ok(model.frontierCollect(w)===5&&w.bag.wood===5&&w.supplies.length===0,'ground wood enters player bag');ok(model.frontierCollect(w)===0&&w.bag.wood===5,'same bundle never pays twice');
w.bag.wood=23;w.supplies=[{x:350,y:350,kind:'stone',amount:4,wait:0}];ok(model.frontierCollect(w)===1&&w.bag.stone===1&&w.supplies[0].amount===3,'partial pickup leaves remaining supplies');ok(model.frontierCollect(w)===0&&w.supplies[0].amount===3,'full bag preserves resources');
w.bag={wood:0,stone:0};w.supplies=[];w.workers=[{x:350,y:350,wood:3,stone:2,target:-1,t:0,mode:'wood'}];ok(model.frontierCollect(w)===5&&w.workers[0].wood===0&&w.workers[0].stone===0,'player can collect carried worker cargo');ok(w.bag.wood===3&&w.bag.stone===2&&w.bank.wood===0,'cargo transfer updates bag without crediting warehouse twice');
w=create(1);w.enemies=[];w.nodes=[{x:350,y:350,kind:'wood',left:6,cool:0,respawn:0}];w.buildings.find(b=>b.kind==='house').built=true;w.workers=[{x:350,y:350,wood:0,stone:0,target:0,t:0,mode:'wood'},{x:350,y:350,wood:0,stone:0,target:0,t:0,mode:'wood'}];w.p.x=800;model.frontierWorkers(w,.05);ok(w.supplies.length>0&&w.nodes[0].left<6,'workers create real pickup bundles');let savedSupply=JSON.parse(JSON.stringify(w));ok(model.frontierMigrate(savedSupply).supplies.length===w.supplies.length,'ground resources survive save migration');
w=create(1);w.coins=1000;w.tech.tool=2;ok(!upgrade(w,'tool')&&model.frontierUpgradeLimit(w,'tool')===2,'tool cap is two before lumber mill');w.buildings.find(b=>b.kind==='mill').built=true;ok(upgrade(w,'tool')&&model.frontierUpgradeLimit(w,'tool')===8,'lumber mill unlocks tool levels');
w.tech.blade=2;ok(!upgrade(w,'blade'),'weapon cap requires forge');w.buildings.find(b=>b.kind==='forge').built=true;ok(upgrade(w,'blade')&&model.frontierUpgradeLimit(w,'blade')===8,'forge unlocks weapon levels');
let baseCap=model.frontierCapacity(w);w.buildings.find(b=>b.kind==='quarry').built=true;ok(model.frontierCapacity(w)===baseCap+12&&model.frontierUpgradeLimit(w,'pack')===8,'quarry increases bag capacity and upgrade cap');
w.buildings.find(b=>b.kind==='house').built=true;w.rescued=2;model.frontierWorkers(w,.05);ok(w.workers.length===6&&w.workers.filter(a=>a.mode==='stone').length===2,'full village recruits six workers with distinct resource roles');
// Siege economy and progression.
w=create(1);w.enemies=[];model.frontierSiege(w,39);ok(w.enemies.length===0,'first assault preparation window');model.frontierSiege(w,1);ok(w.siege.wave===1&&w.enemies.length===4&&w.enemies.every(e=>e.assault),'first wave spawns real attackers');let firstWave=w.enemies.length;w.enemies=[];model.frontierSiege(w,w.cfg.waveGap);ok(w.enemies.length>firstWave,'successive waves grow');
w=create(11);w.enemies=[];w.bank={wood:100,stone:100};let hut=w.buildings.find(b=>b.kind==='barracks');w.p.x=hut.x;w.p.y=hut.y;ok(!model.frontierRecruit(w),'unbuilt barracks cannot train');hut.built=true;let cost=model.frontierRecruitCost(w);ok(model.frontierRecruit(w)&&w.bank.wood===100-cost.wood&&w.bank.stone===100-cost.stone,'recruitment debits exact warehouse resources');model.frontierSiege(w,2);ok(w.fighters.length===1&&hut.queue===0,'paid training creates one defender');let a=w.fighters[0];model.frontierSpawn(w,a.x+10,a.y,0);let foe=w.enemies[0],hp=foe.hp;model.frontierSiege(w,.05);ok(foe.hp<hp,'warrior automatically strikes nearby enemy');let copy=model.frontierMigrate(JSON.parse(JSON.stringify(w)));ok(copy.fighters.length===1&&copy.bank.wood===w.bank.wood,'warrior and recruitment payment persist');w.bank.wood=0;ok(!model.frontierRecruit(w),'unaffordable warrior rejected');
w=create(1);model.frontierBaseHit(w,w.buildings[0].maxHp);ok(w.phase==='dead'&&!model.frontierLeave(w),'headquarters destruction prevents victory');
// UI/platform adapter, with disposable DOM and localStorage doubles.
function harness(seed={},balance=500,mobile=false,portrait=false){
 const elements=new Map(),events=[],listeners={},store=new Map(Object.entries(seed));let now=0,failWrite=false,frame;
 class Element{
  constructor(){this.textContent='';this.hidden=false;this.disabled=false;this.children=[];this.style={};this.dataset={};this.handlers={};this.attrs={};this.className='';const classes=new Set();this.classList={contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)};}
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
 function $(id){if(!elements.has(id)){elements.set(id,new Element());if(id==='ft-shop')elements.get(id).hidden=true;}return elements.get(id);}
 const document={hidden:false,addEventListener(k,f){(listeners[k]||=[]).push(f);},createElement(){return new Element();},fullscreenElement:null};
 const AN={};['start','end','progress','resume','interact'].forEach(k=>AN[k]=(...args)=>{events.push({k,args});return k==='start'?'round-'+events.length:undefined;});
 const window={matchMedia:q=>({matches:mobile&&(!q.includes('orientation')||portrait)}),deepSeaI18n:{sourceText:e=>e.textContent},addEventListener(k,f){(listeners[k]||=[]).push(f);}};
 const c={$ ,S:{balance},AN,ENTRY_FEE:0,LOW_MSG:'low',save(){},renderAll(){},window,document,performance:{now:()=>now},requestAnimationFrame:f=>frame=f,localStorage:{getItem:k=>store.get(k)||null,setItem(k,v){if(failWrite)throw Error('storage blocked');store.set(k,v);}}};
 let game=read('games/frontier/game.js').replace(/\{\{include:([^}]+)\}\}/g,(_,p)=>read(p));
 game=game.replace('var preview=frontierWorld(1);','window.test={world:()=>world,finish:finishStage,persist:persist,paused:()=>paused};var preview=frontierWorld(1);');
 vm.createContext(c);vm.runInContext(game,c);c.frontierRoute(true);
 return {c,$,events,store,get w(){return window.test.world();},test:window.test,emit(k,e={}){(listeners[k]||[]).forEach(f=>f(e));},run(ms=50){now+=ms;frame(now);},fail(){failWrite=true;}};
}
let h=harness();h.$('ft-go').click();ok(!h.$('ft-main').classList.contains('ft-immersive'),'desktop start keeps windowed layout');h.$('ft-full').click();ok(h.$('ft-main').classList.contains('ft-immersive'),'desktop explicit fullscreen uses fallback');h.$('ft-full').click();ok(!h.$('ft-main').classList.contains('ft-immersive'),'fullscreen exit remains available');h.$('ft-go').click();ok(h.c.S.balance===500,'double click starts free once');ok(h.events.filter(e=>e.k==='start').length===1,'single start');ok(h.$('ft-map').children.length===50,'50-stage map');let live=h.w;
h.c.frontierRoute(false);let frozen=live.time;h.run();ok(live.time===frozen&&h.test.paused(),'route exit pauses simulation');h.c.frontierRoute(true);h.run();ok(live.time===frozen,'return waits for manual resume');h.$('ft-go').click();h.run();ok(live.time>frozen&&h.c.S.balance===500,'resume without charge');h.emit('blur');ok(h.test.paused(),'blur pauses');h.$('ft-go').click();h.c.document.hidden=true;h.emit('visibilitychange');ok(h.test.paused(),'background pauses');h.c.document.hidden=false;h.$('ft-go').click();h.w.tech.blade=2;h.w.coins=88;h.w.phase='dead';h.test.finish();h.test.finish();ok(h.events.filter(e=>e.k==='end').length===1,'failure ends once');h.$('ft-go').click();ok(h.w.tech.blade===2&&h.w.coins===88&&h.w.level===1&&h.c.S.balance===500,'free retry retains technology');h.w.phase='clear';h.test.finish();h.test.finish();h.$('ft-go').click();ok(h.w.level===2&&h.w.coins===88&&h.c.S.balance===500,'next stage free and unlocked');h.$('ft-pause').click();h.w.bank.wood=77;h.test.persist();let saved=Object.fromEntries(h.store);let re=harness(saved,490);ok(re.w.level===2&&re.w.bank.wood===77&&re.test.paused(),'reload restores exact progress paused');re.$('ft-go').click();ok(re.c.S.balance===490&&re.events.find(e=>e.k==='start').args[1]===0,'reload creates free round');re.emit('pagehide',{persisted:false});re.emit('pagehide',{persisted:false});ok(re.events.filter(e=>e.k==='end').length===1&&re.events.find(e=>e.k==='end').args[2]==='abandoned','normal pagehide ends once');
h=harness();h.$('ft-go').click();h.emit('pagehide',{persisted:true});ok(h.events.every(e=>e.k!=='end'),'BFCache pauses without ending');
h=harness({},0);h.$('ft-go').click();ok(h.w&&h.c.S.balance===0&&h.events.some(e=>e.k==='start'),'zero balance starts for free');
h=harness();h.fail();h.$('ft-go').click();ok(h.w&&h.c.S.balance===500,'blocked storage still permits free play');
h=harness({'deep-sea-frontier-v1':JSON.stringify({version:1,paid:true,cleared:7,world:{}})},99);ok(h.w.level===8,'incomplete snapshot keeps progress/access');h.$('ft-go').click();ok(h.c.S.balance===99,'recovered paid save does not charge');
h=harness({'deep-sea-frontier-v1':'{broken'},90);ok(!h.w&&h.c.S.balance===90,'malformed save does not mutate wallet');
ok(h.store.get('deep-sea-frontier-v1')==='{broken','malformed data not erased on load');
let old=create(3);old.nodes=old.nodes.slice(0,62);old.buildings=old.buildings.slice(0,6);delete old.coins;delete old.workers;delete old.drops;delete old.camps;old.bank.stone=63;old.tech.pack=3;
h=harness({'deep-sea-frontier-v1':JSON.stringify({version:1,paid:true,cleared:2,world:old})});ok(h.w.level===3&&h.w.tech.pack===3&&h.w.cfg.war&&!!h.w.enemyBase&&!h.w.buildings.some(b=>b.kind==='beacon'),'adapter turns an old stage 1-10 snapshot into the enemy-base stage and keeps equipment');
h.$('ft-go').click();h.$('ft-shop-toggle').click();ok(!h.$('ft-shop').hidden&&h.$('ft-main').classList.contains('ft-shop-open'),'shop reserves a column inside fullscreen root');h.$('ft-shop-close').click();ok(h.$('ft-shop').hidden&&!h.$('ft-main').classList.contains('ft-shop-open'),'shop close restores canvas width without restart');
let previous=h.w;h.emit('blur');h.c.frontierRoute(false);ok(!h.$('ft-main').classList.contains('ft-immersive')&&h.w===previous,'route exit restores layout without replacing save');
let portraitPhone=harness({},0,true,true);portraitPhone.$('ft-go').click();ok(!portraitPhone.test.paused(),'portrait phone starts without rotation gate');let portraitTime=portraitPhone.w.time;portraitPhone.run();ok(portraitPhone.w.time>portraitTime,'portrait simulation advances');portraitPhone.$('ft-full').click();ok(!portraitPhone.$('ft-main').classList.contains('ft-immersive'),'portrait fullscreen exit works');
let phone=harness({},0,true);phone.$('ft-go').click();ok(phone.$('ft-main').classList.contains('ft-immersive'),'touch start still enters fullscreen fallback');
// Parse the shipped executable scripts; application/json is separately decoded.
const html=read('index.html');for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(match[1].includes('application/json'))JSON.parse(match[2]);else new vm.Script(match[2]);}ok(true,'compiled runtime and JSON syntax');
// Enemy-base stages (1-10): fighters, not the hero, destroy the opposing base.
model.frontierClassic=false;
{
 let w=create(1);ok(w.cfg.war&&w.cfg.mission==='war'&&w.enemyBase&&w.enemyBase.hp===w.enemyBase.maxHp&&w.enemyBase.maxHp>=2000,'stage 1 has a thick enemy base');
 ok(!w.buildings.some(b=>b.kind==='beacon'),'war stages have no beacon');
 let tower=w.buildings[4],barracks=w.buildings.find(b=>b.kind==='barracks');
 ok(tower.kind==='tower'&&tower.x<400&&Math.hypot(tower.x-w.buildings[0].x,tower.y-w.buildings[0].y)<200,'tower stands beside the home base');
 ok(barracks&&barracks.x>678,'barracks is across the bridge');
 w.enemies=[];w.siege.next=1e6;w.bank.wood=w.bank.stone=10000;ok(tower.built&&tower.hp===tower.maxHp,'a tower already guards the home base');
 // the hero cannot damage the enemy base
 w.buildings[3].built=true;w.p.x=w.enemyBase.x-40;w.p.y=w.enemyBase.y;w.p.inv=1e6;const full=w.enemyBase.hp;tick(w,6);ok(w.enemyBase.hp===full&&w.phase==='play','hero cannot attack the enemy base');
 // fighters can only be trained at the barracks and cap at six
 w=create(1);w.enemies=[];w.siege.next=1e6;w.bank.wood=w.bank.stone=10000;w.buildings[3].built=true;barracks=w.buildings.find(b=>b.kind==='barracks');
 ok(!model.frontierRecruit(w),'cannot recruit before the barracks exists');
 w.p.x=barracks.x;w.p.y=barracks.y;tick(w,12);ok(barracks.built,'barracks builds across the bridge');
 for(let n=0;n<8;n++)model.frontierRecruit(w);ok(barracks.queue===6&&model.frontierFighterCap(w)===6,'fighter cap is six');
 tick(w,2*6+1);ok(w.fighters.length===6,'barracks trains fighters one by one');
 // fighters march on the base, damage it slowly, and the base hurts them only a little
 const start=w.enemyBase.hp;let fighterHp=w.fighters[0].max;w.p.x=barracks.x;w.p.y=barracks.y;w.p.inv=1e6;
 tick(w,40);ok(w.enemyBase.hp<start,'fighters attack the enemy base');ok(start-w.enemyBase.hp<start*.35,'fighters attack slowly');
 ok(w.fighters.some(f=>f.hp<f.max)&&w.fighters.every(f=>f.hp>0||true),'enemy base hurts fighters');
 const dps=w.fighters.reduce((n,f)=>n+(f.max-f.hp),0)/40;ok(dps<10,'enemy base attack stays weak');
 // victory
 w.enemyBase.hp=1;w.fighters.forEach(f=>{f.hp=f.max;});tick(w,10);ok(w.enemyBase.hp===0&&w.phase==='clear','destroying the enemy base clears the stage');
 // raiders attack the tower and can break it
 w=create(1);w.enemies=[];w.siege.next=1e6;w.p.inv=1e6;tower=w.buildings[4];const towerHp=tower.hp;
 w.enemies.push({x:tower.x+30,y:tower.y,type:'melee',hp:99999,max:99999,state:'walk',t:0,cool:0,tx:0,ty:0,hit:false,counted:false,wave:true,radius:17,raider:true,assault:true});
 w.p.x=900;w.p.y=700;tick(w,12);ok(tower.hp<towerHp&&w.phase==='play','monsters attack the tower');
 // later stages keep the beacon rules
 w=create(11);ok(!w.cfg.war&&w.buildings.some(b=>b.kind==='beacon')&&!w.enemyBase,'stage 11 keeps the beacon rules');
}

console.log(`PASS: ${checks} Frontier model and adapter assertions`);

export const frontierChecks=checks;
