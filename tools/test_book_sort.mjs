// Optional logic checks: node tools/test_book_sort.mjs (Node.js, no packages). Covers the pure rules, not the DOM.
import fs from 'node:fs';
import B from '../shared/book-sort-rules.cjs';
import { verifiesBookSortScore } from '../backend/src/services/book-sort-scores.mjs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/book-sort/game.js',root),'utf8');
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
check('Numbered stages escalate, remain repeatable and have playable solutions',()=>{
  for(const [level,colors,empty] of [[6,9,2],[10,9,2],[11,10,2],[21,11,2],[35,11,2],[36,11,1],[37,11,1],[300,11,1],[2**32+1,11,1]]){
    const entry=B.campaignLevel(level);
    assert.deepEqual(entry,B.campaignLevel(level),'repeatable stage '+level);
    assert.equal(entry.boxes.filter(b=>!b.length).length,empty);
    const count=new Map();
    for(const box of entry.boxes){
      assert.ok(box.length<=B.CAP&&!B.isFull(box));
      for(const book of box)count.set(book,(count.get(book)||0)+1);
    }
    assert.equal(count.size,colors);
    assert.ok([...count.values()].every(n=>n===B.CAP));
    const path=B.solve(entry.boxes,4000);
    assert.equal(path.length,entry.par);
    assert.ok(B.solved(path.reduce((board,move)=>{
      assert.ok(B.canMove(board,move.from,move.to));
      return B.applyMove(board,move.from,move.to);
    },entry.boxes)));
  }
  assert.notDeepEqual(B.campaignLevel(36).boxes,B.campaignLevel(37).boxes);
});
check('Each difficulty tier has a solvable fallback with the promised mix',()=>{
  for(const tier of B.TIERS){
    const boxes=tier.fallback.split(' ').map(stack=>[...stack].map(n=>B.COLORS[parseInt(n,16)]));
    for(let i=0;i<tier.empty;i++)boxes.push([]);
    assert.ok(B.solve(boxes,4000));
    assert.ok(boxes.reduce((sum,b)=>sum+b.filter((c,i)=>i>0&&c!==b[i-1]).length,0)>=tier.mix);
  }
});
check('Ranked replay must legally clear the claimed numbered board',()=>{
  for(const stage of [1,6,36]){
    const {boxes}=B.campaignLevel(stage);
    const moves=B.solve(boxes,4000).map(({from,to})=>[from,to]);
    assert.ok(verifiesBookSortScore(stage,moves));
    assert.ok(verifiesBookSortScore(stage,[[],...moves]));
    assert.equal(verifiesBookSortScore(stage,moves.slice(0,-1)),false);
    assert.equal(verifiesBookSortScore(stage,[[],[],...moves]),false);
    assert.equal(verifiesBookSortScore(stage,[...moves,[]]),false);
    assert.equal(verifiesBookSortScore(stage,[[0,999],...moves]),false);
  }
  assert.equal(verifiesBookSortScore(0,[[0,1]]),false);
  assert.equal(verifiesBookSortScore(1,Array.from({length:4097},()=>[])),false);
});
check('Source has no wallet access',()=>{assert.ok(!/S\.balance|ENTRY_FEE|save\(\)|renderAll/.test(raw))});
console.log(results.map(r=>'ok - '+r).join('\n'));
