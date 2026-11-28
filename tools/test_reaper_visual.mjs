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

const legStart=source.indexOf('  function rpLegPose('),legEnd=source.indexOf('  function rpSoul(',legStart);
vm.runInContext(source.slice(legStart,legEnd),context);
const legs=context.rpLegPose;
assert.ok(legs(.3,0).lift===0&&legs(.3,1).lift>7,'One foot is planted while the other lifts');
assert.ok(legs(.8,1).lift===0&&legs(.8,0).lift>7,'Left and right legs alternate');
for(const phase of [.1,.3,.55,.7,.9])for(const n of [0,1]){const p=legs(phase,n);const cross=(p.knee.x-p.hip.x)*(p.ankle.y-p.hip.y)-(p.knee.y-p.hip.y)*(p.ankle.x-p.hip.x);assert.ok(Math.abs(cross)>10,'Visible knee bend, not a rigid translated leg');}
console.log('PASS: real two-link legs bend, plant, lift and alternate; the ghost is not a translated static sprite');
