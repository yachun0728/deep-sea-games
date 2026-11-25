import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=fs.readFileSync(new URL('../games/top-doggo/play.html',import.meta.url),'utf8');
const code=s.slice(s.indexOf('  function angleDelta('),s.indexOf('  function triggerAttack()'));
const ctx={Math,bulletBlocked:()=>false};vm.createContext(ctx);vm.runInContext(code,ctx);
const origin={x:0,z:0};const enemy=(x,z,hp=100)=>({hp,mesh:{position:{x,z}}});
const front=enemy(1,-8),back=enemy(0,5),side=enemy(10,0),far=enemy(0,-40),dead=enemy(0,-4,0);
assert.equal(ctx.assistedTarget(origin,0,[back,side,far,dead,front]),front);
ctx.bulletBlocked=()=>true;assert.equal(ctx.assistedTarget(origin,0,[front]),null);
ctx.bulletBlocked=()=>false;assert.equal(ctx.assistedTarget(origin,Math.PI,[front,back]),back);
assert.ok(Math.abs(ctx.angleDelta(-Math.PI+.1,Math.PI-.1)-.2)<1e-9);
// Execute actual tutorial completion with strict no-ranking stand-ins.
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{},hidden:true,addEventListener(){},classList:{add(){},remove(){}}});return elements.get(id)};
const state={};const marker={visible:true},target={visible:true};const tutorial={active:true,marker,target};let saved=0,reset=0,cleared=0,rounds=0;
const tctx={selectedLevel:3,startCampaignLevel(n,resume){assert.equal(n,3);assert.equal(resume,true);reset++;rounds++;state.started=true;state.paused=false},document:{getElementById:el},beginRun(){rounds++},projectiles:[],scene:{remove(){}},tutorial,state,tutorialSeen:false,TUTORIAL_KEY:'key',localStorage:{setItem(){saved++}},clearInputs(){cleared++},tutorialPanel:el('panel'),enemies:[],bones:[],player:{position:{set(){}}},dogBodyGroup:{position:{set(){}}},START:{x:0,z:0},resetMissions(){reset++},setPaused(p){state.paused=p},updateHUD(){},overMsg:el('msg'),L:s=>s};
vm.createContext(tctx);vm.runInContext(s.slice(s.indexOf('  function finishTutorial()'),s.indexOf('  function tickTutorial(')),tctx);tctx.finishTutorial();assert.equal(saved,1);assert.equal(reset,1);assert.equal(cleared,0);assert.equal(rounds,1);assert.equal(tutorial.active,false);assert.equal(tctx.tutorialSeen,true);assert.equal(state.started,true);assert.equal(state.paused,false);assert.equal(marker.visible,false);
// Practice movement remains live; combat/score/AI block requires a real ranked run.
assert.ok(s.includes('if(!tutorial.active && run.active){'));
assert.ok(s.includes('if(!tutorialSeen){startTutorial();return;}'));
console.log('PASS: forward-cone assist, rear/side/range/dead rejection, wall rejection, angle wrapping, tutorial completion isolation and persistence');
// Hits require an actual practice projectile to reach the target, not just an attack callback.
class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}length(){return Math.hypot(this.x,this.y,this.z)}addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}}
const practice={step:1,hits:0,target:{position:new V(0,1.4,-5)},marker:{position:new V()},dodged:false};
const shots=[];const hitctx={impactAt(){},tutorial:practice,projectiles:shots,Math,bulletBlocked:()=>false,burst(){},AudioSys:{play(){}},scene:{remove(){}},setTutorialStep(i){practice.step=i},tutorialText(){},player:{position:new V()},state:{dodgeTimer:0},finishTutorial(){}};
vm.createContext(hitctx);vm.runInContext(s.slice(s.indexOf('  function tickTutorial('),s.indexOf("  document.getElementById('tutorial-skip')",s.indexOf('  function tickTutorial('))),hitctx);
hitctx.tickTutorial(1/30);assert.equal(practice.hits,0);
shots.push({life:1,vel:new V(0,0,-36),mesh:{position:new V(0,1.4,-4)}});hitctx.tickTutorial(1/30);assert.equal(practice.hits,1);assert.equal(shots.length,0);
shots.push({life:1,vel:new V(0,0,-36),mesh:{position:new V(5,1.4,-4)}});hitctx.tickTutorial(1/30);assert.equal(practice.hits,1);
console.log('PASS: visible practice ball required for hits; misses do not count');

assert.ok(!s.includes("if(tutorial.step!==1)return;"),"practice never gates firing on the current step");
