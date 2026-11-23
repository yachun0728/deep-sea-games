"""Ensure the shipped English dictionary covers source UI text, without browser dependencies."""
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import i18n_data  # noqa: E402
HAN = re.compile(r'[\u3400-\u9fff]')
LITERALS = re.compile(r'//[^\n]*|/\*[\s\S]*?\*/|\'(?:\\.|[^\'\\])*\'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`')


class MarkupText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.texts = set()
        self.stack = []

    def add(self, text):
        if HAN.search(text):
            self.texts.add(text.strip())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        skip = (self.stack and self.stack[-1][1]) or tag in ('script', 'style', 'noscript') or 'data-i18n-ignore' in attrs
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append((tag, skip))
        if not skip:
            for name in ('aria-label', 'title', 'placeholder', 'alt'):
                self.add(attrs.get(name, ''))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if not self.stack or not self.stack[-1][1]:
            self.add(data)


def markup_text(source):
    parser = MarkupText()
    parser.feed(source)
    return parser.texts


def js_literals(source):
    """Collect strings and static template parts, recursing into ${...} expressions."""
    found = []

    def scan(index, expression=False):
        depth = 0
        while index < len(source):
            c = source[index]
            if source.startswith('//', index):
                end = source.find('\n', index)
                index = len(source) if end < 0 else end + 1
                continue
            if source.startswith('/*', index):
                end = source.find('*/', index + 2)
                index = len(source) if end < 0 else end + 2
                continue
            if c in "'\"`":
                quote, text, index = c, '', index + 1
                while index < len(source):
                    c = source[index]
                    if c == '\\' and index + 1 < len(source):
                        escaped = source[index + 1]
                        text += {'n': '\n', 't': '\t', 'r': '\r'}.get(escaped, escaped)
                        index += 2
                    elif c == quote:
                        found.append(text)
                        index += 1
                        break
                    elif quote == '`' and source.startswith('${', index):
                        found.append(text)
                        text = ''
                        index = scan(index + 2, True)
                    else:
                        text += c
                        index += 1
                continue
            if expression:
                if c == '{':
                    depth += 1
                elif c == '}':
                    if not depth:
                        return index + 1
                    depth -= 1
            index += 1
        return index

    scan(0)
    return found


# Same-origin pages that carry their own zh/en string tables and mark <body data-i18n-ignore>: the site
# dictionary never translates them (Simplified Chinese still converts them, so the Hans tables keep scanning
# them). Their English is checked against their own tables by a dedicated test instead.
SELF_LOCALIZED = ('games/siege-architect/original.html',)  # tools/test_siege_architect.mjs


def source_texts(skip=(), skip_files=()):
    """Audit static text and literal fragments used by the existing concatenated game UI."""
    found = set()
    for folder in ('templates', 'games', 'js', 'platform'):
        for path in (ROOT / folder).rglob('*'):
            if path.suffix not in ('.html', '.js') or path.name == 'i18n.js':
                continue
            if any(part in skip for part in path.relative_to(ROOT).parts) or path.relative_to(ROOT).as_posix() in skip_files:
                continue
            source = path.read_text(encoding='utf-8')
            if path.suffix == '.html':
                found.update(markup_text(source))
                scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', source)
            else:
                scripts = [source]
            for script in scripts:
                for text in js_literals(script):
                    if not HAN.search(text):
                        continue
                    if '<' in text and '>' in text:
                        found.update(markup_text(text))
                    else:
                        found.add(text.strip())
    english = i18n_data.en_ids(ROOT)
    for key, text in i18n_data.zh_ids(ROOT).items():  # {{t:id}} / {{tb:id}} texts
        if HAN.search(text):
            found.add((text + '|' + english[key] if '.say.' in key and key in english else text).strip())
    return found


class LocalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dictionary = i18n_data.dictionary(ROOT)

    def test_source_text_is_covered(self):
        missing = sorted(source_texts(skip_files=SELF_LOCALIZED) - self.dictionary.keys())
        self.assertEqual(missing, [], 'Add English translations for new source UI text')

    def test_english_values_are_nonempty_and_not_chinese(self):
        for key, value in self.dictionary.items():
            with self.subTest(key=key):
                self.assertTrue(isinstance(value, str) and value.strip())
                self.assertIsNone(HAN.search(value))

    def test_embedded_dictionary_cannot_close_script(self):
        self.assertNotIn('</script', json.dumps(i18n_data.dictionary(ROOT)).lower())

    def test_boba_card_has_no_fee_wording(self):
        source = (ROOT / 'games/boba/card.html').read_text()
        self.assertNotIn('免費', source)
        self.assertNotIn('每局 10 點', source)


if __name__ == '__main__':
    unittest.main()
