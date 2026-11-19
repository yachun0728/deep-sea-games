// Optional: node tools/test_balance_zero.mjs (no packages). One-time zero reset of the shared balance.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../js/wallet.js', import.meta.url), 'utf8');
function run(initial) {
  const store = new Map(Object.entries(initial));
  const localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
  const ctx = { localStorage, S: { balance: 0 }, STORE: 'crush-depth-balance', START_BALANCE: 0, document: { getElementById: () => null } };
  vm.createContext(ctx);
  vm.runInContext(source + ';this.load=load;this.save=save;', ctx);
  return { ctx, store };
}
let r = run({ 'crush-depth-balance': '500', 'deep-sea-wardrobe-v1': '{"keep":1}' });
r.ctx.load();
assert.equal(r.ctx.S.balance, 0);
assert.equal(r.store.get('crush-depth-balance'), '0');
assert.equal(r.store.get('deep-sea-balance-zero-v1'), '1');
assert.equal(r.store.get('deep-sea-wardrobe-v1'), '{"keep":1}');
r.ctx.S.balance = 37; r.ctx.save();
const again = run(Object.fromEntries(r.store));
again.ctx.load();
assert.equal(again.ctx.S.balance, 37, 'second load keeps points earned after the reset');
r = run({});
r.ctx.load();
assert.equal(r.ctx.S.balance, 0);
assert.equal(r.store.get('deep-sea-balance-zero-v1'), '1');
console.log('PASS: balance zero reset runs once and keeps the wardrobe');
