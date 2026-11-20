"""Prototype workflow: skeletons stay out of the lobby and out of search engines."""
import json
from pathlib import Path
import tempfile
import unittest

import prototype


class PrototypeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'games').mkdir()
        (self.root / 'templates').mkdir()
        (self.root / 'games/catalog.json').write_text('[{"id":"mines"}]', encoding='utf-8')
        (self.root / 'templates/lobby.html').write_text('<a href="#mines">', encoding='utf-8')

    def test_new_scaffold_is_noindex_and_checked(self):
        prototype.new('deep-dash', '深海衝刺', '一鍵衝刺', self.root)
        page = (self.root / 'preview/deep-dash/index.html').read_text(encoding='utf-8')
        self.assertIn('noindex', page)
        self.assertNotIn('localStorage', page.replace('不存 localStorage', ''))
        self.assertEqual(prototype.check(self.root), [])

    def test_catalog_id_cannot_be_prototype(self):
        with self.assertRaises(SystemExit):
            prototype.new('mines', '地雷', '', self.root)

    def test_leak_into_lobby_is_reported(self):
        prototype.new('deep-dash', '深海衝刺', '', self.root)
        (self.root / 'templates/lobby.html').write_text('<a href="#deep-dash">', encoding='utf-8')
        self.assertTrue(any('大廳' in e for e in prototype.check(self.root)))

    def test_stale_index_is_reported(self):
        prototype.new('deep-dash', '深海衝刺', '', self.root)
        (self.root / 'preview/index.html').write_text('old', encoding='utf-8')
        self.assertTrue(any('過期' in e for e in prototype.check(self.root)))

    def test_graduated_may_be_in_catalog(self):
        prototype.new('deep-dash', '深海衝刺', '', self.root)
        items = json.loads((self.root / 'preview/prototypes.json').read_text(encoding='utf-8'))
        items[0]['status'] = 'graduated'
        (self.root / 'preview/prototypes.json').write_text(json.dumps(items), encoding='utf-8')
        (self.root / 'games/catalog.json').write_text('[{"id":"mines"},{"id":"deep-dash"}]', encoding='utf-8')
        prototype.write_index(self.root)
        self.assertEqual(prototype.check(self.root), [])


if __name__ == '__main__':
    unittest.main()
