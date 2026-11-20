#!/usr/bin/env python3
"""Prototype (骨架) workflow: scaffold preview/<id>/ and regenerate preview/index.html.

Prototypes are standalone pages. They are pushed to the repo and served at
/preview/<id>/, but never enter games/catalog.json, the lobby or index.html.

  python3 tools/prototype.py new <id> "<中文名稱>" ["<一句話概念>"]
  python3 tools/prototype.py index      # rebuild preview/index.html from preview/prototypes.json
  python3 tools/prototype.py --check    # index is current, pages are noindex, none leaks into the lobby
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ID_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
STATUSES = ('prototype', 'playtest', 'graduated', 'dropped')
STATUS_LABEL = {'prototype': '骨架', 'playtest': '試玩中', 'graduated': '已上架', 'dropped': '已放棄'}

PAGE = '''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>__NAME__（骨架）</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:#0b1d2a;color:#e8f4f8;overflow:hidden;overscroll-behavior:none;touch-action:none;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif}
#app{position:relative;max-width:480px;height:100%;margin:0 auto;background:#10303f}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block}
#tag{position:absolute;top:calc(8px + env(safe-area-inset-top));left:8px;z-index:5;font-size:11px;padding:3px 8px;
  border-radius:99px;background:#f7e33b;color:#1d1b1a;font-weight:800;letter-spacing:1px}
#hud{position:absolute;top:calc(8px + env(safe-area-inset-top));right:10px;z-index:5;font-size:18px;font-weight:800}
.screen{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;padding:24px;text-align:center;background:rgba(11,29,42,.9)}
.screen.hide{display:none}
.screen h1{font-size:28px}
.screen p{font-size:15px;line-height:1.6;opacity:.85}
button{font:inherit;font-weight:800;font-size:18px;padding:12px 32px;border:0;border-radius:12px;background:#f7e33b;color:#1d1b1a}
</style>
</head>
<body>
<div id="app">
  <div id="tag">PROTOTYPE · 未上架</div>
  <div id="hud">0</div>
  <canvas id="cv"></canvas>
  <div id="start" class="screen">
    <h1>__NAME__</h1>
    <p>__CONCEPT__</p>
    <button id="go" type="button">開始</button>
  </div>
  <div id="end" class="screen hide">
    <h1>本局結束</h1>
    <p id="result"></p>
    <button id="again" type="button">再玩一次</button>
  </div>
</div>
<script>
/* 骨架：核心循環只放「一個操作、一個目標、一個失敗條件」。
   不讀寫平台點數、不送 GA4、不存 localStorage；上架時才依 games/ 流程接入。 */
(function(){
  var cv=document.getElementById('cv'),ctx=cv.getContext('2d');
  var hud=document.getElementById('hud');
  var W=0,H=0,dpr=1,running=false,score=0,last=0,t=0;

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth;H=cv.clientHeight;
    cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize);resize();

  function reset(){score=0;t=0;hud.textContent='0';}
  function update(dt){ /* TODO 核心規則：更新狀態；失敗時呼叫 finish() */
    t+=dt;score=Math.floor(t);hud.textContent=String(score);
    if(t>=10)finish();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#e8f4f8';ctx.font='16px sans-serif';ctx.textAlign='center';
    ctx.fillText('核心玩法畫在這裡',W/2,H/2);
  }
  function onPress(e){ if(!running)return; e.preventDefault(); /* TODO 輸入 */ }
  cv.addEventListener('pointerdown',onPress);

  function loop(now){
    if(!running)return;
    var dt=Math.min((now-last)/1000,.05);last=now;
    update(dt);draw();
    if(running)requestAnimationFrame(loop);
  }
  function start(){
    reset();running=true;last=performance.now();
    document.getElementById('start').classList.add('hide');
    document.getElementById('end').classList.add('hide');
    requestAnimationFrame(loop);
  }
  function finish(){
    running=false;
    document.getElementById('result').textContent='分數 '+score;
    document.getElementById('end').classList.remove('hide');
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden&&running)finish();});
  document.getElementById('go').addEventListener('click',start);
  document.getElementById('again').addEventListener('click',start);
  draw();
})();
</script>
</body>
</html>
'''

INDEX = '''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Deep Sea Arcade 預覽區</title>
<style>
body{margin:0;padding:24px 16px;background:#0b1d2a;color:#e8f4f8;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif}
main{max-width:560px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px}
.note{font-size:13px;opacity:.7;margin:0 0 20px;line-height:1.6}
ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
a{display:block;padding:14px 16px;border-radius:12px;background:#10303f;color:inherit;text-decoration:none}
a b{font-size:17px}
a small{display:block;margin-top:4px;opacity:.75;font-size:13px}
.tag{float:right;font-size:11px;padding:2px 8px;border-radius:99px;background:#f7e33b;color:#1d1b1a;font-weight:800}
.graduated .tag{background:#7fd6a8}.dropped{opacity:.5}.dropped .tag{background:#999}
</style>
</head>
<body>
<main>
<h1>預覽區</h1>
<p class="note">未上架的遊戲骨架，僅供內部試玩。不在大廳、不計點數、不送 GA4、不被搜尋引擎收錄。</p>
<ul>
__ITEMS__
</ul>
</main>
</body>
</html>
'''


def manifest_path(root):
    return root / 'preview/prototypes.json'


def load_manifest(root=ROOT):
    path = manifest_path(root)
    return json.loads(path.read_text(encoding='utf-8')) if path.is_file() else []


def render_index(items):
    rows = []
    for item in items:
        status = item['status']
        rows.append(
            f'<li class="{status}"><a href="{html.escape(item["id"])}/">'
            f'<span class="tag">{STATUS_LABEL[status]}</span>'
            f'<b>{html.escape(item["name"])}</b>'
            f'<small>{html.escape(item.get("concept", ""))}</small></a></li>')
    if not rows:
        rows = ['<li><a href="#"><b>目前沒有骨架</b><small>執行 python3 tools/prototype.py new &lt;id&gt; "名稱"</small></a></li>']
    return INDEX.replace('__ITEMS__', '\n'.join(rows))


def write_index(root=ROOT):
    out = root / 'preview/index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render_index(load_manifest(root)), encoding='utf-8')


def new(pid, name, concept, root=ROOT):
    if not ID_RE.match(pid):
        raise SystemExit('id 只能是小寫英數與連字號')
    catalog = json.loads((root / 'games/catalog.json').read_text(encoding='utf-8'))
    if pid in {g['id'] for g in catalog}:
        raise SystemExit(f'{pid} 已在 games/catalog.json，不能當骨架 id')
    items = load_manifest(root)
    if any(i['id'] == pid for i in items):
        raise SystemExit(f'{pid} 已有骨架')
    folder = root / 'preview' / pid
    if folder.exists():
        raise SystemExit(f'{folder} 已存在')
    folder.mkdir(parents=True)
    page = PAGE.replace('__NAME__', html.escape(name)).replace('__CONCEPT__', html.escape(concept or '一句話寫下遊戲概念'))
    (folder / 'index.html').write_text(page, encoding='utf-8')
    items.append({'id': pid, 'name': name, 'concept': concept or '', 'status': 'prototype'})
    manifest_path(root).write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_index(root)
    print(f'已建立 preview/{pid}/index.html；預覽網址 /preview/{pid}/')


def check(root=ROOT):
    errors = []
    items = load_manifest(root)
    ids = [i['id'] for i in items]
    if len(ids) != len(set(ids)):
        errors.append('prototypes.json 有重複 id')
    catalog_ids = {g['id'] for g in json.loads((root / 'games/catalog.json').read_text(encoding='utf-8'))}
    lobby = ''
    for name in ('templates/lobby.html', 'templates/index.html', 'index.html'):
        f = root / name
        lobby += f.read_text(encoding='utf-8') if f.is_file() else ''
    for item in items:
        pid = item['id']
        if item.get('status') not in STATUSES:
            errors.append(f'{pid}: status 必須是 {STATUSES}')
        if not ID_RE.match(pid):
            errors.append(f'{pid}: id 格式錯誤')
        page = root / 'preview' / pid / 'index.html'
        if item.get('status') != 'dropped' and not page.is_file():
            errors.append(f'{pid}: 缺少 preview/{pid}/index.html')
        elif page.is_file() and 'name="robots" content="noindex' not in page.read_text(encoding='utf-8'):
            errors.append(f'{pid}: 缺少 noindex meta')
        if item.get('status') != 'graduated':
            if pid in catalog_ids:
                errors.append(f'{pid}: 尚未上架卻已在 games/catalog.json')
            if f'href="#{pid}"' in lobby or f'preview/{pid}' in lobby:
                errors.append(f'{pid}: 尚未上架卻出現在大廳或 index.html')
    index = root / 'preview/index.html'
    if not index.is_file() or index.read_text(encoding='utf-8') != render_index(items):
        errors.append('preview/index.html 過期，請執行 python3 tools/prototype.py index')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true')
    sub = parser.add_subparsers(dest='cmd')
    n = sub.add_parser('new')
    n.add_argument('id')
    n.add_argument('name')
    n.add_argument('concept', nargs='?', default='')
    sub.add_parser('index')
    args = parser.parse_args()
    if args.check:
        errors = check()
        for e in errors:
            print('ERROR:', e)
        print('OK: preview 骨架檢查通過。' if not errors else '')
        sys.exit(1 if errors else 0)
    if args.cmd == 'new':
        new(args.id, args.name, args.concept)
    elif args.cmd == 'index':
        write_index()
        print('已更新 preview/index.html')
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
