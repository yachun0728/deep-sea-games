#!/usr/bin/env python3
"""Assemble static index.html without changing JavaScript scope or execution order."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DIRECTIVE = re.compile(r'\{\{(include|json):([^{}\r\n]+)\}\}')


def render(root: Path = ROOT, entry: str = 'templates/index.html') -> str:
    root = root.resolve()

    def expand(name: str, parents: tuple[Path, ...] = ()) -> str:
        path = (root / name).resolve()
        if not path.is_relative_to(root):
            raise ValueError(f'Include escapes project root: {name}')
        if path in parents:
            raise ValueError(f'Circular include: {name}')
        text = path.read_text(encoding='utf-8')

        def replace(match: re.Match) -> str:
            kind, target = match.groups()
            if kind == 'include':
                return expand(target, parents + (path,))
            source = (root / target).resolve()
            if not source.is_relative_to(root):
                raise ValueError(f'JSON source escapes project root: {target}')
            # Do not expand directives inside the embedded original document.
            # Escape '<' so a child script cannot terminate the JSON script tag.
            return json.dumps(source.read_text(encoding='utf-8'), ensure_ascii=False).replace('<', '\\u003c')

        return DIRECTIVE.sub(replace, text)

    return apply_hidden(expand(entry), root)


def apply_hidden(html: str, root: Path = ROOT) -> str:
    """Mark catalog games flagged "hidden": true so the lobby, picker and router skip them.

    Their view and logic still ship because the shared runtime initializes every game.
    """
    catalog_file = root / 'games/catalog.json'
    if not catalog_file.is_file():
        return html
    for game in json.loads(catalog_file.read_text(encoding='utf-8')):
        flag = game.get('hidden', False)
        if not isinstance(flag, bool):
            raise ValueError(f"hidden must be true or false: {game['id']}")
        if not flag:
            continue
        gid = game['id']
        for old, new in ((f'class="game-card" href="#{gid}"', f'class="game-card" href="#{gid}" hidden data-game-hidden'),
                         (f'id="tab-{gid}"', f'id="tab-{gid}" hidden')):
            if html.count(old) != 1:
                raise ValueError(f'Expected one {old} to hide {gid}')
            html = html.replace(old, new)
    return html


def validate_catalog(html: str, root: Path = ROOT) -> None:
    catalog = json.loads((root / 'games/catalog.json').read_text(encoding='utf-8'))
    ids = [game['id'] for game in catalog]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate game ID in catalog')
    manifests = ''.join((root / name).read_text(encoding='utf-8') for name in ('templates/index.html', 'templates/lobby.html', 'js/runtime.js'))
    for game in catalog:
        gid = game['id']
        if not re.fullmatch(r'[a-z][a-z0-9-]*', gid):
            raise ValueError(f'Invalid game ID: {gid}')
        for key in ('logic', 'view', 'card', 'icon'):
            path = (root / game[key]).resolve()
            if not path.is_relative_to(root.resolve()) or not path.is_file():
                raise ValueError(f'Missing or invalid {key}: {gid}')
            if manifests.count('{{include:' + game[key] + '}}') != 1:
                raise ValueError(f'Expected one source include for {key}: {gid}')
        for marker in (f'id="view-{gid}"', f'id="icon-{gid}"', f'id="tab-{gid}"', f'class="game-card" href="#{gid}"'):
            if html.count(marker) != 1:
                raise ValueError(f'Expected one {marker}')
    views = re.findall(r'id="view-([a-z0-9-]+)"', html)
    if set(views) != set(ids) | {'lobby'}:
        raise ValueError('Catalog and rendered views differ')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if index.html is stale; do not write')
    args = parser.parse_args()
    try:
        html = render()
        validate_catalog(html)
        output = ROOT / 'index.html'
        content = html.encode('utf-8')
        if args.check:
            if not output.exists() or output.read_bytes() != content:
                print('index.html is stale. Run: python3 tools/build.py', file=sys.stderr)
                return 1
            print('OK: index.html matches source; game catalog is valid.')
        else:
            if not output.exists() or output.read_bytes() != content:
                output.write_bytes(content)
            print('Built index.html; game catalog is valid.')
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'Build failed: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
