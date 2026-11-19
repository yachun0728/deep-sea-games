// Optional logic checks: node tools/test_book_sort.mjs (Node.js, no packages). Covers the pure rules, not the DOM.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/book-sort/game.js',root),'utf8');
const hook='/*bs-test-hook*/';
assert.ok(raw.includes(hook),'test hook anchor missing');
const pure=raw.slice(raw.indexOf('(function(){')+'(function(){'.length,raw.indexOf(hook));
const ctx=vm.createContext({Math,Set,Array,Object});
vm.runInContext(pure+';globalThis.B={LEVELS,CAP,isFull,topCount,canMove,applyMove,solved,solve,randomLevel,legalMoves,COLORS}',ctx);
const B=ctx.B;
const results=[];
const check=(n,f)=>{f();results.push(n)};
check('Every preset has exactly 5 books per color, no preset is already sealed, and each box fits',()=>{
  B.LEVELS.forEach((lv,i)=>{
    const count={};lv.forEach(b=>{assert.ok(b.length<=5);assert.ok(!B.isFull(b),'level '+(i+1)+' starts with a sealed box');b.forEach(c=>count[c]=(count[c]||0)+1)});
    Object.values(count).forEach(n=>assert.equal(n,5,'level '+(i+1)));
    assert.ok(lv.filter(b=>!b.length).length>=2)})});
check('Every preset level is solvable and the solution really wins',()=>{
  B.LEVELS.forEach((lv,i)=>{
    const sol=B.solve(lv,200000);assert.ok(sol,'level '+(i+1)+' unsolvable');
    let st=lv.map(b=>b.slice());for(const m of sol){assert.ok(B.canMove(st,m.from,m.to));st=B.applyMove(st,m.from,m.to)}
    assert.ok(B.solved(st))})});
check('Moves carry the whole same-color top group but never overflow a box',()=>{
  const st=[['a','b','b','b'],['b'],[],[]];
  assert.deepEqual(JSON.parse(JSON.stringify(B.applyMove(st,0,1))),[['a'],['b','b','b','b'],[],[]]);
  const full=[['a','b','b','b'],['b','b','b'],[],[]];
  assert.deepEqual(JSON.parse(JSON.stringify(B.applyMove(full,0,1))),[['a','b'],['b','b','b','b','b'],[],[]]);
  assert.equal(B.canMove([['a'],['b']],0,1),false);
  assert.equal(B.canMove([['a','a','a','a','a'],[]],0,1),false,'sealed boxes cannot be reopened')});
check('Random levels are solvable, keep 5 books per color and are not pre-sealed',()=>{
  for(let i=0;i<15;i++){
    const lv=B.randomLevel(6);const count={};
    lv.forEach(b=>{assert.ok(b.length<=5);assert.ok(!B.isFull(b));b.forEach(c=>count[c]=(count[c]||0)+1)});
    assert.equal(Object.keys(count).length,6);Object.values(count).forEach(n=>assert.equal(n,5));
    assert.ok(B.solve(lv,60000))}});
check('Source has no wallet access',()=>{assert.ok(!/S\.balance|ENTRY_FEE|save\(\)|renderAll/.test(raw))});
console.log(results.map(r=>'ok - '+r).join('\n'));
