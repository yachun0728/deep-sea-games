const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../games/top-doggo/progress.js');
let raw=null;const storage={getItem(){return raw},setItem(k,v){assert.equal(k,P.KEY);raw=v}};
assert.deepEqual(P.load(storage).current,{level:1,mission:0,progress:0});
for(let n=1;n<=10;n++){
 let p=P.load(storage);assert.equal(p.unlocked,n);p.completed.push(n);p.current={level:Math.min(10,n+1),mission:2,progress:3};assert(P.save(storage,p));p=P.load(storage);assert.equal(p.unlocked,Math.min(10,n+1));assert.equal(p.completed.length,n);assert.equal(p.current.progress,3);
}
assert.equal(P.load(storage).completed.length,10);
raw='{bad';assert.equal(P.load(storage).unlocked,1);
raw=JSON.stringify({version:7,completed:[1,2]});assert.equal(P.load(storage).unlocked,1);
let p=P.clean({version:1,completed:[1,1,2,999,-1,'3'],current:{level:99,mission:99,progress:-3}});assert.deepEqual(p.completed,[1,2]);assert.equal(p.current.level,3);assert.equal(p.current.mission,4);assert.equal(p.current.progress,0);
assert.equal(P.save({setItem(){throw Error('quota')}},p),false);assert.equal(P.load({getItem(){throw Error('blocked')}}).unlocked,1);
// Exercise real completion logic: next level unlock, cap at 10, persistence and end once.
const html=fs.readFileSync(new URL('../games/top-doggo/play.html',`file://${__filename}`),'utf8');
const complete=html.slice(html.indexOf('  function levelComplete()'),html.indexOf('  function resetRun()'));
for(let n=1;n<=10;n++){
 const ctx={TopDoggoProgress:P,campaign:P.clean({version:1,completed:Array.from({length:n-1},(_,i)=>i+1)}),level:n,mission:{done:false},state:{pendingNext:false},saved:0,ended:[],persistCampaign:()=>{},endRun:r=>ctx.ended.push(r),banner(){},L:(s)=>s,AudioSys:{play(){}},setPaused(){},overMsg:{},btnPlay:{},renderCampaign(){}};
 vm.createContext(ctx);vm.runInContext(complete+';levelComplete()',ctx);assert(ctx.mission.done);assert.equal(ctx.campaign.unlocked,Math.min(10,n+1));assert.equal(ctx.campaign.current.level,Math.min(10,n+1));assert.equal(ctx.campaign.completed.length,n);assert.deepEqual(ctx.ended,['win']);
}
console.log('PASS: 10-level unlock/save/reload, malformed/blocked storage, completion and level-10 cap');
const levels=require('../games/top-doggo/levels.js');assert.equal(levels.levels.length,10);assert.equal(P.COUNT,levels.levels.length);
for(let i=1;i<levels.levels.length;i++){
 const a=levels.levels[i-1],b=levels.levels[i];for(const k of ['hp','dmg','speed','bspeed','melee','extra','kills','bones','ram','combo','elite'])assert(b[k]>a[k],`level ${i+1} increases ${k}`);assert(b.rate<a.rate,'faster enemy fire each level');
}
// Execute the shipped campaign controller with a small DOM and combat stand-in.
function element(){return {hidden:false,textContent:'',children:[],listeners:{},classList:{remove(){}},append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},setAttribute(){},addEventListener(t,f){this.listeners[t]=f}}}
const els=new Map(),el=id=>{if(!els.has(id))els.set(id,element());return els.get(id)};
let persisted=JSON.stringify({version:1,completed:[1,2],current:{level:3,mission:2,progress:4}});
const sandbox={TopDoggoProgress:P,TopDoggoLevels:levels,localStorage:{getItem:()=>persisted,setItem:(k,v)=>persisted=v},document:{getElementById:el,createElement:element,addEventListener(){}},window:{addEventListener(){}},Math,L:(s,ps={})=>s.replace(/\{(\w+)\}/g,(_,k)=>ps[k]),state:{started:false},tutorial:{active:false},mission:{i:0,p:0,done:false},level:1,freeRoam:false,run:{active:false},AudioSys:{},endRun(){sandbox.run.active=false},clearInputs(){},ensureMissionTargets(){},resetMissions(){sandbox.mission={i:0,p:0,done:false}},startNextLevel(){sandbox.level++;sandbox.MISSIONS=[{goal:20},{goal:20},{goal:20},{goal:20},{goal:20}]},goalOf:m=>m.goal,enemies:[],bones:[],projectiles:[],player:{visible:true,position:{set(){}}},heroShadow:{},dogBodyGroup:{position:{set(){}}},START:{x:0,z:0},setWeapon(){},btnCrouch:element(),beginRun(){sandbox.run.active=true},setPaused(p){sandbox.state.paused=p},updateHUD(){},updateMissionHUD(){},btnPlay:element(),scene:{remove(){}},campaignReady:false};
vm.createContext(sandbox);vm.runInContext(html.slice(html.indexOf('  let campaignStorage;'),html.indexOf('  // Action Triggers')),sandbox);
sandbox.startCampaignLevel(3,true);assert.equal(sandbox.level,3);assert.equal(sandbox.mission.i,2);assert.equal(sandbox.mission.p,4);
sandbox.startCampaignLevel(2,false);assert.equal(sandbox.mission.i,0);assert.equal(JSON.parse(persisted).current.level,2);
const checkpoint=persisted;sandbox.startCampaignLevel(1,false,true);assert.equal(persisted,checkpoint,'free roam preserves campaign save');sandbox.mission.p=9;sandbox.saveCheckpoint();assert.equal(persisted,checkpoint,'free roam kills never overwrite checkpoint');
console.log('PASS: per-level escalation, real controller checkpoint restore/replay, free-roam save isolation');
// Mouse dragging no longer changes yaw; left-button attack and right-button focus remain.
const mouseEvents={},windowEvents={},mouseState={started:true,paused:false,yaw:.7};let fired=0;
const mouseCtx={mouseAim:{active:false},updateMouseAim(){},state:mouseState,canvas:{addEventListener:(t,f)=>mouseEvents[t]=f},window:{addEventListener:(t,f)=>windowEvents[t]=f},triggerAttack(){fired++},triggerTurn180(){}};
vm.createContext(mouseCtx);vm.runInContext(html.slice(html.indexOf('  // Mouse Listeners (PC)'),html.indexOf('  // Mobile Joystick Touch Handling')),mouseCtx);
mouseEvents.mousedown({button:2,clientX:100,preventDefault(){}});assert.equal(windowEvents.mousemove,undefined);assert.equal(mouseState.yaw,.7);mouseEvents.mousedown({button:0});assert.equal(fired,1);
console.log('PASS: desktop drag does not rotate the camera; mouse attack retained');
