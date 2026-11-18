"""The generated banquet translation file must match its single source of truth."""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class BanquetI18nTests(unittest.TestCase):
    def test_generated_file_is_current(self):
        result = subprocess.run([sys.executable, str(ROOT / 'tools/banquet_i18n.py'), '--check'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_generated_file_has_no_cjk_literals(self):
        text = (ROOT / 'games/banquet/i18n.js').read_text(encoding='utf-8')
        self.assertTrue(all(ord(c) < 128 for c in text))


if __name__ == '__main__':
    unittest.main()
