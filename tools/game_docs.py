#!/usr/bin/env python3
"""Generate a compact, source-derived map for every game: games/<id>/README.md and games/README.md.

The point is to let an agent (or a person) find the right place in a game without reading the whole
game.js: files, view ids, state objects, a function index with line numbers, every wallet and analytics
touch point, storage keys and the matching section of GAME_RULES.md.

  python3 tools/game_docs.py          write the files
  python3 tools/game_docs.py --check  fail if any of them is stale or missing

Everything is derived from the sources, so the output is deterministic. Do not edit the generated files by
hand; change the game (or GAME_RULES.md) and run this tool again.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

# Shared-scope names a game may rely on; listed when the game's source mentions them.
SHARED = ['S', 'AN', 'renderAll', 'save', 'fmt', 'fx', 'ENTRY_FEE', 'LOW_MSG', 'MIN_BET', 'START_BALANCE',
          'reduceMotion', 'C', 'rollCrash', 'syncBalance', 'elGo']
FUNC = re.compile(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(')
ARROW = re.compile(r'(?:^|[;{}\n])\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>')
STATE = re.compile(r'\b(?:var|let|const)\s+([A-Z][A-Z0-9]{0,2})\s*=\s*\{')
BUSY = re.compile(r'\b(?:var|let|const)\s+(\w*Busy)\b')
CONST_DECL = re.compile(r'\b(?:var|let|const)\s+([A-Z][A-Z0-9_]{2,})\b')
CONST_MORE = re.compile(r',\s*([A-Z][A-Z0-9_]{2,})\s*=')
SPEND = re.compile(r'S\.balance\s*-=|S\.balance\s*=\s*S\.balance\s*-')
GAIN = re.compile(r'S\.balance\s*\+=|S\.balance\s*=\s*S\.balance\s*\+')
CHECK = re.compile(r'S\.balance\s*[<>]=?|[<>]=?\s*S\.balance')
ANALYTICS = re.compile(r'AN\.(start|progress|resume|end)\(')
STORAGE = re.compile(r"localStorage\.(get|set)Item\(\s*'([^']+)'")


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def line_of(text: str, pos: int) -> int:
    return text.count('\n', 0, pos) + 1


def snippet(text: str, pos: int, width: int = 110) -> str:
    """The statement around pos: from the previous ; { } or newline to the next ; or newline."""
    start = max(text.rfind(c, 0, pos) for c in ';{}\n') + 1
    ends = [i for i in (text.find(';', pos), text.find('\n', pos)) if i >= 0]
    end = (min(ends) + 1) if ends else len(text)
    chunk = re.sub(r'\s+', ' ', text[start:end]).strip()
    return chunk if len(chunk) <= width else chunk[:width - 1] + '…'


def load_catalog(root: Path) -> list[dict]:
    return json.loads(read(root / 'games/catalog.json'))


def view_names(root: Path) -> dict[str, tuple[str, str]]:
    block = re.search(r'var VIEWS = \{(.*?)\};', read(root / 'js/navigation.js'), re.S)
    names = {}
    for key, zh, en in re.findall(r"""(['"]?[\w-]+['"]?):\s*'([^<']+?)\s*<span>([^<]+)</span>'""", block.group(1) if block else ''):
        names[key.strip('\'"')] = (zh.strip(), en.strip())
    return names


def rules_sections(root: Path) -> dict[str, tuple[str, str]]:
    """game id -> (heading, body) from GAME_RULES.md."""
    text = read(root / 'GAME_RULES.md')
    sections = {}
    parts = re.split(r'(?m)^## ', text)
    for part in parts[1:]:
        heading, _, body = part.partition('\n')
        match = re.search(r'（([a-z][a-z0-9-]*)）\s*$', heading)
        if match:
            sections[match.group(1)] = (heading.strip(), body.strip())
    return sections


def functions(source: str) -> list[tuple[int, str]]:
    found = {}
    for regex in (FUNC, ARROW):
        for match in regex.finditer(source):
            found.setdefault(match.start(1), (line_of(source, match.start(1)), match.group(1)))
    return sorted(found.values())


def enclosing(funcs: list[tuple[int, str]], line: int) -> str:
    name = '（模組頂層）'
    for number, func in funcs:
        if number <= line:
            name = func
        else:
            break
    return name


def touch_lines(source: str, funcs: list[tuple[int, str]], regex: re.Pattern, label=None) -> list[str]:
    rows = []
    for match in regex.finditer(source):
        line = line_of(source, match.start())
        text = snippet(source, match.start())
        rows.append(f'- L{line} `{enclosing(funcs, line)}`：`{text}`')
    return rows


def analytics_rows(source: str, funcs: list[tuple[int, str]]) -> list[str]:
    rows = []
    for match in ANALYTICS.finditer(source):
        line = line_of(source, match.start())
        rows.append(f'- L{line} `{enclosing(funcs, line)}`：`{snippet(source, match.start())}`')
    return rows


def platform_callers(root: Path, funcs: list[tuple[int, str]], gid: str) -> list[str]:
    rows = []
    # Names that another file also defines (inner helpers such as `say`) cannot be told apart by text, so skip them.
    elsewhere = set()
    for other in sorted((root / 'games').glob('*/game.js')):
        if other.parent.name != gid:
            elsewhere.update(FUNC.findall(read(other)))
    names = sorted({name for _, name in funcs if len(name) >= 3 and name not in elsewhere})
    for path in sorted((root / 'js').glob('*.js')):
        text = read(path)
        own = set(FUNC.findall(text))
        used = [name for name in names if name not in own and re.search(r'(?<![\w$.])' + re.escape(name) + r'\s*\(', text)]
        if used:
            rows.append(f'- `js/{path.name}` 會呼叫：' + '、'.join(f'`{name}`' for name in used))
    return rows


def analyze(root: Path, game: dict, names: dict, rules: dict, controls: str, game_names: dict) -> dict:
    gid = game['id']
    base = root / 'games' / gid
    logic = read(root / game['logic'])
    view = read(root / game['view'])
    card = read(root / game['card'])
    funcs = functions(logic)
    category = re.search(r'data-game-category="(\w+)"', card)
    description = re.search(r'class="game-card-description">([^<]*)<', card)
    footer = re.search(r'class="game-card-footer">(.*?)</div>', card, re.S)
    spans = re.findall(r'<span>([^<]*)</span>', footer.group(1)) if footer else []
    states = [(line_of(logic, m.start(1)), m.group(1)) for m in STATE.finditer(logic)]
    busy = [(line_of(logic, m.start(1)), m.group(1)) for m in BUSY.finditer(logic)]
    consts = []
    for line_no, line in enumerate(logic.split('\n'), 1):
        if re.match(r'\s*(?:var|let|const)\b', line):
            found = [m.group(1) for m in CONST_DECL.finditer(line)] + [m.group(1) for m in CONST_MORE.finditer(line)]
            if found:
                consts.append((line_no, sorted(set(found), key=found.index)))
    storage = sorted({(m.group(2), m.group(1)) for m in STORAGE.finditer(logic)})
    guard_names = [name for _, name in states + busy]
    covered = [name for name in guard_names if re.search(r'\b' + re.escape(name) + r'\b', controls)]
    return {
        'game': game, 'logic': logic, 'view': view, 'funcs': funcs, 'states': states, 'busy': busy, 'consts': consts,
        'storage': storage, 'category': category.group(1) if category else '?',
        'description': description.group(1) if description else '', 'footer': spans,
        'zh': names.get(gid, ('?', '?')), 'ids': list(dict.fromkeys(re.findall(r'\bid="([^"]+)"', view))),
        'files': sorted(p.name for p in base.iterdir() if p.is_file() and p.name != 'README.md'),
        'rules': rules.get(gid), 'covered': covered, 'guard_names': guard_names,
        'analytics_name': game_names.get(gid), 'root': root,
    }


def code_list(items) -> str:
    return '、'.join(f'`{item}`' for item in items)


def render_game(info: dict) -> str:
    game, gid = info['game'], info['game']['id']
    logic, root = info['logic'], info['root']
    funcs = info['funcs']
    zh, en = info['zh']
    status = '已隱藏（catalog 的 `hidden`；大廳、選單與網址都進不去，程式碼仍會組合與初始化）' if game.get('hidden') else '顯示中'
    category = {'skill': '技巧闖關', 'run': '跑酷動作', 'stealth': '潛行偷閒', 'timing': '時機操作', 'puzzle': '益智策略', 'chance': '機率挑戰', 'retro': '免費懷舊', 'daily': '每日免費補給'}.get(info['category'], info['category'])
    lines = [f'# {zh} {en}（{gid}）', '',
             '> 這份檔案由 `python3 tools/game_docs.py` 從原始碼自動產生，請勿手改；修改遊戲後重新執行。'
             '先讀這份找到位置，再只打開需要的函式範圍，不必掃整支 `game.js`。', '',
             '## 概覽', '',
             f'- 網址：`#{gid}`　分類：{category}　狀態：{status}',
             f'- 大廳卡片：「{info["description"]}」｜{" · ".join(info["footer"])}',
             f'- 追蹤名稱（GA4 `game_name`）：{info["analytics_name"] or "未登記"}，`game_id` 為 `{gid}`',
             '- 檔案：' + '、'.join(f'`games/{gid}/{name}`' for name in info['files'])
             + f'；`game.js` 共 {logic.count(chr(10)) + 1} 行、{len(logic.encode("utf-8")) / 1024:.1f} KB', '']
    if info['rules']:
        lines += [f'- 完整規則與公式：[GAME_RULES.md](../../GAME_RULES.md) 的「{info["rules"][0]}」（下方「規則摘要」已複製）', '']
    lines += ['## 畫面元素（view.html 的 id）', '', code_list(info['ids']) or '（無）', '',
              '## 狀態與常數', '']
    states = [f'`{name}`（L{line}）' for line, name in info['states']] + [f'`{name}`（L{line}）' for line, name in info['busy']]
    lines.append('- 狀態物件／進行中旗標：' + ('、'.join(states) if states else '（game.js 內沒有偵測到；可能定義在共用檔，見 ARCHITECTURE.md）'))
    for line, names_ in info['consts'][:14]:
        lines.append(f'- L{line} 常數：{code_list(names_)}')
    if len(info['consts']) > 14:
        lines.append(f'- …另有 {len(info["consts"]) - 14} 行常數宣告，請直接搜尋大寫名稱')
    lines += ['', '## 函式索引（game.js，行號為宣告位置）', '']
    lines.append('、'.join(f'`{name}` L{line}' for line, name in funcs) or '（沒有偵測到具名函式）')
    lines += ['', '## 錢包與結算接點', '']
    for title, regex in (('扣款（開始一局）', SPEND), ('入帳（領回／獎勵）', GAIN), ('餘額檢查', CHECK)):
        rows = touch_lines(logic, funcs, regex)
        lines.append(f'**{title}**')
        lines += rows or ['- （game.js 內沒有直接操作；可能透過共用函式或其他檔案）']
        lines.append('')
    fee = len(re.findall(r'\bENTRY_FEE\b', logic))
    low = len(re.findall(r'\bLOW_MSG\b', logic))
    lines += [f'- 入場費常數 `ENTRY_FEE` 在本檔出現 {fee} 次、餘額不足訊息 `LOW_MSG` {low} 次（定義在 `js/config.js`）。',
              '- 規範：每局只扣一次、只結算一次，重新整理與重複點擊不可重複扣款或入帳。', '',
              '## 追蹤（GA4）', '']
    lines += analytics_rows(logic, funcs) or ['- （沒有偵測到 `AN.*` 呼叫）']
    lines += ['', '- 契約見 [ANALYTICS.md](../../ANALYTICS.md)：每局一次 start、結束只送一次 end，不可傳個資。', '',
              '## 儲存（localStorage）', '']
    modes = {}
    for key, mode in info['storage']:
        modes.setdefault(key, []).append('讀' if mode == 'get' else '寫')
    lines += [f'- `{key}`（{"、".join(sorted(m))}）' for key, m in modes.items()] or ['- （沒有使用）']
    lines += ['', '## 平台共用相依', '']
    used = [name for name in SHARED if re.search(r'(?<![\w$.])' + re.escape(name) + r'(?![\w$])', logic)]
    lines.append('- 直接使用的共用名稱：' + (code_list(used) if used else '（無）') + '（共用作用域，定義見 `js/platform.js`、`games/crash/game.js`）')
    lines += platform_callers(root, funcs, gid) or ['- 共用檔沒有直接呼叫本遊戲的函式。']
    if info['guard_names']:
        status_text = '已涵蓋：' + code_list(info['covered']) if info['covered'] else '**未涵蓋**：進行中按「重設」仍可能生效'
    else:
        status_text = '無法判斷（沒有偵測到狀態名稱）'
    lines += [f'- 「重設為 500 點」進行中防護（`js/controls.js`）：{status_text}', '']
    if info['rules']:
        lines += ['## 規則摘要（取自 GAME_RULES.md）', '', info['rules'][1], '']
    lines += ['## 修改檢查清單', '',
              '- 先確認需求只涉及這一款；不要順手改其他遊戲、倍率或儲存鍵（見 AGENTS.md）。',
              '- 改 `games/%s/` 或共用來源後執行 `python3 tools/build.py`，再執行 `--check`、單元測試與 `git diff --check`；`index.html` 是產出，不要直接改。' % gid,
              '- 改了函式、扣款、追蹤或規則：重新執行 `python3 tools/game_docs.py`，並同步 GAME_RULES.md。',
              '- 在瀏覽器確認：開局只扣一次、結算只一次、切換遊戲／背景會暫停、手機寬度可玩。', '']
    return '\n'.join(lines).rstrip('\n') + '\n'


def render_index(infos: list[dict]) -> str:
    lines = ['# 遊戲說明索引', '',
             '> 由 `python3 tools/game_docs.py` 自動產生，請勿手改。要改某一款，先讀該款的 `README.md`（檔案、函式索引、扣款與追蹤位置、規則摘要），不必掃整支 `game.js`。', '',
             '| 遊戲 | hash | 分類 | 狀態 | game.js | 說明 |', '| --- | --- | --- | --- | --- | --- |']
    for info in infos:
        gid, (zh, en) = info['game']['id'], info['zh']
        category = {'skill': '技巧闖關', 'run': '跑酷動作', 'stealth': '潛行偷閒', 'timing': '時機操作', 'puzzle': '益智策略', 'chance': '機率挑戰', 'retro': '免費懷舊', 'daily': '每日免費補給'}.get(info['category'], info['category'])
        state = '隱藏' if info['game'].get('hidden') else '顯示'
        lines.append(f'| [{zh} {en}]({gid}/README.md) | `#{gid}` | {category} | {state} | {info["logic"].count(chr(10)) + 1} 行 | {info["description"]} |')
    return '\n'.join(lines) + '\n'


def render_all(root: Path = ROOT) -> dict[Path, str]:
    names, rules = view_names(root), rules_sections(root)
    controls = read(root / 'js/controls.js')
    analytics_names = {k.strip('\'"'): v for k, v in re.findall(r"""(['"]?[\w-]+['"]?):'([^']+)'""", (re.search(r'var names=\{(.*?)\};', read(root / 'js/analytics.js'), re.S) or [None, ''])[1])}
    catalog = load_catalog(root)
    infos = [analyze(root, game, names, rules, controls, analytics_names) for game in catalog]
    out = {root / 'games' / info['game']['id'] / 'README.md': render_game(info) for info in infos}
    out[root / 'games/README.md'] = render_index(infos)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='Fail if a generated file is stale or missing; do not write')
    args = parser.parse_args()
    try:
        files = render_all()
    except (OSError, ValueError, KeyError) as exc:
        print(f'game_docs failed: {exc}', file=sys.stderr)
        return 1
    stale = [path for path, text in files.items() if not path.exists() or read(path) != text]
    if args.check:
        if stale:
            print('Stale or missing (run: python3 tools/game_docs.py):\n  ' + '\n  '.join(str(p.relative_to(ROOT)) for p in stale), file=sys.stderr)
            return 1
        print(f'OK: {len(files)} generated game docs are up to date.')
        return 0
    for path in stale:
        path.write_text(files[path], encoding='utf-8')
    print(f'Wrote {len(stale)} file(s); {len(files) - len(stale)} already up to date.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
