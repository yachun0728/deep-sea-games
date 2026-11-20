"""Simplified Chinese tables (locales/zh-Hans.json) must exist, be consistent and leave no Traditional-only characters."""
import json
import re
import unittest

from test_i18n import ROOT, source_texts
import i18n_data

HAN = re.compile(r'[㐀-鿿]')


def simplified(text, data):
    """Python twin of js/i18n.js simplified()."""
    trimmed = text.strip()
    if trimmed in data['exact']:
        return text[:text.index(trimmed)] + data['exact'][trimmed] + text[text.index(trimmed) + len(trimmed):]
    mapping = dict(zip(*data['chars']))
    for word in sorted(data['words'], key=len, reverse=True):
        text = text.replace(word, data['words'][word])
    return ''.join(mapping.get(c, c) for c in text)


class SimplifiedChineseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'locales/zh-Hans.json').read_text(encoding='utf-8'))

    def test_tables_are_well_formed(self):
        traditional, simple = self.data['chars']
        self.assertEqual(len(traditional), len(simple))
        self.assertEqual(len(set(traditional)), len(traditional), 'duplicate character in chars table')
        self.assertTrue(all(HAN.fullmatch(c) for c in traditional + simple))

    def test_known_conversions(self):
        for source, expected in (('遊戲大廳', '游戏大厅'), ('軟體', '软件'), ('點數', '点数'), ('發現後面', '发现后面'), ('排行榜', '排行榜')):
            with self.subTest(source=source):
                self.assertEqual(simplified(source, self.data), expected)

    def test_every_visible_text_is_fully_simplified(self):
        """After conversion no source text may still contain a character the table could convert."""
        traditional = set(self.data['chars'][0])
        left = {}
        texts = set(source_texts()) | set(i18n_data.dictionary(ROOT))
        for text in texts:
            if HAN.search(text):
                out = simplified(text, self.data)
                bad = traditional & set(out)
                if bad:
                    left[text[:40]] = ''.join(sorted(bad))
        self.assertEqual(left, {}, 'Traditional characters survive conversion; run tools/build_zh_hans.py')

    def test_tables_are_current(self):
        import build_zh_hans  # needs OpenCC; skipped where it is not installed
        try:
            import opencc  # noqa: F401
        except ImportError:
            self.skipTest('OpenCC not installed')
        self.assertEqual(json.dumps(build_zh_hans.generate(), ensure_ascii=False, indent=1, separators=(',', ': ')) + '\n',
                         (ROOT / 'locales/zh-Hans.json').read_text(encoding='utf-8'),
                         'Run: python3 tools/build_zh_hans.py')

    def test_overrides_are_well_formed(self):
        path = ROOT / 'locales/zh-Hans.overrides.json'
        if path.is_file():
            data = json.loads(path.read_text(encoding='utf-8'))
            self.assertLessEqual(set(data), {'exact', 'words', 'remove'})
            for table in ('exact', 'words'):
                for source, simple in data.get(table, {}).items():
                    self.assertTrue(HAN.search(source) and HAN.search(simple), source)
            self.assertTrue(all(HAN.search(word) for word in data.get('remove', [])))

if __name__ == '__main__':
    unittest.main()
