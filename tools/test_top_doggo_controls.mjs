import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../games/top-doggo/play.html', import.meta.url), 'utf8');
const state={started:true,paused:false};const ctx={state,handheld:true};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('  function frameInterval()'),source.indexOf('  function animate(')),ctx);
assert.equal(ctx.frameInterval(),1000/30);ctx.handheld=false;assert.equal(ctx.frameInterval(),1000/60);state.paused=true;assert.equal(ctx.frameInterval(),100);state.paused=false;state.started=false;assert.equal(ctx.frameInterval(),100);
// Execute actual car response at multiple frame rates; equal elapsed time must give equal speed.
const carCode=source.slice(source.indexOf('      const targetSpeed ='),source.indexOf('      car.mesh.rotation.y = car.heading'));
function simulate(hz,inY,initialSpeed=0){const car={speed:initialSpeed,steer:0,heading:0};const c={car,inY,inX:0,keyboardTurn:0,forward:{set(){}},right:{set(){}},dt:1/hz,state:{yaw:0},Math};vm.createContext(c);for(let i=0;i<hz;i++)vm.runInContext('{'+carCode+'}',c);return car.speed;}
assert.ok(Math.abs(simulate(30,-1)-simulate(60,-1))<1e-8);
assert.ok(simulate(30,0,22)<.1,'release brakes within one second');
assert.ok(simulate(30,1)>-11,'reverse speed capped');
const joyInput={};const joyKnob={style:{}};const joyBase={getBoundingClientRect:()=>({left:0,top:0,width:112,height:112})};
const joy={joyInput,joyKnob,joyBase,Math};vm.createContext(joy);
vm.runInContext(source.slice(source.indexOf('  function updateJoy('),source.indexOf('  // Screen Swipe')),joy);
joy.updateJoy({clientX:58,clientY:56});assert.equal(joyInput.x,0,'small drift ignored');
joy.updateJoy({clientX:94,clientY:56});assert.ok(Math.abs(joyInput.x-1)<1e-9,'full input retained');
assert.ok(!source.includes('id="cash-text"'),'no money HUD');assert.ok(!source.includes("'+$'"),'no currency popups');
console.log('PASS: frame budgets, time-independent acceleration, braking, reverse cap, joystick dead zone, no money HUD');
// Arrow turning drives the actual car, and yaw cannot separate from its heading.
const driven={speed:12,steer:0,heading:0};const drive={car:driven,inY:-1,inX:0,keyboardTurn:1,dt:1/30,state:{yaw:2},forward:{set(){}},right:{set(){}},Math};vm.createContext(drive);vm.runInContext('{'+carCode+'}',drive);assert(driven.heading>0,'left arrow turns car left');assert.equal(drive.state.yaw,driven.heading,'camera yaw follows car');
const turnState={drivingCar:{},turn180Timer:0,yaw:1};const turnCtx={state:turnState,AudioSys:{play(){throw Error('must not quick-turn a car')}}};vm.createContext(turnCtx);vm.runInContext(source.slice(source.indexOf('  function triggerTurn180()'),source.indexOf('  function toggleWeaponMode()')),turnCtx);turnCtx.triggerTurn180();assert.equal(turnState.yaw,1);assert.equal(turnState.turn180Timer,0);
console.log('PASS: car arrow steering synchronizes heading/camera; vehicle quick-turn is blocked');
// Actual cursor-to-world selection: desktop accepts the cursor position, mobile keeps centre aim.
class V3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}clone(){return new V3(this.x,this.y,this.z)}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}length(){return Math.hypot(this.x,this.y,this.z)}addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this}setY(y){this.y=y;return this}}
let ndc;const aimCtx={Math,innerWidth:1000,handheld:false,canvas:{getBoundingClientRect:()=>({left:0,top:0,width:1000,height:500})},raycaster:{setFromCamera(p){ndc=p},ray:{intersectPlane(plane,p){Object.assign(p,{x:10,y:1.1,z:4});return p}}},THREE:{Vector2:class{constructor(x,y){Object.assign(this,{x,y})}},Vector3:V3},camera:{},aimPlane:{},player:{position:new V3()},state:{yaw:0}};
vm.createContext(aimCtx);vm.runInContext(source.slice(source.indexOf('  const mouseAim='),source.indexOf('  function angleDelta(')),aimCtx);
aimCtx.updateMouseAim({clientX:900,clientY:100});const point=aimCtx.getCenterCrosshairTarget();assert.equal(ndc.x,.8);assert.equal(ndc.y,.6);assert.equal(point.x,10);assert.equal(point.z,4,'desktop can aim behind player without rotating camera');
aimCtx.handheld=true;const phonePoint=aimCtx.getCenterCrosshairTarget();assert.equal(ndc.x,0);assert.equal(ndc.y,0);assert.equal(phonePoint.z,-18,'phone uses centre-forward fallback');
console.log('PASS: cursor raycast on desktop, fixed centre aim on mobile');
