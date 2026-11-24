import html
import json
import re
import sqlite3
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class GameNamesMigrationTests(unittest.TestCase):
    def setUp(self):
        db = sqlite3.connect(':memory:')
        self.addCleanup(db.close)
        for migration in sorted((ROOT / 'backend/migrations').glob('*_game_names*.sql')):
            db.executescript(migration.read_text())
        self.rows = {r[0]: r[1:] for r in db.execute('SELECT * FROM game_names')}

    def test_every_catalog_game_has_all_names_matching_cards(self):
        catalog = json.loads((ROOT / 'games/catalog.json').read_text())
        # A game may also own extra leaderboard boards named '<catalog id>-<board>' (e.g. per-difficulty boards).
        ids = {g['id'] for g in catalog}
        extra = {r for r in self.rows if r not in ids and any(r.startswith(i + '-') for i in ids)}
        self.assertEqual(ids, set(self.rows) - extra)
        for g in catalog:
            card = (ROOT / g['card']).read_text()
            zh = html.unescape(re.search(r'<h3>(.*?)</h3>', card).group(1))
            en = html.unescape(re.search(r'game-card-en">(.*?)<', card).group(1))
            name, name_en, zh_cn = self.rows[g['id']]
            self.assertEqual((name, name_en), (zh, en), g['id'])
            self.assertTrue(zh_cn.strip(), g['id'])


if __name__ == '__main__':
    unittest.main()
