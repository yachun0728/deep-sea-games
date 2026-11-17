"""Freshness checks for the generated per-game README files; no browser or third-party packages required."""
import json
import unittest

import game_docs


class GameDocsTests(unittest.TestCase):
    def test_every_catalog_game_has_a_fresh_readme(self):
        files = game_docs.render_all()
        catalog = json.loads((game_docs.ROOT / 'games/catalog.json').read_text(encoding='utf-8'))
        for game in catalog:
            path = game_docs.ROOT / 'games' / game['id'] / 'README.md'
            self.assertIn(path, files)
            self.assertTrue(path.exists(), f"{path.relative_to(game_docs.ROOT)} is missing. Run: python3 tools/game_docs.py")
        for path, expected in files.items():
            self.assertTrue(path.exists(), f"{path.relative_to(game_docs.ROOT)} is missing. Run: python3 tools/game_docs.py")
            self.assertEqual(path.read_text(encoding='utf-8'), expected,
                             f"{path.relative_to(game_docs.ROOT)} is stale. Run: python3 tools/game_docs.py")

    def test_generated_docs_name_the_wallet_and_function_sections(self):
        text = game_docs.render_all()[game_docs.ROOT / 'games/cat/README.md']
        for heading in ('## 函式索引', '## 錢包與結算接點', '## 追蹤（GA4）', '## 規則摘要'):
            self.assertIn(heading, text)


if __name__ == '__main__':
    unittest.main()
