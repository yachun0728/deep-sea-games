#!/usr/bin/env python3
"""Generate the Simplified Chinese article of privacy.html and terms.html from the Traditional one.

Edit only the zh-Hant and en articles; this rewrites the block between <!-- zh-Hans:start --> and
<!-- zh-Hans:end --> with OpenCC (tw2sp). Dev-time only, like build_zh_hans.py: `pip3 install --user opencc`.
Usage: python3 tools/build_legal.py [--check]
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('privacy.html', 'terms.html')
HANT = re.compile(r'<!-- zh-Hant:start -->\n(.*?)<!-- zh-Hant:end -->\n', re.S)
HANS = re.compile(r'(<!-- zh-Hans:start -->\n).*?(<!-- zh-Hans:end -->)', re.S)


def render(text: str, convert) -> str:
    source = HANT.search(text)
    if not source or not HANS.search(text):
        raise ValueError('missing zh-Hant or zh-Hans markers')
    article = source.group(1).replace('<article lang="zh-Hant">', '<article lang="zh-Hans" hidden>', 1)
    article = convert(article)
    return HANS.sub(lambda m: m.group(1) + article + m.group(2), text, count=1)


def main(check: bool) -> int:
    import opencc
    converter = opencc.OpenCC('tw2sp')
    stale = []
    for name in PAGES:
        path = ROOT / name
        text = path.read_text(encoding='utf-8')
        out = render(text, converter.convert)
        if out != text:
            stale.append(name)
            if not check:
                path.write_text(out, encoding='utf-8')
    if check and stale:
        print('Stale zh-Hans article: ' + ', '.join(stale) + ' (run python3 tools/build_legal.py)')
        return 1
    print('OK: legal pages ' + ('are up to date' if check else 'written'))
    return 0


if __name__ == '__main__':
    sys.exit(main('--check' in sys.argv[1:]))
