"""Checks for the source assembler; no browser or third-party packages required."""
import json
from pathlib import Path
import tempfile
import unittest

import build


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def write(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')

    def test_nested_includes_preserve_bytes_and_order(self):
        self.write('templates/index.html', '前{{include:one.js}}後')
        self.write('one.js', '\nA{{include:two.js}}B\n')
        self.write('two.js', ' C ')
        self.assertEqual(build.render(self.root), '前\nA C B\n後')

    def test_json_escapes_script_end_and_roundtrips(self):
        child = '<script>"珍奶"</script>\n{{include:do-not-expand}}'
        self.write('templates/index.html', '{{json:original.html}}')
        self.write('original.html', child)
        result = build.render(self.root)
        self.assertNotIn('<', result)
        self.assertEqual(json.loads(result), child)

    def test_missing_include_fails(self):
        self.write('templates/index.html', '{{include:missing}}')
        with self.assertRaises(FileNotFoundError):
            build.render(self.root)

    def test_circular_include_fails(self):
        self.write('templates/index.html', '{{include:loop}}')
        self.write('loop', '{{include:templates/index.html}}')
        with self.assertRaisesRegex(ValueError, 'Circular'):
            build.render(self.root)

    def test_include_path_escape_fails(self):
        self.write('templates/index.html', '{{include:../outside}}')
        with self.assertRaisesRegex(ValueError, 'escapes'):
            build.render(self.root)

    def test_json_path_escape_fails(self):
        self.write('templates/index.html', '{{json:../outside}}')
        with self.assertRaisesRegex(ValueError, 'escapes'):
            build.render(self.root)

    def test_current_output_and_catalog_match(self):
        html = build.render()
        build.validate_catalog(html)
        self.assertEqual(html.encode('utf-8'), (build.ROOT / 'index.html').read_bytes())

    def test_missing_view_or_duplicate_card_is_rejected(self):
        html = build.render()
        with self.assertRaises(ValueError):
            build.validate_catalog(html.replace('id="view-reaper"', 'id="view-missing"'))
        with self.assertRaises(ValueError):
            build.validate_catalog(html + '<a class="game-card" href="#reaper">')


if __name__ == '__main__':
    unittest.main()
