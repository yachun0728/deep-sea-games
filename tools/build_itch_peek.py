#!/usr/bin/env python3
"""Build a standalone HTML5 package of 別看 / Don't Peek for itch.io.

Output: dist/itch-peek/ (index.html + assets/) and dist/dont-peek-html5.zip.
The game runs without the arcade platform: no wallet, no points, no analytics.
"""
import json, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'dist', 'itch-peek')


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


game = read('games/peek/game.js')
view = read('games/peek/view.html')
dic = json.loads(read('locales/en.json'))

# ---- game source: strip platform rewards, point to local assets ----
game = game.replace("games/peek/assets/", "assets/")
m = re.search(r"function pay\(n,text\)\{.*?點已入帳。','win'\)\}\n", game, re.S)
assert m, 'pay() not found'
game = game.replace(m.group(0), "function pay(n,text){say(text+'。','win')}\n")

# ---- rules text: drop everything about points ----
view = view.replace('<section class="view" id="view-peek" hidden>', '<section class="view" id="view-peek">')
paras = re.findall(r'<p>(.*?)</p>', re.search(r'<details class="rules">.*?</details>', view, re.S).group(0), re.S)
extra = {}


def edit(zh, subs_zh, subs_en):
    new_zh = zh
    for a, b in subs_zh:
        assert a in new_zh, a
        new_zh = new_zh.replace(a, b)
    en = dic[zh]
    for a, b in subs_en:
        assert a in en, a
        en = en.replace(a, b)
    extra[new_zh] = en
    return new_zh


for p in paras:
    if '固定獎勵' in p:
        view = view.replace('<p>' + p + '</p>', '')
    elif '不發點' in p:
        nz = edit(p, [('，不扣命、不存檔、不發點，純比成績', '，不扣命、不存檔，純比成績'), ('，練習不扣生命也不發點', '，練習不扣生命'), ('才開門', '才算過關')],
                  [('; no life lost, no save, no points, just a score', '; no life lost, no save, just a score'), (', with no lives lost and no points paid', ', with no lives lost'), ('before the door opens', 'before the level ends')])
        view = view.replace(p, nz)
    elif '已入帳的點數' in p:
        nz = edit(p, [('，已入帳的點數會保留', ''), ('；點數與其他遊戲共用，沒有現金價值', '')],
                  [('; points already credited are kept', ''), ('; points are shared with the other games and have no cash value', '')])
        view = view.replace(p, nz)
view = view.replace('玩法與點數', '玩法')
extra['玩法'] = 'How to play'

# ---- dictionary: keep only entries used by this game ----
src = game + view + ''.join(extra)
keep = {k: v for k, v in dic.items() if k in src}
keep.update(extra)
keep.update({'English': 'English', '繁體中文': '繁體中文'})
dictionary = json.dumps(keep, ensure_ascii=False)

css = read('css/base.css') + read('css/arcade.css') + read('css/i18n.css')
i18n = read('js/i18n.js')

shim = r"""
(function(){
  var $=function(id){return document.getElementById(id)};
  window.$=$;
  window.S={balance:0};window.ENTRY_FEE=0;window.LOW_MSG='';
  window.save=function(){};window.renderAll=function(){};
  window.setText=function(id,t){var e=$(id);if(e)e.textContent=t};
  window.fmt=function(n){return String(n)};
  window.AN={start:function(){return {}},progress:function(){},end:function(){}};
  try{localStorage.setItem('deep-sea-language-v1','en')}catch(e){}
})();
"""

page = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Don't Peek</title>
<style>{css}
body{{background:#050805;min-height:100vh}}
html[lang="en"] .t-zh{{display:none}}
.itch-wrap{{max-width:1180px;margin:0 auto;padding:10px 12px 24px}}
.itch-top{{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}}
.itch-top h1{{margin:0;font-size:20px;font-family:var(--font-display);letter-spacing:.04em;color:#e8c675}}
.itch-lang{{display:flex;gap:6px}}
.itch-lang{{flex:none}}.itch-lang button{{flex:none;width:auto;min-height:0;white-space:nowrap;border:1px solid var(--line);background:var(--panel);color:var(--fg);border-radius:8px;padding:4px 10px;font:inherit;cursor:pointer}}
.itch-lang button[aria-pressed="true"]{{background:var(--glow);color:var(--glow-ink)}}
</style>
</head>
<body>
<div class="itch-wrap">
<div class="itch-top"><h1 data-i18n-ignore>Don't Peek</h1></div>
{view}
</div>
<script type="application/json" id="arcade-english">{dictionary}</script>
<script>{shim}</script>
<script>{i18n}</script>
<script>{game}</script>
</body>
</html>
""".format(css=css, view=view, dictionary=dictionary.replace('</', '<\\/'), shim=shim, i18n=i18n, game=game)

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(os.path.join(OUT, 'assets'))
with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(page)
used = set(re.findall(r"assets/([a-z0-9-]+\.webp)", game)) | set(
    k + '.webp' for k in re.findall(r"'((?:bg|env|ghost|guide|item|npc|prop|spot|ui|fx)-[a-z-]+)'", game))
src_dir = os.path.join(ROOT, 'games', 'peek', 'assets')
n = 0
for name in sorted(os.listdir(src_dir)):
    if name.endswith('.webp'):
        shutil.copy(os.path.join(src_dir, name), os.path.join(OUT, 'assets', name)); n += 1
zip_path = os.path.join(ROOT, 'dist', 'dont-peek-html5.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for dp, _, files in os.walk(OUT):
        for fn in files:
            full = os.path.join(dp, fn)
            z.write(full, os.path.relpath(full, OUT))
print('built', OUT, '| index.html', os.path.getsize(os.path.join(OUT, 'index.html')), 'bytes |', n, 'assets | zip', os.path.getsize(zip_path), 'bytes')
