#!/usr/bin/env python3
"""Assemble static index.html without changing JavaScript scope or execution order."""
from __future__ import annotations

import argparse
import hashlib
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

    return apply_card_art(bake_lobby(apply_hidden(expand(entry), root)), root)


def bake_lobby(html: str) -> str:
    """Write the final lobby counts and filter chips into the static HTML.

    The runtime computes the same values, but only after the large script runs; baking them in stops the
    lobby from visibly changing a moment after the first paint.
    """
    if '<div class="lobby-grid">' not in html:
        return html
    start = html.index('<div class="lobby-grid">')
    end = html.find('<p class="lobby-footnote">', start)
    if end < 0:  # the redesigned lobby has no footnote; the grid's section ends instead
        end = html.index('</section>', start)
    cards = re.findall(r'<a class="game-card" href="#[a-z0-9-]+"( hidden data-game-hidden)?[^>]*?data-game-category="([a-z]+)"', html[start:end])
    shown = [category for hidden, category in cards if not hidden]
    total = len(shown)
    html, n = re.subn(r'(<span id="lobby-count">)[^<]*(</span>)', lambda m: f'{m.group(1)}{total} 款遊戲{m.group(2)}', html, count=1)
    if n != 1:
        raise ValueError('Lobby count element not found')

    def chip(match):
        key = match.group(1)
        count = total if key == 'all' else shown.count(key)
        return (f'<button type="button" data-lobby-filter="{key}" aria-pressed="{match.group(2)}"{" hidden" if count == 0 else ""}>'
                f'{match.group(3)}<span>{count}</span></button>')
    return re.sub(r'<button type="button" data-lobby-filter="([a-z]+)" aria-pressed="(true|false)">([^<]*)<span>\d+</span></button>', chip, html)


def apply_card_art(html: str, root: Path = ROOT) -> str:
    """Give each lobby card its artwork (see GAME_ICON_SPEC.md).

    games/<id>/cover.webp  -> the whole card is that image (only the BONUS tag stays on top);
    no cover yet            -> the game's original lobby icon fills the card (image only).
    Attributes go after href so the catalog checks still find `class="game-card" href="#id"`.
    """
    def version(path: Path) -> str:
        # content hash, so a replaced image gets a new URL and browsers stop showing the old one
        return hashlib.sha1(path.read_bytes()).hexdigest()[:8]

    def art(match):
        gid = match.group(1)
        cover = root / 'games' / gid / 'cover.webp'
        if cover.is_file():
            return f'{match.group(0)} data-art="cover" style="--cover:url(games/{gid}/cover.webp?v={version(cover)})"'
        # no cover yet: the card shows the game's own lobby icon, image only
        return f'{match.group(0)} data-art="icon"'
    # hidden games are never shown, so they keep their `hidden data-game-hidden` right after href
    html = re.sub(r'<a class="game-card" href="#([a-z0-9-]+)"(?! hidden data-game-hidden)', art, html)

    # Sidebar "popular games" squares use the same art as the cards: the cover, else the card's own icon.
    def quick(match):
        gid = match.group(1)
        cover = root / 'games' / gid / 'cover.webp'
        if cover.is_file():
            inner = f'<img src="games/{gid}/cover.webp?v={version(cover)}" alt="" loading="lazy" decoding="async">'
        else:
            card = re.search(r'<a class="game-card" href="#%s".*?<div class="game-card-icon[^"]*">(.*?)</div>' % re.escape(gid), html, re.S)
            if not card:
                return match.group(0)
            inner = card.group(1)
        opening = match.group(0)[:match.start(3) - match.start(0)]
        return f'{opening}{inner}</a>'
    return re.sub(r'<a class="side-quick-item" href="#([a-z0-9-]+)"([^>]*)>(.*?)</a>', quick, html, flags=re.S)


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
    if set(views) != set(ids) | {'lobby', 'wardrobe', 'member'}:  # platform pages besides the games
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
