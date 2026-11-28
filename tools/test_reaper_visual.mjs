import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../games/reaper/game.js',import.meta.url),'utf8');
const start=source.indexOf('  function rpSwingPose('),end=source.indexOf('  function rpPlaqueText(',start);
const context={RP_SWING_TIME:.28};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
const pose=context.rpSwingPose;
// Probe the real painted blade's end in the approved source layer, not a placeholder hit marker.
const blade={x:-44.6+(427-76)/360*101,y:-93.3+(273-48)/452*127};
function tip(p){return {x:p.x+blade.x*Math.cos(p.angle)-blade.y*Math.sin(p.angle),y:p.y+blade.x*Math.sin(p.angle)+blade.y*Math.cos(p.angle)};}
const idle=pose(0),strike=pose(.28*.4),from=tip(idle),to=tip(strike);
assert.ok(to.y>from.y+65,'Blade moves downward toward the belt');
assert.ok(to.x>=171&&to.x<=229&&to.y>=230&&to.y<=307,'Strike reaches the ordinary soul body in the gold collection zone');
assert.ok(Math.abs(to.x-200)<8,'Strike stays centered on the gold box');
for(let i=0;i<=100;i++)for(const value of Object.values(pose(.28*i/100)))assert.ok(Number.isFinite(value));
const recovery=pose(1e-8);assert.ok(Math.abs(recovery.x-idle.x)<.001&&Math.abs(recovery.y-idle.y)<.001&&Math.abs(recovery.angle)<.001,'Animation returns to the approved idle pose before cooldown unlocks');
assert.ok(.28<.35,'Visual animation finishes inside the unchanged input cooldown');
console.log('PASS: actual blade moves down into the gold-zone ghost, recovers, and preserves input cooldown');
console.log(JSON.stringify({idleTip:from,strikeTip:to}));

const soulStart=source.indexOf('  function rpSoul('),soulEnd=source.indexOf('  function rpDraw(',soulStart);
const calls=[];context.reaperCtx={save(){},restore(){},globalAlpha:1};
context.rpImage=(...args)=>calls.push({args,alpha:context.reaperCtx.globalAlpha});
vm.runInContext(source.slice(soulStart,soulEnd),context);
for(const x of [80,200,310]){
  calls.length=0;context.rpSoul(x,307,true,.6,.5);
  assert.deepEqual(calls[0].args,['ghost',109,111,294,389,x-29,230,58,77]);
  assert.equal(calls[0].alpha,.6);assert.equal(calls.length,3);
  assert.equal(calls[1].alpha,.3);assert.equal(calls[2].alpha,.3);
}
calls.length=0;context.rpSoul(200,307,true,1,0);assert.equal(calls.length,1,'Expired permit stays hidden');
console.log('PASS: conveyor carries the unchanged approved ghost pose; permit fade remains intact');
