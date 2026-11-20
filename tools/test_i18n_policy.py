"""Wording policy for visible text: the platform is free, so no text may mention free/fees or paying in.

Checks only text that source files actually display (via test_i18n.source_texts), so stale dictionary
entries cannot fail it; run `python3 tools/i18n_audit.py` to list those.
"""
import json
import re
import unittest

import i18n_data
from test_i18n import ROOT, source_texts

HIDDEN = tuple(g['id'] for g in json.loads((ROOT / 'games/catalog.json').read_text(encoding='utf-8')) if g.get('hidden'))

# Chinese wording that implies a price. 自由跑 / 自由選關 etc. are not about price and do not match.
ZH_BANNED = re.compile(r'免費|免费|入場費|入場點數|扣點(?:開始|再|出發|下竿|發牌|上車)|不免費')
# English wording that implies a price. "free run", "break free", "free army slot" are gameplay words.
EN_BANNED = re.compile(
    r'\bfree(?!\s+(?:run|army|roam))\b(?<!break free)|\bpay(?:ing)?\s+(?:the\s+)?(?:entry|fee)|\bpay\s*(?:&|and|to|another)|\bafter paying|'
    r'new paid round|paid entry|entry fee|entry charge|costs?\s+(?:a\s+)?(?:fixed\s+|flat\s+)?\d+\s*(?:points|pts)|\{fee\}', re.I)
EN_ALLOWED = re.compile(r'overtime pay|Paid impersonation|Free at last', re.I)


def hits(pattern, text):
    return [m.group(0) for m in pattern.finditer(text)]


class WordingPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dictionary = i18n_data.dictionary(ROOT)
        cls.texts = source_texts(skip=HIDDEN)  # hidden games keep legacy text until they are reworked

    def test_visible_chinese_text_has_no_price_wording(self):
        bad = sorted(t for t in self.texts if ZH_BANNED.search(t))
        self.assertEqual(bad, [], 'Remove 免費 / entry-fee wording from visible text (the platform is free)')

    def test_inline_english_has_no_price_wording(self):
        bad = []
        for text in self.texts:
            if '|' in text:
                english = text.split('|', 1)[1]
                if EN_BANNED.search(EN_ALLOWED.sub('', english)):
                    bad.append(text)
        self.assertEqual(sorted(bad), [], 'Inline English text mentions free/fees/paying')

    def test_live_english_translations_have_no_price_wording(self):
        bad = {}
        for key in self.texts:
            value = self.dictionary.get(key)
            if value and EN_BANNED.search(EN_ALLOWED.sub('', value)):
                bad[key] = value
        self.assertEqual(bad, {}, 'English translation of a displayed string mentions free/fees/paying')


if __name__ == '__main__':
    unittest.main()
