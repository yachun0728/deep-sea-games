import assert from 'node:assert/strict';
import quack from '../shared/quack-pond-rules.cjs';
import mirror from '../shared/mirror-twins-rules.cjs';
import siege from '../shared/siege-architect-rules.cjs';
import { readFileSync } from 'node:fs';

for (let level = 1; level <= quack.levels.length; level++) {
  const solution = [...quack.levels[level - 1].split('|')[2]].map(Number);
  assert.ok(quack.verify([level, ...solution]), 'Quack level ' + level);
  assert.equal(quack.verify([level, ...Array(solution.length).fill(0)]), false);
}
for (let level = 1; level <= mirror.LEVELS.length; level++) {
  const board = mirror.parse(mirror.LEVELS[level - 1].rows);
  const key = (a,b) => a+'|'+b;
  const seen = new Set([key(board.A,board.B)]);
  const queue = [[board.A,board.B,[]]];
  let solution;
  for(let next=0;next<queue.length&&!solution;next++){
    const [a,b,actions] = queue[next];
    for(let input=0;input<4;input++){
      const result=mirror.step(board,a,b,...mirror.DIRS[input]);
      if(result.dead) continue;
      const proof=[...actions,input];
      if(result.win){solution=proof;break;}
      const id=key(result.a,result.b);
      if(!seen.has(id)){seen.add(id);queue.push([result.a,result.b,proof]);}
    }
  }
  assert.ok(solution,'Mirror level '+level);
  assert.ok(mirror.verify([level,...solution]));
  assert.equal(mirror.verify([level,...solution,0]),false);
}
assert.equal(mirror.verify([1,99]),false);
assert.equal(quack.verify([201]),false);

// Critter Crashers: the Worker's copy of the simulation and levels must match the embedded game verbatim.
const siegeHtml = readFileSync(new URL('../games/siege-architect/original.html', import.meta.url), 'utf8');
const siegeShared = readFileSync(new URL('../shared/siege-architect-rules.cjs', import.meta.url), 'utf8');
for (const id of ['sim', 'levels']) {
  const block = siegeHtml.match(new RegExp('<script id="' + id + '">\\n([\\s\\S]*?)</script>'))[1];
  assert.ok(siegeShared.includes(block), 'Critter Crashers ' + id + ' block matches the game');
}
const siegePlans = ['00000001000002000000','00100000002000000000','02330000000000000000','31003000300020000000','01000100000302000000',
  '00013000200000000000','03440200300000000000','00130043020300000000','10000000402033000000','41442340000000000000',
  '03005253000000000000','05052300000000000000','14044020000000000000','06600025000000000000','04056020300000000000',
  '00004622500000000000','23452600000000000000','16232000000000000000','56066025000000000000','50053522400000000000'];
assert.equal(siegePlans.length, siege.LEVELS.length);
siegePlans.forEach((plan, index) => {
  const codes = [...plan].map(Number);
  assert.ok(siege.verify([index + 1, ...codes]), 'Critter Crashers level ' + (index + 1));
  assert.equal(siege.verify([index + 1, ...codes.slice(0, -1)]), false, 'short plan');
  assert.equal(siege.verify([index + 1, ...Array(20).fill(0)]), false, 'empty plan');
});
assert.equal(siege.verify([1, ...Array(20).fill(2)]), false, 'over budget');
assert.equal(siege.verify([1, 6, ...Array(19).fill(0)]), false, 'locked unit');
assert.equal(siege.verify([21, ...Array(20).fill(0)]), false, 'unknown level');
assert.equal(siege.verify([2, ...[...siegePlans[0]].map(Number)]), false, 'plan for another level');
console.log('PASS: 200 Quack Pond, 10 Mirror Twins and 20 Critter Crashers solutions; malformed and incomplete proofs rejected');
