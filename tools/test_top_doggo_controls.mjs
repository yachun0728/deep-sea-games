import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../games/top-doggo/play.html', import.meta.url), 'utf8');
const state={started:true,paused:false};const ctx={state,handheld:true};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('  function frameInterval()'),source.indexOf('  function animate(')),ctx);
assert.equal(ctx.frameInterval(),1000/30);ctx.handheld=false;assert.equal(ctx.frameInterval(),1000/60);state.paused=true;assert.equal(ctx.frameInterval(),100);state.paused=false;state.started=false;assert.equal(ctx.frameInterval(),100);
// Execute actual car response at multiple frame rates; equal elapsed time must give equal speed.
const carCode=source.slice(source.indexOf('      const targetSpeed ='),source.indexOf('      car.mesh.rotation.y = car.heading'));
function simulate(hz,inY,initialSpeed=0){const car={speed:initialSpeed,steer:0,heading:0};const c={car,inY,inX:0,dt:1/hz,state:{yaw:0},Math};vm.createContext(c);for(let i=0;i<hz;i++)vm.runInContext('{'+carCode+'}',c);return car.speed;}
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
