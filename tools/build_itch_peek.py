#!/usr/bin/env python3
"""Build a standalone HTML5 package of 別看 / Don't Peek for itch.io.

Output: dist/itch-peek/ (index.html + assets/) and dist/dont-peek-html5.zip.
The game runs without the arcade platform: no wallet, no points, no analytics.
"""
import json, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CG = '--crazygames' in sys.argv
OUT = os.path.join(ROOT, 'dist', 'crazygames-peek' if CG else 'itch-peek')


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

CGJS = r"""
  var sdk=null,want=false;
  window.__gp=function(on){want=on;try{if(!sdk)return;if(on)sdk.game.gameplayStart();else sdk.game.gameplayStop()}catch(e){}};
  document.addEventListener('visibilitychange',function(){try{if(!sdk)return;if(document.hidden)sdk.game.gameplayStop();else if(want)sdk.game.gameplayStart()}catch(e){}});
  (function(){var t=setInterval(function(){if(window.CrazyGames&&window.CrazyGames.SDK){clearInterval(t);var S2=window.CrazyGames.SDK;Promise.resolve(S2.init()).then(function(){sdk=S2;if(want)sdk.game.gameplayStart()}).catch(function(){})}},100);setTimeout(function(){clearInterval(t)},10000)})();
"""
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
  __CGSHIM__
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
.itch-wrap{{max-width:840px;margin:0 auto;padding:8px 8px 16px}}
.itch-top{{display:none}}
#view-peek .console{{display:block!important}}
#view-peek .sneak-stage{{width:100%;max-width:none;background:#050805!important;border:0!important;border-radius:10px;overflow:hidden}}
#view-peek .console{{background:none!important;border:0!important;padding:0!important}}
#view-peek .side{{width:100%;margin-top:10px}}
#view-peek .side .panel{{display:flex!important;flex-direction:row!important;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;background:none;border:0;box-shadow:none;padding:0}}
#view-peek .stats,#view-peek .hint,#view-peek .rules,#peek-go,#peek-dex,#peek-share,#peek-gyro,#peek-full,#view-peek .field:has(#peek-level){{display:none!important}}
#view-peek .side .go{{width:auto!important;min-width:150px;flex:none;margin:0;padding:10px 20px;min-height:0}}
#view-peek .msg{{display:none}}
#view-peek .field:has(#peek-assist){{flex:1 1 100%;display:flex!important;flex-direction:row!important;flex-wrap:wrap;justify-content:center;gap:6px 18px;font-size:12px;opacity:.75}}
#view-peek .field:has(#peek-assist) label{{display:inline-flex!important;width:auto!important;margin:0!important;gap:6px;align-items:center}}
#view-peek .field:has(#peek-assist) input[type=range]{{width:90px!important}}
#view-peek .field:has(#peek-assist) label{{flex-direction:row!important}}
@font-face{{font-family:Cinzel;font-weight:700;src:url(assets/fonts/cinzel-latin-700.woff2) format("woff2")}}
@font-face{{font-family:Cinzel;font-weight:800;src:url(assets/fonts/cinzel-latin-800.woff2) format("woff2")}}
@font-face{{font-family:Spectral;font-weight:600;src:url(assets/fonts/spectral-latin-600.woff2) format("woff2")}}
@font-face{{font-family:Spectral;font-weight:700;src:url(assets/fonts/spectral-latin-700.woff2) format("woff2")}}
@font-face{{font-family:Spectral;font-weight:800;src:url(assets/fonts/spectral-latin-800.woff2) format("woff2")}}
body,button,input{{font-family:Spectral,"Songti TC","Noto Serif TC",serif}}
body{{background:radial-gradient(ellipse at 50% 0,#1a120a 0,#080604 70%) fixed;color:#f1d9a6}}
#view-peek .sneak-stage{{border:3px solid #6b4a1f!important;box-shadow:0 0 0 2px #1a110a,0 12px 40px rgba(0,0,0,.7);border-radius:6px}}
#view-peek .side .go{{font-family:Spectral,serif;font-weight:800;font-size:18px;letter-spacing:.08em;text-transform:uppercase;color:#f6dfa8;background:linear-gradient(#4a3320,#2a1b0f)!important;border:2px solid #b8893a!important;border-radius:6px;box-shadow:inset 0 1px 0 rgba(255,225,160,.25),0 3px 8px rgba(0,0,0,.6);text-shadow:0 1px 0 #120a05;cursor:pointer}}
#view-peek .side .go:hover{{background:linear-gradient(#5d4228,#35230f)!important;border-color:#e8c675!important}}
#view-peek .side .go:active{{transform:translateY(1px)}}
#view-peek .field:has(#peek-assist) label{{color:#d9bf88}}
#view-peek .field:has(#peek-assist){{font-size:15px;font-weight:500;opacity:.9;color:#d9bf88}}
#view-peek input[type=checkbox]{{accent-color:#b8893a;width:16px;height:16px}}
#view-peek input[type=range]{{accent-color:#b8893a}}
</style>
</head>
<body>
<div class="itch-wrap">
<div class="itch-top"><h1 data-i18n-ignore>Don't Peek</h1></div>
{view}
</div>
{sdk}
<script type="application/json" id="arcade-english">{dictionary}</script>
<script>{shim}</script>
<script>{i18n}</script>
<script>{game}</script>
</body>
</html>
""".format(css=css, view=view, dictionary=dictionary.replace('</', '<\\/'), shim=shim.replace('__CGSHIM__', CGJS if CG else ''), sdk=('<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>' if CG else ''), i18n=i18n, game=game)

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(os.path.join(OUT, 'assets'))
with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(page)
used = set(re.findall(r"assets/([a-z0-9-]+\.webp)", game)) | set(
    k + '.webp' for k in re.findall(r"'((?:bg|env|ghost|guide|item|npc|prop|spot|ui|fx)-[a-z-]+)'", game))
src_dir = os.path.join(ROOT, 'games', 'peek', 'assets')
shutil.copytree(os.path.join(src_dir, 'fonts'), os.path.join(OUT, 'assets', 'fonts'))
n = 0
for name in sorted(os.listdir(src_dir)):
    if name.endswith('.webp'):
        shutil.copy(os.path.join(src_dir, name), os.path.join(OUT, 'assets', name)); n += 1
zip_path = os.path.join(ROOT, 'dist', 'dont-peek-crazygames.zip' if CG else 'dont-peek-html5.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for dp, _, files in os.walk(OUT):
        for fn in files:
            full = os.path.join(dp, fn)
            z.write(full, os.path.relpath(full, OUT))
print('built', OUT, '| index.html', os.path.getsize(os.path.join(OUT, 'index.html')), 'bytes |', n, 'assets | zip', os.path.getsize(zip_path), 'bytes')
