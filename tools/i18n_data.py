"""Locale data shared by build.py and the i18n tests.

locales/zh-Hant.json  {id: 繁體中文}  - the only place to edit Chinese text that is referenced as {{t:id}}.
locales/en.ids.json   {id: English}   - English for those same ids.
locales/en.json       {中文: English}  - legacy dictionary, still keyed by Chinese text for strings not yet migrated.
At build time {{t:id}} expands to the Chinese text and the embedded dictionary gets 中文 -> English for every id,
so js/i18n.js keeps translating by exact Chinese text and nothing changes at runtime.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(root, name):
    path = Path(root) / 'locales' / name
    return json.loads(path.read_text(encoding='utf-8')) if path.is_file() else {}


def zh_ids(root=ROOT):
    return _load(root, 'zh-Hant.json')


def en_ids(root=ROOT):
    return _load(root, 'en.ids.json')


def dictionary(root=ROOT):
    """Legacy dictionary plus the id-based entries, keyed by Chinese text."""
    merged = dict(_load(root, 'en.json'))
    zh, en = zh_ids(root), en_ids(root)
    for key, text in zh.items():
        if key not in en:
            continue
        if '.say.' in key:  # in-game 'zh|en' strings: the English is part of the literal, keyed like the old source text
            merged[text + '|' + en[key]] = en[key]
        else:
            merged[text] = en[key]
    return merged


def js_escape(text, quote):
    """Escape text for a JS string literal delimited by `quote`; byte-identical to how the source was written."""
    out = text.replace('\\', '\\\\').replace('\n', '\\n')
    if quote in '\'"`':
        out = out.replace(quote, '\\' + quote)
        if quote == '`':
            out = out.replace('${', '\\${')
    else:
        out = out.replace("'", "\\'").replace('"', '\\"').replace('`', '\\`')
    return out


def expand_ids(source, root=ROOT, js=False):
    """Replace {{t:id}} (Chinese) and {{tb:id}} (中文|English, the in-game bilingual form) in a source file."""
    import re
    zh, en = zh_ids(root), en_ids(root)

    def replace(match):
        kind, key = match.group(1), match.group(2)
        if key not in zh:
            raise ValueError(f'Unknown text id {key}')
        text = zh[key] if kind == 't' else zh[key] + '|' + en[key]
        return js_escape(text, source[match.start() - 1] if match.start() else '') if js else text
    return re.sub(r'\{\{(tb?):([^{}\r\n]+)\}\}', replace, source)
