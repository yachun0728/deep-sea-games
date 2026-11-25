#!/usr/bin/env python3
"""Build the standalone Frontier Islands Y8 upload; leaves arcade sources untouched."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile
import i18n_data

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/publishing/y8/frontier-islands/build'

def expand(name):
    p = ROOT / name
    text = p.read_text()
    def replace(m):
        kind, key = m.groups()
        if kind == 'include': return expand(key)
        value = i18n_data.zh_ids(ROOT)[key]
        return i18n_data.js_escape(value, text[m.start()-1]) if p.suffix in ('.js','.cjs') else value
    return re.sub(r'\{\{(include|t):([^{}]+)\}\}', replace, text)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    view = expand('games/frontier/view.html').replace('id="view-frontier" hidden','id="view-frontier"')
    view = re.sub(r'<details class="rules"><summary>[^<]*</summary><p>[^<]*</p><a href="games/frontier/art/direction-board.png".*?</details>', '', view, flags=re.S)
    # Original-site ranking is a platform service, not part of this local expedition build.
    code = expand('games/frontier/game.js')
    first = code.index('    var ranking=null,rankStarting=')
    end = code.index('    var noticeTimer=0;',first)
    code = code[:first]+'''    var ranking=null,rankStarting=false,rankSending=false,rankPending=null;
    function recordRank(){}
'''+code[end:]
    code = code.replace("var preview=frontierWorld(1);loadFrontier();update();requestAnimationFrame(frame);", """
    window.frontierY8Game={
      pause:function(){pause();ftSfx.suspend(true);},
      restoreAudio:function(){ftSfx.suspend(document.hidden||!document.hasFocus());},
      resume:function(){ftSfx.suspend(document.hidden||!document.hasFocus());if(!document.hidden&&document.hasFocus()&&world&&world.phase==='play'&&paused)start();},
      isPlaying:function(){return !!world&&!paused&&world.phase==='play';}
    };
    document.addEventListener('visibilitychange',function(){ftSfx.suspend(document.hidden||!document.hasFocus());});
    window.addEventListener('blur',function(){ftSfx.suspend(true);});
    window.addEventListener('focus',function(){ftSfx.suspend(false);});
    var preview=frontierWorld(1);loadFrontier();update();frontierRoute(true);requestAnimationFrame(frame);
""")
    code = code.replace('return {play:play,scan:scan,reset:reset,toggle:toggle,init:init,isMuted:', 'return {suspend:function(value){if(master)master.gain.value=value?0:(muted?0:.5);},play:play,scan:scan,reset:reset,toggle:toggle,init:init,isMuted:')
    css = (ROOT/'games/frontier/style.css').read_text()
    base = '''*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#0e2529;color:#e9eddc;font:14px system-ui,sans-serif}body{padding:12px}button,select{font:inherit}button{touch-action:manipulation}[hidden]{display:none!important}.languages{display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px}.languages button{color:#efce8b;background:#183d3b;border:1px solid #ffffff30;padding:6px 10px;border-radius:6px}.ft-rank-controls{display:none!important}.rules{padding:12px;line-height:1.7}#view-frontier{display:block;max-width:1600px;margin:auto}@media(max-width:600px){body{padding:0}.languages{padding:4px;margin:0}}'''
    dictionary = json.dumps(i18n_data.dictionary(ROOT),ensure_ascii=False).replace('<','\\u003c')
    hans = (ROOT/'locales/zh-Hans.json').read_text().replace('<','\\u003c')
    i18n = (ROOT/'js/i18n.js').read_text()
    # English is the default for this export, while preserving saved language selection.
    i18n = i18n.replace("var language = 'zh-Hant'", "var language = 'en'")
    bridge = (ROOT/'tools/y8_frontier_sdk.js').read_text()
    html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Frontier Islands</title><style>'''+base+css+'''</style><script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script></head><body><nav class="languages" aria-label="Language"><button data-language="en">English</button><button data-language="zh-Hant">繁體中文</button><button data-language="zh-Hans">简体中文</button></nav>'''+view+'''<script id="arcade-english" type="application/json">'''+dictionary+'''</script><script id="arcade-hans" type="application/json">'''+hans+'''</script><script>'''+i18n+'''</script><script>var $=function(id){return document.getElementById(id);};var AN={start:function(){return {};},end:function(){},progress:function(){},resume:function(){},interact:function(){}};'''+code+'''</script><script>'''+bridge+'''</script></body></html>'''
    assert '{{' not in html
    assert 'frontend/services/api.mjs' not in html
    assert 'ART_DIRECTION.md' not in html
    (OUT/'index.html').write_text(html)
    for name in ('sprites.png','enemies.png','warrior.png'):
        dest=OUT/'games/frontier/art'/name
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(ROOT/'games/frontier/art'/name,dest)
    archive=OUT.parent/'frontier-islands-y8.zip'
    files=[OUT/'index.html',*(OUT/'games/frontier/art'/n for n in ('sprites.png','enemies.png','warrior.png'))]
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:z.write(p,p.relative_to(OUT))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None and 'index.html' in z.namelist()
    print(archive)
    print(f'{archive.stat().st_size:,} bytes; {len(files)} files; sha256 {hashlib.sha256(archive.read_bytes()).hexdigest()}')

if __name__=='__main__':main()
