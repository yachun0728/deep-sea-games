// 萌獸破城隊 Critter Crashers（siege-architect）子頁檢查：
// 1. 子頁自帶繁中／英文字串表（站台字典不翻譯它，見 tools/test_i18n.py 的 SELF_LOCALIZED），兩邊的鍵、型別與函式參數要一致，英文不得含中文。
// 2. 關卡名稱與提示都有中英文。
// 3. 平台橋接：父頁 deepSeaSiege 的開局／進度／結束與子頁的呼叫點對得上，送出的編排能被 Worker 規則驗證。
// 用法：node tools/test_siege_architect.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rules = require('../shared/siege-architect-rules.cjs');
const html = readFileSync(new URL('../games/siege-architect/original.html', import.meta.url), 'utf8');
const parent = readFileSync(new URL('../games/siege-architect/game.js', import.meta.url), 'utf8');
const HAN = /[㐀-鿿]/;

// ---------- string tables ----------
const main = html.match(/<script>\n\(\(\) => \{\n([\s\S]*?)\n\}\)\(\);\n<\/script>/)[1];
const strBlock = main.match(/\nconst STR = (\{[\s\S]*?\n\});\n/)[1];
const STR = new Function('const STR = ' + strBlock + '; return STR;')();
function compare(zh, en, path) {
  assert.equal(typeof en, typeof zh, path + ' type');
  if (typeof zh === 'function') { assert.equal(en.length, zh.length, path + ' arity'); return; }
  if (typeof zh === 'string') {
    assert.ok(en.trim(), path + ' English is empty');
    assert.ok(!HAN.test(en), path + ' English contains Chinese: ' + en);
    return;
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort(), path + ' keys');
  for (const key of Object.keys(zh)) compare(zh[key], en[key], path + '.' + key);
}
compare(STR.zh, STR.en, 'STR');
// sample the template functions with realistic arguments
const unit = rules.SIM.UNITS.rats;
for (const [name, args] of [['level', [3]], ['unlockAt', [11]], ['stat1', [unit]], ['stat2', [rules.SIM.UNITS.peacock]], ['sec', ['2.5']],
  ['gateLeft', [2, 6]], ['need', [2]], ['condParShort', [7]], ['condPar', [7, 9]], ['rSapper', ['Gun', '3.5']], ['rTop', ['Gun', 4]],
  ['rMulti', ['Cannon', '2.0', 3]], ['rArrive', [3, 2]]]) {
  assert.ok(!HAN.test(STR.en[name](...args)), name);
  assert.ok(HAN.test(STR.zh[name](...args)), name);
}
assert.ok(!HAN.test(STR.en.star3({ kind: 'no', unit: 'shield' })) && !HAN.test(STR.en.star3({ kind: 'max', n: 2 })));
assert.ok(!HAN.test(STR.en.tips.notEnough(3, 6)));
for (const L of rules.LEVELS) {
  for (const field of ['name', 'hint']) {
    assert.ok(HAN.test(L[field].zh), field + ' zh');
    assert.ok(L[field].en && !HAN.test(L[field].en), field + ' en: ' + L.name.zh);
  }
}

// ---------- language follows the site ----------
assert.match(html, /<body data-i18n-ignore>/, 'site translator must leave the self-localized page alone');
assert.match(html, /let LANG = pickLang\(siteLang\(\)/, 'language comes from the site first');
assert.match(html, /addEventListener\('arcade-languagechange'/, 'switches live with the site');
assert.match(html, /Noto\+Sans\+SC/, 'Simplified Chinese font');
assert.doesNotMatch(html, /crazygames-sdk/, 'the CrazyGames SDK placeholder is not embedded');

// ---------- bridge contract ----------
for (const call of ["call('start'", "call('progress'", "call('finish'", "call(on ? 'resume' : 'pause')", "call('touch')"]) assert.ok(main.includes(call), call);
for (const method of ['start:', 'progress:', 'finish:', 'pause:', 'resume:', 'touch:']) assert.ok(parent.includes(method), method);
assert.match(main, /PF\.end\(\{ result: 'win', level: li \+ 1, stars: n, best: stars\[li\] \|\| 0, plan: timeline\.map\(t => t \? TYPES\.indexOf\(t\) \+ 1 : 0\) \}\)/);
assert.match(parent, /submitPuzzleSolution\('siege-architect',\[level\]\.concat\(plan\)\)/);
assert.match(main, /const TYPES = \['shield', 'sapper', 'scout', 'rats', 'peacock', 'mole'\];/);
assert.deepEqual(rules.TYPES, ['shield', 'sapper', 'scout', 'rats', 'peacock', 'mole'], 'Worker codes follow the game TYPES order');
assert.match(main, /window\.setSiegePlatformActive = /);
assert.match(parent, /setSiegePlatformActive\(active\)/);

console.log('PASS: Critter Crashers zh/en tables, ' + rules.LEVELS.length + ' level texts, site language hooks and platform bridge');
