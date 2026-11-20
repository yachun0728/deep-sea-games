import assert from 'node:assert/strict';
import quack from '../shared/quack-pond-rules.cjs';
import mirror from '../shared/mirror-twins-rules.cjs';

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
console.log('PASS: 200 Quack Pond and 10 Mirror Twins solutions; malformed and incomplete proofs rejected');
