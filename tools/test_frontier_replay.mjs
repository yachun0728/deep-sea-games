import assert from 'node:assert/strict';
import rules from '../shared/frontier-rules.cjs';

const live = rules.create(42);
const worker = rules.create(42);
for(let part=0;part<10;part++){
  const code=((part%2?10:11)*21+10)*2;
  assert.ok(rules.input(live,code));
  for(let tick=0;tick<100;tick++)rules.advance(live);
  const proof=[100,code];
  assert.ok(rules.accepts(proof));
  assert.ok(rules.apply(worker,proof));
  assert.deepEqual(worker,live);
  const saved=JSON.parse(JSON.stringify(worker));
  assert.deepEqual(saved.world.bank,live.world.bank);
}
assert.equal(rules.apply(rules.create(42),[0,886]),false);
assert.equal(rules.apply(rules.create(42),[0,885]),false);
assert.equal(rules.accepts([2401]),false);
assert.equal(rules.accepts([1,2200]),false);
assert.equal(rules.accepts([1,1100,0]),false);
assert.equal(worker.completed,0);
console.log('PASS: Frontier chunk replay matches 1,000 movement steps and rejects illegal victories and recruitment');
