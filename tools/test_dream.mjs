// Optional: node tools/test_dream.mjs (no packages).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../games/dream/game.js',import.meta.url),'utf8');
function fixture(balance=100){
 let now=0;const elements=new Map(),events=[];
 const drawing=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{})});
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,dataset:{},addEventListener(){},getContext:()=>drawing});return elements.get(id)};
 const document={hidden:false,focused:true,hasFocus(){return this.focused},addEventListener(){}};
 const ctx={Math,performance:{now:()=>now},document,window:{addEventListener(){}},requestAnimationFrame(){},$:el,C:{},ENTRY_FEE:0,LOW_MSG:'low',S:{balance},save(){},renderAll(){},AN:{start:()=>{events.push(['start']);return 'r'},resume:(...a)=>events.push(['resume',...a]),progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,el,events,step(dt){now+=dt*1000;ctx.drAdvance(now)}};
}
let f=fixture(0);f.ctx.drAction();assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.ctx.S.balance,0);
f=fixture();f.ctx.drAction();f.ctx.drAction();assert.equal(f.ctx.S.balance,100);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,1);
f=fixture();f.ctx.drAction();for(let i=1;i<=100;i++){f.ctx.DR.angle=f.ctx.DR.target;f.ctx.drAction();assert.equal(f.ctx.DR.phase,'passed');f.ctx.drAction()}assert.equal(f.ctx.DR.stage,101);assert.equal(f.ctx.S.balance,100);assert.equal(f.events.filter(e=>e[0]==='start').length,1);assert.equal(f.events.filter(e=>e[0]==='end').length,0);
for(const n of [1,10,11,14,20,21,24,30,100,1000000]){const d=f.ctx.drDifficulty(n);assert(d.width>=24*Math.PI/180);assert(d.speed<=2.4)}
assert.equal(f.ctx.drDifficulty(11).width,f.ctx.drDifficulty(14).width);assert.equal(f.ctx.drDifficulty(21).speed,f.ctx.drDifficulty(24).speed);
for(const [stage,limit] of [[10,0],[11,1],[20,1],[21,2]]){
 f=fixture();f.ctx.drAction();f.ctx.DR.stage=stage;f.ctx.drRound();let warned=0,lastReverse=-100,count=0;
 for(let i=0;i<2000;i++){const before=f.ctx.DR.direction;f.step(.01);const d=f.ctx.DR;if(d.warning>0)warned+=.01;if(before!==d.direction){assert(warned>=.49);assert(d.elapsed-lastReverse>=1.5);assert(f.ctx.drDistance(d.angle,d.target)>d.width/2+d.speed*.25);lastReverse=d.elapsed;count++;warned=0}}assert.equal(count,limit);
}
f=fixture();f.ctx.drAction();f.ctx.DR.stage=21;f.ctx.drRound();f.ctx.DR.reverseAt=0;f.ctx.DR.angle=f.ctx.DR.target;f.step(.01);assert.equal(f.ctx.DR.warning,0);f.ctx.DR.angle=f.ctx.DR.target+Math.PI;f.step(.01);assert(f.ctx.DR.warning>0);
for(const mode of ['route','background','focus']){const before=[f.ctx.DR.angle,f.ctx.DR.warning,f.ctx.DR.elapsed];if(mode==='route')f.el('view-dream').hidden=true;if(mode==='background')f.ctx.document.hidden=true;if(mode==='focus')f.ctx.document.focused=false;f.step(60);assert.deepEqual([f.ctx.DR.angle,f.ctx.DR.warning,f.ctx.DR.elapsed],before);f.el('view-dream').hidden=false;f.ctx.document.hidden=false;f.ctx.document.focused=true;f.step(.01)}
assert(!/drCash|drMultiplier|S.balance\s*\+=/.test(source));
console.log('PASS: entry, single loss, 100 stages, difficulty caps/plateaus, warned reversals, spacing/target guard, pause, zero payouts');
