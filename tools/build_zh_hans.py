#!/usr/bin/env python3
"""Generate locales/zh-Hans.json (Simplified Chinese tables) from the Traditional source text with OpenCC.

Dev-time only: `pip3 install --user opencc`. The generated file is committed, so the build and the site need no OpenCC.
  chars  [traditional, simplified]  aligned strings, per-character mapping for any Han text (also dynamic text)
  words  {phrase: simplified}       word-level differences (軟體 -> 软件); applied before chars
  exact  {text: simplified}         human fixes for whole strings only
Human fixes: edit locales/zh-Hans.overrides.json: exact {繁體整句: 简体整句}, words {詞: 词}, remove [OpenCC words to reject].
Usage: python3 tools/build_zh_hans.py [--check]
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import i18n_data  # noqa: E402
from test_i18n import ROOT, source_texts  # noqa: E402

HAN = re.compile(r'[㐀-鿿]')
OUT = ROOT / 'locales/zh-Hans.json'
OVERRIDES = ROOT / 'locales/zh-Hans.overrides.json'


def corpus():
    texts = set(i18n_data.dictionary(ROOT)) | set(i18n_data.zh_ids(ROOT).values()) | source_texts()
    chars = set()
    for folder in ('templates', 'games', 'js', 'platform'):
        for path in (ROOT / folder).rglob('*'):
            if path.suffix in ('.html', '.js', '.css') and path.name != 'i18n.js':
                chars.update(HAN.findall(path.read_text(encoding='utf-8')))
    for text in texts:
        chars.update(HAN.findall(text))
    for text in i18n_data.zh_ids(ROOT).values():
        chars.update(HAN.findall(text))
    return sorted(t.strip() for t in texts if HAN.search(t)), sorted(chars)


def generate():
    import opencc
    char_convert = opencc.OpenCC('t2s').convert  # characters only
    convert = opencc.OpenCC('tw2sp').convert  # Taiwan usage -> mainland usage (軟體 -> 软件, 程式 -> 程序)
    texts, chars = corpus()
    pairs = [(c, char_convert(c)) for c in chars]
    pairs = [(t, s) for t, s in pairs if t != s and len(s) == 1 and ord(s) <= 0xFFFF]  # JS indexes UTF-16, so BMP only
    charmap = dict(pairs)
    overrides = json.loads(OVERRIDES.read_text(encoding='utf-8')) if OVERRIDES.is_file() else {}
    remove = set(overrides.get('remove', []))  # OpenCC word results we reject (e.g. 核心 -> 内核 is wrong for a game core)

    def runtime(text, words):  # Python twin of js/i18n.js simplified() without the exact table
        for word in sorted(words, key=len, reverse=True):
            text = text.replace(word, words[word])
        return ''.join(charmap.get(c, c) for c in text)

    # Word exceptions: Han n-grams (2-3 chars) that OpenCC converts differently from the character table.
    runs = {run for text in texts for run in re.findall(r'[\u3400-\u9fff]+', text)}
    grams = {run[i:i + n] for run in runs for n in (2, 3) for i in range(len(run) - n + 1)}
    words = {}
    for n in (2, 3):
        for gram in sorted(g for g in grams if len(g) == n and not any(r in g for r in remove)):
            simple = convert(gram)
            if simple != runtime(gram, words) and len(simple) == len(gram):
                words[gram] = simple
    words.update({k: v for k, v in overrides.get('words', {}).items()})
    # Whole-string results are deliberately not taken from OpenCC: its longer phrases include choices we reject.
    exact = {}
    exact.update({k.strip(): v for k, v in overrides.get('exact', {}).items()})
    data = {'chars': [''.join(charmap), ''.join(charmap.values())], 'words': dict(sorted(words.items())), 'exact': dict(sorted(exact.items()))}
    return data


def main():
    data = generate()
    text = json.dumps(data, ensure_ascii=False, indent=1, separators=(',', ': ')) + '\n'
    if '--check' in sys.argv:
        if not OUT.is_file() or OUT.read_text(encoding='utf-8') != text:
            sys.exit('locales/zh-Hans.json is stale. Run: python3 tools/build_zh_hans.py')
        print('OK: locales/zh-Hans.json is up to date')
        return
    OUT.write_text(text, encoding='utf-8')
    print(f"{len(data['chars'][0])} chars, {len(data['words'])} words, {len(data['exact'])} exact -> {OUT.relative_to(ROOT)} ({len(text)//1024} KB)")


if __name__ == '__main__':
    main()
