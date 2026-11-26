// Deterministic tests of the actual embedded physics engine, not a replica.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../preview/sand-art/index.html',import.meta.url),'utf8');
const source=html.match(/<script id="sand-engine">([\s\S]*?)<\/script>/)[1];
const scope=vm.createContext({});vm.runInContext(source,scope);
const {SandWorld,MAX}=scope.SandEngine;
function seeded(){let n=15;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)}
function advance(w,n=240){for(let i=0;i<n;i++)w.step(1/120)}
let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name)}
test('paper never binds; friction stops sand without deleting it',()=>{const w=new SandWorld(()=>0,seeded());w.emit(100,100,1,40);const before=w.grains.length;advance(w);assert.equal(w.stats().bound,0);assert.equal(w.grains.length,before);assert.ok(w.grains.every(p=>Math.hypot(p.vx,p.vy)<1))});
test('peeling alone never fills a region; invalid regions cannot peel',()=>{const w=new SandWorld(()=>0);assert.equal(w.peel(-1),false);assert.equal(w.peel(12),false);w.peel(0);advance(w);assert.equal(w.grains.length,0)});
test('sand binds gradually only after passing exposed adhesive',()=>{const w=new SandWorld((x)=>x>120?1:0,seeded());w.peel(1);w.emit(90,100,2,30,2);advance(w,120);assert.equal(w.stats().bound,0);w.gx=.35;advance(w,300);assert.ok(w.stats().bound>0);assert.ok(w.grains.filter(p=>p.bound).every(p=>p.x>120));assert.equal(w.emitted,w.grains.length+w.exited)});
test('adhesion is gradual, mixed colors stay separate and bound grains stay fixed',()=>{const w=new SandWorld(()=>0,seeded());w.peel(0);w.emit(160,200,2,50);w.emit(160,200,9,50);w.step(1/120);assert.equal(w.stats().bound,0);advance(w);assert.ok(w.stats().bound>0);assert.ok(w.stats().bound<100);const anchored=w.grains.filter(p=>p.bound).map(p=>({p,x:p.x,y:p.y}));w.gx=1;w.gy=-1;w.shake();w.tap();w.impulse(160,200,60,160,180);advance(w,100);for(const a of anchored){assert.equal(a.p.x,a.x);assert.equal(a.p.y,a.y)}assert.ok(w.grains.every(p=>p.color===2||p.color===9));assert.ok(w.grains.some(p=>p.color===2));assert.ok(w.grains.some(p=>p.color===9))});
test('scraper, brush and pick impulses move loose grains while gravity continues',()=>{for(const radius of [26,19,5]){const w=new SandWorld(()=>0,seeded());w.emit(180,200,1,1,0);w.grains[0].vx=0;w.grains[0].vy=0;w.gy=.4;const y=w.grains[0].y;w.impulse(180,200,radius,90,0);w.step(1/120);assert.ok(w.grains[0].x>180);assert.ok(w.grains[0].vy>0);advance(w,20);assert.ok(w.grains[0].y>y)}});
test('inertia persists; contact spreads a pile without erasing grains',()=>{const w=new SandWorld(()=>0,seeded());w.emit(180,200,1,80,1);advance(w,200);assert.equal(w.grains.length,80);assert.ok(Math.max(...w.grains.map(p=>p.x))-Math.min(...w.grains.map(p=>p.x))>10);w.gx=1;advance(w,25);w.gx=0;const p=w.grains[0],x=p.x;w.step(1/120);assert.ok(p.x>x)});
test('excess sand only exits after physically crossing outer view, with conservation',()=>{const w=new SandWorld(()=>0,seeded());w.emit(180,350,1,60);w.gy=1;let sawApron=false;for(let i=0;i<600;i++){w.step(1/120);if(w.grains.some(p=>p.y>380&&p.y<=428))sawApron=true;assert.equal(w.emitted,w.grains.length+w.exited)}assert.ok(sawApron);assert.equal(w.exited,60)});
test('particle cap pauses emission rather than deleting old grains',()=>{const w=new SandWorld(()=>0,seeded());w.emit(180,200,1,MAX+50,50);assert.equal(w.grains.length,MAX);assert.equal(w.emitted,MAX);assert.equal(w.full,true)});
test('height axis supports piled grains; airborne grains cannot bind',()=>{const w=new SandWorld(()=>0,seeded());w.peel(0);w.emit(180,200,1,200,3);assert.ok(w.grains.every(p=>p.z>=10));w.step(1/120);assert.equal(w.stats().bound,0);advance(w,240);assert.ok(w.grains.some(p=>!p.bound&&p.z>.5));assert.ok(w.grains.every(p=>Number.isFinite(p.z)&&p.z>=0));const p=w.grains.find(p=>!p.bound);const before=p.z;w.shake();advance(w,3);assert.ok(p.z>before)});
console.log(`${passed} physics checks passed.`);
