"""Text ids: {{t:id}} in templates must resolve, and zh-Hant.json / en.ids.json must stay in step."""
import json
import re
import unittest

import i18n_data
from test_i18n import ROOT

USED = re.compile(r'\{\{tb?:([^{}\r\n]+)\}\}')


def used_ids():
    found = {}
    for folder in ('templates', 'games', 'js', 'platform'):
        for path in (ROOT / folder).rglob('*'):
            if path.is_file() and path.suffix in ('.html', '.js', '.css'):
                for key in USED.findall(path.read_text(encoding='utf-8')):
                    found.setdefault(key, path.relative_to(ROOT).as_posix())
    return found


class TextIdTests(unittest.TestCase):
    def test_every_used_id_has_chinese_and_english(self):
        zh, en = i18n_data.zh_ids(ROOT), i18n_data.en_ids(ROOT)
        used = used_ids()
        self.assertEqual({k: v for k, v in used.items() if k not in zh}, {}, 'id missing from locales/zh-Hant.json')
        self.assertEqual({k: v for k, v in used.items() if k not in en}, {}, 'id missing from locales/en.ids.json')

    def test_no_orphan_ids(self):
        zh, en = i18n_data.zh_ids(ROOT), i18n_data.en_ids(ROOT)
        used = used_ids()
        self.assertEqual(sorted(set(zh) - set(used)), [], 'zh-Hant.json id is never used; delete it')
        self.assertEqual(sorted(set(en) - set(zh)), [], 'en.ids.json id has no Chinese text')

    def test_values_are_clean(self):
        for key, text in i18n_data.zh_ids(ROOT).items():
            with self.subTest(key=key):
                self.assertTrue(re.search(r'[㐀-鿿]', text))
                self.assertNotIn('"', text, 'quotes break attributes; use 「」')
                self.assertNotIn('{{', text)
        for key, text in i18n_data.en_ids(ROOT).items():
            with self.subTest(key=key):
                self.assertFalse(re.search(r'[㐀-鿿]', text))

    def test_same_chinese_text_has_one_english(self):
        zh, en = i18n_data.zh_ids(ROOT), i18n_data.en_ids(ROOT)
        legacy = json.loads((ROOT / 'locales/en.json').read_text(encoding='utf-8'))
        seen = {}
        for key, text in zh.items():
            if key in en and '.say.' not in key:
                self.assertEqual(seen.setdefault(text, en[key]), en[key], f'{key}: same Chinese, different English')
                if text in legacy:
                    self.assertEqual(legacy[text], en[key], f'{key}: conflicts with locales/en.json')


if __name__ == '__main__':
    unittest.main()
