// Node twin of tools/i18n_data.py expand_ids(): tests read games/*/game.js, which holds {{t:id}} / {{tb:id}}
// placeholders instead of Chinese text, exactly like the build input. Use readSource() instead of readFileSync.
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const load = name => { try { return JSON.parse(fs.readFileSync(new URL('locales/' + name, root), 'utf8')); } catch { return {}; } };
const zh = load('zh-Hant.json'), en = load('en.ids.json');

function jsEscape(text, quote) {
  let out = text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  if ('\'"`'.includes(quote) && quote) {
    out = out.split(quote).join('\\' + quote);
    if (quote === '`') out = out.split('${').join('\\${');
  } else out = out.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/`/g, '\\`');
  return out;
}

export function expandIds(source) {
  return source.replace(/\{\{(tb?):([^{}\r\n]+)\}\}/g, (all, kind, key, offset) => {
    if (!(key in zh)) throw new Error('Unknown text id ' + key);
    const text = kind === 't' ? zh[key] : zh[key] + '|' + en[key];
    return jsEscape(text, offset ? source[offset - 1] : '');
  });
}

export function readSource(file, base = root) {
  return expandIds(fs.readFileSync(new URL(file, base), 'utf8'));
}
